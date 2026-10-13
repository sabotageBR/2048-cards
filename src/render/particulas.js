// Particulas com formas livres (estouro, anel, fumaca e as formas de cada
// mundo, registradas em `formas` por efeitos.js) e texto flutuante com
// contorno, funcao do dt. O sorteio usa semente propria, entao dois quadros
// iguais saem iguais (a folha de tools/mundos.html conta com isso).
// p: { x, y, vx, vy, g, vida, t, tam, cor, forma, rot, vr, arrasto, fase,
//      osc?, oscF?, arrastoY?, mistura?, firme? }
// osc/oscF: balanco lateral (px, rad/s), so no desenho (bolha, folha, floco);
// arrastoY: o arrasto vale tambem na vertical (velocidade terminal);
// mistura: globalCompositeOperation ('lighter' para neon);
// firme: nao some nem encolhe com a idade (projeteis).
// A forma recebe p inteiro (vx/vy servem para rastro) e u = idade (0..1);
// forma que comeca com 'anel' nao encolhe e some em linha reta.
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
  const ehAnel = (p) => typeof p.forma === 'string' && p.forma.startsWith('anel');

  function add(p) {
    const q = { vx: 0, vy: 0, g: 0, t: 0, rot: 0, vr: 0, arrasto: 0.985, forma: 'c', fase: r() * TAU };
    for (const k of Object.keys(p)) if (p[k] !== undefined) q[k] = p[k];
    ps.push(q);
  }
  /**
   * Estouro em volta de (x, y). op: { g, vida, tam, forma, vr (giro maximo, rad/s),
   * dir e abre (direcao e abertura do leque, rad; sem dir, todas as direcoes),
   * sobe (impulso para cima por unidade de forca, px/s; padrao 60), semGiro,
   * arrasto, arrastoY, osc, oscF, mistura }.
   * @param {number|object} [op] numero = vida
   */
  function estourar(x, y, cores, n = 14, forca = 1, op = {}) {
    const o = typeof op === 'number' ? { vida: op } : op;
    for (let i = 0; i < n; i++) {
      const a = o.dir !== undefined ? o.dir + (r() - 0.5) * (o.abre ?? 1) : r() * TAU, v = (60 + r() * 220) * forca;
      add({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.sobe ?? 60) * forca, g: o.g ?? 520, vida: o.vida || 0.6, tam: (o.tam || 6) * (0.6 + r() * 0.8),
        cor: corDe(cores, i), forma: o.forma || (r() < 0.5 ? 'q' : 'c'), rot: o.semGiro ? 0 : r() * TAU, vr: o.semGiro ? 0 : (r() - 0.5) * 2 * (o.vr ?? 6),
        arrasto: o.arrasto, arrastoY: o.arrastoY, osc: o.osc, oscF: o.oscF, mistura: o.mistura,
      });
    }
  }
  /** Fumaca ou poeira subindo de uma faixa de largura `larg`. */
  function subir(x, y, cores, n = 8, op = {}) {
    for (let i = 0; i < n; i++) {
      add({
        x: x + (r() - 0.5) * (op.larg || 20), y, vx: (r() - 0.5) * 30, vy: -(40 + r() * 90) * (op.forca || 1), g: op.g ?? -20, vida: op.vida || 1.1,
        tam: (op.tam || 6) * (0.5 + r()), cor: corDe(cores, i), forma: op.forma || 'c', arrasto: 0.99,
      });
    }
  }
  function anel(x, y, cor, tam = 40, vida = 0.45) { add({ x, y, vida, tam, cor, forma: 'anel' }); }
  function texto(x, y, txt, cor, tam = 26, contorno = 'rgba(0,0,0,0.55)') { txts.push({ x, y, txt, cor, tam, contorno, t: 0, vida: 0.9 }); }

  function atualizar(dt) {
    for (const p of ps) {
      p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      // arrasto por segundo (nao por quadro): a mesma curva em 30 e 120 Hz
      const k = Math.pow(p.arrasto, dt * 60);
      p.vx *= k; if (p.arrastoY) p.vy *= k;
      p.rot += p.vr * dt;
    }
    ps = ps.filter((p) => p.t < p.vida);
    for (const t of txts) t.t += dt;
    txts = txts.filter((t) => t.t < t.vida);
  }
  function desenhar(ctx) {
    for (const p of ps) {
      const u = p.t / p.vida;
      const anel = ehAnel(p);
      ctx.save();
      if (p.mistura) ctx.globalCompositeOperation = p.mistura;
      ctx.globalAlpha = p.firme ? 1 : anel ? 1 - u : 1 - u * u;
      const dx = p.osc ? Math.sin(p.t * (p.oscF || 6) + p.fase) * p.osc * Math.min(1, p.t * 3) : 0;
      ctx.translate(p.x + dx, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.cor;
      const f = formas[p.forma] || formas.c;
      f(ctx, { ...p, tam: anel || p.firme ? p.tam : p.tam * (1 - u * 0.4) }, u);
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
    add, estourar, subir, anel, texto, atualizar, desenhar, formas, r,
    limpar() { ps = []; txts = []; },
    get quantas() { return ps.length; },
  };
}
