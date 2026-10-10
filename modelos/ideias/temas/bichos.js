// Ideia 1: Torre de Bichos. O menor sobe nas costas do maior; dois bichos
// iguais viram o proximo da escada; a baleia de 2048 sai num esguicho.
// Pecas em torre (de baixo para cima), largura cresce com o valor.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const ANIMAIS = [
  { nome: 'pintinho', cor: '#ffd23f' },
  { nome: 'sapo', cor: '#6cc551' },
  { nome: 'coelho', cor: '#f3e6ee' },
  { nome: 'gato', cor: '#ff9f43' },
  { nome: 'cachorro', cor: '#c98b55' },
  { nome: 'panda', cor: '#f7f7f4' },
  { nome: 'leao', cor: '#f5b335' },
  { nome: 'urso', cor: '#8d5a3b' },
  { nome: 'hipopotamo', cor: '#a99bc9' },
  { nome: 'elefante', cor: '#9fb3cc' },
  { nome: 'baleia', cor: '#3f8efc' },
  { nome: 'baleia', cor: '#ffc933', coroa: true },
];
const CONTORNO = '#3b2a1e';

function olhos(ctx, x, y, R, dx = 0.36, r = 0.14) {
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#1d1712'; circulo(ctx, x + s * R * dx, y, R * r); ctx.fill();
    ctx.fillStyle = '#fff'; circulo(ctx, x + s * R * dx + R * r * 0.35, y - R * r * 0.35, R * r * 0.4); ctx.fill();
  }
}
function bochechas(ctx, x, y, R) {
  ctx.fillStyle = 'rgba(255,110,140,0.45)';
  for (const s of [-1, 1]) { elipse(ctx, x + s * R * 0.58, y + R * 0.28, R * 0.17, R * 0.11); ctx.fill(); }
}
function contornar(ctx, R) { ctx.lineWidth = Math.max(1.2, R * 0.08); ctx.strokeStyle = CONTORNO; ctx.stroke(); }

/** Rosto do bicho n (0..11) centrado em (x, y), raio R. */
function rosto(ctx, n, x, y, R) {
  const A = ANIMAIS[Math.min(n, ANIMAIS.length - 1)];
  const cor = A.cor, esc = escurecer(cor, 0.25), cla = clarear(cor, 0.45);
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // orelhas e o que fica atras da cabeca
  switch (A.nome) {
    case 'coelho':
      for (const s of [-1, 1]) {
        elipse(ctx, x + s * R * 0.38, y - R * 1.15, R * 0.24, R * 0.62, s * 0.12); ctx.fillStyle = cor; ctx.fill(); contornar(ctx, R);
        elipse(ctx, x + s * R * 0.38, y - R * 1.12, R * 0.11, R * 0.44, s * 0.12); ctx.fillStyle = '#ffb3c7'; ctx.fill();
      }
      break;
    case 'gato':
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x + s * R * 0.85, y - R * 0.25); ctx.lineTo(x + s * R * 0.72, y - R * 1.15); ctx.lineTo(x + s * R * 0.2, y - R * 0.8); ctx.closePath();
        ctx.fillStyle = cor; ctx.fill(); contornar(ctx, R);
      }
      break;
    case 'panda': case 'urso':
      for (const s of [-1, 1]) {
        circulo(ctx, x + s * R * 0.68, y - R * 0.7, R * 0.32); ctx.fillStyle = A.nome === 'panda' ? '#1f1f24' : cor; ctx.fill(); contornar(ctx, R);
        if (A.nome === 'urso') { circulo(ctx, x + s * R * 0.68, y - R * 0.7, R * 0.16); ctx.fillStyle = cla; ctx.fill(); }
      }
      break;
    case 'leao':
      estrela(ctx, x, y, R * 1.42, R * 1.12, 14, 0); ctx.fillStyle = '#c46a1b'; ctx.fill(); contornar(ctx, R);
      for (const s of [-1, 1]) { circulo(ctx, x + s * R * 0.62, y - R * 0.72, R * 0.22); ctx.fillStyle = cor; ctx.fill(); contornar(ctx, R); }
      break;
    case 'hipopotamo':
      for (const s of [-1, 1]) { elipse(ctx, x + s * R * 0.6, y - R * 0.82, R * 0.16, R * 0.2); ctx.fillStyle = esc; ctx.fill(); contornar(ctx, R); }
      break;
    case 'elefante':
      for (const s of [-1, 1]) {
        elipse(ctx, x + s * R * 0.95, y - R * 0.05, R * 0.62, R * 0.78, s * 0.2); ctx.fillStyle = cor; ctx.fill(); contornar(ctx, R);
        elipse(ctx, x + s * R * 1.0, y - R * 0.02, R * 0.38, R * 0.52, s * 0.2); ctx.fillStyle = '#f2b8c6'; ctx.fill();
      }
      break;
    case 'cachorro':
      break;
    case 'baleia': {
      // esguicho
      ctx.fillStyle = '#bfe8ff'; ctx.strokeStyle = '#5aa9e6'; ctx.lineWidth = Math.max(1, R * 0.06);
      for (const s of [-1, 0, 1]) { elipse(ctx, x + s * R * 0.42, y - R * 1.25 - (s ? 0 : R * 0.18), R * 0.2, R * 0.28, s * 0.5); ctx.fill(); ctx.stroke(); }
      ctx.fillRect(x - R * 0.08, y - R * 1.15, R * 0.16, R * 0.3);
      break;
    }
    default: break;
  }
  // cabeca
  if (A.nome === 'sapo' || A.nome === 'hipopotamo' || A.nome === 'baleia') elipse(ctx, x, y, R * 1.08, R * 0.92);
  else circulo(ctx, x, y, R);
  ctx.fillStyle = cor; ctx.fill(); contornar(ctx, R);
  // detalhes
  switch (A.nome) {
    case 'pintinho':
      ctx.strokeStyle = CONTORNO; ctx.lineWidth = Math.max(1.2, R * 0.08);
      for (const s of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x + s * R * 0.12, y - R * 0.95); ctx.quadraticCurveTo(x + s * R * 0.3, y - R * 1.35, x + s * R * 0.05 + R * 0.12, y - R * 1.3); ctx.stroke(); }
      olhos(ctx, x, y - R * 0.12, R);
      ctx.beginPath(); ctx.moveTo(x - R * 0.2, y + R * 0.12); ctx.lineTo(x + R * 0.2, y + R * 0.12); ctx.lineTo(x, y + R * 0.38); ctx.closePath();
      ctx.fillStyle = '#ff8a1f'; ctx.fill(); contornar(ctx, R * 0.7);
      bochechas(ctx, x, y, R);
      break;
    case 'sapo':
      for (const s of [-1, 1]) {
        circulo(ctx, x + s * R * 0.48, y - R * 0.72, R * 0.34); ctx.fillStyle = cor; ctx.fill(); contornar(ctx, R);
        circulo(ctx, x + s * R * 0.48, y - R * 0.72, R * 0.2); ctx.fillStyle = '#fff'; ctx.fill();
        circulo(ctx, x + s * R * 0.5, y - R * 0.7, R * 0.11); ctx.fillStyle = '#1d1712'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y + R * 0.05, R * 0.55, 0.15 * Math.PI, 0.85 * Math.PI); ctx.strokeStyle = CONTORNO; ctx.lineWidth = Math.max(1.2, R * 0.09); ctx.stroke();
      bochechas(ctx, x, y, R);
      break;
    case 'coelho':
      olhos(ctx, x, y - R * 0.1, R);
      ctx.beginPath(); ctx.moveTo(x - R * 0.12, y + R * 0.14); ctx.lineTo(x + R * 0.12, y + R * 0.14); ctx.lineTo(x, y + R * 0.28); ctx.closePath(); ctx.fillStyle = '#ff7fa0'; ctx.fill();
      ctx.fillStyle = '#fff'; rr(ctx, x - R * 0.13, y + R * 0.32, R * 0.26, R * 0.22, R * 0.05); ctx.fill(); contornar(ctx, R * 0.6);
      bochechas(ctx, x, y, R);
      break;
    case 'gato':
      olhos(ctx, x, y - R * 0.1, R);
      ctx.fillStyle = '#ff7fa0'; circulo(ctx, x, y + R * 0.16, R * 0.09); ctx.fill();
      ctx.strokeStyle = CONTORNO; ctx.lineWidth = Math.max(1, R * 0.06);
      ctx.beginPath(); ctx.arc(x - R * 0.11, y + R * 0.26, R * 0.11, 0, Math.PI); ctx.arc(x + R * 0.11, y + R * 0.26, R * 0.11, 0, Math.PI); ctx.stroke();
      for (const s of [-1, 1]) for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * R * 0.35, y + R * 0.2 + k * R * 0.06); ctx.lineTo(x + s * R * 0.9, y + R * 0.14 + k * R * 0.16); ctx.stroke(); }
      bochechas(ctx, x, y, R);
      break;
    case 'cachorro':
      for (const s of [-1, 1]) { elipse(ctx, x + s * R * 0.88, y + R * 0.05, R * 0.28, R * 0.55, s * -0.35); ctx.fillStyle = '#6b4325'; ctx.fill(); contornar(ctx, R); }
      elipse(ctx, x, y + R * 0.38, R * 0.48, R * 0.36); ctx.fillStyle = cla; ctx.fill();
      olhos(ctx, x, y - R * 0.15, R);
      elipse(ctx, x, y + R * 0.22, R * 0.16, R * 0.11); ctx.fillStyle = '#1d1712'; ctx.fill();
      elipse(ctx, x + R * 0.1, y + R * 0.6, R * 0.1, R * 0.14); ctx.fillStyle = '#ff6f8f'; ctx.fill();
      break;
    case 'panda':
      for (const s of [-1, 1]) { elipse(ctx, x + s * R * 0.36, y - R * 0.06, R * 0.22, R * 0.3, s * 0.5); ctx.fillStyle = '#1f1f24'; ctx.fill(); }
      for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; circulo(ctx, x + s * R * 0.36, y - R * 0.1, R * 0.08); ctx.fill(); }
      elipse(ctx, x, y + R * 0.26, R * 0.13, R * 0.09); ctx.fillStyle = '#1f1f24'; ctx.fill();
      bochechas(ctx, x, y, R);
      break;
    case 'leao': case 'urso':
      elipse(ctx, x, y + R * 0.36, R * 0.42, R * 0.32); ctx.fillStyle = clarear(cor, 0.55); ctx.fill();
      olhos(ctx, x, y - R * 0.15, R);
      ctx.beginPath(); ctx.moveTo(x - R * 0.14, y + R * 0.2); ctx.lineTo(x + R * 0.14, y + R * 0.2); ctx.lineTo(x, y + R * 0.36); ctx.closePath(); ctx.fillStyle = '#3b2216'; ctx.fill();
      bochechas(ctx, x, y, R);
      break;
    case 'hipopotamo':
      elipse(ctx, x, y + R * 0.38, R * 0.82, R * 0.46); ctx.fillStyle = clarear(cor, 0.3); ctx.fill(); contornar(ctx, R);
      for (const s of [-1, 1]) { elipse(ctx, x + s * R * 0.3, y + R * 0.3, R * 0.08, R * 0.11); ctx.fillStyle = escurecer(cor, 0.5); ctx.fill(); }
      olhos(ctx, x, y - R * 0.38, R, 0.34, 0.12);
      break;
    case 'elefante':
      olhos(ctx, x, y - R * 0.2, R, 0.32, 0.12);
      ctx.strokeStyle = CONTORNO; ctx.lineWidth = R * 0.42; ctx.beginPath(); ctx.moveTo(x, y + R * 0.05); ctx.quadraticCurveTo(x, y + R * 0.95, x + R * 0.38, y + R * 0.9); ctx.stroke();
      ctx.strokeStyle = cor; ctx.lineWidth = R * 0.28; ctx.stroke();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * R * 0.25, y + R * 0.35); ctx.lineTo(x + s * R * 0.32, y + R * 0.62); ctx.strokeStyle = '#fffbe8'; ctx.lineWidth = R * 0.1; ctx.stroke(); }
      bochechas(ctx, x, y - R * 0.05, R);
      break;
    case 'baleia':
      ctx.save(); elipse(ctx, x, y, R * 1.08, R * 0.92); ctx.clip();
      ctx.fillStyle = clarear(cor, 0.6); ctx.fillRect(x - R * 1.2, y + R * 0.22, R * 2.4, R);
      ctx.strokeStyle = rgba(escurecer(cor, 0.2), 0.5); ctx.lineWidth = Math.max(1, R * 0.05);
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - R * 0.6, y + R * (0.42 + k * 0.16)); ctx.lineTo(x + R * 0.6, y + R * (0.42 + k * 0.16)); ctx.stroke(); }
      ctx.restore();
      olhos(ctx, x, y - R * 0.18, R, 0.4, 0.13);
      ctx.beginPath(); ctx.arc(x, y + R * 0.02, R * 0.36, 0.2 * Math.PI, 0.8 * Math.PI); ctx.strokeStyle = CONTORNO; ctx.lineWidth = Math.max(1.2, R * 0.08); ctx.stroke();
      bochechas(ctx, x, y - R * 0.05, R);
      if (A.coroa) {
        ctx.beginPath(); const cy = y - R * 0.86, w = R * 0.8;
        ctx.moveTo(x - w / 2, cy); ctx.lineTo(x - w / 2, cy - R * 0.36); ctx.lineTo(x - w / 4, cy - R * 0.16); ctx.lineTo(x, cy - R * 0.44); ctx.lineTo(x + w / 4, cy - R * 0.16); ctx.lineTo(x + w / 2, cy - R * 0.36); ctx.lineTo(x + w / 2, cy); ctx.closePath();
        ctx.fillStyle = '#fff1a8'; ctx.fill(); contornar(ctx, R * 0.7);
      }
      break;
    default: break;
  }
  ctx.restore();
}

/** Corpo + rosto + plaquinha do numero, centrado em r. */
function bicho(ctx, v, r, op) {
  const n = nivel(v);
  const A = ANIMAIS[Math.min(n, ANIMAIS.length - 1)];
  const pw = r.w * (0.64 + 0.36 * Math.min(1, n / 10));
  const ph = r.h - 3;
  const x0 = -pw / 2, y0 = r.y + 2;
  // corpo
  rr(ctx, x0, y0 + ph * 0.18, pw, ph * 0.82, ph * 0.3);
  ctx.fillStyle = A.cor; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x0, y0 + ph * 0.84, pw, ph);
  elipse(ctx, 0, y0 + ph * 0.7, pw * 0.3, ph * 0.22); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  ctx.restore();
  rr(ctx, x0, y0 + ph * 0.18, pw, ph * 0.82, ph * 0.3); ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  // pezinhos
  ctx.fillStyle = escurecer(A.cor, 0.3);
  for (const s of [-1, 1]) { elipse(ctx, s * pw * 0.28, y0 + ph - 1, pw * 0.12, ph * 0.08); ctx.fill(); }
  // rosto
  const R = Math.min(ph * 0.4, pw * 0.36);
  rosto(ctx, n, 0, y0 + ph * 0.4, R);
  // plaquinha
  const tam = Math.max(10, ph * 0.27);
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const tw = ctx.measureText(String(v)).width + tam * 0.7;
  rr(ctx, -tw / 2, y0 + ph - tam * 1.15, tw, tam * 1.05, tam * 0.5);
  ctx.fillStyle = '#fffaf0'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = CONTORNO; ctx.stroke();
  texto(ctx, String(v), 0, y0 + ph - tam * 0.62, tam, '#3b2a1e');
  if (op && op.destaque) {
    rr(ctx, x0 - 3, y0 + ph * 0.18 - 3, pw + 6, ph * 0.82 + 6, ph * 0.34);
    ctx.strokeStyle = `rgba(255,255,255,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

function gelo(ctx, r) {
  rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 6);
  ctx.fillStyle = 'rgba(175,228,255,0.55)'; ctx.fill();
  ctx.strokeStyle = '#effbff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.15, r.y + r.h); ctx.lineTo(r.x + r.w * 0.45, r.y); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.35, r.y + r.h); ctx.lineTo(r.x + r.w * 0.62, r.y); ctx.stroke();
  ctx.restore();
  // floco
  const fx = r.x + r.w - 9, fy = r.y + 9;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * 6, fy - Math.sin(a) * 6); ctx.lineTo(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6); ctx.stroke(); }
}

function pedra(ctx, r, hp) {
  const w = r.w * 0.94, h = r.h - 4, y0 = r.y + 3;
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, y0 + h);
    ctx.bezierCurveTo(-w * 0.56, y0 + h * 0.45, -w * 0.3, y0 + h * 0.02, -w * 0.02, y0 + h * 0.06);
    ctx.bezierCurveTo(w * 0.3, y0 - h * 0.02, w * 0.58, y0 + h * 0.4, w * 0.5, y0 + h);
    ctx.closePath();
  };
  forma(); ctx.fillStyle = '#9a958a'; ctx.fill();
  ctx.save(); forma(); ctx.clip();
  elipse(ctx, -w * 0.18, y0 + h * 0.3, w * 0.22, h * 0.16, -0.4); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; elipse(ctx, w * 0.2, y0 + h * 1.05, w * 0.6, h * 0.35); ctx.fill();
  ctx.fillStyle = '#6fae3f';
  for (const [dx, dy, rx] of [[-0.28, 0.1, 0.14], [-0.12, 0.04, 0.12], [0.06, 0.08, 0.1]]) { elipse(ctx, dx * w, y0 + dy * h, rx * w, rx * w * 0.7); ctx.fill(); }
  ctx.restore();
  forma(); ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  // rachaduras pelo hp perdido
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  ctx.strokeStyle = '#3d3a35'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const rach = [[-0.22, 0.25, -0.05, 0.5, -0.16, 0.78], [0.22, 0.22, 0.08, 0.48, 0.24, 0.72], [-0.02, 0.12, 0.04, 0.32, -0.06, 0.45]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, y0 + c[1] * h); ctx.lineTo(c[2] * w, y0 + c[3] * h); ctx.lineTo(c[4] * w, y0 + c[5] * h); ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * 10, y0 + h * 0.82, 3.6);
    ctx.fillStyle = k < hp ? '#ffe066' : 'rgba(0,0,0,0.35)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  }
}

function ovo(ctx, r, op) {
  const R = Math.min(r.h * 0.45, r.w * 0.32), cy = r.y + r.h * 0.48;
  elipse(ctx, 0, r.y + r.h - 6, r.w * 0.4, r.h * 0.13); ctx.fillStyle = '#b07a3c'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = CONTORNO; ctx.stroke();
  elipse(ctx, 0, cy, R * 0.78, R); ctx.fillStyle = '#fffaf0'; ctx.fill();
  ctx.save(); ctx.clip();
  const cores = ['#ff5d73', '#ffb43f', '#ffe066', '#6cc551', '#3fa7ff', '#a77bff'];
  cores.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-R, cy - R + i * (R * 2) / cores.length + Math.sin((op.t || 0) * 3 + i) * 1.5, R * 2, (R * 2) / cores.length); });
  ctx.restore();
  elipse(ctx, 0, cy, R * 0.78, R); ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  texto(ctx, '?', 0, cy + 1, R * 1.1, '#fff', { contorno: CONTORNO, espessura: 3 });
}

function bomba(ctx, r, op) {
  const R = Math.min(r.h * 0.4, r.w * 0.3), cy = r.y + r.h * 0.56;
  ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(R * 0.5, cy - R * 0.8); ctx.quadraticCurveTo(R * 0.9, cy - R * 1.4, R * 1.3, cy - R * 1.1); ctx.stroke();
  const f = 0.6 + 0.4 * Math.abs(Math.sin((op.t || 0) * 18));
  estrela(ctx, R * 1.3, cy - R * 1.1, R * 0.4 * f, R * 0.16, 6); ctx.fillStyle = '#ffd23f'; ctx.fill();
  circulo(ctx, 0, cy, R); ctx.fillStyle = '#2b2b33'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  rr(ctx, R * 0.25, cy - R * 1.0, R * 0.5, R * 0.3, 3); ctx.fillStyle = '#55555f'; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; circulo(ctx, -R * 0.35, cy - R * 0.35, R * 0.22); ctx.fill();
  olhos(ctx, 0, cy, R, 0.32, 0.13);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * R * 0.55, cy - R * 0.32); ctx.lineTo(s * R * 0.18, cy - R * 0.2); ctx.stroke(); }
}

function cogumelo(ctx, r) {
  const R = Math.min(r.h * 0.42, r.w * 0.36), cy = r.y + r.h * 0.45;
  rr(ctx, -R * 0.38, cy, R * 0.76, R * 0.95, R * 0.25); ctx.fillStyle = '#fff4dc'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, cy + R * 0.1, R * 1.05, R * 0.85, 0, Math.PI, 0); ctx.closePath();
  ctx.fillStyle = '#ff4b5c'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff';
  for (const [dx, dy, rr0] of [[-0.5, -0.25, 0.18], [0.45, -0.35, 0.2], [0, -0.6, 0.15]]) { circulo(ctx, dx * R, cy + dy * R, rr0 * R); ctx.fill(); }
  texto(ctx, 'x2', 0, cy + R * 0.55, R * 0.62, '#3b2a1e');
}

const tema = {
  id: 'bichos',
  nome: 'Torre de Bichos',
  cores: { texto: '#3b2a1e', destaque: '#ffe066', particulas: ['#ffd23f', '#ff7fa0', '#6cc551', '#3fa7ff'] },
  faixas: () => ({ topo: 96, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.85, filaFator: 1.0, colar: true }),

  fundo(ctx, W, H, L) {
    const chao = L.chao;
    const g = ctx.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, '#7cc8ff'); g.addColorStop(1, '#d8f1ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sol
    const sx = W * 0.86, sy = L.topo + 40;
    ctx.fillStyle = 'rgba(255,240,170,0.5)'; circulo(ctx, sx, sy, 46); ctx.fill();
    ctx.fillStyle = '#ffe066'; circulo(ctx, sx, sy, 30); ctx.fill();
    // morros
    const morro = (y, cor, amp, fase) => {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y - Math.sin(x / W * Math.PI * 2 + fase) * amp - Math.sin(x / 90 + fase) * amp * 0.25);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
    };
    morro(chao - 70, '#a7dc8a', 22, 0.6);
    morro(chao - 30, '#8fd16c', 16, 2.2);
    // arvores ao longe
    const rnd = semente(5);
    for (let i = 0; i < 6; i++) {
      const x = rnd() * W, y = chao - 36 - rnd() * 30, s = 10 + rnd() * 10;
      ctx.fillStyle = '#7a5530'; ctx.fillRect(x - 2, y, 4, s);
      ctx.fillStyle = '#5fb84a'; circulo(ctx, x, y - s * 0.2, s * 0.8); ctx.fill();
    }
    // chao: grama e terra
    ctx.fillStyle = '#76c94a'; ctx.fillRect(0, chao, W, 14);
    ctx.fillStyle = '#5fae37'; ctx.fillRect(0, chao + 10, W, 4);
    const t = ctx.createLinearGradient(0, chao + 14, 0, H);
    t.addColorStop(0, '#b98552'); t.addColorStop(1, '#8a5d36');
    ctx.fillStyle = t; ctx.fillRect(0, chao + 14, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 40; i++) { elipse(ctx, rnd() * W, chao + 24 + rnd() * (H - chao), 3 + rnd() * 5, 2 + rnd() * 2); ctx.fill(); }
    // flores na grama
    for (let i = 0; i < 14; i++) {
      const x = rnd() * W, y = chao + 2 + rnd() * 6;
      ctx.fillStyle = ['#fff', '#ffd23f', '#ff7fa0'][i % 3]; circulo(ctx, x, y, 2.4); ctx.fill();
    }
    // subsolo: raizes, pedrinhas, cenouras e uma minhoca (preenche a terra abaixo da fila)
    ctx.strokeStyle = 'rgba(80,50,25,0.45)'; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const x = rnd() * W;
      ctx.lineWidth = 2 + rnd() * 2;
      ctx.beginPath(); ctx.moveTo(x, chao + 14);
      ctx.bezierCurveTo(x + (rnd() - 0.5) * 40, chao + 40, x + (rnd() - 0.5) * 60, chao + 60, x + (rnd() - 0.5) * 50, chao + 50 + rnd() * 40);
      ctx.stroke();
    }
    const y0 = L.fila.vertical ? chao + 40 : L.fila.y + L.fila.h + 26;
    if (y0 < H - 30) {
      for (let i = 0; i < 9; i++) {
        const x = 20 + rnd() * (W - 40), y = y0 + rnd() * (H - y0 - 20);
        elipse(ctx, x, y, 7 + rnd() * 9, 5 + rnd() * 5); ctx.fillStyle = ['#a39b8c', '#8f877a', '#b9ae9a'][i % 3]; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(59,42,30,0.5)'; ctx.stroke();
      }
      for (let i = 0; i < 3; i++) {
        const x = W * (0.18 + i * 0.32) + (rnd() - 0.5) * 30, y = y0 + 20 + rnd() * Math.max(10, H - y0 - 70);
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.5 + rnd() * 0.6);
        ctx.fillStyle = '#5fb84a';
        for (const a of [-0.4, 0, 0.4]) { ctx.save(); ctx.rotate(a); elipse(ctx, 0, -16, 3.5, 9); ctx.fill(); ctx.restore(); }
        ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(0, -10, 8, -6); ctx.lineTo(0, 26); ctx.closePath();
        ctx.fillStyle = '#ff8a2a'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = CONTORNO; ctx.stroke();
        ctx.strokeStyle = 'rgba(59,42,30,0.45)'; ctx.lineWidth = 1.2;
        for (const yy of [2, 9, 16]) { ctx.beginPath(); ctx.moveTo(-4, yy); ctx.lineTo(1, yy + 1); ctx.stroke(); }
        ctx.restore();
      }
      // minhoca
      const mx = W * 0.62, my = H - 46;
      ctx.strokeStyle = '#f08ca0'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(mx - 34, my); ctx.bezierCurveTo(mx - 20, my - 16, mx - 6, my + 14, mx + 8, my); ctx.bezierCurveTo(mx + 16, my - 8, mx + 24, my - 6, mx + 30, my - 2); ctx.stroke();
      ctx.fillStyle = '#1d1712'; circulo(ctx, mx + 28, my - 5, 1.6); ctx.fill();
    }
  },

  vivo(ctx, W, H, t) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let i = 0; i < 4; i++) {
      const x = ((i * 137 + t * (8 + i * 3)) % (W + 160)) - 80, y = 110 + i * 34 + (i % 2) * 12;
      circulo(ctx, x, y, 16); ctx.fill(); circulo(ctx, x + 18, y - 6, 20); ctx.fill(); circulo(ctx, x + 38, y, 15); ctx.fill();
      rr(ctx, x - 6, y, 56, 14, 7); ctx.fill();
    }
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      const a = L.coluna(c);
      // montinho de grama sob a coluna
      elipse(ctx, a.x + a.w / 2, L.chao + 3, a.w * 0.62, 7); ctx.fillStyle = '#4f9a2c'; ctx.fill();
      if (!e.colunas[c].length) {
        const s = L.carta(c, 0);
        rr(ctx, s.x + 3, s.y + 3, s.w - 6, s.h - 6, 10);
        ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(59,42,30,0.45)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        // pegada
        const cx = s.x + s.w / 2, cy = s.y + s.h / 2 + 2;
        ctx.fillStyle = 'rgba(59,42,30,0.3)';
        elipse(ctx, cx, cy + 3, 6, 5); ctx.fill();
        for (const [dx, dy] of [[-7, -4], [-2.5, -8], [2.5, -8], [7, -4]]) { circulo(ctx, cx + dx, cy + dy, 2.3); ctx.fill(); }
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return pedra(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return ovo(ctx, r, op);
    if (carta.tipo === 'bomba') return bomba(ctx, r, op);
    if (carta.tipo === 'dobro') return cogumelo(ctx, r);
    bicho(ctx, carta.v, r, op);
    if (carta.gelo) gelo(ctx, r);
  },

  cadeado(ctx, a) {
    // cercado de madeira com cadeado
    const y0 = a.y + a.h * 0.25, y1 = a.y + a.h;
    ctx.fillStyle = 'rgba(80,50,20,0.22)'; rr(ctx, a.x - 4, a.y, a.w + 8, a.h, 10); ctx.fill();
    ctx.fillStyle = '#c08a4e'; ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.6;
    for (let k = 0; k < 4; k++) {
      const x = a.x + 2 + (k * (a.w - 12)) / 3;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y0 + 6); ctx.lineTo(x + 4, y0); ctx.lineTo(x + 8, y0 + 6); ctx.lineTo(x + 8, y1); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    for (const yy of [y0 + (y1 - y0) * 0.3, y0 + (y1 - y0) * 0.72]) { rr(ctx, a.x - 3, yy, a.w + 6, 7, 3); ctx.fill(); ctx.stroke(); }
    const cx = a.x + a.w / 2, cy = y0 + (y1 - y0) * 0.5;
    ctx.strokeStyle = '#6f6f78'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy - 6, 7, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 10, cy - 6, 20, 16, 4); ctx.fillStyle = '#ffcf3f'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = CONTORNO; circulo(ctx, cx, cy + 1, 2.4); ctx.fill();
  },

  descarte(ctx, r, e) {
    // toca no chao
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.62;
    elipse(ctx, cx, cy + 4, r.w * 0.62, r.h * 0.5); ctx.fillStyle = '#9b6b3e'; ctx.fill();
    elipse(ctx, cx, cy + 6, r.w * 0.42, r.h * 0.3); ctx.fillStyle = '#2d1c10'; ctx.fill();
    const carga = e.descarteCarga > 0;
    rr(ctx, cx - 16, r.y - 22, 32, 18, 5); ctx.fillStyle = carga ? '#fff3d6' : '#d9c7a8'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = CONTORNO; ctx.fillRect(cx - 1.5, r.y - 4, 3, 8);
    texto(ctx, carga ? 'toca' : 'zzz', cx, r.y - 13, 11, CONTORNO);
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) {
      rr(ctx, f.x + 2, f.y, f.w - 4, f.h, 14); ctx.fillStyle = 'rgba(255,248,230,0.85)'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 2; ctx.stroke();
      return;
    }
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, p2.x) - 18, x1 = Math.max(p0.x + p0.w, p2.x + p2.w) + 18;
    const y = p0.y + p0.h - 2;
    elipse(ctx, (x0 + x1) / 2, y, (x1 - x0) / 2, 12); ctx.fillStyle = '#d9b07a'; ctx.fill();
    texto(ctx, 'próximo ▸', p0.x + p0.w / 2, p0.y - 12, 12, '#fff6e0', { contorno: 'rgba(59,42,30,0.7)', espessura: 3 });
  },

  hud(ctx, W, H, L, e, t) {
    const x = 10, y = 10, w = W - 20, h = 76;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 16); ctx.fillStyle = '#fff6e3'; ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, h, 16); ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3; ctx.stroke();
    // fase
    circulo(ctx, x + 34, y + h / 2, 24); ctx.fillStyle = '#6cc551'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 2; ctx.stroke();
    texto(ctx, 'fase', x + 34, y + h / 2 - 10, 10, '#eaffdf');
    texto(ctx, String(e.faseId), x + 34, y + h / 2 + 6, 20, '#fff', { contorno: CONTORNO, espessura: 3 });
    // metas
    const mx = x + 68, mw = w - 68 - 92;
    e.metas.forEach((m, k) => {
      const yy = y + 14 + k * 30;
      texto(ctx, textoMeta(m, { monte: (n) => `Leve ${n} baleia${n > 1 ? 's' : ''} ao mar` }), mx, yy + 5, 12, CONTORNO, { alinhar: 'left', max: mw });
      rr(ctx, mx, yy + 13, mw, 8, 4); ctx.fillStyle = '#ead9b8'; ctx.fill();
      rr(ctx, mx, yy + 13, Math.max(8, mw * Math.min(1, m.atual / m.alvo)), 8, 4); ctx.fillStyle = m.feita ? '#6cc551' : '#ffb43f'; ctx.fill();
    });
    // pontos
    const px = x + w - 46;
    estrela(ctx, px, y + 24, 13, 6); ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.5; ctx.stroke();
    texto(ctx, String(e.pontos), px, y + 52, 18, CONTORNO, { max: 84 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      texto(ctx, 'FEBRE x2!', W / 2, y + h + 18, 20, '#ff5d73', { contorno: '#fff', espessura: 4 + k * 2 });
    }
  },

  efeito(fx, P) {
    if (!P.formas.coracao) {
      P.formas.coracao = (ctx, p) => {
        const s = p.tam / 2;
        ctx.beginPath(); ctx.moveTo(0, s * 0.9);
        ctx.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.6, -s * 1.4, 0, -s * 0.5);
        ctx.bezierCurveTo(s * 0.6, -s * 1.4, s * 1.6, -s * 0.2, 0, s * 0.9);
        ctx.fill();
      };
    }
    switch (fx.tipo) {
      case 'pouso': P.estourar(fx.x, fx.y + 14, ['#e8d2a8', '#cfb184'], 6, 0.35, { g: 200, vida: 0.4, tam: 6, forma: 'c' }); return true;
      case 'fusao': {
        const cor = ANIMAIS[Math.min(nivel(fx.valor), 11)].cor;
        P.estourar(fx.x, fx.y, ['#ff7fa0', '#ff5d73', cor], 8 + fx.degrau * 3, 0.7 + fx.degrau * 0.12, { forma: 'coracao', tam: 11, g: 260 });
        P.anel(fx.x, fx.y, '#ffffff', 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 24, 'x' + fx.degrau, '#ffe066', 22 + fx.degrau * 2, '#3b2a1e');
        return true;
      }
      case 'completar':
        P.estourar(fx.x, fx.y, ['#bfe8ff', '#5aa9e6', '#ffffff'], 46, 1.8, { g: 620, vida: 0.9, tam: 8, forma: 'c' });
        P.estourar(fx.x, fx.y, ['#ffd23f', '#ff7fa0', '#6cc551'], 16, 1.2, { forma: 'estrela', tam: 12 });
        P.texto(fx.x, fx.y - 30, 'Ao mar!', '#ffffff', 30, '#2a6fd0');
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#ffffff', '#e8e2d6', '#ffd23f'], 18, 1.2, { forma: 'estrela', tam: 9 });
        P.subir(fx.x, fx.y, ['rgba(255,255,255,0.8)', 'rgba(220,220,220,0.8)'], 6, { tam: 14, vida: 0.7, larg: 30 });
        return true;
      case 'combo': P.texto(fx.x, fx.y - 44, `Combo x${fx.n}!`, '#ffe066', 22, '#3b2a1e'); return true;
      default: return false;
    }
  },
};

export default tema;
