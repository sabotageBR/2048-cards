// Cartas do duelo (porte de modelos/ideias/temas/duelo.js): carta de feitico
// com moldura pelo valor (bronze, prata, ouro, cristal, lendaria), faixa de
// cima com o numero (o que fica visivel quando outra carta cobre esta) e um
// emblema por valor. Especiais, pedra e gelo tambem. Tudo desenhado num
// retangulo centrado na origem { x: -w/2, y: -h/2, w, h }.
// A parte parada vai para a cache de cartas.js; o brilho que anda e por cima.
import { TINTA, OURO, rr, circulo, elipse, texto, escurecer, rgba, estrela, nivel, semente, clamp } from './desenho.js';

/** Cor e emblema por valor (2..2048, 4096). */
export const CORES_DUELO = ['#6fbf3a', '#3fa2f0', '#ff7a2f', '#9a6bff', '#ef4466', '#22b894', '#f2a000', '#e050b0', '#4c6ef5', '#12bfd2', '#ff3b3b', '#ffcc33'];
const EMBLEMAS = ['folha', 'gota', 'chama', 'trevo', 'coracao', 'escudo', 'raio', 'estrela', 'espada', 'diamante', 'dragao', 'coroa'];

/** Cor da carta de valor v. */
export const corDuelo = (v) => CORES_DUELO[Math.min(11, nivel(v || 2))];

const rotulos = { bomba: 'BOMB' };
/** Textos pintados na carta (idioma). */
export function definirRotulosDuelo(r) { Object.assign(rotulos, r); }

// ------------------------------------------------------------ emblemas

function contorno(ctx, s) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, s * 0.14); ctx.strokeStyle = TINTA; ctx.stroke(); }

export function emblema(ctx, tipo, x, y, s, cor) {
  ctx.save();
  ctx.fillStyle = cor;
  switch (tipo) {
    case 'folha':
      ctx.beginPath(); ctx.moveTo(x, y + s); ctx.quadraticCurveTo(x - s * 1.15, y, x, y - s); ctx.quadraticCurveTo(x + s * 1.15, y, x, y + s);
      ctx.fill(); contorno(ctx, s);
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.9); ctx.lineTo(x, y - s * 0.6); ctx.lineWidth = Math.max(1, s * 0.1); ctx.stroke();
      break;
    case 'gota':
      ctx.beginPath(); ctx.moveTo(x, y - s);
      ctx.bezierCurveTo(x + s * 0.95, y - s * 0.05, x + s * 0.8, y + s, x, y + s);
      ctx.bezierCurveTo(x - s * 0.8, y + s, x - s * 0.95, y - s * 0.05, x, y - s);
      ctx.fill(); contorno(ctx, s);
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; elipse(ctx, x - s * 0.28, y + s * 0.2, s * 0.14, s * 0.24, 0.3); ctx.fill();
      break;
    case 'chama': {
      const f = (k, dy) => {
        ctx.beginPath(); ctx.moveTo(x, y - s * k + dy);
        ctx.bezierCurveTo(x + s * 0.3 * k, y - s * 0.4 * k + dy, x + s * 0.95 * k, y - s * 0.1 * k + dy, x + s * 0.7 * k, y + s * 0.55 * k + dy);
        ctx.quadraticCurveTo(x + s * 0.4 * k, y + s * k + dy, x, y + s * k + dy);
        ctx.quadraticCurveTo(x - s * 0.4 * k, y + s * k + dy, x - s * 0.7 * k, y + s * 0.55 * k + dy);
        ctx.bezierCurveTo(x - s * 0.95 * k, y + s * 0.05 * k + dy, x - s * 0.3 * k, y - s * 0.2 * k + dy, x, y - s * k + dy);
      };
      f(1, 0); ctx.fill(); contorno(ctx, s);
      f(0.5, s * 0.42); ctx.fillStyle = '#ffe066'; ctx.fill();
      break;
    }
    case 'trevo':
      for (const a of [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]) { circulo(ctx, x + Math.cos(a) * s * 0.45, y - s * 0.1 + Math.sin(a) * s * 0.45, s * 0.42); ctx.fill(); contorno(ctx, s); }
      for (const a of [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6]) { circulo(ctx, x + Math.cos(a) * s * 0.45, y - s * 0.1 + Math.sin(a) * s * 0.45, s * 0.3); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.1); ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.7, x + s * 0.35, y + s); ctx.lineWidth = Math.max(1.4, s * 0.16); ctx.strokeStyle = TINTA; ctx.stroke();
      break;
    case 'coracao':
      ctx.beginPath(); ctx.moveTo(x, y + s * 0.95);
      ctx.bezierCurveTo(x - s * 1.5, y - s * 0.05, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.5, y - s * 0.05, x, y + s * 0.95);
      ctx.fill(); contorno(ctx, s);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; elipse(ctx, x - s * 0.45, y - s * 0.35, s * 0.18, s * 0.12, -0.6); ctx.fill();
      break;
    case 'escudo':
      ctx.beginPath(); ctx.moveTo(x - s * 0.82, y - s * 0.85); ctx.lineTo(x + s * 0.82, y - s * 0.85); ctx.lineTo(x + s * 0.82, y - s * 0.05);
      ctx.quadraticCurveTo(x + s * 0.72, y + s * 0.7, x, y + s); ctx.quadraticCurveTo(x - s * 0.72, y + s * 0.7, x - s * 0.82, y - s * 0.05); ctx.closePath();
      ctx.fill(); contorno(ctx, s);
      ctx.beginPath(); ctx.moveTo(x, y - s * 0.6); ctx.lineTo(x, y + s * 0.65); ctx.moveTo(x - s * 0.55, y - s * 0.15); ctx.lineTo(x + s * 0.55, y - s * 0.15);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1.2, s * 0.14); ctx.stroke();
      break;
    case 'raio': {
      const p = [[0.25, -1], [-0.6, 0.15], [-0.05, 0.15], [-0.3, 1], [0.62, -0.22], [0.08, -0.22], [0.4, -1]];
      ctx.beginPath(); p.forEach(([a, b], i) => ctx[i ? 'lineTo' : 'moveTo'](x + a * s, y + b * s)); ctx.closePath();
      ctx.fill(); contorno(ctx, s);
      break;
    }
    case 'estrela':
      estrela(ctx, x, y + s * 0.05, s * 1.05, s * 0.46); ctx.fill(); contorno(ctx, s);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; circulo(ctx, x - s * 0.18, y - s * 0.12, s * 0.14); ctx.fill();
      break;
    case 'espada':
      ctx.translate(x, y); ctx.rotate(Math.PI / 4);
      ctx.beginPath(); ctx.moveTo(0, -s * 1.15); ctx.lineTo(s * 0.17, -s * 0.9); ctx.lineTo(s * 0.17, s * 0.32); ctx.lineTo(-s * 0.17, s * 0.32); ctx.lineTo(-s * 0.17, -s * 0.9); ctx.closePath();
      ctx.fillStyle = '#e9eef6'; ctx.fill(); contorno(ctx, s);
      rr(ctx, -s * 0.5, s * 0.3, s, s * 0.17, s * 0.06); ctx.fillStyle = cor; ctx.fill(); contorno(ctx, s);
      rr(ctx, -s * 0.09, s * 0.47, s * 0.18, s * 0.4, s * 0.05); ctx.fillStyle = '#7a4b2a'; ctx.fill(); contorno(ctx, s);
      circulo(ctx, 0, s * 0.95, s * 0.13); ctx.fillStyle = cor; ctx.fill(); contorno(ctx, s);
      break;
    case 'diamante': {
      const p = [[-0.6, -0.5], [0.6, -0.5], [1, -0.08], [0, 1], [-1, -0.08]];
      ctx.beginPath(); p.forEach(([a, b], i) => ctx[i ? 'lineTo' : 'moveTo'](x + a * s, y + b * s)); ctx.closePath();
      ctx.fill(); contorno(ctx, s);
      ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.08); ctx.lineTo(x + s, y - s * 0.08);
      ctx.moveTo(x - s * 0.3, y - s * 0.5); ctx.lineTo(x, y + s); ctx.lineTo(x + s * 0.3, y - s * 0.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, s * 0.08); ctx.stroke();
      break;
    }
    case 'dragao': {
      const p = [[-0.95, 0.85], [-0.75, -0.15], [-0.45, -0.55], [-0.62, -1.05], [-0.18, -0.68], [0.25, -0.6], [0.92, -0.3], [1.02, -0.05], [0.55, 0.06], [0.88, 0.32], [0.2, 0.38], [-0.15, 0.85]];
      ctx.beginPath(); p.forEach(([a, b], i) => ctx[i ? 'lineTo' : 'moveTo'](x + a * s, y + b * s)); ctx.closePath();
      ctx.fill(); contorno(ctx, s);
      ctx.fillStyle = '#ffe066'; elipse(ctx, x + s * 0.18, y - s * 0.32, s * 0.15, s * 0.1); ctx.fill();
      ctx.fillStyle = TINTA; elipse(ctx, x + s * 0.2, y - s * 0.32, s * 0.04, s * 0.09); ctx.fill();
      circulo(ctx, x + s * 0.82, y - s * 0.2, s * 0.05); ctx.fill();
      break;
    }
    case 'coroa': {
      const p = [[-1, 0.7], [-1, -0.45], [-0.5, 0.05], [0, -0.8], [0.5, 0.05], [1, -0.45], [1, 0.7]];
      ctx.beginPath(); p.forEach(([a, b], i) => ctx[i ? 'lineTo' : 'moveTo'](x + a * s, y + b * s)); ctx.closePath();
      ctx.fill(); contorno(ctx, s);
      for (const [a, c] of [[-0.5, '#ef4466'], [0, '#3fa2f0'], [0.5, '#22b894']]) { circulo(ctx, x + a * s, y + s * 0.38, s * 0.15); ctx.fillStyle = c; ctx.fill(); }
      break;
    }
    default: break;
  }
  ctx.restore();
}

// ------------------------------------------------------------ cartas

function material(n) {
  if (n >= 11) return 'lendaria';
  if (n >= 9) return 'cristal';
  if (n >= 6) return 'ouro';
  if (n >= 3) return 'prata';
  return 'bronze';
}

const MAT = {
  bronze: { a: '#e3a466', b: '#94542a', dentro: '#f6e7c8', fio: '#5e3215' },
  prata: { a: '#f4f7fb', b: '#8f9cad', dentro: '#f1f5fa', fio: '#4f5a6a' },
  ouro: { a: '#ffe591', b: '#cf8d12', dentro: '#fff5d8', fio: '#7a4c00' },
  cristal: { a: '#ffffff', b: '#ffffff', dentro: '#221a44', fio: '#ffffff' },
  lendaria: { a: '#3a1655', b: '#0d0414', dentro: '#160a24', fio: '#ffd76a' },
};

/** Raio do canto da carta. */
export const raioCarta = (w) => Math.max(5, w * 0.11);

/** Moldura da carta: devolve o retangulo interno. */
function moldura(ctx, r, mat, t, corBorda) {
  const m = MAT[mat];
  const raio = raioCarta(r.w);
  ctx.save();
  ctx.shadowColor = 'rgba(20,6,24,0.45)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  rr(ctx, r.x, r.y, r.w, r.h, raio);
  if (corBorda) ctx.fillStyle = corBorda;
  else if (mat === 'cristal') {
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    for (let k = 0; k <= 4; k++) g.addColorStop(k / 4, `hsl(${(t * 70 + k * 72) % 360}, 85%, 72%)`);
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    g.addColorStop(0, m.a); g.addColorStop(1, m.b);
    ctx.fillStyle = g;
  }
  ctx.fill();
  ctx.restore();
  rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.lineWidth = Math.max(1.2, r.w * 0.024); ctx.strokeStyle = TINTA; ctx.stroke();
  const b = Math.max(3, Math.round(r.w * 0.075));
  const d = { x: r.x + b, y: r.y + b, w: r.w - b * 2, h: r.h - b * 2, r: raio * 0.6 };
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.fillStyle = m.dentro; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = rgba(m.fio, 0.7); ctx.stroke();
  return d;
}

/** Faixa de cima (o que aparece quando a carta esta coberta). */
function faixa(ctx, r, d, cor) {
  const fh = r.h * 0.3 - (d.y - r.y) - 1;
  ctx.save();
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip();
  ctx.fillStyle = cor; ctx.fillRect(d.x, d.y, d.w, fh);
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(d.x, d.y, d.w, fh * 0.42);
  ctx.fillStyle = OURO; ctx.fillRect(d.x, d.y + fh, d.w, Math.max(1.5, r.h * 0.02));
  ctx.restore();
  return { y: d.y, h: fh, cy: d.y + fh / 2 };
}

/** Miolo da carta (sem a moldura), para o brilho holografico. */
function miolo(r) {
  const b = Math.max(3, Math.round(r.w * 0.075));
  return { x: r.x + b, y: r.y + b, w: r.w - b * 2, h: r.h - b * 2, r: raioCarta(r.w) * 0.6 };
}

function brilhoHolo(ctx, d, t) {
  ctx.save();
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip();
  const u = ((t * 0.45) % 1.6) - 0.3;
  const x = d.x + u * d.w * 1.6;
  const g = ctx.createLinearGradient(x - d.w * 0.3, d.y, x + d.w * 0.3, d.y + d.h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.restore();
}

function cartaNormal(ctx, v, r) {
  const n = Math.min(11, nivel(v));
  const mat = material(n);
  const cor = CORES_DUELO[n];
  const d = moldura(ctx, r, mat, 0);
  const escuro = mat === 'cristal' || mat === 'lendaria';
  // fundo do miolo: raios suaves da cor do valor
  ctx.save();
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip();
  const cy = d.y + r.h * 0.3 + (d.h - r.h * 0.3) * 0.5;
  const g = ctx.createRadialGradient(0, cy, 2, 0, cy, d.w * 0.75);
  g.addColorStop(0, rgba(cor, escuro ? 0.55 : 0.28)); g.addColorStop(1, rgba(cor, 0));
  ctx.fillStyle = g; ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.restore();
  const f = faixa(ctx, r, d, cor);
  texto(ctx, String(v), 0, f.cy + 0.5, Math.min(f.h * 0.92, r.w * 0.4), '#ffffff', { contorno: escurecer(cor, 0.55), espessura: Math.max(2.5, f.h * 0.18), max: d.w - 4 });
  const s = Math.min(d.w * 0.3, (d.h - f.h) * 0.3);
  if (escuro) { ctx.save(); ctx.shadowColor = cor; ctx.shadowBlur = 10; emblema(ctx, EMBLEMAS[n], 0, cy, s, cor); ctx.restore(); }
  else emblema(ctx, EMBLEMAS[n], 0, cy, s, cor);
  // cantos de joia nas molduras nobres
  if (n >= 6) {
    const b = Math.max(3, r.w * 0.075);
    for (const sx of [-1, 1]) {
      const jx = sx * (r.w / 2 - b / 2 - 0.5), jy = r.y + r.h - b / 2 - 0.5;
      estrela(ctx, jx, jy, Math.max(2.4, r.w * 0.05), Math.max(1, r.w * 0.02), 4); ctx.fillStyle = mat === 'ouro' ? '#fff3b0' : '#ffffff'; ctx.fill();
    }
  }
}

function cartaPedra(ctx, r, hp, hpMax) {
  const d = moldura(ctx, r, 'prata', 0, '#7d8089');
  ctx.save();
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip();
  ctx.fillStyle = '#5f626b'; ctx.fillRect(d.x, d.y, d.w, d.h);
  const rnd = semente(19);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 18; i++) { elipse(ctx, d.x + rnd() * d.w, d.y + rnd() * d.h, (2 + rnd() * 5) * r.w / 80, (1.5 + rnd() * 3) * r.w / 80, rnd()); ctx.fill(); }
  ctx.restore();
  const f = faixa(ctx, r, d, '#4a4d55');
  // pips de hp na faixa
  const total = Math.max(1, hpMax || 3);
  const passo = Math.min(13 * r.w / 80, d.w * 0.26);
  for (let k = 0; k < total; k++) {
    const px = (k - (total - 1) / 2) * passo;
    const pr = Math.min(5 * r.w / 80, f.h * 0.28);
    elipse(ctx, px, f.cy, pr, pr);
    ctx.fillStyle = k < hp ? '#ffd23f' : 'rgba(0,0,0,0.45)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
  }
  const cy = d.y + f.h + (d.h - f.h) * 0.5;
  const s = Math.min(d.w * 0.32, (d.h - f.h) * 0.32);
  emblema(ctx, 'escudo', 0, cy, s, '#9ea2ab');
  // rachaduras pelo hp perdido
  const perdido = clamp(total - hp, 0, 3);
  const rach = [[-0.35, 0.32, -0.05, 0.55, -0.2, 0.92], [0.38, 0.3, 0.1, 0.6, 0.3, 0.95], [-0.1, 0.35, 0.12, 0.7, -0.05, 0.98]];
  ctx.strokeStyle = '#1d1e22'; ctx.lineWidth = Math.max(1.4, r.w * 0.024); ctx.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * r.w, r.y + c[1] * r.h); ctx.lineTo(c[2] * r.w, r.y + c[3] * r.h); ctx.lineTo(c[4] * r.w, r.y + c[5] * r.h); ctx.stroke();
  }
}

function cartaCoringa(ctx, r) {
  const d = moldura(ctx, r, 'cristal', 0);
  const f = faixa(ctx, r, d, '#3a2a7a');
  for (let k = -1; k <= 1; k++) { estrela(ctx, k * Math.min(12 * r.w / 80, d.w * 0.24), f.cy, f.h * 0.3, f.h * 0.13); ctx.fillStyle = `hsl(${(k * 80 + 360) % 360}, 95%, 70%)`; ctx.fill(); }
  const cy = d.y + f.h + (d.h - f.h) * 0.5, s = Math.min(d.w * 0.36, (d.h - f.h) * 0.36);
  const g = ctx.createLinearGradient(-s, cy - s, s, cy + s);
  for (let k = 0; k <= 5; k++) g.addColorStop(k / 5, `hsl(${(k * 60) % 360}, 95%, 65%)`);
  ctx.save(); ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
  estrela(ctx, 0, cy, s, s * 0.45); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  estrela(ctx, 0, cy, s, s * 0.45); contorno(ctx, s * 0.6);
}

function cartaBomba(ctx, r) {
  const d = moldura(ctx, r, 'bronze', 0, '#c22a2a');
  ctx.save(); rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip(); ctx.fillStyle = '#2b1414'; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.restore();
  const f = faixa(ctx, r, d, '#e03a3a');
  texto(ctx, rotulos.bomba, 0, f.cy + 0.5, Math.min(f.h * 0.6, d.w * 0.24), '#fff', { contorno: '#5a0c0c', espessura: 3, max: d.w - 4 });
  const cy = d.y + f.h + (d.h - f.h) * 0.56, s = Math.min(d.w * 0.3, (d.h - f.h) * 0.3);
  ctx.strokeStyle = '#c99a5a'; ctx.lineWidth = Math.max(2, s * 0.16); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(s * 0.45, cy - s * 0.75); ctx.quadraticCurveTo(s * 0.9, cy - s * 1.3, s * 1.15, cy - s * 1.0); ctx.stroke();
  circulo(ctx, 0, cy, s); ctx.fillStyle = '#1b1b22'; ctx.fill(); contorno(ctx, s);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; circulo(ctx, -s * 0.35, cy - s * 0.35, s * 0.22); ctx.fill();
}

/** Pavio aceso da bomba (anima por cima da cache). */
function pavio(ctx, r, t) {
  const d = miolo(r);
  const fh = r.h * 0.3 - (d.y - r.y) - 1;
  const cy = d.y + fh + (d.h - fh) * 0.56, s = Math.min(d.w * 0.3, (d.h - fh) * 0.3);
  const k = 0.6 + 0.4 * Math.abs(Math.sin(t * 16));
  estrela(ctx, s * 1.15, cy - s * 1.0, s * 0.42 * k, s * 0.16, 7); ctx.fillStyle = '#ffd23f'; ctx.fill();
}

function cartaDobro(ctx, r) {
  const d = moldura(ctx, r, 'ouro', 0, '#1f9e8f');
  const f = faixa(ctx, r, d, '#13867a');
  texto(ctx, '×2', 0, f.cy + 0.5, Math.min(f.h * 0.95, r.w * 0.42), '#fff', { contorno: '#063c36', espessura: 3.5 });
  const cy = d.y + f.h + (d.h - f.h) * 0.5, s = Math.min(d.w * 0.3, (d.h - f.h) * 0.3);
  ctx.save(); ctx.translate(0, cy); ctx.rotate(-Math.PI / 2);
  emblema(ctx, 'espada', -s * 0.18, -s * 0.18, s, '#1f9e8f');
  ctx.restore();
  ctx.save(); ctx.translate(0, cy); ctx.scale(-1, 1); ctx.rotate(-Math.PI / 2);
  emblema(ctx, 'espada', -s * 0.18, -s * 0.18, s, '#1f9e8f');
  ctx.restore();
}

function gelo(ctx, r) {
  const raio = raioCarta(r.w);
  ctx.save();
  rr(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, raio);
  ctx.fillStyle = 'rgba(170,225,255,0.42)'; ctx.fill();
  ctx.strokeStyle = '#e9f8ff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  const cristal = (x, y, a, h) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-h * 0.22, 0); ctx.lineTo(0, -h); ctx.lineTo(h * 0.22, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(225,246,255,0.9)'; ctx.fill(); ctx.strokeStyle = '#7cc7ee'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  };
  const b = r.y + r.h;
  cristal(-r.w * 0.32, b, -0.25, r.h * 0.42); cristal(-r.w * 0.08, b, 0.1, r.h * 0.3); cristal(r.w * 0.24, b, 0.3, r.h * 0.48);
  cristal(-r.w / 2, r.y + r.h * 0.55, 1.2, r.w * 0.38); cristal(r.w / 2, r.y + r.h * 0.42, -1.25, r.w * 0.42);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r.w * 0.4, r.y + r.h * 0.95); ctx.lineTo(r.w * 0.1, r.y + r.h * 0.1); ctx.stroke();
  ctx.restore();
  // floco no canto
  const fx = r.w / 2 - r.w * 0.1, fy = r.y + r.h * 0.45, fl = Math.max(3, r.w * 0.065);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * fl, fy - Math.sin(a) * fl); ctx.lineTo(fx + Math.cos(a) * fl, fy + Math.sin(a) * fl); ctx.stroke(); }
}

/**
 * Lodo do Gosmo (feitico): baba verde na beirada de cima, escorrendo pelos
 * lados da faixa (o numero fica livre), e o corpo tingido com bolhas. A marca
 * vai embora quando a carta funde (colunas.js apaga `lodo` na carta nova).
 */
function lodo(ctx, r) {
  const raio = raioCarta(r.w);
  const verde = '#86d94a', claro = '#c4f28c';
  const lw = Math.max(1.4, r.w * 0.025);
  ctx.save();
  // corpo tingido abaixo da faixa, com duas bolhas
  rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.clip();
  const yb = r.y + r.h * 0.3;
  ctx.fillStyle = 'rgba(120,205,70,0.3)'; ctx.fillRect(r.x, yb, r.w, r.h - (yb - r.y));
  for (const [bx, by, br] of [[-0.24, 0.8, 0.07], [0.27, 0.68, 0.05]]) {
    circulo(ctx, r.w * bx, r.y + r.h * by, r.w * br); ctx.fillStyle = 'rgba(196,242,140,0.55)'; ctx.fill();
    ctx.lineWidth = lw * 0.7; ctx.strokeStyle = 'rgba(47,125,28,0.8)'; ctx.stroke();
  }
  ctx.restore();
  // baba de cima: borda ondulada por fora e gotas penduradas dos lados
  const th = r.h * 0.07, y0 = r.y - r.h * 0.02;
  const gotas = [[-0.36, 0.11, 0.24], [-0.17, 0.07, 0.1], [0.3, 0.1, 0.19], [0.43, 0.06, 0.08]];
  ctx.beginPath();
  ctx.moveTo(r.x + raio * 0.3, y0 + th * 0.4);
  const n = 5;
  for (let k = 0; k < n; k++) {
    const x1 = r.x + raio * 0.3 + ((r.w - raio * 0.6) * (k + 0.5)) / n, x2 = r.x + raio * 0.3 + ((r.w - raio * 0.6) * (k + 1)) / n;
    ctx.quadraticCurveTo(x1, y0 - th * (k % 2 ? 0.55 : 0.9), x2, y0 + th * 0.15);
  }
  ctx.lineTo(r.x + r.w - raio * 0.3, y0 + th);
  for (const [gx, gw, gl] of gotas.slice().sort((p, q) => q[0] - p[0])) {
    const cx = r.w * gx, w2 = (r.w * gw) / 2, base = r.y + th;
    ctx.lineTo(cx + w2, base);
    ctx.bezierCurveTo(cx + w2 * 0.6, base + r.h * gl * 0.55, cx + w2, base + r.h * gl, cx, base + r.h * gl);
    ctx.bezierCurveTo(cx - w2, base + r.h * gl, cx - w2 * 0.6, base + r.h * gl * 0.55, cx - w2, base);
  }
  ctx.lineTo(r.x + raio * 0.3, y0 + th);
  ctx.closePath();
  ctx.fillStyle = verde; ctx.fill();
  ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  // brilho da baba
  ctx.fillStyle = claro;
  elipse(ctx, -r.w * 0.2, y0 + th * 0.2, r.w * 0.09, th * 0.22); ctx.fill();
  for (const [gx, , gl] of gotas.slice(0, 1).concat(gotas.slice(2, 3))) { elipse(ctx, r.w * gx - r.w * 0.015, r.y + th + r.h * gl * 0.7, r.w * 0.012, r.h * 0.025); ctx.fill(); }
}

/** Parte parada da carta (vai para a cache). */
export function pintarDuelo(ctx, carta, r) {
  if (carta.tipo === 'pedra') cartaPedra(ctx, r, carta.hp, carta.hpMax);
  else if (carta.tipo === 'coringa') cartaCoringa(ctx, r);
  else if (carta.tipo === 'bomba') cartaBomba(ctx, r);
  else if (carta.tipo === 'dobro') cartaDobro(ctx, r);
  else {
    cartaNormal(ctx, carta.v, r);
    if (carta.lodo) lodo(ctx, r);
    if (carta.gelo) gelo(ctx, r);
  }
}

/** A carta tem brilho que anda (desenhado a cada quadro)? */
export function temBrilho(carta) {
  if (carta.tipo === 'coringa' || carta.tipo === 'bomba') return true;
  return carta.tipo === 'normal' && !carta.gelo && nivel(carta.v) >= 9;
}

/** Brilho que anda: holografico nas molduras nobres e no coringa; pavio da bomba. */
export function brilhoDuelo(ctx, carta, r, t) {
  if (carta.tipo === 'bomba') { pavio(ctx, r, t); return; }
  const d = miolo(r);
  brilhoHolo(ctx, d, t);
  if (carta.tipo === 'normal' && nivel(carta.v) >= 11) {
    rr(ctx, d.x + 1, d.y + 1, d.w - 2, d.h - 2, d.r); ctx.strokeStyle = `hsla(${(t * 90) % 360}, 90%, 70%, 0.8)`; ctx.lineWidth = 1.5; ctx.stroke();
  }
}
