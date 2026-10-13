// Mundo 5 (Elementos): Cosmos. Espaco fundo: nebulosas, estrelas que
// piscam, um planeta com anel e a curva de outro planeta embaixo; uma estrela
// cadente de vez em quando. Carta de vidro escuro com borda e numero em neon
// (perto da referencia de docs/referencia/); mesa de vidro escuro com aro neon.
import { circulo, elipse, estrela, misturar } from '../desenho.js';
import { criarCartas, criarMesa, medidasCena, faixaVertical, luz, semente } from './kit.js';

const CORES = ['#7dff6a', '#4db8ff', '#ff9a3d', '#b28cff', '#ff4f8b', '#2effc4', '#ffcf3c', '#ff5cf0', '#7f8cff', '#3df2ff', '#ff4646', '#ffe066'];

export default {
  id: 'cosmos', nome: 'Cosmos',
  paleta: {
    id: 'cosmos', painelA: '#2a1d5e', painelB: '#120c30', fundo: '#0b0820', texto: '#ffffff', acento: '#c084fc', secundario: '#38e8ff', hud: '#1a1240',
  },
  parado(ctx, W, H, L) {
    const { hy, u, retrato } = medidasCena(W, H, L);
    faixaVertical(ctx, W, 0, H, ['#070614', '#120b33', '#1c0f45', '#0d0826']);
    // nebulosas
    luz(ctx, W * 0.15, hy * 0.6, Math.max(W, H) * 0.45, '#c026d3', 0.28);
    luz(ctx, W * 0.9, hy * 1.4, Math.max(W, H) * 0.5, '#0891b2', 0.24);
    luz(ctx, W * 0.5, H * 0.95, Math.max(W, H) * 0.55, '#7c3aed', 0.3);
    // estrelas fixas
    const rnd = semente(57);
    for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`; circulo(ctx, rnd() * W, rnd() * H, (0.4 + rnd() * 1.1) * u); ctx.fill(); }
    // planeta com anel
    const px = W * (retrato ? 0.8 : 0.84), py = hy * 0.5, pr = 30 * u;
    const g = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
    g.addColorStop(0, '#ffc6a8'); g.addColorStop(0.6, '#e2607e'); g.addColorStop(1, '#5a1d5e');
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.35);
    elipse(ctx, 0, 0, pr * 1.9, pr * 0.42); ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,214,170,0.35)'; ctx.stroke();
    ctx.restore();
    circulo(ctx, px, py, pr); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.35);
    ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.9, pr * 0.42, 0, 0, Math.PI); ctx.lineWidth = 3 * u; ctx.strokeStyle = 'rgba(255,214,170,0.7)'; ctx.stroke();
    ctx.restore();
    // lua pequena
    circulo(ctx, W * (retrato ? 0.14 : 0.1), hy * 0.25, 9 * u); ctx.fillStyle = '#b9b4d9'; ctx.fill();
    // a curva de um planeta embaixo, com a borda iluminada
    const R = Math.max(W, H) * 1.4, cy = H + R - H * (retrato ? 0.1 : 0.14);
    const gp = ctx.createRadialGradient(W / 2, cy - R, R * 0.02, W / 2, cy, R);
    gp.addColorStop(0, '#3b1d74'); gp.addColorStop(1, '#120a2e');
    circulo(ctx, W / 2, cy, R); ctx.fillStyle = gp; ctx.fill();
    ctx.save(); ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 18 * u;
    circulo(ctx, W / 2, cy, R); ctx.lineWidth = 2 * u; ctx.strokeStyle = 'rgba(190,140,255,0.8)'; ctx.stroke();
    ctx.restore();
  },
  vivo(ctx, W, H, t) {
    const u = Math.max(0.7, Math.min(1.8, Math.min(W, H) / 420));
    // estrelas que piscam
    const rnd = semente(73);
    for (let i = 0; i < 18; i++) {
      const x = rnd() * W, y = rnd() * H, f = rnd() * 6;
      const a = Math.max(0, Math.sin(t * 1.6 + f));
      if (a < 0.05) continue;
      estrela(ctx, x, y, 4.5 * u * a, 1.2 * u, 4, 0); ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`; ctx.fill();
    }
    // estrela cadente a cada 7 s
    const ciclo = 7, u0 = (t % ciclo) / 1.1;
    if (u0 < 1) {
      const k = Math.floor(t / ciclo);
      const x0 = W * (0.2 + ((k * 0.37) % 0.6)), y0 = H * (0.06 + ((k * 0.23) % 0.2));
      const x = x0 + u0 * W * 0.35, y = y0 + u0 * W * 0.18;
      const g = ctx.createLinearGradient(x - 60 * u, y - 30 * u, x, y);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${0.9 * (1 - u0)})`);
      ctx.strokeStyle = g; ctx.lineWidth = 2 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 60 * u, y - 30 * u); ctx.lineTo(x, y); ctx.stroke();
    }
  },
  ...criarCartas({
    cores: CORES,
    corpo: (c) => [misturar(c, '#141033', 0.78), '#0f0c26'],
    numFaixa: (c) => c,
    numMiolo: (c) => c,
    borda: (c) => c,
    bordaLarg: 0.035,
    neon: true,
    vidro: true,
    especial: { coringa: ['#a855f7', '#ec4899'], bomba: ['#ff4646', '#1a1028'], dobro: ['#2effc4'], quadruplo: ['#ff9a3d'], tinta: '#0b0820' },
  }),
  mesa: criarMesa({
    moldura: ['#2a1f5c', '#130e34'], miolo: ['rgba(14,10,38,0.94)', 'rgba(9,7,26,0.96)'], aro: 'rgba(170,120,255,0.45)',
    brilho: 'rgba(168,85,247,0.8)', vidro: true, larg: 4, raio: 18,
    tapete: ['#221a4c', '#110c2a'], tapeteAro: 'rgba(110,200,255,0.65)',
    vazio: '160,140,255', descarte: ['#1c1540', '#110c2a'], descarteAro: 'rgba(110,200,255,0.5)', icone: '#7fe3ff',
    rotulo: '#e8e2ff', rotuloContorno: null,
  }),
};
