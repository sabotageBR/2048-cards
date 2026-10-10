// Ideia de JOGABILIDADE (rodada 3): Duelo contra o Bot. Sua mesa embaixo, a
// do rival em miniatura em cima; os dois jogam ao mesmo tempo. Cada monte
// completo congela uma carta do outro lado; vence quem fizer 2 montes antes.
// Visual limpo, na linha da referencia: cartas lisas, uma mesa so, HUD minimo.
// Exporta tambem o desenho limpo de cartas e mesa (usado pela Corrida).
import { TAU, rr, circulo, texto, escurecer, clarear, rgba, estrela, nivel, clamp, semente } from '../kit.js';
import { criarPartida, jogar, acoesLegais } from '../../../src/jogo/partida.js';
import { melhorJogada } from '../../../src/jogo/bot.js';
import { calcularLayout } from '../../../src/render/layout.js';

export const FONTE_LIMPA = '"Ubuntu Sans", "Noto Sans", system-ui, sans-serif';
export const PALETA = ['#2f6fe0', '#c9a227', '#2fa35a', '#c23bb0', '#e0632f', '#8a4ce0', '#1fb5c4', '#e04a6a', '#5a8f2a', '#3b4fd8', '#e8b33a', '#dfe4f2'];
export const corValor = (v) => PALETA[Math.min(PALETA.length - 1, nivel(v))];
export const milhar = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const CIANO = '#3ad6ff';
const CORAL = '#ff5a6e';
const RITMO = 1600; // nivel 1: um pouco mais lento que um jogador atento

// ------------------------------------------------------------ desenho limpo (compartilhado)

function moldura(ctx, r, raio) { rr(ctx, r.x, r.y, r.w, r.h, raio); }

/** Gelo fino por cima de qualquer carta. */
function geloLimpo(ctx, r, raio) {
  ctx.save();
  moldura(ctx, r, raio); ctx.clip();
  ctx.fillStyle = 'rgba(190,236,255,0.40)'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(r.x + r.w * 0.1, r.y + r.h); ctx.lineTo(r.x + r.w * 0.55, r.y + r.h * 0.35); ctx.lineTo(r.x + r.w * 0.7, r.y);
  ctx.moveTo(r.x + r.w * 0.55, r.y + r.h * 0.35); ctx.lineTo(r.x + r.w, r.y + r.h * 0.5);
  ctx.moveTo(r.x, r.y + r.h * 0.45); ctx.lineTo(r.x + r.w * 0.3, r.y + r.h * 0.62);
  ctx.stroke();
  ctx.restore();
  moldura(ctx, { x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 }, raio); ctx.lineWidth = 2; ctx.strokeStyle = '#c8f2ff'; ctx.stroke();
  const fx = r.x + r.w - Math.max(8, r.w * 0.16), fy = r.y + Math.max(8, r.w * 0.16), s = Math.max(4, r.w * 0.08);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * s, fy - Math.sin(a) * s); ctx.lineTo(fx + Math.cos(a) * s, fy + Math.sin(a) * s); ctx.stroke();
  }
}

function indice(ctx, txt, r, cor, sombra = 'rgba(0,0,0,0.28)') {
  const tam = clamp(r.h * 0.2, 10, 30);
  texto(ctx, txt, r.x + r.w * 0.09, r.y + tam * 0.72 + r.h * 0.03, tam, cor, { alinhar: 'left', fonte: FONTE_LIMPA, peso: 700, max: r.w * 0.84, sombra });
}

function pedraLimpa(ctx, carta, r, raio) {
  moldura(ctx, r, raio);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, '#565b69'); g.addColorStop(1, '#2b2f39');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); moldura(ctx, r, raio); ctx.clip();
  const rnd = semente(31 + (carta.id | 0));
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const x = r.x + rnd() * r.w, y = r.y + rnd() * r.h;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3 + rnd() * 6, y + (rnd() - 0.5) * 3); ctx.stroke();
  }
  const perdido = 3 - clamp(carta.hp | 0, 0, 3);
  ctx.strokeStyle = 'rgba(10,10,16,0.85)'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
  const rach = [[0.3, 0.15, 0.45, 0.45, 0.35, 0.8], [0.7, 0.2, 0.55, 0.5, 0.7, 0.85], [0.15, 0.55, 0.4, 0.6, 0.6, 0.55]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(r.x + c[0] * r.w, r.y + c[1] * r.h); ctx.lineTo(r.x + c[2] * r.w, r.y + c[3] * r.h); ctx.lineTo(r.x + c[4] * r.w, r.y + c[5] * r.h); ctx.stroke();
  }
  ctx.restore();
  moldura(ctx, { x: r.x + 0.75, y: r.y + 0.75, w: r.w - 1.5, h: r.h - 1.5 }, raio); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(200,206,220,0.45)'; ctx.stroke();
  // pips de hp no canto e um contorno de rocha no meio
  const pr = Math.max(2.2, r.w * 0.035);
  for (let k = 0; k < 3; k++) {
    circulo(ctx, r.x + r.w * 0.14 + k * pr * 3, r.y + r.w * 0.14, pr);
    ctx.fillStyle = k < carta.hp ? '#e9edf5' : 'rgba(255,255,255,0.15)'; ctx.fill();
  }
  const cx = r.x + r.w / 2, cy = r.y + r.h * 0.55, s = r.w * 0.22;
  ctx.beginPath(); ctx.moveTo(cx - s, cy + s * 0.5); ctx.lineTo(cx - s * 0.7, cy - s * 0.4); ctx.lineTo(cx - s * 0.1, cy - s * 0.7); ctx.lineTo(cx + s * 0.8, cy - s * 0.3); ctx.lineTo(cx + s, cy + s * 0.5); ctx.closePath();
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.stroke();
}

function especialLimpo(ctx, carta, r, raio, op) {
  const borda = carta.tipo === 'coringa' ? '#ffffff' : carta.tipo === 'bomba' ? '#ff5a5a' : '#a77bff';
  ctx.save();
  ctx.shadowColor = rgba(borda, 0.55); ctx.shadowBlur = 10;
  moldura(ctx, r, raio);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, '#22263b'); g.addColorStop(1, '#131523');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  const cx = r.x + r.w / 2, cy = r.y + r.h * 0.56, s = Math.min(r.w, r.h) * 0.24;
  if (carta.tipo === 'coringa') {
    const arco = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    ['#ff5d73', '#ffb43f', '#ffe066', '#4fd18b', '#3fa7ff', '#a77bff'].forEach((c, i, a) => arco.addColorStop(i / (a.length - 1), c));
    moldura(ctx, { x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 }, raio); ctx.lineWidth = 2; ctx.strokeStyle = arco; ctx.stroke();
    estrela(ctx, cx, cy, s * 1.15, s * 0.5, 5, -Math.PI / 2 + Math.sin((op.t || 0) * 1.5) * 0.08); ctx.fillStyle = arco; ctx.fill();
    indice(ctx, '★', r, '#ffffff');
  } else if (carta.tipo === 'bomba') {
    moldura(ctx, { x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 }, raio); ctx.lineWidth = 2; ctx.strokeStyle = borda; ctx.stroke();
    ctx.strokeStyle = '#c9a36b'; ctx.lineWidth = Math.max(1.5, s * 0.14); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + s * 0.5, cy - s * 0.75); ctx.quadraticCurveTo(cx + s * 0.9, cy - s * 1.3, cx + s * 1.2, cy - s * 1.05); ctx.stroke();
    const k = 0.6 + 0.4 * Math.abs(Math.sin((op.t || 0) * 14));
    const brilho = ctx.createRadialGradient(cx + s * 1.2, cy - s * 1.05, 0, cx + s * 1.2, cy - s * 1.05, s * 0.6 * k);
    brilho.addColorStop(0, '#fff6c8'); brilho.addColorStop(0.4, '#ffb547'); brilho.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = brilho; circulo(ctx, cx + s * 1.2, cy - s * 1.05, s * 0.6 * k); ctx.fill();
    circulo(ctx, cx, cy, s); ctx.fillStyle = '#2c2d38'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke();
    circulo(ctx, cx - s * 0.35, cy - s * 0.35, s * 0.22); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
    indice(ctx, '!', r, '#ff8c8c');
  } else {
    moldura(ctx, { x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 }, raio); ctx.lineWidth = 2; ctx.strokeStyle = borda; ctx.stroke();
    const gv = ctx.createLinearGradient(0, cy - s, 0, cy + s);
    gv.addColorStop(0, '#e2d4ff'); gv.addColorStop(1, '#9a6bff');
    texto(ctx, '×2', cx, cy, s * 1.7, gv, { fonte: FONTE_LIMPA, peso: 800 });
    indice(ctx, '×2', r, '#d9c8ff');
  }
}

/**
 * Carta limpa: lisa, cor do valor, borda de luz, numero no canto (como a
 * referencia), brilho de vidro e numero d'agua grande no canto de baixo.
 */
export function cartaLimpa(ctx, carta, r, op = {}) {
  const raio = Math.max(4, r.w * 0.11);
  if (carta.tipo === 'pedra') return pedraLimpa(ctx, carta, r, raio);
  if (carta.tipo !== 'normal') { especialLimpo(ctx, carta, r, raio, op); destacar(ctx, r, raio, op); return; }
  const v = carta.v, cor = corValor(v);
  const ouro = v === 2048, plat = v >= 4096;
  ctx.save();
  ctx.shadowColor = rgba(ouro ? '#ffcf5a' : cor, ouro || plat ? 0.8 : 0.42); ctx.shadowBlur = ouro || plat ? 16 : 9; ctx.shadowOffsetY = 1;
  moldura(ctx, r, raio);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  if (ouro) { g.addColorStop(0, '#ffe39a'); g.addColorStop(0.55, '#e8b33a'); g.addColorStop(1, '#a3701b'); }
  else if (plat) { g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#d3d9ee'); g.addColorStop(1, '#8f99be'); }
  else { g.addColorStop(0, clarear(cor, 0.1)); g.addColorStop(1, escurecer(cor, 0.34)); }
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.save(); moldura(ctx, r, raio); ctx.clip();
  const gl = ctx.createLinearGradient(r.x, r.y, r.x + r.w * 0.7, r.y + r.h * 0.55);
  gl.addColorStop(0, 'rgba(255,255,255,0.2)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.05)'); gl.addColorStop(0.51, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl; ctx.fillRect(r.x, r.y, r.w, r.h);
  if (plat) {
    const pr = ctx.createLinearGradient(r.x, r.y + r.h, r.x + r.w, r.y);
    ['rgba(255,93,115,0.25)', 'rgba(255,224,102,0.25)', 'rgba(79,209,139,0.25)', 'rgba(63,167,255,0.25)', 'rgba(167,123,255,0.25)'].forEach((c, i, a) => pr.addColorStop(i / (a.length - 1), c));
    ctx.fillStyle = pr; ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  texto(ctx, String(v), r.x + r.w * 0.93, r.y + r.h * 0.8, Math.min(r.h * 0.34, r.w * 0.5), ouro || plat ? 'rgba(80,50,10,0.16)' : 'rgba(255,255,255,0.1)', { alinhar: 'right', fonte: FONTE_LIMPA, peso: 800, max: r.w * 0.86 });
  ctx.restore();
  moldura(ctx, { x: r.x + 0.75, y: r.y + 0.75, w: r.w - 1.5, h: r.h - 1.5 }, raio);
  ctx.lineWidth = 1.5; ctx.strokeStyle = ouro ? '#fff1bf' : plat ? '#ffffff' : rgba(clarear(cor, 0.5), 0.9); ctx.stroke();
  indice(ctx, String(v), r, ouro || plat ? '#3a2606' : '#ffffff', ouro || plat ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)');
  if (carta.gelo) geloLimpo(ctx, r, raio);
  destacar(ctx, r, raio, op);
}

function destacar(ctx, r, raio, op) {
  if (!op.destaque) return;
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 12 * op.destaque;
  moldura(ctx, { x: r.x - 2, y: r.y - 2, w: r.w + 4, h: r.h + 4 }, raio + 2);
  ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * op.destaque})`; ctx.stroke();
  ctx.restore();
}

/** Mesa limpa: painel escuro translucido com borda de luz e losangos sutis. */
export function mesaLimpa(ctx, L, e, acento) {
  const m = L.mesa, raio = L.pad * 1.2;
  ctx.save();
  ctx.shadowColor = rgba(acento, 0.5); ctx.shadowBlur = 24;
  rr(ctx, m.x, m.y, m.w, m.h, raio); ctx.fillStyle = 'rgba(13,12,30,0.74)'; ctx.fill();
  ctx.restore();
  ctx.save(); rr(ctx, m.x, m.y, m.w, m.h, raio); ctx.clip();
  ctx.strokeStyle = rgba(acento, 0.05); ctx.lineWidth = 1;
  for (let d = -m.h; d < m.w + m.h; d += 18) {
    ctx.beginPath(); ctx.moveTo(m.x + d, m.y); ctx.lineTo(m.x + d + m.h, m.y + m.h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m.x + d + m.h, m.y); ctx.lineTo(m.x + d, m.y + m.h); ctx.stroke();
  }
  ctx.restore();
  rr(ctx, m.x, m.y, m.w, m.h, raio); ctx.lineWidth = 2; ctx.strokeStyle = rgba(acento, 0.85); ctx.stroke();
  rr(ctx, m.x + 4, m.y + 4, m.w - 8, m.h - 8, raio - 3); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke();
  for (let c = 0; c < L.colunas; c++) {
    if (e.colunas[c].length) continue;
    const s = L.carta(c, 0);
    rr(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, Math.max(4, s.w * 0.11));
    ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke(); ctx.setLineDash([]);
  }
}

/** Slot do descarte: tracejado com o icone de "subir", como na referencia. */
export function descarteLimpo(ctx, r, e, acento) {
  const carga = e.descarteCarga > 0;
  const a = carga ? 0.55 : 0.2;
  rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, Math.max(4, r.w * 0.11));
  ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.stroke(); ctx.setLineDash([]);
  if (!e.descarte) {
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.5, s = r.w * 0.2;
    ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    rr(ctx, cx - s, cy - s * 1.1, s * 2, s * 2.2, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.6); ctx.lineTo(cx, cy - s * 0.4); ctx.moveTo(cx - s * 0.45, cy); ctx.lineTo(cx, cy - s * 0.45); ctx.lineTo(cx + s * 0.45, cy); ctx.stroke();
  }
  if (e.descarteCarga > 1) texto(ctx, '×' + e.descarteCarga, r.x + r.w / 2, r.y + r.h + 12, 12, acento, { fonte: FONTE_LIMPA, peso: 700 });
}

/** Coluna trancada: veu escuro, hachura fina, cadeado e o gatilho. */
export function cadeadoLimpo(ctx, a, c, e) {
  ctx.save();
  rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 8); ctx.fillStyle = 'rgba(6,7,18,0.66)'; ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let d = -a.h; d < a.w + a.h; d += 9) { ctx.beginPath(); ctx.moveTo(a.x + d, a.y); ctx.lineTo(a.x + d - a.h, a.y + a.h); ctx.stroke(); }
  ctx.restore();
  const cx = a.x + a.w / 2, cy = a.y + Math.min(a.h * 0.4, a.w * 1.2), s = a.w * 0.2;
  ctx.strokeStyle = '#e9edf5'; ctx.lineWidth = Math.max(2, s * 0.22); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy - s * 0.2, s * 0.62, Math.PI, 0); ctx.stroke();
  rr(ctx, cx - s, cy - s * 0.2, s * 2, s * 1.5, s * 0.3); ctx.fillStyle = '#e9edf5'; ctx.fill();
  circulo(ctx, cx, cy + s * 0.45, s * 0.2); ctx.fillStyle = '#1b1d2c'; ctx.fill();
  const g = e.cadeados[c];
  const txt = g && g.tipo === 'valor' ? `faça ${g.v}` : g && g.tipo === 'montes' ? 'faça 1 monte' : 'trancada';
  texto(ctx, txt, cx, cy + s * 2.1, Math.max(10, a.w * 0.16), 'rgba(233,237,245,0.8)', { fonte: FONTE_LIMPA, peso: 600, max: a.w + 10 });
}

/** Formas de particula do visual limpo (registradas uma vez por sistema). */
export function registrarFormas(P) {
  if (P.formas.rotulo) return;
  P.formas.rotulo = (ctx, p) => {
    ctx.font = `700 ${Math.round(p.tam)}px ${FONTE_LIMPA}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 6;
    ctx.fillStyle = p.cor; ctx.fillText(p.txt, 0, 0);
  };
  P.formas.risco = (ctx, p, u) => {
    ctx.strokeStyle = p.cor; ctx.lineWidth = Math.max(1, 2 * (1 - u)); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-p.tam / 2, 0); ctx.lineTo(p.tam / 2, 0); ctx.stroke();
  };
  P.formas.lasca = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.stroke();
  };
  P.formas.feixe = (ctx, p, u) => {
    const w = p.tam * (1 - u * 0.6);
    const g = ctx.createLinearGradient(0, 0, 0, -p.alt);
    g.addColorStop(0, rgba(p.cor, 0.85)); g.addColorStop(1, rgba(p.cor, 0));
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -p.alt, w, p.alt);
  };
}

export function rotuloSobe(P, x, y, txt, cor, tam = 18) {
  P.add({ forma: 'rotulo', x, y, vy: -52, g: 0, arrasto: 1, vida: 0.95, tam, cor, txt });
}

/** Faiscas em risco saindo do ponto (elegantes, poucas). */
export function riscos(P, x, y, cor, n = 8, forca = 1) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + i * 0.37, v = (110 + (i % 3) * 40) * forca;
    P.add({ forma: 'risco', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, arrasto: 0.9, vida: 0.38, tam: 7 + (i % 2) * 4, cor, rot: a });
  }
}

/** Efeitos limpos comuns (devolve true se tratou). */
export function efeitoLimpo(fx, P, acento) {
  registrarFormas(P);
  switch (fx.tipo) {
    case 'pouso': P.anel(fx.x, fx.y, 'rgba(255,255,255,0.45)', 22, 0.3); return true;
    case 'fusao': {
      const cor = corValor(fx.valor);
      P.anel(fx.x, fx.y, clarear(cor, 0.3), 26 + fx.degrau * 6, 0.42);
      riscos(P, fx.x, fx.y, clarear(cor, 0.45), 6 + fx.degrau * 2, 0.8 + fx.degrau * 0.15);
      if (fx.degrau > 1) rotuloSobe(P, fx.x, fx.y - 18, '×' + fx.degrau, '#ffffff', 16 + fx.degrau * 2);
      return true;
    }
    case 'completar':
      P.add({ forma: 'feixe', x: fx.x, y: fx.y + 20, vida: 0.55, tam: 26, alt: 220, cor: '#ffd36b' });
      P.estourar(fx.x, fx.y, ['#ffe39a', '#ffffff'], 16, 1, { forma: 'c', tam: 4, g: 140, vida: 0.7 });
      rotuloSobe(P, fx.x, fx.y - 30, 'MONTE!', '#ffd36b', 22);
      return true;
    case 'explodir':
      P.anel(fx.x, fx.y, '#ff7a7a', 46, 0.4);
      P.estourar(fx.x, fx.y, ['#c9ced6', '#8a8f98', '#ffb547'], 14, 1, { forma: 'q', tam: 4, g: 300 });
      return true;
    case 'pedra': P.estourar(fx.x, fx.y, ['#9aa0ab', '#5d626d'], 14, 1, { forma: 'q', tam: 4, g: 420 }); return true;
    case 'racha': P.estourar(fx.x, fx.y, ['#9aa0ab', '#5d626d'], 5, 0.6, { forma: 'q', tam: 3, g: 420 }); return true;
    case 'gelo':
      P.estourar(fx.x, fx.y, ['#dff6ff', '#9fdcff'], 10, 0.7, { forma: 'lasca', tam: 7, g: 160, vida: 0.7 });
      return true;
    case 'cadeado': P.anel(fx.x, fx.y, acento, 40, 0.5); rotuloSobe(P, fx.x, fx.y, 'aberto', acento, 16); return true;
    case 'combo': rotuloSobe(P, fx.x, fx.y - 40, `COMBO ×${fx.n}`, '#ffffff', 16); return true;
    default: return false;
  }
}

// ------------------------------------------------------------ duelo

const FASE_DUELO = {
  id: 1, mundo: 1, modo: 'duelo', semente: 4242,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.05, bomba: 0.03, dobro: 0.03 } },
  inicio: [[1024, 512, 256], [128, 64], [16, 8], []],
  obst: { pedras: { 3: 2 }, gelo: { 2: [4] } },
  metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 0, 0],
};

let vitrineAtual = false;
let placar = [0, 0];
let motivoFim = '';

const carta = (id, v, extra = {}) => ({ id, tipo: 'normal', v, cor: 0, ...extra });

function rivalInicial(semente) {
  const r = criarPartida({}, FASE_DUELO, (semente * 7 + 13) >>> 0);
  if (!vitrineAtual) return r;
  return {
    ...r, montes: 1, pontos: 15872,
    metas: r.metas.map((m) => ({ ...m, atual: 1 })),
    colunas: [[carta(5001, 512), carta(5002, 256), carta(5003, 128), carta(5004, 64)], [carta(5005, 32), carta(5006, 16, { gelo: true })], [carta(5007, 1024), carta(5008, 8)], [carta(5009, 4)]],
    fila: [{ id: 5101, tipo: 'dobro', v: 0, cor: 0 }, carta(5102, 8), carta(5103, 2)],
  };
}

function maiorValor(e) {
  let m = 0;
  for (const col of e.colunas) for (const k of col) if (k.tipo === 'normal' && k.v > m) m = k.v;
  return m;
}
const progresso = (e) => e.montes + 0.9 * clamp(Math.log2(Math.max(2, maiorValor(e))) / 11);

/** Congela o topo normal da coluna mais alta; devolve { e, c } (c = -1 se nao deu). */
function congelarTopo(e) {
  let melhor = -1, n = -1;
  e.colunas.forEach((col, c) => {
    const t = col[col.length - 1];
    if (!t || t.tipo !== 'normal' || t.gelo || e.cadeados[c]) return;
    if (col.length > n) { n = col.length; melhor = c; }
  });
  if (melhor < 0) return { e, c: -1 };
  const colunas = e.colunas.slice();
  const col = colunas[melhor].slice();
  col[col.length - 1] = { ...col[col.length - 1], gelo: true };
  colunas[melhor] = col;
  return { e: { ...e, colunas }, c: melhor };
}

/** Sobra lateral da mesa em paisagem (decide se o rival cabe ao lado). */
function ladoLivre(W, H) {
  const L = calcularLayout({ W, H, topo: 98, base: 0, colunas: 4, pilhaMax: 5, tamFila: 3 });
  return Math.max(L.mesa.x, W - (L.fila.x + L.fila.w)) - 28;
}
const rivalAoLado = (W, H) => W > H * 1.15 && ladoLivre(W, H) >= 200;

/** Geometria da mesa do rival (miniatura): ao lado na paisagem larga; senao, na faixa de cima. */
function geoRival(W, H, L) {
  let area;
  if (L.topo < 150) {
    const esq = L.mesa.x - 28, dir = W - (L.fila.x + L.fila.w) - 28;
    const x = esq >= dir ? 12 : L.fila.x + L.fila.w + 16;
    area = { x, y: L.mesa.y, w: Math.max(90, Math.max(esq, dir)), h: Math.min(L.mesa.h, 300) };
  } else area = { x: 12, y: 84, w: W - 24, h: L.topo - 84 - 6 };
  const cols = 4, pad = 8, gap = 6, cabec = 30;
  let cw = Math.min(36, (area.w - 2 * pad - cols * gap - 8) / (cols + 1));
  let ch = cw / 0.72, step = ch * 0.24;
  const altCol = ch + (L.pilhaMax - 1) * step;
  const disp = area.h - cabec - 2 * pad;
  if (altCol > disp) { const k = disp / altCol; cw *= k; ch *= k; step *= k; }
  const largMesa = cols * cw + (cols - 1) * gap + 2 * pad;
  const largTotal = largMesa + gap * 2 + cw;
  const x0 = Math.round(area.x + (area.w - largTotal) / 2);
  const y0 = Math.round(area.y + cabec);
  return {
    area, cw, ch, step,
    mesa: { x: x0, y: y0, w: largMesa, h: ch + (L.pilhaMax - 1) * step + 2 * pad },
    carta: (c, i) => ({ x: x0 + pad + c * (cw + gap), y: y0 + pad + i * step, w: cw, h: ch }),
    fila: { x: x0 + largMesa + gap * 2, y: y0 + pad, w: cw, h: ch },
    nome: { x: x0, y: area.y + 12, w: largTotal },
  };
}

function miniCarta(ctx, k, r) {
  const raio = Math.max(3, r.w * 0.14);
  rr(ctx, r.x, r.y, r.w, r.h, raio);
  if (k.tipo === 'pedra') { ctx.fillStyle = '#41454f'; ctx.fill(); return; }
  if (k.tipo !== 'normal') {
    ctx.fillStyle = '#1c1f31'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = k.tipo === 'coringa' ? '#ffffff' : k.tipo === 'bomba' ? '#ff5a5a' : '#a77bff'; ctx.stroke();
    texto(ctx, k.tipo === 'coringa' ? '★' : k.tipo === 'bomba' ? '!' : '×2', r.x + r.w / 2, r.y + r.h * 0.5, r.w * 0.42, '#ffffff', { fonte: FONTE_LIMPA, peso: 700 });
    return;
  }
  const cor = k.v >= 2048 ? '#e8b33a' : corValor(k.v);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, clarear(cor, 0.08)); g.addColorStop(1, escurecer(cor, 0.3));
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = rgba(clarear(cor, 0.5), 0.85); ctx.stroke();
  texto(ctx, String(k.v), r.x + r.w * 0.1, r.y + Math.max(5, r.h * 0.13), Math.max(7, r.h * 0.2), '#ffffff', { alinhar: 'left', fonte: FONTE_LIMPA, peso: 700, max: r.w * 0.82 });
  if (k.gelo) { rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.fillStyle = 'rgba(190,236,255,0.45)'; ctx.fill(); ctx.strokeStyle = '#c8f2ff'; ctx.lineWidth = 1.4; ctx.stroke(); }
}

function pontos3(ctx, x, y, n, cor, dir = 1) {
  for (let k = 0; k < 2; k++) {
    circulo(ctx, x + dir * k * 13, y, 4.5);
    if (k < n) { ctx.fillStyle = cor; ctx.fill(); } else { ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(cor, 0.6); ctx.stroke(); }
  }
}

/** Projetil de gelo de (x0, y0) a (x1, y1) em `vida` segundos. */
function disparar(P, x0, y0, x1, y1, cor, vida = 0.45) {
  registrarFormas(P);
  const vx = (x1 - x0) / vida, vy = (y1 - y0) / vida;
  P.add({ forma: 'lasca', x: x0, y: y0, vx, vy, g: 0, arrasto: 1, vida, tam: 16, cor, rot: Math.atan2(vy, vx) + Math.PI / 2 });
  for (let i = 1; i <= 6; i++) {
    const k = 1 - i * 0.07;
    P.add({ forma: 'c', x: x0, y: y0, vx: vx * k, vy: vy * k, g: 0, arrasto: 1, vida: vida / k, tam: 7 - i * 0.6, cor: i % 2 ? '#ffffff' : cor });
  }
}

function centro(r) { return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }

const tema = {
  id: 'rival',
  nome: 'Duelo contra o Bot',
  cores: { texto: '#ffffff', destaque: CIANO, particulas: [CIANO, '#ffffff'] },
  faixas: (W, H) => (rivalAoLado(W, H) ? { topo: 98, base: 0 } : { topo: 238, base: 0 }),

  fundo(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0d24'); g.addColorStop(0.5, '#131034'); g.addColorStop(1, '#1b0e2c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rnd = semente(9);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.04 + rnd() * 0.12})`; circulo(ctx, rnd() * W, rnd() * H * 0.7, rnd() * 1.2 + 0.3); ctx.fill(); }
    // grade em perspectiva bem sutil no rodape, como na referencia
    const hy = H * 0.82;
    ctx.strokeStyle = 'rgba(140,110,255,0.07)'; ctx.lineWidth = 1;
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 18, hy); ctx.lineTo(W / 2 + i * 120, H); ctx.stroke(); }
    for (let k = 0; k < 7; k++) { const y = hy + Math.pow(k / 6, 1.8) * (H - hy); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  },

  mesa(ctx, L, e) { mesaLimpa(ctx, L, e, CIANO); },
  peca(ctx, k, r, op) { cartaLimpa(ctx, k, r, op); },
  cadeado(ctx, a, c, e) { cadeadoLimpo(ctx, a, c, e); },
  descarte(ctx, r, e) { descarteLimpo(ctx, r, e, CIANO); },
  fila(ctx, L) {
    const p = L.filaPos(0);
    texto(ctx, 'sua próxima', p.x + p.w / 2, p.y - 12, 11, 'rgba(255,255,255,0.5)', { fonte: FONTE_LIMPA, peso: 600 });
  },

  hud(ctx, W, H, L, e, t, mem) {
    const agora = t * 1000;
    const r = mem.rival;
    const mr = r ? r.montes : 0;
    placar = [e.montes, mr];
    // placar de versus
    const x0 = 12, w = W - 24, y = 12, h = 44;
    rr(ctx, x0, y, w, h, 14); ctx.fillStyle = 'rgba(12,12,32,0.78)'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke();
    texto(ctx, 'VOCÊ', x0 + 14, y + h / 2, 13, CIANO, { alinhar: 'left', fonte: FONTE_LIMPA, peso: 800 });
    pontos3(ctx, x0 + 64, y + h / 2, e.montes, CIANO, 1);
    texto(ctx, 'RIVAL', x0 + w - 14, y + h / 2, 13, CORAL, { alinhar: 'right', fonte: FONTE_LIMPA, peso: 800 });
    pontos3(ctx, x0 + w - 70, y + h / 2, mr, CORAL, -1);
    const bx = x0 + 94, bw = w - 188, by = y + h / 2 - 4;
    const pj = progresso(e), pr = r ? progresso(r) : 0.01;
    const f = clamp(pj / Math.max(0.01, pj + pr), 0.06, 0.94);
    rr(ctx, bx, by, bw, 8, 4); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    const gj = ctx.createLinearGradient(bx, 0, bx + bw * f, 0); gj.addColorStop(0, rgba(CIANO, 0.35)); gj.addColorStop(1, CIANO);
    rr(ctx, bx, by, bw * f, 8, 4); ctx.fillStyle = gj; ctx.fill();
    const gr = ctx.createLinearGradient(bx + bw * f, 0, bx + bw, 0); gr.addColorStop(0, CORAL); gr.addColorStop(1, rgba(CORAL, 0.35));
    rr(ctx, bx + bw * f, by, bw * (1 - f), 8, 4); ctx.fillStyle = gr; ctx.fill();
    const sx = bx + bw * f;
    ctx.save(); ctx.translate(sx, by + 4); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -6, 12, 12); ctx.restore();
    texto(ctx, 'VS', sx, by + 4.5, 7, '#141432', { fonte: FONTE_LIMPA, peso: 800 });
    texto(ctx, `${milhar(e.pontos)} pts`, x0 + 14, y + h + 12, 11, 'rgba(255,255,255,0.55)', { alinhar: 'left', fonte: FONTE_LIMPA, peso: 600 });
    if (r) texto(ctx, `${milhar(r.pontos)} pts`, x0 + w - 14, y + h + 12, 11, 'rgba(255,255,255,0.55)', { alinhar: 'right', fonte: FONTE_LIMPA, peso: 600 });

    // mesa do rival em miniatura
    if (r) {
      const G = geoRival(W, H, L);
      const n = G.nome;
      const anel = mem.proxRival ? clamp(1 - (mem.proxRival - agora) / RITMO) : 0;
      circulo(ctx, n.x + 10, n.y, 9); ctx.fillStyle = 'rgba(255,90,110,0.15)'; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x + 10, n.y, 9, -Math.PI / 2, -Math.PI / 2 + anel * TAU); ctx.lineWidth = 2; ctx.strokeStyle = CORAL; ctx.stroke();
      texto(ctx, 'R', n.x + 10, n.y + 0.5, 10, CORAL, { fonte: FONTE_LIMPA, peso: 800 });
      texto(ctx, 'Rival · nível 1', n.x + 26, n.y, 12, '#ffffff', { alinhar: 'left', fonte: FONTE_LIMPA, peso: 700 });
      const jogou = mem.ultimoRival && agora - mem.ultimoRival.t < 450;
      const status = e.fim ? '' : jogou ? 'jogou' : 'pensando' + '.'.repeat(1 + (Math.floor(t * 3) % 3));
      texto(ctx, status, n.x + n.w, n.y, 11, 'rgba(255,255,255,0.5)', { alinhar: 'right', fonte: FONTE_LIMPA, peso: 600 });
      const m = G.mesa;
      ctx.save();
      ctx.shadowColor = rgba(CORAL, 0.35); ctx.shadowBlur = 14;
      rr(ctx, m.x, m.y, m.w, m.h, 10); ctx.fillStyle = 'rgba(14,10,28,0.8)'; ctx.fill();
      ctx.restore();
      rr(ctx, m.x, m.y, m.w, m.h, 10); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(CORAL, 0.75); ctx.stroke();
      r.colunas.forEach((col, c) => {
        const flash = (mem.flashRival && mem.flashRival.c === c && agora - mem.flashRival.t < 600) || (mem.ultimoRival && mem.ultimoRival.c === c && agora - mem.ultimoRival.t < 350);
        if (flash) { const a = G.carta(c, 0); rr(ctx, a.x - 3, a.y - 3, a.w + 6, G.ch + 4 * G.step + 6, 6); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(); }
        if (!col.length) { const a = G.carta(c, 0); rr(ctx, a.x, a.y, a.w, a.h, 4); ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke(); ctx.setLineDash([]); }
        col.forEach((k, i) => miniCarta(ctx, k, G.carta(c, i)));
      });
      if (r.fila[0]) miniCarta(ctx, r.fila[0], G.fila);
      texto(ctx, 'próxima', G.fila.x + G.fila.w / 2, G.fila.y + G.fila.h + 9, 8.5, 'rgba(255,255,255,0.45)', { fonte: FONTE_LIMPA, peso: 600 });
    }

    // aviso curto
    if (mem.aviso && agora - mem.aviso.t < 1400) {
      const u = (agora - mem.aviso.t) / 1400;
      ctx.save();
      ctx.globalAlpha = u < 0.15 ? u / 0.15 : u > 0.75 ? (1 - u) / 0.25 : 1;
      const ay = L.mesa.y - 16;
      ctx.font = `700 14px ${FONTE_LIMPA}`;
      const tw = ctx.measureText(mem.aviso.txt).width + 28;
      rr(ctx, W / 2 - tw / 2, ay - 13, tw, 26, 13); ctx.fillStyle = rgba(mem.aviso.cor, 0.18); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(mem.aviso.cor, 0.7); ctx.stroke();
      texto(ctx, mem.aviso.txt, W / 2, ay, 14, '#ffffff', { fonte: FONTE_LIMPA, peso: 700 });
      ctx.restore();
    }
  },

  efeito(fx, P) { return efeitoLimpo(fx, P, CIANO); },

  fim(ctx, W, H, e) {
    const venceu = e.fim === 'venceu';
    const cor = venceu ? CIANO : CORAL;
    ctx.save();
    ctx.fillStyle = 'rgba(5,6,18,0.7)'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(W - 40, 340), h = 178, x = W / 2 - w / 2, y = H * 0.4 - h / 2;
    ctx.shadowColor = rgba(cor, 0.5); ctx.shadowBlur = 26;
    rr(ctx, x, y, w, h, 18); ctx.fillStyle = 'rgba(16,15,38,0.96)'; ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, x, y, w, h, 18); ctx.lineWidth = 2; ctx.strokeStyle = cor; ctx.stroke();
    const titulo = venceu ? 'Você venceu!' : e.fim === 'perdeu' ? 'O rival venceu' : 'Sem jogadas';
    texto(ctx, titulo, W / 2, y + 46, 28, cor, { fonte: FONTE_LIMPA, peso: 800 });
    texto(ctx, `${placar[0]}  ×  ${placar[1]}`, W / 2, y + 92, 34, '#ffffff', { fonte: FONTE_LIMPA, peso: 700 });
    const porque = motivoFim === 'rivalTravou' ? 'a mesa do rival travou' : e.fim === 'mesaCheia' ? 'sua mesa travou' : '';
    if (porque) texto(ctx, porque, W / 2, y + 122, 12, 'rgba(255,255,255,0.55)', { fonte: FONTE_LIMPA, peso: 600 });
    texto(ctx, 'toque para a revanche', W / 2, y + (porque ? 150 : 140), 14, 'rgba(255,255,255,0.7)', { fonte: FONTE_LIMPA, peso: 600 });
    ctx.restore();
  },

  jogo: {
    novaPartida(semente, vitrine) {
      vitrineAtual = !!vitrine;
      if (!vitrine) return criarPartida({}, FASE_DUELO, semente);
      const e = criarPartida({}, {
        ...FASE_DUELO, semente: 7,
        inicio: [[1024, 512], [32, 16], [8], [64]],
        obst: { pedras: { 3: 3 }, gelo: { 2: [4] }, cadeados: { 1: { tipo: 'valor', v: 256 } } },
      }, 7);
      return {
        ...e, pontos: 2480,
        fila: [carta(901, 512), { id: 902, tipo: 'coringa', v: 0, cor: 0 }, { id: 903, tipo: 'bomba', v: 0, cor: 0 }],
        descarte: carta(904, 2),
      };
    },

    aoIniciar(inst) {
      const m = inst.mem;
      m.rival = rivalInicial(inst.e.rng || 1);
      m.agenda = [];
      m.proxRival = undefined;
      m.aviso = null;
      motivoFim = '';
    },

    aoJogar(inst, antes, r, acao, agora) {
      const ev = r.eventos.find((x) => x.tipo === 'completar');
      if (!ev) return null;
      // dispara quando o monte sai na tela (voo + degraus da cascata)
      const deg = r.eventos.reduce((d, x) => (x.tipo === 'fundir' ? Math.max(d, x.degrau) : d), 1);
      inst.mem.agenda.push({ t: agora + 180 + deg * 140 + 80, tipo: 'disparo', de: 'voce', c: ev.c });
      return null;
    },

    aoPasso(inst, agora) {
      const m = inst.mem;
      if (!m.rival) return;
      const L = inst.Lt;
      const G = geoRival(inst.W, inst.H, L);
      // agenda: disparos e impactos de gelo
      const prontos = m.agenda.filter((a) => a.t <= agora);
      m.agenda = m.agenda.filter((a) => a.t > agora);
      for (const a of prontos) {
        if (a.tipo === 'disparo') {
          if (a.de === 'voce') {
            const alvo = Math.max(0, congelarTopo(m.rival).c);
            const o = centro(L.coluna(a.c));
            const col = m.rival.colunas[alvo];
            const d = centro(G.carta(alvo, Math.max(0, col.length - 1)));
            disparar(inst.part, o.x, L.coluna(a.c).y, d.x, d.y, CIANO);
            m.agenda.push({ t: agora + 450, tipo: 'impacto', em: 'rival' });
          } else {
            const alvo = Math.max(0, congelarTopo(inst.e).c);
            const col = inst.e.colunas[alvo];
            const d = centro(L.carta(alvo, Math.max(0, col.length - 1)));
            const o = centro(G.carta(a.c, 0));
            disparar(inst.part, o.x, o.y, d.x, d.y, CORAL);
            m.agenda.push({ t: agora + 450, tipo: 'impacto', em: 'voce' });
          }
        } else if (a.tipo === 'impacto') {
          if (a.em === 'rival') {
            const res = congelarTopo(m.rival);
            m.rival = res.e;
            if (res.c >= 0) {
              const col = m.rival.colunas[res.c];
              const p = centro(G.carta(res.c, col.length - 1));
              inst.part.estourar(p.x, p.y, ['#dff6ff', '#9fdcff', '#ffffff'], 12, 0.6, { forma: 'lasca', tam: 6, g: 120, vida: 0.6 });
              m.flashRival = { c: res.c, t: agora };
            }
            m.aviso = { txt: res.c >= 0 ? 'Rival congelado!' : 'O rival escapou', cor: CIANO, t: agora };
          } else if (!inst.e.fim) {
            const res = congelarTopo(inst.e);
            inst.e = res.e;
            if (res.c >= 0) {
              const col = inst.e.colunas[res.c];
              const p = centro(L.carta(res.c, col.length - 1));
              inst.part.estourar(p.x, p.y, ['#dff6ff', '#9fdcff', '#ffffff'], 16, 0.8, { forma: 'lasca', tam: 8, g: 140, vida: 0.7 });
            }
            m.aviso = { txt: res.c >= 0 ? 'Você foi congelado!' : 'Escapou do gelo', cor: CORAL, t: agora };
            if (!acoesLegais(inst.e).length) { inst.e = { ...inst.e, fim: 'mesaCheia' }; inst.fimEm = agora; }
          }
        }
      }
      // o rival joga no proprio ritmo enquanto ninguem venceu
      if (m.proxRival === undefined) m.proxRival = agora + (vitrineAtual ? 3200 : RITMO);
      if (inst.e.fim || m.rival.fim === 'venceu' || agora < m.proxRival) return;
      m.proxRival = agora + RITMO;
      // regra simetrica: quem trava a mesa perde (o rival tambem nao tem "continuar")
      const a = m.rival.fim ? null : melhorJogada(m.rival, agora);
      if (!a) {
        motivoFim = 'rivalTravou';
        m.aviso = { txt: 'A mesa do rival travou!', cor: CIANO, t: agora };
        inst.e = { ...inst.e, fim: 'venceu' }; inst.fimEm = agora;
        return;
      }
      const res = jogar(m.rival, { ...a, t: agora });
      m.rival = res.estado;
      m.ultimoRival = { c: a.c ?? -1, t: agora };
      const comp = res.eventos.find((x) => x.tipo === 'completar');
      if (comp) m.agenda.push({ t: agora, tipo: 'disparo', de: 'rival', c: comp.c });
      if (m.rival.fim === 'venceu') { inst.e = { ...inst.e, fim: 'perdeu' }; inst.fimEm = agora; }
      else if (m.rival.fim === 'mesaCheia') { motivoFim = 'rivalTravou'; inst.e = { ...inst.e, fim: 'venceu' }; inst.fimEm = agora; }
    },
  },
};

export default tema;
