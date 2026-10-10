// Ideia (rodada 3): Cristal e Luz. Cartas que sao blocos de cristal lapidado:
// bisel facetado (lados claros e escuros), cor da pedra por dentro, centro
// iluminado onde fica o numero e reflexo especular. A pedra sobe com o valor
// (quartzo ... ouro); 2048 = diamante com dispersao em arco-iris; 4096 =
// cristal estelar. Fundo petroleo escuro com raios de luz e caustica fraca na
// mesa. O desenho de cada carta vai para cache (offscreen) por valor e tamanho.
import { TAU, rr, circulo, texto, rgba, clarear, escurecer, nivel, textoMeta, clamp, easeOut, semente } from '../kit.js';

const FONTE = '"Ubuntu Sans", "Noto Sans", "Segoe UI", system-ui, sans-serif';
// quartzo, citrino, esmeralda, safira, rubi, ametista, topazio, agua-marinha, onix, ouro, diamante, estelar
const PEDRAS = ['#d9e3f0', '#f2d64b', '#10b981', '#3b82f6', '#e11d48', '#9b5de5', '#ff7849', '#3fd5c0', '#3a3f4b', '#c9971c', '#eef6ff', '#2a1858'];
const corDe = (v) => PEDRAS[Math.min(PEDRAS.length - 1, nivel(v))];
const ARCO = ['#ff5f6d', '#ffc371', '#fff27a', '#7dffb3', '#5ad1ff', '#a78bfa', '#ff7ad9'];
const PAD = 14; // folga do cache para a sombra

let DPR = 1;
const CACHE = new Map();

function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function poligono(g, pts) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}

/** Bloco de cristal facetado (estatico) desenhado em g, no retangulo x, y, w, h. */
function bloco(g, x, y, w, h, cor, op = {}) {
  const raio = Math.max(5, w * 0.12);
  const b = Math.max(4, Math.min(w, h) * 0.13);
  const ix = x + b, iy = y + b, iw = w - 2 * b, ih = h - 2 * b;
  // sombra projetada
  g.save();
  g.shadowColor = 'rgba(0,8,16,0.6)'; g.shadowBlur = 12; g.shadowOffsetY = 5;
  rr(g, x, y, w, h, raio); g.fillStyle = escurecer(cor, 0.5); g.fill();
  g.restore();
  g.save();
  rr(g, x, y, w, h, raio); g.clip();
  // facetas do bisel: topo claro, esquerda meio claro, direita meio escura, base escura
  poligono(g, [[x, y], [x + w, y], [ix + iw, iy], [ix, iy]]); g.fillStyle = clarear(cor, 0.6); g.fill();
  poligono(g, [[x, y], [ix, iy], [ix, iy + ih], [x, y + h]]); g.fillStyle = clarear(cor, 0.3); g.fill();
  poligono(g, [[x + w, y], [x + w, y + h], [ix + iw, iy + ih], [ix + iw, iy]]); g.fillStyle = escurecer(cor, 0.22); g.fill();
  poligono(g, [[x, y + h], [ix, iy + ih], [ix + iw, iy + ih], [x + w, y + h]]); g.fillStyle = escurecer(cor, 0.45); g.fill();
  // face: degrade da pedra
  const gi = g.createLinearGradient(0, iy, 0, iy + ih);
  gi.addColorStop(0, clarear(cor, 0.28)); gi.addColorStop(0.45, cor); gi.addColorStop(1, escurecer(cor, 0.38));
  g.fillStyle = gi; g.fillRect(ix, iy, iw, ih);
  if (op.dentro) op.dentro(g, ix, iy, iw, ih);
  // lapidacao: chevron fino na face
  g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(ix, iy + ih * 0.38); g.lineTo(x + w / 2, iy + ih * 0.62); g.lineTo(ix + iw, iy + ih * 0.38); g.stroke();
  g.beginPath(); g.moveTo(x + w / 2, iy + ih * 0.62); g.lineTo(x + w / 2, iy + ih); g.stroke();
  // centro iluminado (faixa de cima, onde fica o numero)
  const gl = g.createRadialGradient(x + w / 2, y + h * 0.16, 0, x + w / 2, y + h * 0.16, w * 0.6);
  gl.addColorStop(0, 'rgba(255,255,255,0.5)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(x, y, w, h);
  // reflexo especular diagonal
  const gs = g.createLinearGradient(x, y, x + w * 0.7, y + h * 0.55);
  gs.addColorStop(0, 'rgba(255,255,255,0)'); gs.addColorStop(0.42, 'rgba(255,255,255,0)'); gs.addColorStop(0.5, 'rgba(255,255,255,0.22)'); gs.addColorStop(0.6, 'rgba(255,255,255,0)');
  g.fillStyle = gs; g.fillRect(x, y, w, h);
  // dispersao (diamante): franja de arco-iris nas facetas de cima e da esquerda
  if (op.arco) {
    const ga = g.createLinearGradient(x, y, x + w, y + h * 0.3);
    ARCO.forEach((c, i) => ga.addColorStop(i / (ARCO.length - 1), rgba(c, 0.55)));
    poligono(g, [[x, y], [x + w, y], [ix + iw, iy], [ix, iy]]); g.fillStyle = ga; g.fill();
    const gb = g.createLinearGradient(x, y, x + w * 0.2, y + h);
    ARCO.forEach((c, i) => gb.addColorStop(i / (ARCO.length - 1), rgba(c, 0.4)));
    poligono(g, [[x, y], [ix, iy], [ix, iy + ih], [x, y + h]]); g.fillStyle = gb; g.fill();
  }
  // arestas das facetas
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(ix, iy); g.moveTo(x + w, y); g.lineTo(ix + iw, iy);
  g.moveTo(x, y + h); g.lineTo(ix, iy + ih); g.moveTo(x + w, y + h); g.lineTo(ix + iw, iy + ih);
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.moveTo(ix, iy + 0.5); g.lineTo(ix + iw, iy + 0.5); g.stroke();
  g.restore();
  // contorno de luz
  rr(g, x + 0.5, y + 0.5, w - 1, h - 1, raio);
  const gc = g.createLinearGradient(x, y, x + w, y + h);
  gc.addColorStop(0, 'rgba(255,255,255,0.75)'); gc.addColorStop(0.5, 'rgba(255,255,255,0.2)'); gc.addColorStop(1, 'rgba(255,255,255,0.1)');
  g.strokeStyle = gc; g.lineWidth = 1; g.stroke();
  return { raio, b };
}

/** Numero no centro iluminado da faixa visivel, com contraste pela luminancia da pedra. */
function numero(g, txt, x, y, w, h, cor) {
  const claro = luminancia(cor) > 0.55;
  const n = txt.length;
  const tam = Math.min(h * 0.25, w * (n >= 4 ? 0.27 : n === 3 ? 0.33 : 0.4));
  g.save();
  g.shadowColor = claro ? 'rgba(255,255,255,0.85)' : 'rgba(0,10,25,0.75)'; g.shadowBlur = claro ? 5 : 6;
  texto(g, txt, x + w / 2, y + h * 0.165, tam, claro ? '#10283a' : '#ffffff', { fonte: FONTE, peso: 800, max: w * 0.82 });
  g.restore();
}

function geada(g, x, y, w, h, raio) {
  g.save();
  rr(g, x, y, w, h, raio); g.clip();
  g.fillStyle = 'rgba(230,246,255,0.42)'; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 0.9;
  for (const [a, b, c, d] of [[0.15, 0.5, 0.4, 0.75], [0.6, 0.4, 0.85, 0.62], [0.3, 0.9, 0.55, 0.68], [0.7, 0.85, 0.5, 0.98]]) {
    g.beginPath(); g.moveTo(x + w * a, y + h * b); g.lineTo(x + w * c, y + h * d); g.stroke();
  }
  g.restore();
  const fx = x + w * 0.84, fy = y + h * 0.16, s = Math.min(w, h) * 0.075;
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.3; g.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    g.beginPath(); g.moveTo(fx - Math.cos(a) * s, fy - Math.sin(a) * s); g.lineTo(fx + Math.cos(a) * s, fy + Math.sin(a) * s); g.stroke();
  }
}

function estrela4(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s);
  g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s);
  g.closePath();
}

/** Rocha bruta com veio de cristal; rachaduras pelo hp perdido; pips em losango. */
function rocha(g, x, y, w, h, hp) {
  const rnd = semente(23);
  const pts = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * TAU;
    const k = 0.9 + rnd() * 0.1;
    pts.push([x + w / 2 + Math.cos(a) * (w / 2) * k, y + h / 2 + Math.sin(a) * (h / 2) * k]);
  }
  g.save();
  g.shadowColor = 'rgba(0,8,16,0.6)'; g.shadowBlur = 12; g.shadowOffsetY = 5;
  poligono(g, pts);
  const gr = g.createLinearGradient(x, y, x + w, y + h);
  gr.addColorStop(0, '#5a616b'); gr.addColorStop(1, '#262a31');
  g.fillStyle = gr; g.fill();
  g.restore();
  g.save();
  poligono(g, pts); g.clip();
  // facetas brutas
  g.fillStyle = 'rgba(255,255,255,0.08)';
  poligono(g, [pts[0], pts[1], [x + w * 0.5, y + h * 0.45], pts[8]]); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.18)';
  poligono(g, [pts[4], pts[5], [x + w * 0.5, y + h * 0.55]]); g.fill();
  // veio de cristal
  g.shadowColor = '#5eead4'; g.shadowBlur = 8;
  g.strokeStyle = 'rgba(140,250,230,0.85)'; g.lineWidth = 2; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x + w * 0.1, y + h * 0.62); g.lineTo(x + w * 0.38, y + h * 0.52); g.lineTo(x + w * 0.55, y + h * 0.66); g.lineTo(x + w * 0.92, y + h * 0.5); g.stroke();
  g.shadowBlur = 0;
  // rachaduras
  g.strokeStyle = 'rgba(10,12,16,0.85)'; g.lineWidth = 1.2;
  const rach = [[[0.3, 0.2], [0.4, 0.36], [0.32, 0.48]], [[0.7, 0.24], [0.6, 0.4], [0.72, 0.56]], [[0.5, 0.7], [0.42, 0.84], [0.56, 0.95]]];
  for (let k = 0; k < 3 - hp; k++) {
    g.beginPath(); rach[k].forEach(([a, b], i) => g[i ? 'lineTo' : 'moveTo'](x + w * a, y + h * b)); g.stroke();
  }
  g.restore();
  for (let k = 0; k < 3; k++) {
    const cx = x + w * 0.32 + k * w * 0.18, cy = y + h * 0.16, s = Math.max(2.6, w * 0.05);
    poligono(g, [[cx, cy - s], [cx + s * 0.75, cy], [cx, cy + s], [cx - s * 0.75, cy]]);
    g.fillStyle = k < hp ? '#9ff5e4' : 'rgba(255,255,255,0.12)'; g.fill();
  }
}

/** Desenho estatico de uma carta (em cache). */
function desenharEstatico(g, carta, x, y, w, h) {
  const tipo = carta.tipo;
  if (tipo === 'pedra') { rocha(g, x, y, w, h, clamp(carta.hp ?? 3, 0, 3)); return; }
  if (tipo === 'coringa') {
    bloco(g, x, y, w, h, '#dfe9f5', {
      dentro: (q, ix, iy, iw, ih) => {
        const ga = q.createLinearGradient(ix, iy, ix + iw, iy + ih);
        ARCO.forEach((c, i) => ga.addColorStop(i / (ARCO.length - 1), rgba(c, 0.62)));
        q.fillStyle = ga; q.fillRect(ix, iy, iw, ih);
      },
      arco: true,
    });
    g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 10;
    estrela4(g, x + w / 2, y + h * 0.6, Math.min(w, h) * 0.2); g.fillStyle = '#ffffff'; g.fill();
    g.restore();
    numero(g, '?', x, y, w, h, '#dfe9f5');
    return;
  }
  if (tipo === 'bomba') {
    bloco(g, x, y, w, h, '#d61f45');
    // cristal instavel: rachaduras luminosas
    g.save();
    g.strokeStyle = 'rgba(255,220,225,0.85)'; g.lineWidth = 1.2; g.lineJoin = 'round';
    g.shadowColor = '#ff8fa3'; g.shadowBlur = 6;
    g.beginPath(); g.moveTo(x + w * 0.5, y + h * 0.42); g.lineTo(x + w * 0.38, y + h * 0.58); g.lineTo(x + w * 0.5, y + h * 0.68); g.lineTo(x + w * 0.36, y + h * 0.86); g.stroke();
    g.beginPath(); g.moveTo(x + w * 0.5, y + h * 0.68); g.lineTo(x + w * 0.66, y + h * 0.78); g.stroke();
    g.restore();
    numero(g, '!', x, y, w, h, '#d61f45');
    return;
  }
  if (tipo === 'dobro') {
    bloco(g, x, y, w, h, '#14a89a');
    g.save(); g.shadowColor = '#a7fff1'; g.shadowBlur = 12;
    texto(g, '×2', x + w / 2, y + h * 0.62, Math.min(w * 0.46, h * 0.3), 'rgba(235,255,252,0.95)', { fonte: FONTE, peso: 800 });
    g.restore();
    numero(g, '×2', x, y, w, h, '#14a89a');
    return;
  }
  const v = carta.v, cor = corDe(v);
  const op = {};
  if (v === 2048) op.arco = true;
  if (v >= 4096) {
    op.dentro = (q, ix, iy, iw, ih) => {
      const rnd = semente(4096);
      for (let i = 0; i < 18; i++) {
        q.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.6})`;
        circulo(q, ix + rnd() * iw, iy + rnd() * ih, 0.5 + rnd() * 1.2); q.fill();
      }
      const gr = q.createRadialGradient(ix + iw / 2, iy + ih * 0.6, 0, ix + iw / 2, iy + ih * 0.6, iw * 0.7);
      gr.addColorStop(0, 'rgba(196,181,253,0.55)'); gr.addColorStop(1, 'rgba(196,181,253,0)');
      q.fillStyle = gr; q.fillRect(ix, iy, iw, ih);
    };
  }
  const { raio } = bloco(g, x, y, w, h, cor, op);
  if (carta.gelo) geada(g, x, y, w, h, raio);
  numero(g, String(v), x, y, w, h, cor);
}

function chaveCache(carta, w, h) {
  return `${carta.tipo}|${carta.v || 0}|${carta.hp ?? ''}|${carta.gelo ? 1 : 0}|${w}|${h}|${DPR}`;
}

function cartaEmCache(carta, w, h) {
  const k = chaveCache(carta, w, h);
  let c = CACHE.get(k);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = Math.ceil((w + PAD * 2) * DPR); c.height = Math.ceil((h + PAD * 2) * DPR);
  const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  g.scale(DPR, DPR);
  desenharEstatico(g, carta, PAD, PAD, w, h);
  if (CACHE.size > 400) CACHE.clear();
  CACHE.set(k, c);
  return c;
}

function registrarFormas(P) {
  if (P.formas.luz4) return;
  P.formas.luz4 = (ctx, p) => { ctx.shadowColor = p.cor; ctx.shadowBlur = p.tam; estrela4(ctx, 0, 0, p.tam / 2); ctx.fill(); };
  P.formas.rotulo = (ctx, p, u) => {
    const esc = (u < 0.15 ? 0.75 + (u / 0.15) * 0.3 : 1.05 - (u - 0.15) * 0.08) / Math.max(0.6, 1 - u * 0.4);
    ctx.scale(esc, esc);
    ctx.shadowColor = 'rgba(94,234,212,0.8)'; ctx.shadowBlur = 12;
    texto(ctx, p.txt, 0, 0, p.tam, p.cor, { fonte: FONTE, peso: 800 });
  };
  P.formas.caco = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(s * 0.4, -s); ctx.lineTo(s * 0.8, s * 0.6); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
  };
  // feixe de luz vertical subindo da carta
  P.formas.facho = (ctx, p, u) => {
    const a = p.alt * (0.4 + easeOut(u) * 0.6), w = p.larg * (1 - u * 0.5);
    const g = ctx.createLinearGradient(0, 0, 0, -a);
    g.addColorStop(0, rgba(p.base || '#ffffff', 0.75)); g.addColorStop(1, rgba(p.base || '#ffffff', 0));
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -a, w, a);
  };
  // risco prismatico (dispersao)
  P.formas.prisma = (ctx, p, u) => {
    const len = p.len * (0.3 + easeOut(u) * 0.7);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, rgba(p.base, 0)); g.addColorStop(0.4, rgba(p.base, 0.9)); g.addColorStop(1, rgba(p.base, 0));
    ctx.fillStyle = g; ctx.fillRect(0, -1.5, len, 3);
  };
}

function rotulo(P, x, y, txt, tam, cor = '#eafffb') {
  P.add({ forma: 'rotulo', x, y, vy: -55, g: 0, arrasto: 1, vida: 0.95, tam, cor, txt });
}

function painel(ctx, x, y, w, h, raio) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,6,12,0.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  rr(ctx, x, y, w, h, raio);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(14,52,68,0.62)'); g.addColorStop(1, 'rgba(5,24,34,0.82)');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, raio); ctx.strokeStyle = 'rgba(140,230,255,0.13)'; ctx.lineWidth = 1; ctx.stroke();
  // fio de luz no topo
  const gl = ctx.createLinearGradient(x, 0, x + w, 0);
  gl.addColorStop(0, 'rgba(120,240,255,0)'); gl.addColorStop(0.5, 'rgba(160,250,255,0.9)'); gl.addColorStop(1, 'rgba(120,240,255,0)');
  ctx.fillStyle = gl; ctx.fillRect(x + raio, y, w - raio * 2, 1.5);
}

const tema = {
  id: 'cristal',
  nome: 'Cristal e Luz',
  cores: { texto: '#eafffb', destaque: '#a7fff1', particulas: ['#ffffff', '#5eead4', '#a7f3ff'] },
  faixas: (W, H) => ({ topo: W > H ? 92 : 100, base: 0 }),

  fundo(ctx, W, H, L) {
    DPR = ctx.getTransform().a || 1;
    CACHE.clear();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#04101a'); g.addColorStop(0.45, '#0a2635'); g.addColorStop(1, '#051620');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // fonte de luz no alto
    const gr = ctx.createRadialGradient(W * 0.5, -H * 0.12, 0, W * 0.5, -H * 0.12, H * 0.8);
    gr.addColorStop(0, 'rgba(120,225,255,0.2)'); gr.addColorStop(1, 'rgba(120,225,255,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    // vinheta
    const gv = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
    // mesa e bandeja da fila: vidro escuro com fio de luz
    painel(ctx, L.mesa.x, L.mesa.y, L.mesa.w, L.mesa.h, 20);
    const ps = [0, 1, 2].slice(0, L.tamFila).map((k) => L.filaPos(k));
    const fx0 = Math.min(...ps.map((p) => p.x)) - L.gap * 1.3, fy0 = Math.min(...ps.map((p) => p.y)) - L.gap * 1.3;
    const fx1 = Math.max(...ps.map((p) => p.x + p.w)) + L.gap * 1.3, fy1 = Math.max(...ps.map((p) => p.y + p.h)) + L.gap * 1.3;
    painel(ctx, fx0, fy0, fx1 - fx0, fy1 - fy0, 16);
  },

  vivo(ctx, W, H, t) {
    // raios de luz volumetricos, bem sutis, com deriva lenta
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const x0 = W * (0.18 + i * 0.22) + Math.sin(t * 0.13 + i * 1.7) * W * 0.05;
      const larg = W * (0.07 + (i % 2) * 0.04);
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.85);
      g.addColorStop(0, `rgba(150,235,255,${0.07 + 0.025 * Math.sin(t * 0.4 + i)})`); g.addColorStop(1, 'rgba(150,235,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0 - larg * 0.4, 0); ctx.lineTo(x0 + larg * 0.4, 0);
      ctx.lineTo(x0 + larg * 1.6 + W * 0.08, H * 0.85); ctx.lineTo(x0 - larg * 0.2 + W * 0.08, H * 0.85);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },

  mesa(ctx, L, e, t) {
    // caustica fraca sobre a mesa
    const s = L.mesa;
    ctx.save();
    rr(ctx, s.x, s.y, s.w, s.h, 20); ctx.clip();
    ctx.strokeStyle = 'rgba(150,240,255,0.05)'; ctx.lineWidth = 1.6;
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      for (let x = s.x; x <= s.x + s.w; x += 8) {
        const y = s.y + s.h * (0.15 + k * 0.15) + Math.sin(x * 0.045 + t * 0.7 + k * 1.3) * 6 + Math.sin(x * 0.11 - t * 0.5 + k) * 3;
        x === s.x ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const q = L.carta(c, 0);
      rr(ctx, q.x + 1, q.y + 1, q.w - 2, q.h - 2, Math.max(5, q.w * 0.12));
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(150,240,255,0.2)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
    }
  },

  peca(ctx, carta, r, op) {
    const w = Math.round(r.w), h = Math.round(r.h);
    const img = cartaEmCache(carta, w, h);
    ctx.drawImage(img, r.x - PAD, r.y - PAD, w + PAD * 2, h + PAD * 2);
    const t = op.t || 0;
    // partes vivas por cima do cache
    if (carta.tipo === 'bomba') {
      const p = 0.5 + 0.5 * Math.sin(t * 7);
      ctx.save();
      rr(ctx, r.x, r.y, r.w, r.h, Math.max(5, r.w * 0.12)); ctx.clip();
      const gr = ctx.createRadialGradient(0, r.y + r.h * 0.62, 0, 0, r.y + r.h * 0.62, r.w * 0.7);
      gr.addColorStop(0, `rgba(255,120,140,${0.2 + p * 0.35})`); gr.addColorStop(1, 'rgba(255,120,140,0)');
      ctx.fillStyle = gr; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    } else if (carta.tipo === 'normal' && carta.v >= 2048) {
      // brilhos do diamante / estelar piscando
      const pts = [[0.26, 0.42], [0.72, 0.7], [0.58, 0.3]];
      ctx.save();
      pts.forEach(([a, b], i) => {
        const k = Math.max(0, Math.sin(t * 2.2 + i * 2.1));
        if (k < 0.05) return;
        ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8 * k;
        estrela4(ctx, r.x + r.w * a, r.y + r.h * b, Math.min(r.w, r.h) * 0.09 * k);
        ctx.fillStyle = `rgba(255,255,255,${0.9 * k})`; ctx.fill();
      });
      ctx.restore();
    } else if (carta.tipo === 'coringa') {
      const k = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save(); ctx.globalAlpha *= 0.3 + k * 0.3;
      rr(ctx, r.x, r.y, r.w, r.h, Math.max(5, r.w * 0.12)); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    if (op.destaque) {
      ctx.save();
      ctx.shadowColor = 'rgba(160,250,255,0.95)'; ctx.shadowBlur = 14;
      rr(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, Math.max(5, r.w * 0.12) + 1);
      ctx.strokeStyle = `rgba(190,252,255,${0.3 + op.destaque * 0.55})`; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.restore();
    }
  },

  cadeado(ctx, a, c, e) {
    // moldura de metal escovado com fecho
    const x = a.x - 4, y = a.y - 4, w = a.w + 8, h = a.h + 8, raio = 12;
    rr(ctx, x, y, w, h, raio); ctx.fillStyle = 'rgba(3,12,20,0.66)'; ctx.fill();
    const gm = ctx.createLinearGradient(x, y, x + w, y + h);
    gm.addColorStop(0, '#d9e2ea'); gm.addColorStop(0.3, '#7f8b96'); gm.addColorStop(0.55, '#eef3f7'); gm.addColorStop(0.8, '#6c7782'); gm.addColorStop(1, '#c3ccd4');
    rr(ctx, x + 1.5, y + 1.5, w - 3, h - 3, raio); ctx.strokeStyle = gm; ctx.lineWidth = 3; ctx.stroke();
    const cx = x + w / 2, cy = y + Math.min(h * 0.38, 120), s = Math.min(w * 0.3, 22);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rr(ctx, cx - s, cy - s * 0.7, s * 2, s * 1.4, s * 0.25); ctx.fillStyle = gm; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1b232b'; circulo(ctx, cx, cy - s * 0.12, s * 0.2); ctx.fill();
    ctx.fillRect(cx - s * 0.07, cy - s * 0.1, s * 0.14, s * 0.4);
    const g = e.cadeados[c];
    const txt = g && g.tipo === 'valor' ? `faça ${g.v}` : g && g.tipo === 'fusoes' ? `${g.n} fusões` : g && g.tipo === 'montes' ? `${g.n} monte` : 'trancada';
    texto(ctx, txt, cx, cy + s + 14, 11, 'rgba(220,240,248,0.85)', { fonte: FONTE, peso: 600, max: w - 6 });
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, Math.max(5, r.w * 0.12));
    ctx.setLineDash([5, 5]); ctx.strokeStyle = `rgba(150,240,255,${carga ? 0.42 : 0.12})`; ctx.lineWidth = 1.3; ctx.stroke(); ctx.setLineDash([]);
    if (!e.descarte) {
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.5, s = Math.min(r.w, r.h) * 0.22;
      ctx.save();
      ctx.strokeStyle = `rgba(170,245,255,${carga ? 0.7 : 0.2})`; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(cx - s, cy + s * 0.3); ctx.lineTo(cx - s, cy + s); ctx.lineTo(cx + s, cy + s); ctx.lineTo(cx + s, cy + s * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.55); ctx.lineTo(cx, cy - s * 0.8); ctx.moveTo(cx - s * 0.45, cy - s * 0.35); ctx.lineTo(cx, cy - s * 0.8); ctx.lineTo(cx + s * 0.45, cy - s * 0.35); ctx.stroke();
      ctx.restore();
    }
    if (e.descarteCarga > 1) texto(ctx, '×' + e.descarteCarga, r.x + r.w / 2, r.y + r.h + 12, 12, 'rgba(200,245,255,0.85)', { fonte: FONTE, peso: 700 });
  },

  hud(ctx, W, H, L, e, t) {
    const paisagem = W > H;
    const x = 12, y = 10, w = W - 24, h = paisagem ? 72 : 80;
    painel(ctx, x, y, w, h, 16);
    texto(ctx, `FASE ${e.faseId}`, x + 16, y + 20, 10.5, 'rgba(170,240,255,0.7)', { fonte: FONTE, peso: 700, alinhar: 'left' });
    ctx.save();
    ctx.shadowColor = 'rgba(94,234,212,0.75)'; ctx.shadowBlur = 14;
    texto(ctx, String(e.pontos), W / 2, y + 26, 28, '#eafffb', { fonte: FONTE, peso: 800 });
    ctx.restore();
    // metas: duas colunas com barra luminosa fina
    const mw = Math.min(w - 40, 360), mx = W / 2 - mw / 2, my = y + 50;
    const n = e.metas.length || 1;
    e.metas.forEach((m, k) => {
      const cw = mw / n, cx = mx + k * cw;
      const txt = (m.feita ? '✓ ' : '') + textoMeta(m, { monte: (q) => `${q} monte${q > 1 ? 's' : ''}` });
      texto(ctx, txt, cx + 6, my, 10.5, m.feita ? '#9dffcf' : 'rgba(220,245,252,0.88)', { fonte: FONTE, peso: 600, alinhar: 'left', max: cw - 14 });
      rr(ctx, cx + 6, my + 9, cw - 14, 3, 1.5); ctx.fillStyle = 'rgba(150,240,255,0.12)'; ctx.fill();
      ctx.save();
      ctx.shadowColor = '#5eead4'; ctx.shadowBlur = 6;
      rr(ctx, cx + 6, my + 9, Math.max(3, (cw - 14) * clamp(m.atual / m.alvo)), 3, 1.5);
      const gb = ctx.createLinearGradient(cx, 0, cx + cw, 0);
      gb.addColorStop(0, m.feita ? '#7dffb3' : '#5eead4'); gb.addColorStop(1, '#e0fffa');
      ctx.fillStyle = gb; ctx.fill();
      ctx.restore();
    });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 9);
      const fw = 110, fx = W / 2 - fw / 2, fy = y + h + 8;
      rr(ctx, fx, fy, fw, 24, 12); ctx.fillStyle = 'rgba(30,8,40,0.7)'; ctx.fill();
      ctx.save(); ctx.shadowColor = '#f0abfc'; ctx.shadowBlur = 8 + k * 10;
      rr(ctx, fx, fy, fw, 24, 12); ctx.strokeStyle = `rgba(240,171,252,${0.6 + k * 0.4})`; ctx.lineWidth = 1.2; ctx.stroke();
      texto(ctx, 'FEBRE ×2', W / 2, fy + 12, 12, '#fdf4ff', { fonte: FONTE, peso: 800 });
      ctx.restore();
    }
  },

  fim(ctx, W, H, e) {
    ctx.fillStyle = 'rgba(2,8,14,0.45)'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(320, W - 60), h = 130, x = W / 2 - w / 2, y = H * 0.4 - h / 2;
    painel(ctx, x, y, w, h, 20);
    const venceu = e.fim === 'venceu';
    ctx.save(); ctx.shadowColor = venceu ? 'rgba(160,250,255,0.85)' : 'rgba(150,170,200,0.6)'; ctx.shadowBlur = 16;
    texto(ctx, venceu ? 'Fase completa' : 'Sem jogadas', W / 2, y + 48, 28, '#eafffb', { fonte: FONTE, peso: 800 });
    ctx.restore();
    texto(ctx, `${e.pontos} pontos · toque para jogar de novo`, W / 2, y + 90, 12.5, 'rgba(210,240,250,0.82)', { fonte: FONTE, peso: 600, max: w - 30 });
  },

  efeito(fx, P) {
    registrarFormas(P);
    switch (fx.tipo) {
      case 'pouso':
        P.anel(fx.x, fx.y, 'rgba(160,250,255,0.6)', 20, 0.35);
        P.estourar(fx.x, fx.y + 20, ['#bffcff'], 2, 0.3, { forma: 'luz4', tam: 6, g: 0, vida: 0.4 });
        return true;
      case 'fusao': {
        const cor = clarear(corDe(fx.valor), 0.2);
        P.anel(fx.x, fx.y, cor, 30 + fx.degrau * 8, 0.5);
        P.add({ forma: 'facho', x: fx.x, y: fx.y + 10, vida: 0.45, tam: 1, larg: 24 + fx.degrau * 4, alt: 70 + fx.degrau * 25, base: cor });
        P.estourar(fx.x, fx.y, ['#ffffff', cor], 2 + fx.degrau * 2, 0.5 + fx.degrau * 0.1, { forma: 'luz4', tam: 9, g: 30, vida: 0.7 });
        if (fx.degrau > 1) rotulo(P, fx.x, fx.y - 26, '×' + fx.degrau, 18 + fx.degrau * 2);
        return true;
      }
      case 'completar':
        P.add({ forma: 'facho', x: fx.x, y: fx.y + 20, vida: 0.8, tam: 1, larg: 46, alt: 420, base: '#e9fdff' });
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU;
          P.add({ forma: 'prisma', x: fx.x, y: fx.y, vida: 0.7, tam: 1, len: 70 + (i % 3) * 18, rot: a, base: ARCO[i % ARCO.length] });
        }
        P.anel(fx.x, fx.y, 'rgba(255,255,255,0.9)', 76, 0.6);
        P.estourar(fx.x, fx.y, ['#ffffff', '#a7fff1', '#fff3b0'], 12, 1, { forma: 'luz4', tam: 11, g: 20, vida: 0.9 });
        rotulo(P, fx.x, fx.y - 30, String(fx.valor), 26, '#ffffff');
        return true;
      case 'explodir':
        P.anel(fx.x, fx.y, '#ff6b81', 46, 0.45);
        P.estourar(fx.x, fx.y, ['rgba(255,90,120,0.9)', 'rgba(255,220,230,0.85)'], 12, 1, { forma: 'caco', tam: 9, g: 420, vida: 0.7 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#4a515a', '#9ff5e4'], 12, 1, { forma: 'caco', tam: 9, g: 420, vida: 0.7 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#5a616b', '#9ff5e4'], 4, 0.5, { forma: 'caco', tam: 6, g: 300, vida: 0.5 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['rgba(230,246,255,0.95)', '#a5f3fc'], 10, 0.7, { forma: 'caco', tam: 6, g: 120, vida: 0.8 });
        P.estourar(fx.x, fx.y, ['#ffffff'], 3, 0.4, { forma: 'luz4', tam: 8, g: 0, vida: 0.6 });
        return true;
      case 'cadeado':
        P.anel(fx.x, fx.y, 'rgba(230,240,248,0.85)', 50, 0.5);
        rotulo(P, fx.x, fx.y - 10, 'aberto', 14, '#eef6fb');
        return true;
      case 'combo':
        rotulo(P, fx.x, fx.y - 44, `Combo ×${fx.n}`, 15, '#c9fff6');
        return true;
      default: return false;
    }
  },
};

export default tema;
