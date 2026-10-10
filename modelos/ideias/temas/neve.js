// Ideia 7: Bonecos de Neve. Cada coluna e um boneco em construcao: bolas
// iguais viram uma bola maior e a menor sempre vai em cima da maior. Quanto
// maior o valor, mais acessorios. O 2048 e o boneco completo, que sai de treno.
// Pecas em torre (de baixo para cima), largura cresce com o valor.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const NOITE = '#1e2a5a';
const NEVE = '#f4f8ff';
const SOMBRA = '#c9d8f0';
const VERMELHO = '#d93a3a';
const PINHO = '#2e7d4f';
const LUZ = '#ffcf6b';
const CARVAO = '#26262e';
const CONTORNO = '#4d5f8c';

// cor da etiqueta por valor (2..4096): as bolas sao brancas, a cor diz o valor
const ETIQUETA = ['#6fa8ff', '#33b894', '#ff7f9f', '#ff8a3d', '#d93a3a', '#9b5de5', '#2e7d4f', '#3b5bdb', '#0096a8', '#c2185b', '#d99a00', '#5a2ee0'];

const largura = (r, v) => r.w * (0.76 + 0.3 * Math.min(1, nivel(v) / 10));

// flocos que caem (posicoes fixas, movimento so pelo tempo)
const FLOCOS = (() => {
  const rnd = semente(77);
  return Array.from({ length: 52 }, () => ({ x: rnd(), y: rnd(), v: 16 + rnd() * 34, r: 0.8 + rnd() * 2.2, f: rnd() * TAU }));
})();

// luzes do varal e chamines, guardadas pelo fundo para o vivo piscar
const CENA = { luzes: [], chamines: [] };

// ------------------------------------------------------------ bola de neve

function cenoura(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.22); ctx.lineTo(x + s * 1.2, y + s * 0.05); ctx.lineTo(x, y + s * 0.22); ctx.closePath();
  ctx.fillStyle = '#ff8a2a'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#a24e12'; ctx.stroke();
}

function cartola(ctx, x, y, rx, ry, cor = CARVAO, faixa = VERMELHO) {
  const aba = rx * 0.95, copa = rx * 0.62, alt = ry * 0.95;
  rr(ctx, x - copa / 2, y - alt, copa, alt, 3); ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#0e0e14'; ctx.stroke();
  ctx.fillStyle = faixa; ctx.fillRect(x - copa / 2, y - alt * 0.32, copa, alt * 0.18);
  elipse(ctx, x, y, aba / 2 + 4, ry * 0.14); ctx.fillStyle = cor; ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - copa / 2 + 3, y - alt + 3, 3, alt * 0.5);
}

function gorro(ctx, x, y, rx, ry, t) {
  ctx.beginPath(); ctx.ellipse(x, y + ry * 0.05, rx * 0.86, ry * 0.62, 0, Math.PI, 0); ctx.closePath();
  ctx.fillStyle = VERMELHO; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#7a1414'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * rx * 0.25, y); ctx.lineTo(x + k * rx * 0.12, y - ry * 0.5); ctx.stroke(); }
  rr(ctx, x - rx * 0.9, y - ry * 0.08, rx * 1.8, ry * 0.24, ry * 0.12); ctx.fillStyle = NEVE; ctx.fill(); ctx.strokeStyle = SOMBRA; ctx.stroke();
  circulo(ctx, x + Math.sin(t * 2) * 1.5, y - ry * 0.66, ry * 0.2); ctx.fillStyle = NEVE; ctx.fill(); ctx.strokeStyle = SOMBRA; ctx.stroke();
}

function bracos(ctx, cy, rx, ry) {
  ctx.strokeStyle = '#6b4325'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const x0 = s * rx * 0.86, x1 = s * (rx + 8), y1 = cy - ry * 0.35;
    ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, (cy + y1) / 2); ctx.lineTo((x0 + x1) / 2 + s * 3, (cy + y1) / 2 - 6); ctx.stroke();
    circulo(ctx, x1, y1, 4); ctx.fillStyle = VERMELHO; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#7a1414'; ctx.stroke();
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#6b4325';
  }
}

function cachecol(ctx, cy, rx, ry, cor = VERMELHO) {
  const y = cy + ry * 0.28, h = ry * 0.24;
  ctx.save(); elipse(ctx, 0, cy, rx, ry); ctx.clip();
  ctx.fillStyle = cor; ctx.fillRect(-rx, y - h / 2, rx * 2, h);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let x = -rx; x < rx; x += 8) ctx.fillRect(x, y - h / 2, 3, h);
  ctx.restore();
  // ponta pendurada
  rr(ctx, rx * 0.35, y, rx * 0.26, ry * 0.62, 3); ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = escurecer(cor, 0.45); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(rx * 0.35, y + ry * 0.2, rx * 0.26, 2.5);
}

/** Bola de neve com carinha de carvao, acessorio do valor e etiqueta colorida. */
function bola(ctx, v, r, op) {
  const n = Math.min(nivel(v), ETIQUETA.length - 1);
  const pw = largura(r, v);
  const rx = pw / 2, ry = r.h / 2 + 0.5;
  const cy = r.y + r.h / 2;
  const t = op.t || 0;
  if (n === 7 || n === 10) bracos(ctx, cy, rx, ry);
  // bola
  const g = ctx.createRadialGradient(-rx * 0.35, cy - ry * 0.45, rx * 0.1, 0, cy, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.62, '#eef4ff'); g.addColorStop(1, SOMBRA);
  elipse(ctx, 0, cy, rx, ry); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  // textura de neve
  const rnd = semente(5 + n);
  ctx.fillStyle = 'rgba(160,185,225,0.35)';
  for (let k = 0; k < 6; k++) { circulo(ctx, (rnd() - 0.5) * rx * 1.4, cy + (rnd() - 0.2) * ry * 0.9, 1 + rnd() * 1.2); ctx.fill(); }
  if (n === 4 || n === 10) cachecol(ctx, cy, rx, ry);
  if (n === 11) cachecol(ctx, cy, rx, ry, '#3b8ee0');
  // rosto
  const olhoY = cy - ry * 0.36, dx = rx * 0.3, ro = Math.max(1.8, ry * 0.085);
  if (n === 8) {
    // oculos de esqui na testa, olhos embaixo
    rr(ctx, -rx * 0.7, cy - ry * 0.74, rx * 1.4, ry * 0.26, ry * 0.12); ctx.fillStyle = '#26262e'; ctx.fill();
    const lg = ctx.createLinearGradient(-rx * 0.5, 0, rx * 0.5, 0);
    lg.addColorStop(0, '#ffb347'); lg.addColorStop(0.5, '#ff6f61'); lg.addColorStop(1, '#b06ab3');
    rr(ctx, -rx * 0.55, cy - ry * 0.71, rx * 1.1, ry * 0.2, ry * 0.1); ctx.fillStyle = lg; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-rx * 0.4, cy - ry * 0.68, rx * 0.25, 2);
  }
  ctx.fillStyle = CARVAO;
  for (const s of [-1, 1]) { circulo(ctx, s * dx, olhoY, ro); ctx.fill(); }
  ctx.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { circulo(ctx, s * dx + ro * 0.35, olhoY - ro * 0.35, ro * 0.38); ctx.fill(); }
  ctx.fillStyle = CARVAO;
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * (0.22 + k * 0.14);
    circulo(ctx, Math.cos(a) * rx * 0.36, cy - ry * 0.2 + Math.sin(a) * ry * 0.3, Math.max(1, ry * 0.05)); ctx.fill();
  }
  if (n >= 2) {
    ctx.fillStyle = 'rgba(255,120,150,0.45)';
    for (const s of [-1, 1]) { elipse(ctx, s * rx * 0.55, cy - ry * 0.14, rx * 0.14, ry * 0.08); ctx.fill(); }
  }
  if (n >= 3) cenoura(ctx, 0, cy - ry * 0.2, Math.max(6, rx * 0.4));
  if (n === 1) { ctx.fillStyle = CARVAO; circulo(ctx, 0, cy + ry * 0.3, ro * 0.9); ctx.fill(); }
  // chapeus e protetor (no topo; so a bola de cima mostra inteiro)
  if (n === 5) {
    ctx.strokeStyle = '#7a3fb0'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.ellipse(0, cy - ry * 0.25, rx * 0.95, ry * 0.85, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    for (const s of [-1, 1]) { circulo(ctx, s * rx * 0.92, cy - ry * 0.18, ry * 0.2); ctx.fillStyle = '#c792ea'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#7a3fb0'; ctx.stroke(); }
  }
  if (n === 6) gorro(ctx, 0, cy - ry * 0.78, rx, ry, t);
  if (n === 9 || n === 10) cartola(ctx, 0, cy - ry * 0.82, rx, ry);
  if (n === 11) {
    // coroa de gelo
    const cw = rx * 1.1, by = cy - ry * 0.8, ch = ry * 0.6;
    ctx.beginPath(); ctx.moveTo(-cw / 2, by);
    for (let k = 0; k <= 4; k++) { const x = -cw / 2 + (cw * k) / 4; ctx.lineTo(x - cw / 16, by - (k % 2 ? ch * 0.6 : ch)); ctx.lineTo(x + cw / 16, by - (k % 2 ? ch * 0.6 : ch) + 2); }
    ctx.lineTo(cw / 2, by); ctx.closePath();
    const cg = ctx.createLinearGradient(0, by - ch, 0, by);
    cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#8fd3ff');
    ctx.fillStyle = cg; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#3b8ee0'; ctx.stroke();
    const b = 0.5 + 0.5 * Math.sin(t * 4);
    estrela(ctx, cw * 0.5, by - ch, 4 + b * 3, 1.3, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  // etiqueta colorida com o numero
  const tam = Math.max(10, Math.min(24, r.h * 0.27));
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const tw = Math.min(pw * 0.95, ctx.measureText(String(v)).width + tam * 0.8);
  const th = tam * 1.12, ty = cy + ry * 0.56;
  rr(ctx, -tw / 2, ty - th / 2, tw, th, th * 0.45);
  ctx.fillStyle = ETIQUETA[n]; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  texto(ctx, String(v), 0, ty + 0.5, tam, '#ffffff', { contorno: escurecer(ETIQUETA[n], 0.45), espessura: 3, max: tw - 4 });
  if (op.destaque) {
    elipse(ctx, 0, cy, rx + 3, ry + 3); ctx.strokeStyle = `rgba(255,236,170,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

// ------------------------------------------------------------ obstaculos e especiais

function blocoGelo(ctx, r, v) {
  const pw = largura(r, v) + 8, x0 = -pw / 2, y0 = r.y, h = r.h;
  rr(ctx, x0, y0, pw, h, 7);
  ctx.fillStyle = 'rgba(170,220,255,0.5)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#f2fbff'; ctx.stroke();
  ctx.save(); rr(ctx, x0, y0, pw, h, 7); ctx.clip();
  // bisel e brilhos
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x0, y0, pw, h * 0.16);
  ctx.fillStyle = 'rgba(60,120,200,0.18)'; ctx.fillRect(x0, y0 + h * 0.84, pw, h * 0.16);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0 + pw * 0.14, y0 + h); ctx.lineTo(x0 + pw * 0.44, y0); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 + pw * 0.34, y0 + h); ctx.lineTo(x0 + pw * 0.62, y0); ctx.stroke();
  ctx.restore();
  const fx = x0 + pw - 9, fy = y0 + 10;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * 6, fy - Math.sin(a) * 6); ctx.lineTo(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6); ctx.stroke(); }
}

function rocha(ctx, r, hp) {
  const w = r.w * 0.94, h = r.h - 3, y0 = r.y + 2;
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, y0 + h);
    ctx.bezierCurveTo(-w * 0.56, y0 + h * 0.45, -w * 0.3, y0 + h * 0.04, -w * 0.02, y0 + h * 0.08);
    ctx.bezierCurveTo(w * 0.32, y0, w * 0.58, y0 + h * 0.42, w * 0.5, y0 + h);
    ctx.closePath();
  };
  forma(); ctx.fillStyle = '#7d8696'; ctx.fill();
  ctx.save(); forma(); ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; elipse(ctx, w * 0.2, y0 + h * 1.05, w * 0.6, h * 0.35); ctx.fill();
  elipse(ctx, -w * 0.18, y0 + h * 0.42, w * 0.2, h * 0.14, -0.4); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
  // capa de neve com pingentes
  ctx.beginPath(); ctx.moveTo(-w * 0.6, y0 + h * 0.3);
  for (let k = 0; k <= 6; k++) ctx.lineTo(-w * 0.6 + (w * 1.2 * k) / 6, y0 + h * (k % 2 ? 0.36 : 0.26));
  ctx.lineTo(w * 0.6, y0 - 4); ctx.lineTo(-w * 0.6, y0 - 4); ctx.closePath();
  ctx.fillStyle = NEVE; ctx.fill();
  ctx.restore();
  forma(); ctx.lineWidth = 2; ctx.strokeStyle = '#3c4454'; ctx.stroke();
  ctx.fillStyle = '#cfeaff';
  for (const f of [-0.25, 0.05, 0.3]) { ctx.beginPath(); ctx.moveTo(f * w - 2, y0 + h * 0.3); ctx.lineTo(f * w + 2, y0 + h * 0.3); ctx.lineTo(f * w, y0 + h * 0.46); ctx.closePath(); ctx.fill(); }
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  ctx.strokeStyle = '#2a303c'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const rach = [[-0.22, 0.42, -0.06, 0.6, -0.16, 0.82], [0.22, 0.4, 0.08, 0.58, 0.24, 0.78], [-0.02, 0.48, 0.05, 0.64, -0.05, 0.74]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, y0 + c[1] * h); ctx.lineTo(c[2] * w, y0 + c[3] * h); ctx.lineTo(c[4] * w, y0 + c[5] * h); ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * 10, y0 + h * 0.86, 3.6);
    ctx.fillStyle = k < hp ? '#8fe3ff' : 'rgba(0,0,0,0.35)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#2a303c'; ctx.stroke();
  }
}

function flocoMagico(ctx, r, op) {
  const t = op.t || 0;
  const R = Math.min(r.h * 0.42, r.w * 0.4), cy = r.y + r.h / 2;
  const halo = ctx.createRadialGradient(0, cy, R * 0.1, 0, cy, R * 1.3);
  halo.addColorStop(0, 'rgba(255,255,255,0.9)'); halo.addColorStop(1, 'rgba(160,200,255,0)');
  circulo(ctx, 0, cy, R * 1.3); ctx.fillStyle = halo; ctx.fill();
  ctx.save(); ctx.translate(0, cy); ctx.rotate(t * 0.6);
  ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    ctx.save(); ctx.rotate(a);
    ctx.strokeStyle = `hsl(${(k * 60 + t * 80) % 360},90%,60%)`; ctx.lineWidth = Math.max(2.5, R * 0.16);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -R); ctx.stroke();
    ctx.lineWidth = Math.max(2, R * 0.11);
    ctx.beginPath(); ctx.moveTo(0, -R * 0.55); ctx.lineTo(-R * 0.25, -R * 0.78); ctx.moveTo(0, -R * 0.55); ctx.lineTo(R * 0.25, -R * 0.78); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  circulo(ctx, 0, cy, R * 0.22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = CONTORNO; ctx.stroke();
  texto(ctx, '?', 0, cy + 0.5, R * 0.36, CONTORNO);
}

function bombaNeve(ctx, r, op) {
  const t = op.t || 0;
  const R = Math.min(r.h * 0.4, r.w * 0.36), cy = r.y + r.h * 0.56;
  ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(R * 0.45, cy - R * 0.8); ctx.quadraticCurveTo(R * 0.95, cy - R * 1.4, R * 1.3, cy - R * 1.05); ctx.stroke();
  const f = 0.6 + 0.4 * Math.abs(Math.sin(t * 18));
  estrela(ctx, R * 1.3, cy - R * 1.05, R * 0.42 * f, R * 0.15, 7); ctx.fillStyle = '#ffd23f'; ctx.fill();
  const g = ctx.createRadialGradient(-R * 0.35, cy - R * 0.35, R * 0.1, 0, cy, R);
  g.addColorStop(0, '#9fb4e6'); g.addColorStop(1, '#2c3a66');
  circulo(ctx, 0, cy, R); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#141b33'; ctx.stroke();
  // neve no alto da bomba
  ctx.save(); circulo(ctx, 0, cy, R); ctx.clip();
  ctx.fillStyle = NEVE; elipse(ctx, -R * 0.1, cy - R * 0.92, R * 0.9, R * 0.35); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  for (const s of [-1, 1]) { circulo(ctx, s * R * 0.32, cy, R * 0.15); ctx.fill(); }
  ctx.fillStyle = '#141b33';
  for (const s of [-1, 1]) { circulo(ctx, s * R * 0.3, cy + R * 0.03, R * 0.08); ctx.fill(); }
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * R * 0.55, cy - R * 0.32); ctx.lineTo(s * R * 0.16, cy - R * 0.18); ctx.stroke(); }
}

function chocolate(ctx, r, op) {
  const t = op.t || 0;
  const mw = Math.min(r.w * 0.56, r.h * 0.62), mh = r.h * 0.56, x0 = -mw / 2, y0 = r.y + r.h - mh - 3;
  // vapor
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let k = 0; k < 2; k++) {
    const f = (t * 0.6 + k * 0.5) % 1, x = x0 + mw * (0.35 + k * 0.3);
    ctx.globalAlpha = 1 - f;
    ctx.beginPath(); ctx.moveTo(x, y0 - 6 - f * 10); ctx.bezierCurveTo(x - 5, y0 - 12 - f * 10, x + 5, y0 - 16 - f * 10, x, y0 - 22 - f * 10); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // alca
  ctx.lineWidth = 4; ctx.strokeStyle = '#8f1f1f';
  ctx.beginPath(); ctx.arc(x0 + mw, y0 + mh * 0.45, mh * 0.24, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  rr(ctx, x0, y0, mw, mh, 6); ctx.fillStyle = VERMELHO; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#7a1414'; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [dx, dy] of [[0.18, 0.75], [0.82, 0.8], [0.5, 0.88]]) { circulo(ctx, x0 + mw * dx, y0 + mh * dy, 1.6); ctx.fill(); }
  elipse(ctx, 0, y0 + 2, mw / 2 - 2, 4); ctx.fillStyle = '#6d3b22'; ctx.fill();
  ctx.fillStyle = '#ffffff';
  circulo(ctx, -mw * 0.15, y0 - 2, mw * 0.17); ctx.fill(); circulo(ctx, mw * 0.12, y0 - 3, mw * 0.2); ctx.fill(); circulo(ctx, 0, y0 - 8, mw * 0.15); ctx.fill();
  ctx.fillStyle = '#ffd1dc'; rr(ctx, mw * 0.2, y0 - 7, 6, 5, 1.5); ctx.fill();
  texto(ctx, 'x2', 0, y0 + mh * 0.5, mh * 0.42, '#ffffff', { contorno: '#7a1414', espessura: 3 });
}

function registrarFormas(P) {
  if (P.formas.floco) return;
  P.formas.floco = (ctx, p) => {
    ctx.strokeStyle = p.cor; ctx.lineWidth = Math.max(1, p.tam * 0.16); ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(-Math.cos(a) * p.tam / 2, -Math.sin(a) * p.tam / 2); ctx.lineTo(Math.cos(a) * p.tam / 2, Math.sin(a) * p.tam / 2); ctx.stroke(); }
  };
  P.formas.lasca = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s * 0.2, -s); ctx.lineTo(s, s * 0.1); ctx.lineTo(-s * 0.1, s); ctx.closePath(); ctx.fill();
  };
  P.formas.caco = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.5, s * 0.6); ctx.lineTo(-s * 0.4, s * 0.3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1; ctx.stroke();
  };
  P.formas.confete = (ctx, p) => { ctx.fillRect(-p.tam / 2, -p.tam * 0.3, p.tam, p.tam * 0.6); };
}

// ------------------------------------------------------------ cenario

function pinheiro(ctx, x, y, s, cor = PINHO) {
  ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - s * 0.08, y - s * 0.2, s * 0.16, s * 0.25);
  for (let k = 0; k < 3; k++) {
    const yy = y - s * 0.2 - k * s * 0.32, w = s * (0.55 - k * 0.13);
    ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - s * 0.48); ctx.lineTo(x + w, yy); ctx.closePath();
    ctx.fillStyle = cor; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - w * 0.5, yy - s * 0.24); ctx.lineTo(x, yy - s * 0.48); ctx.lineTo(x + w * 0.5, yy - s * 0.24); ctx.lineTo(x + w * 0.25, yy - s * 0.2); ctx.lineTo(x, yy - s * 0.26); ctx.lineTo(x - w * 0.25, yy - s * 0.2); ctx.closePath();
    ctx.fillStyle = NEVE; ctx.fill();
  }
}

function casinha(ctx, x, y, w, cor) {
  const h = w * 0.7;
  ctx.fillStyle = cor; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; ctx.strokeRect(x - w / 2, y - h, w, h);
  // chamine
  ctx.fillStyle = '#7a4a3a'; ctx.fillRect(x + w * 0.18, y - h - w * 0.42, w * 0.14, w * 0.3);
  CENA.chamines.push({ x: x + w * 0.25, y: y - h - w * 0.44 });
  // telhado com neve
  ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - h + 2); ctx.lineTo(x, y - h - w * 0.45); ctx.lineTo(x + w * 0.62, y - h + 2); ctx.closePath();
  ctx.fillStyle = '#5b3b4e'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - w * 0.66, y - h + 2); ctx.lineTo(x, y - h - w * 0.5); ctx.lineTo(x + w * 0.66, y - h + 2); ctx.lineTo(x + w * 0.5, y - h + 6); ctx.lineTo(x, y - h - w * 0.36); ctx.lineTo(x - w * 0.5, y - h + 6); ctx.closePath();
  ctx.fillStyle = NEVE; ctx.fill();
  // janelas acesas
  for (const dx of [-0.22, 0.22]) {
    const jx = x + dx * w;
    ctx.fillStyle = 'rgba(255,207,107,0.35)'; circulo(ctx, jx, y - h * 0.55, w * 0.18); ctx.fill();
    ctx.fillStyle = LUZ; ctx.fillRect(jx - w * 0.09, y - h * 0.68, w * 0.18, w * 0.18);
    ctx.fillStyle = 'rgba(80,40,20,0.55)'; ctx.fillRect(jx - 0.6, y - h * 0.68, 1.2, w * 0.18); ctx.fillRect(jx - w * 0.09, y - h * 0.68 + w * 0.09 - 0.6, w * 0.18, 1.2);
  }
  ctx.fillStyle = '#4a2c20'; ctx.fillRect(x - w * 0.08, y - h * 0.4, w * 0.16, h * 0.4);
}

const tema = {
  id: 'neve',
  nome: 'Bonecos de Neve',
  cores: { texto: NOITE, destaque: '#ffe9a8', particulas: ['#ffffff', '#cfeaff', '#ffcf6b'] },
  faixas: () => ({ topo: 98, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.3, colar: true }),

  fundo(ctx, W, H, L) {
    CENA.luzes = []; CENA.chamines = [];
    const chao = L.chao;
    const g = ctx.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, '#121a3d'); g.addColorStop(0.45, NOITE); g.addColorStop(0.8, '#4a4f93'); g.addColorStop(1, '#8a7fb8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, chao + 4);
    const rnd = semente(9);
    // estrelas
    for (let k = 0; k < 60; k++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`; circulo(ctx, rnd() * W, L.topo + rnd() * (chao - L.topo) * 0.55, 0.6 + rnd() * 1.1); ctx.fill(); }
    // aurora
    for (let b = 0; b < 2; b++) {
      const y0 = L.topo + 40 + b * 34;
      const ag = ctx.createLinearGradient(0, y0 - 30, 0, y0 + 40);
      ag.addColorStop(0, 'rgba(120,255,200,0)'); ag.addColorStop(0.5, b ? 'rgba(160,140,255,0.22)' : 'rgba(110,255,190,0.3)'); ag.addColorStop(1, 'rgba(120,255,200,0)');
      ctx.fillStyle = ag;
      ctx.beginPath(); ctx.moveTo(0, y0 + 40);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, y0 - Math.sin(x / W * Math.PI * 2.2 + b * 1.7) * 18 - 18);
      for (let x = W; x >= 0; x -= 10) ctx.lineTo(x, y0 + 30 - Math.sin(x / W * Math.PI * 2.2 + b * 1.7) * 14);
      ctx.closePath(); ctx.fill();
    }
    // lua
    const lx = W * 0.84, ly = L.topo + 46;
    ctx.fillStyle = 'rgba(255,248,220,0.18)'; circulo(ctx, lx, ly, 36); ctx.fill();
    ctx.fillStyle = '#fff6dc'; circulo(ctx, lx, ly, 20); ctx.fill();
    ctx.fillStyle = 'rgba(200,190,160,0.4)'; circulo(ctx, lx - 6, ly - 4, 4); ctx.fill(); circulo(ctx, lx + 5, ly + 6, 3); ctx.fill();
    // montanhas
    const topoTorre = chao - L.pilhaMax * L.faixa;
    const crista = Math.min(chao - 60, topoTorre + 40);
    ctx.fillStyle = '#5d6aa8';
    ctx.beginPath(); ctx.moveTo(0, crista);
    const picos = [[0.1, 70], [0.3, 40], [0.5, 90], [0.72, 50], [0.9, 80], [1.05, 40]];
    for (const [px, ph] of picos) { ctx.lineTo(px * W - 40, crista - ph * 0.3); ctx.lineTo(px * W, crista - ph); }
    ctx.lineTo(W, crista); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dfe8fb';
    for (const [px, ph] of picos) { ctx.beginPath(); ctx.moveTo(px * W - 12, crista - ph * 0.72); ctx.lineTo(px * W, crista - ph); ctx.lineTo(px * W + 12, crista - ph * 0.72); ctx.closePath(); ctx.fill(); }
    // colina com a vila
    const col = (y, cor, amp, f) => {
      ctx.beginPath(); ctx.moveTo(0, chao + 4);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y - Math.sin(x / W * Math.PI * 1.6 + f) * amp);
      ctx.lineTo(W, chao + 4); ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
    };
    col(crista + 14, '#b9c8ea', 10, 0.4);
    const casas = [[0.12, 34, '#c0504d'], [0.38, 28, '#4f7cc0'], [0.63, 36, '#7b5ea7'], [0.88, 30, '#c27c3a']];
    for (const [cx, w, cor] of casas) casinha(ctx, cx * W, crista + 16 - Math.sin(cx * Math.PI * 1.6 + 0.4) * 10, w, cor);
    // varal de luzes entre as casas
    ctx.strokeStyle = 'rgba(20,20,30,0.7)'; ctx.lineWidth = 1;
    for (let k = 0; k < casas.length - 1; k++) {
      const [a, wa] = casas[k], [b] = casas[k + 1];
      const x0 = a * W + wa * 0.5, x1 = b * W - 14, y0 = crista - 6, y1 = crista - 6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 16, x1, y1); ctx.stroke();
      for (let i = 1; i < 7; i++) { const u = i / 7; CENA.luzes.push({ x: x0 + (x1 - x0) * u, y: y0 + 32 * u * (1 - u) + 2, c: i % 4 }); }
    }
    for (let k = 0; k < 6; k++) pinheiro(ctx, (0.05 + k * 0.19) * W + rnd() * 20, crista + 30, 30 + rnd() * 16, '#245f45');
    col(chao - 14, '#dfe8fb', 8, 2.1);
    // chao de neve
    const ng = ctx.createLinearGradient(0, chao, 0, H);
    ng.addColorStop(0, NEVE); ng.addColorStop(1, '#d5e2f7');
    ctx.fillStyle = ng; ctx.fillRect(0, chao, W, H - chao);
    ctx.fillStyle = 'rgba(170,190,230,0.35)';
    for (let k = 0; k < 10; k++) { elipse(ctx, rnd() * W, chao + 30 + rnd() * (H - chao - 30), 30 + rnd() * 40, 5 + rnd() * 4); ctx.fill(); }
    // primeiro plano: poste aceso e pinheirinhos
    if (!L.fila.vertical && H - (L.fila.y + L.fila.h) > 120) {
      const py = H - 30, px = 34;
      ctx.fillStyle = '#2b2f45'; ctx.fillRect(px - 2, py - 120, 4, 120);
      ctx.fillStyle = 'rgba(255,207,107,0.22)'; circulo(ctx, px, py - 124, 34); ctx.fill();
      rr(ctx, px - 8, py - 134, 16, 16, 4); ctx.fillStyle = LUZ; ctx.fill(); ctx.strokeStyle = '#2b2f45'; ctx.lineWidth = 2; ctx.stroke();
      pinheiro(ctx, W - 40, H - 16, 64);
      pinheiro(ctx, W - 86, H - 10, 44);
      // pegadas
      ctx.fillStyle = 'rgba(150,170,210,0.45)';
      for (let k = 0; k < 7; k++) { elipse(ctx, 90 + k * 30, H - 44 + (k % 2) * 8, 4, 6, 0.3); ctx.fill(); }
    }
  },

  vivo(ctx, W, H, t) {
    // luzes do varal piscando
    const cores = ['#ff5d5d', '#ffd23f', '#5ad1ff', '#7ee08a'];
    for (const l of CENA.luzes) {
      const a = 0.55 + 0.45 * Math.sin(t * 3 + l.x * 0.1 + l.c);
      ctx.fillStyle = cores[l.c]; ctx.globalAlpha = 0.25 * a; circulo(ctx, l.x, l.y, 5); ctx.fill();
      ctx.globalAlpha = 0.6 + 0.4 * a; circulo(ctx, l.x, l.y, 2.2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // fumaca das chamines
    for (const c of CENA.chamines) {
      for (let k = 0; k < 3; k++) {
        const f = (t * 0.35 + k / 3) % 1;
        ctx.fillStyle = `rgba(220,225,240,${0.4 * (1 - f)})`;
        circulo(ctx, c.x + Math.sin(t + k) * 3 + f * 6, c.y - f * 26, 2.5 + f * 4); ctx.fill();
      }
    }
    // neve caindo
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const f of FLOCOS) {
      const x = ((f.x * W + Math.sin(t * 0.8 + f.f) * 14) % W + W) % W;
      const y = (f.y * H + t * f.v) % H;
      circulo(ctx, x, y, f.r); ctx.fill();
    }
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      const a = L.coluna(c);
      const cx = a.x + a.w / 2;
      elipse(ctx, cx, L.chao + 3, a.w * 0.62, 7); ctx.fillStyle = '#ffffff'; ctx.fill();
      elipse(ctx, cx, L.chao + 5, a.w * 0.6, 5); ctx.fillStyle = 'rgba(150,175,220,0.45)'; ctx.fill();
      if (!e.colunas[c].length) {
        const s = L.carta(c, 0);
        elipse(ctx, s.x + s.w / 2, s.y + s.h / 2, s.w * 0.4, s.h / 2 - 3);
        ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(77,95,140,0.55)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        const fx = s.x + s.w / 2, fy = s.y + s.h / 2;
        ctx.strokeStyle = 'rgba(77,95,140,0.45)'; ctx.lineWidth = 1.6;
        for (let k = 0; k < 3; k++) { const ang = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(ang) * 7, fy - Math.sin(ang) * 7); ctx.lineTo(fx + Math.cos(ang) * 7, fy + Math.sin(ang) * 7); ctx.stroke(); }
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return rocha(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return flocoMagico(ctx, r, op);
    if (carta.tipo === 'bomba') return bombaNeve(ctx, r, op);
    if (carta.tipo === 'dobro') return chocolate(ctx, r, op);
    bola(ctx, carta.v, r, op);
    if (carta.gelo) blocoGelo(ctx, r, carta.v);
  },

  cadeado(ctx, a) {
    // presente embrulhado cobrindo a coluna
    const x = a.x - 3, w = a.w + 6, y = a.y + a.h * 0.1, h = a.h * 0.9 + 3;
    ctx.save(); ctx.globalAlpha = 0.9;
    rr(ctx, x, y, w, h, 6); ctx.fillStyle = VERMELHO; ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let yy = y + 10; yy < y + h; yy += 18) for (let xx = x + 8 + ((yy / 18) % 2) * 9; xx < x + w; xx += 18) { estrela(ctx, xx, yy, 3.5, 1.4, 5); ctx.fill(); }
    ctx.restore();
    ctx.restore();
    rr(ctx, x, y, w, h, 6); ctx.lineWidth = 2; ctx.strokeStyle = '#7a1414'; ctx.stroke();
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(x + w / 2 - 5, y, 10, h);
    ctx.fillRect(x, y + h * 0.42, w, 10);
    ctx.strokeStyle = '#a07a1e'; ctx.lineWidth = 1.2;
    ctx.strokeRect(x + w / 2 - 5, y, 10, h); ctx.strokeRect(x, y + h * 0.42, w, 10);
    // laco
    const lx = x + w / 2, ly = y - 2;
    for (const s of [-1, 1]) { elipse(ctx, lx + s * 10, ly - 6, 10, 6, s * 0.5); ctx.fillStyle = '#f2c14e'; ctx.fill(); ctx.stroke(); }
    circulo(ctx, lx, ly - 4, 4.5); ctx.fill(); ctx.stroke();
    // cadeado no cruzamento das fitas
    const cx = lx, cy = y + h * 0.42 + 5;
    ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy - 6, 7, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 10, cy - 6, 20, 16, 4); ctx.fillStyle = '#ffe08a'; ctx.fill(); ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#7a5a10'; circulo(ctx, cx, cy + 1, 2.4); ctx.fill();
  },

  descarte(ctx, r, e) {
    // monte de neve com pa
    const cx = r.x + r.w / 2, base = r.y + r.h + 4;
    const carga = e.descarteCarga > 0;
    const mw = r.w * (carga ? 0.78 : 0.62), mh = r.h * (carga ? 0.75 : 0.5);
    // pa espetada
    ctx.save(); ctx.translate(cx + mw * 0.45, base - mh * 0.7); ctx.rotate(0.35);
    ctx.fillStyle = '#8a5a3b'; ctx.fillRect(-2, -r.h * 0.75, 4, r.h * 0.75);
    rr(ctx, -6, -r.h * 0.8, 12, 5, 2); ctx.fillStyle = '#2b2f45'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(7, 14); ctx.lineTo(-7, 14); ctx.closePath();
    ctx.fillStyle = VERMELHO; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#7a1414'; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - mw, base);
    ctx.bezierCurveTo(cx - mw * 0.9, base - mh * 1.1, cx + mw * 0.9, base - mh * 1.25, cx + mw, base);
    ctx.closePath();
    ctx.fillStyle = NEVE; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
    ctx.fillStyle = 'rgba(160,185,225,0.45)'; elipse(ctx, cx + mw * 0.3, base - mh * 0.3, mw * 0.35, mh * 0.2); ctx.fill();
    rr(ctx, cx - 24, r.y - 24, 48, 17, 6); ctx.fillStyle = carga ? '#fff6dc' : '#c9d2e3'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#5a3a24'; ctx.stroke();
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(cx - 1.5, r.y - 7, 3, 8);
    texto(ctx, carga ? 'monte' : 'vazio', cx, r.y - 15.5, 11, '#5a3a24');
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) {
      // tabua pendurada (teleferico)
      ctx.strokeStyle = '#3a2a1e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(f.x + f.w / 2, f.y - 40); ctx.lineTo(f.x + f.w / 2, f.y - 4); ctx.stroke();
      rr(ctx, f.x + 2, f.y - 6, f.w - 4, f.h + 12, 10); ctx.fillStyle = '#9a6a45'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#4e321f'; ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1;
      for (let y = f.y + 20; y < f.y + f.h; y += 26) { ctx.beginPath(); ctx.moveTo(f.x + 6, y); ctx.lineTo(f.x + f.w - 6, y); ctx.stroke(); }
      rr(ctx, f.x, f.y - 10, f.w, 9, 5); ctx.fillStyle = NEVE; ctx.fill();
      texto(ctx, 'próximas', f.x + f.w / 2, f.y - 22, 13, '#ffffff', { contorno: NOITE, espessura: 3 });
      return;
    }
    // treno de madeira sob a fila
    const p0 = L.filaPos(0), pN = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, pN.x) - 22, x1 = Math.max(p0.x + p0.w, pN.x + pN.w) + 16;
    const y = p0.y + p0.h + 1;
    ctx.strokeStyle = VERMELHO; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y + 16); ctx.lineTo(x0 + 10, y + 16); ctx.arc(x0 + 10, y + 6, 10, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.lineWidth = 2.5;
    for (const fx of [0.2, 0.5, 0.8]) { const xx = x0 + (x1 - x0) * fx; ctx.beginPath(); ctx.moveTo(xx, y + 4); ctx.lineTo(xx, y + 15); ctx.stroke(); }
    rr(ctx, x0 + 4, y - 2, x1 - x0 - 4, 8, 3); ctx.fillStyle = '#b5814f'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#5a3a24'; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,58,36,0.4)'; ctx.lineWidth = 1;
    for (let xx = x0 + 20; xx < x1; xx += 18) { ctx.beginPath(); ctx.moveTo(xx, y - 1); ctx.lineTo(xx, y + 5); ctx.stroke(); }
    ctx.strokeStyle = '#7a5530'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0 + 2, y + 2); ctx.quadraticCurveTo(x0 - 20, y + 20, x0 - 30, y + 6); ctx.stroke();
    texto(ctx, 'próximas ▸', x0 + 34, p0.y - 30, 12, '#ffffff', { contorno: NOITE, espessura: 3 });
  },

  hud(ctx, W, H, L, e, t) {
    const x = 10, y = 14, w = W - 20, h = 74;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = '#8a5a3b'; ctx.fill();
    ctx.restore();
    ctx.save(); rr(ctx, x, y, w, h, 12); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.2;
    for (let yy = y + 18; yy < y + h; yy += 18) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    ctx.restore();
    rr(ctx, x, y, w, h, 12); ctx.lineWidth = 2; ctx.strokeStyle = '#4e321f'; ctx.stroke();
    // neve em cima da placa
    ctx.beginPath(); ctx.moveTo(x + 4, y + 4);
    for (let k = 0; k <= 16; k++) { const xx = x + 4 + ((w - 8) * k) / 16; ctx.lineTo(xx, y - 6 + (k % 3 === 0 ? 0 : 2)); }
    ctx.lineTo(x + w - 4, y + 4);
    for (let k = 16; k >= 0; k--) { const xx = x + 4 + ((w - 8) * k) / 16; ctx.lineTo(xx, y + 5 + (k % 4 === 1 ? 6 : 0)); }
    ctx.closePath(); ctx.fillStyle = NEVE; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = SOMBRA; ctx.stroke();
    // vila
    circulo(ctx, x + 34, y + h / 2 + 3, 23); ctx.fillStyle = VERMELHO; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    texto(ctx, 'vila', x + 34, y + h / 2 - 7, 10, '#ffe0e0');
    texto(ctx, String(e.faseId), x + 34, y + h / 2 + 9, 20, '#ffffff', { contorno: '#7a1414', espessura: 3 });
    // metas
    const mx = x + 68, mw = w - 68 - 86;
    e.metas.forEach((m, k) => {
      const yy = y + 18 + k * 27;
      texto(ctx, textoMeta(m, { monte: (n) => `Monte ${n} boneco${n > 1 ? 's' : ''}` }), mx, yy + 4, 12, '#fff6e6', { alinhar: 'left', max: mw, contorno: 'rgba(60,35,20,0.6)', espessura: 2.5 });
      rr(ctx, mx, yy + 12, mw, 8, 4); ctx.fillStyle = 'rgba(40,25,15,0.45)'; ctx.fill();
      rr(ctx, mx, yy + 12, Math.max(8, mw * Math.min(1, m.atual / m.alvo)), 8, 4); ctx.fillStyle = m.feita ? '#7ee08a' : '#8fd3ff'; ctx.fill();
    });
    // pontos com floco
    const px = x + w - 44, fy = y + 26;
    ctx.strokeStyle = '#dff3ff'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3 + t * 0.4; ctx.beginPath(); ctx.moveTo(px - Math.cos(a) * 11, fy - Math.sin(a) * 11); ctx.lineTo(px + Math.cos(a) * 11, fy + Math.sin(a) * 11); ctx.stroke(); }
    texto(ctx, String(e.pontos), px, y + 54, 17, '#ffffff', { max: 80, contorno: 'rgba(60,35,20,0.6)', espessura: 3 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      texto(ctx, 'NEVASCA x2', W / 2, y + h + 20, 21 + k * 2, '#ffffff', { contorno: '#3b8ee0', espessura: 5 + k * 2 });
    }
  },

  efeito(fx, P) {
    registrarFormas(P);
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 16, ['#ffffff', '#eaf2ff'], 9, 0.35, { g: 60, vida: 0.5, tam: 9, forma: 'c' });
        return true;
      case 'fusao': {
        const cor = ETIQUETA[Math.min(nivel(fx.valor), ETIQUETA.length - 1)];
        P.estourar(fx.x, fx.y, ['#ffffff', '#cfeaff', cor], 10 + fx.degrau * 4, 0.7 + fx.degrau * 0.12, { forma: 'floco', tam: 10, g: 120, vida: 0.8 });
        P.estourar(fx.x, fx.y, ['#ffe9a8', '#ffffff'], 6, 0.8, { forma: 'estrela', tam: 8, g: 200 });
        P.anel(fx.x, fx.y, '#ffffff', 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 24, 'x' + fx.degrau, '#ffffff', 22 + fx.degrau * 2, cor);
        return true;
      }
      case 'completar':
        P.estourar(fx.x, fx.y, ETIQUETA, 40, 1.6, { forma: 'floco', tam: 12, g: 260, vida: 1.0 });
        P.estourar(fx.x, fx.y, [VERMELHO, '#f2c14e', '#ffffff'], 20, 1.3, { forma: 'confete', tam: 8, g: 380 });
        P.texto(fx.x, fx.y - 30, 'Boneco pronto!', '#ffffff', 26, VERMELHO);
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#ffffff', '#eaf2ff', '#cfeaff'], 28, 1.5, { forma: 'c', tam: 10, g: 300, vida: 0.7 });
        P.estourar(fx.x, fx.y, ['#ffd23f', '#ff8a3d'], 8, 1.0, { forma: 'estrela', tam: 7 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#7d8696', '#5a6170', '#a9b1bf'], 18, 1.0, { forma: 'lasca', tam: 8 });
        P.estourar(fx.x, fx.y, ['#ffffff'], 8, 0.6, { forma: 'c', tam: 6, g: 100 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#7d8696', '#a9b1bf'], 6, 0.6, { forma: 'lasca', tam: 6 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#e6f7ff', '#a9dcff', '#ffffff'], 16, 0.9, { forma: 'caco', tam: 10, g: 240, vida: 0.8 });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, [VERMELHO, '#f2c14e', '#ffffff'], 22, 1.2, { forma: 'confete', tam: 9, g: 300 });
        P.texto(fx.x, fx.y - 22, 'Presente aberto!', '#ffffff', 20, VERMELHO);
        return true;
      case 'combo':
        P.texto(fx.x, fx.y - 44, `Combo x${fx.n}!`, '#ffe9a8', 22, '#3b5bdb');
        return true;
      default: return false;
    }
  },
};

export default tema;
