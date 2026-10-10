// Rodada 3 · Minimal Escuro Premium: grafite fosco, uma cor fina por valor e
// numeros grandes e elegantes. Nada brilha, so o 2048 (ouro) e o 4096
// (platina). Muito espaco vazio, sombras quase imperceptiveis, efeitos curtos.
// Cartas desenhadas em cache (offscreen) por valor e tamanho.
import { TAU, rr, circulo, texto, rgba, nivel, textoMeta, semente, easeOut, clamp } from '../kit.js';

const FL = '"Ubuntu Sans", "Noto Sans", "Segoe UI", system-ui, sans-serif';
// acentos discretos por nivel 2..1024; 2048 e 4096 tem material proprio
const ACENTO = ['#7aa2f7', '#e0af68', '#9ece6a', '#bb9af7', '#7dcfff', '#ff9e64', '#f7768e', '#73daca', '#c0caf5', '#e46876', '#d4af37', '#e5e4e2'];
const OURO = ['#f3d27a', '#d4af37', '#9c7a22'];
const PLATINA = ['#ffffff', '#d9dce3', '#9aa0ab'];
const TINTA = '#ecebe6';
const acento = (v) => ACENTO[Math.min(nivel(v), ACENTO.length - 1)];
const rnd = semente(53);

// ------------------------------------------------------------ cache

const cache = new Map();
const K = 2;
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
const raio = (r) => Math.min(r.w, r.h) * 0.09;

/** Texto com espacamento entre letras (rotulos pequenos em caixa alta). */
function rotuloEspacado(ctx, txt, x, y, tam, cor, op = {}) {
  ctx.save();
  ctx.letterSpacing = `${op.espaco ?? 2}px`;
  texto(ctx, txt, x, y, tam, cor, { fonte: FL, peso: op.peso || 500, alinhar: op.alinhar, max: op.max });
  ctx.restore();
}

function degradeMetal(g, y0, y1, cores) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, cores[0]); gr.addColorStop(0.55, cores[1]); gr.addColorStop(1, cores[2]);
  return gr;
}

/** Base fosca comum: corpo, fio e sombra minima. */
function corpo(g, r, fill = '#1f1f25') {
  const rad = raio(r);
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = fill; g.fill();
  g.restore();
  const gr = g.createLinearGradient(0, r.y, 0, r.y + r.h);
  gr.addColorStop(0, 'rgba(255,255,255,0.035)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = gr; g.fill();
  rr(g, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, rad); g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1; g.stroke();
}

function faixa(g, r, estilo) {
  const rad = raio(r);
  g.save(); rr(g, r.x, r.y, r.w, r.h, rad); g.clip();
  g.fillStyle = estilo; g.fillRect(r.x, r.y, r.w, Math.max(2.5, r.h * 0.035));
  g.restore();
}

function cartaNormal(g, r, v) {
  const n = nivel(v);
  const ouro = n === 10, platina = n >= 11;
  corpo(g, r, ouro ? '#221d12' : platina ? '#202126' : '#1f1f25');
  const metal = ouro ? OURO : platina ? PLATINA : null;
  faixa(g, r, metal ? degradeMetal(g, r.y, r.y + 4, metal) : acento(v));
  const corNum = metal ? degradeMetal(g, r.y, r.y + r.h, metal) : TINTA;
  // indice no canto (aparece com a carta coberta) e o pontinho na cor do valor
  texto(g, String(v), r.x + r.w * 0.11, r.y + r.h * 0.155, r.h * 0.19, corNum, { alinhar: 'left', fonte: FL, peso: 500, max: r.w * 0.66 });
  circulo(g, r.x + r.w * 0.86, r.y + r.h * 0.155, Math.max(2, r.w * 0.04));
  g.fillStyle = metal ? metal[1] : acento(v); g.fill();
  // numero grande e leve no corpo
  texto(g, String(v), 0, r.y + r.h * 0.6, Math.min(r.h * 0.34, r.w * (String(v).length > 3 ? 0.3 : 0.42)), corNum, { fonte: FL, peso: 300 });
  if (metal) {
    rr(g, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, raio(r)); g.strokeStyle = rgba(metal[1], 0.5); g.lineWidth = 1; g.stroke();
  }
}

function geloSobre(g, r) {
  const rad = raio(r);
  rr(g, r.x, r.y, r.w, r.h, rad); g.fillStyle = 'rgba(125,207,255,0.08)'; g.fill();
  g.save(); g.setLineDash([4, 3]); g.strokeStyle = '#7dcfff'; g.lineWidth = 1.2;
  rr(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, rad * 0.8); g.stroke(); g.restore();
  // floco em fio no canto
  const cx = r.x + r.w * 0.7, cy = r.y + r.h * 0.155, s = r.w * 0.07;
  g.strokeStyle = '#7dcfff'; g.lineWidth = 1;
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    g.beginPath(); g.moveTo(cx - Math.cos(a) * s, cy - Math.sin(a) * s); g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); g.stroke();
  }
}

function pedra(g, r, hp) {
  corpo(g, r, '#2a2a2f');
  // textura de ruido
  const q = semente(7);
  g.save(); rr(g, r.x, r.y, r.w, r.h, raio(r)); g.clip();
  for (let i = 0; i < 140; i++) {
    g.fillStyle = q() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)';
    g.fillRect(r.x + q() * r.w, r.y + q() * r.h, 1.2, 1.2);
  }
  // rachaduras em fio pelo hp perdido
  const perdido = 3 - clamp(hp, 0, 3);
  const linhas = [[0.32, 0.36, 0.5, 0.58, 0.4, 0.84], [0.7, 0.4, 0.56, 0.62, 0.72, 0.88], [0.2, 0.6, 0.44, 0.7, 0.6, 0.62]];
  for (let k = 0; k < perdido; k++) {
    const c = linhas[k];
    g.beginPath(); g.moveTo(r.x + r.w * c[0], r.y + r.h * c[1]); g.lineTo(r.x + r.w * c[2], r.y + r.h * c[3]); g.lineTo(r.x + r.w * c[4], r.y + r.h * c[5]);
    g.strokeStyle = 'rgba(0,0,0,0.8)'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 0.6; g.stroke();
  }
  g.restore();
  for (let k = 0; k < 3; k++) {
    circulo(g, r.x + r.w * 0.15 + k * r.w * 0.12, r.y + r.h * 0.155, Math.max(2, r.w * 0.035));
    if (k < hp) { g.fillStyle = '#bdbdbd'; g.fill(); } else { g.strokeStyle = '#55555c'; g.lineWidth = 1; g.stroke(); }
  }
}

function coringa(g, r) {
  corpo(g, r);
  const gr = g.createLinearGradient(r.x, 0, r.x + r.w, 0);
  ACENTO.slice(0, 7).forEach((c, i) => gr.addColorStop(i / 6, c));
  faixa(g, r, gr);
  texto(g, '★', r.x + r.w * 0.11, r.y + r.h * 0.155, r.h * 0.16, TINTA, { alinhar: 'left', fonte: FL, peso: 500 });
  texto(g, '?', 0, r.y + r.h * 0.6, r.h * 0.34, TINTA, { fonte: FL, peso: 300 });
}

function bomba(g, r) {
  corpo(g, r);
  faixa(g, r, '#f7768e');
  texto(g, '!', r.x + r.w * 0.11, r.y + r.h * 0.155, r.h * 0.19, '#f7768e', { alinhar: 'left', fonte: FL, peso: 500 });
  const cx = 0, cy = r.y + r.h * 0.6, s = r.w * 0.18;
  g.strokeStyle = '#f7768e'; g.lineWidth = 1.5;
  circulo(g, cx, cy, s); g.stroke();
  g.beginPath(); g.moveTo(cx + s * 0.7, cy - s * 0.7); g.quadraticCurveTo(cx + s * 1.2, cy - s * 1.4, cx + s * 1.6, cy - s * 1.1); g.stroke();
}

function dobro(g, r) {
  corpo(g, r);
  faixa(g, r, '#7dcfff');
  texto(g, '×2', r.x + r.w * 0.11, r.y + r.h * 0.155, r.h * 0.17, '#7dcfff', { alinhar: 'left', fonte: FL, peso: 500 });
  texto(g, '×2', 0, r.y + r.h * 0.6, r.h * 0.3, TINTA, { fonte: FL, peso: 300 });
}

// ------------------------------------------------------------ particulas

function formas(P) {
  if (P.formas.eFio) return;
  P.formas.eFio = (ctx, p, u) => {
    ctx.globalAlpha = 1 - u;
    ctx.strokeStyle = p.cor; ctx.lineWidth = p.larg || 1;
    circulo(ctx, 0, 0, p.r0 + (p.r1 - p.r0) * easeOut(u)); ctx.stroke();
  };
  P.formas.eTxt = (ctx, p, u) => {
    ctx.globalAlpha = u < 0.15 ? u / 0.15 : 1 - Math.max(0, (u - 0.55) / 0.45);
    texto(ctx, p.txt, 0, 0, p.fs, p.cor, { fonte: FL, peso: p.peso || 300 });
  };
  P.formas.eLinha = (ctx, p, u) => {
    ctx.strokeStyle = p.cor; ctx.lineWidth = 1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-p.tam / 2, 0); ctx.lineTo(p.tam / 2, 0); ctx.stroke();
  };
}
const fio = (P, x, y, cor, r0, r1, vida = 0.4, larg = 1) => P.add({ forma: 'eFio', x, y, vida, r0, r1, cor, larg, tam: 1 });
const txt = (P, x, y, s, cor, fs = 20, peso = 300) => P.add({ forma: 'eTxt', x, y, vy: -34, g: 0, arrasto: 1, vida: 0.9, txt: s, cor, fs, peso, tam: 1 });
function pontos(P, x, y, cor, n, forca = 1) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd() * 0.4, v = (50 + rnd() * 70) * forca;
    P.add({ forma: 'c', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, arrasto: 0.93, vida: 0.5 + rnd() * 0.2, tam: 2.4, cor });
  }
}
function linhas(P, x, y, cor, n) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, v = 90 + rnd() * 40;
    P.add({ forma: 'eLinha', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, arrasto: 0.88, vida: 0.32, tam: 8, cor, rot: a });
  }
}

function progresso(m) { return Math.min(1, m.atual / m.alvo); }

// ------------------------------------------------------------ tema

const tema = {
  id: 'escuro',
  nome: 'Minimal Escuro',
  cores: { texto: TINTA, destaque: '#d4af37', particulas: ['#ecebe6'] },
  faixas: (W, H) => ({ topo: W > H ? 92 : 128, base: 0 }),

  fundo(ctx, W, H) {
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#1b1b20'); g.addColorStop(1, '#0f0f12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },

  mesa(ctx, L, e, t) {
    const m = L.mesa, rad = L.pad;
    rr(ctx, m.x, m.y, m.w, m.h, rad); ctx.fillStyle = '#16161a'; ctx.fill();
    rr(ctx, m.x + 0.5, m.y + 0.5, m.w - 1, m.h - 1, rad); ctx.strokeStyle = e.febre ? 'rgba(212,175,55,0.55)' : 'rgba(255,255,255,0.075)'; ctx.lineWidth = 1; ctx.stroke();
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      rr(ctx, s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1, raio(s)); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke();
    }
  },

  peca(ctx, carta, r, op) {
    const pad = 6;
    const tam = `${Math.round(r.w)}x${Math.round(r.h)}`;
    let img;
    if (carta.tipo === 'pedra') img = imagem(`p:${carta.hp}:${tam}`, r.w, r.h, pad, (g, q) => pedra(g, q, carta.hp));
    else if (carta.tipo === 'coringa') img = imagem(`c:${tam}`, r.w, r.h, pad, coringa);
    else if (carta.tipo === 'bomba') img = imagem(`b:${tam}`, r.w, r.h, pad, bomba);
    else if (carta.tipo === 'dobro') img = imagem(`d:${tam}`, r.w, r.h, pad, dobro);
    else img = imagem(`n:${carta.v}:${carta.gelo ? 1 : 0}:${tam}`, r.w, r.h, pad, (g, q) => { cartaNormal(g, q, carta.v); if (carta.gelo) geloSobre(g, q); });
    ctx.drawImage(img, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2);
    if (op.fila && !op.frente) { rr(ctx, r.x, r.y, r.w, r.h, raio(r)); ctx.fillStyle = 'rgba(15,15,18,0.45)'; ctx.fill(); }
    if (op.destaque) {
      rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, raio(r) + 3);
      ctx.strokeStyle = `rgba(236,235,230,${0.15 + op.destaque * 0.35})`; ctx.lineWidth = 1; ctx.stroke();
    }
  },

  cadeado(ctx, a) {
    ctx.save();
    rr(ctx, a.x - 2, a.y - 2, a.w + 4, a.h + 4, 6); ctx.fillStyle = 'rgba(15,15,18,0.88)'; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let d = -a.h; d < a.w + a.h; d += 7) { ctx.beginPath(); ctx.moveTo(a.x + d, a.y); ctx.lineTo(a.x + d - a.h, a.y + a.h); ctx.stroke(); }
    ctx.restore();
    const cx = a.x + a.w / 2, cy = a.y + Math.min(a.h * 0.42, a.w * 1.1), s = a.w * 0.17;
    ctx.strokeStyle = '#cfcfcf'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.3, s * 0.6, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - s, cy - s * 0.3, s * 2, s * 1.5, 2.5); ctx.stroke();
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    ctx.save();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = carga ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    rr(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, raio(r)); ctx.stroke();
    ctx.restore();
    if (!e.descarte) {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      ctx.strokeStyle = carga ? 'rgba(236,235,230,0.35)' : 'rgba(236,235,230,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy - 8); ctx.moveTo(cx - 5, cy - 3); ctx.lineTo(cx, cy - 8); ctx.lineTo(cx + 5, cy - 3); ctx.stroke();
    }
    if (e.descarteCarga > 1) texto(ctx, '×' + e.descarteCarga, r.x + r.w / 2, r.y + r.h + 11, 11, 'rgba(236,235,230,0.6)', { fonte: FL, peso: 400 });
  },

  fila(ctx, L) {
    const p0 = L.filaPos(0);
    if (L.fila.vertical) { rotuloEspacado(ctx, 'PRÓXIMA', p0.x + p0.w / 2, p0.y - 10, 9.5, 'rgba(236,235,230,0.4)'); return; }
    rotuloEspacado(ctx, 'PRÓXIMA', p0.x, p0.y - 11, 9.5, 'rgba(236,235,230,0.4)', { alinhar: 'left' });
  },

  hud(ctx, W, H, L, e, t) {
    const pais = W > H;
    rotuloEspacado(ctx, `FASE ${e.faseId}`, 20, pais ? 26 : 30, 10, 'rgba(236,235,230,0.45)', { alinhar: 'left' });
    rotuloEspacado(ctx, 'PONTOS', W / 2, pais ? 18 : 22, 9.5, 'rgba(236,235,230,0.4)');
    const corPontos = e.febre ? '#d4af37' : TINTA;
    texto(ctx, String(e.pontos), W / 2, pais ? 46 : 54, pais ? 32 : 40, corPontos, { fonte: FL, peso: 300 });
    // metas: linha fina com texto e fracao
    const bw = Math.min(280, W * 0.62), bx = W / 2 - bw / 2;
    e.metas.forEach((m, k) => {
      const y = (pais ? 70 : 86) + k * (pais ? 12 : 17);
      texto(ctx, textoMeta(m), bx, y - 5, 10.5, m.feita ? 'rgba(236,235,230,0.85)' : 'rgba(236,235,230,0.5)', { alinhar: 'left', fonte: FL, peso: 400, max: bw * 0.7 });
      texto(ctx, m.feita ? '✓' : `${Math.min(m.atual, m.alvo)}/${m.alvo}`, bx + bw, y - 5, 10, 'rgba(236,235,230,0.45)', { alinhar: 'right', fonte: FL, peso: 400 });
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, y + 2, bw, 1);
      ctx.fillStyle = m.feita ? '#d4af37' : 'rgba(236,235,230,0.7)'; ctx.fillRect(bx, y + 2, bw * progresso(m), 1);
    });
    if (e.febre) rotuloEspacado(ctx, `FEBRE ×2`, W - 20, pais ? 26 : 30, 10, `rgba(212,175,55,${0.6 + 0.4 * Math.sin(t * 6)})`, { alinhar: 'right' });
  },

  efeito(fx, P) {
    formas(P);
    switch (fx.tipo) {
      case 'pouso': fio(P, fx.x, fx.y + 10, 'rgba(236,235,230,0.35)', 4, 16, 0.25); return true;
      case 'fusao': {
        const cor = nivel(fx.valor) >= 10 ? '#d4af37' : acento(fx.valor);
        fio(P, fx.x, fx.y, cor, 8, 26 + fx.degrau * 6, 0.4, 1.2);
        pontos(P, fx.x, fx.y, cor, 5 + fx.degrau, 0.8 + fx.degrau * 0.1);
        if (fx.degrau > 1) txt(P, fx.x, fx.y - 26, '×' + fx.degrau, TINTA, 18 + fx.degrau * 2);
        return true;
      }
      case 'completar':
        fio(P, fx.x, fx.y, '#d4af37', 10, 80, 0.7, 1.4);
        fio(P, fx.x, fx.y, 'rgba(243,210,122,0.6)', 6, 50, 0.5, 1);
        for (let i = 0; i < 10; i++) P.add({ forma: 'c', x: fx.x + (rnd() - 0.5) * 30, y: fx.y, vx: (rnd() - 0.5) * 20, vy: -(40 + rnd() * 60), g: -10, arrasto: 0.99, vida: 1, tam: 2.2, cor: '#f3d27a' });
        txt(P, fx.x, fx.y - 30, String(fx.valor), '#f3d27a', 30, 300);
        return true;
      case 'explodir': fio(P, fx.x, fx.y, '#f7768e', 6, 40, 0.4, 1.2); linhas(P, fx.x, fx.y, '#f7768e', 8); return true;
      case 'pedra': P.estourar(fx.x, fx.y, ['#6b6b72', '#3a3a40'], 10, 0.6, { forma: 'q', tam: 3, vida: 0.5 }); return true;
      case 'racha': linhas(P, fx.x, fx.y, '#8a8a92', 4); return true;
      case 'gelo': pontos(P, fx.x, fx.y, '#7dcfff', 8, 0.7); fio(P, fx.x, fx.y, '#7dcfff', 6, 30, 0.4); return true;
      case 'cadeado': fio(P, fx.x, fx.y, TINTA, 8, 50, 0.5); txt(P, fx.x, fx.y - 20, 'aberto', TINTA, 14, 400); return true;
      case 'combo': txt(P, fx.x, fx.y - 44, `combo ×${fx.n}`, 'rgba(236,235,230,0.85)', 15, 400); return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    ctx.save();
    ctx.fillStyle = 'rgba(12,12,15,0.82)'; ctx.fillRect(0, 0, W, H);
    const venceu = e.fim === 'venceu';
    const cy = H * 0.42;
    rotuloEspacado(ctx, venceu ? 'FASE COMPLETA' : 'SEM JOGADAS', W / 2, cy - 34, 11, venceu ? '#d4af37' : 'rgba(236,235,230,0.6)', { espaco: 3 });
    texto(ctx, String(e.pontos), W / 2, cy + 6, 46, TINTA, { fonte: FL, peso: 300 });
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(W / 2 - 60, cy + 40, 120, 1);
    rotuloEspacado(ctx, 'TOQUE PARA RECOMEÇAR', W / 2, cy + 62, 9.5, 'rgba(236,235,230,0.45)');
    ctx.restore();
  },
};

export default tema;
