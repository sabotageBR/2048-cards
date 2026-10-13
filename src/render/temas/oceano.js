// Mundo 2 (Elementos): Oceano. O mar visto de dentro d'agua: a superficie
// clara no alto, feixes de luz, fundo de areia com pedras e algas, bolhas
// subindo. Carta de vidro tingido na cor do valor, com borda de perola e
// numero branco; mesa de vidro com aro aqua.
import { circulo, elipse, escurecer, clarear, rgba } from '../desenho.js';
import { criarCartas, criarMesa, medidasCena, faixaVertical, luz, onda, particulas, semente } from './kit.js';

const CORES = ['#4fbf63', '#3a9cf5', '#ff8a3d', '#9b7bff', '#ff5778', '#17b89a', '#ffad1f', '#e45bbf', '#5878ff', '#13b7d6', '#ff4757', '#f5c518'];

/** Alga: fita que ondula a partir do chao. */
function alga(ctx, x, y, alt, larg, cor, fase) {
  ctx.beginPath(); ctx.moveTo(x - larg / 2, y);
  const n = 6;
  for (let i = 1; i <= n; i++) ctx.lineTo(x + Math.sin(fase + i * 0.9) * larg * 0.9 - larg * 0.5 * (1 - i / n), y - (alt * i) / n);
  for (let i = n; i >= 1; i--) ctx.lineTo(x + Math.sin(fase + i * 0.9) * larg * 0.9 + larg * 0.5 * (1 - i / n), y - (alt * i) / n + 2);
  ctx.lineTo(x + larg / 2, y); ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
}

export default {
  id: 'oceano', nome: 'Oceano',
  paleta: {
    id: 'oceano', painelA: '#0f4c7a', painelB: '#08304f', fundo: '#1a9cc4', texto: '#ffffff', acento: '#5ff0ff', secundario: '#ff7a8a', hud: '#0b3a5c',
  },
  parado(ctx, W, H, L) {
    const { hy, u, retrato } = medidasCena(W, H, L);
    faixaVertical(ctx, W, 0, H, ['#8ff0f5', '#2bb5d6', '#0f78ad', '#0a4f86', '#073660']);
    // a superficie: ondas claras no alto
    ctx.save(); ctx.globalAlpha = 0.35;
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      const y0 = hy * (0.12 + b * 0.09);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y0 + Math.sin(x / (40 * u) + b * 1.7) * 4 * u);
      ctx.lineWidth = (3 - b) * u; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    }
    ctx.restore();
    luz(ctx, W * 0.5, 0, Math.max(W, H) * 0.7, '#e8ffff', 0.55);
    // fundo de areia, pedras e algas
    const fy = H * (retrato ? 0.86 : 0.8);
    const rnd = semente(23);
    onda(ctx, W, H, fy - 10 * u, 28 * u, 1.3, 1.1, 'rgba(18,94,128,0.75)');
    for (let i = 0; i < (retrato ? 7 : 12); i++) {
      const x = rnd() * W, s = (12 + rnd() * 20) * u;
      alga(ctx, x, fy + 6 * u, s * 3.2, s * 0.5, i % 2 ? 'rgba(20,140,120,0.8)' : 'rgba(40,160,110,0.7)', rnd() * 6);
    }
    onda(ctx, W, H, fy + 8 * u, 18 * u, 1.8, 3.3, '#2f8fa0');
    onda(ctx, W, H, fy + 24 * u, 12 * u, 1.1, 0.4, '#e6cf98');
    for (let i = 0; i < 6; i++) { const x = rnd() * W; elipse(ctx, x, fy + 22 * u, (14 + rnd() * 18) * u, (8 + rnd() * 6) * u); ctx.fillStyle = '#3f6f86'; ctx.fill(); }
    // corais nos cantos
    for (const [x, c] of [[W * 0.04, '#ff7f91'], [W * 0.96, '#ffb35c']]) {
      for (let k = 0; k < 5; k++) { circulo(ctx, x + (k - 2) * 7 * u, fy - 4 * u - (2 - Math.abs(k - 2)) * 7 * u, (6 + (k % 2) * 3) * u); ctx.fillStyle = c; ctx.fill(); }
    }
  },
  vivo(ctx, W, H, t, L) {
    const { hy, u } = medidasCena(W, H, L);
    // feixes de luz que balancam
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 5; k++) {
      const x = W * (0.1 + k * 0.21) + Math.sin(t * 0.4 + k) * 20 * u;
      const a = 0.06 + 0.04 * Math.sin(t * 0.7 + k * 1.3);
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.9);
      g.addColorStop(0, `rgba(220,255,255,${a})`); g.addColorStop(1, 'rgba(220,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - 14 * u, 0); ctx.lineTo(x + 14 * u, 0); ctx.lineTo(x + 70 * u, H * 0.9); ctx.lineTo(x + 10 * u, H * 0.9); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // bolhas subindo
    particulas(18, W, H + hy, t, 0, -34 * u, (i, x, y, k) => {
      const r = (2 + k * 4) * u;
      const bx = x + Math.sin(t * 2 + i) * 5 * u;
      circulo(ctx, bx, y, r); ctx.strokeStyle = 'rgba(230,255,255,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      circulo(ctx, bx - r * 0.35, y - r * 0.35, r * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    });
  },
  ...criarCartas({
    cores: CORES,
    // vidro tingido na cor do valor, com borda de perola e numero branco
    corpo: (c) => [clarear(c, 0.5), clarear(c, 0.12)],
    faixa: (c) => [escurecer(c, 0.04), escurecer(c, 0.2)],
    numMiolo: () => '#ffffff',
    contorno: (c) => rgba(escurecer(c, 0.5), 0.5),
    borda: () => '#f2fdff',
    bordaLarg: 0.05,
    raio: 0.14,
    vidro: true,
    especial: { coringa: ['#7b6cff', '#ff6fb5'], bomba: ['#ff4d5e', '#28233a'], dobro: ['#0fa3a3'], quadruplo: ['#ff7a29'], tinta: '#0b2a44' },
  }),
  mesa: criarMesa({
    moldura: ['rgba(255,255,255,0.5)', 'rgba(190,240,255,0.3)'], miolo: ['rgba(6,58,105,0.62)', 'rgba(4,36,78,0.72)'], aro: 'rgba(190,245,255,0.55)',
    brilho: 'rgba(120,230,255,0.45)', vidro: true, larg: 5, raio: 20,
    tapete: ['rgba(255,255,255,0.38)', 'rgba(180,235,255,0.24)'], tapeteAro: 'rgba(220,250,255,0.75)',
    vazio: '190,240,255', descarte: ['rgba(8,70,120,0.6)', 'rgba(5,45,90,0.65)'], descarteAro: 'rgba(190,245,255,0.5)', icone: '#a6f4ff',
    rotulo: '#ffffff', rotuloContorno: 'rgba(0,40,80,0.6)',
  }),
};
