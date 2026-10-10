// Ideia 2: Esteira de Sushi. A fila e a esteira trazendo pratos; as colunas
// sao pilhas de pratos no balcao; pratos iguais viram um prato melhor e a cor
// do prato diz o valor (como no kaiten de verdade). O 2048 e o barco de sushi
// que sai para o cliente. Geometria padrao de cartas (pratos em leque).
import { TAU, rr, circulo, elipse, texto, escurecer, rgba, estrela, nivel, textoMeta, semente, clamp } from '../kit.js';

const CONTORNO = '#3a2418';
const CREME = '#fff4e0';
const LACA = '#d6403a';
const INDIGO = '#2b3a67';
const SALMAO = '#ff8a65';
const MATCHA = '#8bc34a';

/** Cor da borda do prato por nivel (2..4096) e a comida em cima. */
const PRATOS = [
  { cor: '#f4f1ea', comida: 'maki' },
  { cor: '#5dbb63', comida: 'tamago' },
  { cor: '#f6c445', comida: 'onigiri' },
  { cor: '#3f8ad8', comida: 'salmao' },
  { cor: '#e04a3f', comida: 'ikura' },
  { cor: '#8b5cc7', comida: 'ebi' },
  { cor: '#f07aa6', comida: 'temaki' },
  { cor: '#f39237', comida: 'dango' },
  { cor: '#2ab3a6', comida: 'taiyaki' },
  { cor: '#2a2530', comida: 'mochi', laca: true },
  { cor: '#e9b949', comida: 'barco' },
  { cor: '#ffd54a', comida: 'barco', dourado: true },
];
const pratoDe = (v) => PRATOS[Math.min(nivel(v), PRATOS.length - 1)];

function claro(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}
function contornar(ctx, l = 1.6) { ctx.lineWidth = l; ctx.strokeStyle = CONTORNO; ctx.stroke(); }

/** Rostinho kawaii: olhos, boquinha e bochechas. `luz` = olhos claros (sobre nori). */
function carinha(ctx, x, y, s, luz = false) {
  const olho = luz ? '#fff7ec' : '#2b1d16';
  const ro = Math.max(1.3, s * 0.075);
  for (const k of [-1, 1]) {
    ctx.fillStyle = olho; circulo(ctx, x + k * s * 0.26, y, ro); ctx.fill();
    if (!luz) { ctx.fillStyle = '#fff'; circulo(ctx, x + k * s * 0.26 + ro * 0.35, y - ro * 0.35, ro * 0.38); ctx.fill(); }
  }
  ctx.beginPath(); ctx.arc(x, y + s * 0.06, Math.max(1.4, s * 0.09), 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = olho; ctx.lineWidth = Math.max(1, s * 0.045); ctx.lineCap = 'round'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,105,135,0.55)';
  for (const k of [-1, 1]) { elipse(ctx, x + k * s * 0.44, y + s * 0.1, s * 0.11, s * 0.07); ctx.fill(); }
}

// ------------------------------------------------------------ comidas
// Cada comida e desenhada centrada em (x, y) com tamanho s (~ raio do miolo do prato).

function maki(ctx, x, y, s) {
  const w = s * 1.1, h = s * 0.62, ty = y - h * 0.5;
  rr(ctx, x - w / 2, ty, w, h, s * 0.12); ctx.fillStyle = '#1f3a2a'; ctx.fill(); contornar(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x - w / 2 + 3, ty + 2, w * 0.18, h - 4);
  elipse(ctx, x, ty, w / 2, s * 0.26); ctx.fillStyle = '#fffdf6'; ctx.fill(); contornar(ctx);
  elipse(ctx, x, ty, w * 0.2, s * 0.1); ctx.fillStyle = '#7cc35a'; ctx.fill();
  elipse(ctx, x, ty, w * 0.1, s * 0.05); ctx.fillStyle = '#c9ef9a'; ctx.fill();
  carinha(ctx, x, y + s * 0.02, s, true);
}

function tamago(ctx, x, y, s) {
  rr(ctx, x - s * 0.66, y - s * 0.02, s * 1.32, s * 0.46, s * 0.2); ctx.fillStyle = '#fffdf6'; ctx.fill(); contornar(ctx);
  rr(ctx, x - s * 0.72, y - s * 0.42, s * 1.44, s * 0.5, s * 0.14); ctx.fillStyle = '#ffd34d'; ctx.fill(); contornar(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; rr(ctx, x - s * 0.62, y - s * 0.38, s * 0.9, s * 0.1, s * 0.05); ctx.fill();
  rr(ctx, x + s * 0.24, y - s * 0.45, s * 0.26, s * 0.92, s * 0.06); ctx.fillStyle = '#1f3a2a'; ctx.fill(); contornar(ctx, 1.2);
  carinha(ctx, x - s * 0.22, y - s * 0.16, s * 0.85);
}

function onigiri(ctx, x, y, s) {
  const h = s * 1.15;
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.62);
  ctx.quadraticCurveTo(x + s * 0.15, y - h * 0.68, x + s * 0.72, y + h * 0.28);
  ctx.quadraticCurveTo(x + s * 0.78, y + h * 0.42, x + s * 0.55, y + h * 0.42);
  ctx.lineTo(x - s * 0.55, y + h * 0.42);
  ctx.quadraticCurveTo(x - s * 0.78, y + h * 0.42, x - s * 0.72, y + h * 0.28);
  ctx.quadraticCurveTo(x - s * 0.15, y - h * 0.68, x, y - h * 0.62);
  ctx.closePath();
  ctx.fillStyle = '#fffdf6'; ctx.fill(); contornar(ctx);
  rr(ctx, x - s * 0.3, y + h * 0.05, s * 0.6, h * 0.37, s * 0.05); ctx.fillStyle = '#1f3a2a'; ctx.fill(); contornar(ctx, 1.2);
  ctx.fillStyle = '#3a2a1e';
  for (const [dx, dy] of [[-0.3, -0.2], [0.25, -0.12], [0.05, -0.38]]) { elipse(ctx, x + dx * s, y + dy * s, 1.3, 0.8, 0.6); ctx.fill(); }
  carinha(ctx, x, y - h * 0.08, s * 0.8);
}

function salmao(ctx, x, y, s) {
  elipse(ctx, x, y + s * 0.16, s * 0.64, s * 0.3); ctx.fillStyle = '#fffdf6'; ctx.fill(); contornar(ctx);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.82, y - s * 0.02);
  ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.5, x + s * 0.3, y - s * 0.36);
  ctx.quadraticCurveTo(x + s * 0.9, y - s * 0.26, x + s * 0.82, y + s * 0.08);
  ctx.quadraticCurveTo(x, y + s * 0.18, x - s * 0.82, y - s * 0.02);
  ctx.closePath();
  ctx.fillStyle = SALMAO; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.2, s * 0.07);
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * s * 0.32 - s * 0.2, y + s * 0.2); ctx.lineTo(x + k * s * 0.32 + s * 0.15, y - s * 0.5); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.82, y - s * 0.02);
  ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.5, x + s * 0.3, y - s * 0.36);
  ctx.quadraticCurveTo(x + s * 0.9, y - s * 0.26, x + s * 0.82, y + s * 0.08);
  ctx.quadraticCurveTo(x, y + s * 0.18, x - s * 0.82, y - s * 0.02);
  contornar(ctx);
  carinha(ctx, x - s * 0.02, y - s * 0.12, s * 0.8);
}

function ikura(ctx, x, y, s) {
  const w = s * 1.15, h = s * 0.6, ty = y - h * 0.35;
  rr(ctx, x - w / 2, ty, w, h, s * 0.14); ctx.fillStyle = '#1f3a2a'; ctx.fill(); contornar(ctx);
  elipse(ctx, x, ty, w / 2, s * 0.24); ctx.fillStyle = '#fffdf6'; ctx.fill(); contornar(ctx);
  const rnd = semente(4);
  for (let i = 0; i < 9; i++) {
    const a = rnd() * TAU, d = rnd() * 0.75;
    const bx = x + Math.cos(a) * w * 0.38 * d, by = ty - s * 0.06 + Math.sin(a) * s * 0.16 * d - rnd() * s * 0.08;
    circulo(ctx, bx, by, s * 0.13); ctx.fillStyle = '#ff6a1f'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#b8400f'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; circulo(ctx, bx - s * 0.04, by - s * 0.04, s * 0.035); ctx.fill();
  }
  elipse(ctx, x + w * 0.38, ty - s * 0.12, s * 0.18, s * 0.08, -0.5); ctx.fillStyle = '#9ccf6b'; ctx.fill(); contornar(ctx, 1);
  carinha(ctx, x, ty + h * 0.55, s * 0.85, true);
}

function ebi(ctx, x, y, s) {
  // folha de shiso por baixo
  elipse(ctx, x, y + s * 0.08, s * 0.8, s * 0.34, -0.15); ctx.fillStyle = '#4f9a3a'; ctx.fill(); contornar(ctx, 1.2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - s * 0.7, y + s * 0.2); ctx.lineTo(x + s * 0.7, y - s * 0.04); ctx.stroke();
  // cauda
  ctx.beginPath(); ctx.moveTo(x + s * 0.5, y - s * 0.12); ctx.lineTo(x + s * 0.92, y - s * 0.46); ctx.lineTo(x + s * 0.98, y - s * 0.08); ctx.closePath();
  ctx.fillStyle = '#ff5a3c'; ctx.fill(); contornar(ctx, 1.2);
  // corpo empanado curvo
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.62, y + s * 0.02); ctx.quadraticCurveTo(x - s * 0.05, y - s * 0.55, x + s * 0.55, y - s * 0.16);
  ctx.strokeStyle = CONTORNO; ctx.lineWidth = s * 0.58; ctx.stroke();
  ctx.strokeStyle = '#f2b84b'; ctx.lineWidth = s * 0.48; ctx.stroke();
  ctx.fillStyle = '#d99230';
  const rnd = semente(9);
  for (let i = 0; i < 10; i++) { const u = rnd(); const px = x - s * 0.55 + u * s * 1.05, py = y - s * 0.2 - Math.sin(u * Math.PI) * s * 0.18 + (rnd() - 0.5) * s * 0.2; circulo(ctx, px, py, s * 0.04); ctx.fill(); }
  carinha(ctx, x - s * 0.22, y - s * 0.18, s * 0.7);
}

function temaki(ctx, x, y, s) {
  // recheio saindo do cone
  circulo(ctx, x - s * 0.1, y - s * 0.42, s * 0.36); ctx.fillStyle = '#fffdf6'; ctx.fill(); contornar(ctx, 1.2);
  elipse(ctx, x + s * 0.18, y - s * 0.5, s * 0.26, s * 0.14, -0.6); ctx.fillStyle = SALMAO; ctx.fill(); contornar(ctx, 1.2);
  rr(ctx, x - s * 0.42, y - s * 0.78, s * 0.12, s * 0.42, 2); ctx.fillStyle = '#7cc35a'; ctx.fill(); contornar(ctx, 1);
  // cone de nori
  ctx.beginPath(); ctx.moveTo(x - s * 0.6, y - s * 0.3); ctx.lineTo(x + s * 0.5, y - s * 0.36); ctx.lineTo(x + s * 0.02, y + s * 0.62); ctx.closePath();
  ctx.fillStyle = '#1f3a2a'; ctx.fill(); contornar(ctx);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 0.25); ctx.lineTo(x - s * 0.02, y + s * 0.45); ctx.stroke();
  carinha(ctx, x - s * 0.04, y - s * 0.08, s * 0.72, true);
}

function dango(ctx, x, y, s) {
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.85, y + s * 0.35); ctx.lineTo(x + s * 0.85, y - s * 0.35);
  ctx.strokeStyle = CONTORNO; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#e6c58f'; ctx.lineWidth = 2.4; ctx.stroke();
  const cores = ['#9ccf6b', '#fff6ea', '#f6a5c0'];
  cores.forEach((c, i) => {
    const u = (i - 1) * 0.46;
    const bx = x + u * s, by = y - u * s * 0.42;
    circulo(ctx, bx, by, s * 0.3); ctx.fillStyle = c; ctx.fill(); contornar(ctx);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; circulo(ctx, bx - s * 0.1, by - s * 0.1, s * 0.07); ctx.fill();
  });
  carinha(ctx, x, y - s * 0.02, s * 0.62);
}

function taiyaki(ctx, x, y, s) {
  const cor = '#d9903f';
  ctx.beginPath(); ctx.moveTo(x + s * 0.45, y); ctx.lineTo(x + s * 0.88, y - s * 0.32); ctx.lineTo(x + s * 0.86, y + s * 0.3); ctx.closePath();
  ctx.fillStyle = cor; ctx.fill(); contornar(ctx);
  elipse(ctx, x - s * 0.08, y, s * 0.62, s * 0.4); ctx.fillStyle = cor; ctx.fill(); contornar(ctx);
  ctx.save(); elipse(ctx, x - s * 0.08, y, s * 0.62, s * 0.4); ctx.clip();
  ctx.strokeStyle = 'rgba(120,60,10,0.45)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(x - s * 0.05 + i * s * 0.2, y - s * 0.12 + j * s * 0.22, s * 0.1, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,230,170,0.5)'; elipse(ctx, x - s * 0.2, y - s * 0.2, s * 0.25, s * 0.08, -0.2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(x - s * 0.1, y - s * 0.36); ctx.quadraticCurveTo(x + s * 0.05, y - s * 0.6, x + s * 0.25, y - s * 0.34); ctx.fillStyle = cor; ctx.fill(); contornar(ctx, 1.2);
  ctx.fillStyle = '#2b1d16'; circulo(ctx, x - s * 0.42, y - s * 0.08, Math.max(1.5, s * 0.08)); ctx.fill();
  ctx.fillStyle = '#fff'; circulo(ctx, x - s * 0.4, y - s * 0.1, Math.max(0.6, s * 0.03)); ctx.fill();
  ctx.beginPath(); ctx.arc(x - s * 0.55, y + s * 0.08, s * 0.08, -0.2 * Math.PI, 0.6 * Math.PI); ctx.strokeStyle = '#2b1d16'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,105,135,0.5)'; elipse(ctx, x - s * 0.3, y + s * 0.08, s * 0.09, s * 0.06); ctx.fill();
}

function mochi(ctx, x, y, s) {
  // folha de sakura atras
  elipse(ctx, x + s * 0.42, y - s * 0.18, s * 0.38, s * 0.2, -0.7); ctx.fillStyle = '#5fa04a'; ctx.fill(); contornar(ctx, 1.2);
  const g = ctx.createRadialGradient(x - s * 0.2, y - s * 0.25, s * 0.1, x, y, s * 0.75);
  g.addColorStop(0, '#fff3f7'); g.addColorStop(1, '#f7b6cd');
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.8, y - s * 0.5, x + s * 0.8, y - s * 0.5, x + s * 0.7, y + s * 0.3);
  ctx.quadraticCurveTo(x, y + s * 0.48, x - s * 0.7, y + s * 0.3);
  ctx.closePath();
  ctx.fillStyle = g; ctx.fill(); contornar(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const rnd = semente(13);
  for (let i = 0; i < 8; i++) { circulo(ctx, x + (rnd() - 0.5) * s, y - s * 0.1 + (rnd() - 0.5) * s * 0.5, 0.9); ctx.fill(); }
  carinha(ctx, x, y - s * 0.02, s * 0.8);
}

/** Barco de sushi (2048; dourado com coroa no 4096). */
function barco(ctx, cx, cy, w, h, dourado) {
  const madeira = dourado ? '#f4c430' : '#b97a45';
  const esc = escurecer(madeira, 0.25);
  // sombra
  elipse(ctx, cx, cy + h * 0.42, w * 0.5, h * 0.16); ctx.fillStyle = 'rgba(60,35,20,0.25)'; ctx.fill();
  // casco
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.52, cy - h * 0.18);
  ctx.quadraticCurveTo(cx - w * 0.6, cy - h * 0.42, cx - w * 0.44, cy - h * 0.46);
  ctx.lineTo(cx - w * 0.38, cy - h * 0.12);
  ctx.lineTo(cx + w * 0.38, cy - h * 0.12);
  ctx.lineTo(cx + w * 0.5, cy - h * 0.34);
  ctx.quadraticCurveTo(cx + w * 0.58, cy - h * 0.1, cx + w * 0.42, cy + h * 0.28);
  ctx.quadraticCurveTo(cx, cy + h * 0.44, cx - w * 0.42, cy + h * 0.28);
  ctx.quadraticCurveTo(cx - w * 0.54, cy + h * 0.1, cx - w * 0.52, cy - h * 0.18);
  ctx.closePath();
  ctx.fillStyle = madeira; ctx.fill(); contornar(ctx);
  ctx.save(); ctx.clip();
  ctx.strokeStyle = rgba(esc, 0.55); ctx.lineWidth = 1.2;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(cx - w * 0.5, cy + h * (0.02 + k * 0.1)); ctx.quadraticCurveTo(cx, cy + h * (0.14 + k * 0.1), cx + w * 0.5, cy + h * (0.02 + k * 0.1)); ctx.stroke(); }
  ctx.restore();
  // convés com sushis
  elipse(ctx, cx, cy - h * 0.12, w * 0.4, h * 0.13); ctx.fillStyle = esc; ctx.fill(); contornar(ctx, 1.2);
  const s = h * 0.32;
  salmao(ctx, cx - w * 0.2, cy - h * 0.2, s * 0.7);
  maki(ctx, cx + w * 0.02, cy - h * 0.2, s * 0.62);
  tamago(ctx, cx + w * 0.24, cy - h * 0.18, s * 0.6);
  // proa com rostinho
  carinha(ctx, cx, cy + h * 0.14, h * 0.32);
  if (dourado) {
    const py = cy - h * 0.5, pw = w * 0.26;
    ctx.beginPath(); ctx.moveTo(cx - pw / 2, py); ctx.lineTo(cx - pw / 2, py - h * 0.16); ctx.lineTo(cx - pw / 4, py - h * 0.07); ctx.lineTo(cx, py - h * 0.2); ctx.lineTo(cx + pw / 4, py - h * 0.07); ctx.lineTo(cx + pw / 2, py - h * 0.16); ctx.lineTo(cx + pw / 2, py); ctx.closePath();
    ctx.fillStyle = '#fff1a8'; ctx.fill(); contornar(ctx, 1.2);
  }
}

const COMIDAS = { maki, tamago, onigiri, salmao, ikura, ebi, temaki, dango, taiyaki, mochi };

// ------------------------------------------------------------ prato e pecas

/** Geometria do prato dentro do retangulo da peca (o prato ocupa o alto da carta). */
function geoPrato(r) {
  const rx = r.w * 0.5;
  const ry = Math.min(r.h * 0.3, rx * 0.78);
  const cy = r.y + Math.max(r.h * 0.43, ry + r.h * 0.13);
  return { cx: 0, cy, rx, ry };
}

function prato(ctx, g, cor, op = {}) {
  const { cx, cy, rx, ry } = g;
  elipse(ctx, cx, cy + ry * 0.22, rx * 1.02, ry * 0.95); ctx.fillStyle = 'rgba(70,40,20,0.22)'; ctx.fill();
  elipse(ctx, cx, cy + ry * 0.1, rx, ry); ctx.fillStyle = escurecer(cor, 0.28); ctx.fill(); contornar(ctx);
  elipse(ctx, cx, cy, rx, ry);
  if (op.arcoiris) {
    const cg = ctx.createConicGradient(op.t || 0, cx, cy);
    ['#ff5d73', '#ffb43f', '#ffe066', '#6cc551', '#3fa7ff', '#a77bff', '#ff5d73'].forEach((c, i, a) => cg.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = cg;
  } else ctx.fillStyle = cor;
  ctx.fill(); contornar(ctx);
  // fio decorativo na aba
  elipse(ctx, cx, cy, rx * 0.88, ry * 0.88);
  ctx.strokeStyle = op.laca ? '#e2b44a' : (claro(cor) ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.55)'); ctx.lineWidth = 1.1; ctx.stroke();
  // miolo
  const gm = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
  gm.addColorStop(0, '#fffaf1'); gm.addColorStop(1, '#ece2d0');
  elipse(ctx, cx, cy + ry * 0.04, rx * 0.72, ry * 0.7); ctx.fillStyle = gm; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(58,36,24,0.25)'; ctx.stroke();
  // brilho
  ctx.save(); elipse(ctx, cx, cy, rx, ry); ctx.clip();
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.15, cy - ry * 0.05, rx * 0.95, ry * 0.92, 0, Math.PI * 1.08, Math.PI * 1.42);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = Math.max(1.5, rx * 0.07); ctx.stroke();
  ctx.restore();
}

/** Bandeirinha no palito com o numero (fica no alto: legivel com a peca coberta). */
function bandeira(ctx, r, txt, cor, op = {}) {
  const tam = Math.max(10.5, Math.min(r.h * 0.155, r.w * 0.25));
  ctx.save();
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const tw = Math.max(ctx.measureText(txt).width + tam * 0.9, r.w * 0.46);
  const fh = tam * 1.18;
  const fx = -tw / 2 - tam * 0.12, fy = r.y + 1;
  // palito
  ctx.strokeStyle = '#8a6a3c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx + 2, fy + 1); ctx.lineTo(fx + 2 + tam * 0.25, fy + fh + tam * 0.9); ctx.stroke();
  ctx.strokeStyle = '#e8cf9e'; ctx.lineWidth = 1; ctx.stroke();
  // bandeira com rabo de andorinha
  ctx.beginPath();
  ctx.moveTo(fx + 2, fy); ctx.lineTo(fx + tw, fy); ctx.lineTo(fx + tw - tam * 0.35, fy + fh / 2); ctx.lineTo(fx + tw, fy + fh); ctx.lineTo(fx + 2, fy + fh); ctx.closePath();
  ctx.fillStyle = op.fundo || '#fffaf0'; ctx.fill(); contornar(ctx, 1.4);
  ctx.save(); ctx.clip(); ctx.fillStyle = cor; ctx.fillRect(fx + 2, fy, tam * 0.32, fh); ctx.restore();
  texto(ctx, txt, fx + 2 + tam * 0.32 + (tw - tam * 0.32 - tam * 0.35) / 2, fy + fh / 2 + 0.5, tam, op.tinta || CONTORNO);
  ctx.restore();
}

function pratoNormal(ctx, carta, r, op) {
  const P = pratoDe(carta.v);
  const g = geoPrato(r);
  if (op.destaque) {
    elipse(ctx, g.cx, g.cy + g.ry * 0.05, g.rx + 4, g.ry + 4);
    ctx.strokeStyle = `rgba(255,255,255,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
  if (P.comida === 'barco') {
    barco(ctx, g.cx, g.cy + g.ry * 0.1, r.w * 1.0, g.ry * 2.2, P.dourado);
  } else {
    prato(ctx, g, P.cor, { laca: P.laca });
    COMIDAS[P.comida](ctx, g.cx, g.cy + g.ry * 0.02, g.rx * 0.6);
  }
  if (carta.gelo) cloche(ctx, g);
  bandeira(ctx, r, String(carta.v), P.cor);
}

/** Tampa de vidro com geada sobre o prato congelado. */
function cloche(ctx, g) {
  const { cx, cy, rx, ry } = g;
  const topo = cy - ry * 1.55;
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.9, cy + ry * 0.15);
  ctx.bezierCurveTo(cx - rx * 0.95, topo, cx + rx * 0.95, topo, cx + rx * 0.9, cy + ry * 0.15);
  ctx.ellipse(cx, cy + ry * 0.15, rx * 0.9, ry * 0.5, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = 'rgba(190,232,255,0.5)'; ctx.fill();
  ctx.strokeStyle = '#f2fbff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - rx * 0.55, cy - ry * 0.1); ctx.quadraticCurveTo(cx - rx * 0.5, cy - ry * 0.9, cx - rx * 0.15, cy - ry * 1.05); ctx.stroke();
  elipse(ctx, cx, topo + ry * 0.28, rx * 0.12, ry * 0.12); ctx.fillStyle = '#e8f7ff'; ctx.fill(); ctx.strokeStyle = '#9fcfe8'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const rnd = semente(21);
  for (let i = 0; i < 12; i++) { circulo(ctx, cx + (rnd() - 0.5) * rx * 1.5, cy + ry * 0.15 - rnd() * ry * 1.2, 0.6 + rnd() * 1.1); ctx.fill(); }
  // floco
  const fx = cx + rx * 0.62, fy = cy - ry * 0.75;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * 5, fy - Math.sin(a) * 5); ctx.lineTo(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5); ctx.stroke(); }
}

/** Pote de ceramica pesado (pedra), com rachaduras e hp na tampa. */
function pote(ctx, r, hp) {
  const g = geoPrato(r);
  const w = r.w * 0.86, cy = g.cy + g.ry * 0.15, h = g.ry * 1.7;
  elipse(ctx, 0, cy + h * 0.45, w * 0.52, h * 0.14); ctx.fillStyle = 'rgba(70,40,20,0.25)'; ctx.fill();
  const corpo = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, cy - h * 0.18);
    ctx.bezierCurveTo(-w * 0.62, cy + h * 0.1, -w * 0.4, cy + h * 0.5, 0, cy + h * 0.48);
    ctx.bezierCurveTo(w * 0.4, cy + h * 0.5, w * 0.62, cy + h * 0.1, w * 0.42, cy - h * 0.18);
    ctx.closePath();
  };
  corpo(); ctx.fillStyle = '#a8572f'; ctx.fill();
  ctx.save(); corpo(); ctx.clip();
  // vidrado escorrendo
  ctx.beginPath(); ctx.moveTo(-w * 0.6, cy - h * 0.25);
  for (let k = 0; k <= 8; k++) { const x = -w * 0.6 + (k / 8) * w * 1.2; ctx.lineTo(x, cy - h * 0.02 + (k % 2 ? h * 0.12 : 0)); }
  ctx.lineTo(w * 0.6, cy - h * 0.25); ctx.closePath();
  ctx.fillStyle = '#efe2c8'; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-w, cy + h * 0.28, w * 2, h);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; elipse(ctx, -w * 0.25, cy + h * 0.12, w * 0.07, h * 0.16); ctx.fill();
  ctx.restore();
  corpo(); contornar(ctx, 1.8);
  // tampa
  elipse(ctx, 0, cy - h * 0.2, w * 0.44, h * 0.13); ctx.fillStyle = '#7d3f22'; ctx.fill(); contornar(ctx, 1.6);
  elipse(ctx, 0, cy - h * 0.26, w * 0.12, h * 0.07); ctx.fillStyle = '#5f2f19'; ctx.fill(); contornar(ctx, 1.2);
  // rachaduras pelo hp perdido
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  ctx.strokeStyle = '#2f1a10'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const rach = [[-0.25, -0.05, -0.1, 0.18, -0.22, 0.4], [0.24, -0.02, 0.1, 0.2, 0.26, 0.38], [0.0, 0.05, 0.06, 0.25, -0.04, 0.44]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, cy + c[1] * h); ctx.lineTo(c[2] * w, cy + c[3] * h); ctx.lineTo(c[4] * w, cy + c[5] * h); ctx.stroke();
  }
  // hp no alto (visivel com a coluna coberta)
  const hy = r.y + Math.max(7, r.h * 0.08);
  rr(ctx, -r.w * 0.34, hy - 7, r.w * 0.68, 14, 7); ctx.fillStyle = 'rgba(255,250,240,0.92)'; ctx.fill(); contornar(ctx, 1.2);
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * r.w * 0.18, hy, 3.6);
    ctx.fillStyle = k < hp ? LACA : 'rgba(58,36,24,0.25)'; ctx.fill();
  }
}

function shoyu(ctx, r, op) {
  const g = geoPrato(r);
  prato(ctx, g, '#ffffff', { arcoiris: true, t: op.t });
  const { cx, cy, rx, ry } = g;
  elipse(ctx, cx, cy, rx * 0.46, ry * 0.42); ctx.fillStyle = '#fbfbf8'; ctx.fill(); contornar(ctx, 1.4);
  elipse(ctx, cx, cy + ry * 0.03, rx * 0.36, ry * 0.3); ctx.fillStyle = '#4a2412'; ctx.fill();
  ctx.save(); elipse(ctx, cx, cy + ry * 0.03, rx * 0.36, ry * 0.3); ctx.clip();
  const k = (op.t || 0) * 2;
  ['#ff5d73', '#ffe066', '#3fa7ff'].forEach((c, i) => { ctx.strokeStyle = rgba(c, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx + Math.sin(k + i) * 2, cy, rx * (0.12 + i * 0.08), ry * (0.1 + i * 0.06), 0, 0, TAU); ctx.stroke(); });
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const a = (op.t || 0) * 1.5 + (i * TAU) / 3;
    const s = 3 + Math.abs(Math.sin((op.t || 0) * 4 + i)) * 2.5;
    estrela(ctx, cx + Math.cos(a) * rx * 0.75, cy + Math.sin(a) * ry * 0.75, s, s * 0.4, 4); ctx.fillStyle = '#fffbe0'; ctx.fill();
  }
  bandeira(ctx, r, '?', '#a77bff', { fundo: '#fffaf0' });
}

function wasabi(ctx, r, op) {
  const g = geoPrato(r);
  const { cx, cy, rx, ry } = g;
  // folha de shiso
  elipse(ctx, cx, cy + ry * 0.2, rx * 0.95, ry * 0.62, -0.1); ctx.fillStyle = '#3f8a33'; ctx.fill(); contornar(ctx, 1.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - rx * 0.85, cy + ry * 0.3); ctx.lineTo(cx + rx * 0.85, cy + ry * 0.1); ctx.stroke();
  // bolota com ponta de sorvete
  const s = rx * 0.62;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy + ry * 0.3);
  ctx.bezierCurveTo(cx - s * 1.1, cy - s * 0.4, cx - s * 0.3, cy - s * 0.85, cx + s * 0.05, cy - s * 1.15);
  ctx.bezierCurveTo(cx + s * 0.1, cy - s * 0.75, cx + s * 1.15, cy - s * 0.5, cx + s, cy + ry * 0.3);
  ctx.quadraticCurveTo(cx, cy + ry * 0.55, cx - s, cy + ry * 0.3);
  ctx.closePath();
  ctx.fillStyle = '#9bd35a'; ctx.fill(); contornar(ctx, 1.6);
  ctx.strokeStyle = 'rgba(60,110,30,0.45)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx - s * 0.7, cy - s * 0.05); ctx.quadraticCurveTo(cx, cy - s * 0.3, cx + s * 0.7, cy - s * 0.05); ctx.stroke();
  // pavio e faisca
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(cx + s * 0.05, cy - s * 1.1); ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 1.6, cx + s * 0.85, cy - s * 1.35); ctx.stroke();
  const f = 0.6 + 0.4 * Math.abs(Math.sin((op.t || 0) * 18));
  estrela(ctx, cx + s * 0.85, cy - s * 1.35, s * 0.36 * f, s * 0.14, 6); ctx.fillStyle = '#ffd23f'; ctx.fill();
  estrela(ctx, cx + s * 0.85, cy - s * 1.35, s * 0.16 * f, s * 0.07, 6); ctx.fillStyle = '#fff6c8'; ctx.fill();
  // cara apimentada
  const ey = cy - s * 0.12;
  for (const k of [-1, 1]) {
    ctx.fillStyle = '#1f3a12'; circulo(ctx, cx + k * s * 0.32, ey, Math.max(1.5, s * 0.1)); ctx.fill();
    ctx.strokeStyle = '#1f3a12'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(cx + k * s * 0.55, ey - s * 0.32); ctx.lineTo(cx + k * s * 0.15, ey - s * 0.18); ctx.stroke();
  }
  elipse(ctx, cx, ey + s * 0.32, s * 0.16, s * 0.12); ctx.fillStyle = '#c0392b'; ctx.fill();
  ctx.fillStyle = 'rgba(255,90,90,0.5)';
  for (const k of [-1, 1]) { elipse(ctx, cx + k * s * 0.55, ey + s * 0.2, s * 0.13, s * 0.08); ctx.fill(); }
}

function hashi(ctx, r) {
  const g = geoPrato(r);
  prato(ctx, g, '#f2c94c');
  const { cx, cy, rx, ry } = g;
  ctx.lineCap = 'round';
  for (const [a, b] of [[-1, 1], [1, 1]]) {
    ctx.beginPath(); ctx.moveTo(cx - a * rx * 0.8, cy - ry * 0.75 * b); ctx.lineTo(cx + a * rx * 0.75, cy + ry * 0.55);
    ctx.strokeStyle = CONTORNO; ctx.lineWidth = 5.5; ctx.stroke();
    ctx.strokeStyle = LACA; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - a * rx * 0.8, cy - ry * 0.75 * b); ctx.lineTo(cx - a * rx * 0.55, cy - ry * 0.45 * b);
    ctx.strokeStyle = '#e2b44a'; ctx.lineWidth = 3.5; ctx.stroke();
  }
  circulo(ctx, cx, cy + ry * 0.05, rx * 0.36); ctx.fillStyle = '#fffaf0'; ctx.fill(); contornar(ctx, 1.6);
  texto(ctx, 'x2', cx, cy + ry * 0.07, rx * 0.42, LACA);
  bandeira(ctx, r, 'x2', LACA);
}

// ------------------------------------------------------------ cenario

function seigaiha(ctx, x0, y0, w, h, raio, cor) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.strokeStyle = cor; ctx.lineWidth = 1.2;
  let linha = 0;
  for (let y = y0 + raio * 0.6; y < y0 + h + raio; y += raio * 0.55, linha++) {
    for (let x = x0 + (linha % 2 ? raio : 0); x < x0 + w + raio * 2; x += raio * 2) {
      for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(x, y, (raio * k) / 3, Math.PI, 0); ctx.stroke(); }
    }
  }
  ctx.restore();
}

function lanterna(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -r * 2.2); ctx.lineTo(0, -r * 1.05); ctx.stroke();
  ctx.fillStyle = 'rgba(255,170,90,0.22)'; circulo(ctx, 0, 0, r * 1.9); ctx.fill();
  elipse(ctx, 0, 0, r * 0.95, r * 1.12); ctx.fillStyle = LACA; ctx.fill();
  ctx.save(); elipse(ctx, 0, 0, r * 0.95, r * 1.12); ctx.clip();
  ctx.strokeStyle = 'rgba(120,20,15,0.5)'; ctx.lineWidth = 1;
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(0, k * r * 0.3, r, r * 0.12, 0, 0, Math.PI); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,230,160,0.35)'; elipse(ctx, -r * 0.3, -r * 0.2, r * 0.25, r * 0.6); ctx.fill();
  ctx.restore();
  elipse(ctx, 0, 0, r * 0.95, r * 1.12); contornar(ctx, 1.5);
  rr(ctx, -r * 0.5, -r * 1.2, r, r * 0.22, 2); ctx.fillStyle = '#1e1a1c'; ctx.fill();
  rr(ctx, -r * 0.5, r * 1.0, r, r * 0.22, 2); ctx.fill();
  ctx.strokeStyle = '#e2b44a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, r * 1.22); ctx.lineTo(0, r * 1.6); ctx.stroke();
  ctx.restore();
}

/** Tabela de pratos na parede: ensina a escada de cores. */
function cardapio(ctx, cx, y, larg, alt) {
  if (alt < 46 || larg < 160) return;
  const w = Math.min(larg, 330), h = Math.min(alt, 78);
  const x = cx - w / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(60,30,10,0.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  rr(ctx, x, y, w, h, 8); ctx.fillStyle = '#6e4326'; ctx.fill();
  ctx.restore();
  rr(ctx, x + 4, y + 4, w - 8, h - 8, 6); ctx.fillStyle = '#fbf1dc'; ctx.fill(); contornar(ctx, 1.2);
  const vals = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
  const duas = h >= 64;
  const porLinha = duas ? 6 : 11;
  const cw = (w - 16) / porLinha;
  const lh = duas ? (h - 14) / 2 : h - 12;
  vals.forEach((v, i) => {
    const li = Math.floor(i / porLinha), ci = i % porLinha;
    const px = x + 8 + cw * (ci + 0.5) + (duas && li === 1 ? cw / 2 : 0);
    const py = y + 8 + lh * li + lh * 0.36;
    const P = pratoDe(v);
    const rx = Math.min(cw * 0.36, lh * 0.36);
    elipse(ctx, px, py + 1.5, rx, rx * 0.72); ctx.fillStyle = escurecer(P.cor, 0.3); ctx.fill();
    elipse(ctx, px, py, rx, rx * 0.72); ctx.fillStyle = P.cor; ctx.fill(); contornar(ctx, 1);
    elipse(ctx, px, py, rx * 0.55, rx * 0.4); ctx.fillStyle = '#fffaf1'; ctx.fill();
    texto(ctx, String(v), px, py + rx * 0.72 + lh * 0.2, Math.max(8, Math.min(11, lh * 0.3)), CONTORNO);
  });
}

function esteira(ctx, L, t) {
  const f = L.fila;
  const passo = 22, vel = 26;
  ctx.save();
  if (f.vertical) {
    const x0 = f.x - 2, w = f.w + 4;
    ctx.fillStyle = '#8f96a3'; ctx.fillRect(x0 - 6, 0, w + 12, L.H);
    ctx.fillStyle = '#c7ccd5'; ctx.fillRect(x0 - 6, 0, 5, L.H); ctx.fillRect(x0 + w + 1, 0, 5, L.H);
    ctx.fillStyle = '#5d636e'; ctx.fillRect(x0, 0, w, L.H);
    const off = (t * vel) % passo;
    for (let y = -passo + (passo - off); y < L.H + passo; y += passo) {
      rr(ctx, x0 + 3, y, w - 6, passo - 4, 6); ctx.fillStyle = '#dfe3ea'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x0 + 6, y + 2, w - 12, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0 + 6, y + passo - 7, w - 12, 2);
    }
  } else {
    const y0 = f.y - 12, h = f.h + 24;
    ctx.fillStyle = '#8f96a3'; ctx.fillRect(0, y0 - 6, L.W, h + 12);
    ctx.fillStyle = '#c7ccd5'; ctx.fillRect(0, y0 - 6, L.W, 5); ctx.fillRect(0, y0 + h + 1, L.W, 5);
    ctx.fillStyle = '#5d636e'; ctx.fillRect(0, y0, L.W, h);
    const off = (t * vel) % passo;
    for (let x = -passo - off; x < L.W + passo; x += passo) {
      rr(ctx, x, y0 + 3, passo - 4, h - 6, 6); ctx.fillStyle = '#dfe3ea'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x + 2, y0 + 6, 2, h - 12);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + passo - 7, y0 + 6, 2, h - 12);
    }
    // seta indicando o sentido e a frente
    const p0 = L.filaPos(0);
    texto(ctx, '◀ próximo', p0.x + p0.w / 2, y0 - 16, 12, CREME, { contorno: 'rgba(58,36,24,0.8)', espessura: 3 });
  }
  ctx.restore();
}

// ------------------------------------------------------------ tema

const tema = {
  id: 'sushi',
  nome: 'Esteira de Sushi',
  cores: { texto: CONTORNO, destaque: '#ffd54a', particulas: [SALMAO, '#fffaf0', MATCHA, LACA] },
  faixas: () => ({ topo: 96, base: 0 }),

  fundo(ctx, W, H, L) {
    const m = L.mesa;
    // parede creme com textura de papel
    ctx.fillStyle = '#f7e9cf'; ctx.fillRect(0, 0, W, H);
    const rnd = semente(3);
    ctx.fillStyle = 'rgba(160,110,60,0.06)';
    for (let i = 0; i < 140; i++) { ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1); }
    // ripas verticais da parede
    ctx.strokeStyle = 'rgba(150,100,55,0.12)'; ctx.lineWidth = 1;
    for (let x = 18; x < W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    // noren indigo atras do HUD
    const nh = L.topo + 18;
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(0, 0, W, 8);
    const paineis = Math.max(3, Math.round(W / 130));
    const pw = W / paineis;
    for (let i = 0; i < paineis; i++) {
      const x = i * pw + 2, w = pw - 4;
      ctx.fillStyle = INDIGO; ctx.fillRect(x, 8, w, nh - 8);
      seigaiha(ctx, x, nh - 34, w, 34, 12, 'rgba(255,255,255,0.35)');
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x + w - 4, 8, 4, nh - 8);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, nh, W, 4);
    // balcao: tampo de hinoki e frente escura
    const tampoY = Math.max(nh + 8, m.y - 18);
    const frenteY = L.fila.vertical ? H - 34 : Math.min(H - 20, L.fila.y + L.fila.h + 26);
    // cardapio na parede (entre o noren e o balcao)
    cardapio(ctx, m.x + m.w / 2, nh + 12, Math.min(W - 24, m.w + 40), tampoY - nh - 24);
    const g = ctx.createLinearGradient(0, tampoY, 0, frenteY);
    g.addColorStop(0, '#f0cf9e'); g.addColorStop(1, '#e0b07a');
    ctx.fillStyle = g; ctx.fillRect(0, tampoY, W, frenteY - tampoY);
    ctx.strokeStyle = 'rgba(150,95,45,0.18)'; ctx.lineWidth = 1;
    for (let y = tampoY + 10; y < frenteY; y += 14) {
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 47 + y) * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#c48a52'; ctx.fillRect(0, tampoY - 6, W, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, tampoY - 6, W, 2);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(0, frenteY, W, H - frenteY);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < W; x += 28) ctx.fillRect(x, frenteY + 6, 2, H - frenteY);
    ctx.fillStyle = '#c48a52'; ctx.fillRect(0, frenteY, W, 5);
    ctx.fillStyle = LACA; ctx.fillRect(0, frenteY + 5, W, 4);
    // banquinhos (assentos vermelhos) na frente do balcao
    if (H - frenteY > 60) {
      const n = Math.max(3, Math.round(W / 110));
      for (let i = 0; i < n; i++) {
        const bx = (W / n) * (i + 0.5), by = H - 26;
        rr(ctx, bx - 4, by, 8, 40, 3); ctx.fillStyle = '#9aa1ad'; ctx.fill(); contornar(ctx, 1.2);
        elipse(ctx, bx, by + 4, 32, 11); ctx.fillStyle = '#7a1f1a'; ctx.fill();
        elipse(ctx, bx, by, 32, 11); ctx.fillStyle = LACA; ctx.fill(); contornar(ctx, 1.4);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; elipse(ctx, bx - 8, by - 3, 12, 3.5); ctx.fill();
      }
    }
    // xicara de cha e porta-hashi no canto do balcao
    const tx = 26, ty = frenteY - 30;
    if (!L.fila.vertical && ty > m.y + m.h + 20) {
      rr(ctx, tx - 11, ty - 14, 22, 24, 6); ctx.fillStyle = '#7f9d73'; ctx.fill(); contornar(ctx, 1.4);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx - 7, ty - 4); ctx.lineTo(tx + 7, ty - 4); ctx.stroke();
    }
  },

  vivo(ctx, W, H, t) {
    const nh = 96 + 18;
    const rot = Math.sin(t * 1.3) * 0.06;
    lanterna(ctx, 24, nh + 34, 15, rot);
    lanterna(ctx, W - 24, nh + 34, 15, -rot);
  },

  mesa(ctx, L, e, t) {
    // balcao livre entre a mesa e a esteira: a pilha de pratos vazios (a conta) e o cha
    const livreY0 = L.mesa.y + L.mesa.h + 6, livreY1 = L.fila.vertical ? L.H - 40 : L.fila.y - 30;
    if (!L.fila.vertical && livreY1 - livreY0 > 44) {
      const n = Math.min(9, 1 + Math.floor((e.fusoes || 0) / 3));
      const bx = 44, by = livreY1 - 20;
      elipse(ctx, bx, by + 4, 26, 8); ctx.fillStyle = 'rgba(70,40,20,0.22)'; ctx.fill();
      for (let i = 0; i < n; i++) {
        const cor = PRATOS[i % 9].cor, y = by - i * 5;
        elipse(ctx, bx, y + 2, 24, 7.5); ctx.fillStyle = escurecer(cor, 0.3); ctx.fill();
        elipse(ctx, bx, y, 24, 7.5); ctx.fillStyle = cor; ctx.fill(); contornar(ctx, 1);
      }
      elipse(ctx, bx, by - (n - 1) * 5, 15, 4.5); ctx.fillStyle = '#fffaf1'; ctx.fill();
      texto(ctx, 'a conta', bx, by + 16, 10, '#8a5a32');
      // cha com vapor
      const cx = L.W - 44, cy = livreY1 - 14;
      elipse(ctx, cx, cy + 14, 18, 5); ctx.fillStyle = 'rgba(70,40,20,0.22)'; ctx.fill();
      rr(ctx, cx - 13, cy - 12, 26, 26, 7); ctx.fillStyle = '#7f9d73'; ctx.fill(); contornar(ctx, 1.4);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.2;
      for (const yy of [cy - 3, cy + 4]) { ctx.beginPath(); ctx.moveTo(cx - 9, yy); ctx.lineTo(cx + 9, yy); ctx.stroke(); }
      elipse(ctx, cx, cy - 12, 13, 3.5); ctx.fillStyle = '#b9c98a'; ctx.fill(); contornar(ctx, 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        for (let j = 0; j <= 10; j++) { const yy = cy - 16 - j * 2.4; const xx = cx - 4 + k * 8 + Math.sin(t * 3 + j * 0.6 + k) * 2.5; if (j) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
    }
    for (let c = 0; c < L.colunas; c++) {
      const a = L.coluna(c);
      // esteirinha de bambu sob cada coluna
      rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 8);
      ctx.fillStyle = 'rgba(214,180,115,0.55)'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(140,100,50,0.35)'; ctx.lineWidth = 1;
      for (let y = a.y; y < a.y + a.h; y += 6) { ctx.beginPath(); ctx.moveTo(a.x - 3, y); ctx.lineTo(a.x + a.w + 3, y); ctx.stroke(); }
      ctx.restore();
      rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 8); ctx.strokeStyle = 'rgba(122,74,42,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
      if (!e.colunas[c].length) {
        const s = L.carta(c, 0);
        const g = geoPrato({ x: s.x, y: s.y, w: s.w, h: s.h });
        elipse(ctx, s.x + s.w / 2, g.cy, g.rx * 0.92, g.ry * 0.92);
        ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(58,36,24,0.45)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        // hashi no descanso
        const cx = s.x + s.w / 2, cy = g.cy;
        ctx.strokeStyle = 'rgba(58,36,24,0.35)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - g.rx * 0.5, cy + 3); ctx.lineTo(cx + g.rx * 0.5, cy - 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - g.rx * 0.5, cy + 8); ctx.lineTo(cx + g.rx * 0.5, cy + 2); ctx.stroke();
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return pote(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return shoyu(ctx, r, op);
    if (carta.tipo === 'bomba') return wasabi(ctx, r, op);
    if (carta.tipo === 'dobro') return hashi(ctx, r);
    pratoNormal(ctx, carta, r, op);
  },

  cadeado(ctx, a) {
    rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 8); ctx.fillStyle = rgba(INDIGO, 0.28); ctx.fill();
    const ry = a.y + a.h * 0.5;
    // postes de latao
    for (const px of [a.x - 2, a.x + a.w + 2]) {
      rr(ctx, px - 3, ry - 10, 6, 34, 3); ctx.fillStyle = '#d9a93a'; ctx.fill(); contornar(ctx, 1.2);
      circulo(ctx, px, ry - 12, 5); ctx.fillStyle = '#f0c75a'; ctx.fill(); contornar(ctx, 1.2);
    }
    // cordao vermelho
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x - 2, ry - 8); ctx.quadraticCurveTo(a.x + a.w / 2, ry + 18, a.x + a.w + 2, ry - 8);
    ctx.strokeStyle = '#7a1f1a'; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = LACA; ctx.lineWidth = 4; ctx.stroke();
    // placa RESERVADO (cavalete)
    const sw = a.w + 12, sh = 30, sx = a.x + a.w / 2 - sw / 2, sy = ry - 48;
    ctx.strokeStyle = '#6e4326'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx + 8, sy + sh); ctx.lineTo(sx + 4, ry + 4); ctx.moveTo(sx + sw - 8, sy + sh); ctx.lineTo(sx + sw - 4, ry + 4); ctx.stroke();
    rr(ctx, sx, sy, sw, sh, 5); ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = LACA; ctx.stroke();
    rr(ctx, sx + 3, sy + 3, sw - 6, sh - 6, 3); ctx.lineWidth = 1; ctx.strokeStyle = rgba(LACA, 0.5); ctx.stroke();
    texto(ctx, 'RESERVADO', sx + sw / 2, sy + sh / 2 + 1, 12, LACA, { max: sw - 10 });
  },

  descarte(ctx, r, e) {
    const g = geoPrato(r);
    const cx = r.x + r.w / 2, cy = g.cy;
    const carga = e.descarteCarga > 0;
    // cesto de bambu (zaru)
    elipse(ctx, cx, cy + g.ry * 0.2, g.rx * 1.02, g.ry * 0.95); ctx.fillStyle = 'rgba(70,40,20,0.22)'; ctx.fill();
    elipse(ctx, cx, cy, g.rx, g.ry); ctx.fillStyle = carga ? '#d9b273' : '#bfa98a'; ctx.fill(); contornar(ctx, 1.6);
    ctx.save(); elipse(ctx, cx, cy, g.rx * 0.82, g.ry * 0.8); ctx.clip();
    ctx.fillStyle = carga ? '#c99a55' : '#a8957a'; ctx.fillRect(cx - g.rx, cy - g.ry, g.rx * 2, g.ry * 2);
    ctx.strokeStyle = 'rgba(110,70,30,0.45)'; ctx.lineWidth = 1;
    for (let k = -8; k <= 8; k++) {
      ctx.beginPath(); ctx.moveTo(cx + k * 5 - g.ry, cy - g.ry); ctx.lineTo(cx + k * 5 + g.ry, cy + g.ry); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + k * 5 + g.ry, cy - g.ry); ctx.lineTo(cx + k * 5 - g.ry, cy + g.ry); ctx.stroke();
    }
    ctx.restore();
    elipse(ctx, cx, cy, g.rx * 0.82, g.ry * 0.8); ctx.strokeStyle = 'rgba(110,70,30,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    // etiqueta
    const ty = r.y + r.h * 0.82;
    rr(ctx, cx - r.w * 0.48, ty - 9, r.w * 0.96, 18, 9); ctx.fillStyle = carga ? CREME : '#e4d6bf'; ctx.fill(); contornar(ctx, 1.2);
    texto(ctx, carga ? 'devolver ↩' : 'cheio', cx, ty + 0.5, 10.5, carga ? LACA : '#8a7560', { max: r.w * 0.88 });
    if (e.descarteCarga > 1) texto(ctx, 'x' + e.descarteCarga, cx + g.rx * 0.8, r.y + 6, 12, LACA, { contorno: CREME, espessura: 3 });
  },

  fila(ctx, L, e, t) { esteira(ctx, L, t); },

  hud(ctx, W, H, L, e, t, mem) {
    mem.W = W;
    const x = 10, y = 12, w = W - 20, h = 74;
    ctx.save();
    ctx.shadowColor = 'rgba(20,20,40,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = CREME; ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, h, 12); ctx.strokeStyle = LACA; ctx.lineWidth = 3; ctx.stroke();
    rr(ctx, x + 4, y + 4, w - 8, h - 8, 9); ctx.strokeStyle = rgba(LACA, 0.35); ctx.lineWidth = 1; ctx.stroke();
    // carimbo da mesa
    const cx = x + 36, cy = y + h / 2;
    circulo(ctx, cx, cy, 25); ctx.fillStyle = LACA; ctx.fill();
    circulo(ctx, cx, cy, 21); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    texto(ctx, 'mesa', cx, cy - 9, 10, '#ffe6dc');
    texto(ctx, String(e.faseId), cx, cy + 7, 20, '#fff');
    // metas
    const mx = x + 72, mw = w - 72 - 90;
    e.metas.forEach((m, k) => {
      const yy = y + 13 + k * 29;
      texto(ctx, textoMeta(m, { monte: (n) => `Sirva ${n} barco${n > 1 ? 's' : ''}` }), mx, yy + 5, 12, INDIGO, { alinhar: 'left', max: mw });
      rr(ctx, mx, yy + 13, mw, 8, 4); ctx.fillStyle = '#efdcc0'; ctx.fill();
      rr(ctx, mx, yy + 13, Math.max(8, mw * Math.min(1, m.atual / m.alvo)), 8, 4); ctx.fillStyle = m.feita ? MATCHA : SALMAO; ctx.fill();
    });
    // pontos
    const px = x + w - 46;
    estrela(ctx, px, y + 24, 12, 5.5); ctx.fillStyle = '#ffd54a'; ctx.fill(); contornar(ctx, 1.4);
    texto(ctx, String(e.pontos), px, y + 50, 18, INDIGO, { max: 80 });
    texto(ctx, 'pts', px, y + 64, 9, '#8a7560');
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      const fy = y + h + 16;
      rr(ctx, W / 2 - 70, fy - 13, 140, 26, 13); ctx.fillStyle = LACA; ctx.fill();
      ctx.strokeStyle = `rgba(255,214,84,${0.5 + k * 0.5})`; ctx.lineWidth = 3; ctx.stroke();
      texto(ctx, 'FEBRE x2', W / 2, fy + 1, 17, '#fff');
    }
  },

  efeito(fx, P, mem) {
    const tx = clamp(fx.x, 100, (mem.W || 390) - 100);
    if (!P.formas.arroz) {
      P.formas.barco = (ctx, p) => barco(ctx, 0, 0, p.tam, p.tam * 0.72, p.dourado);
      P.formas.arroz = (ctx, p) => { elipse(ctx, 0, 0, p.tam * 0.5, p.tam * 0.28); ctx.fillStyle = '#fffdf6'; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(58,36,24,0.5)'; ctx.stroke(); };
      P.formas.caco = (ctx, p) => { ctx.beginPath(); ctx.moveTo(-p.tam / 2, p.tam / 3); ctx.lineTo(p.tam / 2, p.tam / 2); ctx.lineTo(0, -p.tam / 2); ctx.closePath(); ctx.fill(); };
      P.formas.vapor = (ctx, p, u) => { ctx.globalAlpha *= 0.55 * (1 - u); circulo(ctx, 0, 0, p.tam * (0.6 + u)); ctx.fill(); };
    }
    switch (fx.tipo) {
      case 'pouso':
        P.anel(fx.x, fx.y - 6, '#ffffff', 30, 0.35);
        P.estourar(fx.x, fx.y, '#fffdf6', 5, 0.35, { forma: 'arroz', tam: 6, g: 300, vida: 0.45 });
        return true;
      case 'fusao': {
        const cor = pratoDe(fx.valor).cor;
        P.estourar(fx.x, fx.y, ['#fff6c8', '#ffd54a', cor], 8 + fx.degrau * 3, 0.7 + fx.degrau * 0.12, { forma: 'estrela', tam: 10, g: 240 });
        P.estourar(fx.x, fx.y, '#fffdf6', 6, 0.6, { forma: 'arroz', tam: 6, g: 420 });
        P.subir(fx.x, fx.y - 10, 'rgba(255,255,255,0.9)', 4, { forma: 'vapor', tam: 9, vida: 1.0, larg: 26, forca: 0.6 });
        P.anel(fx.x, fx.y, cor, 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, 'x' + fx.degrau, '#ffd54a', 22 + fx.degrau * 2, CONTORNO);
        return true;
      }
      case 'completar':
        P.estourar(fx.x, fx.y, [LACA, '#ffd54a', MATCHA, SALMAO, '#3f8ad8', '#fffaf0'], 48, 1.7, { forma: 'q', tam: 8, g: 420, vida: 1.0 });
        P.estourar(fx.x, fx.y, ['#fff6c8', '#ffd54a'], 14, 1.1, { forma: 'estrela', tam: 12 });
        // o barco sai deslizando para o cliente
        P.add({ x: fx.x, y: fx.y + 8, vx: 170, vy: -14, g: 0, arrasto: 1, vida: 1.5, tam: 84, forma: 'barco', dourado: fx.valor >= 4096 });
        P.texto(tx, fx.y - 44, 'Pedido pronto!', '#ffffff', 24, LACA);
        return true;
      case 'explodir':
        P.subir(fx.x, fx.y, ['rgba(155,211,90,0.85)', 'rgba(120,180,60,0.8)'], 9, { forma: 'vapor', tam: 16, vida: 0.9, larg: 34, forca: 0.9 });
        P.estourar(fx.x, fx.y, ['#9bd35a', '#5f9e2f', '#fff6c8'], 16, 1.1, { forma: 'c', tam: 7 });
        P.texto(tx, fx.y - 28, 'Ardeu!', '#9bd35a', 20, '#1f3a12');
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#a8572f', '#efe2c8', '#7d3f22'], 20, 1.2, { forma: 'caco', tam: 9 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#a8572f', '#efe2c8'], 6, 0.6, { forma: 'caco', tam: 6 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#e8f7ff', '#9fdcff', '#ffffff'], 16, 0.8, { forma: 'caco', tam: 7, g: 160, vida: 0.8 });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, [LACA, '#ffd54a'], 16, 1, { forma: 'q', tam: 7 });
        P.texto(tx, fx.y - 20, 'Mesa livre!', '#ffffff', 18, LACA);
        return true;
      case 'combo':
        P.texto(tx, fx.y - 44, `Combo x${fx.n}!`, '#ffd54a', 22, CONTORNO);
        return true;
      default: return false;
    }
  },
};

export default tema;
