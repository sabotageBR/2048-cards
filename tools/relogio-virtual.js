/**
 * Relogio virtual: script injetado na pagina (Page.addScriptToEvaluateOnNewDocument)
 * antes de qualquer script dela, para gravar video deterministico.
 *
 * Troca Date, performance.now, setTimeout/setInterval, requestAnimationFrame e
 * requestIdleCallback por versoes que so andam quando a ferramenta manda:
 * `window.__relogio.quadro()` avanca 1000/fps ms (mais um centesimo de
 * microssegundo, ver QUADRO_MS), roda os temporizadores vencidos na ordem, depois
 * os rAF pendentes com o tempo novo, depois os callbacks de ocioso. Assim o jogo
 * da exatamente um passo de 1/60 s por quadro capturado, por mais lento que o
 * SwiftShader seja.
 *
 * Copia de relojoeiro/tools/relogio-virtual.js. Base: paginaRelogio de hexadrop/tools/thumbnail.mjs, com
 * requestIdleCallback, Date chamavel sem new e os originais guardados em
 * `__relogio.real` (a camada CDP usa o setTimeout real para os prazos dela).
 *
 * `event.timeStamp` tambem segue o relogio: o getter de Event.prototype devolve
 * o instante virtual da primeira leitura (src/core/entrada.js usa
 * `t = e.timeStamp` e compara com o laco, que anda por performance.now()).
 *
 * O que NAO segue o relogio: animacoes e transicoes CSS, Web Animations,
 * temporizadores de Workers e o carregamento de rede. Animacao de UI que precisa
 * sair no video anda pelo relogio do jogo.
 *
 * Quantos quadros andam antes do primeiro passo depende do tempo real de carga
 * (a camada CDP avanca um quadro a cada consulta ao `pronto`). O gravar registra
 * `__relogio.quadros()` e `agora()` no inicio (relogioInicio no JSON) para que
 * diferencas entre gravacoes fiquem explicaveis.
 *
 * Uso na ferramenta:
 *   import { fonteRelogio } from './relogio-virtual.js';
 *   await aba.injetar(fonteRelogio({ fps: 60 }));
 *
 * `instalarRelogio` precisa ser autocontida (vai para a pagina por toString).
 */

/**
 * @typedef {{ fps?: number, epoca?: number }} ConfigRelogio
 * @typedef {{ quadro(n?: number): number, avancar(ms: number): number, agora(): number, quadros(): number,
 *   pendentes(): {timers:number, rafs:number, ociosos:number}, fps: number, real: Record<string, *> }} Relogio
 */

/** 2026-09-27 10:10 UTC: o horario de vitrine dos relogios. */
export const EPOCA_PADRAO = Date.UTC(2026, 8, 27, 10, 10, 0);

/**
 * Instala o relogio virtual em `w` (a window da pagina, ou um objeto falso nos
 * testes) e devolve o controle, tambem exposto em `w.__relogio`.
 * @param {*} w
 * @param {ConfigRelogio} [cfg]
 * @returns {Relogio}
 */
export function instalarRelogio(w, cfg) {
  if (w.__relogio) return w.__relogio;
  const fps = (cfg && cfg.fps) || 60;
  const epoca = cfg && typeof cfg.epoca === 'number' ? cfg.epoca : Date.UTC(2026, 8, 27, 10, 10, 0);
  const C = { t: 0, seq: 0, timers: new Map(), rafs: [], rafSeq: 0, ociosos: [], ocSeq: 0, quadros: 0 };
  const erros = [];

  const real = {
    Date: w.Date,
    agora: w.performance && w.performance.now ? w.performance.now.bind(w.performance) : () => Date.now(),
    setTimeout: w.setTimeout ? w.setTimeout.bind(w) : null,
    clearTimeout: w.clearTimeout ? w.clearTimeout.bind(w) : null,
    setInterval: w.setInterval ? w.setInterval.bind(w) : null,
    clearInterval: w.clearInterval ? w.clearInterval.bind(w) : null,
    requestAnimationFrame: w.requestAnimationFrame ? w.requestAnimationFrame.bind(w) : null,
    cancelAnimationFrame: w.cancelAnimationFrame ? w.cancelAnimationFrame.bind(w) : null,
  };

  /** Registra o erro de um callback sem interromper os outros. */
  const falhou = (e) => {
    erros.push(String((e && e.stack) || e));
    if (erros.length > 50) erros.shift();
  };

  // Date: sem argumentos, o instante virtual; com argumentos, o Date real.
  const DataReal = real.Date;
  function DataVirtual(...a) {
    if (!new.target) return new DataReal(epoca + C.t).toString();
    return a.length ? new DataReal(...a) : new DataReal(epoca + C.t);
  }
  DataVirtual.prototype = DataReal.prototype;
  DataVirtual.now = () => epoca + C.t;
  DataVirtual.UTC = DataReal.UTC;
  DataVirtual.parse = DataReal.parse;
  w.Date = DataVirtual;

  if (w.performance) {
    try {
      Object.defineProperty(w.performance, 'now', { value: () => C.t, configurable: true, writable: true });
    } catch { /* ignora */ }
  }

  // event.timeStamp no mesmo dominio de performance.now(). Memoriza a primeira
  // leitura: um evento guardado e lido quadros depois nao "envelhece".
  try {
    const EP = w.Event && w.Event.prototype;
    if (EP) {
      const marcas = new WeakMap();
      Object.defineProperty(EP, 'timeStamp', {
        configurable: true,
        enumerable: true,
        get() {
          if (!marcas.has(this)) marcas.set(this, C.t);
          return marcas.get(this);
        },
      });
    }
  } catch { /* ignora */ }

  const agenda = (fn, ms, args, repete) => {
    const id = ++C.seq;
    if (typeof fn !== 'function') return id;
    const d = Math.max(0, Number(ms) || 0);
    C.timers.set(id, { id, em: C.t + d, fn, args, repete: repete ? Math.max(1, d) : 0, ordem: id });
    return id;
  };
  w.setTimeout = (fn, ms, ...a) => agenda(fn, ms, a, false);
  w.setInterval = (fn, ms, ...a) => agenda(fn, ms, a, true);
  w.clearTimeout = (id) => void C.timers.delete(id);
  w.clearInterval = (id) => void C.timers.delete(id);
  w.requestAnimationFrame = (cb) => {
    const id = ++C.rafSeq;
    C.rafs.push({ id, cb });
    return id;
  };
  w.cancelAnimationFrame = (id) => {
    C.rafs = C.rafs.filter((r) => r.id !== id);
  };
  w.requestIdleCallback = (cb, opcoes) => {
    const id = ++C.ocSeq;
    const prazo = opcoes && Number(opcoes.timeout) > 0 ? C.t + Number(opcoes.timeout) : Infinity;
    C.ociosos.push({ id, cb, prazo });
    return id;
  };
  w.cancelIdleCallback = (id) => {
    C.ociosos = C.ociosos.filter((o) => o.id !== id);
  };

  // Um centesimo de microssegundo a mais por quadro: com 1000/60 exato, o
  // arredondamento de (agora - antes) as vezes da um fio abaixo do passo fixo,
  // e o laco do jogo faria zero passos num quadro e dois no seguinte.
  const QUADRO_MS = 1000 / fps + 1e-5;

  /** Roda os temporizadores vencidos ate `alvo`, em ordem de vencimento. */
  function rodarTimers(alvo) {
    for (let guarda = 0; guarda < 100000; guarda++) {
      let prox = null;
      for (const tm of C.timers.values()) {
        if (tm.em > alvo) continue;
        if (!prox || tm.em < prox.em || (tm.em === prox.em && tm.ordem < prox.ordem)) prox = tm;
      }
      if (!prox) break;
      if (prox.em > C.t) C.t = prox.em;
      if (prox.repete) {
        prox.em += prox.repete;
        prox.ordem = ++C.seq;
      } else C.timers.delete(prox.id);
      try {
        prox.fn(...prox.args);
      } catch (e) {
        falhou(e);
      }
    }
    C.t = alvo;
  }

  /**
   * Ocioso deterministico: o tempo virtual nao anda durante o callback, entao
   * timeRemaining() cai 1 ms a cada consulta (16, 15, ... 0). Um laco
   * "while (timeRemaining() > 1)" termina sempre, e faz o mesmo trabalho em
   * toda gravacao.
   */
  function rodarOciosos() {
    const fila = C.ociosos;
    C.ociosos = [];
    for (const o of fila) {
      let resta = 16;
      const prazo = {
        didTimeout: C.t >= o.prazo,
        timeRemaining: () => {
          const r = resta;
          resta = Math.max(0, resta - 1);
          return r;
        },
      };
      try {
        o.cb(prazo);
      } catch (e) {
        falhou(e);
      }
    }
  }

  /**
   * Avanca `n` quadros: temporizadores, rAF (com o tempo novo) e ocioso.
   * @param {number} [n]
   * @returns {number} total de quadros ate aqui
   */
  function quadro(n = 1) {
    for (let k = 0; k < n; k++) {
      rodarTimers(C.t + QUADRO_MS);
      const fila = C.rafs;
      C.rafs = [];
      for (const r of fila) {
        try {
          r.cb(C.t);
        } catch (e) {
          falhou(e);
        }
      }
      rodarOciosos();
      C.quadros++;
    }
    return C.quadros;
  }

  /**
   * Avanca o tempo sem rodar rAF (so temporizadores): para esperas de logica.
   * @param {number} ms
   * @returns {number} tempo virtual depois do avanco
   */
  function avancar(ms) {
    rodarTimers(C.t + Math.max(0, Number(ms) || 0));
    return C.t;
  }

  const relogio = {
    quadro,
    avancar,
    agora: () => C.t,
    quadros: () => C.quadros,
    pendentes: () => ({ timers: C.timers.size, rafs: C.rafs.length, ociosos: C.ociosos.length }),
    erros: () => erros.slice(),
    fps,
    real,
  };
  w.__relogio = relogio;
  return relogio;
}

/**
 * Codigo-fonte pronto para Page.addScriptToEvaluateOnNewDocument.
 * @param {ConfigRelogio} [cfg]
 * @returns {string}
 */
export function fonteRelogio(cfg = {}) {
  const c = { fps: cfg.fps || 60, epoca: typeof cfg.epoca === 'number' ? cfg.epoca : EPOCA_PADRAO };
  return `(${instalarRelogio.toString()})(window, ${JSON.stringify(c)});`;
}
