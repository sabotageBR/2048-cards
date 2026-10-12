// Silhuetas dos 50 layouts. Origem nos pes, caixa +-1.15R por 2.1R.
// Cada uma e um caminho proprio: o que muda e a massa, nao a cor.
import { TINTA, circulo, elipse, rr, estrela } from '../../src/render/desenho.js';
import { CATALOGO, REINOS, porId } from './catalogo.js';

const CORES = {
  campos: { A: '#b6ee78', B: '#3c8f2c', C: '#e9ffc4' },
  pedreira: { A: '#e7c7a0', B: '#7a5a3c', C: '#f6e6cc' },
  gelo: { A: '#f7fbff', B: '#7eafdc', C: '#ffffff' },
  masmorra: { A: '#c4b0ee', B: '#3a2468', C: '#f3ecff' },
  vulcao: { A: '#ff7a52', B: '#9a2418', C: '#ffd23f' },
};

const lw0 = (R) => Math.max(2, R * 0.05);

function traco(ctx, lw) {
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = TINTA;
  ctx.stroke();
}

function grad(ctx, y0, y1, cor) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, cor.A);
  g.addColorStop(1, cor.B);
  return g;
}

/** Fecha, pinta com degradê e contorna. `tracar` abre o caminho. */
function corpo(ctx, tracar, cor, y0, y1, lw) {
  tracar();
  ctx.fillStyle = grad(ctx, y0, y1, cor);
  ctx.fill();
  traco(ctx, lw);
}

function brilho(ctx, x, y, rx, ry, rot = -0.5) {
  elipse(ctx, x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
}

function olhos(ctx, R, lw, lista) {
  for (const o of lista) {
    const x = o.x * R, y = o.y * R, rx = o.rx * R, ry = o.ry * R;
    elipse(ctx, x, y, rx, ry);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = Math.max(1.25, lw * 0.65);
    ctx.strokeStyle = TINTA;
    ctx.stroke();
    circulo(ctx, x + rx * 0.1, y + ry * 0.2, Math.min(rx, ry) * 0.46);
    ctx.fillStyle = o.cor || '#1a0d22';
    ctx.fill();
    circulo(ctx, x + rx * 0.28, y - ry * 0.2, Math.min(rx, ry) * 0.18);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}

function olhosBrilho(ctx, R, lista, cor) {
  for (const o of lista) {
    const x = o.x * R, y = o.y * R, rx = o.rx * R, ry = o.ry * R;
    ctx.save();
    ctx.shadowColor = cor;
    ctx.shadowBlur = rx;
    elipse(ctx, x, y, rx, ry);
    ctx.fillStyle = cor;
    ctx.fill();
    ctx.restore();
    circulo(ctx, x - rx * 0.2, y - ry * 0.2, rx * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  }
}

function sorriso(ctx, x, y, w, lw) {
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x, y + w * 0.9, x + w, y);
  ctx.quadraticCurveTo(x, y + w * 0.28, x - w, y);
  ctx.closePath();
  ctx.fillStyle = '#3a0f3e';
  ctx.fill();
  traco(ctx, lw * 0.7);
}

function bico(ctx, x, y, w, h, lw, cor) {
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.35);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x, y + h * 0.45);
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
  traco(ctx, lw * 0.7);
}

// ---------------------------------------------------------------- campos

function gota(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(0, -R * 1.78);
    ctx.bezierCurveTo(R * 0.85, -R * 1.55, R * 1.08, -R * 0.7, R * 0.78, -R * 0.08);
    ctx.quadraticCurveTo(R * 0.5, R * 0.1, R * 0.28, 0);
    ctx.quadraticCurveTo(0, R * 0.12, -R * 0.28, 0);
    ctx.quadraticCurveTo(-R * 0.55, R * 0.1, -R * 0.78, -R * 0.08);
    ctx.bezierCurveTo(-R * 1.08, -R * 0.7, -R * 0.85, -R * 1.55, 0, -R * 1.78);
    ctx.closePath();
  }, cor, -R * 1.78, 0, lw);
  brilho(ctx, -R * 0.32, -R * 1.25, R * 0.22, R * 0.12);
  olhos(ctx, R, lw, [{ x: -0.26, y: -0.95, rx: 0.18, ry: 0.22 }, { x: 0.28, y: -0.95, rx: 0.18, ry: 0.22 }]);
  sorriso(ctx, 0, -R * 0.52, R * 0.26, lw);
}

function poca(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.32, R * 1.12, R * 0.3), cor, -R * 0.62, -R * 0.02, lw);
  brilho(ctx, -R * 0.45, -R * 0.42, R * 0.28, R * 0.08);
  olhos(ctx, R, lw, [{ x: -0.32, y: -0.48, rx: 0.14, ry: 0.12 }, { x: 0.32, y: -0.48, rx: 0.14, ry: 0.12 }]);
  sorriso(ctx, 0, -R * 0.28, R * 0.18, lw);
}

function torre(ctx, R, cor) {
  const lw = lw0(R);
  const bola = (y, r) => corpo(ctx, () => circulo(ctx, 0, y, r), cor, y - r, y + r, lw);
  bola(-R * 0.42, R * 0.42);
  bola(-R * 1.05, R * 0.32);
  bola(-R * 1.58, R * 0.24);
  brilho(ctx, -R * 0.12, -R * 1.72, R * 0.08, R * 0.05);
  olhos(ctx, R, lw, [{ x: -0.1, y: -1.62, rx: 0.08, ry: 0.09 }, { x: 0.1, y: -1.62, rx: 0.08, ry: 0.09 }]);
  sorriso(ctx, 0, -R * 1.46, R * 0.1, lw);
}

function lesma(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 1.05, -R * 0.08);
    ctx.quadraticCurveTo(-R * 1.12, -R * 0.45, -R * 0.4, -R * 0.5);
    ctx.quadraticCurveTo(R * 0.35, -R * 0.62, R * 0.95, -R * 0.28);
    ctx.quadraticCurveTo(R * 1.1, -R * 0.08, R * 0.7, -R * 0.02);
    ctx.quadraticCurveTo(0, R * 0.08, -R * 0.7, -R * 0.02);
    ctx.closePath();
  }, cor, -R * 0.6, 0, lw);
  const haste = (x) => {
    ctx.beginPath();
    ctx.moveTo(x, -R * 0.4);
    ctx.quadraticCurveTo(x - R * 0.08, -R * 1.15, x, -R * 1.45);
    ctx.lineWidth = lw * 1.4;
    ctx.strokeStyle = cor.B;
    ctx.stroke();
    traco(ctx, lw * 0.7);
    circulo(ctx, x, -R * 1.52, R * 0.1);
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw * 0.7);
  };
  haste(-R * 0.55);
  haste(-R * 0.28);
  olhos(ctx, R, lw, [{ x: -0.55, y: -1.52, rx: 0.07, ry: 0.07 }, { x: -0.28, y: -1.52, rx: 0.07, ry: 0.07 }]);
  sorriso(ctx, -R * 0.72, -R * 0.22, R * 0.1, lw);
}

function ameba(ctx, R, cor) {
  const lw = lw0(R);
  const lobo = (x, y, rx, ry) => corpo(ctx, () => elipse(ctx, x, y, rx, ry), cor, y - ry, y + ry, lw);
  lobo(-R * 0.72, -R * 0.55, R * 0.38, R * 0.28);
  lobo(R * 0.7, -R * 0.85, R * 0.34, R * 0.42);
  lobo(-R * 0.15, -R * 1.45, R * 0.32, R * 0.38);
  lobo(0, -R * 0.85, R * 0.62, R * 0.58);
  brilho(ctx, -R * 0.22, -R * 1.15, R * 0.16, R * 0.08);
  olhos(ctx, R, lw, [{ x: -0.2, y: -0.95, rx: 0.14, ry: 0.16 }, { x: 0.2, y: -0.95, rx: 0.14, ry: 0.16 }]);
  sorriso(ctx, 0, -R * 0.62, R * 0.16, lw);
}

function sapo(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.48, R * 0.95, R * 0.46), cor, -R * 0.94, -R * 0.02, lw);
  corpo(ctx, () => circulo(ctx, -R * 0.38, -R * 1.02, R * 0.28), cor, -R * 1.3, -R * 0.74, lw);
  corpo(ctx, () => circulo(ctx, R * 0.38, -R * 1.02, R * 0.28), cor, -R * 1.3, -R * 0.74, lw);
  olhos(ctx, R, lw, [{ x: -0.38, y: -1.08, rx: 0.14, ry: 0.14 }, { x: 0.38, y: -1.08, rx: 0.14, ry: 0.14 }]);
  ctx.beginPath();
  ctx.moveTo(-R * 0.42, -R * 0.42);
  ctx.quadraticCurveTo(0, -R * 0.05, R * 0.42, -R * 0.42);
  ctx.lineWidth = lw;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
}

function dupla(ctx, R, cor) {
  const lw = lw0(R);
  const um = (x, r, y) => corpo(ctx, () => circulo(ctx, x, y, r), cor, y - r, y + r * 0.2, lw);
  um(-R * 0.42, R * 0.48, -R * 0.5);
  um(R * 0.46, R * 0.4, -R * 0.62);
  olhos(ctx, R, lw, [
    { x: -0.56, y: -0.62, rx: 0.1, ry: 0.12 }, { x: -0.3, y: -0.62, rx: 0.1, ry: 0.12 },
    { x: 0.32, y: -0.74, rx: 0.09, ry: 0.1 }, { x: 0.56, y: -0.74, rx: 0.09, ry: 0.1 },
  ]);
  sorriso(ctx, -R * 0.42, -R * 0.38, R * 0.12, lw);
  sorriso(ctx, R * 0.44, -R * 0.5, R * 0.1, lw);
}

function caracol(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 1.05, -R * 0.06);
    ctx.quadraticCurveTo(-R * 0.2, -R * 0.55, R * 0.15, -R * 0.35);
    ctx.quadraticCurveTo(R * 0.45, -R * 0.15, R * 0.2, -R * 0.02);
    ctx.quadraticCurveTo(-R * 0.4, R * 0.1, -R * 1.05, -R * 0.06);
    ctx.closePath();
  }, cor, -R * 0.5, 0, lw);
  corpo(ctx, () => circulo(ctx, R * 0.28, -R * 0.95, R * 0.58), cor, -R * 1.53, -R * 0.37, lw);
  ctx.beginPath();
  ctx.arc(R * 0.28, -R * 0.95, R * 0.34, 0.4, 5.2);
  ctx.lineWidth = lw;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(R * 0.28, -R * 0.95, R * 0.16, 0.2, 4.6);
  ctx.stroke();
  const haste = (x) => {
    ctx.beginPath();
    ctx.moveTo(x, -R * 0.4);
    ctx.lineTo(x - R * 0.05, -R * 1.15);
    ctx.lineWidth = lw;
    ctx.strokeStyle = TINTA;
    ctx.stroke();
    circulo(ctx, x - R * 0.05, -R * 1.22, R * 0.08);
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw * 0.7);
  };
  haste(-R * 0.72);
  haste(-R * 0.5);
  olhos(ctx, R, lw, [{ x: -0.74, y: -1.22, rx: 0.055, ry: 0.055 }, { x: -0.52, y: -1.22, rx: 0.055, ry: 0.055 }]);
}

function taca(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.55, -R * 0.85);
    ctx.lineTo(-R * 0.22, -R * 0.35);
    ctx.lineTo(-R * 0.42, -R * 0.08);
    ctx.lineTo(R * 0.42, -R * 0.08);
    ctx.lineTo(R * 0.22, -R * 0.35);
    ctx.lineTo(R * 0.55, -R * 0.85);
    ctx.quadraticCurveTo(0, -R * 0.65, -R * 0.55, -R * 0.85);
    ctx.closePath();
  }, cor, -R * 0.95, 0, lw);
  corpo(ctx, () => elipse(ctx, 0, -R * 1.15, R * 0.62, R * 0.48), cor, -R * 1.63, -R * 0.67, lw);
  brilho(ctx, -R * 0.2, -R * 1.35, R * 0.16, R * 0.08);
  olhos(ctx, R, lw, [{ x: -0.18, y: -1.2, rx: 0.12, ry: 0.14 }, { x: 0.2, y: -1.2, rx: 0.12, ry: 0.14 }]);
  sorriso(ctx, 0, -R * 0.95, R * 0.14, lw);
}

function medusa(ctx, R, cor) {
  const lw = lw0(R);
  for (const x of [-0.55, -0.28, 0, 0.28, 0.55]) {
    ctx.beginPath();
    ctx.moveTo(x * R, -R * 0.85);
    ctx.quadraticCurveTo(x * R + R * 0.12, -R * 0.4, x * R, -R * 0.02);
    ctx.lineWidth = lw * 2.2;
    ctx.strokeStyle = cor.B;
    ctx.stroke();
    traco(ctx, lw * 0.8);
  }
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.85, -R * 0.9);
    ctx.bezierCurveTo(-R * 0.9, -R * 1.7, R * 0.9, -R * 1.7, R * 0.85, -R * 0.9);
    ctx.quadraticCurveTo(0, -R * 0.7, -R * 0.85, -R * 0.9);
    ctx.closePath();
  }, cor, -R * 1.7, -R * 0.75, lw);
  brilho(ctx, -R * 0.25, -R * 1.4, R * 0.18, R * 0.08);
  olhos(ctx, R, lw, [{ x: -0.22, y: -1.2, rx: 0.12, ry: 0.14 }, { x: 0.22, y: -1.2, rx: 0.12, ry: 0.14 }]);
  sorriso(ctx, 0, -R * 0.98, R * 0.14, lw);
}

// -------------------------------------------------------------- pedreira

function facetado(ctx, R, cor, lw, tracar, y0, y1) {
  corpo(ctx, tracar, cor, y0, y1, lw);
}

function pilha(ctx, R, cor) {
  const lw = lw0(R);
  const pedra = (x, y, rx, ry) => facetado(ctx, R, cor, lw, () => elipse(ctx, x, y, rx, ry), y - ry, y + ry);
  pedra(0, -R * 0.38, R * 0.72, R * 0.38);
  pedra(0, -R * 1.0, R * 0.5, R * 0.36);
  pedra(0, -R * 1.58, R * 0.34, R * 0.3);
  pedra(-R * 0.85, -R * 0.7, R * 0.28, R * 0.22);
  pedra(R * 0.85, -R * 0.55, R * 0.26, R * 0.2);
  olhos(ctx, R, lw, [{ x: -0.14, y: -1.62, rx: 0.1, ry: 0.1 }, { x: 0.14, y: -1.62, rx: 0.1, ry: 0.1 }]);
  ctx.beginPath();
  ctx.moveTo(-R * 0.08, -R * 1.35);
  ctx.lineTo(R * 0.12, -R * 1.15);
  ctx.lineWidth = lw * 0.7;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
}

function pedregulho(ctx, R, cor) {
  const lw = lw0(R);
  const pe = (x) => {
    rr(ctx, x, -R * 0.22, R * 0.22, R * 0.22, R * 0.06);
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  pe(-R * 0.38);
  pe(R * 0.16);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.0, R * 0.82), cor, -R * 1.82, -R * 0.18, lw);
  corpo(ctx, () => circulo(ctx, -R * 0.95, -R * 0.55, R * 0.28), cor, -R * 0.83, -R * 0.27, lw);
  corpo(ctx, () => circulo(ctx, R * 0.95, -R * 0.48, R * 0.3), cor, -R * 0.78, -R * 0.18, lw);
  brilho(ctx, -R * 0.3, -R * 1.4, R * 0.2, R * 0.1);
  olhos(ctx, R, lw, [{ x: -0.24, y: -1.1, rx: 0.14, ry: 0.14 }, { x: 0.26, y: -1.1, rx: 0.14, ry: 0.14 }]);
  sorriso(ctx, 0, -R * 0.78, R * 0.18, lw);
}

function muralha(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => rr(ctx, -R * 1.12, -R * 1.15, R * 2.24, R * 1.15, R * 0.06), cor, -R * 1.15, 0, lw);
  for (const x of [-0.9, -0.3, 0.3, 0.9]) {
    corpo(ctx, () => rr(ctx, x * R - R * 0.16, -R * 1.48, R * 0.32, R * 0.4, R * 0.04), cor, -R * 1.48, -R * 1.08, lw);
  }
  olhos(ctx, R, lw, [{ x: -0.28, y: -0.72, rx: 0.14, ry: 0.12 }, { x: 0.28, y: -0.72, rx: 0.14, ry: 0.12 }]);
  sorriso(ctx, 0, -R * 0.42, R * 0.2, lw);
}

function estatua(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = grad(ctx, -R * 1.9, 0, cor);
  const b = (x, y, w, h) => { rr(ctx, x, y, w, h, R * 0.06); ctx.fill(); traco(ctx, lw); };
  b(-R * 0.22, -R * 0.42, R * 0.18, R * 0.42);
  b(R * 0.06, -R * 0.42, R * 0.18, R * 0.42);
  b(-R * 0.4, -R * 1.25, R * 0.8, R * 0.78);
  b(-R * 0.95, -R * 1.15, R * 0.42, R * 0.22);
  b(R * 0.55, -R * 1.15, R * 0.42, R * 0.22);
  b(-R * 0.32, -R * 1.9, R * 0.64, R * 0.55);
  olhos(ctx, R, lw, [{ x: -0.12, y: -1.68, rx: 0.08, ry: 0.08 }, { x: 0.12, y: -1.68, rx: 0.08, ry: 0.08 }]);
  ctx.beginPath();
  ctx.moveTo(-R * 0.1, -R * 1.48);
  ctx.lineTo(R * 0.1, -R * 1.48);
  traco(ctx, lw * 0.7);
}

function martelo(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = grad(ctx, -R * 1.7, 0, cor);
  rr(ctx, -R * 0.14, -R * 1.15, R * 0.28, R * 1.15, R * 0.06);
  ctx.fill();
  traco(ctx, lw);
  corpo(ctx, () => rr(ctx, -R * 0.85, -R * 1.85, R * 1.7, R * 0.62, R * 0.12), cor, -R * 1.85, -R * 1.23, lw);
  olhos(ctx, R, lw, [{ x: -0.28, y: -1.58, rx: 0.12, ry: 0.12 }, { x: 0.28, y: -1.58, rx: 0.12, ry: 0.12 }]);
  sorriso(ctx, 0, -R * 1.38, R * 0.16, lw);
}

function arco(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = grad(ctx, -R * 1.7, 0, cor);
  const col = (x) => { rr(ctx, x, -R * 1.35, R * 0.32, R * 1.35, R * 0.04); ctx.fill(); traco(ctx, lw); };
  col(-R * 0.95);
  col(R * 0.63);
  ctx.beginPath();
  ctx.moveTo(-R * 0.95, -R * 1.35);
  ctx.quadraticCurveTo(0, -R * 2.05, R * 0.95, -R * 1.35);
  ctx.lineTo(R * 0.7, -R * 1.35);
  ctx.quadraticCurveTo(0, -R * 1.75, -R * 0.7, -R * 1.35);
  ctx.closePath();
  ctx.fill();
  traco(ctx, lw);
  olhos(ctx, R, lw, [{ x: -0.16, y: -0.85, rx: 0.12, ry: 0.14 }, { x: 0.16, y: -0.85, rx: 0.12, ry: 0.14 }]);
  sorriso(ctx, 0, -R * 0.55, R * 0.14, lw);
}

function rolamento(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  elipse(ctx, 0, -R * 0.28, R * 0.95, R * 0.28);
  ctx.lineWidth = R * 0.22;
  ctx.strokeStyle = cor.B;
  ctx.stroke();
  traco(ctx, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.05, R * 0.62), cor, -R * 1.67, -R * 0.43, lw);
  brilho(ctx, -R * 0.22, -R * 1.3, R * 0.16, R * 0.08);
  olhos(ctx, R, lw, [{ x: -0.18, y: -1.12, rx: 0.12, ry: 0.12 }, { x: 0.2, y: -1.12, rx: 0.12, ry: 0.12 }]);
  sorriso(ctx, 0, -R * 0.85, R * 0.14, lw);
}

function cristal(ctx, R, cor) {
  const lw = lw0(R);
  const ponta = (x, yBase, yTopo, meia) => {
    ctx.beginPath();
    ctx.moveTo(x - meia, yBase);
    ctx.lineTo(x, yTopo);
    ctx.lineTo(x + meia, yBase);
    ctx.closePath();
    ctx.fillStyle = grad(ctx, yTopo, yBase, cor);
    ctx.fill();
    traco(ctx, lw);
    ctx.beginPath();
    ctx.moveTo(x, yTopo);
    ctx.lineTo(x, yBase);
    ctx.lineWidth = lw * 0.55;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.stroke();
  };
  rr(ctx, -R * 0.72, -R * 0.28, R * 1.44, R * 0.28, R * 0.08);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  ponta(-R * 0.58, -R * 0.22, -R * 1.05, R * 0.18);
  ponta(R * 0.58, -R * 0.22, -R * 0.95, R * 0.16);
  ponta(-R * 0.32, -R * 0.22, -R * 1.35, R * 0.14);
  ponta(R * 0.32, -R * 0.22, -R * 1.22, R * 0.14);
  ponta(0, -R * 0.22, -R * 1.92, R * 0.34);
  olhos(ctx, R, lw, [{ x: -0.1, y: -0.95, rx: 0.09, ry: 0.1 }, { x: 0.1, y: -0.95, rx: 0.09, ry: 0.1 }]);
}

function mascaraPedra(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = cor.B;
  rr(ctx, -R * 0.18, -R * 0.28, R * 0.14, R * 0.28, R * 0.04);
  ctx.fill();
  traco(ctx, lw);
  rr(ctx, R * 0.08, -R * 0.28, R * 0.14, R * 0.28, R * 0.04);
  ctx.fill();
  traco(ctx, lw);
  corpo(ctx, () => elipse(ctx, 0, -R * 1.15, R * 0.78, R * 0.85), cor, -R * 2.0, -R * 0.3, lw);
  // olhos vazados da mascara
  elipse(ctx, -R * 0.28, -R * 1.25, R * 0.2, R * 0.26);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  traco(ctx, lw * 0.7);
  elipse(ctx, R * 0.28, -R * 1.25, R * 0.2, R * 0.26);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  traco(ctx, lw * 0.7);
  ctx.beginPath();
  ctx.moveTo(-R * 0.22, -R * 0.7);
  ctx.quadraticCurveTo(0, -R * 0.45, R * 0.22, -R * 0.7);
  traco(ctx, lw);
}

function totem(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => rr(ctx, -R * 0.42, -R * 2.0, R * 0.84, R * 2.0, R * 0.12), cor, -R * 2.0, 0, lw);
  for (const y of [-1.55, -0.95, -0.38]) {
    olhos(ctx, R, lw, [{ x: -0.14, y, rx: 0.08, ry: 0.08 }, { x: 0.14, y, rx: 0.08, ry: 0.08 }]);
    sorriso(ctx, 0, (y + 0.2) * R, R * 0.1, lw);
  }
}

// ------------------------------------------------------------------ gelo

function yeti(ctx, R, cor) {
  const lw = lw0(R);
  const braco = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.7, -R * 1.05);
    ctx.quadraticCurveTo(s * R * 1.15, -R * 0.7, s * R * 0.95, -R * 0.12);
    ctx.quadraticCurveTo(s * R * 0.7, -R * 0.02, s * R * 0.62, -R * 0.2);
    ctx.quadraticCurveTo(s * R * 0.85, -R * 0.7, s * R * 0.55, -R * 0.95);
    ctx.closePath();
    ctx.fillStyle = grad(ctx, -R * 1.1, 0, cor);
    ctx.fill();
    traco(ctx, lw);
  };
  braco(-1);
  braco(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.72, R * 1.02, R * 0.7), cor, -R * 1.42, -R * 0.02, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.35, R * 0.32), cor, -R * 1.67, -R * 1.03, lw);
  olhos(ctx, R, lw, [{ x: -0.12, y: -1.38, rx: 0.08, ry: 0.08 }, { x: 0.12, y: -1.38, rx: 0.08, ry: 0.08 }]);
  sorriso(ctx, 0, -R * 1.22, R * 0.1, lw);
}

function pinguim(ctx, R, cor) {
  const lw = lw0(R);
  const asa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.4, -R * 1.35);
    ctx.quadraticCurveTo(s * R * 0.95, -R * 0.9, s * R * 0.55, -R * 0.35);
    ctx.quadraticCurveTo(s * R * 0.35, -R * 0.7, s * R * 0.32, -R * 1.2);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  asa(-1);
  asa(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.95, R * 0.55, R * 0.9), cor, -R * 1.85, -R * 0.05, lw);
  elipse(ctx, 0, -R * 0.8, R * 0.32, R * 0.62);
  ctx.fillStyle = '#fff';
  ctx.fill();
  rr(ctx, -R * 0.28, -R * 0.16, R * 0.22, R * 0.16, R * 0.04);
  ctx.fillStyle = '#f0a030';
  ctx.fill();
  traco(ctx, lw * 0.7);
  rr(ctx, R * 0.06, -R * 0.16, R * 0.22, R * 0.16, R * 0.04);
  ctx.fillStyle = '#f0a030';
  ctx.fill();
  traco(ctx, lw * 0.7);
  olhos(ctx, R, lw, [{ x: -0.16, y: -1.25, rx: 0.08, ry: 0.1 }, { x: 0.16, y: -1.25, rx: 0.08, ry: 0.1 }]);
  bico(ctx, R * 0.02, -R * 1.05, R * 0.28, R * 0.16, lw, '#f0a030');
}

function boneco(ctx, R, cor) {
  const lw = lw0(R);
  const braco = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.35, -R * 1.15);
    ctx.lineTo(s * R * 0.95, -R * 1.45);
    ctx.lineWidth = lw * 1.3;
    ctx.strokeStyle = '#6b4a2a';
    ctx.stroke();
    traco(ctx, lw * 0.45);
  };
  braco(-1);
  braco(1);
  corpo(ctx, () => circulo(ctx, 0, -R * 0.42, R * 0.42), cor, -R * 0.84, 0, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.05, R * 0.32), cor, -R * 1.37, -R * 0.73, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.58, R * 0.26), cor, -R * 1.84, -R * 1.32, lw);
  olhos(ctx, R, lw, [{ x: -0.1, y: -1.64, rx: 0.06, ry: 0.06 }, { x: 0.1, y: -1.64, rx: 0.06, ry: 0.06 }]);
  bico(ctx, 0, -R * 1.52, R * 0.16, R * 0.08, lw, '#f0a030');
  for (const y of [-1.1, -0.9]) { circulo(ctx, 0, y * R, R * 0.045); ctx.fillStyle = '#1a0d22'; ctx.fill(); }
}

function cubo(ctx, R, cor) {
  const lw = lw0(R);
  const membro = (x, y, w, h) => {
    rr(ctx, x, y, w, h, R * 0.08);
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw);
  };
  membro(-R * 1.05, -R * 1.15, R * 0.32, R * 0.22);
  membro(R * 0.73, -R * 1.15, R * 0.32, R * 0.22);
  membro(-R * 0.38, -R * 0.22, R * 0.24, R * 0.22);
  membro(R * 0.14, -R * 0.22, R * 0.24, R * 0.22);
  corpo(ctx, () => rr(ctx, -R * 0.72, -R * 1.7, R * 1.44, R * 1.4, R * 0.16), cor, -R * 1.7, -R * 0.3, lw);
  ctx.beginPath();
  ctx.moveTo(-R * 0.4, -R * 1.5);
  ctx.lineTo(R * 0.15, -R * 0.55);
  ctx.lineWidth = lw;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.stroke();
  olhos(ctx, R, lw, [{ x: -0.22, y: -1.15, rx: 0.12, ry: 0.12 }, { x: 0.22, y: -1.15, rx: 0.12, ry: 0.12 }]);
  sorriso(ctx, 0, -R * 0.85, R * 0.16, lw);
}

function floco(ctx, R, cor) {
  const lw = lw0(R);
  estrela(ctx, 0, -R * 1.02, R * 1.05, R * 0.38, 6, -Math.PI / 2);
  ctx.fillStyle = grad(ctx, -R * 2.05, 0, cor);
  ctx.fill();
  traco(ctx, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.02, R * 0.36), cor, -R * 1.38, -R * 0.66, lw);
  olhos(ctx, R, lw, [{ x: -0.12, y: -1.08, rx: 0.08, ry: 0.08 }, { x: 0.12, y: -1.08, rx: 0.08, ry: 0.08 }]);
  sorriso(ctx, 0, -R * 0.9, R * 0.1, lw);
}

function foca(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => elipse(ctx, R * 0.1, -R * 0.38, R * 0.95, R * 0.32), cor, -R * 0.7, -R * 0.06, lw);
  corpo(ctx, () => circulo(ctx, -R * 0.72, -R * 0.62, R * 0.32), cor, -R * 0.94, -R * 0.3, lw);
  ctx.beginPath();
  ctx.moveTo(R * 0.85, -R * 0.4);
  ctx.quadraticCurveTo(R * 1.15, -R * 0.15, R * 0.8, -R * 0.12);
  ctx.closePath();
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  olhos(ctx, R, lw, [{ x: -0.84, y: -0.68, rx: 0.08, ry: 0.08 }, { x: -0.62, y: -0.68, rx: 0.08, ry: 0.08 }]);
  bico(ctx, -R * 0.95, -R * 0.5, -R * 0.18, R * 0.1, lw, '#3a2a22');
  for (const y of [-0.08, 0.08]) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.95, -R * 0.48 + y * R);
    ctx.lineTo(-R * 1.15, -R * 0.48 + y * R);
    ctx.lineWidth = lw * 0.45;
    ctx.strokeStyle = TINTA;
    ctx.stroke();
  }
}

function pinheiro(ctx, R, cor) {
  const lw = lw0(R);
  const faixa = (y, meia, alto) => {
    ctx.beginPath();
    ctx.moveTo(-meia, y);
    ctx.lineTo(0, y - alto);
    ctx.lineTo(meia, y);
    ctx.closePath();
    ctx.fillStyle = grad(ctx, y - alto, y, cor);
    ctx.fill();
    traco(ctx, lw);
  };
  rr(ctx, -R * 0.1, -R * 0.28, R * 0.2, R * 0.28, R * 0.04);
  ctx.fillStyle = '#8a5a32';
  ctx.fill();
  traco(ctx, lw * 0.7);
  faixa(-R * 0.22, R * 0.95, R * 0.55);
  faixa(-R * 0.62, R * 0.72, R * 0.5);
  faixa(-R * 1.05, R * 0.5, R * 0.62);
  olhos(ctx, R, lw, [{ x: -0.12, y: -0.85, rx: 0.07, ry: 0.07 }, { x: 0.12, y: -0.85, rx: 0.07, ry: 0.07 }]);
  sorriso(ctx, 0, -R * 0.7, R * 0.1, lw);
}

function estalactite(ctx, R, cor) {
  const lw = lw0(R);
  rr(ctx, -R * 0.78, -R * 2.02, R * 1.56, R * 0.16, R * 0.04);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  elipse(ctx, 0, -R * 0.08, R * 0.38, R * 0.08);
  ctx.fillStyle = 'rgba(180,210,235,0.95)';
  ctx.fill();
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.72, -R * 1.9);
    ctx.lineTo(-R * 0.42, -R * 1.55);
    ctx.lineTo(-R * 0.58, -R * 1.4);
    ctx.lineTo(-R * 0.22, -R * 0.85);
    ctx.lineTo(-R * 0.36, -R * 0.62);
    ctx.lineTo(0, -R * 0.16);
    ctx.lineTo(R * 0.34, -R * 0.66);
    ctx.lineTo(R * 0.18, -R * 0.9);
    ctx.lineTo(R * 0.55, -R * 1.42);
    ctx.lineTo(R * 0.38, -R * 1.58);
    ctx.lineTo(R * 0.72, -R * 1.9);
    ctx.closePath();
  }, cor, -R * 1.9, -R * 0.16, lw);
  const braco = (s) => {
    rr(ctx, s > 0 ? R * 0.28 : -R * 0.56, -R * 1.2, R * 0.28, R * 0.14, R * 0.06);
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw * 0.7);
  };
  braco(-1);
  braco(1);
  olhos(ctx, R, lw, [{ x: -0.14, y: -1.35, rx: 0.09, ry: 0.1 }, { x: 0.14, y: -1.35, rx: 0.09, ry: 0.1 }]);
  sorriso(ctx, 0, -R * 1.1, R * 0.1, lw);
}

function coruja(ctx, R, cor) {
  const lw = lw0(R);
  const asa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.35, -R * 0.9);
    ctx.quadraticCurveTo(s * R * 0.95, -R * 0.7, s * R * 0.7, -R * 0.25);
    ctx.quadraticCurveTo(s * R * 0.4, -R * 0.45, s * R * 0.3, -R * 0.7);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  asa(-1);
  asa(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.75, R * 0.62, R * 0.7), cor, -R * 1.45, -R * 0.05, lw);
  const tufo = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.15, -R * 1.35);
    ctx.lineTo(s * R * 0.45, -R * 1.85);
    ctx.lineTo(s * R * 0.4, -R * 1.25);
    ctx.closePath();
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw);
  };
  tufo(-1);
  tufo(1);
  olhos(ctx, R, lw, [{ x: -0.22, y: -0.9, rx: 0.18, ry: 0.18 }, { x: 0.22, y: -0.9, rx: 0.18, ry: 0.18 }]);
  bico(ctx, 0, -R * 0.62, R * 0.12, R * 0.14, lw, '#f0a030');
  rr(ctx, -R * 0.22, -R * 0.16, R * 0.16, R * 0.16, R * 0.04);
  ctx.fillStyle = '#f0a030';
  ctx.fill();
  traco(ctx, lw * 0.6);
  rr(ctx, R * 0.06, -R * 0.16, R * 0.16, R * 0.16, R * 0.04);
  ctx.fillStyle = '#f0a030';
  ctx.fill();
  traco(ctx, lw * 0.6);
}

function morsa(ctx, R, cor) {
  const lw = lw0(R);
  const nade = (s) => {
    ctx.beginPath();
    ctx.ellipse(s * R * 0.45, -R * 0.35, R * 0.28, R * 0.16, s * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  nade(-1);
  nade(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.7, R * 0.85, R * 0.62), cor, -R * 1.32, -R * 0.08, lw);
  const presa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.12, -R * 0.55);
    ctx.quadraticCurveTo(s * R * 0.28, -R * 0.15, s * R * 0.1, -R * 0.02);
    ctx.quadraticCurveTo(s * R * 0.02, -R * 0.2, s * R * 0.02, -R * 0.55);
    ctx.closePath();
    ctx.fillStyle = '#fff6e4';
    ctx.fill();
    traco(ctx, lw * 0.7);
  };
  presa(-1);
  presa(1);
  olhos(ctx, R, lw, [{ x: -0.28, y: -0.95, rx: 0.1, ry: 0.1 }, { x: 0.28, y: -0.95, rx: 0.1, ry: 0.1 }]);
  elipse(ctx, 0, -R * 0.72, R * 0.16, R * 0.1);
  ctx.fillStyle = '#6b4a3a';
  ctx.fill();
  traco(ctx, lw * 0.6);
}

// --------------------------------------------------------------- masmorra

function lencol(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.85, -R * 0.15);
    ctx.bezierCurveTo(-R * 1.0, -R * 1.2, -R * 0.6, -R * 1.9, 0, -R * 1.9);
    ctx.bezierCurveTo(R * 0.6, -R * 1.9, R * 1.0, -R * 1.2, R * 0.85, -R * 0.15);
    ctx.quadraticCurveTo(R * 0.55, R * 0.02, R * 0.4, -R * 0.22);
    ctx.quadraticCurveTo(R * 0.15, -R * 0.45, 0, -R * 0.12);
    ctx.quadraticCurveTo(-R * 0.2, R * 0.02, -R * 0.42, -R * 0.2);
    ctx.quadraticCurveTo(-R * 0.65, -R * 0.4, -R * 0.85, -R * 0.15);
    ctx.closePath();
  }, cor, -R * 1.9, 0, lw);
  brilho(ctx, -R * 0.3, -R * 1.45, R * 0.2, R * 0.1);
  olhos(ctx, R, lw, [{ x: -0.24, y: -1.15, rx: 0.16, ry: 0.2 }, { x: 0.24, y: -1.15, rx: 0.16, ry: 0.2 }]);
  sorriso(ctx, 0, -R * 0.75, R * 0.16, lw);
}

function caveira(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.55, -R * 0.55);
    ctx.quadraticCurveTo(-R * 0.7, -R * 0.25, -R * 0.25, -R * 0.22);
    ctx.lineTo(R * 0.25, -R * 0.22);
    ctx.quadraticCurveTo(R * 0.7, -R * 0.25, R * 0.55, -R * 0.55);
    ctx.quadraticCurveTo(R * 0.35, -R * 0.4, 0, -R * 0.42);
    ctx.quadraticCurveTo(-R * 0.35, -R * 0.4, -R * 0.55, -R * 0.55);
    ctx.closePath();
  }, cor, -R * 0.6, -R * 0.2, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.15, R * 0.72), cor, -R * 1.87, -R * 0.43, lw);
  elipse(ctx, -R * 0.26, -R * 1.2, R * 0.2, R * 0.24);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  elipse(ctx, R * 0.26, -R * 1.2, R * 0.2, R * 0.24);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -R * 0.95);
  ctx.lineTo(-R * 0.08, -R * 0.75);
  ctx.lineTo(R * 0.08, -R * 0.75);
  ctx.closePath();
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  for (const x of [-0.18, -0.06, 0.06, 0.18]) {
    rr(ctx, x * R - R * 0.04, -R * 0.4, R * 0.08, R * 0.1, R * 0.02);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}

function armadura(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = grad(ctx, -R * 1.6, 0, cor);
  const b = (x, y, w, h, r) => { rr(ctx, x, y, w, h, r); ctx.fill(); traco(ctx, lw); };
  b(-R * 0.32, -R * 0.42, R * 0.24, R * 0.42, R * 0.08);
  b(R * 0.1, -R * 0.42, R * 0.24, R * 0.42, R * 0.08);
  b(-R * 0.55, -R * 1.05, R * 1.1, R * 0.58, R * 0.12);
  b(-R * 1.0, -R * 1.0, R * 0.36, R * 0.28, R * 0.08);
  b(R * 0.66, -R * 1.0, R * 0.36, R * 0.28, R * 0.08);
  // elmo solto, bem acima do peito: o vao e o que diz que esta oca
  ctx.beginPath();
  ctx.moveTo(0, -R * 2.05);
  ctx.lineTo(R * 0.1, -R * 1.78);
  ctx.lineTo(-R * 0.06, -R * 1.82);
  ctx.closePath();
  ctx.fillStyle = cor.C;
  ctx.fill();
  traco(ctx, lw * 0.55);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.78, R * 0.32), cor, -R * 2.1, -R * 1.46, lw);
  elipse(ctx, 0, -R * 1.74, R * 0.18, R * 0.14);
  ctx.fillStyle = '#140c1c';
  ctx.fill();
  traco(ctx, lw * 0.65);
}

function corrente(ctx, R, cor) {
  const lw = lw0(R);
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
    const x = Math.cos(a) * R * 0.62;
    const y = -R * 1.0 + Math.sin(a) * R * 0.85;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(i % 2 ? 0 : Math.PI / 2);
    elipse(ctx, 0, 0, R * 0.16, R * 0.28);
    ctx.lineWidth = lw * 2.1;
    ctx.strokeStyle = cor.B;
    ctx.stroke();
    ctx.lineWidth = lw * 0.9;
    ctx.strokeStyle = cor.A;
    ctx.stroke();
    ctx.restore();
  }
  olhosBrilho(ctx, R, [{ x: -0.16, y: -1.05, rx: 0.1, ry: 0.12 }, { x: 0.16, y: -1.05, rx: 0.1, ry: 0.12 }], '#7ff3ff');
}

function mao(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = grad(ctx, -R * 1.9, 0, cor);
  const dedo = (x, y, w, h) => { rr(ctx, x, y, w, h, w * 0.45); ctx.fill(); traco(ctx, lw); };
  dedo(-R * 0.95, -R * 1.15, R * 0.32, R * 0.7);
  dedo(-R * 0.55, -R * 1.85, R * 0.28, R * 0.7);
  dedo(-R * 0.18, -R * 2.0, R * 0.28, R * 0.7);
  dedo(R * 0.16, -R * 1.85, R * 0.28, R * 0.7);
  dedo(R * 0.5, -R * 1.55, R * 0.28, R * 0.55);
  corpo(ctx, () => rr(ctx, -R * 0.7, -R * 1.25, R * 1.35, R * 1.05, R * 0.3), cor, -R * 1.25, -R * 0.2, lw);
  olhos(ctx, R, lw, [{ x: -0.22, y: -0.85, rx: 0.12, ry: 0.12 }, { x: 0.22, y: -0.85, rx: 0.12, ry: 0.12 }]);
  sorriso(ctx, 0, -R * 0.58, R * 0.16, lw);
}

function morcego(ctx, R, cor) {
  const lw = lw0(R);
  const asa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.15, -R * 0.8);
    ctx.quadraticCurveTo(s * R * 0.7, -R * 1.7, s * R * 0.35, -R * 1.95);
    ctx.quadraticCurveTo(s * R * 0.15, -R * 1.45, 0, -R * 1.15);
    ctx.quadraticCurveTo(s * R * 0.2, -R * 1.35, s * R * 0.55, -R * 1.15);
    ctx.quadraticCurveTo(s * R * 0.25, -R * 0.9, s * R * 0.15, -R * 0.8);
    ctx.closePath();
    ctx.fillStyle = grad(ctx, -R * 1.95, -R * 0.7, cor);
    ctx.fill();
    traco(ctx, lw);
  };
  asa(-1);
  asa(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.7, R * 0.28, R * 0.48), cor, -R * 1.18, -R * 0.22, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.2, R * 0.22), cor, -R * 1.42, -R * 0.98, lw);
  const orelha = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.05, -R * 1.35);
    ctx.lineTo(s * R * 0.22, -R * 1.72);
    ctx.lineTo(s * R * 0.2, -R * 1.28);
    ctx.closePath();
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw * 0.7);
  };
  orelha(-1);
  orelha(1);
  olhosBrilho(ctx, R, [{ x: -0.08, y: -1.22, rx: 0.06, ry: 0.06 }, { x: 0.08, y: -1.22, rx: 0.06, ry: 0.06 }], '#ffd23f');
  rr(ctx, -R * 0.16, -R * 0.22, R * 0.12, R * 0.18, R * 0.04);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.6);
  rr(ctx, R * 0.04, -R * 0.22, R * 0.12, R * 0.18, R * 0.04);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.6);
}

function sombra(ctx, R, cor) {
  const lw = lw0(R);
  const chifre = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.25, -R * 1.45);
    ctx.quadraticCurveTo(s * R * 0.55, -R * 1.9, s * R * 0.7, -R * 1.7);
    ctx.quadraticCurveTo(s * R * 0.4, -R * 1.55, s * R * 0.35, -R * 1.3);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  chifre(-1);
  chifre(1);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(0, -R * 1.7);
    ctx.bezierCurveTo(R * 0.9, -R * 1.4, R * 1.05, -R * 0.4, R * 0.55, -R * 0.05);
    ctx.quadraticCurveTo(0, R * 0.08, -R * 0.55, -R * 0.05);
    ctx.bezierCurveTo(-R * 1.05, -R * 0.4, -R * 0.9, -R * 1.4, 0, -R * 1.7);
    ctx.closePath();
  }, cor, -R * 1.7, 0, lw);
  olhosBrilho(ctx, R, [{ x: -0.22, y: -0.9, rx: 0.12, ry: 0.16 }, { x: 0.22, y: -0.9, rx: 0.12, ry: 0.16 }], '#ff5a7a');
}

function lanterna(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  ctx.arc(0, -R * 1.48, R * 0.34, Math.PI, 0, true);
  ctx.lineWidth = lw * 1.6;
  ctx.strokeStyle = cor.B;
  ctx.stroke();
  traco(ctx, lw * 0.55);
  rr(ctx, -R * 0.32, -R * 0.22, R * 0.22, R * 0.22, R * 0.06);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  rr(ctx, R * 0.1, -R * 0.22, R * 0.22, R * 0.22, R * 0.06);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.32, -R * 1.42);
    ctx.lineTo(-R * 0.55, -R * 0.9);
    ctx.lineTo(-R * 0.32, -R * 0.38);
    ctx.lineTo(R * 0.32, -R * 0.38);
    ctx.lineTo(R * 0.55, -R * 0.9);
    ctx.lineTo(R * 0.32, -R * 1.42);
    ctx.closePath();
  }, cor, -R * 1.42, -R * 0.38, lw);
  rr(ctx, -R * 0.4, -R * 1.58, R * 0.8, R * 0.18, R * 0.06);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  rr(ctx, -R * 0.42, -R * 0.4, R * 0.84, R * 0.16, R * 0.05);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  elipse(ctx, 0, -R * 0.92, R * 0.22, R * 0.28);
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  olhosBrilho(ctx, R, [{ x: -0.08, y: -0.98, rx: 0.07, ry: 0.08 }, { x: 0.08, y: -0.98, rx: 0.07, ry: 0.08 }], '#fff4c4');
}

function mascara(ctx, R, cor) {
  const lw = lw0(R);
  const fita = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.45, -R * 1.15);
    ctx.quadraticCurveTo(s * R * 0.85, -R * 0.6, s * R * 0.55, -R * 0.02);
    ctx.quadraticCurveTo(s * R * 0.35, -R * 0.5, s * R * 0.4, -R * 1.05);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  fita(-1);
  fita(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 1.15, R * 0.7, R * 0.78), cor, -R * 1.93, -R * 0.37, lw);
  olhos(ctx, R, lw, [{ x: -0.24, y: -1.3, rx: 0.14, ry: 0.16 }, { x: 0.24, y: -1.3, rx: 0.14, ry: 0.16 }]);
  ctx.beginPath();
  ctx.moveTo(-R * 0.32, -R * 0.85);
  ctx.quadraticCurveTo(0, -R * 0.45, R * 0.32, -R * 0.85);
  ctx.lineWidth = lw;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
}

function esqueleto(ctx, R, cor) {
  const lw = lw0(R);
  const osso = (x, y, w, h, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    rr(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.4);
    ctx.fillStyle = cor.C;
    ctx.fill();
    traco(ctx, lw * 0.7);
    ctx.restore();
  };
  osso(-R * 0.55, -R * 0.85, R * 0.16, R * 0.55, 0.5);
  osso(R * 0.55, -R * 0.85, R * 0.16, R * 0.55, -0.5);
  osso(-R * 0.16, -R * 0.22, R * 0.16, R * 0.4, 0.08);
  osso(R * 0.16, -R * 0.22, R * 0.16, R * 0.4, -0.08);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.75, R * 0.42, R * 0.48), cor, -R * 1.23, -R * 0.27, lw);
  for (const y of [-0.95, -0.75, -0.55]) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.28, y * R);
    ctx.quadraticCurveTo(0, y * R + R * 0.08, R * 0.28, y * R);
    ctx.lineWidth = lw * 0.7;
    ctx.strokeStyle = TINTA;
    ctx.stroke();
  }
  corpo(ctx, () => circulo(ctx, 0, -R * 1.5, R * 0.4), cor, -R * 1.9, -R * 1.1, lw);
  elipse(ctx, -R * 0.14, -R * 1.55, R * 0.1, R * 0.12);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  elipse(ctx, R * 0.14, -R * 1.55, R * 0.1, R * 0.12);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-R * 0.1, -R * 1.32);
  ctx.quadraticCurveTo(0, -R * 1.22, R * 0.1, -R * 1.32);
  traco(ctx, lw * 0.6);
}

// ----------------------------------------------------------------- vulcao

function dragao(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  ctx.moveTo(-R * 0.45, -R * 0.55);
  ctx.quadraticCurveTo(-R * 0.95, -R * 0.28, -R * 1.08, -R * 0.08);
  ctx.lineTo(-R * 0.82, -R * 0.02);
  ctx.quadraticCurveTo(-R * 0.6, -R * 0.12, -R * 0.28, -R * 0.38);
  ctx.closePath();
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  const asa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.2, -R * 0.95);
    ctx.quadraticCurveTo(s * R * 1.05, -R * 1.65, s * R * 0.72, -R * 1.15);
    ctx.quadraticCurveTo(s * R * 0.9, -R * 0.75, s * R * 0.25, -R * 0.62);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  asa(-1);
  asa(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.62, R * 0.7, R * 0.52), cor, -R * 1.14, -R * 0.1, lw);
  elipse(ctx, 0, -R * 0.5, R * 0.38, R * 0.3);
  ctx.fillStyle = '#ffe2a8';
  ctx.fill();
  const chifre = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.08, -R * 1.45);
    ctx.lineTo(s * R * 0.28, -R * 1.82);
    ctx.lineTo(s * R * 0.22, -R * 1.38);
    ctx.closePath();
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    traco(ctx, lw * 0.6);
  };
  chifre(-1);
  chifre(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 1.28, R * 0.4, R * 0.32), cor, -R * 1.6, -R * 0.96, lw);
  elipse(ctx, R * 0.28, -R * 1.18, R * 0.22, R * 0.12);
  ctx.fillStyle = cor.A;
  ctx.fill();
  traco(ctx, lw * 0.7);
  rr(ctx, -R * 0.38, -R * 0.2, R * 0.22, R * 0.2, R * 0.05);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  rr(ctx, R * 0.14, -R * 0.2, R * 0.22, R * 0.2, R * 0.05);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  olhos(ctx, R, lw, [{ x: -0.12, y: -1.34, rx: 0.08, ry: 0.09, cor: '#ffd23f' }, { x: 0.12, y: -1.34, rx: 0.08, ry: 0.09, cor: '#ffd23f' }]);
}

function salamandra(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => elipse(ctx, R * 0.05, -R * 0.38, R * 1.0, R * 0.28), cor, -R * 0.66, -R * 0.1, lw);
  const pata = (x) => {
    rr(ctx, x, -R * 0.2, R * 0.16, R * 0.2, R * 0.05);
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw * 0.6);
  };
  pata(-R * 0.7);
  pata(-R * 0.35);
  pata(R * 0.25);
  pata(R * 0.6);
  for (const x of [-0.4, -0.1, 0.2, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(x * R, -R * 0.62);
    ctx.quadraticCurveTo(x * R + R * 0.12, -R * 1.0, x * R + R * 0.02, -R * 0.7);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    traco(ctx, lw * 0.5);
  }
  corpo(ctx, () => elipse(ctx, -R * 0.85, -R * 0.55, R * 0.28, R * 0.2), cor, -R * 0.75, -R * 0.35, lw);
  olhos(ctx, R, lw, [{ x: -0.95, y: -0.58, rx: 0.07, ry: 0.07, cor: '#ffd23f' }, { x: -0.75, y: -0.58, rx: 0.07, ry: 0.07, cor: '#ffd23f' }]);
  ctx.beginPath();
  ctx.moveTo(R * 0.95, -R * 0.35);
  ctx.quadraticCurveTo(R * 1.15, -R * 0.15, R * 0.85, -R * 0.18);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
}

function ovo(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.78, R * 0.68, R * 0.78), cor, -R * 1.56, 0, lw);
  ctx.beginPath();
  ctx.moveTo(-R * 0.22, -R * 1.48);
  ctx.lineTo(0, -R * 1.05);
  ctx.lineTo(R * 0.24, -R * 1.5);
  ctx.closePath();
  ctx.fillStyle = '#3a120c';
  ctx.fill();
  traco(ctx, lw * 0.7);
  ctx.beginPath();
  ctx.moveTo(-R * 0.16, -R * 1.5);
  ctx.quadraticCurveTo(-R * 0.28, -R * 1.9, 0, -R * 2.02);
  ctx.quadraticCurveTo(R * 0.3, -R * 1.85, R * 0.14, -R * 1.48);
  ctx.closePath();
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  traco(ctx, lw * 0.7);
  olhos(ctx, R, lw, [{ x: -0.08, y: -1.32, rx: 0.07, ry: 0.07, cor: '#ffd23f' }, { x: 0.1, y: -1.32, rx: 0.07, ry: 0.07, cor: '#ffd23f' }]);
}

function imp(ctx, R, cor) {
  const lw = lw0(R);
  const asa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.2, -R * 0.55);
    ctx.quadraticCurveTo(s * R * 0.7, -R * 0.9, s * R * 0.45, -R * 0.35);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw * 0.7);
  };
  asa(-1);
  asa(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.4, R * 0.38, R * 0.32), cor, -R * 0.72, -R * 0.08, lw);
  rr(ctx, -R * 0.2, -R * 0.16, R * 0.14, R * 0.16, R * 0.04);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.6);
  rr(ctx, R * 0.06, -R * 0.16, R * 0.14, R * 0.16, R * 0.04);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.6);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.15, R * 0.62), cor, -R * 1.77, -R * 0.53, lw);
  const chifre = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.2, -R * 1.6);
    ctx.lineTo(s * R * 0.45, -R * 1.95);
    ctx.lineTo(s * R * 0.4, -R * 1.5);
    ctx.closePath();
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    traco(ctx, lw * 0.7);
  };
  chifre(-1);
  chifre(1);
  olhos(ctx, R, lw, [{ x: -0.2, y: -1.2, rx: 0.12, ry: 0.14, cor: '#ffd23f' }, { x: 0.2, y: -1.2, rx: 0.12, ry: 0.14, cor: '#ffd23f' }]);
  sorriso(ctx, 0, -R * 0.9, R * 0.16, lw);
}

function tartaruga(ctx, R, cor) {
  const lw = lw0(R);
  const pe = (x, y) => {
    rr(ctx, x, y, R * 0.22, R * 0.16, R * 0.05);
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw * 0.6);
  };
  pe(-R * 0.7, -R * 0.22);
  pe(R * 0.48, -R * 0.22);
  pe(-R * 0.55, -R * 0.55);
  pe(R * 0.35, -R * 0.55);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.7, R * 0.85, R * 0.55), cor, -R * 1.25, -R * 0.15, lw);
  ctx.beginPath();
  ctx.moveTo(-R * 0.2, -R * 1.15);
  ctx.lineTo(R * 0.3, -R * 0.45);
  ctx.moveTo(R * 0.1, -R * 1.2);
  ctx.lineTo(-R * 0.3, -R * 0.4);
  ctx.lineWidth = lw * 0.6;
  ctx.strokeStyle = '#ffd23f';
  ctx.stroke();
  corpo(ctx, () => elipse(ctx, -R * 0.95, -R * 0.85, R * 0.28, R * 0.2), cor, -R * 1.05, -R * 0.65, lw);
  olhos(ctx, R, lw, [{ x: -1.05, y: -0.9, rx: 0.07, ry: 0.07, cor: '#ffd23f' }, { x: -0.85, y: -0.9, rx: 0.07, ry: 0.07, cor: '#ffd23f' }]);
}

function serpente(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  ctx.moveTo(-R * 0.1, -R * 0.18);
  ctx.bezierCurveTo(-R * 1.05, -R * 0.15, -R * 1.1, -R * 1.05, 0, -R * 1.05);
  ctx.bezierCurveTo(R * 0.85, -R * 1.05, R * 0.8, -R * 0.35, R * 0.05, -R * 0.48);
  ctx.bezierCurveTo(-R * 0.4, -R * 0.58, -R * 0.15, -R * 0.95, R * 0.05, -R * 1.45);
  ctx.lineWidth = R * 0.34;
  ctx.lineCap = 'round';
  ctx.strokeStyle = TINTA;
  ctx.stroke();
  ctx.lineWidth = R * 0.22;
  ctx.strokeStyle = cor.A;
  ctx.stroke();
  corpo(ctx, () => elipse(ctx, R * 0.08, -R * 1.62, R * 0.28, R * 0.22), cor, -R * 1.84, -R * 1.4, lw);
  olhos(ctx, R, lw, [{ x: -0.02, y: -1.66, rx: 0.06, ry: 0.06, cor: '#ffd23f' }, { x: 0.14, y: -1.66, rx: 0.06, ry: 0.06, cor: '#ffd23f' }]);
  ctx.beginPath();
  ctx.moveTo(R * 0.32, -R * 1.58);
  ctx.lineTo(R * 0.52, -R * 1.68);
  ctx.moveTo(R * 0.32, -R * 1.58);
  ctx.lineTo(R * 0.5, -R * 1.48);
  ctx.lineWidth = lw * 0.55;
  ctx.strokeStyle = '#ffd23f';
  ctx.stroke();
}

function elemental(ctx, R, cor) {
  const lw = lw0(R);
  const lingua = (x, y, s) => {
    ctx.beginPath();
    ctx.moveTo(x, -R * 0.15);
    ctx.quadraticCurveTo(x + s, y, x + s * 0.3, -R * 0.55);
    ctx.quadraticCurveTo(x + s * 0.6, -R * 0.2, x, -R * 0.15);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    traco(ctx, lw * 0.6);
  };
  lingua(-R * 0.45, -R * 0.7, -R * 0.35);
  lingua(R * 0.45, -R * 0.85, R * 0.4);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(0, -R * 1.9);
    ctx.bezierCurveTo(R * 0.55, -R * 1.4, R * 0.85, -R * 0.6, R * 0.4, -R * 0.05);
    ctx.quadraticCurveTo(0, R * 0.06, -R * 0.4, -R * 0.05);
    ctx.bezierCurveTo(-R * 0.85, -R * 0.6, -R * 0.55, -R * 1.4, 0, -R * 1.9);
    ctx.closePath();
  }, cor, -R * 1.9, 0, lw);
  brilho(ctx, -R * 0.12, -R * 1.4, R * 0.1, R * 0.16, 0);
  olhos(ctx, R, lw, [{ x: -0.16, y: -1.05, rx: 0.1, ry: 0.12, cor: '#ffd23f' }, { x: 0.16, y: -1.05, rx: 0.1, ry: 0.12, cor: '#ffd23f' }]);
  sorriso(ctx, 0, -R * 0.75, R * 0.12, lw);
}

function wyvern(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  ctx.moveTo(R * 0.05, -R * 0.4);
  ctx.quadraticCurveTo(R * 0.7, -R * 0.15, R * 1.0, -R * 0.02);
  ctx.quadraticCurveTo(R * 0.55, -R * 0.22, R * 0.1, -R * 0.28);
  ctx.closePath();
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  const asa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.12, -R * 0.9);
    ctx.lineTo(s * R * 0.38, -R * 1.7);
    ctx.lineTo(s * R * 1.02, -R * 1.15);
    ctx.lineTo(s * R * 0.22, -R * 0.42);
    ctx.closePath();
    ctx.fillStyle = grad(ctx, -R * 1.7, -R * 0.42, cor);
    ctx.fill();
    traco(ctx, lw);
  };
  asa(-1);
  asa(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.58, R * 0.38, R * 0.48), cor, -R * 1.06, -R * 0.1, lw);
  rr(ctx, -R * 0.34, -R * 0.32, R * 0.22, R * 0.32, R * 0.08);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  rr(ctx, R * 0.12, -R * 0.32, R * 0.22, R * 0.32, R * 0.08);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  corpo(ctx, () => elipse(ctx, 0, -R * 1.22, R * 0.32, R * 0.26), cor, -R * 1.48, -R * 0.96, lw);
  elipse(ctx, R * 0.22, -R * 1.12, R * 0.18, R * 0.1);
  ctx.fillStyle = cor.A;
  ctx.fill();
  traco(ctx, lw * 0.65);
  olhos(ctx, R, lw, [{ x: -0.1, y: -1.28, rx: 0.07, ry: 0.07, cor: '#ffd23f' }, { x: 0.08, y: -1.28, rx: 0.07, ry: 0.07, cor: '#ffd23f' }]);
}

function verme(ctx, R, cor) {
  const lw = lw0(R);
  elipse(ctx, 0, -R * 0.08, R * 0.7, R * 0.1);
  ctx.fillStyle = '#4a2018';
  ctx.fill();
  const anel = (y, rx, ry) => corpo(ctx, () => elipse(ctx, 0, y, rx, ry), cor, y - ry, y + ry, lw);
  anel(-R * 0.35, R * 0.55, R * 0.28);
  anel(-R * 0.8, R * 0.48, R * 0.26);
  anel(-R * 1.25, R * 0.42, R * 0.26);
  corpo(ctx, () => elipse(ctx, 0, -R * 1.65, R * 0.38, R * 0.3), cor, -R * 1.95, -R * 1.35, lw);
  elipse(ctx, 0, -R * 1.62, R * 0.16, R * 0.18);
  ctx.fillStyle = '#3a0f3e';
  ctx.fill();
  traco(ctx, lw * 0.7);
  olhos(ctx, R, lw, [{ x: -0.18, y: -1.78, rx: 0.07, ry: 0.07, cor: '#ffd23f' }, { x: 0.18, y: -1.78, rx: 0.07, ry: 0.07, cor: '#ffd23f' }]);
}

function duasCabecas(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  ctx.moveTo(R * 0.15, -R * 0.55);
  ctx.quadraticCurveTo(R * 0.7, -R * 0.2, R * 0.95, -R * 0.5);
  ctx.quadraticCurveTo(R * 0.5, -R * 0.35, R * 0.2, -R * 0.65);
  ctx.closePath();
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.55, R * 0.7, R * 0.48), cor, -R * 1.03, -R * 0.07, lw);
  rr(ctx, -R * 0.35, -R * 0.18, R * 0.2, R * 0.18, R * 0.05);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.6);
  rr(ctx, R * 0.15, -R * 0.18, R * 0.2, R * 0.18, R * 0.05);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.6);
  const cabeca = (x) => {
    corpo(ctx, () => circulo(ctx, x, -R * 1.35, R * 0.36), cor, -R * 1.71, -R * 0.99, lw);
    olhos(ctx, R, lw, [
      { x: x / R - 0.12, y: -1.4, rx: 0.07, ry: 0.08, cor: '#ffd23f' },
      { x: x / R + 0.1, y: -1.4, rx: 0.07, ry: 0.08, cor: '#ffd23f' },
    ]);
    sorriso(ctx, x, -R * 1.18, R * 0.1, lw);
  };
  cabeca(-R * 0.34);
  cabeca(R * 0.34);
}

const DESENHOS = {
  '01': gota, '02': poca, '03': torre, '04': lesma, '05': ameba,
  '06': sapo, '07': dupla, '08': caracol, '09': taca, '10': medusa,
  '11': pilha, '12': pedregulho, '13': muralha, '14': estatua, '15': martelo,
  '16': arco, '17': rolamento, '18': cristal, '19': mascaraPedra, '20': totem,
  '21': yeti, '22': pinguim, '23': boneco, '24': cubo, '25': floco,
  '26': foca, '27': pinheiro, '28': estalactite, '29': coruja, '30': morsa,
  '31': lencol, '32': caveira, '33': armadura, '34': corrente, '35': mao,
  '36': morcego, '37': sombra, '38': lanterna, '39': mascara, '40': esqueleto,
  '41': dragao, '42': salamandra, '43': ovo, '44': imp, '45': tartaruga,
  '46': serpente, '47': elemental, '48': wyvern, '49': verme, '50': duasCabecas,
};

/**
 * Desenha o layout `id` com a origem nos pes.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} id
 * @param {number} R
 */
export function desenharLayout(ctx, id, R) {
  const item = porId(id);
  const fn = DESENHOS[id];
  if (!item || !fn) throw new Error('layout desconhecido: ' + id);
  fn(ctx, R, CORES[item.reino]);
}

export { CATALOGO, REINOS, CORES, lw0, traco, corpo, brilho, olhos, sorriso };
