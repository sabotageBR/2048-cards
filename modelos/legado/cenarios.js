// LEGADO (laboratorio visual de 2026-10-09, recusado em 2026-10-10): os 6
// cenarios de antes do duelo, paleta + fundo desenhado em canvas (camada
// parada e camada viva). O jogo usa as arenas de src/render/arena.js.

const TAU = Math.PI * 2;

function rng(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CENARIOS = {
  /** Neon Noite: sintetizador anos 80 (referencia): grade, montanhas, estrelas. */
  neon: {
    id: 'neon', nome: 'Neon',
    paleta: {
      id: 'neon', fundo: '#120a2a', mesa: 'rgba(70, 20, 110, 0.55)', mesaBorda: '#d04cff', mesaBrilho: 'rgba(208,76,255,0.55)',
      slot: '#b98cff', texto: '#ffffff', hud: 'rgba(255,255,255,0.12)', acento: '#ff4fd8', secundario: '#4de8ff', naipes: false,
    },
    parado(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0b0620'); g.addColorStop(0.55, '#1a0b3d'); g.addColorStop(1, '#3a0f5c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sol riscado
      const sx = W * 0.5, sy = H * 0.52, R = Math.min(W, H) * 0.22;
      const gs = ctx.createLinearGradient(0, sy - R, 0, sy + R);
      gs.addColorStop(0, '#ffb13b'); gs.addColorStop(1, '#ff2f8e');
      ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a0b3d';
      for (let i = 0; i < 6; i++) ctx.fillRect(sx - R, sy + R * (0.1 + i * 0.16), R * 2, R * (0.03 + i * 0.012));
      // montanhas
      const r = rng(7);
      for (const [cor, base, amp] of [['#2a0f55', 0.62, 0.11], ['#1b0940', 0.68, 0.08]]) {
        ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += W / 18) ctx.lineTo(x, H * (base - r() * amp));
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      }
      // chao em grade
      const hz = H * 0.66;
      ctx.fillStyle = '#1c0b3a'; ctx.fillRect(0, hz, W, H - hz);
      ctx.strokeStyle = 'rgba(255,79,216,0.55)'; ctx.lineWidth = 1.5;
      for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.06, hz); ctx.lineTo(W / 2 + i * W * 0.4, H); ctx.stroke(); }
      for (let k = 0; k < 8; k++) { const y = hz + (H - hz) * (k * k) / 64; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(77,232,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, hz); ctx.lineTo(W, hz); ctx.stroke();
    },
    vivo(ctx, W, H, t) {
      const r = rng(11);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) {
        const x = r() * W, y = r() * H * 0.5, f = r();
        ctx.globalAlpha = 0.35 + 0.6 * Math.abs(Math.sin(t * (0.6 + f) + i));
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    },
  },
  /** Mesa Verde: feltro de cassino com vinheta e trilho de madeira. */
  feltro: {
    id: 'feltro', nome: 'Feltro',
    paleta: {
      id: 'feltro', fundo: '#1f6b3a', mesa: 'rgba(0, 0, 0, 0.16)', mesaBorda: '#8a5a2b', mesaBrilho: 'rgba(0,0,0,0)',
      slot: '#cfe8d2', texto: '#fff8ec', hud: 'rgba(0,0,0,0.22)', acento: '#ffc93c', secundario: '#ffffff', naipes: false,
    },
    parado(ctx, W, H) {
      ctx.fillStyle = '#1f6b3a'; ctx.fillRect(0, 0, W, H);
      const r = rng(3);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 1800; i++) ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // trilho de madeira nas bordas
      const esp = Math.max(10, Math.min(W, H) * 0.03);
      const gm = ctx.createLinearGradient(0, 0, esp, 0);
      gm.addColorStop(0, '#5a3418'); gm.addColorStop(0.5, '#8a5a2b'); gm.addColorStop(1, '#5a3418');
      ctx.fillStyle = gm; ctx.fillRect(0, 0, esp, H);
      const gm2 = ctx.createLinearGradient(W - esp, 0, W, 0);
      gm2.addColorStop(0, '#5a3418'); gm2.addColorStop(0.5, '#8a5a2b'); gm2.addColorStop(1, '#5a3418');
      ctx.fillStyle = gm2; ctx.fillRect(W - esp, 0, esp, H);
    },
    vivo() {},
  },
  /** Doce: pastel, bolinhas e balas, mesa clara. */
  doce: {
    id: 'doce', nome: 'Doce',
    paleta: {
      id: 'doce', fundo: '#ffd6e7', mesa: 'rgba(255,255,255,0.55)', mesaBorda: '#ff8fbf', mesaBrilho: 'rgba(0,0,0,0)',
      slot: '#c96a9a', texto: '#5a2d4d', hud: 'rgba(90,45,77,0.18)', acento: '#ff5fa2', secundario: '#4fd1c5', naipes: false,
    },
    parado(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#ffe3ef'); g.addColorStop(1, '#cdefff');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const r = rng(21);
      const cores = ['#ffb3d1', '#b8f0e6', '#fff1a8', '#d9c8ff'];
      for (let i = 0; i < 26; i++) {
        const x = r() * W, y = r() * H, R = 14 + r() * Math.min(W, H) * 0.08;
        ctx.fillStyle = cores[i % cores.length]; ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x - R * 0.3, y - R * 0.3, R * 0.3, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // listras de bala no rodape
      ctx.save();
      ctx.translate(0, H * 0.88); ctx.rotate(-0.08);
      for (let x = -W; x < W * 2; x += 36) { ctx.fillStyle = x % 72 ? '#ffffff' : '#ffb3d1'; ctx.globalAlpha = 0.5; ctx.fillRect(x, 0, 36, H * 0.3); }
      ctx.restore();
      ctx.globalAlpha = 1;
    },
    vivo() {},
  },
  /** Taverna: tabuas de madeira, pergaminho de mesa e luz de lampiao. */
  taverna: {
    id: 'taverna', nome: 'Taverna',
    paleta: {
      id: 'taverna', fundo: '#4a2c17', mesa: 'rgba(246,228,186,0.92)', mesaBorda: '#5a3418', mesaBrilho: 'rgba(0,0,0,0)',
      slot: '#8a6a3a', texto: '#fff3d6', hud: 'rgba(0,0,0,0.3)', acento: '#ffb13b', secundario: '#f6e4ba', naipes: false,
    },
    parado(ctx, W, H) {
      const r = rng(5);
      const alt = Math.max(28, H / 14);
      for (let y = 0; y < H; y += alt) {
        const k = 0.85 + r() * 0.3;
        ctx.fillStyle = `rgb(${Math.round(92 * k)},${Math.round(55 * k)},${Math.round(28 * k)})`;
        ctx.fillRect(0, y, W, alt);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, y + alt); ctx.lineTo(W, y + alt); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) { const x0 = r() * W, l = 40 + r() * W * 0.3; ctx.beginPath(); ctx.moveTo(x0, y + 4 + r() * (alt - 8)); ctx.lineTo(x0 + l, y + 4 + r() * (alt - 8)); ctx.stroke(); }
        // no
        if (r() < 0.4) { const x = r() * W; ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + alt / 2, 10, 5, 0, 0, TAU); ctx.fill(); }
      }
      const g = ctx.createRadialGradient(W * 0.5, H * 0.1, 10, W * 0.5, H * 0.1, Math.max(W, H) * 0.9);
      g.addColorStop(0, 'rgba(255,190,90,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
    vivo(ctx, W, H, t) {
      // tremor da chama do lampiao
      const a = 0.05 + 0.03 * Math.sin(t * 7) * Math.sin(t * 3.1);
      const g = ctx.createRadialGradient(W * 0.5, H * 0.1, 10, W * 0.5, H * 0.1, Math.max(W, H) * 0.6);
      g.addColorStop(0, `rgba(255,200,110,${a})`); g.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
  /** Espaco: nebulosa, planeta e estrelas em parallax. */
  espaco: {
    id: 'espaco', nome: 'Espaço',
    paleta: {
      id: 'espaco', fundo: '#060a1f', mesa: 'rgba(20,40,80,0.55)', mesaBorda: '#4de8ff', mesaBrilho: 'rgba(77,232,255,0.45)',
      slot: '#8fd8ff', texto: '#ffffff', hud: 'rgba(255,255,255,0.1)', acento: '#4de8ff', secundario: '#ff9f5a', naipes: false,
    },
    parado(ctx, W, H) {
      ctx.fillStyle = '#060a1f'; ctx.fillRect(0, 0, W, H);
      const r = rng(9);
      for (const [x, y, R, cor] of [[0.2, 0.3, 0.5, 'rgba(120,60,200,0.35)'], [0.8, 0.7, 0.45, 'rgba(40,160,220,0.3)'], [0.6, 0.15, 0.3, 'rgba(255,100,160,0.2)']]) {
        const g = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, Math.max(W, H) * R);
        g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 160; i++) { const s = r(); ctx.globalAlpha = 0.3 + s * 0.7; ctx.fillRect(r() * W, r() * H, s < 0.9 ? 1.5 : 2.5, s < 0.9 ? 1.5 : 2.5); }
      ctx.globalAlpha = 1;
      // planeta
      const px = W * 0.82, py = H * 0.2, pr = Math.min(W, H) * 0.11;
      const gp = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
      gp.addColorStop(0, '#ffcf8a'); gp.addColorStop(1, '#b24e2a');
      ctx.fillStyle = gp; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,160,0.6)'; ctx.lineWidth = pr * 0.12;
      ctx.beginPath(); ctx.ellipse(px, py, pr * 1.7, pr * 0.45, -0.3, 0, TAU); ctx.stroke();
    },
    vivo(ctx, W, H, t) {
      const r = rng(13);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const x = (r() * W + t * (8 + r() * 10)) % W, y = r() * H;
        ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(t * 1.3 + i));
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    },
  },
  /** Minimal: claro e chapado, mesa branca com sombra suave. */
  minimal: {
    id: 'minimal', nome: 'Minimal',
    paleta: {
      id: 'minimal', fundo: '#f3f1ea', mesa: '#ffffff', mesaBorda: '#d9d4c7', mesaBrilho: 'rgba(0,0,0,0)',
      slot: '#b9b3a4', texto: '#3b3732', hud: 'rgba(59,55,50,0.1)', acento: '#f0742c', secundario: '#2f6df6', naipes: false,
    },
    parado(ctx, W, H) {
      ctx.fillStyle = '#f3f1ea'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.035)';
      for (let x = 0; x < W; x += 28) for (let y = 0; y < H; y += 28) ctx.fillRect(x, y, 2, 2);
    },
    vivo() {},
  },
};

export const CENARIOS_IDS = Object.keys(CENARIOS);
export const cenarioDe = (id) => CENARIOS[id] || CENARIOS.neon;
