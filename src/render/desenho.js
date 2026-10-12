// Auxiliares de desenho do duelo (vindos do kit das ideias): formas, texto
// com contorno, cores em hex e um gerador com semente. Sem estado.

export const TAU = Math.PI * 2;
export const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';
export const TINTA = '#2a1630';
export const OURO = '#e8b84a';
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * u;
/** Posicao do valor na escada 2..2048 (0..10); 4096 = 11. */
export const nivel = (v) => Math.max(0, Math.round(Math.log2(Math.max(2, v))) - 1);

/** Gerador deterministico (nuvens, rachaduras, tremores). */
export function semente(s) {
  let a = s >>> 0 || 1;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

export function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function circulo(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
export function elipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); }

/**
 * Texto com contorno opcional; `max` encolhe para caber.
 * @param {{ peso?: number, alinhar?: CanvasTextAlign, max?: number, contorno?: string, espessura?: number, sombra?: string }} [op]
 */
export function texto(ctx, txt, x, y, tam, cor, op = {}) {
  ctx.save();
  ctx.font = `${op.peso || 700} ${Math.round(tam)}px ${FONTE}`;
  ctx.textAlign = op.alinhar || 'center';
  ctx.textBaseline = 'middle';
  if (op.max) {
    const m = ctx.measureText(txt).width;
    if (m > op.max) { const k = op.max / m; ctx.translate(x, y); ctx.scale(k, k); x = 0; y = 0; }
  }
  if (op.contorno) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = op.espessura || tam * 0.2;
    ctx.strokeStyle = op.contorno;
    ctx.strokeText(txt, x, y);
  }
  if (op.sombra) { ctx.fillStyle = op.sombra; ctx.fillText(txt, x, y + tam * 0.08); }
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
  ctx.restore();
}

function hex(h) {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function misturar(a, b, k) {
  const x = hex(a), y = hex(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
export const escurecer = (h, k) => misturar(h, '#000000', k);
export const clarear = (h, k) => misturar(h, '#ffffff', k);
export function rgba(h, a) { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; }

/** Estrela de n pontas (raio externo r, interno ri). */
export function estrela(ctx, x, y, r, ri, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, r0 = i % 2 ? ri : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r0, y + Math.sin(a) * r0);
  }
  ctx.closePath();
}
