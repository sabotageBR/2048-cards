// Ideia (rodada 3, app comercial): Argila Suave. Claymorphism em 3D pastel:
// cartas fofas e foscas, com luz macia em cima a esquerda e sombra macia
// embaixo a direita; mesa e pocos em neumorfismo sobre um fundo liso. Numeros
// em relevo. Cada carta e pintada uma vez em canvas offscreen.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, textoMeta, semente } from '../kit.js';

const FONTE = '"Ubuntu Sans", "Noto Sans", system-ui, sans-serif';
const DPR = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
const PAD = 14;
const FUNDO = '#ece6f3';
const TINTA = '#5a4a86';
// pastel por valor, mais saturado conforme sobe (2..1024)
const CORES = ['#d6e9ff', '#cdeedd', '#fbeab4', '#ffd5b0', '#ffb8c1', '#f3a9d9', '#c9a8ff', '#9fb0ff', '#7fd1e8', '#7fd6a1'];

const cache = new Map();
function imagem(chave, w, h, pintar) {
  const k = `${chave}|${Math.round(w)}x${Math.round(h)}`;
  let c = cache.get(k);
  if (!c) {
    if (cache.size > 280) cache.clear();
    c = document.createElement('canvas');
    c.width = Math.ceil((w + PAD * 2) * DPR); c.height = Math.ceil((h + PAD * 2) * DPR);
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    g.scale(DPR, DPR); g.translate(PAD, PAD);
    pintar(g, Math.round(w), Math.round(h));
    cache.set(k, c);
  }
  return c;
}

const raio = (w, h) => Math.min(w, h) * 0.24;

/** Sombra interna: um anel por fora da forma, com a sombra deslocada para dentro. */
function sombraInterna(g, x, y, w, h, R, cor, dx, dy, blur) {
  g.save();
  rr(g, x, y, w, h, R); g.clip();
  g.shadowColor = cor; g.shadowBlur = blur * DPR; g.shadowOffsetX = dx * DPR; g.shadowOffsetY = dy * DPR;
  g.lineWidth = 8; g.strokeStyle = '#000';
  rr(g, x - 4, y - 4, w + 8, h + 8, R + 4); g.stroke();
  g.restore();
}

/** Corpo fofo: luz e sombra externas, degrade diagonal, brilho e sombra internos. */
function corpo(g, w, h, cor, op = {}) {
  const R = raio(w, h);
  const esc = escurecer(cor, 0.4);
  g.save();
  g.shadowColor = rgba(esc, 0.42); g.shadowBlur = 11 * DPR; g.shadowOffsetX = 3 * DPR; g.shadowOffsetY = 5 * DPR;
  rr(g, 0, 0, w, h, R); g.fillStyle = cor; g.fill();
  g.restore();
  g.save();
  g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 8 * DPR; g.shadowOffsetX = -3 * DPR; g.shadowOffsetY = -3 * DPR;
  rr(g, 0, 0, w, h, R); g.fillStyle = cor; g.fill();
  g.restore();
  rr(g, 0, 0, w, h, R);
  if (op.preencher) g.fillStyle = op.preencher(g, w, h);
  else {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, clarear(cor, 0.4)); gr.addColorStop(0.55, cor); gr.addColorStop(1, escurecer(cor, 0.08));
    g.fillStyle = gr;
  }
  g.fill();
  g.save(); rr(g, 0, 0, w, h, R); g.clip();
  if (op.miolo) op.miolo(g, w, h);
  const gb = g.createRadialGradient(w * 0.26, h * 0.16, 0, w * 0.26, h * 0.16, Math.max(w, h) * 0.7);
  gb.addColorStop(0, 'rgba(255,255,255,0.6)'); gb.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gb; g.fillRect(0, 0, w, h);
  g.restore();
  sombraInterna(g, 0, 0, w, h, R, rgba(esc, 0.38), -2, -3, 6);
}

/** Numero em relevo: luz em cima a esquerda, sombra embaixo a direita. */
function relevo(g, txt, x, y, tam, cor, alinhar = 'center', max = 0, peso = 800) {
  g.save();
  g.font = `${peso} ${Math.round(tam)}px ${FONTE}`;
  g.textAlign = alinhar; g.textBaseline = 'middle';
  if (max) { const m = g.measureText(txt).width; if (m > max) { const k = max / m; g.translate(x, y); g.scale(k, k); x = 0; y = 0; } }
  // sombras desfocadas (em pixels do dispositivo): luz em cima a esquerda, sombra embaixo a direita
  const k = Math.abs(g.getTransform().a) || 1;
  g.fillStyle = cor;
  g.shadowColor = 'rgba(255,255,255,0.95)'; g.shadowBlur = 1.5 * k; g.shadowOffsetX = -1 * k; g.shadowOffsetY = -1 * k;
  g.fillText(txt, x, y);
  g.shadowColor = rgba(escurecer(cor, 0.35), 0.4); g.shadowBlur = 3 * k; g.shadowOffsetX = 1 * k; g.shadowOffsetY = 1.6 * k;
  g.fillText(txt, x, y);
  g.restore();
}

function infoValor(v) {
  const n = nivel(v);
  if (n >= 11) return { cor: '#e8dcff', tinta: '#6a55b8', especial: 'opala' };
  if (n === 10) return { cor: '#f7d58a', tinta: '#8a5a12', especial: 'perola' };
  const c = CORES[n];
  return { cor: c, tinta: escurecer(c, n < 4 ? 0.58 : 0.55) };
}

function pintarCarta(g, w, h, v, gelo) {
  const c = infoValor(v);
  let preencher = null;
  if (c.especial === 'perola') preencher = (gg, ww, hh) => { const gr = gg.createLinearGradient(0, 0, ww, hh); gr.addColorStop(0, '#fff6d8'); gr.addColorStop(0.5, '#f7d58a'); gr.addColorStop(1, '#e6b25a'); return gr; };
  if (c.especial === 'opala') preencher = (gg, ww, hh) => { const gr = gg.createLinearGradient(0, 0, ww, hh); ['#ffd1dc', '#fff0c2', '#cff5dc', '#cde7ff', '#e3d2ff'].forEach((k, i) => gr.addColorStop(i / 4, k)); return gr; };
  corpo(g, w, h, c.cor, {
    preencher,
    miolo: c.especial ? (gg, ww, hh) => {
      // brilho perolado: manchas iridescentes suaves
      for (const [x, y, r, k] of [[0.7, 0.3, 0.5, 'rgba(255,190,220,0.28)'], [0.3, 0.75, 0.55, 'rgba(180,220,255,0.28)']]) {
        const gp = gg.createRadialGradient(ww * x, hh * y, 0, ww * x, hh * y, ww * r);
        gp.addColorStop(0, k); gp.addColorStop(1, 'rgba(255,255,255,0)');
        gg.fillStyle = gp; gg.fillRect(0, 0, ww, hh);
      }
    } : null,
  });
  const ti = Math.min(w * 0.28, h * 0.2);
  relevo(g, String(v), w * 0.13, ti * 0.75 + 3, ti, c.tinta, 'left', w * 0.76);
  relevo(g, String(v), w / 2, h * 0.6, Math.min(w * 0.42, h * 0.3), c.tinta, 'center', w * 0.78, 700);
  if (gelo) camadaLeitosa(g, w, h);
}

function camadaLeitosa(g, w, h) {
  const R = raio(w, h);
  g.save();
  rr(g, 0, 0, w, h, R); g.clip();
  g.fillStyle = 'rgba(250,252,255,0.58)'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(200,228,255,0.22)'; g.fillRect(0, 0, w, h);
  const rnd = semente(17);
  for (let i = 0; i < 5; i++) {
    const x = rnd() * w, y = rnd() * h, r = 6 + rnd() * 10;
    const gp = g.createRadialGradient(x, y, 0, x, y, r);
    gp.addColorStop(0, 'rgba(255,255,255,0.55)'); gp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gp; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.restore();
  g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,0.9)'; rr(g, 2, 2, w - 4, h - 4, R - 2); g.stroke();
  // floco pequeno
  g.strokeStyle = 'rgba(130,170,215,0.85)'; g.lineWidth = 1.4; g.lineCap = 'round';
  const fx = w - 10, fy = 10;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; g.beginPath(); g.moveTo(fx - Math.cos(a) * 4.5, fy - Math.sin(a) * 4.5); g.lineTo(fx + Math.cos(a) * 4.5, fy + Math.sin(a) * 4.5); g.stroke(); }
}

function bolinha(g, x, y, r, cheia) {
  if (cheia) {
    g.save();
    g.shadowColor = 'rgba(80,70,100,0.35)'; g.shadowBlur = 3 * DPR; g.shadowOffsetX = 1 * DPR; g.shadowOffsetY = 1.5 * DPR;
    const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#dcd6e6');
    circulo(g, x, y, r); g.fillStyle = gr; g.fill();
    g.restore();
  } else {
    circulo(g, x, y, r); g.fillStyle = '#a9a3b3'; g.fill();
    g.save(); circulo(g, x, y, r); g.clip();
    g.fillStyle = 'rgba(60,50,80,0.35)'; circulo(g, x - r * 0.3, y - r * 0.3, r); g.fill();
    g.restore();
  }
}

function pintarPedra(g, w, h, hp) {
  corpo(g, w, h, '#c7c2cc', {
    miolo: (gg, ww, hh) => {
      const rnd = semente(23);
      gg.strokeStyle = 'rgba(110,104,120,0.35)'; gg.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) {
        let x = rnd() * ww, y = rnd() * hh;
        gg.beginPath(); gg.moveTo(x, y);
        for (let k = 0; k < 3; k++) { x += (rnd() - 0.5) * 16; y += (rnd() - 0.5) * 16; gg.lineTo(x, y); }
        gg.stroke();
      }
      const perdido = 3 - Math.max(0, Math.min(3, hp));
      const rach = [[0.2, 0.34, 0.45, 0.56, 0.3, 0.9], [0.8, 0.3, 0.6, 0.6, 0.76, 0.94], [0.48, 0.24, 0.55, 0.46, 0.44, 0.66]];
      gg.lineJoin = 'round'; gg.lineCap = 'round';
      for (let k = 0; k < perdido; k++) {
        const c = rach[k];
        for (const [cor, lw, d] of [['rgba(255,255,255,0.7)', 2.2, 1], ['#7d7787', 1.6, 0]]) {
          gg.strokeStyle = cor; gg.lineWidth = lw;
          gg.beginPath(); gg.moveTo(c[0] * ww + d, c[1] * hh + d); gg.lineTo(c[2] * ww + d, c[3] * hh + d); gg.lineTo(c[4] * ww + d, c[5] * hh + d); gg.stroke();
        }
      }
    },
  });
  const r = Math.max(3, w * 0.065);
  for (let k = 0; k < 3; k++) bolinha(g, w * 0.18 + k * r * 2.7, h * 0.14 + 2, r, k < hp);
}

function pintarCoringa(g, w, h) {
  corpo(g, w, h, '#f4ecfb', {
    miolo: (gg, ww, hh) => {
      gg.save();
      gg.filter = `blur(${1.6 * DPR}px)`;
      gg.lineCap = 'round';
      const cores = ['#ffb8c1', '#fbeab4', '#cdeedd', '#9fd0ff', '#c9a8ff'];
      cores.forEach((cor, i) => {
        gg.strokeStyle = cor; gg.lineWidth = hh * 0.13;
        gg.beginPath();
        const y0 = hh * (0.1 + i * 0.2);
        gg.moveTo(-6, y0);
        gg.bezierCurveTo(ww * 0.3, y0 - hh * 0.18, ww * 0.6, y0 + hh * 0.2, ww + 6, y0 - hh * 0.05);
        gg.stroke();
      });
      gg.restore();
    },
  });
  relevo(g, '?', w / 2, h * 0.55, Math.min(w * 0.6, h * 0.42), '#7a5fc4');
}

function pintarBomba(g, w, h) {
  corpo(g, w, h, '#f2e4f2');
  const R = Math.min(w, h) * 0.24, cx = w / 2, cy = h * 0.58;
  g.strokeStyle = '#8a6a5a'; g.lineWidth = 2.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx + R * 0.45, cy - R * 0.8); g.quadraticCurveTo(cx + R * 0.9, cy - R * 1.5, cx + R * 1.25, cy - R * 1.3); g.stroke();
  g.save();
  g.shadowColor = 'rgba(160,40,60,0.4)'; g.shadowBlur = 6 * DPR; g.shadowOffsetX = 2 * DPR; g.shadowOffsetY = 3 * DPR;
  const gr = g.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.1, cx, cy, R);
  gr.addColorStop(0, '#ffc2c2'); gr.addColorStop(0.5, '#ff7f8a'); gr.addColorStop(1, '#d9475a');
  circulo(g, cx, cy, R); g.fillStyle = gr; g.fill();
  g.restore();
  elipse(g, cx - R * 0.35, cy - R * 0.42, R * 0.28, R * 0.16, -0.5); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
}

function pintarDobro(g, w, h) {
  corpo(g, w, h, '#ddd0ff');
  relevo(g, '×2', w / 2, h * 0.55, Math.min(w * 0.5, h * 0.36), '#5b3fb8');
}

/** Poco afundado (neumorfismo pressionado). */
function poco(ctx, r, R, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  rr(ctx, r.x, r.y, r.w, r.h, R); ctx.fillStyle = '#e6dfee'; ctx.fill();
  ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, R); ctx.clip();
  ctx.shadowColor = 'rgba(140,120,175,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
  ctx.lineWidth = 8; ctx.strokeStyle = '#000'; rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, R + 4); ctx.stroke();
  ctx.restore();
  ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, R); ctx.clip();
  ctx.shadowColor = 'rgba(255,255,255,0.95)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = -3; ctx.shadowOffsetY = -3;
  ctx.lineWidth = 8; ctx.strokeStyle = '#000'; rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, R + 4); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/** Superficie elevada (neumorfismo). */
function elevado(ctx, x, y, w, h, R, cor = '#f1ebf7', k = 1) {
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.95)'; ctx.shadowBlur = 16 * k; ctx.shadowOffsetX = -6 * k; ctx.shadowOffsetY = -6 * k;
  rr(ctx, x, y, w, h, R); ctx.fillStyle = cor; ctx.fill();
  ctx.shadowColor = 'rgba(140,120,175,0.38)'; ctx.shadowOffsetX = 7 * k; ctx.shadowOffsetY = 7 * k; ctx.shadowBlur = 18 * k;
  ctx.fill();
  ctx.restore();
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, clarear(cor, 0.35)); g.addColorStop(1, escurecer(cor, 0.03));
  rr(ctx, x, y, w, h, R); ctx.fillStyle = g; ctx.fill();
}

function estrelasDe(e) {
  const ref = e.estrelasRef || [0, 0, 0];
  if (ref[2] > 0 && e.pontos >= ref[2]) return 3;
  if (ref[1] > 0 && e.pontos >= ref[1]) return 2;
  return 1;
}

const tema = {
  id: 'argila',
  nome: 'Argila Suave',
  cores: { texto: TINTA, destaque: '#7a5fc4', particulas: ['#ffffff', '#c9a8ff', '#ffb8c1'] },
  faixas: (W, H) => ({ topo: W > H ? 112 : 128, base: 0 }),

  fundo(ctx, W, H, L) {
    const k = ctx.getTransform().a || 1;
    ctx.fillStyle = FUNDO; ctx.fillRect(0, 0, W, H);
    // tres formas soltas bem desfocadas
    ctx.save();
    ctx.filter = `blur(${Math.round(28 * k)}px)`;
    ctx.fillStyle = 'rgba(201,168,255,0.35)'; circulo(ctx, W * 0.12, H * 0.22, Math.min(W, H) * 0.22); ctx.fill();
    ctx.fillStyle = 'rgba(255,184,193,0.3)'; circulo(ctx, W * 0.92, H * 0.6, Math.min(W, H) * 0.26); ctx.fill();
    ctx.fillStyle = 'rgba(205,238,221,0.45)'; rr(ctx, W * 0.25, H * 0.82, Math.min(W, H) * 0.4, Math.min(W, H) * 0.24, 60); ctx.fill();
    ctx.restore();
    // mesa elevada
    const m = L.mesa;
    elevado(ctx, m.x, m.y, m.w, m.h, 28, '#f1ebf7', 1);
  },

  vivo(ctx, W, H, t) {
    // uma bolha macia que respira devagar
    const x = W * 0.82 + Math.sin(t * 0.3) * 14, y = H * 0.16 + Math.cos(t * 0.25) * 10, r = 26 + Math.sin(t * 0.6) * 3;
    ctx.save();
    ctx.shadowColor = 'rgba(140,120,175,0.3)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 5;
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(225,212,245,0.9)');
    circulo(ctx, x, y, r); ctx.fillStyle = g; ctx.globalAlpha = 0.55; ctx.fill();
    ctx.restore();
  },

  mesa(ctx, L, e, t) {
    if (e.febre) {
      const m = L.mesa, k = 0.5 + 0.5 * Math.sin(t * 7);
      ctx.save();
      ctx.shadowColor = '#c9a8ff'; ctx.shadowBlur = 16 + 12 * k;
      ctx.lineWidth = 3; ctx.strokeStyle = `rgba(201,168,255,${0.6 + 0.4 * k})`;
      rr(ctx, m.x, m.y, m.w, m.h, 28); ctx.stroke();
      ctx.restore();
    }
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      poco(ctx, s, raio(s.w, s.h));
    }
  },

  fila(ctx, L) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let k = 0; k < L.tamFila; k++) { const p = L.filaPos(k); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + p.w); y1 = Math.max(y1, p.y + p.h); }
    const pad = 12;
    poco(ctx, { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 }, 26);
  },

  peca(ctx, carta, r, op) {
    let chave, pintar;
    if (carta.tipo === 'pedra') { chave = `p${carta.hp}`; pintar = (g, w, h) => pintarPedra(g, w, h, carta.hp); }
    else if (carta.tipo === 'coringa') { chave = 'c'; pintar = pintarCoringa; }
    else if (carta.tipo === 'bomba') { chave = 'b'; pintar = pintarBomba; }
    else if (carta.tipo === 'dobro') { chave = 'd'; pintar = pintarDobro; }
    else { chave = `n${carta.v}${carta.gelo ? 'g' : ''}`; pintar = (g, w, h) => pintarCarta(g, w, h, carta.v, carta.gelo); }
    ctx.drawImage(imagem(chave, r.w, r.h, pintar), r.x - PAD, r.y - PAD, r.w + PAD * 2, r.h + PAD * 2);
    const R = raio(r.w, r.h);
    if (carta.tipo === 'normal' && nivel(carta.v) >= 10 && !carta.gelo) {
      // brilho perolado que passeia
      ctx.save();
      rr(ctx, r.x, r.y, r.w, r.h, R); ctx.clip();
      const u = ((op.t * 0.35) % 1.8) - 0.4, x = r.x + u * r.w;
      const g = ctx.createLinearGradient(x - r.w * 0.35, 0, x + r.w * 0.35, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    }
    if (carta.tipo === 'bomba') {
      const Rb = Math.min(r.w, r.h) * 0.24, cy = r.y + r.h * 0.58;
      const f = 0.6 + 0.4 * Math.abs(Math.sin(op.t * 14));
      estrela(ctx, Rb * 1.25, cy - Rb * 1.3, Rb * 0.4 * f, Rb * 0.14, 6); ctx.fillStyle = '#ffd36b'; ctx.fill();
    }
    if (op.fila && !op.frente) { rr(ctx, r.x, r.y, r.w, r.h, R); ctx.fillStyle = 'rgba(236,230,243,0.35)'; ctx.fill(); }
    if (op.destaque) {
      ctx.save();
      ctx.shadowColor = 'rgba(160,130,230,0.8)'; ctx.shadowBlur = 12;
      ctx.lineWidth = 2.4; ctx.strokeStyle = `rgba(255,255,255,${0.5 + op.destaque * 0.6})`;
      rr(ctx, r.x - 2.5, r.y - 2.5, r.w + 5, r.h + 5, R + 2.5); ctx.stroke();
      ctx.restore();
    }
  },

  cadeado(ctx, a) {
    // tampa arredondada de argila com fecho no meio
    const R = Math.min(a.w * 0.3, 18);
    ctx.save();
    ctx.globalAlpha = 0.86;
    elevado(ctx, a.x - 2, a.y - 2, a.w + 4, a.h + 4, R, '#ebe3f3', 0.6);
    ctx.restore();
    const cx = a.x + a.w / 2, cy = a.y + Math.min(a.h * 0.32, 70), rf = Math.min(a.w * 0.3, 18);
    ctx.save();
    ctx.shadowColor = 'rgba(140,120,175,0.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
    const g = ctx.createRadialGradient(cx - rf * 0.4, cy - rf * 0.4, 0, cx, cy, rf);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9cceb');
    circulo(ctx, cx, cy, rf); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    // cadeado em relevo
    const s = rf * 0.42;
    ctx.save();
    for (const [cor, d] of [['rgba(255,255,255,0.9)', -0.8], ['rgba(90,74,134,0.35)', 1.2], [TINTA, 0]]) {
      ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = s * 0.34;
      ctx.beginPath(); ctx.arc(cx + d, cy - s * 0.35 + d, s * 0.6, Math.PI, 0); ctx.stroke();
      rr(ctx, cx - s + d, cy - s * 0.35 + d, s * 2, s * 1.5, s * 0.4); ctx.fill();
    }
    circulo(ctx, cx, cy + s * 0.35, s * 0.22); ctx.fillStyle = '#ebe3f3'; ctx.fill();
    ctx.restore();
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    poco(ctx, r, raio(r.w, r.h), carga ? 1 : 0.65);
    if (!e.descarte) {
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.5;
      ctx.save();
      ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [cor, d] of [['rgba(255,255,255,0.95)', 1], [carga ? 'rgba(122,95,196,0.75)' : 'rgba(150,140,170,0.5)', 0]]) {
        ctx.strokeStyle = cor;
        ctx.beginPath(); ctx.moveTo(cx - 9 + d, cy + 2 + d); ctx.lineTo(cx - 9 + d, cy + 9 + d); ctx.lineTo(cx + 9 + d, cy + 9 + d); ctx.lineTo(cx + 9 + d, cy + 2 + d); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + d, cy + 4 + d); ctx.lineTo(cx + d, cy - 9 + d); ctx.moveTo(cx - 5 + d, cy - 4 + d); ctx.lineTo(cx + d, cy - 9 + d); ctx.lineTo(cx + 5 + d, cy - 4 + d); ctx.stroke();
      }
      ctx.restore();
    }
    const bx = r.x + r.w - 4, by = r.y + 4, br = 10;
    ctx.save();
    ctx.shadowColor = 'rgba(140,120,175,0.5)'; ctx.shadowBlur = 5; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
    circulo(ctx, bx, by, br); ctx.fillStyle = carga ? '#c9a8ff' : '#d4cede'; ctx.fill();
    ctx.restore();
    relevo(ctx, String(e.descarteCarga), bx, by + 0.5, 12, carga ? '#4a3496' : '#8c86a0');
  },

  hud(ctx, W, H, L, e, t) {
    const cy = 36;
    // botoes redondos macios (decorativos)
    for (const [x, ic] of [[34, 'voltar'], [W - 34, 'eng']]) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.95)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = -3; ctx.shadowOffsetY = -3;
      circulo(ctx, x, cy, 21); ctx.fillStyle = '#f1ebf7'; ctx.fill();
      ctx.shadowColor = 'rgba(140,120,175,0.4)'; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4; ctx.shadowBlur = 10; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [cor, d] of [['rgba(255,255,255,0.95)', -0.8], ['#8a74c9', 0]]) {
        ctx.strokeStyle = cor; ctx.fillStyle = cor;
        if (ic === 'voltar') { ctx.beginPath(); ctx.moveTo(x + 7 + d, cy + d); ctx.lineTo(x - 7 + d, cy + d); ctx.moveTo(x - 1 + d, cy - 6 + d); ctx.lineTo(x - 7 + d, cy + d); ctx.lineTo(x - 1 + d, cy + 6 + d); ctx.stroke(); }
        else {
          for (let k = 0; k < 8; k++) { const a = (k * TAU) / 8; ctx.beginPath(); ctx.moveTo(x + d + Math.cos(a) * 6, cy + d + Math.sin(a) * 6); ctx.lineTo(x + d + Math.cos(a) * 10, cy + d + Math.sin(a) * 10); ctx.stroke(); }
          circulo(ctx, x + d, cy + d, 5); ctx.stroke();
        }
      }
      ctx.restore();
    }
    // placar elevado
    const pw = Math.min(200, W * 0.44), ph = 48, px = W / 2 - pw / 2, py = cy - ph / 2;
    elevado(ctx, px, py, pw, ph, ph / 2, '#f3edf9', 0.6);
    relevo(ctx, String(e.pontos), W / 2, cy + 1, 26, TINTA, 'center', pw - 30);
    // metas com barras afundadas
    const mw = Math.min(300, W - 64), mx = W / 2 - mw / 2;
    e.metas.forEach((m, k) => {
      const y = py + ph + 16 + k * 26;
      texto(ctx, textoMeta(m), mx, y, 12, TINTA, { alinhar: 'left', fonte: FONTE, peso: 600, max: mw * 0.6 });
      const bx = mx + mw * 0.63, bw = mw * 0.37, bh = 12;
      poco(ctx, { x: bx, y: y - bh / 2, w: bw, h: bh }, bh / 2);
      const u = Math.min(1, m.atual / m.alvo);
      if (u > 0) {
        const gm = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        if (m.feita) { gm.addColorStop(0, '#a8ecc4'); gm.addColorStop(1, '#6fd39a'); } else { gm.addColorStop(0, '#ffcfd8'); gm.addColorStop(1, '#c9a8ff'); }
        rr(ctx, bx + 2, y - bh / 2 + 2, Math.max(bh - 4, (bw - 4) * u), bh - 4, (bh - 4) / 2); ctx.fillStyle = gm; ctx.fill();
        rr(ctx, bx + 4, y - bh / 2 + 3, Math.max(0, (bw - 8) * u), (bh - 4) * 0.3, 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
      }
    });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 8), fy = L.mesa.y - 18, fw = 122, fh = 28;
      ctx.save();
      ctx.shadowColor = 'rgba(201,168,255,0.9)'; ctx.shadowBlur = 10 + 10 * k;
      const gf = ctx.createLinearGradient(W / 2 - fw / 2, 0, W / 2 + fw / 2, 0);
      ['#ffd1dc', '#fff0c2', '#cff5dc', '#cde7ff', '#e3d2ff'].forEach((c, i) => gf.addColorStop(i / 4, c));
      rr(ctx, W / 2 - fw / 2, fy - fh / 2, fw, fh, fh / 2); ctx.fillStyle = gf; ctx.fill();
      ctx.restore();
      relevo(ctx, 'FEBRE ×2', W / 2, fy + 0.5, 14, '#6a4fc4');
    }
  },

  efeito(fx, P) {
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 20, ['#ffffff', '#e6dcf3'], 5, 0.3, { g: 120, vida: 0.45, tam: 5, forma: 'c' });
        return true;
      case 'fusao': {
        const n = Math.min(11, nivel(fx.valor));
        const cor = n >= 10 ? '#f7d58a' : CORES[n];
        P.estourar(fx.x, fx.y, ['#ffffff', cor, escurecer(cor, 0.12)], 6 + fx.degrau * 2, 0.45 + fx.degrau * 0.07, { forma: 'c', tam: 9, g: 160, vida: 0.6 });
        P.anel(fx.x, fx.y, 'rgba(255,255,255,0.95)', 30 + fx.degrau * 5, 0.42);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, '×' + fx.degrau, '#ffffff', 22 + fx.degrau * 2, rgba(escurecer(cor, 0.45), 0.9));
        return true;
      }
      case 'completar':
        P.anel(fx.x, fx.y, 'rgba(255,240,200,0.95)', 76, 0.6);
        P.anel(fx.x, fx.y, 'rgba(201,168,255,0.8)', 50, 0.5);
        P.subir(fx.x, fx.y, ['#ffffff', '#fff0c2', '#ffd1dc', '#cde7ff'], 12, { tam: 10, vida: 1.1, larg: 50, forca: 1.2 });
        P.texto(fx.x, fx.y - 34, String(fx.valor), '#ffffff', 32, '#a07a2a');
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#ff8a96', '#ffc2c2', '#ffffff'], 12, 0.9, { forma: 'c', tam: 10, g: 200 });
        P.anel(fx.x, fx.y, 'rgba(255,170,180,0.9)', 44, 0.45);
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#c7c2cc', '#a9a3b3', '#ffffff'], 12, 0.9, { forma: 'c', tam: 8 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#c7c2cc', '#ffffff'], 5, 0.45, { forma: 'c', tam: 5 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#ffffff', '#dceaff'], 10, 0.6, { forma: 'c', tam: 8, g: 100, vida: 0.8 });
        return true;
      case 'cadeado':
        P.anel(fx.x, fx.y, 'rgba(255,255,255,0.95)', 40, 0.45);
        P.texto(fx.x, fx.y - 20, 'Aberto!', '#ffffff', 22, TINTA);
        return true;
      case 'combo':
        P.texto(fx.x, fx.y - 44, `Combo ×${fx.n}`, '#ffffff', 20, TINTA);
        return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    ctx.save();
    ctx.fillStyle = 'rgba(236,230,243,0.72)'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const pw = Math.min(300, W - 48), ph = 200, px = W / 2 - pw / 2, py = H * 0.4 - ph / 2;
    elevado(ctx, px, py, pw, ph, 30, '#f3edf9', 1);
    const venceu = e.fim === 'venceu';
    relevo(ctx, venceu ? 'Fase completa!' : 'Sem jogadas', W / 2, py + 42, 26, TINTA);
    const n = venceu ? estrelasDe(e) : 0;
    for (let k = 0; k < 3; k++) {
      const x = W / 2 + (k - 1) * 46, y = py + 94 - (k === 1 ? 6 : 0), s = k === 1 ? 22 : 18;
      ctx.save();
      ctx.shadowColor = 'rgba(140,120,175,0.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
      estrela(ctx, x, y, s, s * 0.5); ctx.fillStyle = k < n ? '#f7d58a' : '#ddd5e8'; ctx.fill();
      ctx.restore();
    }
    const bw = pw * 0.7, bh = 44, bx = W / 2 - bw / 2, by = py + ph - 66;
    elevado(ctx, bx, by, bw, bh, bh / 2, '#cdeedd', 0.5);
    relevo(ctx, 'Jogar de novo', W / 2, by + bh / 2, 17, '#2f7a52');
  },
};

export default tema;
