// Ideia (rodada 3, tema limpo): Jardim Zen. Cada coluna e uma pilha de seixos
// equilibrados (cairn): a pedra maior embaixo e a menor em cima, a regra
// estrita ao pe da letra. O material sobe com o valor, o numero e gravado.
// Fundo: areia rastelada, uma mancha de musgo e a sombra de um galho.
import { TAU, rr, circulo, elipse, rgba, escurecer, nivel, geoTorre, textoMeta, semente, clamp } from '../kit.js';

const SANS = '"Ubuntu Sans", "Noto Sans", "Segoe UI", system-ui, sans-serif';
const AREIA = '#ece3d0';
const MADEIRA = '#d9c39c';
const TEXTO = '#4a3b28';
const JADE = '#3f9b72';
const OURO = '#d6ab45';

/** Materiais por nivel (2..4096). claro: o numero gravado e escuro. */
const MATERIAIS = [
  { cor: '#cfc9bf', tex: 'pintas', claro: true },   // granito claro
  { cor: '#5b5f64', tex: 'grao' },                  // basalto
  { cor: '#d6b083', tex: 'estratos', claro: true }, // arenito
  { cor: '#6c7a84', tex: 'camadas' },               // ardosia
  { cor: '#8fae99', tex: 'veios', claro: true },    // marmore verde
  { cor: '#3f9b72', tex: 'jade' },                  // jade
  { cor: '#e8b9c1', tex: 'nuvem', claro: true },    // quartzo rosa
  { cor: '#27242c', tex: 'vidro' },                 // obsidiana
  { cor: '#2c4c96', tex: 'lapis' },                 // lapis-lazuli
  { cor: '#1c1c20', tex: 'faixa' },                 // onix
  { cor: OURO, tex: 'metal', claro: true },         // ouro
  { cor: '#dde4ee', tex: 'iris', claro: true },     // pedra da lua
];

// ------------------------------------------------------------ cache

const CACHE = new Map();
const ESC = 2, PAD = 10;
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

// ------------------------------------------------------------ seixos

/** Geometria do seixo dentro do retangulo da faixa (w x h, origem no canto). */
function medidas(w, h, n) {
  const pw = w * (0.7 + 0.3 * Math.min(1, n / 10));
  return { cx: w / 2, cy: h / 2 + h * 0.03, rx: pw / 2, ry: h * 0.53 };
}

/** Contorno macio e irregular; a base e um pouco mais plana (a pedra assenta). */
function contorno(g, cx, cy, rx, ry, rnd) {
  const N = 26, fa = rnd() * TAU, fb = rnd() * TAU, ka = 0.03 + rnd() * 0.025, kb = 0.025;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const k = 1 + ka * Math.cos(2 * a + fa) + kb * Math.cos(3 * a + fb);
    let y = Math.sin(a) * ry * k;
    if (y > 0) y *= 0.88;
    pts.push([cx + Math.cos(a) * rx * k, cy + y]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return () => {
    g.beginPath();
    const m0 = mid(pts[0], pts[1]);
    g.moveTo(m0[0], m0[1]);
    for (let i = 1; i <= N; i++) { const p = pts[i % N], m = mid(p, pts[(i + 1) % N]); g.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
    g.closePath();
  };
}

function textura(g, mat, cx, cy, rx, ry, rnd) {
  const x0 = cx - rx, y0 = cy - ry, w = rx * 2, h = ry * 2;
  const pontos = (n, cores, t0, t1) => {
    for (let i = 0; i < n; i++) { g.fillStyle = cores[i % cores.length]; circulo(g, x0 + rnd() * w, y0 + rnd() * h, t0 + rnd() * (t1 - t0)); g.fill(); }
  };
  switch (mat.tex) {
    case 'pintas': pontos(70, ['rgba(90,84,76,0.45)', 'rgba(250,247,240,0.6)', 'rgba(150,140,128,0.4)'], 0.4, 1.2); break;
    case 'grao': pontos(90, ['rgba(0,0,0,0.18)', 'rgba(255,255,255,0.1)'], 0.3, 0.8); break;
    case 'estratos':
      for (let i = 0; i < 7; i++) {
        const y = y0 + (i + 0.5) * h / 7;
        g.strokeStyle = i % 2 ? 'rgba(150,100,55,0.18)' : 'rgba(255,240,215,0.25)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + w * 0.3, y - 2, x0 + w * 0.7, y + 2.5, x0 + w, y - 1); g.stroke();
      }
      break;
    case 'camadas':
      for (let i = 0; i < 5; i++) {
        const y = y0 + h * (0.2 + i * 0.16);
        g.strokeStyle = 'rgba(30,40,48,0.25)'; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(x0, y + 3); g.lineTo(x0 + w, y - 3); g.stroke();
      }
      break;
    case 'veios':
      g.strokeStyle = 'rgba(250,252,248,0.55)'; g.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const y = y0 + h * (0.25 + rnd() * 0.5);
        g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + w * 0.3, y - h * 0.3, x0 + w * 0.6, y + h * 0.3, x0 + w, y - h * 0.1); g.stroke();
      }
      break;
    case 'jade': {
      const gr = g.createRadialGradient(cx, cy, 1, cx, cy, rx);
      gr.addColorStop(0, 'rgba(150,230,190,0.55)'); gr.addColorStop(1, 'rgba(10,60,40,0.25)');
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      break;
    }
    case 'nuvem':
      for (let i = 0; i < 5; i++) {
        const x = x0 + rnd() * w, y = y0 + rnd() * h, R = rx * (0.3 + rnd() * 0.4);
        const gr = g.createRadialGradient(x, y, 1, x, y, R);
        gr.addColorStop(0, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2);
      }
      break;
    case 'vidro': {
      const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + h);
      gr.addColorStop(0, 'rgba(120,110,170,0.25)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(90,140,170,0.18)');
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(cx - rx * 0.5, cy - ry * 0.1); g.quadraticCurveTo(cx - rx * 0.1, cy - ry * 0.55, cx + rx * 0.45, cy - ry * 0.45); g.stroke();
      break;
    }
    case 'lapis': pontos(26, ['rgba(232,196,90,0.9)', 'rgba(255,255,255,0.35)'], 0.4, 1); break;
    case 'faixa':
      g.strokeStyle = 'rgba(236,228,214,0.75)'; g.lineWidth = ry * 0.18;
      g.beginPath(); g.moveTo(x0, cy + ry * 0.2); g.bezierCurveTo(x0 + w * 0.3, cy - ry * 0.05, x0 + w * 0.7, cy + ry * 0.35, x0 + w, cy + ry * 0.1); g.stroke();
      g.strokeStyle = 'rgba(236,228,214,0.35)'; g.lineWidth = ry * 0.06;
      g.beginPath(); g.moveTo(x0, cy + ry * 0.45); g.bezierCurveTo(x0 + w * 0.3, cy + ry * 0.25, x0 + w * 0.7, cy + ry * 0.6, x0 + w, cy + ry * 0.38); g.stroke();
      break;
    case 'metal': {
      const gr = g.createLinearGradient(x0, y0, x0, y0 + h);
      gr.addColorStop(0, 'rgba(255,240,180,0.6)'); gr.addColorStop(0.35, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(120,80,10,0.25)'); gr.addColorStop(0.8, 'rgba(255,230,160,0.3)'); gr.addColorStop(1, 'rgba(100,65,10,0.3)');
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      break;
    }
    case 'iris': {
      const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + h);
      gr.addColorStop(0, 'rgba(255,190,220,0.45)'); gr.addColorStop(0.45, 'rgba(180,220,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0.5)');
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      break;
    }
    default: break;
  }
}

/** Seixo polido com sombra de contato, textura do material, luz e oclusao. */
function seixo(g, w, h, n, rnd, base = MATERIAIS[n].cor, mat = MATERIAIS[n]) {
  const { cx, cy, rx, ry } = medidas(w, h, n);
  g.save();
  g.filter = 'blur(2px)';
  elipse(g, cx, cy + ry * 0.8, rx * 0.86, ry * 0.2); g.fillStyle = 'rgba(60,45,25,0.3)'; g.fill();
  g.restore();
  const caminho = contorno(g, cx, cy, rx, ry, rnd);
  caminho(); g.fillStyle = base; g.fill();
  g.save();
  caminho(); g.clip();
  textura(g, mat, cx, cy, rx, ry, rnd);
  const luz = g.createRadialGradient(cx - rx * 0.35, cy - ry * 0.6, 1, cx - rx * 0.15, cy - ry * 0.2, rx * 1.25);
  luz.addColorStop(0, 'rgba(255,255,255,0.4)'); luz.addColorStop(0.5, 'rgba(255,255,255,0.06)'); luz.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = luz; g.fillRect(cx - rx - 2, cy - ry - 2, rx * 2 + 4, ry * 2 + 4);
  const oc = g.createLinearGradient(0, cy - ry * 0.05, 0, cy + ry);
  oc.addColorStop(0, 'rgba(0,0,0,0)'); oc.addColorStop(1, 'rgba(20,14,8,0.4)');
  g.fillStyle = oc; g.fillRect(cx - rx - 2, cy - ry - 2, rx * 2 + 4, ry * 2 + 4);
  const brilho = mat.tex === 'vidro' || mat.tex === 'metal' || mat.tex === 'faixa' ? 0.5 : 0.24;
  elipse(g, cx - rx * 0.3, cy - ry * 0.55, rx * 0.34, ry * 0.13, -0.12);
  g.fillStyle = `rgba(255,255,255,${brilho})`; g.fill();
  g.restore();
  caminho(); g.strokeStyle = 'rgba(30,22,12,0.28)'; g.lineWidth = 0.8; g.stroke();
  return { cx, cy, rx, ry };
}

/** Numero gravado (baixo-relevo): luz embaixo e sombra em cima. */
function gravar(g, txt, cx, cy, tam, maxW, claro, cor) {
  g.save();
  g.font = `600 ${Math.round(tam)}px ${SANS}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const m = g.measureText(txt).width;
  if (m > maxW) { const k = maxW / m; g.translate(cx, cy); g.scale(k, k); cx = 0; cy = 0; }
  if (claro) {
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillText(txt, cx + 0.8, cy + 0.9);
    g.fillStyle = escurecer(cor, 0.58); g.fillText(txt, cx, cy);
  } else {
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText(txt, cx - 0.7, cy - 0.7);
    g.fillStyle = 'rgba(240,232,214,0.94)'; g.fillText(txt, cx, cy);
  }
  g.restore();
}

function pedraNormal(g, w, h, v) {
  const n = Math.min(11, nivel(v));
  const s = seixo(g, w, h, n, semente(v * 97 + w * 5 + h));
  gravar(g, String(v), s.cx, s.cy + 1, Math.min(s.ry * 0.9, s.rx * 0.7), s.rx * 1.5, MATERIAIS[n].claro, MATERIAIS[n].cor);
}

/** Obstaculo: rocha bruta angulosa, com facetas, rachaduras e pips gravados. */
function rocha(g, w, h, hp) {
  const rnd = semente(41 + w * 3 + h);
  const cx = w / 2, cy = h / 2 + h * 0.05, rx = w * 0.46, ry = h * 0.46;
  g.save(); g.filter = 'blur(2px)';
  elipse(g, cx, cy + ry * 0.8, rx * 0.9, ry * 0.2); g.fillStyle = 'rgba(60,45,25,0.32)'; g.fill();
  g.restore();
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + rnd() * 0.3;
    let y = Math.sin(a) * ry * (0.82 + rnd() * 0.18);
    if (y > 0) y *= 0.86;
    pts.push([cx + Math.cos(a) * rx * (0.84 + rnd() * 0.16), cy + y]);
  }
  const caminho = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  caminho(); g.fillStyle = '#86827a'; g.fill();
  const luz = [cx - rx * 0.25, cy - ry * 0.35];
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const nx = (p[1] + q[1]) / 2 - cy, ny = -((p[0] + q[0]) / 2 - cx);
    const k = (nx * -0.3 + ny * 0.6) / Math.hypot(nx, ny);
    g.beginPath(); g.moveTo(luz[0], luz[1]); g.lineTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.closePath();
    g.fillStyle = k > 0 ? `rgba(255,255,255,${0.1 + k * 0.18})` : `rgba(0,0,0,${0.1 - k * 0.2})`;
    g.fill();
  });
  caminho(); g.strokeStyle = 'rgba(30,22,12,0.4)'; g.lineWidth = 0.9; g.stroke();
  const perdido = 3 - clamp(hp, 0, 3);
  g.strokeStyle = 'rgba(30,24,18,0.75)'; g.lineWidth = 1.1;
  const rach = [[-0.45, -0.3, -0.1, 0.05, -0.25, 0.5], [0.5, -0.2, 0.15, 0.1, 0.35, 0.45], [0, -0.6, 0.05, -0.2, -0.05, 0.15]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    g.beginPath(); g.moveTo(cx + c[0] * rx, cy + c[1] * ry); g.lineTo(cx + c[2] * rx, cy + c[3] * ry); g.lineTo(cx + c[4] * rx, cy + c[5] * ry); g.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * Math.min(10, rx * 0.36), y = cy + ry * 0.2, rp = Math.max(2, Math.min(3.4, ry * 0.12));
    circulo(g, x + 0.6, y + 0.6, rp); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
    circulo(g, x, y, rp); g.fillStyle = i < hp ? '#efe6d2' : 'rgba(30,24,18,0.55)'; g.fill();
  }
}

function seixoCoringa(g, w, h) {
  const rnd = semente(303 + w + h);
  const s = seixo(g, w, h, 6, rnd, '#e9e2d6', { tex: '', claro: true });
  g.save();
  contorno(g, s.cx, s.cy, s.rx, s.ry, semente(303 + w + h))(); g.clip();
  const cores = ['rgba(120,170,220,0.55)', 'rgba(230,150,160,0.55)', 'rgba(150,200,150,0.55)', 'rgba(230,200,120,0.55)'];
  cores.forEach((c, i) => {
    g.strokeStyle = c; g.lineWidth = s.ry * 0.3;
    const y = s.cy - s.ry * 0.6 + i * s.ry * 0.4;
    g.beginPath(); g.moveTo(s.cx - s.rx, y); g.bezierCurveTo(s.cx - s.rx * 0.3, y - s.ry * 0.5, s.cx + s.rx * 0.3, y + s.ry * 0.5, s.cx + s.rx, y - s.ry * 0.1); g.stroke();
  });
  g.restore();
  gravar(g, '?', s.cx, s.cy + 1, s.ry * 0.95, s.rx, true, '#8a8070');
}

function seixoBomba(g, w, h) {
  const rnd = semente(404 + w + h);
  const s = seixo(g, w, h, 3, rnd, '#9e3a2c', { tex: 'grao' });
  g.strokeStyle = '#ffb35a'; g.lineWidth = 1.4; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(s.cx - s.rx * 0.5, s.cy - s.ry * 0.4); g.lineTo(s.cx - s.rx * 0.1, s.cy); g.lineTo(s.cx - s.rx * 0.25, s.cy + s.ry * 0.5);
  g.moveTo(s.cx - s.rx * 0.1, s.cy); g.lineTo(s.cx + s.rx * 0.35, s.cy - s.ry * 0.2); g.lineTo(s.cx + s.rx * 0.55, s.cy + s.ry * 0.3);
  g.stroke();
}

function seixoDobro(g, w, h) {
  const s = seixo(g, w, h, 4, semente(505 + w + h), '#cdc6ba', { tex: 'pintas', claro: true });
  gravar(g, '×2', s.cx, s.cy + 1, s.ry * 0.9, s.rx * 1.4, true, '#8a8070');
}

// ------------------------------------------------------------ particulas

function registrarFormas(P) {
  if (P.formas.txtZen) return;
  P.formas.txtZen = (ctx, p) => {
    ctx.font = `600 ${Math.round(p.tam)}px ${SANS}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.txt, 0, 0);
  };
  P.formas.lasca = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s * 0.3, -s); ctx.lineTo(s, s * 0.2); ctx.lineTo(-s * 0.2, s); ctx.closePath(); ctx.fill();
  };
  P.formas.fibra = (ctx, p) => { ctx.fillRect(-p.tam / 2, -0.6, p.tam, 1.2); };
  P.formas.ondula = (ctx, p, u) => {
    ctx.strokeStyle = p.cor; ctx.lineWidth = 1.2;
    for (let k = 0; k < 2; k++) { elipse(ctx, 0, 0, p.tam * (0.5 + u * 1.2 + k * 0.25), p.tam * (0.16 + u * 0.38 + k * 0.08)); ctx.stroke(); }
  };
}

function txt(P, x, y, s, tam, cor, vida = 1) {
  P.add({ forma: 'txtZen', x, y, vy: -34, g: 0, arrasto: 1, vida, tam, cor, txt: s });
}

// ------------------------------------------------------------ cenario

/** Placa de madeira clara (HUD e fila) com veios finos. */
function tabua(ctx, x, y, w, h, raio = 6, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(70,50,25,0.22)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
  rr(ctx, x, y, w, h, raio);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#e6d3b0'); g.addColorStop(1, MADEIRA);
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.clip();
  ctx.strokeStyle = 'rgba(120,85,45,0.12)'; ctx.lineWidth = 1;
  const rnd = semente(Math.round(w * 3 + h));
  for (let i = 0; i < Math.max(3, h / 6); i++) {
    const yy = y + (i + 0.5) * h / Math.max(3, h / 6);
    ctx.beginPath(); ctx.moveTo(x, yy);
    ctx.bezierCurveTo(x + w * 0.3, yy + (rnd() - 0.5) * 3, x + w * 0.7, yy + (rnd() - 0.5) * 3, x + w, yy);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = alpha;
  rr(ctx, x, y, w, h, raio); ctx.strokeStyle = 'rgba(110,80,45,0.3)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

function barraFina(ctx, x, y, w, frac, feita) {
  rr(ctx, x, y, w, 4, 2); ctx.fillStyle = 'rgba(74,59,40,0.15)'; ctx.fill();
  if (frac > 0) { rr(ctx, x, y, Math.max(4, w * clamp(frac)), 4, 2); ctx.fillStyle = feita ? JADE : '#8c6a3f'; ctx.fill(); }
}

const tema = {
  id: 'zen',
  nome: 'Jardim Zen',
  cores: { texto: TEXTO, destaque: OURO, particulas: ['#d8ccb3', '#c9b994'] },
  faixas: () => ({ topo: 92, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.05, colar: true, filaFator: 1.1 }),

  fundo(ctx, W, H, L) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#efe7d6'); g.addColorStop(1, '#e4d9c3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rnd = semente(88);
    // grao da areia
    for (let i = 0; i < (W * H) / 160; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(120,100,70,0.08)';
      ctx.fillRect(rnd() * W, rnd() * H, 1, 1);
    }
    // sulcos paralelos
    const sulco = (y, x0, x1) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y + Math.sin(x / 70 + y * 0.03) * 1.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,98,66,0.14)';
      ctx.beginPath(); for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y + 1.6 + Math.sin(x / 70 + y * 0.03) * 1.2); ctx.stroke();
    };
    for (let y = 4; y < H; y += 7) sulco(y, -4, W + 4);
    // ilha rastelada em volta das pilhas (sulcos concentricos)
    const a0 = L.coluna(0), an = L.descarteNaMesa ? L.descarte : L.coluna(L.colunas - 1);
    const ix = a0.x - 18, iy = a0.y - 14, iw = an.x + an.w + 18 - ix, ih = L.chao + 16 - iy;
    rr(ctx, ix - 34, iy - 30, iw + 68, ih + 60, 60); ctx.fillStyle = '#eae1cd'; ctx.fill();
    for (let k = 4; k >= 0; k--) {
      const d = k * 7;
      rr(ctx, ix - d, iy - d, iw + d * 2, ih + d * 2, 40 + d);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.stroke();
      rr(ctx, ix - d + 1.4, iy - d + 1.4, iw + d * 2, ih + d * 2, 40 + d);
      ctx.strokeStyle = 'rgba(120,98,66,0.15)'; ctx.stroke();
    }
    rr(ctx, ix + 6, iy + 6, iw - 12, ih - 12, 34); ctx.fillStyle = 'rgba(236,228,211,0.9)'; ctx.fill();
    // uma rocha com sulcos concentricos no espaco livre acima das pilhas
    const zy0 = L.topo + 14, zy1 = iy - 44;
    if (zy1 - zy0 > 110) {
      const rcx = W * 0.3, rcy = (zy0 + zy1) / 2, rry = Math.min(70, (zy1 - zy0) / 2), rrx = Math.min(W * 0.27, rry * 2.1);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(rcx, rcy, rrx + 4, rry + 4, 0, 0, TAU); ctx.fillStyle = '#eae1cd'; ctx.fill();
      for (let k = 0; k < 5; k++) {
        const fx = 0.32 + k * 0.17;
        ctx.beginPath(); ctx.ellipse(rcx, rcy, rrx * fx, rry * fx, 0, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(rcx, rcy + 1.4, rrx * fx, rry * fx, 0, 0, TAU); ctx.strokeStyle = 'rgba(120,98,66,0.15)'; ctx.stroke();
      }
      ctx.save(); ctx.filter = 'blur(2px)';
      elipse(ctx, rcx + 3, rcy + rry * 0.16, rrx * 0.2, rry * 0.12); ctx.fillStyle = 'rgba(60,45,25,0.3)'; ctx.fill();
      ctx.restore();
      const pr = [[-0.24, 0.1], [-0.18, -0.12], [-0.04, -0.22], [0.12, -0.16], [0.22, 0.02], [0.18, 0.12], [-0.02, 0.15]];
      ctx.beginPath();
      pr.forEach(([dx, dy], i) => { const x = rcx + dx * rrx, y = rcy + dy * rry * 1.4; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.closePath();
      const gr = ctx.createLinearGradient(rcx - rrx * 0.2, rcy - rry * 0.3, rcx + rrx * 0.2, rcy + rry * 0.2);
      gr.addColorStop(0, '#8f8a80'); gr.addColorStop(1, '#55524c');
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = 'rgba(30,22,12,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.fillStyle = 'rgba(108,128,74,0.7)';
      elipse(ctx, rcx - rrx * 0.06, rcy - rry * 0.27, rrx * 0.08, rry * 0.05); ctx.fill();
      ctx.restore();
    }
    // musgo num canto
    const mx = W * 0.06, my = H - Math.min(H * 0.07, 60);
    for (let i = 0; i < 26; i++) {
      const x = mx + (rnd() - 0.3) * 70, y = my + (rnd() - 0.4) * 34, R = 5 + rnd() * 11;
      ctx.fillStyle = ['rgba(108,128,74,0.75)', 'rgba(130,150,88,0.7)', 'rgba(90,110,62,0.7)'][i % 3];
      circulo(ctx, x, y, R); ctx.fill();
    }
    // sombra de um galho
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.strokeStyle = 'rgba(60,45,30,0.08)'; ctx.fillStyle = 'rgba(60,45,30,0.07)'; ctx.lineCap = 'round';
    const bx = W + 10, by = L.topo + 30;
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(W * 0.8, by + 30, W * 0.62, by + 18); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W * 0.82, by + 26); ctx.quadraticCurveTo(W * 0.76, by + 60, W * 0.7, by + 70); ctx.stroke();
    for (let i = 0; i < 12; i++) { elipse(ctx, W * (0.64 + rnd() * 0.32), by + 10 + rnd() * 70, 8, 3.5, rnd() * 3); ctx.fill(); }
    ctx.restore();
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(120,98,66,0.35)'; ctx.lineWidth = 1.2;
      elipse(ctx, s.x + s.w / 2, s.y + s.h * 0.54, s.w * 0.32, s.h * 0.4); ctx.stroke();
      ctx.restore();
    }
  },

  peca(ctx, carta, r, op) {
    let c;
    if (carta.tipo === 'pedra') c = imagem('rocha' + carta.hp, r.w, r.h, (g, w, h) => rocha(g, w, h, carta.hp));
    else if (carta.tipo === 'coringa') c = imagem('coringa', r.w, r.h, seixoCoringa);
    else if (carta.tipo === 'bomba') c = imagem('bomba', r.w, r.h, seixoBomba);
    else if (carta.tipo === 'dobro') c = imagem('dobro', r.w, r.h, seixoDobro);
    else c = imagem('v' + carta.v, r.w, r.h, (g, w, h) => pedraNormal(g, w, h, carta.v));
    pintar(ctx, c, r);
    const n = carta.tipo === 'normal' ? Math.min(11, nivel(carta.v)) : carta.tipo === 'pedra' ? 10 : 4;
    const m = medidas(r.w, r.h, n);
    const cx = r.x + m.cx, cy = r.y + m.cy;
    if (carta.tipo === 'bomba') {
      const k = 0.5 + 0.5 * Math.sin((op.t || 0) * 6);
      ctx.save();
      const gr = ctx.createRadialGradient(cx, cy, 1, cx, cy, m.rx);
      gr.addColorStop(0, `rgba(255,170,80,${0.15 + 0.2 * k})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = gr; elipse(ctx, cx, cy, m.rx * 1.1, m.ry * 1.1); ctx.fill();
      ctx.restore();
    }
    if (carta.tipo === 'normal' && carta.gelo) {
      ctx.save();
      elipse(ctx, cx, cy, m.rx * 0.98, m.ry * 0.92);
      ctx.fillStyle = 'rgba(226,238,248,0.55)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.9;
      for (const [dx, dy, s] of [[-0.55, -0.35, 5], [0.5, -0.3, 4], [0.2, 0.45, 3.5], [-0.3, 0.4, 3]]) {
        const x = cx + dx * m.rx, y = cy + dy * m.ry;
        for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke(); }
      }
      const mat = MATERIAIS[n];
      gravar(ctx, String(carta.v), cx, cy + 1, Math.min(m.ry * 0.9, m.rx * 0.7), m.rx * 1.5, mat.claro, mat.cor);
      ctx.restore();
    }
    if (op.destaque) {
      ctx.save();
      elipse(ctx, cx, cy, m.rx + 3, m.ry * 0.92 + 3);
      ctx.strokeStyle = `rgba(255,255,255,${op.destaque})`; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }
  },

  cadeado(ctx, a) {
    ctx.save();
    rr(ctx, a.x - 4, a.y - 4, a.w + 8, a.h + 8, 12);
    ctx.fillStyle = 'rgba(234,225,207,0.62)'; ctx.fill();
    const y = a.y + a.h * 0.42, x0 = a.x - 8, x1 = a.x + a.w + 8;
    // shide: tiras de papel em zigue-zague
    for (const fx of [0.3, 0.7]) {
      const sx = a.x + a.w * fx, s = Math.max(5, a.w * 0.09);
      ctx.beginPath(); ctx.moveTo(sx - s, y + 3);
      ctx.lineTo(sx + s, y + 3); ctx.lineTo(sx + s, y + 3 + s * 1.6); ctx.lineTo(sx - s * 0.2, y + 3 + s * 1.6);
      ctx.lineTo(sx - s * 0.2, y + 3 + s * 3.2); ctx.lineTo(sx - s * 1.4, y + 3 + s * 3.2); ctx.lineTo(sx - s * 1.4, y + 3 + s * 1.6);
      ctx.lineTo(sx - s, y + 3 + s * 1.6); ctx.closePath();
      ctx.fillStyle = '#fbf8f1'; ctx.fill(); ctx.strokeStyle = 'rgba(110,90,60,0.35)'; ctx.lineWidth = 0.7; ctx.stroke();
    }
    // corda trancada
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#a7834f'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 5, x1, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,55,25,0.55)'; ctx.lineWidth = 1.2;
    for (let x = x0 + 3; x < x1 - 2; x += 5) {
      const u = (x - x0) / (x1 - x0), yy = y + Math.sin(u * Math.PI) * 4.6;
      ctx.beginPath(); ctx.moveTo(x - 2, yy - 3); ctx.lineTo(x + 2, yy + 3); ctx.stroke();
    }
    const kx = (x0 + x1) / 2, ky = y + 4.6;
    circulo(ctx, kx, ky, 6); ctx.fillStyle = '#9a7646'; ctx.fill();
    ctx.strokeStyle = 'rgba(80,55,25,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    const cx = r.x + r.w / 2, base = r.y + r.h, bw = r.w * 0.56, top = base - r.h * 0.42;
    ctx.save();
    ctx.save(); ctx.filter = 'blur(2px)';
    elipse(ctx, cx, base - 2, bw * 1.05, 6); ctx.fillStyle = 'rgba(60,45,25,0.3)'; ctx.fill();
    ctx.restore();
    // corpo da tigela
    ctx.beginPath();
    ctx.moveTo(cx - bw, top); ctx.quadraticCurveTo(cx - bw * 0.9, base - 2, cx, base - 2); ctx.quadraticCurveTo(cx + bw * 0.9, base - 2, cx + bw, top); ctx.closePath();
    const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
    g.addColorStop(0, '#9b958a'); g.addColorStop(0.4, '#b8b2a6'); g.addColorStop(1, '#7c776d');
    ctx.fillStyle = g; ctx.fill();
    // borda e interior
    elipse(ctx, cx, top, bw, r.h * 0.13); ctx.fillStyle = '#c3bdb1'; ctx.fill();
    elipse(ctx, cx, top + 1, bw * 0.82, r.h * 0.1);
    ctx.fillStyle = carga ? '#3e5a5c' : '#8d8679'; ctx.fill();
    if (carga) { elipse(ctx, cx - bw * 0.25, top - 0.5, bw * 0.25, r.h * 0.03); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); }
    ctx.font = `500 10px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = carga ? 'rgba(74,59,40,0.6)' : 'rgba(74,59,40,0.35)';
    ctx.fillText(carga ? 'descarte' : 'vazio', cx, top - r.h * 0.17);
    ctx.restore();
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) { tabua(ctx, f.x + 4, f.y, f.w - 8, f.h, 10, 0.92); return; }
    let x0 = Infinity, x1 = -Infinity, y = 0;
    for (let k = 0; k < L.tamFila; k++) { const p = L.filaPos(k); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x + p.w); y = Math.max(y, p.y + p.h); }
    tabua(ctx, x0 - 16, y - 2, x1 - x0 + 32, 10, 4);
  },

  hud(ctx, W, H, L, e, t) {
    const x = 10, y = 10, w = W - 20, h = 70;
    tabua(ctx, x, y, w, h, 10);
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = `500 10px ${SANS}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(74,59,40,0.6)';
    ctx.fillText('fase', x + 30, y + 22);
    ctx.font = `600 22px ${SANS}`; ctx.fillStyle = TEXTO; ctx.fillText(String(e.faseId), x + 30, y + 44);
    ctx.font = `600 24px ${SANS}`; ctx.fillText(String(e.pontos), W / 2, y + 22);
    const larg = Math.min(520, w - 130), gap = 14, n = e.metas.length;
    const bw = n > 1 ? (larg - gap) / 2 : larg, x0 = W / 2 - larg / 2;
    e.metas.forEach((m, k) => {
      const bx = x0 + k * (bw + gap);
      ctx.font = `500 10.5px ${SANS}`; ctx.textAlign = 'left';
      ctx.fillStyle = m.feita ? JADE : 'rgba(74,59,40,0.7)';
      let s = textoMeta(m, { monte: (q) => `Equilibre ${q} pilha${q > 1 ? 's' : ''}` });
      while (ctx.measureText(s).width > bw && s.length > 4) s = s.slice(0, -2) + '…';
      ctx.fillText(s, bx, y + 45);
      barraFina(ctx, bx, y + 54, bw, m.atual / m.alvo, m.feita);
    });
    if (e.febre) {
      const k = 0.55 + 0.45 * Math.sin(t * 5);
      ctx.globalAlpha = k;
      ctx.font = `600 13px ${SANS}`; ctx.textAlign = 'right'; ctx.fillStyle = JADE;
      ctx.fillText('FLUXO ×2', x + w - 14, y + 22);
    }
    ctx.restore();
  },

  efeito(fx, P) {
    registrarFormas(P);
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 18, ['#d8ccb3', '#c9b994'], 6, 0.3, { g: 300, vida: 0.45, tam: 3, forma: 'c' });
        return true;
      case 'fusao':
        P.add({ forma: 'ondula', x: fx.x, y: fx.y + 6, vida: 0.7, tam: 26 + fx.degrau * 6, cor: 'rgba(120,98,66,0.55)', g: 0 });
        P.subir(fx.x, fx.y, ['rgba(255,255,255,0.9)', 'rgba(255,240,200,0.9)'], 3 + fx.degrau, { tam: 3, vida: 0.8, larg: 24, forca: 0.6 });
        if (fx.degrau > 1) txt(P, fx.x + 30, fx.y - 12, '×' + fx.degrau, 16 + fx.degrau * 2, TEXTO);
        return true;
      case 'completar':
        P.add({ forma: 'ondula', x: fx.x, y: fx.y + 8, vida: 1.1, tam: 46, cor: 'rgba(214,171,69,0.7)', g: 0 });
        P.subir(fx.x, fx.y, ['#f2d47c', '#d6ab45', '#fff4cf'], 16, { tam: 4, vida: 1.5, larg: 40, forca: 0.8, g: -10 });
        txt(P, fx.x, fx.y - 40, String(fx.valor), 24, '#a8812c', 1.3);
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#9e3a2c', '#ffb35a', '#6b2a20'], 14, 1, { g: 480, vida: 0.6, tam: 5, forma: 'lasca' });
        P.estourar(fx.x, fx.y + 10, ['#d8ccb3', '#c9b994'], 10, 0.6, { g: 300, vida: 0.6, tam: 3, forma: 'c' });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#86827a', '#5d5a54', '#a9a499'], 12, 0.9, { g: 520, vida: 0.6, tam: 5, forma: 'lasca' });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#86827a', '#a9a499'], 4, 0.5, { g: 400, vida: 0.4, tam: 3, forma: 'lasca' });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['rgba(240,248,255,0.95)', 'rgba(200,222,240,0.9)'], 10, 0.6, { g: 80, vida: 0.9, tam: 4, forma: 'lasca' });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#a7834f', '#fbf8f1'], 12, 0.8, { g: 200, vida: 0.8, tam: 7, forma: 'fibra' });
        txt(P, fx.x, fx.y - 20, 'livre', 14, TEXTO);
        return true;
      case 'combo':
        txt(P, fx.x, fx.y - 46, `combo ×${fx.n}`, 14, JADE);
        return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    const y0 = H * 0.4, h = Math.min(130, H * 0.17);
    ctx.save();
    ctx.fillStyle = 'rgba(240,233,218,0.95)'; ctx.fillRect(0, y0, W, h);
    ctx.strokeStyle = 'rgba(120,98,66,0.25)'; ctx.lineWidth = 1;
    for (const yy of [y0 + 4, y0 + h - 4]) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(Math.min(30, W * 0.075))}px ${SANS}`; ctx.fillStyle = TEXTO;
    ctx.fillText(e.fim === 'venceu' ? 'Equilíbrio' : 'Sem jogadas', W / 2, y0 + h * 0.42);
    ctx.font = `500 13px ${SANS}`; ctx.fillStyle = 'rgba(74,59,40,0.6)';
    ctx.fillText('toque para jogar de novo', W / 2, y0 + h * 0.74);
    ctx.restore();
  },
};

export default tema;
