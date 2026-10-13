// Formas de particula dos mundos (cada tema registra as suas em
// particulas.formas pelo campo `formas`, ver efeitos.js): folha, petala,
// bolha, gota, floco, caco, grao, luz4, risco e anelNeon. Cada forma desenha
// centrada na origem, ja girada por p.rot, com fillStyle = p.cor; recebe p
// inteiro (tam, cor, vx, vy) e u = idade (0..1). Sem shadowBlur: no celular
// ele custa caro por particula; o brilho do neon vem da mistura 'lighter'.
import { TAU, circulo, elipse, estrela, rgba } from './desenho.js';

/** Cor com alfa (hex vira rgba; rgba() fica como esta). */
const alfa = (cor, a) => (typeof cor === 'string' && cor[0] === '#' ? rgba(cor, a) : cor);

/** Folha: elipse com a nervura. */
export function folha(ctx, p) {
  const w = p.tam, h = p.tam * 0.45;
  elipse(ctx, 0, 0, w, h); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = Math.max(0.8, h * 0.25);
  ctx.beginPath(); ctx.moveTo(-w * 0.8, 0); ctx.lineTo(w * 0.8, 0); ctx.stroke();
}

/** Petala: gota arredondada, mais clara no miolo. */
export function petala(ctx, p) {
  const s = p.tam * 0.7;
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s, -s * 0.2, 0, s); ctx.quadraticCurveTo(-s, -s * 0.2, 0, -s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; circulo(ctx, 0, -s * 0.2, s * 0.25); ctx.fill();
}

/** Bolha: contorno com brilho; no fim da vida estoura num anel. */
export function bolha(ctx, p, u) {
  const r0 = p.tam * 0.5 * (1 + u * 0.4);
  if (u > 0.82) {
    const v = (u - 0.82) / 0.18;
    ctx.strokeStyle = alfa(p.cor, 1 - v); ctx.lineWidth = Math.max(0.8, r0 * 0.18 * (1 - v));
    circulo(ctx, 0, 0, r0 * (1 + v * 1.2)); ctx.stroke();
    return;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; circulo(ctx, 0, 0, r0); ctx.fill();
  ctx.strokeStyle = p.cor; ctx.lineWidth = Math.max(0.8, r0 * 0.16); circulo(ctx, 0, 0, r0); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; circulo(ctx, -r0 * 0.35, -r0 * 0.35, r0 * 0.22); ctx.fill();
}

/** Gota: elipse esticada na direcao da velocidade. */
export function gota(ctx, p) {
  ctx.rotate(Math.atan2(p.vy, p.vx));
  elipse(ctx, 0, 0, p.tam * 0.8, p.tam * 0.38); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; elipse(ctx, -p.tam * 0.2, -p.tam * 0.1, p.tam * 0.25, p.tam * 0.12); ctx.fill();
}

/** Floco de neve: seis bracos com galhinhos. */
export function floco(ctx, p) {
  const r = p.tam * 0.6;
  ctx.strokeStyle = p.cor; ctx.lineWidth = Math.max(0.8, r * 0.16); ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU, cx = Math.cos(a), sy = Math.sin(a);
    ctx.moveTo(0, 0); ctx.lineTo(cx * r, sy * r);
    const bx = cx * r * 0.6, by = sy * r * 0.6, b1 = a + 0.6, b2 = a - 0.6, g = r * 0.3;
    ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(b1) * g, by + Math.sin(b1) * g);
    ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(b2) * g, by + Math.sin(b2) * g);
  }
  ctx.stroke();
}

/** Caco de gelo: lasca pontuda com um fio de luz. */
export function caco(ctx, p) {
  const s = p.tam;
  ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(s * 0.35, 0); ctx.lineTo(0, s * 0.7); ctx.lineTo(-s * 0.3, -s * 0.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(0.6, s * 0.08);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(s * 0.35, 0); ctx.stroke();
}

/** Grao de areia: retangulo pequeno e tosco. */
export function grao(ctx, p) {
  const w = p.tam * 0.7, h = p.tam * 0.45;
  ctx.fillRect(-w / 2, -h / 2, w, h);
}

/** Faisca de quatro pontas com halo (neon, com mistura 'lighter'). */
export function luz4(ctx, p) {
  ctx.fillStyle = alfa(p.cor, 0.3); circulo(ctx, 0, 0, p.tam * 0.7); ctx.fill();
  ctx.fillStyle = p.cor; estrela(ctx, 0, 0, p.tam * 0.6, p.tam * 0.14, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; circulo(ctx, 0, 0, p.tam * 0.12); ctx.fill();
}

/** Risco neon: um rastro atras da particula, na direcao da velocidade (sem giro). */
export function risco(ctx, p) {
  const v = Math.hypot(p.vx, p.vy) || 1;
  const L = Math.min(p.tam * 3, v * 0.08);
  const dx = (-p.vx / v) * L, dy = (-p.vy / v) * L;
  const g = ctx.createLinearGradient(0, 0, dx, dy);
  g.addColorStop(0, p.cor); g.addColorStop(1, alfa(p.cor, 0));
  ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, p.tam * 0.3); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dx, dy); ctx.stroke();
  ctx.fillStyle = '#ffffff'; circulo(ctx, 0, 0, p.tam * 0.12); ctx.fill();
}

/** Anel neon que cresce: um halo largo e um fio fino por cima. */
export function anelNeon(ctx, p, u) {
  const r = p.tam * (0.3 + u * 1.4);
  ctx.strokeStyle = alfa(p.cor, 0.35); ctx.lineWidth = Math.max(2, p.tam * 0.3 * (1 - u)); circulo(ctx, 0, 0, r); ctx.stroke();
  ctx.strokeStyle = p.cor; ctx.lineWidth = Math.max(1, p.tam * 0.08 * (1 - u)); circulo(ctx, 0, 0, r); ctx.stroke();
}
