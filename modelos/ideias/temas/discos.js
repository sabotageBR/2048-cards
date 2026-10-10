// Ideia 15: Loja de Discos (anos 70). Cada carta e a capa de um disco com arte
// setentista e o vinil aparecendo no topo; discos iguais viram um disco melhor
// e o 2048 e o disco de platina. A febre vira "DISCO FEVER". Geometria padrao
// de cartas (capas em pe, como no garimpo).
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, textoMeta, semente, clamp } from '../kit.js';

const LARANJA = '#f28c28';
const MOSTARDA = '#e3b23c';
const MARROM = '#6b3e26';
const OLIVA = '#8a9a3b';
const PETROLEO = '#2a9d8f';
const CREME = '#f6e7c8';
const TINTA = '#3a2214';
const VERMELHO = '#d9542b';

/** Capa por nivel (2..4096): cor de fundo, cor da faixa do titulo e a arte. */
const CAPAS = [
  { fundo: MOSTARDA, faixa: MARROM, arte: 'sol' },
  { fundo: CREME, faixa: LARANJA, arte: 'arcoiris' },
  { fundo: PETROLEO, faixa: MOSTARDA, arte: 'ondas' },
  { fundo: CREME, faixa: MARROM, arte: 'xadrez' },
  { fundo: LARANJA, faixa: PETROLEO, arte: 'alvo' },
  { fundo: OLIVA, faixa: LARANJA, arte: 'flor' },
  { fundo: MARROM, faixa: MOSTARDA, arte: 'raio' },
  { fundo: '#f4b56a', faixa: VERMELHO, arte: 'porDoSol' },
  { fundo: '#2f5d62', faixa: OLIVA, arte: 'arco' },
  { fundo: '#3b2a4a', faixa: MOSTARDA, arte: 'brilho' },
  { fundo: '#c9ced6', faixa: '#5b6573', arte: 'platina' },
  { fundo: '#d9f2ff', faixa: '#3d7ea6', arte: 'diamante' },
];
const capaDe = (v) => CAPAS[Math.min(nivel(v), CAPAS.length - 1)];

function traco(ctx, cor, l = 1.4) { ctx.lineWidth = l; ctx.strokeStyle = cor; ctx.stroke(); }

// ------------------------------------------------------------ a capa

/**
 * Corpo da capa: vinil espiando no topo, capa com cantos gastos, faixa do
 * titulo (onde vai o numero). Devolve a area da arte.
 */
function capa(ctx, r, op, cor, corFaixa, discoCor = '#1b1512') {
  const topoCapa = r.y + r.h * 0.07;
  const ch = r.h - (topoCapa - r.y);
  const raio = Math.max(3, r.w * 0.06);
  // vinil saindo por cima
  const dr = r.w * 0.42;
  ctx.save();
  ctx.beginPath(); ctx.rect(r.x - 2, r.y - 2, r.w + 4, topoCapa - r.y + 3); ctx.clip();
  circulo(ctx, r.w * 0.06, topoCapa + dr * 0.82, dr); ctx.fillStyle = discoCor; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.8;
  for (const k of [0.9, 0.8, 0.7]) { circulo(ctx, r.w * 0.06, topoCapa + dr * 0.82, dr * k); ctx.stroke(); }
  ctx.restore();
  // capa
  ctx.save();
  ctx.shadowColor = 'rgba(40,18,6,0.45)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
  rr(ctx, r.x, topoCapa, r.w, ch, raio); ctx.fillStyle = cor; ctx.fill();
  ctx.restore();
  const a = { x: r.x, y: topoCapa, w: r.w, h: ch, raio };
  // faixa do titulo: ate ~30% da carta (o que aparece quando coberta)
  const fh = r.y + r.h * 0.3 - topoCapa - 1;
  ctx.save();
  rr(ctx, a.x, a.y, a.w, a.h, raio); ctx.clip();
  ctx.fillStyle = corFaixa; ctx.fillRect(a.x, a.y, a.w, fh);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(a.x, a.y, a.w, fh * 0.35);
  ctx.fillStyle = rgba(CREME, 0.85); ctx.fillRect(a.x, a.y + fh, a.w, Math.max(1.5, r.h * 0.018));
  ctx.restore();
  const arte = { x: a.x, y: a.y + fh + Math.max(1.5, r.h * 0.018), w: a.w, h: a.h - fh - Math.max(1.5, r.h * 0.018), raio };
  return { a, fh, arte, cyFaixa: a.y + fh / 2 };
}

function bordaCapa(ctx, c, op) {
  rr(ctx, c.a.x, c.a.y, c.a.w, c.a.h, c.a.raio); traco(ctx, TINTA, 1.5);
  // desgaste de uso (anel do disco marcado na capa)
  ctx.save(); rr(ctx, c.arte.x, c.arte.y, c.arte.w, c.arte.h, c.arte.raio); ctx.clip();
  circulo(ctx, c.arte.x + c.arte.w * 0.5, c.arte.y + c.arte.h * 0.5, Math.min(c.arte.w, c.arte.h) * 0.46);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  if (op && op.destaque) {
    ctx.save();
    ctx.shadowColor = MOSTARDA; ctx.shadowBlur = 12 * op.destaque;
    rr(ctx, c.a.x - 2, c.a.y - 2, c.a.w + 4, c.a.h + 4, c.a.raio + 2);
    ctx.strokeStyle = `rgba(255,214,120,${0.45 + op.destaque * 0.55})`; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
}

/** Numero gordo e arredondado com contorno, na faixa. */
function numero(ctx, c, txt, cor = CREME, contorno = TINTA) {
  const tam = Math.min(c.fh * 0.86, c.a.w * (txt.length >= 4 ? 0.31 : 0.42));
  texto(ctx, txt, 0, c.cyFaixa + 0.5, tam, cor, { contorno, espessura: Math.max(2.5, tam * 0.2), max: c.a.w - 6 });
}

// ------------------------------------------------------------ artes

function arte(ctx, nome, a, t, cor) {
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2, s = Math.min(a.w, a.h);
  ctx.save();
  rr(ctx, a.x, a.y, a.w, a.h, a.raio); ctx.clip();
  switch (nome) {
    case 'sol': {
      const n = 14;
      for (let k = 0; k < n; k++) {
        const a0 = Math.PI + (k / n) * Math.PI, a1 = Math.PI + ((k + 1) / n) * Math.PI;
        ctx.beginPath(); ctx.moveTo(cx, a.y + a.h); ctx.arc(cx, a.y + a.h, a.h * 1.4, a0, a1); ctx.closePath();
        ctx.fillStyle = k % 2 ? LARANJA : '#f7c55a'; ctx.fill();
      }
      circulo(ctx, cx, a.y + a.h, s * 0.34); ctx.fillStyle = VERMELHO; ctx.fill();
      circulo(ctx, cx, a.y + a.h, s * 0.24); ctx.fillStyle = MOSTARDA; ctx.fill();
      break;
    }
    case 'arcoiris': {
      const cores = [VERMELHO, LARANJA, MOSTARDA, OLIVA, PETROLEO];
      cores.forEach((c, k) => {
        ctx.beginPath();
        const y0 = a.y + a.h * 0.18 + k * a.h * 0.13;
        ctx.moveTo(a.x, y0 + a.h * 0.25);
        ctx.bezierCurveTo(a.x + a.w * 0.3, y0 + a.h * 0.25, a.x + a.w * 0.45, y0, a.x + a.w, y0);
        ctx.lineTo(a.x + a.w, y0 + a.h * 0.13); ctx.bezierCurveTo(a.x + a.w * 0.45, y0 + a.h * 0.13, a.x + a.w * 0.3, y0 + a.h * 0.38, a.x, y0 + a.h * 0.38);
        ctx.closePath(); ctx.fillStyle = c; ctx.fill();
      });
      break;
    }
    case 'ondas': {
      const cores = [MOSTARDA, CREME, LARANJA, OLIVA];
      for (let k = 0; k < 6; k++) {
        const y0 = a.y + a.h * 0.12 + k * a.h * 0.15;
        ctx.beginPath(); ctx.moveTo(a.x, y0);
        for (let x = 0; x <= a.w; x += 3) ctx.lineTo(a.x + x, y0 + Math.sin(x / a.w * TAU * 1.5 + k * 0.8 + t * 0.6) * a.h * 0.045);
        ctx.strokeStyle = cores[k % 4]; ctx.lineWidth = a.h * 0.065; ctx.stroke();
      }
      break;
    }
    case 'xadrez': {
      const n = 5, q = a.w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < Math.ceil(a.h / q) + 1; j++) {
        if ((i + j) % 2) continue;
        ctx.fillStyle = (i + j) % 4 ? MARROM : LARANJA;
        ctx.fillRect(a.x + i * q, a.y + j * q - q * 0.3, q, q);
      }
      circulo(ctx, cx, cy, s * 0.24); ctx.fillStyle = MOSTARDA; ctx.fill(); traco(ctx, TINTA, 1.4);
      circulo(ctx, cx, cy, s * 0.07); ctx.fillStyle = TINTA; ctx.fill();
      break;
    }
    case 'alvo': {
      const cores = [CREME, MARROM, MOSTARDA, VERMELHO, CREME, PETROLEO];
      for (let k = 0; k < cores.length; k++) { circulo(ctx, cx, cy, s * (0.62 - k * 0.1)); ctx.fillStyle = cores[k]; ctx.fill(); }
      break;
    }
    case 'flor': {
      const R = s * 0.34, gira = t * 0.3;
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * TAU + gira;
        elipse(ctx, cx + Math.cos(ang) * R * 0.75, cy + Math.sin(ang) * R * 0.75, R * 0.52, R * 0.28, ang);
        ctx.fillStyle = k % 2 ? '#f7c55a' : CREME; ctx.fill(); traco(ctx, TINTA, 1.1);
      }
      circulo(ctx, cx, cy, R * 0.5); ctx.fillStyle = LARANJA; ctx.fill(); traco(ctx, TINTA, 1.2);
      circulo(ctx, cx, cy, R * 0.22); ctx.fillStyle = VERMELHO; ctx.fill();
      break;
    }
    case 'raio': {
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#7a4a2e' : MARROM; ctx.fillRect(a.x, a.y + (k * a.h) / 5, a.w, a.h / 5); }
      ctx.beginPath();
      ctx.moveTo(cx + s * 0.12, a.y + a.h * 0.08); ctx.lineTo(cx - s * 0.26, cy + s * 0.05); ctx.lineTo(cx - s * 0.02, cy + s * 0.05);
      ctx.lineTo(cx - s * 0.14, a.y + a.h * 0.92); ctx.lineTo(cx + s * 0.28, cy - s * 0.08); ctx.lineTo(cx + s * 0.03, cy - s * 0.08); ctx.closePath();
      ctx.fillStyle = MOSTARDA; ctx.fill(); traco(ctx, TINTA, 1.6);
      break;
    }
    case 'porDoSol': {
      circulo(ctx, cx, a.y + a.h * 0.62, s * 0.38);
      const g = ctx.createLinearGradient(0, a.y + a.h * 0.25, 0, a.y + a.h * 0.62);
      g.addColorStop(0, '#ffd36b'); g.addColorStop(1, VERMELHO);
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = cor;
      for (let k = 0; k < 4; k++) ctx.fillRect(a.x, a.y + a.h * (0.44 + k * 0.07), a.w, a.h * (0.012 + k * 0.012));
      ctx.fillStyle = MARROM; ctx.fillRect(a.x, a.y + a.h * 0.68, a.w, a.h);
      ctx.fillStyle = OLIVA;
      ctx.beginPath(); ctx.moveTo(a.x, a.y + a.h * 0.72); ctx.quadraticCurveTo(cx, a.y + a.h * 0.6, a.x + a.w, a.y + a.h * 0.74); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.lineTo(a.x, a.y + a.h); ctx.closePath(); ctx.fill();
      break;
    }
    case 'arco': {
      const cores = [VERMELHO, LARANJA, MOSTARDA, CREME];
      cores.forEach((c, k) => {
        ctx.beginPath(); ctx.arc(cx, a.y + a.h * 0.95, s * (0.58 - k * 0.11), Math.PI, 0);
        ctx.strokeStyle = c; ctx.lineWidth = s * 0.1; ctx.stroke();
      });
      for (const d of [-1, 1]) { circulo(ctx, cx + d * s * 0.42, a.y + a.h * 0.95, s * 0.12); ctx.fillStyle = CREME; ctx.fill(); }
      break;
    }
    case 'brilho': {
      const rnd = semente(13);
      for (let k = 0; k < 14; k++) { ctx.fillStyle = `rgba(255,236,190,${0.4 + rnd() * 0.5})`; circulo(ctx, a.x + rnd() * a.w, a.y + rnd() * a.h, 0.8 + rnd() * 1.2); ctx.fill(); }
      const k = 0.85 + 0.15 * Math.sin(t * 4);
      estrela(ctx, cx, cy, s * 0.42 * k, s * 0.1, 8, t * 0.4); ctx.fillStyle = MOSTARDA; ctx.fill();
      estrela(ctx, cx, cy, s * 0.24 * k, s * 0.06, 8, -t * 0.4); ctx.fillStyle = '#fff4cf'; ctx.fill();
      break;
    }
    default: break;
  }
  ctx.restore();
}

/** Disco brilhante saindo pela lateral (platina e diamante). */
function discoPremio(ctx, c, t, diamante) {
  const a = c.arte;
  const R = Math.min(a.w * 0.5, a.h * 0.42);
  const dx = a.x + a.w * 0.68, dy = a.y + a.h * 0.52;
  ctx.save();
  rr(ctx, c.a.x - 20, c.a.y, c.a.w + 40, c.a.h, c.a.raio); ctx.clip();
  circulo(ctx, dx, dy, R);
  const g = ctx.createRadialGradient(dx - R * 0.3, dy - R * 0.3, 1, dx, dy, R);
  if (diamante) { g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#bfe8ff'); g.addColorStop(1, '#6fb3dc'); }
  else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#d9dde3'); g.addColorStop(1, '#8a929e'); }
  ctx.fillStyle = g; ctx.fill(); traco(ctx, TINTA, 1.4);
  ctx.strokeStyle = 'rgba(60,70,80,0.35)'; ctx.lineWidth = 0.8;
  for (const k of [0.85, 0.72, 0.6]) { circulo(ctx, dx, dy, R * k); ctx.stroke(); }
  // reflexo girando
  ctx.beginPath(); ctx.moveTo(dx, dy); ctx.arc(dx, dy, R * 0.96, t * 2, t * 2 + 0.5); ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
  circulo(ctx, dx, dy, R * 0.3); ctx.fillStyle = diamante ? '#3d7ea6' : VERMELHO; ctx.fill(); traco(ctx, TINTA, 1);
  circulo(ctx, dx, dy, R * 0.06); ctx.fillStyle = '#1b1512'; ctx.fill();
  if (diamante) {
    for (let k = 0; k < 3; k++) {
      const u = (t * 0.7 + k / 3) % 1;
      estrela(ctx, dx + Math.cos(k * 2.1) * R * 0.7, dy + Math.sin(k * 2.1) * R * 0.7, 4 + 3 * Math.sin(u * Math.PI), 1.2, 4);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
  }
  ctx.restore();
  texto(ctx, diamante ? 'DIAMANTE' : 'PLATINA', a.x + a.w * 0.32, a.y + a.h * 0.86, Math.min(a.w * 0.15, 11), TINTA, { max: a.w * 0.56 });
}

function capaNormal(ctx, v, r, op) {
  const n = Math.min(11, nivel(v));
  const C = CAPAS[n];
  const t = op.t || 0;
  const c = capa(ctx, r, op, C.fundo, C.faixa, n >= 10 ? '#aab2bd' : '#1b1512');
  if (n >= 10) {
    ctx.save(); rr(ctx, c.arte.x, c.arte.y, c.arte.w, c.arte.h, c.arte.raio); ctx.clip();
    const g = ctx.createLinearGradient(c.arte.x, c.arte.y, c.arte.x + c.arte.w, c.arte.y + c.arte.h);
    g.addColorStop(0, clarear(C.fundo, 0.5)); g.addColorStop(1, escurecer(C.fundo, 0.2));
    ctx.fillStyle = g; ctx.fillRect(c.arte.x, c.arte.y, c.arte.w, c.arte.h);
    ctx.restore();
    discoPremio(ctx, c, t, n >= 11);
  } else arte(ctx, C.arte, c.arte, t, C.fundo);
  bordaCapa(ctx, c, op);
  numero(ctx, c, String(v), n >= 10 ? '#ffffff' : CREME, n >= 10 ? escurecer(C.faixa, 0.4) : TINTA);
  if (n >= 10) {
    // brilho metalico passando
    ctx.save(); rr(ctx, c.a.x, c.a.y, c.a.w, c.a.h, c.a.raio); ctx.clip();
    const u = ((t * 0.45) % 1.8) - 0.4, x = c.a.x + u * c.a.w * 1.6;
    const g = ctx.createLinearGradient(x - c.a.w * 0.3, c.a.y, x + c.a.w * 0.3, c.a.y + c.a.h);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(c.a.x, c.a.y, c.a.w, c.a.h);
    ctx.restore();
  }
  return c;
}

/** Disco lacrado no plastico (gelo): filme brilhante e selo "NOVO". */
function lacre(ctx, c, t) {
  const a = c.a;
  ctx.save();
  rr(ctx, a.x - 1, a.y - 1, a.w + 2, a.h + 2, a.raio + 1); ctx.clip();
  ctx.fillStyle = 'rgba(225,240,255,0.22)'; ctx.fillRect(a.x - 1, a.y - 1, a.w + 2, a.h + 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(a.x + a.w * 0.1, a.y + a.h); ctx.lineTo(a.x + a.w * 0.55, a.y); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a.x + a.w * 0.35, a.y + a.h); ctx.lineTo(a.x + a.w * 0.78, a.y); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(a.x + 3, a.y + a.h * 0.55); ctx.lineTo(a.x + a.w * 0.3, a.y + a.h * 0.6); ctx.lineTo(a.x + a.w * 0.45, a.y + a.h * 0.5); ctx.stroke();
  ctx.restore();
  rr(ctx, a.x - 1, a.y - 1, a.w + 2, a.h + 2, a.raio + 1); traco(ctx, 'rgba(255,255,255,0.8)', 1.2);
  const sx = a.x + a.w * 0.72, sy = c.arte.y + c.arte.h * 0.72, R = Math.min(a.w * 0.2, 14);
  estrela(ctx, sx, sy, R, R * 0.78, 12, t * 0.2); ctx.fillStyle = '#ffd23f'; ctx.fill(); traco(ctx, VERMELHO, 1.2);
  texto(ctx, 'NOVO', sx, sy + 0.5, R * 0.62, VERMELHO, { max: R * 1.5 });
}

function capaPedra(ctx, r, hp) {
  // caco de vinil riscado e quebrado
  const cx = 0, cy = r.y + r.h * 0.55, R = Math.min(r.w * 0.56, r.h * 0.46);
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.95, cy - R * 0.1);
    ctx.lineTo(cx - R * 0.35, cy - R * 0.98); ctx.lineTo(cx + R * 0.1, cy - R * 0.62); ctx.lineTo(cx + R * 0.55, cy - R * 0.88);
    ctx.lineTo(cx + R * 0.98, cy - R * 0.05); ctx.lineTo(cx + R * 0.7, cy + R * 0.72); ctx.lineTo(cx + R * 0.05, cy + R * 0.98);
    ctx.lineTo(cx - R * 0.62, cy + R * 0.76); ctx.closePath();
  };
  ctx.save();
  ctx.shadowColor = 'rgba(40,18,6,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
  forma(); ctx.fillStyle = '#1b1512'; ctx.fill();
  ctx.restore();
  ctx.save(); forma(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 0.8;
  for (let k = 0.95; k > 0.35; k -= 0.08) { circulo(ctx, cx, cy, R * k); ctx.stroke(); }
  circulo(ctx, cx, cy, R * 0.32); ctx.fillStyle = VERMELHO; ctx.fill();
  circulo(ctx, cx, cy, R * 0.05); ctx.fillStyle = '#1b1512'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -2.2, -1.7); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - R * 0.8, cy + R * 0.2); ctx.quadraticCurveTo(cx, cy - R * 0.2, cx + R * 0.85, cy + R * 0.3); ctx.stroke();
  ctx.restore();
  forma(); traco(ctx, '#000', 1.5);
  const perdido = 3 - clamp(hp, 0, 3);
  const rach = [[-0.6, -0.3, -0.2, 0.1, -0.35, 0.6], [0.6, -0.4, 0.25, 0.05, 0.5, 0.55], [-0.1, -0.7, 0.05, -0.35, -0.08, 0.0]];
  ctx.strokeStyle = MOSTARDA; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) { const q = rach[k]; ctx.beginPath(); ctx.moveTo(cx + q[0] * R, cy + q[1] * R); ctx.lineTo(cx + q[2] * R, cy + q[3] * R); ctx.lineTo(cx + q[4] * R, cy + q[5] * R); ctx.stroke(); }
  const py = r.y + r.h * 0.1;
  for (let k = 0; k < 3; k++) { circulo(ctx, (k - 1) * r.w * 0.2, py, Math.max(2.6, r.w * 0.06)); ctx.fillStyle = k < hp ? MOSTARDA : 'rgba(0,0,0,0.45)'; ctx.fill(); traco(ctx, TINTA, 1); }
}

function capaCoringa(ctx, r, op) {
  const t = op.t || 0;
  const c = capa(ctx, r, op, CREME, '#8b5cc7');
  const a = c.arte, cx = a.x + a.w / 2, cy = a.y + a.h / 2, R = Math.min(a.w, a.h) * 0.44;
  for (let k = 0; k < 12; k++) {
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, (k / 12) * TAU + t, ((k + 1) / 12) * TAU + t); ctx.closePath();
    ctx.fillStyle = `hsl(${k * 30}, 80%, 60%)`; ctx.fill();
  }
  circulo(ctx, cx, cy, R); traco(ctx, TINTA, 1.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8;
  for (const k of [0.82, 0.64]) { circulo(ctx, cx, cy, R * k); ctx.stroke(); }
  circulo(ctx, cx, cy, R * 0.26); ctx.fillStyle = CREME; ctx.fill(); traco(ctx, TINTA, 1);
  texto(ctx, '?', cx, cy + 0.5, R * 0.42, '#8b5cc7');
  bordaCapa(ctx, c, op);
  numero(ctx, c, '?');
}

function capaBomba(ctx, r, op) {
  const t = op.t || 0;
  const c = capa(ctx, r, op, '#2b1d16', VERMELHO);
  const a = c.arte, cx = a.x + a.w / 2, cy = a.y + a.h / 2, R = Math.min(a.w, a.h) * 0.34;
  const pulso = 1 + 0.06 * Math.sin(t * 14);
  ctx.save(); rr(ctx, a.x, a.y, a.w, a.h, a.raio); ctx.clip();
  ctx.strokeStyle = MOSTARDA; ctx.lineWidth = 1.8;
  for (let k = 0; k < 8; k++) {
    const ang = (k / 8) * TAU + 0.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * R * 1.2, cy + Math.sin(ang) * R * 1.2);
    ctx.lineTo(cx + Math.cos(ang + 0.12) * R * 1.45, cy + Math.sin(ang + 0.12) * R * 1.45);
    ctx.lineTo(cx + Math.cos(ang - 0.05) * R * 1.7, cy + Math.sin(ang - 0.05) * R * 1.7);
    ctx.stroke();
  }
  ctx.restore();
  circulo(ctx, cx, cy, R * pulso); ctx.fillStyle = '#4a3a30'; ctx.fill(); traco(ctx, '#000', 1.5);
  circulo(ctx, cx, cy, R * 0.72 * pulso);
  const g = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, R * 0.72);
  g.addColorStop(0, '#6b5a50'); g.addColorStop(1, '#1b1512');
  ctx.fillStyle = g; ctx.fill();
  circulo(ctx, cx, cy, R * 0.25); ctx.fillStyle = MOSTARDA; ctx.fill(); traco(ctx, '#000', 1);
  bordaCapa(ctx, c, op);
  numero(ctx, c, '!', '#ffd23f');
}

function capaDobro(ctx, r, op) {
  const c = capa(ctx, r, op, PETROLEO, MOSTARDA);
  const a = c.arte, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
  ctx.save(); rr(ctx, a.x, a.y, a.w, a.h, a.raio); ctx.clip();
  for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; ctx.fillRect(a.x, a.y + (k * a.h) / 4, a.w, a.h / 4); }
  ctx.restore();
  texto(ctx, 'LADO', cx, cy - a.h * 0.16, Math.min(a.w * 0.26, a.h * 0.2), CREME, { contorno: TINTA, espessura: 3, max: a.w - 8 });
  texto(ctx, 'B', cx, cy + a.h * 0.16, Math.min(a.w * 0.5, a.h * 0.38), MOSTARDA, { contorno: TINTA, espessura: 4 });
  bordaCapa(ctx, c, op);
  numero(ctx, c, 'x2');
}

// ------------------------------------------------------------ cenario

/** Lugares fixos do cenario (iguais no fundo e no vivo). */
function lugares(W, H, L) {
  const retrato = !L.fila.vertical;
  const chao = retrato ? L.mesa.y + L.mesa.h + 30 : L.mesa.y + L.mesa.h + 24;
  const fundoFila = retrato ? L.fila.y + L.fila.h : L.mesa.y + L.mesa.h;
  let toca = null;
  if (retrato && H - fundoFila > 130) toca = { x: W - 150, y: H - 120, w: 132, h: 100 };
  else if (!retrato && L.mesa.x > 190) { const w = Math.min(170, L.mesa.x - 36); toca = { x: (L.mesa.x - w) / 2, y: H - 128, w, h: w * 0.64 }; }
  const abajur = retrato ? (H - fundoFila > 130 ? { x: 40, y: H - 150 } : null) : (L.fila.x + L.fila.w + 120 < W ? { x: W - 70, y: H - 210 } : null);
  return { chao: Math.min(chao, H - 40), toca, abajur, globo: { x: W * (retrato ? 0.5 : 0.5), y: L.topo + (retrato ? 30 : 8) }, prateleira: retrato ? { y: L.topo + 66, h: 46 } : { y: L.topo + 30, h: 40 } };
}

function toca(ctx, p, t) {
  // movel
  rr(ctx, p.x, p.y + p.h * 0.35, p.w, p.h * 0.65, 6);
  const g = ctx.createLinearGradient(0, p.y + p.h * 0.35, 0, p.y + p.h); g.addColorStop(0, '#8a5432'); g.addColorStop(1, '#4e2c18');
  ctx.fillStyle = g; ctx.fill(); traco(ctx, TINTA, 1.5);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(p.x + p.w * 0.1, p.y + p.h * 0.55, p.w * 0.8, 2);
  // base do toca-discos
  rr(ctx, p.x + 6, p.y, p.w - 12, p.h * 0.4, 6);
  const gb = ctx.createLinearGradient(0, p.y, 0, p.y + p.h * 0.4); gb.addColorStop(0, '#c48a52'); gb.addColorStop(1, '#8a5a34');
  ctx.fillStyle = gb; ctx.fill(); traco(ctx, TINTA, 1.4);
  // prato e disco girando (em perspectiva)
  const cx = p.x + p.w * 0.42, cy = p.y + p.h * 0.17, rx = p.w * 0.3, ry = p.h * 0.12;
  elipse(ctx, cx, cy + 2, rx + 2, ry + 1.5); ctx.fillStyle = '#3a3f46'; ctx.fill();
  elipse(ctx, cx, cy, rx, ry); ctx.fillStyle = '#1b1512'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.8;
  for (const k of [0.8, 0.6]) { elipse(ctx, cx, cy, rx * k, ry * k); ctx.stroke(); }
  elipse(ctx, cx, cy, rx * 0.3, ry * 0.3); ctx.fillStyle = LARANJA; ctx.fill();
  const ang = t * 3.5;
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; elipse(ctx, cx + Math.cos(ang) * rx * 0.62, cy + Math.sin(ang) * ry * 0.62, 2.4, 1.2); ctx.fill();
  ctx.fillStyle = MOSTARDA; elipse(ctx, cx + Math.cos(ang) * rx * 0.18, cy + Math.sin(ang) * ry * 0.18, 1.6, 0.9); ctx.fill();
  // braco
  const bx = p.x + p.w * 0.86, by = p.y + p.h * 0.08;
  circulo(ctx, bx, by, 5); ctx.fillStyle = '#c9ced6'; ctx.fill(); traco(ctx, TINTA, 1);
  ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 6, by + p.h * 0.18); ctx.lineTo(cx + rx * 0.55, cy + ry * 0.2); ctx.stroke();
  // botoes
  for (const k of [0, 1]) { circulo(ctx, p.x + p.w * 0.82 + k * 10, p.y + p.h * 0.32, 2.6); ctx.fillStyle = k ? LARANJA : MOSTARDA; ctx.fill(); }
  // notinhas saindo
  for (let k = 0; k < 2; k++) {
    const u = (t * 0.45 + k * 0.5) % 1;
    ctx.save(); ctx.globalAlpha = 1 - u;
    nota(ctx, cx - 10 + k * 22 + Math.sin(u * 6) * 6, cy - 14 - u * 40, 7, k ? MOSTARDA : CREME);
    ctx.restore();
  }
}

function nota(ctx, x, y, s, cor) {
  elipse(ctx, x, y, s * 0.55, s * 0.4, -0.4); ctx.fillStyle = cor; ctx.fill();
  ctx.fillRect(x + s * 0.4, y - s * 1.4, s * 0.16, s * 1.4);
  ctx.beginPath(); ctx.moveTo(x + s * 0.56, y - s * 1.4); ctx.quadraticCurveTo(x + s * 1.1, y - s, x + s * 0.9, y - s * 0.6); ctx.strokeStyle = cor; ctx.lineWidth = s * 0.16; ctx.stroke();
}

function globo(ctx, x, y, t) {
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 14); ctx.stroke();
  const R = 13;
  circulo(ctx, x, y, R); ctx.fillStyle = '#9aa3ad'; ctx.fill();
  ctx.save(); circulo(ctx, x, y, R); ctx.clip();
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const b = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3 + j * 2.1);
    ctx.fillStyle = `rgba(255,255,255,${0.15 + b * 0.6})`;
    ctx.fillRect(x + i * 4.2 - 1.8 + ((t * 6) % 4.2), y + j * 4.2 - 1.8, 3.4, 3.4);
  }
  ctx.restore();
  circulo(ctx, x, y, R); traco(ctx, '#2a1a10', 1.2);
  for (let k = 0; k < 4; k++) {
    const u = (t * 0.3 + k * 0.25) % 1;
    const a = k * 1.7 + t * 0.2;
    ctx.fillStyle = `rgba(255,240,200,${0.5 * Math.sin(u * Math.PI)})`;
    estrela(ctx, x + Math.cos(a) * (30 + u * 60), y + Math.sin(a) * (20 + u * 40) + 20, 3, 0.8, 4); ctx.fill();
  }
}

function abajur(ctx, p, t) {
  const g = ctx.createRadialGradient(p.x, p.y + 20, 4, p.x, p.y + 20, 120);
  g.addColorStop(0, `rgba(255,200,120,${0.35 + 0.03 * Math.sin(t * 2)})`); g.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g; ctx.fillRect(p.x - 130, p.y - 100, 260, 260);
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x, p.y + 18); ctx.lineTo(p.x, p.y + 112); ctx.stroke();
  elipse(ctx, p.x, p.y + 114, 18, 5); ctx.fillStyle = MARROM; ctx.fill();
  ctx.beginPath(); ctx.moveTo(p.x - 14, p.y - 8); ctx.lineTo(p.x + 14, p.y - 8); ctx.lineTo(p.x + 26, p.y + 20); ctx.lineTo(p.x - 26, p.y + 20); ctx.closePath();
  const gc = ctx.createLinearGradient(0, p.y - 8, 0, p.y + 20); gc.addColorStop(0, '#ffcf7a'); gc.addColorStop(1, LARANJA);
  ctx.fillStyle = gc; ctx.fill(); traco(ctx, TINTA, 1.4);
  ctx.fillStyle = 'rgba(107,62,38,0.5)'; ctx.fillRect(p.x - 22, p.y + 10, 44, 3);
}

const tema = {
  id: 'discos',
  nome: 'Loja de Discos',
  cores: { texto: CREME, destaque: MOSTARDA, particulas: [LARANJA, MOSTARDA, PETROLEO, CREME] },
  faixas: () => ({ topo: 96, base: 0 }),

  fundo(ctx, W, H, L) {
    const lg = lugares(W, H, L);
    // papel de parede setentista no alto
    ctx.fillStyle = '#f0d9a8'; ctx.fillRect(0, 0, W, H);
    const faixas = [LARANJA, MOSTARDA, MARROM];
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = faixas[k]; ctx.lineWidth = 12;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 6) ctx.lineTo(x, 40 + k * 14 + Math.sin(x / 70) * 10);
      ctx.stroke();
    }
    // lambri do resto da parede
    const yL = lg.prateleira.y - 6;
    const gl = ctx.createLinearGradient(0, yL, 0, lg.chao);
    gl.addColorStop(0, '#7a4a2e'); gl.addColorStop(1, '#5a321e');
    ctx.fillStyle = gl; ctx.fillRect(0, yL, W, lg.chao - yL);
    const rnd = semente(19);
    for (let x = 0; x < W; x += 26) {
      ctx.fillStyle = 'rgba(30,14,6,0.35)'; ctx.fillRect(x, yL, 2, lg.chao - yL);
      ctx.fillStyle = 'rgba(255,220,180,0.06)'; ctx.fillRect(x + 2, yL, 1, lg.chao - yL);
      ctx.strokeStyle = 'rgba(30,14,6,0.18)'; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) { const xx = x + 6 + rnd() * 14; ctx.beginPath(); ctx.moveTo(xx, yL); ctx.bezierCurveTo(xx + 3, yL + 80, xx - 3, lg.chao - 80, xx + 2, lg.chao); ctx.stroke(); }
    }
    // prateleira com lombadas
    const pr = lg.prateleira;
    for (let x = 6; x < W - 6;) {
      const w = 3 + rnd() * 5, h = pr.h * (0.78 + rnd() * 0.22);
      if (rnd() < 0.08) { x += 10; continue; }
      ctx.fillStyle = [LARANJA, MOSTARDA, PETROLEO, OLIVA, VERMELHO, CREME, '#3b2a4a', MARROM][Math.floor(rnd() * 8)];
      ctx.fillRect(x, pr.y + pr.h - h, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + w - 1, pr.y + pr.h - h, 1, h);
      x += w + 0.6;
    }
    rr(ctx, 0, pr.y + pr.h, W, 9, 2); ctx.fillStyle = '#4a2a16'; ctx.fill();
    ctx.fillStyle = 'rgba(255,220,180,0.15)'; ctx.fillRect(0, pr.y + pr.h, W, 2);
    // posteres abstratos (no espaco entre a prateleira e a mesa)
    const espaco = L.mesa.y - (pr.y + pr.h + 9);
    if (espaco > 70) {
      const ph = Math.min(espaco - 20, 110), pw = ph * 0.72, py = pr.y + pr.h + 9 + (espaco - ph) / 2;
      const poster = (px, k) => {
        ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate(k ? 0.04 : -0.05);
        rr(ctx, -pw / 2, -ph / 2, pw, ph, 3); ctx.fillStyle = k ? PETROLEO : CREME; ctx.fill(); traco(ctx, TINTA, 1.2);
        ctx.save(); rr(ctx, -pw / 2, -ph / 2, pw, ph, 3); ctx.clip();
        if (k) { for (let j = 0; j < 4; j++) { circulo(ctx, 0, ph * 0.3, pw * (0.9 - j * 0.2)); ctx.fillStyle = [LARANJA, MOSTARDA, CREME, VERMELHO][j]; ctx.fill(); } }
        else { for (let j = 0; j < 5; j++) { ctx.fillStyle = [VERMELHO, LARANJA, MOSTARDA, OLIVA, PETROLEO][j]; ctx.fillRect(-pw / 2, -ph / 2 + ph * 0.3 + j * ph * 0.1, pw, ph * 0.1); } circulo(ctx, 0, -ph * 0.22, pw * 0.2); ctx.fillStyle = LARANJA; ctx.fill(); }
        ctx.restore();
        ctx.fillStyle = '#c9ced6'; circulo(ctx, 0, -ph / 2 + 4, 2); ctx.fill();
        ctx.restore();
      };
      poster(Math.max(10, L.mesa.x - pw - 4), 0);
      poster(Math.min(W - pw - 10, L.mesa.x + L.mesa.w + 4), 1);
    }
    // carpete felpudo laranja
    const gc = ctx.createLinearGradient(0, lg.chao, 0, H);
    gc.addColorStop(0, '#d9701e'); gc.addColorStop(1, '#a8501a');
    ctx.fillStyle = gc; ctx.fillRect(0, lg.chao, W, H - lg.chao);
    ctx.fillStyle = '#3a2214'; ctx.fillRect(0, lg.chao - 6, W, 8);
    ctx.lineCap = 'round';
    for (let i = 0; i < Math.round((W * (H - lg.chao)) / 90); i++) {
      const x = rnd() * W, y = lg.chao + 6 + rnd() * (H - lg.chao);
      ctx.strokeStyle = rnd() < 0.5 ? 'rgba(255,190,110,0.35)' : 'rgba(120,50,10,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 4, y - 4 - rnd() * 3); ctx.stroke();
    }
    // vinheta quente
    const gv = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.75);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(40,16,4,0.4)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
  },

  vivo(ctx, W, H, t, e, mem) {
    const L = mem.L;
    if (!L) return;
    const lg = lugares(W, H, L);
    if (lg.abajur) abajur(ctx, lg.abajur, t);
    if (lg.toca) toca(ctx, lg.toca, t);
    globo(ctx, lg.globo.x, lg.globo.y, t);
  },

  mesa(ctx, L, e, t, mem) {
    mem.L = L; mem.W = L.W;
    // balcao de madeira com quinas de latao
    const s = L.mesa;
    ctx.save();
    ctx.shadowColor = 'rgba(30,12,4,0.55)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    const g = ctx.createLinearGradient(0, s.y, 0, s.y + s.h); g.addColorStop(0, '#b07444'); g.addColorStop(1, '#7a4a2a');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,18,6,0.25)'; ctx.lineWidth = 1.5;
    for (let k = 1; k < 5; k++) { const y = s.y + (k * s.h) / 5; ctx.beginPath(); ctx.moveTo(s.x + 4, y); ctx.lineTo(s.x + s.w - 4, y); ctx.stroke(); }
    rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 7); traco(ctx, 'rgba(255,220,170,0.25)', 1);
    rr(ctx, s.x, s.y, s.w, s.h, 10); traco(ctx, TINTA, 2);
    for (const [cx, cy] of [[s.x + 6, s.y + 6], [s.x + s.w - 6, s.y + 6], [s.x + 6, s.y + s.h - 6], [s.x + s.w - 6, s.y + s.h - 6]]) {
      circulo(ctx, cx, cy, 4); ctx.fillStyle = MOSTARDA; ctx.fill(); traco(ctx, TINTA, 1);
    }
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const r = L.carta(c, 0);
      rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 6);
      ctx.setLineDash([5, 4]); traco(ctx, 'rgba(246,231,200,0.5)', 1.5); ctx.setLineDash([]);
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      circulo(ctx, cx, cy, r.w * 0.26); ctx.fillStyle = 'rgba(27,21,18,0.35)'; ctx.fill();
      circulo(ctx, cx, cy, r.w * 0.08); ctx.fillStyle = 'rgba(242,140,40,0.5)'; ctx.fill();
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') capaPedra(ctx, r, carta.hp);
    else if (carta.tipo === 'coringa') capaCoringa(ctx, r, op);
    else if (carta.tipo === 'bomba') capaBomba(ctx, r, op);
    else if (carta.tipo === 'dobro') capaDobro(ctx, r, op);
    else {
      const c = capaNormal(ctx, carta.v, r, op);
      if (carta.gelo) lacre(ctx, c, op.t || 0);
    }
    if (op.fila && !op.frente) { rr(ctx, r.x, r.y + r.h * 0.07, r.w, r.h * 0.93, Math.max(3, r.w * 0.06)); ctx.fillStyle = 'rgba(40,18,6,0.32)'; ctx.fill(); }
  },

  cadeado(ctx, a) {
    // vitrine de vidro trancada
    const x = a.x - 4, y = a.y - 10, w = a.w + 8, h = a.h + 14;
    ctx.save();
    rr(ctx, x, y, w, h, 6); ctx.fillStyle = 'rgba(180,220,235,0.3)'; ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x - 10, y + h * 0.5); ctx.lineTo(x + w * 0.7, y - 10); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + h * 0.75); ctx.lineTo(x + w + 10, y + h * 0.1); ctx.stroke();
    ctx.restore();
    rr(ctx, x, y, w, h, 6); traco(ctx, '#c9ced6', 3);
    rr(ctx, x, y, w, h, 6); traco(ctx, TINTA, 1);
    // placa RARIDADE
    rr(ctx, x + 2, y - 4, w - 4, 16, 4); ctx.fillStyle = MOSTARDA; ctx.fill(); traco(ctx, TINTA, 1.2);
    texto(ctx, 'RARIDADE', x + w / 2, y + 4.5, 9.5, TINTA, { max: w - 10 });
    // fechadura
    const cx = x + w / 2, cy = y + h / 2;
    ctx.strokeStyle = '#c9ced6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy - 5, 7, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 10, cy - 5, 20, 16, 4); ctx.fillStyle = MOSTARDA; ctx.fill(); traco(ctx, TINTA, 1.4);
    ctx.fillStyle = TINTA; circulo(ctx, cx, cy + 1, 2.2); ctx.fill(); ctx.fillRect(cx - 1, cy + 1, 2, 5);
    ctx.restore();
  },

  descarte(ctx, r, e, t) {
    // caixa de papelao de "usados"
    const carga = e.descarteCarga > 0;
    const x = r.x - 3, y = r.y + r.h * 0.18, w = r.w + 6, h = r.h * 0.84;
    ctx.save();
    ctx.globalAlpha = carga ? 1 : 0.65;
    // abas
    ctx.fillStyle = '#b98552';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y - 12); ctx.lineTo(x + w * 0.45, y - 8); ctx.lineTo(x + w * 0.45, y); ctx.closePath(); ctx.fill(); traco(ctx, TINTA, 1.2);
    ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + 6, y - 12); ctx.lineTo(x + w * 0.55, y - 8); ctx.lineTo(x + w * 0.55, y); ctx.closePath(); ctx.fill(); traco(ctx, TINTA, 1.2);
    rr(ctx, x, y, w, h, 3);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#c99560'); g.addColorStop(1, '#9a6a3c');
    ctx.fillStyle = g; ctx.fill(); traco(ctx, TINTA, 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + w * 0.46, y, w * 0.08, h * 0.35);
    ctx.save(); ctx.translate(x + w / 2, y + h * 0.62); ctx.rotate(-0.06);
    rr(ctx, -w * 0.42, -9, w * 0.84, 18, 3); ctx.fillStyle = CREME; ctx.fill(); traco(ctx, TINTA, 1);
    texto(ctx, carga ? 'USADOS' : 'cheia', 0, 0.5, Math.min(11, w * 0.16), carga ? VERMELHO : '#8a7a60', { max: w * 0.78 });
    ctx.restore();
    ctx.restore();
  },

  fila(ctx, L) {
    // caixote de madeira do garimpo
    const f = L.fila;
    let x, y, w, h;
    if (f.vertical) { x = f.x - 4; y = f.y - 6; w = f.w + 8; h = f.h + 12; }
    else {
      const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
      x = Math.min(p0.x, p2.x) - 16; w = Math.max(p0.x + p0.w, p2.x + p2.w) + 16 - x;
      y = p0.y + p0.h * 0.35; h = p0.h * 0.75;
    }
    ctx.save();
    ctx.shadowColor = 'rgba(30,12,4,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
    rr(ctx, x, y, w, h, 4); ctx.fillStyle = '#5a321e'; ctx.fill();
    ctx.restore();
    // lombadas de outros discos la dentro
    if (!f.vertical) {
      const rnd = semente(5);
      for (let xx = x + 6; xx < x + w - 8; xx += 5) { ctx.fillStyle = [LARANJA, MOSTARDA, PETROLEO, OLIVA, CREME][Math.floor(rnd() * 5)]; ctx.fillRect(xx, y - 6 - rnd() * 6, 4, 14); }
    }
    // ripas da frente (por baixo das capas: as capas ficam "dentro")
    const ripas = f.vertical ? 6 : 3;
    for (let k = 0; k < ripas; k++) {
      const ry = f.vertical ? y + (k * h) / ripas : y + h * 0.35 + (k * h * 0.65) / ripas;
      const rh = f.vertical ? h / ripas - 3 : (h * 0.65) / ripas - 3;
      rr(ctx, x, ry, w, rh, 2);
      const g = ctx.createLinearGradient(0, ry, 0, ry + rh); g.addColorStop(0, '#c48a52'); g.addColorStop(1, '#8a5a34');
      ctx.fillStyle = g; ctx.fill(); traco(ctx, TINTA, 1);
    }
    const p0 = L.filaPos(0);
    if (!f.vertical) texto(ctx, 'garimpo ▸', p0.x + p0.w / 2, p0.y - 10, 12, CREME, { contorno: TINTA, espessura: 3 });
    else texto(ctx, 'garimpo', x + w / 2, y - 9, 12, CREME, { contorno: TINTA, espessura: 3 });
  },

  hud(ctx, W, H, L, e, t, mem) {
    mem.W = W;
    const x = 10, y = 10, w = W - 20, h = 76;
    ctx.save();
    ctx.shadowColor = 'rgba(30,12,4,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = CREME; ctx.fill();
    ctx.restore();
    // listras arredondadas
    ctx.save(); rr(ctx, x, y, w, h, h / 2); ctx.clip();
    [LARANJA, MOSTARDA, MARROM].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(x, y + h - 14 + k * 5 - 5, w, 5); });
    ctx.restore();
    rr(ctx, x, y, w, h, h / 2); traco(ctx, TINTA, 2.5);
    // faixa (fase) num disquinho
    const mx = x + 38, my = y + h / 2 - 3;
    circulo(ctx, mx, my, 27); ctx.fillStyle = '#1b1512'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.8;
    for (const k of [0.85, 0.7]) { circulo(ctx, mx, my, 27 * k); ctx.stroke(); }
    circulo(ctx, mx, my, 15); ctx.fillStyle = LARANJA; ctx.fill();
    texto(ctx, 'faixa', mx, my - 18, 8.5, CREME);
    texto(ctx, String(e.faseId), mx, my + 1, 15, CREME, { contorno: TINTA, espessura: 3 });
    // metas
    const tx = x + 74, tw = w - 74 - 100;
    e.metas.forEach((m, k) => {
      const yy = y + 10 + k * 25;
      texto(ctx, textoMeta(m, { monte: (n) => `Ganhe ${n} disco${n > 1 ? 's' : ''} de platina` }), tx, yy + 5, 12, TINTA, { alinhar: 'left', max: tw });
      rr(ctx, tx, yy + 12, tw, 7, 3.5); ctx.fillStyle = 'rgba(107,62,38,0.25)'; ctx.fill();
      rr(ctx, tx, yy + 12, Math.max(7, tw * Math.min(1, m.atual / m.alvo)), 7, 3.5); ctx.fillStyle = m.feita ? PETROLEO : LARANJA; ctx.fill();
    });
    // pontos
    const px = x + w - 52;
    nota(ctx, px - 4, y + 26, 10, MARROM);
    texto(ctx, String(e.pontos), px, y + 46, 17, TINTA, { max: 90 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      const fy = y + h + 22;
      ctx.save(); ctx.translate(W / 2, fy); ctx.rotate(Math.sin(t * 6) * 0.04);
      texto(ctx, 'DISCO FEVER x2', 0, 0, 26 + k * 3, MOSTARDA, { contorno: TINTA, espessura: 6 });
      texto(ctx, 'DISCO FEVER x2', 0, -2, 26 + k * 3, `hsl(${(t * 120) % 360}, 85%, 62%)`);
      ctx.restore();
    }
  },

  efeito(fx, P, mem) {
    if (!P.formas.notaDc) {
      P.formas.notaDc = (ctx, p) => nota(ctx, 0, 0, p.tam, p.cor);
      P.formas.cacoDc = (ctx, p) => {
        const s = p.tam / 2;
        ctx.beginPath(); ctx.moveTo(-s, -s * 0.2); ctx.lineTo(s * 0.4, -s); ctx.lineTo(s, s * 0.5); ctx.lineTo(-s * 0.3, s); ctx.closePath();
        ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.8; ctx.stroke();
      };
      P.formas.discoDc = (ctx, p) => {
        circulo(ctx, 0, 0, p.tam / 2); ctx.fillStyle = '#dfe3e8'; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.2; ctx.stroke();
        circulo(ctx, 0, 0, p.tam * 0.36); ctx.strokeStyle = 'rgba(80,90,100,0.4)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, p.tam * 0.48, 0, 0.6); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
        circulo(ctx, 0, 0, p.tam * 0.15); ctx.fillStyle = VERMELHO; ctx.fill();
      };
    }
    const tx = clamp(fx.x, 90, (mem.W || 390) - 90);
    switch (fx.tipo) {
      case 'pouso':
        P.subir(fx.x, fx.y - 10, [CREME, MOSTARDA], 2, { forma: 'notaDc', tam: 7, vida: 0.7, larg: 24, forca: 0.7 });
        P.anel(fx.x, fx.y, CREME, 22, 0.3);
        return true;
      case 'fusao': {
        const cor = capaDe(fx.valor).faixa;
        P.subir(fx.x, fx.y - 8, [MOSTARDA, LARANJA, PETROLEO, CREME], 2 + fx.degrau * 2, { forma: 'notaDc', tam: 8 + fx.degrau, vida: 1.0, larg: 40, forca: 0.8 + fx.degrau * 0.15 });
        P.estourar(fx.x, fx.y, ['#fff4cf', MOSTARDA, cor], 7 + fx.degrau * 3, 0.7 + fx.degrau * 0.12, { forma: 'estrela', tam: 9, g: 260 });
        P.anel(fx.x, fx.y, LARANJA, 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, 'x' + fx.degrau, MOSTARDA, 22 + fx.degrau * 2, TINTA);
        return true;
      }
      case 'completar':
        P.add({ x: fx.x, y: fx.y, vx: 0, vy: -150, g: 60, arrasto: 1, vida: 1.3, tam: 46, forma: 'discoDc', vr: 9 });
        P.estourar(fx.x, fx.y, ['#ffffff', '#dfe3e8', MOSTARDA, LARANJA], 36, 1.6, { forma: 'estrela', tam: 10, g: 300, vida: 1.0 });
        P.subir(fx.x, fx.y, [MOSTARDA, CREME, PETROLEO], 8, { forma: 'notaDc', tam: 10, vida: 1.3, larg: 60, forca: 1.2 });
        P.texto(tx, fx.y - 44, 'Platina!', '#ffffff', 30, MARROM);
        return true;
      case 'explodir':
        P.anel(fx.x, fx.y, MOSTARDA, 40, 0.4); P.anel(fx.x, fx.y, LARANJA, 64, 0.55);
        P.estourar(fx.x, fx.y, ['#ffd23f', LARANJA, '#fff4cf'], 20, 1.3, { forma: 'estrela', tam: 8 });
        P.texto(tx, fx.y - 28, 'BUUM!', '#ffd23f', 22, TINTA);
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#1b1512', '#3a2e28', VERMELHO], 16, 1.1, { forma: 'cacoDc', tam: 10 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#1b1512', '#3a2e28'], 6, 0.6, { forma: 'cacoDc', tam: 7 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['rgba(230,245,255,0.9)', 'rgba(255,255,255,0.9)', '#ffd23f'], 14, 0.8, { forma: 'cacoDc', tam: 9, g: 260 });
        P.texto(tx, fx.y - 20, 'Deslacrado!', CREME, 16, TINTA);
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#c9ced6', MOSTARDA, '#ffffff'], 14, 0.9, { forma: 'q', tam: 6 });
        P.texto(tx, fx.y - 20, 'Vitrine aberta!', MOSTARDA, 18, TINTA);
        return true;
      case 'combo':
        P.texto(tx, fx.y - 44, `Combo x${fx.n}!`, LARANJA, 22 + Math.min(8, fx.n * 2), TINTA);
        return true;
      default: return false;
    }
  },
};

export default tema;
