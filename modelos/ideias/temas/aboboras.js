// Ideia 11: Noite das Aboboras (Halloween fofo). Aboboras menores sobem nas
// maiores; iguais viram uma abobora maior, com a vela mais forte e a cara mais
// engracada. O 2048 e o Rei Abobora, que flutua ate a lua.
// Pecas em torre (de baixo para cima), largura cresce com o valor.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const NOITE = '#2a1846';
const LARANJA = '#ff8a1f';
const ACIDO = '#9be15d';
const LUA = '#fff2b3';
const TINTA = '#2a1236';

// cor da abobora por valor (2..2048, 4096)
const CORES = ['#ffd54a', '#ffb057', '#ff8a1f', '#7bbf3a', '#f3eee2', '#e2661a', '#d9452b', '#8e5bd8', '#7fa8e8', '#f2c14a', '#ff7a1a', '#ffcf5a'];
// cara por valor: [olhos, boca]
const CARAS = [
  ['redondo', 'sorriso'], ['tri', 'zigue'], ['tri', 'dentes'], ['feliz', 'o'], ['piscada', 'lingua'], ['bravo', 'zigue'],
  ['redondo', 'dentes'], ['estrela', 'sorriso'], ['feliz', 'lingua'], ['tri', 'enorme'], ['estrela', 'zigue'], ['coracao', 'enorme'],
];

// ------------------------------------------------------------ abobora

function corpoAbobora(ctx, cor, cx, cy, rx, ry) {
  // gomos: elipses laterais mais escuras, centrais mais claras
  const esc = escurecer(cor, 0.22);
  ctx.fillStyle = esc;
  for (const k of [-0.55, 0.55]) { elipse(ctx, cx + k * rx, cy, rx * 0.5, ry * 0.94); ctx.fill(); }
  ctx.fillStyle = cor;
  for (const k of [-0.27, 0.27]) { elipse(ctx, cx + k * rx, cy, rx * 0.55, ry); ctx.fill(); }
  const g = ctx.createRadialGradient(cx - rx * 0.2, cy - ry * 0.35, 1, cx, cy, rx);
  g.addColorStop(0, clarear(cor, 0.35)); g.addColorStop(1, cor);
  ctx.fillStyle = g; elipse(ctx, cx, cy, rx * 0.42, ry * 1.0); ctx.fill();
  // linhas dos gomos
  ctx.strokeStyle = rgba(escurecer(cor, 0.45), 0.55); ctx.lineWidth = 1.4;
  for (const k of [-0.62, -0.3, 0.3, 0.62]) {
    ctx.beginPath(); ctx.moveTo(cx + k * rx * 0.55, cy - ry * 0.92);
    ctx.quadraticCurveTo(cx + k * rx * 1.15, cy, cx + k * rx * 0.55, cy + ry * 0.92); ctx.stroke();
  }
  // contorno geral
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.55, cy, rx * 0.5, ry * 0.94, 0, Math.PI * 0.5, Math.PI * 1.5);
  ctx.ellipse(cx + rx * 0.55, cy, rx * 0.5, ry * 0.94, 0, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
}

function cabinho(ctx, cx, topo, s, verde) {
  ctx.fillStyle = verde ? '#4f7a2a' : '#6b4a2a';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, topo + s * 0.1);
  ctx.quadraticCurveTo(cx - s * 0.1, topo - s * 0.35, cx + s * 0.18, topo - s * 0.5);
  ctx.lineTo(cx + s * 0.24, topo - s * 0.38);
  ctx.quadraticCurveTo(cx + s * 0.06, topo - s * 0.25, cx + s * 0.12, topo + s * 0.1);
  ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
  // folhinha
  ctx.fillStyle = '#6fae3f';
  ctx.beginPath(); ctx.moveTo(cx + s * 0.05, topo - s * 0.1); ctx.quadraticCurveTo(cx + s * 0.5, topo - s * 0.45, cx + s * 0.6, topo - s * 0.05); ctx.quadraticCurveTo(cx + s * 0.3, topo + s * 0.05, cx + s * 0.05, topo - s * 0.1); ctx.fill(); ctx.stroke();
}

/** Recorte iluminado (olhos e boca) no tamanho fs, centrado em (cx, cy). */
function cara(ctx, n, cx, cy, fs, f) {
  const [olhos, boca] = CARAS[Math.min(n, CARAS.length - 1)];
  const luz = ctx.createRadialGradient(cx, cy, 1, cx, cy, fs);
  luz.addColorStop(0, `rgba(255,248,180,${f})`); luz.addColorStop(1, `rgba(255,160,30,${0.85 * f + 0.15})`);
  ctx.fillStyle = luz; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
  const ex = fs * 0.42, ey = cy - fs * 0.2, es = fs * 0.24;
  const tri = (x, y, s, inv = 1, incl = 0) => {
    ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.6 * inv + incl); ctx.lineTo(x + s, y + s * 0.6 * inv - incl); ctx.lineTo(x, y - s * 0.7 * inv); ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  const arco = (x, y, s) => { ctx.save(); ctx.lineWidth = Math.max(2.4, s * 0.45); ctx.strokeStyle = luz; ctx.beginPath(); ctx.arc(x, y + s * 0.4, s * 0.8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.restore(); };
  for (const sx of [-1, 1]) {
    const x = cx + sx * ex;
    switch (olhos) {
      case 'redondo': circulo(ctx, x, ey, es * (n === 6 ? 1.15 : 0.9)); ctx.fill(); ctx.stroke(); ctx.fillStyle = TINTA; circulo(ctx, x + es * 0.2, ey + es * 0.1, es * 0.35); ctx.fill(); ctx.fillStyle = luz; break;
      case 'tri': tri(x, ey, es); break;
      case 'bravo': tri(x, ey, es, 1, sx * es * 0.5); break;
      case 'feliz': arco(x, ey, es); break;
      case 'piscada': if (sx < 0) tri(x, ey, es); else arco(x, ey, es); break;
      case 'estrela': estrela(ctx, x, ey, es * 1.15, es * 0.5, 5); ctx.fill(); ctx.stroke(); break;
      case 'coracao':
        ctx.beginPath(); ctx.moveTo(x, ey + es * 0.8);
        ctx.bezierCurveTo(x - es * 1.5, ey - es * 0.1, x - es * 0.6, ey - es * 1.2, x, ey - es * 0.4);
        ctx.bezierCurveTo(x + es * 0.6, ey - es * 1.2, x + es * 1.5, ey - es * 0.1, x, ey + es * 0.8);
        ctx.fill(); ctx.stroke(); break;
      default: break;
    }
  }
  // nariz
  tri(cx, cy + fs * 0.05, fs * 0.09);
  const my = cy + fs * 0.32, mw = fs * (boca === 'enorme' ? 0.95 : 0.72);
  switch (boca) {
    case 'sorriso': case 'enorme':
      ctx.beginPath(); ctx.moveTo(cx - mw, my - fs * 0.08); ctx.quadraticCurveTo(cx, my + fs * (boca === 'enorme' ? 0.6 : 0.45), cx + mw, my - fs * 0.08);
      ctx.quadraticCurveTo(cx, my + fs * 0.12, cx - mw, my - fs * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = escurecer('#ff8a1f', 0.1); rr(ctx, cx + mw * 0.15, my + fs * 0.02, fs * 0.16, fs * 0.13, 2); ctx.fill();
      break;
    case 'zigue':
      ctx.beginPath(); ctx.moveTo(cx - mw, my - fs * 0.05);
      for (let i = 1; i <= 6; i++) ctx.lineTo(cx - mw + (i * mw * 2) / 6, my + (i % 2 ? fs * 0.1 : -fs * 0.05));
      ctx.lineTo(cx + mw * 0.8, my + fs * 0.2); ctx.quadraticCurveTo(cx, my + fs * 0.38, cx - mw * 0.8, my + fs * 0.2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'dentes':
      ctx.beginPath(); ctx.moveTo(cx - mw, my - fs * 0.05); ctx.quadraticCurveTo(cx, my + fs * 0.42, cx + mw, my - fs * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = CORES[Math.min(n, 11)];
      for (const dx of [-0.35, 0.25]) { ctx.fillRect(cx + dx * mw, my - fs * 0.04, fs * 0.13, fs * 0.13); }
      break;
    case 'o':
      elipse(ctx, cx, my + fs * 0.06, fs * 0.17, fs * 0.2); ctx.fill(); ctx.stroke();
      break;
    case 'lingua':
      ctx.beginPath(); ctx.moveTo(cx - mw, my - fs * 0.05); ctx.quadraticCurveTo(cx, my + fs * 0.36, cx + mw, my - fs * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5d8a'; elipse(ctx, cx + mw * 0.25, my + fs * 0.2, fs * 0.15, fs * 0.17); ctx.fill(); ctx.stroke();
      break;
    default: break;
  }
}

/** Etiqueta de bala com o numero (no alto da peca, sempre visivel). */
function etiqueta(ctx, v, cx, y, cor, max, alt) {
  const tam = Math.max(10, Math.min(15, alt * 0.21));
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const tw = Math.min(max, ctx.measureText(String(v)).width + tam * 0.9), th = tam * 1.25;
  // pontas torcidas da bala
  ctx.fillStyle = cor; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    const x = cx + s * tw / 2;
    ctx.beginPath(); ctx.moveTo(x, y + th / 2); ctx.lineTo(x + s * th * 0.6, y + th * 0.1); ctx.lineTo(x + s * th * 0.6, y + th * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  rr(ctx, cx - tw / 2, y, tw, th, th * 0.45); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.stroke();
  texto(ctx, String(v), cx, y + th / 2 + 0.5, tam, TINTA, { max: tw - 4 });
}

function coroa(ctx, cx, cy, w, h, brilho, joias) {
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx - w / 2, cy - h * 0.8); ctx.lineTo(cx - w / 4, cy - h * 0.35);
  ctx.lineTo(cx, cy - h); ctx.lineTo(cx + w / 4, cy - h * 0.35); ctx.lineTo(cx + w / 2, cy - h * 0.8); ctx.lineTo(cx + w / 2, cy); ctx.closePath();
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, '#ffd23f'); g.addColorStop(0.5, '#fff6b0'); g.addColorStop(1, '#e8a800');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
  if (joias) for (const [dx, c] of [[-0.25, '#ff4d8a'], [0, '#5ad1ff'], [0.25, '#9be15d']]) { circulo(ctx, cx + dx * w, cy - h * 0.22, h * 0.13); ctx.fillStyle = c; ctx.fill(); }
  if (brilho > 0) { estrela(ctx, cx + w * 0.45, cy - h * 0.9, h * 0.45 * brilho, h * 0.12, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); }
}

function abobora(ctx, v, r, op) {
  const n = Math.min(11, nivel(v));
  const cor = CORES[n];
  const t = op.t || 0;
  const pw = r.w * (0.62 + 0.38 * Math.min(1, n / 10));
  const ph = r.h - 4, y0 = r.y + 2;
  const flutua = n >= 10 ? Math.sin(t * 3 + n) * 2 : 0;
  const rx = pw / 2, ry = ph * 0.38;
  const cx = 0, cy = y0 + ph * 0.6 + flutua;
  // capa do rei (atras)
  if (n >= 10) {
    ctx.fillStyle = n === 10 ? '#c4223a' : '#8e3bd8';
    ctx.beginPath(); ctx.moveTo(cx - rx * 0.7, cy - ry * 0.7);
    ctx.quadraticCurveTo(cx - rx * 1.25, cy + ry * 0.6, cx - rx * 1.05 + Math.sin(t * 4) * 2, cy + ry * 1.05);
    ctx.lineTo(cx + rx * 1.05 + Math.sin(t * 4 + 1) * 2, cy + ry * 1.05);
    ctx.quadraticCurveTo(cx + rx * 1.25, cy + ry * 0.6, cx + rx * 0.7, cy - ry * 0.7); ctx.closePath();
    ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = '#fff6e8'; rr(ctx, cx - rx * 0.75, cy - ry * 0.78, rx * 1.5, ry * 0.2, ry * 0.1); ctx.fill(); ctx.stroke();
  }
  // brilho em volta (mais forte nos valores altos)
  const f = 0.72 + 0.28 * Math.sin(t * 11 + n * 1.7) * Math.sin(t * 7.3 + n);
  const k = 0.25 + 0.75 * (n / 11);
  const halo = ctx.createRadialGradient(cx, cy, rx * 0.3, cx, cy, rx * 1.35);
  halo.addColorStop(0, `rgba(255,190,70,${0.32 * k * f})`); halo.addColorStop(1, 'rgba(255,140,30,0)');
  ctx.fillStyle = halo; elipse(ctx, cx, cy, rx * 1.35, ry * 1.45); ctx.fill();
  cabinho(ctx, cx - rx * 0.05, cy - ry * 0.92, Math.min(ry, 22), n === 3);
  corpoAbobora(ctx, cor, cx, cy, rx, ry);
  const fs = Math.min(rx * 0.95, ry * 1.05);
  cara(ctx, n, cx, cy + ry * 0.05, fs, f);
  if (n >= 10) coroa(ctx, cx, cy - ry * 0.82, Math.min(rx * 0.9, 26), Math.min(ry * 0.6, 15), n === 11 ? 0.6 + 0.4 * Math.sin(t * 6) : 0, n === 11);
  etiqueta(ctx, v, cx + (n >= 10 ? rx * 0.62 : 0), y0 + 1, cor, Math.max(30, r.w * 0.8), r.h);
  if (op.destaque) {
    elipse(ctx, cx, cy, rx + 4, ry + 4); ctx.strokeStyle = `rgba(255,242,179,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

// ------------------------------------------------------------ especiais

function teia(ctx, r, t) {
  const ox = r.x + r.w - 2, oy = r.y + 2, R = Math.max(r.w, r.h) * 1.05;
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.clip();
  ctx.fillStyle = 'rgba(210,220,255,0.12)'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(245,245,255,0.82)'; ctx.lineWidth = 1.1;
  const raios = 7, a0 = Math.PI * 0.5, a1 = Math.PI;
  for (let i = 0; i <= raios; i++) {
    const a = a0 + ((a1 - a0) * i) / raios;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * R, oy + Math.sin(a) * R); ctx.stroke();
  }
  for (let k = 1; k <= 5; k++) {
    const rk = (R * k) / 5.2;
    ctx.beginPath();
    for (let i = 0; i <= raios; i++) {
      const a = a0 + ((a1 - a0) * i) / raios;
      const px = ox + Math.cos(a) * rk, py = oy + Math.sin(a) * rk;
      if (!i) ctx.moveTo(px, py);
      else { const am = a - (a1 - a0) / raios / 2; ctx.quadraticCurveTo(ox + Math.cos(am) * rk * 0.88, oy + Math.sin(am) * rk * 0.88, px, py); }
    }
    ctx.stroke();
  }
  ctx.restore();
  // aranhinha fofa pendurada
  const sx = r.x + r.w * 0.28, sy = r.y + r.h * 0.42 + Math.sin(t * 2.5) * 3;
  ctx.strokeStyle = 'rgba(245,245,255,0.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, r.y); ctx.lineTo(sx, sy); ctx.stroke();
  ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.4;
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
    ctx.beginPath(); ctx.moveTo(sx, sy + 1); ctx.quadraticCurveTo(sx + s * 6, sy - 3 + k * 2.5, sx + s * 8, sy + 2 + k * 2.5); ctx.stroke();
  }
  circulo(ctx, sx, sy + 2, 5); ctx.fillStyle = '#1a1020'; ctx.fill();
  ctx.fillStyle = '#fff'; circulo(ctx, sx - 1.8, sy + 1, 1.5); ctx.fill(); circulo(ctx, sx + 1.8, sy + 1, 1.5); ctx.fill();
  ctx.fillStyle = '#1a1020'; circulo(ctx, sx - 1.6, sy + 1.3, 0.7); ctx.fill(); circulo(ctx, sx + 2, sy + 1.3, 0.7); ctx.fill();
}

function lapide(ctx, r, hp) {
  const w = r.w * 0.82, h = r.h - 8, x0 = -w / 2, y0 = r.y + 5;
  const forma = () => {
    ctx.beginPath(); ctx.moveTo(x0, y0 + h);
    ctx.lineTo(x0, y0 + w * 0.45); ctx.arc(0, y0 + w * 0.45, w / 2, Math.PI, 0); ctx.lineTo(x0 + w, y0 + h); ctx.closePath();
  };
  forma();
  const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
  g.addColorStop(0, '#a7a4b8'); g.addColorStop(0.5, '#c9c6d8'); g.addColorStop(1, '#8d8aa0');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.save(); forma(); ctx.clip();
  ctx.fillStyle = 'rgba(111,174,63,0.75)'; for (const [dx, dy, rx0] of [[-0.3, 0.1, 0.18], [0.25, 0.18, 0.12]]) { elipse(ctx, dx * w, y0 + dy * h, rx0 * w, rx0 * w * 0.6); ctx.fill(); }
  ctx.restore();
  texto(ctx, 'RIP', 0, y0 + h * 0.38, Math.min(15, w * 0.3), '#5d5a70');
  // carinha dormindo
  ctx.strokeStyle = '#4a4760'; ctx.lineWidth = 1.5;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * w * 0.18, y0 + h * 0.58, w * 0.07, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,120,160,0.5)'; for (const s of [-1, 1]) { elipse(ctx, s * w * 0.3, y0 + h * 0.66, w * 0.07, w * 0.04); ctx.fill(); }
  // rachaduras pelo hp perdido
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  const rach = [[-0.3, 0.2, -0.12, 0.42, -0.26, 0.6], [0.3, 0.22, 0.12, 0.46, 0.3, 0.7], [-0.05, 0.08, 0.06, 0.24, -0.04, 0.32]];
  ctx.strokeStyle = '#3b384c'; ctx.lineWidth = 1.7;
  for (let k = 0; k < perdido; k++) { const c = rach[k]; ctx.beginPath(); ctx.moveTo(c[0] * w, y0 + c[1] * h); ctx.lineTo(c[2] * w, y0 + c[3] * h); ctx.lineTo(c[4] * w, y0 + c[5] * h); ctx.stroke(); }
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * 10, y0 + h * 0.86, 3.4);
    ctx.fillStyle = k < hp ? '#ffb020' : 'rgba(0,0,0,0.35)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
  }
  // tufos de grama
  ctx.fillStyle = '#4f7a3a';
  for (const dx of [-0.45, -0.2, 0.3, 0.48]) { ctx.beginPath(); ctx.moveTo(dx * w - 4, y0 + h); ctx.lineTo(dx * w, y0 + h - 7); ctx.lineTo(dx * w + 4, y0 + h); ctx.fill(); }
}

function gato(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.42, r.w * 0.4), cy = r.y + r.h * 0.6;
  // cauda
  ctx.strokeStyle = '#1b1424'; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(s * 0.5, cy + s * 0.55); ctx.quadraticCurveTo(s * 1.15, cy + s * 0.2, s * 0.9 + Math.sin(t * 3) * s * 0.1, cy - s * 0.4); ctx.stroke();
  elipse(ctx, 0, cy + s * 0.25, s * 0.58, s * 0.55); ctx.fillStyle = '#1b1424'; ctx.fill();
  circulo(ctx, 0, cy - s * 0.38, s * 0.48); ctx.fill();
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * s * 0.42, cy - s * 0.55); ctx.lineTo(sx * s * 0.38, cy - s * 1.0); ctx.lineTo(sx * s * 0.1, cy - s * 0.78); ctx.closePath(); ctx.fill(); }
  // olhos verdes brilhando
  const pisca = Math.sin(t * 1.3) > 0.97 ? 0.15 : 1;
  for (const sx of [-1, 1]) {
    elipse(ctx, sx * s * 0.2, cy - s * 0.42, s * 0.13, s * 0.15 * pisca); ctx.fillStyle = ACIDO; ctx.fill();
    elipse(ctx, sx * s * 0.2, cy - s * 0.42, s * 0.04, s * 0.12 * pisca); ctx.fillStyle = '#1b1424'; ctx.fill();
  }
  ctx.fillStyle = '#ff8fb0'; circulo(ctx, 0, cy - s * 0.25, s * 0.05); ctx.fill();
  // coleira com "?"
  rr(ctx, -s * 0.36, cy - s * 0.06, s * 0.72, s * 0.12, 3); ctx.fillStyle = '#ff8a1f'; ctx.fill();
  circulo(ctx, 0, cy + s * 0.12, s * 0.15); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = TINTA; ctx.stroke();
  texto(ctx, '?', 0, cy + s * 0.13, s * 0.22, TINTA);
}

function fantasma(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.42, r.w * 0.36), cy = r.y + r.h * 0.55 + Math.sin(t * 3) * 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, cy + s * 0.6);
  ctx.lineTo(-s * 0.7, cy - s * 0.1); ctx.arc(0, cy - s * 0.1, s * 0.7, Math.PI, 0); ctx.lineTo(s * 0.7, cy + s * 0.6);
  for (let i = 0; i < 4; i++) { const x = s * 0.7 - ((i + 0.5) * s * 1.4) / 4; ctx.quadraticCurveTo(x, cy + s * (0.4 + Math.sin(t * 6 + i) * 0.08), x - s * 0.175, cy + s * 0.6); }
  ctx.closePath();
  ctx.fillStyle = '#f5f2ff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = TINTA;
  for (const sx of [-1, 1]) { elipse(ctx, sx * s * 0.24, cy - s * 0.18, s * 0.1, s * 0.15); ctx.fill(); }
  elipse(ctx, 0, cy + s * 0.15, s * 0.14, s * 0.18); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,160,0.5)'; for (const sx of [-1, 1]) { elipse(ctx, sx * s * 0.42, cy, s * 0.1, s * 0.06); ctx.fill(); }
  texto(ctx, 'BU!', s * 0.75, cy - s * 0.85, s * 0.42, ACIDO, { contorno: TINTA, espessura: 3 });
}

function luaX2(ctx, r, op) {
  const s = Math.min(r.h * 0.42, r.w * 0.38), cy = r.y + r.h * 0.56;
  const k = 0.5 + 0.5 * Math.sin((op.t || 0) * 3);
  const g = ctx.createRadialGradient(0, cy, s * 0.5, 0, cy, s * 1.5);
  g.addColorStop(0, `rgba(255,242,179,${0.35 + 0.2 * k})`); g.addColorStop(1, 'rgba(255,242,179,0)');
  ctx.fillStyle = g; circulo(ctx, 0, cy, s * 1.5); ctx.fill();
  circulo(ctx, 0, cy, s); ctx.fillStyle = LUA; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = 'rgba(200,180,110,0.45)';
  for (const [dx, dy, rr0] of [[-0.4, -0.35, 0.18], [0.35, 0.3, 0.14], [0.45, -0.25, 0.1], [-0.3, 0.45, 0.1]]) { circulo(ctx, dx * s, cy + dy * s, rr0 * s); ctx.fill(); }
  texto(ctx, 'x2', 0, cy + 1, s * 0.8, '#8e5bd8', { contorno: '#fff', espessura: 3 });
}

// ------------------------------------------------------------ cenario

function casaAssombrada(ctx, x, y, s) {
  ctx.fillStyle = '#1b1030';
  ctx.beginPath();
  ctx.moveTo(x - s, y); ctx.lineTo(x - s, y - s * 0.7); ctx.lineTo(x - s * 1.15, y - s * 0.7); ctx.lineTo(x - s * 0.5, y - s * 1.35);
  ctx.lineTo(x - s * 0.1, y - s * 0.95); ctx.lineTo(x + s * 0.15, y - s * 1.7); ctx.lineTo(x + s * 0.42, y - s * 1.05);
  ctx.lineTo(x + s * 0.55, y - s * 1.05); ctx.lineTo(x + s * 0.55, y - s * 0.7); ctx.lineTo(x + s * 1.05, y - s * 0.7); ctx.lineTo(x + s * 0.9, y);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(x + s * 0.3, y - s * 1.55, s * 0.12, s * 0.4);
  ctx.fillStyle = '#ffcf5a';
  for (const [dx, dy] of [[-0.7, -0.45], [-0.35, -0.45], [0.05, -1.1], [0.6, -0.45], [-0.5, -0.95]]) rr(ctx, x + dx * s, y + dy * s, s * 0.16, s * 0.2, 2), ctx.fill();
  ctx.fillStyle = '#1b1030'; rr(ctx, x - s * 0.1, y - s * 0.35, s * 0.22, s * 0.35, 3); ctx.fill();
}

function arvoreTorta(ctx, x, y, s) {
  ctx.strokeStyle = '#1b1030'; ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - s * 0.15, y - s * 0.6, x + s * 0.05, y - s * 1.1); ctx.stroke();
  ctx.lineWidth = s * 0.05;
  for (const [a, b, c, d] of [[0.02, -0.8, -0.45, -1.15], [0.05, -1.0, 0.4, -1.35], [-0.05, -0.55, 0.35, -0.75], [-0.1, -0.95, -0.3, -1.4]]) {
    ctx.beginPath(); ctx.moveTo(x + a * s, y + b * s); ctx.quadraticCurveTo(x + (a + c) * 0.5 * s, y + (b + d) * 0.5 * s - s * 0.08, x + c * s, y + d * s); ctx.stroke();
  }
}

const tema = {
  id: 'aboboras',
  nome: 'Noite das Abóboras',
  cores: { texto: LUA, destaque: LARANJA, particulas: [LARANJA, ACIDO, LUA, '#8e5bd8'] },
  faixas: () => ({ topo: 96, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.85, filaFator: 1.0, colar: true }),

  fundo(ctx, W, H, L) {
    const chao = L.chao;
    const g = ctx.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, '#120a26'); g.addColorStop(0.55, NOITE); g.addColorStop(1, '#5b2d6e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rnd = semente(13);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.3 + rnd() * 0.6; circulo(ctx, rnd() * W, rnd() * chao * 0.75, rnd() * 1.4 + 0.3); ctx.fill(); }
    ctx.globalAlpha = 1;
    // lua enorme
    const mx = W * (W > H ? 0.8 : 0.72), my = L.topo + (W > H ? 70 : 92), mr = Math.min(W, H) * (W > H ? 0.12 : 0.17);
    for (let k = 3; k >= 1; k--) { ctx.fillStyle = `rgba(255,242,179,${0.06 * k})`; circulo(ctx, mx, my, mr * (1 + k * 0.28)); ctx.fill(); }
    ctx.fillStyle = LUA; circulo(ctx, mx, my, mr); ctx.fill();
    ctx.fillStyle = 'rgba(220,195,120,0.4)';
    for (const [dx, dy, r0] of [[-0.35, -0.2, 0.2], [0.3, 0.25, 0.16], [0.1, -0.45, 0.1], [-0.2, 0.42, 0.12]]) { circulo(ctx, mx + dx * mr, my + dy * mr, r0 * mr); ctx.fill(); }
    // morros, casa e arvores
    ctx.fillStyle = '#3a2058';
    ctx.beginPath(); ctx.moveTo(0, chao);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, chao - 50 - Math.sin(x / W * Math.PI * 1.6 + 0.4) * 34);
    ctx.lineTo(W, chao); ctx.closePath(); ctx.fill();
    casaAssombrada(ctx, W * (W > H ? 0.12 : 0.2), chao - 60 - Math.sin(0.4) * 34 + 6, W > H ? 60 : 44);
    arvoreTorta(ctx, W * 0.9, chao - 20, W > H ? 120 : 90);
    arvoreTorta(ctx, W * 0.04, chao - 10, 70);
    // cerca
    ctx.fillStyle = '#1f1534';
    for (let x = 6; x < W; x += 16) { ctx.beginPath(); ctx.moveTo(x, chao); ctx.lineTo(x, chao - 22); ctx.lineTo(x + 4, chao - 28); ctx.lineTo(x + 8, chao - 22); ctx.lineTo(x + 8, chao); ctx.closePath(); ctx.fill(); }
    ctx.fillRect(0, chao - 17, W, 3); ctx.fillRect(0, chao - 8, W, 3);
    // chao e grama
    ctx.fillStyle = '#2f3a2c'; ctx.fillRect(0, chao, W, 10);
    ctx.fillStyle = '#3f5a3a';
    for (let x = 0; x < W; x += 6) { ctx.beginPath(); ctx.moveTo(x, chao + 2); ctx.lineTo(x + 3, chao - 4 - (x % 3)); ctx.lineTo(x + 6, chao + 2); ctx.fill(); }
    const t = ctx.createLinearGradient(0, chao + 10, 0, H);
    t.addColorStop(0, '#2a1d3e'); t.addColorStop(1, '#170f26');
    ctx.fillStyle = t; ctx.fillRect(0, chao + 10, W, H);
    // cruzinhas fofas e pedrinhas no chao
    const y0 = L.fila.vertical ? chao + 40 : L.fila.y + L.fila.h + 30;
    for (let i = 0; i < 4; i++) {
      const x = W * (0.12 + i * 0.25) + (rnd() - 0.5) * 30, y = Math.min(H - 20, y0 + 20 + rnd() * Math.max(10, H - y0 - 60));
      ctx.fillStyle = '#5d4f78'; rr(ctx, x - 3, y - 18, 6, 22, 2); ctx.fill(); rr(ctx, x - 9, y - 12, 18, 5, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; elipse(ctx, x, y + 4, 12, 3); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 30; i++) { elipse(ctx, rnd() * W, chao + 20 + rnd() * (H - chao), 2 + rnd() * 5, 1 + rnd() * 2); ctx.fill(); }
  },

  vivo(ctx, W, H, t, e, mem) {
    // morcegos
    for (let i = 0; i < 3; i++) {
      const x = ((i * 157 + t * (30 + i * 9)) % (W + 120)) - 60, y = 130 + i * 40 + Math.sin(t * 1.7 + i) * 18;
      const bat = Math.sin(t * 14 + i * 2);
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#120a20';
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-6, -6 - bat * 6, -16, -bat * 9); ctx.quadraticCurveTo(-11, 1, -8, 3); ctx.quadraticCurveTo(-4, 1, 0, 4);
      ctx.quadraticCurveTo(4, 1, 8, 3); ctx.quadraticCurveTo(11, 1, 16, -bat * 9); ctx.quadraticCurveTo(6, -6 - bat * 6, 0, 0); ctx.fill();
      circulo(ctx, 0, 0, 3.5); ctx.fill();
      ctx.restore();
    }
    // vaga-lumes
    for (let i = 0; i < 10; i++) {
      const x = (i * 97 + Math.sin(t * 0.6 + i) * 30 + W) % W, y = H * 0.35 + ((i * 61) % (H * 0.5)) + Math.cos(t * 0.8 + i * 2) * 14;
      const a = Math.max(0, Math.sin(t * 2.2 + i * 1.3));
      ctx.fillStyle = `rgba(190,255,120,${0.25 * a})`; circulo(ctx, x, y, 6); ctx.fill();
      ctx.fillStyle = `rgba(230,255,170,${0.9 * a})`; circulo(ctx, x, y, 1.8); ctx.fill();
    }
    // nevoa no chao
    const yc = mem && typeof mem.chao === 'number' ? mem.chao : H * 0.6;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 131 + t * (8 + i * 2)) % (W + 200)) - 100;
      ctx.fillStyle = 'rgba(200,190,230,0.08)'; elipse(ctx, x, yc + 4 + (i % 2) * 6, 90, 12); ctx.fill();
    }
  },

  mesa(ctx, L, e, t, mem) {
    mem.chao = L.chao;
    for (let c = 0; c < L.colunas; c++) {
      const a = L.coluna(c);
      // fardo de palha sob a coluna
      rr(ctx, a.x - 3, L.chao - 2, a.w + 6, 9, 3); ctx.fillStyle = '#c9a24a'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.strokeStyle = 'rgba(42,18,54,0.4)'; ctx.lineWidth = 1;
      for (let x = a.x + 4; x < a.x + a.w; x += 6) { ctx.beginPath(); ctx.moveTo(x, L.chao); ctx.lineTo(x - 2, L.chao + 5); ctx.stroke(); }
      if (!e.colunas[c].length) {
        const s = L.carta(c, 0);
        rr(ctx, s.x + 3, s.y + 3, s.w - 6, s.h - 6, 12);
        ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,242,179,0.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        elipse(ctx, s.x + s.w / 2, s.y + s.h * 0.58, s.w * 0.26, s.h * 0.26); ctx.strokeStyle = 'rgba(255,138,31,0.35)'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return lapide(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return gato(ctx, r, op);
    if (carta.tipo === 'bomba') return fantasma(ctx, r, op);
    if (carta.tipo === 'dobro') return luaX2(ctx, r, op);
    abobora(ctx, carta.v, r, op);
    if (carta.gelo) teia(ctx, r, op.t || 0);
  },

  cadeado(ctx, a) {
    ctx.save();
    rr(ctx, a.x - 4, a.y - 10, a.w + 8, a.h + 10, 8); ctx.fillStyle = 'rgba(18,10,38,0.5)'; ctx.fill();
    const y0 = a.y - 6, y1 = a.y + a.h;
    ctx.strokeStyle = '#151020'; ctx.fillStyle = '#151020'; ctx.lineWidth = 3;
    const n = 5;
    for (let k = 0; k < n; k++) {
      const x = a.x + 3 + (k * (a.w - 6)) / (n - 1);
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y0 + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 4, y0 + 9); ctx.lineTo(x, y0); ctx.lineTo(x + 4, y0 + 9); ctx.closePath(); ctx.fill();
    }
    for (const yy of [y0 + 22, y1 - 16]) { ctx.fillRect(a.x - 2, yy, a.w + 4, 4); }
    // arabesco e cadeado
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x + a.w / 2, y0 + 22, a.w * 0.22, Math.PI, 0); ctx.stroke();
    const cx = a.x + a.w / 2, cy = a.y + a.h * 0.55;
    ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy - 6, 7, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 10, cy - 6, 20, 16, 4); ctx.fillStyle = '#ffb020'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = TINTA; circulo(ctx, cx, cy + 1, 2.2); ctx.fill();
    ctx.restore();
  },

  descarte(ctx, r, e) {
    // saco de gostosuras
    const carga = e.descarteCarga > 0;
    const cx = r.x + r.w / 2, base = r.y + r.h - 2, w = r.w * 0.8, h = r.h * 0.82;
    ctx.save();
    if (!carga) ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.36, base - h * 0.75);
    ctx.quadraticCurveTo(cx - w * 0.62, base - h * 0.2, cx - w * 0.4, base);
    ctx.lineTo(cx + w * 0.4, base);
    ctx.quadraticCurveTo(cx + w * 0.62, base - h * 0.2, cx + w * 0.36, base - h * 0.75);
    ctx.closePath();
    ctx.fillStyle = '#7a3fb0'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
    if (carga) {
      // boca aberta com balas aparecendo
      elipse(ctx, cx, base - h * 0.75, w * 0.36, 5); ctx.fillStyle = '#4a2370'; ctx.fill(); ctx.stroke();
      for (const [dx, c] of [[-0.18, '#ff5d8a'], [0.05, '#9be15d'], [0.22, '#ffd23f']]) { circulo(ctx, cx + dx * w, base - h * 0.8, 4); ctx.fillStyle = c; ctx.fill(); }
    } else {
      ctx.beginPath(); ctx.moveTo(cx - w * 0.2, base - h * 0.75); ctx.lineTo(cx, base - h * 0.95); ctx.lineTo(cx + w * 0.2, base - h * 0.75); ctx.fillStyle = '#7a3fb0'; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = LARANJA; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cx - w * 0.22, base - h * 0.76); ctx.lineTo(cx + w * 0.22, base - h * 0.76); ctx.stroke();
    }
    texto(ctx, carga ? 'doces' : 'zzz', cx, base - h * 0.32, Math.min(11, r.w * 0.18), LUA);
    ctx.restore();
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) {
      rr(ctx, f.x + 2, f.y - 4, f.w - 4, f.h + 8, 10); ctx.fillStyle = 'rgba(80,48,30,0.85)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.strokeStyle = 'rgba(30,12,8,0.45)'; ctx.lineWidth = 1.5;
      for (let yy = f.y + 26; yy < f.y + f.h; yy += 28) { ctx.beginPath(); ctx.moveTo(f.x + 6, yy); ctx.lineTo(f.x + f.w - 6, yy); ctx.stroke(); }
      for (const wy of [f.y + f.h * 0.35, f.y + f.h * 0.8]) {
        circulo(ctx, f.x + 2, wy, 12); ctx.fillStyle = '#5a3a22'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
        circulo(ctx, f.x + 2, wy, 3); ctx.fillStyle = '#c9a24a'; ctx.fill();
      }
      // lanterna no alto
      const lx = f.x + f.w / 2, ly = f.y - 18;
      rr(ctx, lx - 8, ly - 10, 16, 18, 4); ctx.fillStyle = '#ffcf5a'; ctx.fill(); ctx.stroke();
      texto(ctx, 'carroça', lx, f.y + f.h + 18, 12, LUA, { contorno: TINTA, espessura: 3 });
      return;
    }
    // carroca de madeira
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, p2.x) - 16, x1 = Math.max(p0.x + p0.w, p2.x + p2.w) + 16;
    const yb = p0.y + p0.h - 6;
    rr(ctx, x0, yb, x1 - x0, 16, 4); ctx.fillStyle = '#8a5a34'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.strokeStyle = 'rgba(42,18,54,0.45)'; ctx.lineWidth = 1.2;
    for (let x = x0 + 14; x < x1; x += 22) { ctx.beginPath(); ctx.moveTo(x, yb + 2); ctx.lineTo(x, yb + 14); ctx.stroke(); }
    for (const wx of [x0 + 28, x1 - 28]) {
      circulo(ctx, wx, yb + 20, 13); ctx.fillStyle = '#5a3a22'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 4; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * 11, yb + 20 - Math.sin(a) * 11); ctx.lineTo(wx + Math.cos(a) * 11, yb + 20 + Math.sin(a) * 11); ctx.stroke(); }
      circulo(ctx, wx, yb + 20, 3); ctx.fillStyle = '#c9a24a'; ctx.fill();
    }
    ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, yb + 6); ctx.lineTo(x1 + 26, yb - 6); ctx.stroke();
    texto(ctx, 'próxima ▸', p0.x + p0.w / 2, p0.y - 12, 12, LUA, { contorno: TINTA, espessura: 3 });
  },

  hud(ctx, W, H, L, e, t) {
    const x = 10, y = 10, w = W - 20, h = 76;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 10); ctx.fillStyle = '#6b4126'; ctx.fill();
    ctx.restore();
    // tabuas
    ctx.save(); rr(ctx, x, y, w, h, 10); ctx.clip();
    ctx.strokeStyle = 'rgba(30,12,8,0.4)'; ctx.lineWidth = 1.5;
    for (const yy of [y + h / 3, y + (2 * h) / 3]) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    ctx.restore();
    rr(ctx, x, y, w, h, 10); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a140c'; ctx.stroke();
    ctx.fillStyle = '#c9b38a'; for (const [px, py] of [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]]) { circulo(ctx, px, py, 2.4); ctx.fill(); }
    // teia no canto
    ctx.strokeStyle = 'rgba(240,240,255,0.55)'; ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) { const a = (k / 4) * (Math.PI / 2); ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 2 + Math.cos(a) * 34, y + 2 + Math.sin(a) * 34); ctx.stroke(); }
    for (const rk of [12, 22, 32]) { ctx.beginPath(); ctx.arc(x + 2, y + 2, rk, 0, Math.PI / 2); ctx.stroke(); }
    texto(ctx, 'noite', x + 40, y + 24, 11, '#ffd9a8');
    texto(ctx, String(e.faseId), x + 40, y + 48, 26, LARANJA, { contorno: TINTA, espessura: 4 });
    const mx = x + 76, mw = w - 76 - 92;
    e.metas.forEach((m, k) => {
      const yy = y + 16 + k * 30;
      texto(ctx, textoMeta(m, { monte: (n) => 'Coroe ' + n + ' rei abóbora' }), mx, yy + 4, 12, '#fff2d6', { alinhar: 'left', max: mw });
      rr(ctx, mx, yy + 13, mw, 8, 4); ctx.fillStyle = 'rgba(20,8,4,0.55)'; ctx.fill();
      rr(ctx, mx, yy + 13, Math.max(8, mw * Math.min(1, m.atual / m.alvo)), 8, 4); ctx.fillStyle = m.feita ? ACIDO : LARANJA; ctx.fill();
    });
    // pontos com bala
    const px = x + w - 46;
    ctx.save(); ctx.translate(px, y + 24);
    ctx.fillStyle = '#ff5d8a'; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.3;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 7, 0); ctx.lineTo(s * 15, -6); ctx.lineTo(s * 15, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    circulo(ctx, 0, 0, 8); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 4.5, -2.5, -0.4); ctx.stroke();
    ctx.restore();
    texto(ctx, String(e.pontos), px, y + 52, 18, '#fff2d6', { max: 84 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      texto(ctx, 'LUA CHEIA x2!', W / 2, y + h + 20, 21 + k * 3, LUA, { contorno: '#8e5bd8', espessura: 5 + k * 2 });
    }
  },

  efeito(fx, P) {
    if (!P.formas.folha) {
      P.formas.folha = (ctx, p) => {
        const s = p.tam / 2;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s, 0, 0, s); ctx.quadraticCurveTo(-s, 0, 0, -s); ctx.fill();
        ctx.strokeStyle = 'rgba(60,20,0,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
      };
      P.formas.morcego = (ctx, p, u) => {
        const s = p.tam / 2, b = Math.sin(u * 40);
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-s * 0.4, -s * 0.4 - b * s * 0.4, -s, -b * s * 0.5); ctx.quadraticCurveTo(-s * 0.5, s * 0.2, 0, s * 0.3);
        ctx.quadraticCurveTo(s * 0.5, s * 0.2, s, -b * s * 0.5); ctx.quadraticCurveTo(s * 0.4, -s * 0.4 - b * s * 0.4, 0, 0); ctx.fill();
      };
      P.formas.bala = (ctx, p) => {
        const s = p.tam / 2;
        ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s, -s * 0.5); ctx.lineTo(-s, s * 0.5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s * 0.5, 0); ctx.lineTo(s, -s * 0.5); ctx.lineTo(s, s * 0.5); ctx.closePath(); ctx.fill();
        circulo(ctx, 0, 0, s * 0.55); ctx.fill();
      };
      P.formas.fio = (ctx, p, u) => {
        ctx.strokeStyle = p.cor; ctx.lineWidth = 1.2; ctx.globalAlpha *= 1 - u * 0.5;
        ctx.beginPath(); ctx.arc(0, 0, p.tam, 0, Math.PI * 0.7); ctx.stroke();
      };
    }
    switch (fx.tipo) {
      case 'pouso': P.estourar(fx.x, fx.y + 18, ['#c46a1b', '#e2a040', '#8a4a20'], 5, 0.35, { g: 90, vida: 0.8, tam: 8, forma: 'folha' }); return true;
      case 'fusao': {
        const cor = CORES[Math.min(11, nivel(fx.valor))];
        P.estourar(fx.x, fx.y, [LARANJA, '#ffd23f', cor], 10 + fx.degrau * 3, 0.7 + fx.degrau * 0.12, { forma: 'c', tam: 5, g: 300 });
        for (let k = 0; k < 2 + Math.min(3, fx.degrau); k++) P.add({ forma: 'morcego', x: fx.x, y: fx.y, vx: (k % 2 ? 1 : -1) * (60 + k * 30), vy: -120 - k * 25, g: -20, vida: 0.9, tam: 16, cor: '#1a0e28', arrasto: 0.99 });
        P.anel(fx.x, fx.y, LUA, 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, 'x' + fx.degrau, LARANJA, 22 + fx.degrau * 2, TINTA);
        return true;
      }
      case 'completar':
        P.estourar(fx.x, fx.y, ['#ff5d8a', ACIDO, '#ffd23f', '#5ad1ff', '#b58cff'], 34, 1.6, { forma: 'bala', tam: 12, g: 420 });
        P.estourar(fx.x, fx.y, [LUA, '#ffffff'], 14, 1.1, { forma: 'estrela', tam: 11, g: 200 });
        P.texto(fx.x, fx.y - 34, 'Viva o Rei!', LUA, 28, '#8e3bd8');
        return true;
      case 'explodir':
        P.subir(fx.x, fx.y, ['rgba(155,225,93,0.65)', 'rgba(120,200,90,0.55)', 'rgba(220,255,200,0.5)'], 12, { tam: 18, vida: 1.0, larg: 40, forca: 1.2 });
        P.texto(fx.x, fx.y - 20, 'BU!', ACIDO, 26, TINTA);
        return true;
      case 'pedra': P.estourar(fx.x, fx.y, ['#a7a4b8', '#8d8aa0', '#c9c6d8'], 18, 1.2, { forma: 'q', tam: 7 }); return true;
      case 'racha': P.estourar(fx.x, fx.y, ['#a7a4b8', '#c9c6d8'], 7, 0.6, { forma: 'q', tam: 5 }); return true;
      case 'gelo':
        for (let k = 0; k < 8; k++) P.add({ forma: 'fio', x: fx.x + (k - 4) * 6, y: fx.y, vx: (k - 4) * 22, vy: -40 - k * 6, g: 160, vida: 0.7, tam: 8 + k, rot: k, vr: 3, cor: 'rgba(245,245,255,0.9)' });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#ffb020', '#8a8f98', '#ffffff'], 16, 1, { forma: 'q', tam: 6 });
        P.texto(fx.x, fx.y - 20, 'Portão aberto!', LUA, 18, TINTA);
        return true;
      case 'combo': P.texto(fx.x, fx.y - 44, `Combo x${fx.n}!`, LARANJA, 22, TINTA); return true;
      default: return false;
    }
  },
};

export default tema;
