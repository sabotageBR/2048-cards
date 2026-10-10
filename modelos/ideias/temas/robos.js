// Ideia 10: Fabrica de Robos. Cada carta e um modulo metalico com visor de LED
// e o icone da peca (parafuso -> porca -> engrenagem -> ... -> robo gigante).
// A cascata e a linha de montagem trabalhando sozinha; o 2048 e o robo
// gigante, que sai voando com jatos. Pedra = sucata, gelo = nitrogenio,
// cadeado = porta blindada, coringa = chave universal, bomba = pulso
// eletromagnetico, dobro = turbo.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const TINTA = '#1d2128';
const ACO = '#8a96a3', LARANJA = '#ff7a1a', CIANO = '#29d3ff', ALERTA = '#ffd21f', CHUMBO = '#2b313a';

/** Cor da pintura do modulo por nivel (2..4096). */
const PINTURA = ['#9aa6b2', '#ff8a2a', '#2bb3a3', '#ffc61f', '#e8483b', '#8f5bd6', '#3a7bea', '#6fc23a', '#ff5fa2', '#4a5361', '#e9eef5', '#ffcc33'];
const NOMES = ['parafuso', 'porca', 'engrenagem', 'mola', 'bateria', 'chip', 'motor', 'braco', 'cabeca', 'robozinho', 'gigante', 'mecha'];

// ------------------------------------------------------------ visor de sete segmentos

// segmentos: a (topo), b (dir. alto), c (dir. baixo), d (base), e (esq. baixo), f (esq. alto), g (meio)
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };

function digito(ctx, d, x, y, w, h, cor, apagado) {
  const e = Math.max(1.6, w * 0.2);
  const segs = {
    a: [x + e * 0.6, y, w - e * 1.2, e], d: [x + e * 0.6, y + h - e, w - e * 1.2, e], g: [x + e * 0.6, y + h / 2 - e / 2, w - e * 1.2, e],
    f: [x, y + e * 0.6, e, h / 2 - e * 0.9], b: [x + w - e, y + e * 0.6, e, h / 2 - e * 0.9],
    e: [x, y + h / 2 + e * 0.3, e, h / 2 - e * 0.9], c: [x + w - e, y + h / 2 + e * 0.3, e, h / 2 - e * 0.9],
  };
  const liga = SEG[d] || '';
  for (const k of 'abcdefg') {
    const [sx, sy, sw, sh] = segs[k];
    ctx.fillStyle = liga.includes(k) ? cor : apagado;
    rr(ctx, sx, sy, sw, sh, e * 0.45); ctx.fill();
  }
}

/** Numero em sete segmentos centrado em (cx, cy) com altura h; respeita a largura maxima. */
function visor(ctx, txt, cx, cy, h, maxW, cor = CIANO) {
  const n = txt.length;
  let dh = h;
  const largura = (hh) => n * hh * 0.56 + (n - 1) * hh * 0.16;
  if (largura(dh) > maxW) dh = maxW / (n * 0.56 + (n - 1) * 0.16);
  const dw = dh * 0.56, gap = dh * 0.16;
  let x = cx - largura(dh) / 2;
  ctx.save();
  ctx.shadowColor = cor; ctx.shadowBlur = dh * 0.5;
  for (const ch of txt) { digito(ctx, Number(ch), x, cy - dh / 2, dw, dh, cor, rgba(cor, 0.1)); x += dw + gap; }
  ctx.restore();
}

// ------------------------------------------------------------ icones

function engrenagem(ctx, x, y, R, dentes, cor, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < dentes * 2; i++) {
    const a = rot + (i / (dentes * 2)) * TAU;
    const r0 = i % 2 ? R * 0.78 : R;
    ctx.lineTo(x + Math.cos(a - 0.12) * r0, y + Math.sin(a - 0.12) * r0);
    ctx.lineTo(x + Math.cos(a + 0.12) * r0, y + Math.sin(a + 0.12) * r0);
  }
  ctx.closePath();
  ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = Math.max(1, R * 0.1); ctx.strokeStyle = TINTA; ctx.stroke();
  circulo(ctx, x, y, R * 0.32); ctx.fillStyle = CHUMBO; ctx.fill();
}

/** Icone da peca n (0..11) centrado em (x, y), tamanho s. */
function icone(ctx, n, x, y, s, t) {
  const claro = '#eef2f6', medio = '#b9c3cf';
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.2, s * 0.09); ctx.strokeStyle = TINTA;
  switch (NOMES[Math.min(n, NOMES.length - 1)]) {
    case 'parafuso': {
      rr(ctx, x - s * 0.42, y - s * 0.5, s * 0.84, s * 0.3, 2); ctx.fillStyle = claro; ctx.fill(); ctx.stroke();
      rr(ctx, x - s * 0.16, y - s * 0.2, s * 0.32, s * 0.72, 2); ctx.fillStyle = medio; ctx.fill(); ctx.stroke();
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - s * 0.16, y - s * 0.08 + k * s * 0.15); ctx.lineTo(x + s * 0.16, y + k * s * 0.15); ctx.stroke(); }
      break;
    }
    case 'porca': {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i * (TAU / 6); ctx.lineTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5); }
      ctx.closePath(); ctx.fillStyle = claro; ctx.fill(); ctx.stroke();
      circulo(ctx, x, y, s * 0.2); ctx.fillStyle = CHUMBO; ctx.fill(); ctx.stroke();
      break;
    }
    case 'engrenagem': engrenagem(ctx, x, y, s * 0.5, 8, claro, t * 0.8); break;
    case 'mola': {
      ctx.strokeStyle = '#d9e0e8'; ctx.lineWidth = s * 0.14;
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) ctx.lineTo(x + (k % 2 ? s * 0.38 : -s * 0.38), y - s * 0.45 + (k * s * 0.9) / 8);
      ctx.stroke();
      ctx.strokeStyle = TINTA; ctx.lineWidth = s * 0.05; ctx.stroke();
      break;
    }
    case 'bateria': {
      rr(ctx, x - s * 0.3, y - s * 0.42, s * 0.6, s * 0.9, 3); ctx.fillStyle = claro; ctx.fill(); ctx.stroke();
      rr(ctx, x - s * 0.12, y - s * 0.52, s * 0.24, s * 0.1, 1); ctx.fillStyle = medio; ctx.fill(); ctx.stroke();
      const nivelCarga = 1 + Math.floor((t * 2) % 3);
      for (let k = 0; k < 3; k++) { rr(ctx, x - s * 0.2, y + s * 0.26 - k * s * 0.24, s * 0.4, s * 0.17, 1.5); ctx.fillStyle = k < nivelCarga ? '#5ee05a' : '#3b4450'; ctx.fill(); }
      break;
    }
    case 'chip': {
      ctx.strokeStyle = '#d9b44a';
      for (let k = 0; k < 4; k++) {
        const d = -s * 0.3 + k * s * 0.2;
        for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * s * 0.34, y + d); ctx.lineTo(x + sx * s * 0.52, y + d); ctx.stroke(); }
        for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + d, y + sy * s * 0.34); ctx.lineTo(x + d, y + sy * s * 0.52); ctx.stroke(); }
      }
      ctx.strokeStyle = TINTA;
      rr(ctx, x - s * 0.36, y - s * 0.36, s * 0.72, s * 0.72, 3); ctx.fillStyle = '#2d3440'; ctx.fill(); ctx.stroke();
      circulo(ctx, x - s * 0.2, y - s * 0.2, s * 0.05); ctx.fillStyle = '#9aa6b2'; ctx.fill();
      ctx.fillStyle = CIANO; rr(ctx, x - s * 0.14, y - s * 0.06, s * 0.28, s * 0.12, 1); ctx.fill();
      break;
    }
    case 'motor': {
      rr(ctx, x - s * 0.42, y - s * 0.3, s * 0.7, s * 0.6, 4); ctx.fillStyle = '#c94a3a'; ctx.fill(); ctx.stroke();
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - s * 0.3 + k * s * 0.18, y - s * 0.3); ctx.lineTo(x - s * 0.3 + k * s * 0.18, y + s * 0.3); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.stroke(); }
      ctx.strokeStyle = TINTA;
      rr(ctx, x + s * 0.28, y - s * 0.07, s * 0.2, s * 0.14, 1); ctx.fillStyle = claro; ctx.fill(); ctx.stroke();
      engrenagem(ctx, x + s * 0.48, y, s * 0.12, 6, ALERTA, t * 6);
      break;
    }
    case 'braco': {
      ctx.strokeStyle = TINTA; ctx.lineWidth = s * 0.22;
      ctx.beginPath(); ctx.moveTo(x - s * 0.4, y + s * 0.4); ctx.lineTo(x - s * 0.1, y - s * 0.1); ctx.lineTo(x + s * 0.3, y - s * 0.25); ctx.stroke();
      ctx.strokeStyle = LARANJA; ctx.lineWidth = s * 0.14; ctx.stroke();
      for (const [jx, jy] of [[-0.4, 0.4], [-0.1, -0.1]]) { circulo(ctx, x + jx * s, y + jy * s, s * 0.11); ctx.fillStyle = claro; ctx.fill(); ctx.lineWidth = s * 0.05; ctx.strokeStyle = TINTA; ctx.stroke(); }
      const ab = Math.sin(t * 4) * 0.2;
      for (const sg of [-1, 1]) {
        ctx.save(); ctx.translate(x + s * 0.32, y - s * 0.25); ctx.rotate(sg * (0.5 + ab));
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.22, 0); ctx.strokeStyle = TINTA; ctx.lineWidth = s * 0.09; ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'cabeca': robo(ctx, x, y, s * 0.95, 'cabeca', t); break;
    case 'robozinho': robo(ctx, x, y, s * 0.95, 'corpo', t); break;
    case 'gigante': robo(ctx, x, y, s * 1.05, 'gigante', t); break;
    case 'mecha': robo(ctx, x, y, s * 1.05, 'mecha', t); break;
    default: break;
  }
  ctx.restore();
}

/** Robo (cabeca, robozinho, gigante ou mecha dourado). */
function robo(ctx, x, y, s, tipo, t) {
  const corpo = tipo === 'mecha' ? '#ffcc33' : tipo === 'gigante' ? '#e9eef5' : '#cfd6de';
  const pisca = Math.sin(t * 3) > 0.92;
  ctx.lineWidth = Math.max(1.2, s * 0.07); ctx.strokeStyle = TINTA;
  const hy = tipo === 'cabeca' ? y : y - s * 0.22;
  const hw = tipo === 'cabeca' ? s * 0.8 : s * 0.56, hh = tipo === 'cabeca' ? s * 0.62 : s * 0.42;
  if (tipo !== 'cabeca') {
    // corpo, bracos e pes
    rr(ctx, x - s * 0.34, y + s * 0.02, s * 0.68, s * 0.38, 4); ctx.fillStyle = corpo; ctx.fill(); ctx.stroke();
    circulo(ctx, x, y + s * 0.2, s * 0.09); ctx.fillStyle = tipo === 'mecha' ? '#ff4a4a' : CIANO; ctx.fill();
    for (const sg of [-1, 1]) { rr(ctx, x + sg * s * 0.44 - s * 0.07, y + s * 0.04, s * 0.14, s * 0.3, 3); ctx.fillStyle = escurecer(corpo, 0.15); ctx.fill(); ctx.stroke(); }
    for (const sg of [-1, 1]) { rr(ctx, x + sg * s * 0.17 - s * 0.1, y + s * 0.4, s * 0.2, s * 0.1, 2); ctx.fillStyle = CHUMBO; ctx.fill(); }
    if (tipo === 'gigante' || tipo === 'mecha') {
      // jatos nos pes
      for (const sg of [-1, 1]) {
        const fl = s * (0.18 + 0.08 * Math.sin(t * 22 + sg));
        ctx.beginPath(); ctx.moveTo(x + sg * s * 0.17 - s * 0.07, y + s * 0.5); ctx.lineTo(x + sg * s * 0.17, y + s * 0.5 + fl); ctx.lineTo(x + sg * s * 0.17 + s * 0.07, y + s * 0.5); ctx.closePath();
        ctx.fillStyle = ALERTA; ctx.fill();
      }
    }
  }
  // antena
  ctx.beginPath(); ctx.moveTo(x, hy - hh / 2); ctx.lineTo(x, hy - hh / 2 - s * 0.16); ctx.stroke();
  circulo(ctx, x, hy - hh / 2 - s * 0.18, s * 0.06); ctx.fillStyle = Math.sin(t * 5) > 0 ? '#ff4a4a' : '#ffb3b3'; ctx.fill();
  // cabeca
  rr(ctx, x - hw / 2, hy - hh / 2, hw, hh, s * 0.1); ctx.fillStyle = corpo; ctx.fill(); ctx.stroke();
  rr(ctx, x - hw * 0.38, hy - hh * 0.28, hw * 0.76, hh * 0.5, s * 0.06); ctx.fillStyle = '#20262f'; ctx.fill();
  ctx.fillStyle = tipo === 'mecha' ? '#ff6a3d' : CIANO;
  for (const sg of [-1, 1]) {
    if (pisca) ctx.fillRect(x + sg * hw * 0.18 - hw * 0.08, hy - hh * 0.04, hw * 0.16, hh * 0.05);
    else { circulo(ctx, x + sg * hw * 0.18, hy - hh * 0.03, hh * 0.1); ctx.fill(); }
  }
  if (tipo === 'mecha') {
    ctx.beginPath(); const cy = hy - hh / 2 - s * 0.02, w = hw * 0.7;
    ctx.moveTo(x - w / 2, cy); ctx.lineTo(x - w / 2, cy - s * 0.16); ctx.lineTo(x - w / 4, cy - s * 0.06); ctx.lineTo(x, cy - s * 0.2); ctx.lineTo(x + w / 4, cy - s * 0.06); ctx.lineTo(x + w / 2, cy - s * 0.16); ctx.lineTo(x + w / 2, cy); ctx.closePath();
    ctx.fillStyle = '#fff1a8'; ctx.fill(); ctx.stroke();
  }
}

// ------------------------------------------------------------ pecas

function rebites(ctx, x0, y0, w, h) {
  for (const [rx, ry] of [[x0 + 4, y0 + 4], [x0 + w - 4, y0 + 4], [x0 + 4, y0 + h - 4], [x0 + w - 4, y0 + h - 4]]) {
    circulo(ctx, rx, ry, 1.8); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
    ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.stroke();
  }
}

/** Faixa de alerta (amarelo e preto) num retangulo. */
function listras(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = ALERTA; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#1d1d22';
  for (let k = -h; k < w + h; k += h * 1.4) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h * 0.7, y + h); ctx.lineTo(x + k + h * 1.4, y); ctx.lineTo(x + k + h * 0.7, y); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

/** Modulo metalico do valor v, centrado em r. */
function modulo(ctx, carta, r, op) {
  const v = carta.v, n = nivel(v);
  const cor = PINTURA[Math.min(n, PINTURA.length - 1)];
  const pw = r.w * (0.82 + 0.18 * Math.min(1, n / 10));
  const ph = r.h - 3;
  const x0 = -pw / 2, y0 = r.y + 1.5;
  // sombra
  rr(ctx, x0 + 2, y0 + 3, pw, ph, 6); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
  // carcaca
  const g = ctx.createLinearGradient(0, y0, 0, y0 + ph);
  g.addColorStop(0, clarear(cor, 0.35)); g.addColorStop(0.45, cor); g.addColorStop(1, escurecer(cor, 0.3));
  rr(ctx, x0, y0, pw, ph, 6); ctx.fillStyle = g; ctx.fill();
  ctx.save();
  rr(ctx, x0, y0, pw, ph, 6); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x0, y0, pw, Math.max(2, ph * 0.06));
  if (n >= 6) listras(ctx, x0, y0 + ph - Math.max(4, ph * 0.08), pw, Math.max(4, ph * 0.08));
  ctx.restore();
  rr(ctx, x0, y0, pw, ph, 6); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
  rebites(ctx, x0, y0, pw, ph);
  // janela do icone (em cima) e visor de LED (embaixo)
  const visH = Math.max(14, ph * 0.36);
  const visY = y0 + ph - visH - Math.max(4, ph * 0.1) - (n >= 6 ? 1 : 0);
  const icH = visY - y0 - 4;
  const s = Math.min(icH * 0.86, pw * 0.62);
  icone(ctx, n, 0, y0 + 3 + icH / 2, s, op.t || 0);
  rr(ctx, x0 + 4, visY, pw - 8, visH, 3); ctx.fillStyle = '#0d1116'; ctx.fill();
  ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
  const corLed = n >= 10 ? '#ffd84a' : n >= 6 ? '#7dff6a' : CIANO;
  visor(ctx, String(v), 0, visY + visH / 2, visH * 0.7, pw - 14, corLed);
  if (op.destaque) {
    rr(ctx, x0 - 3, y0 - 3, pw + 6, ph + 6, 8);
    ctx.strokeStyle = `rgba(41,211,255,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

/** Congelado em nitrogenio (o gelo deste tema), com o visor ainda legivel. */
function nitrogenio(ctx, r, t) {
  ctx.save();
  rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, 7);
  ctx.fillStyle = 'rgba(170,225,255,0.5)'; ctx.fill();
  ctx.strokeStyle = '#e6f7ff'; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.2;
  const rnd = semente(5);
  for (let k = 0; k < 6; k++) {
    const x = r.x + rnd() * r.w, y = r.y + rnd() * r.h * 0.5;
    for (let a = 0; a < 3; a++) { const ang = (a * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * 4, y - Math.sin(ang) * 4); ctx.lineTo(x + Math.cos(ang) * 4, y + Math.sin(ang) * 4); ctx.stroke(); }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h * 0.6); ctx.lineTo(r.x + r.w * 0.5, r.y); ctx.lineTo(r.x + r.w * 0.62, r.y); ctx.lineTo(r.x, r.y + r.h * 0.75); ctx.closePath(); ctx.fill();
  ctx.restore();
  // vapor saindo por cima
  for (let k = 0; k < 3; k++) {
    const u = ((t * 0.7 + k * 0.33) % 1);
    ctx.fillStyle = `rgba(230,245,255,${0.55 * (1 - u)})`;
    circulo(ctx, r.x + r.w * (0.25 + k * 0.25) + Math.sin(t * 2 + k) * 3, r.y - u * 14, 3 + u * 5); ctx.fill();
  }
}

/** Sucata enferrujada (pedra), com luzes de hp. */
function sucata(ctx, r, hp) {
  const w = r.w * 0.94, h = r.h - 4, y0 = r.y + 2, x0 = -w / 2;
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w * 0.04, y0 + h * 0.4); ctx.lineTo(x0 + w * 0.22, y0 + h * 0.18); ctx.lineTo(x0 + w * 0.46, y0 + h * 0.08);
    ctx.lineTo(x0 + w * 0.7, y0 + h * 0.16); ctx.lineTo(x0 + w * 0.94, y0 + h * 0.34); ctx.lineTo(x0 + w, y0 + h); ctx.closePath();
  };
  forma();
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, '#b0683a'); g.addColorStop(1, '#5e3a24');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); forma(); ctx.clip();
  const rnd = semente(13);
  for (let k = 0; k < 9; k++) { elipse(ctx, x0 + rnd() * w, y0 + rnd() * h, 3 + rnd() * 7, 2 + rnd() * 4); ctx.fillStyle = k % 2 ? 'rgba(200,110,50,0.6)' : 'rgba(70,40,25,0.5)'; ctx.fill(); }
  // chapas amassadas
  ctx.strokeStyle = 'rgba(30,18,10,0.55)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x0 + w * 0.1, y0 + h * 0.55); ctx.lineTo(x0 + w * 0.4, y0 + h * 0.48); ctx.lineTo(x0 + w * 0.62, y0 + h * 0.6); ctx.lineTo(x0 + w * 0.9, y0 + h * 0.5); ctx.stroke();
  ctx.restore();
  forma(); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
  // parafuso e cano saindo
  ctx.save(); ctx.translate(x0 + w * 0.72, y0 + h * 0.2); ctx.rotate(-0.6);
  rr(ctx, -2.5, -h * 0.22, 5, h * 0.24, 1.5); ctx.fillStyle = '#9aa6b2'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.restore();
  engrenagem(ctx, x0 + w * 0.26, y0 + h * 0.34, Math.max(4, h * 0.12), 6, '#8a6a52', 0.3);
  // amassados pelo hp perdido
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  ctx.strokeStyle = '#1d120a'; ctx.lineWidth = 1.8;
  const rach = [[-0.25, 0.3, -0.05, 0.5, -0.18, 0.72], [0.2, 0.25, 0.06, 0.45, 0.22, 0.7], [-0.02, 0.15, 0.08, 0.32, -0.06, 0.48]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, y0 + c[1] * h); ctx.lineTo(c[2] * w, y0 + c[3] * h); ctx.lineTo(c[4] * w, y0 + c[5] * h); ctx.stroke();
  }
  // luzes de hp
  rr(ctx, -17, y0 + h * 0.74, 34, 11, 3); ctx.fillStyle = '#14181d'; ctx.fill();
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * 10, y0 + h * 0.74 + 5.5, 3);
    ctx.fillStyle = k < hp ? '#ff4a3d' : '#3b2a2a'; ctx.fill();
  }
}

function chave(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.44, r.w * 0.4), cy = r.y + r.h * 0.5;
  rr(ctx, -r.w * 0.44, r.y + 2, r.w * 0.88, r.h - 4, 7); ctx.fillStyle = '#20262f'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.save();
  ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 8 + Math.sin(t * 4) * 4;
  ctx.translate(0, cy); ctx.rotate(-0.7 + Math.sin(t * 2) * 0.06);
  rr(ctx, -s * 0.12, -s * 0.55, s * 0.24, s * 1.1, s * 0.1);
  const g = ctx.createLinearGradient(-s * 0.12, 0, s * 0.12, 0);
  g.addColorStop(0, '#b8862a'); g.addColorStop(0.5, '#fff1a8'); g.addColorStop(1, '#b8862a');
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -s * 0.62, s * 0.3, 0.6 * Math.PI, 2.4 * Math.PI); ctx.lineTo(s * 0.08, -s * 0.5); ctx.lineTo(-s * 0.08, -s * 0.5); ctx.closePath(); ctx.fill();
  circulo(ctx, 0, s * 0.6, s * 0.2); ctx.fill();
  ctx.restore();
  ctx.lineWidth = 1.2;
  estrela(ctx, s * 0.6, cy - s * 0.5, 4 + Math.sin(t * 7) * 1.5, 1.6, 4); ctx.fillStyle = '#fff'; ctx.fill();
  texto(ctx, '?', -s * 0.62, cy + s * 0.45, s * 0.5, '#ffd84a');
}

function pulso(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.4, r.w * 0.34), cy = r.y + r.h * 0.5;
  const halo = ctx.createRadialGradient(0, cy, 2, 0, cy, s * 1.4);
  halo.addColorStop(0, 'rgba(120,220,255,0.9)'); halo.addColorStop(1, 'rgba(41,211,255,0)');
  ctx.fillStyle = halo; circulo(ctx, 0, cy, s * 1.4); ctx.fill();
  circulo(ctx, 0, cy, s * 0.72); ctx.fillStyle = '#1a6fc9'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
  circulo(ctx, -s * 0.22, cy - s * 0.22, s * 0.2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
  // arcos eletricos
  const rnd = semente(((t * 12) | 0) + 1);
  ctx.strokeStyle = '#e6fbff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 4; k++) {
    const a = rnd() * TAU;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.7, cy + Math.sin(a) * s * 0.7);
    for (let i = 1; i <= 3; i++) { const rr0 = s * (0.7 + i * 0.18); ctx.lineTo(Math.cos(a + (rnd() - 0.5) * 0.5) * rr0, cy + Math.sin(a + (rnd() - 0.5) * 0.5) * rr0); }
    ctx.stroke();
  }
  texto(ctx, 'EMP', 0, cy + 1, s * 0.42, '#ffffff', { contorno: '#0b3a6a', espessura: 3 });
}

function turbo(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.44, r.w * 0.36), cy = r.y + r.h * 0.42;
  // chama
  const fl = s * (0.7 + 0.2 * Math.sin(t * 24));
  ctx.beginPath(); ctx.moveTo(-s * 0.3, cy + s * 0.45); ctx.quadraticCurveTo(0, cy + s * 0.45 + fl * 1.3, s * 0.3, cy + s * 0.45); ctx.closePath();
  ctx.fillStyle = LARANJA; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-s * 0.16, cy + s * 0.45); ctx.quadraticCurveTo(0, cy + s * 0.45 + fl * 0.8, s * 0.16, cy + s * 0.45); ctx.closePath();
  ctx.fillStyle = ALERTA; ctx.fill();
  // bocal
  ctx.beginPath(); ctx.moveTo(-s * 0.38, cy - s * 0.5); ctx.lineTo(s * 0.38, cy - s * 0.5); ctx.lineTo(s * 0.3, cy + s * 0.45); ctx.lineTo(-s * 0.3, cy + s * 0.45); ctx.closePath();
  const g = ctx.createLinearGradient(-s * 0.4, 0, s * 0.4, 0);
  g.addColorStop(0, '#5b6572'); g.addColorStop(0.4, '#dfe6ee'); g.addColorStop(1, '#4a5361');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-s * 0.36 + k * 0.02 * s, cy - s * 0.3 + k * s * 0.25); ctx.lineTo(s * 0.36 - k * 0.02 * s, cy - s * 0.3 + k * s * 0.25); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke(); }
  rr(ctx, -s * 0.42, cy - s * 0.18, s * 0.84, s * 0.4, 4); ctx.fillStyle = LARANJA; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
  texto(ctx, 'x2', 0, cy + s * 0.03, s * 0.36, '#ffffff', { contorno: TINTA, espessura: 3 });
}

// ------------------------------------------------------------ cenario

function cano(ctx, x0, y0, x1, y1, cor, esp) {
  ctx.strokeStyle = escurecer(cor, 0.45); ctx.lineWidth = esp + 3; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = cor; ctx.lineWidth = esp; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = esp * 0.25;
  const dx = x1 - x0, dy = y1 - y0, L0 = Math.hypot(dx, dy) || 1;
  const ox = (-dy / L0) * esp * 0.22, oy = (dx / L0) * esp * 0.22;
  ctx.beginPath(); ctx.moveTo(x0 + ox, y0 + oy); ctx.lineTo(x1 + ox, y1 + oy); ctx.stroke();
}

function manometro(ctx, x, y, R, ang) {
  circulo(ctx, x, y, R); ctx.fillStyle = '#c9a24a'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
  circulo(ctx, x, y, R * 0.8); ctx.fillStyle = '#f4f1e6'; ctx.fill();
  ctx.strokeStyle = '#e8483b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R * 0.62, -0.2, 0.6); ctx.stroke();
  ctx.strokeStyle = TINTA; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * R * 0.65, y + Math.sin(ang) * R * 0.65); ctx.stroke();
  circulo(ctx, x, y, R * 0.12); ctx.fillStyle = TINTA; ctx.fill();
}

const CHAO = { y: 0 };

const tema = {
  id: 'robos',
  nome: 'Fábrica de Robôs',
  cores: { texto: '#ffffff', destaque: ALERTA, particulas: [ALERTA, LARANJA, CIANO, '#ffffff'] },
  faixas: () => ({ topo: 98, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.8, filaFator: 1.0, colar: true }),

  fundo(ctx, W, H, L) {
    const chao = L.chao;
    CHAO.y = chao;
    // parede de chapas
    const g = ctx.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, '#2a3340'); g.addColorStop(1, '#46525f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, chao);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    for (let y = 40; y < chao; y += 56) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = 0; x < W; x += 72) for (let y = 40; y < chao; y += 56) {
      ctx.beginPath(); ctx.moveTo(x + ((y / 56) % 2) * 36, y); ctx.lineTo(x + ((y / 56) % 2) * 36, y + 56); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; circulo(ctx, x + 6, y + 6, 1.5); ctx.fill();
    }
    // janelas altas com luz quente
    for (let k = 0; k < 3; k++) {
      const jx = W * (0.18 + k * 0.32) - 26, jy = L.topo + 30;
      rr(ctx, jx, jy, 52, 70, 4); ctx.fillStyle = '#ffcf7a'; ctx.fill();
      ctx.fillStyle = 'rgba(255,170,90,0.5)'; ctx.fillRect(jx, jy + 35, 52, 35);
      ctx.strokeStyle = '#1d2128'; ctx.lineWidth = 3; ctx.strokeRect(jx, jy, 52, 70);
      ctx.beginPath(); ctx.moveTo(jx + 26, jy); ctx.lineTo(jx + 26, jy + 70); ctx.moveTo(jx, jy + 35); ctx.lineTo(jx + 52, jy + 35); ctx.stroke();
      ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.moveTo(jx, jy + 70); ctx.lineTo(jx + 52, jy + 70); ctx.lineTo(jx + 110, chao); ctx.lineTo(jx + 20, chao); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // canos
    const yC = L.topo + 118;
    cano(ctx, 0, yC, W, yC, LARANJA, 10);
    cano(ctx, 0, yC + 22, W * 0.6, yC + 22, '#2bb3a3', 7);
    cano(ctx, W * 0.6, yC + 22, W * 0.6, chao - 60, '#2bb3a3', 7);
    cano(ctx, W * 0.92, yC, W * 0.92, chao - 40, LARANJA, 10);
    for (const x of [W * 0.25, W * 0.7]) { rr(ctx, x - 6, yC - 8, 12, 16, 2); ctx.fillStyle = '#c9a24a'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke(); }
    manometro(ctx, W * 0.6, chao - 70, 13, 0.4);
    manometro(ctx, W * 0.92, chao - 52, 11, -0.8);
    // chao com faixa de alerta e concreto
    listras(ctx, 0, chao, W, 10);
    ctx.fillStyle = '#1d1d22'; ctx.fillRect(0, chao + 10, W, 2);
    const gc = ctx.createLinearGradient(0, chao + 12, 0, H);
    gc.addColorStop(0, '#5a6470'); gc.addColorStop(1, '#3a424c');
    ctx.fillStyle = gc; ctx.fillRect(0, chao + 12, W, H - chao - 12);
    const rnd = semente(3);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (let y = chao + 50; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; elipse(ctx, rnd() * W, chao + 20 + rnd() * (H - chao), 2 + rnd() * 6, 1 + rnd() * 2); ctx.fill(); }
    // abaixo da fila: caixotes e tambor de oleo
    const yb = L.fila.vertical ? H + 100 : L.fila.y + L.fila.h + 70;
    if (yb < H - 30) {
      const caixa = (x, y, s) => {
        rr(ctx, x, y - s, s, s, 3); ctx.fillStyle = '#b07a3a'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.moveTo(x + s, y - s); ctx.lineTo(x, y); ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.stroke();
      };
      caixa(14, Math.min(H - 10, yb + 50), 40); caixa(58, Math.min(H - 10, yb + 50), 30); caixa(26, Math.min(H - 10, yb + 50) - 40, 26);
      const tx = W - 54, ty = Math.min(H - 10, yb + 50);
      rr(ctx, tx, ty - 50, 34, 50, 4); ctx.fillStyle = '#2bb3a3'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
      for (const yy of [ty - 38, ty - 14]) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(tx, yy, 34, 3); }
      circulo(ctx, tx + 17, ty - 26, 6); ctx.fillStyle = ALERTA; ctx.fill(); ctx.stroke();
    }
  },

  vivo(ctx, W, H, t) {
    const chao = CHAO.y || H * 0.7;
    // engrenagens grandes ao fundo, girando
    ctx.save(); ctx.globalAlpha = 0.35;
    engrenagem(ctx, W * 0.08, chao - 150, 46, 12, '#5a6675', t * 0.25);
    engrenagem(ctx, W * 0.08 + 66, chao - 112, 26, 8, '#5a6675', -t * 0.45);
    engrenagem(ctx, W * 0.86, chao - 200, 34, 10, '#5a6675', -t * 0.3);
    ctx.restore();
    // vapor saindo dos canos
    for (const [vx, vy, fase] of [[W * 0.25, 216, 0], [W * 0.7, 216, 0.5]]) {
      for (let k = 0; k < 4; k++) {
        const u = (t * 0.5 + fase + k * 0.25) % 1;
        ctx.fillStyle = `rgba(230,236,242,${0.45 * (1 - u)})`;
        circulo(ctx, vx + Math.sin(t * 2 + k) * 6 + u * 10, vy - 14 - u * 50, 5 + u * 12); ctx.fill();
      }
    }
    // giroflex de alerta nos cantos
    for (const [gx, sg] of [[18, 1], [W - 18, -1]]) {
      const gy = 108;
      const a = t * 4 * sg;
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#ffb21f';
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.arc(gx, gy, 120, a - 0.25, a + 0.25); ctx.closePath(); ctx.fill();
      ctx.restore();
      rr(ctx, gx - 8, gy - 6, 16, 14, 4); ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ffb21f' : '#c97a10'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
    }
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      const a = L.coluna(c), s = L.carta(c, 0);
      const cheia = e.colunas[c].length >= L.pilhaMax;
      // plataforma de acoplamento
      rr(ctx, a.x - 6, L.chao - 6, a.w + 12, 10, 3); ctx.fillStyle = '#3a424c'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
      for (let k = 0; k < 3; k++) { circulo(ctx, a.x + a.w / 2 + (k - 1) * 12, L.chao - 1, 2.2); ctx.fillStyle = cheia ? '#ff4a3d' : '#5ee05a'; ctx.fill(); }
      // trilhos laterais
      ctx.fillStyle = 'rgba(20,24,30,0.35)';
      ctx.fillRect(a.x - 5, a.y, 3, a.h); ctx.fillRect(a.x + a.w + 2, a.y, 3, a.h);
      if (!e.colunas[c].length) {
        rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 6);
        ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(41,211,255,0.55)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        texto(ctx, 'DOCK', s.x + s.w / 2, s.y + s.h / 2, 11, 'rgba(41,211,255,0.7)');
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return sucata(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return chave(ctx, r, op);
    if (carta.tipo === 'bomba') return pulso(ctx, r, op);
    if (carta.tipo === 'dobro') return turbo(ctx, r, op);
    modulo(ctx, carta, r, op);
    if (carta.gelo) nitrogenio(ctx, r, op.t || 0);
  },

  cadeado(ctx, a, c, e, t) {
    // porta blindada com scanner
    const x0 = a.x - 4, w = a.w + 8, y0 = a.y + 6, h = a.h - 6;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, '#4a5361'); g.addColorStop(0.4, '#8a96a3'); g.addColorStop(1, '#3a424c');
    rr(ctx, x0, y0, w, h, 6); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x0 + w / 2, y0 + 4); ctx.lineTo(x0 + w / 2, y0 + h - 4); ctx.stroke();
    for (let y = y0 + 10; y < y0 + h - 6; y += 22) for (const x of [x0 + 6, x0 + w - 6]) { circulo(ctx, x, y, 1.8); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); }
    listras(ctx, x0 + 3, y0 + h * 0.18, w - 6, 9);
    listras(ctx, x0 + 3, y0 + h * 0.82, w - 6, 9);
    // scanner
    const sy = y0 + h * 0.5;
    rr(ctx, x0 + w * 0.16, sy - 16, w * 0.68, 32, 5); ctx.fillStyle = '#14181d'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
    const u = (Math.sin(t * 3) + 1) / 2;
    ctx.save(); ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x0 + w * 0.2, sy - 12 + u * 24, w * 0.6, 2);
    ctx.restore();
    texto(ctx, 'BLOQ.', x0 + w / 2, sy, 10, '#ff8a80');
  },

  descarte(ctx, r, e, t) {
    // reciclador de sucata
    const carga = e.descarteCarga > 0;
    const cx = r.x + r.w / 2, base = r.y + r.h;
    const w = r.w * 0.96, h = r.h * 0.98;
    rr(ctx, cx - w / 2, base - h, w, h, 5);
    const g = ctx.createLinearGradient(0, base - h, 0, base);
    g.addColorStop(0, '#6fc23a'); g.addColorStop(1, '#3f7f1f');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
    rr(ctx, cx - w * 0.38, base - h + 5, w * 0.76, h * 0.34, 3); ctx.fillStyle = '#14181d'; ctx.fill();
    ctx.strokeStyle = '#3a424c'; ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) { const x = cx - w * 0.38 + (k * w * 0.76) / 4; ctx.beginPath(); ctx.moveTo(x, base - h + 6); ctx.lineTo(x, base - h + 4 + h * 0.34); ctx.stroke(); }
    // simbolo de reciclagem simplificado
    ctx.save(); ctx.translate(cx, base - h * 0.32);
    for (let k = 0; k < 3; k++) {
      ctx.rotate(TAU / 3);
      ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(5, -6); ctx.lineTo(8, -2); ctx.strokeStyle = '#eaffdf'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    circulo(ctx, cx + w * 0.36, base - h * 0.14, 3); ctx.fillStyle = carga ? '#5ee05a' : (Math.sin(t * 6) > 0 ? '#ff4a3d' : '#5a1e1a'); ctx.fill();
    rr(ctx, cx - 24, r.y - 28, 48, 15, 3); ctx.fillStyle = carga ? ALERTA : '#8a7a40'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = TINTA; ctx.stroke();
    texto(ctx, carga ? 'SUCATA' : 'CHEIO', cx, r.y - 20, 9.5, TINTA);
  },

  fila(ctx, L, e, t) {
    const f = L.fila;
    if (f.vertical) {
      // trilho vertical com ganchos
      const x = f.x + f.w / 2;
      ctx.fillStyle = '#3a424c'; ctx.fillRect(x - 5, f.y - 14, 10, f.h + 14);
      ctx.strokeStyle = TINTA; ctx.lineWidth = 1.6; ctx.strokeRect(x - 5, f.y - 14, 10, f.h + 14);
      for (let y = f.y; y < f.y + f.h; y += 16) { ctx.fillStyle = ALERTA; ctx.fillRect(x - 5, y, 10, 6); }
      rr(ctx, f.x + 2, f.y - 30, f.w - 4, 18, 4); ctx.fillStyle = '#2b313a'; ctx.fill(); ctx.stroke();
      texto(ctx, 'PRÓXIMOS', f.x + f.w / 2, f.y - 21, 10, CIANO);
      return;
    }
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, p2.x) - 30, x1 = Math.max(p0.x + p0.w, p2.x + p2.w) + 30;
    const yt = Math.min(p0.y, p2.y) - 26;
    // portico: dois pilares e a viga
    for (const x of [x0, x1 - 12]) { rr(ctx, x, yt, 12, p0.y + p0.h + 14 - yt, 2); ctx.fillStyle = '#ff7a1a'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke(); }
    rr(ctx, x0 - 4, yt - 6, x1 - x0 + 8, 12, 3); ctx.fillStyle = '#ff7a1a'; ctx.fill(); ctx.stroke();
    listras(ctx, x0, yt - 3, x1 - x0, 6);
    // ganchos dos modulos de tras
    for (let k = 1; k < L.tamFila; k++) {
      const p = L.filaPos(k);
      ctx.strokeStyle = '#9aa6b2'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x + p.w / 2, yt + 6); ctx.lineTo(p.x + p.w / 2, p.y - 2); ctx.stroke();
    }
    // carrinho da garra sobre a peca da frente
    const cx = p0.x + p0.w / 2;
    rr(ctx, cx - 16, yt - 2, 32, 12, 3); ctx.fillStyle = '#3a424c'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
    circulo(ctx, cx + 10, yt + 4, 2); ctx.fillStyle = Math.sin(t * 6) > 0 ? '#5ee05a' : '#2a5a2a'; ctx.fill();
    ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, yt + 10); ctx.lineTo(cx, p0.y - 8); ctx.stroke();
    // chao da baia
    rr(ctx, x0 + 12, p0.y + p0.h + 6, x1 - x0 - 24, 8, 2); ctx.fillStyle = '#2b313a'; ctx.fill();
    texto(ctx, 'próximo ▸', x0 + 38, yt - 16, 12, CIANO, { contorno: TINTA, espessura: 3 });
  },

  frente(ctx, L, e) {
    // dedos da garra presos na peca da frente (em retrato)
    if (L.fila.vertical || !e.fila.length) return;
    const p0 = L.filaPos(0), cx = p0.x + p0.w / 2;
    ctx.lineCap = 'round';
    for (const sg of [-1, 1]) {
      ctx.strokeStyle = TINTA; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx, p0.y - 8); ctx.lineTo(cx + sg * p0.w * 0.3, p0.y - 2); ctx.lineTo(cx + sg * p0.w * 0.34, p0.y + 8); ctx.stroke();
      ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 3; ctx.stroke();
    }
    circulo(ctx, cx, p0.y - 8, 4.5); ctx.fillStyle = LARANJA; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
  },

  hud(ctx, W, H, L, e, t, mem) {
    mem.W = W;
    const x = 10, y = 10, w = W - 20, h = 78;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 10);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#5a6470'); g.addColorStop(1, '#353d47');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, h, 10); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    rebites(ctx, x + 2, y + 2, w - 4, h - 4);
    listras(ctx, x + 10, y + h - 9, w - 20, 5);
    // tela da linha
    rr(ctx, x + 12, y + 10, 50, 52, 6); ctx.fillStyle = '#0d1116'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
    texto(ctx, 'LINHA', x + 37, y + 20, 9, '#7dff6a');
    visor(ctx, String(e.faseId), x + 37, y + 42, 22, 40, '#7dff6a');
    // metas com barras de LED segmentadas
    const mx = x + 72, mw = w - 72 - 104;
    e.metas.forEach((m, k) => {
      const yy = y + 11 + k * 26;
      texto(ctx, textoMeta(m, { monte: (n) => `Monte ${n} robô${n > 1 ? 's' : ''} gigante${n > 1 ? 's' : ''}` }), mx, yy + 5, 11.5, '#eef2f6', { alinhar: 'left', max: mw });
      const segs = 14, sw = (mw - (segs - 1) * 2) / segs;
      const cheio = Math.round(segs * Math.min(1, m.atual / m.alvo));
      for (let i = 0; i < segs; i++) {
        rr(ctx, mx + i * (sw + 2), yy + 12, sw, 7, 1.5);
        ctx.fillStyle = i < cheio ? (m.feita ? '#7dff6a' : CIANO) : '#1a2028'; ctx.fill();
      }
    });
    // pontos em display
    const dx = x + w - 98;
    rr(ctx, dx, y + 12, 86, 44, 6); ctx.fillStyle = '#0d1116'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
    texto(ctx, 'PONTOS', dx + 43, y + 20, 8.5, ALERTA);
    visor(ctx, String(e.pontos), dx + 43, y + 39, 20, 76, ALERTA);
    if (e.febre) {
      const k = Math.sin(t * 12) > 0;
      rr(ctx, W / 2 - 66, y + h + 6, 132, 26, 6); ctx.fillStyle = k ? '#ff7a1a' : '#a8460a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
      texto(ctx, 'TURBO x2', W / 2, y + h + 19.5, 16, '#ffffff', { contorno: TINTA, espessura: 3 });
    }
  },

  efeito(fx, P, mem) {
    registrarFormas(P);
    const tx = dentro(fx.x, mem);
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 20, [LARANJA, ALERTA], 7, 0.5, { g: 500, vida: 0.35, tam: 3, forma: 'c' });
        return true;
      case 'fusao':
        P.estourar(fx.x, fx.y, [ALERTA, '#ffffff', LARANJA], 14 + fx.degrau * 5, 1.2 + fx.degrau * 0.1, { g: 620, vida: 0.45, tam: 3, forma: 'c' });
        P.estourar(fx.x, fx.y, ['#c9d2dc', '#9aa6b2'], 3 + fx.degrau, 0.8, { forma: 'engrenagem', tam: 11, g: 420, vida: 0.8 });
        P.anel(fx.x, fx.y, CIANO, 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(tx, fx.y - 24, 'x' + fx.degrau, CIANO, 22 + fx.degrau * 2, TINTA);
        return true;
      case 'completar':
        for (let k = 0; k < 18; k++) P.add({ forma: 'c', x: fx.x + (k % 3 - 1) * 8, y: fx.y + 18, vx: (k % 5 - 2) * 18, vy: 160 + (k % 4) * 50, g: 0, vida: 0.5 + (k % 3) * 0.12, tam: 9, cor: k % 2 ? LARANJA : ALERTA });
        P.subir(fx.x, fx.y + 20, ['rgba(220,226,232,0.8)', 'rgba(180,188,196,0.8)'], 10, { tam: 18, vida: 1, larg: 40, forca: 0.5 });
        P.estourar(fx.x, fx.y, [CIANO, '#ffffff', ALERTA], 26, 1.4, { forma: 'estrela', tam: 10 });
        P.texto(tx, fx.y - 34, 'Decolou!', ALERTA, 30, TINTA);
        return true;
      case 'explodir':
        P.anel(fx.x, fx.y, CIANO, 60, 0.45);
        P.anel(fx.x, fx.y, '#e6fbff', 36, 0.3);
        P.estourar(fx.x, fx.y, [CIANO, '#e6fbff', '#1a6fc9'], 22, 1.3, { forma: 'arco', tam: 14, g: 0, vida: 0.4 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#9aa6b2', '#c9d2dc'], 8, 1.1, { forma: 'parafuso', tam: 11, g: 520, vida: 0.8 });
        P.estourar(fx.x, fx.y, ['#b0683a', '#5e3a24'], 12, 1, { forma: 'q', tam: 6 });
        return true;
      case 'racha': P.estourar(fx.x, fx.y, ['#9aa6b2', '#b0683a'], 5, 0.6, { forma: 'parafuso', tam: 8, g: 500 }); return true;
      case 'gelo':
        P.subir(fx.x, fx.y, ['rgba(230,245,255,0.8)', 'rgba(190,230,255,0.8)'], 8, { tam: 16, vida: 0.9, larg: 40 });
        P.estourar(fx.x, fx.y, ['#dff6ff', '#9fdcff', '#ffffff'], 14, 0.8, { forma: 'q', tam: 6, g: 240 });
        P.texto(tx, fx.y - 22, 'Descongelou!', '#dff6ff', 17, '#0b3a6a');
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#7dff6a', '#ffffff', '#9aa6b2'], 18, 1, { forma: 'q', tam: 6 });
        P.texto(tx, fx.y - 24, 'Acesso liberado!', '#7dff6a', 18, TINTA);
        return true;
      case 'combo': P.texto(tx, fx.y - 44, `COMBO x${fx.n}`, CIANO, 22, TINTA); return true;
      default: return false;
    }
  },
};

/** x do texto flutuante preso dentro da tela (textos largos perto da borda). */
function dentro(x, mem) {
  const W = (mem && mem.W) || 390;
  return Math.max(70, Math.min(W - 70, x));
}

/** Formas de particula do tema. */
function registrarFormas(P) {
  if (P.formas.engrenagem) return;
  P.formas.engrenagem = (ctx, p) => {
    const R = p.tam / 2;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = i % 2 ? R * 0.75 : R; ctx.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = CHUMBO; circulo(ctx, 0, 0, R * 0.3); ctx.fill();
  };
  P.formas.parafuso = (ctx, p) => {
    const s = p.tam;
    ctx.fillRect(-s * 0.3, -s * 0.5, s * 0.6, s * 0.2);
    ctx.fillRect(-s * 0.1, -s * 0.3, s * 0.2, s * 0.8);
  };
  P.formas.arco = (ctx, p) => {
    ctx.strokeStyle = p.cor; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-p.tam / 2, 0); ctx.lineTo(-p.tam / 6, -p.tam / 4); ctx.lineTo(p.tam / 6, p.tam / 4); ctx.lineTo(p.tam / 2, 0); ctx.stroke();
  };
}

void elipse; void ACO;

export default tema;
