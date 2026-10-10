// Ideia 9: Templo do Olimpo. As colunas do jogo sao colunas gregas de verdade:
// cada carta e um tambor de marmore, a coluna afina ate o capitel e o 2048 e a
// coroa de louros dourada que sobe ao Olimpo. Pedra = pedra bruta, gelo = hera,
// cadeado = portao de bronze, coringa = ambrosia, bomba = raio de Zeus,
// dobro = asas de Hermes.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const TINTA = '#3b3552';
const OURO = '#e8b84a', OURO_E = '#a8761e', OURO_C = '#fff0b8';
const LAPIS = '#2c4a9a', OLIVA = '#7a8f3a', BRONZE = '#b07a3a';

/** Material do tambor por nivel (2..4096). */
const MAT = [
  { cor: '#f5f1e8' },                                  // 2 marmore branco
  { cor: '#f3e3c3' },                                  // 4 creme
  { cor: '#e6ecf5', veio: '#aab9d0' },                 // 8 marmore azulado
  { cor: '#f4d6d0', veio: '#cf928a' },                 // 16 rosado
  { cor: '#d4e8cf', veio: '#86ad80' },                 // 32 verde
  { cor: '#ecc0cc', veio: '#b0738a' },                 // 64 rosa
  { cor: '#f5f1e8', faixas: 1 },                       // 128 branco com ouro
  { cor: '#f3e3c3', faixas: 2 },                       // 256 creme com ouro
  { cor: '#dfe6f5', faixas: 2, meandro: true },        // 512 com grega
  { cor: '#f0c75a', ouro: true },                      // 1024 ouro macico
  { cor: '#f0c75a', ouro: true, capitel: true },       // 2048 capitel com louros
  { cor: '#bfe6ff', cristal: true },                   // 4096 cristal celeste
];

// ------------------------------------------------------------ ornamentos

/** Grega (meandro) numa faixa horizontal. */
function meandro(ctx, x, y, w, h, cor) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = cor; ctx.lineWidth = Math.max(1, h * 0.16); ctx.lineJoin = 'miter';
  const u = h;
  for (let ux = x; ux < x + w; ux += u) {
    ctx.beginPath();
    ctx.moveTo(ux, y + h * 0.9);
    ctx.lineTo(ux, y + h * 0.12);
    ctx.lineTo(ux + u * 0.78, y + h * 0.12);
    ctx.lineTo(ux + u * 0.78, y + h * 0.66);
    ctx.lineTo(ux + u * 0.36, y + h * 0.66);
    ctx.lineTo(ux + u * 0.36, y + h * 0.4);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ux, y + h * 0.9); ctx.lineTo(ux + u, y + h * 0.9); ctx.stroke();
  }
  ctx.restore();
}

/** Coroa de louros (aberta em cima) centrada em (cx, cy), raio R. */
function louros(ctx, cx, cy, R, cor = OLIVA, borda = TINTA) {
  ctx.save();
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + s * (0.25 + i * 0.36);
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + (s > 0 ? -0.9 : 0.9) + Math.PI / 2);
      elipse(ctx, 0, 0, R * 0.16, R * 0.32);
      ctx.fillStyle = i % 2 ? cor : clarear(cor, 0.18); ctx.fill();
      ctx.lineWidth = Math.max(0.8, R * 0.04); ctx.strokeStyle = borda; ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Faixa de ouro horizontal no tambor. */
function faixaOuro(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, OURO_C); g.addColorStop(0.5, OURO); g.addColorStop(1, OURO_E);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

/** Aro (astragalo) do tambor: faixa arredondada um pouco mais larga. */
function aro(ctx, x, y, w, h, cor) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, escurecer(cor, 0.3)); g.addColorStop(0.3, clarear(cor, 0.4)); g.addColorStop(1, escurecer(cor, 0.35));
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1.3; ctx.strokeStyle = TINTA; ctx.stroke();
}

/** Placa com o numero (lapis-lazuli com digitos de ouro; marmore com lapis nos tambores de ouro). */
function placa(ctx, v, cx, cy, maxW, maxH, claro) {
  const dig = String(v).length;
  const tam = Math.max(11, Math.min(maxH * 0.6, 22, (maxW - 4) / (dig * 0.6 + 0.75)));
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const tw = Math.min(maxW, ctx.measureText(String(v)).width + tam * 0.8);
  const th = tam * 1.18;
  rr(ctx, cx - tw / 2, cy - th / 2, tw, th, tam * 0.22);
  ctx.fillStyle = claro ? '#fbf8f1' : LAPIS; ctx.fill();
  ctx.lineWidth = 1.8; ctx.strokeStyle = claro ? LAPIS : OURO; ctx.stroke();
  rr(ctx, cx - tw / 2 + 2.5, cy - th / 2 + 2.5, tw - 5, th - 5, tam * 0.16);
  ctx.lineWidth = 0.8; ctx.strokeStyle = claro ? rgba(LAPIS, 0.4) : rgba(OURO, 0.55); ctx.stroke();
  texto(ctx, String(v), cx, cy + 0.5, tam, claro ? LAPIS : '#ffe08a', { contorno: claro ? 'rgba(255,255,255,0.6)' : '#152754', espessura: Math.max(2, tam * 0.16), max: tw - 6 });
}

// ------------------------------------------------------------ pecas

/** Medidas do tambor do valor v dentro de r. */
function medidas(v, r) {
  const n = nivel(v);
  const M = MAT[Math.min(n, MAT.length - 1)];
  const pw = r.w * (0.68 + 0.32 * Math.min(1, n / 10));
  const ph = r.h - 2;
  const y0 = r.y + 1;
  const aroH = Math.max(3.5, ph * 0.1);
  const cy0 = y0 + aroH * 0.7, ch = ph - aroH * 1.4;
  return { n, M, pw, ph, x0: -pw / 2, y0, aroH, cy0, ch, pcy: cy0 + ch * (M.meandro ? 0.62 : 0.52), pmaxW: pw * 0.86, pmaxH: ch * (M.meandro ? 0.6 : 0.7) };
}

/** Tambor de coluna do valor v, centrado em r. */
function tambor(ctx, carta, r, op) {
  const v = carta.v;
  const { n, M, pw, ph, x0, y0, aroH, cy0, ch } = medidas(v, r);
  const base = M.cor;
  // sombra no chao/tambor de baixo
  elipse(ctx, 0, y0 + ph - 1, pw * 0.52, Math.max(2, ph * 0.05)); ctx.fillStyle = 'rgba(40,30,70,0.22)'; ctx.fill();
  // corpo cilindrico
  const g = ctx.createLinearGradient(x0, 0, x0 + pw, 0);
  if (M.cristal) {
    const k = 0.5 + 0.5 * Math.sin((op.t || 0) * 2.5);
    g.addColorStop(0, '#6aa6e8'); g.addColorStop(0.3, '#f4fbff'); g.addColorStop(0.5 + k * 0.1, '#bfe6ff'); g.addColorStop(1, '#5b7fd6');
  } else {
    g.addColorStop(0, escurecer(base, M.ouro ? 0.42 : 0.3));
    g.addColorStop(0.28, clarear(base, M.ouro ? 0.5 : 0.4));
    g.addColorStop(0.55, base);
    g.addColorStop(1, escurecer(base, M.ouro ? 0.45 : 0.36));
  }
  ctx.fillStyle = g; ctx.fillRect(x0 + 1, cy0, pw - 2, ch);
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 + 1, cy0, pw - 2, ch); ctx.clip();
  // veios do marmore
  if (M.veio) {
    const rnd = semente((carta.id || 3) * 17 + v);
    ctx.strokeStyle = rgba(M.veio, 0.7); ctx.lineWidth = 1.1;
    for (let k = 0; k < 2; k++) {
      let x = x0 + rnd() * pw, y = cy0;
      ctx.beginPath(); ctx.moveTo(x, y);
      while (y < cy0 + ch) { y += 5 + rnd() * 6; x += (rnd() - 0.5) * 10; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  // caneluras
  const nc = Math.max(4, Math.round(pw / 8.5));
  for (let i = 1; i < nc; i++) {
    const x = x0 + (i * pw) / nc;
    const borda = Math.abs(i / nc - 0.5) * 2;
    ctx.strokeStyle = rgba(escurecer(base, 0.55), 0.22 + borda * 0.18); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, cy0); ctx.lineTo(x, cy0 + ch); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(x + 1.3, cy0); ctx.lineTo(x + 1.3, cy0 + ch); ctx.stroke();
  }
  // faixas de ouro
  if (M.faixas) {
    const fh = Math.max(2.5, ch * 0.08);
    faixaOuro(ctx, x0, cy0 + ch * 0.08, pw, fh);
    if (M.faixas > 1) faixaOuro(ctx, x0, cy0 + ch * 0.92 - fh, pw, fh);
  }
  if (M.meandro) {
    ctx.fillStyle = LAPIS; ctx.fillRect(x0, cy0 + ch * 0.17, pw, Math.max(5, ch * 0.12));
    meandro(ctx, x0, cy0 + ch * 0.17, pw, Math.max(5, ch * 0.12), OURO);
  }
  // brilho do ouro e do cristal
  if (M.ouro || M.cristal) {
    const k = ((op.t || 0) * 0.6 + (carta.id || 0) * 0.13) % 1.6 - 0.3;
    const bx = x0 + pw * k;
    const gb = ctx.createLinearGradient(bx - 10, 0, bx + 10, 0);
    gb.addColorStop(0, 'rgba(255,255,255,0)'); gb.addColorStop(0.5, 'rgba(255,255,255,0.55)'); gb.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gb; ctx.fillRect(bx - 10, cy0, 20, ch);
  }
  ctx.restore();
  ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.strokeRect(x0 + 1, cy0, pw - 2, ch);
  // aros
  const corAro = M.ouro ? OURO : M.cristal ? '#dff3ff' : M.faixas ? clarear(base, 0.1) : base;
  aro(ctx, x0 - 2, y0, pw + 4, aroH, corAro);
  aro(ctx, x0 - 2.5, y0 + ph - aroH, pw + 5, aroH, corAro);
  if (M.capitel) {
    // volutas do capitel jonico
    for (const s of [-1, 1]) {
      const vx = s * (pw / 2 + 1), vy = y0 + aroH * 0.6;
      circulo(ctx, vx, vy, aroH * 1.05); ctx.fillStyle = OURO; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.beginPath();
      for (let a = 0; a < TAU * 1.6; a += 0.3) { const rr0 = aroH * 0.9 * (1 - a / (TAU * 1.9)); ctx.lineTo(vx + Math.cos(a * s) * rr0, vy + Math.sin(a * s) * rr0); }
      ctx.strokeStyle = OURO_E; ctx.lineWidth = 1.1; ctx.stroke();
    }
  }
  // numero
  const md = medidas(v, r);
  if (M.capitel) louros(ctx, 0, md.pcy, Math.min(ch * 0.42, pw * 0.42), OLIVA);
  placa(ctx, v, 0, md.pcy, md.pmaxW, md.pmaxH, M.ouro || M.cristal);
  if (op.destaque) {
    rr(ctx, x0 - 4, y0 - 2, pw + 8, ph + 4, 6);
    ctx.strokeStyle = `rgba(255,236,160,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

/** Hera enrolada no tambor (o gelo deste tema). */
function hera(ctx, r) {
  const x0 = r.x + 2, w = r.w - 4, y0 = r.y + 2, h = r.h - 4;
  ctx.save();
  ctx.fillStyle = 'rgba(80,110,40,0.18)'; rr(ctx, x0, y0, w, h, 4); ctx.fill();
  ctx.strokeStyle = '#4f6b22'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  const cipo = (k) => {
    ctx.beginPath();
    ctx.moveTo(x0 + w * (k ? 1 : 0), y0 + h * 0.15);
    ctx.bezierCurveTo(x0 + w * 0.5, y0 + h * (k ? 0.1 : 0.55), x0 + w * 0.5, y0 + h * (k ? 0.9 : 0.4), x0 + w * (k ? 0 : 1), y0 + h * 0.85);
    ctx.stroke();
  };
  cipo(0); cipo(1);
  const folha = (x, y, a, s) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s, -s * 0.9, s * 0.9, s * 0.3, 0, s); ctx.bezierCurveTo(-s * 0.9, s * 0.3, -s, -s * 0.9, 0, -s); ctx.closePath();
    ctx.fillStyle = '#6f9a2e'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#33480f'; ctx.stroke();
    ctx.strokeStyle = 'rgba(220,255,170,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -s * 0.7); ctx.lineTo(0, s * 0.7); ctx.stroke();
    ctx.restore();
  };
  const s = Math.max(4, Math.min(w, h) * 0.11);
  const pts = [[0.12, 0.2, -0.6], [0.32, 0.36, 0.5], [0.7, 0.3, -0.3], [0.88, 0.22, 0.8], [0.25, 0.7, 2.4], [0.5, 0.52, 1.2], [0.78, 0.72, -2.2], [0.1, 0.82, 0.3], [0.92, 0.84, -0.4]];
  for (const [px, py, a] of pts) folha(x0 + w * px, y0 + h * py, a, s);
  ctx.restore();
}

/** Pedra bruta (com rachaduras pelo hp perdido e pips de louro). */
function pedraBruta(ctx, r, hp) {
  const w = r.w * 0.92, h = r.h - 4, y0 = r.y + 2;
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, y0 + h);
    ctx.lineTo(-w * 0.52, y0 + h * 0.35); ctx.lineTo(-w * 0.3, y0 + h * 0.06); ctx.lineTo(w * 0.05, y0);
    ctx.lineTo(w * 0.38, y0 + h * 0.1); ctx.lineTo(w * 0.52, y0 + h * 0.45); ctx.lineTo(w * 0.5, y0 + h);
    ctx.closePath();
  };
  forma();
  const g = ctx.createLinearGradient(-w / 2, y0, w / 2, y0 + h);
  g.addColorStop(0, '#d8cfbd'); g.addColorStop(1, '#8f8572');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); forma(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.moveTo(-w * 0.3, y0 + h * 0.06); ctx.lineTo(w * 0.05, y0); ctx.lineTo(w * 0.38, y0 + h * 0.1); ctx.lineTo(w * 0.05, y0 + h * 0.3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(-w, y0 + h * 0.75, w * 2, h);
  ctx.restore();
  forma(); ctx.lineWidth = 1.8; ctx.strokeStyle = TINTA; ctx.stroke();
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  ctx.strokeStyle = '#3e3626'; ctx.lineWidth = 1.7; ctx.lineJoin = 'round';
  const rach = [[-0.25, 0.2, -0.08, 0.45, -0.2, 0.72], [0.22, 0.15, 0.08, 0.42, 0.25, 0.66], [0, 0.08, 0.06, 0.3, -0.04, 0.5]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, y0 + c[1] * h); ctx.lineTo(c[2] * w, y0 + c[3] * h); ctx.lineTo(c[4] * w, y0 + c[5] * h); ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    const px = (k - 1) * 11, py = y0 + h * 0.84;
    estrela(ctx, px, py, 4.6, 2, 5); ctx.fillStyle = k < hp ? OURO : 'rgba(40,30,20,0.35)'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = TINTA; ctx.stroke();
  }
}

/** Taca de ambrosia (coringa). */
function ambrosia(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.42, r.w * 0.36), cy = r.y + r.h * 0.46;
  const halo = ctx.createRadialGradient(0, cy, 2, 0, cy, s * 1.5);
  halo.addColorStop(0, 'rgba(255,240,180,0.85)'); halo.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = halo; circulo(ctx, 0, cy, s * 1.5); ctx.fill();
  // base e haste
  elipse(ctx, 0, cy + s * 0.95, s * 0.55, s * 0.16); ctx.fillStyle = OURO_E; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
  rr(ctx, -s * 0.1, cy + s * 0.3, s * 0.2, s * 0.62, 2); ctx.fillStyle = OURO; ctx.fill(); ctx.stroke();
  circulo(ctx, 0, cy + s * 0.5, s * 0.15); ctx.fillStyle = OURO_C; ctx.fill(); ctx.stroke();
  // taca
  ctx.beginPath(); ctx.moveTo(-s * 0.8, cy - s * 0.45); ctx.quadraticCurveTo(-s * 0.75, cy + s * 0.38, 0, cy + s * 0.38); ctx.quadraticCurveTo(s * 0.75, cy + s * 0.38, s * 0.8, cy - s * 0.45); ctx.closePath();
  const g = ctx.createLinearGradient(-s, 0, s, 0);
  g.addColorStop(0, OURO_E); g.addColorStop(0.35, OURO_C); g.addColorStop(1, OURO_E);
  ctx.fillStyle = g; ctx.fill(); ctx.stroke();
  // nectar
  elipse(ctx, 0, cy - s * 0.45, s * 0.8, s * 0.2); ctx.fillStyle = '#ffb3d1'; ctx.fill(); ctx.stroke();
  elipse(ctx, -s * 0.2, cy - s * 0.48, s * 0.3, s * 0.07); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
  for (let k = 0; k < 3; k++) {
    const a = t * 2 + k * 2.1;
    estrela(ctx, Math.cos(a) * s * 0.95, cy - s * 0.6 + Math.sin(a * 1.3) * s * 0.35, 3.5 + Math.sin(t * 6 + k) * 1.2, 1.4, 4);
    ctx.fillStyle = '#fffbe0'; ctx.fill();
  }
}

/** Raio de Zeus (bomba). */
function raioZeus(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.46, r.w * 0.4), cy = r.y + r.h * 0.5;
  // nuvem
  ctx.fillStyle = '#6f7894';
  for (const [dx, dy, rr0] of [[-0.45, -0.55, 0.35], [0, -0.7, 0.45], [0.45, -0.55, 0.35], [0, -0.45, 0.4]]) { circulo(ctx, dx * s, cy + dy * s, rr0 * s); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; circulo(ctx, -s * 0.1, cy - s * 0.85, s * 0.22); ctx.fill();
  const pisca = 0.7 + 0.3 * Math.abs(Math.sin(t * 14));
  ctx.save();
  ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 10 * pisca;
  ctx.beginPath();
  ctx.moveTo(s * 0.1, cy - s * 0.45); ctx.lineTo(-s * 0.32, cy + s * 0.12); ctx.lineTo(-s * 0.02, cy + s * 0.1);
  ctx.lineTo(-s * 0.24, cy + s * 0.8); ctx.lineTo(s * 0.34, cy - 0.02 * s); ctx.lineTo(s * 0.04, cy); ctx.lineTo(s * 0.28, cy - s * 0.45); ctx.closePath();
  ctx.fillStyle = '#ffe14a'; ctx.fill();
  ctx.restore();
  ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
}

/** Asas de Hermes com x2 (dobro). */
function asas(ctx, r, op) {
  const t = op.t || 0;
  const s = Math.min(r.h * 0.42, r.w * 0.3), cy = r.y + r.h * 0.5;
  const bate = Math.sin(t * 6) * 0.12;
  for (const lado of [-1, 1]) {
    ctx.save(); ctx.translate(lado * s * 0.45, cy); ctx.scale(lado, 1); ctx.rotate(-0.25 - bate);
    for (let i = 3; i >= 0; i--) {
      elipse(ctx, s * (0.35 + i * 0.22), -s * (0.1 + i * 0.12), s * (0.2 + i * 0.06), s * 0.12, -0.5 - i * 0.12);
      ctx.fillStyle = i % 2 ? '#ffffff' : '#eef3fb'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
    }
    ctx.restore();
  }
  circulo(ctx, 0, cy, s * 0.55); ctx.fillStyle = OURO; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
  texto(ctx, 'x2', 0, cy + 1, s * 0.62, '#fff', { contorno: OURO_E, espessura: 3 });
}

// ------------------------------------------------------------ cenario

function nuvem(ctx, x, y, s, cor = '#ffffff', sombra = 'rgba(160,150,200,0.35)') {
  ctx.fillStyle = sombra;
  for (const [dx, dy, r0] of [[-0.9, 0.2, 0.5], [-0.3, 0.05, 0.7], [0.4, 0.1, 0.62], [1.0, 0.25, 0.45]]) { circulo(ctx, x + dx * s, y + dy * s + s * 0.12, r0 * s); ctx.fill(); }
  ctx.fillStyle = cor;
  for (const [dx, dy, r0] of [[-0.9, 0.2, 0.5], [-0.3, 0.05, 0.7], [0.4, 0.1, 0.62], [1.0, 0.25, 0.45], [0, 0.3, 0.6]]) { circulo(ctx, x + dx * s, y + dy * s, r0 * s); ctx.fill(); }
}

/** Templo pequeno (silhueta com frontao). */
function templo(ctx, cx, by, w, cor) {
  const h = w * 0.5;
  ctx.fillStyle = cor;
  ctx.fillRect(cx - w / 2, by - h * 0.12, w, h * 0.12);
  ctx.fillRect(cx - w * 0.46, by - h * 0.2, w * 0.92, h * 0.08);
  const nc = 6;
  for (let i = 0; i < nc; i++) ctx.fillRect(cx - w * 0.42 + (i * w * 0.84) / (nc - 1) - w * 0.025, by - h * 0.8, w * 0.05, h * 0.6);
  ctx.fillRect(cx - w * 0.48, by - h * 0.9, w * 0.96, h * 0.12);
  ctx.beginPath(); ctx.moveTo(cx - w * 0.5, by - h * 0.9); ctx.lineTo(cx, by - h * 1.25); ctx.lineTo(cx + w * 0.5, by - h * 0.9); ctx.closePath(); ctx.fill();
}

const tema = {
  id: 'olimpo',
  nome: 'Templo do Olimpo',
  cores: { texto: TINTA, destaque: '#ffe08a', particulas: [OURO, OURO_C, '#ffffff', OLIVA] },
  faixas: () => ({ topo: 98, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.85, filaFator: 1.0, colar: true }),

  fundo(ctx, W, H, L) {
    const chao = L.chao;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6fb6f5'); g.addColorStop(0.45, '#8ec9ff'); g.addColorStop(0.75, '#ffd9b8'); g.addColorStop(1, '#ffc6a8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // raios de sol
    const sx = W * 0.82, sy = L.topo + 30;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#fff6d8';
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * 0.5 + (k - 4) * 0.17;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a - 0.04) * H, sy + Math.sin(a - 0.04) * H); ctx.lineTo(sx + Math.cos(a + 0.04) * H, sy + Math.sin(a + 0.04) * H);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    const gs = ctx.createRadialGradient(sx, sy, 6, sx, sy, 90);
    gs.addColorStop(0, 'rgba(255,250,220,1)'); gs.addColorStop(0.3, 'rgba(255,240,190,0.8)'); gs.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = gs; circulo(ctx, sx, sy, 90); ctx.fill();
    // montanha com o templo distante
    const mx = L.fila.vertical ? W * 0.15 : W * 0.3, mb = chao - 10, mh = Math.min(260, chao * 0.42);
    ctx.fillStyle = '#9fa9d6';
    ctx.beginPath(); ctx.moveTo(mx - mh * 1.3, mb); ctx.lineTo(mx - mh * 0.2, mb - mh); ctx.lineTo(mx + mh * 0.25, mb - mh * 0.92); ctx.lineTo(mx + mh * 1.4, mb); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eef0fb';
    ctx.beginPath(); ctx.moveTo(mx - mh * 0.42, mb - mh * 0.8); ctx.lineTo(mx - mh * 0.2, mb - mh); ctx.lineTo(mx + mh * 0.25, mb - mh * 0.92); ctx.lineTo(mx + mh * 0.38, mb - mh * 0.78); ctx.lineTo(mx + mh * 0.05, mb - mh * 0.84); ctx.lineTo(mx - mh * 0.15, mb - mh * 0.74); ctx.closePath(); ctx.fill();
    templo(ctx, mx, mb - mh * 0.93, Math.max(34, mh * 0.28), '#f7f2e6');
    // nuvens baixas atras do templo
    const rnd = semente(9);
    for (let i = 0; i < 7; i++) nuvem(ctx, rnd() * W, chao - 20 - rnd() * 60, 22 + rnd() * 16, '#fff7f2', 'rgba(200,170,200,0.35)');
    // mar de nuvens abaixo do estilobato
    for (let y = chao + 6; y < H + 40; y += 26) {
      for (let x = -20; x < W + 40; x += 44) {
        nuvem(ctx, x + (rnd() - 0.5) * 20 + ((y / 26) % 2) * 22, y + rnd() * 8, 20 + rnd() * 10, '#ffffff', 'rgba(210,170,200,0.45)');
      }
    }
    // abaixo da fila: arco-iris de Iris e ruinas boiando nas nuvens
    const yr = L.fila.vertical ? H : L.fila.y + L.fila.h + 60;
    if (yr < H - 60) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ['#ff8a8a', '#ffc36b', '#fff08a', '#9be38a', '#8ac8ff', '#b59cff'].forEach((c, k) => {
        ctx.beginPath(); ctx.arc(W * 0.5, H + 40, W * 0.62 - k * 7, Math.PI, 0); ctx.lineWidth = 7; ctx.strokeStyle = c; ctx.stroke();
      });
      ctx.restore();
      const ruina = (x, y, h) => {
        nuvem(ctx, x, y + 6, 18, '#ffffff', 'rgba(210,170,200,0.45)');
        const w = 18;
        rr(ctx, x - w / 2 - 3, y - 4, w + 6, 6, 2); ctx.fillStyle = '#ece4d2'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - w / 2, y - 4); ctx.lineTo(x - w / 2, y - h); ctx.lineTo(x - 2, y - h + 5); ctx.lineTo(x + 3, y - h - 3); ctx.lineTo(x + w / 2, y - h + 2); ctx.lineTo(x + w / 2, y - 4); ctx.closePath();
        const gc = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        gc.addColorStop(0, '#d9cfbb'); gc.addColorStop(0.35, '#fbf8f0'); gc.addColorStop(1, '#cfc4ad');
        ctx.fillStyle = gc; ctx.fill(); ctx.stroke();
        for (let k = 1; k < 4; k++) { ctx.strokeStyle = 'rgba(59,53,82,0.25)'; ctx.beginPath(); ctx.moveTo(x - w / 2 + (k * w) / 4, y - 5); ctx.lineTo(x - w / 2 + (k * w) / 4, y - h + 6); ctx.stroke(); }
      };
      ruina(W * 0.16, Math.min(H - 30, yr + 40), 34);
      ruina(W * 0.84, Math.min(H - 20, yr + 80), 24);
    }
  },

  vivo(ctx, W, H, t) {
    for (let i = 0; i < 3; i++) {
      const x = ((i * 173 + t * (6 + i * 3)) % (W + 200)) - 100, y = 128 + i * 46;
      ctx.globalAlpha = 0.85;
      nuvem(ctx, x, y, 14 + i * 3, '#ffffff', 'rgba(170,170,220,0.3)');
      ctx.globalAlpha = 1;
    }
    // faiscas douradas flutuando
    for (let i = 0; i < 8; i++) {
      const x = (i * 97 + Math.sin(t * 0.7 + i) * 18) % W, y = 150 + ((i * 61 + t * 12) % (H * 0.5));
      estrela(ctx, x, y, 2.2 + Math.sin(t * 3 + i) * 0.8, 0.9, 4);
      ctx.fillStyle = `rgba(255,236,160,${0.4 + 0.3 * Math.sin(t * 2 + i)})`; ctx.fill();
    }
  },

  mesa(ctx, L, e) {
    // estilobato: tres degraus de pedra sob as colunas
    const a0 = L.coluna(0), aN = L.coluna(L.colunas - 1);
    const x0 = Math.min(a0.x, L.descarte.x) - 14, x1 = Math.max(aN.x + aN.w, L.descarte.x + L.descarte.w) + 14;
    const y = L.chao;
    const degraus = [[0, 7], [7, 7], [14, 8]];
    degraus.forEach(([dy, h], k) => {
      const ex = k * 7;
      const g = ctx.createLinearGradient(0, y + dy, 0, y + dy + h);
      g.addColorStop(0, '#fbf8f0'); g.addColorStop(1, '#d9cfbb');
      ctx.fillStyle = g; ctx.fillRect(x0 - ex, y + dy, x1 - x0 + ex * 2, h);
      ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.strokeRect(x0 - ex, y + dy, x1 - x0 + ex * 2, h);
    });
    for (let c = 0; c < L.colunas; c++) {
      const s = L.carta(c, 0);
      // base (plinto) de cada coluna
      rr(ctx, s.x - 4, y - 5, s.w + 8, 6, 2); ctx.fillStyle = '#ece4d2'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
      if (!e.colunas[c].length) {
        rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 4);
        ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(59,53,82,0.45)'; ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]);
        for (let k = 1; k < 4; k++) { const x = s.x + 4 + (k * (s.w - 8)) / 4; ctx.strokeStyle = 'rgba(59,53,82,0.18)'; ctx.beginPath(); ctx.moveTo(x, s.y + 8); ctx.lineTo(x, s.y + s.h - 8); ctx.stroke(); }
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return pedraBruta(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return ambrosia(ctx, r, op);
    if (carta.tipo === 'bomba') return raioZeus(ctx, r, op);
    if (carta.tipo === 'dobro') return asas(ctx, r, op);
    tambor(ctx, carta, r, op);
    if (carta.gelo) {
      hera(ctx, r);
      // o numero continua legivel por cima da hera
      const md = medidas(carta.v, r);
      placa(ctx, carta.v, 0, md.pcy, md.pmaxW, md.pmaxH, md.M.ouro || md.M.cristal);
    }
  },

  cadeado(ctx, a) {
    // portao de bronze com arco e cadeado
    const x0 = a.x - 3, w = a.w + 6, y0 = a.y + 8, y1 = a.y + a.h;
    ctx.fillStyle = 'rgba(40,30,60,0.35)'; rr(ctx, x0, y0, w, y1 - y0, 6); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0 + w * 0.5); ctx.arc(x0 + w / 2, y0 + w * 0.5, w / 2, Math.PI, 0); ctx.lineTo(x0 + w, y1); ctx.closePath();
    ctx.lineWidth = 3.5; ctx.strokeStyle = BRONZE; ctx.stroke();
    ctx.clip();
    for (let x = x0 + 6; x < x0 + w - 2; x += 9) {
      const g = ctx.createLinearGradient(x - 2, 0, x + 2, 0);
      g.addColorStop(0, '#7a4f22'); g.addColorStop(0.5, '#e0aa62'); g.addColorStop(1, '#7a4f22');
      ctx.fillStyle = g; ctx.fillRect(x - 1.8, y0, 3.6, y1 - y0);
      estrela(ctx, x, y0 + w * 0.12, 3, 1.2, 4); ctx.fillStyle = '#e0aa62'; ctx.fill();
    }
    for (const yy of [y0 + (y1 - y0) * 0.42, y0 + (y1 - y0) * 0.8]) { ctx.fillStyle = BRONZE; ctx.fillRect(x0, yy, w, 4); }
    ctx.restore();
    const cx = a.x + a.w / 2, cy = y0 + (y1 - y0) * 0.6;
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy - 6, 7, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 10, cy - 6, 20, 16, 4); ctx.fillStyle = OURO; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = TINTA; circulo(ctx, cx, cy + 1, 2.3); ctx.fill(); ctx.fillRect(cx - 1, cy + 1, 2, 5);
  },

  descarte(ctx, r, e) {
    // anfora de oferenda (figura negra)
    const carga = e.descarteCarga > 0;
    const cx = r.x + r.w / 2, base = r.y + r.h, h = r.h * 1.05, w = Math.min(r.w * 0.78, h * 0.72);
    ctx.save();
    ctx.globalAlpha = carga ? 1 : 0.6;
    elipse(ctx, cx, base - 1, w * 0.45, 3); ctx.fillStyle = 'rgba(40,30,60,0.25)'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.16, base - h); ctx.lineTo(cx + w * 0.16, base - h);
    ctx.lineTo(cx + w * 0.13, base - h * 0.8);
    ctx.bezierCurveTo(cx + w * 0.62, base - h * 0.72, cx + w * 0.5, base - h * 0.18, cx + w * 0.16, base - h * 0.08);
    ctx.lineTo(cx + w * 0.22, base); ctx.lineTo(cx - w * 0.22, base); ctx.lineTo(cx - w * 0.16, base - h * 0.08);
    ctx.bezierCurveTo(cx - w * 0.5, base - h * 0.18, cx - w * 0.62, base - h * 0.72, cx - w * 0.13, base - h * 0.8);
    ctx.closePath();
    ctx.fillStyle = '#d9773a'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#2b1d16'; ctx.fillRect(cx - w, base - h * 0.55, w * 2, h * 0.2);
    meandro(ctx, cx - w, base - h * 0.52, w * 2, h * 0.14, '#d9773a');
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx - w * 0.3, base - h * 0.75, w * 0.1, h * 0.55);
    ctx.restore();
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * w * 0.14, base - h * 0.9); ctx.quadraticCurveTo(cx + s * w * 0.48, base - h * 0.92, cx + s * w * 0.36, base - h * 0.66);
      ctx.lineWidth = 3; ctx.strokeStyle = '#b55e2b'; ctx.stroke();
    }
    ctx.restore();
    rr(ctx, cx - 26, r.y - 30, 52, 16, 4); ctx.fillStyle = carga ? '#fbf8f0' : '#ddd5c4'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = TINTA; ctx.stroke();
    texto(ctx, carga ? 'oferenda' : 'vazia', cx, r.y - 22, 10.5, TINTA);
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) {
      // pedestal de marmore com base de nuvem
      rr(ctx, f.x + 4, f.y, f.w - 8, f.h, 10);
      const g = ctx.createLinearGradient(f.x, 0, f.x + f.w, 0);
      g.addColorStop(0, '#d9cfbb'); g.addColorStop(0.35, '#fbf8f0'); g.addColorStop(1, '#cfc4ad');
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
      meandro(ctx, f.x + 8, f.y + 6, f.w - 16, 8, OURO);
      nuvem(ctx, f.x + f.w / 2, f.y + f.h + 4, 26);
      texto(ctx, 'próximos', f.x + f.w / 2, f.y - 10, 12, '#fff', { contorno: TINTA, espessura: 3 });
      return;
    }
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, p2.x) - 26, x1 = Math.max(p0.x + p0.w, p2.x + p2.w) + 26;
    const yb = Math.max(p0.y + p0.h, p2.y + p2.h);
    // plataforma de nuvem com bandeja de marmore
    for (let x = x0; x <= x1; x += 26) nuvem(ctx, x, yb + 14, 18, '#ffffff', 'rgba(200,160,200,0.45)');
    rr(ctx, x0 + 8, yb - 2, x1 - x0 - 16, 9, 4);
    ctx.fillStyle = '#f7f1e3'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
    faixaOuro(ctx, x0 + 10, yb + 4, x1 - x0 - 20, 2);
    texto(ctx, 'próximo ▸', p0.x + p0.w / 2, p0.y - 12, 12, '#fff', { contorno: TINTA, espessura: 3 });
  },

  hud(ctx, W, H, L, e, t, mem) {
    mem.W = W;
    const x = 10, y = 10, w = W - 20, h = 78;
    ctx.save();
    ctx.shadowColor = 'rgba(40,30,70,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 10);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fffdf7'); g.addColorStop(1, '#ece2cc');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, h, 10); ctx.lineWidth = 3; ctx.strokeStyle = OURO; ctx.stroke();
    rr(ctx, x + 4, y + 4, w - 8, h - 8, 7); ctx.lineWidth = 1; ctx.strokeStyle = TINTA; ctx.stroke();
    meandro(ctx, x + 8, y + h - 13, w - 16, 7, OURO_E);
    // selo do templo
    const bx = x + 38, by = y + h / 2 - 3;
    circulo(ctx, bx, by, 20); ctx.fillStyle = LAPIS; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OURO; ctx.stroke();
    louros(ctx, bx, by, 24, OLIVA);
    texto(ctx, 'templo', bx, by - 8, 8.5, '#d8e2ff');
    texto(ctx, String(e.faseId), bx, by + 6, 18, '#ffe08a', { contorno: '#152754', espessura: 3 });
    // metas
    const mx = x + 74, mw = w - 74 - 92;
    e.metas.forEach((m, k) => {
      const yy = y + 11 + k * 26;
      texto(ctx, textoMeta(m, { monte: (n) => `Erga ${n} coroa${n > 1 ? 's' : ''} de louros` }), mx, yy + 5, 11.5, TINTA, { alinhar: 'left', max: mw });
      rr(ctx, mx, yy + 12, mw, 7, 3.5); ctx.fillStyle = '#e2d6bc'; ctx.fill();
      rr(ctx, mx, yy + 12, Math.max(7, mw * Math.min(1, m.atual / m.alvo)), 7, 3.5);
      const gb = ctx.createLinearGradient(0, yy + 12, 0, yy + 19);
      gb.addColorStop(0, m.feita ? '#a9c25a' : OURO_C); gb.addColorStop(1, m.feita ? OLIVA : OURO);
      ctx.fillStyle = gb; ctx.fill();
      rr(ctx, mx, yy + 12, mw, 7, 3.5); ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(59,53,82,0.5)'; ctx.stroke();
    });
    // gloria (pontos)
    const px = x + w - 46;
    louros(ctx, px, y + 26, 13, OURO, OURO_E);
    texto(ctx, String(e.pontos), px, y + 50, 17, TINTA, { max: 84 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 12);
      ctx.save(); ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 8 + k * 10;
      texto(ctx, '⚡ FÚRIA DE ZEUS x2 ⚡', W / 2, y + h + 18, 18, '#ffe14a', { contorno: LAPIS, espessura: 4 });
      ctx.restore();
    }
  },

  efeito(fx, P, mem, agora) {
    registrarFormas(P);
    const tx = dentro(fx.x, mem);
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 18, ['#ffffff', '#efe7d6', '#d8cfbd'], 8, 0.4, { g: 120, vida: 0.55, tam: 6, forma: 'c' });
        return true;
      case 'fusao':
        P.estourar(fx.x, fx.y, [OURO, OURO_C, '#ffffff'], 8 + fx.degrau * 3, 0.8 + fx.degrau * 0.12, { forma: 'estrela', tam: 8, g: 220 });
        P.estourar(fx.x, fx.y, [OLIVA, '#9ab04a'], 5 + fx.degrau * 2, 0.7, { forma: 'folha', tam: 10, g: 140, vida: 0.9 });
        P.anel(fx.x, fx.y, OURO, 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(tx, fx.y - 24, 'x' + fx.degrau, '#ffe08a', 22 + fx.degrau * 2, LAPIS);
        return true;
      case 'completar':
        P.add({ forma: 'raio', x: fx.x + 24, y: 0, dx: -24, dy: fx.y, vida: 0.45, tam: 9, cor: '#fff6b0', sem: (agora | 0) + 7 });
        P.add({ forma: 'coroa', x: fx.x, y: fx.y - 10, vy: -110, g: -30, arrasto: 1, vida: 1.3, tam: 40, cor: OURO });
        P.estourar(fx.x, fx.y, [OURO, OURO_C, '#ffffff'], 34, 1.6, { forma: 'estrela', tam: 11 });
        P.estourar(fx.x, fx.y, [OLIVA, '#9ab04a'], 14, 1.1, { forma: 'folha', tam: 12, g: 160, vida: 1 });
        P.texto(tx, fx.y - 34, 'Glória!', '#ffe08a', 32, LAPIS);
        return true;
      case 'explodir':
        P.add({ forma: 'raio', x: fx.x + 16, y: Math.max(0, fx.y - 180), dx: -16, dy: Math.min(180, fx.y), vida: 0.35, tam: 7, cor: '#fff6b0', sem: (agora | 0) + 3 });
        P.estourar(fx.x, fx.y, ['#ffe14a', '#ffffff', '#9fd8ff'], 22, 1.3, { forma: 'estrela', tam: 9, g: 260 });
        P.anel(fx.x, fx.y, '#ffe14a', 44, 0.4);
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#d8cfbd', '#b5ab97', '#8f8572'], 18, 1.2, { forma: 'lasca', tam: 9 });
        P.subir(fx.x, fx.y, 'rgba(255,255,255,0.7)', 6, { tam: 14, vida: 0.7, larg: 34 });
        return true;
      case 'racha': P.estourar(fx.x, fx.y, ['#d8cfbd', '#b5ab97'], 7, 0.6, { forma: 'lasca', tam: 6 }); return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#6f9a2e', '#4f6b22', '#9ab04a'], 14, 0.8, { forma: 'folha', tam: 10, g: 200, vida: 1 });
        P.texto(tx, fx.y - 22, 'Livre!', '#d9f2a0', 18, '#33480f');
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#e0aa62', OURO, '#ffffff'], 20, 1, { forma: 'estrela', tam: 8 });
        P.texto(tx, fx.y - 24, 'Portão aberto!', '#ffe08a', 20, LAPIS);
        return true;
      case 'combo': P.texto(tx, fx.y - 44, `Combo x${fx.n}!`, '#ffe08a', 22, LAPIS); return true;
      default: return false;
    }
  },
};

/** x do texto flutuante preso dentro da tela (textos largos perto da borda). */
function dentro(x, mem) {
  const W = (mem && mem.W) || 390;
  return Math.max(70, Math.min(W - 70, x));
}

/** Formas de particula do tema (registradas uma vez por sistema). */
function registrarFormas(P) {
  if (P.formas.folha) return;
  P.formas.folha = (ctx, p) => {
    elipse(ctx, 0, 0, p.tam * 0.22, p.tam * 0.5); ctx.fill();
    ctx.strokeStyle = 'rgba(40,50,10,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -p.tam * 0.4); ctx.lineTo(0, p.tam * 0.4); ctx.stroke();
  };
  P.formas.lasca = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(s * 0.1, -s); ctx.lineTo(s, s * 0.2); ctx.lineTo(-s * 0.2, s); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(59,53,82,0.5)'; ctx.lineWidth = 1; ctx.stroke();
  };
  P.formas.raio = (ctx, p, u) => {
    const rnd = semente(p.sem || 1);
    const n = 7;
    ctx.save();
    ctx.globalAlpha = (1 - u) * (0.6 + 0.4 * Math.abs(Math.sin(u * 40)));
    ctx.shadowColor = '#fff6b0'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let i = 1; i <= n; i++) ctx.lineTo((p.dx * i) / n + (i < n ? (rnd() - 0.5) * 30 : 0), (p.dy * i) / n);
    ctx.strokeStyle = p.cor; ctx.lineWidth = p.tam; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = p.tam * 0.35; ctx.stroke();
    ctx.restore();
  };
  P.formas.coroa = (ctx, p) => {
    ctx.save(); ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 12;
    louros(ctx, 0, 0, p.tam * 0.5, OURO, OURO_E);
    ctx.restore();
  };
}

export default tema;
