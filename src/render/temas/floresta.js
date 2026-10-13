// Mundo 1 (Elementos): Floresta. Clareira de manha: ceu claro, sol com
// raios, morros em camadas com arvores redondas e polen no ar. Carta de
// marfim bem redonda com a faixa em onda na cor do valor; mesa de madeira
// clara com feltro musgo.
import { circulo, elipse, rgba, escurecer, clarear } from '../desenho.js';
import { criarCartas, criarMesa, medidasCena, faixaVertical, luz, onda, particulas, semente } from './kit.js';

const CORES = ['#7cb342', '#3f8fd2', '#f57c00', '#8e63d6', '#e0435d', '#1fa38a', '#e6a100', '#c2408f', '#4560d8', '#10a5b8', '#e53935', '#d4a017'];

/** Arvore redonda: tronco e tres bolas de copa, com luz do lado do sol. */
function arvore(ctx, x, y, s, cor) {
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - s * 0.08, y - s * 0.5, s * 0.16, s * 0.5);
  for (const [dx, dy, r] of [[-0.28, -0.62, 0.34], [0.26, -0.66, 0.32], [0, -0.92, 0.4]]) {
    circulo(ctx, x + dx * s, y + dy * s, r * s); ctx.fillStyle = cor; ctx.fill();
  }
  circulo(ctx, x + 0.1 * s, y - 1.02 * s, 0.2 * s); ctx.fillStyle = rgba(clarear(cor, 0.35), 0.55); ctx.fill();
}

export default {
  id: 'floresta', nome: 'Floresta',
  paleta: {
    id: 'floresta', painelA: '#2f5d3a', painelB: '#1d3d26', fundo: '#bfe6ff', texto: '#ffffff', acento: '#ffd23f', secundario: '#ff7a59', hud: '#24442c',
  },
  parado(ctx, W, H, L) {
    const { hy, u, retrato } = medidasCena(W, H, L);
    faixaVertical(ctx, W, 0, H, ['#9fd6f5', '#d8f0fb', '#fff3d6']);
    // sol e raios
    const sx = W * (retrato ? 0.8 : 0.72), sy = hy * 0.42;
    luz(ctx, sx, sy, Math.max(W, H) * 0.55, '#fff2c4', 0.9);
    ctx.save();
    ctx.globalAlpha = 0.1; ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 7; k++) {
      const a = Math.PI * (0.55 + k * 0.11), b = a + 0.045;
      const R = Math.max(W, H) * 1.2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * R, sy + Math.sin(a) * R); ctx.lineTo(sx + Math.cos(b) * R, sy + Math.sin(b) * R); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    circulo(ctx, sx, sy, 24 * u); ctx.fillStyle = '#fff8e2'; ctx.fill();
    // nuvens baixas e macias
    const rnd = semente(11);
    for (let i = 0; i < (retrato ? 3 : 5); i++) {
      const cx = rnd() * W, cy = hy * (0.2 + rnd() * 0.45), s = (22 + rnd() * 16) * u;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const [dx, dy, r] of [[-1, 0.15, 0.6], [0, -0.1, 0.85], [1, 0.12, 0.62], [0.4, 0.25, 0.6]]) { circulo(ctx, cx + dx * s, cy + dy * s, r * s); ctx.fill(); }
    }
    // morros: o de tras azulado pela distancia, os da frente mais verdes
    onda(ctx, W, H, hy - 6 * u, 46 * u, 1.2, 0.6, '#a6d6c0');
    onda(ctx, W, H, hy + 16 * u, 34 * u, 1.7, 2.2, '#86c78f');
    const xs = retrato ? [0.05, 0.14, 0.88, 0.96] : [0.04, 0.11, 0.2, 0.78, 0.86, 0.95];
    xs.forEach((x, i) => arvore(ctx, W * x, hy + (14 + (i % 2) * 8) * u, (26 + (i % 3) * 7) * u, i % 2 ? '#4f9e5f' : '#5aa86a'));
    onda(ctx, W, H, hy + 44 * u, 24 * u, 1.1, 4.0, '#6ab874');
    const g = ctx.createLinearGradient(0, hy + 44 * u, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(30,90,45,0.35)');
    ctx.fillStyle = g; ctx.fillRect(0, hy + 20 * u, W, H);
    // tufos e florzinhas no gramado
    for (let i = 0; i < 26; i++) {
      const x = rnd() * W, y = hy + 70 * u + rnd() * (H - hy - 70 * u);
      if (rnd() < 0.35) { circulo(ctx, x, y, 2.2 * u); ctx.fillStyle = ['#fff6d0', '#ffd0dc', '#fff'][i % 3]; ctx.fill(); }
      else { elipse(ctx, x, y, 7 * u, 2.4 * u); ctx.fillStyle = 'rgba(40,110,55,0.35)'; ctx.fill(); }
    }
  },
  vivo(ctx, W, H, t) {
    const u = Math.max(0.7, Math.min(1.8, Math.min(W, H) / 420));
    // polen subindo devagar
    particulas(16, W, H, t, 9 * u, -11 * u, (i, x, y, k) => {
      ctx.fillStyle = `rgba(255,248,205,${0.35 + 0.3 * Math.sin(t * 2 + i)})`;
      circulo(ctx, x + Math.sin(t + i) * 6 * u, y, (1.4 + k * 1.6) * u); ctx.fill();
    });
    // folhas caindo
    particulas(5, W, H, t, 14 * u, 20 * u, (i, x, y) => {
      ctx.save(); ctx.translate(x + Math.sin(t * 1.3 + i) * 14 * u, y); ctx.rotate(Math.sin(t * 2 + i) * 0.9);
      elipse(ctx, 0, 0, 6 * u, 2.6 * u); ctx.fillStyle = i % 2 ? 'rgba(122,179,66,0.8)' : 'rgba(230,161,0,0.75)'; ctx.fill();
      ctx.restore();
    });
  },
  ...criarCartas({
    cores: CORES,
    corpo: () => ['#fffdf6', '#f2ead6'],
    faixa: (c) => [clarear(c, 0.08), c],
    numMiolo: (c) => escurecer(c, 0.06),
    borda: (c) => escurecer(c, 0.2),
    raio: 0.17,
    ondaFaixa: true,
    especial: { coringa: ['#9c6ade', '#e66fa8'], bomba: ['#d84a3a', '#3a2a24'], dobro: ['#1f9e8f'], quadruplo: ['#d9601c'], tinta: '#2a1630' },
  }),
  mesa: criarMesa({
    moldura: ['#ecd3a0', '#c9a46a'], miolo: ['#355e3b', '#24432a'], aro: 'rgba(255,240,200,0.35)', larg: 7, raio: 20,
    tapete: ['#e3c48e', '#bf9960'], tapeteAro: 'rgba(255,245,215,0.7)',
    vazio: '225,240,205', descarte: ['#46694a', '#33523a'], descarteAro: 'rgba(230,245,210,0.45)', icone: '#e6f7c4',
    rotulo: '#ffffff', rotuloContorno: 'rgba(30,60,30,0.75)',
  }),
};
