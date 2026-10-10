// Tema limpo (rodada 3): Art Deco, anos 20. Fundo preto com padrao geometrico
// dourado quase invisivel; mesa com moldura dupla de filete; cartas de marfim
// com moldura dourada de cantos escalonados, numero em serifa e uma faixa fina
// de cor de pedra preciosa por valor. Os valores altos ganham mais ouro e o
// leque. Luxo contido: nada de fichas, naipes ou brilho de cassino.
import { TAU, circulo, texto, escurecer, rgba, semente, clamp, textoMeta, nivel } from '../kit.js';

const SERIFA = '"Noto Serif", Georgia, "Times New Roman", serif';
const OURO = '#d9b45a';
const OURO_CLARO = '#f6e4a6';
const OURO_ESCURO = '#8f6a1f';
const MARFIM = '#f3ead3';
const TINTA = '#1f1a12';
/** Faixa de pedra preciosa por valor. */
const JOIAS = {
  2: '#2e7d6b', 4: '#2b4c9b', 8: '#a8233a', 16: '#6b3fa0', 32: '#c7862b', 64: '#1f6e8c',
  128: '#8c2f5a', 256: '#3f7f3a', 512: '#b0462a', 1024: '#4a3b8f', 2048: '#b8860b', 4096: '#111111',
};
const joia = (v) => JOIAS[v] || '#5a5246';

function gradOuro(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, OURO_CLARO); g.addColorStop(0.45, OURO); g.addColorStop(1, OURO_ESCURO);
  return g;
}

/** Retangulo com cantos escalonados (degrau `d`). */
function escalonado(ctx, x, y, w, h, d) {
  ctx.beginPath();
  ctx.moveTo(x + d, y); ctx.lineTo(x + w - d, y); ctx.lineTo(x + w - d, y + d * 0.5); ctx.lineTo(x + w - d * 0.5, y + d * 0.5); ctx.lineTo(x + w - d * 0.5, y + d); ctx.lineTo(x + w, y + d);
  ctx.lineTo(x + w, y + h - d); ctx.lineTo(x + w - d * 0.5, y + h - d); ctx.lineTo(x + w - d * 0.5, y + h - d * 0.5); ctx.lineTo(x + w - d, y + h - d * 0.5); ctx.lineTo(x + w - d, y + h);
  ctx.lineTo(x + d, y + h); ctx.lineTo(x + d, y + h - d * 0.5); ctx.lineTo(x + d * 0.5, y + h - d * 0.5); ctx.lineTo(x + d * 0.5, y + h - d); ctx.lineTo(x, y + h - d);
  ctx.lineTo(x, y + d); ctx.lineTo(x + d * 0.5, y + d); ctx.lineTo(x + d * 0.5, y + d * 0.5); ctx.lineTo(x + d, y + d * 0.5); ctx.closePath();
}

/** Leque art deco: semicirculo de raios com arcos, centrado em (x, y) abrindo para cima. */
function leque(ctx, x, y, R, cor, op = {}) {
  const n = op.raios || 9;
  const abre = op.abre ?? 1;
  ctx.save();
  ctx.strokeStyle = cor; ctx.lineWidth = op.linha || Math.max(0.8, R * 0.04);
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (i / n) * Math.PI * abre + (Math.PI * (1 - abre)) / 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.stroke();
  }
  for (const k of [0.38, 0.7, 1]) {
    ctx.beginPath(); ctx.arc(x, y, R * k, Math.PI + (Math.PI * (1 - abre)) / 2, Math.PI * 2 - (Math.PI * (1 - abre)) / 2); ctx.stroke();
  }
  if (op.preencher) {
    ctx.globalAlpha *= 0.18; ctx.fillStyle = cor;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, Math.PI, 0); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/** Losango pequeno (pips, ornamentos). */
function losango(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.7, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.7, y); ctx.closePath(); }

/** Ornamento horizontal: filete - losango - filete. */
function ornamento(ctx, x, y, larg, cor) {
  ctx.save();
  ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - larg / 2, y); ctx.lineTo(x - 8, y); ctx.moveTo(x + 8, y); ctx.lineTo(x + larg / 2, y); ctx.stroke();
  losango(ctx, x, y, 4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - larg / 2, y - 3); ctx.lineTo(x - larg / 2 + larg * 0.18, y - 3); ctx.moveTo(x + larg / 2, y - 3); ctx.lineTo(x + larg / 2 - larg * 0.18, y - 3); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------ cartas (cache)

const cache = new Map();
function emCache(chave, w, h, pad, desenho) {
  const k = `${chave}|${w | 0}|${h | 0}`;
  let cv = cache.get(k);
  if (!cv) {
    if (cache.size > 400) cache.clear();
    cv = document.createElement('canvas');
    cv.width = Math.ceil((w + pad * 2) * 2); cv.height = Math.ceil((h + pad * 2) * 2);
    const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
    g.scale(2, 2); g.translate(pad + w / 2, pad + h / 2);
    desenho(g, { x: -w / 2, y: -h / 2, w, h });
    cache.set(k, cv);
  }
  return cv;
}

/** Placa com moldura dourada; `fundo` = estilo do miolo. */
function placa(g, r, op = {}) {
  const d = Math.max(4, r.w * 0.09);
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
  escalonado(g, r.x, r.y, r.w, r.h, d);
  if (op.preenche) g.fillStyle = op.preenche(g); else {
    const f = g.createLinearGradient(0, r.y, 0, r.y + r.h);
    f.addColorStop(0, op.claro || '#f8f1de'); f.addColorStop(1, op.escuro || '#e3d5b3');
    g.fillStyle = f;
  }
  g.fill();
  g.restore();
  escalonado(g, r.x + 0.8, r.y + 0.8, r.w - 1.6, r.h - 1.6, d);
  g.lineWidth = 1.4; g.strokeStyle = gradOuro(g, r.x, r.y, r.x + r.w, r.y + r.h); g.stroke();
  escalonado(g, r.x + 3.5, r.y + 3.5, r.w - 7, r.h - 7, d * 0.7);
  g.lineWidth = 0.7; g.strokeStyle = rgba(op.filete || OURO, 0.85); g.stroke();
}

function faixaTopo(g, r, cor) {
  const d = Math.max(4, r.w * 0.09);
  g.fillStyle = cor;
  g.fillRect(r.x + d, r.y + 5, r.w - d * 2, Math.max(2.5, r.h * 0.035));
}

function numero(g, txt, r, cor) {
  const tam = Math.min(r.h * 0.21, r.w * 0.33);
  texto(g, txt, 0, r.y + r.h * 0.175, tam, cor, { fonte: SERIFA, peso: 700, max: r.w * 0.8 });
}

function cartaNormal(g, r, v) {
  const n = nivel(v);
  const cor = joia(v);
  if (v >= 4096) {
    placa(g, r, { claro: '#2a2a2e', escuro: '#0e0e10' });
    faixaTopo(g, r, gradOuro(g, r.x, 0, r.x + r.w, 0));
    numero(g, String(v), r, OURO_CLARO);
    leque(g, 0, r.y + r.h * 0.84, r.w * 0.38, OURO, { raios: 11, preencher: true });
    return;
  }
  if (v === 2048) {
    placa(g, r, { preenche: (q) => gradOuro(q, r.x, r.y, r.x + r.w, r.y + r.h), filete: '#fff6d0' });
    numero(g, '2048', r, '#3a2a08');
    leque(g, 0, r.y + r.h * 0.84, r.w * 0.38, '#5a4310', { raios: 11, linha: 1.1 });
    return;
  }
  const ouroAlto = n >= 6; // 128+
  placa(g, r, ouroAlto ? { claro: '#f7eccd', escuro: '#e6d29c' } : {});
  faixaTopo(g, r, cor);
  numero(g, String(v), r, escurecer(cor, 0.35));
  // miolo: motivo cresce com o valor
  const cy = r.y + r.h * 0.84;
  if (n >= 9) leque(g, 0, cy, r.w * 0.36, gradOuro(g, -r.w / 2, cy - r.w * 0.36, r.w / 2, cy), { raios: 11, preencher: true });
  else if (n >= 6) leque(g, 0, cy, r.w * 0.32, OURO, { raios: 9 });
  else {
    // raios de sol finos na cor da pedra
    g.save(); g.strokeStyle = rgba(cor, 0.55); g.lineWidth = 0.8;
    const raios = 3 + n;
    for (let i = 0; i < raios; i++) {
      const a = Math.PI + ((i + 0.5) / raios) * Math.PI;
      g.beginPath(); g.moveTo(Math.cos(a) * r.w * 0.08, cy + Math.sin(a) * r.w * 0.08); g.lineTo(Math.cos(a) * r.w * 0.3, cy + Math.sin(a) * r.w * 0.3); g.stroke();
    }
    g.restore();
  }
  // losango central na cor da pedra
  losango(g, 0, r.y + r.h * 0.5, Math.max(3, r.w * 0.06)); g.fillStyle = cor; g.fill();
  g.lineWidth = 0.8; g.strokeStyle = OURO; g.stroke();
}

function cartaPedra(g, r, hp) {
  placa(g, r, { claro: '#232328', escuro: '#101013' });
  const rnd = semente(31);
  g.save();
  escalonado(g, r.x + 3, r.y + 3, r.w - 6, r.h - 6, r.w * 0.06); g.clip();
  g.strokeStyle = rgba(OURO, 0.55); g.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    const y0 = r.y + r.h * (0.25 + i * 0.25) + (rnd() - 0.5) * 8;
    g.beginPath(); g.moveTo(r.x, y0);
    g.bezierCurveTo(r.x + r.w * 0.3, y0 - 10 + rnd() * 20, r.x + r.w * 0.6, y0 - 10 + rnd() * 20, r.x + r.w, y0 + (rnd() - 0.5) * 14); g.stroke();
  }
  g.restore();
  texto(g, 'MÁRMORE', 0, r.y + r.h * 0.175, Math.min(r.h * 0.11, r.w * 0.15), rgba(OURO_CLARO, 0.8), { fonte: SERIFA, peso: 700 });
  const perdido = 3 - clamp(hp, 0, 3);
  const rach = [[0.3, 0.32, 0.46, 0.52, 0.38, 0.72], [0.7, 0.3, 0.56, 0.54, 0.68, 0.7], [0.5, 0.36, 0.52, 0.6, 0.44, 0.8]];
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    g.beginPath(); g.moveTo(r.x + c[0] * r.w, r.y + c[1] * r.h); g.lineTo(r.x + c[2] * r.w, r.y + c[3] * r.h); g.lineTo(r.x + c[4] * r.w, r.y + c[5] * r.h); g.stroke();
  }
  for (let k = 0; k < 3; k++) {
    losango(g, (k - 1) * r.w * 0.17, r.y + r.h * 0.86, Math.max(3, r.w * 0.055));
    if (k < hp) { g.fillStyle = OURO; g.fill(); } else { g.lineWidth = 0.9; g.strokeStyle = rgba(OURO, 0.6); g.stroke(); }
  }
}

function cartaCoringa(g, r) {
  placa(g, r, {});
  const cores = ['#2e7d6b', '#2b4c9b', '#6b3fa0', '#a8233a', '#c7862b', '#3f7f3a', '#1f6e8c'];
  const d = Math.max(4, r.w * 0.09);
  cores.forEach((c, i) => { g.fillStyle = c; g.fillRect(r.x + d + ((r.w - d * 2) * i) / cores.length, r.y + 5, (r.w - d * 2) / cores.length + 0.5, Math.max(2.5, r.h * 0.035)); });
  texto(g, 'CORINGA', 0, r.y + r.h * 0.175, Math.min(r.h * 0.11, r.w * 0.15), TINTA, { fonte: SERIFA, peso: 700 });
  const cy = r.y + r.h * 0.8, R = r.w * 0.38, n = cores.length;
  for (let i = 0; i < n; i++) {
    g.beginPath(); g.moveTo(0, cy);
    g.arc(0, cy, R, Math.PI + (i / n) * Math.PI, Math.PI + ((i + 1) / n) * Math.PI); g.closePath();
    g.fillStyle = cores[i]; g.fill();
  }
  leque(g, 0, cy, R, OURO, { raios: n, linha: 1 });
}

function cartaBomba(g, r) {
  placa(g, r, { claro: '#221012', escuro: '#120708' });
  texto(g, 'BOMBA', 0, r.y + r.h * 0.175, Math.min(r.h * 0.11, r.w * 0.15), OURO_CLARO, { fonte: SERIFA, peso: 700 });
}

function cartaDobro(g, r) {
  placa(g, r, { claro: '#1a1a1e', escuro: '#0b0b0d' });
  numero(g, '×2', r, OURO_CLARO);
  texto(g, '×2', 0, r.y + r.h * 0.6, Math.min(r.h * 0.34, r.w * 0.5), gradOuro(g, 0, r.y + r.h * 0.45, 0, r.y + r.h * 0.75), { fonte: SERIFA, peso: 700 });
}

function medalhao(ctx, r, t) {
  const cy = r.y + r.h * 0.6, R = r.w * 0.22 * (1 + Math.sin(t * 5) * 0.04);
  ctx.save();
  ctx.shadowColor = 'rgba(220,40,70,0.6)'; ctx.shadowBlur = 10 + Math.sin(t * 5) * 4;
  circulo(ctx, 0, cy, R); ctx.fillStyle = gradOuro(ctx, -R, cy - R, R, cy + R); ctx.fill();
  ctx.restore();
  const n = 8;
  ctx.beginPath();
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU - Math.PI / 2; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78); }
  ctx.closePath();
  const g = ctx.createRadialGradient(-R * 0.25, cy - R * 0.3, R * 0.05, 0, cy, R * 0.8);
  g.addColorStop(0, '#ff8a9a'); g.addColorStop(0.5, '#c4142e'); g.addColorStop(1, '#5e0612');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-R * 0.4, cy - R * 0.1); ctx.lineTo(0, cy - R * 0.5); ctx.lineTo(R * 0.4, cy - R * 0.1); ctx.stroke();
}

function vidroJateado(ctx, r) {
  const d = Math.max(4, r.w * 0.09);
  escalonado(ctx, r.x, r.y, r.w, r.h, d);
  ctx.fillStyle = 'rgba(232,240,250,0.42)'; ctx.fill();
  ctx.save(); escalonado(ctx, r.x, r.y, r.w, r.h, d); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 0.8;
  for (let i = -3; i < 8; i++) { const x = r.x + i * r.w * 0.16; ctx.beginPath(); ctx.moveTo(x, r.y + r.h); ctx.lineTo(x + r.h * 0.55, r.y); ctx.stroke(); }
  ctx.restore();
  escalonado(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, d * 0.8);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
}

// ------------------------------------------------------------ tema

const tema = {
  id: 'deco',
  nome: 'Art Déco',
  cores: { texto: OURO, destaque: OURO_CLARO, particulas: [OURO, OURO_CLARO] },
  faixas: (W, H) => ({ topo: W > H ? 92 : 104, base: 0 }),

  fundo(ctx, W, H) {
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#191612'); g.addColorStop(1, '#070707');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // raios de sol saindo de baixo, quase invisiveis
    ctx.save();
    ctx.strokeStyle = rgba(OURO, 0.06); ctx.lineWidth = 1;
    const ox = W / 2, oy = H * 1.02;
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI + (i / 36) * Math.PI;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * H * 1.4, oy + Math.sin(a) * H * 1.4); ctx.stroke();
    }
    for (const k of [0.18, 0.3, 0.42]) { ctx.beginPath(); ctx.arc(ox, oy, H * k, Math.PI, 0); ctx.strokeStyle = rgba(OURO, 0.07); ctx.stroke(); }
    // leques nos cantos de baixo
    leque(ctx, 0, H, Math.min(W, H) * 0.32, rgba(OURO, 0.12), { raios: 10 });
    leque(ctx, W, H, Math.min(W, H) * 0.32, rgba(OURO, 0.12), { raios: 10 });
    ctx.restore();
    // moldura da tela
    escalonado(ctx, 8, 8, W - 16, H - 16, 18);
    ctx.lineWidth = 1; ctx.strokeStyle = rgba(OURO, 0.35); ctx.stroke();
    escalonado(ctx, 13, 13, W - 26, H - 26, 14);
    ctx.lineWidth = 0.6; ctx.strokeStyle = rgba(OURO, 0.18); ctx.stroke();
  },

  mesa(ctx, L, e, t) {
    const m = L.mesa;
    const febre = e.febre ? 0.5 + 0.5 * Math.sin(t * 7) : 0;
    ctx.save();
    escalonado(ctx, m.x, m.y, m.w, m.h, 16);
    ctx.fillStyle = 'rgba(255,240,200,0.035)'; ctx.fill();
    if (febre) { ctx.shadowColor = rgba(OURO, 0.5 * febre); ctx.shadowBlur = 18; }
    ctx.lineWidth = 1.4; ctx.strokeStyle = gradOuro(ctx, m.x, m.y, m.x + m.w, m.y + m.h); ctx.stroke();
    ctx.restore();
    escalonado(ctx, m.x + 5, m.y + 5, m.w - 10, m.h - 10, 12);
    ctx.lineWidth = 0.7; ctx.strokeStyle = rgba(OURO, 0.45); ctx.stroke();
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      escalonado(ctx, s.x + 2, s.y + 2, s.w - 4, s.h - 4, s.w * 0.08);
      ctx.setLineDash([3, 4]); ctx.lineWidth = 0.8; ctx.strokeStyle = rgba(OURO, 0.4); ctx.stroke(); ctx.setLineDash([]);
      losango(ctx, s.x + s.w / 2, s.y + s.h / 2, 4); ctx.fillStyle = rgba(OURO, 0.35); ctx.fill();
    }
  },

  peca(ctx, carta, r, op) {
    const pad = 12;
    let cv;
    if (carta.tipo === 'pedra') cv = emCache(`p${carta.hp}`, r.w, r.h, pad, (g, q) => cartaPedra(g, q, carta.hp));
    else if (carta.tipo === 'coringa') cv = emCache('c', r.w, r.h, pad, cartaCoringa);
    else if (carta.tipo === 'dobro') cv = emCache('d', r.w, r.h, pad, cartaDobro);
    else if (carta.tipo === 'bomba') cv = emCache('b', r.w, r.h, pad, cartaBomba);
    else cv = emCache(`n${carta.v}`, r.w, r.h, pad, (g, q) => cartaNormal(g, q, carta.v));
    ctx.drawImage(cv, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2);
    const t = op.t || 0;
    if (carta.tipo === 'bomba') medalhao(ctx, r, t);
    if (carta.tipo === 'normal' && carta.v >= 1024) {
      // brilho dourado passando
      ctx.save(); escalonado(ctx, r.x, r.y, r.w, r.h, Math.max(4, r.w * 0.09)); ctx.clip();
      const x = r.x - r.w + ((t * 0.45) % 1.8) * r.w * 1.8;
      const s = ctx.createLinearGradient(x, 0, x + r.w * 0.45, 0);
      s.addColorStop(0, 'rgba(255,248,220,0)'); s.addColorStop(0.5, 'rgba(255,248,220,0.4)'); s.addColorStop(1, 'rgba(255,248,220,0)');
      ctx.fillStyle = s; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore();
    }
    if (carta.gelo) vidroJateado(ctx, r);
    if (op.fila && op.destaque) {
      escalonado(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, Math.max(5, r.w * 0.1));
      ctx.lineWidth = 1.2; ctx.strokeStyle = rgba(OURO_CLARO, op.destaque); ctx.stroke();
    }
  },

  cadeado(ctx, a, c, e) {
    const g = e.cadeados[c] || {};
    ctx.save();
    escalonado(ctx, a.x - 2, a.y - 2, a.w + 4, a.h + 4, 8);
    ctx.fillStyle = 'rgba(7,7,7,0.55)'; ctx.fill();
    ctx.clip();
    // grade dourada
    const barras = 5;
    for (let i = 0; i <= barras; i++) {
      const x = a.x + (i / barras) * a.w;
      ctx.fillStyle = gradOuro(ctx, x - 1.5, 0, x + 1.5, 0);
      ctx.fillRect(x - 1.2, a.y, 2.4, a.h);
    }
    ctx.restore();
    const cy = a.y + Math.min(a.h * 0.34, 74);
    ctx.fillStyle = '#0c0c0c'; ctx.fillRect(a.x - 2, cy - 15, a.w + 4, 30);
    ctx.fillStyle = gradOuro(ctx, 0, cy - 15, 0, cy + 15);
    ctx.fillRect(a.x - 2, cy - 15, a.w + 4, 1.4); ctx.fillRect(a.x - 2, cy + 13.6, a.w + 4, 1.4);
    losango(ctx, a.x + a.w / 2, cy - 2, 7); ctx.fill();
    const rot = g.tipo === 'valor' ? `FAÇA ${g.v}` : g.tipo === 'fusoes' ? `${g.n} FUSÕES` : g.tipo === 'montes' ? `${g.n} MONTE(S)` : g.tipo === 'pedras' ? 'PEDRAS' : g.tipo === 'jogadas' ? `${g.n} JOGADAS` : '';
    texto(ctx, rot, a.x + a.w / 2, cy + 8.5, Math.min(8.5, a.w * 0.13), OURO_CLARO, { fonte: SERIFA, peso: 700, max: a.w - 4 });
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    escalonado(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, r.w * 0.08);
    ctx.lineWidth = 0.9; ctx.strokeStyle = rgba(OURO, carga ? 0.7 : 0.25); ctx.stroke();
    if (!e.descarte) {
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.45, s = r.w * 0.16;
      ctx.strokeStyle = rgba(OURO, carga ? 0.75 : 0.25); ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(cx - s, cy + s * 0.2); ctx.lineTo(cx, cy - s * 0.8); ctx.lineTo(cx + s, cy + s * 0.2);
      ctx.moveTo(cx - s, cy + s * 0.9); ctx.lineTo(cx, cy - s * 0.1); ctx.lineTo(cx + s, cy + s * 0.9); ctx.stroke();
    }
    const n = e.regras.descarteMax;
    for (let k = 0; k < n; k++) {
      losango(ctx, r.x + r.w / 2 + (k - (n - 1) / 2) * 10, r.y + r.h + 9, 3);
      if (k < e.descarteCarga) { ctx.fillStyle = OURO; ctx.fill(); } else { ctx.lineWidth = 0.8; ctx.strokeStyle = rgba(OURO, 0.4); ctx.stroke(); }
    }
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) {
      escalonado(ctx, f.x, f.y, f.w, f.h, 12);
      ctx.lineWidth = 0.8; ctx.strokeStyle = rgba(OURO, 0.4); ctx.stroke();
      texto(ctx, 'PRÓXIMAS', f.x + f.w / 2, f.y - 11, 10, rgba(OURO, 0.8), { fonte: SERIFA, peso: 700 });
      return;
    }
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, p2.x) - 16, x1 = Math.max(p0.x + p0.w, p2.x + p2.w) + 16;
    const y = p0.y + p0.h + 10;
    ctx.fillStyle = gradOuro(ctx, x0, 0, x1, 0);
    ctx.fillRect(x0, y, x1 - x0, 1.2);
    ctx.fillStyle = rgba(OURO, 0.5); ctx.fillRect(x0 + 10, y + 4, x1 - x0 - 20, 0.7);
    ornamento(ctx, (x0 + x1) / 2, p0.y - 14, x1 - x0, rgba(OURO, 0.65));
    texto(ctx, 'PRÓXIMAS', (x0 + x1) / 2, p0.y - 26, 9.5, rgba(OURO, 0.8), { fonte: SERIFA, peso: 700 });
  },

  hud(ctx, W, H, L, e, t) {
    const paisagem = W > H;
    const cx = W / 2;
    ornamento(ctx, cx, 24, Math.min(240, W * 0.6), rgba(OURO, 0.7));
    texto(ctx, `Nº ${e.faseId}`, cx, 40, 11, rgba(OURO_CLARO, 0.85), { fonte: SERIFA, peso: 700 });
    texto(ctx, String(e.pontos), cx, 64, paisagem ? 30 : 28, gradOuro(ctx, 0, 50, 0, 78), { fonte: SERIFA, peso: 700, max: W * 0.5 });
    // metas em duas colunas com barra de filete
    const mw = paisagem ? Math.min(220, W * 0.2) : (W - 64) / 2;
    e.metas.forEach((m, k) => {
      const x = paisagem ? (k === 0 ? 40 : W - 40 - mw) : 24 + k * (mw + 16);
      const y = paisagem ? 40 : 86;
      texto(ctx, textoMeta(m, { monte: (n) => `Complete ${n} monte${n > 1 ? 's' : ''}` }).toUpperCase(), x, y, 8.5, rgba(OURO_CLARO, 0.8), { alinhar: 'left', fonte: SERIFA, peso: 700, max: mw });
      ctx.fillStyle = rgba(OURO, 0.25); ctx.fillRect(x, y + 8, mw, 1);
      ctx.fillStyle = m.feita ? OURO_CLARO : OURO; ctx.fillRect(x, y + 7.4, mw * clamp(m.atual / m.alvo), 2.2);
      if (m.feita) { losango(ctx, x + mw + 6, y + 8.5, 3); ctx.fill(); }
    });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.save(); ctx.shadowColor = rgba(OURO, 0.4 + k * 0.4); ctx.shadowBlur = 10 + k * 8;
      texto(ctx, 'JAZZ ×2', cx, paisagem ? 84 : 112, 15, OURO_CLARO, { fonte: SERIFA, peso: 700 });
      ctx.restore();
    }
  },

  efeito(fx, P) {
    if (!P.formas.brilho) {
      P.formas.brilho = (ctx, p) => { const s = p.tam / 2; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.16, -s * 0.16); ctx.lineTo(s, 0); ctx.lineTo(s * 0.16, s * 0.16); ctx.lineTo(0, s); ctx.lineTo(-s * 0.16, s * 0.16); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.16, -s * 0.16); ctx.closePath(); ctx.fill(); };
      P.formas.raio = (ctx, p, u) => { ctx.strokeStyle = p.cor; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -p.tam * (0.3 + u * 0.4)); ctx.lineTo(0, -p.tam * (0.5 + u * 0.8)); ctx.stroke(); };
      P.formas.leque = (ctx, p, u) => { leque(ctx, 0, 0, p.tam * (0.4 + 0.6 * Math.min(1, u * 2)), p.cor, { raios: 13, abre: Math.min(1, u * 2.2), linha: 1.2 }); };
      P.formas.rotulo = (ctx, p) => { ctx.font = `700 ${p.tam}px ${SERIFA}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6; ctx.fillText(p.txt, 0, 0); };
    }
    const rot = (x, y, txt, tam, cor = OURO_CLARO) => P.add({ forma: 'rotulo', x, y, vy: -40, vida: 1.0, tam, cor, txt, arrasto: 1 });
    const raios = (x, y, n, tam, cor) => { for (let i = 0; i < n; i++) P.add({ forma: 'raio', x, y, rot: (i / n) * TAU, vida: 0.45, tam, cor, arrasto: 1 }); };
    switch (fx.tipo) {
      case 'pouso': raios(fx.x, fx.y, 8, 18, rgba(OURO, 0.7)); return true;
      case 'fusao':
        raios(fx.x, fx.y, 12, 26 + fx.degrau * 4, OURO_CLARO);
        P.estourar(fx.x, fx.y, [OURO, OURO_CLARO], 6 + fx.degrau * 2, 0.5 + fx.degrau * 0.08, { forma: 'brilho', tam: 7, g: 140, vida: 0.6 });
        if (fx.degrau > 1) rot(fx.x, fx.y - 24, `×${fx.degrau}`, 18 + fx.degrau * 2);
        return true;
      case 'completar':
        P.add({ forma: 'leque', x: fx.x, y: fx.y + 20, vida: 0.9, tam: 70, cor: OURO_CLARO, arrasto: 1 });
        P.subir(fx.x, fx.y, [OURO, OURO_CLARO], 12, { forma: 'brilho', tam: 8, larg: 50, vida: 1.1 });
        rot(fx.x, fx.y - 40, 'BRAVO!', 22);
        return true;
      case 'explodir':
        raios(fx.x, fx.y, 14, 30, '#ff8a9a');
        P.estourar(fx.x, fx.y, ['#c4142e', OURO], 12, 0.9, { forma: 'brilho', tam: 7, g: 220 });
        return true;
      case 'pedra': P.estourar(fx.x, fx.y, ['#1b1b1f', '#3a3a40', OURO], 14, 0.9, { forma: 'q', tam: 4, g: 420 }); return true;
      case 'racha': P.estourar(fx.x, fx.y, ['#3a3a40', OURO], 5, 0.5, { forma: 'q', tam: 3, g: 420 }); return true;
      case 'gelo': P.estourar(fx.x, fx.y, ['#f2f6fb', '#c9d6e6'], 12, 0.6, { forma: 'q', tam: 3.5, g: 140, vida: 0.7 }); return true;
      case 'cadeado': raios(fx.x, fx.y, 16, 36, OURO_CLARO); rot(fx.x, fx.y - 10, 'ABERTO', 14); return true;
      case 'combo': rot(fx.x, fx.y - 46, `COMBO ×${fx.n}`, 13, rgba(OURO_CLARO, 0.9)); return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    ctx.fillStyle = 'rgba(5,5,5,0.72)'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(300, W - 48), h = 150, x = (W - w) / 2, y = H * 0.36;
    escalonado(ctx, x, y, w, h, 16);
    ctx.fillStyle = '#0d0c0a'; ctx.fill();
    ctx.lineWidth = 1.4; ctx.strokeStyle = gradOuro(ctx, x, y, x + w, y + h); ctx.stroke();
    escalonado(ctx, x + 6, y + 6, w - 12, h - 12, 12); ctx.lineWidth = 0.7; ctx.strokeStyle = rgba(OURO, 0.5); ctx.stroke();
    const venceu = e.fim === 'venceu';
    ornamento(ctx, W / 2, y + 28, w * 0.7, rgba(OURO, 0.7));
    texto(ctx, venceu ? 'BRAVO!' : 'FIM DO ATO', W / 2, y + 62, 30, gradOuro(ctx, 0, y + 46, 0, y + 78), { fonte: SERIFA, peso: 700 });
    texto(ctx, `${e.pontos} pontos`, W / 2, y + 94, 14, OURO_CLARO, { fonte: SERIFA, peso: 600 });
    texto(ctx, 'toque para recomeçar', W / 2, y + 122, 11, rgba(OURO_CLARO, 0.7), { fonte: SERIFA, peso: 600 });
  },
};

export default tema;
