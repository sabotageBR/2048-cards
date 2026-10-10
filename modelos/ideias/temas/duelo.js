// Ideia 4: Duelo contra Monstros. Cada fase e uma batalha: o monstro fica em
// cima com uma barra de vida (a meta da fase). Cada fusao e um golpe que voa
// ate ele, a cascata e um combo e o 2048 e o golpe especial (raio + clarao).
// Pecas: cartas de feitico penduradas (geometria padrao), moldura pelo valor.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, textoMeta, semente, clamp, easeOut } from '../kit.js';

const TINTA = '#2a1630';
const OURO = '#e8b84a';
const NOME = 'Gosmo';

// Cor e emblema por valor (2..2048, 4096)
const CORES = ['#6fbf3a', '#3fa2f0', '#ff7a2f', '#9a6bff', '#ef4466', '#22b894', '#f2a000', '#e050b0', '#4c6ef5', '#12bfd2', '#ff3b3b', '#ffcc33'];
const EMBLEMAS = ['folha', 'gota', 'chama', 'trevo', 'coracao', 'escudo', 'raio', 'estrela', 'espada', 'diamante', 'dragao', 'coroa'];

// ------------------------------------------------------------ emblemas

function contorno(ctx, s) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, s * 0.14); ctx.strokeStyle = TINTA; ctx.stroke(); }

function emblema(ctx, tipo, x, y, s, cor) {
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

/** Moldura da carta: devolve o retangulo interno. */
function moldura(ctx, r, mat, t, op, corBorda) {
  const m = MAT[mat];
  const raio = Math.max(5, r.w * 0.11);
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
  rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
  const b = Math.max(3, Math.round(r.w * 0.075));
  const d = { x: r.x + b, y: r.y + b, w: r.w - b * 2, h: r.h - b * 2, r: raio * 0.6 };
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.fillStyle = m.dentro; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = rgba(m.fio === '#ffffff' ? '#ffffff' : m.fio, 0.7); ctx.stroke();
  if (op && op.destaque) {
    ctx.save();
    ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 14 * op.destaque;
    rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, raio + 2);
    ctx.strokeStyle = `rgba(255,226,122,${0.5 + op.destaque * 0.5})`; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
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

function cartaNormal(ctx, v, r, op) {
  const n = Math.min(11, nivel(v));
  const mat = material(n);
  const cor = CORES[n];
  const t = op.t || 0;
  const d = moldura(ctx, r, mat, t, op);
  const escuro = mat === 'cristal' || mat === 'lendaria';
  // fundo do miolo: raios suaves da cor do valor
  ctx.save();
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip();
  const cx = 0, cy = d.y + r.h * 0.3 + (d.h - r.h * 0.3) * 0.5;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, d.w * 0.75);
  g.addColorStop(0, rgba(cor, escuro ? 0.55 : 0.28)); g.addColorStop(1, rgba(cor, 0));
  ctx.fillStyle = g; ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.restore();
  const f = faixa(ctx, r, d, cor);
  // numero
  texto(ctx, String(v), 0, f.cy + 0.5, Math.min(f.h * 0.92, r.w * 0.4), '#ffffff', { contorno: escurecer(cor, 0.55), espessura: Math.max(2.5, f.h * 0.18), max: d.w - 4 });
  // emblema
  const s = Math.min(d.w * 0.3, (d.h - f.h) * 0.3);
  if (escuro) { ctx.save(); ctx.shadowColor = cor; ctx.shadowBlur = 10; emblema(ctx, EMBLEMAS[n], 0, cy, s, cor); ctx.restore(); }
  else emblema(ctx, EMBLEMAS[n], 0, cy, s, cor);
  // cantos de joia nas molduras nobres
  if (n >= 6) {
    for (const [sx, sy] of [[-1, 1], [1, 1]]) {
      const jx = sx * (r.w / 2 - Math.max(3, r.w * 0.075) / 2 - 0.5), jy = r.y + r.h - Math.max(3, r.w * 0.075) / 2 - 0.5;
      estrela(ctx, jx, sy * jy, Math.max(2.4, r.w * 0.05), Math.max(1, r.w * 0.02), 4); ctx.fillStyle = mat === 'ouro' ? '#fff3b0' : '#ffffff'; ctx.fill();
    }
  }
  if (mat === 'cristal' || mat === 'lendaria') brilhoHolo(ctx, d, t);
  if (mat === 'lendaria') {
    rr(ctx, d.x + 1, d.y + 1, d.w - 2, d.h - 2, d.r); ctx.strokeStyle = `hsla(${(t * 90) % 360}, 90%, 70%, 0.8)`; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

function cartaPedra(ctx, r, hp, op) {
  const d = moldura(ctx, r, 'prata', 0, op, '#7d8089');
  ctx.save();
  rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip();
  ctx.fillStyle = '#5f626b'; ctx.fillRect(d.x, d.y, d.w, d.h);
  const rnd = semente(19);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 18; i++) { elipse(ctx, d.x + rnd() * d.w, d.y + rnd() * d.h, 2 + rnd() * 5, 1.5 + rnd() * 3, rnd()); ctx.fill(); }
  ctx.restore();
  const f = faixa(ctx, r, d, '#4a4d55');
  // pips de hp na faixa
  for (let k = 0; k < 3; k++) {
    const px = (k - 1) * Math.min(13, d.w * 0.26);
    elipse(ctx, px, f.cy, Math.min(5, f.h * 0.28), Math.min(5, f.h * 0.28));
    ctx.fillStyle = k < hp ? '#ffd23f' : 'rgba(0,0,0,0.45)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
  }
  const cy = d.y + f.h + (d.h - f.h) * 0.5;
  const s = Math.min(d.w * 0.32, (d.h - f.h) * 0.32);
  emblema(ctx, 'escudo', 0, cy, s, '#9ea2ab');
  // rachaduras pelo hp perdido
  const perdido = 3 - clamp(hp, 0, 3);
  const rach = [[-0.35, 0.32, -0.05, 0.55, -0.2, 0.92], [0.38, 0.3, 0.1, 0.6, 0.3, 0.95], [-0.1, 0.35, 0.12, 0.7, -0.05, 0.98]];
  ctx.strokeStyle = '#1d1e22'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * r.w, r.y + c[1] * r.h); ctx.lineTo(c[2] * r.w, r.y + c[3] * r.h); ctx.lineTo(c[4] * r.w, r.y + c[5] * r.h); ctx.stroke();
  }
}

function cartaCoringa(ctx, r, op) {
  const t = op.t || 0;
  const d = moldura(ctx, r, 'cristal', t, op);
  const f = faixa(ctx, r, d, '#3a2a7a');
  for (let k = -1; k <= 1; k++) { estrela(ctx, k * Math.min(12, d.w * 0.24), f.cy, f.h * 0.3, f.h * 0.13); ctx.fillStyle = `hsl(${(t * 120 + k * 80 + 360) % 360}, 95%, 70%)`; ctx.fill(); }
  const cy = d.y + f.h + (d.h - f.h) * 0.5, s = Math.min(d.w * 0.36, (d.h - f.h) * 0.36);
  const g = ctx.createLinearGradient(-s, cy - s, s, cy + s);
  for (let k = 0; k <= 5; k++) g.addColorStop(k / 5, `hsl(${(t * 80 + k * 60) % 360}, 95%, 65%)`);
  ctx.save(); ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 10;
  estrela(ctx, 0, cy, s, s * 0.45); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  estrela(ctx, 0, cy, s, s * 0.45); contorno(ctx, s * 0.6);
  brilhoHolo(ctx, d, t);
}

function cartaBomba(ctx, r, op) {
  const t = op.t || 0;
  const d = moldura(ctx, r, 'bronze', t, op, '#c22a2a');
  ctx.save(); rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip(); ctx.fillStyle = '#2b1414'; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.restore();
  const f = faixa(ctx, r, d, '#e03a3a');
  texto(ctx, 'BOMBA', 0, f.cy + 0.5, Math.min(f.h * 0.6, d.w * 0.24), '#fff', { contorno: '#5a0c0c', espessura: 3, max: d.w - 4 });
  const cy = d.y + f.h + (d.h - f.h) * 0.56, s = Math.min(d.w * 0.3, (d.h - f.h) * 0.3);
  ctx.strokeStyle = '#c99a5a'; ctx.lineWidth = Math.max(2, s * 0.16); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(s * 0.45, cy - s * 0.75); ctx.quadraticCurveTo(s * 0.9, cy - s * 1.3, s * 1.15, cy - s * 1.0); ctx.stroke();
  const k = 0.6 + 0.4 * Math.abs(Math.sin(t * 16));
  estrela(ctx, s * 1.15, cy - s * 1.0, s * 0.42 * k, s * 0.16, 7); ctx.fillStyle = '#ffd23f'; ctx.fill();
  circulo(ctx, 0, cy, s); ctx.fillStyle = '#1b1b22'; ctx.fill(); contorno(ctx, s);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; circulo(ctx, -s * 0.35, cy - s * 0.35, s * 0.22); ctx.fill();
}

function cartaDobro(ctx, r, op) {
  const d = moldura(ctx, r, 'ouro', op.t || 0, op, '#1f9e8f');
  const f = faixa(ctx, r, d, '#13867a');
  texto(ctx, 'x2', 0, f.cy + 0.5, Math.min(f.h * 0.95, r.w * 0.42), '#fff', { contorno: '#063c36', espessura: 3.5 });
  const cy = d.y + f.h + (d.h - f.h) * 0.5, s = Math.min(d.w * 0.3, (d.h - f.h) * 0.3);
  ctx.save(); ctx.translate(0, cy); ctx.rotate(-Math.PI / 2);
  emblema(ctx, 'espada', -s * 0.18, -s * 0.18, s, '#1f9e8f');
  ctx.restore();
  ctx.save(); ctx.translate(0, cy); ctx.scale(-1, 1); ctx.rotate(-Math.PI / 2);
  emblema(ctx, 'espada', -s * 0.18, -s * 0.18, s, '#1f9e8f');
  ctx.restore();
}

function gelo(ctx, r) {
  const raio = Math.max(5, r.w * 0.11);
  ctx.save();
  rr(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, raio);
  ctx.fillStyle = 'rgba(170,225,255,0.42)'; ctx.fill();
  ctx.strokeStyle = '#e9f8ff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  // cristais nas bordas
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
  const fx = r.w / 2 - 8, fy = r.y + r.h * 0.45;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * 5, fy - Math.sin(a) * 5); ctx.lineTo(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5); ctx.stroke(); }
}

// ------------------------------------------------------------ monstro

/** Posicao do monstro: centro x, linha dos pes y, raio R. */
function posMonstro(W, H, L) {
  if (!(W > H)) {
    const R = Math.max(44, Math.min(80, W * 0.2, (L.topo - 130) / 2));
    return { x: W / 2, y: L.topo - 26, R, retrato: true };
  }
  const esp = L.mesa.x;
  const R = Math.max(36, Math.min(92, esp * 0.36, (H - L.topo) * 0.2));
  return { x: Math.max(R * 1.2, esp / 2 + 2), y: L.mesa.y + L.mesa.h * 0.74, R, retrato: false };
}

function gosmo(ctx, m, t, golpeU, derrotado) {
  const { x, y, R } = m;
  const resp = Math.sin(t * 2.3);
  const sx = 1 - resp * 0.035, sy = 1 + resp * 0.045;
  const tremor = golpeU < 1 ? Math.sin(golpeU * 40) * 7 * (1 - golpeU) : 0;
  // sombra
  elipse(ctx, x, y + 2, R * 1.15 * sx, R * 0.2); ctx.fillStyle = 'rgba(30,40,10,0.28)'; ctx.fill();
  ctx.save();
  ctx.translate(x + tremor, y);
  ctx.scale(sx, derrotado ? 0.55 : sy);
  const corpo = () => {
    ctx.beginPath();
    ctx.moveTo(-R * 1.05, 0);
    ctx.bezierCurveTo(-R * 1.15, -R * 0.95, -R * 0.62, -R * 1.62, 0, -R * 1.62);
    ctx.bezierCurveTo(R * 0.62, -R * 1.62, R * 1.15, -R * 0.95, R * 1.05, 0);
    ctx.quadraticCurveTo(R * 0.85, R * 0.1, R * 0.62, -R * 0.02);
    ctx.quadraticCurveTo(R * 0.45, R * 0.12, R * 0.25, 0);
    ctx.quadraticCurveTo(0, R * 0.1, -R * 0.3, 0);
    ctx.quadraticCurveTo(-R * 0.55, R * 0.12, -R * 0.75, -R * 0.02);
    ctx.quadraticCurveTo(-R * 0.92, R * 0.08, -R * 1.05, 0);
    ctx.closePath();
  };
  // chifres
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.32, -R * 1.45);
    ctx.quadraticCurveTo(s * R * 0.55, -R * 2.05, s * R * 0.9, -R * 2.0);
    ctx.quadraticCurveTo(s * R * 0.62, -R * 1.78, s * R * 0.62, -R * 1.32);
    ctx.closePath();
    ctx.fillStyle = '#f3e3c3'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = TINTA; ctx.stroke();
  }
  corpo();
  const g = ctx.createLinearGradient(0, -R * 1.6, 0, 0);
  g.addColorStop(0, '#b77bff'); g.addColorStop(1, '#6a2bbd');
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 3.5; ctx.strokeStyle = TINTA; ctx.stroke();
  // brilho
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; elipse(ctx, -R * 0.48, -R * 1.18, R * 0.24, R * 0.14, -0.6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; circulo(ctx, -R * 0.2, -R * 1.38, R * 0.06); ctx.fill();
  // coroinha torta
  ctx.save(); ctx.translate(R * 0.12, -R * 1.6); ctx.rotate(0.22);
  const cw = R * 0.52;
  ctx.beginPath(); ctx.moveTo(-cw / 2, 0); ctx.lineTo(-cw / 2, -R * 0.3); ctx.lineTo(-cw / 4, -R * 0.12); ctx.lineTo(0, -R * 0.36); ctx.lineTo(cw / 4, -R * 0.12); ctx.lineTo(cw / 2, -R * 0.3); ctx.lineTo(cw / 2, 0); ctx.closePath();
  ctx.fillStyle = '#ffd23f'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = '#ef4466'; circulo(ctx, 0, -R * 0.1, R * 0.05); ctx.fill();
  ctx.restore();
  // olhos
  const oy = -R * 0.88;
  for (const s of [-1, 1]) {
    const ox = s * R * 0.36;
    if (derrotado) {
      ctx.strokeStyle = TINTA; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox - R * 0.13, oy - R * 0.13); ctx.lineTo(ox + R * 0.13, oy + R * 0.13); ctx.moveTo(ox + R * 0.13, oy - R * 0.13); ctx.lineTo(ox - R * 0.13, oy + R * 0.13); ctx.stroke();
    } else if (golpeU < 1) {
      ctx.strokeStyle = TINTA; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(ox - s * R * 0.14, oy - R * 0.12); ctx.lineTo(ox + s * R * 0.1, oy); ctx.lineTo(ox - s * R * 0.14, oy + R * 0.12); ctx.stroke();
    } else {
      elipse(ctx, ox, oy, R * 0.21, R * 0.25); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = TINTA; ctx.stroke();
      const piscar = (t % 4.2) < 0.12;
      if (piscar) { ctx.fillStyle = '#8f4fe0'; elipse(ctx, ox, oy, R * 0.22, R * 0.26); ctx.fill(); ctx.beginPath(); ctx.moveTo(ox - R * 0.18, oy); ctx.lineTo(ox + R * 0.18, oy); ctx.stroke(); }
      else {
        ctx.fillStyle = '#1a0d22'; circulo(ctx, ox + s * R * 0.03, oy + R * 0.08, R * 0.11); ctx.fill();
        ctx.fillStyle = '#fff'; circulo(ctx, ox + s * R * 0.03 + R * 0.04, oy + R * 0.04, R * 0.035); ctx.fill();
      }
      // sobrancelha brava
      ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(3, R * 0.07); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ox - s * R * 0.2, oy - R * 0.36); ctx.lineTo(ox + s * R * 0.14, oy - R * 0.24); ctx.stroke();
    }
  }
  // boca com presa
  ctx.beginPath(); ctx.moveTo(-R * 0.36, -R * 0.42); ctx.quadraticCurveTo(0, derrotado ? -R * 0.5 : -R * 0.18, R * 0.36, -R * 0.42);
  ctx.quadraticCurveTo(0, -R * 0.3, -R * 0.36, -R * 0.42); ctx.closePath();
  ctx.fillStyle = '#3a0f3e'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(R * 0.08, -R * 0.36); ctx.lineTo(R * 0.15, -R * 0.24); ctx.lineTo(R * 0.21, -R * 0.37); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.37); ctx.lineTo(-R * 0.15, -R * 0.28); ctx.lineTo(-R * 0.1, -R * 0.36); ctx.closePath(); ctx.fill();
  // clarao do golpe
  if (golpeU < 1) { corpo(); ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - golpeU)})`; ctx.fill(); }
  ctx.restore();
}

// ------------------------------------------------------------ HUD

function vidaDe(e) {
  if (e.fim === 'venceu') return 0;
  if (!e.metas.length) return 1;
  const p = e.metas.reduce((s, m) => s + Math.min(1, m.atual / m.alvo), 0) / e.metas.length;
  return clamp(1 - p);
}

function painel(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(20,6,24,0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  rr(ctx, x, y, w, h, 14);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#4a2a4f'); g.addColorStop(1, '#2c1530');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  rr(ctx, x, y, w, h, 14); ctx.lineWidth = 2.5; ctx.strokeStyle = OURO; ctx.stroke();
  rr(ctx, x + 4, y + 4, w - 8, h - 8, 10); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(232,184,74,0.45)'; ctx.stroke();
}

function barraVida(ctx, x, y, w, h, hp, hpVis) {
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = '#1a0b1d'; ctx.fill();
  if (hpVis > hp) { rr(ctx, x + 2, y + 2, Math.max(0, (w - 4) * hpVis), h - 4, (h - 4) / 2); ctx.fillStyle = '#fff1c2'; ctx.fill(); }
  if (hp > 0) {
    rr(ctx, x + 2, y + 2, Math.max(h - 4, (w - 4) * hp), h - 4, (h - 4) / 2);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ff6b6b'); g.addColorStop(1, '#c81d3a');
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; rr(ctx, x + 4, y + 3, Math.max(0, (w - 8) * hp), (h - 6) * 0.35, 3); ctx.fill();
  }
  rr(ctx, x, y, w, h, h / 2); ctx.lineWidth = 2; ctx.strokeStyle = OURO; ctx.stroke();
  // coracao
  const cx = x + 2, cy = y + h / 2, s = h * 0.62;
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.7, cy - s * 1.2, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.2, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.9);
  ctx.fillStyle = '#ff3b5c'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  texto(ctx, `HP ${Math.ceil(hp * 100)}/100`, x + w / 2, cy + 0.5, h * 0.62, '#ffffff', { contorno: '#3a0b16', espessura: 3 });
}

function iconeEspada(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.16, -s * 0.8); ctx.lineTo(s * 0.16, s * 0.3); ctx.lineTo(-s * 0.16, s * 0.3); ctx.lineTo(-s * 0.16, -s * 0.8); ctx.closePath();
  ctx.fillStyle = '#e9eef6'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = OURO; ctx.fillRect(-s * 0.45, s * 0.28, s * 0.9, s * 0.16); ctx.strokeRect(-s * 0.45, s * 0.28, s * 0.9, s * 0.16);
  ctx.fillStyle = '#7a4b2a'; ctx.fillRect(-s * 0.08, s * 0.44, s * 0.16, s * 0.4);
  ctx.restore();
}

/** "espada DANO 1234" alinhado a direita em xd. */
function dano(ctx, xd, y, tam, pontos) {
  ctx.save();
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const wn = ctx.measureText(String(pontos)).width;
  ctx.font = `700 ${tam * 0.62}px Fredoka, system-ui, sans-serif`;
  const wr = ctx.measureText('DANO').width;
  ctx.restore();
  texto(ctx, String(pontos), xd, y, tam, '#ffffff', { alinhar: 'right', contorno: TINTA, espessura: 3 });
  texto(ctx, 'DANO', xd - wn - 6, y + 1, tam * 0.62, '#d9b9e0', { alinhar: 'right' });
  iconeEspada(ctx, xd - wn - 6 - wr - tam * 0.6, y, tam * 0.6);
}

// ------------------------------------------------------------ particulas

function registrarFormas(P) {
  if (P.formas.corte) return;
  P.formas.corte = (ctx, p, u) => {
    const L = p.tam;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(0, -L * 0.18, L / 2, 0);
    ctx.quadraticCurveTo(0, -L * 0.06, -L / 2, 0);
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha *= 1 - u * 0.5; ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,140,0.9)'; ctx.lineWidth = 2; ctx.stroke();
  };
  P.formas.raio = (ctx, p, u) => {
    const rnd = semente(1 + Math.floor(p.t * 40));
    const n = 9;
    ctx.save();
    ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 18;
    for (const [larg, cor] of [[p.tam * (1 - u * 0.6), '#ffe27a'], [p.tam * 0.4 * (1 - u * 0.5), '#ffffff']]) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let i = 1; i < n; i++) {
        const k = i / n, j = (rnd() - 0.5) * 34 * (1 - Math.abs(k - 0.5));
        ctx.lineTo(p.dx * k + j, p.dy * k + j * 0.4);
      }
      ctx.lineTo(p.dx, p.dy);
      ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.restore();
  };
  P.formas.orbe = (ctx, p) => {
    const r0 = p.tam / 2;
    for (let k = 3; k >= 1; k--) {
      circulo(ctx, -p.vx * 0.022 * k, -p.vy * 0.022 * k, r0 * (1 - k * 0.2));
      ctx.fillStyle = rgba(p.cor, 0.5 - k * 0.12); ctx.fill();
    }
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r0 * 1.6);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, p.cor); g.addColorStop(1, rgba(p.cor, 0));
    circulo(ctx, 0, 0, r0 * 1.6); ctx.fillStyle = g; ctx.fill();
  };
  P.formas.caco = (ctx, p) => {
    ctx.beginPath(); ctx.moveTo(0, -p.tam / 2); ctx.lineTo(p.tam * 0.22, p.tam / 2); ctx.lineTo(-p.tam * 0.22, p.tam / 2); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.stroke();
  };
  P.formas.lasca = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s * 0.2, -s); ctx.lineTo(s, s * 0.1); ctx.lineTo(-s * 0.1, s); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  };
}

/** Golpe chegando no monstro (agendado pelo efeito, aplicado no desenho da mesa). */
function aplicarGolpe(mem, g, agora) {
  const P = mem.P, m = mem.m;
  if (!P || !m) return;
  mem.golpe = agora;
  const jx = (Math.random() - 0.5) * m.R * 0.9;
  if (g.critico) {
    mem.clarao = agora;
    P.texto(m.x, m.y - m.R * 2.05, 'CRÍTICO!', '#ffe27a', 34, '#a3122b');
    P.texto(m.x + jx * 0.3, m.y - m.R * 1.1, '-' + g.valor, '#ffffff', 40, '#a3122b');
    P.estourar(m.x, m.y - m.R * 0.8, ['#ffe27a', '#ffffff', '#ff8a3d'], 34, 1.6, { forma: 'estrela', tam: 12, g: 300 });
    for (let k = 0; k < 3; k++) P.add({ forma: 'corte', x: m.x, y: m.y - m.R * (0.5 + k * 0.32), vida: 0.35, tam: m.R * 2.2, rot: -0.7 + k * 0.7, cor: '#fff' });
  } else {
    P.texto(m.x + jx, m.y - m.R * 1.3, '-' + g.valor, '#ffffff', 20 + Math.min(12, g.degrau * 3), '#a3122b');
    P.add({ forma: 'corte', x: m.x + jx * 0.4, y: m.y - m.R * 0.8, vida: 0.26, tam: m.R * 1.7, rot: -0.65 + (Math.random() - 0.5) * 0.4, cor: '#fff' });
    P.estourar(m.x + jx * 0.4, m.y - m.R * 0.8, ['#ffffff', '#ffe27a'], 8, 0.7, { forma: 'c', tam: 5 });
  }
}

// ------------------------------------------------------------ tema

const tema = {
  id: 'duelo',
  nome: 'Duelo contra Monstros',
  cores: { texto: '#ffffff', destaque: '#ffe27a', particulas: ['#ffe27a', '#ffffff', '#ff8a3d'] },
  faixas: (W, H) => (W > H ? { topo: Math.min(104, Math.max(84, H * 0.15)), base: 0 } : { topo: Math.round(Math.min(330, Math.max(250, H * 0.38))), base: 0 }),

  fundo(ctx, W, H, L) {
    const m = posMonstro(W, H, L);
    const hy = m.y - m.R * 1.25;
    // ceu azul -> pessego
    const g = ctx.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, '#6db8ee'); g.addColorStop(0.65, '#b9dcf2'); g.addColorStop(1, '#ffd5b0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sol
    const sx = m.retrato ? W * 0.18 : W * 0.62, sy = hy - (m.retrato ? 70 : 90);
    const gs = ctx.createRadialGradient(sx, sy, 4, sx, sy, 90);
    gs.addColorStop(0, 'rgba(255,248,214,0.95)'); gs.addColorStop(0.3, 'rgba(255,236,180,0.6)'); gs.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = gs; ctx.fillRect(sx - 90, sy - 90, 180, 180);
    // nuvens paradas
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const rnd = semente(23);
    for (let i = 0; i < 5; i++) {
      const x = rnd() * W, y = 40 + rnd() * Math.max(40, hy - 120), s = 0.6 + rnd() * 0.7;
      elipse(ctx, x, y, 34 * s, 10 * s); ctx.fill(); circulo(ctx, x - 10 * s, y - 6 * s, 12 * s); ctx.fill(); circulo(ctx, x + 10 * s, y - 9 * s, 15 * s); ctx.fill();
    }
    // montanhas
    const montanha = (base, cor, neve, picos, amp, fase) => {
      ctx.beginPath(); ctx.moveTo(0, base);
      const pts = [];
      for (let i = 0; i <= picos; i++) {
        const x = (i / picos) * W, y = base - amp * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + fase)));
        pts.push([x, y]);
        ctx.lineTo(x - W / picos / 2, base - amp * 0.25); ctx.lineTo(x, y);
      }
      ctx.lineTo(W, base); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = cor; ctx.fill();
      if (neve) {
        ctx.fillStyle = neve;
        for (const [x, y] of pts) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 12); ctx.lineTo(x - 3, y + 9); ctx.lineTo(x + 2, y + 13); ctx.lineTo(x + 10, y + 12); ctx.closePath(); ctx.fill(); }
      }
    };
    montanha(hy + 8, '#9aa7d6', '#f4f6ff', m.retrato ? 4 : 7, 90, 0.4);
    montanha(hy + 18, '#7c8bc4', null, m.retrato ? 5 : 9, 52, 2.1);
    // castelo no morro
    const cx = m.retrato ? W * 0.8 : W - 100, cy = hy + 6;
    ctx.fillStyle = '#5a5f8e';
    ctx.beginPath(); ctx.ellipse(cx, cy + 10, 70, 22, 0, Math.PI, 0); ctx.fill();
    const torre = (x, w, h) => {
      ctx.fillRect(x - w / 2, cy - h, w, h);
      for (let k = 0; k < 3; k++) ctx.fillRect(x - w / 2 + k * (w / 2.5), cy - h - 4, w / 5, 4);
      ctx.beginPath(); ctx.moveTo(x - w / 2 - 2, cy - h); ctx.lineTo(x, cy - h - w * 1.1); ctx.lineTo(x + w / 2 + 2, cy - h); ctx.closePath(); ctx.fill();
    };
    ctx.fillRect(cx - 30, cy - 26, 60, 26);
    torre(cx - 32, 14, 40); torre(cx + 32, 14, 44); torre(cx, 18, 58);
    ctx.fillStyle = '#ef4466'; ctx.beginPath(); ctx.moveTo(cx, cy - 58 - 20); ctx.lineTo(cx, cy - 58 - 30); ctx.lineTo(cx + 12, cy - 58 - 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe9a6'; for (const dx of [-32, 0, 32]) ctx.fillRect(cx + dx - 2, cy - 30, 4, 7);
    // grama
    const gg = ctx.createLinearGradient(0, hy + 10, 0, H);
    gg.addColorStop(0, '#9bd56b'); gg.addColorStop(0.35, '#6fb34a'); gg.addColorStop(1, '#3d7a2c');
    ctx.fillStyle = gg; ctx.fillRect(0, hy + 10, W, H);
    // arena de terra sob o monstro
    elipse(ctx, m.x, m.y + 2, m.R * 1.9, m.R * 0.42); ctx.fillStyle = '#d8c08a'; ctx.fill();
    elipse(ctx, m.x, m.y + 2, m.R * 1.9, m.R * 0.42); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120,90,40,0.35)'; ctx.stroke();
    // estandartes ao lado da arena
    for (const s of [-1, 1]) {
      const bx = m.x + s * m.R * 1.75, by = m.y - 4;
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(bx - 2, by - m.R * 1.6, 4, m.R * 1.6);
      ctx.fillStyle = s < 0 ? '#c8304a' : '#3a6fd8';
      ctx.beginPath(); ctx.moveTo(bx + 2, by - m.R * 1.55); ctx.lineTo(bx + 2 + s * 0 + 22, by - m.R * 1.55); ctx.lineTo(bx + 2 + 22, by - m.R * 1.0); ctx.lineTo(bx + 13, by - m.R * 1.12); ctx.lineTo(bx + 2, by - m.R * 1.0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = OURO; circulo(ctx, bx, by - m.R * 1.62, 3.5); ctx.fill();
    }
    // tufos e pedrinhas
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W, y = hy + 20 + rnd() * (H - hy - 20);
      if (rnd() < 0.7) { ctx.strokeStyle = 'rgba(40,90,25,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 6); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 7); ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(200,200,190,0.6)'; elipse(ctx, x, y, 3, 2); ctx.fill(); }
    }
  },

  vivo(ctx, W, H, t) {
    // nuvenzinhas que passam
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 2; i++) {
      const x = ((i * 211 + t * (6 + i * 4)) % (W + 120)) - 60, y = 120 + i * 50;
      elipse(ctx, x, y, 26, 7); ctx.fill(); circulo(ctx, x + 6, y - 6, 10); ctx.fill();
    }
  },

  mesa(ctx, L, e, t, mem) {
    const m = posMonstro(L.W, L.H, L);
    mem.m = m;
    const agora = t * 1000;
    if (mem.fila && mem.fila.length) {
      const chegaram = mem.fila.filter((g) => agora >= g.t);
      mem.fila = mem.fila.filter((g) => agora < g.t);
      // a vida mostrada so cai quando o golpe chega (o estado ja tem a vida final)
      chegaram.forEach((g, i) => {
        aplicarGolpe(mem, g, agora);
        const faltam = mem.fila.length + chegaram.length - 1 - i;
        if (mem.hpMostrado !== undefined && mem.hpReal !== undefined) mem.hpMostrado -= (mem.hpMostrado - mem.hpReal) / (faltam + 1);
      });
    }
    const golpeU = mem.golpe ? clamp((agora - mem.golpe) / 260) : 1;
    gosmo(ctx, m, t, golpeU, e.fim === 'venceu' && (mem.hpMostrado ?? 0) <= 0.001);
    tema.tapete(ctx, L);
    // grimorio: madeira escura com friso dourado
    const s = L.mesa;
    ctx.save();
    ctx.shadowColor = 'rgba(15,5,15,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
    rr(ctx, s.x, s.y, s.w, s.h, 16);
    const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
    g.addColorStop(0, '#5a3423'); g.addColorStop(1, '#3a2016');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 12); ctx.fillStyle = '#2a1712'; ctx.fill();
    rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 12); ctx.lineWidth = 2; ctx.strokeStyle = OURO; ctx.stroke();
    rr(ctx, s.x, s.y, s.w, s.h, 16); ctx.lineWidth = 2; ctx.strokeStyle = '#1a0c08'; ctx.stroke();
    for (const [cx, cy] of [[s.x + 5, s.y + 5], [s.x + s.w - 5, s.y + 5], [s.x + 5, s.y + s.h - 5], [s.x + s.w - 5, s.y + s.h - 5]]) {
      estrela(ctx, cx, cy, 7, 2.6, 4, 0); ctx.fillStyle = OURO; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#6b4a10'; ctx.stroke();
    }
    // slots vazios com runa
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const r = L.carta(c, 0);
      rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 8);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(232,184,74,0.55)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rr0 = r.w * 0.24;
      circulo(ctx, cx, cy, rr0); ctx.strokeStyle = `rgba(232,184,74,${0.35 + 0.2 * Math.sin(t * 2 + c)})`; ctx.lineWidth = 1.5; ctx.stroke();
      estrela(ctx, cx, cy, rr0 * 0.7, rr0 * 0.28, 4, t * 0.3 + c); ctx.fillStyle = 'rgba(232,184,74,0.35)'; ctx.fill();
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') cartaPedra(ctx, r, carta.hp, op);
    else if (carta.tipo === 'coringa') cartaCoringa(ctx, r, op);
    else if (carta.tipo === 'bomba') cartaBomba(ctx, r, op);
    else if (carta.tipo === 'dobro') cartaDobro(ctx, r, op);
    else {
      cartaNormal(ctx, carta.v, r, op);
      if (carta.gelo) gelo(ctx, r);
    }
    if (op.fila && !op.frente) { rr(ctx, r.x, r.y, r.w, r.h, Math.max(5, r.w * 0.11)); ctx.fillStyle = 'rgba(20,8,24,0.32)'; ctx.fill(); }
  },

  cadeado(ctx, a, c, e, t) {
    ctx.save();
    rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 10); ctx.fillStyle = 'rgba(20,8,24,0.45)'; ctx.fill();
    // correntes em X
    const elo = (x0, y0, x1, y1) => {
      const n = Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / 11));
      const ang = Math.atan2(y1 - y0, x1 - x0);
      for (let i = 0; i <= n; i++) {
        const k = i / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        if (i % 2) { elipse(ctx, 0, 0, 7, 2.6); ctx.fillStyle = '#8b93a3'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); }
        else { elipse(ctx, 0, 0, 7, 4.5); ctx.lineWidth = 3; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#c3cad6'; ctx.stroke(); }
        ctx.restore();
      }
    };
    elo(a.x - 2, a.y + 6, a.x + a.w + 2, a.y + a.h - 6);
    elo(a.x + a.w + 2, a.y + 6, a.x - 2, a.y + a.h - 6);
    // cadeado
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    ctx.strokeStyle = '#2b2f38'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy - 6, 8, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#c3cad6'; ctx.lineWidth = 2.5; ctx.stroke();
    rr(ctx, cx - 12, cy - 6, 24, 19, 4); ctx.fillStyle = OURO; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = TINTA; circulo(ctx, cx, cy + 1.5, 2.6); ctx.fill(); ctx.fillRect(cx - 1, cy + 2, 2, 6);
    ctx.restore();
  },

  descarte(ctx, r, e, t) {
    // lapide/laje rachada
    const carga = e.descarteCarga > 0;
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
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.58;
    if (carga) { ctx.shadowColor = '#7fe3ff'; ctx.shadowBlur = 10 + 4 * Math.sin(t * 3); }
    ctx.strokeStyle = carga ? '#bff1ff' : '#3a3c44'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, r.w * 0.2, -Math.PI * 0.15, Math.PI * 1.35); ctx.stroke();
    const a = Math.PI * 1.35, ax = cx + Math.cos(a) * r.w * 0.2, ay = cy + Math.sin(a) * r.w * 0.2;
    ctx.beginPath(); ctx.moveTo(ax - 6, ay - 1); ctx.lineTo(ax, ay); ctx.lineTo(ax + 1, ay - 7); ctx.stroke();
    ctx.restore();
    texto(ctx, carga ? 'descartar' : 'sem carga', cx, r.y + r.h - 9, Math.max(8, r.w * 0.15), carga ? '#ffffff' : '#c9c9c9', { contorno: TINTA, espessura: 2.5, max: r.w - 4 });
  },

  /** Tapete de couro da mao (desenhado na camada da mesa, por baixo das cartas em voo). */
  tapete(ctx, L) {
    const f = L.fila;
    let x, y, w, h;
    if (f.vertical) { x = f.x - 2; y = f.y - 6; w = f.w + 4; h = f.h + 12; }
    else {
      const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
      x = Math.min(p0.x, p2.x) - 16; w = Math.max(p0.x + p0.w, p2.x + p2.w) + 16 - x;
      y = p0.y - 12; h = p0.h + 24;
    }
    ctx.save();
    ctx.shadowColor = 'rgba(20,6,24,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rr(ctx, x, y, w, h, 14);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#9a5b34'); g.addColorStop(1, '#6e3b1f');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    rr(ctx, x + 5, y + 5, w - 10, h - 10, 10);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,226,170,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
    rr(ctx, x, y, w, h, 14); ctx.lineWidth = 2; ctx.strokeStyle = '#3a1e0e'; ctx.stroke();
    if (!f.vertical) {
      const p0 = L.filaPos(0);
      texto(ctx, 'na mão', p0.x + p0.w / 2, y - 9, 12, '#fff3d6', { contorno: TINTA, espessura: 3 });
    } else texto(ctx, 'na mão', x + w / 2, y - 10, 13, '#fff3d6', { contorno: TINTA, espessura: 3 });
  },

  frente(ctx, L, e, t, mem) {
    // clarao do golpe especial
    if (mem.clarao) {
      const u = (t * 1000 - mem.clarao) / 420;
      if (u < 1) { ctx.fillStyle = `rgba(255,250,225,${0.75 * (1 - u) * (1 - u)})`; ctx.fillRect(0, 0, L.W, L.H); }
    }
    // furia: borda vermelha pulsando
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 8);
      const g = ctx.createRadialGradient(L.W / 2, L.H / 2, Math.min(L.W, L.H) * 0.35, L.W / 2, L.H / 2, Math.max(L.W, L.H) * 0.75);
      g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, `rgba(255,40,60,${0.25 + 0.2 * k})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H);
    }
  },

  hud(ctx, W, H, L, e, t, mem) {
    const hpReal = vidaDe(e);
    mem.hpReal = hpReal;
    if (mem.hpMostrado === undefined || hpReal > mem.hpMostrado) mem.hpMostrado = hpReal;
    // salvaguarda: progresso sem golpe (ou golpe perdido) alcanca a vida real devagar
    if (!(mem.fila && mem.fila.length) && t * 1000 - (mem.golpe || 0) > 900) mem.hpMostrado += (hpReal - mem.hpMostrado) * 0.12;
    const hp = mem.hpMostrado;
    if (mem.hpVis === undefined || mem.hpVis < hp) mem.hpVis = hp;
    mem.hpVis += (hp - mem.hpVis) * 0.06;
    const paisagem = W > H;
    const x = 10, y = 8, w = W - 20;
    const h = paisagem ? 74 : 92;
    painel(ctx, x, y, w, h);
    const metas = e.metas.map((m) => ({ txt: textoMeta(m, { monte: (n) => 'Golpe especial x' + n }), feita: m.feita }));
    if (!paisagem) {
      texto(ctx, `Fase ${e.faseId} · ${NOME}`, x + 14, y + 18, 16, '#ffe9b8', { alinhar: 'left', contorno: TINTA, espessura: 3, max: w - 120 });
      dano(ctx, x + w - 14, y + 18, 17, e.pontos);
      barraVida(ctx, x + 26, y + 34, w - 40, 24, hp, mem.hpVis);
      texto(ctx, metas.map((m) => (m.feita ? '✓ ' : '• ') + m.txt).join('   '), x + w / 2, y + 74, 11.5, '#f0dff2', { max: w - 20 });
    } else {
      texto(ctx, `Fase ${e.faseId}`, x + 16, y + 24, 14, '#d9b9e0', { alinhar: 'left' });
      texto(ctx, NOME, x + 16, y + 48, 22, '#ffe9b8', { alinhar: 'left', contorno: TINTA, espessura: 3 });
      const bw = Math.min(520, w * 0.48), bx = x + w / 2 - bw / 2;
      barraVida(ctx, bx, y + 14, bw, 26, hp, mem.hpVis);
      texto(ctx, metas.map((m) => (m.feita ? '✓ ' : '• ') + m.txt).join('    '), x + w / 2, y + 56, 12.5, '#f0dff2', { max: bw + 80 });
      dano(ctx, x + w - 16, y + h / 2, 24, e.pontos);
    }
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      texto(ctx, 'FÚRIA x2', W / 2, y + h + 18, 22 + k * 3, '#ff4d4d', { contorno: '#fff3d6', espessura: 5 });
    }
  },

  efeito(fx, P, mem, agoraBase) {
    registrarFormas(P);
    mem.P = P;
    const m = mem.m;
    const agora = agoraBase ?? performance.now();
    const alvoY = m ? m.y - m.R * 0.8 : 0;
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 20, ['#ffe27a', '#f6c453', '#fff3c2'], 9, 0.4, { g: 160, vida: 0.45, tam: 4, forma: 'c' });
        return true;
      case 'fusao': {
        const n = Math.min(11, nivel(fx.valor));
        P.estourar(fx.x, fx.y, [CORES[n], '#ffe27a', '#ffffff'], 8 + fx.degrau * 3, 0.7 + fx.degrau * 0.12, { forma: 'estrela', tam: 8, g: 300 });
        P.anel(fx.x, fx.y, CORES[n], 28 + fx.degrau * 6);
        if (m) {
          const voo = 0.32;
          P.add({ forma: 'orbe', x: fx.x, y: fx.y, vx: (m.x - fx.x) / voo, vy: (alvoY - fx.y) / voo, g: 0, arrasto: 1, vida: voo, tam: 14 + fx.degrau * 3, cor: CORES[n] });
          mem.fila = mem.fila || [];
          mem.fila.push({ t: agora + voo * 1000, valor: fx.valor, degrau: fx.degrau });
        }
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, 'x' + fx.degrau, '#ffe27a', 22 + fx.degrau * 2, TINTA);
        return true;
      }
      case 'completar':
        P.estourar(fx.x, fx.y, ['#ffe27a', '#ffffff', '#12bfd2'], 30, 1.5, { forma: 'estrela', tam: 11 });
        if (m) {
          P.add({ forma: 'raio', x: fx.x, y: fx.y, dx: m.x - fx.x, dy: alvoY - fx.y, vida: 0.5, tam: 12, cor: '#fff3a0' });
          mem.fila = mem.fila || [];
          mem.fila.push({ t: agora + 140, valor: fx.valor, degrau: 4, critico: true });
        }
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#ff8a3d', '#ffd23f', '#ff3b3b'], 22, 1.3, { forma: 'estrela', tam: 9 });
        P.subir(fx.x, fx.y, ['rgba(70,60,70,0.7)', 'rgba(120,110,120,0.6)'], 7, { tam: 16, vida: 0.8, larg: 30 });
        P.anel(fx.x, fx.y, '#ffd23f', 50);
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#8d919b', '#5b5f69', '#c3c7cf'], 18, 1.1, { forma: 'lasca', tam: 9 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#8d919b', '#c3c7cf'], 7, 0.6, { forma: 'lasca', tam: 6 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#e1f6ff', '#9fdcff', '#ffffff'], 16, 0.8, { forma: 'caco', tam: 10, g: 300 });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#c3cad6', '#8b93a3', '#e8b84a'], 14, 0.9, { forma: 'q', tam: 6 });
        P.texto(fx.x, fx.y - 20, 'Livre!', '#ffe27a', 20, TINTA);
        return true;
      case 'combo':
        P.texto(fx.x, fx.y - 44, `COMBO x${fx.n}`, '#ff9f2f', 22 + Math.min(10, fx.n * 2), TINTA);
        return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e, t) {
    const venceu = e.fim === 'venceu';
    ctx.save();
    ctx.fillStyle = 'rgba(20,6,24,0.55)'; ctx.fillRect(0, 0, W, H);
    const cy = H * 0.46, bw = Math.min(W * 0.9, 420), bh = 92;
    // fita
    ctx.fillStyle = venceu ? '#c8304a' : '#4a4d63';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(W / 2 + s * bw / 2, cy - bh * 0.32); ctx.lineTo(W / 2 + s * (bw / 2 + 26), cy - bh * 0.32); ctx.lineTo(W / 2 + s * (bw / 2 + 12), cy); ctx.lineTo(W / 2 + s * (bw / 2 + 26), cy + bh * 0.32); ctx.lineTo(W / 2 + s * bw / 2, cy + bh * 0.32); ctx.closePath(); ctx.fill();
    }
    painel(ctx, W / 2 - bw / 2, cy - bh / 2, bw, bh);
    const k = 1 + 0.04 * Math.sin(t * 5);
    ctx.save();
    ctx.translate(W / 2, cy - 10); ctx.scale(k, k);
    texto(ctx, venceu ? 'VITÓRIA!' : 'DERROTA', 0, 0, Math.min(44, W * 0.11), venceu ? '#ffe27a' : '#d0d3e0', { contorno: TINTA, espessura: 6 });
    ctx.restore();
    ctx.restore();
    texto(ctx, venceu ? `${NOME} foi derrotado · toque para outra batalha` : 'sem jogadas · toque para tentar de novo', W / 2, cy + 28, Math.min(15, W * 0.038), '#ffffff', { max: bw - 20 });
  },
};

export default tema;
