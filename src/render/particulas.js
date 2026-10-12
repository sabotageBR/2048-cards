// Particulas com formas livres (estouro, anel, fumaca, orbe, corte, raio) e
// texto flutuante com contorno, funcao do dt. O sorteio usa semente propria,
// entao dois quadros iguais saem iguais.
// p: { x, y, vx, vy, g, vida, t, tam, cor, forma, rot, vr, arrasto, firme? }
// firme: nao some nem encolhe com a idade (projeteis).
import { TAU, circulo, estrela, texto as textoContorno } from './desenho.js';

export function criarParticulas() {
  /** @type {any[]} */ let ps = [];
  /** @type {any[]} */ let txts = [];
  let s = 7;
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  /** @type {Record<string, (ctx: CanvasRenderingContext2D, p: any, u: number) => void>} */
  const formas = {
    c: (ctx, p) => { circulo(ctx, 0, 0, p.tam / 2); ctx.fill(); },
    q: (ctx, p) => { ctx.fillRect(-p.tam / 2, -p.tam / 2, p.tam, p.tam); },
    estrela: (ctx, p) => { estrela(ctx, 0, 0, p.tam / 2, p.tam / 4.5); ctx.fill(); },
    anel: (ctx, p, u) => { ctx.lineWidth = Math.max(1, p.tam * 0.12 * (1 - u)); ctx.strokeStyle = p.cor; circulo(ctx, 0, 0, p.tam * (0.3 + u * 1.4)); ctx.stroke(); },
  };
  const corDe = (cores, i) => (Array.isArray(cores) ? cores[i % cores.length] : cores);

  function add(p) {
    ps.push({ vx: 0, vy: 0, g: 0, t: 0, rot: 0, vr: 0, arrasto: 0.985, forma: 'c', ...p });
  }
  /** @param {number|{ g?: number, vida?: number, tam?: number, forma?: string }} [op] numero = vida */
  function estourar(x, y, cores, n = 14, forca = 1, op = {}) {
    const o = typeof op === 'number' ? { vida: op } : op;
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, v = (60 + r() * 220) * forca;
      add({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * forca, g: o.g ?? 520, vida: o.vida || 0.6, tam: (o.tam || 6) * (0.6 + r() * 0.8),
        cor: corDe(cores, i), forma: o.forma || (r() < 0.5 ? 'q' : 'c'), rot: r() * TAU, vr: (r() - 0.5) * 12,
      });
    }
  }
  function subir(x, y, cores, n = 8, op = {}) {
    for (let i = 0; i < n; i++) {
      add({
        x: x + (r() - 0.5) * (op.larg || 20), y, vx: (r() - 0.5) * 30, vy: -(40 + r() * 90) * (op.forca || 1), g: op.g ?? -20, vida: op.vida || 1.1,
        tam: (op.tam || 6) * (0.5 + r()), cor: corDe(cores, i), forma: op.forma || 'c', arrasto: 0.99,
      });
    }
  }
  function faiscas(x, y, cor, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 1.6, v = 120 + r() * 160;
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 300, vida: 0.45, tam: 2 + r() * 3, cor, forma: 'c' });
    }
  }
  function flocos(x, y, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, v = 30 + r() * 70;
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 40, vida: 0.9, tam: 2 + r() * 3, cor: '#dff6ff', forma: 'c' });
    }
  }
  function anel(x, y, cor, tam = 40, vida = 0.45) { add({ x, y, vida, tam, cor, forma: 'anel' }); }
  function texto(x, y, txt, cor, tam = 26, contorno = 'rgba(0,0,0,0.55)') { txts.push({ x, y, txt, cor, tam, contorno, t: 0, vida: 0.9 }); }

  function atualizar(dt) {
    for (const p of ps) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= p.arrasto; p.rot += p.vr * dt; }
    ps = ps.filter((p) => p.t < p.vida);
    for (const t of txts) t.t += dt;
    txts = txts.filter((t) => t.t < t.vida);
  }
  function desenhar(ctx) {
    for (const p of ps) {
      const u = p.t / p.vida;
      ctx.save();
      ctx.globalAlpha = p.firme ? 1 : p.forma === 'anel' ? 1 - u : 1 - u * u;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.cor;
      const f = formas[p.forma] || formas.c;
      f(ctx, { ...p, tam: p.forma === 'anel' || p.firme ? p.tam : p.tam * (1 - u * 0.4) }, u);
      ctx.restore();
    }
    for (const t of txts) {
      const u = t.t / t.vida;
      const esc = u < 0.2 ? 0.6 + (u / 0.2) * 0.5 : 1.1 - (u - 0.2) * 0.1;
      ctx.save();
      ctx.globalAlpha = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
      ctx.translate(t.x, t.y - u * 46);
      ctx.scale(esc, esc);
      textoContorno(ctx, t.txt, 0, 0, t.tam, t.cor, { contorno: t.contorno, espessura: Math.max(3, t.tam * 0.18) });
      ctx.restore();
    }
  }
  return {
    add, estourar, subir, faiscas, flocos, anel, texto, atualizar, desenhar, formas, r,
    limpar() { ps = []; txts = []; },
    get quantas() { return ps.length; },
  };
}
