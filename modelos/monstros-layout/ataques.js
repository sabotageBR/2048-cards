// Pose de golpe dos layouts escolhidos. Mesma massa e o mesmo numero de
// membros do parado; o que muda e o gesto e o projetil. Origem nos pes.
import { TINTA, circulo, elipse, rr } from '../../src/render/desenho.js';
import { porId } from './catalogo.js';
import { CORES, brilho, corpo, lw0, olhos, sorriso, traco } from './silhuetas.js';

function boca(ctx, x, y, rx, ry, lw) {
  elipse(ctx, x, y, rx, ry);
  ctx.fillStyle = '#3a0f3e';
  ctx.fill();
  traco(ctx, lw * 0.7);
}

function tiro(ctx, x, y, r, fill, lw) {
  circulo(ctx, x, y, r);
  ctx.fillStyle = fill;
  ctx.fill();
  traco(ctx, lw * 0.8);
}

function gota(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(R * 0.42, -R * 1.62);
    ctx.bezierCurveTo(R * 1.15, -R * 1.35, R * 1.22, -R * 0.55, R * 0.72, -R * 0.06);
    ctx.quadraticCurveTo(R * 0.42, R * 0.1, R * 0.16, 0);
    ctx.quadraticCurveTo(-R * 0.1, R * 0.08, -R * 0.4, 0);
    ctx.quadraticCurveTo(-R * 0.7, R * 0.06, -R * 0.62, -R * 0.2);
    ctx.bezierCurveTo(-R * 0.7, -R * 0.85, -R * 0.2, -R * 1.4, R * 0.42, -R * 1.62);
    ctx.closePath();
  }, cor, -R * 1.62, 0, lw);
  brilho(ctx, R * 0.05, -R * 1.2, R * 0.16, R * 0.08);
  olhos(ctx, R, lw, [{ x: 0.12, y: -0.95, rx: 0.16, ry: 0.2 }, { x: 0.5, y: -0.9, rx: 0.16, ry: 0.2 }]);
  boca(ctx, R * 0.55, -R * 0.52, R * 0.16, R * 0.2, lw);
  tiro(ctx, R * 1.2, -R * 0.72, R * 0.16, cor.A, lw);
}

function ameba(ctx, R, cor) {
  const lw = lw0(R);
  const lobo = (x, y, rx, ry) => corpo(ctx, () => elipse(ctx, x, y, rx, ry), cor, y - ry, y + ry, lw);
  lobo(-R * 0.85, -R * 0.7, R * 0.28, R * 0.22);
  lobo(-R * 0.05, -R * 1.5, R * 0.26, R * 0.3);
  lobo(0, -R * 0.85, R * 0.58, R * 0.55);
  lobo(R * 1.05, -R * 0.72, R * 0.48, R * 0.26);
  brilho(ctx, -R * 0.18, -R * 1.15, R * 0.12, R * 0.06);
  olhos(ctx, R, lw, [{ x: -0.12, y: -0.95, rx: 0.13, ry: 0.15 }, { x: 0.22, y: -0.95, rx: 0.13, ry: 0.15 }]);
  boca(ctx, R * 0.15, -R * 0.58, R * 0.14, R * 0.16, lw);
}

function pedregulho(ctx, R, cor) {
  const lw = lw0(R);
  const pe = (x) => {
    rr(ctx, x, -R * 0.22, R * 0.22, R * 0.22, R * 0.06);
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  pe(-R * 0.42);
  pe(R * 0.12);
  corpo(ctx, () => circulo(ctx, -R * 1.05, -R * 0.32, R * 0.26), cor, -R * 0.58, -R * 0.06, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.0, R * 0.78), cor, -R * 1.78, -R * 0.22, lw);
  corpo(ctx, () => circulo(ctx, R * 1.22, -R * 0.78, R * 0.32), cor, -R * 1.1, -R * 0.46, lw);
  brilho(ctx, -R * 0.28, -R * 1.38, R * 0.18, R * 0.09);
  olhos(ctx, R, lw, [{ x: -0.18, y: -1.08, rx: 0.13, ry: 0.13 }, { x: 0.28, y: -1.05, rx: 0.13, ry: 0.13 }]);
  boca(ctx, R * 0.1, -R * 0.72, R * 0.14, R * 0.16, lw);
}

function muralha(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => rr(ctx, -R * 1.12, -R * 1.15, R * 2.24, R * 1.15, R * 0.06), cor, -R * 1.15, 0, lw);
  for (const x of [-0.9, -0.3, 0.3, 0.9]) {
    corpo(ctx, () => rr(ctx, x * R - R * 0.16, -R * 1.48, R * 0.32, R * 0.4, R * 0.04), cor, -R * 1.48, -R * 1.08, lw);
  }
  olhos(ctx, R, lw, [{ x: -0.28, y: -0.78, rx: 0.14, ry: 0.12 }, { x: 0.28, y: -0.78, rx: 0.14, ry: 0.12 }]);
  boca(ctx, 0, -R * 0.4, R * 0.22, R * 0.16, lw);
  corpo(ctx, () => rr(ctx, R * 1.28, -R * 0.58, R * 0.34, R * 0.26, R * 0.04), cor, -R * 0.58, -R * 0.32, lw);
}

function martelo(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = cor.B;
  rr(ctx, -R * 0.14, -R * 1.15, R * 0.28, R * 1.15, R * 0.06);
  ctx.fill();
  traco(ctx, lw);
  ctx.save();
  ctx.translate(0, -R * 1.15);
  ctx.rotate(0.95);
  corpo(ctx, () => rr(ctx, -R * 0.85, -R * 0.72, R * 1.7, R * 0.58, R * 0.12), cor, -R * 0.72, -R * 0.14, lw);
  olhos(ctx, R, lw, [{ x: -0.28, y: -0.46, rx: 0.11, ry: 0.11 }, { x: 0.28, y: -0.46, rx: 0.11, ry: 0.11 }]);
  sorriso(ctx, 0, -R * 0.28, R * 0.14, lw);
  ctx.restore();
}

function rolamento(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  elipse(ctx, 0, -R * 0.28, R * 0.95, R * 0.28);
  ctx.lineWidth = R * 0.22;
  ctx.strokeStyle = cor.B;
  ctx.stroke();
  traco(ctx, lw);
  ctx.save();
  ctx.translate(0, -R * 1.05);
  ctx.rotate(-0.8);
  corpo(ctx, () => circulo(ctx, 0, 0, R * 0.62), cor, -R * 0.62, R * 0.62, lw);
  brilho(ctx, -R * 0.2, -R * 0.22, R * 0.14, R * 0.07);
  olhos(ctx, R, lw, [{ x: -0.18, y: -0.08, rx: 0.11, ry: 0.11 }, { x: 0.18, y: -0.08, rx: 0.11, ry: 0.11 }]);
  sorriso(ctx, 0, R * 0.18, R * 0.12, lw);
  ctx.restore();
  tiro(ctx, R * 1.15, -R * 0.85, R * 0.14, cor.A, lw);
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
  elipse(ctx, -R * 0.28, -R * 1.32, R * 0.18, R * 0.16);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  traco(ctx, lw * 0.7);
  elipse(ctx, R * 0.28, -R * 1.32, R * 0.18, R * 0.16);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  traco(ctx, lw * 0.7);
  boca(ctx, 0, -R * 0.72, R * 0.28, R * 0.32, lw);
  tiro(ctx, R * 1.15, -R * 0.72, R * 0.16, cor.A, lw);
}

function cubo(ctx, R, cor) {
  const lw = lw0(R);
  const membro = (x, y, w, h) => {
    rr(ctx, x, y, w, h, R * 0.08);
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw);
  };
  membro(-R * 1.15, -R * 0.95, R * 0.28, R * 0.2);
  membro(R * 0.4, -R * 1.18, R * 0.95, R * 0.26);
  membro(-R * 0.48, -R * 0.16, R * 0.32, R * 0.16);
  membro(R * 0.16, -R * 0.16, R * 0.32, R * 0.16);
  corpo(ctx, () => rr(ctx, -R * 0.72, -R * 1.55, R * 1.44, R * 1.28, R * 0.16), cor, -R * 1.55, -R * 0.27, lw);
  ctx.beginPath();
  ctx.moveTo(-R * 0.35, -R * 1.35);
  ctx.lineTo(R * 0.2, -R * 0.5);
  ctx.lineWidth = lw;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.stroke();
  olhos(ctx, R, lw, [{ x: -0.16, y: -1.05, rx: 0.11, ry: 0.11 }, { x: 0.28, y: -1.02, rx: 0.11, ry: 0.11 }]);
  boca(ctx, R * 0.08, -R * 0.72, R * 0.14, R * 0.12, lw);
  tiro(ctx, R * 1.28, -R * 1.05, R * 0.12, cor.C, lw);
}

function lencol(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.7, -R * 0.12);
    ctx.bezierCurveTo(-R * 0.55, -R * 1.05, R * 0.05, -R * 1.85, R * 0.45, -R * 1.72);
    ctx.bezierCurveTo(R * 1.05, -R * 1.45, R * 1.15, -R * 0.7, R * 0.78, -R * 0.12);
    ctx.quadraticCurveTo(R * 0.5, R * 0.08, R * 0.28, -R * 0.28);
    ctx.quadraticCurveTo(0, -R * 0.05, -R * 0.22, -R * 0.32);
    ctx.quadraticCurveTo(-R * 0.5, -R * 0.05, -R * 0.7, -R * 0.12);
    ctx.closePath();
  }, cor, -R * 1.85, 0, lw);
  brilho(ctx, R * 0.15, -R * 1.4, R * 0.16, R * 0.08);
  olhos(ctx, R, lw, [{ x: 0.05, y: -1.15, rx: 0.15, ry: 0.18 }, { x: 0.42, y: -1.08, rx: 0.15, ry: 0.18 }]);
  boca(ctx, R * 0.32, -R * 0.7, R * 0.16, R * 0.2, lw);
}

function caveira(ctx, R, cor) {
  const lw = lw0(R);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.5, -R * 0.28);
    ctx.quadraticCurveTo(-R * 0.62, R * 0.02, -R * 0.15, 0);
    ctx.lineTo(R * 0.2, 0);
    ctx.quadraticCurveTo(R * 0.7, -R * 0.02, R * 0.5, -R * 0.32);
    ctx.quadraticCurveTo(R * 0.15, -R * 0.12, -R * 0.15, -R * 0.16);
    ctx.quadraticCurveTo(-R * 0.4, -R * 0.14, -R * 0.5, -R * 0.28);
    ctx.closePath();
  }, cor, -R * 0.32, R * 0.02, lw);
  corpo(ctx, () => circulo(ctx, 0, -R * 1.2, R * 0.7), cor, -R * 1.9, -R * 0.5, lw);
  elipse(ctx, -R * 0.24, -R * 1.28, R * 0.18, R * 0.22);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  elipse(ctx, R * 0.24, -R * 1.28, R * 0.18, R * 0.22);
  ctx.fillStyle = '#1a0d22';
  ctx.fill();
  boca(ctx, R * 0.08, -R * 0.62, R * 0.22, R * 0.16, lw);
  for (const x of [-0.12, 0.02, 0.16]) {
    rr(ctx, x * R, -R * 0.12, R * 0.08, R * 0.1, R * 0.02);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  tiro(ctx, R * 1.05, -R * 0.85, R * 0.14, cor.C, lw);
}

function mao(ctx, R, cor) {
  const lw = lw0(R);
  ctx.fillStyle = cor.B;
  rr(ctx, -R * 0.22, -R * 0.42, R * 0.44, R * 0.42, R * 0.12);
  ctx.fill();
  traco(ctx, lw);
  corpo(ctx, () => elipse(ctx, R * 0.05, -R * 0.85, R * 0.62, R * 0.5), cor, -R * 1.35, -R * 0.35, lw);
  const dedo = (x, y, w, h) => {
    rr(ctx, x, y, w, h, h * 0.45);
    ctx.fillStyle = cor.A;
    ctx.fill();
    traco(ctx, lw);
  };
  dedo(R * 0.35, -R * 1.28, R * 0.7, R * 0.24);
  dedo(R * 0.42, -R * 1.0, R * 0.78, R * 0.22);
  dedo(R * 0.4, -R * 0.74, R * 0.72, R * 0.22);
  dedo(R * 0.28, -R * 0.5, R * 0.5, R * 0.2);
  dedo(-R * 0.05, -R * 1.22, R * 0.28, R * 0.42);
  olhos(ctx, R, lw, [{ x: -0.12, y: -0.95, rx: 0.1, ry: 0.11 }, { x: 0.18, y: -0.92, rx: 0.1, ry: 0.11 }]);
  sorriso(ctx, R * 0.05, -R * 0.62, R * 0.14, lw);
}

function mascara(ctx, R, cor) {
  const lw = lw0(R);
  const fita = (s, curva) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.4, -R * 1.35);
    ctx.quadraticCurveTo(s * R * 1.05, -R * curva, s * R * 0.85, -R * 0.15);
    ctx.quadraticCurveTo(s * R * 0.55, -R * 0.7, s * R * 0.32, -R * 1.2);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  fita(-1, 1.55);
  fita(1, 0.35);
  corpo(ctx, () => elipse(ctx, 0, -R * 1.15, R * 0.7, R * 0.78), cor, -R * 1.93, -R * 0.37, lw);
  olhos(ctx, R, lw, [{ x: -0.22, y: -1.32, rx: 0.13, ry: 0.15 }, { x: 0.24, y: -1.32, rx: 0.13, ry: 0.15 }]);
  boca(ctx, 0, -R * 0.78, R * 0.28, R * 0.22, lw);
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
  osso(-R * 0.62, -R * 0.55, R * 0.16, R * 0.5, 0.9);
  osso(R * 0.22, -R * 1.55, R * 0.16, R * 0.55, -0.35);
  osso(-R * 0.16, -R * 0.22, R * 0.16, R * 0.4, 0.15);
  osso(R * 0.2, -R * 0.2, R * 0.16, R * 0.38, -0.2);
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
  boca(ctx, 0, -R * 1.28, R * 0.12, R * 0.08, lw);
}

function dragao(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  ctx.moveTo(-R * 0.35, -R * 0.48);
  ctx.quadraticCurveTo(-R * 0.9, -R * 0.2, -R * 1.05, 0);
  ctx.lineTo(-R * 0.78, -R * 0.02);
  ctx.quadraticCurveTo(-R * 0.5, -R * 0.15, -R * 0.22, -R * 0.35);
  ctx.closePath();
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw);
  const asa = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.15, -R * 1.05);
    ctx.quadraticCurveTo(s * R * 1.15, -R * 2.05, s * R * 0.55, -R * 1.35);
    ctx.quadraticCurveTo(s * R * 0.95, -R * 0.85, s * R * 0.2, -R * 0.7);
    ctx.closePath();
    ctx.fillStyle = cor.B;
    ctx.fill();
    traco(ctx, lw);
  };
  asa(-1);
  asa(1);
  corpo(ctx, () => elipse(ctx, 0, -R * 0.62, R * 0.68, R * 0.5), cor, -R * 1.12, -R * 0.12, lw);
  elipse(ctx, 0, -R * 0.5, R * 0.36, R * 0.28);
  ctx.fillStyle = '#ffe2a8';
  ctx.fill();
  const chifre = (s) => {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.08, -R * 1.5);
    ctx.lineTo(s * R * 0.22, -R * 1.9);
    ctx.lineTo(s * R * 0.2, -R * 1.42);
    ctx.closePath();
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    traco(ctx, lw * 0.6);
  };
  chifre(-1);
  chifre(1);
  corpo(ctx, () => elipse(ctx, R * 0.08, -R * 1.28, R * 0.4, R * 0.3), cor, -R * 1.58, -R * 0.98, lw);
  elipse(ctx, R * 0.4, -R * 1.18, R * 0.2, R * 0.1);
  ctx.fillStyle = cor.A;
  ctx.fill();
  traco(ctx, lw * 0.7);
  rr(ctx, -R * 0.38, -R * 0.18, R * 0.22, R * 0.18, R * 0.05);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  rr(ctx, R * 0.16, -R * 0.18, R * 0.22, R * 0.18, R * 0.05);
  ctx.fillStyle = cor.B;
  ctx.fill();
  traco(ctx, lw * 0.7);
  olhos(ctx, R, lw, [{ x: 0.0, y: -1.34, rx: 0.08, ry: 0.09, cor: '#ffd23f' }, { x: 0.2, y: -1.32, rx: 0.08, ry: 0.09, cor: '#ffd23f' }]);
  ctx.beginPath();
  ctx.moveTo(R * 0.55, -R * 1.22);
  ctx.quadraticCurveTo(R * 0.95, -R * 1.45, R * 1.2, -R * 1.15);
  ctx.quadraticCurveTo(R * 0.9, -R * 1.05, R * 0.55, -R * 1.05);
  ctx.closePath();
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  traco(ctx, lw * 0.6);
}

function serpente(ctx, R, cor) {
  const lw = lw0(R);
  ctx.beginPath();
  ctx.moveTo(-R * 0.05, -R * 0.16);
  ctx.bezierCurveTo(-R * 1.0, -R * 0.1, -R * 1.05, -R * 0.85, -R * 0.1, -R * 0.72);
  ctx.bezierCurveTo(R * 0.45, -R * 0.62, R * 0.15, -R * 0.4, R * 0.2, -R * 0.55);
  ctx.bezierCurveTo(R * 0.35, -R * 0.95, R * 0.75, -R * 1.15, R * 1.05, -R * 0.78);
  ctx.lineWidth = R * 0.32;
  ctx.lineCap = 'round';
  ctx.strokeStyle = TINTA;
  ctx.stroke();
  ctx.lineWidth = R * 0.2;
  ctx.strokeStyle = cor.A;
  ctx.stroke();
  corpo(ctx, () => elipse(ctx, R * 1.12, -R * 0.72, R * 0.26, R * 0.2), cor, -R * 0.92, -R * 0.52, lw);
  olhos(ctx, R, lw, [{ x: 1.02, y: -0.76, rx: 0.05, ry: 0.05, cor: '#ffd23f' }, { x: 1.16, y: -0.74, rx: 0.05, ry: 0.05, cor: '#ffd23f' }]);
  boca(ctx, R * 1.28, -R * 0.66, R * 0.08, R * 0.06, lw);
}

function elemental(ctx, R, cor) {
  const lw = lw0(R);
  const lingua = (x, y, s) => {
    ctx.beginPath();
    ctx.moveTo(x, -R * 0.1);
    ctx.quadraticCurveTo(x + s, y, x + s * 0.2, -R * 0.7);
    ctx.quadraticCurveTo(x + s * 0.7, -R * 0.15, x, -R * 0.1);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    traco(ctx, lw * 0.6);
  };
  lingua(-R * 0.55, -R * 0.95, -R * 0.5);
  lingua(R * 0.2, -R * 1.15, R * 0.7);
  corpo(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(0, -R * 2.02);
    ctx.bezierCurveTo(R * 0.7, -R * 1.45, R * 0.95, -R * 0.55, R * 0.42, -R * 0.04);
    ctx.quadraticCurveTo(0, R * 0.08, -R * 0.42, -R * 0.04);
    ctx.bezierCurveTo(-R * 0.85, -R * 0.55, -R * 0.55, -R * 1.5, 0, -R * 2.02);
    ctx.closePath();
  }, cor, -R * 2.02, 0, lw);
  brilho(ctx, -R * 0.08, -R * 1.5, R * 0.1, R * 0.18, 0);
  olhos(ctx, R, lw, [{ x: -0.14, y: -1.05, rx: 0.1, ry: 0.12, cor: '#ffd23f' }, { x: 0.16, y: -1.02, rx: 0.1, ry: 0.12, cor: '#ffd23f' }]);
  boca(ctx, R * 0.08, -R * 0.7, R * 0.12, R * 0.14, lw);
  tiro(ctx, R * 1.05, -R * 0.85, R * 0.18, '#ffd23f', lw);
}

function verme(ctx, R, cor) {
  const lw = lw0(R);
  elipse(ctx, 0, -R * 0.08, R * 0.55, R * 0.1);
  ctx.fillStyle = '#4a2018';
  ctx.fill();
  const anel = (y, rx, ry) => corpo(ctx, () => elipse(ctx, 0, y, rx, ry), cor, y - ry, y + ry, lw);
  anel(-R * 0.32, R * 0.5, R * 0.26);
  anel(-R * 0.78, R * 0.46, R * 0.24);
  anel(-R * 1.28, R * 0.4, R * 0.24);
  corpo(ctx, () => elipse(ctx, R * 0.15, -R * 1.78, R * 0.4, R * 0.28), cor, -R * 2.06, -R * 1.5, lw);
  boca(ctx, R * 0.22, -R * 1.72, R * 0.2, R * 0.16, lw);
  olhos(ctx, R, lw, [{ x: 0.02, y: -1.92, rx: 0.07, ry: 0.07, cor: '#ffd23f' }, { x: 0.28, y: -1.9, rx: 0.07, ry: 0.07, cor: '#ffd23f' }]);
  tiro(ctx, R * 0.85, -R * 1.55, R * 0.14, cor.C, lw);
}

const ATAQUES = {
  '01': gota, '05': ameba, '12': pedregulho, '13': muralha, '15': martelo,
  '17': rolamento, '19': mascaraPedra, '24': cubo, '31': lencol, '32': caveira,
  '35': mao, '39': mascara, '40': esqueleto, '41': dragao, '46': serpente,
  '47': elemental, '49': verme,
};

/**
 * Desenha o golpe do layout. Devolve false se esse id nao tem pose.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} id
 * @param {number} R
 */
export function desenharAtaque(ctx, id, R) {
  const fn = ATAQUES[id];
  const item = porId(id);
  if (!fn || !item) return false;
  fn(ctx, R, CORES[item.reino]);
  return true;
}

export const IDS_ATAQUE = Object.keys(ATAQUES);
