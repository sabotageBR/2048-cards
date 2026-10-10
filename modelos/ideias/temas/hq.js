// Ideia 12: HQ Pop-Art. Cada carta e um quadrinho com reticula (pontos
// Ben-Day), contorno preto grosso e o numero em letreiro de HQ na legenda de
// cima. Fusao = onomatopeia (POW, BAM, ZAP, WHAM; KA-BOOM no degrau >= 3);
// o 2048 e a pagina de abertura dourada "SUPER". Geometria padrao de cartas.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, estrela, nivel, textoMeta, semente, clamp } from '../kit.js';

const PRETO = '#111111';
const PAPEL = '#fff8e7';
const AMARELO = '#ffe14d';
const CIANO = '#22c7f2';
const MAGENTA = '#ff3d8b';
const VERMELHO = '#ff3b30';
const CORES = ['#ffd21f', CIANO, MAGENTA, VERMELHO, '#2f6bff', '#2fcf5a', '#ff8a1f', '#9b4dff', '#00b3a4', '#d6246e', '#f5b300', '#b9a6ff'];
const EMBLEMAS = ['estrela', 'raio', 'punho', 'escudo', 'mascara', 'foguete', 'atomo', 'chama', 'diamante', 'planeta', 'coroa', 'coroa'];
const PALAVRAS = ['POW!', 'BAM!', 'ZAP!', 'WHAM!'];

// ------------------------------------------------------------ reticula (cache)

const cache = new Map();
/** Painel de reticula: fundo na cor e pontos mais escuros que crescem para baixo. */
function reticula(ctx, x, y, w, h, cor, op = {}) {
  const k = `${Math.round(w)}x${Math.round(h)}:${cor}:${op.claro ? 1 : 0}`;
  let c = cache.get(k);
  if (!c) {
    if (cache.size > 400) cache.clear();
    c = document.createElement('canvas');
    const E = 2;
    c.width = Math.max(1, Math.ceil(w * E)); c.height = Math.max(1, Math.ceil(h * E));
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    g.scale(E, E);
    g.fillStyle = op.claro ? clarear(cor, 0.55) : cor; g.fillRect(0, 0, w, h);
    const s = Math.max(4.5, Math.min(12, w * 0.12));
    g.fillStyle = op.claro ? clarear(cor, 0.25) : escurecer(cor, 0.2);
    let linha = 0;
    for (let yy = s * 0.4; yy < h + s; yy += s * 0.86, linha++) {
      const raio = s * (0.1 + 0.3 * clamp(yy / h));
      for (let xx = linha % 2 ? s / 2 : 0; xx < w + s; xx += s) { circulo(g, xx, yy, raio); g.fill(); }
    }
    cache.set(k, c);
  }
  ctx.drawImage(c, x, y, w, h);
}

// ------------------------------------------------------------ desenho base

function traco(ctx, s) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, s * 0.14); ctx.strokeStyle = PRETO; ctx.stroke(); }

/** Explosao serrilhada (balao de onomatopeia). */
function explosao(ctx, x, y, rx, ry, pontas = 13, var0 = 0) {
  ctx.beginPath();
  for (let i = 0; i < pontas * 2; i++) {
    const a = (i / (pontas * 2)) * TAU - Math.PI / 2;
    const k = i % 2 ? 0.7 : 1 + 0.12 * Math.sin(i * 1.9 + var0);
    ctx.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k);
  }
  ctx.closePath();
}

/** Painel de HQ com contorno grosso e sombra deslocada. */
function quadro(ctx, x, y, w, h, fundo) {
  ctx.fillStyle = PRETO; ctx.fillRect(x + 4, y + 4, w, h);
  if (typeof fundo === 'function') { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); fundo(); ctx.restore(); }
  else { ctx.fillStyle = fundo; ctx.fillRect(x, y, w, h); }
  ctx.lineWidth = 3.5; ctx.strokeStyle = PRETO; ctx.strokeRect(x, y, w, h);
}

/** Caixa de legenda amarela. */
function legenda(ctx, x, y, w, h, txt, tam, op = {}) {
  ctx.fillStyle = PRETO; ctx.fillRect(x + 3, y + 3, w, h);
  ctx.fillStyle = op.cor || AMARELO; ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 2.5; ctx.strokeStyle = PRETO; ctx.strokeRect(x, y, w, h);
  if (txt) texto(ctx, txt, x + w / 2, y + h / 2 + 1, tam, PRETO, { max: w - 8 });
}

/** Numero em letreiro de HQ: inclinado, contorno preto e sombra deslocada. */
function letreiro(ctx, txt, x, y, tam, cor, max) {
  ctx.save();
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.16, 1, 0, 0);
  const esp = Math.max(3, tam * 0.24);
  texto(ctx, txt, tam * 0.07, tam * 0.08, tam, PRETO, { contorno: PRETO, espessura: esp, max });
  texto(ctx, txt, 0, 0, tam, cor, { contorno: PRETO, espessura: esp, max });
  ctx.restore();
}

/** Emblemas de heroi (proprios, genericos), brancos com contorno preto. */
function emblema(ctx, tipo, x, y, s, cor = '#ffffff') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = cor;
  switch (tipo) {
    case 'estrela': estrela(ctx, 0, 0, s, s * 0.46); ctx.fill(); traco(ctx, s); break;
    case 'raio':
      ctx.beginPath(); ctx.moveTo(s * 0.25, -s); ctx.lineTo(-s * 0.55, s * 0.12); ctx.lineTo(-s * 0.02, s * 0.12); ctx.lineTo(-s * 0.3, s); ctx.lineTo(s * 0.58, -s * 0.2); ctx.lineTo(s * 0.06, -s * 0.2); ctx.closePath();
      ctx.fill(); traco(ctx, s); break;
    case 'punho':
      rr(ctx, -s * 0.62, -s * 0.35, s * 1.24, s * 1.05, s * 0.3); ctx.fill(); traco(ctx, s);
      for (let k = 0; k < 4; k++) { rr(ctx, -s * 0.62 + k * s * 0.31, -s * 0.72, s * 0.31, s * 0.5, s * 0.14); ctx.fill(); traco(ctx, s * 0.8); }
      ctx.beginPath(); ctx.moveTo(-s * 0.62, s * 0.05); ctx.quadraticCurveTo(-s * 0.1, -s * 0.05, s * 0.2, s * 0.25); traco(ctx, s * 0.8);
      ctx.fillStyle = '#ffd21f'; ctx.fillRect(-s * 0.56, s * 0.5, s * 1.12, s * 0.16);
      break;
    case 'escudo':
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.85, -s * 0.62); ctx.quadraticCurveTo(s * 0.8, s * 0.55, 0, s); ctx.quadraticCurveTo(-s * 0.8, s * 0.55, -s * 0.85, -s * 0.62); ctx.closePath();
      ctx.fill(); traco(ctx, s);
      estrela(ctx, 0, -s * 0.05, s * 0.42, s * 0.19); ctx.fillStyle = VERMELHO; ctx.fill(); traco(ctx, s * 0.5);
      break;
    case 'mascara':
      ctx.beginPath(); ctx.moveTo(-s, -s * 0.25);
      ctx.quadraticCurveTo(-s * 0.5, -s * 0.62, 0, -s * 0.22); ctx.quadraticCurveTo(s * 0.5, -s * 0.62, s, -s * 0.25);
      ctx.quadraticCurveTo(s * 0.95, s * 0.45, s * 0.35, s * 0.42); ctx.quadraticCurveTo(0, s * 0.12, -s * 0.35, s * 0.42);
      ctx.quadraticCurveTo(-s * 0.95, s * 0.45, -s, -s * 0.25); ctx.closePath();
      ctx.fill(); traco(ctx, s);
      ctx.fillStyle = PRETO;
      for (const sx of [-1, 1]) { elipse(ctx, sx * s * 0.45, s * 0.02, s * 0.22, s * 0.14, sx * 0.25); ctx.fill(); }
      break;
    case 'foguete':
      ctx.rotate(0.6);
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.5, -s * 0.4, s * 0.38, s * 0.55); ctx.lineTo(-s * 0.38, s * 0.55); ctx.quadraticCurveTo(-s * 0.5, -s * 0.4, 0, -s); ctx.closePath();
      ctx.fill(); traco(ctx, s);
      ctx.fillStyle = VERMELHO;
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * s * 0.36, s * 0.1); ctx.lineTo(sx * s * 0.7, s * 0.75); ctx.lineTo(sx * s * 0.3, s * 0.55); ctx.closePath(); ctx.fill(); traco(ctx, s * 0.7); }
      circulo(ctx, 0, -s * 0.28, s * 0.2); ctx.fillStyle = CIANO; ctx.fill(); traco(ctx, s * 0.6);
      ctx.beginPath(); ctx.moveTo(-s * 0.22, s * 0.6); ctx.lineTo(0, s * 1.05); ctx.lineTo(s * 0.22, s * 0.6); ctx.closePath(); ctx.fillStyle = '#ff8a1f'; ctx.fill(); traco(ctx, s * 0.6);
      break;
    case 'atomo':
      ctx.lineWidth = Math.max(2, s * 0.16); ctx.strokeStyle = PRETO;
      for (let k = 0; k < 3; k++) { elipse(ctx, 0, 0, s, s * 0.36, (k * Math.PI) / 3); ctx.stroke(); }
      ctx.lineWidth = Math.max(1, s * 0.07); ctx.strokeStyle = cor;
      for (let k = 0; k < 3; k++) { elipse(ctx, 0, 0, s, s * 0.36, (k * Math.PI) / 3); ctx.stroke(); }
      circulo(ctx, 0, 0, s * 0.24); ctx.fillStyle = VERMELHO; ctx.fill(); traco(ctx, s * 0.6);
      break;
    case 'chama':
      ctx.beginPath(); ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.5, -s * 0.45, s * 0.85, s * 0.05, s * 0.55, s * 0.6);
      ctx.quadraticCurveTo(0, s * 1.05, -s * 0.55, s * 0.6);
      ctx.bezierCurveTo(-s * 0.85, s * 0.1, -s * 0.2, -s * 0.2, 0, -s);
      ctx.fill(); traco(ctx, s);
      ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.quadraticCurveTo(s * 0.35, s * 0.25, 0, s * 0.62); ctx.quadraticCurveTo(-s * 0.35, s * 0.25, 0, -s * 0.2);
      ctx.fillStyle = '#ffd21f'; ctx.fill();
      break;
    case 'diamante':
      ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.6); ctx.lineTo(s * 0.5, -s * 0.6); ctx.lineTo(s * 0.95, -s * 0.15); ctx.lineTo(0, s); ctx.lineTo(-s * 0.95, -s * 0.15); ctx.closePath();
      ctx.fill(); traco(ctx, s);
      ctx.beginPath(); ctx.moveTo(-s * 0.95, -s * 0.15); ctx.lineTo(s * 0.95, -s * 0.15); ctx.moveTo(-s * 0.22, -s * 0.6); ctx.lineTo(-s * 0.4, -s * 0.15); ctx.lineTo(0, s); ctx.lineTo(s * 0.4, -s * 0.15); ctx.lineTo(s * 0.22, -s * 0.6);
      traco(ctx, s * 0.6);
      break;
    case 'planeta':
      circulo(ctx, 0, 0, s * 0.62); ctx.fill(); traco(ctx, s);
      ctx.save(); circulo(ctx, 0, 0, s * 0.62); ctx.clip(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-s, s * 0.05, s * 2, s * 0.2); ctx.restore();
      elipse(ctx, 0, 0, s * 1.05, s * 0.3, -0.35); ctx.lineWidth = Math.max(2, s * 0.18); ctx.strokeStyle = PRETO; ctx.stroke();
      elipse(ctx, 0, 0, s * 1.05, s * 0.3, -0.35); ctx.lineWidth = Math.max(1, s * 0.08); ctx.strokeStyle = '#ffd21f'; ctx.stroke();
      break;
    case 'coroa':
      ctx.beginPath(); ctx.moveTo(-s * 0.9, s * 0.55); ctx.lineTo(-s * 0.95, -s * 0.5); ctx.lineTo(-s * 0.45, -s * 0.05); ctx.lineTo(0, -s * 0.8); ctx.lineTo(s * 0.45, -s * 0.05); ctx.lineTo(s * 0.95, -s * 0.5); ctx.lineTo(s * 0.9, s * 0.55); ctx.closePath();
      ctx.fill(); traco(ctx, s);
      for (const [jx, jc] of [[-s * 0.5, VERMELHO], [0, CIANO], [s * 0.5, MAGENTA]]) { circulo(ctx, jx, s * 0.25, s * 0.13); ctx.fillStyle = jc; ctx.fill(); traco(ctx, s * 0.4); }
      break;
    default: break;
  }
  ctx.restore();
}

// ------------------------------------------------------------ cartas

/** Moldura comum: papel, corpo com fundo, faixa de legenda em cima. Devolve o corpo. */
function moldura(ctx, r, corpo, op) {
  const lw = Math.max(2.4, r.w * 0.05);
  const fx = r.h * 0.3;
  rr(ctx, r.x + 3, r.y + 3, r.w, r.h, 4); ctx.fillStyle = PRETO; ctx.fill();
  rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.fillStyle = PAPEL; ctx.fill();
  const b = { x: r.x + lw * 0.9, y: r.y + fx, w: r.w - lw * 1.8, h: r.h - fx - lw * 0.9 };
  ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip(); corpo(b); ctx.restore();
  ctx.beginPath(); ctx.moveTo(r.x, b.y); ctx.lineTo(r.x + r.w, b.y); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = PRETO; ctx.stroke();
  return { b, fx, lw };
}
function fecharMoldura(ctx, r, lw, op) {
  rr(ctx, r.x, r.y, r.w, r.h, 4); ctx.lineWidth = lw; ctx.strokeStyle = PRETO; ctx.stroke();
  if (op && op.destaque) {
    rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 7);
    ctx.lineWidth = 3; ctx.strokeStyle = `rgba(255,225,77,${op.destaque + 0.2})`; ctx.stroke();
  }
}

function linhasVelocidade(ctx, cx, cy, raio, n, cor, larg = 1.4, fase = 0) {
  ctx.strokeStyle = cor; ctx.lineWidth = larg;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + fase;
    const r0 = raio * (0.25 + 0.15 * ((i * 7) % 3));
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * raio * 2, cy + Math.sin(a) * raio * 2); ctx.stroke();
  }
}

function cartaNormal(ctx, v, r, op) {
  const n = Math.min(11, nivel(v));
  const cor = CORES[n];
  const t = op.t || 0;
  const { b, fx, lw } = moldura(ctx, r, (b) => {
    if (n === 11) {
      const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      for (let k = 0; k <= 5; k++) g.addColorStop(k / 5, `hsl(${(t * 80 + k * 60) % 360},90%,68%)`);
      ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
      reticula(ctx, b.x, b.y, b.w, b.h, '#ffffff', { claro: true });
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.globalCompositeOperation = 'source-over';
    } else if (n === 10) {
      const g = ctx.createRadialGradient(0, b.y + b.h * 0.55, 2, 0, b.y + b.h * 0.55, b.w);
      g.addColorStop(0, '#fff3a6'); g.addColorStop(1, '#f2a900');
      ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
      linhasVelocidade(ctx, 0, b.y + b.h * 0.55, b.w * 0.5, 18, 'rgba(255,255,255,0.85)', 1.6, t * 0.6);
    } else reticula(ctx, b.x, b.y, b.w, b.h, cor);
  });
  const s = Math.min(b.w, b.h) * 0.3;
  if (n >= 10) {
    emblema(ctx, 'coroa', 0, b.y + b.h * 0.6, s * 1.05, '#ffe14d');
    texto(ctx, n === 11 ? 'ESPECIAL' : 'SUPER', 0, b.y + b.h * 0.2, Math.min(b.h * 0.2, b.w * 0.22), '#ffffff', { contorno: PRETO, espessura: 3, max: b.w - 6 });
  } else emblema(ctx, EMBLEMAS[n], 0, b.y + b.h * 0.52, s);
  // legenda: o numero
  const tam = Math.min(fx * 0.88, r.w * 0.46);
  letreiro(ctx, String(v), -1, r.y + fx * 0.53, tam, n >= 10 ? '#ffd21f' : cor, r.w - 10);
  if (op.gelo) gelo(ctx, r, b, fx);
  fecharMoldura(ctx, r, lw, op);
}

function gelo(ctx, r, b, fx) {
  ctx.save();
  ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
  ctx.globalAlpha = 0.78; reticula(ctx, b.x, b.y, b.w, b.h, '#9feaff'); ctx.globalAlpha = 1;
  // cristais
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.strokeStyle = '#1a7fd1'; ctx.lineWidth = 1.5;
  for (const [dx, h0, a] of [[-0.3, 0.55, -0.2], [0.05, 0.75, 0.1], [0.3, 0.5, 0.3]]) {
    ctx.save(); ctx.translate(dx * b.w, b.y + b.h); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-b.w * 0.09, 0); ctx.lineTo(0, -b.h * h0); ctx.lineTo(b.w * 0.09, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  // pingentes na linha da legenda
  ctx.fillStyle = '#e8fbff'; ctx.strokeStyle = '#1a7fd1'; ctx.lineWidth = 1.2;
  for (let k = 0; k < 5; k++) {
    const x = r.x + r.w * (0.12 + k * 0.19), h0 = 5 + ((k * 5) % 7);
    ctx.beginPath(); ctx.moveTo(x - 3, b.y); ctx.lineTo(x, b.y + h0); ctx.lineTo(x + 3, b.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(190,240,255,0.25)'; ctx.fillRect(r.x, r.y, r.w, fx);
  ctx.save(); ctx.translate(0, b.y + b.h * 0.32); ctx.rotate(-0.18);
  texto(ctx, 'FREEZE!', 0, 0, Math.min(b.h * 0.2, b.w * 0.22), '#ffffff', { contorno: '#0d5fa8', espessura: 3, max: b.w - 4 });
  ctx.restore();
}

function cartaPedra(ctx, r, hp, op) {
  const { b, fx, lw } = moldura(ctx, r, (b) => {
    reticula(ctx, b.x, b.y, b.w, b.h, '#a3a3a3');
    const rnd = semente(19);
    ctx.fillStyle = 'rgba(40,40,40,0.35)';
    for (let i = 0; i < 16; i++) { circulo(ctx, b.x + rnd() * b.w, b.y + rnd() * b.h, 1 + rnd() * 2); ctx.fill(); }
  });
  ctx.fillStyle = '#d9d9d9'; ctx.fillRect(r.x + lw * 0.5, r.y + lw * 0.5, r.w - lw, fx - lw * 0.9);
  // pips de hp na legenda
  for (let k = 0; k < 3; k++) {
    const x = (k - 1) * Math.min(14, r.w * 0.24), y = r.y + fx * 0.52;
    ctx.fillStyle = k < hp ? '#ffd21f' : '#555';
    ctx.fillRect(x - 4.5, y - 4.5, 9, 9); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.strokeRect(x - 4.5, y - 4.5, 9, 9);
  }
  // rachaduras pelo hp perdido
  const perdido = 3 - clamp(hp, 0, 3);
  ctx.strokeStyle = PRETO; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  const rach = [[-0.35, 0.05, -0.05, 0.4, -0.25, 0.85], [0.38, 0.1, 0.08, 0.45, 0.3, 0.9], [-0.1, 0.0, 0.12, 0.25, -0.02, 0.55]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * b.w, b.y + c[1] * b.h); ctx.lineTo(c[2] * b.w, b.y + c[3] * b.h); ctx.lineTo(c[4] * b.w, b.y + c[5] * b.h); ctx.stroke();
  }
  texto(ctx, 'CONCRETO', 0, b.y + b.h * 0.86, Math.min(b.h * 0.15, b.w * 0.16), '#ffffff', { contorno: PRETO, espessura: 2.5, max: b.w - 4 });
  fecharMoldura(ctx, r, lw, op);
}

function cartaCoringa(ctx, r, op) {
  const t = op.t || 0;
  const { b, fx, lw } = moldura(ctx, r, (b) => {
    const faixas = [VERMELHO, '#ff8a1f', '#ffd21f', '#2fcf5a', CIANO, '#9b4dff'];
    const h = b.h / faixas.length;
    faixas.forEach((c, i) => reticula(ctx, b.x, b.y + i * h, b.w, h + 1, c));
    linhasVelocidade(ctx, 0, b.y + b.h * 0.5, b.w * 0.45, 14, 'rgba(255,255,255,0.5)', 1.2, t * 0.5);
  });
  emblema(ctx, 'mascara', 0, b.y + b.h * 0.5, Math.min(b.w, b.h) * 0.36, PRETO);
  ctx.fillStyle = '#ffffff';
  for (const sx of [-1, 1]) { elipse(ctx, sx * Math.min(b.w, b.h) * 0.16, b.y + b.h * 0.51, 3, 2); ctx.fill(); }
  letreiro(ctx, 'CORINGA', 0, r.y + fx * 0.53, Math.min(fx * 0.6, r.w * 0.3), MAGENTA, r.w - 8);
  fecharMoldura(ctx, r, lw, op);
}

function cartaBomba(ctx, r, op) {
  const t = op.t || 0;
  const { b, fx, lw } = moldura(ctx, r, (b) => reticula(ctx, b.x, b.y, b.w, b.h, '#ff8a1f'));
  const s = Math.min(b.w, b.h) * 0.3, cy = b.y + b.h * 0.58;
  ctx.strokeStyle = PRETO; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(s * 0.5, cy - s * 0.8); ctx.quadraticCurveTo(s * 0.9, cy - s * 1.4, s * 1.25, cy - s * 1.15); ctx.stroke();
  const k = 0.65 + 0.35 * Math.abs(Math.sin(t * 16));
  explosao(ctx, s * 1.25, cy - s * 1.15, s * 0.5 * k, s * 0.5 * k, 8); ctx.fillStyle = '#ffe14d'; ctx.fill(); traco(ctx, s * 0.5);
  circulo(ctx, 0, cy, s); ctx.fillStyle = '#222'; ctx.fill(); traco(ctx, s);
  ctx.fillStyle = '#555'; ctx.fillRect(s * 0.2, cy - s * 1.05, s * 0.55, s * 0.34); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.strokeRect(s * 0.2, cy - s * 1.05, s * 0.55, s * 0.34);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; elipse(ctx, -s * 0.38, cy - s * 0.35, s * 0.2, s * 0.12, -0.6); ctx.fill();
  letreiro(ctx, 'BOOM', 0, r.y + fx * 0.53, Math.min(fx * 0.78, r.w * 0.36), VERMELHO, r.w - 8);
  fecharMoldura(ctx, r, lw, op);
}

function cartaDobro(ctx, r, op) {
  const t = op.t || 0;
  const { b, fx, lw } = moldura(ctx, r, (b) => {
    reticula(ctx, b.x, b.y, b.w, b.h, CIANO);
    linhasVelocidade(ctx, 0, b.y + b.h * 0.5, b.w * 0.45, 16, 'rgba(255,255,255,0.6)', 1.3, -t * 0.4);
  });
  emblema(ctx, 'raio', 0, b.y + b.h * 0.52, Math.min(b.w, b.h) * 0.38, '#ffe14d');
  letreiro(ctx, 'x2', 0, r.y + fx * 0.53, Math.min(fx * 0.9, r.w * 0.46), '#ffe14d', r.w - 8);
  fecharMoldura(ctx, r, lw, op);
}

// ------------------------------------------------------------ cenario

function painelFila(L) {
  const f = L.fila;
  if (f.vertical) return { x: f.x - 8, y: f.y - 34, w: f.w + 16, h: f.h + 44 };
  const p0 = L.filaPos(0);
  return { x: 10, y: p0.y - 34, w: L.W - 20, h: p0.h + 46 };
}

function paineis(W, H, L) {
  const g = 9;
  const m = L.mesa;
  const mesaP = { x: m.x - 8, y: m.y - 8, w: m.w + 16, h: m.h + 16 };
  const fp = painelFila(L);
  const lista = [];
  const add = (tipo, x, y, w, h) => { if (w > 50 && h > 36) lista.push({ tipo, x, y, w, h }); };
  if (!L.fila.vertical) {
    add('ceu', 10, L.topo + 4, W - 20, mesaP.y - g - (L.topo + 4));
    add('velocidade', 10, mesaP.y + mesaP.h + g, W - 20, fp.y - g - (mesaP.y + mesaP.h + g));
    add('cidade', 10, fp.y + fp.h + g, W - 20, H - 10 - (fp.y + fp.h + g));
  } else {
    add('ceu', 10, L.topo + 4, mesaP.x - g - 10, H - 14 - L.topo);
    const xR = fp.x + fp.w + g;
    add('cidade', xR, L.topo + 4, W - 10 - xR, H - 14 - L.topo);
    const x0 = mesaP.x, w0 = fp.x + fp.w - mesaP.x;
    add('velocidade', x0, L.topo + 4, w0, Math.min(mesaP.y, fp.y) - g - (L.topo + 4));
    add('velocidade', x0, Math.max(mesaP.y + mesaP.h, fp.y + fp.h) + g, w0, H - 10 - (Math.max(mesaP.y + mesaP.h, fp.y + fp.h) + g));
    const v = lista.filter((p) => p.tipo === 'velocidade');
    if (v[1]) v[1].frase = 'NÃO PERCA O PRÓXIMO NÚMERO!';
  }
  return { lista, mesaP, fp };
}

function skyline(ctx, x, y, w, h, cor, janelas) {
  const rnd = semente(Math.round(w * 7 + h));
  let px = x - 4;
  ctx.fillStyle = cor;
  const predios = [];
  while (px < x + w) {
    const bw = 14 + rnd() * 26, bh = h * (0.35 + rnd() * 0.6);
    ctx.fillRect(px, y + h - bh, bw, bh);
    predios.push([px, y + h - bh, bw, bh]);
    px += bw + 2;
  }
  ctx.strokeStyle = PRETO; ctx.lineWidth = 2;
  for (const [bx, by, bw, bh] of predios) ctx.strokeRect(bx, by, bw, bh);
  if (janelas) {
    ctx.fillStyle = janelas;
    for (const [bx, by, bw, bh] of predios) {
      for (let yy = by + 6; yy < by + bh - 6; yy += 9) for (let xx = bx + 4; xx < bx + bw - 5; xx += 7) if (rnd() < 0.45) ctx.fillRect(xx, yy, 3, 4);
    }
  }
}

function artePainel(ctx, p) {
  if (p.tipo === 'ceu') {
    quadro(ctx, p.x, p.y, p.w, p.h, () => {
      reticula(ctx, p.x, p.y, p.w, p.h, '#8fe1ff');
      const rs = Math.min(p.w, p.h) * 0.3;
      explosao(ctx, p.x + p.w - rs * 1.3, p.y + rs * 1.25, rs, rs, 16); ctx.fillStyle = '#fff3a6'; ctx.fill();
      skyline(ctx, p.x, p.y + p.h * 0.45, p.w, p.h * 0.55, '#2b3a8a', '#ffe14d');
    });
    legenda(ctx, p.x + 8, p.y + 8, Math.min(150, p.w - 16), 20, 'ENQUANTO ISSO...', 12);
  } else if (p.tipo === 'velocidade') {
    quadro(ctx, p.x, p.y, p.w, p.h, () => {
      reticula(ctx, p.x, p.y, p.w, p.h, '#ffe14d', { claro: true });
      // linhas de velocidade horizontais
      const rnd = semente(Math.round(p.y));
      ctx.strokeStyle = 'rgba(17,17,17,0.45)'; ctx.lineWidth = 1.3;
      for (let i = 0; i < 14; i++) {
        const yy = p.y + 6 + rnd() * (p.h - 12), x0 = p.x + rnd() * p.w * 0.6;
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + 30 + rnd() * p.w * 0.4, yy); ctx.stroke();
      }
    });
    // balao de fala
    const frase = p.frase || 'SERÁ QUE DÁ 2048?!';
    const bw = Math.min(p.w * 0.8, 300), bh = Math.min(p.h * 0.62, 40);
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2 - 2;
    ctx.beginPath(); ctx.moveTo(cx + bw * 0.18, cy + bh * 0.35); ctx.lineTo(cx + bw * 0.32, cy + bh * 0.75); ctx.lineTo(cx + bw * 0.05, cy + bh * 0.4); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PRETO; ctx.stroke();
    elipse(ctx, cx, cy, bw / 2, bh / 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + bw * 0.08, cy + bh * 0.38); ctx.lineTo(cx + bw * 0.17, cy + bh * 0.42); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
    texto(ctx, frase, cx, cy + 1, Math.min(14, bh * 0.4), PRETO, { max: bw * 0.82 });
  } else if (p.tipo === 'cidade') {
    quadro(ctx, p.x, p.y, p.w, p.h, () => {
      reticula(ctx, p.x, p.y, p.w, p.h, MAGENTA);
      skyline(ctx, p.x, p.y + p.h * 0.3, p.w, p.h * 0.7, PRETO, '#ffe14d');
    });
    legenda(ctx, p.x + p.w - Math.min(130, p.w - 16) - 8, p.y + p.h - 28, Math.min(130, p.w - 16), 20, 'CONTINUA...', 12);
  }
}

/** Heroi generico voando (proprio): menino de capa amarela com estrela no peito. */
function heroi(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * s * 0.2);
  ctx.rotate(-0.12);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2);
  ctx.quadraticCurveTo(-s * 1.6, -s * 0.5 + Math.sin(t * 9) * s * 0.15, -s * 2.0, s * 0.2);
  ctx.quadraticCurveTo(-s * 1.2, s * 0.35, -s * 0.2, s * 0.25); ctx.closePath();
  ctx.fillStyle = '#ffd21f'; ctx.fill(); traco(ctx, s * 0.6);
  rr(ctx, -s * 0.5, -s * 0.28, s * 1.3, s * 0.56, s * 0.26); ctx.fillStyle = VERMELHO; ctx.fill(); traco(ctx, s * 0.6);
  estrela(ctx, s * 0.1, 0, s * 0.18, s * 0.08); ctx.fillStyle = '#ffffff'; ctx.fill();
  circulo(ctx, s * 1.05, -s * 0.12, s * 0.32); ctx.fillStyle = '#ffd7b0'; ctx.fill(); traco(ctx, s * 0.6);
  ctx.fillStyle = '#2b3a8a'; ctx.fillRect(s * 0.85, -s * 0.2, s * 0.4, s * 0.1);
  rr(ctx, s * 1.2, -s * 0.5, s * 0.75, s * 0.2, s * 0.1); ctx.fillStyle = VERMELHO; ctx.fill(); traco(ctx, s * 0.5);
  ctx.restore();
}

// ------------------------------------------------------------ efeitos

function registrarFormas(P) {
  if (P.formas.balao) return;
  P.formas.balao = (ctx, p, u) => {
    const pop = u < 0.12 ? 0.45 + (u / 0.12) * 0.7 : 1.15 - Math.min(0.15, (u - 0.12) * 0.4);
    const R = p.tam * pop;
    explosao(ctx, 0, 0, R * 1.3, R * 0.85, p.pontas || 13, p.tam);
    ctx.fillStyle = PRETO; ctx.save(); ctx.translate(3, 3); ctx.fill(); ctx.restore();
    explosao(ctx, 0, 0, R * 1.3, R * 0.85, p.pontas || 13, p.tam);
    ctx.fillStyle = p.fundo || AMARELO; ctx.fill(); ctx.lineWidth = Math.max(2, R * 0.07); ctx.strokeStyle = PRETO; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); ctx.transform(1, 0, -0.14, 1, 0, 0);
    texto(ctx, p.txt, 0, 1, R * 0.56, p.cor || VERMELHO, { contorno: PRETO, espessura: Math.max(2.5, R * 0.13), max: R * 2.2 });
    ctx.restore();
  };
  P.formas.linhas = (ctx, p, u) => {
    ctx.strokeStyle = PRETO; ctx.lineWidth = 2;
    const R = p.tam * (0.4 + u * 1.2);
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU + i * 0.13;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); ctx.lineTo(Math.cos(a) * R * 1.35, Math.sin(a) * R * 1.35); ctx.stroke();
    }
  };
  P.formas.ponto = (ctx, p) => { circulo(ctx, 0, 0, p.tam / 2); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PRETO; ctx.stroke(); };
  P.formas.estrelaHQ = (ctx, p) => { estrela(ctx, 0, 0, p.tam / 2, p.tam / 4.5); ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PRETO; ctx.stroke(); };
  P.formas.caco = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, s * 0.7); ctx.lineTo(-s * 0.5, s * 0.4); ctx.closePath();
    ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = PRETO; ctx.stroke();
  };
}

function balao(P, mem, x, y, txt, tam, fundo, cor, vida = 0.75) {
  const W = mem.W || 390;
  const mx = Math.min(W / 2 - 4, tam * 1.5);
  P.add({ forma: 'balao', x: clamp(x, mx, W - mx), y: Math.max(tam + 10, y), vy: -18, g: 0, arrasto: 1, vida, tam, txt, fundo, cor, rot: ((txt.length * 37) % 9 - 4) * 0.03 });
}

// ------------------------------------------------------------ tema

const tema = {
  id: 'hq',
  nome: 'HQ Pop-Art',
  cores: { texto: PRETO, destaque: AMARELO, particulas: [AMARELO, CIANO, MAGENTA, VERMELHO] },
  faixas: () => ({ topo: 96, base: 0 }),

  fundo(ctx, W, H, L) {
    ctx.fillStyle = PAPEL; ctx.fillRect(0, 0, W, H);
    // textura de papel
    const rnd = semente(3);
    ctx.fillStyle = 'rgba(150,120,60,0.07)';
    for (let i = 0; i < 260; i++) { circulo(ctx, rnd() * W, rnd() * H, 0.6 + rnd() * 1.2); ctx.fill(); }
    const { lista, mesaP } = paineis(W, H, L);
    for (const p of lista) artePainel(ctx, p);
    // quadro da mesa: borda grossa, fundo claro com reticula leve
    quadro(ctx, mesaP.x, mesaP.y, mesaP.w, mesaP.h, () => reticula(ctx, mesaP.x, mesaP.y, mesaP.w, mesaP.h, '#ffe9a8', { claro: true }));
  },

  mesa(ctx, L, e, t) {
    // heroi atravessando o quadro do ceu
    const { lista } = paineis(L.W, L.H, L);
    const ceu = lista.find((p) => p.tipo === 'ceu');
    if (ceu) {
      ctx.save(); ctx.beginPath(); ctx.rect(ceu.x, ceu.y, ceu.w, ceu.h); ctx.clip();
      const s = Math.min(16, ceu.h * 0.13);
      const x = ceu.x - 60 + ((t * 40) % (ceu.w + 140));
      heroi(ctx, x, ceu.y + ceu.h * 0.32, s, t);
      ctx.restore();
    }
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      ctx.save();
      ctx.setLineDash([5, 4]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(17,17,17,0.45)';
      ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);
      ctx.restore();
      estrela(ctx, s.x + s.w / 2, s.y + s.h / 2, s.w * 0.18, s.w * 0.08); ctx.fillStyle = 'rgba(17,17,17,0.15)'; ctx.fill();
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return cartaPedra(ctx, r, carta.hp, op);
    if (carta.tipo === 'coringa') return cartaCoringa(ctx, r, op);
    if (carta.tipo === 'bomba') return cartaBomba(ctx, r, op);
    if (carta.tipo === 'dobro') return cartaDobro(ctx, r, op);
    cartaNormal(ctx, carta.v, r, { ...op, gelo: !!carta.gelo });
  },

  cadeado(ctx, a) {
    // cofre do vilao com carimbo
    const x = a.x - 3, y = a.y - 3, w = a.w + 6, h = a.h + 6;
    ctx.fillStyle = PRETO; ctx.fillRect(x + 4, y + 4, w, h);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#7a8494'); g.addColorStop(1, '#3d4350');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    reticula(ctx, x, y, w, h * 0.35, '#6d7686');
    ctx.lineWidth = 3.5; ctx.strokeStyle = PRETO; ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 2; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.fillStyle = '#c9ced8';
    for (const [rx, ry] of [[x + 11, y + 11], [x + w - 11, y + 11], [x + 11, y + h - 11], [x + w - 11, y + h - 11]]) { circulo(ctx, rx, ry, 2.6); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke(); }
    const cx = x + w / 2, cy = y + h * 0.42, R = Math.min(w * 0.3, 22);
    circulo(ctx, cx, cy, R); ctx.fillStyle = '#dfe3ea'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PRETO; ctx.stroke();
    for (let k = 0; k < 12; k++) { const an = (k / 12) * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * R * 0.72, cy + Math.sin(an) * R * 0.72); ctx.lineTo(cx + Math.cos(an) * R * 0.9, cy + Math.sin(an) * R * 0.9); ctx.lineWidth = 1.5; ctx.stroke(); }
    circulo(ctx, cx, cy, R * 0.32); ctx.fillStyle = '#3d4350'; ctx.fill(); ctx.stroke();
    rr(ctx, cx - R * 0.15, cy + R * 1.2, R * 0.3, R * 0.9, 3); ctx.fillStyle = '#c9ced8'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    // carimbo
    ctx.save(); ctx.translate(cx, y + h * 0.78); ctx.rotate(-0.28);
    const sw = w * 1.05, sh = Math.min(22, w * 0.3);
    ctx.globalAlpha = 0.92;
    ctx.lineWidth = 2.5; ctx.strokeStyle = VERMELHO; ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
    texto(ctx, 'ULTRASSECRETO', 0, 1, sh * 0.62, VERMELHO, { max: sw - 6 });
    ctx.restore();
  },

  descarte(ctx, r, e, t) {
    const carga = e.descarteCarga > 0;
    const cx = r.x + r.w / 2, base = r.y + r.h - 2;
    const bw = r.w * 0.78, bh = r.h * 0.56, top = base - bh;
    // corpo da lixeira
    ctx.beginPath(); ctx.moveTo(cx - bw / 2, top); ctx.lineTo(cx + bw / 2, top); ctx.lineTo(cx + bw * 0.4, base); ctx.lineTo(cx - bw * 0.4, base); ctx.closePath();
    ctx.fillStyle = PRETO; ctx.save(); ctx.translate(3, 3); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(cx - bw / 2, top); ctx.lineTo(cx + bw / 2, top); ctx.lineTo(cx + bw * 0.4, base); ctx.lineTo(cx - bw * 0.4, base); ctx.closePath();
    ctx.fillStyle = carga ? '#9aa3ad' : '#c4c8cd'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PRETO; ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(cx + k * bw * 0.22, top + 5); ctx.lineTo(cx + k * bw * 0.18, base - 5); ctx.stroke(); }
    // tampa
    ctx.save();
    ctx.translate(cx + (carga ? bw * 0.45 : 0), top);
    ctx.rotate(carga ? -0.55 : 0);
    rr(ctx, carga ? -bw * 0.95 : -bw * 0.55, -7, bw * 1.1, 7, 3); ctx.fillStyle = '#b8bfc7'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PRETO; ctx.stroke();
    ctx.restore();
    // rotulo acima do slot (a carta descartada cobre o slot)
    const ly = r.y - 3;
    if (carga) {
      const k = 1 + 0.06 * Math.sin(t * 6);
      explosao(ctx, cx, ly, r.w * 0.52 * k, 9 * k, 11); ctx.fillStyle = AMARELO; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.stroke();
      texto(ctx, 'CRASH!', cx, ly + 0.5, Math.min(11, r.w * 0.18), VERMELHO, { contorno: PRETO, espessura: 2.2, max: r.w * 0.8 });
    } else {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - r.w * 0.45, ly - 7, r.w * 0.9, 14); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.strokeRect(cx - r.w * 0.45, ly - 7, r.w * 0.9, 14);
      texto(ctx, 'SEM CARGA', cx, ly + 0.5, Math.min(9, r.w * 0.15), '#555', { max: r.w * 0.85 });
    }
  },

  fila(ctx, L, e, t) {
    const p = painelFila(L);
    quadro(ctx, p.x, p.y, p.w, p.h, () => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(p.x, p.y, p.w, p.h);
      const f0 = L.filaPos(0);
      linhasVelocidade(ctx, f0.x + f0.w / 2, f0.y + f0.h / 2, Math.max(p.w, p.h) * 0.42, 40, 'rgba(255,61,139,0.35)', 2, t * 0.05);
    });
    legenda(ctx, p.x + 8, p.y + 7, Math.min(120, p.w - 16), 20, 'PRÓXIMO...', 12);
  },

  hud(ctx, W, H, L, e, t, mem) {
    mem.W = W; mem.H = H;
    const y = 10, h = 74;
    // capitulo
    const cw = 76;
    ctx.fillStyle = PRETO; ctx.fillRect(13, y + 3, cw, h);
    ctx.fillStyle = AMARELO; ctx.fillRect(10, y, cw, h);
    ctx.lineWidth = 3; ctx.strokeStyle = PRETO; ctx.strokeRect(10, y, cw, h);
    texto(ctx, 'CAPÍTULO', 10 + cw / 2, y + 18, 11, PRETO, { max: cw - 8 });
    letreiro(ctx, String(e.faseId), 10 + cw / 2, y + 48, 30, VERMELHO, cw - 10);
    // pontos (explosao)
    const px = W - 52, py = y + h / 2;
    explosao(ctx, px + 3, py + 3, 46, 38, 14); ctx.fillStyle = PRETO; ctx.fill();
    explosao(ctx, px, py, 46, 38, 14); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PRETO; ctx.stroke();
    texto(ctx, String(e.pontos), px, py - 3, 19, MAGENTA, { contorno: PRETO, espessura: 3.5, max: 66 });
    texto(ctx, 'PONTOS', px, py + 15, 9, PRETO);
    // metas em legenda branca
    const mx = 10 + cw + 10, mw = px - 50 - mx - 6;
    ctx.fillStyle = PRETO; ctx.fillRect(mx + 3, y + 3, mw, h);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mx, y, mw, h);
    ctx.lineWidth = 3; ctx.strokeStyle = PRETO; ctx.strokeRect(mx, y, mw, h);
    e.metas.forEach((m, k) => {
      const yy = y + 8 + k * 33;
      texto(ctx, textoMeta(m, { monte: (n) => `Complete ${n} página${n > 1 ? 's' : ''}` }).toUpperCase(), mx + 8, yy + 6, 11, PRETO, { alinhar: 'left', max: mw - 16 });
      const bx = mx + 8, bw = mw - 16, by = yy + 14;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, bw, 10);
      const fw = Math.max(0, bw * Math.min(1, m.atual / m.alvo));
      if (fw > 0) { ctx.save(); ctx.beginPath(); ctx.rect(bx, by, fw, 10); ctx.clip(); reticula(ctx, bx, by, bw, 10, m.feita ? '#2fcf5a' : MAGENTA); ctx.restore(); }
      ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.strokeRect(bx, by, bw, 10);
    });
    if (e.febre) {
      const k = 1 + 0.08 * Math.sin(t * 12);
      const fy = y + h + 26;
      explosao(ctx, W / 2 + 3, fy + 3, 118 * k, 22 * k, 18); ctx.fillStyle = PRETO; ctx.fill();
      explosao(ctx, W / 2, fy, 118 * k, 22 * k, 18); ctx.fillStyle = AMARELO; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PRETO; ctx.stroke();
      ctx.save(); ctx.translate(W / 2, fy + 1); ctx.transform(1, 0, -0.15, 1, 0, 0);
      texto(ctx, 'SUPERPODER x2', 0, 0, 17, VERMELHO, { contorno: PRETO, espessura: 3.5, max: 200 });
      ctx.restore();
    }
  },

  efeito(fx, P, mem) {
    registrarFormas(P);
    switch (fx.tipo) {
      case 'pouso':
        balao(P, mem, fx.x + 22, fx.y + 18, 'TUM', 11, '#ffffff', PRETO, 0.4);
        P.estourar(fx.x, fx.y + 26, ['#ffffff', '#dddddd'], 5, 0.35, { forma: 'ponto', tam: 5, g: 200, vida: 0.4 });
        return true;
      case 'fusao': {
        const n = Math.min(11, nivel(fx.valor));
        const forte = fx.degrau >= 3;
        const txt = forte ? 'KA-BOOM!' : PALAVRAS[(n + fx.degrau) % PALAVRAS.length];
        const cor = n === 0 || n === 10 ? VERMELHO : CORES[n];
        balao(P, mem, fx.x + (fx.degrau % 2 ? 24 : -24), fx.y - 26, txt, (forte ? 30 : 20) + fx.degrau * 4, forte ? '#ffffff' : AMARELO, forte ? VERMELHO : cor, 0.7 + fx.degrau * 0.06);
        P.estourar(fx.x, fx.y, [CORES[n], '#ffffff', AMARELO], 10 + fx.degrau * 3, 0.8 + fx.degrau * 0.12, { forma: 'ponto', tam: 7, g: 380 });
        P.add({ forma: 'linhas', x: fx.x, y: fx.y, vida: 0.32, tam: 26 + fx.degrau * 6 });
        if (fx.degrau > 1) P.texto(fx.x - 30, fx.y - 6, 'x' + fx.degrau, '#ffffff', 20 + fx.degrau * 2, PRETO);
        return true;
      }
      case 'completar':
        P.add({ forma: 'linhas', x: fx.x, y: fx.y, vida: 0.6, tam: 90 });
        balao(P, mem, fx.x, fx.y - 46, 'SUPER!', 44, AMARELO, VERMELHO, 1.15);
        P.estourar(fx.x, fx.y, [AMARELO, CIANO, MAGENTA, VERMELHO, '#2fcf5a'], 36, 1.6, { forma: 'estrelaHQ', tam: 13, g: 420, vida: 0.95 });
        return true;
      case 'explodir':
        balao(P, mem, fx.x, fx.y - 20, 'BOOM!', 30, '#ff8a1f', AMARELO, 0.8);
        P.estourar(fx.x, fx.y, [PRETO, '#555555', '#ff8a1f', AMARELO], 22, 1.3, { forma: 'ponto', tam: 9, g: 260 });
        return true;
      case 'pedra':
        balao(P, mem, fx.x, fx.y - 18, 'CRACK!', 24, '#e2e2e2', PRETO, 0.7);
        P.estourar(fx.x, fx.y, ['#a3a3a3', '#777777', '#d9d9d9'], 18, 1.1, { forma: 'caco', tam: 9 });
        return true;
      case 'racha':
        balao(P, mem, fx.x + 18, fx.y - 6, 'crac', 13, '#ffffff', PRETO, 0.45);
        P.estourar(fx.x, fx.y, ['#a3a3a3', '#d9d9d9'], 6, 0.6, { forma: 'caco', tam: 6 });
        return true;
      case 'gelo':
        balao(P, mem, fx.x, fx.y - 16, 'CRASH', 22, '#bdf3ff', '#1a7fd1', 0.65);
        P.estourar(fx.x, fx.y, ['#e8fbff', '#9feaff', '#22c7f2'], 16, 0.9, { forma: 'caco', tam: 8, g: 240 });
        return true;
      case 'cadeado':
        balao(P, mem, fx.x, fx.y, 'CLICK!', 24, '#ffffff', '#2f6bff', 0.8);
        P.estourar(fx.x, fx.y, [AMARELO, '#c9ced8'], 14, 1, { forma: 'estrelaHQ', tam: 9 });
        return true;
      case 'combo':
        balao(P, mem, fx.x, fx.y - 64, `COMBO x${fx.n}!`, 22, MAGENTA, '#ffffff', 0.8);
        return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e, t) {
    const venceu = e.fim === 'venceu';
    ctx.fillStyle = 'rgba(17,17,17,0.45)'; ctx.fillRect(0, 0, W, H);
    const cy = H * 0.44, k = 1 + 0.03 * Math.sin(t * 5);
    explosao(ctx, W / 2 + 5, cy + 5, Math.min(W * 0.46, 200) * k, 70 * k, 18); ctx.fillStyle = PRETO; ctx.fill();
    explosao(ctx, W / 2, cy, Math.min(W * 0.46, 200) * k, 70 * k, 18); ctx.fillStyle = venceu ? AMARELO : '#ffffff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = PRETO; ctx.stroke();
    letreiro(ctx, venceu ? 'FIM DO CAPÍTULO!' : 'SEM SAÍDA!', W / 2, cy - 8, Math.min(30, W * 0.075), venceu ? VERMELHO : MAGENTA, Math.min(W * 0.7, 300));
    texto(ctx, 'toque para o próximo número', W / 2, cy + 24, Math.min(14, W * 0.036), PRETO, { max: Math.min(W * 0.62, 260) });
  },
};

export default tema;
