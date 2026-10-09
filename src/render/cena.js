// Cena: canvas de tela cheia, fundo do cenario (camada parada em cache),
// mesa com a linha do tempo, particulas, mao de ajuda, entrada de fase e
// transicoes. Nao conhece a Poki nem o DOM alem do canvas.
import { calcularLayout } from './layout.js';
import { desenharMesa, desenharMao } from './mesa.js';
import { criarLinha } from './linha.js';
import { criarParticulas } from './particulas.js';
import { cenarioDe } from './cenarios.js';
import { corDoValor, limparCache } from './cartas.js';
import { Transicoes as Tr } from './transicoes.js';

const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';

/** @param {HTMLCanvasElement} canvas */
export function criarCena(canvas) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const linha = criarLinha();
  const part = criarParticulas();
  let W = 1, H = 1, dpr = 1, topo = 0, base = 0;
  let L = null;
  let regras = { colunas: 4, pilhaMax: 5, tamFila: 3 };
  let cen = cenarioDe('neon');
  let skin = 'neon';
  /** @type {HTMLCanvasElement|null} */ let fundo = null;
  let tVis = 0;

  function redimensionar(w, h, d, t, b) {
    W = w; H = h; dpr = d; topo = t; base = b || 0;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    L = calcularLayout({ W, H, topo, base, colunas: regras.colunas, pilhaMax: regras.pilhaMax, tamFila: regras.tamFila });
    fundo = null;
    limparCache();
  }

  function definirRegras(r) {
    regras = { colunas: r.colunas, pilhaMax: r.pilhaMax, tamFila: r.tamFila };
    L = calcularLayout({ W, H, topo, base, colunas: regras.colunas, pilhaMax: regras.pilhaMax, tamFila: regras.tamFila });
    linha.limpar();
  }

  function definirVisual(cenarioId, skinId) {
    cen = cenarioDe(cenarioId);
    skin = skinId || skin;
    fundo = null;
    limparCache();
  }

  function prepararFundo() {
    fundo = document.createElement('canvas');
    fundo.width = canvas.width; fundo.height = canvas.height;
    const g = /** @type {CanvasRenderingContext2D} */ (fundo.getContext('2d'));
    g.scale(dpr, dpr);
    cen.parado(g, W, H);
  }

  /** Agenda as animacoes de uma jogada. */
  function tocar(eventos, agora, info) {
    linha.montar(eventos, L, agora, info);
  }

  function efeito(e) {
    switch (e.tipo) {
      case 'pouso': part.faiscas(e.x, e.y + L.ch * 0.4, 'rgba(255,255,255,0.8)', 4); break;
      case 'fusao': {
        const cor = corDoValor(e.valor, cen.paleta);
        part.estourar(e.x, e.y, cor, 8 + e.degrau * 4, 0.7 + e.degrau * 0.2, 0.5);
        if (e.degrau >= 2) part.texto(e.x, e.y - L.ch * 0.5, '×' + e.degrau, '#ffffff', Math.round(L.ch * 0.26));
        break;
      }
      case 'completar': part.estourar(e.x, e.y, '#ffd84a', 40, 1.6, 0.9); part.estourar(e.x, e.y, '#ffffff', 20, 1.2, 0.7); break;
      case 'explodir': part.estourar(e.x, e.y, '#ff7a3c', 24, 1.2, 0.6); part.estourar(e.x, e.y, '#444', 12, 0.8, 0.6); break;
      case 'pedra': part.estourar(e.x, e.y, '#7b7f8a', 26, 1.1, 0.8); break;
      case 'racha': part.estourar(e.x, e.y, '#9a9ea8', 8, 0.6, 0.4); break;
      case 'gelo': part.flocos(e.x, e.y, 14); break;
      case 'cadeado': part.estourar(e.x, e.y, cen.paleta.acento, 18, 1, 0.7); break;
      case 'combo': if (e.n >= 3) part.texto(e.x, e.y - L.ch, 'COMBO ' + e.n, cen.paleta.acento, Math.round(L.ch * 0.3)); break;
      default: break;
    }
  }

  /** @returns {any[]} efeitos que aconteceram neste passo (para o som) */
  function atualizar(dt, agora) {
    tVis += dt;
    part.atualizar(dt);
    const prontos = linha.drenarEfeitos(agora);
    for (const e of prontos) efeito(e);
    linha.podar(agora - 50);
    return prontos;
  }

  /**
   * @param {{ estado: any, agora: number, trans?: any, tEntrada?: number, arrasto?: any, destaque?: number, legal?: boolean, mao?: any, febre?: number, info?: any, semFila?: boolean }} q
   */
  function desenhar(q) {
    if (!L) return;
    if (!fundo) prepararFundo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(fundo, 0, 0, W, H);
    cen.vivo(ctx, W, H, tVis);
    const pal = cen.paleta;
    // entrada de fase e soco de camera da vitoria
    let zoom = 1, branco = 0;
    if (q.tEntrada !== undefined && q.tEntrada > -1e8) {
      const en = Tr.entrada((q.agora - q.tEntrada) / 1000);
      zoom = en.zoom; branco = en.branco;
    }
    if (q.trans) zoom *= Tr.camera(q.trans.tipo, (q.agora - q.trans.t0) / 1000).zoom;
    ctx.save();
    if (zoom !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); }
    if (q.estado) {
      desenharMesa(ctx, q.estado, L, { skin, pal, agora: q.agora, dpr, linha, arrasto: q.arrasto, destaque: q.destaque, legal: q.legal, febre: q.febre || 0, semFila: q.semFila, alvo: q.alvo || '' });
    }
    part.desenhar(ctx);
    if (q.mao) desenharMao(ctx, q.mao.x, q.mao.y, tVis, '#fff');
    ctx.restore();
    if (branco > 0) { ctx.fillStyle = `rgba(255,255,255,${branco})`; ctx.fillRect(0, 0, W, H); }
    if (q.trans) {
      Tr.desenhar(ctx, q.trans.tipo, (q.agora - q.trans.t0) / 1000, { W, H, fx: q.trans.fx, fy: q.trans.fy, texto: q.info && q.info.texto, textoMundo: q.info && q.info.textoMundo, pontos: [], corMundo: q.trans.corMundo, semente: q.trans.semente });
    }
  }

  return {
    redimensionar, definirRegras, definirVisual, tocar, atualizar, desenhar, part, linha,
    get L() { return L; }, get pal() { return cen.paleta; }, get skin() { return skin; }, get cenario() { return cen; },
    get W() { return W; }, get H() { return H; },
  };
}

export { FONTE };
