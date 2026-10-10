// Ideia (rodada 3): Vidro Fosco. Cartas de vidro de verdade: cada placa mostra
// o fundo desfocado atras dela (copia borrada do fundo, recortada na posicao
// absoluta da carta), com veu tingido pela cor do valor, borda de luz e sombra
// macia. Fundo de aurora parado, mesa e bandeja da fila em vidro (assadas no
// fundo), HUD em pilulas de vidro. Nada de cenario: so luz, vidro e numero.
import { rr, circulo, texto, rgba, nivel, textoMeta, clamp, easeOut } from '../kit.js';

const FONTE = '"Ubuntu Sans", "Noto Sans", "Segoe UI", system-ui, sans-serif';
const CORES = ['#7dd3fc', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa', '#c084fc', '#f87171', '#fcd34d', '#ffffff'];
const corDe = (v) => CORES[Math.min(CORES.length - 1, nivel(v))];
const BASE = '#18143a';

/** Copia desfocada do fundo, em pixels do dispositivo (o vidro "ve" o que esta atras). */
let BORRADO = null;

function borrar(origem, raio) {
  const c = document.createElement('canvas');
  c.width = origem.width; c.height = origem.height;
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.fillStyle = BASE; g.fillRect(0, 0, c.width, c.height);
  g.filter = `blur(${raio}px)`;
  g.drawImage(origem, 0, 0);
  g.filter = 'none';
  return c;
}

/** Desenha o recorte do fundo desfocado sob o caminho atual (ja recortado), em qualquer transformacao. */
function verAtras(ctx, x, y, w, h) {
  if (!BORRADO) return;
  const m = ctx.getTransform();
  const xs = [], ys = [];
  for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
    xs.push(m.a * px + m.c * py + m.e); ys.push(m.b * px + m.d * py + m.f);
  }
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 2), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 2);
  const x1 = Math.min(BORRADO.width, Math.ceil(Math.max(...xs)) + 2), y1 = Math.min(BORRADO.height, Math.ceil(Math.max(...ys)) + 2);
  if (x1 <= x0 || y1 <= y0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(BORRADO, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ctx.setTransform(m);
}

/** Borda de luz: forte no topo e a esquerda, quase sumindo embaixo a direita. */
function borda(ctx, x, y, w, h, raio, forca = 1) {
  const g = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
  g.addColorStop(0, `rgba(255,255,255,${0.85 * forca})`);
  g.addColorStop(0.4, `rgba(255,255,255,${0.28 * forca})`);
  g.addColorStop(1, `rgba(255,255,255,${0.08 * forca})`);
  rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, raio);
  ctx.lineWidth = 1.2; ctx.strokeStyle = g; ctx.stroke();
}

/**
 * Placa de vidro: sombra macia, fundo desfocado atras, veu branco tingido e borda de luz.
 * op: { tinta, tintaA, branco, sombra, sombraBlur, sombraY, bordaForca }
 */
function placa(ctx, x, y, w, h, raio, op = {}) {
  if (op.sombra !== false) {
    ctx.save();
    ctx.shadowColor = 'rgba(6,4,28,0.42)'; ctx.shadowBlur = op.sombraBlur ?? 16; ctx.shadowOffsetY = op.sombraY ?? 6;
    rr(ctx, x, y, w, h, raio); ctx.fillStyle = BASE; ctx.fill();
    ctx.restore();
  }
  ctx.save();
  rr(ctx, x, y, w, h, raio); ctx.clip();
  verAtras(ctx, x, y, w, h);
  // tinta do valor no vidro inteiro (a faixa de cima das cartas cobertas tambem precisa da cor)
  ctx.fillStyle = rgba(op.tinta || '#ffffff', op.tintaA ?? 0.1); ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(x, y, x + w * 0.5, y + h * 0.8);
  g.addColorStop(0, rgba('#ffffff', op.branco ?? 0.2));
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.restore();
  borda(ctx, x, y, w, h, raio, op.bordaForca ?? 1);
}

/** Numero no canto, como na referencia: branco, nitido, com sombra suave para contraste. */
function numero(ctx, txt, x, y, w, h, cor = '#ffffff') {
  const n = txt.length;
  const tam = Math.min(h * 0.27, w * (n >= 4 ? 0.27 : n === 3 ? 0.34 : 0.42));
  ctx.save();
  ctx.shadowColor = 'rgba(12,8,40,0.6)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1;
  texto(ctx, txt, x + w * 0.12, y + h * 0.16, tam, cor, { fonte: FONTE, peso: 800, alinhar: 'left', max: w * 0.8 });
  ctx.restore();
}

/** Luz da cor do valor dentro do vidro e brilho do topo. */
function luzInterna(ctx, x, y, w, h, raio, cor, forca = 1) {
  ctx.save();
  rr(ctx, x, y, w, h, raio); ctx.clip();
  const gr = ctx.createRadialGradient(0, y + h * 0.68, 0, 0, y + h * 0.68, w * 0.75);
  gr.addColorStop(0, rgba(cor, 0.75 * forca)); gr.addColorStop(1, rgba(cor, 0));
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  const gs = ctx.createLinearGradient(0, y, 0, y + h * 0.45);
  gs.addColorStop(0, 'rgba(255,255,255,0.22)'); gs.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gs; ctx.fillRect(x, y, w, h * 0.45);
  ctx.restore();
}

function estrela4(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.closePath();
}

function floco(ctx, x, y, s) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke();
  }
  ctx.restore();
}

function cadeadoIcone(ctx, cx, cy, s, cor = '#ffffff') {
  ctx.save();
  ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1.6, s * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.15, s * 0.36, Math.PI, 0); ctx.lineTo(cx + s * 0.36, cy + s * 0.05); ctx.moveTo(cx - s * 0.36, cy - s * 0.15); ctx.lineTo(cx - s * 0.36, cy + s * 0.05); ctx.stroke();
  rr(ctx, cx - s * 0.55, cy + s * 0.05, s * 1.1, s * 0.8, s * 0.16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.32); ctx.lineTo(cx, cy + s * 0.55); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------ pecas

function cartaNormal(ctx, carta, r, op) {
  const { x, y, w, h } = r;
  const raio = Math.max(6, w * 0.14);
  const v = carta.v, cor = corDe(v);
  const ouro = v >= 2048;
  placa(ctx, x, y, w, h, raio, { tinta: cor, tintaA: ouro ? 0.6 : 0.5, branco: v >= 4096 ? 0.4 : 0.22 });
  luzInterna(ctx, x, y, w, h, raio, cor, ouro ? 1.15 : 1);
  if (v >= 4096) {
    // iridescente: arco-iris girando devagar dentro do vidro
    ctx.save(); rr(ctx, x, y, w, h, raio); ctx.clip();
    const cg = ctx.createConicGradient((op.t || 0) * 0.6, 0, y + h * 0.6);
    ['#f472b6', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6'].forEach((c, i, a) => cg.addColorStop(i / (a.length - 1), rgba(c, 0.32)));
    ctx.fillStyle = cg; ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  if (carta.gelo) {
    // vidro mais opaco e esbranquicado, com cristais finos
    ctx.save(); rr(ctx, x, y, w, h, raio); ctx.clip();
    ctx.fillStyle = 'rgba(235,245,255,0.38)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.9;
    const pts = [[0.2, 0.55, 0.42, 0.78], [0.62, 0.42, 0.86, 0.6], [0.3, 0.86, 0.55, 0.7], [0.7, 0.8, 0.52, 0.96]];
    for (const [a, b, c, d] of pts) { ctx.beginPath(); ctx.moveTo(x + w * a, y + h * b); ctx.lineTo(x + w * c, y + h * d); ctx.stroke(); }
    ctx.restore();
    floco(ctx, x + w * 0.82, y + h * 0.16, Math.min(w, h) * 0.08);
  }
  borda(ctx, x, y, w, h, raio, ouro ? 1.2 : 1);
  if (ouro) {
    // 2048: brilho dourado passando devagar
    ctx.save(); rr(ctx, x, y, w, h, raio); ctx.clip();
    const u = ((op.t || 0) * 0.35) % 1.6 - 0.3;
    const gx = x + w * u * 1.6;
    const gb = ctx.createLinearGradient(gx - w * 0.35, y, gx + w * 0.35, y + h * 0.4);
    gb.addColorStop(0, 'rgba(255,255,255,0)'); gb.addColorStop(0.5, 'rgba(255,250,220,0.35)'); gb.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gb; ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  numero(ctx, String(v), x, y, w, h);
  destaque(ctx, x, y, w, h, raio, op.destaque);
}

function destaque(ctx, x, y, w, h, raio, d) {
  if (!d) return;
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 12;
  rr(ctx, x - 1, y - 1, w + 2, h + 2, raio + 1);
  ctx.strokeStyle = `rgba(255,255,255,${0.3 + d * 0.5})`; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.restore();
}

function cartaPedra(ctx, carta, r, op) {
  const { x, y, w, h } = r;
  const raio = Math.max(6, w * 0.14);
  placa(ctx, x, y, w, h, raio, { tinta: '#05060f', tintaA: 0.72, branco: 0.06, bordaForca: 0.55 });
  const hp = clamp(carta.hp ?? 3, 0, 3);
  // rachaduras pelo hp perdido
  ctx.save(); rr(ctx, x, y, w, h, raio); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.lineJoin = 'round';
  const rach = [
    [[0.5, 0.4], [0.38, 0.58], [0.46, 0.7], [0.3, 0.95]],
    [[0.5, 0.4], [0.7, 0.55], [0.64, 0.72], [0.86, 0.9]],
    [[0.5, 0.4], [0.62, 0.28], [0.9, 0.3]],
  ];
  for (let k = 0; k < 3 - hp; k++) {
    ctx.beginPath(); rach[k].forEach(([a, b], i) => ctx[i ? 'lineTo' : 'moveTo'](x + w * a, y + h * b)); ctx.stroke();
  }
  ctx.restore();
  // pips de hp na faixa de cima
  for (let k = 0; k < 3; k++) {
    circulo(ctx, x + w * 0.2 + k * w * 0.16, y + h * 0.16, Math.max(2.2, w * 0.045));
    ctx.fillStyle = k < hp ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.14)'; ctx.fill();
  }
  destaque(ctx, x, y, w, h, raio, op.destaque);
}

function cartaEspecial(ctx, carta, r, op) {
  const { x, y, w, h } = r;
  const raio = Math.max(6, w * 0.14);
  const t = op.t || 0;
  if (carta.tipo === 'coringa') {
    placa(ctx, x, y, w, h, raio, { tinta: '#ffffff', tintaA: 0.12, branco: 0.28 });
    ctx.save(); rr(ctx, x, y, w, h, raio); ctx.clip();
    const cg = ctx.createConicGradient(t * 0.8, 0, y + h * 0.58);
    ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6'].forEach((c, i, a) => cg.addColorStop(i / (a.length - 1), rgba(c, 0.5)));
    ctx.fillStyle = cg; ctx.fillRect(x, y, w, h);
    ctx.restore();
    borda(ctx, x, y, w, h, raio, 1.2);
    ctx.save(); ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 10;
    estrela4(ctx, 0, y + h * 0.6, Math.min(w, h) * 0.24); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
    numero(ctx, '?', x, y, w, h);
  } else if (carta.tipo === 'bomba') {
    const p = 0.5 + 0.5 * Math.sin(t * 7);
    placa(ctx, x, y, w, h, raio, { tinta: '#ef4444', tintaA: 0.5 + p * 0.15, branco: 0.14 });
    luzInterna(ctx, x, y, w, h, raio, '#ff4d6d', 0.7 + p * 0.5);
    borda(ctx, x, y, w, h, raio);
    // icone de bomba em linha
    const cx = 0, cy = y + h * 0.62, s = Math.min(w, h) * 0.2;
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    circulo(ctx, cx, cy, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + s * 0.6, cy - s * 0.8); ctx.quadraticCurveTo(cx + s * 1.1, cy - s * 1.5, cx + s * 1.5, cy - s * 1.2); ctx.stroke();
    ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 8 + p * 6;
    circulo(ctx, cx + s * 1.5, cy - s * 1.2, 1.8 + p * 1.6); ctx.fillStyle = '#ffe9a8'; ctx.fill();
    ctx.restore();
    numero(ctx, '!', x, y, w, h);
  } else {
    // dobro
    placa(ctx, x, y, w, h, raio, { tinta: '#2dd4bf', tintaA: 0.45, branco: 0.2 });
    luzInterna(ctx, x, y, w, h, raio, '#5eead4');
    borda(ctx, x, y, w, h, raio);
    ctx.save(); ctx.shadowColor = 'rgba(10,40,40,0.55)'; ctx.shadowBlur = 8;
    texto(ctx, '×2', 0, y + h * 0.62, Math.min(w * 0.5, h * 0.34), '#ffffff', { fonte: FONTE, peso: 800 });
    ctx.restore();
    numero(ctx, '×2', x, y, w, h);
  }
  destaque(ctx, x, y, w, h, raio, op.destaque);
}

// ------------------------------------------------------------ particulas

function registrarFormas(P) {
  if (P.formas.luz4) return;
  P.formas.luz4 = (ctx, p) => {
    ctx.shadowColor = p.cor; ctx.shadowBlur = p.tam;
    estrela4(ctx, 0, 0, p.tam / 2); ctx.fill();
  };
  P.formas.rotulo = (ctx, p, u) => {
    const esc = u < 0.15 ? 0.75 + (u / 0.15) * 0.3 : 1.05 - (u - 0.15) * 0.08;
    ctx.scale(esc / Math.max(0.6, 1 - u * 0.4), esc / Math.max(0.6, 1 - u * 0.4));
    ctx.shadowColor = 'rgba(12,8,40,0.7)'; ctx.shadowBlur = 10;
    texto(ctx, p.txt, 0, 0, p.tam, p.cor, { fonte: FONTE, peso: 800 });
  };
  P.formas.caco = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(s * 0.4, -s); ctx.lineTo(s * 0.8, s * 0.6); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
  };
}

function rotulo(P, x, y, txt, tam, cor = '#ffffff') {
  P.add({ forma: 'rotulo', x, y, vy: -55, g: 0, arrasto: 1, vida: 0.95, tam, cor, txt });
}

// ------------------------------------------------------------ tema

const tema = {
  id: 'vidro',
  nome: 'Vidro Fosco',
  cores: { texto: '#ffffff', destaque: '#fde68a', particulas: ['#ffffff', '#c4b5fd', '#7dd3fc'] },
  faixas: (W, H) => ({ topo: W > H ? 96 : 104, base: 0 }),

  fundo(ctx, W, H, L) {
    const dpr = ctx.getTransform().a || 1;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#16123a'); g.addColorStop(0.55, '#1d1747'); g.addColorStop(1, '#101a3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // manchas de aurora (grandes e macias)
    const m = Math.max(W, H);
    const mancha = (x, y, raio, cor, a) => {
      const gr = ctx.createRadialGradient(x, y, 0, x, y, raio);
      gr.addColorStop(0, rgba(cor, a)); gr.addColorStop(0.55, rgba(cor, a * 0.45)); gr.addColorStop(1, rgba(cor, 0));
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    };
    mancha(W * 0.08, H * 0.2, m * 0.55, '#8b5cf6', 0.8);
    mancha(W * 0.98, H * 0.4, m * 0.5, '#22d3ee', 0.55);
    mancha(W * 0.02, H * 0.74, m * 0.5, '#f472b6', 0.55);
    mancha(W * 0.92, H * 0.98, m * 0.48, '#fdba74', 0.5);
    mancha(W * 0.5, H * 0.52, m * 0.35, '#6366f1', 0.25);
    // vidro da mesa e da bandeja da fila (parados: entram na copia desfocada)
    BORRADO = borrar(ctx.canvas, 22 * dpr);
    const s = L.mesa;
    placa(ctx, s.x, s.y, s.w, s.h, 24, { branco: 0.12, tinta: '#c4b5fd', tintaA: 0.06, sombraBlur: 34, sombraY: 12 });
    const ps = [0, 1, 2].slice(0, L.tamFila).map((k) => L.filaPos(k));
    const fx0 = Math.min(...ps.map((p) => p.x)) - L.gap * 1.3, fy0 = Math.min(...ps.map((p) => p.y)) - L.gap * 1.3;
    const fx1 = Math.max(...ps.map((p) => p.x + p.w)) + L.gap * 1.3, fy1 = Math.max(...ps.map((p) => p.y + p.h)) + L.gap * 1.3;
    placa(ctx, fx0, fy0, fx1 - fx0, fy1 - fy0, 20, { branco: 0.1, tinta: '#a5b4fc', tintaA: 0.05, sombraBlur: 26, sombraY: 10 });
    // a copia final ja ve a mesa: as cartas sobre a mesa mostram mesa + aurora desfocadas
    BORRADO = borrar(ctx.canvas, 14 * dpr);
  },

  vivo(ctx, W, H, t) {
    // reflexo lento atravessando a tela de tempos em tempos (vida sem enfeite)
    const ciclo = (t % 9) / 9;
    if (ciclo > 0.22) return;
    const u = ciclo / 0.22;
    const x = -W * 0.4 + u * W * 1.8;
    const g = ctx.createLinearGradient(x - W * 0.25, 0, x + W * 0.25, H * 0.3);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.05 * Math.sin(u * Math.PI)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      rr(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, Math.max(6, s.w * 0.14));
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return cartaPedra(ctx, carta, r, op);
    if (carta.tipo !== 'normal') return cartaEspecial(ctx, carta, r, op);
    return cartaNormal(ctx, carta, r, op);
  },

  cadeado(ctx, a, c, e) {
    // coluna inteira embacada, com o cadeado em linha branca e o gatilho
    const x = a.x - 5, y = a.y - 5, w = a.w + 10, h = a.h + 10, raio = 14;
    ctx.save();
    ctx.globalAlpha *= 0.9;
    placa(ctx, x, y, w, h, raio, { branco: 0.26, tinta: '#e0e7ff', tintaA: 0.18, sombra: false });
    ctx.restore();
    const cy = y + Math.min(h * 0.38, 120);
    cadeadoIcone(ctx, x + w / 2, cy, Math.min(w * 0.36, 26));
    const g = e.cadeados[c];
    const txt = g && g.tipo === 'valor' ? `faça ${g.v}` : g && g.tipo === 'fusoes' ? `${g.n} fusões` : g && g.tipo === 'montes' ? `${g.n} monte` : 'trancada';
    texto(ctx, txt, x + w / 2, cy + Math.min(w * 0.36, 26) + 16, 11, 'rgba(255,255,255,0.85)', { fonte: FONTE, peso: 600, max: w - 6 });
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    const raio = Math.max(6, r.w * 0.14);
    rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, raio);
    ctx.setLineDash([5, 5]); ctx.strokeStyle = `rgba(255,255,255,${carga ? 0.42 : 0.14})`; ctx.lineWidth = 1.3; ctx.stroke(); ctx.setLineDash([]);
    if (!e.descarte) {
      // bandeja com seta para cima (como na referencia)
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.5, s = Math.min(r.w, r.h) * 0.22;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${carga ? 0.7 : 0.22})`; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(cx - s, cy + s * 0.3); ctx.lineTo(cx - s, cy + s); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx + s, cy + s * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.55); ctx.lineTo(cx, cy - s * 0.8); ctx.moveTo(cx - s * 0.45, cy - s * 0.35); ctx.lineTo(cx, cy - s * 0.8); ctx.lineTo(cx + s * 0.45, cy - s * 0.35); ctx.stroke();
      ctx.restore();
    }
    if (e.descarteCarga > 1) texto(ctx, '×' + e.descarteCarga, r.x + r.w / 2, r.y + r.h + 12, 12, 'rgba(255,255,255,0.85)', { fonte: FONTE, peso: 700 });
  },

  frente(ctx, L, e, t, mem) {
    const agora = t * 1000;
    const raio = Math.max(6, L.cw * 0.14);
    // brilho passando no vidro da carta que fundiu
    mem.brilhos = (mem.brilhos || []).filter((b) => agora - b.t0 < 460);
    for (const b of mem.brilhos) {
      const u = clamp((agora - b.t0) / 460);
      const x = b.x - L.cw / 2, y = b.y - L.ch / 2;
      ctx.save(); rr(ctx, x, y, L.cw, L.ch, raio); ctx.clip();
      const gx = x - L.cw * 0.6 + u * L.cw * 2.2;
      const g = ctx.createLinearGradient(gx - L.cw * 0.3, y, gx + L.cw * 0.3, y + L.ch * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.55 * (1 - u)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x, y, L.cw, L.ch);
      ctx.restore();
    }
    // clarao suave da carta que completa, subindo
    mem.subidas = (mem.subidas || []).filter((s) => agora - s.t0 < 700);
    for (const s of mem.subidas) {
      const u = clamp((agora - s.t0) / 700);
      const y = s.y - easeOut(u) * L.ch * 2;
      const gr = ctx.createRadialGradient(s.x, y, 0, s.x, y, L.cw * 1.4);
      gr.addColorStop(0, `rgba(255,248,220,${0.55 * (1 - u)})`); gr.addColorStop(1, 'rgba(255,248,220,0)');
      ctx.fillStyle = gr; ctx.fillRect(s.x - L.cw * 1.5, y - L.cw * 1.5, L.cw * 3, L.cw * 3);
    }
  },

  hud(ctx, W, H, L, e, t) {
    // botoes redondos de vidro (decorativos, como na referencia)
    const br = 21, by = 44;
    placa(ctx, 16, by - br, br * 2, br * 2, br, { branco: 0.2, sombraBlur: 12, sombraY: 4 });
    placa(ctx, W - 16 - br * 2, by - br, br * 2, br * 2, br, { branco: 0.2, sombraBlur: 12, sombraY: 4 });
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const lx = 16 + br;
    ctx.beginPath(); ctx.moveTo(lx + 5, by - 7); ctx.lineTo(lx - 3, by); ctx.lineTo(lx + 5, by + 7); ctx.stroke();
    const rx = W - 16 - br;
    ctx.beginPath(); ctx.moveTo(rx - 4, by - 7); ctx.lineTo(rx - 4, by + 7); ctx.moveTo(rx + 4, by - 7); ctx.lineTo(rx + 4, by + 7); ctx.stroke();
    ctx.restore();
    // placar
    texto(ctx, `FASE ${e.faseId}`, W / 2, 16, 10, 'rgba(255,255,255,0.65)', { fonte: FONTE, peso: 700 });
    ctx.save();
    ctx.shadowColor = 'rgba(167,139,250,0.8)'; ctx.shadowBlur = 14;
    texto(ctx, String(e.pontos), W / 2, 38, 30, '#ffffff', { fonte: FONTE, peso: 800 });
    ctx.restore();
    // pilula das metas
    const pw = Math.min(W - 130, 320), px = W / 2 - pw / 2, py = 60, ph = 32;
    placa(ctx, px, py, pw, ph, ph / 2, { branco: 0.16, sombraBlur: 14, sombraY: 4 });
    const n = e.metas.length || 1;
    e.metas.forEach((m, k) => {
      const cw = (pw - 24) / n, cx = px + 12 + k * cw;
      const txt = (m.feita ? '✓ ' : '') + textoMeta(m, { monte: (q) => `${q} monte${q > 1 ? 's' : ''}` });
      texto(ctx, txt, cx + 4, py + 11, 10.5, m.feita ? '#bbf7d0' : 'rgba(255,255,255,0.9)', { fonte: FONTE, peso: 600, alinhar: 'left', max: cw - 12 });
      rr(ctx, cx + 4, py + 20, cw - 12, 3, 1.5); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fill();
      rr(ctx, cx + 4, py + 20, Math.max(3, (cw - 12) * clamp(m.atual / m.alvo)), 3, 1.5);
      ctx.fillStyle = m.feita ? '#86efac' : '#e9d5ff'; ctx.fill();
    });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 9);
      const fw = 110, fx = W / 2 - fw / 2, fy = py + ph + 8;
      placa(ctx, fx, fy, fw, 24, 12, { tinta: '#f472b6', tintaA: 0.5 + k * 0.2, branco: 0.12, sombra: false });
      ctx.save(); ctx.shadowColor = '#f472b6'; ctx.shadowBlur = 8 + k * 8;
      texto(ctx, 'FEBRE ×2', W / 2, fy + 12, 12, '#ffffff', { fonte: FONTE, peso: 800 });
      ctx.restore();
    }
  },

  fim(ctx, W, H, e) {
    ctx.fillStyle = 'rgba(10,8,30,0.35)'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(320, W - 60), h = 132, x = W / 2 - w / 2, y = H * 0.4 - h / 2;
    placa(ctx, x, y, w, h, 22, { branco: 0.22, tinta: '#c4b5fd', tintaA: 0.12, sombraBlur: 30, sombraY: 10 });
    const venceu = e.fim === 'venceu';
    ctx.save(); ctx.shadowColor = venceu ? 'rgba(253,230,138,0.8)' : 'rgba(167,139,250,0.8)'; ctx.shadowBlur = 16;
    texto(ctx, venceu ? 'Fase completa' : 'Sem jogadas', W / 2, y + 48, 28, '#ffffff', { fonte: FONTE, peso: 800 });
    ctx.restore();
    texto(ctx, `${e.pontos} pontos · toque para jogar de novo`, W / 2, y + 90, 12.5, 'rgba(255,255,255,0.82)', { fonte: FONTE, peso: 600, max: w - 30 });
  },

  efeito(fx, P, mem, agora) {
    registrarFormas(P);
    const t0 = agora ?? 0;
    switch (fx.tipo) {
      case 'pouso': P.anel(fx.x, fx.y, 'rgba(255,255,255,0.65)', 22, 0.35); return true;
      case 'fusao': {
        const cor = corDe(fx.valor);
        P.anel(fx.x, fx.y, cor, 30 + fx.degrau * 8, 0.5);
        P.estourar(fx.x, fx.y, ['#ffffff', cor], 3 + fx.degrau * 2, 0.5 + fx.degrau * 0.1, { forma: 'luz4', tam: 9, g: 40, vida: 0.7 });
        (mem.brilhos = mem.brilhos || []).push({ x: fx.x, y: fx.y, t0 });
        if (fx.degrau > 1) rotulo(P, fx.x, fx.y - 24, '×' + fx.degrau, 18 + fx.degrau * 2);
        return true;
      }
      case 'completar':
        P.anel(fx.x, fx.y, 'rgba(255,255,255,0.9)', 80, 0.7);
        P.anel(fx.x, fx.y, '#fde68a', 54, 0.55);
        P.estourar(fx.x, fx.y, ['#ffffff', '#fde68a', '#f9a8d4'], 14, 1.1, { forma: 'luz4', tam: 11, g: 30, vida: 0.9 });
        (mem.subidas = mem.subidas || []).push({ x: fx.x, y: fx.y, t0 });
        rotulo(P, fx.x, fx.y - 30, String(fx.valor), 26, '#fff7d6');
        return true;
      case 'explodir':
        P.anel(fx.x, fx.y, '#f87171', 46, 0.45);
        P.estourar(fx.x, fx.y, ['rgba(248,113,113,0.85)', 'rgba(255,255,255,0.8)'], 12, 1, { forma: 'caco', tam: 9, g: 420, vida: 0.7 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['rgba(40,40,70,0.9)', 'rgba(255,255,255,0.7)'], 12, 1, { forma: 'caco', tam: 9, g: 420, vida: 0.7 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['rgba(255,255,255,0.7)'], 4, 0.5, { forma: 'caco', tam: 6, g: 300, vida: 0.5 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['rgba(235,245,255,0.95)', '#bae6fd'], 10, 0.7, { forma: 'caco', tam: 6, g: 120, vida: 0.8 });
        P.estourar(fx.x, fx.y, ['#ffffff'], 3, 0.4, { forma: 'luz4', tam: 8, g: 0, vida: 0.6 });
        return true;
      case 'cadeado':
        P.anel(fx.x, fx.y, 'rgba(255,255,255,0.85)', 50, 0.5);
        rotulo(P, fx.x, fx.y - 10, 'aberto', 14, '#ffffff');
        return true;
      case 'combo':
        rotulo(P, fx.x, fx.y - 44, `Combo ×${fx.n}`, 15, '#e9d5ff');
        return true;
      default: return false;
    }
  },
};

export default tema;
