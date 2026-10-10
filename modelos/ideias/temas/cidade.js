// Ideia 5: Cidade que Cresce. As colunas sao terrenos e cada carta e um bloco
// de predio: valor maior, bloco mais largo. O menor sobe no maior e o predio
// afina como um arranha-ceu. O 2048 inaugura o predio, que vai para o
// horizonte: o skyline do fundo ganha um predio novo a cada monte completo.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const CONTORNO = '#2a2147';
const FACHADAS = [
  { cor: '#ff9e8a' },                                  // 2 salmao
  { cor: '#7fd6b0' },                                  // 4 menta
  { cor: '#86c5ff' },                                  // 8 ceu
  { cor: '#b9a3ff' },                                  // 16 lilas
  { cor: '#f4e1b5' },                                  // 32 creme
  { cor: '#d0674a', tijolo: true },                    // 64 tijolo
  { cor: '#4fb6a8' },                                  // 128 verde-agua
  { cor: '#f2b84b' },                                  // 256 mostarda
  { cor: '#a54a6b' },                                  // 512 vinho
  { cor: '#4a8fe8', vidro: ['#a8d6ff', '#2a5bb8'] },   // 1024 vidro azul
  { cor: '#f7c948', vidro: ['#fff2b8', '#d99a12'] },   // 2048 vidro dourado
  { cor: '#8a6bff', vidro: ['#e6dcff', '#5a36d6'] },   // 4096 vidro violeta
];
const JANELA = '#2f3157', ACESA = '#ffd36b', REFLEXO = '#ffb38a';

/** Predios inaugurados na sessao: o skyline sobrevive ao recomecar a partida. */
const SKYLINE = [];
/** Chao e faixa da rua, medidos no fundo (o vivo nao recebe o layout). */
const RUA = { chao: 0, faixaY: 0 };

// ------------------------------------------------------------ pecas

/** Grade de janelas numa faixa (acesas pela semente do id). */
function janelas(ctx, x, y, w, h, cols, rnd, op = {}) {
  const gap = Math.max(2, w * 0.07);
  const jw = (w - gap * (cols + 1)) / cols;
  for (let i = 0; i < cols; i++) {
    const jx = x + gap + i * (jw + gap);
    const u = rnd();
    ctx.fillStyle = u < (op.acesas ?? 0.45) ? ACESA : u < 0.62 ? REFLEXO : JANELA;
    rr(ctx, jx, y, jw, h, Math.min(2, jw * 0.2)); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(jx, y, jw, Math.max(1, h * 0.18));
  }
}

/** Placa com o numero na fachada. */
function placa(ctx, v, cx, cy, pw, ph, cor) {
  const tam = Math.max(11, Math.min(ph * 0.27, pw * 0.3));
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const tw = Math.min(pw * 0.86, ctx.measureText(String(v)).width + tam * 0.8);
  const th = tam * 1.12;
  rr(ctx, cx - tw / 2, cy - th / 2, tw, th, tam * 0.28);
  ctx.fillStyle = '#fff8e8'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = escurecer(cor, 0.45); ctx.stroke();
  texto(ctx, String(v), cx, cy + 0.5, tam, CONTORNO, { max: tw - 4 });
}

/** Bloco de predio do valor v, centrado em r. */
function bloco(ctx, carta, r, op) {
  const v = carta.v, n = nivel(v);
  const F = FACHADAS[Math.min(n, FACHADAS.length - 1)];
  const pw = r.w * (0.6 + 0.4 * Math.min(1, n / 10));
  const ph = r.h - 2;
  const x0 = -pw / 2, y0 = r.y + 1;
  const rnd = semente((carta.id || 1) * 31 + v);
  const corpoY = y0 + ph * 0.1, corpoH = ph * 0.9;
  // corpo
  rr(ctx, x0, corpoY, pw, corpoH, 3);
  if (F.vidro) {
    const g = ctx.createLinearGradient(x0, corpoY, x0 + pw, corpoY + corpoH);
    g.addColorStop(0, F.vidro[0]); g.addColorStop(1, F.vidro[1]);
    ctx.fillStyle = g;
  } else ctx.fillStyle = F.cor;
  ctx.fill();
  ctx.save();
  rr(ctx, x0, corpoY, pw, corpoH, 3); ctx.clip();
  // lado na sombra (o sol se poe a esquerda)
  ctx.fillStyle = 'rgba(30,20,70,0.22)'; ctx.fillRect(x0 + pw * 0.8, corpoY, pw * 0.2, corpoH);
  if (F.tijolo) {
    ctx.strokeStyle = 'rgba(80,25,15,0.35)'; ctx.lineWidth = 1;
    for (let yy = corpoY + 4, k = 0; yy < corpoY + corpoH; yy += 5, k++) {
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + pw, yy); ctx.stroke();
      for (let xx = x0 + (k % 2 ? 4 : 0); xx < x0 + pw; xx += 8) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 5); ctx.stroke(); }
    }
  }
  if (F.vidro) {
    // montantes e reflexos
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    const cols = 5;
    for (let i = 1; i < cols; i++) { const xx = x0 + (pw * i) / cols; ctx.beginPath(); ctx.moveTo(xx, corpoY); ctx.lineTo(xx, corpoY + corpoH); ctx.stroke(); }
    for (let yy = corpoY + corpoH / 4; yy < corpoY + corpoH; yy += corpoH / 4) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + pw, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(x0 + pw * 0.1, corpoY + corpoH); ctx.lineTo(x0 + pw * 0.45, corpoY); ctx.lineTo(x0 + pw * 0.6, corpoY); ctx.lineTo(x0 + pw * 0.25, corpoY + corpoH); ctx.closePath(); ctx.fill();
    // algumas janelas acesas atras do vidro
    for (let i = 0; i < 6; i++) {
      const cx = x0 + (Math.floor(rnd() * cols) + 0.15) * (pw / cols), cy = corpoY + (Math.floor(rnd() * 4) + 0.2) * (corpoH / 4);
      ctx.fillStyle = 'rgba(255,220,120,0.65)'; ctx.fillRect(cx, cy, pw / cols * 0.7, corpoH / 4 * 0.6);
    }
  } else {
    const cols = Math.min(5, 2 + Math.floor(n / 2));
    janelas(ctx, x0 + 2, corpoY + corpoH * 0.1, pw * 0.8 - 2, corpoH * 0.17, cols, rnd);
    if (n < 2) {
      // porta e toldo
      const dw = pw * 0.26, dh = corpoH * 0.26;
      rr(ctx, -dw / 2 - pw * 0.08, corpoY + corpoH - dh, dw, dh, 2); ctx.fillStyle = '#5a3a2e'; ctx.fill();
      ctx.fillStyle = ACESA; circulo(ctx, -pw * 0.08 + dw * 0.28, corpoY + corpoH - dh * 0.5, 1.2); ctx.fill();
    } else janelas(ctx, x0 + 2, corpoY + corpoH * 0.74, pw * 0.8 - 2, corpoH * 0.15, cols, rnd);
  }
  // base do bloco
  ctx.fillStyle = 'rgba(20,10,50,0.22)'; ctx.fillRect(x0, corpoY + corpoH - 3, pw, 3);
  ctx.restore();
  rr(ctx, x0, corpoY, pw, corpoH, 3); ctx.lineWidth = 1.8; ctx.strokeStyle = CONTORNO; ctx.stroke();
  // cornija
  const cor = escurecer(F.vidro ? F.vidro[1] : F.cor, 0.28);
  rr(ctx, x0 - 2.5, y0 + ph * 0.04, pw + 5, ph * 0.09, 2); ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = CONTORNO; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x0 - 1.5, y0 + ph * 0.04 + 1, pw + 3, 1.5);
  // placa
  placa(ctx, v, -pw * 0.05, corpoY + corpoH * 0.5, pw * 0.86, ph, F.vidro ? F.vidro[1] : F.cor);
  if (op && op.destaque) {
    rr(ctx, x0 - 4, y0 + ph * 0.02, pw + 8, ph * 0.98, 5);
    ctx.strokeStyle = `rgba(255,224,140,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

/** Overlay de bloco embargado: lona azul e fita zebrada. */
function embargo(ctx, r, t) {
  const x0 = r.x + 2, y0 = r.y + 2, w = r.w - 4, h = r.h - 4;
  rr(ctx, x0, y0, w, h, 4);
  ctx.fillStyle = 'rgba(40,120,220,0.42)'; ctx.fill();
  ctx.save(); rr(ctx, x0, y0, w, h, 4); ctx.clip();
  // dobras da lona
  ctx.strokeStyle = 'rgba(200,230,255,0.45)'; ctx.lineWidth = 1.5;
  for (let k = 1; k < 4; k++) { const xx = x0 + (w * k) / 4 + Math.sin(t * 2 + k) * 1.2; ctx.beginPath(); ctx.moveTo(xx, y0); ctx.quadraticCurveTo(xx + 4, y0 + h / 2, xx, y0 + h); ctx.stroke(); }
  // fita zebrada na diagonal
  ctx.translate(x0 + w / 2, y0 + h * 0.2); ctx.rotate(-0.22);
  const fw = w * 1.6, fh = Math.max(8, h * 0.16);
  ctx.fillStyle = '#ffd400'; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
  ctx.fillStyle = '#1d1a24';
  for (let xx = -fw / 2; xx < fw / 2; xx += fh * 1.4) {
    ctx.beginPath(); ctx.moveTo(xx, -fh / 2); ctx.lineTo(xx + fh * 0.7, -fh / 2); ctx.lineTo(xx + fh * 0.2, fh / 2); ctx.lineTo(xx - fh * 0.5, fh / 2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  rr(ctx, x0, y0, w, h, 4); ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 1.8; ctx.stroke();
}

/** Monte de entulho com vergalhoes, rachaduras e pips de hp. */
function entulho(ctx, r, hp) {
  const w = r.w * 0.96, h = r.h - 4, y0 = r.y + 3, base = y0 + h;
  // vergalhoes
  ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2;
  for (const [dx, a] of [[-0.18, -0.5], [0.12, 0.35], [0.28, 0.7]]) {
    ctx.beginPath(); ctx.moveTo(dx * w, base - h * 0.4); ctx.lineTo(dx * w + Math.sin(a) * h * 0.55, base - h * 0.4 - Math.cos(a) * h * 0.55); ctx.stroke();
  }
  const pedacos = [
    [-0.32, 0.72, 0.2, 0.22, '#8f8aa0'], [0.3, 0.74, 0.2, 0.2, '#7d7890'], [0, 0.68, 0.3, 0.3, '#a29db4'],
    [-0.15, 0.42, 0.2, 0.18, '#b3aec4'], [0.17, 0.44, 0.17, 0.16, '#958fa8'], [0.02, 0.22, 0.16, 0.14, '#c2bdd2'],
  ];
  for (const [dx, dy, rx, ry, cor] of pedacos) {
    ctx.beginPath();
    const cx = dx * w, cy = y0 + dy * h;
    ctx.moveTo(cx - rx * w, cy + ry * h * 0.6);
    ctx.lineTo(cx - rx * w * 0.7, cy - ry * h * 0.8);
    ctx.lineTo(cx + rx * w * 0.4, cy - ry * h);
    ctx.lineTo(cx + rx * w, cy - ry * h * 0.1);
    ctx.lineTo(cx + rx * w * 0.8, cy + ry * h * 0.7);
    ctx.closePath();
    ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = CONTORNO; ctx.stroke();
  }
  // rachaduras pelo hp perdido
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  ctx.strokeStyle = '#2a2537'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  const rach = [[-0.06, 0.5, 0.04, 0.66, -0.04, 0.82], [-0.3, 0.6, -0.22, 0.72, -0.32, 0.84], [0.24, 0.62, 0.32, 0.72, 0.26, 0.84]];
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * w, y0 + c[1] * h); ctx.lineTo(c[2] * w, y0 + c[3] * h); ctx.lineTo(c[4] * w, y0 + c[5] * h); ctx.stroke();
  }
  // pips de hp
  rr(ctx, -17, y0 + h * 0.02 - 2, 34, 10, 5); ctx.fillStyle = 'rgba(20,15,40,0.55)'; ctx.fill();
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * 10, y0 + h * 0.02 + 3, 3.2);
    ctx.fillStyle = k < hp ? '#ffd36b' : 'rgba(255,255,255,0.18)'; ctx.fill();
  }
}

/** Bloco de vidro holografico (coringa). */
function holografico(ctx, r, op) {
  const pw = r.w * 0.8, ph = r.h - 4, x0 = -pw / 2, y0 = r.y + 2;
  const t = op.t || 0;
  rr(ctx, x0, y0, pw, ph, 5);
  const g = ctx.createLinearGradient(x0, y0, x0 + pw, y0 + ph);
  const cores = ['#ff7eb6', '#ffd36b', '#7ff0c8', '#7fb8ff', '#c49bff'];
  cores.forEach((c, i) => g.addColorStop((i / (cores.length - 1) + t * 0.15) % 1, c));
  ctx.fillStyle = g; ctx.globalAlpha *= 0.92; ctx.fill(); ctx.globalAlpha /= 0.92;
  ctx.save(); rr(ctx, x0, y0, pw, ph, 5); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 + (pw * i) / 4, y0); ctx.lineTo(x0 + (pw * i) / 4, y0 + ph); ctx.stroke(); }
  const fx = ((t * 0.6) % 1.6 - 0.3) * pw;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.moveTo(x0 + fx, y0 + ph); ctx.lineTo(x0 + fx + pw * 0.3, y0); ctx.lineTo(x0 + fx + pw * 0.45, y0); ctx.lineTo(x0 + fx + pw * 0.15, y0 + ph); ctx.closePath(); ctx.fill();
  ctx.restore();
  rr(ctx, x0, y0, pw, ph, 5); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  texto(ctx, '?', 0, y0 + ph * 0.52, ph * 0.5, '#ffffff', { contorno: CONTORNO, espessura: 3.5 });
  estrela(ctx, x0 + pw * 0.82, y0 + ph * 0.18, 5 + Math.sin(t * 6) * 1.5, 2, 4); ctx.fillStyle = '#fff'; ctx.fill();
}

/** Bola de demolicao (bomba). */
function demolicao(ctx, r, op) {
  const t = op.t || 0;
  const R = Math.min(r.h * 0.3, r.w * 0.3);
  const ang = Math.sin(t * 3) * 0.25;
  const topoY = r.y + 2;
  const cx = Math.sin(ang) * r.h * 0.5, cy = topoY + Math.cos(ang) * r.h * 0.5;
  // gancho
  rr(ctx, -7, topoY - 1, 14, 6, 2); ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = CONTORNO; ctx.stroke();
  // corrente
  ctx.strokeStyle = '#5b5670'; ctx.lineWidth = 2;
  const elos = 5;
  for (let i = 0; i < elos; i++) {
    const u = (i + 0.5) / elos;
    elipse(ctx, cx * u, topoY + 5 + (cy - R - topoY - 5) * u, 2.2, 3.2, ang); ctx.stroke();
  }
  // linhas de movimento
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
  const lado = Math.cos(t * 3) > 0 ? -1 : 1;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx + lado * (R + 4 + k * 4), cy, R * 0.6, -0.6, 0.6); ctx.stroke(); }
  circulo(ctx, cx, cy, R);
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
  g.addColorStop(0, '#6e6a80'); g.addColorStop(1, '#25222f');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = CONTORNO; ctx.stroke();
  texto(ctx, '!', cx, cy + 1, R * 1.1, '#ffd36b');
}

/** Guindastezinho levantando um bloco "x2" (dobro). */
function guindaste(ctx, r) {
  const w = r.w * 0.86, h = r.h - 4, x0 = -w / 2, y0 = r.y + 2;
  const amarelo = '#ffc21a';
  // torre trelicada
  const tx = x0 + w * 0.12, tw = w * 0.16;
  ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.2;
  rr(ctx, tx, y0 + h * 0.12, tw, h * 0.88, 1); ctx.fillStyle = amarelo; ctx.fill(); ctx.stroke();
  ctx.beginPath();
  for (let yy = y0 + h * 0.12; yy < y0 + h; yy += tw) { ctx.moveTo(tx, yy); ctx.lineTo(tx + tw, yy + tw); }
  ctx.stroke();
  // lanca
  rr(ctx, x0 + w * 0.02, y0 + h * 0.08, w * 0.96, h * 0.09, 1); ctx.fillStyle = amarelo; ctx.fill(); ctx.stroke();
  rr(ctx, x0, y0 + h * 0.06, w * 0.12, h * 0.16, 1); ctx.fillStyle = '#7a7590'; ctx.fill(); ctx.stroke();
  // cabo e bloco
  const bx = x0 + w * 0.68;
  ctx.strokeStyle = '#3b3550'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(bx, y0 + h * 0.17); ctx.lineTo(bx, y0 + h * 0.42); ctx.stroke();
  const bw = w * 0.5, bh = h * 0.42;
  rr(ctx, bx - bw / 2, y0 + h * 0.42, bw, bh, 3); ctx.fillStyle = '#ff7a59'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = CONTORNO; ctx.stroke();
  texto(ctx, 'x2', bx, y0 + h * 0.63, bh * 0.55, '#fff8e8', { contorno: CONTORNO, espessura: 3 });
}

// ------------------------------------------------------------ cenario

function predioSilhueta(ctx, x, chao, w, h, cor, rnd, acesas, corJanela = ACESA) {
  ctx.fillStyle = cor;
  ctx.fillRect(x, chao - h, w, h);
  if (rnd() < 0.35) { ctx.fillRect(x + w * 0.4, chao - h - 8, 2, 8); }
  else if (rnd() < 0.4) { ctx.fillRect(x + w * 0.15, chao - h - 4, w * 0.7, 4); }
  for (let yy = chao - h + 6; yy < chao - 6; yy += 7) {
    for (let xx = x + 3; xx < x + w - 4; xx += 6) {
      if (rnd() < acesas) { ctx.fillStyle = corJanela; ctx.fillRect(xx, yy, 2.5, 3); }
    }
  }
}

/** Vagas do skyline: primeiro onde a mesa nao cobre (acima do descarte e nas bordas). */
const VAGAS = [0.88, 0.97, 0.79, 0.03, 0.92, 0.72, 0.1, 0.84, 0.5, 0.62, 0.3, 0.4];
/** Posicao do k-esimo predio inaugurado no skyline. */
function vaga(k, W) {
  const u = VAGAS[k % VAGAS.length] + Math.floor(k / VAGAS.length) * 0.013;
  const w = 26 + (k % 3) * 8;
  return { x: u * W - w / 2, w, h: 160 + ((k * 37) % 90) };
}

function guindasteFundo(ctx, x, chao, alt, ang, t, cor) {
  ctx.save();
  ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = 2;
  // torre
  ctx.fillRect(x - 3, chao - alt, 6, alt);
  ctx.beginPath();
  for (let yy = chao - alt; yy < chao; yy += 10) { ctx.moveTo(x - 3, yy); ctx.lineTo(x + 3, yy + 10); }
  ctx.lineWidth = 1; ctx.stroke();
  // lanca girando de leve
  ctx.translate(x, chao - alt);
  ctx.rotate(ang);
  ctx.fillRect(-26, -4, 110, 5);
  ctx.fillRect(-30, -2, 12, 9);
  ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -20); ctx.lineTo(80, -3); ctx.moveTo(0, -20); ctx.lineTo(-24, -3); ctx.lineWidth = 1; ctx.stroke();
  // cabo com gancho balancando
  const bal = Math.sin(t * 1.3 + x) * 3;
  ctx.beginPath(); ctx.moveTo(62, 0); ctx.lineTo(62 + bal, 46); ctx.stroke();
  ctx.fillRect(58 + bal, 46, 8, 5);
  // luz vermelha piscando na ponta
  const pisca = Math.sin(t * 4 + x) > 0.3;
  ctx.fillStyle = pisca ? '#ff4d5e' : 'rgba(255,77,94,0.3)';
  circulo(ctx, 84, -3, 2.5); ctx.fill();
  ctx.restore();
}

function poste(ctx, x, chao) {
  ctx.fillStyle = '#3a3256';
  ctx.fillRect(x - 1.5, chao - 46, 3, 46);
  ctx.fillRect(x - 1.5, chao - 46, 12, 3);
  const g = ctx.createRadialGradient(x + 10, chao - 40, 1, x + 10, chao - 40, 26);
  g.addColorStop(0, 'rgba(255,214,140,0.65)'); g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g; circulo(ctx, x + 10, chao - 40, 26); ctx.fill();
  ctx.fillStyle = '#ffe2a8'; circulo(ctx, x + 10, chao - 41, 3); ctx.fill();
}

function caminhao(ctx, L) {
  const p0 = L.filaPos(0), pN = L.filaPos(L.tamFila - 1);
  const x0 = Math.min(p0.x, pN.x) - 14, x1 = Math.max(p0.x + p0.w, pN.x + pN.w) + 6;
  const yb = p0.y + p0.h + 1;
  // sombra
  elipse(ctx, (x0 + x1 + 50) / 2, yb + 22, (x1 - x0 + 70) / 2, 6); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
  // carroceria
  rr(ctx, x0, yb, x1 - x0, 11, 3); ctx.fillStyle = '#e8e2f2'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = CONTORNO; ctx.stroke();
  ctx.fillStyle = '#ff7a59'; ctx.fillRect(x0 + 2, yb + 6, x1 - x0 - 4, 3);
  rr(ctx, x0 - 2, yb - 8, 5, 19, 2); ctx.fillStyle = '#c9c2d8'; ctx.fill(); ctx.stroke();
  // cabine
  const cx = x1, cw = 46, ch = 44;
  ctx.beginPath();
  ctx.moveTo(cx, yb + 11); ctx.lineTo(cx, yb + 11 - ch); ctx.lineTo(cx + cw * 0.62, yb + 11 - ch);
  ctx.quadraticCurveTo(cx + cw * 0.8, yb + 11 - ch, cx + cw * 0.88, yb + 11 - ch * 0.55);
  ctx.lineTo(cx + cw, yb + 11 - ch * 0.48); ctx.lineTo(cx + cw, yb + 11); ctx.closePath();
  ctx.fillStyle = '#ff7a59'; ctx.fill(); ctx.stroke();
  // janela
  ctx.beginPath(); ctx.moveTo(cx + cw * 0.16, yb + 11 - ch * 0.88); ctx.lineTo(cx + cw * 0.6, yb + 11 - ch * 0.88);
  ctx.quadraticCurveTo(cx + cw * 0.74, yb + 11 - ch * 0.88, cx + cw * 0.8, yb + 11 - ch * 0.55); ctx.lineTo(cx + cw * 0.16, yb + 11 - ch * 0.55); ctx.closePath();
  ctx.fillStyle = '#9fd0ff'; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
  // farol
  ctx.fillStyle = '#fff3c4'; rr(ctx, cx + cw - 5, yb - 4, 5, 6, 2); ctx.fill();
  const g = ctx.createLinearGradient(cx + cw, 0, cx + cw + 40, 0);
  g.addColorStop(0, 'rgba(255,240,190,0.45)'); g.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx + cw, yb - 3); ctx.lineTo(cx + cw + 40, yb - 12); ctx.lineTo(cx + cw + 40, yb + 10); ctx.closePath(); ctx.fill();
  // rodas
  for (const wx of [x0 + 18, x0 + (x1 - x0) * 0.55, cx + cw * 0.55]) {
    circulo(ctx, wx, yb + 15, 8); ctx.fillStyle = '#1d1a26'; ctx.fill();
    circulo(ctx, wx, yb + 15, 3.5); ctx.fillStyle = '#b8b2c8'; ctx.fill();
  }
  texto(ctx, 'próximo ▸', p0.x + p0.w / 2, p0.y - 11, 12, '#fff3d6', { contorno: 'rgba(42,33,71,0.85)', espessura: 3 });
}

function elevador(ctx, L) {
  const f = L.fila;
  const x0 = f.x + 4, x1 = f.x + f.w - 4;
  ctx.strokeStyle = '#ffc21a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, f.y - 10); ctx.lineTo(x0, f.y + f.h + 6); ctx.moveTo(x1, f.y - 10); ctx.lineTo(x1, f.y + f.h + 6); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,194,26,0.7)';
  ctx.beginPath();
  for (let yy = f.y - 10; yy < f.y + f.h; yy += 18) { ctx.moveTo(x0, yy); ctx.lineTo(x1, yy + 18); ctx.moveTo(x1, yy); ctx.lineTo(x0, yy + 18); }
  ctx.stroke();
  for (let k = 0; k < L.tamFila; k++) {
    const p = L.filaPos(k);
    rr(ctx, x0 - 4, p.y + p.h + 1, x1 - x0 + 8, 5, 2); ctx.fillStyle = '#7a7590'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.2; ctx.stroke();
  }
  rr(ctx, x0 - 6, f.y - 22, x1 - x0 + 12, 14, 4); ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.5; ctx.stroke();
  texto(ctx, 'PRÓXIMOS', (x0 + x1) / 2, f.y - 15, 10, CONTORNO);
}

const tema = {
  id: 'cidade',
  nome: 'Cidade que Cresce',
  cores: { texto: '#ffffff', destaque: '#ffd36b', particulas: ['#ffd36b', '#ff9a76', '#ffffff', '#86c5ff'] },
  faixas: () => ({ topo: 96, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.85, filaFator: 1.0, colar: true }),

  fundo(ctx, W, H, L) {
    const chao = L.chao;
    const g = ctx.createLinearGradient(0, 0, 0, chao);
    g.addColorStop(0, '#2b2d5c'); g.addColorStop(0.38, '#6a5acd'); g.addColorStop(0.7, '#ff9a76'); g.addColorStop(1, '#ffc58a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, chao);
    const rnd = semente(21);
    // estrelas no alto
    for (let i = 0; i < 40; i++) {
      const y = rnd() * chao * 0.38;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.5 * (1 - y / (chao * 0.38))})`;
      circulo(ctx, rnd() * W, y, 0.6 + rnd() * 1.1); ctx.fill();
    }
    // sol baixo
    const sx = L.fila.vertical ? W * 0.5 : W * 0.84, sy = chao - Math.min(170, chao * 0.3);
    const gs = ctx.createRadialGradient(sx, sy, 10, sx, sy, 120);
    gs.addColorStop(0, 'rgba(255,230,160,0.7)'); gs.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = gs; circulo(ctx, sx, sy, 120); ctx.fill();
    ctx.fillStyle = '#ffe08a'; circulo(ctx, sx, sy, 38); ctx.fill();
    ctx.fillStyle = 'rgba(255,154,118,0.6)';
    for (let k = 0; k < 3; k++) ctx.fillRect(sx - 40, sy + 10 + k * 9, 80, 3);
    // skyline distante
    for (let x = -10; x < W + 10;) {
      const w = 16 + rnd() * 22, h = 40 + rnd() * 90;
      predioSilhueta(ctx, x, chao, w, h, 'rgba(110,86,170,0.7)', rnd, 0.12, 'rgba(255,214,140,0.7)');
      x += w + rnd() * 4;
    }
    for (let x = -6; x < W + 10;) {
      const w = 20 + rnd() * 26, h = 30 + rnd() * 70;
      predioSilhueta(ctx, x, chao, w, h, '#3d3370', rnd, 0.22);
      x += w + 2 + rnd() * 8;
    }
    // calcada, meio-fio e rua
    ctx.fillStyle = '#b8b0c9'; ctx.fillRect(0, chao, W, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, chao, W, 2);
    ctx.strokeStyle = 'rgba(60,50,90,0.35)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 22) { ctx.beginPath(); ctx.moveTo(x, chao + 2); ctx.lineTo(x, chao + 10); ctx.stroke(); }
    ctx.fillStyle = '#8c84a3'; ctx.fillRect(0, chao + 10, W, 4);
    const ga = ctx.createLinearGradient(0, chao + 14, 0, H);
    ga.addColorStop(0, '#3e3b55'); ga.addColorStop(1, '#2a2840');
    ctx.fillStyle = ga; ctx.fillRect(0, chao + 14, W, H - chao - 14);
    // faixas da rua
    const p0 = L.filaPos(0);
    const faixaY = L.fila.vertical ? chao + 14 + (H - chao - 14) * 0.5 : Math.min(H - 14, p0.y + p0.h + 44);
    RUA.chao = chao; RUA.faixaY = faixaY;
    ctx.fillStyle = 'rgba(255,214,90,0.85)';
    for (let x = 6; x < W; x += 34) ctx.fillRect(x, faixaY, 18, 3);
    if (faixaY + 40 < H) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let x = 6; x < W; x += 34) ctx.fillRect(x + 8, faixaY + 34, 18, 3);
    }
    // calcada do outro lado da rua, com arbustos
    if (faixaY + 60 < H) {
      const cy = H - 26;
      ctx.fillStyle = '#8c84a3'; ctx.fillRect(0, cy - 4, W, 4);
      ctx.fillStyle = '#b8b0c9'; ctx.fillRect(0, cy, W, H - cy);
      for (let x = 14; x < W; x += 58) {
        ctx.fillStyle = '#2f7a5a'; circulo(ctx, x, cy + 2, 11); ctx.fill(); circulo(ctx, x + 12, cy + 4, 9); ctx.fill();
        ctx.fillStyle = '#3f9a70'; circulo(ctx, x - 3, cy - 1, 6); ctx.fill();
      }
    }
    // faixa de pedestre a esquerda
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let k = 0; k < 6; k++) ctx.fillRect(8, chao + 20 + k * 14, 34, 7);
    // postes
    for (const fx of [0.05, 0.52, 0.97]) poste(ctx, W * fx, chao);
  },

  vivo(ctx, W, H, t, e, mem) {
    const chao = RUA.chao || H * 0.7;
    guindasteFundo(ctx, W * 0.14, chao - 2, Math.min(230, chao * 0.42), Math.sin(t * 0.35) * 0.05, t, 'rgba(42,35,80,0.85)');
    guindasteFundo(ctx, W * 0.66, chao - 2, Math.min(280, chao * 0.5), Math.sin(t * 0.3 + 1.7) * 0.05 + Math.PI * 0.02, t, 'rgba(42,35,80,0.7)');
    // predios inaugurados pelo jogador
    const lista = SKYLINE;
    lista.forEach((p, k) => {
      const v = vaga(k, W);
      const novo = t - p.t0 < 4;
      const sobe = Math.min(1, (t - p.t0) / 0.8);
      const h = v.h * (0.2 + 0.8 * (1 - Math.pow(1 - Math.max(0, sobe), 3)));
      if (novo) {
        // holofotes
        ctx.save();
        ctx.globalAlpha = 0.25 * (1 - (t - p.t0) / 4);
        ctx.fillStyle = '#fff2c4';
        for (const s of [-1, 1]) {
          const a = s * 0.35 + Math.sin(t * 2 + s) * 0.25;
          ctx.beginPath(); ctx.moveTo(v.x + v.w / 2, chao - h);
          ctx.lineTo(v.x + v.w / 2 + Math.sin(a) * 400 - 18, chao - h - Math.cos(a) * 400);
          ctx.lineTo(v.x + v.w / 2 + Math.sin(a) * 400 + 18, chao - h - Math.cos(a) * 400);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        ctx.save(); ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 18 + Math.sin(t * 8) * 6;
      }
      ctx.fillStyle = novo ? '#6a58b8' : '#4b3f8a';
      ctx.fillRect(v.x, chao - h, v.w, h);
      if (novo) ctx.restore();
      ctx.fillStyle = '#ffd36b';
      for (let yy = chao - h + 6; yy < chao - 6; yy += 8) for (let xx = v.x + 4; xx < v.x + v.w - 4; xx += 6) ctx.fillRect(xx, yy, 2.5, 3.5);
      ctx.fillRect(v.x + v.w / 2 - 1, chao - h - 10, 2, 10);
      ctx.fillStyle = Math.sin(t * 3 + k) > 0 ? '#ff4d5e' : '#7a2a3a'; circulo(ctx, v.x + v.w / 2, chao - h - 11, 2); ctx.fill();
    });
    // carro passando
    const fy = RUA.faixaY;
    if (fy) {
      const x = ((t * 70) % (W + 120)) - 60;
      rr(ctx, x, fy - 14, 40, 11, 4); ctx.fillStyle = '#86c5ff'; ctx.fill();
      rr(ctx, x + 8, fy - 21, 22, 9, 4); ctx.fill();
      ctx.fillStyle = '#2a2147'; circulo(ctx, x + 9, fy - 3, 4); ctx.fill(); circulo(ctx, x + 31, fy - 3, 4); ctx.fill();
      ctx.fillStyle = '#fff3c4'; ctx.fillRect(x + 38, fy - 12, 3, 3);
    }
  },

  mesa(ctx, L, e, t, mem) {
    for (let c = 0; c < L.colunas; c++) {
      const a = L.coluna(c);
      // fundacao de concreto
      rr(ctx, a.x - 5, L.chao - 3, a.w + 10, 8, 3); ctx.fillStyle = '#9b95ad'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.5; ctx.stroke();
      if (!e.colunas[c].length) {
        const s = L.carta(c, 0);
        rr(ctx, s.x + 3, s.y + 3, s.w - 6, s.h - 6, 4);
        ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,240,220,0.6)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        // placa de lote
        const cx = s.x + s.w / 2;
        ctx.fillStyle = '#6b4a2e'; ctx.fillRect(cx - 1.5, s.y + s.h * 0.45, 3, s.h * 0.5);
        rr(ctx, cx - 17, s.y + s.h * 0.22, 34, 16, 3); ctx.fillStyle = '#fff3d6'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.4; ctx.stroke();
        texto(ctx, 'LOTE', cx, s.y + s.h * 0.22 + 8.5, 10, CONTORNO);
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return entulho(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return holografico(ctx, r, op);
    if (carta.tipo === 'bomba') return demolicao(ctx, r, op);
    if (carta.tipo === 'dobro') return guindaste(ctx, r);
    bloco(ctx, carta, r, op);
    if (carta.gelo) embargo(ctx, r, op.t || 0);
  },

  cadeado(ctx, a) {
    // tapume de obra cobrindo a coluna
    ctx.fillStyle = 'rgba(30,20,60,0.35)'; rr(ctx, a.x - 4, a.y, a.w + 8, a.h, 6); ctx.fill();
    const y0 = a.y + a.h * 0.3, y1 = a.y + a.h;
    rr(ctx, a.x - 4, y0, a.w + 8, y1 - y0, 3); ctx.fillStyle = '#d9b77e'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,40,0.5)'; ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) { const x = a.x - 4 + ((a.w + 8) * k) / 4; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
    ctx.fillStyle = '#2f6fd6'; ctx.fillRect(a.x - 4, y0, a.w + 8, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(a.x - 4, y0 + 6, a.w + 8, 2);
    // placa OBRA
    const cx = a.x + a.w / 2, py = y0 + (y1 - y0) * 0.28;
    rr(ctx, cx - 22, py, 44, 18, 3); ctx.fillStyle = '#ffd400'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.5; ctx.stroke();
    texto(ctx, 'OBRA', cx, py + 9.5, 12, '#1d1a24');
    // cadeado na corrente
    const ly = y0 + (y1 - y0) * 0.66;
    ctx.strokeStyle = '#6f6a84'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x - 4, ly - 8); ctx.lineTo(cx, ly - 2); ctx.lineTo(a.x + a.w + 4, ly - 8); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, ly - 3, 6.5, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 9, ly - 3, 18, 15, 4); ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = CONTORNO; circulo(ctx, cx, ly + 4, 2.2); ctx.fill();
  },

  descarte(ctx, r, e) {
    // cacamba de entulho
    const cx = r.x + r.w / 2, base = r.y + r.h;
    const wTopo = r.w * 1.12, wBase = r.w * 0.86, h = r.h * 0.62;
    const y0 = base - h - 6;
    const corpo = () => {
      ctx.beginPath();
      ctx.moveTo(cx - wTopo / 2, y0); ctx.lineTo(cx + wTopo / 2, y0);
      ctx.lineTo(cx + wBase / 2, base - 6); ctx.lineTo(cx - wBase / 2, base - 6); ctx.closePath();
    };
    const carga = e.descarteCarga > 0;
    if (!carga) {
      // cheia: entulho aparecendo por cima
      ctx.fillStyle = '#8f8aa0';
      for (let k = 0; k < 5; k++) { circulo(ctx, cx - wTopo * 0.35 + k * wTopo * 0.17, y0 - 2 + (k % 2) * 2, 6); ctx.fill(); }
    }
    corpo(); ctx.fillStyle = '#ffc21a'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = CONTORNO; ctx.stroke();
    ctx.save(); corpo(); ctx.clip();
    ctx.strokeStyle = 'rgba(120,80,0,0.45)'; ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) { const x = cx - wTopo / 2 + (wTopo * k) / 4; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, base); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(cx - wTopo / 2, base - 14, wTopo, 10);
    ctx.restore();
    rr(ctx, cx - wTopo / 2 - 2, y0 - 2, wTopo + 4, 5, 2); ctx.fillStyle = '#e0a400'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.4; ctx.stroke();
    for (const s of [-1, 1]) { circulo(ctx, cx + s * wBase * 0.32, base - 4, 4); ctx.fillStyle = '#1d1a26'; ctx.fill(); }
    // rotulo
    rr(ctx, cx - 26, r.y - 26, 52, 17, 4); ctx.fillStyle = carga ? '#fff3d6' : '#cfc6b0'; ctx.fill(); ctx.strokeStyle = CONTORNO; ctx.lineWidth = 1.4; ctx.stroke();
    texto(ctx, carga ? 'caçamba ↩' : 'cheia', cx, r.y - 17, 10, CONTORNO);
  },

  fila(ctx, L) {
    if (L.fila.vertical) elevador(ctx, L);
    else caminhao(ctx, L);
  },

  hud(ctx, W, H, L, e, t) {
    const x = 10, y = 10, w = W - 20, h = 78;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rr(ctx, x, y, w, h, 10); ctx.fillStyle = '#1f7a4d'; ctx.fill();
    ctx.restore();
    rr(ctx, x + 4, y + 4, w - 8, h - 8, 7); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    // bairro
    texto(ctx, 'BAIRRO', x + 38, y + 26, 11, '#c8f0d8');
    texto(ctx, String(e.faseId), x + 38, y + 50, 28, '#ffffff');
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 72, y + 14, 2, h - 28);
    // metas
    const mx = x + 84, mw = w - 84 - 96;
    e.metas.forEach((m, k) => {
      const yy = y + 13 + k * 29;
      const tx = textoMeta(m, { monte: (n) => `Construa ${n} prédio${n > 1 ? 's' : ''}` });
      texto(ctx, tx, mx, yy + 5, 12.5, '#ffffff', { alinhar: 'left', max: mw });
      rr(ctx, mx, yy + 13, mw, 8, 4); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      rr(ctx, mx, yy + 13, Math.max(8, mw * Math.min(1, m.atual / m.alvo)), 8, 4); ctx.fillStyle = m.feita ? '#7fe6a8' : '#ffd36b'; ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + w - 92, y + 14, 2, h - 28);
    // pontos com um predinho
    const px = x + w - 46;
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(px - 10, y + 14, 9, 20); ctx.fillRect(px + 1, y + 20, 10, 14);
    ctx.fillRect(px - 6.5, y + 9, 2, 5);
    ctx.fillStyle = '#1f7a4d';
    for (let k = 0; k < 3; k++) { ctx.fillRect(px - 8, y + 17 + k * 5, 2, 2); ctx.fillRect(px - 4, y + 17 + k * 5, 2, 2); ctx.fillRect(px + 4, y + 23 + k * 4, 4, 2); }
    texto(ctx, String(e.pontos), px, y + 52, 18, '#ffffff', { max: 80 });
    if (e.febre) {
      const pisca = Math.sin(t * 12) > -0.2;
      const by = y + h + 10;
      rr(ctx, W / 2 - 104, by, 208, 30, 8); ctx.fillStyle = '#1d1630'; ctx.fill();
      ctx.save(); ctx.shadowColor = pisca ? '#ff4fd8' : 'transparent'; ctx.shadowBlur = 14;
      rr(ctx, W / 2 - 104, by, 208, 30, 8); ctx.strokeStyle = pisca ? '#ff4fd8' : '#7a2a6a'; ctx.lineWidth = 2.5; ctx.stroke();
      texto(ctx, 'HORA DO RUSH x2', W / 2, by + 15.5, 17, pisca ? '#ffe36b' : '#8a7a40');
      ctx.restore();
    }
  },

  efeito(fx, P, mem, agora) {
    switch (fx.tipo) {
      case 'pouso': P.estourar(fx.x, fx.y + 16, ['#cfc8dc', '#a9a2bb', '#e6e0ee'], 8, 0.4, { g: 160, vida: 0.5, tam: 7, forma: 'c' }); return true;
      case 'fusao':
        P.estourar(fx.x, fx.y, ['#ffb347', '#ffd36b', '#ffffff', '#ff7a1a'], 14 + fx.degrau * 5, 1.1 + fx.degrau * 0.12, { g: 560, vida: 0.5, tam: 3.5, forma: 'c' });
        P.anel(fx.x, fx.y, '#ffd36b', 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 24, 'x' + fx.degrau, '#ffd36b', 22 + fx.degrau * 2, '#2a2147');
        return true;
      case 'completar': {
        SKYLINE.push({ t0: (agora ?? 0) / 1000, valor: fx.valor });
        const sets = [['#ff4fd8', '#ffd36b'], ['#7fe6ff', '#ffffff'], ['#ffd36b', '#ff7a59']];
        sets.forEach((cores, k) => {
          const x = fx.x + (k - 1) * 70, y = Math.max(120, fx.y - 150 - (k % 2) * 40);
          P.estourar(x, y, cores, 26, 1.2, { forma: k === 1 ? 'estrela' : 'c', tam: k === 1 ? 9 : 5, g: 90, vida: 1.2 });
          P.anel(x, y, cores[0], 50, 0.6);
        });
        P.estourar(fx.x, fx.y, ['#ffd36b', '#fff2b8'], 20, 1.3, { forma: 'estrela', tam: 10 });
        P.texto(fx.x, fx.y - 30, 'Inaugurado!', '#ffd36b', 28, '#2a2147');
        return true;
      }
      case 'explodir':
        P.subir(fx.x, fx.y, ['rgba(200,190,215,0.85)', 'rgba(160,150,180,0.85)', 'rgba(230,225,240,0.85)'], 10, { tam: 20, vida: 0.9, larg: 40, forca: 0.8 });
        P.estourar(fx.x, fx.y, ['#8f8aa0', '#6b4a2e', '#b3aec4'], 16, 1.2, { forma: 'q', tam: 7 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#8f8aa0', '#a29db4', '#7a4a2a', '#c2bdd2'], 20, 1.2, { forma: 'q', tam: 8 });
        P.subir(fx.x, fx.y, 'rgba(210,200,225,0.7)', 6, { tam: 16, vida: 0.7, larg: 34 });
        return true;
      case 'racha': P.estourar(fx.x, fx.y, ['#8f8aa0', '#c2bdd2'], 7, 0.6, { forma: 'q', tam: 5 }); return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#ffd400', '#1d1a24', '#5aa0ff', '#cfe6ff'], 16, 0.9, { forma: 'q', tam: 7, g: 240, vida: 0.8 });
        P.texto(fx.x, fx.y - 20, 'Liberado!', '#ffd400', 18, '#1d1a24');
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#d9b77e', '#ffd400', '#2f6fd6'], 22, 1.1, { forma: 'q', tam: 8 });
        P.texto(fx.x, fx.y - 24, 'Obra liberada!', '#ffd400', 20, '#1d1a24');
        return true;
      case 'combo': P.texto(fx.x, fx.y - 44, `Combo x${fx.n}!`, '#ffd36b', 22, '#2a2147'); return true;
      default: return false;
    }
  },
};

void TAU; void clarear; void rgba;

export default tema;
