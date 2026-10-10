// Kit de desenho compartilhado pelos temas das ideias: formas, texto com
// contorno, cores, sementes e um sistema de particulas com formas livres.
// Nada daqui vai para a build (tools/empacotar.mjs so copia src/).

export const TAU = Math.PI * 2;
export const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * u;
export const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
/** Posicao do valor na escada 2..2048 (0..10); 4096 = 11. */
export const nivel = (v) => Math.max(0, Math.round(Math.log2(Math.max(2, v))) - 1);

/** Gerador deterministico (para cenarios com estrelas, janelas etc.). */
export function semente(s) {
  let a = s >>> 0 || 1;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

export function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function circulo(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
export function elipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); }

/** Texto centralizado com contorno. */
export function texto(ctx, txt, x, y, tam, cor, op = {}) {
  ctx.save();
  ctx.font = `${op.peso || 700} ${Math.round(tam)}px ${op.fonte || FONTE}`;
  ctx.textAlign = op.alinhar || 'center';
  ctx.textBaseline = 'middle';
  if (op.max) {
    const m = ctx.measureText(txt).width;
    if (m > op.max) { const k = op.max / m; ctx.translate(x, y); ctx.scale(k, k); x = 0; y = 0; }
  }
  if (op.contorno) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = op.espessura || tam * 0.2;
    ctx.strokeStyle = op.contorno;
    ctx.strokeText(txt, x, y);
  }
  if (op.sombra) { ctx.fillStyle = op.sombra; ctx.fillText(txt, x, y + tam * 0.08); }
  ctx.fillStyle = cor;
  ctx.fillText(txt, x, y);
  ctx.restore();
}

function hex(h) {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function misturar(a, b, k) {
  const x = hex(a), y = hex(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
export const escurecer = (h, k) => misturar(h, '#000000', k);
export const clarear = (h, k) => misturar(h, '#ffffff', k);
export function rgba(h, a) { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; }

/** Estrela de n pontas (raio externo r, interno ri). */
export function estrela(ctx, x, y, r, ri, n = 5, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, rr0 = i % 2 ? ri : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr0, y + Math.sin(a) * rr0);
  }
  ctx.closePath();
}

/** Formata o valor (4096 cabe; 2048 -> "2048"). */
export const rotulo = (v) => String(v);

/** Texto curto de uma meta; `nomes.monte(n)` troca o "monte" pela ficcao do tema. */
export function textoMeta(m, nomes = {}) {
  switch (m.tipo) {
    case 'montes': return nomes.monte ? nomes.monte(m.alvo) : `Complete ${m.alvo} monte${m.alvo > 1 ? 's' : ''}`;
    case 'pontos': return `${m.alvo} pontos`;
    case 'cartas': return `Faça um ${m.v}`;
    case 'cascata': return `Cascata x${m.alvo}`;
    case 'pedras': return 'Quebre as pedras';
    case 'sobreviver': return `Jogue ${m.alvo} cartas`;
    default: return '';
  }
}

/**
 * Geometria de torre: as pecas sao faixas largas empilhadas DE BAIXO para
 * cima (indice 0 no chao), sem sobreposicao. A coluna pode crescer para cima
 * da mesa original (`fator` > 1) ate a faixa do HUD. A fila e o descarte viram
 * faixas tambem.
 * Com `colar`, em retrato o chao desce para perto da fila (a torre ganha a
 * altura que sobrava entre a mesa e a fila).
 * @param {any} L layout de calcularLayout
 * @param {{ fator?: number, largura?: number, filaFator?: number, colar?: boolean }} [op]
 */
export function geoTorre(L, op = {}) {
  const base0 = L.coluna(0);
  const chao = op.colar && !L.fila.vertical ? Math.round(L.fila.y - L.gap * 5) : base0.y + base0.h;
  const teto = L.topo + 8;
  const fator = Math.min(op.fator || 1, (chao - teto) / base0.h);
  const alturaTotal = base0.h * fator;
  const fh = Math.floor(alturaTotal / L.pilhaMax);
  const larg = op.largura || 1;
  const x0 = (c) => L.coluna(c).x + (L.cw - L.cw * larg) / 2;
  const w = Math.round(L.cw * larg);
  const ff = op.filaFator || 1.12;
  return {
    faixa: fh,
    chao,
    carta: (c, i) => ({ x: x0(c), y: chao - (i + 1) * fh, w, h: fh }),
    coluna: (c) => ({ x: x0(c), y: chao - L.pilhaMax * fh, w, h: L.pilhaMax * fh }),
    filaPos(k) {
      const p = L.filaPos(k);
      const k0 = p.w / L.fila.cw;
      const fw = Math.round(w * ff * k0), fhh = Math.round(fh * ff * k0);
      return { x: Math.round(p.x + p.w / 2 - fw / 2), y: Math.round(p.y + p.h / 2 - fhh / 2), w: fw, h: fhh };
    },
    descarte: L.descarteNaMesa
      ? { x: L.descarte.x + (L.cw - w) / 2, y: chao - fh, w, h: fh }
      : (() => { const d = L.descarte; return { x: Math.round(d.x + d.w / 2 - w / 2), y: Math.round(d.y + d.h / 2 - fh / 2), w, h: fh }; })(),
  };
}

/**
 * Particulas com formas livres: cada tema registra desenhistas por forma.
 * p: { x, y, vx, vy, g, vida, t, tam, cor, forma, rot, vr, arrasto }
 */
export function criarParticulas() {
  /** @type {any[]} */ let ps = [];
  /** @type {any[]} */ let txts = [];
  const r = semente(7);
  /** @type {Record<string, (ctx: CanvasRenderingContext2D, p: any, u: number) => void>} */
  const formas = {
    c: (ctx, p) => { circulo(ctx, 0, 0, p.tam / 2); ctx.fill(); },
    q: (ctx, p) => { ctx.fillRect(-p.tam / 2, -p.tam / 2, p.tam, p.tam); },
    estrela: (ctx, p) => { estrela(ctx, 0, 0, p.tam / 2, p.tam / 4.5); ctx.fill(); },
    anel: (ctx, p, u) => { ctx.lineWidth = Math.max(1, p.tam * 0.12 * (1 - u)); ctx.strokeStyle = p.cor; circulo(ctx, 0, 0, p.tam * (0.3 + u * 1.4)); ctx.stroke(); },
  };
  function add(p) {
    ps.push({ vx: 0, vy: 0, g: 0, t: 0, rot: 0, vr: 0, arrasto: 0.985, forma: 'c', ...p });
  }
  function estourar(x, y, cores, n = 14, forca = 1, op = {}) {
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, v = (60 + r() * 220) * forca;
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * forca, g: op.g ?? 520, vida: op.vida || 0.6, tam: (op.tam || 6) * (0.6 + r() * 0.8),
        cor: Array.isArray(cores) ? cores[i % cores.length] : cores, forma: op.forma || (r() < 0.5 ? 'q' : 'c'), rot: r() * TAU, vr: (r() - 0.5) * 12 });
    }
  }
  function subir(x, y, cores, n = 8, op = {}) {
    for (let i = 0; i < n; i++) {
      add({ x: x + (r() - 0.5) * (op.larg || 20), y, vx: (r() - 0.5) * 30, vy: -(40 + r() * 90) * (op.forca || 1), g: op.g ?? -20, vida: op.vida || 1.1,
        tam: (op.tam || 6) * (0.5 + r()), cor: Array.isArray(cores) ? cores[i % cores.length] : cores, forma: op.forma || 'c', arrasto: 0.99 });
    }
  }
  function anel(x, y, cor, tam = 40, vida = 0.45) { add({ x, y, vida, tam, cor, forma: 'anel' }); }
  function textoFlutuante(x, y, txt, cor, tam = 26, contorno = 'rgba(0,0,0,0.55)') { txts.push({ x, y, txt, cor, tam, contorno, t: 0, vida: 0.9 }); }
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
      ctx.globalAlpha = p.forma === 'anel' ? 1 - u : 1 - u * u;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.cor;
      const f = formas[p.forma] || formas.c;
      f(ctx, { ...p, tam: p.forma === 'anel' ? p.tam : p.tam * (1 - u * 0.4) }, u);
      ctx.restore();
    }
    for (const t of txts) {
      const u = t.t / t.vida;
      const esc = u < 0.2 ? 0.6 + (u / 0.2) * 0.5 : 1.1 - (u - 0.2) * 0.1;
      ctx.save();
      ctx.globalAlpha = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1;
      ctx.translate(t.x, t.y - u * 46);
      ctx.scale(esc, esc);
      texto(ctx, t.txt, 0, 0, t.tam, t.cor, { contorno: t.contorno });
      ctx.restore();
    }
  }
  return { add, estourar, subir, anel, texto: textoFlutuante, atualizar, desenhar, formas, limpar() { ps = []; txts = []; } };
}
