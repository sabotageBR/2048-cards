// Ideia 13: Grafite de Rua. As cartas sao adesivos colados num muro de
// tijolo (tortinhos, com fita e o cantinho descolando) e o numero vem em letra
// de grafite "bubble". Fusao = jato de spray; o 2048 vira um mural assinado.
// Geometria padrao de cartas.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, misturar, estrela, nivel, textoMeta, semente, clamp } from '../kit.js';

const TIJOLO = '#b5523b';
const CONCRETO = '#8d8d8d';
const ROSA = '#ff2e88';
const LIMAO = '#b6ff3b';
const CIANO = '#00d1ff';
const AMARELO = '#ffd400';
const PRETO = '#141414';
const CORES = [ROSA, LIMAO, CIANO, AMARELO, '#8a5cff', '#ff6b1a', '#00e0a4', '#ff3b3b', '#3d6bff', '#ff8ad8', '#ffc400', '#c9b6ff'];
const ARTES = ['bolha', 'tag', 'estrela', 'olho', 'raio', 'coracao', 'sorriso', 'diamante', 'chama', 'skate', 'coroa', 'coroa'];

/** Angulo deterministico do adesivo (+-4 graus) pelo id da carta. */
function anguloDe(id) {
  const x = Math.sin((id || 1) * 12.9898) * 43758.5453;
  return ((x - Math.floor(x)) - 0.5) * 2 * ((4 * Math.PI) / 180);
}

function traco(ctx, s) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, s * 0.14); ctx.strokeStyle = PRETO; ctx.stroke(); }

/** Numero em letra "bubble": extrusao escura, contorno grosso, brilho e um pingo. */
function bubble(ctx, txt, x, y, tam, cor, max, op = {}) {
  ctx.save();
  ctx.font = `700 ${Math.round(tam)}px Fredoka, system-ui, sans-serif`;
  const larg = Math.min(max || 999, ctx.measureText(txt).width);
  ctx.restore();
  const alpha = op.alpha ?? 1;
  ctx.save();
  ctx.globalAlpha *= alpha;
  // pingo saindo da letra
  if (!op.semPingo) {
    const px = x + larg * 0.22, py = y + tam * 0.3, ph = tam * 0.42;
    rr(ctx, px - tam * 0.07, py - 2, tam * 0.14, ph, tam * 0.07); ctx.fillStyle = op.recheio || '#ffffff'; ctx.fill(); ctx.lineWidth = Math.max(1.5, tam * 0.08); ctx.strokeStyle = PRETO; ctx.stroke();
    circulo(ctx, px, py + ph, tam * 0.1); ctx.fill(); ctx.stroke();
  }
  texto(ctx, txt, x + tam * 0.07, y + tam * 0.09, tam, escurecer(cor, 0.5), { contorno: PRETO, espessura: Math.max(3, tam * 0.32), max });
  texto(ctx, txt, x, y, tam, op.recheio || '#ffffff', { contorno: PRETO, espessura: Math.max(3, tam * 0.28), max });
  // brilho
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  elipse(ctx, x - larg * 0.32, y - tam * 0.2, tam * 0.08, tam * 0.045, -0.5); ctx.fill();
  ctx.restore();
}

/** Arte do adesivo, centrada em (x, y), tamanho s. */
function arte(ctx, tipo, x, y, s, cor, t) {
  ctx.save();
  ctx.translate(x, y);
  switch (tipo) {
    case 'bolha': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, s * 0.6);
      ctx.bezierCurveTo(-s * 1.0, -s * 0.2, -s * 0.5, -s * 0.95, 0, -s * 0.9);
      ctx.bezierCurveTo(s * 0.6, -s * 0.95, s * 1.0, -s * 0.2, s * 0.8, s * 0.6);
      ctx.quadraticCurveTo(s * 0.55, s * 0.95, s * 0.3, s * 0.6); ctx.quadraticCurveTo(0, s * 0.95, -s * 0.3, s * 0.6); ctx.quadraticCurveTo(-s * 0.55, s * 0.95, -s * 0.8, s * 0.6);
      ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      for (const sx of [-1, 1]) { circulo(ctx, sx * s * 0.3, -s * 0.2, s * 0.17); ctx.fillStyle = PRETO; ctx.fill(); circulo(ctx, sx * s * 0.3 + s * 0.05, -s * 0.25, s * 0.06); ctx.fillStyle = '#fff'; ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, s * 0.08, s * 0.25, 0.15 * Math.PI, 0.85 * Math.PI); traco(ctx, s * 0.8);
      break;
    }
    case 'tag': {
      const caminho = () => {
        ctx.beginPath(); ctx.moveTo(-s * 0.95, s * 0.3);
        ctx.bezierCurveTo(-s * 0.7, -s * 0.9, -s * 0.3, s * 0.8, -s * 0.1, -s * 0.2);
        ctx.bezierCurveTo(s * 0.05, -s * 0.8, s * 0.3, s * 0.6, s * 0.45, -s * 0.3);
        ctx.bezierCurveTo(s * 0.6, -s * 0.9, s * 0.9, 0, s * 0.95, -s * 0.45);
      };
      caminho(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = s * 0.38; ctx.strokeStyle = PRETO; ctx.stroke();
      caminho(); ctx.lineWidth = s * 0.2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      estrela(ctx, s * 0.95, -s * 0.75, s * 0.2, s * 0.08); ctx.fillStyle = '#fff'; ctx.fill(); traco(ctx, s * 0.4);
      break;
    }
    case 'estrela':
      estrela(ctx, 0, 0, s, s * 0.45); ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      estrela(ctx, s * 0.85, -s * 0.8, s * 0.22, s * 0.07, 4); ctx.fillStyle = '#fff'; ctx.fill();
      break;
    case 'olho':
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.95, s, 0); ctx.quadraticCurveTo(0, s * 0.95, -s, 0); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      circulo(ctx, 0, 0, s * 0.38); ctx.fillStyle = escurecer(cor, 0.35); ctx.fill(); traco(ctx, s * 0.6);
      circulo(ctx, 0, 0, s * 0.17); ctx.fillStyle = PRETO; ctx.fill();
      circulo(ctx, s * 0.12, -s * 0.12, s * 0.07); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = PRETO; ctx.lineWidth = Math.max(1.5, s * 0.1);
      for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * 0.32; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.55 - s * 0.12); ctx.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85 - s * 0.12); ctx.stroke(); }
      break;
    case 'raio':
      ctx.beginPath(); ctx.moveTo(s * 0.3, -s); ctx.lineTo(-s * 0.6, s * 0.15); ctx.lineTo(-s * 0.02, s * 0.15); ctx.lineTo(-s * 0.32, s); ctx.lineTo(s * 0.62, -s * 0.22); ctx.lineTo(s * 0.06, -s * 0.22); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      break;
    case 'coracao':
      ctx.beginPath(); ctx.moveTo(0, s * 0.85);
      ctx.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.6, -s * 1.2, 0, -s * 0.45);
      ctx.bezierCurveTo(s * 0.6, -s * 1.2, s * 1.4, -s * 0.1, 0, s * 0.85);
      ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      for (const [dx, h] of [[-0.35, 0.5], [0.2, 0.75]]) { rr(ctx, dx * s - s * 0.07, s * 0.2, s * 0.14, s * h, s * 0.07); ctx.fillStyle = '#fff'; ctx.fill(); traco(ctx, s * 0.5); }
      break;
    case 'sorriso':
      circulo(ctx, 0, 0, s * 0.85); ctx.fillStyle = AMARELO; ctx.fill(); traco(ctx, s);
      for (const [dx, h] of [[-0.3, 0.55], [0.1, 0.8], [0.45, 0.4]]) { rr(ctx, dx * s - s * 0.08, s * 0.5, s * 0.16, s * h, s * 0.08); ctx.fillStyle = AMARELO; ctx.fill(); traco(ctx, s * 0.5); }
      circulo(ctx, 0, 0, s * 0.85); ctx.fillStyle = AMARELO; ctx.fill();
      ctx.strokeStyle = PRETO; ctx.lineWidth = Math.max(2, s * 0.12);
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * s * 0.42, -s * 0.38); ctx.lineTo(sx * s * 0.18, -s * 0.14); ctx.moveTo(sx * s * 0.18, -s * 0.38); ctx.lineTo(sx * s * 0.42, -s * 0.14); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.45, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      break;
    case 'diamante':
      ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.6); ctx.lineTo(s * 0.5, -s * 0.6); ctx.lineTo(s * 0.95, -s * 0.12); ctx.lineTo(0, s); ctx.lineTo(-s * 0.95, -s * 0.12); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      ctx.beginPath(); ctx.moveTo(-s * 0.95, -s * 0.12); ctx.lineTo(s * 0.95, -s * 0.12); ctx.moveTo(-s * 0.2, -s * 0.6); ctx.lineTo(-s * 0.38, -s * 0.12); ctx.lineTo(0, s); ctx.lineTo(s * 0.38, -s * 0.12); ctx.lineTo(s * 0.2, -s * 0.6); traco(ctx, s * 0.55);
      break;
    case 'chama': {
      const k = 1 + 0.06 * Math.sin((t || 0) * 9);
      ctx.scale(1, k);
      ctx.beginPath(); ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.5, -s * 0.45, s * 0.9, s * 0.05, s * 0.55, s * 0.62);
      ctx.quadraticCurveTo(0, s * 1.05, -s * 0.55, s * 0.62);
      ctx.bezierCurveTo(-s * 0.9, s * 0.1, -s * 0.2, -s * 0.2, 0, -s);
      ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      ctx.beginPath(); ctx.moveTo(0, -s * 0.15); ctx.quadraticCurveTo(s * 0.38, s * 0.3, 0, s * 0.65); ctx.quadraticCurveTo(-s * 0.38, s * 0.3, 0, -s * 0.15);
      ctx.fillStyle = AMARELO; ctx.fill();
      break;
    }
    case 'skate':
      ctx.rotate(-0.55);
      rr(ctx, -s * 1.05, -s * 0.3, s * 2.1, s * 0.6, s * 0.3); ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s);
      ctx.fillStyle = escurecer(cor, 0.3); ctx.fillRect(-s * 0.55, -s * 0.3, s * 0.18, s * 0.6); ctx.fillRect(s * 0.37, -s * 0.3, s * 0.18, s * 0.6);
      for (const sx of [-0.62, 0.62]) for (const sy of [-0.42, 0.42]) { circulo(ctx, sx * s, sy * s, s * 0.14); ctx.fillStyle = AMARELO; ctx.fill(); traco(ctx, s * 0.4); }
      break;
    case 'coroa':
      ctx.beginPath(); ctx.moveTo(-s * 0.95, s * 0.5); ctx.lineTo(-s, -s * 0.55); ctx.lineTo(-s * 0.45, -s * 0.05); ctx.lineTo(0, -s * 0.8); ctx.lineTo(s * 0.45, -s * 0.05); ctx.lineTo(s, -s * 0.55); ctx.lineTo(s * 0.95, s * 0.5); ctx.closePath();
      ctx.fillStyle = AMARELO; ctx.fill(); traco(ctx, s);
      for (const [jx, jc] of [[-s * 0.5, ROSA], [0, CIANO], [s * 0.5, LIMAO]]) { circulo(ctx, jx, s * 0.22, s * 0.13); ctx.fillStyle = jc; ctx.fill(); traco(ctx, s * 0.4); }
      break;
    default: break;
  }
  ctx.restore();
}

// ------------------------------------------------------------ adesivo

/** Base do adesivo: sombra, borda branca, fundo colorido (via callback), cantinho e fita. */
function adesivo(ctx, carta, r, fundoInterno, op, conteudo) {
  ctx.save();
  ctx.rotate(anguloDe(carta.id));
  const raio = Math.min(r.w, r.h) * 0.14;
  const b = Math.max(3, r.w * 0.06);
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rr(ctx, r.x + 2, r.y + 3, r.w, r.h, raio); ctx.fill();
  rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.fillStyle = '#fbfbf4'; ctx.fill();
  const d = { x: r.x + b, y: r.y + b, w: r.w - b * 2, h: r.h - b * 2, r: Math.max(2, raio - b * 0.6) };
  ctx.save(); rr(ctx, d.x, d.y, d.w, d.h, d.r); ctx.clip(); fundoInterno(d); ctx.restore();
  conteudo(d);
  // cantinho descolando (canto inferior direito)
  const c = Math.min(r.w, r.h) * 0.2;
  ctx.beginPath(); ctx.moveTo(r.x + r.w, r.y + r.h - c); ctx.lineTo(r.x + r.w - c, r.y + r.h); ctx.lineTo(r.x + r.w - c * 0.95, r.y + r.h - c * 0.95); ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(r.x + r.w - 1, r.y + r.h - c); ctx.lineTo(r.x + r.w - c, r.y + r.h - 1); ctx.quadraticCurveTo(r.x + r.w - c * 0.9, r.y + r.h - c * 0.9, r.x + r.w - c * 1.05, r.y + r.h - c * 1.05);
  ctx.closePath(); ctx.fillStyle = '#e4e2d8'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
  // fita no canto de cima
  ctx.save(); ctx.translate(r.x + r.w * 0.12, r.y + 2); ctx.rotate(-0.7);
  ctx.fillStyle = 'rgba(236,226,186,0.8)'; ctx.fillRect(-r.w * 0.16, -4, r.w * 0.32, 8);
  ctx.restore();
  if (op.destaque) { rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, raio + 3); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(182,255,59,${op.destaque + 0.25})`; ctx.stroke(); }
  ctx.restore();
}

function fundoCor(ctx, d, cor, n, t) {
  if (n === 11) {
    const g = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y + d.h);
    for (let k = 0; k <= 5; k++) g.addColorStop(k / 5, `hsl(${(t * 70 + k * 60) % 360},95%,66%)`);
    ctx.fillStyle = g;
  } else {
    const g = ctx.createRadialGradient(0, d.y + d.h * 0.55, 2, 0, d.y + d.h * 0.55, d.h * 0.8);
    g.addColorStop(0, clarear(cor, 0.25)); g.addColorStop(1, cor);
    ctx.fillStyle = g;
  }
  ctx.fillRect(d.x, d.y, d.w, d.h);
  // nevoa de spray nas bordas
  const rnd = semente(31 + n);
  ctx.fillStyle = 'rgba(20,20,20,0.18)';
  for (let i = 0; i < 26; i++) {
    const lado = rnd() < 0.5, u = rnd();
    const x = lado ? d.x + (rnd() < 0.5 ? rnd() * 6 : d.w - rnd() * 6) : d.x + u * d.w;
    const y = lado ? d.y + u * d.h : d.y + (rnd() < 0.5 ? rnd() * 6 : d.h - rnd() * 6);
    circulo(ctx, x, y, 0.6 + rnd() * 1.4); ctx.fill();
  }
}

function cartaNormal(ctx, carta, r, op) {
  const v = carta.v, n = Math.min(11, nivel(v));
  const cor = CORES[n], t = op.t || 0;
  adesivo(ctx, carta, r, (d) => {
    fundoCor(ctx, d, cor, n, t);
    if (n === 10) {
      // mural dourado: raios
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + t * 0.4; ctx.beginPath(); ctx.moveTo(0, d.y + d.h * 0.6); ctx.lineTo(Math.cos(a) * d.w, d.y + d.h * 0.6 + Math.sin(a) * d.w); ctx.stroke(); }
    }
  }, op, (d) => {
    const fx = r.h * 0.3;
    const by = r.y + fx, bh = d.y + d.h - by;
    const s = Math.min(d.w, bh) * 0.34;
    arte(ctx, ARTES[n], 0, by + bh * 0.5, s, cor, t);
    if (n >= 10) {
      // assinatura embaixo da coroa
      ctx.beginPath(); ctx.moveTo(-s * 0.9, by + bh * 0.86); ctx.bezierCurveTo(-s * 0.4, by + bh * 0.7, -s * 0.1, by + bh * 1.0, s * 0.3, by + bh * 0.82); ctx.lineTo(s * 0.9, by + bh * 0.8);
      ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.lineCap = 'round'; ctx.stroke();
    }
    const tam = Math.min(fx * 0.86, r.w * 0.45);
    if (carta.gelo) {
      buff(ctx, d, carta.id);
      bubble(ctx, String(v), 0, r.y + fx * 0.52, tam, cor, d.w - 2, { alpha: 0.5, semPingo: true });
    } else bubble(ctx, String(v), 0, r.y + fx * 0.52, tam, cor, d.w - 2);
  });
}

/** Tinta cinza da prefeitura por cima do adesivo (marcas de rolo). */
function buff(ctx, d, id) {
  const rnd = semente(id * 7 + 3);
  ctx.save();
  rr(ctx, d.x - 1, d.y - 1, d.w + 2, d.h + 2, d.r); ctx.clip();
  ctx.fillStyle = '#9b9a95'; ctx.fillRect(d.x - 2, d.y - 2, d.w + 4, d.h + 4);
  const faixa = Math.max(7, d.h / 7);
  for (let y = d.y; y < d.y + d.h; y += faixa) {
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    ctx.beginPath(); ctx.moveTo(d.x - 2, y);
    for (let x = d.x; x <= d.x + d.w + 4; x += 6) ctx.lineTo(x, y + Math.sin(x * 0.3 + y) * 1.2);
    ctx.lineTo(d.x + d.w + 4, y + faixa); ctx.lineTo(d.x - 2, y + faixa); ctx.closePath(); ctx.fill();
  }
  // falha da tinta num canto: aparece um pouco do adesivo
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  elipse(ctx, d.x + d.w - 5, d.y + d.h - 6, 8, 5, 0.4); ctx.fill();
  ctx.restore();
}

function cartaPedra(ctx, carta, r, op) {
  const w = r.w, h = r.h;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x + 2, r.y + 3, w, h);
  const g = ctx.createLinearGradient(r.x, r.y, r.x + w, r.y + h);
  g.addColorStop(0, '#a6a6a2'); g.addColorStop(1, '#7b7b78');
  ctx.fillStyle = g; ctx.fillRect(r.x, r.y, w, h);
  const rnd = semente(13);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(40,40,40,0.35)' : 'rgba(255,255,255,0.3)'; circulo(ctx, r.x + rnd() * w, r.y + rnd() * h, 0.6 + rnd() * 1.6); ctx.fill(); }
  // tag velha por cima
  ctx.beginPath(); ctx.moveTo(r.x + w * 0.15, r.y + h * 0.72); ctx.bezierCurveTo(r.x + w * 0.35, r.y + h * 0.5, r.x + w * 0.5, r.y + h * 0.9, r.x + w * 0.85, r.y + h * 0.62);
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,46,136,0.45)'; ctx.lineCap = 'round'; ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.strokeRect(r.x, r.y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(r.x + 2, r.y + 2, w - 4, 3);
  // pips de hp (parafusos)
  const hp = clamp(carta.hp, 0, 3);
  for (let k = 0; k < 3; k++) {
    const x = (k - 1) * Math.min(14, w * 0.24), y = r.y + h * 0.15;
    circulo(ctx, x, y, 4.6); ctx.fillStyle = k < hp ? AMARELO : '#4a4a48'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = PRETO; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 2.5, y); ctx.lineTo(x + 2.5, y); ctx.stroke();
  }
  // rachaduras pelo hp perdido
  const perdido = 3 - hp;
  ctx.strokeStyle = PRETO; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  const rach = [[-0.35, 0.3, -0.08, 0.5, -0.28, 0.88], [0.38, 0.32, 0.1, 0.56, 0.3, 0.9], [-0.05, 0.28, 0.12, 0.44, -0.02, 0.66]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, r.y + c[1] * h); ctx.lineTo(c[2] * w, r.y + c[3] * h); ctx.lineTo(c[4] * w, r.y + c[5] * h); ctx.stroke();
  }
}

function cartaCoringa(ctx, carta, r, op) {
  const t = op.t || 0;
  adesivo(ctx, carta, r, (d) => {
    const cores = ['#ff3b3b', '#ff6b1a', AMARELO, LIMAO, CIANO, '#8a5cff'];
    const h = d.h / cores.length;
    cores.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(d.x, d.y + i * h, d.w, h + 1); });
  }, op, (d) => {
    const fx = r.h * 0.3, by = r.y + fx, bh = d.y + d.h - by, s = Math.min(d.w, bh) * 0.3;
    const cx = -s * 0.15, cy = by + bh * 0.55;
    // lata de spray
    rr(ctx, cx - s * 0.5, cy - s * 0.7, s, s * 1.5, s * 0.2); ctx.fillStyle = '#f2f2f2'; ctx.fill(); traco(ctx, s);
    ctx.save(); rr(ctx, cx - s * 0.5, cy - s * 0.7, s, s * 1.5, s * 0.2); ctx.clip();
    ['#ff3b3b', AMARELO, LIMAO, CIANO, '#8a5cff'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(cx - s * 0.5, cy - s * 0.35 + i * s * 0.2, s, s * 0.2); });
    ctx.restore();
    rr(ctx, cx - s * 0.5, cy - s * 0.7, s, s * 1.5, s * 0.2); traco(ctx, s);
    rr(ctx, cx - s * 0.3, cy - s * 1.0, s * 0.6, s * 0.32, s * 0.1); ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s * 0.7);
    ctx.fillStyle = PRETO; ctx.fillRect(cx + s * 0.12, cy - s * 1.12, s * 0.2, s * 0.14);
    // nevoa saindo do bico
    for (let k = 0; k < 7; k++) {
      const a = -0.7 + k * 0.12, rr0 = s * (0.6 + ((k * 3) % 4) * 0.18 + 0.1 * Math.sin(t * 6 + k));
      circulo(ctx, cx + s * 0.35 + Math.cos(a) * rr0, cy - s * 1.05 + Math.sin(a) * rr0, s * 0.1);
      ctx.fillStyle = ['#ff3b3b', AMARELO, LIMAO, CIANO, '#8a5cff'][k % 5]; ctx.fill();
    }
    bubble(ctx, 'CORINGA', 0, r.y + fx * 0.52, Math.min(fx * 0.6, r.w * 0.3), ROSA, d.w - 2, { semPingo: true });
  });
}

function cartaBomba(ctx, carta, r, op) {
  const t = op.t || 0;
  adesivo(ctx, carta, r, (d) => {
    ctx.fillStyle = '#1d1d1d'; ctx.fillRect(d.x, d.y, d.w, d.h);
    const rnd = semente(77);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = [ROSA, LIMAO, CIANO, AMARELO][i % 4]; circulo(ctx, d.x + rnd() * d.w, d.y + d.h * 0.3 + rnd() * d.h * 0.7, 1.5 + rnd() * 4); ctx.fill(); }
  }, op, (d) => {
    const fx = r.h * 0.3, by = r.y + fx, bh = d.y + d.h - by, s = Math.min(d.w, bh) * 0.28, cy = by + bh * 0.58;
    ctx.strokeStyle = '#e8d2a0'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(s * 0.5, cy - s * 0.8); ctx.quadraticCurveTo(s * 0.9, cy - s * 1.4, s * 1.25, cy - s * 1.15); ctx.stroke();
    const k = 0.6 + 0.4 * Math.abs(Math.sin(t * 17));
    estrela(ctx, s * 1.25, cy - s * 1.15, s * 0.45 * k, s * 0.16, 7); ctx.fillStyle = AMARELO; ctx.fill();
    circulo(ctx, 0, cy, s); ctx.fillStyle = ROSA; ctx.fill(); traco(ctx, s);
    // respingos de tinta na bomba
    ctx.fillStyle = LIMAO; elipse(ctx, -s * 0.3, cy + s * 0.25, s * 0.28, s * 0.18, 0.4); ctx.fill();
    ctx.fillStyle = CIANO; circulo(ctx, s * 0.35, cy - s * 0.2, s * 0.16); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; elipse(ctx, -s * 0.4, cy - s * 0.4, s * 0.18, s * 0.1, -0.6); ctx.fill();
    bubble(ctx, 'BOMBA', 0, r.y + fx * 0.52, Math.min(fx * 0.7, r.w * 0.32), ROSA, d.w - 2, { semPingo: true });
  });
}

function cartaDobro(ctx, carta, r, op) {
  adesivo(ctx, carta, r, (d) => fundoCor(ctx, d, CIANO, 2, 0), op, (d) => {
    const fx = r.h * 0.3, by = r.y + fx, bh = d.y + d.h - by, s = Math.min(d.w, bh) * 0.34, cy = by + bh * 0.52;
    ctx.save(); ctx.translate(0, cy); ctx.rotate(-0.7);
    rr(ctx, -s * 1.0, -s * 0.24, s * 1.5, s * 0.48, s * 0.12); ctx.fillStyle = PRETO; ctx.fill(); traco(ctx, s * 0.6);
    rr(ctx, s * 0.5, -s * 0.2, s * 0.32, s * 0.4, s * 0.08); ctx.fillStyle = '#ffffff'; ctx.fill(); traco(ctx, s * 0.6);
    ctx.beginPath(); ctx.moveTo(s * 0.82, -s * 0.12); ctx.lineTo(s * 1.08, 0); ctx.lineTo(s * 0.82, s * 0.12); ctx.closePath(); ctx.fillStyle = LIMAO; ctx.fill(); traco(ctx, s * 0.5);
    ctx.fillStyle = LIMAO; ctx.fillRect(-s * 0.7, -s * 0.24, s * 0.22, s * 0.48);
    ctx.restore();
    bubble(ctx, 'x2', 0, r.y + fx * 0.52, Math.min(fx * 0.9, r.w * 0.45), CIANO, d.w - 2);
  });
}

// ------------------------------------------------------------ cenario

function muro(ctx, W, H) {
  ctx.fillStyle = '#cfae96'; ctx.fillRect(0, 0, W, H);
  const rnd = semente(9);
  const bh = 13, bw = 30;
  for (let y = 0, linha = 0; y < H; y += bh, linha++) {
    for (let x = linha % 2 ? -bw / 2 : 0; x < W; x += bw) {
      ctx.fillStyle = misturar(TIJOLO, ['#9c3f2a', '#c45f45', '#a4472f', '#b9583f'][Math.floor(rnd() * 4)], 0.5 + rnd() * 0.5);
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      if (rnd() < 0.2) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + 1, y + bh - 4, bw - 2, 3); }
    }
  }
  // sujeira e escorrido
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(20,10,30,0.25)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/** Throw-up velho e apagado no muro. */
function throwUp(ctx, txt, x, y, tam, cor, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = 0.32;
  texto(ctx, txt, 0, 0, tam, cor, { contorno: PRETO, espessura: tam * 0.12 });
  ctx.globalAlpha = 0.22; ctx.fillStyle = cor;
  for (let k = 0; k < 4; k++) { rr(ctx, -tam * 0.8 + k * tam * 0.5, tam * 0.3, 3, 8 + ((k * 7) % 14), 1.5); ctx.fill(); }
  ctx.restore();
}

function alambrado(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(205,210,215,0.75)'; ctx.lineWidth = 1.2;
  const p = 12;
  for (let k = -h; k < w + h; k += p) {
    ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k + h, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + k + h, y); ctx.lineTo(x + k, y + h); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#9aa1a8'; ctx.strokeStyle = PRETO; ctx.lineWidth = 1.2;
  for (const px of [x, x + w]) { ctx.fillRect(px - 2.5, y - 4, 5, h + 4); ctx.strokeRect(px - 2.5, y - 4, 5, h + 4); }
  ctx.fillRect(x, y - 3, w, 4); ctx.strokeRect(x, y - 3, w, 4);
}

function cacamba(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; elipse(ctx, x + w / 2, y + h + 2, w * 0.55, 5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.2); ctx.lineTo(x + w, y + h * 0.2); ctx.lineTo(x + w * 0.94, y + h); ctx.lineTo(x + w * 0.06, y + h); ctx.closePath();
  ctx.fillStyle = '#2f7d5b'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + (w * k) / 4, y + h * 0.26); ctx.lineTo(x + (w * k) / 4, y + h * 0.94); ctx.stroke(); }
  ctx.fillStyle = '#245f46'; ctx.fillRect(x - 3, y + h * 0.1, w + 6, h * 0.12); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.strokeRect(x - 3, y + h * 0.1, w + 6, h * 0.12);
  texto(ctx, 'ZAP', x + w / 2, y + h * 0.6, h * 0.32, ROSA, { contorno: PRETO, espessura: 3 });
}

function skateEncostado(ctx, x, y, h) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.22);
  rr(ctx, -h * 0.13, -h, h * 0.26, h, h * 0.13); ctx.fillStyle = ROSA; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.stroke();
  ctx.fillStyle = AMARELO; estrela(ctx, 0, -h * 0.5, h * 0.08, h * 0.035); ctx.fill();
  for (const yy of [-h * 0.82, -h * 0.18]) for (const sx of [-1, 1]) { circulo(ctx, sx * h * 0.16, yy, h * 0.05); ctx.fillStyle = '#f2e6c9'; ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke(); }
  ctx.restore();
}

function posPoste(W, H, L) {
  const chao = calcadaY(W, H, L);
  return { x: W - 24, base: chao + 6, topo: L.topo + 30 };
}
function calcadaY(W, H, L) {
  if (L.fila.vertical) return H - 34;
  const f = L.fila;
  return Math.max(f.y + f.h + 30, H - 92);
}

function molduraSpray(ctx, m) {
  const x = m.x - 6, y = m.y - 6, w = m.w + 12, h = m.h + 12;
  rr(ctx, x, y, w, h, 14); ctx.fillStyle = 'rgba(15,10,20,0.28)'; ctx.fill();
  ctx.save();
  ctx.shadowColor = ROSA; ctx.shadowBlur = 8;
  rr(ctx, x, y, w, h, 14); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,46,136,0.85)'; ctx.stroke();
  ctx.shadowColor = CIANO; ctx.shadowBlur = 6;
  rr(ctx, x + 6, y + 6, w - 12, h - 12, 10); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,209,255,0.8)'; ctx.stroke();
  ctx.restore();
  // pingos da moldura
  const rnd = semente(21);
  for (let i = 0; i < 9; i++) {
    const px = x + 12 + rnd() * (w - 24), ph = 6 + rnd() * 18;
    rr(ctx, px - 1.6, y + h - 2, 3.2, ph, 1.6); ctx.fillStyle = 'rgba(255,46,136,0.85)'; ctx.fill();
    circulo(ctx, px, y + h - 2 + ph, 2.4); ctx.fill();
  }
}

/** Texto em estencil: letras pretas com pontes horizontais na cor do papel. */
function estencil(ctx, txt, x, y, tam, cor, papel, op = {}) {
  texto(ctx, txt, x, y, tam, cor, op);
  ctx.save();
  ctx.font = `700 ${Math.round(tam)}px Fredoka, system-ui, sans-serif`;
  let w = ctx.measureText(txt).width;
  if (op.max && w > op.max) w = op.max;
  const x0 = op.alinhar === 'left' ? x : x - w / 2;
  ctx.fillStyle = papel;
  ctx.fillRect(x0 - 2, y - tam * 0.06, w + 4, Math.max(1.2, tam * 0.07));
  ctx.restore();
}

function cartaz(ctx, x, y, w, h) {
  const rnd = semente(Math.round(w + h));
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2); ctx.rotate(-0.008);
  ctx.beginPath();
  const pts = [];
  for (let k = 0; k <= 20; k++) pts.push([-w / 2 + (k / 20) * w, -h / 2 + (rnd() - 0.5) * 3]);
  for (let k = 0; k <= 8; k++) pts.push([w / 2 + (rnd() - 0.5) * 3, -h / 2 + (k / 8) * h]);
  for (let k = 20; k >= 0; k--) pts.push([-w / 2 + (k / 20) * w, h / 2 + (rnd() - 0.5) * 3]);
  for (let k = 8; k >= 0; k--) pts.push([-w / 2 + (rnd() - 0.5) * 3, -h / 2 + (k / 8) * h]);
  pts.forEach(([px, py], i) => ctx[i ? 'lineTo' : 'moveTo'](px, py));
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.save(); ctx.translate(2, 3); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#efece2'; ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let i = 0; i < 6; i++) ctx.fillRect(-w / 2, -h / 2 + rnd() * h, w, 1);
  // fitas
  ctx.fillStyle = 'rgba(236,226,186,0.85)';
  for (const [fx, fy, a] of [[-w / 2 + 6, -h / 2 + 2, -0.6], [w / 2 - 6, -h / 2 + 2, 0.6]]) { ctx.save(); ctx.translate(fx, fy); ctx.rotate(a); ctx.fillRect(-12, -4, 24, 8); ctx.restore(); }
  ctx.restore();
}

function barraSpray(ctx, x, y, w, frac, feita) {
  ctx.lineCap = 'round';
  ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  if (frac > 0) {
    ctx.save(); ctx.shadowColor = feita ? LIMAO : ROSA; ctx.shadowBlur = 5;
    ctx.lineWidth = 6; ctx.strokeStyle = feita ? '#7ecf1d' : ROSA;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.max(2, w * frac), y); ctx.stroke();
    ctx.restore();
  }
}

// ------------------------------------------------------------ efeitos

function registrarFormas(P) {
  if (P.formas.nevoa) return;
  P.formas.nevoa = (ctx, p) => { ctx.globalAlpha *= 0.75; circulo(ctx, 0, 0, p.tam / 2); ctx.fill(); };
  P.formas.pingo = (ctx, p) => {
    const s = p.tam / 2, k = Math.min(3, 1 + Math.abs(p.vy) / 300);
    elipse(ctx, 0, 0, s * 0.6, s * k); ctx.fill();
  };
  P.formas.respingo = (ctx, p, u) => {
    const R = p.tam * (0.4 + Math.min(1, u * 5) * 0.6);
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU, k = i % 2 ? 0.7 : 1 + 0.25 * Math.sin(i * 2.3 + p.tam);
      ctx.lineTo(Math.cos(a) * R * k, Math.sin(a) * R * k);
    }
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + p.tam; circulo(ctx, Math.cos(a) * R * 1.4, Math.sin(a) * R * 1.4, R * 0.12); ctx.fill(); }
  };
  P.formas.coroa = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, s * 0.5); ctx.lineTo(-s, -s * 0.5); ctx.lineTo(-s * 0.45, 0); ctx.lineTo(0, -s * 0.75); ctx.lineTo(s * 0.45, 0); ctx.lineTo(s, -s * 0.5); ctx.lineTo(s, s * 0.5); ctx.closePath();
    ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = PRETO; ctx.stroke();
  };
  P.formas.floco = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s * 0.5, -s * 0.7); ctx.lineTo(s, s * 0.3); ctx.lineTo(-s * 0.3, s * 0.7); ctx.closePath(); ctx.fill();
  };
  P.formas.lasca = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(s * 0.2, -s); ctx.lineTo(s, s * 0.2); ctx.lineTo(-s * 0.2, s); ctx.closePath();
    ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
  };
}

function textoTela(P, mem, x, y, txt, cor, tam) {
  const W = mem.W || 390;
  const m = Math.min(W / 2 - 4, txt.length * tam * 0.34 + 10);
  P.texto(clamp(x, m, W - m), y, txt, cor, tam, PRETO);
}

function spray(P, x, y, cor, n, forca) {
  P.estourar(x, y, [cor, clarear(cor, 0.35), cor], n, forca, { forma: 'nevoa', tam: 9, g: 50, vida: 0.6 });
  for (let k = 0; k < 4; k++) P.add({ forma: 'pingo', x: x + (k - 1.5) * 9, y: y + 4, vx: (k - 1.5) * 8, vy: 40 + k * 15, g: 520, vida: 0.55, tam: 6, cor });
}

// ------------------------------------------------------------ tema

const tema = {
  id: 'grafite',
  nome: 'Grafite de Rua',
  cores: { texto: PRETO, destaque: LIMAO, particulas: [ROSA, LIMAO, CIANO, AMARELO] },
  faixas: () => ({ topo: 96, base: 0 }),

  fundo(ctx, W, H, L) {
    muro(ctx, W, H);
    const m = L.mesa;
    // throw-ups velhos
    throwUp(ctx, 'UAU', W * 0.3, L.topo + 50, 54, CIANO, -0.12);
    throwUp(ctx, '2048', W * 0.72, Math.min(H - 140, m.y + m.h + 70), 46, LIMAO, 0.08);
    throwUp(ctx, 'OI', W * 0.15, H * 0.62, 40, AMARELO, -0.2);
    // tags soltas
    const rnd = semente(4);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 7; i++) {
      const x = rnd() * W, y = L.topo + 20 + rnd() * (H - L.topo - 80);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) ctx.quadraticCurveTo(x + k * 9 + 5, y - 12 + rnd() * 24, x + k * 9 + 9, y + (rnd() - 0.5) * 8);
      ctx.lineWidth = 2.2; ctx.strokeStyle = `rgba(20,20,20,${0.25 + rnd() * 0.2})`; ctx.stroke();
    }
    // calcada
    const cy = calcadaY(W, H, L);
    ctx.fillStyle = '#7d7d7b'; ctx.fillRect(0, cy, W, H - cy);
    ctx.fillStyle = '#9b9b98'; ctx.fillRect(0, cy, W, 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
    for (let x = 30; x < W; x += 70) { ctx.beginPath(); ctx.moveTo(x, cy + 6); ctx.lineTo(x - 14, H); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, cy - 4, W, 4);
    // alambrado, cacamba, skate e poste
    if (!L.fila.vertical) {
      const y1 = m.y + m.h + 14, y2 = L.fila.y - 30;
      if (y2 - y1 > 40) alambrado(ctx, 14, y1, W * 0.42, y2 - y1);
      if (H - cy > 40) { cacamba(ctx, 12, cy - 30, 86, 58); skateEncostado(ctx, W - 70, cy + 2, 64); }
    } else {
      alambrado(ctx, 14, L.topo + 20, Math.max(40, m.x - 40), H - L.topo - 70);
      cacamba(ctx, 16, cy - 50, 96, 64);
      skateEncostado(ctx, W - 50, cy + 2, 70);
    }
    const p = posPoste(W, H, L);
    ctx.fillStyle = '#3a3d42'; ctx.fillRect(p.x - 3, p.topo, 6, p.base - p.topo);
    ctx.fillRect(p.x - 26, p.topo, 26, 5);
    rr(ctx, p.x - 40, p.topo - 2, 20, 10, 4); ctx.fill();
    molduraSpray(ctx, m);
  },

  vivo(ctx, W, H, t) {
    // luz do poste piscando de leve (o poste fica a direita, perto do topo)
    const pisca = 0.75 + 0.25 * (Math.sin(t * 13) > 0.92 ? 0.2 : 1) * (0.9 + 0.1 * Math.sin(t * 3));
    const x = W - 54, y = 136;
    const g = ctx.createRadialGradient(x, y, 2, x, y + 60, 150);
    g.addColorStop(0, `rgba(255,236,170,${0.38 * pisca})`); g.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 120, y + 260); ctx.lineTo(x - 140, y + 260); ctx.closePath(); ctx.fill();
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      ctx.save();
      ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      rr(ctx, s.x + 2, s.y + 2, s.w - 4, s.h - 4, 8); ctx.stroke();
      ctx.restore();
      texto(ctx, '+', s.x + s.w / 2, s.y + s.h / 2, s.w * 0.4, 'rgba(255,255,255,0.35)');
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return cartaPedra(ctx, carta, r, op);
    if (carta.tipo === 'coringa') return cartaCoringa(ctx, carta, r, op);
    if (carta.tipo === 'bomba') return cartaBomba(ctx, carta, r, op);
    if (carta.tipo === 'dobro') return cartaDobro(ctx, carta, r, op);
    cartaNormal(ctx, carta, r, op);
  },

  cadeado(ctx, a) {
    // porta de enrolar metalica
    const x = a.x - 4, y = a.y - 4, w = a.w + 8, h = a.h + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 2, y + 3, w, h);
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#7f8890'); g.addColorStop(0.5, '#a7b0b8'); g.addColorStop(1, '#6f7880');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    for (let yy = y + 6; yy < y + h - 8; yy += 7) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x, yy, w, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, yy + 3, w, 1.5);
    }
    ctx.fillStyle = '#4b5258'; ctx.fillRect(x, y, w, 6); ctx.fillRect(x, y + h - 10, w, 10);
    ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.strokeRect(x, y, w, h);
    // tag em cima da porta
    ctx.save(); ctx.translate(x + w / 2, y + h * 0.3); ctx.rotate(-0.2);
    texto(ctx, 'FECHADO', 0, 0, Math.min(18, w * 0.24), ROSA, { contorno: PRETO, espessura: 3, max: w - 4 });
    ctx.restore();
    // cadeado
    const cx = x + w / 2, cy = y + h - 22;
    ctx.beginPath(); ctx.arc(cx, cy - 6, 7, Math.PI, 0); ctx.lineWidth = 3.5; ctx.strokeStyle = '#c9ced6'; ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = PRETO; ctx.stroke();
    rr(ctx, cx - 10, cy - 7, 20, 16, 3); ctx.fillStyle = AMARELO; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    circulo(ctx, cx, cy, 2.4); ctx.fillStyle = PRETO; ctx.fill();
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    const cx = r.x + r.w / 2, base = r.y + r.h - 2;
    const bw = r.w * 0.8, bh = r.h * 0.62, top = base - bh;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; elipse(ctx, cx, base, bw * 0.55, 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - bw / 2, top); ctx.lineTo(cx + bw / 2, top); ctx.lineTo(cx + bw * 0.42, base); ctx.lineTo(cx - bw * 0.42, base); ctx.closePath();
    ctx.fillStyle = '#5d646b'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
    for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(cx + k * bw * 0.22, top + 5); ctx.lineTo(cx + k * bw * 0.19, base - 5); ctx.stroke(); }
    texto(ctx, 'LIXO', cx, top + bh * 0.55, Math.min(13, r.w * 0.2), LIMAO, { contorno: PRETO, espessura: 3 });
    // tampa
    ctx.save(); ctx.translate(cx, top);
    if (carga) ctx.rotate(-0.25);
    rr(ctx, -bw * 0.56, carga ? -10 : -6, bw * 1.12, 6, 3); ctx.fillStyle = '#737b83'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PRETO; ctx.stroke();
    rr(ctx, -6, carga ? -14 : -10, 12, 4, 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (!carga) {
      // lixo saindo pela tampa
      ctx.fillStyle = '#e7e2d3'; ctx.fillRect(cx - bw * 0.3, top - 12, 10, 8);
      ctx.fillStyle = CIANO; ctx.fillRect(cx + bw * 0.12, top - 14, 8, 10);
    }
    texto(ctx, carga ? 'descarte ↩' : 'cheio', cx, r.y - 6, Math.min(12, r.w * 0.19), carga ? '#ffffff' : '#bbbbbb', { contorno: PRETO, espessura: 3, max: r.w + 10 });
  },

  fila(ctx, L) {
    // shape de skate deitado embaixo dos adesivos
    const f = L.fila;
    let x, y, w, h;
    if (f.vertical) { x = f.x - 4; y = f.y - 10; w = f.w + 8; h = f.h + 20; }
    else {
      const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
      x = Math.min(p0.x, p2.x) - 26; w = Math.max(p0.x + p0.w, p2.x + p2.w) + 26 - x;
      y = p0.y - 10; h = p0.h + 20;
    }
    const raio = Math.min(w, h) / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; rr(ctx, x + 3, y + 5, w, h, raio); ctx.fill();
    // rodinhas
    ctx.fillStyle = '#f2e6c9'; ctx.strokeStyle = PRETO; ctx.lineWidth = 1.5;
    const rodas = f.vertical
      ? [[x - 3, y + h * 0.16], [x + w + 3, y + h * 0.16], [x - 3, y + h * 0.84], [x + w + 3, y + h * 0.84]]
      : [[x + w * 0.16, y - 3], [x + w * 0.16, y + h + 3], [x + w * 0.84, y - 3], [x + w * 0.84, y + h + 3]];
    for (const [rx, ry] of rodas) { circulo(ctx, rx, ry, 7); ctx.fill(); ctx.stroke(); }
    rr(ctx, x, y, w, h, raio); ctx.fillStyle = '#1e1e1e'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PRETO; ctx.stroke();
    // lixa
    const rnd = semente(5);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let i = 0; i < 90; i++) { ctx.fillRect(x + raio * 0.4 + rnd() * (w - raio * 0.8), y + 3 + rnd() * (h - 6), 1.5, 1.5); }
    rr(ctx, x + 3, y + 3, w - 6, h - 6, raio - 3); ctx.lineWidth = 2; ctx.strokeStyle = ROSA; ctx.stroke();
    const p0 = L.filaPos(0);
    if (!f.vertical) texto(ctx, 'próximo ▸', p0.x + p0.w / 2, y - 12, 14, LIMAO, { contorno: PRETO, espessura: 3.5 });
    else texto(ctx, 'próximo', x + w / 2, y - 12, 14, LIMAO, { contorno: PRETO, espessura: 3.5 });
  },

  hud(ctx, W, H, L, e, t, mem) {
    mem.W = W; mem.H = H;
    const x = 10, y = 8, w = W - 20, h = 78;
    cartaz(ctx, x, y, w, h);
    const papel = '#efece2';
    // quadra
    estencil(ctx, 'QUADRA', x + 46, y + 22, 12, PRETO, papel);
    estencil(ctx, String(e.faseId), x + 46, y + 50, 32, ROSA, papel, { contorno: PRETO, espessura: 4 });
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 90, y + 10, 2, h - 20);
    // pontos
    const px = x + w - 50;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(px - 48, y + 10, 2, h - 20);
    bubble(ctx, String(e.pontos), px, y + 36, 20, CIANO, 84, { semPingo: true });
    estencil(ctx, 'PONTOS', px, y + 62, 10, PRETO, papel);
    // metas
    const mx = x + 102, mw = px - 58 - mx;
    e.metas.forEach((m, k) => {
      const yy = y + 14 + k * 30;
      estencil(ctx, textoMeta(m, { monte: (n) => `Pinte ${n} mura${n > 1 ? 'is' : 'l'}` }).toUpperCase(), mx, yy + 4, 11, PRETO, papel, { alinhar: 'left', max: mw });
      barraSpray(ctx, mx + 3, yy + 17, mw - 6, Math.min(1, m.atual / m.alvo), m.feita);
    });
    if (e.febre) {
      const k = 1 + 0.06 * Math.sin(t * 11);
      const fy = y + h + 26;
      ctx.save(); ctx.translate(W / 2, fy); ctx.scale(k, k); ctx.rotate(-0.04);
      ctx.fillStyle = ROSA;
      for (const [dx, hh] of [[-60, 18], [-22, 26], [14, 14], [52, 22]]) { rr(ctx, dx - 2, 6, 4, hh, 2); ctx.fill(); circulo(ctx, dx, 6 + hh, 3); ctx.fill(); }
      texto(ctx, 'SPRAY x2', 0, 0, 26, ROSA, { contorno: PRETO, espessura: 5 });
      ctx.restore();
    }
  },

  efeito(fx, P, mem) {
    registrarFormas(P);
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 26, ['rgba(220,215,205,0.9)', 'rgba(170,165,160,0.9)'], 7, 0.35, { forma: 'nevoa', tam: 8, g: 60, vida: 0.45 });
        return true;
      case 'fusao': {
        const n = Math.min(11, nivel(fx.valor));
        const cor = n === 11 ? ROSA : CORES[n];
        spray(P, fx.x, fx.y, cor, 18 + fx.degrau * 6, 0.9 + fx.degrau * 0.15);
        P.anel(fx.x, fx.y, cor, 26 + fx.degrau * 6);
        if (fx.degrau > 1) textoTela(P, mem, fx.x, fx.y - 24, 'x' + fx.degrau, '#ffffff', 22 + fx.degrau * 2);
        return true;
      }
      case 'completar':
        for (const [dx, dy, c] of [[-26, -10, ROSA], [24, -18, LIMAO], [0, 16, CIANO], [30, 20, AMARELO]]) P.add({ forma: 'respingo', x: fx.x + dx, y: fx.y + dy, vida: 0.9, tam: 22, cor: c });
        P.estourar(fx.x, fx.y, [ROSA, LIMAO, CIANO, AMARELO, '#ffffff'], 30, 1.6, { forma: 'q', tam: 8, g: 420, vida: 1 });
        P.estourar(fx.x, fx.y, [AMARELO], 6, 1.1, { forma: 'coroa', tam: 16, g: 300, vida: 1 });
        textoTela(P, mem, fx.x, fx.y - 34, 'MURAL!', AMARELO, 32);
        return true;
      case 'explodir': {
        const c = [ROSA, LIMAO, CIANO, AMARELO][Math.floor(Math.abs(fx.x * 7 + fx.y)) % 4];
        P.add({ forma: 'respingo', x: fx.x, y: fx.y, vida: 0.8, tam: 30, cor: c });
        spray(P, fx.x, fx.y, c, 20, 1.3);
        return true;
      }
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#a6a6a2', '#7b7b78', '#cfcfcb'], 18, 1.1, { forma: 'lasca', tam: 9 });
        P.estourar(fx.x, fx.y, ['rgba(200,200,195,0.8)'], 8, 0.5, { forma: 'nevoa', tam: 14, g: 30, vida: 0.7 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#a6a6a2', '#cfcfcb'], 6, 0.6, { forma: 'lasca', tam: 6 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#9b9a95', '#b5b4ae', '#7f7e7a'], 16, 0.8, { forma: 'floco', tam: 9, g: 260, vida: 0.9 });
        textoTela(P, mem, fx.x, fx.y - 18, 'VOLTOU!', LIMAO, 18);
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, [AMARELO, '#ffffff'], 16, 1, { forma: 'c', tam: 4, g: 300 });
        textoTela(P, mem, fx.x, fx.y, 'ABRIU!', CIANO, 22);
        return true;
      case 'combo':
        textoTela(P, mem, fx.x, fx.y - 48, `COMBO x${fx.n}`, ROSA, 22);
        return true;
      default: return false;
    }
  },
};

export default tema;
