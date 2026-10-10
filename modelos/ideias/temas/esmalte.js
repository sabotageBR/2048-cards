// Ideia (rodada 3, app comercial): Esmalte 3D. Cartas grossas de esmalte com
// bisel, brilho especular e sombra macia sobre um fundo em degrade quieto. A
// linguagem dos puzzles mais baixados das lojas: volume, luz e nada de enfeite.
// Cada carta e pintada uma vez em canvas offscreen (por valor e tamanho).
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, textoMeta, semente } from '../kit.js';

const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';
const DPR = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
const PAD = 14; // folga do cache para a sombra projetada
const TINTA = '#2e2470';
// 2..1024: a cor fica mais rica e saturada conforme sobe
const CORES = ['#7cc8ff', '#5fd9a8', '#ffcf4d', '#ff9f43', '#ff6b6b', '#f2549b', '#b45cf0', '#6a5cff', '#2f7fe8', '#0fa596'];
const OURO = { face: '#ffcf3a', lado: '#a8650c', topo: '#fff3b8', base: '#e3961a', tinta: '#8a4b00' };
const PEROLA = { lado: '#8b7fd6', tinta: '#5a4bb0' };

const cache = new Map();
/** Canvas offscreen com a peca pintada (com folga PAD para a sombra). */
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

const espessura = (h) => Math.max(4, Math.round(h * 0.075));
const raio = (w, h) => Math.min(w, h) * 0.17;

/**
 * Corpo de esmalte: sombra, lateral grossa, face com degrade, bisel e brilho.
 * `face` pode ser cor ou funcao (g, w, hf) que devolve o preenchimento.
 */
function corpo(g, w, h, face, lado, op = {}) {
  const T = espessura(h), R = raio(w, h), hf = h - T;
  g.save();
  g.shadowColor = 'rgba(40,25,90,0.30)'; g.shadowBlur = 9 * DPR; g.shadowOffsetY = 4 * DPR;
  rr(g, 0, 0, w, h, R); g.fillStyle = lado; g.fill();
  g.restore();
  const gl = g.createLinearGradient(0, hf - R, 0, h);
  gl.addColorStop(0, lado); gl.addColorStop(1, escurecer(lado, 0.28));
  rr(g, 0, 0, w, h, R); g.fillStyle = gl; g.fill();
  // face
  rr(g, 0, 0, w, hf, R);
  if (typeof face === 'function') g.fillStyle = face(g, w, hf);
  else {
    const gf = g.createLinearGradient(0, 0, 0, hf);
    gf.addColorStop(0, clarear(face, 0.3)); gf.addColorStop(0.55, face); gf.addColorStop(1, escurecer(face, 0.1));
    g.fillStyle = gf;
  }
  g.fill();
  g.save();
  rr(g, 0, 0, w, hf, R); g.clip();
  if (op.miolo) op.miolo(g, w, hf);
  // oclusao suave embaixo da face
  const go = g.createLinearGradient(0, hf * 0.78, 0, hf);
  go.addColorStop(0, 'rgba(0,0,0,0)'); go.addColorStop(1, 'rgba(20,10,60,0.14)');
  g.fillStyle = go; g.fillRect(0, hf * 0.7, w, hf * 0.3);
  // faixa de brilho especular
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, hf * 0.3);
  g.quadraticCurveTo(w * 0.5, hf * 0.46, 0, hf * 0.38); g.closePath();
  const gb = g.createLinearGradient(0, 0, 0, hf * 0.42);
  gb.addColorStop(0, `rgba(255,255,255,${op.brilho ?? 0.46})`); gb.addColorStop(1, 'rgba(255,255,255,0.06)');
  g.fillStyle = gb; g.fill();
  // ponto especular
  const gs = g.createRadialGradient(w * 0.2, hf * 0.12, 0, w * 0.2, hf * 0.12, w * 0.2);
  gs.addColorStop(0, 'rgba(255,255,255,0.75)'); gs.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gs; g.fillRect(0, 0, w * 0.5, hf * 0.4);
  // bisel claro no topo
  g.lineWidth = 2.4;
  const gv = g.createLinearGradient(0, 0, 0, hf * 0.55);
  gv.addColorStop(0, 'rgba(255,255,255,0.85)'); gv.addColorStop(1, 'rgba(255,255,255,0)');
  g.strokeStyle = gv; rr(g, 1.2, 1.2, w - 2.4, hf - 2.4, R - 1); g.stroke();
  g.restore();
  // aresta entre face e lateral
  g.lineWidth = 1; g.strokeStyle = 'rgba(20,10,60,0.16)'; rr(g, 0.5, 0.5, w - 1, hf - 1, R); g.stroke();
}

/** Numero gordo branco com borda escura e um degrau de volume. */
function numero(g, txt, x, y, tam, escuro, alinhar = 'center', max = 0) {
  g.save();
  g.font = `700 ${Math.round(tam)}px ${FONTE}`;
  g.textAlign = alinhar; g.textBaseline = 'middle'; g.lineJoin = 'round';
  if (max) { const m = g.measureText(txt).width; if (m > max) { const k = max / m; g.translate(x, y); g.scale(k, k); x = 0; y = 0; } }
  g.lineWidth = tam * 0.24; g.strokeStyle = escurecer(escuro, 0.25);
  g.strokeText(txt, x, y + tam * 0.07);
  g.strokeStyle = escuro; g.strokeText(txt, x, y);
  g.fillStyle = '#ffffff'; g.fillText(txt, x, y);
  g.restore();
}

function corDe(v) {
  const n = nivel(v);
  if (n >= 11) return { face: null, lado: PEROLA.lado, tinta: PEROLA.tinta, especial: 'perola' };
  if (n === 10) return { face: OURO.face, lado: OURO.lado, tinta: OURO.tinta, especial: 'ouro' };
  const c = CORES[n];
  return { face: c, lado: escurecer(c, 0.32), tinta: escurecer(c, 0.5) };
}

function pintarCarta(g, w, h, v, gelo) {
  const c = corDe(v);
  const hf = h - espessura(h);
  let face = c.face;
  if (c.especial === 'ouro') {
    face = (gg, ww, hh) => { const gr = gg.createLinearGradient(0, 0, ww * 0.4, hh); gr.addColorStop(0, OURO.topo); gr.addColorStop(0.5, OURO.face); gr.addColorStop(1, OURO.base); return gr; };
  } else if (c.especial === 'perola') {
    face = (gg, ww, hh) => {
      const gr = gg.createLinearGradient(0, 0, ww, hh);
      ['#ffb3c7', '#ffe29a', '#b8f2c9', '#a8d8ff', '#d4b8ff'].forEach((k, i) => gr.addColorStop(i / 4, k));
      return gr;
    };
  }
  corpo(g, w, h, face, c.lado, {
    miolo: (gg, ww, hh) => {
      if (c.especial === 'perola') {
        const gp = gg.createRadialGradient(ww * 0.35, hh * 0.3, 0, ww * 0.35, hh * 0.3, ww);
        gp.addColorStop(0, 'rgba(255,255,255,0.55)'); gp.addColorStop(1, 'rgba(255,255,255,0)');
        gg.fillStyle = gp; gg.fillRect(0, 0, ww, hh);
      }
      if (c.especial) {
        // brilhos fixos
        const rnd = semente(v);
        gg.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < 4; i++) { estrela(gg, ww * (0.2 + rnd() * 0.65), hh * (0.45 + rnd() * 0.45), 2.6 + rnd() * 2, 0.9, 4); gg.fill(); }
      }
    },
  });
  const ti = Math.min(w * 0.3, hf * 0.24);
  numero(g, String(v), w * 0.1, ti * 0.7 + 2, ti, c.tinta, 'left', w * 0.8);
  numero(g, String(v), w / 2, hf * 0.62, Math.min(w * 0.44, hf * 0.36), c.tinta, 'center', w * 0.8);
  if (gelo) capaGelo(g, w, hf);
}

function capaGelo(g, w, hf) {
  const R = raio(w, hf);
  g.save();
  rr(g, 0, 0, w, hf, R); g.clip();
  const gi = g.createLinearGradient(0, 0, w, hf);
  gi.addColorStop(0, 'rgba(225,248,255,0.72)'); gi.addColorStop(1, 'rgba(160,215,245,0.5)');
  g.fillStyle = gi; g.fillRect(0, 0, w, hf);
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(w * 0.05, hf * 0.95); g.lineTo(w * 0.6, -hf * 0.05); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.32, hf * 1.02); g.lineTo(w * 0.9, hf * 0.12); g.stroke();
  g.fillStyle = '#ffffff';
  for (const [x, y, s] of [[0.86, 0.12, 5], [0.12, 0.86, 4], [0.8, 0.82, 3]]) { estrela(g, w * x, hf * y, s, s * 0.3, 6); g.fill(); }
  g.restore();
  g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,0.95)'; rr(g, 1, 1, w - 2, hf - 2, R); g.stroke();
}

function pintarPedra(g, w, h, hp) {
  const hf = h - espessura(h);
  corpo(g, w, h, (gg, ww, hh) => { const gr = gg.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#8a919d'); gr.addColorStop(1, '#4a515e'); return gr; }, '#2f343d', {
    brilho: 0.34,
    miolo: (gg, ww, hh) => {
      const rnd = semente(31);
      for (let i = 0; i < 140; i++) {
        gg.fillStyle = rnd() < 0.5 ? 'rgba(220,226,234,0.45)' : 'rgba(30,34,42,0.45)';
        circulo(gg, rnd() * ww, rnd() * hh, 0.5 + rnd() * 1.3); gg.fill();
      }
      const perdido = 3 - Math.max(0, Math.min(3, hp));
      const rach = [[0.18, 0.3, 0.42, 0.52, 0.3, 0.86], [0.78, 0.26, 0.58, 0.55, 0.74, 0.92], [0.45, 0.2, 0.52, 0.42, 0.4, 0.62]];
      for (let k = 0; k < perdido; k++) {
        const c = rach[k];
        gg.lineJoin = 'round';
        for (const [cor, lw, dy] of [['rgba(255,255,255,0.35)', 2.2, 0.8], ['#1c1f26', 1.4, 0]]) {
          gg.strokeStyle = cor; gg.lineWidth = lw;
          gg.beginPath(); gg.moveTo(c[0] * ww, c[1] * hh + dy); gg.lineTo(c[2] * ww, c[3] * hh + dy); gg.lineTo(c[4] * ww, c[5] * hh + dy); gg.stroke();
        }
      }
    },
  });
  // pips em gemas
  const r = Math.max(3, w * 0.065);
  for (let k = 0; k < 3; k++) {
    const x = w * 0.16 + k * r * 2.6, y = hf * 0.16 + 2;
    circulo(g, x, y, r);
    if (k < hp) {
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      gr.addColorStop(0, '#ffd0dc'); gr.addColorStop(0.4, '#ff5c84'); gr.addColorStop(1, '#a3123f');
      g.fillStyle = gr; g.fill();
    } else { g.fillStyle = '#23262e'; g.fill(); }
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.stroke();
  }
}

function pintarCoringa(g, w, h) {
  const hf = h - espessura(h);
  corpo(g, w, h, (gg, ww, hh) => {
    const gr = gg.createLinearGradient(0, 0, ww, hh);
    ['#ff5f6d', '#ffb347', '#ffe259', '#5fe39a', '#4fa8ff', '#a86bff'].forEach((k, i) => gr.addColorStop(i / 5, k));
    return gr;
  }, '#6a4fc9');
  g.save();
  g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 10 * DPR;
  estrela(g, w / 2, hf * 0.56, Math.min(w, hf) * 0.28, Math.min(w, hf) * 0.12); g.fillStyle = '#ffffff'; g.fill();
  g.restore();
  estrela(g, w * 0.2, hf * 0.17, w * 0.1, w * 0.045); g.fillStyle = '#ffffff'; g.fill();
}

function pintarBomba(g, w, h) {
  const hf = h - espessura(h);
  corpo(g, w, h, (gg, ww, hh) => { const gr = gg.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#454a74'); gr.addColorStop(1, '#262a45'); return gr; }, '#171a2c', { brilho: 0.3 });
  const R = Math.min(w, hf) * 0.27, cx = w / 2, cy = hf * 0.6;
  g.strokeStyle = '#c9a36b'; g.lineWidth = 2.4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx + R * 0.5, cy - R * 0.85); g.quadraticCurveTo(cx + R * 0.9, cy - R * 1.5, cx + R * 1.3, cy - R * 1.25); g.stroke();
  rr(g, cx + R * 0.22, cy - R * 1.05, R * 0.56, R * 0.34, 3); g.fillStyle = '#b8bfcc'; g.fill();
  const gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
  gr.addColorStop(0, '#ffb3b3'); gr.addColorStop(0.35, '#ff4a5c'); gr.addColorStop(1, '#8a0f24');
  circulo(g, cx, cy, R); g.fillStyle = gr; g.fill();
  elipse(g, cx - R * 0.35, cy - R * 0.45, R * 0.32, R * 0.18, -0.5); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
}

function pintarDobro(g, w, h) {
  const hf = h - espessura(h);
  corpo(g, w, h, (gg, ww, hh) => { const gr = gg.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#9b83ff'); gr.addColorStop(1, '#5137d6'); return gr; }, '#33219a');
  g.save();
  const tam = Math.min(w * 0.5, hf * 0.42);
  g.font = `700 ${tam}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = tam * 0.22; g.strokeStyle = '#2a1680'; g.strokeText('×2', w / 2, hf * 0.58 + tam * 0.06);
  const go = g.createLinearGradient(0, hf * 0.4, 0, hf * 0.75);
  go.addColorStop(0, '#fff3b8'); go.addColorStop(0.5, '#ffcf3a'); go.addColorStop(1, '#e3961a');
  g.fillStyle = go; g.fillText('×2', w / 2, hf * 0.58);
  g.restore();
}

/** Poco embutido (slot vazio, descarte). */
function poco(ctx, r, alpha = 1) {
  const R = Math.min(r.w, r.h) * 0.17;
  ctx.save();
  ctx.globalAlpha *= alpha;
  rr(ctx, r.x, r.y, r.w, r.h, R); ctx.fillStyle = 'rgba(70,50,160,0.10)'; ctx.fill();
  ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, R); ctx.clip();
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + 14);
  g.addColorStop(0, 'rgba(50,30,120,0.22)'); g.addColorStop(1, 'rgba(50,30,120,0)');
  ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, 14);
  ctx.restore();
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; rr(ctx, r.x + 0.7, r.y + 0.7, r.w - 1.4, r.h - 1.4, R); ctx.stroke();
  ctx.restore();
}

function botao(ctx, x, y, R, icone) {
  ctx.save();
  ctx.shadowColor = 'rgba(40,25,90,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  circulo(ctx, x, y, R); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
  const g = ctx.createLinearGradient(0, y - R, 0, y + R);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e4dcff');
  circulo(ctx, x, y, R - 2.5); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#6a5cff'; ctx.fillStyle = '#6a5cff'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (icone === 'voltar') {
    ctx.beginPath(); ctx.moveTo(x + R * 0.35, y); ctx.lineTo(x - R * 0.35, y); ctx.moveTo(x - R * 0.05, y - R * 0.3); ctx.lineTo(x - R * 0.35, y); ctx.lineTo(x - R * 0.05, y + R * 0.3); ctx.stroke();
  } else {
    for (let k = 0; k < 8; k++) { const a = (k * TAU) / 8; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R * 0.28, y + Math.sin(a) * R * 0.28); ctx.lineTo(x + Math.cos(a) * R * 0.48, y + Math.sin(a) * R * 0.48); ctx.stroke(); }
    circulo(ctx, x, y, R * 0.3); ctx.fill();
    circulo(ctx, x, y, R * 0.12); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
}

function estrelasDe(e) {
  const ref = e.estrelasRef || [0, 0, 0];
  if (ref[2] > 0 && e.pontos >= ref[2]) return 3;
  if (ref[1] > 0 && e.pontos >= ref[1]) return 2;
  return 1;
}

const tema = {
  id: 'esmalte',
  nome: 'Esmalte 3D',
  cores: { texto: TINTA, destaque: '#ffcf3a', particulas: ['#ffffff', '#ffcf3a', '#7cc8ff'] },
  faixas: (W, H) => ({ topo: W > H ? 112 : 128, base: 0 }),

  fundo(ctx, W, H, L) {
    const k = ctx.getTransform().a || 1;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#9fd3ff'); g.addColorStop(0.55, '#b9b4ff'); g.addColorStop(1, '#e3c2f2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // bokeh discreto
    const rnd = semente(9);
    ctx.save();
    ctx.filter = `blur(${Math.round(6 * k)}px)`;
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.12})`;
      circulo(ctx, rnd() * W, rnd() * H, 18 + rnd() * 46); ctx.fill();
    }
    ctx.restore();
    // vinheta leve
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    v.addColorStop(0, 'rgba(60,30,140,0)'); v.addColorStop(1, 'rgba(60,30,140,0.18)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    // mesa: painel claro translucido com sombra interna
    const m = L.mesa, R = 24;
    ctx.save();
    ctx.shadowColor = 'rgba(60,35,140,0.22)'; ctx.shadowBlur = 26 * k; ctx.shadowOffsetY = 8 * k;
    rr(ctx, m.x, m.y, m.w, m.h, R); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    ctx.restore();
    ctx.save(); rr(ctx, m.x, m.y, m.w, m.h, R); ctx.clip();
    const gi = ctx.createLinearGradient(0, m.y, 0, m.y + 22);
    gi.addColorStop(0, 'rgba(60,35,140,0.16)'); gi.addColorStop(1, 'rgba(60,35,140,0)');
    ctx.fillStyle = gi; ctx.fillRect(m.x, m.y, m.w, 22);
    ctx.restore();
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; rr(ctx, m.x + 0.8, m.y + 0.8, m.w - 1.6, m.h - 1.6, R); ctx.stroke();
  },

  vivo(ctx, W, H, t) {
    // tres luzes flutuando devagar
    for (let i = 0; i < 3; i++) {
      const x = W * (0.2 + 0.3 * i) + Math.sin(t * 0.2 + i * 2) * 30, y = H * (0.25 + 0.25 * i) + Math.cos(t * 0.17 + i) * 24, r = 60 + i * 20;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  },

  mesa(ctx, L, e, t) {
    if (e.febre) {
      const m = L.mesa, k = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.save();
      ctx.shadowColor = '#ffcf3a'; ctx.shadowBlur = 18 + k * 14;
      ctx.lineWidth = 3; ctx.strokeStyle = `rgba(255,207,58,${0.7 + 0.3 * k})`;
      rr(ctx, m.x, m.y, m.w, m.h, 24); ctx.stroke();
      ctx.restore();
    }
    for (let c = 0; c < L.colunas; c++) if (!e.colunas[c].length) poco(ctx, L.carta(c, 0));
  },

  fila(ctx, L) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let k = 0; k < L.tamFila; k++) { const p = L.filaPos(k); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + p.w); y1 = Math.max(y1, p.y + p.h); }
    const pad = 10, R = 20;
    ctx.save();
    ctx.shadowColor = 'rgba(60,35,140,0.18)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    rr(ctx, x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2, R); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; rr(ctx, x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2, R); ctx.stroke();
  },

  peca(ctx, carta, r, op) {
    let chave, pintar;
    if (carta.tipo === 'pedra') { chave = `p${carta.hp}`; pintar = (g, w, h) => pintarPedra(g, w, h, carta.hp); }
    else if (carta.tipo === 'coringa') { chave = 'c'; pintar = pintarCoringa; }
    else if (carta.tipo === 'bomba') { chave = 'b'; pintar = pintarBomba; }
    else if (carta.tipo === 'dobro') { chave = 'd'; pintar = pintarDobro; }
    else { chave = `n${carta.v}${carta.gelo ? 'g' : ''}`; pintar = (g, w, h) => pintarCarta(g, w, h, carta.v, carta.gelo); }
    const img = imagem(chave, r.w, r.h, pintar);
    ctx.drawImage(img, r.x - PAD, r.y - PAD, r.w + PAD * 2, r.h + PAD * 2);
    const hf = r.h - espessura(r.h), R = raio(r.w, r.h);
    // reflexo que passa no ouro e na perola
    if (carta.tipo === 'normal' && nivel(carta.v) >= 10 && !carta.gelo) {
      ctx.save();
      rr(ctx, r.x, r.y, r.w, hf, R); ctx.clip();
      const u = ((op.t * 0.45) % 1.8) - 0.4, x = r.x + u * r.w;
      const g = ctx.createLinearGradient(x - r.w * 0.3, 0, x + r.w * 0.3, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, hf);
      ctx.restore();
    }
    if (carta.tipo === 'bomba') {
      const Rb = Math.min(r.w, hf) * 0.27, cx = 0, cy = r.y + hf * 0.6;
      const f = 0.6 + 0.4 * Math.abs(Math.sin(op.t * 16));
      ctx.save();
      ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 8;
      estrela(ctx, cx + Rb * 1.3, cy - Rb * 1.25, Rb * 0.42 * f, Rb * 0.14, 6); ctx.fillStyle = '#ffe680'; ctx.fill();
      ctx.restore();
    }
    // cartas de tras da fila um pouco apagadas
    if (op.fila && !op.frente) { rr(ctx, r.x, r.y, r.w, r.h, R); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill(); }
    if (op.destaque) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5; ctx.strokeStyle = `rgba(255,255,255,${0.5 + op.destaque * 0.6})`;
      rr(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, R + 2); ctx.stroke();
      ctx.restore();
    }
  },

  cadeado(ctx, a, c, e, t) {
    ctx.save();
    rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 14); ctx.fillStyle = 'rgba(60,35,140,0.24)'; ctx.fill();
    // correntes cromadas em X
    const elos = (x0, y0, x1, y1) => {
      const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), n = Math.floor(d / 9), ang = Math.atan2(dy, dx);
      for (let i = 0; i <= n; i++) {
        const x = x0 + (dx * i) / n, y = y0 + (dy * i) / n;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        if (i % 2) { ctx.strokeStyle = '#6f7888'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke(); }
        else {
          elipse(ctx, 0, 0, 6, 3.6); ctx.lineWidth = 2.6; ctx.strokeStyle = '#7b8494'; ctx.stroke();
          elipse(ctx, 0, -0.6, 5.2, 2.8); ctx.lineWidth = 1.2; ctx.strokeStyle = '#eef2f7'; ctx.stroke();
        }
        ctx.restore();
      }
    };
    elos(a.x + 4, a.y + 6, a.x + a.w - 4, a.y + a.h - 6);
    elos(a.x + a.w - 4, a.y + 6, a.x + 4, a.y + a.h - 6);
    // cadeado cromado
    const cx = a.x + a.w / 2, cy = a.y + a.h / 2, s = Math.min(a.w * 0.24, 16);
    ctx.lineWidth = s * 0.32; ctx.strokeStyle = '#aeb6c3';
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.4, s * 0.62, Math.PI, 0); ctx.stroke();
    ctx.shadowColor = 'rgba(30,20,80,0.4)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    const g = ctx.createLinearGradient(0, cy - s * 0.4, 0, cy + s * 0.9);
    g.addColorStop(0, '#f6f8fb'); g.addColorStop(0.5, '#aeb6c3'); g.addColorStop(1, '#e4e8ee');
    rr(ctx, cx - s, cy - s * 0.45, s * 2, s * 1.5, s * 0.35); ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent';
    circulo(ctx, cx, cy + 0.15 * s, s * 0.2); ctx.fillStyle = '#3d4350'; ctx.fill();
    ctx.fillRect(cx - s * 0.07, cy + 0.15 * s, s * 0.14, s * 0.42);
    ctx.restore();
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    poco(ctx, r, carga ? 1 : 0.6);
    if (!e.descarte) {
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${carga ? 0.85 : 0.4})`; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 9, cy + 2); ctx.lineTo(cx - 9, cy + 9); ctx.lineTo(cx + 9, cy + 9); ctx.lineTo(cx + 9, cy + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy - 9); ctx.moveTo(cx - 5, cy - 4); ctx.lineTo(cx, cy - 9); ctx.lineTo(cx + 5, cy - 4); ctx.stroke();
      ctx.restore();
    }
    // selo com as cargas
    const bx = r.x + r.w - 4, by = r.y + 4, br = 10;
    ctx.save();
    ctx.shadowColor = 'rgba(40,25,90,0.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2;
    const g = ctx.createLinearGradient(0, by - br, 0, by + br);
    if (carga) { g.addColorStop(0, '#8b7bff'); g.addColorStop(1, '#5137d6'); } else { g.addColorStop(0, '#b9b6c9'); g.addColorStop(1, '#8a87a0'); }
    circulo(ctx, bx, by, br); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    texto(ctx, String(e.descarteCarga), bx, by + 0.5, 12, '#ffffff', { fonte: FONTE });
  },

  hud(ctx, W, H, L, e, t) {
    const cy = 36;
    botao(ctx, 34, cy, 21, 'voltar');
    botao(ctx, W - 34, cy, 21, 'engrenagem');
    // pilula brilhante do placar
    const pw = Math.min(200, W * 0.44), ph = 46, px = W / 2 - pw / 2, py = cy - ph / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(40,25,90,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rr(ctx, px, py + 4, pw, ph, ph / 2); ctx.fillStyle = '#2a1f86'; ctx.fill();
    ctx.restore();
    const gp = ctx.createLinearGradient(0, py, 0, py + ph);
    gp.addColorStop(0, '#7f6bff'); gp.addColorStop(1, '#4b33d1');
    rr(ctx, px, py, pw, ph, ph / 2); ctx.fillStyle = gp; ctx.fill();
    ctx.save(); rr(ctx, px, py, pw, ph, ph / 2); ctx.clip();
    const gb = ctx.createLinearGradient(0, py, 0, py + ph * 0.5);
    gb.addColorStop(0, 'rgba(255,255,255,0.4)'); gb.addColorStop(1, 'rgba(255,255,255,0.04)');
    rr(ctx, px + 6, py + 3, pw - 12, ph * 0.45, ph * 0.22); ctx.fillStyle = gb; ctx.fill();
    ctx.restore();
    numero(ctx, String(e.pontos), W / 2, cy + 1, 26, '#2a1f86', 'center', pw - 30);
    // metas com barra brilhante
    const mw = Math.min(300, W - 64), mx = W / 2 - mw / 2;
    e.metas.forEach((m, k) => {
      const y = py + ph + 14 + k * 26;
      const txt = textoMeta(m);
      texto(ctx, txt, mx, y, 12, TINTA, { alinhar: 'left', fonte: FONTE, peso: 600, max: mw * 0.62 });
      const bx = mx + mw * 0.64, bw = mw * 0.36, bh = 10;
      rr(ctx, bx, y - bh / 2, bw, bh, bh / 2); ctx.fillStyle = 'rgba(60,35,140,0.18)'; ctx.fill();
      const u = Math.min(1, m.atual / m.alvo);
      if (u > 0) {
        const gm = ctx.createLinearGradient(0, y - bh / 2, 0, y + bh / 2);
        if (m.feita) { gm.addColorStop(0, '#8ff0b8'); gm.addColorStop(1, '#22b866'); } else { gm.addColorStop(0, '#ffe38a'); gm.addColorStop(1, '#ffac1c'); }
        rr(ctx, bx, y - bh / 2, Math.max(bh, bw * u), bh, bh / 2); ctx.fillStyle = gm; ctx.fill();
        rr(ctx, bx + 2, y - bh / 2 + 1.5, Math.max(0, bw * u - 4), bh * 0.32, bh * 0.2); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      }
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; rr(ctx, bx, y - bh / 2, bw, bh, bh / 2); ctx.stroke();
    });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 9), fy = L.mesa.y - 16, fw = 120, fh = 26;
      ctx.save();
      ctx.shadowColor = '#ffcf3a'; ctx.shadowBlur = 10 + k * 10;
      const gf = ctx.createLinearGradient(0, fy - fh / 2, 0, fy + fh / 2);
      gf.addColorStop(0, '#fff3b8'); gf.addColorStop(1, '#ffb21c');
      rr(ctx, W / 2 - fw / 2, fy - fh / 2, fw, fh, fh / 2); ctx.fillStyle = gf; ctx.fill();
      ctx.restore();
      numero(ctx, 'FEBRE ×2', W / 2, fy, 15, '#a35a00');
    }
  },

  efeito(fx, P) {
    switch (fx.tipo) {
      case 'pouso':
        P.anel(fx.x, fx.y, 'rgba(255,255,255,0.9)', 26, 0.35);
        P.estourar(fx.x, fx.y + 18, ['#ffffff'], 4, 0.3, { g: 120, vida: 0.4, tam: 4, forma: 'c' });
        return true;
      case 'fusao': {
        const n = Math.min(11, nivel(fx.valor));
        const cor = n >= 10 ? '#ffcf3a' : CORES[n];
        P.estourar(fx.x, fx.y, ['#ffffff', cor, clarear(cor, 0.4)], 8 + fx.degrau * 2, 0.55 + fx.degrau * 0.08, { forma: 'estrela', tam: 8, g: 180, vida: 0.55 });
        P.anel(fx.x, fx.y, rgba(cor, 0.9), 30 + fx.degrau * 5, 0.4);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, '×' + fx.degrau, '#ffffff', 22 + fx.degrau * 2, escurecer(cor, 0.4));
        return true;
      }
      case 'completar':
        P.estourar(fx.x, fx.y, ['#ffcf3a', '#fff3b8', '#ffffff'], 26, 1.3, { forma: 'estrela', tam: 11, g: 260, vida: 0.8 });
        P.anel(fx.x, fx.y, 'rgba(255,207,58,0.95)', 70, 0.55);
        P.texto(fx.x, fx.y - 34, String(fx.valor), '#ffffff', 34, '#a35a00');
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#ff4a5c', '#ffb347', '#ffffff'], 16, 1, { forma: 'estrela', tam: 8 });
        P.subir(fx.x, fx.y, ['rgba(255,255,255,0.55)', 'rgba(200,190,230,0.55)'], 6, { tam: 16, vida: 0.7, larg: 26 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#8a919d', '#4a515e', '#c9d0da'], 16, 1, { forma: 'q', tam: 7 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#8a919d', '#c9d0da'], 6, 0.5, { forma: 'q', tam: 5 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#e1f8ff', '#a8dcf5', '#ffffff'], 14, 0.8, { forma: 'q', tam: 6, g: 220 });
        P.anel(fx.x, fx.y, 'rgba(225,248,255,0.95)', 34, 0.4);
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#ffffff', '#cfd6e0'], 12, 0.8, { forma: 'estrela', tam: 8 });
        P.texto(fx.x, fx.y - 20, 'Livre!', '#ffffff', 22, TINTA);
        return true;
      case 'combo':
        P.texto(fx.x, fx.y - 44, `Combo ×${fx.n}`, '#ffe38a', 20, TINTA);
        return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    ctx.save();
    ctx.fillStyle = 'rgba(40,25,100,0.42)'; ctx.fillRect(0, 0, W, H);
    const pw = Math.min(300, W - 48), ph = 200, px = W / 2 - pw / 2, py = H * 0.4 - ph / 2;
    ctx.shadowColor = 'rgba(30,15,80,0.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    const g = ctx.createLinearGradient(0, py, 0, py + ph);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ebe5ff');
    rr(ctx, px, py, pw, ph, 26); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    const venceu = e.fim === 'venceu';
    texto(ctx, venceu ? 'Fase completa!' : 'Sem jogadas', W / 2, py + 40, 28, '#4b33d1', { fonte: FONTE });
    const n = venceu ? estrelasDe(e) : 0;
    for (let k = 0; k < 3; k++) {
      const x = W / 2 + (k - 1) * 46, y = py + 92 - (k === 1 ? 6 : 0), s = k === 1 ? 22 : 18;
      estrela(ctx, x, y, s, s * 0.48);
      if (k < n) {
        const gs = ctx.createLinearGradient(0, y - s, 0, y + s);
        gs.addColorStop(0, '#fff3b8'); gs.addColorStop(1, '#ffac1c');
        ctx.fillStyle = gs;
      } else ctx.fillStyle = '#d9d3ee';
      ctx.fill();
    }
    const bw = pw * 0.7, bh = 44, bx = W / 2 - bw / 2, by = py + ph - 66;
    ctx.save();
    ctx.shadowColor = 'rgba(20,90,50,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    const gb = ctx.createLinearGradient(0, by, 0, by + bh);
    gb.addColorStop(0, '#6ff0a4'); gb.addColorStop(1, '#1fae5b');
    rr(ctx, bx, by, bw, bh, bh / 2); ctx.fillStyle = gb; ctx.fill();
    ctx.restore();
    rr(ctx, bx + 6, by + 3, bw - 12, bh * 0.4, bh * 0.2); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    numero(ctx, 'Jogar de novo', W / 2, by + bh / 2, 18, '#137a3d');
  },
};

export default tema;
