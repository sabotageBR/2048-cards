// Ideia 3: Laboratorio de Pocoes. Cada coluna e um tubo de ensaio e cada
// carta e uma camada de pocao (a cor diz o valor). Pocoes iguais reagem e
// viram a seguinte; a cascata borbulha de camada em camada. O elixir dourado
// de 2048 transborda em brilho e sai pela boca do tubo.
// Pecas em torre (de baixo para cima), largura fixa (a do tubo).
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const LIQUIDOS = [
  '#7fd4ff', // 2 azul-claro
  '#a6e33a', // 4 verde-limao
  '#ffd93b', // 8 amarelo
  '#ff9a2e', // 16 laranja
  '#ff7ab8', // 32 rosa
  '#f0423c', // 64 vermelho
  '#9b4dff', // 128 roxo
  '#3557ff', // 256 azul-royal
  '#1fd1c1', // 512 turquesa
  '#e83ad9', // 1024 magenta
  '#ffc21a', // 2048 dourado
  '#f4f2ff', // 4096 branco-arco-iris
];
const ARCO = ['#ff5d73', '#ffb43f', '#ffe066', '#6fe36b', '#3fc8ff', '#8a7bff', '#e86bff'];
const TINTA = '#4a2e14';
const VIDRO = 'rgba(232,246,255,0.85)';
const MADEIRA = '#8a5a32';
const LATAO = '#d8a93f';

const corDe = (v) => LIQUIDOS[Math.min(nivel(v), LIQUIDOS.length - 1)];

/** Faixa de cores do arco-iris deslizando (4096 e coringa). */
function arcoIris(ctx, x, y, w, h, t, inclinado) {
  const g = ctx.createLinearGradient(x, y, x + w, y + (inclinado ? h : 0));
  const d = (t * 0.35) % 1;
  for (let i = 0; i <= ARCO.length; i++) g.addColorStop(((i / ARCO.length) + d) % 1, ARCO[i % ARCO.length]);
  return g;
}

/** Bolhas subindo dentro de um retangulo (ja recortado pelo chamador). */
function bolhas(ctx, x, y, w, h, t, id, n = 4, cor = 'rgba(255,255,255,0.7)') {
  const rnd = semente((id | 0) * 7 + 3);
  ctx.strokeStyle = cor; ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let k = 0; k < n; k++) {
    const bx = x + w * (0.15 + rnd() * 0.7), vel = 0.25 + rnd() * 0.3, fase = rnd(), tam = 1.4 + rnd() * 2.4;
    const u = (t * vel + fase) % 1;
    const by = y + h - 3 - u * (h - 6);
    ctx.globalAlpha *= 1;
    ctx.lineWidth = 1;
    circulo(ctx, bx + Math.sin(t * 3 + k) * 1.5, by, tam * (0.7 + u * 0.5)); ctx.fill(); ctx.stroke();
  }
}

/** Rotulo de papel com o numero. */
function rotuloPapel(ctx, txt, cx, cy, w, h, ouro) {
  rr(ctx, cx - w / 2, cy - h / 2, w, h, h * 0.32);
  ctx.fillStyle = '#fbf1d6'; ctx.fill();
  ctx.lineWidth = ouro ? 2.2 : 1.5; ctx.strokeStyle = ouro ? '#b8860b' : '#5a3b1c'; ctx.stroke();
  texto(ctx, txt, cx, cy + 0.5, h * 0.72, '#3a2412', { max: w - 6 });
}

/** Camada de pocao (faixa de liquido) na coluna. */
function camada(ctx, carta, r, op) {
  const v = carta.v, cor = corDe(v), n = nivel(v);
  const x0 = r.x + 1.5, y0 = r.y + 1, w = r.w - 3, h = r.h - 2.5;
  const rad = Math.min(w * 0.2, 10);
  const t = op.t || 0;
  rr(ctx, x0, y0, w, h, rad);
  if (n >= 11) ctx.fillStyle = arcoIris(ctx, x0, y0, w, h, t, true);
  else {
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, clarear(cor, 0.22)); g.addColorStop(1, escurecer(cor, 0.22));
    ctx.fillStyle = g;
  }
  ctx.fill();
  ctx.save();
  rr(ctx, x0, y0, w, h, rad); ctx.clip();
  // superficie (menisco) e sombra embaixo
  elipse(ctx, 0, y0 + 3, w * 0.48, 4); ctx.fillStyle = rgba(clarear(cor, 0.6), 0.75); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, y0 + h - 6, w, 6);
  bolhas(ctx, x0, y0, w, h, t, carta.id, n >= 10 ? 6 : 4);
  if (n === 10) {
    // brilho do elixir dourado
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.8 + k / 3) % 1;
      const sx = x0 + w * (0.2 + 0.3 * k), sy = y0 + h * (0.25 + 0.2 * ((k * 7) % 3));
      estrela(ctx, sx, sy, 4.5 * Math.sin(p * Math.PI), 1.3, 4); ctx.fillStyle = '#fffbe0'; ctx.fill();
    }
  }
  ctx.restore();
  rr(ctx, x0, y0, w, h, rad); ctx.lineWidth = 1.4; ctx.strokeStyle = rgba(escurecer(cor, 0.45), 0.7); ctx.stroke();
  const lh = Math.min(h * 0.38, 22), lw = Math.min(w * 0.86, lh * 2.4);
  rotuloPapel(ctx, String(v), 0, y0 + h * 0.56, lw, lh, n >= 10);
}

/** Frasco redondo arrolhado (fila e especiais). */
function frasco(ctx, r, op, recheio) {
  const t = op.t || 0;
  const R = Math.min(r.w * 0.5, r.h * 0.36);
  const cy = r.y + r.h - R - 1;
  const nw = R * 0.62;
  const topoGarg = Math.max(r.y + R * 0.22, cy - R * 1.75);
  // sombra
  elipse(ctx, 0, r.y + r.h, R * 0.9, R * 0.16); ctx.fillStyle = 'rgba(20,10,0,0.3)'; ctx.fill();
  if (op.destaque) {
    circulo(ctx, 0, cy, R + 5); ctx.fillStyle = `rgba(255,214,120,${op.destaque * 0.45})`; ctx.fill();
  }
  // vidro de tras
  const contorno = () => {
    ctx.beginPath();
    const a = Math.asin(Math.min(1, (nw / 2) / R));
    ctx.moveTo(-nw / 2, topoGarg);
    ctx.lineTo(-nw / 2, cy - R * Math.cos(a));
    ctx.arc(0, cy, R, -Math.PI / 2 - a, -Math.PI / 2 + a, true);
    ctx.lineTo(nw / 2, topoGarg);
    ctx.closePath();
  };
  contorno(); ctx.fillStyle = 'rgba(205,232,250,0.22)'; ctx.fill();
  // liquido
  ctx.save();
  circulo(ctx, 0, cy, R - 2.2); ctx.clip();
  const sup = cy - R * 0.3;
  ctx.beginPath(); ctx.moveTo(-R, sup);
  for (let x = -R; x <= R; x += 3) ctx.lineTo(x, sup + Math.sin(t * 3 + x / 5) * 1.3);
  ctx.lineTo(R, cy + R); ctx.lineTo(-R, cy + R); ctx.closePath();
  ctx.fillStyle = recheio.fundo(ctx, -R, sup, R * 2, R * 1.4); ctx.fill();
  ctx.save(); ctx.clip();
  if (recheio.extra) recheio.extra(ctx, R, cy, sup);
  bolhas(ctx, -R, sup, R * 2, cy + R - sup, t, recheio.id || 1, 5);
  ctx.restore();
  ctx.restore();
  // vidro da frente
  contorno(); ctx.lineWidth = 2.2; ctx.strokeStyle = VIDRO; ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(40,60,80,0.55)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, cy, R * 0.72, Math.PI * 1.1, Math.PI * 1.45); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
  // rolha
  rr(ctx, -nw * 0.6, topoGarg - R * 0.36, nw * 1.2, R * 0.42, 3);
  ctx.fillStyle = '#b07a42'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = '#5a3b1c'; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,59,28,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-nw * 0.4, topoGarg - R * 0.2); ctx.lineTo(nw * 0.4, topoGarg - R * 0.2); ctx.stroke();
  if (recheio.rolha) recheio.rolha(ctx, nw, topoGarg - R * 0.36, R);
  // rotulo
  if (recheio.rotulo) recheio.rotulo(ctx, cy + R * 0.18, R);
}

function frascoNormal(ctx, carta, r, op) {
  const cor = corDe(carta.v), n = nivel(carta.v);
  frasco(ctx, r, op, {
    id: carta.id,
    fundo: (c, x, y, w, h) => {
      if (n >= 11) return arcoIris(c, x, y, w, h, op.t || 0, true);
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, clarear(cor, 0.25)); g.addColorStop(1, escurecer(cor, 0.25));
      return g;
    },
    rotulo: (c, y, R) => { const lh = Math.min(R * 0.62, 22); rotuloPapel(c, String(carta.v), 0, y, Math.min(R * 1.6, lh * 2.5), lh, n >= 10); },
  });
}

function frascoCoringa(ctx, carta, r, op) {
  const t = op.t || 0;
  frasco(ctx, r, op, {
    id: carta.id,
    fundo: (c, x, y, w) => {
      const g = c.createConicGradient ? c.createConicGradient(t * 2, 0, y + w * 0.35) : null;
      if (!g) return arcoIris(c, x, y, w, w, t, true);
      ARCO.forEach((k, i) => g.addColorStop(i / ARCO.length, k));
      g.addColorStop(1, ARCO[0]);
      return g;
    },
    extra: (c, R, cy) => {
      // espiral branca
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; c.beginPath();
      for (let a = 0; a < TAU * 2; a += 0.2) { const rr0 = (a / (TAU * 2)) * R * 0.8; c.lineTo(Math.cos(a + t * 2) * rr0, cy + Math.sin(a + t * 2) * rr0); }
      c.stroke();
    },
    rotulo: (c, y, R) => { circulo(c, 0, y, R * 0.36); c.fillStyle = '#fbf1d6'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#5a3b1c'; c.stroke(); texto(c, '?', 0, y + 1, R * 0.55, '#3a2412'); },
  });
}

function frascoBomba(ctx, carta, r, op) {
  const t = op.t || 0;
  frasco(ctx, r, op, {
    id: carta.id,
    fundo: (c, x, y, w, h) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ff6a4d'); g.addColorStop(1, '#a1120e'); return g; },
    rolha: (c, nw, y, R) => {
      c.strokeStyle = '#3b2a1e'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(R * 0.3, y - R * 0.5, R * 0.62, y - R * 0.42); c.stroke();
      const f = 0.6 + 0.4 * Math.abs(Math.sin(t * 18));
      estrela(c, R * 0.62, y - R * 0.42, R * 0.32 * f, R * 0.12, 7); c.fillStyle = '#ffd23f'; c.fill();
      circulo(c, R * 0.62, y - R * 0.42, R * 0.08); c.fillStyle = '#fff'; c.fill();
    },
    rotulo: (c, y, R) => {
      // simbolo de perigo: triangulo com exclamacao
      const s = R * 0.42;
      c.beginPath(); c.moveTo(0, y - s); c.lineTo(s * 1.05, y + s * 0.7); c.lineTo(-s * 1.05, y + s * 0.7); c.closePath();
      c.fillStyle = '#ffd23f'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#3a2412'; c.stroke();
      texto(c, '!', 0, y + s * 0.15, s * 1.15, '#3a2412');
    },
  });
}

function frascoDobro(ctx, carta, r, op) {
  const t = op.t || 0;
  frasco(ctx, r, op, {
    id: carta.id,
    fundo: (c, x, y, w, h) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#c48bff'); g.addColorStop(1, '#5b1fa8'); return g; },
    extra: (c, R, cy) => {
      const rnd = semente(5);
      for (let k = 0; k < 14; k++) {
        const x = (rnd() - 0.5) * R * 1.6, y = cy + (rnd() - 0.4) * R * 1.2, p = (t * 1.5 + rnd()) % 1;
        estrela(c, x, y, 2.6 * Math.sin(p * Math.PI) + 0.5, 0.8, 4); c.fillStyle = '#fff4c2'; c.fill();
      }
    },
    rotulo: (c, y, R) => { const lh = Math.min(R * 0.62, 22); rotuloPapel(c, 'x2', 0, y, lh * 1.9, lh, true); },
  });
}

function sedimento(ctx, r, hp) {
  const x0 = r.x + 1.5, y0 = r.y + 3, w = r.w - 3, h = r.h - 4;
  const rad = Math.min(w * 0.2, 10);
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + h * 0.3);
    const passos = 6;
    for (let k = 0; k <= passos; k++) {
      const x = x0 + (w * k) / passos;
      const y = y0 + h * (0.12 + 0.16 * ((k * 5) % 3) / 2);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(x0 + w, y0 + h - rad);
    ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - rad, y0 + h);
    ctx.lineTo(x0 + rad, y0 + h);
    ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - rad);
    ctx.closePath();
  };
  forma();
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, '#8d8473'); g.addColorStop(1, '#4f483e');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); forma(); ctx.clip();
  const rnd = semente(19);
  for (let k = 0; k < 16; k++) { circulo(ctx, x0 + rnd() * w, y0 + h * (0.25 + rnd() * 0.7), 1.5 + rnd() * 3.5); ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.18)'; ctx.fill(); }
  ctx.restore();
  forma(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#2c2620'; ctx.stroke();
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  const rach = [[-0.25, 0.3, -0.05, 0.55, -0.18, 0.85], [0.28, 0.28, 0.1, 0.5, 0.26, 0.78], [0.0, 0.2, 0.06, 0.38, -0.04, 0.55]];
  ctx.strokeStyle = '#1d1915'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, y0 + c[1] * h); ctx.lineTo(c[2] * w, y0 + c[3] * h); ctx.lineTo(c[4] * w, y0 + c[5] * h); ctx.stroke();
  }
  // runas de hp
  for (let k = 0; k < 3; k++) {
    const vivo = k < hp;
    circulo(ctx, (k - 1) * 11, y0 + h * 0.66, 3.8);
    ctx.fillStyle = vivo ? '#ffcf4a' : 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#2c2620'; ctx.stroke();
    if (vivo) { circulo(ctx, (k - 1) * 11, y0 + h * 0.66, 6.5); ctx.fillStyle = 'rgba(255,207,74,0.18)'; ctx.fill(); }
  }
}

function cristal(ctx, r) {
  const x0 = r.x + 1.5, y0 = r.y + 1, w = r.w - 3, h = r.h - 2.5;
  const rad = Math.min(w * 0.2, 10);
  ctx.save();
  rr(ctx, x0, y0, w, h, rad); ctx.clip();
  ctx.fillStyle = 'rgba(214,242,255,0.5)'; ctx.fillRect(x0, y0, w, h);
  // facetas
  const pts = [[0, 0], [0.35, 0], [0.18, 0.45], [0, 0.6], [0.6, 0], [0.42, 0.5], [0.75, 0.35], [1, 0], [1, 0.55], [0.7, 1], [0.3, 1], [0, 1]];
  const P = (k) => [x0 + pts[k][0] * w, y0 + pts[k][1] * h];
  const faces = [[0, 1, 2, 3], [1, 4, 5, 2], [4, 7, 6, 5], [7, 8, 6], [6, 8, 9, 5], [5, 9, 10, 2], [2, 10, 11, 3]];
  faces.forEach((f, i) => {
    ctx.beginPath(); f.forEach((k, j) => ctx[j ? 'lineTo' : 'moveTo'](...P(k))); ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.22)' : 'rgba(160,215,255,0.18)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1; ctx.stroke();
  });
  // geada na borda
  const rnd = semente(23);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let k = 0; k < 18; k++) { const a = rnd(); const x = a < 0.5 ? x0 + rnd() * w : (rnd() < 0.5 ? x0 + 2 : x0 + w - 2); const y = a < 0.5 ? (rnd() < 0.5 ? y0 + 2 : y0 + h - 2) : y0 + rnd() * h; circulo(ctx, x, y, 0.8 + rnd() * 1.4); ctx.fill(); }
  ctx.restore();
  rr(ctx, x0, y0, w, h, rad); ctx.lineWidth = 2; ctx.strokeStyle = '#effbff'; ctx.stroke();
  // floco
  const fx = x0 + w - 9, fy = y0 + 9;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * 6, fy - Math.sin(a) * 6); ctx.lineTo(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6); ctx.stroke(); }
}

/** Contorno do tubo (boca em cima, fundo arredondado). */
function tuboPath(ctx, x, y, w, h) {
  const rb = w * 0.42;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h - rb);
  ctx.quadraticCurveTo(x, y + h, x + rb, y + h);
  ctx.lineTo(x + w - rb, y + h);
  ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - rb);
  ctx.lineTo(x + w, y);
}
const tuboRect = (L, c) => { const a = L.coluna(c); return { x: a.x - 5, y: a.y - 28, w: a.w + 10, h: a.h + 28 + 6 }; };

function vela(ctx, x, y, alt, t, fase) {
  // corpo
  rr(ctx, x - 5, y - alt, 10, alt, 2); ctx.fillStyle = '#f3e6c8'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(90,59,28,0.6)'; ctx.stroke();
  elipse(ctx, x - 2, y - alt + 4, 2, 4); ctx.fillStyle = '#e8d6ae'; ctx.fill();
  ctx.strokeStyle = '#3b2a1e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - alt); ctx.lineTo(x, y - alt - 3); ctx.stroke();
  // chama
  const f = 1 + Math.sin(t * 11 + fase) * 0.08 + Math.sin(t * 23 + fase * 2) * 0.05;
  const fy = y - alt - 3, fx = x + Math.sin(t * 7 + fase) * 0.8;
  const g = ctx.createRadialGradient(fx, fy - 6, 1, fx, fy - 6, 46 * f);
  g.addColorStop(0, 'rgba(255,190,100,0.32)'); g.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = g; circulo(ctx, fx, fy - 6, 46 * f); ctx.fill();
  ctx.beginPath(); ctx.moveTo(fx, fy - 14 * f);
  ctx.quadraticCurveTo(fx + 5 * f, fy - 4, fx, fy); ctx.quadraticCurveTo(fx - 5 * f, fy - 4, fx, fy - 14 * f);
  ctx.fillStyle = '#ffb43f'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(fx, fy - 8 * f);
  ctx.quadraticCurveTo(fx + 2.4, fy - 2.5, fx, fy - 1); ctx.quadraticCurveTo(fx - 2.4, fy - 2.5, fx, fy - 8 * f);
  ctx.fillStyle = '#fff3c4'; ctx.fill();
}

/** Objetos na bancada abaixo da fila (so em retrato). */
function bancada(ctx, W, H, L) {
  const y = Math.max(L.fila.y + L.fila.h + 46, H - 70);
  if (y > H - 30) return;
  // livro aberto
  const bx = W * 0.2, bw = Math.min(110, W * 0.3), bh = 46;
  ctx.save();
  ctx.translate(bx, y); ctx.rotate(-0.06);
  ctx.fillStyle = 'rgba(20,10,0,0.3)'; rr(ctx, -bw / 2 + 4, -bh / 2 + 6, bw, bh, 4); ctx.fill();
  ctx.fillStyle = '#6b2630'; rr(ctx, -bw / 2 - 4, -bh / 2 - 3, bw + 8, bh + 6, 4); ctx.fill();
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(0, -bh / 2); ctx.quadraticCurveTo(s * bw * 0.25, -bh / 2 - 4, s * bw / 2, -bh / 2 + 1);
    ctx.lineTo(s * bw / 2, bh / 2); ctx.quadraticCurveTo(s * bw * 0.25, bh / 2 - 3, 0, bh / 2); ctx.closePath();
    ctx.fillStyle = '#f3e3bd'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(90,59,28,0.6)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,59,28,0.35)';
    for (let k = 0; k < 5; k++) { const yy = -bh / 2 + 10 + k * 7; ctx.beginPath(); ctx.moveTo(s * 6, yy); ctx.lineTo(s * (bw / 2 - 7), yy); ctx.stroke(); }
  }
  circulo(ctx, -bw * 0.25, -bh * 0.1, 6); ctx.fillStyle = 'rgba(155,77,255,0.5)'; ctx.fill();
  ctx.fillStyle = '#b3262b'; ctx.fillRect(bw * 0.12, bh / 2 - 2, 5, 14);
  ctx.restore();
  // pilao
  const mx = W * 0.8;
  elipse(ctx, mx + 3, y + 16, 26, 6); ctx.fillStyle = 'rgba(20,10,0,0.3)'; ctx.fill();
  ctx.save(); ctx.translate(mx + 10, y - 14); ctx.rotate(0.6); rr(ctx, -4, -22, 8, 34, 4); ctx.fillStyle = '#c9c2b2'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#4f483e'; ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(mx - 22, y - 4); ctx.quadraticCurveTo(mx - 20, y + 18, mx, y + 18); ctx.quadraticCurveTo(mx + 20, y + 18, mx + 22, y - 4); ctx.closePath();
  ctx.fillStyle = '#8d8473'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#3e382f'; ctx.stroke();
  elipse(ctx, mx, y - 4, 22, 5); ctx.fillStyle = '#5a5247'; ctx.fill(); ctx.stroke();
  elipse(ctx, mx, y - 3.5, 16, 3); ctx.fillStyle = '#9ad45a'; ctx.fill();
  // cristais e cogumelo
  const cris = (x, yy, s, cor) => {
    ctx.beginPath(); ctx.moveTo(x, yy - s * 1.6); ctx.lineTo(x + s * 0.7, yy - s * 0.3); ctx.lineTo(x, yy + s * 0.3); ctx.lineTo(x - s * 0.7, yy - s * 0.3); ctx.closePath();
    ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
  };
  cris(W * 0.47, y + 8, 7, '#8a7bff'); cris(W * 0.51, y + 12, 5, '#1fd1c1'); cris(W * 0.55, y + 6, 6, '#e83ad9');
  const cx = W * 0.62, cy = y + 10;
  rr(ctx, cx - 3, cy - 6, 6, 10, 2); ctx.fillStyle = '#f3e6c8'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy - 6, 9, 7, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#d9483b'; ctx.fill();
  ctx.fillStyle = '#fff'; circulo(ctx, cx - 3, cy - 9, 1.6); ctx.fill(); circulo(ctx, cx + 3, cy - 10, 1.3); ctx.fill();
}

const prateleiraY = (L) => Math.max(L.topo + 50, L.coluna(0).y - 72);

/** Medidas do caldeirao no slot do descarte (a boca fica a meia altura da faixa). */
function caldeirao(r) {
  const cx = r.x + r.w / 2, base = r.y + r.h + 2;
  const cw = r.w * 0.74, ch = r.h * 0.95;
  return { cx, base, cw, ch, boca: r.y + r.h * 0.56, corpo: base - ch * 0.42 };
}

/** Corpo do caldeirao (por cima da pocao descartada). */
function caldeiraoFrente(ctx, r, e, t) {
  const k = caldeirao(r);
  const carga = e.descarteCarga > 0;
  for (const s of [-1, 1]) { elipse(ctx, k.cx + s * k.cw * 0.6, k.base - 2, k.cw * 0.12, k.ch * 0.07); ctx.fillStyle = '#1a191e'; ctx.fill(); }
  ctx.beginPath();
  ctx.moveTo(k.cx - k.cw * 0.92, k.boca);
  ctx.bezierCurveTo(k.cx - k.cw * 1.12, k.base - k.ch * 0.1, k.cx - k.cw * 0.5, k.base, k.cx, k.base);
  ctx.bezierCurveTo(k.cx + k.cw * 0.5, k.base, k.cx + k.cw * 1.12, k.base - k.ch * 0.1, k.cx + k.cw * 0.92, k.boca);
  ctx.ellipse(k.cx, k.boca, k.cw * 0.92, k.ch * 0.2, 0, 0, Math.PI, false);
  ctx.closePath();
  const g = ctx.createLinearGradient(k.cx - k.cw, 0, k.cx + k.cw, 0);
  g.addColorStop(0, '#45444c'); g.addColorStop(0.35, '#2b2a30'); g.addColorStop(1, '#151418');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#0c0b0e'; ctx.stroke();
  elipse(ctx, k.cx - k.cw * 0.45, k.boca + k.ch * 0.28, k.cw * 0.14, k.ch * 0.1, -0.5); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
  // aba da boca
  ctx.beginPath(); ctx.ellipse(k.cx, k.boca, k.cw * 0.95, k.ch * 0.22, 0, 0, Math.PI, false);
  ctx.lineWidth = 4; ctx.strokeStyle = '#4a4952'; ctx.stroke();
  if (carga) {
    for (let i = 0; i < 3; i++) {
      const u = (t * 0.9 + i / 3) % 1;
      circulo(ctx, k.cx + (i - 1) * k.cw * 0.4, k.boca - 2 - u * 18, 2.5 + u * 2.5); ctx.fillStyle = `rgba(160,255,120,${0.75 * (1 - u)})`; ctx.fill();
    }
  }
  texto(ctx, carga ? 'caldeirão' : 'apagado', k.cx, k.base + 11, 10, carga ? '#ffe9b8' : '#b8a888', { contorno: 'rgba(30,15,5,0.75)', espessura: 3 });
}

const tema = {
  id: 'pocoes',
  nome: 'Laboratório de Poções',
  cores: { texto: TINTA, destaque: '#ffc21a', particulas: ['#ffc21a', '#7fd4ff', '#ff7ab8', '#a6e33a'] },
  faixas: () => ({ topo: 96, base: 0 }),
  // em paisagem a torre nao encosta no HUD: o tubo tem boca e suporte acima da coluna
  geo: (L) => geoTorre({ ...L, topo: L.topo + 30 }, { fator: 1.8, largura: 0.84, colar: true, filaFator: 1.0 }),

  fundo(ctx, W, H, L) {
    // parede de pedra (ardosia esverdeada)
    ctx.fillStyle = '#1e2b2c'; ctx.fillRect(0, 0, W, H);
    const rnd = semente(31);
    const alt = 28;
    for (let y = 0, linha = 0; y < L.chao + 12; y += alt, linha++) {
      let x = linha % 2 ? -22 : -4;
      while (x < W) {
        const w = 42 + rnd() * 34;
        const tom = rnd();
        const base = tom < 0.33 ? '#3d5653' : tom < 0.66 ? '#38504e' : '#435d58';
        const g = ctx.createLinearGradient(0, y, 0, y + alt);
        g.addColorStop(0, clarear(base, 0.08)); g.addColorStop(1, escurecer(base, 0.12));
        rr(ctx, x + 1.5, y + 1.5, w - 3, alt - 3, 5); ctx.fillStyle = g; ctx.fill();
        if (rnd() < 0.25) { elipse(ctx, x + w * 0.6, y + alt * 0.5, 3 + rnd() * 3, 1.5, 0.3); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fill(); }
        x += w;
      }
    }
    // prateleira na parede com potes, livros e bola de cristal
    const py = prateleiraY(L);
    const itens = (x0, x1) => {
      let x = x0;
      const r2 = semente(Math.round(x0) + 3);
      while (x < x1 - 14) {
        const k = r2();
        if (k < 0.4) {
          // pote
          const w = 14 + r2() * 8, h = 18 + r2() * 12, cor = LIQUIDOS[Math.floor(r2() * 10)];
          rr(ctx, x, py - h, w, h, 4); ctx.fillStyle = 'rgba(200,230,245,0.28)'; ctx.fill();
          rr(ctx, x + 2, py - h * 0.6, w - 4, h * 0.6 - 2, 3); ctx.fillStyle = rgba(cor, 0.75); ctx.fill();
          rr(ctx, x, py - h, w, h, 4); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(232,246,255,0.6)'; ctx.stroke();
          rr(ctx, x + 2, py - h - 4, w - 4, 5, 2); ctx.fillStyle = '#9a6a3c'; ctx.fill();
          x += w + 5;
        } else if (k < 0.75) {
          // livros
          const n = 2 + Math.floor(r2() * 3);
          for (let i = 0; i < n; i++) {
            const w = 6 + r2() * 4, h = 22 + r2() * 10;
            ctx.fillStyle = ['#8c2f39', '#2f5d8c', '#6b4f2a', '#3f7a4a', '#7a3f8c'][Math.floor(r2() * 5)];
            ctx.fillRect(x, py - h, w, h);
            ctx.fillStyle = 'rgba(255,220,140,0.6)'; ctx.fillRect(x, py - h + 4, w, 1.5); ctx.fillRect(x, py - 6, w, 1.5);
            x += w + 1;
          }
          x += 6;
        } else {
          // bola de cristal no pedestal
          rr(ctx, x + 2, py - 6, 18, 6, 2); ctx.fillStyle = '#6b4528'; ctx.fill();
          circulo(ctx, x + 11, py - 15, 10); ctx.fillStyle = 'rgba(170,140,255,0.55)'; ctx.fill();
          ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(232,246,255,0.7)'; ctx.stroke();
          circulo(ctx, x + 8, py - 18, 3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
          x += 28;
        }
      }
    };
    // sombra e tabua
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, py + 8, W, 8);
    itens(30, W - 30);
    rr(ctx, -4, py, W + 8, 9, 2); ctx.fillStyle = '#7a4d2b'; ctx.fill();
    ctx.fillStyle = '#5c3a20'; ctx.fillRect(0, py + 6, W, 3);
    for (const x of [W * 0.12, W * 0.88]) { ctx.fillStyle = '#4a2f1a'; ctx.beginPath(); ctx.moveTo(x - 4, py + 9); ctx.lineTo(x + 4, py + 9); ctx.lineTo(x, py + 24); ctx.closePath(); ctx.fill(); }
    // ervas penduradas
    const erva = (x, y0, comp) => {
      ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + comp); ctx.stroke();
      const r3 = semente(Math.round(x) * 3 + 1);
      for (let k = 0; k < 9; k++) {
        const a = -Math.PI / 2 + (r3() - 0.5) * 1.6;
        elipse(ctx, x + Math.cos(a) * 7 * r3(), y0 + comp + 8 + r3() * 14, 2.4, 6, a + Math.PI / 2);
        ctx.fillStyle = k % 2 ? '#5f8f3e' : '#77a84c'; ctx.fill();
      }
      rr(ctx, x - 3.5, y0 + comp, 7, 5, 2); ctx.fillStyle = '#a8743f'; ctx.fill();
    };
    erva(22, L.topo - 4, 8); erva(W - 22, L.topo - 4, 18); erva(W - 46, L.topo - 4, 4);
    // bancada de madeira
    const by = L.chao + 10;
    const g = ctx.createLinearGradient(0, by, 0, H);
    g.addColorStop(0, '#8a5a32'); g.addColorStop(1, '#5a3a1f');
    ctx.fillStyle = g; ctx.fillRect(0, by, W, H - by);
    ctx.fillStyle = '#a8743f'; ctx.fillRect(0, by, W, 4);
    ctx.strokeStyle = 'rgba(40,20,5,0.25)'; ctx.lineWidth = 1;
    for (let y = by + 22; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const r4 = semente(77);
    for (let k = 0; k < 30; k++) { const y = by + 8 + r4() * (H - by), x = r4() * W, w = 20 + r4() * 50; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y + 2, x + w, y); ctx.strokeStyle = 'rgba(40,20,5,0.18)'; ctx.stroke(); }
    // bancada em retrato: livro de receitas aberto, pilao e cristais soltos
    if (!L.fila.vertical) bancada(ctx, W, H, L);
    // vinheta quente
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(255,170,80,0.06)'); v.addColorStop(1, 'rgba(25,10,0,0.6)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },

  vivo(ctx, W, H, t, e, mem) {
    const L = mem.L;
    const py = L ? prateleiraY(L) : 200;
    vela(ctx, W * 0.07, py, 22, t, 0);
    vela(ctx, W * 0.93, py, 16, t, 2.1);
  },

  mesa(ctx, L, e, t, mem) {
    mem.L = L;
    for (let c = 0; c < L.colunas; c++) {
      const tr = tuboRect(L, c);
      // sombra na parede
      ctx.save();
      ctx.translate(5, 4);
      tuboPath(ctx, tr.x, tr.y, tr.w, tr.h); ctx.closePath(); ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill();
      ctx.restore();
      // vidro de tras
      tuboPath(ctx, tr.x, tr.y, tr.w, tr.h); ctx.closePath();
      const g = ctx.createLinearGradient(tr.x, 0, tr.x + tr.w, 0);
      g.addColorStop(0, 'rgba(190,225,240,0.16)'); g.addColorStop(0.5, 'rgba(190,225,240,0.07)'); g.addColorStop(1, 'rgba(190,225,240,0.2)');
      ctx.fillStyle = g; ctx.fill();
      if (!e.colunas[c].length) {
        // tubo vazio: brilho morno no fundo e convite
        const s = L.carta(c, 0);
        const k = 0.5 + 0.5 * Math.sin(t * 2 + c);
        const rg = ctx.createRadialGradient(s.x + s.w / 2, s.y + s.h, 2, s.x + s.w / 2, s.y + s.h, s.w);
        rg.addColorStop(0, `rgba(255,214,140,${0.22 + 0.12 * k})`); rg.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = rg; ctx.fillRect(s.x - 10, s.y - s.h, s.w + 20, s.h * 2);
        rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 9);
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,236,200,0.5)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
        // gota
        const cx = s.x + s.w / 2, cy = s.y + s.h / 2 + 3;
        ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.quadraticCurveTo(cx + 7, cy, cx, cy + 5); ctx.quadraticCurveTo(cx - 7, cy, cx, cy - 10);
        ctx.fillStyle = 'rgba(255,236,200,0.45)'; ctx.fill();
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return sedimento(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return frascoCoringa(ctx, carta, r, op);
    if (carta.tipo === 'bomba') return frascoBomba(ctx, carta, r, op);
    if (carta.tipo === 'dobro') return frascoDobro(ctx, carta, r, op);
    if (op.fila) return frascoNormal(ctx, carta, r, op);
    camada(ctx, carta, r, op);
    if (carta.gelo) {
      cristal(ctx, r);
      const h = r.h - 2.5, w = r.w - 3, lh = Math.min(h * 0.38, 22);
      rotuloPapel(ctx, String(carta.v), 0, r.y + 1 + h * 0.56, Math.min(w * 0.86, lh * 2.4), lh, false);
    }
  },

  cadeado(ctx, a, c, e, t) {
    const tr = { x: a.x - 5, y: a.y - 28, w: a.w + 10, h: a.h + 34 };
    // veu escuro
    tuboPath(ctx, tr.x, tr.y, tr.w, tr.h); ctx.closePath();
    ctx.fillStyle = 'rgba(18,12,26,0.55)'; ctx.fill();
    // rolha com lacre de cera na boca
    const cx = tr.x + tr.w / 2;
    rr(ctx, tr.x - 2, tr.y - 12, tr.w + 4, 18, 4); ctx.fillStyle = '#a8743f'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#5a3b1c'; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tr.x - 3, tr.y - 8);
    ctx.lineTo(tr.x + tr.w + 3, tr.y - 8);
    ctx.lineTo(tr.x + tr.w + 3, tr.y + 2);
    ctx.quadraticCurveTo(tr.x + tr.w * 0.85, tr.y + 16, tr.x + tr.w * 0.75, tr.y + 4);
    ctx.quadraticCurveTo(tr.x + tr.w * 0.6, tr.y + 22, tr.x + tr.w * 0.45, tr.y + 5);
    ctx.quadraticCurveTo(tr.x + tr.w * 0.25, tr.y + 12, tr.x + tr.w * 0.15, tr.y + 3);
    ctx.lineTo(tr.x - 3, tr.y + 2);
    ctx.closePath();
    ctx.fillStyle = '#b3262b'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#6e1216'; ctx.stroke();
    // cadeado preso no lacre
    const ly = tr.y + 36, s = 1.3;
    ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, ly - 7 * s, 8 * s, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 12 * s, ly - 7 * s, 24 * s, 19 * s, 4); ctx.fillStyle = LATAO; ctx.fill(); ctx.strokeStyle = '#5a3b1c'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(cx - 9 * s, ly - 5 * s, 4, 14 * s);
    ctx.fillStyle = '#5a3b1c'; circulo(ctx, cx, ly + 1, 2.8); ctx.fill(); ctx.fillRect(cx - 1.2, ly + 1, 2.4, 7);
    // gatilho (o que abre o lacre)
    const g = e.cadeados[c];
    if (g) texto(ctx, g.tipo === 'valor' ? `faça ${g.v}` : 'lacrado', cx, ly + 30, 11, '#ffe9b8', { contorno: 'rgba(20,10,30,0.85)', espessura: 3, max: tr.w + 10 });
  },

  descarte(ctx, r, e, t) {
    // parte de tras do caldeirao: fogo, boca e liquido (o corpo vem na frente(), por cima da pocao descartada)
    const k = caldeirao(r);
    const carga = e.descarteCarga > 0;
    if (carga) {
      for (let i = 0; i < 3; i++) {
        const fx = k.cx + (i - 1) * k.cw * 0.42, f = 0.8 + 0.25 * Math.sin(t * 12 + i * 2);
        ctx.beginPath(); ctx.moveTo(fx, k.base - 16 * f);
        ctx.quadraticCurveTo(fx + 7, k.base - 3, fx, k.base + 2); ctx.quadraticCurveTo(fx - 7, k.base - 3, fx, k.base - 16 * f);
        ctx.fillStyle = i === 1 ? '#ffb43f' : '#ff7a2e'; ctx.fill();
      }
    }
    elipse(ctx, k.cx, k.boca, k.cw * 0.92, k.ch * 0.2); ctx.fillStyle = '#3a3940'; ctx.fill();
    elipse(ctx, k.cx, k.boca + 1, k.cw * 0.8, k.ch * 0.15); ctx.fillStyle = carga ? '#7be34a' : '#3b4a33'; ctx.fill();
    if (carga) {
      const g = ctx.createRadialGradient(k.cx, k.boca, 2, k.cx, k.boca, k.cw * 1.4);
      g.addColorStop(0, 'rgba(140,255,110,0.25)'); g.addColorStop(1, 'rgba(140,255,110,0)');
      ctx.fillStyle = g; circulo(ctx, k.cx, k.boca, k.cw * 1.4); ctx.fill();
    }
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) {
      rr(ctx, f.x + 2, f.y - 6, f.w - 4, f.h + 12, 10); ctx.fillStyle = 'rgba(42,26,14,0.35)'; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = '#6e4526'; ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#3b2412'; ctx.stroke();
      for (let k = 0; k < L.tamFila; k++) {
        const p = L.filaPos(k);
        rr(ctx, f.x + 5, p.y + p.h, f.w - 10, 6, 2); ctx.fillStyle = '#8a5a32'; ctx.fill();
      }
      return;
    }
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, p2.x) - 16, x1 = Math.max(p0.x + p0.w, p2.x + p2.w) + 16;
    const y = p0.y + p0.h + 1;
    elipse(ctx, (x0 + x1) / 2, y + 4, (x1 - x0) / 2 + 4, 10); ctx.fillStyle = 'rgba(20,10,0,0.3)'; ctx.fill();
    elipse(ctx, (x0 + x1) / 2, y, (x1 - x0) / 2, 9);
    const g = ctx.createLinearGradient(0, y - 9, 0, y + 9); g.addColorStop(0, '#f0c95a'); g.addColorStop(1, '#a8781f');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#6e4a12'; ctx.stroke();
    elipse(ctx, (x0 + x1) / 2, y - 1, (x1 - x0) / 2 - 8, 5); ctx.fillStyle = 'rgba(255,240,190,0.35)'; ctx.fill();
    texto(ctx, 'próxima ▸', p0.x + p0.w / 2, p0.y - 10, 12, '#ffe9b8', { contorno: 'rgba(30,15,5,0.75)', espessura: 3 });
  },

  frente(ctx, L, e, t) {
    if (!L.colunas) return;
    caldeiraoFrente(ctx, L.descarte, e, t);
    let xMin = Infinity, xMax = -Infinity, yTopo = 0;
    for (let c = 0; c < L.colunas; c++) {
      const tr = tuboRect(L, c);
      xMin = Math.min(xMin, tr.x); xMax = Math.max(xMax, tr.x + tr.w); yTopo = tr.y;
      // reflexos do vidro
      ctx.save();
      tuboPath(ctx, tr.x, tr.y, tr.w, tr.h); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; rr(ctx, tr.x + 4, tr.y + 10, 4, tr.h - 30, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; rr(ctx, tr.x + 10, tr.y + 14, 2.5, tr.h * 0.5, 1.2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; rr(ctx, tr.x + tr.w - 7, tr.y + 20, 3, tr.h * 0.6, 1.5); ctx.fill();
      ctx.restore();
      // graduacao
      ctx.strokeStyle = 'rgba(235,248,255,0.45)'; ctx.lineWidth = 1;
      for (let i = 1; i < L.pilhaMax; i++) {
        const y = L.carta(c, i).y + L.carta(c, i).h;
        ctx.beginPath(); ctx.moveTo(tr.x + tr.w - 2, y); ctx.lineTo(tr.x + tr.w - (i % 2 ? 6 : 10), y); ctx.stroke();
      }
      tuboPath(ctx, tr.x, tr.y, tr.w, tr.h);
      ctx.lineWidth = 2.4; ctx.strokeStyle = VIDRO; ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(30,50,60,0.5)'; ctx.stroke();
      // boca (aba do tubo)
      elipse(ctx, tr.x + tr.w / 2, tr.y, tr.w / 2 + 3, 4); ctx.lineWidth = 2.2; ctx.strokeStyle = VIDRO; ctx.stroke();
    }
    // suporte: tabua de cima com furos, tabua de baixo e colunas laterais
    const bw = 12, topoY = yTopo + 16, baseY = L.chao + 8;
    const x0 = xMin - 14, x1 = xMax + 14;
    for (const x of [x0, x1 - 8]) { rr(ctx, x, topoY, 8, baseY - topoY + 14, 2); ctx.fillStyle = '#6e4526'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#3b2412'; ctx.stroke(); }
    const tabua = (y, h) => {
      rr(ctx, x0 - 4, y, x1 - x0 + 8, h, 3);
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#a8743f'); g.addColorStop(1, '#6e4526');
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#3b2412'; ctx.stroke();
      for (const x of [x0 + 2, x1 - 2]) { circulo(ctx, x, y + h / 2, 2.2); ctx.fillStyle = LATAO; ctx.fill(); }
    };
    tabua(topoY, bw);
    for (let c = 0; c < L.colunas; c++) {
      const tr = tuboRect(L, c);
      elipse(ctx, tr.x + tr.w / 2, topoY + 3, tr.w / 2 + 2, 3); ctx.fillStyle = 'rgba(30,15,5,0.55)'; ctx.fill();
    }
    tabua(baseY, 14);
  },

  hud(ctx, W, H, L, e, t) {
    const x = 10, y = 10, w = W - 20, h = 76;
    // pergaminho
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rr(ctx, x + 8, y + 4, w - 16, h - 8, 6);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#f5e6c1'); g.addColorStop(1, '#e2c995');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(120,80,30,0.35)'; ctx.lineWidth = 1;
    rr(ctx, x + 12, y + 8, w - 24, h - 16, 4); ctx.stroke();
    // rolos
    for (const rx of [x, x + w - 14]) {
      rr(ctx, rx, y, 14, h, 7);
      const gr = ctx.createLinearGradient(rx, 0, rx + 14, 0); gr.addColorStop(0, '#b8975c'); gr.addColorStop(0.45, '#f0dcae'); gr.addColorStop(1, '#a8874c');
      ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#6e4a1c'; ctx.stroke();
    }
    // selo de cera com a receita
    const sx = x + 44, sy = y + h / 2;
    estrela(ctx, sx, sy, 25, 22, 16, 0); ctx.fillStyle = '#b3262b'; ctx.fill();
    circulo(ctx, sx, sy, 18); ctx.lineWidth = 1.5; ctx.strokeStyle = '#7e1519'; ctx.stroke();
    texto(ctx, 'receita', sx, sy - 9, 8.5, '#ffd9c4');
    texto(ctx, String(e.faseId), sx, sy + 5, 18, '#fff2e6', { contorno: '#6e1216', espessura: 3 });
    // metas
    const mx = x + 78, mw = w - 78 - 98;
    e.metas.forEach((m, k) => {
      const yy = y + 15 + k * 28;
      texto(ctx, textoMeta(m, { monte: (n) => `Destile ${n} elixir${n > 1 ? 'es' : ''}` }), mx, yy + 4, 12, TINTA, { alinhar: 'left', max: mw });
      rr(ctx, mx, yy + 12, mw, 8, 4); ctx.fillStyle = '#cdb27a'; ctx.fill();
      const u = Math.min(1, m.atual / m.alvo);
      rr(ctx, mx, yy + 12, Math.max(8, mw * u), 8, 4);
      const gb = ctx.createLinearGradient(mx, 0, mx + mw, 0); gb.addColorStop(0, '#6fd36b'); gb.addColorStop(1, '#ffc21a');
      ctx.fillStyle = m.feita ? '#4fb84a' : gb; ctx.fill();
      rr(ctx, mx, yy + 12, mw, 8, 4); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(90,59,28,0.5)'; ctx.stroke();
    });
    // pontos com frasquinho dourado
    const px = x + w - 52;
    ctx.save(); ctx.translate(px, 0);
    frasco(ctx, { x: -11, y: y + 10, w: 22, h: 30 }, { t }, {
      id: 3,
      fundo: (c, x1, y1, w1, h1) => { const gg = c.createLinearGradient(0, y1, 0, y1 + h1); gg.addColorStop(0, '#ffe07a'); gg.addColorStop(1, '#c98a00'); return gg; },
    });
    ctx.restore();
    texto(ctx, String(e.pontos), px, y + 56, 17, TINTA, { max: 84 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      texto(ctx, 'REAÇÃO x2!', W / 2, y + h + 18, 20 + k * 2, '#b6ff6a', { contorno: '#1e3a12', espessura: 4 });
    }
  },

  efeito(fx, P) {
    if (!P.formas.bolha) {
      P.formas.bolha = (ctx, p) => {
        ctx.lineWidth = 1.2; ctx.strokeStyle = p.cor; circulo(ctx, 0, 0, p.tam / 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; circulo(ctx, -p.tam * 0.15, -p.tam * 0.15, p.tam * 0.12); ctx.fill();
      };
      P.formas.cristal = (ctx, p) => {
        const s = p.tam / 2;
        ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s * 0.55, 0); ctx.lineTo(0, s * 1.3); ctx.lineTo(-s * 0.55, 0); ctx.closePath();
        ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
      };
      P.formas.fumaca = (ctx, p, u) => { ctx.globalAlpha *= 0.55; circulo(ctx, 0, 0, p.tam * (0.5 + u * 0.8)); ctx.fill(); };
    }
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y - 12, ['#d8f0ff', '#ffffff', '#9fdcff'], 7, 0.4, { g: 380, vida: 0.4, tam: 4, forma: 'c' });
        return true;
      case 'fusao': {
        const cor = corDe(fx.valor);
        P.subir(fx.x, fx.y + 8, [clarear(cor, 0.5), '#ffffff', cor], 8 + fx.degrau * 3, { forma: 'bolha', tam: 9, larg: 34, vida: 1.0, forca: 1 + fx.degrau * 0.2 });
        P.anel(fx.x, fx.y, clarear(cor, 0.4), 26 + fx.degrau * 6);
        P.estourar(fx.x, fx.y, [cor, '#fff6c8'], 6 + fx.degrau * 2, 0.6 + fx.degrau * 0.12, { forma: 'estrela', tam: 7, g: 200 });
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, 'x' + fx.degrau, '#fff3b0', 22 + fx.degrau * 2, '#4a2e14');
        return true;
      }
      case 'completar':
        P.subir(fx.x, fx.y, ['#ffe07a', '#ffc21a', '#fff6c8'], 34, { forma: 'estrela', tam: 11, larg: 40, vida: 1.4, forca: 3, g: 40 });
        P.estourar(fx.x, fx.y, ['#ffc21a', '#fff3b0', '#ffffff'], 26, 1.5, { forma: 'estrela', tam: 9, g: 300 });
        P.anel(fx.x, fx.y, '#ffe07a', 70, 0.6);
        P.texto(fx.x, fx.y - 34, 'Elixir!', '#ffd23f', 32, '#5a3008');
        return true;
      case 'explodir':
        P.subir(fx.x, fx.y, ['rgba(180,120,255,0.9)', 'rgba(120,220,140,0.9)', 'rgba(150,150,160,0.9)'], 9, { forma: 'fumaca', tam: 22, larg: 34, vida: 1.0, forca: 0.7 });
        P.estourar(fx.x, fx.y, ['#ff6a4d', '#ffd23f', '#ffffff'], 16, 1.2, { forma: 'estrela', tam: 8 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#8d8473', '#4f483e', '#b5ab98'], 20, 1.1, { forma: 'q', tam: 6 });
        P.subir(fx.x, fx.y, ['rgba(160,150,135,0.8)'], 5, { forma: 'fumaca', tam: 16, vida: 0.7, larg: 30 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#8d8473', '#b5ab98'], 7, 0.6, { forma: 'q', tam: 4 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#dff6ff', '#a8e0ff', '#ffffff'], 16, 0.8, { forma: 'cristal', tam: 8, g: 160, vida: 0.8 });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y - 30, ['#b3262b', '#7e1519', '#d8a93f'], 16, 1, { forma: 'q', tam: 5 });
        P.texto(fx.x, fx.y - 50, 'Aberto!', '#ffe9b8', 20, '#4a2e14');
        return true;
      case 'combo':
        P.texto(fx.x, fx.y - 46, `Combo x${fx.n}!`, '#b6ff6a', 22, '#1e3a12');
        return true;
      default: return false;
    }
  },
};

export default tema;
