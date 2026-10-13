// Kit dos temas de mundo (temas/index.js): a carta limpa e a mesa limpa,
// parametrizadas pelo material de cada tema. Carta: corpo, faixa de cima com
// o numero (o que aparece quando outra carta cobre esta), o numero grande no
// miolo (sem figura) e os especiais (coringa, bomba, x2, x4) no mesmo
// material. Mesa: tabuleiro, tapete da fila, espaco vazio e o lugar do
// descarte. Mais ajudantes de cenario (degrade, luz, morros em onda).
// Tudo desenhado num retangulo centrado na origem (cartas) ou em coordenadas
// de tela (mesa e cenario); o tempo entra por `t` (s) ou `agora` (ms).
import { rr, circulo, estrela, texto, rgba, clarear, escurecer, nivel, semente, TAU } from '../desenho.js';

/** Raio do canto da carta (o padrao; cada tema pode ter o dele, `raio`). */
export const raioCarta = (w) => Math.max(5, w * 0.11);

/** Textos pintados nas cartas (idioma): o rotulo da bomba. */
const rotulos = { bomba: 'BOMB' };
export function definirRotulos(r) { Object.assign(rotulos, r); }

/** Fracao da altura da carta que fica visivel na pilha (a faixa do numero). */
const FAIXA = 0.3;

// ------------------------------------------------------------ cartas

/**
 * Cartas de um tema.
 * @param {{
 *   cores: string[],                       // cor de cada valor (2, 4, ... 4096)
 *   corpo: (c: string) => string[],        // degrade do corpo (de cima para baixo)
 *   faixa?: (c: string) => string[],       // degrade da faixa; sem ela, a faixa e uma linha da cor
 *   numFaixa?: (c: string) => string,      // cor do numero pequeno
 *   numMiolo: (c: string) => string,       // cor do numero grande
 *   contorno?: (c: string) => string|null, // contorno do numero grande
 *   borda: (c: string) => string,          // fio da borda
 *   bordaLarg?: number,                    // espessura da borda (fracao da largura)
 *   neon?: boolean,                        // brilho da cor em volta da carta e do numero
 *   vidro?: boolean,                       // reflexo de vidro no alto
 *   material?: (ctx: any, d: any, c: string) => void, // textura por cima do corpo
 *   raio?: number,                         // canto (fracao da largura); padrao o da carta do duelo
 *   ondaFaixa?: boolean,                   // a faixa termina em onda (organica) em vez de reta
 *   fio?: string,                          // fio interno, como carta de baralho
 *   especial: { coringa: string[], bomba: string[], dobro: string[], quadruplo: string[], tinta: string },
 * }} est
 */
export function criarCartas(est) {
  const cor = (v) => est.cores[Math.min(est.cores.length - 1, nivel(v || 2))];
  const bl = est.bordaLarg || 0.03;
  const raioDe = (w) => (est.raio ? Math.max(4, w * est.raio) : raioCarta(w));

  /** Faixa de cima: reta ou em onda. */
  function caminhoFaixa(ctx, r, fh) {
    if (!est.ondaFaixa) { ctx.beginPath(); ctx.rect(r.x, r.y, r.w, fh); return; }
    ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + r.w, r.y); ctx.lineTo(r.x + r.w, r.y + fh);
    const n = 3, a = fh * 0.1;
    for (let i = n * 2; i >= 0; i--) ctx.lineTo(r.x + (r.w * i) / (n * 2), r.y + fh + (i % 2 ? a : -a * 0.4));
    ctx.closePath();
  }

  /** Corpo, faixa e borda; devolve a faixa { y, h, cy }. */
  function base(ctx, r, c, corpo, faixa, borda) {
    const raio = raioDe(r.w);
    ctx.save();
    ctx.shadowColor = est.neon ? rgba(c, 0.55) : 'rgba(10,12,30,0.32)';
    ctx.shadowBlur = est.neon ? r.w * 0.14 : r.w * 0.07;
    ctx.shadowOffsetY = est.neon ? 0 : r.w * 0.035;
    rr(ctx, r.x, r.y, r.w, r.h, raio);
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    corpo.forEach((k, i) => g.addColorStop(i / Math.max(1, corpo.length - 1), k));
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    const fh = r.h * FAIXA;
    ctx.save();
    rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.clip();
    if (est.material) est.material(ctx, r, c);
    if (faixa) {
      const gf = ctx.createLinearGradient(0, r.y, 0, r.y + fh);
      faixa.forEach((k, i) => gf.addColorStop(i / Math.max(1, faixa.length - 1), k));
      caminhoFaixa(ctx, r, fh); ctx.fillStyle = gf; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(r.x, r.y, r.w, fh * 0.45);
      if (!est.ondaFaixa) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(r.x, r.y + fh - Math.max(1, r.h * 0.012), r.w, Math.max(1, r.h * 0.012)); }
    } else {
      ctx.fillStyle = rgba(c, 0.9); ctx.fillRect(r.x + r.w * 0.12, r.y + fh - Math.max(1.5, r.h * 0.014), r.w * 0.76, Math.max(1.5, r.h * 0.014));
    }
    if (est.vidro) {
      const gv = ctx.createLinearGradient(r.x, r.y, r.x + r.w * 0.8, r.y + r.h * 0.8);
      gv.addColorStop(0, 'rgba(255,255,255,0.28)'); gv.addColorStop(0.45, 'rgba(255,255,255,0.05)'); gv.addColorStop(0.46, 'rgba(255,255,255,0)');
      ctx.fillStyle = gv; ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.restore();
    rr(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, raio);
    ctx.lineWidth = Math.max(1.2, r.w * bl); ctx.strokeStyle = borda;
    if (est.neon) { ctx.save(); ctx.shadowColor = borda; ctx.shadowBlur = r.w * 0.08; ctx.stroke(); ctx.restore(); } else ctx.stroke();
    if (est.fio) {
      const i = Math.max(2.5, r.w * 0.06);
      rr(ctx, r.x + i, r.y + i, r.w - i * 2, r.h - i * 2, Math.max(2, raio - i * 0.6));
      ctx.lineWidth = Math.max(1, r.w * 0.014); ctx.strokeStyle = est.fio; ctx.stroke();
    }
    return { y: r.y, h: fh, cy: r.y + fh / 2 };
  }

  /** Numero grande no miolo (ou o rotulo do especial). */
  function grande(ctx, r, f, rotulo, corN, contorno) {
    const tam = Math.min((r.h - f.h) * 0.6, r.w * (rotulo.length >= 4 ? 0.36 : rotulo.length === 3 ? 0.46 : 0.62));
    const y = f.y + f.h + (r.y + r.h - (f.y + f.h)) / 2 + tam * 0.04;
    if (est.neon) { ctx.save(); ctx.shadowColor = corN; ctx.shadowBlur = tam * 0.35; texto(ctx, rotulo, 0, y, tam, corN, { max: r.w * 0.86 }); ctx.restore(); }
    texto(ctx, rotulo, 0, y, tam, corN, contorno ? { contorno, espessura: Math.max(2, tam * 0.14), max: r.w * 0.86 } : { max: r.w * 0.86 });
  }

  /** Numero pequeno da faixa. */
  function pequeno(ctx, r, f, rotulo, corN, contorno) {
    const tam = Math.min(f.h * 0.72, r.w * (rotulo.length >= 4 ? 0.27 : 0.34));
    const op = { max: r.w * 0.86 };
    if (contorno) Object.assign(op, { contorno, espessura: Math.max(1.5, tam * 0.16) });
    if (est.neon) { ctx.save(); ctx.shadowColor = corN; ctx.shadowBlur = tam * 0.4; texto(ctx, rotulo, 0, f.cy + 0.5, tam, corN, op); ctx.restore(); }
    else texto(ctx, rotulo, 0, f.cy + 0.5, tam, corN, op);
  }

  function normal(ctx, carta, r) {
    const c = cor(carta.v);
    const f = base(ctx, r, c, est.corpo(c), est.faixa ? est.faixa(c) : null, est.borda(c));
    const rot = String(carta.v);
    pequeno(ctx, r, f, rot, est.numFaixa ? est.numFaixa(c) : (est.faixa ? '#ffffff' : c), est.faixa ? rgba(escurecer(c, 0.45), 0.55) : null);
    grande(ctx, r, f, rot, est.numMiolo(c), est.contorno ? est.contorno(c) : null);
    if (nivel(carta.v) >= 6) {
      // de 128 para cima: duas estrelinhas nos cantos de baixo, como joia
      const s = r.w * 0.06;
      for (const sx of [-1, 1]) { estrela(ctx, sx * r.w * 0.33, r.y + r.h * 0.88, s, s * 0.4, 4); ctx.fillStyle = rgba(est.numMiolo(c), 0.7); ctx.fill(); }
    }
  }

  function coringa(ctx, r) {
    const e = est.especial.coringa;
    const f = base(ctx, r, e[0], est.neon ? est.corpo(e[0]) : [clarear(e[0], 0.75), clarear(e[1], 0.55)], est.neon ? null : e, est.neon ? e[0] : e[1]);
    for (let k = -1; k <= 1; k++) { estrela(ctx, k * r.w * 0.2, f.cy, f.h * 0.28, f.h * 0.12); ctx.fillStyle = '#ffffff'; ctx.fill(); }
    const cy = f.y + f.h + (r.y + r.h - (f.y + f.h)) * 0.5, s = Math.min(r.w * 0.3, (r.h - f.h) * 0.3);
    const g = ctx.createLinearGradient(-s, cy - s, s, cy + s);
    for (let k = 0; k <= 5; k++) g.addColorStop(k / 5, `hsl(${(k * 60 + 300) % 360}, 90%, 62%)`);
    ctx.save(); ctx.shadowColor = rgba(e[0], 0.6); ctx.shadowBlur = s * 0.5;
    estrela(ctx, 0, cy, s, s * 0.46); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    estrela(ctx, 0, cy, s, s * 0.46); ctx.lineWidth = Math.max(1.2, s * 0.08); ctx.strokeStyle = '#ffffff'; ctx.stroke();
  }

  function bomba(ctx, r) {
    const e = est.especial.bomba;
    const f = base(ctx, r, e[0], [e[1], escurecer(e[1], 0.25)], est.neon ? null : [e[0], escurecer(e[0], 0.2)], est.neon ? e[0] : escurecer(e[0], 0.35));
    texto(ctx, rotulos.bomba, 0, f.cy + 0.5, Math.min(f.h * 0.56, r.w * 0.22), '#ffffff', { max: r.w * 0.86 });
    const cy = f.y + f.h + (r.y + r.h - (f.y + f.h)) * 0.56, s = Math.min(r.w * 0.27, (r.h - f.h) * 0.28);
    ctx.strokeStyle = '#d9b77a'; ctx.lineWidth = Math.max(2, s * 0.14); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(s * 0.45, cy - s * 0.75); ctx.quadraticCurveTo(s * 0.9, cy - s * 1.3, s * 1.15, cy - s * 1.0); ctx.stroke();
    const g = ctx.createRadialGradient(-s * 0.35, cy - s * 0.35, s * 0.1, 0, cy, s);
    g.addColorStop(0, '#5a5566'); g.addColorStop(1, '#141218');
    circulo(ctx, 0, cy, s); ctx.fillStyle = g; ctx.fill();
  }

  function vezes(ctx, r, rotulo, e) {
    if (est.neon) {
      const f = base(ctx, r, e[0], est.corpo(e[0]), null, e[0]);
      pequeno(ctx, r, f, rotulo, e[0], null);
      grande(ctx, r, f, rotulo, e[0], null);
      return;
    }
    const f = base(ctx, r, e[0], [clarear(e[0], 0.82), clarear(e[0], 0.62)], [e[0], escurecer(e[0], 0.18)], escurecer(e[0], 0.3));
    pequeno(ctx, r, f, rotulo, '#ffffff', rgba(escurecer(e[0], 0.5), 0.6));
    grande(ctx, r, f, rotulo, e[0], null);
  }

  function carta(ctx, k, r) {
    if (k.tipo === 'coringa') coringa(ctx, r);
    else if (k.tipo === 'bomba') bomba(ctx, r);
    else if (k.tipo === 'dobro') vezes(ctx, r, '×2', est.especial.dobro);
    else if (k.tipo === 'quadruplo') vezes(ctx, r, '×4', est.especial.quadruplo);
    else normal(ctx, k, r);
  }

  const temBrilho = (k) => k.tipo === 'coringa' || k.tipo === 'bomba' || (k.tipo === 'normal' && nivel(k.v) >= 9);

  /** Brilho que anda (por cima da cache): reflexo no coringa e nas cartas de 1024 para cima; o pavio da bomba. */
  function brilho(ctx, k, r, t) {
    if (k.tipo === 'bomba') {
      const fh = r.h * FAIXA;
      const cy = r.y + fh + (r.h - fh) * 0.56, s = Math.min(r.w * 0.27, (r.h - fh) * 0.28);
      const q = 0.6 + 0.4 * Math.abs(Math.sin(t * 16));
      estrela(ctx, s * 1.15, cy - s * 1.0, s * 0.42 * q, s * 0.16, 7); ctx.fillStyle = '#ffd23f'; ctx.fill();
      return;
    }
    ctx.save();
    rr(ctx, r.x, r.y, r.w, r.h, raioDe(r.w)); ctx.clip();
    const u = ((t * 0.45) % 1.6) - 0.3;
    const x = r.x + u * r.w * 1.6;
    const g = ctx.createLinearGradient(x - r.w * 0.3, r.y, x + r.w * 0.3, r.y + r.h);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  return { carta, temBrilho, brilho, cor, raio: raioDe };
}

// ------------------------------------------------------------ mesa

/**
 * Mesa de um tema (substitui o grimorio, o tapete, a runa e a lapide de mesa.js).
 * @param {{
 *   moldura: string[], miolo: string[], aro: string, larg?: number, raio?: number,
 *   brilho?: string, vidro?: boolean,
 *   tapete?: string[], tapeteAro?: string,
 *   vazio: string,                 // 'r,g,b' do contorno do espaco vazio
 *   descarte: string[], descarteAro: string, icone: string,
 *   rotulo: string, rotuloContorno?: string|null,
 * }} m
 */
export function criarMesa(m) {
  const raio = m.raio || 18;
  const larg = m.larg || 6;

  function placa(ctx, x, y, w, h, cores, aro, ra, sombra) {
    ctx.save();
    if (sombra) { ctx.shadowColor = sombra; ctx.shadowBlur = 18; ctx.shadowOffsetY = m.brilho ? 0 : 6; }
    rr(ctx, x, y, w, h, ra);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    cores.forEach((k, i) => g.addColorStop(i / Math.max(1, cores.length - 1), k));
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    if (aro) { rr(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, ra); ctx.lineWidth = 1.5; ctx.strokeStyle = aro; ctx.stroke(); }
  }

  function tabuleiro(ctx, s, pal, febre, agora) {
    const brilho = febre > 0 ? `rgba(255,216,74,${0.7 + 0.3 * Math.abs(Math.sin(agora / 120))})` : m.brilho;
    placa(ctx, s.x, s.y, s.w, s.h, m.moldura, null, raio, brilho || 'rgba(10,10,30,0.35)');
    if (m.brilho || febre > 0) {
      ctx.save(); ctx.shadowColor = brilho; ctx.shadowBlur = 16;
      rr(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, raio); ctx.lineWidth = 2.5; ctx.strokeStyle = brilho; ctx.stroke(); ctx.restore();
    }
    placa(ctx, s.x + larg, s.y + larg, s.w - larg * 2, s.h - larg * 2, m.miolo, m.aro, Math.max(6, raio - larg * 0.7), null);
    if (m.vidro) {
      ctx.save();
      rr(ctx, s.x + larg, s.y + larg, s.w - larg * 2, s.h - larg * 2, Math.max(6, raio - larg * 0.7)); ctx.clip();
      const g = ctx.createLinearGradient(s.x, s.y, s.x + s.w * 0.6, s.y + s.h * 0.6);
      g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.5, 'rgba(255,255,255,0.02)'); g.addColorStop(0.51, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.restore();
    }
  }

  function tapete(ctx, ret) {
    placa(ctx, ret.x, ret.y, ret.w, ret.h, m.tapete || m.moldura, m.tapeteAro || m.aro, 16, m.brilho || 'rgba(10,10,30,0.3)');
  }

  function vazio(ctx, r, pal, t, c, forte) {
    const a = forte ? 0.75 : 0.32 + 0.08 * Math.sin(t * 2 + c);
    rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, raioCarta(r.w));
    ctx.fillStyle = `rgba(${m.vazio},${forte ? 0.14 : 0.06})`; ctx.fill();
    ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6; ctx.strokeStyle = `rgba(${m.vazio},${a})`; ctx.stroke(); ctx.setLineDash([]);
    const s = r.w * 0.09;
    circulo(ctx, r.x + r.w / 2, r.y + r.h / 2, s); ctx.fillStyle = `rgba(${m.vazio},${a * 0.8})`; ctx.fill();
  }

  /** Lugar do descarte: placa com a seta de reciclar (apagada com a pilha cheia). */
  function descarte(ctx, r, livre, t, rotulo) {
    ctx.save();
    ctx.globalAlpha = livre ? 1 : 0.55;
    placa(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, m.descarte, m.descarteAro, raioCarta(r.w), null);
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.46, ra = r.w * 0.2;
    if (livre) { ctx.shadowColor = m.icone; ctx.shadowBlur = 8 + 3 * Math.sin(t * 3); }
    ctx.strokeStyle = m.icone; ctx.lineWidth = Math.max(2, r.w * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, ra, -Math.PI * 0.15, Math.PI * 1.35); ctx.stroke();
    const a = Math.PI * 1.35, ax = cx + Math.cos(a) * ra, ay = cy + Math.sin(a) * ra, p = ra * 0.45;
    ctx.beginPath(); ctx.moveTo(ax - p, ay - p * 0.15); ctx.lineTo(ax, ay); ctx.lineTo(ax + p * 0.15, ay - p); ctx.stroke();
    ctx.restore();
    if (rotulo) texto(ctx, rotulo, cx, r.y + r.h * 0.84, Math.max(8, r.w * 0.15), m.rotulo, m.rotuloContorno ? { contorno: m.rotuloContorno, espessura: 2.5, max: r.w - 6 } : { max: r.w - 6 });
  }

  return { tabuleiro, tapete, vazio, descarte, rotulo: m.rotulo, rotuloContorno: m.rotuloContorno === undefined ? null : m.rotuloContorno };
}

// ------------------------------------------------------------ cenario

/** Horizonte e escala do cenario: o horizonte fica um pouco acima da mesa. */
export function medidasCena(W, H, L) {
  const R = Math.min(W, H) * 0.12;
  const hy = L ? Math.max(H * 0.12, L.mesa.y * 0.72) : H * 0.3;
  return { hy, R, u: Math.max(0.7, Math.min(1.8, Math.min(W, H) / 420)), retrato: !L || L.retrato };
}

/** Degrade vertical de y0 a y1 preenchendo a largura. */
export function faixaVertical(ctx, W, y0, y1, cores) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  cores.forEach((c, i) => g.addColorStop(i / Math.max(1, cores.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0);
}

/** Luz redonda (radial) que some para fora. */
export function luz(ctx, x, y, r, cor, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(cor, a)); g.addColorStop(1, rgba(cor, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Morro em onda suave: da base para baixo, com picos de amp. */
export function onda(ctx, W, H, base, amp, freq, fase, cor) {
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, base);
  const passo = Math.max(6, W / 80);
  for (let x = 0; x <= W + passo; x += passo) {
    const y = base - amp * (0.5 + 0.3 * Math.sin(x * freq / W * TAU + fase) + 0.2 * Math.sin(x * freq * 2.3 / W * TAU + fase * 1.7));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H); ctx.closePath();
  ctx.fillStyle = cor; ctx.fill();
}

/** Particulas que andam com o tempo (sem estado): f(i, x, y, k) desenha cada uma. */
export function particulas(n, W, H, t, vx, vy, f) {
  for (let i = 0; i < n; i++) {
    const k = (i * 0.6180339) % 1;
    const x = (((k * W * 7.3 + i * 37 + t * vx * (0.6 + k)) % (W + 40)) + W + 40) % (W + 40) - 20;
    const y = (((((i * 0.7548776) % 1) * H + t * vy * (0.6 + k)) % (H + 40)) + H + 40) % (H + 40) - 20;
    f(i, x, y, k);
  }
}

export { semente };
