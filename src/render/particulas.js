// Particulas simples (estouro, faiscas, confete, texto flutuante), funcao do dt.
const TAU = Math.PI * 2;

export function criarParticulas() {
  /** @type {any[]} */ let ps = [];
  /** @type {any[]} */ let textos = [];
  let semente = 1;
  const r = () => { semente = (semente * 1103515245 + 12345) >>> 0; return semente / 4294967296; };

  function estourar(x, y, cor, n = 14, forca = 1, vida = 0.6) {
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, v = (60 + r() * 220) * forca;
      ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * forca, g: 520, vida, t: 0, tam: 3 + r() * 5, cor, forma: r() < 0.5 ? 'q' : 'c' });
    }
  }
  function faiscas(x, y, cor, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 1.6, v = 120 + r() * 160;
      ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 300, vida: 0.45, t: 0, tam: 2 + r() * 3, cor, forma: 'c' });
    }
  }
  function flocos(x, y, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, v = 30 + r() * 70;
      ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 40, vida: 0.9, t: 0, tam: 2 + r() * 3, cor: '#dff6ff', forma: 'c' });
    }
  }
  function texto(x, y, txt, cor, tam = 26) {
    textos.push({ x, y, txt, cor, tam, t: 0, vida: 0.9 });
  }
  function atualizar(dt) {
    for (const p of ps) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; }
    ps = ps.filter((p) => p.t < p.vida);
    for (const t of textos) t.t += dt;
    textos = textos.filter((t) => t.t < t.vida);
  }
  function desenhar(ctx) {
    for (const p of ps) {
      const u = p.t / p.vida;
      ctx.globalAlpha = 1 - u * u;
      ctx.fillStyle = p.cor;
      const s = p.tam * (1 - u * 0.5);
      if (p.forma === 'c') { ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, TAU); ctx.fill(); }
      else ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    for (const t of textos) {
      const u = t.t / t.vida;
      const esc = u < 0.2 ? 0.6 + (u / 0.2) * 0.5 : 1.1 - (u - 0.2) * 0.1;
      ctx.save();
      ctx.globalAlpha = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
      ctx.translate(t.x, t.y - u * 46);
      ctx.scale(esc, esc);
      ctx.font = `700 ${t.tam}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = t.tam * 0.18; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(t.txt, 0, 0);
      ctx.fillStyle = t.cor; ctx.fillText(t.txt, 0, 0);
      ctx.restore();
    }
  }
  return { estourar, faiscas, flocos, texto, atualizar, desenhar, get quantas() { return ps.length; } };
}
