// Mesa: o tabuleiro, os espacos vazios, o tapete da fila e o lugar do
// descarte vem do tema do mundo (temas/kit.js, criarMesa); aqui ficam as
// cartas (com as poses da linha do tempo), os fantasmas, a pilha do descarte
// do nivel com o contador "n/N", a fila e o sinal de proibido (no topo que ja
// recebeu um especial, com coringa, dobro ou x4 na mao; na coluna ilegal sob
// o arrasto; na jogada recusada). Nao tem estado proprio.
// Perigo (mundo sem fim, sem texto): a coluna a 1 carta do limite treme em
// rajadas e ganha um contorno vermelho pulsando; no "fio" (a carta da frente
// nao cabe e o descarte tem 1 lugar), o lugar do descarte tambem. O tremor e
// funcao pura do tempo (o ?quadro= dos prints continua valendo).
// Juntar (teste A/B da 0.6.0): a carta do topo arrastada sai da coluna e
// segue o ponteiro, do tamanho das cartas da mesa, por cima de tudo.
import { desenharCarta } from './cartas.js';
import { TINTA, FONTE, rr, texto, proibido } from './desenho.js';
import { respeitaMarca } from '../jogo/regras.js';

/** Tapete do tema sob a fila, com o rotulo "na mao" (em pe, na paisagem, o rotulo vai dentro, embaixo). */
function tapete(ctx, L, rotulo, m) {
  const f = L.fila;
  let x, y, w, h;
  const folga = Math.max(8, L.gap * 1.4);
  if (f.vertical) { x = f.x - 2; y = f.y - 6; w = f.w + 4; h = f.h + 12; }
  else {
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    x = Math.min(p0.x, p2.x) - folga * 1.4; w = Math.max(p0.x + p0.w, p2.x + p2.w) + folga * 1.4 - x;
    y = p0.y - folga; h = p0.h + folga * 2;
  }
  m.tapete(ctx, { x, y, w, h });
  if (!rotulo) return;
  const tam = Math.max(11, Math.min(15, L.cw * 0.2));
  const op = m.rotuloContorno ? { contorno: m.rotuloContorno, espessura: 3, max: w - 12 } : { max: w - 12 };
  if (f.vertical) texto(ctx, rotulo, x + w / 2, y + h - tam * 1.1, tam, m.rotulo, op);
  else texto(ctx, rotulo, L.filaPos(0).x + L.filaPos(0).w / 2, y - tam * 0.75, tam, m.rotulo, op);
}

/** Vermelho do perigo (o mesmo do contador cheio), igual em todos os mundos, como o proibido. */
const PERIGO = '#e5243b';
/** Rajada de tremor do perigo: 260 ms a cada 1,4 s (forte: a coluna que a segunda chance vai limpar). */
function rajada(agora, forte) {
  const ciclo = forte ? 420 : 1400, dur = forte ? 420 : 260, amp = forte ? 4 : 2.5;
  const u = (agora % ciclo) / dur;
  return u >= 1 ? 0 : Math.sin(u * Math.PI * 6) * amp * (forte ? 1 : 1 - u);
}

/** Contorno vermelho pulsando em volta da area r (coluna ou descarte). */
function contornoPerigo(ctx, r, gap, agora) {
  const k = 0.5 + 0.5 * Math.abs(Math.sin(agora / 260));
  ctx.save();
  rr(ctx, r.x - gap * 0.4, r.y - gap * 0.4, r.w + gap * 0.8, r.h + gap * 0.8, gap);
  ctx.fillStyle = `rgba(229,36,59,${0.08 + 0.1 * k})`; ctx.fill();
  ctx.shadowColor = PERIGO; ctx.shadowBlur = 10 + 8 * k;
  ctx.strokeStyle = `rgba(229,36,59,${0.55 + 0.4 * k})`; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

/** Contador pequeno do descarte ("n/N") no canto de cima do lugar; vermelho com a pilha cheia. */
function contador(ctx, d, rotulo, cheio) {
  const tam = Math.max(10, Math.round(d.w * 0.2));
  ctx.save();
  ctx.font = `700 ${tam}px ${FONTE}`;
  const w = ctx.measureText(rotulo).width + tam * 0.9, h = tam * 1.4;
  const x = d.x + d.w - w * 0.75, y = d.y - h * 0.35;
  ctx.shadowColor = 'rgba(20,6,24,0.45)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1.5;
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = cheio ? '#e5243b' : '#2a1630'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.5; ctx.strokeStyle = cheio ? '#ffd0d6' : 'rgba(255,255,255,0.55)'; ctx.stroke();
  ctx.restore();
  texto(ctx, rotulo, x + w / 2, y + h / 2 + 0.5, tam, '#ffffff');
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} estado
 * @param {any} L layout
 * @param {{ pal: any, mesa: any, agora: number, t?: number, dpr?: number, linha?: any, arrasto?: any, destaque?: number, legal?: boolean, semFila?: boolean, febre?: number, alvo?: string, textos?: any, perigo?: { colunas: number[], fio: boolean, forte?: number } | null }} op
 */
export function desenharMesa(ctx, estado, L, op) {
  const { pal, agora } = op;
  const t = op.t ?? agora / 1000;
  const txt = op.textos || {};
  const dpr = op.dpr || 1;
  const linha = op.linha;
  const pose = (id) => (linha ? linha.pose(id, agora) : null);
  const valorDe = (k) => (linha ? linha.valor(k.id, agora, k.v) : k.v);
  const pg = op.perigo || null;
  /** A coluna c (-1: o descarte) esta em perigo? */
  const emPerigo = (c) => !!pg && (c < 0 ? pg.fio : !!pg.colunas[c] || pg.forte === c);
  const tremor = (c) => (linha ? linha.tremor(c, agora) : 0) + (emPerigo(c) ? rajada(agora, !!pg && pg.forte === c) : 0);
  const febre = op.febre || 0;

  // mesa do tema do mundo (temas/kit.js)
  const m = op.mesa;
  if (!op.semFila) tapete(ctx, L, txt.naMao, m);
  m.tabuleiro(ctx, L.mesa, pal, febre, agora);

  // espacos vazios, alvo do item e destaque do arrasto
  for (let c = 0; c < L.colunas; c++) {
    const col = estado.colunas[c];
    const s = L.carta(c, 0);
    const dx = tremor(c);
    if (!col.length) m.vazio(ctx, { ...s, x: s.x + dx }, pal, t, c, op.destaque === c);
    const marcado = col.length > 0 && !!col[col.length - 1].esp;
    if (op.alvo && (op.alvo === 'coringa' ? !marcado : col.length)) {
      const area = L.coluna(c);
      ctx.save();
      rr(ctx, area.x + dx - L.gap * 0.4, area.y - L.gap * 0.4, area.w + L.gap * 0.8, area.h + L.gap * 0.8, L.gap);
      ctx.strokeStyle = `rgba(255,226,122,${0.5 + 0.4 * Math.abs(Math.sin(agora / 200))})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke();
      ctx.restore();
    }
    if (emPerigo(c)) contornoPerigo(ctx, { ...L.coluna(c), x: L.coluna(c).x + dx }, L.gap, agora);
    if (op.destaque === c) {
      const area = L.coluna(c);
      ctx.save();
      rr(ctx, area.x + dx - L.gap * 0.4, area.y - L.gap * 0.4, area.w + L.gap * 0.8, area.h + L.gap * 0.8, L.gap);
      ctx.fillStyle = op.legal === false ? 'rgba(255,70,70,0.2)' : 'rgba(255,226,122,0.16)';
      ctx.fill();
      ctx.restore();
    }
  }

  const fantasmas = linha ? linha.fantasmas(agora) : [];
  const fantasma = (g) => desenharCarta(ctx, g.carta, { x: g.x, y: g.y, w: g.w, h: g.h, dpr, t, esc: g.esc, alpha: g.alpha, rot: g.rot });

  // cartas das colunas (as que voam vao por cima, no fim). As que deslizam
  // ficam na ordem da pilha, sob os fantasmas: senao a carta que vem da fila
  // e funde passa por baixo do topo.
  const flutuantes = [];
  // a carta da mesa no arrasto do juntar: sai da coluna e e desenhada no fim, sob o ponteiro
  const daMesa = op.arrasto && op.arrasto.origem === 'coluna' && op.arrasto.moveu ? op.arrasto : null;
  let arrastadaMesa = null;
  for (let c = 0; c < L.colunas; c++) {
    const col = estado.colunas[c];
    const dx = tremor(c);
    col.forEach((k, i) => {
      if (daMesa && k.id === daMesa.id && c === daMesa.de) { arrastadaMesa = k; return; }
      const p = pose(k.id);
      const base = L.carta(c, i);
      const carta = k.v !== undefined ? { ...k, v: valorDe(k) } : k;
      if (p && p.voando) { flutuantes.push({ carta, p, base }); return; }
      const r = p && p.x !== undefined ? p : base;
      desenharCarta(ctx, carta, { x: r.x + dx, y: r.y, w: r.w, h: r.h, dpr, t, esc: p ? p.esc : 1, escY: p ? p.escY : 1 });
    });
  }

  // fantasmas
  for (const g of fantasmas) fantasma(g);
  for (const f of flutuantes) {
    const p = f.p;
    desenharCarta(ctx, f.carta, { x: p.x !== undefined ? p.x : f.base.x, y: p.y !== undefined ? p.y : f.base.y, w: p.w || f.base.w, h: p.h || f.base.h, dpr, t, esc: p.esc, alpha: p.alpha });
  }

  // proibido: centro do topo da coluna c (ou do espaco vazio)
  const topoDe = (c) => {
    const col = estado.colunas[c];
    const r = L.carta(c, Math.max(0, col.length - 1));
    return { x: r.x + r.w / 2 + tremor(c), y: r.y + r.h / 2, w: r.w };
  };
  // um especial por carta: o topo marcado mostra o selo enquanto o especial esta na mao
  const naMao = op.arrasto ? estado.fila.find((k) => k.id === op.arrasto.id) : estado.fila[0];
  if (op.alvo === 'coringa' || respeitaMarca(naMao)) {
    const pulsa = 0.85 + 0.15 * Math.sin(agora / 220);
    for (let c = 0; c < L.colunas; c++) {
      const col = estado.colunas[c];
      if (!col.length || !col[col.length - 1].esp) continue;
      const r = L.carta(c, col.length - 1);
      const ra = r.w * 0.16;
      proibido(ctx, r.x + r.w - ra * 0.85 + tremor(c), r.y + ra * 0.85, ra * pulsa);
    }
  }
  // sob o arrasto, na coluna que nao aceita a carta
  if (op.destaque >= 0 && op.legal === false && op.destaque < L.colunas) {
    const p = topoDe(op.destaque);
    proibido(ctx, p.x, p.y, p.w * 0.3, 0.92);
  }

  // descarte: a pilha do nivel (n de N lugares) e o contador
  const d = L.descarte;
  const dxD = tremor(-1);
  const max = estado.regras.descarteMax;
  const n = Math.max(0, max - estado.descarteCarga);
  const cheio = estado.descarteCarga <= 0;
  if (emPerigo(-1)) contornoPerigo(ctx, { ...d, x: d.x + dxD }, L.gap, agora);
  m.descarte(ctx, { ...d, x: d.x + dxD }, !cheio, t, estado.descarte ? '' : (cheio ? txt.semCarga : txt.descartar));
  if (estado.descarte) {
    const p = pose(estado.descarte.id);
    if (p && p.x !== undefined) desenharCarta(ctx, estado.descarte, { x: p.x, y: p.y, w: p.w, h: p.h, dpr, t, esc: p.esc });
    else {
      // as cartas de baixo da pilha: bordas que descem um pouco
      const ew = d.w * 0.9, eh = d.h * 0.9, ex = d.x + dxD + (d.w - ew) / 2, ey = d.y + (d.h - eh) / 2;
      for (let k = Math.min(n, 4) - 1; k >= 1; k--) {
        rr(ctx, ex, ey + k * 3, ew, eh, Math.max(5, ew * 0.11));
        ctx.fillStyle = 'rgba(214,206,228,0.55)'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(42,22,48,0.6)'; ctx.stroke();
      }
      desenharCarta(ctx, estado.descarte, { x: d.x + dxD, y: d.y, w: d.w, h: d.h, dpr, t, alpha: cheio ? 0.45 : 0.6, esc: 0.9 });
    }
    if (cheio) texto(ctx, txt.semCarga, d.x + d.w / 2 + dxD, d.y + d.h * 0.86, Math.max(8, d.w * 0.15), '#ffffff', { contorno: TINTA, espessura: 2.5, max: d.w - 4 });
  }
  if (max > 0) contador(ctx, { ...d, x: d.x + dxD }, `${n}/${max}`, cheio);

  // jogada recusada: o proibido aparece com um salto e some
  for (const p of linha ? linha.proibidos(agora) : []) {
    const esc = p.u < 0.25 ? 0.6 + (p.u / 0.25) * 0.5 : p.u < 0.4 ? 1.1 - ((p.u - 0.25) / 0.15) * 0.1 : 1;
    const alpha = p.u < 0.7 ? 1 : 1 - (p.u - 0.7) / 0.3;
    if (p.c < 0) proibido(ctx, d.x + d.w / 2 + dxD, d.y + d.h / 2, d.w * 0.3 * esc, alpha);
    else if (p.c < L.colunas) { const q = topoDe(p.c); proibido(ctx, q.x, q.y, q.w * 0.3 * esc, alpha); }
  }

  // fila: previas primeiro (na vertical, a de tras por cima da de baixo), a frente por ultimo
  if (!op.semFila) {
    let arrastada = null;
    const ordem = [];
    for (let k = estado.fila.length - 1; k >= 1; k--) ordem.push(k);
    if (L.fila.vertical) ordem.reverse();
    ordem.push(0);
    for (const k of ordem) {
      const carta = estado.fila[k];
      if (!carta) continue;
      if (op.arrasto && op.arrasto.id === carta.id) { arrastada = carta; continue; }
      const p = pose(carta.id);
      const base = L.filaPos(k);
      const frente = k === 0 || estado.regras.filaLivre;
      const x = p && p.x !== undefined ? p.x : base.x + (p && p.entrando ? (L.fila.vertical ? 0 : 30) * p.entrando : 0);
      const y = p && p.y !== undefined ? p.y : base.y + (p && p.entrando ? (L.fila.vertical ? 30 : 0) * p.entrando : 0);
      const w = p && p.w ? p.w : base.w, h = p && p.h ? p.h : base.h;
      desenharCarta(ctx, carta, { x, y, w, h, dpr, t, esc: p ? p.esc : 1, alpha: p ? p.alpha : 1, escurecer: frente ? 0 : 0.32, destaque: k === 0 && !op.arrasto ? 0.35 + 0.35 * Math.abs(Math.sin(agora / 350)) : 0 });
    }
    if (arrastada) arrastar(ctx, arrastada, op.arrasto, L.filaPos(0), dpr, t);
  }
  if (arrastadaMesa) arrastar(ctx, arrastadaMesa, daMesa, { w: L.cw, h: L.ch }, dpr, t);
}

/** A carta arrastada sob o ponteiro (1,1x do tamanho `base`, com sombra): o mesmo retangulo de origemArrasto no main.js. */
function arrastar(ctx, carta, a, base, dpr, t) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  desenharCarta(ctx, carta, { x: a.x - base.w * 0.55, y: a.y - base.h * 0.55, w: base.w * 1.1, h: base.h * 1.1, dpr, t, rot: a.rot || 0 });
  ctx.restore();
}

/** Desenho da mao em (x, y), com a ponta do dedo em (2, -32) * esc. */
function mao(ctx, x, y, esc, cor, alpha = 1) {
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
  ctx.translate(x, y);
  ctx.scale(esc, esc);
  ctx.lineWidth = 3; ctx.strokeStyle = '#1f1a2e'; ctx.fillStyle = cor; ctx.lineJoin = 'round';
  ctx.beginPath();
  // dedo indicador + palma, simples
  ctx.moveTo(-4, -2); ctx.lineTo(-4, -26); ctx.quadraticCurveTo(-4, -32, 2, -32); ctx.quadraticCurveTo(8, -32, 8, -26); ctx.lineTo(8, -8);
  ctx.lineTo(18, -6); ctx.quadraticCurveTo(26, -4, 24, 4); ctx.lineTo(22, 16); ctx.quadraticCurveTo(20, 28, 8, 28); ctx.lineTo(-6, 28);
  ctx.quadraticCurveTo(-18, 26, -18, 12); ctx.lineTo(-16, 2); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

/** Mao animada apontando para uma coluna (ou para a fila). */
export function desenharMao(ctx, x, y, t, cor = '#ffffff') {
  const bate = Math.abs(Math.sin(t * 4));
  mao(ctx, x, y + 10 - bate * 14, 1 - bate * 0.12, cor);
}

/** Duracao (s) de uma volta do gesto guiado. */
export const CICLO_GUIA = 1.8;

/** Fase u (0..1) do gesto guiado no instante t (s). */
export const faseGuia = (t) => (((t % CICLO_GUIA) + CICLO_GUIA) % CICLO_GUIA) / CICLO_GUIA;

/**
 * Gesto guiado: a mao aperta a carta da frente da fila (ou, no juntar, a do
 * topo de uma coluna) e a arrasta ate a coluna certa, em loop (ensina o
 * arrasto, nao so o destino).
 * g = { x, y, de: { x, y }, carta, w, h }: centro do destino, centro da
 * carta de origem, a carta e o tamanho dela.
 */
export function desenharGuia(ctx, g, t, dpr) {
  const u = faseGuia(t);
  const aperta = Math.min(1, u / 0.12);
  const anda = Math.max(0, Math.min(1, (u - 0.15) / 0.5));
  const e = anda < 0.5 ? 2 * anda * anda : 1 - Math.pow(2 - 2 * anda, 2) / 2;
  const some = u > 0.8 ? (u - 0.8) / 0.2 : 0;
  const x = g.de.x + (g.x - g.de.x) * e, y = g.de.y + (g.y - g.de.y) * e;
  if (g.carta && anda > 0) {
    const w = g.w * 1.06, h = g.h * 1.06;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
    desenharCarta(ctx, g.carta, { x: x - w / 2, y: y - h / 2, w, h, dpr, t, alpha: 0.75 * (1 - some) });
    ctx.restore();
  }
  // a ponta do dedo um pouco abaixo do meio da carta; aperta no comeco e solta no fim
  const esc = 1 - 0.12 * aperta * (1 - Math.max(0, (u - 0.68) / 0.12));
  mao(ctx, x - 2 * esc, y + g.h * 0.12 + 32 * esc, esc, '#ffffff', 1 - some);
}
