// Skins de carta: cada skin e uma funcao que desenha uma carta num retangulo.
// O numero fica no canto superior esquerdo (a faixa que continua visivel
// quando outra carta cobre esta) e, maior, no centro. As cartas sao
// desenhadas numa cache offscreen por (skin, valor, cor, tipo, largura).
// Sem estado de jogo: a thumb e o laboratorio usam as mesmas funcoes.

export const SKINS = ['neon', 'classico', 'blocos', 'gemas', 'pixel', 'papel'];

/** Cor por valor (padrao; o cenario pode trocar em pal.cores). */
export const CORES_VALOR = {
  2: '#2f6df6', 4: '#e6b400', 8: '#2fb24a', 16: '#c4299e', 32: '#f0742c', 64: '#e2382f',
  128: '#7d4de8', 256: '#1fb8b0', 512: '#ff5fa2', 1024: '#f3a51a', 2048: '#ffd84a', 4096: '#f4f4ff', 8192: '#ffffff',
};
/** Cores dos naipes (variante). */
export const CORES_NAIPE = ['#e2382f', '#2f6df6', '#2fb24a', '#e6b400'];

const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';

export function corDoValor(v, pal) {
  const cores = (pal && pal.cores) || CORES_VALOR;
  return cores[v] || CORES_VALOR[v] || '#8a8aa0';
}

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function misturar(a, b, k) {
  const A = hex(a), B = hex(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function escurecer(h, k) { return misturar(h, '#000000', k); }
export function clarear(h, k) { return misturar(h, '#ffffff', k); }

export function retanguloArredondado(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

/** Texto do valor: 2048 e maiores ficam menores para caber. */
function fonte(v, base) {
  const s = String(v);
  const fator = s.length <= 2 ? 1 : s.length === 3 ? 0.84 : 0.7;
  return `700 ${Math.round(base * fator)}px ${FONTE}`;
}

function rotulos(ctx, v, w, h, corTexto, sombra) {
  const s = String(v);
  ctx.fillStyle = corTexto;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = fonte(v, h * 0.2);
  if (sombra) { ctx.shadowColor = sombra; ctx.shadowBlur = 0; ctx.shadowOffsetY = Math.max(1, h * 0.012); }
  ctx.fillText(s, w * 0.1, h * 0.14);
  ctx.textAlign = 'center';
  ctx.font = fonte(v, h * 0.34);
  ctx.fillText(s, w / 2, h * 0.6);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
}

// ---------------------------------------------------------------- skins

const skins = {
  /** Neon: carta escura com borda brilhante na cor do valor (referencia). */
  neon(ctx, carta, w, h, pal) {
    const cor = carta.cor >= 0 && pal.naipes ? CORES_NAIPE[carta.cor] : corDoValor(carta.v, pal);
    const r = w * 0.12;
    ctx.shadowColor = cor; ctx.shadowBlur = w * 0.16;
    retanguloArredondado(ctx, w * 0.06, h * 0.045, w * 0.88, h * 0.91, r);
    ctx.fillStyle = escurecer(cor, 0.42);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(2, w * 0.045);
    ctx.strokeStyle = clarear(cor, 0.35);
    ctx.stroke();
    // brilho interno no topo
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(0.35, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = g; ctx.fill();
    rotulos(ctx, carta.v, w, h, '#ffffff', 'rgba(0,0,0,0.45)');
  },
  /** Classico: carta branca com indice no canto e miolo na cor do valor. */
  classico(ctx, carta, w, h, pal) {
    const cor = carta.cor >= 0 && pal.naipes ? CORES_NAIPE[carta.cor] : corDoValor(carta.v, pal);
    const r = w * 0.1;
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = w * 0.08; ctx.shadowOffsetY = w * 0.03;
    retanguloArredondado(ctx, w * 0.04, h * 0.03, w * 0.92, h * 0.94, r);
    ctx.fillStyle = '#fffdf6'; ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = Math.max(1.5, w * 0.025); ctx.strokeStyle = escurecer(cor, 0.15); ctx.stroke();
    // miolo
    retanguloArredondado(ctx, w * 0.16, h * 0.34, w * 0.68, h * 0.52, r * 0.8);
    ctx.fillStyle = cor; ctx.fill();
    ctx.fillStyle = cor; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = fonte(carta.v, h * 0.19);
    ctx.fillText(String(carta.v), w * 0.1, h * 0.15);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ctx.font = fonte(carta.v, h * 0.3);
    ctx.fillText(String(carta.v), w / 2, h * 0.61);
  },
};

/** Blocos 2048: tile chapado na cor do valor, sem borda, numero grande. */
skins.blocos = function (ctx, carta, w, h, pal) {
  const cor = carta.cor >= 0 && pal.naipes ? CORES_NAIPE[carta.cor] : corDoValor(carta.v, pal);
  const r = w * 0.1;
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = w * 0.05; ctx.shadowOffsetY = w * 0.04;
  retanguloArredondado(ctx, w * 0.05, h * 0.04, w * 0.9, h * 0.92, r);
  ctx.fillStyle = cor; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  retanguloArredondado(ctx, w * 0.05, h * 0.04, w * 0.9, h * 0.5, r);
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
  const claro = carta.v <= 4;
  rotulos(ctx, carta.v, w, h, claro ? '#3b2d1f' : '#ffffff', claro ? '' : 'rgba(0,0,0,0.25)');
};
/** Gemas: cristal facetado com gradiente diagonal e brilho. */
skins.gemas = function (ctx, carta, w, h, pal) {
  const cor = carta.cor >= 0 && pal.naipes ? CORES_NAIPE[carta.cor] : corDoValor(carta.v, pal);
  const r = w * 0.16;
  ctx.shadowColor = cor; ctx.shadowBlur = w * 0.1;
  retanguloArredondado(ctx, w * 0.06, h * 0.045, w * 0.88, h * 0.91, r);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, clarear(cor, 0.45)); g.addColorStop(0.5, cor); g.addColorStop(1, escurecer(cor, 0.45));
  ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, w * 0.035); ctx.strokeStyle = escurecer(cor, 0.35); ctx.stroke();
  // facetas
  ctx.save();
  retanguloArredondado(ctx, w * 0.06, h * 0.045, w * 0.88, h * 0.91, r); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.045); ctx.lineTo(w * 0.7, h * 0.045); ctx.lineTo(w * 0.06, h * 0.55); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath(); ctx.moveTo(w * 0.94, h * 0.35); ctx.lineTo(w * 0.94, h * 0.96); ctx.lineTo(w * 0.3, h * 0.96); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.ellipse(w * 0.3, h * 0.2, w * 0.1, h * 0.04, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  rotulos(ctx, carta.v, w, h, '#ffffff', 'rgba(0,0,0,0.45)');
};
/** Pixel: cantos retos, contorno grosso, bisel e tramado retro. */
skins.pixel = function (ctx, carta, w, h, pal) {
  const cor = carta.cor >= 0 && pal.naipes ? CORES_NAIPE[carta.cor] : corDoValor(carta.v, pal);
  const u = Math.max(2, Math.round(w * 0.045));
  const x0 = u, y0 = u, ww = w - 2 * u, hh = h - 2 * u;
  ctx.fillStyle = '#1b1526'; ctx.fillRect(x0 - u, y0 - u, ww + 2 * u, hh + 2 * u);
  ctx.fillStyle = cor; ctx.fillRect(x0, y0, ww, hh);
  ctx.fillStyle = clarear(cor, 0.45); ctx.fillRect(x0, y0, ww, u); ctx.fillRect(x0, y0, u, hh);
  ctx.fillStyle = escurecer(cor, 0.35); ctx.fillRect(x0, y0 + hh - u, ww, u); ctx.fillRect(x0 + ww - u, y0, u, hh);
  // tramado no rodape
  ctx.fillStyle = escurecer(cor, 0.25);
  for (let y = y0 + hh - u * 4; y < y0 + hh - u; y += u) for (let x = x0 + u + ((y / u) % 2 ? u : 0); x < x0 + ww - u; x += u * 2) ctx.fillRect(x, y, u, u);
  // cantos "recortados"
  ctx.fillStyle = '#1b1526'; ctx.fillRect(x0 - u, y0 - u, u, u); ctx.fillRect(x0 + ww, y0 - u, u, u); ctx.fillRect(x0 - u, y0 + hh, u, u); ctx.fillRect(x0 + ww, y0 + hh, u, u);
  ctx.textBaseline = 'middle';
  const s = String(carta.v);
  ctx.lineJoin = 'miter'; ctx.lineWidth = Math.max(2, w * 0.06); ctx.strokeStyle = '#1b1526'; ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left'; ctx.font = fonte(carta.v, h * 0.2); ctx.strokeText(s, w * 0.1, h * 0.14); ctx.fillText(s, w * 0.1, h * 0.14);
  ctx.textAlign = 'center'; ctx.font = fonte(carta.v, h * 0.34); ctx.strokeText(s, w / 2, h * 0.6); ctx.fillText(s, w / 2, h * 0.6);
};
/** Papel: cartao creme com traco a mao e tinta na cor do valor. */
skins.papel = function (ctx, carta, w, h, pal) {
  const cor = carta.cor >= 0 && pal.naipes ? CORES_NAIPE[carta.cor] : corDoValor(carta.v, pal);
  const tinta = escurecer(cor, 0.25);
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = w * 0.05; ctx.shadowOffsetY = w * 0.03;
  retanguloArredondado(ctx, w * 0.05, h * 0.04, w * 0.9, h * 0.92, w * 0.08);
  ctx.fillStyle = '#fbf3df'; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  // traco "a mao": o contorno passa duas vezes, levemente deslocado
  ctx.strokeStyle = tinta; ctx.lineWidth = Math.max(1.5, w * 0.03); ctx.lineCap = 'round';
  for (const [dx, dy] of [[0, 0], [w * 0.012, -h * 0.008]]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.1 + dx, h * 0.07 + dy);
    ctx.quadraticCurveTo(w * 0.5 + dx, h * 0.05 + dy, w * 0.9 + dx, h * 0.08 + dy);
    ctx.quadraticCurveTo(w * 0.93 + dx, h * 0.5 + dy, w * 0.9 + dx, h * 0.93 + dy);
    ctx.quadraticCurveTo(w * 0.5 + dx, h * 0.95 + dy, w * 0.1 + dx, h * 0.92 + dy);
    ctx.quadraticCurveTo(w * 0.07 + dx, h * 0.5 + dy, w * 0.1 + dx, h * 0.07 + dy);
    ctx.stroke();
  }
  // mancha de tinta no miolo
  ctx.fillStyle = cor; ctx.globalAlpha = 0.18;
  ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.62, w * 0.3, h * 0.2, 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = tinta; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.font = fonte(carta.v, h * 0.19); ctx.fillText(String(carta.v), w * 0.12, h * 0.16);
  ctx.textAlign = 'center'; ctx.font = fonte(carta.v, h * 0.32); ctx.fillText(String(carta.v), w / 2, h * 0.62);
};


function desenharEspecial(ctx, carta, w, h, pal) {
  const r = w * 0.12;
  const tipo = carta.tipo;
  const cor = tipo === 'coringa' ? '#ffd84a' : tipo === 'bomba' ? '#ff5a3c' : '#5ee0ff';
  ctx.shadowColor = cor; ctx.shadowBlur = w * 0.18;
  retanguloArredondado(ctx, w * 0.06, h * 0.045, w * 0.88, h * 0.91, r);
  ctx.fillStyle = tipo === 'coringa' ? '#3b2a66' : tipo === 'bomba' ? '#3a1d1d' : '#163a44';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, w * 0.05); ctx.strokeStyle = cor; ctx.stroke();
  ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (tipo === 'coringa') {
    // estrela de 5 pontas
    const cx = w / 2, cy = h * 0.58, R = w * 0.3, rr = R * 0.45;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const d = i % 2 ? rr : R;
      ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    }
    ctx.closePath(); ctx.fill();
    ctx.font = `700 ${Math.round(h * 0.16)}px ${FONTE}`;
    ctx.fillText('★', w * 0.2, h * 0.15);
  } else if (tipo === 'bomba') {
    const cx = w / 2, cy = h * 0.62, R = w * 0.26;
    ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(cx - R * 0.3, cy - R * 0.3, R * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c9a5'; ctx.lineWidth = Math.max(2, w * 0.04); ctx.beginPath(); ctx.moveTo(cx + R * 0.5, cy - R * 0.8); ctx.quadraticCurveTo(cx + R, cy - R * 1.5, cx + R * 1.2, cy - R * 1.1); ctx.stroke();
    ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(cx + R * 1.2, cy - R * 1.1, w * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.font = `700 ${Math.round(h * 0.16)}px ${FONTE}`; ctx.fillText('!', w * 0.16, h * 0.15);
  } else {
    ctx.font = `700 ${Math.round(h * 0.3)}px ${FONTE}`;
    ctx.fillText('×2', w / 2, h * 0.6);
    ctx.font = `700 ${Math.round(h * 0.16)}px ${FONTE}`; ctx.textAlign = 'left'; ctx.fillText('×2', w * 0.1, h * 0.15);
  }
}

function desenharPedra(ctx, carta, w, h) {
  const r = w * 0.14;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = w * 0.08;
  retanguloArredondado(ctx, w * 0.05, h * 0.04, w * 0.9, h * 0.92, r);
  ctx.fillStyle = '#6b6f7a'; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#3e4149'; ctx.lineWidth = Math.max(2, w * 0.04); ctx.stroke();
  // manchas
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.ellipse(w * 0.35, h * 0.3, w * 0.2, h * 0.1, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(w * 0.65, h * 0.7, w * 0.22, h * 0.12, 0.5, 0, Math.PI * 2); ctx.fill();
  // rachaduras conforme o hp
  const rach = Math.max(0, 3 - (carta.hp || 3));
  ctx.strokeStyle = '#2b2d33'; ctx.lineWidth = Math.max(1.5, w * 0.03); ctx.lineCap = 'round';
  const tracos = [[0.5, 0.1, 0.42, 0.4, 0.55, 0.62], [0.15, 0.5, 0.35, 0.58, 0.3, 0.85], [0.85, 0.3, 0.68, 0.45, 0.8, 0.75]];
  for (let i = 0; i < Math.min(3, rach + (carta.hp ? 0 : 3)); i++) {
    const t = tracos[i]; ctx.beginPath(); ctx.moveTo(w * t[0], h * t[1]); ctx.lineTo(w * t[2], h * t[3]); ctx.lineTo(w * t[4], h * t[5]); ctx.stroke();
  }
}

function desenharGelo(ctx, w, h) {
  const r = w * 0.12;
  retanguloArredondado(ctx, w * 0.06, h * 0.045, w * 0.88, h * 0.91, r);
  ctx.fillStyle = 'rgba(190,230,255,0.55)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(2, w * 0.04); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, w * 0.02);
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h * 0.8); ctx.lineTo(w * 0.45, h * 0.55); ctx.lineTo(w * 0.4, h * 0.35);
  ctx.moveTo(w * 0.45, h * 0.55); ctx.lineTo(w * 0.7, h * 0.5);
  ctx.stroke();
}

// ---------------------------------------------------------------- cache

const cache = new Map();
let cacheDpr = 1;
export function limparCache() { cache.clear(); }

function chave(skin, carta, w, h, pal) {
  return `${skin}|${carta.tipo}|${carta.v}|${pal.naipes ? carta.cor : 0}|${carta.gelo ? 1 : 0}|${carta.hp || 0}|${w}x${h}|${pal.id || ''}`;
}

/** Imagem da carta (offscreen), com margem para a sombra/brilho. */
export function imagemCarta(skin, carta, w, h, pal, dpr = 1) {
  if (dpr !== cacheDpr) { cache.clear(); cacheDpr = dpr; }
  const k = chave(skin, carta, w, h, pal);
  let img = cache.get(k);
  if (img) return img;
  if (cache.size > 240) cache.clear();
  const folga = Math.ceil(w * 0.22);
  const c = document.createElement('canvas');
  c.width = Math.ceil((w + folga * 2) * dpr);
  c.height = Math.ceil((h + folga * 2) * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.translate(folga, folga);
  if (carta.tipo === 'pedra') desenharPedra(ctx, carta, w, h);
  else if (carta.tipo !== 'normal') desenharEspecial(ctx, carta, w, h, pal);
  else (skins[skin] || skins.neon)(ctx, carta, w, h, pal);
  if (carta.gelo) desenharGelo(ctx, w, h);
  img = { canvas: c, folga };
  cache.set(k, img);
  return img;
}

/**
 * Desenha a carta em (x, y, w, h) com escala/alpha opcionais em volta do centro.
 * @param {CanvasRenderingContext2D} ctx
 */
export function desenharCarta(ctx, skin, carta, { x, y, w, h, pal, esc = 1, alpha = 1, dpr = 1, destaque = 0, rot = 0, escurecer: sombra = 0 }) {
  const img = imagemCarta(skin, carta, Math.round(w), Math.round(h), pal, dpr);
  const cx = x + w / 2, cy = y + h / 2;
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = Math.max(0, alpha);
  ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);
  if (esc !== 1) ctx.scale(esc, esc);
  const fw = img.canvas.width / dpr, fh = img.canvas.height / dpr;
  ctx.drawImage(img.canvas, -fw / 2, -fh / 2, fw, fh);
  if (sombra > 0) {
    retanguloArredondado(ctx, -w / 2 + w * 0.06, -h / 2 + h * 0.045, w * 0.88, h * 0.91, w * 0.12);
    ctx.fillStyle = `rgba(10,6,24,${sombra})`;
    ctx.fill();
  }
  if (destaque > 0) {
    retanguloArredondado(ctx, -w / 2 + w * 0.06, -h / 2 + h * 0.045, w * 0.88, h * 0.91, w * 0.12);
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * destaque})`;
    ctx.lineWidth = Math.max(2, w * 0.05);
    ctx.stroke();
  }
  ctx.restore();
}

/** Verso/slot vazio (contorno tracejado). */
export function desenharSlot(ctx, x, y, w, h, cor, alpha = 0.35, icone = '') {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.setLineDash([w * 0.08, w * 0.06]);
  ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1.5, w * 0.03);
  retanguloArredondado(ctx, x + w * 0.06, y + h * 0.045, w * 0.88, h * 0.91, w * 0.12);
  ctx.stroke();
  ctx.setLineDash([]);
  if (icone) {
    ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(h * 0.3)}px ${FONTE}`;
    ctx.fillText(icone, x + w / 2, y + h / 2);
  }
  ctx.restore();
}
