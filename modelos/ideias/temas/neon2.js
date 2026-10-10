// Rodada 3 · Neon Refinado: a referencia (docs/referencia/) feita com
// acabamento. Uma mesa so com borda de luz, cartas lisas com borda luminosa
// e o numero no canto, HUD minimo. Sem personagem, sem cenario: o brilho e a
// animacao fazem o trabalho. Cartas desenhadas em cache (offscreen) por valor.
import { TAU, rr, circulo, texto, escurecer, clarear, rgba, nivel, textoMeta, semente, easeOut, clamp } from '../kit.js';

const FL = '"Ubuntu Sans", "Noto Sans", "Segoe UI", system-ui, sans-serif';
// base (recheio escuro) e luz (borda) por nivel 2..4096; as 4 primeiras sao as da referencia
const CORES = [
  { base: '#0b3486', luz: '#58b2ff' }, // 2 azul
  { base: '#5f5a0c', luz: '#ffe24a' }, // 4 oliva
  { base: '#0b5516', luz: '#5cff6c' }, // 8 verde
  { base: '#740d74', luz: '#ff5cf0' }, // 16 magenta
  { base: '#0a535c', luz: '#3ff0ff' }, // 32 ciano
  { base: '#713507', luz: '#ff9a3c' }, // 64 laranja
  { base: '#720b1d', luz: '#ff4d6d' }, // 128 vermelho
  { base: '#3a1885', luz: '#a982ff' }, // 256 violeta
  { base: '#3b630a', luz: '#c8ff3d' }, // 512 lima
  { base: '#701445', luz: '#ff70b8' }, // 1024 rosa
  { base: '#6a4805', luz: '#ffd34a' }, // 2048 ouro
  { base: '#3b2a6e', luz: '#f4eaff' }, // 4096 branco-violeta
];
const ROXO = '#b45cff', OURO = '#ffd34a';
const corDe = (v) => CORES[Math.min(nivel(v), CORES.length - 1)];
const rnd = semente(31);

// ------------------------------------------------------------ cache de cartas

const cache = new Map();
const K = 2; // resolucao do cache
function imagem(chave, w, h, pad, desenhar) {
  let c = cache.get(chave);
  if (!c) {
    c = document.createElement('canvas');
    c.width = Math.ceil((w + pad * 2) * K); c.height = Math.ceil((h + pad * 2) * K);
    const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    g.scale(K, K); g.translate(pad + w / 2, pad + h / 2);
    desenhar(g, { x: -w / 2, y: -h / 2, w, h });
    if (cache.size > 500) cache.clear();
    cache.set(chave, c);
  }
  return c;
}

const raio = (r) => Math.min(r.w, r.h) * 0.1;

/** Carta lisa de luz: recheio escuro em degrade, brilho de vidro, borda luminosa e o rotulo no canto. */
function cartaLuz(g, r, cor, rotuloTxt, forte = 1) {
  const rad = raio(r);
  g.save();
  g.shadowColor = cor.luz; g.shadowBlur = r.w * 0.16 * forte;
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = cor.base; g.fill();
  g.restore();
  const gr = g.createLinearGradient(0, r.y, 0, r.y + r.h);
  gr.addColorStop(0, clarear(cor.base, 0.14)); gr.addColorStop(0.55, cor.base); gr.addColorStop(1, escurecer(cor.base, 0.3));
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = gr; g.fill();
  // brilho de vidro diagonal
  g.save(); rr(g, r.x, r.y, r.w, r.h, rad); g.clip();
  const gv = g.createLinearGradient(r.x, r.y, r.x + r.w * 0.8, r.y + r.h * 0.6);
  gv.addColorStop(0, 'rgba(255,255,255,0.17)'); gv.addColorStop(0.42, 'rgba(255,255,255,0.05)'); gv.addColorStop(0.43, 'rgba(255,255,255,0)');
  g.fillStyle = gv; g.fillRect(r.x, r.y, r.w, r.h);
  g.restore();
  // borda de luz
  g.save();
  g.shadowColor = cor.luz; g.shadowBlur = 7 * forte;
  g.lineWidth = Math.max(1.6, r.w * 0.032); g.strokeStyle = cor.luz;
  rr(g, r.x + 1, r.y + 1, r.w - 2, r.h - 2, rad); g.stroke();
  g.restore();
  rr(g, r.x + 3.5, r.y + 3.5, r.w - 7, r.h - 7, rad * 0.7); g.strokeStyle = 'rgba(255,255,255,0.09)'; g.lineWidth = 1; g.stroke();
  if (rotuloTxt) {
    g.save(); g.shadowColor = cor.luz; g.shadowBlur = 6;
    texto(g, rotuloTxt, r.x + r.w * 0.1, r.y + r.h * 0.16, r.h * 0.22, '#ffffff', { alinhar: 'left', fonte: FL, peso: 700, max: r.w * 0.8 });
    g.restore();
  }
}

function geloSobre(g, r) {
  const rad = raio(r);
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = 'rgba(170,225,255,0.16)'; g.fill();
  g.save(); g.shadowColor = '#9fe2ff'; g.shadowBlur = 8; g.strokeStyle = '#cdeeff'; g.lineWidth = 1.5;
  rr(g, r.x + 1, r.y + 1, r.w - 2, r.h - 2, rad); g.stroke(); g.restore();
  // cristais finos no canto de cima (aparecem com a carta coberta)
  g.save(); rr(g, r.x, r.y, r.w, r.h, rad); g.clip();
  g.strokeStyle = 'rgba(235,250,255,0.55)'; g.lineWidth = 1;
  const cx = r.x + r.w - r.w * 0.2, cy = r.y + r.h * 0.15, s = r.w * 0.11;
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    g.beginPath(); g.moveTo(cx - Math.cos(a) * s, cy - Math.sin(a) * s); g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); g.stroke();
  }
  g.strokeStyle = 'rgba(235,250,255,0.28)';
  for (let k = 0; k < 4; k++) {
    g.beginPath(); g.moveTo(r.x + r.w * (0.1 + k * 0.22), r.y + r.h); g.lineTo(r.x + r.w * (0.32 + k * 0.22), r.y + r.h * 0.55); g.stroke();
  }
  g.restore();
}

function pedra(g, r, hp) {
  const rad = raio(r);
  const gr = g.createLinearGradient(0, r.y, 0, r.y + r.h);
  gr.addColorStop(0, '#2c2c36'); gr.addColorStop(1, '#17171e');
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = gr; g.fill();
  g.strokeStyle = '#4b4b5a'; g.lineWidth = 1.5; rr(g, r.x + 1, r.y + 1, r.w - 2, r.h - 2, rad); g.stroke();
  // rachaduras pelo hp perdido
  const perdido = 3 - clamp(hp, 0, 3);
  const linhas = [[0.3, 0.38, 0.5, 0.6, 0.38, 0.86], [0.72, 0.42, 0.55, 0.66, 0.7, 0.9], [0.18, 0.62, 0.42, 0.72, 0.6, 0.6]];
  for (let k = 0; k < perdido; k++) {
    const c = linhas[k];
    g.beginPath(); g.moveTo(r.x + r.w * c[0], r.y + r.h * c[1]); g.lineTo(r.x + r.w * c[2], r.y + r.h * c[3]); g.lineTo(r.x + r.w * c[4], r.y + r.h * c[5]);
    g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 1.6; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 0.8; g.stroke();
  }
  // pips de hp no alto
  for (let k = 0; k < 3; k++) {
    circulo(g, r.x + r.w * 0.16 + k * r.w * 0.13, r.y + r.h * 0.15, r.w * 0.045);
    if (k < hp) { g.fillStyle = '#d6d6e2'; g.fill(); } else { g.strokeStyle = '#5c5c6c'; g.lineWidth = 1; g.stroke(); }
  }
}

function coringa(g, r) {
  const rad = raio(r);
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = '#1d1238'; g.fill();
  const cg = g.createConicGradient(0, 0, 0);
  ['#ff5cf0', '#ffe24a', '#5cff6c', '#3ff0ff', '#58b2ff', '#a982ff', '#ff5cf0'].forEach((c, i, a) => cg.addColorStop(i / (a.length - 1), c));
  g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 10; g.lineWidth = Math.max(2, r.w * 0.04); g.strokeStyle = cg;
  rr(g, r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, rad); g.stroke(); g.restore();
  g.save(); g.globalAlpha = 0.22; rr(g, r.x, r.y, r.w, r.h, rad); g.clip(); g.fillStyle = cg; g.fillRect(r.x, r.y, r.w, r.h); g.restore();
  g.save(); g.shadowColor = '#ffffff'; g.shadowBlur = 8;
  texto(g, '★', r.x + r.w * 0.1, r.y + r.h * 0.16, r.h * 0.2, '#ffffff', { alinhar: 'left', fonte: FL, peso: 700 });
  texto(g, '?', 0, r.y + r.h * 0.58, r.h * 0.36, '#ffffff', { fonte: FL, peso: 800 });
  g.restore();
}

function bomba(g, r) {
  cartaLuz(g, r, { base: '#55091a', luz: '#ff3b5c' }, '!');
  const cx = 0, cy = r.y + r.h * 0.6, s = r.w * 0.2;
  g.save(); g.shadowColor = '#ff3b5c'; g.shadowBlur = 8; g.strokeStyle = '#ffd0d8'; g.lineWidth = 2;
  circulo(g, cx, cy, s); g.stroke();
  g.beginPath(); g.moveTo(cx + s * 0.6, cy - s * 0.8); g.quadraticCurveTo(cx + s * 1.1, cy - s * 1.5, cx + s * 1.5, cy - s * 1.2); g.stroke();
  g.fillStyle = '#ffe24a'; circulo(g, cx + s * 1.5, cy - s * 1.2, 2.6); g.fill();
  g.restore();
}

function dobro(g, r) {
  cartaLuz(g, r, { base: '#073844', luz: '#3ff0ff' }, 'x2');
  g.save(); g.shadowColor = '#3ff0ff'; g.shadowBlur = 10;
  texto(g, '×2', 0, r.y + r.h * 0.6, r.h * 0.3, '#d8fbff', { fonte: FL, peso: 700 });
  g.restore();
}

// ------------------------------------------------------------ particulas

function formas(P) {
  if (P.formas.nRisco) return;
  P.formas.nRisco = (ctx, p, u) => {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = p.cor; ctx.lineCap = 'round'; ctx.lineWidth = (p.larg || 2) * (1 - u * 0.6);
    ctx.beginPath(); ctx.moveTo(-p.tam / 2, 0); ctx.lineTo(p.tam / 2, 0); ctx.stroke();
  };
  P.formas.nAnel = (ctx, p, u) => {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1 - u;
    ctx.strokeStyle = p.cor; ctx.lineWidth = (p.larg || 2.5) * (1 - u * 0.7); ctx.shadowColor = p.cor; ctx.shadowBlur = 12;
    circulo(ctx, 0, 0, p.r0 + (p.r1 - p.r0) * easeOut(u)); ctx.stroke();
  };
  P.formas.nTxt = (ctx, p, u) => {
    const esc = u < 0.16 ? 0.72 + (u / 0.16) * 0.38 : 1.1 - (u - 0.16) * 0.12;
    ctx.scale(esc, esc);
    ctx.shadowColor = p.cor; ctx.shadowBlur = 14;
    texto(ctx, p.txt, 0, 0, p.fs, '#ffffff', { fonte: FL, peso: 800 });
  };
  P.formas.nFeixe = (ctx, p, u) => {
    ctx.globalCompositeOperation = 'lighter';
    const w = p.larg * (1 - u * 0.75), h = p.alt * (0.6 + easeOut(u) * 0.4);
    const g = ctx.createLinearGradient(0, 0, 0, -h);
    g.addColorStop(0, rgba(p.cor, 0.85)); g.addColorStop(1, rgba(p.cor, 0));
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h, w, h);
  };
}
function faiscas(P, x, y, cor, n, forca = 1) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd() * 0.6, v = (110 + rnd() * 170) * forca;
    P.add({ forma: 'nRisco', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, arrasto: 0.9, vida: 0.4 + rnd() * 0.2, tam: 9 + rnd() * 10, larg: 2, cor, rot: a });
  }
}
const anel = (P, x, y, cor, r0, r1, vida = 0.45, larg = 2.5) => P.add({ forma: 'nAnel', x, y, vida, r0, r1, cor, larg, tam: 1 });
const txt = (P, x, y, s, cor, fs = 24) => P.add({ forma: 'nTxt', x, y, vy: -60, g: 0, arrasto: 1, vida: 0.9, txt: s, cor, fs, tam: 1 });

// ------------------------------------------------------------ HUD

function botao(ctx, x, y, R, cor, icone) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y - R * 0.3, R * 0.1, x, y, R);
  g.addColorStop(0, escurecer(cor, 0.55)); g.addColorStop(1, escurecer(cor, 0.82));
  circulo(ctx, x, y, R); ctx.fillStyle = g; ctx.fill();
  ctx.shadowColor = cor; ctx.shadowBlur = 14; ctx.lineWidth = 2.5; ctx.strokeStyle = cor;
  circulo(ctx, x, y, R - 1.5); ctx.stroke();
  ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = clarear(cor, 0.35);
  if (icone === 'voltar') {
    const s = R * 0.42;
    ctx.beginPath(); ctx.moveTo(x + s, y - s * 0.55); ctx.lineTo(x - s * 0.2, y - s * 0.55); ctx.lineTo(x - s * 0.2, y - s); ctx.lineTo(x - s * 1.05, y); ctx.lineTo(x - s * 0.2, y + s); ctx.lineTo(x - s * 0.2, y + s * 0.55); ctx.lineTo(x + s, y + s * 0.55); ctx.closePath(); ctx.stroke();
  } else {
    const s = R * 0.36;
    for (let k = 0; k < 8; k++) {
      const a = (k * TAU) / 8;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 1.05, y + Math.sin(a) * s * 1.05); ctx.lineTo(x + Math.cos(a) * s * 1.45, y + Math.sin(a) * s * 1.45); ctx.stroke();
    }
    circulo(ctx, x, y, s); ctx.stroke(); circulo(ctx, x, y, s * 0.42); ctx.stroke();
  }
  ctx.restore();
}

function progresso(e) {
  if (!e.metas.length) return 0;
  return e.metas.reduce((s, m) => s + Math.min(1, m.atual / m.alvo), 0) / e.metas.length;
}

// ------------------------------------------------------------ tema

const tema = {
  id: 'neon2',
  nome: 'Neon Refinado',
  cores: { texto: '#ffffff', destaque: OURO, particulas: ['#ff5cf0', '#3ff0ff', '#ffe24a'] },
  faixas: (W, H) => ({ topo: W > H ? 98 : 132, base: 0 }),
  geo(L) {
    // fila encavalada como na referencia (a frente fica por cima, a esquerda)
    if (L.fila.vertical || !L.descarteNaMesa) return {};
    const p0 = L.filaPos(0), pN = L.filaPos(L.tamFila - 1);
    const c = (p0.x + pN.x + pN.w) / 2, passo = p0.w * 0.72;
    const x0 = c - (p0.w + passo * (L.tamFila - 1)) / 2;
    return { filaPos: (k) => ({ x: Math.round(x0 + k * passo), y: p0.y, w: p0.w, h: p0.h }) };
  },

  fundo(ctx, W, H, L) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0a26'); g.addColorStop(0.55, '#181040'); g.addColorStop(1, '#0a0717');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // estrelas raras
    const r = semente(9);
    for (let i = 0; i < 34; i++) {
      ctx.fillStyle = `rgba(200,190,255,${0.12 + r() * 0.25})`;
      circulo(ctx, r() * W, r() * H * 0.55, 0.6 + r() * 0.9); ctx.fill();
    }
    const yh = Math.round(L.mesa.y + L.mesa.h - 2);
    // brilho do horizonte e montanhas discretas
    const gh = ctx.createLinearGradient(0, yh - 140, 0, yh);
    gh.addColorStop(0, 'rgba(180,60,255,0)'); gh.addColorStop(1, 'rgba(200,70,255,0.28)');
    ctx.fillStyle = gh; ctx.fillRect(0, yh - 140, W, 140);
    ctx.beginPath(); ctx.moveTo(0, yh);
    const pts = [0, 0.3, 0.12, 0.62, 0.26, 0.4, 0.4, 0.78, 0.55, 0.5, 0.7, 0.86, 0.84, 0.46, 1, 0.66];
    for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i] * W, yh - pts[i + 1] * 64);
    ctx.lineTo(W, yh); ctx.closePath();
    ctx.fillStyle = 'rgba(46,18,92,0.75)'; ctx.fill();
    ctx.strokeStyle = 'rgba(210,120,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    // chao: linhas de fuga (as horizontais andam em vivo)
    ctx.save();
    ctx.beginPath(); ctx.rect(0, yh, W, H - yh); ctx.clip();
    ctx.fillStyle = '#0c0820'; ctx.fillRect(0, yh, W, H - yh);
    ctx.strokeStyle = 'rgba(120,90,255,0.2)'; ctx.lineWidth = 1;
    for (let i = -14; i <= 14; i++) {
      ctx.beginPath(); ctx.moveTo(W / 2 + i * 7, yh); ctx.lineTo(W / 2 + i * W * 0.13, H); ctx.stroke();
    }
    const gl = ctx.createLinearGradient(0, yh, 0, yh + 70);
    gl.addColorStop(0, 'rgba(12,8,32,1)'); gl.addColorStop(1, 'rgba(12,8,32,0)');
    ctx.fillStyle = gl; ctx.fillRect(0, yh, W, 70);
    ctx.restore();
    ctx.strokeStyle = 'rgba(230,140,255,0.5)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, yh); ctx.lineTo(W, yh); ctx.stroke();
  },

  vivo(ctx, W, H, t, e, mem) {
    // linhas horizontais do chao vindo na direcao de quem joga, bem devagar
    const yh = mem.yh;
    if (yh === undefined) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(120,90,255,0.18)'; ctx.lineWidth = 1;
    const n = 9, fase = (t * 0.12) % 1;
    for (let k = 0; k < n; k++) {
      const u = (k + fase) / n, y = yh + (H - yh) * u * u;
      if (y < yh + 6) continue;
      ctx.globalAlpha = Math.min(1, u * 2.2);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  },

  mesa(ctx, L, e, t, mem) {
    mem.yh = Math.round(L.mesa.y + L.mesa.h - 2);
    mem.W = L.W;
    const m = L.mesa, rad = L.pad * 1.3;
    const cor = e.febre ? OURO : ROXO;
    ctx.save();
    rr(ctx, m.x, m.y, m.w, m.h, rad); ctx.fillStyle = 'rgba(28,10,58,0.62)'; ctx.fill();
    ctx.clip();
    // trelica de losangos quase invisivel
    ctx.strokeStyle = 'rgba(200,150,255,0.05)'; ctx.lineWidth = 1;
    for (let d = -m.h; d < m.w + m.h; d += 18) {
      ctx.beginPath(); ctx.moveTo(m.x + d, m.y); ctx.lineTo(m.x + d - m.h, m.y + m.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.x + d - m.h, m.y); ctx.lineTo(m.x + d, m.y + m.h); ctx.stroke();
    }
    ctx.restore();
    // borda: brilho desfocado + linha nitida
    const pulso = e.febre ? 0.7 + 0.3 * Math.sin(t * 8) : 1;
    ctx.save();
    ctx.shadowColor = cor; ctx.shadowBlur = 26 * pulso; ctx.lineWidth = 4; ctx.strokeStyle = rgba(cor, 0.85);
    rr(ctx, m.x, m.y, m.w, m.h, rad); ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineWidth = 1.4; ctx.strokeStyle = clarear(cor, 0.55);
    rr(ctx, m.x, m.y, m.w, m.h, rad); ctx.stroke();
    ctx.restore();
    // marcas de coluna vazia
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      rr(ctx, s.x, s.y, s.w, s.h, raio(s)); ctx.strokeStyle = 'rgba(200,160,255,0.12)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  },

  peca(ctx, carta, r, op) {
    const pad = Math.ceil(r.w * 0.3);
    let img;
    const tam = `${Math.round(r.w)}x${Math.round(r.h)}`;
    if (carta.tipo === 'pedra') img = imagem(`p:${carta.hp}:${tam}`, r.w, r.h, pad, (g, q) => pedra(g, q, carta.hp));
    else if (carta.tipo === 'coringa') img = imagem(`c:${tam}`, r.w, r.h, pad, coringa);
    else if (carta.tipo === 'bomba') img = imagem(`b:${tam}`, r.w, r.h, pad, bomba);
    else if (carta.tipo === 'dobro') img = imagem(`d:${tam}`, r.w, r.h, pad, dobro);
    else {
      const n = nivel(carta.v);
      img = imagem(`n:${carta.v}:${carta.gelo ? 1 : 0}:${tam}`, r.w, r.h, pad, (g, q) => {
        cartaLuz(g, q, corDe(carta.v), String(carta.v), n >= 10 ? 1.7 : 1);
        if (n >= 10) {
          // ouro e platina: segundo fio interno
          rr(g, q.x + 5, q.y + 5, q.w - 10, q.h - 10, raio(q) * 0.6); g.strokeStyle = rgba(corDe(carta.v).luz, 0.45); g.lineWidth = 1; g.stroke();
        }
        if (carta.gelo) geloSobre(g, q);
      });
    }
    ctx.drawImage(img, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2);
    if (carta.tipo === 'bomba') {
      const k = 0.35 + 0.5 * Math.abs(Math.sin((op.t || 0) * 5));
      ctx.save(); ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 16 * k; ctx.strokeStyle = rgba('#ff3b5c', k); ctx.lineWidth = 2;
      rr(ctx, r.x, r.y, r.w, r.h, raio(r)); ctx.stroke(); ctx.restore();
    }
    if (op.fila && !op.frente) { rr(ctx, r.x, r.y, r.w, r.h, raio(r)); ctx.fillStyle = 'rgba(8,4,22,0.38)'; ctx.fill(); }
    if (op.destaque) {
      ctx.save(); ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12; ctx.strokeStyle = `rgba(255,255,255,${op.destaque * 0.8})`; ctx.lineWidth = 1.6;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, raio(r) + 2); ctx.stroke(); ctx.restore();
    }
  },

  cadeado(ctx, a) {
    rr(ctx, a.x - 2, a.y - 2, a.w + 4, a.h + 4, 8); ctx.fillStyle = 'rgba(8,4,20,0.66)'; ctx.fill();
    const cx = a.x + a.w / 2, cy = a.y + Math.min(a.h * 0.45, a.w * 1.2), s = a.w * 0.22;
    ctx.save();
    ctx.shadowColor = ROXO; ctx.shadowBlur = 12; ctx.strokeStyle = '#ecdcff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.35, s * 0.62, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - s, cy - s * 0.35, s * 2, s * 1.55, s * 0.3); ctx.stroke();
    circulo(ctx, cx, cy + s * 0.32, s * 0.16); ctx.stroke();
    ctx.restore();
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    ctx.save();
    ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = rgba('#b98cff', carga ? 0.6 : 0.2);
    rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, raio(r)); ctx.stroke();
    ctx.setLineDash([]);
    if (!e.descarte) {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, s = r.w * 0.2;
      ctx.strokeStyle = rgba('#c9a8ff', carga ? 0.55 : 0.18); ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      rr(ctx, cx - s, cy - s * 0.9, s * 2, s * 1.9, 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.55); ctx.lineTo(cx, cy - s * 0.35); ctx.moveTo(cx - s * 0.45, cy + s * 0.05); ctx.lineTo(cx, cy - s * 0.4); ctx.lineTo(cx + s * 0.45, cy + s * 0.05); ctx.stroke();
    }
    if (e.descarteCarga > 1) texto(ctx, '×' + e.descarteCarga, r.x + r.w / 2, r.y + r.h + 12, 12, '#d9c4ff', { fonte: FL, peso: 700 });
    ctx.restore();
  },

  fila(ctx, L) {
    if (L.fila.vertical) return;
    const p0 = L.filaPos(0), pN = L.filaPos(L.tamFila - 1);
    const cx = (p0.x + pN.x + pN.w) / 2, cy = p0.y + p0.h + 6;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, (pN.x + pN.w - p0.x) * 0.75);
    g.addColorStop(0, 'rgba(190,80,255,0.22)'); g.addColorStop(1, 'rgba(190,80,255,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 220, cy - 60, 440, 120);
  },

  hud(ctx, W, H, L, e, t) {
    const pais = W > H;
    const yb = pais ? 48 : 58, R = pais ? 22 : 25;
    botao(ctx, 16 + R, yb, R, '#ff4fd8', 'voltar');
    botao(ctx, W - 16 - R, yb, R, OURO, 'engrenagem');
    // placar com degrade
    const ys = pais ? 32 : 40;
    ctx.save();
    ctx.font = `800 ${pais ? 30 : 36}px ${FL}`;
    const gs = ctx.createLinearGradient(0, ys - 18, 0, ys + 18);
    gs.addColorStop(0, e.febre ? '#fff3b0' : '#ff9cf6'); gs.addColorStop(1, e.febre ? OURO : '#b45cff');
    ctx.shadowColor = e.febre ? OURO : '#d05cff'; ctx.shadowBlur = 12;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = gs;
    ctx.fillText(String(e.pontos), W / 2, ys);
    ctx.restore();
    // barra da meta (botao ciano no comeco, ponto escuro no fim, como na referencia)
    const bw = Math.min(260, W * 0.44), bx = W / 2 - bw / 2, by = pais ? 60 : 72;
    const p = progresso(e);
    rr(ctx, bx, by - 4, bw, 8, 4); ctx.fillStyle = '#1d1440'; ctx.fill();
    ctx.save(); ctx.shadowColor = '#3ff0ff'; ctx.shadowBlur = 8;
    rr(ctx, bx, by - 4, Math.max(8, bw * p), 8, 4); ctx.fillStyle = '#35e6ff'; ctx.fill();
    circulo(ctx, bx, by, 9); ctx.fill();
    ctx.restore();
    circulo(ctx, bx + bw, by, 7.5); ctx.fillStyle = p >= 1 ? '#35e6ff' : '#241a4a'; ctx.fill();
    const metas = e.metas.map((m) => (m.feita ? '✓ ' : '') + textoMeta(m)).join('  ·  ');
    texto(ctx, metas, W / 2, by + (pais ? 18 : 22), pais ? 12 : 12.5, 'rgba(232,224,255,0.85)', { fonte: FL, peso: 500, max: W - 130 });
    if (e.febre) {
      const k = 0.6 + 0.4 * Math.sin(t * 9);
      ctx.save(); ctx.shadowColor = OURO; ctx.shadowBlur = 10 * k;
      texto(ctx, 'FEBRE ×2', W / 2, by + (pais ? 34 : 42), 13, '#fff1b8', { fonte: FL, peso: 800 });
      ctx.restore();
    }
  },

  efeito(fx, P, mem) {
    formas(P);
    const W = mem.W || 400;
    const xs = (x) => Math.max(40, Math.min(W - 40, x));
    switch (fx.tipo) {
      case 'pouso':
        anel(P, fx.x, fx.y + 10, '#8fd0ff', 6, 22, 0.3, 1.6);
        return true;
      case 'fusao': {
        const cor = corDe(fx.valor).luz;
        anel(P, fx.x, fx.y, cor, 10, 30 + fx.degrau * 8, 0.45, 2.5);
        faiscas(P, fx.x, fx.y, cor, 6 + fx.degrau * 2, 0.8 + fx.degrau * 0.12);
        if (fx.degrau > 1) txt(P, xs(fx.x), fx.y - 26, 'x' + fx.degrau, cor, 20 + fx.degrau * 2);
        return true;
      }
      case 'completar': {
        const cor = corDe(fx.valor).luz;
        P.add({ forma: 'nFeixe', x: fx.x, y: fx.y + 30, vida: 0.75, larg: 46, alt: 520, cor, tam: 1 });
        anel(P, fx.x, fx.y, cor, 14, 90, 0.6, 3);
        faiscas(P, fx.x, fx.y, OURO, 18, 1.5);
        txt(P, xs(fx.x), fx.y - 34, String(fx.valor), cor, 34);
        return true;
      }
      case 'explodir':
        anel(P, fx.x, fx.y, '#ff3b5c', 8, 46, 0.45, 3);
        faiscas(P, fx.x, fx.y, '#ff6b82', 14, 1.2);
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#8b8b9c', '#55556a', '#c4c4d4'], 14, 0.9, { forma: 'q', tam: 5, vida: 0.55 });
        anel(P, fx.x, fx.y, '#c4c4d4', 8, 34, 0.35, 1.5);
        return true;
      case 'racha':
        faiscas(P, fx.x, fx.y, '#b0b0c4', 5, 0.6);
        return true;
      case 'gelo':
        faiscas(P, fx.x, fx.y, '#bfeaff', 10, 0.8);
        anel(P, fx.x, fx.y, '#9fe2ff', 8, 36, 0.45, 2);
        return true;
      case 'cadeado':
        anel(P, fx.x, fx.y, ROXO, 10, 60, 0.55, 2.5);
        txt(P, xs(fx.x), fx.y - 20, 'aberto', '#e3c8ff', 18);
        return true;
      case 'combo':
        txt(P, xs(fx.x), fx.y - 46, `combo ×${fx.n}`, '#3ff0ff', 18);
        return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    ctx.save();
    ctx.fillStyle = 'rgba(6,3,18,0.72)'; ctx.fillRect(0, 0, W, H);
    const venceu = e.fim === 'venceu';
    const pw = Math.min(300, W * 0.8), ph = 150, px = W / 2 - pw / 2, py = H * 0.4 - ph / 2;
    const cor = venceu ? '#ff4fd8' : '#58b2ff';
    rr(ctx, px, py, pw, ph, 16); ctx.fillStyle = 'rgba(40,12,70,0.92)'; ctx.fill();
    ctx.shadowColor = cor; ctx.shadowBlur = 22; ctx.lineWidth = 3; ctx.strokeStyle = cor; ctx.stroke();
    ctx.shadowBlur = 0;
    if (venceu) {
      // coroa em linha dourada
      const cx = W / 2, cy = py - 4, s = 22;
      ctx.shadowColor = OURO; ctx.shadowBlur = 14; ctx.strokeStyle = OURO; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx - s, cy - s * 0.9); ctx.lineTo(cx - s * 0.45, cy - s * 0.4); ctx.lineTo(cx, cy - s * 1.15); ctx.lineTo(cx + s * 0.45, cy - s * 0.4); ctx.lineTo(cx + s, cy - s * 0.9); ctx.lineTo(cx + s, cy); ctx.closePath(); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.shadowColor = cor; ctx.shadowBlur = 10;
    texto(ctx, venceu ? 'Vitória' : 'Sem jogadas', W / 2, py + 46, 34, '#ffffff', { fonte: FL, peso: 800 });
    ctx.shadowBlur = 0;
    texto(ctx, `${e.pontos} pontos`, W / 2, py + 88, 18, '#e6dcff', { fonte: FL, peso: 600 });
    texto(ctx, 'toque para jogar de novo', W / 2, py + 120, 13, 'rgba(230,220,255,0.7)', { fonte: FL, peso: 500 });
    ctx.restore();
  },
};

export default tema;
