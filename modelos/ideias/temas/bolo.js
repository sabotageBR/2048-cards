// Ideia 6: Torre de Bolo. O bolo de andares ja e a regra estrita: a camada
// menor vai em cima da maior; camadas iguais viram uma maior e mais
// enfeitada. O 2048 e o bolo de casamento, que sai para a festa.
// Pecas em torre (de baixo para cima), largura cresce com o valor.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, estrela, nivel, geoTorre, textoMeta, semente } from '../kit.js';

const TINTA = '#4a2f27';
const ROSA = '#ffb7c5';
const MENTA = '#a8e6cf';
const CREME = '#fff3e0';

// massa, recheio, cobertura, decoracao e cor da borda da plaquinha (2..4096)
const SABORES = [
  { massa: '#f3d58f', recheio: '#fff1c9', cob: '#fffaf0', deco: 'confeitos', borda: '#e9a93a' },
  { massa: '#f6d9a8', recheio: '#ff6f8a', cob: '#ffb7c5', deco: 'morango', borda: '#ff4f74' },
  { massa: '#8a5a44', recheio: '#5a3826', cob: '#6d4c41', deco: 'raspas', borda: '#6d4c41' },
  { massa: '#f6e27a', recheio: '#fff6b0', cob: '#fff7c2', deco: 'limao', borda: '#d9b400' },
  { massa: '#b3263a', recheio: '#fff3e0', cob: '#fff3e0', deco: 'migalhas', borda: '#b3263a' },
  { massa: '#c9f2dd', recheio: '#6d4c41', cob: '#8fdcb8', deco: 'folhas', borda: '#2f9e6d' },
  { massa: '#efe4fb', recheio: '#6a4fb0', cob: '#b9a4e8', deco: 'mirtilos', borda: '#6a4fb0' },
  { massa: '#e0a868', recheio: '#9c5418', cob: '#f0b46a', deco: 'calda', borda: '#a85d1c' },
  { massa: '#fff3e0', recheio: '#ffb7c5', cob: '#ffffff', deco: 'granulado', borda: '#ff3f8e' },
  { massa: '#f3d58f', recheio: '#fff3e0', cob: '#f5c542', deco: 'perolas', borda: '#b8860b' },
  { massa: '#fffaf3', recheio: '#ffd6e0', cob: '#ffffff', deco: 'flores', borda: '#e0719a' },
  { massa: '#f3c14b', recheio: '#fff3e0', cob: '#ffd34d', deco: 'coroa', borda: '#9a6b00' },
];
const GRANULADO = ['#ff5fa2', '#ffd23f', '#5ad1ff', '#7ee08a', '#b98cff', '#ff8a3d'];

const sabor = (v) => SABORES[Math.min(nivel(v), SABORES.length - 1)];
const largura = (r, v) => r.w * (0.66 + 0.34 * Math.min(1, nivel(v) / 10));

// ------------------------------------------------------------ andar de bolo

/** Cobertura com escorridos: contorno grosso primeiro e o recheio por cima. */
function cobertura(ctx, cor, x0, y, w, h, n) {
  const rnd = semente(31 + n * 7);
  const gotas = Math.max(3, Math.round(w / 12));
  const partes = [[x0 - 1.5, y, w + 3, h, h * 0.45]];
  for (let k = 0; k < gotas; k++) {
    const passo = w / gotas, gw = passo * 0.62;
    const gl = h * (0.4 + rnd() * 1.0);
    partes.push([x0 + (k + 0.5) * passo - gw / 2, y + h * 0.5, gw, gl + h * 0.5, gw / 2]);
  }
  ctx.strokeStyle = TINTA; ctx.lineWidth = 3.2;
  for (const p of partes) { rr(ctx, p[0], p[1], p[2], p[3], p[4]); ctx.stroke(); }
  ctx.fillStyle = cor;
  for (const p of partes) { rr(ctx, p[0], p[1], p[2], p[3], p[4]); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  rr(ctx, x0 + w * 0.08, y + h * 0.18, w * 0.4, h * 0.24, h * 0.12); ctx.fill();
}

function morango(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.bezierCurveTo(x - s * 1.1, y + s * 0.2, x - s * 0.8, y - s * 0.7, x, y - s * 0.5);
  ctx.bezierCurveTo(x + s * 0.8, y - s * 0.7, x + s * 1.1, y + s * 0.2, x, y + s);
  ctx.fillStyle = '#e8384f'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = '#ffe08a';
  for (const [dx, dy] of [[-0.35, -0.05], [0.3, 0], [0, 0.35], [-0.1, -0.3]]) { circulo(ctx, x + dx * s, y + dy * s, Math.max(0.7, s * 0.09)); ctx.fill(); }
  ctx.fillStyle = '#4caf50';
  for (const a of [-0.6, 0, 0.6]) { elipse(ctx, x + Math.sin(a) * s * 0.4, y - s * 0.55, s * 0.18, s * 0.34, a); ctx.fill(); }
}

function flor(ctx, x, y, s, cor) {
  ctx.fillStyle = cor;
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; circulo(ctx, x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.5); ctx.fill(); }
  ctx.lineWidth = 0.8; ctx.strokeStyle = escurecer(cor, 0.25);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; circulo(ctx, x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.5); ctx.stroke(); }
  ctx.fillStyle = '#ffd23f'; circulo(ctx, x, y, s * 0.32); ctx.fill();
}

function cerejaPequena(ctx, x, y, s) {
  ctx.strokeStyle = '#5a8f2e'; ctx.lineWidth = Math.max(1.2, s * 0.18);
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.8); ctx.quadraticCurveTo(x + s * 0.3, y - s * 1.8, x + s * 0.9, y - s * 2); ctx.stroke();
  circulo(ctx, x, y, s); ctx.fillStyle = '#e0233f'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; circulo(ctx, x - s * 0.35, y - s * 0.35, s * 0.28); ctx.fill();
}

/** Decoracao em cima da cobertura (y = topo da cobertura, h = altura dela). */
function decoracao(ctx, S, n, x0, y, w, h, corpoY, corpoH, t) {
  const rnd = semente(97 + n * 11);
  const s = Math.max(3, h * 0.55);
  switch (S.deco) {
    case 'confeitos':
      for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#ff9fb2', '#8fdcb8', '#ffe08a'][k % 3]; circulo(ctx, x0 + w * (0.14 + k * 0.145), y + h * 0.45, Math.max(1.2, h * 0.14)); ctx.fill(); }
      break;
    case 'morango':
      for (const f of [-0.28, 0, 0.28]) morango(ctx, f * w, y - s * 0.35, s * 0.85);
      break;
    case 'raspas':
      ctx.strokeStyle = '#3e241a'; ctx.lineWidth = Math.max(1.5, h * 0.22); ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const x = x0 + w * (0.14 + k * 0.18), yy = y + h * 0.1;
        ctx.beginPath(); ctx.arc(x, yy, s * 0.55, Math.PI * (0.9 + rnd() * 0.3), Math.PI * (1.9 + rnd() * 0.3)); ctx.stroke();
      }
      break;
    case 'limao':
      for (const f of [-0.3, 0, 0.3]) {
        const x = f * w, yy = y + h * 0.15, R = s * 0.85;
        ctx.beginPath(); ctx.arc(x, yy, R, Math.PI, 0); ctx.closePath();
        ctx.fillStyle = '#fff6b0'; ctx.fill(); ctx.lineWidth = Math.max(1.5, R * 0.22); ctx.strokeStyle = '#f2c500'; ctx.stroke();
        ctx.strokeStyle = 'rgba(214,170,0,0.7)'; ctx.lineWidth = 0.8;
        for (const a of [0.25, 0.5, 0.75]) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - Math.cos(a * Math.PI) * R * 0.8, yy - Math.sin(a * Math.PI) * R * 0.8); ctx.stroke(); }
      }
      break;
    case 'migalhas':
      ctx.fillStyle = '#b3263a';
      for (let k = 0; k < 14; k++) { const x = x0 + w * (0.06 + rnd() * 0.88), yy = y + h * (0.1 + rnd() * 0.5); ctx.fillRect(x - 1.2, yy - 1.2, 2.4 + rnd() * 1.5, 2.4); }
      break;
    case 'folhas':
      for (const f of [-0.3, 0.05, 0.32]) {
        ctx.fillStyle = '#2f9e6d';
        elipse(ctx, f * w - s * 0.35, y - s * 0.2, s * 0.32, s * 0.65, -0.6); ctx.fill();
        elipse(ctx, f * w + s * 0.35, y - s * 0.2, s * 0.32, s * 0.65, 0.6); ctx.fill();
      }
      ctx.fillStyle = '#4a2f27';
      for (let k = 0; k < 7; k++) { circulo(ctx, x0 + w * (0.1 + k * 0.13), y + h * 0.55, Math.max(1, h * 0.11)); ctx.fill(); }
      break;
    case 'mirtilos':
      for (let k = 0; k < 5; k++) {
        const x = x0 + w * (0.14 + k * 0.18), yy = y - s * 0.15 + (k % 2) * 2;
        circulo(ctx, x, yy, s * 0.55); ctx.fillStyle = '#3d3a8c'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = TINTA; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; circulo(ctx, x - s * 0.18, yy - s * 0.18, s * 0.16); ctx.fill();
      }
      break;
    case 'calda':
      ctx.strokeStyle = '#9c5418'; ctx.lineWidth = Math.max(1.6, h * 0.22); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0 + 2, y + h * 0.3);
      for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + (w * k) / 6, y + (k % 2 ? h * 0.85 : h * 0.15));
      ctx.stroke();
      ctx.fillStyle = '#9c5418'; circulo(ctx, 0, y - s * 0.2, s * 0.45); ctx.fill();
      break;
    case 'granulado':
      for (let k = 0; k < 16; k++) {
        const x = x0 + w * (0.06 + rnd() * 0.88), yy = y + h * (0.1 + rnd() * 0.6), a = rnd() * Math.PI;
        ctx.save(); ctx.translate(x, yy); ctx.rotate(a); ctx.fillStyle = GRANULADO[k % GRANULADO.length];
        rr(ctx, -2.5, -0.9, 5, 1.8, 0.9); ctx.fill(); ctx.restore();
      }
      break;
    case 'perolas':
      for (const yy of [y + h * 0.05, corpoY + corpoH - 3]) {
        const qt = Math.max(5, Math.round(w / 6));
        for (let k = 0; k < qt; k++) {
          const x = x0 + (w * (k + 0.5)) / qt;
          circulo(ctx, x, yy, Math.max(1.5, h * 0.2)); ctx.fillStyle = '#fffdf6'; ctx.fill();
          ctx.lineWidth = 0.8; ctx.strokeStyle = '#c9a24a'; ctx.stroke();
        }
      }
      break;
    case 'flores':
      for (const [f, c] of [[-0.32, '#ffd6e0'], [-0.12, '#ffffff'], [0.14, '#ffd6e0'], [0.34, '#ffffff']]) flor(ctx, f * w, y + h * 0.2, s * 0.62, c);
      cerejaPequena(ctx, 0, y - s * 0.6, s * 0.7);
      break;
    case 'coroa': {
      const cw = Math.min(w * 0.5, s * 3.4), cy = y + h * 0.1, ch = s * 1.6;
      ctx.beginPath();
      ctx.moveTo(-cw / 2, cy); ctx.lineTo(-cw / 2, cy - ch); ctx.lineTo(-cw / 4, cy - ch * 0.45); ctx.lineTo(0, cy - ch * 1.15);
      ctx.lineTo(cw / 4, cy - ch * 0.45); ctx.lineTo(cw / 2, cy - ch); ctx.lineTo(cw / 2, cy); ctx.closePath();
      ctx.fillStyle = '#ffe066'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.fillStyle = '#e0233f'; circulo(ctx, 0, cy - ch * 0.42, s * 0.22); ctx.fill();
      ctx.fillStyle = '#3fa7ff'; circulo(ctx, -cw * 0.28, cy - ch * 0.3, s * 0.16); ctx.fill(); circulo(ctx, cw * 0.28, cy - ch * 0.3, s * 0.16); ctx.fill();
      const brilho = 0.5 + 0.5 * Math.sin(t * 4);
      estrela(ctx, cw * 0.55, cy - ch * 1.1, s * 0.5 * brilho, s * 0.15, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
      break;
    }
    default: break;
  }
}

/** Plaquinha de acucar com o numero, espetada na frente do andar. */
function plaquinha(ctx, v, cx, cy, ph, pw, borda) {
  const tam = Math.max(10, Math.min(26, ph * 0.28));
  ctx.font = `700 ${tam}px Fredoka, system-ui, sans-serif`;
  const tw = Math.min(pw * 0.92, ctx.measureText(String(v)).width + tam * 0.7);
  const th = tam * 1.15;
  ctx.fillStyle = '#f4ead8'; ctx.fillRect(cx - 1, cy + th / 2 - 1, 2, 5);
  rr(ctx, cx - tw / 2, cy - th / 2, tw, th, th * 0.35);
  ctx.fillStyle = '#fffdf8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = borda; ctx.stroke();
  texto(ctx, String(v), cx, cy + 0.5, tam, TINTA, { max: tw - 4 });
}

function andar(ctx, v, r, op) {
  const n = Math.min(nivel(v), SABORES.length - 1);
  const S = SABORES[n];
  const pw = largura(r, v);
  const ph = r.h - 2;
  const x0 = -pw / 2, y0 = r.y + 1;
  const cobY = y0 + ph * 0.08, cobH = ph * 0.2;
  const corpoY = y0 + ph * 0.18, corpoH = ph * 0.82;
  const raio = Math.min(7, pw * 0.1);
  // massa com recheio e volume
  rr(ctx, x0, corpoY, pw, corpoH, raio);
  ctx.fillStyle = S.massa; ctx.fill();
  ctx.save();
  rr(ctx, x0, corpoY, pw, corpoH, raio); ctx.clip();
  ctx.fillStyle = S.recheio;
  ctx.fillRect(x0, corpoY + corpoH * 0.5, pw, corpoH * 0.12);
  if (n >= 6) ctx.fillRect(x0, corpoY + corpoH * 0.78, pw, corpoH * 0.07);
  const g = ctx.createLinearGradient(x0, 0, x0 + pw, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = g; ctx.fillRect(x0, corpoY, pw, corpoH);
  ctx.restore();
  rr(ctx, x0, corpoY, pw, corpoH, raio); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  cobertura(ctx, S.cob, x0, cobY, pw, cobH, n);
  decoracao(ctx, S, n, x0, cobY, pw, cobH, corpoY, corpoH, op.t || 0);
  plaquinha(ctx, v, 0, corpoY + corpoH * 0.56, ph, pw, S.borda);
  if (op.destaque) {
    rr(ctx, x0 - 3, cobY - 3, pw + 6, ph * 0.92 + 4, raio + 3);
    ctx.strokeStyle = `rgba(255,255,255,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

// ------------------------------------------------------------ obstaculos e especiais

function congelado(ctx, r, v, t) {
  const pw = largura(r, v) + 6, x0 = -pw / 2, y0 = r.y + 1, h = r.h - 2;
  rr(ctx, x0, y0, pw, h, 8);
  ctx.fillStyle = 'rgba(185,228,255,0.55)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#effbff'; ctx.stroke();
  ctx.save(); rr(ctx, x0, y0, pw, h, 8); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0 + pw * 0.12, y0 + h); ctx.lineTo(x0 + pw * 0.42, y0); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 + pw * 0.32, y0 + h); ctx.lineTo(x0 + pw * 0.6, y0); ctx.stroke();
  // geada: bolinhas brancas no alto
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let k = 0; k < 8; k++) { circulo(ctx, x0 + (pw * (k + 0.5)) / 8, y0 + 1, 3.2 + (k % 3)); ctx.fill(); }
  ctx.restore();
  // cristal
  const fx = x0 + pw - 9, fy = y0 + 11, s = 6 + Math.sin(t * 3) * 0.6;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * s, fy - Math.sin(a) * s); ctx.lineTo(fx + Math.cos(a) * s, fy + Math.sin(a) * s); ctx.stroke(); }
}

function queimado(ctx, r, hp, t) {
  const pw = r.w * 0.84, ph = r.h - 2, x0 = -pw / 2, y0 = r.y + 1;
  const corpoY = y0 + ph * 0.14, corpoH = ph * 0.86;
  // fumacinha subindo
  for (let k = 0; k < 3; k++) {
    const f = (t * 0.55 + k / 3) % 1;
    const x = x0 + pw * (0.28 + k * 0.22) + Math.sin(t * 2 + k * 2) * 3;
    ctx.fillStyle = `rgba(110,100,96,${0.45 * (1 - f)})`;
    circulo(ctx, x, corpoY - f * ph * 0.7, 3 + f * 5); ctx.fill();
  }
  rr(ctx, x0, corpoY, pw, corpoH, 6);
  const g = ctx.createLinearGradient(0, corpoY, 0, corpoY + corpoH);
  g.addColorStop(0, '#4d3b33'); g.addColorStop(1, '#221815');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); rr(ctx, x0, corpoY, pw, corpoH, 6); ctx.clip();
  const rnd = semente(13);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (let k = 0; k < 9; k++) { elipse(ctx, x0 + rnd() * pw, corpoY + rnd() * corpoH, 2 + rnd() * 4, 1.5 + rnd() * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(160,110,70,0.35)'; ctx.fillRect(x0, corpoY + corpoH * 0.48, pw, corpoH * 0.1);
  ctx.restore();
  // crosta irregular no topo
  ctx.beginPath(); ctx.moveTo(x0 - 1, corpoY + 4);
  for (let k = 0; k <= 8; k++) ctx.lineTo(x0 + (pw * k) / 8, corpoY + (k % 2 ? -2 : 3));
  ctx.lineTo(x0 + pw + 1, corpoY + 6); ctx.lineTo(x0 - 1, corpoY + 6); ctx.closePath();
  ctx.fillStyle = '#1b1210'; ctx.fill();
  rr(ctx, x0, corpoY, pw, corpoH, 6); ctx.lineWidth = 2; ctx.strokeStyle = '#140d0b'; ctx.stroke();
  // rachaduras em brasa conforme o hp perdido
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  const rach = [[-0.3, 0.2, -0.1, 0.5, -0.22, 0.8], [0.25, 0.18, 0.08, 0.46, 0.28, 0.76], [0, 0.1, 0.06, 0.36, -0.06, 0.5]];
  ctx.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * pw, corpoY + c[1] * corpoH); ctx.lineTo(c[2] * pw, corpoY + c[3] * corpoH); ctx.lineTo(c[4] * pw, corpoY + c[5] * corpoH);
    ctx.strokeStyle = 'rgba(255,138,61,0.45)'; ctx.lineWidth = 4.5; ctx.stroke();
    ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 1.6; ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * 10, corpoY + corpoH * 0.82, 3.6);
    ctx.fillStyle = k < hp ? '#ffcf6b' : 'rgba(255,255,255,0.15)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#140d0b'; ctx.stroke();
  }
}

function cereja(ctx, r, op) {
  const t = op.t || 0;
  const R = Math.min(r.h * 0.27, r.w * 0.26), cy = r.y + r.h * 0.5;
  // chantilly
  ctx.fillStyle = '#fffdf8'; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.5;
  elipse(ctx, 0, r.y + r.h - 6, r.w * 0.34, r.h * 0.12); ctx.fill(); ctx.stroke();
  for (const [dx, dy, rr0] of [[-0.18, -0.12, 0.16], [0.16, -0.12, 0.16], [0, -0.22, 0.18]]) { circulo(ctx, dx * r.w, r.y + r.h - 6 + dy * r.h, rr0 * r.h); ctx.fill(); }
  // halo arco-iris girando
  for (let i = 0; i < 6; i++) {
    const a0 = t * 2 + (i / 6) * TAU;
    ctx.beginPath(); ctx.arc(0, cy, R * 1.5, a0, a0 + TAU / 6 - 0.15);
    ctx.strokeStyle = `hsl(${(i * 60 + t * 90) % 360},90%,65%)`; ctx.lineWidth = 3; ctx.stroke();
  }
  // cereja
  ctx.strokeStyle = '#5a8f2e'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, cy - R * 0.9); ctx.quadraticCurveTo(R * 0.2, cy - R * 1.9, R * 0.8, cy - R * 2.1); ctx.stroke();
  elipse(ctx, R * 0.95, cy - R * 2.05, R * 0.42, R * 0.2, -0.5); ctx.fillStyle = '#6cc551'; ctx.fill();
  const g = ctx.createRadialGradient(-R * 0.3, cy - R * 0.3, R * 0.1, 0, cy, R);
  g.addColorStop(0, '#ff6b81'); g.addColorStop(1, '#b3001b');
  circulo(ctx, 0, cy, R); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; circulo(ctx, -R * 0.35, cy - R * 0.35, R * 0.26); ctx.fill();
  const b = 0.5 + 0.5 * Math.sin(t * 5);
  estrela(ctx, R * 1.1, cy - R * 0.6, 5 * b + 1, 1.5, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
  estrela(ctx, -R * 1.15, cy + R * 0.3, 4 * (1 - b) + 1, 1.2, 4); ctx.fill();
}

function vela(ctx, r, op) {
  const t = op.t || 0;
  const vw = Math.max(9, r.w * 0.24), vh = r.h * 0.5, vy = r.y + r.h - 6 - vh;
  ctx.fillStyle = '#fffdf8'; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.5;
  elipse(ctx, 0, r.y + r.h - 5, r.w * 0.32, r.h * 0.1); ctx.fill(); ctx.stroke();
  rr(ctx, -vw / 2, vy, vw, vh, 3); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.save(); rr(ctx, -vw / 2, vy, vw, vh, 3); ctx.clip();
  ctx.strokeStyle = '#ff4f74'; ctx.lineWidth = 3.5;
  for (let k = -2; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-vw, vy + k * 8); ctx.lineTo(vw, vy + k * 8 - 10); ctx.stroke(); }
  ctx.restore();
  rr(ctx, -vw / 2, vy, vw, vh, 3); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
  // pavio e estrelinha
  ctx.strokeStyle = '#3b2a1e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, vy); ctx.lineTo(0, vy - 6); ctx.stroke();
  const f = 0.7 + 0.3 * Math.abs(Math.sin(t * 22));
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.4;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * TAU + t * 3, l = (8 + (k % 3) * 3) * f;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 3, vy - 8 + Math.sin(a) * 3); ctx.lineTo(Math.cos(a) * l, vy - 8 + Math.sin(a) * l); ctx.stroke();
  }
  estrela(ctx, 0, vy - 8, 7 * f, 2.6, 6); ctx.fillStyle = '#fff6b0'; ctx.fill();
  texto(ctx, '!', vw * 0.95, vy + vh * 0.3, 12, '#ff4f74', { contorno: '#ffffff', espessura: 3 });
}

function fermento(ctx, r, op) {
  const t = op.t || 0;
  const pw = Math.min(r.w * 0.66, r.h * 0.74), ph = r.h * 0.82, x0 = -pw / 2, y0 = r.y + r.h - ph - 1;
  // bolhas subindo
  for (let k = 0; k < 3; k++) {
    const f = (t * 0.7 + k / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - f)})`;
    circulo(ctx, x0 + pw * (0.3 + k * 0.2), y0 - f * 14, 2 + f * 2); ctx.fill();
  }
  ctx.beginPath(); ctx.moveTo(x0, y0 + 5);
  for (let k = 0; k <= 6; k++) ctx.lineTo(x0 + (pw * k) / 6, y0 + (k % 2 ? 0 : 5));
  ctx.lineTo(x0 + pw, y0 + ph); ctx.lineTo(x0, y0 + ph); ctx.closePath();
  ctx.fillStyle = '#fff1c9'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = '#e8384f'; ctx.fillRect(x0 + 1, y0 + ph * 0.26, pw - 2, ph * 0.2);
  texto(ctx, 'FERMENTO', 0, y0 + ph * 0.36, Math.max(7, ph * 0.12), '#ffffff', { max: pw - 6 });
  texto(ctx, 'x2', 0, y0 + ph * 0.7, ph * 0.34, '#e8384f', { contorno: '#ffffff', espessura: 3 });
  ctx.strokeStyle = 'rgba(74,47,39,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + pw * 0.85, y0 + 8); ctx.lineTo(x0 + pw * 0.85, y0 + ph - 3); ctx.stroke();
}

/** Cupcake pequeno (icone dos pontos). */
function cupcake(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x - s * 0.6, y); ctx.lineTo(x + s * 0.6, y); ctx.lineTo(x + s * 0.45, y + s * 0.8); ctx.lineTo(x - s * 0.45, y + s * 0.8); ctx.closePath();
  ctx.fillStyle = ROSA; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = '#fffdf8';
  circulo(ctx, x - s * 0.3, y - s * 0.1, s * 0.36); ctx.fill(); circulo(ctx, x + s * 0.3, y - s * 0.1, s * 0.36); ctx.fill(); circulo(ctx, x, y - s * 0.38, s * 0.4); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - s * 0.2, s * 0.62, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
  ctx.fillStyle = '#e0233f'; circulo(ctx, x, y - s * 0.82, s * 0.2); ctx.fill();
}

function registrarFormas(P) {
  if (P.formas.granulado) return;
  P.formas.granulado = (ctx, p) => { rr(ctx, -p.tam / 2, -p.tam * 0.16, p.tam, p.tam * 0.32, p.tam * 0.16); ctx.fill(); };
  P.formas.confete = (ctx, p) => { ctx.fillRect(-p.tam / 2, -p.tam * 0.3, p.tam, p.tam * 0.6); };
  P.formas.migalha = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.3); ctx.lineTo(-s * 0.2, -s); ctx.lineTo(s, -s * 0.4); ctx.lineTo(s * 0.6, s * 0.8); ctx.lineTo(-s * 0.5, s); ctx.closePath(); ctx.fill();
  };
  P.formas.cristal = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.45, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.45, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.stroke();
  };
}

// ------------------------------------------------------------ cenario

function janela(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#9fdcff'); g.addColorStop(1, '#e6f6ff');
  rr(ctx, x, y, w, h, 10); ctx.fillStyle = g; ctx.fill();
  ctx.save(); rr(ctx, x, y, w, h, 10); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  for (const [cx, cy, s] of [[0.25, 0.35, 1], [0.7, 0.55, 0.8]]) {
    const px = x + w * cx, py = y + h * cy;
    circulo(ctx, px, py, 12 * s); ctx.fill(); circulo(ctx, px + 14 * s, py - 6 * s, 15 * s); ctx.fill(); circulo(ctx, px + 30 * s, py, 11 * s); ctx.fill();
  }
  // telhados la fora
  ctx.fillStyle = '#ffd6e0'; ctx.fillRect(x, y + h * 0.78, w, h);
  ctx.fillStyle = '#f7a6b8';
  for (let k = 0; k < 4; k++) { const px = x + w * (0.05 + k * 0.26); ctx.beginPath(); ctx.moveTo(px, y + h * 0.8); ctx.lineTo(px + w * 0.1, y + h * 0.64); ctx.lineTo(px + w * 0.2, y + h * 0.8); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  rr(ctx, x, y, w, h, 10); ctx.lineWidth = 7; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = TINTA; rr(ctx, x - 3.5, y - 3.5, w + 7, h + 7, 12); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w / 2 - 3, y, 6, h); ctx.fillRect(x, y + h * 0.45 - 3, w, 6);
  // peitoril
  rr(ctx, x - 10, y + h + 2, w + 20, 9, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
  // toldo listrado com recorte
  const ty = y - 26, th = 24, n = Math.max(6, Math.round((w + 24) / 22)), sw = (w + 24) / n;
  for (let k = 0; k < n; k++) {
    const px = x - 12 + k * sw;
    ctx.beginPath(); ctx.moveTo(px, ty); ctx.lineTo(px + sw, ty); ctx.lineTo(px + sw, ty + th); ctx.arc(px + sw / 2, ty + th, sw / 2, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = k % 2 ? '#ffffff' : '#ff8fab'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
  }
}

function prateleira(ctx, x, y, w) {
  rr(ctx, x, y, w, 7, 3); ctx.fillStyle = '#d9a46c'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = '#b07a4a'; ctx.fillRect(x + 6, y + 7, 4, 8); ctx.fillRect(x + w - 10, y + 7, 4, 8);
  // pote de balas e boleirinha
  const px = x + w * 0.3;
  rr(ctx, px - 9, y - 22, 18, 22, 5); ctx.fillStyle = 'rgba(220,240,255,0.7)'; ctx.fill(); ctx.stroke();
  const cores = ['#ff5fa2', '#ffd23f', '#5ad1ff', '#7ee08a'];
  for (let k = 0; k < 6; k++) { ctx.fillStyle = cores[k % 4]; circulo(ctx, px - 5 + (k % 3) * 5, y - 5 - Math.floor(k / 3) * 6, 2.4); ctx.fill(); }
  rr(ctx, px - 10, y - 26, 20, 5, 2); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.stroke();
  if (w > 46) {
    const bx = x + w * 0.72;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(bx - 2, y - 8, 4, 8);
    rr(ctx, bx - 12, y - 10, 24, 3, 1.5); ctx.fill(); ctx.stroke();
    rr(ctx, bx - 8, y - 20, 16, 10, 3); ctx.fillStyle = '#ffd6e0'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0233f'; circulo(ctx, bx, y - 22, 2.4); ctx.fill();
  }
}

const tema = {
  id: 'bolo',
  nome: 'Torre de Bolo',
  cores: { texto: TINTA, destaque: '#ff8fab', particulas: GRANULADO },
  faixas: () => ({ topo: 96, base: 0 }),
  geo: (L) => geoTorre(L, { fator: 1.45, colar: true }),

  fundo(ctx, W, H, L) {
    const chao = L.chao;
    const balcao = chao + 12;
    // papel de parede listrado
    ctx.fillStyle = CREME; ctx.fillRect(0, 0, W, balcao);
    ctx.fillStyle = '#c6efdc';
    for (let x = 0; x < W; x += 36) ctx.fillRect(x, 0, 18, balcao);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 9; x < W; x += 36) for (let y = 14; y < balcao; y += 34) { circulo(ctx, x, y, 1.6); ctx.fill(); }
    // bandeirinhas
    const by = L.topo + 10;
    ctx.strokeStyle = TINTA; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.quadraticCurveTo(W / 2, by + 22, W, by); ctx.stroke();
    const nb = Math.round(W / 26);
    for (let k = 0; k < nb; k++) {
      const u = (k + 0.5) / nb, x = u * W, y = by + 44 * u * (1 - u);
      ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 14); ctx.closePath();
      ctx.fillStyle = [ROSA, '#ffe08a', MENTA, '#b9a4e8'][k % 4]; ctx.fill(); ctx.stroke();
    }
    // janela com toldo entre as bandeirinhas e o topo das torres
    const topoTorre = chao - L.pilhaMax * L.faixa;
    const wy = L.topo + 64;
    const wh = Math.max(70, Math.min(150, topoTorre - wy - 28));
    const ww = Math.min(W * 0.6, 300);
    janela(ctx, W / 2 - ww / 2, wy, ww, wh);
    // prateleiras nos lados
    const lado = (W - ww) / 2 - 18;
    if (lado > 34) {
      prateleira(ctx, 6, wy + wh * 0.55, lado);
      prateleira(ctx, W - 6 - lado, wy + wh * 0.55, lado);
      if (topoTorre - (wy + wh) > 90) { prateleira(ctx, 6, wy + wh + 70, lado); prateleira(ctx, W - 6 - lado, wy + wh + 70, lado); }
    }
    // rodape
    ctx.fillStyle = '#ff8fab'; ctx.fillRect(0, balcao - 8, W, 8);
    // bancada de marmore
    const fim = L.fila.vertical ? H : Math.min(H, L.fila.y + L.fila.h + L.gap * 3);
    ctx.fillStyle = '#f7f5f2'; ctx.fillRect(0, balcao, W, fim - balcao);
    const rnd = semente(3);
    ctx.strokeStyle = 'rgba(150,150,160,0.28)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 9; k++) {
      const x = rnd() * W, y = balcao + rnd() * (fim - balcao);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 30, y + 10, x + 50, y - 12, x + 90 + rnd() * 40, y + rnd() * 20); ctx.stroke();
    }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, balcao, W, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, balcao + 3, W, 3);
    // armario abaixo
    if (fim < H) {
      ctx.fillStyle = '#ff8fab'; ctx.fillRect(0, fim, W, 10);
      ctx.fillStyle = TINTA; ctx.fillRect(0, fim + 10, W, 2);
      ctx.fillStyle = MENTA; ctx.fillRect(0, fim + 12, W, H - fim - 12);
      const np = Math.max(2, Math.round(W / 130)), pw = (W - 24) / np;
      for (let k = 0; k < np; k++) {
        rr(ctx, 12 + k * pw + 6, fim + 26, pw - 12, H - fim - 40, 10);
        ctx.fillStyle = '#bff0db'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#6fc7a2'; ctx.stroke();
        ctx.fillStyle = '#f2c14e'; circulo(ctx, 12 + k * pw + pw / 2, fim + 40, 4); ctx.fill();
      }
    }
  },

  vivo(ctx, W, H, t) {
    // brilho de acucar no ar
    const rnd = semente(21);
    for (let k = 0; k < 9; k++) {
      const x = rnd() * W, y = 120 + rnd() * H * 0.45, f = rnd() * TAU;
      const a = Math.max(0, Math.sin(t * 1.6 + f));
      if (a < 0.05) continue;
      ctx.globalAlpha = a * 0.8;
      estrela(ctx, x, y, 4 + a * 2, 1.4, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  mesa(ctx, L, e) {
    for (let c = 0; c < L.colunas; c++) {
      const a = L.coluna(c);
      const cx = a.x + a.w / 2, y = L.chao;
      const pw = L.cw * 1.14;
      // pe do prato de bolo
      ctx.beginPath(); ctx.moveTo(cx - 5, y + 3); ctx.lineTo(cx + 5, y + 3); ctx.lineTo(cx + 9, y + 12); ctx.lineTo(cx - 9, y + 12); ctx.closePath();
      ctx.fillStyle = '#fdfbf7'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
      elipse(ctx, cx, y + 12.5, 15, 3.2); ctx.fill(); ctx.stroke();
      rr(ctx, cx - pw / 2, y - 1, pw, 6, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = c % 2 ? MENTA : ROSA; ctx.fillRect(cx - pw / 2 + 3, y + 2, pw - 6, 2);
      if (!e.colunas[c].length) {
        const s = L.carta(c, 0);
        rr(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 6, 8);
        ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(74,47,39,0.4)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.35; cupcake(ctx, s.x + s.w / 2, s.y + s.h * 0.5, 10); ctx.globalAlpha = 1;
      }
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return queimado(ctx, r, carta.hp, op.t || 0);
    if (carta.tipo === 'coringa') return cereja(ctx, r, op);
    if (carta.tipo === 'bomba') return vela(ctx, r, op);
    if (carta.tipo === 'dobro') return fermento(ctx, r, op);
    andar(ctx, carta.v, r, op);
    if (carta.gelo) congelado(ctx, r, carta.v, op.t || 0);
  },

  cadeado(ctx, a) {
    // redoma de vidro com cadeado na base
    const x = a.x - 5, w = a.w + 10, yb = a.y + a.h + 4, topo = a.y - 4, rad = w / 2;
    const domo = () => { ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x, topo + rad); ctx.arc(x + rad, topo + rad, rad, Math.PI, 0); ctx.lineTo(x + w, yb); ctx.closePath(); };
    domo(); ctx.fillStyle = 'rgba(60,40,70,0.28)'; ctx.fill();
    domo(); ctx.fillStyle = 'rgba(220,240,255,0.22)'; ctx.fill();
    domo(); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x + rad, topo + rad, rad - 7, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 7, topo + rad + 8); ctx.lineTo(x + 7, yb - 20); ctx.stroke();
    circulo(ctx, x + rad, topo - 3, 6); ctx.fillStyle = '#eaf6ff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
    rr(ctx, x - 4, yb - 5, w + 8, 8, 4); ctx.fillStyle = '#f2c14e'; ctx.fill(); ctx.stroke();
    const cx = x + rad, cy = yb - a.h * 0.32;
    ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy - 6, 7, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 10, cy - 6, 20, 16, 4); ctx.fillStyle = '#ffcf3f'; ctx.fill(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = TINTA; circulo(ctx, cx, cy + 1, 2.4); ctx.fill();
  },

  descarte(ctx, r, e) {
    // tigela de batedeira
    const cx = r.x + r.w / 2, bw = r.w * 1.2, topo = r.y + r.h * 0.3, fundoY = r.y + r.h + 12;
    const carga = e.descarteCarga > 0;
    ctx.beginPath(); ctx.moveTo(cx - bw / 2, topo); ctx.bezierCurveTo(cx - bw / 2, fundoY + 4, cx + bw / 2, fundoY + 4, cx + bw / 2, topo); ctx.closePath();
    ctx.fillStyle = '#9ad9ea'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; elipse(ctx, cx - bw * 0.22, topo + (fundoY - topo) * 0.4, bw * 0.08, (fundoY - topo) * 0.22); ctx.fill();
    elipse(ctx, cx, topo, bw / 2, 5); ctx.fillStyle = '#c8eef7'; ctx.fill(); ctx.stroke();
    if (carga) {
      elipse(ctx, cx, topo + 1, bw / 2 - 5, 3); ctx.fillStyle = '#fff1c9'; ctx.fill();
      // batedor
      ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 2, topo); ctx.lineTo(cx + bw * 0.36, topo - 26); ctx.stroke();
      for (const k of [-1, 0, 1]) { elipse(ctx, cx + 4 + k * 2, topo - 4, 4 + Math.abs(k), 9, -0.5); ctx.lineWidth = 1.2; ctx.stroke(); }
    }
    rr(ctx, cx - 30, r.y - 24, 60, 17, 6); ctx.fillStyle = carga ? '#fffdf8' : '#e6ddd0'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
    texto(ctx, carga ? 'massa extra' : 'vazia', cx, r.y - 15.5, 10.5, TINTA, { max: 54 });
  },

  fila(ctx, L) {
    const f = L.fila;
    if (f.vertical) {
      rr(ctx, f.x + 2, f.y - 6, f.w - 4, f.h + 12, 12); ctx.fillStyle = '#f6e3c8'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
      for (let k = 0; k < L.tamFila; k++) {
        const p = L.filaPos(k);
        rr(ctx, f.x + 8, p.y + p.h + 1, f.w - 16, 6, 3); ctx.fillStyle = '#c99566'; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
      }
      texto(ctx, 'próximas', f.x + f.w / 2, f.y - 16, 13, TINTA, { contorno: '#ffffff', espessura: 3 });
      return;
    }
    const p0 = L.filaPos(0), pN = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, pN.x) - 20, x1 = Math.max(p0.x + p0.w, pN.x + pN.w) + 20;
    const y = p0.y + p0.h + 2;
    elipse(ctx, (x0 + x1) / 2, y + 3, (x1 - x0) / 2, 12); ctx.fillStyle = '#c9d2d8'; ctx.fill();
    elipse(ctx, (x0 + x1) / 2, y, (x1 - x0) / 2, 11); ctx.fillStyle = '#eef2f5'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#8c99a3'; ctx.stroke();
    elipse(ctx, (x0 + x1) / 2, y, (x1 - x0) / 2 - 10, 6); ctx.strokeStyle = 'rgba(140,153,163,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    texto(ctx, 'próximas camadas ▸', p0.x + p0.w / 2 + 14, p0.y - 14, 12, TINTA, { contorno: '#ffffff', espessura: 3 });
  },

  hud(ctx, W, H, L, e, t) {
    const x = 10, y = 10, w = W - 20, h = 76;
    ctx.save();
    ctx.shadowColor = 'rgba(74,47,39,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 12); ctx.fillStyle = '#b07a4a'; ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, h, 12); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    rr(ctx, x + 6, y + 6, w - 12, h - 12, 8); ctx.fillStyle = '#34443e'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (const [dx, dy] of [[0.2, 0.3], [0.55, 0.7], [0.8, 0.35]]) { elipse(ctx, x + w * dx, y + h * dy, 40, 10, 0.2); ctx.fill(); }
    // pedido
    const giz = '#f4f1e8';
    texto(ctx, 'pedido', x + 38, y + 24, 11, '#cfe9dc');
    texto(ctx, String(e.faseId), x + 38, y + 47, 24, '#ffe08a');
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(244,241,232,0.6)'; ctx.lineWidth = 1.5;
    circulo(ctx, x + 38, y + 40, 24); ctx.stroke(); ctx.setLineDash([]);
    // metas em giz
    const mx = x + 72, mw = w - 72 - 86;
    e.metas.forEach((m, k) => {
      const yy = y + 15 + k * 28;
      texto(ctx, textoMeta(m, { monte: (n) => `Entregue ${n} bolo${n > 1 ? 's' : ''}` }), mx, yy + 4, 12, giz, { alinhar: 'left', max: mw });
      rr(ctx, mx, yy + 12, mw, 8, 4); ctx.strokeStyle = 'rgba(244,241,232,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
      rr(ctx, mx + 1.5, yy + 13.5, Math.max(5, (mw - 3) * Math.min(1, m.atual / m.alvo)), 5, 2.5); ctx.fillStyle = m.feita ? MENTA : ROSA; ctx.fill();
    });
    // pontos
    const px = x + w - 44;
    cupcake(ctx, px, y + 26, 13);
    texto(ctx, String(e.pontos), px, y + 54, 17, giz, { max: 80 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      rr(ctx, W / 2 - 74, y + h + 6, 148, 26, 13); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
      texto(ctx, 'FORNADA x2', W / 2, y + h + 19.5, 17 + k * 2, '#ffffff', { contorno: TINTA, espessura: 3 });
    }
  },

  efeito(fx, P) {
    registrarFormas(P);
    switch (fx.tipo) {
      case 'pouso':
        P.estourar(fx.x, fx.y + 16, ['#ffffff', '#f6efe4', '#fff8ee'], 9, 0.35, { g: 60, vida: 0.55, tam: 9, forma: 'c' });
        return true;
      case 'fusao': {
        const S = sabor(fx.valor);
        P.estourar(fx.x, fx.y, GRANULADO, 12 + fx.degrau * 4, 0.75 + fx.degrau * 0.12, { forma: 'granulado', tam: 9, g: 380 });
        P.estourar(fx.x, fx.y, [S.cob, '#ffffff', clarear(S.borda, 0.4)], 6, 0.5, { forma: 'c', tam: 10, g: 200, vida: 0.5 });
        P.anel(fx.x, fx.y, S.borda, 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 24, 'x' + fx.degrau, '#ffffff', 22 + fx.degrau * 2, '#d94b7b');
        return true;
      }
      case 'completar':
        P.estourar(fx.x, fx.y, [...GRANULADO, '#ffffff'], 46, 1.7, { forma: 'confete', tam: 10, g: 420, vida: 1.0 });
        P.estourar(fx.x, fx.y, ['#ffe08a', '#ffffff'], 14, 1.1, { forma: 'estrela', tam: 12 });
        P.texto(fx.x, fx.y - 30, 'Bolo pronto!', '#ffffff', 28, '#d94b7b');
        return true;
      case 'explodir':
        P.subir(fx.x, fx.y, ['rgba(120,110,105,0.7)', 'rgba(160,150,145,0.6)'], 8, { tam: 16, vida: 0.9, larg: 34, forca: 0.8 });
        P.estourar(fx.x, fx.y, ['#ffd23f', '#ff8a3d', '#ffffff'], 18, 1.2, { forma: 'estrela', tam: 8 });
        return true;
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#2a1d19', '#4a3a33', '#6b5248'], 18, 1.0, { forma: 'migalha', tam: 8 });
        P.estourar(fx.x, fx.y, ['#ff8a3d', '#ffcf6b'], 6, 0.8, { forma: 'c', tam: 4 });
        return true;
      case 'racha':
        P.estourar(fx.x, fx.y, ['#2a1d19', '#4a3a33'], 6, 0.6, { forma: 'migalha', tam: 6 });
        P.subir(fx.x, fx.y, ['rgba(110,100,96,0.6)'], 3, { tam: 10, vida: 0.7 });
        return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#e6f7ff', '#a9dcff', '#ffffff'], 14, 0.8, { forma: 'cristal', tam: 9, g: 180, vida: 0.8 });
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#e8f6ff', '#ffffff', '#ffe08a'], 16, 1.0, { forma: 'cristal', tam: 8 });
        P.texto(fx.x, fx.y - 22, 'Redoma aberta!', '#ffffff', 20, '#2f9e6d');
        return true;
      case 'combo':
        P.texto(fx.x, fx.y - 44, `Combo x${fx.n}!`, '#ffe08a', 22, '#d94b7b');
        return true;
      default: return false;
    }
  },
};

export default tema;
