// Desenho da mesa: painel, colunas, cartas (com as poses da linha do tempo),
// fantasmas, descarte e fila. Compartilhado pela cena, pelo laboratorio e
// pela thumb. Nao tem estado proprio.
import { desenharCarta, desenharSlot, retanguloArredondado, corDoValor } from './cartas.js';

const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';

function cadeado(ctx, x, y, w, h, cor) {
  const cx = x + w / 2, cy = y + h * 0.5, s = w * 0.34;
  ctx.save();
  ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = Math.max(2, w * 0.06); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.25, s * 0.42, Math.PI, 0); ctx.stroke();
  retanguloArredondado(ctx, cx - s * 0.6, cy - s * 0.25, s * 1.2, s * 0.9, s * 0.18); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.arc(cx, cy + s * 0.15, s * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {any} estado
 * @param {any} L layout
 * @param {{ skin: string, pal: any, agora: number, dpr?: number, linha?: any, arrasto?: any, destaque?: number, legal?: boolean, semFila?: boolean, febre?: number }} op
 */
export function desenharMesa(ctx, estado, L, op) {
  const { skin, pal, agora } = op;
  const dpr = op.dpr || 1;
  const linha = op.linha;
  const pose = (id) => (linha ? linha.pose(id, agora) : null);
  const valorDe = (k) => (linha ? linha.valor(k.id, agora, k.v) : k.v);
  const tremor = (c) => (linha ? linha.tremor(c, agora) : 0);
  const febre = op.febre || 0;

  // painel da mesa
  const m = L.mesa;
  ctx.save();
  if (pal.mesaBrilho && pal.mesaBrilho !== 'rgba(0,0,0,0)') { ctx.shadowColor = febre > 0 ? '#ffd84a' : pal.mesaBrilho; ctx.shadowBlur = 18 + febre * 22; }
  retanguloArredondado(ctx, m.x, m.y, m.w, m.h, L.pad * 1.1);
  ctx.fillStyle = pal.mesa; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, L.pad * 0.28);
  ctx.strokeStyle = febre > 0 ? `rgba(255,216,74,${0.6 + 0.4 * Math.abs(Math.sin(agora / 120))})` : pal.mesaBorda;
  ctx.stroke();
  ctx.restore();

  // slots e cadeados
  for (let c = 0; c < L.colunas; c++) {
    const col = estado.colunas[c];
    const s = L.carta(c, 0);
    const dx = tremor(c);
    if (!col.length) desenharSlot(ctx, s.x + dx, s.y, s.w, s.h, pal.slot, op.destaque === c ? 0.8 : 0.3);
    if (op.alvo && (op.alvo === 'coringa' || col.length) && !estado.cadeados[c]) {
      const area = L.coluna(c);
      ctx.save();
      retanguloArredondado(ctx, area.x + dx - L.gap * 0.4, area.y - L.gap * 0.4, area.w + L.gap * 0.8, area.h + L.gap * 0.8, L.gap);
      ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.abs(Math.sin(agora / 200))})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke();
      ctx.restore();
    }
    if (op.destaque === c) {
      const area = L.coluna(c);
      ctx.save();
      retanguloArredondado(ctx, area.x + dx - L.gap * 0.4, area.y - L.gap * 0.4, area.w + L.gap * 0.8, area.h + L.gap * 0.8, L.gap);
      ctx.fillStyle = op.legal === false ? 'rgba(255,70,70,0.18)' : 'rgba(255,255,255,0.14)';
      ctx.fill();
      ctx.restore();
    }
  }

  // cartas das colunas (as que tem pose vao por cima, no fim)
  const flutuantes = [];
  for (let c = 0; c < L.colunas; c++) {
    const col = estado.colunas[c];
    const dx = tremor(c);
    col.forEach((k, i) => {
      const p = pose(k.id);
      const base = L.carta(c, i);
      const carta = k.v !== undefined ? { ...k, v: valorDe(k) } : k;
      if (p && (p.voando || p.x !== undefined)) { flutuantes.push({ carta, p, base }); return; }
      desenharCarta(ctx, skin, carta, { x: base.x + dx, y: base.y, w: base.w, h: base.h, pal, dpr, esc: p ? p.esc : 1 });
      if (p && p.escY !== 1) { /* squash aplicado pela escala uniforme; fica simples */ }
    });
    if (estado.cadeados[c]) {
      const area = L.coluna(c);
      ctx.save();
      retanguloArredondado(ctx, area.x + dx, area.y, area.w, area.h, L.gap);
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
      ctx.restore();
      cadeado(ctx, area.x + dx, area.y + area.h * 0.3, area.w, area.h * 0.4, pal.slot);
    }
  }

  // fantasmas
  if (linha) {
    for (const g of linha.fantasmas(agora)) {
      desenharCarta(ctx, skin, g.carta, { x: g.x, y: g.y, w: g.w, h: g.h, pal, dpr, esc: g.esc, alpha: g.alpha, rot: g.rot });
    }
  }
  for (const f of flutuantes) {
    const p = f.p;
    desenharCarta(ctx, skin, f.carta, { x: p.x !== undefined ? p.x : f.base.x, y: p.y !== undefined ? p.y : f.base.y, w: p.w || f.base.w, h: p.h || f.base.h, pal, dpr, esc: p.esc, alpha: p.alpha });
  }

  // descarte
  const d = L.descarte;
  const dxD = tremor(-1);
  const temCarga = estado.descarteCarga > 0;
  desenharSlot(ctx, d.x + dxD, d.y, d.w, d.h, pal.slot, temCarga ? 0.55 : 0.18, temCarga && !estado.descarte ? '⤴' : '');
  if (estado.descarte) {
    const p = pose(estado.descarte.id);
    if (p && p.x !== undefined) desenharCarta(ctx, skin, estado.descarte, { x: p.x, y: p.y, w: p.w, h: p.h, pal, dpr, esc: p.esc });
    else desenharCarta(ctx, skin, estado.descarte, { x: d.x + dxD, y: d.y, w: d.w, h: d.h, pal, dpr, alpha: 0.35, esc: 0.9 });
  }
  if (estado.descarteCarga > 1) {
    ctx.save();
    ctx.fillStyle = pal.acento; ctx.font = `700 ${Math.round(d.h * 0.18)}px ${FONTE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('×' + estado.descarteCarga, d.x + d.w / 2 + dxD, d.y + d.h * 0.88);
    ctx.restore();
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
      desenharCarta(ctx, skin, carta, { x, y, w, h, pal, dpr, esc: p ? p.esc : 1, alpha: p ? p.alpha : 1, escurecer: frente ? 0 : 0.38, destaque: k === 0 && !op.arrasto ? 0.35 + 0.35 * Math.abs(Math.sin(agora / 350)) : 0 });
    }
    if (arrastada) {
      const a = op.arrasto;
      const base = L.filaPos(0);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
      desenharCarta(ctx, skin, arrastada, { x: a.x - base.w * 0.55, y: a.y - base.h * 0.55, w: base.w * 1.1, h: base.h * 1.1, pal, dpr, rot: a.rot || 0 });
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

export { corDoValor };
