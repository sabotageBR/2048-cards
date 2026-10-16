// Cena: canvas de tela cheia com o cenario do mundo (camada parada em cache),
// a mesa com a linha do tempo, particulas (as explosoes de cada mundo saem de
// efeitos.js e do tema), mao de ajuda, a festa da subida de nivel por cima
// do jogo, entrada de mundo e a transicao de fim de mundo. Nao conhece a
// Poki nem o DOM alem do canvas.
// Um relogio so: o `agora` do main.js (ms) move a linha e os efeitos.
import { calcularLayout } from './layout.js';
import { desenharMesa, desenharMao, desenharGuia, faseGuia, CICLO_GUIA } from './mesa.js';
import { criarLinha } from './linha.js';
import { criarParticulas } from './particulas.js';
import { temaDe } from './temas/index.js';
import { definirRotulos } from './temas/kit.js';
import { limparCache, definirTema } from './cartas.js';
import { rgba } from './desenho.js';
import { tocarEfeito, registrarFormas } from './efeitos.js';
import { Transicoes as Tr } from './transicoes.js';

/** Tela clara quando o 2048 sai da mesa (ms). */
const CLARAO_MS = 420;

/** @param {HTMLCanvasElement} canvas */
export function criarCena(canvas) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const linha = criarLinha();
  const part = criarParticulas();
  let W = 1, H = 1, dpr = 1, topo = 0, base = 0;
  let L = null;
  let regras = { colunas: 4, pilhaMax: 6, tamFila: 3 };
  /** Tema do mundo (temas/index.js): cenario, paleta, cartas e mesa. */
  let tema = temaDe(1);
  let reino = 1;
  /** @type {HTMLCanvasElement|null} */ let fundo = null;
  let tVis = 0, clarao = -1e9;
  /**
   * Opcoes de visual: ?visual=descarte (o descarte junto da fila, em teste);
   * no desktop, o braço do teste A/B: teclas 'guia' (C: a seta do mouse e as
   * teclas 1..N e o espaco com o gesto guiado) ou 'fixas' (D: sempre na
   * mesa); ?guia=0..1 congela a fase do gesto (prints).
   */
  let vis = { descarteFila: false, teclas: '', guiaU: -1 };
  let txt = { naMao: 'in hand', descartar: 'discard', semCarga: 'empty', livre: 'Free!', combo: 'COMBO ×{n}' };

  const layout = () => calcularLayout({ W, H, topo, base, colunas: regras.colunas, pilhaMax: regras.pilhaMax, tamFila: regras.tamFila, descarteFila: vis.descarteFila });

  function redimensionar(w, h, d, t, b) {
    W = w; H = h; dpr = d; topo = t; base = b || 0;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    L = layout();
    fundo = null;
    limparCache();
  }

  function definirRegras(r) {
    const mudou = !L || r.colunas !== regras.colunas || r.pilhaMax !== regras.pilhaMax || r.tamFila !== regras.tamFila;
    regras = { colunas: r.colunas, pilhaMax: r.pilhaMax, tamFila: r.tamFila };
    L = layout();
    if (mudou) fundo = null; // o horizonte acompanha a mesa
    linha.limpar();
    part.limpar();
  }

  /** Tema do mundo n: as cartas passam a ser as dele. */
  function escolherTema(n) {
    const t = temaDe(n);
    definirTema(t);
    registrarFormas(part, t);
    limparCache();
    return t;
  }

  /** Cenario do mundo (1..5). */
  function definirReino(n) {
    if (n === reino) return;
    reino = n;
    tema = escolherTema(n);
    fundo = null;
  }

  /** Opcoes de visual em teste (prints para o usuario escolher). */
  function definirVisual(v) {
    vis = { ...vis, ...v };
    tema = escolherTema(reino);
    L = layout(); fundo = null; limparCache();
  }

  /** Textos do idioma desenhados no canvas. */
  function definirTextos(T) {
    txt = { naMao: T.naMao, descartar: T.descartarRotulo, semCarga: T.semCarga, livre: T.livre, combo: T.combo };
    definirRotulos({ bomba: T.bomba });
    limparCache();
  }

  function prepararFundo() {
    const f = document.createElement('canvas');
    f.width = canvas.width; f.height = canvas.height;
    f.addEventListener('contextrestored', () => { if (fundo === f) fundo = null; });
    const g = /** @type {CanvasRenderingContext2D} */ (f.getContext('2d'));
    g.scale(dpr, dpr);
    tema.parado(g, W, H, L);
    fundo = f;
  }

  // o navegador pode descartar o contexto do canvas (Android com pouca memoria)
  // e devolve-lo em branco: as caches offscreen (fundo e cartas) sao refeitas
  canvas.addEventListener('contextrestored', () => { fundo = null; limparCache(); });

  /** Depois de um erro no meio do desenho: o contexto volta ao estado inicial (pilha de save, clip). */
  function recuperar() {
    canvas.width = canvas.width;
  }

  /**
   * Teclas do desktop (opcao em teste): com o gesto guiado na tela (ou sempre,
   * nas fixas); a do alvo afunda quando a carta cai na coluna (no descarte,
   * quando o cursor clica).
   */
  function teclasDe(mao, tGuia) {
    if (!vis.teclas || (!mao && vis.teclas !== 'fixas')) return null;
    const u = faseGuia(tGuia);
    const [de, ate] = mao && mao.de ? [0.66, 0.86] : [0.4, 0.6];
    const aperta = mao ? Math.max(0, Math.min(1, (u - de) / 0.04, (ate - u) / 0.04)) : 0;
    return { alpha: vis.teclas === 'fixas' ? 0.5 : 0.75, alvo: mao ? (mao.de ? mao.c : 'desc') : -1, aperta };
  }

  /** Agenda as animacoes de uma jogada. */
  function tocar(eventos, agora, info) {
    linha.montar(eventos, L, agora, info);
  }

  /** Escala dos efeitos pela largura da carta. */
  const escala = () => Math.max(0.6, Math.min(1.4, L.cw / 62));

  function efeito(e, agora) {
    if (e.tipo === 'completar') clarao = agora;
    tocarEfeito(e, { part, tema, esc: escala(), ch: L.ch, textos: txt });
  }

  /** A festa da subida de nivel (e do 2048 do mundo): a explosao grande do mundo em (x, y). */
  function festejar(x, y, valor) {
    tocarEfeito({ tipo: 'festa', x, y, valor }, { part, tema, esc: escala(), ch: L.ch, textos: txt });
  }

  /**
   * @param {number} dt s
   * @param {number} agora ms
   * @returns {any[]} efeitos que aconteceram neste passo (para o som)
   */
  function atualizar(dt, agora) {
    tVis += dt;
    part.atualizar(dt);
    const prontos = linha.drenarEfeitos(agora);
    for (const e of prontos) efeito(e, agora);
    linha.podar(agora - 50);
    return prontos;
  }

  /** Por cima de tudo: clarao do 2048 e vinheta vermelha da febre. */
  function frente(agora, febre) {
    const u = (agora - clarao) / CLARAO_MS;
    if (u >= 0 && u < 1) { ctx.fillStyle = rgba(tema.paleta.clarao || '#fffae1', 0.75 * (1 - u) * (1 - u)); ctx.fillRect(0, 0, W, H); }
    if (febre) {
      const k = 0.5 + 0.5 * Math.sin(agora / 125);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, `rgba(255,40,60,${0.25 + 0.2 * k})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  /**
   * @param {{ estado: any, agora: number, trans?: any, festa?: any, tEntrada?: number, arrasto?: any, destaque?: number, legal?: boolean, mao?: any, febre?: number, info?: any, semFila?: boolean, alvo?: string, perigo?: any }} q
   */
  function desenhar(q) {
    // janela sem largura ou altura (o iPad passa por 0x0): drawImage de um canvas 0x0 lanca InvalidStateError
    if (!L || canvas.width < 1 || canvas.height < 1) return;
    if (!fundo) prepararFundo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(fundo, 0, 0, W, H);
    tema.vivo(ctx, W, H, tVis, L);
    const pal = tema.paleta;
    const t = q.agora / 1000;
    // entrada de mundo e soco de camera do fim do mundo
    let zoom = 1, branco = 0;
    if (q.tEntrada !== undefined && q.tEntrada > -1e8) {
      const en = Tr.entrada((q.agora - q.tEntrada) / 1000);
      zoom = en.zoom; branco = en.branco;
    }
    // a transicao pode comecar no futuro (espera a cascata): antes disso nao existe
    const trans = q.trans && q.agora >= q.trans.t0 ? q.trans : null;
    if (trans) zoom *= Tr.camera(trans.tipo, (q.agora - trans.t0) / 1000).zoom;
    ctx.save();
    if (zoom !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); }
    const tGuia = vis.guiaU >= 0 ? vis.guiaU * CICLO_GUIA : tVis;
    if (q.estado) {
      desenharMesa(ctx, q.estado, L, { pal, mesa: tema.mesa, agora: q.agora, t, dpr, linha, arrasto: q.arrasto, destaque: q.destaque, legal: q.legal, febre: q.febre || 0, semFila: q.semFila, alvo: q.alvo || '', textos: txt, teclas: teclasDe(q.mao, tGuia), perigo: q.perigo || null });
    }
    part.desenhar(ctx);
    const comCursor = { cursor: !!vis.teclas, esc: Math.max(1, Math.min(1.7, L.cw / 70)) };
    if (q.mao && q.mao.de) desenharGuia(ctx, q.mao, tGuia, dpr, comCursor);
    else if (q.mao) desenharMao(ctx, q.mao.x, q.mao.y, tGuia, '#fff', comCursor);
    ctx.restore();
    // a festa da subida de nivel: por cima da mesa, sem zoom e sem bloquear (pode comecar no futuro, depois da cascata)
    if (q.festa && q.agora >= q.festa.t0) {
      Tr.festa(ctx, (q.agora - q.festa.t0) / 1000, { W, H, texto: q.festa.texto, y: L.mesa.y + L.mesa.h * 0.3, cores: pal.festa, semente: q.festa.semente });
    }
    frente(q.agora, !!q.febre);
    if (branco > 0) { ctx.fillStyle = `rgba(255,255,255,${branco})`; ctx.fillRect(0, 0, W, H); }
    if (trans) {
      Tr.desenhar(ctx, trans.tipo, (q.agora - trans.t0) / 1000, { W, H, fx: trans.fx, fy: trans.fy, texto: q.info && q.info.texto, textoMundo: q.info && q.info.textoMundo, corMundo: trans.corMundo, cores: pal.festa, semente: trans.semente });
    }
  }

  return {
    redimensionar, definirRegras, definirReino, definirVisual, definirTextos, tocar, atualizar, desenhar, recuperar, festejar, part, linha,
    get L() { return L; }, get pal() { return tema.paleta; }, get reino() { return reino; },
    get W() { return W; }, get H() { return H; },
  };
}
