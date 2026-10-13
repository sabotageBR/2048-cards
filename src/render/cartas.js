// Cartas na mesa: a parte parada de cada carta (pintada pelo tema do mundo,
// temas/index.js) vai para uma cache offscreen por tema, tipo, valor e
// tamanho; por cima, a cada quadro, a pose (escala, squash pela base, giro,
// alpha), o brilho que anda, a sombra das cartas de tras da fila e o
// destaque da carta da vez. As skins antigas estao em modelos/legado/.
import { temaDe } from './temas/index.js';
import { rr } from './desenho.js';

const cache = new Map();
let cacheDpr = 1;
export function limparCache() { cache.clear(); }

/** Pintura das cartas do tema do mundo (padrao: o do mundo 1). */
let tema = temaDe(1);
/** @param {{ id: string, carta: Function, temBrilho: Function, brilho: Function, raio: Function }} t */
export function definirTema(t) { if (t && t.carta) tema = t; }

const chave = (carta, w, h) => `${tema.id}|${carta.tipo}|${carta.v}|${w}x${h}`;

/** Imagem da carta (offscreen), com margem para a sombra e o brilho. */
export function imagemCarta(carta, w, h, dpr = 1) {
  if (dpr !== cacheDpr) { cache.clear(); cacheDpr = dpr; }
  const k = chave(carta, w, h);
  let img = cache.get(k);
  if (img) return img;
  if (cache.size > 240) cache.clear();
  const folga = Math.ceil(w * 0.22);
  const c = document.createElement('canvas');
  c.width = Math.ceil((w + folga * 2) * dpr);
  c.height = Math.ceil((h + folga * 2) * dpr);
  const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
  ctx.scale(dpr, dpr);
  ctx.translate(folga + w / 2, folga + h / 2);
  tema.carta(ctx, carta, { x: -w / 2, y: -h / 2, w, h });
  img = { canvas: c, folga };
  cache.set(k, img);
  return img;
}

/**
 * Desenha a carta em (x, y, w, h) com escala, squash, giro e alpha em volta do centro.
 * @param {CanvasRenderingContext2D} ctx
 */
export function desenharCarta(ctx, carta, { x, y, w, h, esc = 1, alpha = 1, dpr = 1, destaque = 0, rot = 0, escurecer: sombra = 0, t = 0, escY = 1 }) {
  const img = imagemCarta(carta, Math.round(w), Math.round(h), dpr);
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
  ctx.translate(x + w / 2, y + h / 2);
  if (rot) ctx.rotate(rot);
  if (esc !== 1) ctx.scale(esc, esc);
  // squash da linha do tempo: achata pela base da carta
  if (escY !== 1) { ctx.translate(0, h / 2); ctx.scale(1 / Math.sqrt(escY), escY); ctx.translate(0, -h / 2); }
  const fw = img.canvas.width / dpr, fh = img.canvas.height / dpr;
  ctx.drawImage(img.canvas, -fw / 2, -fh / 2, fw, fh);
  const r = { x: -w / 2, y: -h / 2, w, h };
  if (tema.temBrilho(carta)) tema.brilho(ctx, carta, r, t);
  const raio = tema.raio(w);
  if (sombra > 0) { rr(ctx, r.x, r.y, w, h, raio); ctx.fillStyle = `rgba(20,8,24,${sombra})`; ctx.fill(); }
  if (destaque > 0) {
    ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 14 * destaque;
    rr(ctx, r.x - 2, r.y - 2, w + 4, h + 4, raio + 2);
    ctx.strokeStyle = `rgba(255,226,122,${0.5 + destaque * 0.5})`; ctx.lineWidth = 3; ctx.stroke();
  }
  ctx.restore();
}
