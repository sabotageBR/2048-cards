// Mundo 3 (Elementos): Neve. Noite de inverno: lua, estrelas, montanhas com
// neve, pinheiros e a aurora que ondula; neve caindo. Carta de porcelana
// (o numero e um fio na cor do valor, borda gelada); mesa de gelo com o miolo
// azul-noite.
import { circulo, elipse, escurecer } from '../desenho.js';
import { criarCartas, criarMesa, medidasCena, faixaVertical, luz, particulas, semente } from './kit.js';
import { floco, caco } from '../formas.js';

const CORES = ['#5cb860', '#4a9ff0', '#ff9045', '#9b82ff', '#f05a75', '#2fb59a', '#f2a72e', '#d360bd', '#5f78f2', '#2ab6cc', '#ec4848', '#e0ae17'];

/** Cordilheira de picos com a neve no alto. */
function picos(ctx, W, H, base, amp, n, fase, cor, neve) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * W + Math.sin(i * 2.1 + fase) * (W / n) * 0.2;
    pts.push([x, base - amp * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.9 + fase)))]);
  }
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, base);
  pts.forEach(([x, y], i) => { if (i) ctx.lineTo((x + pts[i - 1][0]) / 2, base - amp * 0.18); ctx.lineTo(x, y); });
  ctx.lineTo(W, base); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
  if (!neve) return;
  ctx.fillStyle = neve;
  for (const [x, y] of pts) {
    const d = (base - y) * 0.3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d * 0.9, y + d); ctx.lineTo(x - d * 0.3, y + d * 0.8); ctx.lineTo(x, y + d * 1.05); ctx.lineTo(x + d * 0.35, y + d * 0.78); ctx.lineTo(x + d * 0.9, y + d); ctx.closePath(); ctx.fill();
  }
}

function pinheiro(ctx, x, y, s, cor) {
  ctx.fillStyle = cor;
  for (let i = 0; i < 3; i++) {
    const yy = y - i * 0.32 * s, w = (0.42 - i * 0.1) * s;
    ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - 0.5 * s); ctx.lineTo(x + w, yy); ctx.closePath(); ctx.fill();
  }
}

export default {
  id: 'neve', nome: 'Neve',
  paleta: {
    id: 'neve', painelA: '#2b3d6e', painelB: '#18244a', fundo: '#1d2a55', texto: '#ffffff', acento: '#9fe3ff', secundario: '#ff8fb1', hud: '#1e2c55',
    festa: ['#ffffff', '#9fe3ff', '#ff8fb1', '#c9d8ff', '#ffe27a', '#5e7fb8'], clarao: '#eaf6ff',
  },
  formas: { floco, caco },
  /** A explosao da Neve: flocos de seis bracos caem devagar girando e balancando; cacos de gelo saltam. */
  efeito(e, P, esc) {
    const { x, y, cor } = e;
    const flocos = (n, forca, op = {}) => P.estourar(x, y, ['#ffffff', '#dff2ff', '#b9dcff'], n, forca * esc, { forma: 'floco', tam: 8 * esc, g: 70, vida: 1.3, osc: 8 * esc, oscF: 3.5, arrasto: 0.95, vr: 2.5, ...op });
    const cacos = (n, forca) => P.estourar(x, y, [cor, '#cfe6ff', '#ffffff'], n, forca * esc, { forma: 'caco', tam: 8 * esc, g: 520, vida: 0.7, vr: 9 });
    switch (e.tipo) {
      case 'fusao': flocos(6 + e.degrau * 3, 0.6 + e.degrau * 0.1); cacos(4 + e.degrau, 0.7); P.anel(x, y, cor, (28 + e.degrau * 6) * esc); return true;
      case 'completar': flocos(30, 1.4); cacos(12, 1.4); P.anel(x, y, '#ffffff', 70 * esc); return true;
      case 'graduar': flocos(6, 0.5, { g: -60, vida: 0.8 }); return true;
      case 'festa': flocos(30, 1.5, { vida: 1.6 }); cacos(10, 1.3); return true;
      default: return false;
    }
  },
  parado(ctx, W, H, L) {
    const { hy, u, retrato } = medidasCena(W, H, L);
    faixaVertical(ctx, W, 0, hy + 30 * u, ['#0c1534', '#1a2b5c', '#3a5694', '#7d9fd0']);
    const rnd = semente(31);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.6})`; circulo(ctx, rnd() * W, rnd() * hy * 0.85, (0.5 + rnd() * 1.1) * u); ctx.fill(); }
    // lua crescente
    const lx = W * (retrato ? 0.18 : 0.14), ly = hy * 0.32;
    luz(ctx, lx, ly, 90 * u, '#dfe9ff', 0.35);
    circulo(ctx, lx, ly, 18 * u); ctx.fillStyle = '#f4f7ff'; ctx.fill();
    circulo(ctx, lx + 7 * u, ly - 4 * u, 16 * u); ctx.fillStyle = '#1d2f63'; ctx.fill();
    picos(ctx, W, H, hy + 10 * u, 95 * u, retrato ? 4 : 7, 0.4, '#5e7fb8', '#e9f2ff');
    picos(ctx, W, H, hy + 26 * u, 60 * u, retrato ? 6 : 10, 2.1, '#3f5f99', '#d3e3fb');
    const xs = retrato ? [0.03, 0.09, 0.15, 0.84, 0.9, 0.97] : [0.03, 0.08, 0.13, 0.6, 0.66, 0.85, 0.9, 0.96];
    xs.forEach((x, i) => pinheiro(ctx, W * x, hy + 32 * u, (30 + (i % 3) * 8) * u, '#1d3554'));
    faixaVertical(ctx, W, hy + 30 * u, H, ['#dde9fa', '#bcd0ec', '#91aad6']);
    for (let i = 0; i < 10; i++) { const x = rnd() * W, y = hy + 50 * u + rnd() * (H - hy - 50 * u); elipse(ctx, x, y, (20 + rnd() * 24) * u, (5 + rnd() * 4) * u); ctx.fillStyle = 'rgba(140,170,215,0.28)'; ctx.fill(); }
  },
  vivo(ctx, W, H, t, L) {
    const { hy, u } = medidasCena(W, H, L);
    // aurora
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let b = 0; b < 2; b++) {
      ctx.beginPath();
      const y0 = hy * (0.14 + b * 0.13);
      ctx.moveTo(0, y0);
      for (let x = 0; x <= W; x += 20 * u) ctx.lineTo(x, y0 + Math.sin(x / (90 * u) + t * 0.5 + b) * 14 * u);
      for (let x = W; x >= 0; x -= 20 * u) ctx.lineTo(x, y0 + 30 * u + Math.sin(x / (70 * u) + t * 0.4 + b * 2) * 10 * u);
      ctx.closePath();
      ctx.fillStyle = b ? `rgba(170,120,255,${0.13 + 0.05 * Math.sin(t)})` : `rgba(90,255,200,${0.16 + 0.05 * Math.sin(t * 0.8)})`;
      ctx.fill();
    }
    ctx.restore();
    // neve caindo
    particulas(30, W, H, t, 6 * u, 26 * u, (i, x, y, k) => {
      ctx.fillStyle = `rgba(255,255,255,${0.55 + k * 0.4})`;
      circulo(ctx, x + Math.sin(t * 0.8 + i) * 10 * u, y, (1 + k * 1.8) * u); ctx.fill();
    });
  },
  ...criarCartas({
    cores: CORES,
    // porcelana: so o numero e um fio na cor do valor, cantos firmes. O numero
    // vai escurecido: puro, o laranja e o amarelo ficavam a 2.0-2.3 de
    // contraste sobre o branco; com 0.35 o pior passa de 4.5 (WCAG AA).
    corpo: () => ['#ffffff', '#eaf1fb'],
    numFaixa: (c) => escurecer(c, 0.35),
    numMiolo: (c) => escurecer(c, 0.35),
    borda: () => '#9fbbe3',
    bordaLarg: 0.035,
    raio: 0.08,
    especial: { coringa: ['#6f7dff', '#c36bff'], bomba: ['#ec4848', '#232a40'], dobro: ['#1597a8'], quadruplo: ['#ef6c1e'], tinta: '#1a2440' },
  }),
  mesa: criarMesa({
    moldura: ['#e4f0ff', '#9fbbe3'], miolo: ['#22325c', '#141f3e'], aro: 'rgba(200,225,255,0.45)', larg: 6, raio: 20, vidro: true,
    tapete: ['#e0edff', '#a3bde4'], tapeteAro: 'rgba(255,255,255,0.9)',
    vazio: '200,225,255', descarte: ['#2b3d6b', '#1b294d'], descarteAro: 'rgba(200,225,255,0.45)', icone: '#c4e8ff',
    rotulo: '#ffffff', rotuloContorno: 'rgba(20,30,70,0.75)',
  }),
};
