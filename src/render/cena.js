// Cena: canvas de tela cheia com o cenario do mundo (camada parada em cache),
// a mesa com a linha do tempo, particulas, mao de ajuda, entrada de fase e
// transicoes. Nao conhece a Poki nem o DOM alem do canvas.
// Um relogio so: o `agora` do main.js (ms) move a linha e os efeitos.
import { calcularLayout } from './layout.js';
import { desenharMesa, desenharMao, desenharGuia } from './mesa.js';
import { criarLinha } from './linha.js';
import { criarParticulas } from './particulas.js';
import { temaDe } from './temas/index.js';
import { definirRotulos } from './temas/kit.js';
import { limparCache, definirTema } from './cartas.js';
import { TINTA } from './desenho.js';
import { Transicoes as Tr } from './transicoes.js';

const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';
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
  /** Opcao de visual em teste (?visual=descarte): o descarte junto da fila. */
  let vis = { descarteFila: false };
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
    fundo = document.createElement('canvas');
    fundo.width = canvas.width; fundo.height = canvas.height;
    const g = /** @type {CanvasRenderingContext2D} */ (fundo.getContext('2d'));
    g.scale(dpr, dpr);
    tema.parado(g, W, H, L);
  }

  /** Agenda as animacoes de uma jogada. */
  function tocar(eventos, agora, info) {
    linha.montar(eventos, L, agora, info);
  }

  function efeito(e, agora) {
    const esc = Math.max(0.6, Math.min(1.4, L.cw / 62));
    switch (e.tipo) {
      case 'pouso':
        part.estourar(e.x, e.y + L.ch * 0.3, ['#ffe27a', '#f6c453', '#fff3c2'], 9, 0.4 * esc, { g: 160, vida: 0.45, tam: 4 * esc, forma: 'c' });
        break;
      case 'fusao': {
        const cor = tema.cor(e.valor);
        part.estourar(e.x, e.y, [cor, '#ffe27a', '#ffffff'], 8 + e.degrau * 3, (0.7 + e.degrau * 0.12) * esc, { forma: 'estrela', tam: 8 * esc, g: 300 });
        part.anel(e.x, e.y, cor, (28 + e.degrau * 6) * esc);
        if (e.degrau > 1) part.texto(e.x, e.y - L.ch * 0.4, '×' + e.degrau, '#ffe27a', (22 + e.degrau * 2) * esc, TINTA);
        break;
      }
      case 'completar':
        part.estourar(e.x, e.y, ['#ffe27a', '#ffffff', '#12bfd2'], 30, 1.5 * esc, { forma: 'estrela', tam: 11 * esc });
        part.anel(e.x, e.y, '#ffe27a', 70 * esc);
        clarao = agora;
        break;
      case 'graduar':
        // a carta pequena sai da mesa: brilho para cima, na cor dela
        part.estourar(e.x, e.y, [tema.cor(e.valor), '#ffffff'], 8, 0.6 * esc, { forma: 'estrela', tam: 6 * esc, g: -120, vida: 0.6 });
        break;
      case 'explodir':
        part.estourar(e.x, e.y, ['#ff8a3d', '#ffd23f', '#ff3b3b'], 22, 1.3 * esc, { forma: 'estrela', tam: 9 * esc });
        part.subir(e.x, e.y, ['rgba(70,60,70,0.7)', 'rgba(120,110,120,0.6)'], 7, { tam: 16 * esc, vida: 0.8, larg: 30 * esc });
        part.anel(e.x, e.y, '#ffd23f', 50 * esc);
        break;
      case 'combo':
        if (e.n >= 2) part.texto(e.x, e.y - L.ch * 0.75, txt.combo.replace('{n}', String(e.n)), '#ff9f2f', (22 + Math.min(10, e.n * 2)) * esc, TINTA);
        break;
      default: break;
    }
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
    if (u >= 0 && u < 1) { ctx.fillStyle = `rgba(255,250,225,${0.75 * (1 - u) * (1 - u)})`; ctx.fillRect(0, 0, W, H); }
    if (febre) {
      const k = 0.5 + 0.5 * Math.sin(agora / 125);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, `rgba(255,40,60,${0.25 + 0.2 * k})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  /**
   * @param {{ estado: any, agora: number, trans?: any, tEntrada?: number, arrasto?: any, destaque?: number, legal?: boolean, mao?: any, febre?: number, info?: any, semFila?: boolean, alvo?: string }} q
   */
  function desenhar(q) {
    if (!L) return;
    if (!fundo) prepararFundo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(fundo, 0, 0, W, H);
    tema.vivo(ctx, W, H, tVis, L);
    const pal = tema.paleta;
    const t = q.agora / 1000;
    // entrada de fase e soco de camera da vitoria
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
    if (q.estado) {
      desenharMesa(ctx, q.estado, L, { pal, mesa: tema.mesa, agora: q.agora, t, dpr, linha, arrasto: q.arrasto, destaque: q.destaque, legal: q.legal, febre: q.febre || 0, semFila: q.semFila, alvo: q.alvo || '', textos: txt });
    }
    part.desenhar(ctx);
    if (q.mao && q.mao.de) desenharGuia(ctx, q.mao, tVis, dpr);
    else if (q.mao) desenharMao(ctx, q.mao.x, q.mao.y, tVis, '#fff');
    ctx.restore();
    frente(q.agora, !!q.febre);
    if (branco > 0) { ctx.fillStyle = `rgba(255,255,255,${branco})`; ctx.fillRect(0, 0, W, H); }
    if (trans) {
      Tr.desenhar(ctx, trans.tipo, (q.agora - trans.t0) / 1000, { W, H, fx: trans.fx, fy: trans.fy, texto: q.info && q.info.texto, textoMundo: q.info && q.info.textoMundo, pontos: [], corMundo: trans.corMundo, semente: trans.semente, trilha: trans.trilha });
    }
  }

  return {
    redimensionar, definirRegras, definirReino, definirVisual, definirTextos, tocar, atualizar, desenhar, part, linha,
    get L() { return L; }, get pal() { return tema.paleta; }, get reino() { return reino; },
    get W() { return W; }, get H() { return H; },
  };
}

export { FONTE };
