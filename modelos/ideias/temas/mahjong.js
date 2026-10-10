// Ideia 14: Mahjong de Jade. As cartas viram pecas grossas de mahjong (face de
// marfim, verso de jade com espessura), gravadas com um motivo por valor:
// circulo, bambus, flor de ameixa, lotus, carpa, lanterna, grou, nuvem,
// tartaruga, fenix e o Dragao Dourado do 2048. Sem ideogramas (respeito
// cultural): so motivos e algarismos. Geometria padrao de cartas.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, textoMeta, semente, clamp } from '../kit.js';

const MARFIM = '#f6efdc';
const JADE = '#2e8b6e';
const LACA = '#8f1d1d';
const OURO = '#d4a64a';
const MADEIRA = '#3a2418';
const AZUL = '#2c4a9a';
const VERMELHO = '#b3261e';
const VERDE = '#1f6f4a';
const TINTA = '#2a1a10';
const TINTAS = [AZUL, VERMELHO, VERDE];

const MOTIVOS = ['circulo', 'bambus', 'ameixa', 'lotus', 'carpa', 'lanterna', 'grou', 'nuvem', 'tartaruga', 'fenix', 'dragao', 'celestial'];
const tintaDe = (n) => (n >= 10 ? '#8a5a00' : TINTAS[n % 3]);

function traco(ctx, cor, l = 1.4) { ctx.lineWidth = l; ctx.strokeStyle = cor; ctx.stroke(); }

// ------------------------------------------------------------ a peca

/**
 * Corpo da peca: verso de jade com espessura (embaixo e a direita), camada
 * intermediaria e face. Devolve a face e as medidas uteis.
 */
function corpo(ctx, r, op, face = {}) {
  const d = Math.max(3, Math.round(r.w * 0.085));
  const raio = Math.max(4, r.w * 0.13);
  const f = { x: r.x, y: r.y, w: r.w - d * 0.6, h: r.h - d };
  ctx.save();
  ctx.shadowColor = 'rgba(10,4,2,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  rr(ctx, f.x + d * 0.6, f.y + d, f.w, f.h, raio);
  const gj = ctx.createLinearGradient(0, f.y + d, 0, f.y + d + f.h);
  gj.addColorStop(0, face.verso1 || '#47ad8b'); gj.addColorStop(1, face.verso2 || '#1b5a45');
  ctx.fillStyle = gj; ctx.fill();
  ctx.restore();
  rr(ctx, f.x + d * 0.6, f.y + d, f.w, f.h, raio); traco(ctx, '#0f3326', 1.2);
  rr(ctx, f.x + d * 0.3, f.y + d * 0.5, f.w, f.h, raio); ctx.fillStyle = face.meio || '#ddd0ae'; ctx.fill();
  // face
  rr(ctx, f.x, f.y, f.w, f.h, raio);
  const gf = ctx.createLinearGradient(f.x, f.y, f.x + f.w, f.y + f.h);
  gf.addColorStop(0, face.a || '#fffbf0'); gf.addColorStop(1, face.b || '#eadfc0');
  ctx.fillStyle = gf; ctx.fill();
  traco(ctx, face.borda || '#7a6646', 1.2);
  // bisel
  rr(ctx, f.x + 2, f.y + 2, f.w - 4, f.h - 4, raio - 2); traco(ctx, 'rgba(255,255,255,0.75)', 1.2);
  rr(ctx, f.x + 3.5, f.y + 3.5, f.w - 7, f.h - 7, raio - 3); traco(ctx, 'rgba(120,96,60,0.18)', 1);
  if (op && op.destaque) {
    ctx.save();
    ctx.shadowColor = OURO; ctx.shadowBlur = 12 * op.destaque;
    rr(ctx, f.x - 2, f.y - 2, f.w + 4, f.h + 4, raio + 2);
    ctx.strokeStyle = `rgba(232,196,110,${0.45 + op.destaque * 0.55})`; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  const faixa = r.h * 0.3;
  const cy = r.y + faixa + (f.h - faixa) / 2;
  return { ...f, d, raio, faixa, cx: f.x + f.w / 2, cy, s: Math.min(f.w * 0.34, (f.h - faixa) * 0.4) };
}

/** Numero gravado na faixa de cima (brilho embaixo, tinta em cima). */
function numero(ctx, f, txt, cor) {
  const tam = Math.min(f.faixa * 0.78, f.w * (txt.length >= 4 ? 0.3 : 0.4));
  const y = f.y + f.faixa * 0.5 + 0.5;
  const max = f.w - 8;
  texto(ctx, txt, f.cx, y + 1.2, tam, 'rgba(255,255,255,0.9)', { max });
  texto(ctx, txt, f.cx, y, tam, cor, { max });
  ctx.fillStyle = rgba(cor, 0.28);
  ctx.fillRect(f.x + 6, f.y + f.faixa - 2, f.w - 12, 1.2);
}

// ------------------------------------------------------------ motivos

function mCirculo(ctx, x, y, s) {
  circulo(ctx, x, y, s * 0.92); traco(ctx, AZUL, Math.max(1.6, s * 0.12));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.62); ctx.lineTo(x + Math.cos(a) * s * 0.78, y + Math.sin(a) * s * 0.78);
    traco(ctx, VERDE, Math.max(1.2, s * 0.08));
  }
  circulo(ctx, x, y, s * 0.48); traco(ctx, VERMELHO, Math.max(1.4, s * 0.1));
  circulo(ctx, x, y, s * 0.2); ctx.fillStyle = VERDE; ctx.fill();
}

function mBambus(ctx, x, y, s) {
  const caule = (cx, cor, h) => {
    const w = s * 0.3;
    for (let k = 0; k < 3; k++) {
      const sy = y - h / 2 + (k * h) / 3;
      rr(ctx, cx - w / 2, sy + 1, w, h / 3 - 2, w * 0.4);
      const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
      g.addColorStop(0, clarear(cor, 0.25)); g.addColorStop(1, escurecer(cor, 0.2));
      ctx.fillStyle = g; ctx.fill(); traco(ctx, escurecer(cor, 0.45), 1);
      rr(ctx, cx - w * 0.6, sy + h / 3 - 2.5, w * 1.2, 3, 1.5); ctx.fillStyle = escurecer(cor, 0.35); ctx.fill();
    }
  };
  caule(x - s * 0.34, JADE, s * 1.8);
  caule(x + s * 0.34, '#2f7f9a', s * 1.8);
  ctx.fillStyle = VERDE;
  elipse(ctx, x + s * 0.62, y - s * 0.72, s * 0.3, s * 0.1, -0.6); ctx.fill();
  elipse(ctx, x - s * 0.62, y - s * 0.5, s * 0.3, s * 0.1, 0.6); ctx.fill();
}

function petala(ctx, x, y, a, comp, larg) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(larg, -comp * 0.3, larg * 0.6, -comp * 0.9, 0, -comp);
  ctx.bezierCurveTo(-larg * 0.6, -comp * 0.9, -larg, -comp * 0.3, 0, 0);
  ctx.restore();
}

function mAmeixa(ctx, x, y, s) {
  ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = Math.max(1.4, s * 0.1); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.9); ctx.quadraticCurveTo(x - s * 0.3, y + s * 0.4, x - s * 0.1, y + s * 0.1); ctx.stroke();
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU - Math.PI / 2;
    circulo(ctx, x + Math.cos(a) * s * 0.42, y + Math.sin(a) * s * 0.42, s * 0.36);
    ctx.fillStyle = k % 2 ? '#e8607a' : '#ef7d92'; ctx.fill(); traco(ctx, '#9c2a3c', 1.1);
  }
  circulo(ctx, x, y, s * 0.2); ctx.fillStyle = OURO; ctx.fill(); traco(ctx, '#7a5414', 1);
  ctx.fillStyle = '#7a1f2e';
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; circulo(ctx, x + Math.cos(a) * s * 0.3, y + Math.sin(a) * s * 0.3, Math.max(0.8, s * 0.05)); ctx.fill(); }
}

function mLotus(ctx, x, y, s) {
  elipse(ctx, x, y + s * 0.62, s * 0.95, s * 0.22); ctx.fillStyle = VERDE; ctx.fill(); traco(ctx, '#0f3d29', 1);
  const base = y + s * 0.55;
  for (const [a, cor] of [[-1.05, '#f2a3b8'], [1.05, '#f2a3b8'], [-0.55, '#ec8aa3'], [0.55, '#ec8aa3'], [0, '#e2708e']]) {
    petala(ctx, x, base, a, s * 1.25, s * 0.42);
    const g = ctx.createLinearGradient(0, base - s * 1.2, 0, base);
    g.addColorStop(0, '#fff0f4'); g.addColorStop(1, cor);
    ctx.fillStyle = g; ctx.fill(); traco(ctx, '#a33a58', 1);
  }
}

function mCarpa(ctx, x, y, s) {
  ctx.strokeStyle = rgba(AZUL, 0.55); ctx.lineWidth = Math.max(1, s * 0.07);
  for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(x - s * 0.5 + k * s, y + s * 0.95, s * 0.35, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35);
  // cauda
  ctx.beginPath(); ctx.moveTo(s * 0.55, 0); ctx.quadraticCurveTo(s * 1.05, -s * 0.55, s * 1.12, -s * 0.2); ctx.quadraticCurveTo(s * 0.95, 0, s * 1.12, s * 0.25); ctx.quadraticCurveTo(s * 1.0, s * 0.5, s * 0.55, 0);
  ctx.fillStyle = '#f08a4b'; ctx.fill(); traco(ctx, '#8a3a12', 1);
  // corpo
  elipse(ctx, 0, 0, s * 0.72, s * 0.36);
  ctx.fillStyle = '#fffaf0'; ctx.fill();
  ctx.save(); elipse(ctx, 0, 0, s * 0.72, s * 0.36); ctx.clip();
  ctx.fillStyle = '#e8562a'; elipse(ctx, -s * 0.15, -s * 0.18, s * 0.32, s * 0.2); ctx.fill(); elipse(ctx, s * 0.35, s * 0.1, s * 0.22, s * 0.18); ctx.fill();
  ctx.strokeStyle = 'rgba(138,58,18,0.35)'; ctx.lineWidth = 0.9;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-s * 0.1 + k * s * 0.22, 0, s * 0.18, -1, 1); ctx.stroke(); }
  ctx.restore();
  elipse(ctx, 0, 0, s * 0.72, s * 0.36); traco(ctx, '#8a3a12', 1.2);
  ctx.fillStyle = TINTA; circulo(ctx, -s * 0.48, -s * 0.06, Math.max(1, s * 0.07)); ctx.fill();
  ctx.restore();
}

function mLanterna(ctx, x, y, s) {
  ctx.strokeStyle = TINTA; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - s * 1.05); ctx.lineTo(x, y - s * 0.8); ctx.stroke();
  elipse(ctx, x, y, s * 0.62, s * 0.72);
  const g = ctx.createRadialGradient(x - s * 0.15, y - s * 0.15, 1, x, y, s * 0.8);
  g.addColorStop(0, '#ff8a5c'); g.addColorStop(1, '#a5181c');
  ctx.fillStyle = g; ctx.fill(); traco(ctx, '#5a0a0c', 1.2);
  ctx.save(); elipse(ctx, x, y, s * 0.62, s * 0.72); ctx.clip();
  ctx.strokeStyle = 'rgba(90,10,12,0.45)'; ctx.lineWidth = 1;
  for (const k of [-0.6, -0.3, 0, 0.3, 0.6]) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(k) * s * 0.62 + 0.5, s * 0.72, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
  for (const sy of [-1, 1]) { rr(ctx, x - s * 0.32, y + sy * s * 0.72 - s * 0.1, s * 0.64, s * 0.2, 2); ctx.fillStyle = OURO; ctx.fill(); traco(ctx, '#7a5414', 1); }
  ctx.strokeStyle = OURO; ctx.lineWidth = 1.2;
  for (const dx of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(x + dx, y + s * 0.82); ctx.lineTo(x + dx * 1.4, y + s * 1.1); ctx.stroke(); }
}

function mGrou(ctx, x, y, s) {
  // sol vermelho atras
  circulo(ctx, x + s * 0.45, y - s * 0.45, s * 0.42); ctx.fillStyle = rgba(VERMELHO, 0.85); ctx.fill();
  ctx.strokeStyle = TINTA; ctx.lineWidth = 1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.05, y + s * 0.3); ctx.lineTo(x - s * 0.15, y + s * 1.0); ctx.moveTo(x + s * 0.12, y + s * 0.3); ctx.lineTo(x + s * 0.18, y + s * 1.0); ctx.stroke();
  // asa
  ctx.beginPath(); ctx.moveTo(x - s * 0.3, y); ctx.quadraticCurveTo(x - s * 1.0, y - s * 0.9, x - s * 0.95, y - s * 0.2); ctx.quadraticCurveTo(x - s * 0.7, y + s * 0.15, x - s * 0.3, y + s * 0.15); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, TINTA, 1.1);
  ctx.beginPath(); ctx.moveTo(x - s * 0.95, y - s * 0.2); ctx.quadraticCurveTo(x - s * 0.9, y - s * 0.55, x - s * 0.78, y - s * 0.62); ctx.lineTo(x - s * 0.7, y - s * 0.3); ctx.closePath(); ctx.fillStyle = TINTA; ctx.fill();
  // corpo e pescoco
  elipse(ctx, x, y + s * 0.12, s * 0.42, s * 0.24, -0.2); ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, TINTA, 1.1);
  ctx.beginPath(); ctx.moveTo(x + s * 0.3, y); ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.5, x + s * 0.32, y - s * 0.85);
  ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(2.4, s * 0.16); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.2, s * 0.09); ctx.stroke();
  circulo(ctx, x + s * 0.3, y - s * 0.88, s * 0.1); ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, TINTA, 1);
  circulo(ctx, x + s * 0.28, y - s * 0.97, s * 0.06); ctx.fillStyle = VERMELHO; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + s * 0.38, y - s * 0.88); ctx.lineTo(x + s * 0.62, y - s * 0.82); ctx.strokeStyle = '#7a5414'; ctx.lineWidth = 1.4; ctx.stroke();
}

function mNuvem(ctx, x, y, s) {
  const lobos = [[-0.5, 0.1, 0.42], [0.05, -0.2, 0.5], [0.55, 0.12, 0.4], [0, 0.35, 0.38]];
  ctx.beginPath();
  for (const [dx, dy, r0] of lobos) { ctx.moveTo(x + dx * s + r0 * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r0 * s, 0, TAU); }
  ctx.fillStyle = '#d7e6f7'; ctx.fill();
  for (const [dx, dy, r0] of lobos) { circulo(ctx, x + dx * s, y + dy * s, r0 * s); traco(ctx, AZUL, 1.1); }
  ctx.save();
  ctx.beginPath(); for (const [dx, dy, r0] of lobos) { ctx.moveTo(x + dx * s + r0 * s - 1, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r0 * s - 1, 0, TAU); }
  ctx.fillStyle = '#d7e6f7'; ctx.fill();
  ctx.restore();
  ctx.strokeStyle = AZUL; ctx.lineWidth = 1.2;
  for (const [dx, dy, r0] of lobos) {
    ctx.beginPath();
    for (let k = 0; k <= 24; k++) { const u = k / 24, a = u * TAU * 1.25, rr0 = r0 * s * 0.75 * (1 - u * 0.8); ctx[k ? 'lineTo' : 'moveTo'](x + dx * s + Math.cos(a) * rr0, y + dy * s + Math.sin(a) * rr0); }
    ctx.stroke();
  }
}

function mTartaruga(ctx, x, y, s) {
  ctx.fillStyle = '#7fae6a';
  for (const [dx, dy] of [[-0.6, -0.45], [0.6, -0.45], [-0.6, 0.5], [0.6, 0.5]]) { elipse(ctx, x + dx * s, y + dy * s, s * 0.2, s * 0.14, dx * dy); ctx.fill(); traco(ctx, '#2d4a22', 1); }
  circulo(ctx, x, y - s * 0.82, s * 0.2); ctx.fillStyle = '#7fae6a'; ctx.fill(); traco(ctx, '#2d4a22', 1);
  ctx.fillStyle = TINTA; circulo(ctx, x - s * 0.07, y - s * 0.86, 1); ctx.fill(); circulo(ctx, x + s * 0.07, y - s * 0.86, 1); ctx.fill();
  elipse(ctx, x, y, s * 0.68, s * 0.62);
  const g = ctx.createRadialGradient(x - s * 0.2, y - s * 0.2, 1, x, y, s * 0.7);
  g.addColorStop(0, '#5fb48f'); g.addColorStop(1, '#1f6a4f');
  ctx.fillStyle = g; ctx.fill(); traco(ctx, '#0f3326', 1.3);
  const hex = (cx, cy, r0) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + Math.PI / 6; ctx[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); } ctx.closePath(); };
  hex(x, y, s * 0.24); traco(ctx, OURO, 1.2);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.24, y + Math.sin(a) * s * 0.24); ctx.lineTo(x + Math.cos(a) * s * 0.62, y + Math.sin(a) * s * 0.56); traco(ctx, rgba(OURO, 0.8), 1);
  }
}

function mFenix(ctx, x, y, s) {
  const cores = ['#c0392b', '#e67e22', OURO];
  cores.forEach((c, k) => {
    ctx.beginPath(); ctx.moveTo(x - s * 0.1, y + s * 0.15);
    ctx.bezierCurveTo(x + s * 0.2, y + s * (0.6 + k * 0.1), x + s * (0.7 + k * 0.1), y + s * (0.3 + k * 0.25), x + s * (0.95 - k * 0.05), y + s * (0.9 - k * 0.05));
    ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, s * (0.2 - k * 0.04)); ctx.lineCap = 'round'; ctx.stroke();
    circulo(ctx, x + s * (0.95 - k * 0.05), y + s * (0.9 - k * 0.05), s * 0.11); ctx.fillStyle = AZUL; ctx.fill(); traco(ctx, c, 1.2);
  });
  // asa
  ctx.beginPath(); ctx.moveTo(x - s * 0.1, y); ctx.quadraticCurveTo(x - s * 0.2, y - s * 0.95, x + s * 0.5, y - s * 0.75); ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.4, x + s * 0.2, y - s * 0.05); ctx.closePath();
  const g = ctx.createLinearGradient(x, y - s, x, y); g.addColorStop(0, OURO); g.addColorStop(1, '#c0392b');
  ctx.fillStyle = g; ctx.fill(); traco(ctx, '#6a1a10', 1.1);
  elipse(ctx, x - s * 0.15, y + s * 0.1, s * 0.3, s * 0.2, -0.4); ctx.fillStyle = '#d4452e'; ctx.fill(); traco(ctx, '#6a1a10', 1.1);
  circulo(ctx, x - s * 0.5, y - s * 0.12, s * 0.15); ctx.fillStyle = '#d4452e'; ctx.fill(); traco(ctx, '#6a1a10', 1);
  ctx.beginPath(); ctx.moveTo(x - s * 0.62, y - s * 0.12); ctx.lineTo(x - s * 0.8, y - s * 0.05); ctx.lineTo(x - s * 0.62, y - s * 0.02); ctx.fillStyle = OURO; ctx.fill();
  ctx.strokeStyle = OURO; ctx.lineWidth = 1.2;
  for (const a of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 0.25); ctx.lineTo(x - s * 0.5 + Math.sin(a) * s * 0.3, y - s * 0.55); ctx.stroke(); }
}

/** Dragao sinuoso simplificado: corpo em S (fino na cauda), cristas, garras, cabeca com chifres e perola. */
function mDragao(ctx, x, y, s, cor, escuro, t, celeste) {
  const crista = celeste ? '#3fb08c' : '#c0392b';
  const N = 26;
  const ponto = (u) => ({
    x: x + (u - 0.5) * s * 1.65,
    y: y + Math.sin(u * TAU * 1.05 + 0.4 + Math.sin(t * 2) * 0.08) * s * 0.42 + s * 0.12,
    r: s * (0.07 + 0.16 * u),
  });
  ctx.save();
  if (celeste) { ctx.shadowColor = '#bffff0'; ctx.shadowBlur = 8; }
  // cristas no dorso
  for (let k = 3; k < N - 2; k += 3) {
    const u = k / N, p = ponto(u), q = ponto(u + 0.02);
    const ang = Math.atan2(q.y - p.y, q.x - p.x) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(ang - 0.5) * p.r, p.y + Math.sin(ang - 0.5) * p.r);
    ctx.lineTo(p.x + Math.cos(ang) * p.r * 2.1, p.y + Math.sin(ang) * p.r * 2.1);
    ctx.lineTo(p.x + Math.cos(ang + 0.5) * p.r, p.y + Math.sin(ang + 0.5) * p.r);
    ctx.closePath(); ctx.fillStyle = crista; ctx.fill(); traco(ctx, escuro, 0.8);
  }
  // garras
  for (const u of [0.38, 0.72]) {
    const p = ponto(u);
    ctx.strokeStyle = escuro; ctx.lineWidth = Math.max(1.4, s * 0.07); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - s * 0.06, p.y + p.r + s * 0.22); ctx.stroke();
    for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(p.x - s * 0.06, p.y + p.r + s * 0.22); ctx.lineTo(p.x - s * 0.06 + d * s * 0.07, p.y + p.r + s * 0.3); ctx.stroke(); }
  }
  // corpo: contorno e preenchimento por circulos
  for (let k = 0; k <= N; k++) { const p = ponto(k / N); circulo(ctx, p.x, p.y, p.r + 1.8); ctx.fillStyle = escuro; ctx.fill(); }
  ctx.shadowBlur = 0;
  for (let k = 0; k <= N; k++) { const p = ponto(k / N); circulo(ctx, p.x, p.y, p.r); ctx.fillStyle = cor; ctx.fill(); }
  // escamas e barriga
  for (let k = 2; k < N; k += 2) {
    const p = ponto(k / N);
    ctx.beginPath(); ctx.arc(p.x, p.y - p.r * 0.1, p.r * 0.55, 0.2, Math.PI - 0.2); traco(ctx, rgba(escuro, 0.45), 0.9);
    circulo(ctx, p.x, p.y + p.r * 0.45, p.r * 0.32); ctx.fillStyle = celeste ? 'rgba(255,255,255,0.7)' : 'rgba(255,246,200,0.75)'; ctx.fill();
  }
  // cabeca
  const h = ponto(1), R = s * 0.27;
  ctx.fillStyle = crista;
  for (let k = 0; k < 5; k++) { const a = Math.PI * (0.75 + k * 0.14); petala(ctx, h.x - R * 0.2, h.y, a - Math.PI / 2, R * 1.5, R * 0.35); ctx.fill(); }
  elipse(ctx, h.x, h.y - R * 0.1, R, R * 0.82); ctx.fillStyle = cor; ctx.fill(); traco(ctx, escuro, 1.3);
  rr(ctx, h.x + R * 0.4, h.y - R * 0.3, R * 0.95, R * 0.62, R * 0.28); ctx.fillStyle = cor; ctx.fill(); traco(ctx, escuro, 1.2);
  ctx.beginPath(); ctx.moveTo(h.x + R * 0.55, h.y + R * 0.12); ctx.lineTo(h.x + R * 1.3, h.y + R * 0.12); traco(ctx, escuro, 1.1);
  ctx.fillStyle = escuro; circulo(ctx, h.x + R * 1.18, h.y - R * 0.12, Math.max(0.9, R * 0.08)); ctx.fill();
  ctx.strokeStyle = escuro; ctx.lineWidth = Math.max(1.4, s * 0.06); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(h.x - R * 0.1, h.y - R * 0.7); ctx.quadraticCurveTo(h.x - R * 0.4, h.y - R * 1.5, h.x - R * 0.95, h.y - R * 1.45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(h.x + R * 0.25, h.y - R * 0.72); ctx.quadraticCurveTo(h.x + R * 0.1, h.y - R * 1.5, h.x - R * 0.35, h.y - R * 1.7); ctx.stroke();
  const bigode = Math.sin(t * 3) * R * 0.25;
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(h.x + R * 1.25, h.y); ctx.quadraticCurveTo(h.x + R * 1.7, h.y + R * 0.7 + bigode, h.x + R * 1.25, h.y + R * 1.2); ctx.stroke();
  ctx.fillStyle = '#ffffff'; circulo(ctx, h.x + R * 0.1, h.y - R * 0.25, R * 0.24); ctx.fill(); traco(ctx, escuro, 1);
  ctx.fillStyle = escuro; circulo(ctx, h.x + R * 0.16, h.y - R * 0.25, R * 0.12); ctx.fill();
  // perola flamejante
  const px = x - s * 0.62, py = y - s * 0.62;
  ctx.fillStyle = celeste ? 'rgba(127,224,196,0.5)' : 'rgba(255,140,60,0.55)';
  for (let k = 0; k < 6; k++) { petala(ctx, px, py, (k / 6) * TAU + t, s * 0.3, s * 0.1); ctx.fill(); }
  circulo(ctx, px, py, s * 0.16);
  const g = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, s * 0.18);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, celeste ? '#7fe0c4' : '#e85a3a');
  ctx.fillStyle = g; ctx.fill(); traco(ctx, escuro, 1);
  ctx.restore();
}

function motivo(ctx, n, f, t) {
  const { cx: x, cy: y, s } = f;
  switch (MOTIVOS[Math.min(n, MOTIVOS.length - 1)]) {
    case 'circulo': return mCirculo(ctx, x, y, s);
    case 'bambus': return mBambus(ctx, x, y, s);
    case 'ameixa': return mAmeixa(ctx, x, y, s);
    case 'lotus': return mLotus(ctx, x, y, s);
    case 'carpa': return mCarpa(ctx, x, y, s);
    case 'lanterna': return mLanterna(ctx, x, y, s);
    case 'grou': return mGrou(ctx, x, y, s);
    case 'nuvem': return mNuvem(ctx, x, y, s);
    case 'tartaruga': return mTartaruga(ctx, x, y, s);
    case 'fenix': return mFenix(ctx, x, y, s);
    case 'dragao': return mDragao(ctx, x, y, s * 1.12, '#f2b632', '#4a2a00', t, false);
    default: return mDragao(ctx, x, y, s * 1.12, '#effff9', '#0f5a45', t, true);
  }
}

function brilho(ctx, f, t, cor = 'rgba(255,255,255,0.45)') {
  ctx.save();
  rr(ctx, f.x, f.y, f.w, f.h, f.raio); ctx.clip();
  const u = ((t * 0.4) % 1.8) - 0.4;
  const x = f.x + u * f.w * 1.6;
  const g = ctx.createLinearGradient(x - f.w * 0.3, f.y, x + f.w * 0.3, f.y + f.h);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, cor); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(f.x, f.y, f.w, f.h);
  ctx.restore();
}

function pecaNormal(ctx, v, r, op) {
  const n = Math.min(11, nivel(v));
  const t = op.t || 0;
  let face = {};
  if (n === 10) face = { a: '#fffbee', b: '#f4dfa6', borda: '#8a5a00', meio: '#c9a24a' };
  else if (n >= 11) face = { a: '#f0fff9', b: '#a8dcc8', borda: '#1b6b55', meio: '#8fc9b3', verso1: '#e8c35a', verso2: '#8a5a00' };
  else if (n === 9) face = { a: '#fff8ea', b: '#ecd9b6' };
  const f = corpo(ctx, r, op, face);
  if (n >= 10) {
    ctx.save(); ctx.shadowColor = n === 10 ? '#ffd76a' : '#9fffe0'; ctx.shadowBlur = 8 + 4 * Math.sin(t * 3);
    rr(ctx, f.x, f.y, f.w, f.h, f.raio); traco(ctx, n === 10 ? '#ffd76a' : '#bffff0', 1.4);
    ctx.restore();
  }
  numero(ctx, f, String(v), tintaDe(n));
  motivo(ctx, n, f, t);
  if (n >= 9) brilho(ctx, f, t + n, n >= 10 ? 'rgba(255,250,220,0.28)' : 'rgba(255,255,255,0.25)');
  return f;
}

/** Selo de cera vermelho sobre uma faixa de papel (gelo). */
function selo(ctx, f) {
  const y = f.cy;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#f1e2bd'; ctx.fillRect(f.x + 1, y - f.s * 0.42, f.w - 2, f.s * 0.84);
  ctx.restore();
  ctx.fillStyle = 'rgba(122,90,40,0.3)';
  ctx.fillRect(f.x + 1, y - f.s * 0.42, f.w - 2, 1); ctx.fillRect(f.x + 1, y + f.s * 0.42 - 1, f.w - 2, 1);
  const R = f.s * 0.62;
  ctx.beginPath();
  for (let k = 0; k <= 18; k++) {
    const a = (k / 18) * TAU, rr0 = R * (1 + (k % 2 ? 0.08 : -0.04) + Math.sin(k * 2.3) * 0.05);
    ctx[k ? 'lineTo' : 'moveTo'](f.cx + Math.cos(a) * rr0, y + Math.sin(a) * rr0);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(f.cx - R * 0.3, y - R * 0.3, 1, f.cx, y, R * 1.1);
  g.addColorStop(0, '#d94a3d'); g.addColorStop(1, '#7a1212');
  ctx.fillStyle = g; ctx.fill(); traco(ctx, '#4a0808', 1);
  circulo(ctx, f.cx, y, R * 0.66); traco(ctx, 'rgba(60,4,4,0.55)', 1.2);
  ctx.fillStyle = 'rgba(60,4,4,0.5)';
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - Math.PI / 2; circulo(ctx, f.cx + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3, R * 0.17); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,200,190,0.45)'; elipse(ctx, f.cx - R * 0.35, y - R * 0.4, R * 0.25, R * 0.12, -0.6); ctx.fill();
}

function pecaPedra(ctx, r, hp) {
  const rnd = semente(23);
  const pts = [];
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * TAU - Math.PI / 2;
    pts.push([Math.cos(a) * r.w * (0.44 + rnd() * 0.08), r.y + r.h / 2 + Math.sin(a) * r.h * (0.42 + rnd() * 0.07)]);
  }
  const forma = () => { ctx.beginPath(); pts.forEach(([px, py], k) => ctx[k ? 'lineTo' : 'moveTo'](px, py)); ctx.closePath(); };
  ctx.save();
  ctx.shadowColor = 'rgba(10,4,2,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  forma();
  const g = ctx.createLinearGradient(-r.w / 2, r.y, r.w / 2, r.y + r.h);
  g.addColorStop(0, '#7cc7a6'); g.addColorStop(0.5, '#2e8b6e'); g.addColorStop(1, '#14473a');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.save(); forma(); ctx.clip();
  ctx.strokeStyle = 'rgba(220,255,240,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r.w * 0.4, r.y + r.h * 0.6); ctx.bezierCurveTo(-r.w * 0.1, r.y + r.h * 0.5, r.w * 0.1, r.y + r.h * 0.75, r.w * 0.45, r.y + r.h * 0.62); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; elipse(ctx, -r.w * 0.15, r.y + r.h * 0.38, r.w * 0.16, r.h * 0.08, -0.5); ctx.fill();
  ctx.fillStyle = 'rgba(10,40,30,0.35)'; elipse(ctx, r.w * 0.2, r.y + r.h * 0.95, r.w * 0.5, r.h * 0.2); ctx.fill();
  ctx.restore();
  forma(); traco(ctx, '#0b2b22', 1.6);
  const perdido = 3 - clamp(hp, 0, 3);
  const rach = [[-0.2, 0.4, 0.02, 0.58, -0.12, 0.82], [0.22, 0.36, 0.08, 0.6, 0.26, 0.8], [-0.05, 0.32, 0.06, 0.48, -0.08, 0.66]];
  ctx.strokeStyle = '#06201a'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) { const c = rach[k]; ctx.beginPath(); ctx.moveTo(c[0] * r.w, r.y + c[1] * r.h); ctx.lineTo(c[2] * r.w, r.y + c[3] * r.h); ctx.lineTo(c[4] * r.w, r.y + c[5] * r.h); ctx.stroke(); }
  const py = r.y + r.h * 0.15;
  for (let k = 0; k < 3; k++) { circulo(ctx, (k - 1) * r.w * 0.2, py, Math.max(2.6, r.w * 0.06)); ctx.fillStyle = k < hp ? OURO : 'rgba(0,0,0,0.4)'; ctx.fill(); traco(ctx, '#3a2a08', 1); }
}

function pecaCoringa(ctx, r, op) {
  const t = op.t || 0;
  const f = corpo(ctx, r, op, { a: '#fffdf5', b: '#f1e6cc' });
  numero(ctx, f, '?', '#b07a10');
  const n = 12;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + t * 0.6;
    petala(ctx, f.cx, f.cy, a, f.s * 1.05, f.s * 0.3);
    ctx.fillStyle = `hsl(${(k * 30 + t * 60) % 360}, 75%, 66%)`; ctx.fill(); traco(ctx, 'rgba(60,30,10,0.45)', 0.8);
  }
  circulo(ctx, f.cx, f.cy, f.s * 0.26); ctx.fillStyle = OURO; ctx.fill(); traco(ctx, '#7a5414', 1);
  brilho(ctx, f, t, 'rgba(255,255,255,0.6)');
}

function pecaBomba(ctx, r, op) {
  const t = op.t || 0;
  const f = corpo(ctx, r, op);
  numero(ctx, f, '!', VERMELHO);
  const { cx, cy, s } = f;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.35);
  rr(ctx, -s * 0.3, -s * 0.8, s * 0.6, s * 1.6, s * 0.12);
  const g = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0); g.addColorStop(0, '#e8483a'); g.addColorStop(1, '#8f1212');
  ctx.fillStyle = g; ctx.fill(); traco(ctx, '#4a0606', 1.2);
  for (const by of [-0.55, 0, 0.55]) { ctx.fillStyle = OURO; ctx.fillRect(-s * 0.3, by * s - 1.5, s * 0.6, 3); }
  ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.quadraticCurveTo(s * 0.3, -s * 1.1, s * 0.15, -s * 1.3); ctx.stroke();
  const k = 0.6 + 0.4 * Math.abs(Math.sin(t * 17));
  estrela(ctx, s * 0.15, -s * 1.32, s * 0.32 * k, s * 0.12, 7); ctx.fillStyle = '#ffd23f'; ctx.fill();
  estrela(ctx, s * 0.15, -s * 1.32, s * 0.15 * k, s * 0.06, 7); ctx.fillStyle = '#fff6c8'; ctx.fill();
  ctx.restore();
}

function pecaDobro(ctx, r, op) {
  const t = op.t || 0;
  const f = corpo(ctx, r, op);
  numero(ctx, f, 'x2', AZUL);
  const { cx, cy, s } = f;
  ctx.strokeStyle = AZUL; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const yy = cy - s * 0.55 + k * s * 0.55, dx = Math.sin(t * 2 + k) * s * 0.08;
    ctx.lineWidth = Math.max(1.6, s * 0.12);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.95 + dx, yy);
    ctx.bezierCurveTo(cx - s * 0.3 + dx, yy - s * 0.25, cx + s * 0.2 + dx, yy + s * 0.25, cx + s * 0.6 + dx, yy);
    ctx.arc(cx + s * 0.6 + dx, yy - s * 0.18, s * 0.18, Math.PI / 2, -Math.PI * 0.9, true);
    ctx.stroke();
  }
}

// ------------------------------------------------------------ cenario

/** Pontos fixos do cenario (cha, lanternas), iguais no fundo e no vivo. */
function lugares(W, H, L) {
  const fundoFila = L.fila.vertical ? L.mesa.y + L.mesa.h : L.fila.y + L.fila.h;
  const sobra = H - fundoFila;
  return {
    mesaTopo: Math.max(L.topo + 40, L.mesa.y - 34),
    xicara: sobra > 110 ? { x: W * 0.2, y: H - Math.min(70, sobra * 0.42) } : L.fila.vertical ? { x: Math.max(60, L.mesa.x * 0.45), y: H - 70 } : null,
    lanternas: [{ x: W * 0.1, y: L.topo + 4 }, { x: W * 0.9, y: L.topo + 4 }],
  };
}

function xicaraEstatica(ctx, x, y) {
  elipse(ctx, x + 2, y + 16, 34, 9); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  // bule
  ctx.save(); ctx.translate(x + 62, y - 4);
  elipse(ctx, 0, 6, 26, 21); ctx.fillStyle = '#2f6b57'; ctx.fill(); traco(ctx, '#0f2e24', 1.5);
  ctx.beginPath(); ctx.moveTo(22, 2); ctx.quadraticCurveTo(40, -6, 38, -16); ctx.strokeStyle = '#2f6b57'; ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.arc(-24, 6, 10, Math.PI * 0.5, Math.PI * 1.5); ctx.strokeStyle = '#0f2e24'; ctx.lineWidth = 3; ctx.stroke();
  elipse(ctx, 0, -14, 12, 4); ctx.fillStyle = '#245746'; ctx.fill(); circulo(ctx, 0, -19, 3.5); ctx.fillStyle = OURO; ctx.fill();
  ctx.strokeStyle = rgba(OURO, 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 6, 20, 15, 0, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
  // xicara
  ctx.beginPath(); ctx.moveTo(x - 16, y - 6); ctx.lineTo(x - 12, y + 12); ctx.quadraticCurveTo(x, y + 17, x + 12, y + 12); ctx.lineTo(x + 16, y - 6); ctx.closePath();
  ctx.fillStyle = MARFIM; ctx.fill(); traco(ctx, '#7a6646', 1.4);
  elipse(ctx, x, y - 6, 16, 4.5); ctx.fillStyle = '#c9b27a'; ctx.fill(); traco(ctx, '#7a6646', 1.2);
  elipse(ctx, x, y - 5.5, 12, 3); ctx.fillStyle = '#8fae5a'; ctx.fill();
  ctx.strokeStyle = AZUL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 13, y + 2); ctx.lineTo(x + 13, y + 2); ctx.stroke();
}

function lanterna(ctx, x, y, t, k) {
  const ang = Math.sin(t * 1.2 + k * 1.7) * 0.06;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 26); ctx.stroke();
  const g = ctx.createRadialGradient(0, 56, 4, 0, 56, 70);
  g.addColorStop(0, `rgba(255,190,110,${0.33 + 0.05 * Math.sin(t * 5 + k)})`); g.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = g; ctx.fillRect(-72, -14, 144, 142);
  elipse(ctx, 0, 56, 22, 30);
  const gl = ctx.createRadialGradient(-6, 48, 2, 0, 56, 30);
  gl.addColorStop(0, '#ffd08a'); gl.addColorStop(0.6, '#e2492f'); gl.addColorStop(1, '#8f1d1d');
  ctx.fillStyle = gl; ctx.fill(); traco(ctx, '#4a0a0a', 1.4);
  ctx.save(); elipse(ctx, 0, 56, 22, 30); ctx.clip();
  ctx.strokeStyle = 'rgba(80,10,10,0.4)'; ctx.lineWidth = 1;
  for (const kk of [0.35, 0.7]) { ctx.beginPath(); ctx.ellipse(0, 56, 22 * kk, 30, 0, 0, TAU); ctx.stroke(); }
  for (let yy = 34; yy < 82; yy += 8) { ctx.beginPath(); ctx.moveTo(-24, yy); ctx.lineTo(24, yy); ctx.stroke(); }
  ctx.restore();
  for (const yy of [26, 82]) { rr(ctx, -12, yy - 3, 24, 6, 2); ctx.fillStyle = MADEIRA; ctx.fill(); ctx.strokeStyle = OURO; ctx.lineWidth = 1; ctx.stroke(); }
  ctx.strokeStyle = OURO; ctx.lineWidth = 1.4;
  for (const dx of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(dx, 85); ctx.lineTo(dx * 1.3, 100 + Math.sin(t * 2 + dx) * 1.5); ctx.stroke(); }
  ctx.restore();
}

const tema = {
  id: 'mahjong',
  nome: 'Mahjong de Jade',
  cores: { texto: MARFIM, destaque: '#f3d27a', particulas: [JADE, OURO, MARFIM, '#ef7d92'] },
  faixas: () => ({ topo: 96, base: 0 }),

  fundo(ctx, W, H, L) {
    const lg = lugares(W, H, L);
    const yM = lg.mesaTopo;
    // parede: biombo de papel com bambu atras
    const gp = ctx.createLinearGradient(0, 0, 0, yM);
    gp.addColorStop(0, '#efe0bf'); gp.addColorStop(1, '#e4cfa2');
    ctx.fillStyle = gp; ctx.fillRect(0, 0, W, yM);
    const rnd = semente(31);
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 9; i++) {
      const x = rnd() * W, w = 5 + rnd() * 6;
      ctx.fillStyle = '#3c5a3a'; ctx.fillRect(x, 0, w, yM);
      for (let y = 20 + rnd() * 40; y < yM; y += 46 + rnd() * 20) ctx.fillRect(x - 1.5, y, w + 3, 3);
      for (let k = 0; k < 3; k++) { const ly = rnd() * yM; elipse(ctx, x + (rnd() < 0.5 ? -14 : 18), ly, 18, 4, rnd() < 0.5 ? -0.4 : 0.4); ctx.fill(); }
    }
    ctx.restore();
    const gl = ctx.createRadialGradient(W / 2, yM * 0.5, 10, W / 2, yM * 0.5, W * 0.8);
    gl.addColorStop(0, 'rgba(255,214,150,0.35)'); gl.addColorStop(1, 'rgba(90,50,20,0.25)');
    ctx.fillStyle = gl; ctx.fillRect(0, 0, W, yM);
    // treliça do biombo
    ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 3;
    const passoX = W / Math.max(4, Math.round(W / 90));
    for (let x = 0; x <= W + 1; x += passoX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, yM); ctx.stroke(); }
    ctx.lineWidth = 1.6;
    for (let x = passoX / 2; x < W; x += passoX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, yM); ctx.stroke(); }
    for (let y = 60; y < yM; y += 56) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // mesa laqueada (do biombo ate o chao)
    const gm = ctx.createLinearGradient(0, yM, 0, H);
    gm.addColorStop(0, '#4a2c1c'); gm.addColorStop(1, '#22130b');
    ctx.fillStyle = gm; ctx.fillRect(0, yM, W, H - yM);
    ctx.strokeStyle = 'rgba(255,220,180,0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i < 26; i++) { const y = yM + 10 + rnd() * (H - yM); ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y + rnd() * 8 - 4, W * 0.7, y + rnd() * 8 - 4, W, y); ctx.stroke(); }
    // borda da mesa com jade incrustado
    ctx.fillStyle = '#2a170d'; ctx.fillRect(0, yM - 6, W, 10);
    ctx.fillStyle = JADE; ctx.fillRect(0, yM + 6, W, 3);
    ctx.fillStyle = rgba(OURO, 0.8); ctx.fillRect(0, yM + 10, W, 1);
    ctx.fillStyle = 'rgba(255,230,190,0.18)'; ctx.fillRect(0, yM - 6, W, 2);
    if (lg.xicara) xicaraEstatica(ctx, lg.xicara.x, lg.xicara.y);
    // vinheta quente
    const gv = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(25,10,4,0.45)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
  },

  vivo(ctx, W, H, t, e, mem) {
    const L = mem.L;
    if (!L) return;
    const lg = lugares(W, H, L);
    lg.lanternas.forEach((p, k) => lanterna(ctx, p.x, p.y, t, k));
    // vapor do cha
    if (lg.xicara) {
      ctx.save(); ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const u = ((t * 0.5 + k / 3) % 1);
        ctx.strokeStyle = `rgba(255,248,235,${0.35 * (1 - u)})`; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let j = 0; j <= 10; j++) { const yy = lg.xicara.y - 10 - j * 3 - u * 18; const xx = lg.xicara.x - 4 + k * 4 + Math.sin(j * 0.7 + t * 2 + k) * 4; ctx[j ? 'lineTo' : 'moveTo'](xx, yy); }
        ctx.stroke();
      }
      ctx.restore();
    }
    // petalas de cerejeira caindo (deterministico)
    for (let i = 0; i < 14; i++) {
      const vel = 18 + (i % 5) * 7;
      const y = ((i * 97 + t * vel) % (H + 40)) - 20;
      const x = ((i * 151.3) % W) + Math.sin(t * 0.9 + i) * 22 + Math.sin(y / 60) * 10;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * (0.8 + (i % 3) * 0.4) + i);
      elipse(ctx, 0, 0, 4.2, 2.4); ctx.fillStyle = i % 3 ? 'rgba(244,170,190,0.85)' : 'rgba(255,214,224,0.85)'; ctx.fill();
      ctx.restore();
    }
  },

  mesa(ctx, L, e, t, mem) {
    mem.L = L; mem.W = L.W;
    const s = L.mesa;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    rr(ctx, s.x, s.y, s.w, s.h, 14);
    const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
    g.addColorStop(0, '#5a1414'); g.addColorStop(1, '#3a0c0c');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 10);
    const gf = ctx.createLinearGradient(0, s.y, 0, s.y + s.h);
    gf.addColorStop(0, '#24604c'); gf.addColorStop(1, '#174636');
    ctx.fillStyle = gf; ctx.fill();
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 10); traco(ctx, OURO, 1.6);
    rr(ctx, s.x, s.y, s.w, s.h, 14); traco(ctx, '#1e0606', 2);
    // cantos de nuvem dourada
    for (const [cx, cy, a] of [[s.x + 8, s.y + 8, 0], [s.x + s.w - 8, s.y + 8, Math.PI / 2], [s.x + s.w - 8, s.y + s.h - 8, Math.PI], [s.x + 8, s.y + s.h - 8, -Math.PI / 2]]) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      ctx.strokeStyle = OURO; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, 0); ctx.lineTo(14, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(6, 6, 3.5, Math.PI, Math.PI * 2.6); ctx.stroke();
      ctx.restore();
    }
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const r = L.carta(c, 0);
      rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 8);
      ctx.setLineDash([5, 4]); traco(ctx, 'rgba(246,239,220,0.4)', 1.5); ctx.setLineDash([]);
      circulo(ctx, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.2); traco(ctx, 'rgba(246,239,220,0.25)', 1.5);
      circulo(ctx, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.08); ctx.fillStyle = 'rgba(246,239,220,0.2)'; ctx.fill();
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') pecaPedra(ctx, r, carta.hp);
    else if (carta.tipo === 'coringa') pecaCoringa(ctx, r, op);
    else if (carta.tipo === 'bomba') pecaBomba(ctx, r, op);
    else if (carta.tipo === 'dobro') pecaDobro(ctx, r, op);
    else {
      const f = pecaNormal(ctx, carta.v, r, op);
      if (carta.gelo) selo(ctx, f);
    }
    if (op.fila && !op.frente) { rr(ctx, r.x, r.y, r.w, r.h, Math.max(4, r.w * 0.13)); ctx.fillStyle = 'rgba(20,10,4,0.3)'; ctx.fill(); }
  },

  cadeado(ctx, a) {
    ctx.save();
    rr(ctx, a.x - 4, a.y - 4, a.w + 8, a.h + 8, 10);
    ctx.fillStyle = 'rgba(110,14,14,0.62)'; ctx.fill();
    ctx.save(); rr(ctx, a.x - 4, a.y - 4, a.w + 8, a.h + 8, 10); ctx.clip();
    ctx.strokeStyle = rgba(OURO, 0.55); ctx.lineWidth = 1.2;
    for (let k = -a.h; k < a.w + a.h; k += 14) {
      ctx.beginPath(); ctx.moveTo(a.x + k, a.y - 4); ctx.lineTo(a.x + k - a.h, a.y + a.h + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a.x + k - a.h, a.y - 4); ctx.lineTo(a.x + k, a.y + a.h + 4); ctx.stroke();
    }
    ctx.restore();
    rr(ctx, a.x - 4, a.y - 4, a.w + 8, a.h + 8, 10); traco(ctx, OURO, 2.4);
    rr(ctx, a.x, a.y, a.w, a.h, 8); traco(ctx, rgba(OURO, 0.6), 1);
    // fecho dourado
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
    rr(ctx, cx - 16, cy - 14, 32, 30, 6);
    const g = ctx.createLinearGradient(0, cy - 14, 0, cy + 16); g.addColorStop(0, '#f3d27a'); g.addColorStop(1, '#a8761c');
    ctx.fillStyle = g; ctx.fill(); traco(ctx, '#4a2e06', 1.6);
    circulo(ctx, cx, cy, 6); ctx.fillStyle = '#5a1414'; ctx.fill(); traco(ctx, '#4a2e06', 1.2);
    ctx.fillStyle = '#2a0808'; circulo(ctx, cx, cy - 1, 2); ctx.fill(); ctx.fillRect(cx - 1, cy, 2, 4.5);
    ctx.restore();
  },

  descarte(ctx, r, e, t) {
    const carga = e.descarteCarga > 0;
    const x = r.x - 4, y = r.y - 4, w = r.w + 8, h = r.h + 8;
    ctx.save();
    ctx.globalAlpha = carga ? 1 : 0.6;
    rr(ctx, x, y, w, h, 9);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#6a4228'); g.addColorStop(1, '#3a2418');
    ctx.fillStyle = g; ctx.fill(); traco(ctx, '#1a0c06', 1.6);
    rr(ctx, x + 5, y + 5, w - 10, h - 10, 6); ctx.fillStyle = '#2a5a48'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    const rnd = semente(9);
    for (let i = 0; i < 30; i++) { circulo(ctx, x + 6 + rnd() * (w - 12), y + 6 + rnd() * (h - 12), 1); ctx.fill(); }
    rr(ctx, x + 5, y + 5, w - 10, h - 10, 6); traco(ctx, rgba(OURO, 0.7), 1);
    ctx.restore();
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.55;
    if (carga && !e.descarte) {
      ctx.save(); ctx.strokeStyle = `rgba(243,210,122,${0.6 + 0.3 * Math.sin(t * 3)})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, r.w * 0.2, -Math.PI * 0.2, Math.PI * 1.3); ctx.stroke();
      const a = Math.PI * 1.3, ax = cx + Math.cos(a) * r.w * 0.2, ay = cy + Math.sin(a) * r.w * 0.2;
      ctx.beginPath(); ctx.moveTo(ax - 5, ay - 1); ctx.lineTo(ax, ay); ctx.lineTo(ax + 1, ay - 6); ctx.stroke();
      ctx.restore();
    }
    texto(ctx, carga ? 'descarte' : 'vazio', cx, y + h + 9, 10.5, carga ? MARFIM : '#bfae90', { contorno: '#1a0c06', espessura: 3 });
  },

  fila(ctx, L) {
    // suporte de pecas inclinado (a regua do mahjong)
    const f = L.fila;
    let x, y, w, h;
    if (f.vertical) { x = f.x - 4; y = f.y - 8; w = f.w + 8; h = f.h + 16; }
    else {
      const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
      x = Math.min(p0.x, p2.x) - 18; w = Math.max(p0.x + p0.w, p2.x + p2.w) + 18 - x;
      y = p0.y - 10; h = p0.h + 20;
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
    // encosto inclinado
    ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + w - 8, y); ctx.lineTo(x + w, y + h - 12); ctx.lineTo(x, y + h - 12); ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#7a4a2a'); g.addColorStop(1, '#4a2c18');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,220,180,0.08)'; ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + 6, y + (k * (h - 12)) / 5); ctx.lineTo(x + w - 6, y + (k * (h - 12)) / 5); ctx.stroke(); }
    // calha da frente
    rr(ctx, x - 4, y + h - 14, w + 8, 14, 5);
    const gc = ctx.createLinearGradient(0, y + h - 14, 0, y + h); gc.addColorStop(0, '#8a5a34'); gc.addColorStop(1, '#3a2418');
    ctx.fillStyle = gc; ctx.fill(); traco(ctx, '#1a0c06', 1.4);
    ctx.fillStyle = JADE; ctx.fillRect(x + 4, y + h - 9, w - 8, 2.5);
    const p0 = L.filaPos(0);
    if (!f.vertical) texto(ctx, 'próxima ▸', p0.x + p0.w / 2, y - 9, 12, MARFIM, { contorno: '#1a0c06', espessura: 3 });
    else texto(ctx, 'próximas', x + w / 2, y - 10, 12, MARFIM, { contorno: '#1a0c06', espessura: 3 });
  },

  hud(ctx, W, H, L, e, t, mem) {
    mem.W = W;
    const x = 10, y = 10, w = W - 20, h = 76;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rr(ctx, x, y, w, h, 12);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#a3241e'); g.addColorStop(1, '#6a1212');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, h, 12); traco(ctx, OURO, 2.5);
    rr(ctx, x + 4, y + 4, w - 8, h - 8, 9); traco(ctx, rgba(OURO, 0.45), 1);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; rr(ctx, x + 6, y + 5, w - 12, h * 0.3, 8); ctx.fill();
    // medalhao de jade
    const mx = x + 36, my = y + h / 2;
    circulo(ctx, mx, my, 26);
    const gj = ctx.createRadialGradient(mx - 8, my - 8, 2, mx, my, 28); gj.addColorStop(0, '#7cc7a6'); gj.addColorStop(1, '#1f6a4f');
    ctx.fillStyle = gj; ctx.fill(); traco(ctx, OURO, 2);
    texto(ctx, 'salão', mx, my - 10, 10, '#e8fff4');
    texto(ctx, String(e.faseId), mx, my + 7, 20, MARFIM, { contorno: '#0f3326', espessura: 3 });
    // metas
    const tx = x + 72, tw = w - 72 - 96;
    e.metas.forEach((m, k) => {
      const yy = y + 14 + k * 30;
      texto(ctx, textoMeta(m, { monte: (n) => `Desperte ${n} dragão${n > 1 ? 'ões' : ''}` }), tx, yy + 5, 12, MARFIM, { alinhar: 'left', max: tw });
      rr(ctx, tx, yy + 13, tw, 8, 4); ctx.fillStyle = 'rgba(30,4,4,0.6)'; ctx.fill();
      rr(ctx, tx, yy + 13, Math.max(8, tw * Math.min(1, m.atual / m.alvo)), 8, 4); ctx.fillStyle = m.feita ? '#5fd3a8' : OURO; ctx.fill();
    });
    // pontos com flor de ameixa dourada
    const px = x + w - 48;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - Math.PI / 2; circulo(ctx, px + Math.cos(a) * 6, y + 24 + Math.sin(a) * 6, 5); ctx.fillStyle = '#f3d27a'; ctx.fill(); }
    circulo(ctx, px, y + 24, 3.5); ctx.fillStyle = '#a3241e'; ctx.fill();
    texto(ctx, String(e.pontos), px, y + 52, 18, MARFIM, { max: 86, contorno: '#3a0808', espessura: 3 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      texto(ctx, 'VENTO x2', W / 2, y + h + 18, 21 + k * 2, '#7cf0c4', { contorno: '#0f3326', espessura: 4 + k * 2 });
    }
  },

  efeito(fx, P, mem) {
    if (!P.formas.petalaMj) {
      P.formas.petalaMj = (ctx, p) => { elipse(ctx, 0, 0, p.tam * 0.5, p.tam * 0.28); ctx.fill(); };
      P.formas.lascaMj = (ctx, p) => {
        const s = p.tam / 2;
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(s * 0.3, -s); ctx.lineTo(s, s * 0.2); ctx.lineTo(-s * 0.2, s); ctx.closePath();
        ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
      };
      P.formas.faiscaMj = (ctx, p) => { ctx.strokeStyle = p.cor; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-p.tam / 2, 0); ctx.lineTo(p.tam / 2, 0); ctx.stroke(); };
    }
    const tx = clamp(fx.x, 90, (mem.W || 390) - 90);
    switch (fx.tipo) {
      case 'pouso':
        P.anel(fx.x, fx.y, '#fffbf0', 22, 0.28);
        P.estourar(fx.x, fx.y + 18, ['#e9dcc0', '#c9b892'], 5, 0.3, { g: 200, vida: 0.35, tam: 4, forma: 'c' });
        return true;
      case 'fusao':
        P.anel(fx.x, fx.y, '#7cf0c4', 26 + fx.degrau * 7, 0.5);
        P.estourar(fx.x, fx.y, ['#f4aabe', '#ffd6e0', '#ef7d92'], 8 + fx.degrau * 3, 0.6 + fx.degrau * 0.12, { forma: 'petalaMj', tam: 10, g: 120, vida: 0.9 });
        P.estourar(fx.x, fx.y, [JADE, '#7cc7a6', OURO], 6 + fx.degrau * 2, 0.8, { forma: 'estrela', tam: 7, g: 260 });
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, 'x' + fx.degrau, '#f3d27a', 22 + fx.degrau * 2, '#3a0808');
        return true;
      case 'completar':
        P.anel(fx.x, fx.y, '#ffd76a', 70, 0.6);
        P.estourar(fx.x, fx.y, ['#ffd76a', '#fff6c8', OURO], 36, 1.6, { forma: 'estrela', tam: 11, g: 200, vida: 1.0 });
        P.estourar(fx.x, fx.y, ['#f4aabe', '#ffd6e0'], 16, 1.1, { forma: 'petalaMj', tam: 12, g: 90, vida: 1.3 });
        P.texto(tx, fx.y - 40, 'Dragão!', '#ffd76a', 32, '#5a1414');
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#ff4a3a', '#ffd23f', '#fff6c8'], 26, 1.4, { forma: 'faiscaMj', tam: 10, g: 220 });
        P.subir(fx.x, fx.y, ['rgba(200,190,180,0.7)', 'rgba(150,140,130,0.6)'], 6, { tam: 14, vida: 0.8, larg: 30 });
        P.texto(tx, fx.y - 26, 'Pá!', '#ffd23f', 22, '#5a1414');
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#7cc7a6', JADE, '#14473a'], 18, 1.1, { forma: 'lascaMj', tam: 9 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#7cc7a6', JADE], 7, 0.6, { forma: 'lascaMj', tam: 6 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#c0392b', '#7a1212', '#f1e2bd'], 14, 0.8, { forma: 'lascaMj', tam: 7, g: 380 });
        P.texto(tx, fx.y - 20, 'Selo rompido!', MARFIM, 16, '#5a1414');
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#f3d27a', OURO, '#a3241e'], 16, 0.9, { forma: 'estrela', tam: 8 });
        P.texto(tx, fx.y - 20, 'Aberto!', '#f3d27a', 20, '#3a0808');
        return true;
      case 'combo':
        P.texto(tx, fx.y - 44, `Combo x${fx.n}!`, '#7cf0c4', 22 + Math.min(8, fx.n * 2), '#0f3326');
        return true;
      default: return false;
    }
  },
};

export default tema;
