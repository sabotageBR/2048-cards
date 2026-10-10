// Ideia (rodada 3, tema limpo): Sumi-e. Papel washi, numero pintado em tinta
// preta, um enso na cor de acento do valor e um carimbo vermelho que cresce
// com o valor. Fundo quase vazio: papel, uma montanha em aguada e o sol.
// Sem ideogramas: o carimbo leva so formas geometricas.
import { TAU, rr, circulo, elipse, rgba, nivel, textoMeta, semente, clamp } from '../kit.js';

const SERIF = '"Noto Serif", Georgia, "Times New Roman", serif';
const TINTA = '#1f1c19';
const PAPEL = '#fbf6ea';
const VERMELHAO = '#c8442f';
const OURO = '#c9a23a';
/** Acento por nivel (2..4096). */
const ACENTOS = ['#7d8a96', '#2f4a7d', '#4f7a4a', '#c08a2e', '#7a3b5c', '#2d7a7a', '#b5432f', '#5a4a8a', '#8a6a2f', '#1f3d5a', OURO, '#9a7a2a'];

// ------------------------------------------------------------ cache

const CACHE = new Map();
const ESC = 2, PAD = 9;
/** Desenho caro (papel com fibras, sombra) feito uma vez por chave e tamanho. */
function imagem(chave, w, h, desenhar) {
  const k = `${chave}|${Math.round(w)}|${Math.round(h)}`;
  let c = CACHE.get(k);
  if (!c) {
    if (CACHE.size > 500) CACHE.clear();
    c = document.createElement('canvas');
    c.width = Math.ceil((Math.round(w) + PAD * 2) * ESC);
    c.height = Math.ceil((Math.round(h) + PAD * 2) * ESC);
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    g.scale(ESC, ESC);
    g.translate(PAD, PAD);
    desenhar(g, Math.round(w), Math.round(h));
    CACHE.set(k, c);
  }
  return c;
}
const pintar = (ctx, c, r) => ctx.drawImage(c, r.x - PAD, r.y - PAD, r.w + PAD * 2, r.h + PAD * 2);

// ------------------------------------------------------------ pincel e papel

/** Contorno de papel com borda levemente irregular; devolve a funcao que traca o caminho. */
function tracarPapel(g, x0, y0, w, h, rnd, amp = 0.8) {
  const pts = [];
  const p = 4;
  for (let x = 0; x < w; x += p) pts.push([x0 + x, y0 + (rnd() - 0.5) * amp]);
  for (let y = 0; y < h; y += p) pts.push([x0 + w + (rnd() - 0.5) * amp, y0 + y]);
  for (let x = w; x > 0; x -= p) pts.push([x0 + x, y0 + h + (rnd() - 0.5) * amp]);
  for (let y = h; y > 0; y -= p) pts.push([x0 + (rnd() - 0.5) * amp, y0 + y]);
  return () => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  };
}

function fibras(g, x0, y0, w, h, rnd, dens = 260, forca = 1) {
  const n = Math.round((w * h) / dens);
  g.lineWidth = 0.5;
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h, l = 3 + rnd() * 10, a = rnd() * TAU;
    g.strokeStyle = `rgba(140,112,76,${(0.04 + rnd() * 0.07) * forca})`;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (rnd() - 0.5) * 3, y + Math.sin(a) * l * 0.5 + (rnd() - 0.5) * 3, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
}

/** Folha de papel (carta) com sombra macia, fibras e luz de cima. */
function folha(g, w, h, rnd, cor = PAPEL) {
  const caminho = tracarPapel(g, 0, 0, w, h, rnd);
  g.save();
  g.shadowColor = 'rgba(70,50,25,0.26)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  caminho();
  g.fillStyle = cor; g.fill();
  g.restore();
  g.save();
  caminho(); g.clip();
  fibras(g, 0, 0, w, h, rnd);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, 'rgba(255,255,255,0.38)'); gr.addColorStop(1, 'rgba(160,128,86,0.09)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.restore();
  caminho();
  g.strokeStyle = 'rgba(120,95,60,0.28)'; g.lineWidth = 0.7; g.stroke();
}

/** Pincelada afilada de (x0,y0) a (x1,y1): grossa no inicio, fina no fim. */
function traco(g, x0, y0, x1, y1, esp, cor, alpha = 0.9) {
  const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang), ny = Math.cos(ang);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  g.save();
  g.globalAlpha = alpha; g.fillStyle = cor;
  g.beginPath();
  g.moveTo(x0 + nx * esp * 0.5, y0 + ny * esp * 0.5);
  g.quadraticCurveTo(mx + nx * esp * 0.38, my + ny * esp * 0.38, x1, y1);
  g.quadraticCurveTo(mx - nx * esp * 0.38, my - ny * esp * 0.38, x0 - nx * esp * 0.5, y0 - ny * esp * 0.5);
  g.closePath(); g.fill();
  circulo(g, x0, y0, esp * 0.5); g.fill();
  g.restore();
}

/** Numero com cara de pincel: tinta com uma leve sangria. */
function numero(g, txt, x, y, tam, maxW, cor = TINTA, alinhar = 'left') {
  g.save();
  g.font = `700 ${Math.round(tam)}px ${SERIF}`;
  g.textAlign = alinhar; g.textBaseline = 'middle';
  const m = g.measureText(txt).width;
  if (m > maxW) { const k = maxW / m; g.translate(x, y); g.scale(k, 1); x = 0; y = 0; }
  g.fillStyle = rgba(cor, 0.3); g.fillText(txt, x + 0.8, y + 0.6);
  g.fillStyle = cor; g.fillText(txt, x, y);
  g.restore();
}

/** Enso: circulo a pincel, grosso no inicio, afinando ate abrir. */
function enso(g, cx, cy, R, cor, esp, fase = 0) {
  g.save();
  g.lineCap = 'round'; g.strokeStyle = cor;
  const ini = -Math.PI * 0.62 + fase, fim = ini + TAU * 0.88;
  const N = 54;
  for (let i = 0; i < N; i++) {
    const u = i / N;
    const a0 = ini + (fim - ini) * u, a1 = ini + (fim - ini) * (i + 1) / N;
    const lw = esp * (u < 0.06 ? 0.55 + u * 7.5 : 1 - 0.82 * (u - 0.06) / 0.94);
    g.lineWidth = Math.max(0.6, lw);
    g.globalAlpha = 0.8 + 0.16 * Math.sin(u * 11 + fase);
    g.beginPath();
    g.arc(cx, cy, R * (1 + Math.sin(u * 7 + fase) * 0.025), a0, a1 + 0.02);
    g.stroke();
  }
  g.restore();
}

/** Carimbo vermelho (hanko) so com formas geometricas; cresce e se sofistica com o nivel. */
function hanko(g, cx, cy, s, n, rnd, liso = false) {
  g.save();
  g.fillStyle = VERMELHAO; g.globalAlpha = 0.9;
  if (n < 3) { circulo(g, cx, cy, s / 2); g.fill(); }
  else { rr(g, cx - s / 2, cy - s / 2, s, s, n < 6 ? s * 0.22 : s * 0.06); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = PAPEL; g.fillStyle = PAPEL; g.lineWidth = Math.max(0.7, s * 0.07);
  if (liso) { rr(g, cx - s * 0.4, cy - s * 0.4, s * 0.8, s * 0.8, 1); g.stroke(); }
  else if (n < 3) { circulo(g, cx, cy, s * 0.27); g.stroke(); }
  else if (n < 6) {
    g.beginPath(); g.moveTo(cx - s * 0.28, cy); g.lineTo(cx + s * 0.28, cy); g.moveTo(cx, cy - s * 0.28); g.lineTo(cx, cy + s * 0.28); g.stroke();
  } else if (n < 9) {
    rr(g, cx - s * 0.32, cy - s * 0.32, s * 0.64, s * 0.64, 1); g.stroke();
    g.beginPath(); g.moveTo(cx - s * 0.32, cy); g.lineTo(cx + s * 0.32, cy); g.stroke();
  } else {
    rr(g, cx - s * 0.36, cy - s * 0.36, s * 0.72, s * 0.72, 1); g.stroke();
    rr(g, cx - s * 0.17, cy - s * 0.17, s * 0.34, s * 0.34, 1); g.fill();
  }
  // falhas do carimbo
  g.fillStyle = rgba(PAPEL, 0.4);
  for (let i = 0; i < 6; i++) { circulo(g, cx + (rnd() - 0.5) * s * 0.9, cy + (rnd() - 0.5) * s * 0.9, 0.4 + rnd() * 0.7); g.fill(); }
  g.restore();
}

function folhaOuro(g, w, h, rnd, n = 14) {
  for (let i = 0; i < n; i++) {
    const x = w * 0.12 + rnd() * w * 0.76, y = h * 0.34 + rnd() * h * 0.6, s = 1.6 + rnd() * 3.4;
    const gr = g.createLinearGradient(x - s, y - s, x + s, y + s);
    gr.addColorStop(0, '#f0d27a'); gr.addColorStop(1, '#b48a26');
    g.fillStyle = gr; g.globalAlpha = 0.85;
    g.beginPath();
    g.moveTo(x - s * (0.6 + rnd() * 0.4), y - s * 0.3);
    g.lineTo(x + s * 0.2, y - s * (0.6 + rnd() * 0.4));
    g.lineTo(x + s * (0.6 + rnd() * 0.4), y + s * 0.2);
    g.lineTo(x - s * 0.1, y + s * (0.6 + rnd() * 0.4));
    g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
}

// ------------------------------------------------------------ cartas

const posNumero = (w, h) => {
  const tam = Math.max(11, Math.min(h * 0.22, w * 0.36));
  return { x: w * 0.1, y: h * 0.05 + tam * 0.6, tam, max: w * 0.8 };
};

function cartaNormal(g, w, h, v) {
  const n = Math.min(11, nivel(v));
  const rnd = semente(v * 131 + w * 7 + h);
  if (n === 11) {
    folha(g, w, h, rnd, '#ecd287');
    g.save();
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, 'rgba(255,240,190,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(160,110,30,0.25)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.restore();
  } else folha(g, w, h, rnd);
  const cor = ACENTOS[n];
  const p = posNumero(w, h);
  numero(g, String(v), p.x, p.y, p.tam, p.max);
  // marquinha de acento no canto (aparece mesmo com a carta coberta)
  traco(g, w * 0.9, p.y - p.tam * 0.12, w * 0.74, p.y + p.tam * 0.1, Math.max(2, w * 0.05), n === 11 ? TINTA : cor, 0.85);
  const R = Math.min(w, h * 0.72) * 0.27;
  if (n === 10) folhaOuro(g, w, h, rnd);
  enso(g, w * 0.48, h * 0.6, R, n === 11 ? TINTA : cor, Math.max(2.2, w * 0.075), n * 0.41);
  hanko(g, w * 0.77, h * 0.84, Math.min(w, h) * (0.15 + 0.011 * n), n, rnd);
}

function cartaPedra(g, w, h, hp) {
  const rnd = semente(77 + w * 3 + h);
  folha(g, w, h, rnd);
  for (let i = 0; i < 3; i++) {
    const x = w * 0.16 + i * w * 0.16, y = h * 0.14, rp = Math.max(2.2, w * 0.045);
    circulo(g, x, y, rp);
    if (i < hp) { g.fillStyle = TINTA; g.fill(); } else { g.strokeStyle = rgba(TINTA, 0.45); g.lineWidth = 1; g.stroke(); }
  }
  // pedra pintada em aguada de nanquim
  const cx = w * 0.5, cy = h * 0.62, rx = w * 0.36, ry = h * 0.21;
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU, k = 0.86 + rnd() * 0.2;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k * (Math.sin(a) > 0 ? 0.85 : 1)]);
  }
  const forma = () => {
    g.beginPath();
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m0 = m(pts[0], pts[1]); g.moveTo(m0[0], m0[1]);
    for (let i = 1; i <= pts.length; i++) { const p = pts[i % pts.length], q = m(p, pts[(i + 1) % pts.length]); g.quadraticCurveTo(p[0], p[1], q[0], q[1]); }
    g.closePath();
  };
  const gr = g.createRadialGradient(cx - rx * 0.3, cy - ry * 0.4, 1, cx, cy, rx * 1.1);
  gr.addColorStop(0, 'rgba(120,115,108,0.85)'); gr.addColorStop(1, 'rgba(40,37,34,0.95)');
  forma(); g.fillStyle = gr; g.fill();
  g.save(); forma(); g.clip();
  g.strokeStyle = 'rgba(251,246,234,0.22)'; g.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) { const y = cy - ry * 0.6 + i * ry * 0.3; g.beginPath(); g.moveTo(cx - rx * 0.7, y + rnd() * 2); g.lineTo(cx + rx * (0.1 + rnd() * 0.5), y + rnd() * 3); g.stroke(); }
  g.restore();
  const perdido = 3 - clamp(hp, 0, 3);
  g.strokeStyle = PAPEL; g.lineWidth = 1.1;
  const rach = [[-0.3, -0.5, -0.05, 0.1, -0.2, 0.6], [0.35, -0.4, 0.1, 0.05, 0.3, 0.5], [0, -0.7, 0.08, -0.2, -0.04, 0.2]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    g.beginPath(); g.moveTo(cx + c[0] * rx, cy + c[1] * ry); g.lineTo(cx + c[2] * rx, cy + c[3] * ry); g.lineTo(cx + c[4] * rx, cy + c[5] * ry); g.stroke();
  }
}

function cartaCoringa(g, w, h) {
  const rnd = semente(301 + w + h);
  folha(g, w, h, rnd);
  const p = posNumero(w, h);
  numero(g, '?', p.x, p.y, p.tam, p.max);
  const cores = ['#2f4a7d', VERMELHAO, '#4f7a4a', '#c08a2e', '#7a3b5c'];
  cores.forEach((c, i) => {
    const a = -0.9 + i * 0.45;
    traco(g, w * 0.5 + Math.cos(a + Math.PI) * w * 0.32, h * 0.66 + Math.sin(a + Math.PI) * h * 0.1, w * 0.5 + Math.cos(a) * w * 0.34, h * 0.6 + Math.sin(a) * h * 0.2, Math.max(2.5, w * 0.08), c, 0.82);
  });
}

function cartaBomba(g, w, h) {
  const rnd = semente(401 + w + h);
  folha(g, w, h, rnd);
  const p = posNumero(w, h);
  numero(g, '!', p.x, p.y, p.tam, p.max, VERMELHAO);
  const cx = w * 0.5, cy = h * 0.62, R = Math.min(w, h) * 0.24;
  g.fillStyle = VERMELHAO;
  g.beginPath();
  const lob = 9;
  for (let i = 0; i <= lob; i++) {
    const a = (i / lob) * TAU, rr0 = R * (0.78 + rnd() * 0.32);
    const ap = a - Math.PI / lob, rp = R * (0.55 + rnd() * 0.15);
    if (!i) g.moveTo(cx + Math.cos(a) * rr0, cy + Math.sin(a) * rr0);
    else g.quadraticCurveTo(cx + Math.cos(ap) * rp * 1.5, cy + Math.sin(ap) * rp * 1.5, cx + Math.cos(a) * rr0, cy + Math.sin(a) * rr0);
  }
  g.closePath(); g.globalAlpha = 0.92; g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#8a2a1c'; circulo(g, cx - R * 0.1, cy - R * 0.05, R * 0.38); g.fill();
  g.fillStyle = VERMELHAO;
  for (let i = 0; i < 7; i++) { const a = rnd() * TAU, d = R * (1.2 + rnd() * 0.5); circulo(g, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 0.8 + rnd() * 1.8); g.fill(); }
}

function cartaDobro(g, w, h) {
  const rnd = semente(501 + w + h);
  folha(g, w, h, rnd);
  const p = posNumero(w, h);
  numero(g, '×2', p.x, p.y, p.tam, p.max);
  numero(g, '×2', w * 0.5, h * 0.6, Math.min(w * 0.5, h * 0.34), w * 0.8, '#5a4a8a', 'center');
  traco(g, w * 0.18, h * 0.8, w * 0.84, h * 0.77, Math.max(2, w * 0.055), '#5a4a8a', 0.75);
}

/** Papel encerado por cima (gelo); o numero e repintado para continuar legivel. */
function gelo(ctx, r, v) {
  ctx.save();
  rr(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 2);
  ctx.fillStyle = 'rgba(228,238,243,0.6)'; ctx.fill();
  ctx.save(); ctx.clip();
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  g.addColorStop(0.28, 'rgba(255,255,255,0)'); g.addColorStop(0.44, 'rgba(255,255,255,0.5)'); g.addColorStop(0.58, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(140,165,182,0.55)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.06, r.y + r.h * 0.72); ctx.lineTo(r.x + r.w * 0.94, r.y + r.h * 0.56); ctx.stroke();
  ctx.restore();
  rr(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 2);
  ctx.strokeStyle = 'rgba(140,165,185,0.75)'; ctx.lineWidth = 1; ctx.stroke();
  const p = posNumero(r.w, r.h);
  ctx.globalAlpha = 0.85;
  numero(ctx, String(v), r.x + p.x, r.y + p.y, p.tam, p.max);
  ctx.restore();
}

// ------------------------------------------------------------ particulas

function registrarFormas(P) {
  if (P.formas.txtSumie) return;
  P.formas.txtSumie = (ctx, p) => {
    ctx.font = `700 ${Math.round(p.tam)}px ${SERIF}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.txt, 0, 0);
  };
  P.formas.gota = (ctx, p) => { elipse(ctx, 0, 0, p.tam * 0.5, p.tam * 0.36); ctx.fill(); };
  P.formas.petala = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.9, -s * 0.2, 0, s); ctx.quadraticCurveTo(-s * 0.9, -s * 0.2, 0, -s);
    ctx.fill();
  };
  P.formas.lasca = (ctx, p) => { ctx.fillRect(-p.tam / 2, -p.tam / 3, p.tam, p.tam * 0.66); };
  P.formas.carimbo = (ctx, p, u) => {
    const s = p.tam * (1.3 - 0.3 * Math.min(1, u * 5));
    rr(ctx, -s / 2, -s / 2, s, s, s * 0.06); ctx.fill();
    ctx.strokeStyle = rgba(PAPEL, 0.9); ctx.lineWidth = s * 0.06;
    rr(ctx, -s * 0.34, -s * 0.34, s * 0.68, s * 0.68, 1); ctx.stroke();
    rr(ctx, -s * 0.15, -s * 0.15, s * 0.3, s * 0.3, 1); ctx.fillStyle = rgba(PAPEL, 0.9); ctx.fill();
  };
  P.formas.pincelada = (ctx, p, u) => {
    const R = p.raio, k = Math.min(1, u * 2.4);
    ctx.lineCap = 'round'; ctx.strokeStyle = p.cor;
    const N = 30, ini = -Math.PI * 0.9;
    for (let i = 0; i < N * k; i++) {
      const a0 = ini + (i / N) * Math.PI * 1.7, a1 = ini + ((i + 1) / N) * Math.PI * 1.7;
      ctx.lineWidth = Math.max(1, R * 0.16 * (1 - (i / N) * 0.8));
      ctx.beginPath(); ctx.arc(0, 0, R, a0, a1 + 0.02); ctx.stroke();
    }
  };
}

function txt(P, x, y, s, tam, cor, vida = 1) {
  P.add({ forma: 'txtSumie', x, y, vy: -36, g: 0, arrasto: 1, vida, tam, cor, txt: s });
}

// ------------------------------------------------------------ tema

function barraPincel(ctx, x, y, w, frac, feita) {
  ctx.save();
  rr(ctx, x, y, w, 4, 2); ctx.fillStyle = rgba(TINTA, 0.1); ctx.fill();
  if (frac > 0) {
    const fw = Math.max(6, w * clamp(frac));
    traco(ctx, x + 2, y + 2, x + fw, y + 2.4, 5, feita ? VERMELHAO : TINTA, 0.85);
  }
  ctx.restore();
}

const tema = {
  id: 'sumie',
  nome: 'Sumi-ê',
  cores: { texto: TINTA, destaque: VERMELHAO, particulas: [TINTA, VERMELHAO] },
  faixas: () => ({ topo: 96, base: 0 }),

  fundo(ctx, W, H, L) {
    ctx.fillStyle = '#f2e8d4'; ctx.fillRect(0, 0, W, H);
    const rnd = semente(2026);
    fibras(ctx, 0, 0, W, H, rnd, 700, 0.9);
    for (let i = 0; i < 7; i++) {
      const x = rnd() * W, y = rnd() * H, R = 60 + rnd() * 140;
      const g = ctx.createRadialGradient(x, y, 1, x, y, R);
      g.addColorStop(0, `rgba(255,252,242,${0.18 + rnd() * 0.12})`); g.addColorStop(1, 'rgba(255,252,242,0)');
      ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    }
    // montanha em aguada, atras do alto da mesa
    const m = L.mesa, base = m.y + Math.min(60, m.h * 0.25), alt = Math.min(W, H) * 0.24;
    const picos = [[0.18, 0.55], [0.36, 0.9], [0.62, 0.7], [0.84, 1]];
    const crista = (k, amp) => {
      ctx.beginPath(); ctx.moveTo(-10, base + 40);
      for (let x = -10; x <= W + 10; x += 6) {
        let y = 0;
        for (const [px, ph] of picos) { const d = (x / W - px) / (0.11 + ph * 0.05); y += ph * Math.exp(-d * d); }
        ctx.lineTo(x, base - y * alt * amp + Math.sin(x * 0.07 + k) * 1.5);
      }
      ctx.lineTo(W + 10, base + 40); ctx.closePath();
    };
    ctx.save();
    ctx.filter = 'blur(1.2px)';
    for (const [k, amp, a] of [[1, 1, 0.12], [3, 0.62, 0.17]]) {
      crista(k, amp);
      const g = ctx.createLinearGradient(0, base - alt * amp, 0, base + 30);
      g.addColorStop(0, `rgba(55,50,45,${a})`); g.addColorStop(1, 'rgba(55,50,45,0)');
      ctx.fillStyle = g; ctx.fill();
    }
    ctx.restore();
    // sol
    const sx = W * 0.78, sy = Math.max(L.topo + 30, base - alt * 1.15);
    ctx.fillStyle = rgba(VERMELHAO, 0.82); circulo(ctx, sx, sy, Math.min(W, H) * 0.042); ctx.fill();
    // vinheta
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,60,30,0.14)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // mesa: folha mais clara
    const rm = semente(9);
    const caminho = tracarPapel(ctx, m.x, m.y, m.w, m.h, rm, 1.4);
    ctx.save();
    ctx.shadowColor = 'rgba(80,55,25,0.2)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    caminho(); ctx.fillStyle = '#f9f3e5'; ctx.fill();
    ctx.restore();
    ctx.save(); caminho(); ctx.clip(); fibras(ctx, m.x, m.y, m.w, m.h, rm, 300, 0.8); ctx.restore();
    caminho(); ctx.strokeStyle = 'rgba(120,95,60,0.22)'; ctx.lineWidth = 1; ctx.stroke();
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      ctx.save();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = rgba(TINTA, 0.2); ctx.lineWidth = 1.2;
      rr(ctx, s.x + 2, s.y + 2, s.w - 4, s.h - 4, 2); ctx.stroke();
      ctx.restore();
    }
  },

  peca(ctx, carta, r, op) {
    let c;
    if (carta.tipo === 'pedra') c = imagem('pedra' + carta.hp, r.w, r.h, (g, w, h) => cartaPedra(g, w, h, carta.hp));
    else if (carta.tipo === 'coringa') c = imagem('coringa', r.w, r.h, cartaCoringa);
    else if (carta.tipo === 'bomba') c = imagem('bomba', r.w, r.h, cartaBomba);
    else if (carta.tipo === 'dobro') c = imagem('dobro', r.w, r.h, cartaDobro);
    else c = imagem('v' + carta.v, r.w, r.h, (g, w, h) => cartaNormal(g, w, h, carta.v));
    pintar(ctx, c, r);
    if (carta.tipo === 'bomba') {
      const k = 0.5 + 0.5 * Math.sin((op.t || 0) * 7);
      ctx.save(); ctx.strokeStyle = rgba(VERMELHAO, 0.18 + 0.22 * k); ctx.lineWidth = 2;
      circulo(ctx, 0, r.y + r.h * 0.62, Math.min(r.w, r.h) * (0.32 + 0.04 * k)); ctx.stroke(); ctx.restore();
    }
    if (carta.tipo === 'normal' && carta.gelo) gelo(ctx, r, carta.v);
    if (op.destaque) {
      ctx.save(); rr(ctx, r.x - 2.5, r.y - 2.5, r.w + 5, r.h + 5, 3);
      ctx.strokeStyle = rgba(VERMELHAO, op.destaque * 0.8); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
    }
  },

  cadeado(ctx, a) {
    ctx.save();
    rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 3);
    ctx.fillStyle = 'rgba(243,234,215,0.8)'; ctx.fill();
    const cy = a.y + Math.min(a.h * 0.3, a.w * 0.9), bh = Math.max(14, a.w * 0.3);
    ctx.translate(a.x + a.w / 2, cy); ctx.rotate(-0.07);
    ctx.shadowColor = 'rgba(70,50,25,0.22)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
    ctx.fillStyle = PAPEL; ctx.fillRect(-a.w / 2 - 8, -bh / 2, a.w + 16, bh);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(120,95,60,0.3)'; ctx.lineWidth = 0.7; ctx.strokeRect(-a.w / 2 - 8, -bh / 2, a.w + 16, bh);
    hanko(ctx, 0, 0, bh * 0.82, 9, semente(5));
    ctx.restore();
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    ctx.save();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = rgba(TINTA, carga ? 0.32 : 0.12); ctx.lineWidth = 1.2;
    rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 2); ctx.stroke();
    ctx.setLineDash([]);
    if (!e.descarte) {
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.48, R = Math.min(r.w, r.h) * 0.18;
      ctx.strokeStyle = rgba(TINTA, carga ? 0.4 : 0.15); ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI * 0.2, Math.PI * 1.35); ctx.stroke();
      const ax = cx + Math.cos(-Math.PI * 0.2) * R, ay = cy + Math.sin(-Math.PI * 0.2) * R;
      ctx.beginPath(); ctx.moveTo(ax - 5, ay - 2); ctx.lineTo(ax, ay); ctx.lineTo(ax + 1, ay - 6); ctx.stroke();
    }
    ctx.font = `600 10px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = rgba(TINTA, carga ? 0.5 : 0.3);
    ctx.fillText(carga ? 'descarte' : 'sem carga', r.x + r.w / 2, r.y + r.h + 5);
    ctx.restore();
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) { traco(ctx, f.x - 4, f.y + 6, f.x - 3, f.y + f.h - 6, 2.4, TINTA, 0.25); return; }
    const p0 = L.filaPos(0), pn = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, pn.x) - 12, x1 = Math.max(p0.x + p0.w, pn.x + pn.w) + 12;
    traco(ctx, x0, p0.y + p0.h + 10, x1, p0.y + p0.h + 11, 2.6, TINTA, 0.3);
  },

  hud(ctx, W, H, L, e, t) {
    // carimbo da fase
    const s = 34;
    hanko(ctx, 30, 34, s, 7, semente(3), true);
    ctx.save();
    ctx.font = `700 15px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = PAPEL; ctx.fillText(String(e.faseId), 30, 35);
    ctx.font = `600 10px ${SERIF}`; ctx.fillStyle = rgba(TINTA, 0.55); ctx.fillText('fase', 30, 62);
    ctx.restore();
    // placar
    numero(ctx, String(e.pontos), W / 2, 30, 28, W * 0.5, TINTA, 'center');
    // metas com traco de pincel
    const n = e.metas.length;
    const larg = Math.min(560, W - 150), gap = 16;
    const bw = n > 1 ? (larg - gap) / 2 : larg, x0 = W / 2 - larg / 2;
    e.metas.forEach((m, k) => {
      const x = x0 + k * (bw + gap);
      ctx.save();
      ctx.font = `600 11px ${SERIF}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(TINTA, m.feita ? 0.85 : 0.6);
      let txtm = textoMeta(m, { monte: (q) => `Complete ${q} monte${q > 1 ? 's' : ''}` });
      while (ctx.measureText(txtm).width > bw && txtm.length > 4) txtm = txtm.slice(0, -2) + '…';
      ctx.fillText(txtm, x, 58);
      ctx.restore();
      barraPincel(ctx, x, 67, bw, m.atual / m.alvo, m.feita);
    });
    traco(ctx, 16, 88, W - 16, 88.5, 1.4, TINTA, 0.12);
    if (e.febre) {
      const k = 0.55 + 0.45 * Math.sin(t * 6);
      ctx.save(); ctx.globalAlpha = k;
      ctx.font = `700 15px ${SERIF}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = VERMELHAO; ctx.fillText('VENTO ×2', W - 18, 32);
      ctx.restore();
      traco(ctx, W - 96, 44, W - 20, 44, 2.2, VERMELHAO, 0.55 * k);
    }
  },

  efeito(fx, P) {
    registrarFormas(P);
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 16, [rgba(TINTA, 0.5)], 4, 0.3, { g: 200, vida: 0.4, tam: 2.5, forma: 'gota' });
        return true;
      case 'fusao': {
        const cor = ACENTOS[Math.min(11, nivel(fx.valor))];
        P.anel(fx.x, fx.y, rgba(TINTA, 0.55), 26 + fx.degrau * 5, 0.5);
        P.estourar(fx.x, fx.y, [TINTA, cor], 5 + fx.degrau * 2, 0.55 + fx.degrau * 0.08, { g: 380, vida: 0.55, tam: 4, forma: 'gota' });
        if (fx.degrau > 1) {
          P.estourar(fx.x, fx.y, ['#e9a6a6', '#f3c6c0'], 2 + fx.degrau, 0.5, { g: 60, vida: 1.2, tam: 6, forma: 'petala' });
          txt(P, fx.x + 30, fx.y - 14, '×' + fx.degrau, 18 + fx.degrau * 2, TINTA);
        }
        return true;
      }
      case 'completar':
        P.add({ forma: 'pincelada', x: fx.x, y: fx.y, vida: 1.1, tam: 1, raio: 40, cor: OURO, g: 0 });
        P.add({ forma: 'carimbo', x: fx.x + 24, y: fx.y + 18, vida: 1.2, tam: 30, cor: VERMELHAO, g: 0, rot: -0.12 });
        P.estourar(fx.x, fx.y, ['#e6c35a', '#b48a26'], 16, 0.9, { g: 120, vida: 1.1, tam: 4, forma: 'lasca' });
        txt(P, fx.x, fx.y - 44, String(fx.valor), 26, OURO, 1.2);
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, [VERMELHAO, '#8a2a1c', TINTA], 16, 1.1, { g: 420, vida: 0.6, tam: 5, forma: 'gota' });
        P.anel(fx.x, fx.y, rgba(VERMELHAO, 0.6), 40, 0.45);
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, [TINTA, '#5a5650', '#8a8680'], 12, 0.9, { g: 500, vida: 0.6, tam: 4, forma: 'lasca' });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, [TINTA, '#8a8680'], 4, 0.5, { g: 400, vida: 0.4, tam: 3, forma: 'lasca' });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['rgba(240,246,250,0.95)', 'rgba(200,215,225,0.9)'], 10, 0.6, { g: 80, vida: 0.9, tam: 5, forma: 'lasca' });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, [PAPEL, VERMELHAO], 10, 0.8, { g: 160, vida: 0.9, tam: 5, forma: 'lasca' });
        txt(P, fx.x, fx.y - 20, 'livre', 16, TINTA);
        return true;
      case 'combo':
        txt(P, fx.x, fx.y - 46, `combo ×${fx.n}`, 16, VERMELHAO);
        return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    const y0 = H * 0.38, h = Math.min(150, H * 0.18);
    ctx.save();
    ctx.fillStyle = 'rgba(250,245,234,0.95)'; ctx.fillRect(0, y0, W, h);
    traco(ctx, 0, y0, W, y0 + 1, 2, TINTA, 0.25);
    traco(ctx, W, y0 + h, 0, y0 + h - 1, 2, TINTA, 0.25);
    const venceu = e.fim === 'venceu';
    const titulo = venceu ? 'Fase completa' : 'Sem jogadas', tam = Math.min(34, W * 0.08);
    numero(ctx, titulo, W / 2 + 16, y0 + h * 0.42, tam, W * 0.7, TINTA, 'center');
    ctx.font = `700 ${Math.round(tam)}px ${SERIF}`;
    const lw = Math.min(W * 0.7, ctx.measureText(titulo).width);
    hanko(ctx, W / 2 + 16 - lw / 2 - 22, y0 + h * 0.42, 24, 9, semente(4));
    ctx.font = `600 13px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(TINTA, 0.6); ctx.fillText('toque para jogar de novo', W / 2, y0 + h * 0.76);
    ctx.restore();
  },
};

export default tema;
