// Mesa do duelo: grimorio de madeira com friso dourado, runas nos espacos
// vazios, cartas (com as poses da linha do tempo), correntes nas colunas
// trancadas, fantasmas, descarte em lapide e a fila num tapete de couro.
// Nao tem estado proprio. As cores vem da paleta da arena (arena.js).
import { desenharCarta } from './cartas.js';
import { TINTA, OURO, rr, circulo, elipse, estrela, texto } from './desenho.js';

/** Tapete de couro sob a fila, com o rotulo "na mao". */
function tapete(ctx, L, pal, rotulo) {
  const f = L.fila;
  let x, y, w, h;
  const folga = Math.max(8, L.gap * 1.4);
  if (f.vertical) { x = f.x - 2; y = f.y - 6; w = f.w + 4; h = f.h + 12; }
  else {
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    x = Math.min(p0.x, p2.x) - folga * 1.4; w = Math.max(p0.x + p0.w, p2.x + p2.w) + folga * 1.4 - x;
    y = p0.y - folga; h = p0.h + folga * 2;
  }
  ctx.save();
  ctx.shadowColor = 'rgba(20,6,24,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  rr(ctx, x, y, w, h, 14);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, pal.tapeteA); g.addColorStop(1, pal.tapeteB);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  rr(ctx, x + 5, y + 5, w - 10, h - 10, 10);
  ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,226,170,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
  rr(ctx, x, y, w, h, 14); ctx.lineWidth = 2; ctx.strokeStyle = '#3a1e0e'; ctx.stroke();
  if (rotulo) {
    const tam = Math.max(11, Math.min(15, L.cw * 0.2));
    // em pe (paisagem) o rotulo vai dentro do tapete, embaixo, onde sobra espaco
    if (f.vertical) texto(ctx, rotulo, x + w / 2, y + h - tam * 1.1, tam, '#fff3d6', { contorno: TINTA, espessura: 3, max: w - 12 });
    else texto(ctx, rotulo, L.filaPos(0).x + L.filaPos(0).w / 2, y - tam * 0.75, tam, '#fff3d6', { contorno: TINTA, espessura: 3 });
  }
}

/** Grimorio: madeira escura com friso dourado e estrelas nos cantos. */
function grimorio(ctx, s, pal, febre, agora) {
  ctx.save();
  ctx.shadowColor = febre > 0 ? '#ffd84a' : 'rgba(15,5,15,0.5)'; ctx.shadowBlur = febre > 0 ? 26 : 14; ctx.shadowOffsetY = febre > 0 ? 0 : 5;
  rr(ctx, s.x, s.y, s.w, s.h, 16);
  const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
  g.addColorStop(0, pal.madeiraA); g.addColorStop(1, pal.madeiraB);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 12); ctx.fillStyle = pal.miolo; ctx.fill();
  rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 12); ctx.lineWidth = 2;
  ctx.strokeStyle = febre > 0 ? `rgba(255,216,74,${0.6 + 0.4 * Math.abs(Math.sin(agora / 120))})` : pal.friso; ctx.stroke();
  rr(ctx, s.x, s.y, s.w, s.h, 16); ctx.lineWidth = 2; ctx.strokeStyle = '#1a0c08'; ctx.stroke();
  for (const [cx, cy] of [[s.x + 5, s.y + 5], [s.x + s.w - 5, s.y + 5], [s.x + 5, s.y + s.h - 5], [s.x + s.w - 5, s.y + s.h - 5]]) {
    estrela(ctx, cx, cy, 7, 2.6, 4, 0); ctx.fillStyle = OURO; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#6b4a10'; ctx.stroke();
  }
}

/** Espaco vazio com runa que pulsa. */
function runa(ctx, r, pal, t, c, forte) {
  rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 8);
  ctx.setLineDash([5, 4]); ctx.strokeStyle = `rgba(${pal.runa},${forte ? 0.95 : 0.55})`; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, r0 = r.w * 0.24;
  circulo(ctx, cx, cy, r0); ctx.strokeStyle = `rgba(${pal.runa},${0.35 + 0.2 * Math.sin(t * 2 + c)})`; ctx.lineWidth = 1.5; ctx.stroke();
  estrela(ctx, cx, cy, r0 * 0.7, r0 * 0.28, 4, t * 0.3 + c); ctx.fillStyle = `rgba(${pal.runa},0.35)`; ctx.fill();
}

/** Coluna trancada: sombra, correntes em X e cadeado dourado (com as jogadas que faltam, se for por tempo). */
function correntes(ctx, a, s, resta = 0, monstro = false) {
  ctx.save();
  rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 10); ctx.fillStyle = 'rgba(20,8,24,0.45)'; ctx.fill();
  const elo = (x0, y0, x1, y1) => {
    const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / (11 * s)));
    const ang = Math.atan2(y1 - y0, x1 - x0);
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      if (i % 2) { elipse(ctx, 0, 0, 7 * s, 2.6 * s); ctx.fillStyle = '#8b93a3'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); }
      else { elipse(ctx, 0, 0, 7 * s, 4.5 * s); ctx.lineWidth = 3 * s; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); ctx.lineWidth = 1.6 * s; ctx.strokeStyle = '#c3cad6'; ctx.stroke(); }
      ctx.restore();
    }
  };
  elo(a.x - 2, a.y + 6, a.x + a.w + 2, a.y + a.h - 6);
  elo(a.x + a.w + 2, a.y + 6, a.x - 2, a.y + a.h - 6);
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
  ctx.strokeStyle = '#2b2f38'; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.arc(cx, cy - 6 * s, 8 * s, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#c3cad6'; ctx.lineWidth = 2.5 * s; ctx.stroke();
  if (monstro) { ctx.shadowColor = '#b89cff'; ctx.shadowBlur = 12 * s; }
  rr(ctx, cx - 12 * s, cy - 6 * s, 24 * s, 19 * s, 4 * s); ctx.fillStyle = monstro ? '#b89cff' : OURO; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
  if (resta > 0) texto(ctx, String(resta), cx, cy + 3.8 * s, 14 * s, TINTA);
  else { ctx.fillStyle = TINTA; circulo(ctx, cx, cy + 1.5 * s, 2.6 * s); ctx.fill(); ctx.fillRect(cx - s, cy + 2 * s, 2 * s, 6 * s); }
  ctx.restore();
}

/** Descarte: lapide rachada com a seta de recarga (acesa com carga). */
function lapide(ctx, r, carga, t, rotulo) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(r.x + 2, r.y + r.h - 2);
  ctx.lineTo(r.x + 2, r.y + r.w * 0.5);
  ctx.arc(r.x + r.w / 2, r.y + r.w * 0.5, r.w / 2 - 2, Math.PI, 0);
  ctx.lineTo(r.x + r.w - 2, r.y + r.h - 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  g.addColorStop(0, '#8d919b'); g.addColorStop(1, '#5b5f69');
  ctx.fillStyle = g; ctx.globalAlpha = carga ? 1 : 0.55; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.strokeStyle = '#33353d'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.62, r.y + r.h * 0.18); ctx.lineTo(r.x + r.w * 0.52, r.y + r.h * 0.34); ctx.lineTo(r.x + r.w * 0.64, r.y + r.h * 0.48); ctx.stroke();
  const cx = r.x + r.w / 2, cy = r.y + r.h * 0.58, ra = r.w * 0.2;
  if (carga) { ctx.shadowColor = '#7fe3ff'; ctx.shadowBlur = 10 + 4 * Math.sin(t * 3); }
  ctx.strokeStyle = carga ? '#bff1ff' : '#3a3c44'; ctx.lineWidth = Math.max(2, r.w * 0.045); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, ra, -Math.PI * 0.15, Math.PI * 1.35); ctx.stroke();
  const a = Math.PI * 1.35, ax = cx + Math.cos(a) * ra, ay = cy + Math.sin(a) * ra, p = ra * 0.45;
  ctx.beginPath(); ctx.moveTo(ax - p, ay - p * 0.15); ctx.lineTo(ax, ay); ctx.lineTo(ax + p * 0.15, ay - p); ctx.stroke();
  ctx.restore();
  if (rotulo) texto(ctx, rotulo, cx, r.y + r.h - r.h * 0.1, Math.max(8, r.w * 0.15), carga ? '#ffffff' : '#c9c9c9', { contorno: TINTA, espessura: 2.5, max: r.w - 4 });
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} estado
 * @param {any} L layout
 * @param {{ pal: any, agora: number, t?: number, dpr?: number, linha?: any, arrasto?: any, destaque?: number, legal?: boolean, semFila?: boolean, febre?: number, alvo?: string, textos?: any }} op
 */
export function desenharMesa(ctx, estado, L, op) {
  const { pal, agora } = op;
  const t = op.t ?? agora / 1000;
  const txt = op.textos || {};
  const dpr = op.dpr || 1;
  const linha = op.linha;
  const pose = (id) => (linha ? linha.pose(id, agora) : null);
  const valorDe = (k) => (linha ? linha.valor(k.id, agora, k.v) : k.v);
  const tremor = (c) => (linha ? linha.tremor(c, agora) : 0);
  const febre = op.febre || 0;

  if (!op.semFila) tapete(ctx, L, pal, txt.naMao);
  grimorio(ctx, L.mesa, pal, febre, agora);

  // espacos vazios, alvo do item e destaque do arrasto
  for (let c = 0; c < L.colunas; c++) {
    const col = estado.colunas[c];
    const s = L.carta(c, 0);
    const dx = tremor(c);
    if (!col.length) runa(ctx, { ...s, x: s.x + dx }, pal, t, c, op.destaque === c);
    if (op.alvo && (op.alvo === 'coringa' || col.length) && !estado.cadeados[c]) {
      const area = L.coluna(c);
      ctx.save();
      rr(ctx, area.x + dx - L.gap * 0.4, area.y - L.gap * 0.4, area.w + L.gap * 0.8, area.h + L.gap * 0.8, L.gap);
      ctx.strokeStyle = `rgba(255,226,122,${0.5 + 0.4 * Math.abs(Math.sin(agora / 200))})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke();
      ctx.restore();
    }
    if (op.destaque === c) {
      const area = L.coluna(c);
      ctx.save();
      rr(ctx, area.x + dx - L.gap * 0.4, area.y - L.gap * 0.4, area.w + L.gap * 0.8, area.h + L.gap * 0.8, L.gap);
      ctx.fillStyle = op.legal === false ? 'rgba(255,70,70,0.2)' : 'rgba(255,226,122,0.16)';
      ctx.fill();
      ctx.restore();
    }
  }

  // fantasmas do fundo da pilha (pedra que quebra) vao sob as cartas da coluna
  const fantasmas = linha ? linha.fantasmas(agora) : [];
  const fantasma = (g) => desenharCarta(ctx, g.carta, { x: g.x, y: g.y, w: g.w, h: g.h, dpr, t, esc: g.esc, alpha: g.alpha, rot: g.rot });
  for (const g of fantasmas) if (g.baixo) fantasma(g);

  // cartas das colunas (as que voam vao por cima, no fim). As que deslizam
  // (pedra que quebra ou entra) ficam na ordem da pilha, sob os fantasmas:
  // senao a carta que vem da fila e funde passa por baixo do topo.
  const flutuantes = [];
  const sCorrente = L.cw / 62;
  for (let c = 0; c < L.colunas; c++) {
    const col = estado.colunas[c];
    const dx = tremor(c);
    col.forEach((k, i) => {
      const p = pose(k.id);
      const base = L.carta(c, i);
      const carta = k.v !== undefined ? { ...k, v: valorDe(k) } : k;
      if (p && p.voando) { flutuantes.push({ carta, p, base }); return; }
      const r = p && p.x !== undefined ? p : base;
      desenharCarta(ctx, carta, { x: r.x + dx, y: r.y, w: r.w, h: r.h, dpr, t, esc: p ? p.esc : 1, escY: p ? p.escY : 1 });
    });
    const cad = estado.cadeados[c];
    if (cad) {
      const area = L.coluna(c);
      correntes(ctx, { x: area.x + dx, y: area.y, w: area.w, h: area.h }, sCorrente, cad.tipo === 'jogadas' ? Math.max(1, cad.n - estado.n) : 0, !!cad.monstro);
    }
  }

  // fantasmas
  for (const g of fantasmas) if (!g.baixo) fantasma(g);
  for (const f of flutuantes) {
    const p = f.p;
    desenharCarta(ctx, f.carta, { x: p.x !== undefined ? p.x : f.base.x, y: p.y !== undefined ? p.y : f.base.y, w: p.w || f.base.w, h: p.h || f.base.h, dpr, t, esc: p.esc, alpha: p.alpha });
  }

  // descarte
  const d = L.descarte;
  const dxD = tremor(-1);
  const temCarga = estado.descarteCarga > 0;
  lapide(ctx, { ...d, x: d.x + dxD }, temCarga, t, estado.descarte ? '' : (temCarga ? txt.descartar : txt.semCarga));
  if (estado.descarte) {
    const p = pose(estado.descarte.id);
    if (p && p.x !== undefined) desenharCarta(ctx, estado.descarte, { x: p.x, y: p.y, w: p.w, h: p.h, dpr, t, esc: p.esc });
    else desenharCarta(ctx, estado.descarte, { x: d.x + dxD, y: d.y, w: d.w, h: d.h, dpr, t, alpha: 0.5, esc: 0.9 });
  }
  if (estado.descarteCarga > 1) {
    texto(ctx, '×' + estado.descarteCarga, d.x + d.w / 2 + dxD, d.y - d.h * 0.08, Math.round(d.h * 0.18), '#bff1ff', { contorno: TINTA, espessura: 3 });
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
    if (arrastada) {
      const a = op.arrasto;
      const base = L.filaPos(0);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
      desenharCarta(ctx, arrastada, { x: a.x - base.w * 0.55, y: a.y - base.h * 0.55, w: base.w * 1.1, h: base.h * 1.1, dpr, t, rot: a.rot || 0 });
      ctx.restore();
    }
  }
}

/** Mao animada apontando para uma coluna (ou para a fila). */
export function desenharMao(ctx, x, y, t, cor = '#ffffff') {
  const bate = Math.abs(Math.sin(t * 4));
  const esc = 1 - bate * 0.12;
  ctx.save();
  ctx.translate(x, y + 10 - bate * 14);
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
