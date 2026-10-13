// Mundo 4 (Elementos): Deserto. Fim de tarde nas dunas: ceu do roxo ao
// laranja, sol baixo, mesas de pedra ao longe, dunas com crista iluminada e
// areia correndo. Carta de pergaminho como a de baralho (cantos firmes e fio
// interno) com a faixa de cor; mesa de arenito.
import { circulo, rgba, escurecer } from '../desenho.js';
import { criarCartas, criarMesa, medidasCena, faixaVertical, luz, particulas, semente } from './kit.js';

const CORES = ['#6aa33a', '#2f86d1', '#ea6a1f', '#7f5bd0', '#d93a55', '#139a85', '#e09400', '#c0438e', '#4258c9', '#0f9ab0', '#c92a2a', '#c9920e'];

/** Duna: curva suave com a crista iluminada. */
function duna(ctx, W, H, base, amp, fase, cor, crista) {
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, base);
  const pts = [];
  for (let x = 0; x <= W + 8; x += 8) {
    const y = base - amp * (0.5 + 0.5 * Math.sin((x / W) * Math.PI * 1.6 + fase)) * (0.7 + 0.3 * Math.sin((x / W) * 5 + fase));
    pts.push([x, y]); ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineWidth = 2; ctx.strokeStyle = crista; ctx.stroke();
}

/** Mesa de pedra (morro de topo plano) ao longe. */
function mesaPedra(ctx, x, base, w, h, cor) {
  ctx.beginPath();
  ctx.moveTo(x - w * 0.6, base); ctx.lineTo(x - w * 0.42, base - h * 0.75); ctx.lineTo(x - w * 0.36, base - h); ctx.lineTo(x + w * 0.34, base - h);
  ctx.lineTo(x + w * 0.42, base - h * 0.7); ctx.lineTo(x + w * 0.62, base); ctx.closePath();
  ctx.fillStyle = cor; ctx.fill();
}

export default {
  id: 'deserto', nome: 'Deserto',
  paleta: {
    id: 'deserto', painelA: '#7a3e2a', painelB: '#4e2618', fundo: '#f2a65a', texto: '#ffffff', acento: '#ffd166', secundario: '#2ec4b6', hud: '#5a2e1f',
  },
  parado(ctx, W, H, L) {
    const { hy, u, retrato } = medidasCena(W, H, L);
    faixaVertical(ctx, W, 0, hy + 20 * u, ['#5b3f8f', '#b2508a', '#ee7a5e', '#ffb067', '#ffd99a']);
    // sol baixo
    const sx = W * (retrato ? 0.66 : 0.6), sy = hy - 6 * u;
    luz(ctx, sx, sy, Math.max(W, H) * 0.6, '#ffe7a8', 0.75);
    circulo(ctx, sx, sy, 34 * u); ctx.fillStyle = '#fff1c6'; ctx.fill();
    // mesas de pedra ao longe
    mesaPedra(ctx, W * 0.18, hy + 8 * u, 120 * u, 46 * u, '#c46a58');
    mesaPedra(ctx, W * (retrato ? 0.92 : 0.82), hy + 8 * u, 90 * u, 34 * u, '#b45d55');
    duna(ctx, W, H, hy + 18 * u, 26 * u, 0.4, '#f0b06a', 'rgba(255,230,180,0.8)');
    duna(ctx, W, H, hy + 44 * u, 30 * u, 2.3, '#e69a55', 'rgba(255,215,160,0.7)');
    duna(ctx, W, H, hy + 78 * u, 24 * u, 4.1, '#d9864a', 'rgba(255,200,140,0.6)');
    faixaVertical(ctx, W, hy + 90 * u, H, ['rgba(201,118,62,0)', 'rgba(170,92,48,0.45)']);
    // cactos nos cantos
    const cacto = (x, y, s) => {
      ctx.fillStyle = '#4f6a3a';
      const rrp = (a, b, w, h) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(a, b, w, h, w / 2) : ctx.rect(a, b, w, h); ctx.fill(); };
      rrp(x - s * 0.12, y - s, s * 0.24, s); rrp(x - s * 0.42, y - s * 0.7, s * 0.18, s * 0.42); rrp(x - s * 0.42, y - s * 0.38, s * 0.42, s * 0.14);
      rrp(x + s * 0.24, y - s * 0.82, s * 0.18, s * 0.4); rrp(x + s * 0.02, y - s * 0.5, s * 0.4, s * 0.14);
    };
    cacto(W * 0.07, hy + 70 * u, 46 * u);
    cacto(W * 0.94, hy + 86 * u, 38 * u);
    const rnd = semente(41);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(120,60,30,${0.12 + rnd() * 0.12})`; circulo(ctx, rnd() * W, hy + 100 * u + rnd() * (H - hy - 100 * u), (0.8 + rnd() * 1.4) * u); ctx.fill(); }
  },
  vivo(ctx, W, H, t, L) {
    const { hy, u } = medidasCena(W, H, L);
    // calor tremendo no horizonte
    ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, hy + k * 8 * u + Math.sin(x / (22 * u) + t * 3 + k) * 2 * u);
      ctx.stroke();
    }
    ctx.restore();
    // areia correndo com o vento
    particulas(26, W, H, t, 60 * u, 4 * u, (i, x, y, k) => {
      ctx.fillStyle = `rgba(255,235,200,${0.25 + k * 0.4})`;
      ctx.fillRect(x, y + Math.sin(t * 2 + i) * 3 * u, (2 + k * 5) * u, 1.2 * u);
    });
  },
  ...criarCartas({
    cores: CORES,
    corpo: () => ['#fdf3df', '#efdcb8'],
    faixa: (c) => [c, escurecer(c, 0.15)],
    numMiolo: (c) => escurecer(c, 0.1),
    borda: () => '#a57a42',
    raio: 0.07,
    fio: 'rgba(165,122,66,0.55)',
    material(ctx, r) {
      // pergaminho: pintinhas claras e uma sombra quente no pe
      const rnd = semente(Math.round(r.w * 7));
      for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(150,100,40,${0.06 + rnd() * 0.08})`; circulo(ctx, r.x + rnd() * r.w, r.y + r.h * 0.3 + rnd() * r.h * 0.7, (0.6 + rnd()) * r.w * 0.012); ctx.fill(); }
      const g = ctx.createLinearGradient(0, r.y + r.h * 0.7, 0, r.y + r.h);
      g.addColorStop(0, 'rgba(180,120,60,0)'); g.addColorStop(1, rgba('#b4783c', 0.16));
      ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
    },
    especial: { coringa: ['#8f5bd8', '#e8578f'], bomba: ['#d23c2c', '#33241d'], dobro: ['#13917f'], quadruplo: ['#e0601a'], tinta: '#3a1d10' },
  }),
  mesa: criarMesa({
    moldura: ['#ecca94', '#c4935a'], miolo: ['#6b3a2a', '#4c281d'], aro: 'rgba(255,225,180,0.4)', larg: 7, raio: 20,
    tapete: ['#e6be84', '#bd8a4f'], tapeteAro: 'rgba(255,240,210,0.7)',
    vazio: '255,222,175', descarte: ['#784433', '#583024'], descarteAro: 'rgba(255,225,180,0.45)', icone: '#ffd9a0',
    rotulo: '#ffffff', rotuloContorno: 'rgba(90,40,20,0.75)',
  }),
};
