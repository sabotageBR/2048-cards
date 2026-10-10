// Ideia 8: Escavacao de Dinos. As colunas sao quadras de escavacao (barbante
// e estacas) e cada carta e uma laje de arenito com um fossil em relevo.
// Fosseis iguais se juntam num dino maior: ovo -> filhote -> ... -> T-Rex.
// O 2048 e o esqueleto do T-Rex, que vai para o museu.
// Pecas: lajes penduradas (geometria padrao), numero entalhado no alto.
import { TAU, rr, circulo, elipse, texto, escurecer, clarear, rgba, estrela, nivel, textoMeta, semente } from '../kit.js';

const TINTA = '#4a2c18';
const AREIA = '#f2d29b';
const OCRE = '#d9893b';
const TERRACOTA = '#b5543a';
const CACTO = '#6f9e4f';

// cor da insignia (valor) e da laje, de 2 a 4096
const INSIGNIA = ['#4fa8e0', '#6fbf3a', '#f2b134', '#ef6c3a', '#d94f6b', '#9a6bff', '#2fb5a0', '#e0559c', '#4f6fe8', '#14a3b8', '#e83b3b', '#ffcc33'];
const LAJE = ['#f2d9a8', '#ecc993', '#e6b984', '#ddb07c', '#d6a88a', '#cdb79c', '#c2ab92', '#cc9a76', '#b3b5b4', '#bfae98', '#7d6d61', '#f0cf6a'];

// ------------------------------------------------------------ silhuetas

/** Traco grosso arredondado na cor atual. */
function traco(ctx, s, pts, larg) {
  ctx.lineWidth = s * larg; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x * s, y * s));
  ctx.stroke();
}
function poli(ctx, s, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x * s, y * s));
  ctx.closePath(); ctx.fill();
}
function oval(ctx, s, x, y, rx, ry, rot = 0) { elipse(ctx, x * s, y * s, rx * s, ry * s, rot); ctx.fill(); }
function pernas4(ctx, s, xs, y0, y1, larg = 0.13) { for (const x of xs) traco(ctx, s, [[x, y0], [x, y1]], larg); }

/**
 * Silhueta do fossil n (0..11) na origem, escala s (cabe em [-s, s]).
 * Desenha com fillStyle/strokeStyle atuais; `olho` e a cor do olho.
 */
function silhueta(ctx, n, s, olho) {
  ctx.save();
  switch (n) {
    case 0: // ovo
      oval(ctx, s, 0, 0.05, 0.46, 0.6);
      ctx.fillStyle = olho;
      for (const [x, y, r] of [[-0.15, -0.2, 0.07], [0.18, 0.05, 0.06], [-0.05, 0.3, 0.08], [0.2, -0.32, 0.05]]) oval(ctx, s, x, y, r, r);
      break;
    case 1: // filhote saindo do ovo
      ctx.beginPath();
      ctx.moveTo(-0.45 * s, 0.05 * s);
      for (let i = 0; i <= 6; i++) ctx.lineTo((-0.45 + i * 0.15) * s, (i % 2 ? -0.08 : 0.05) * s);
      ctx.ellipse(0, 0.12 * s, 0.45 * s, 0.5 * s, 0, 0, Math.PI);
      ctx.closePath(); ctx.fill();
      oval(ctx, s, 0.02, -0.38, 0.27, 0.25);
      oval(ctx, s, 0.3, -0.3, 0.22, 0.13);
      ctx.fillStyle = olho; oval(ctx, s, 0.1, -0.45, 0.06, 0.06);
      break;
    case 2: // compsognato
      oval(ctx, s, 0, 0.05, 0.36, 0.2, -0.15);
      traco(ctx, s, [[0.22, -0.02], [0.42, -0.36]], 0.13);
      oval(ctx, s, 0.53, -0.42, 0.18, 0.1, 0.1);
      poli(ctx, s, [[-0.25, -0.06], [-0.98, -0.28], [-0.25, 0.16]]);
      traco(ctx, s, [[0.05, 0.18], [0.12, 0.42], [0.02, 0.66], [0.16, 0.68]], 0.08);
      traco(ctx, s, [[-0.12, 0.18], [-0.06, 0.42], [-0.18, 0.66], [-0.04, 0.68]], 0.08);
      traco(ctx, s, [[0.26, 0.04], [0.38, 0.16]], 0.06);
      ctx.fillStyle = olho; oval(ctx, s, 0.56, -0.46, 0.04, 0.04);
      break;
    case 3: // velociraptor
      oval(ctx, s, 0, 0, 0.36, 0.2, -0.25);
      traco(ctx, s, [[0.24, -0.1], [0.42, -0.4]], 0.14);
      poli(ctx, s, [[0.34, -0.52], [0.9, -0.46], [0.9, -0.38], [0.6, -0.34], [0.38, -0.3]]);
      poli(ctx, s, [[-0.22, -0.06], [-0.99, -0.36], [-0.96, -0.26], [-0.22, 0.14]]);
      traco(ctx, s, [[0.02, 0.14], [0.16, 0.42], [0.02, 0.7], [0.2, 0.72]], 0.1);
      traco(ctx, s, [[-0.12, 0.12], [-0.04, 0.42], [-0.18, 0.7], [0, 0.72]], 0.1);
      traco(ctx, s, [[0.3, -0.04], [0.46, 0.12], [0.54, 0.06]], 0.06);
      traco(ctx, s, [[0.2, 0.72], [0.26, 0.62]], 0.05);
      ctx.fillStyle = olho; oval(ctx, s, 0.5, -0.45, 0.045, 0.045);
      break;
    case 4: { // estegossauro
      for (let i = 0; i < 6; i++) {
        const x = -0.42 + i * 0.16, h = 0.24 + Math.sin((i / 5) * Math.PI) * 0.16;
        poli(ctx, s, [[x - 0.08, -0.12], [x, -0.12 - h], [x + 0.08, -0.12]]);
      }
      oval(ctx, s, 0, 0.1, 0.56, 0.3);
      pernas4(ctx, s, [-0.36, -0.16, 0.16, 0.34], 0.2, 0.62, 0.14);
      poli(ctx, s, [[0.45, 0.02], [0.8, 0.28], [0.86, 0.4], [0.7, 0.42], [0.42, 0.24]]);
      poli(ctx, s, [[-0.5, 0], [-1, 0.18], [-0.5, 0.26]]);
      traco(ctx, s, [[-0.86, 0.14], [-0.94, -0.02]], 0.05);
      traco(ctx, s, [[-0.78, 0.12], [-0.82, -0.04]], 0.05);
      ctx.fillStyle = olho; oval(ctx, s, 0.74, 0.32, 0.035, 0.035);
      break;
    }
    case 5: // triceratopo
      oval(ctx, s, -0.12, 0.12, 0.5, 0.3);
      pernas4(ctx, s, [-0.46, -0.28, 0.06, 0.24], 0.22, 0.64, 0.15);
      poli(ctx, s, [[-0.56, 0.02], [-0.98, 0.22], [-0.56, 0.28]]);
      elipse(ctx, 0.46 * s, -0.04 * s, 0.32 * s, 0.36 * s, -0.3); ctx.fill();
      poli(ctx, s, [[0.4, -0.06], [0.82, 0.1], [0.96, 0.26], [0.8, 0.38], [0.44, 0.3]]);
      traco(ctx, s, [[0.58, -0.08], [0.98, -0.42]], 0.07);
      traco(ctx, s, [[0.66, 0.0], [1.0, -0.22]], 0.06);
      traco(ctx, s, [[0.86, 0.12], [0.94, -0.02]], 0.06);
      ctx.fillStyle = olho; oval(ctx, s, 0.66, 0.12, 0.04, 0.04);
      break;
    case 6: { // anquilossauro
      ctx.beginPath(); ctx.ellipse(0, 0.3 * s, 0.62 * s, 0.42 * s, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + ((i + 0.5) / 7) * Math.PI;
        const x = Math.cos(a) * 0.62, y = 0.3 + Math.sin(a) * 0.42;
        poli(ctx, s, [[x - 0.06, y + 0.04], [x * 1.12, y - 0.1], [x + 0.06, y + 0.04]]);
      }
      pernas4(ctx, s, [-0.4, -0.2, 0.2, 0.4], 0.28, 0.58, 0.14);
      poli(ctx, s, [[0.55, 0.12], [0.86, 0.22], [0.86, 0.36], [0.55, 0.32]]);
      traco(ctx, s, [[-0.58, 0.22], [-0.86, 0.12]], 0.09);
      oval(ctx, s, -0.9, 0.1, 0.13, 0.11);
      ctx.fillStyle = olho; oval(ctx, s, 0.76, 0.24, 0.035, 0.035);
      break;
    }
    case 7: // pteranodonte
      ctx.beginPath();
      ctx.moveTo(-0.98 * s, 0.12 * s);
      ctx.quadraticCurveTo(-0.5 * s, -0.36 * s, -0.04 * s, -0.04 * s);
      ctx.quadraticCurveTo(0.5 * s, -0.36 * s, 0.98 * s, 0.12 * s);
      ctx.quadraticCurveTo(0.5 * s, 0.02 * s, 0.1 * s, 0.24 * s);
      ctx.lineTo(-0.1 * s, 0.24 * s);
      ctx.quadraticCurveTo(-0.5 * s, 0.02 * s, -0.98 * s, 0.12 * s);
      ctx.fill();
      oval(ctx, s, 0, 0.12, 0.12, 0.24);
      poli(ctx, s, [[-0.06, -0.24], [0.62, -0.2], [-0.02, -0.08]]);
      poli(ctx, s, [[-0.02, -0.26], [-0.4, -0.5], [-0.08, -0.14]]);
      oval(ctx, s, 0, -0.18, 0.1, 0.09);
      traco(ctx, s, [[-0.04, 0.34], [-0.08, 0.5]], 0.05);
      traco(ctx, s, [[0.04, 0.34], [0.08, 0.5]], 0.05);
      ctx.fillStyle = olho; oval(ctx, s, 0.04, -0.2, 0.03, 0.03);
      break;
    case 8: // espinossauro
      ctx.beginPath(); ctx.moveTo(-0.4 * s, 0.02 * s);
      ctx.bezierCurveTo(-0.32 * s, -0.7 * s, 0.24 * s, -0.7 * s, 0.32 * s, 0.0);
      ctx.closePath(); ctx.fill();
      oval(ctx, s, 0, 0.1, 0.42, 0.24, -0.08);
      poli(ctx, s, [[0.3, -0.06], [0.98, 0.0], [0.96, 0.08], [0.32, 0.14]]);
      poli(ctx, s, [[-0.34, 0.0], [-1, 0.06], [-0.34, 0.22]]);
      traco(ctx, s, [[0.1, 0.28], [0.2, 0.5], [0.08, 0.7], [0.24, 0.72]], 0.12);
      traco(ctx, s, [[-0.12, 0.28], [-0.06, 0.5], [-0.18, 0.7], [-0.02, 0.72]], 0.12);
      traco(ctx, s, [[0.32, 0.12], [0.44, 0.26]], 0.06);
      ctx.fillStyle = olho; oval(ctx, s, 0.46, 0.0, 0.035, 0.035);
      break;
    case 9: // braquiossauro
      oval(ctx, s, -0.08, 0.26, 0.44, 0.24);
      pernas4(ctx, s, [-0.38, -0.2, 0.06, 0.22], 0.34, 0.8, 0.13);
      ctx.beginPath();
      ctx.moveTo(0.16 * s, 0.14 * s);
      ctx.quadraticCurveTo(0.46 * s, -0.2 * s, 0.5 * s, -0.78 * s);
      ctx.lineTo(0.66 * s, -0.78 * s);
      ctx.quadraticCurveTo(0.62 * s, -0.16 * s, 0.36 * s, 0.32 * s);
      ctx.closePath(); ctx.fill();
      oval(ctx, s, 0.66, -0.8, 0.17, 0.09, 0.1);
      poli(ctx, s, [[-0.46, 0.18], [-0.99, 0.42], [-0.44, 0.36]]);
      ctx.fillStyle = olho; oval(ctx, s, 0.68, -0.83, 0.03, 0.03);
      break;
    default: { // 2048 e 4096: T-Rex (com costelas de fossil)
      oval(ctx, s, -0.05, 0.0, 0.38, 0.26, -0.2);
      poli(ctx, s, [[0.22, -0.32], [0.62, -0.46], [0.88, -0.38], [0.92, -0.24], [0.82, -0.14], [0.86, -0.04], [0.52, -0.02], [0.3, 0.02]]);
      poli(ctx, s, [[-0.3, -0.08], [-1, 0.12], [-0.98, 0.2], [-0.3, 0.2]]);
      oval(ctx, s, -0.06, 0.2, 0.18, 0.24);
      traco(ctx, s, [[0.0, 0.36], [0.06, 0.62], [-0.02, 0.78], [0.2, 0.8]], 0.12);
      traco(ctx, s, [[-0.2, 0.3], [-0.2, 0.62], [-0.3, 0.78], [-0.08, 0.8]], 0.1);
      traco(ctx, s, [[0.3, 0.04], [0.42, 0.14]], 0.045);
      ctx.fillStyle = olho;
      oval(ctx, s, 0.64, -0.36, 0.045, 0.045);
      ctx.strokeStyle = olho;
      for (let k = 0; k < 4; k++) traco(ctx, s, [[-0.22 + k * 0.12, -0.14], [-0.26 + k * 0.12, 0.14]], 0.035);
      for (let k = 0; k < 4; k++) traco(ctx, s, [[0.6 + k * 0.07, -0.12], [0.6 + k * 0.07, -0.07]], 0.025);
      break;
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------ pecas

/** Contorno da laje: retangulo arredondado com lascas nos cantos (deterministico por semente). */
function formaLaje(ctx, r, sem) {
  const rnd = semente(sem);
  const x0 = r.x + 1, y0 = r.y + 1, w = r.w - 2, h = r.h - 2, k = Math.min(w, h) * 0.12;
  const j = () => (rnd() - 0.5) * 2.2;
  ctx.beginPath();
  ctx.moveTo(x0 + k, y0 + j() * 0.4);
  ctx.lineTo(x0 + w * 0.45, y0 + j() * 0.6);
  ctx.lineTo(x0 + w - k, y0 + j() * 0.4);
  ctx.quadraticCurveTo(x0 + w, y0, x0 + w + j() * 0.4, y0 + k);
  ctx.lineTo(x0 + w + j() * 0.6, y0 + h * 0.5);
  ctx.lineTo(x0 + w + j() * 0.4, y0 + h - k);
  ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - k, y0 + h + j() * 0.4);
  ctx.lineTo(x0 + w * 0.5, y0 + h + j() * 0.6);
  ctx.lineTo(x0 + k, y0 + h + j() * 0.4);
  ctx.quadraticCurveTo(x0, y0 + h, x0 + j() * 0.4, y0 + h - k);
  ctx.lineTo(x0 + j() * 0.6, y0 + h * 0.5);
  ctx.lineTo(x0 + j() * 0.4, y0 + k);
  ctx.quadraticCurveTo(x0, y0, x0 + k, y0 + j() * 0.4);
  ctx.closePath();
}

/** Laje base (cor, estratos, sombra) e a insignia do topo com o rotulo. */
function laje(ctx, r, cor, sem, rotulo, corInsignia, op) {
  formaLaje(ctx, r, sem);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, clarear(cor, 0.18)); g.addColorStop(1, escurecer(cor, 0.14));
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); formaLaje(ctx, r, sem); ctx.clip();
  // estratos e grao
  const rnd = semente(sem + 3);
  ctx.strokeStyle = rgba(escurecer(cor, 0.3), 0.22); ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const y = r.y + r.h * (0.28 + i * 0.13);
    ctx.beginPath(); ctx.moveTo(r.x, y);
    ctx.bezierCurveTo(r.x + r.w * 0.3, y - 2 + rnd() * 4, r.x + r.w * 0.7, y - 2 + rnd() * 4, r.x + r.w, y + rnd() * 2);
    ctx.stroke();
  }
  ctx.fillStyle = rgba(escurecer(cor, 0.35), 0.25);
  for (let i = 0; i < 14; i++) { circulo(ctx, r.x + rnd() * r.w, r.y + r.h * 0.3 + rnd() * r.h * 0.7, 0.6 + rnd()); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(r.x, r.y, r.w, 3);
  ctx.restore();
  formaLaje(ctx, r, sem); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
  // insignia (faixa de cima: continua visivel com a laje coberta)
  if (rotulo !== null) {
    const ih = Math.max(14, Math.min(r.h * 0.25, 26)), iw = r.w - 8;
    rr(ctx, r.x + 4, r.y + 3, iw, ih, ih * 0.35);
    ctx.fillStyle = corInsignia; ctx.fill();
    ctx.save(); rr(ctx, r.x + 4, r.y + 3, iw, ih, ih * 0.35); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(r.x + 4, r.y + 3, iw, ih * 0.38);
    ctx.restore();
    rr(ctx, r.x + 4, r.y + 3, iw, ih, ih * 0.35); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
    if (rotulo) texto(ctx, rotulo, 0, r.y + 3 + ih / 2 + 0.5, Math.min(ih * 0.92, r.w * 0.36), '#ffffff', { contorno: escurecer(corInsignia, 0.55), espessura: Math.max(2.6, ih * 0.2), max: iw - 6 });
  }
  if (op && op.destaque) {
    formaLaje(ctx, { x: r.x - 3, y: r.y - 3, w: r.w + 6, h: r.h + 6 }, sem);
    ctx.strokeStyle = `rgba(255,248,220,${op.destaque})`; ctx.lineWidth = 3; ctx.stroke();
  }
}

/** Corpo da laje: centro e escala para a silhueta. */
function corpo(r) {
  const ih = Math.max(14, Math.min(r.h * 0.25, 26));
  const topo = r.y + 3 + ih + 3;
  return { cx: 0, cy: (topo + r.y + r.h - 4) / 2, s: Math.min(r.w * 0.42, (r.y + r.h - 4 - topo) * 0.5) };
}

function fossil(ctx, v, r, op) {
  const n = Math.min(11, nivel(v));
  const cor = LAJE[n];
  laje(ctx, r, cor, n * 13 + 7, String(v), INSIGNIA[n], op);
  const c = corpo(r);
  ctx.save();
  ctx.translate(c.cx, c.cy);
  if (n >= 10) {
    // T-Rex: osso claro sobre laje escura (ou dourada no 4096)
    const osso = n === 11 ? '#fff4c2' : '#f4ead7';
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.translate(1.2, 1.4); silhueta(ctx, n, c.s, 'rgba(0,0,0,0.3)'); ctx.translate(-1.2, -1.4);
    ctx.fillStyle = osso; ctx.strokeStyle = osso;
    silhueta(ctx, n, c.s, n === 11 ? '#c08a00' : '#7d6d61');
    if (n === 11) {
      // coroa do mega-T-Rex
      const cx = c.s * 0.6, cy = -c.s * 0.58, w = c.s * 0.42;
      ctx.beginPath(); ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx - w / 2, cy - c.s * 0.2); ctx.lineTo(cx - w / 4, cy - c.s * 0.08);
      ctx.lineTo(cx, cy - c.s * 0.26); ctx.lineTo(cx + w / 4, cy - c.s * 0.08); ctx.lineTo(cx + w / 2, cy - c.s * 0.2); ctx.lineTo(cx + w / 2, cy); ctx.closePath();
      ctx.fillStyle = '#ffdf4a'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
      const brilho = 0.5 + 0.5 * Math.sin((op.t || 0) * 5);
      estrela(ctx, -c.s * 0.6, -c.s * 0.5, c.s * 0.16 * (0.6 + brilho * 0.5), c.s * 0.05, 4); ctx.fillStyle = '#fff'; ctx.fill();
    }
  } else {
    // relevo: luz embaixo-direita, sombra por cima
    ctx.fillStyle = clarear(cor, 0.4); ctx.strokeStyle = clarear(cor, 0.4);
    ctx.translate(1, 1.2); silhueta(ctx, n, c.s, clarear(cor, 0.4)); ctx.translate(-1, -1.2);
    const esc = escurecer(cor, 0.42);
    ctx.fillStyle = esc; ctx.strokeStyle = esc;
    silhueta(ctx, n, c.s, clarear(cor, 0.25));
  }
  ctx.restore();
}

function ambar(ctx, r) {
  // o ambar cobre o corpo da laje e deixa a insignia do numero a vista
  const ih = Math.max(14, Math.min(r.h * 0.25, 26));
  const b = { x: r.x, y: r.y + ih + 5, w: r.w, h: r.h - ih - 5 };
  ctx.save(); formaLaje(ctx, r, 99); ctx.clip();
  rr(ctx, b.x + 2, b.y, b.w - 4, b.h - 2, 6);
  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  g.addColorStop(0, 'rgba(255,190,60,0.72)'); g.addColorStop(1, 'rgba(214,120,20,0.7)');
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#a65a0a'; ctx.stroke();
  rr(ctx, b.x + 2, b.y, b.w - 4, b.h - 2, 6); ctx.clip();
  ctx.strokeStyle = 'rgba(255,245,200,0.75)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.12, b.y + b.h); ctx.lineTo(b.x + b.w * 0.5, b.y); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.32, b.y + b.h); ctx.lineTo(b.x + b.w * 0.68, b.y); ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,200,0.5)';
  for (const [dx, dy, rr0] of [[0.75, 0.6, 2], [0.3, 0.78, 1.5], [0.6, 0.85, 1.2]]) { circulo(ctx, b.x + b.w * dx, b.y + b.h * dy, rr0); ctx.fill(); }
  ctx.restore();
  formaLaje(ctx, r, 99); ctx.lineWidth = 2.4; ctx.strokeStyle = 'rgba(214,120,20,0.9)'; ctx.stroke();
  // mosquito preso
  const mx = r.x + r.w * 0.74, my = b.y + b.h * 0.22;
  ctx.fillStyle = 'rgba(60,30,10,0.85)';
  elipse(ctx, mx, my, 3.4, 1.6, 0.4); ctx.fill();
  circulo(ctx, mx + 3.2, my + 1.3, 1.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  elipse(ctx, mx - 1, my - 3, 2.6, 1.3, -0.6); ctx.fill(); elipse(ctx, mx + 1.4, my - 3, 2.6, 1.3, 0.5); ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.85)'; ctx.lineWidth = 0.8;
  for (const dx of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(mx + dx, my + 1); ctx.lineTo(mx + dx - 1.5, my + 4.5); ctx.stroke(); }
}

function granito(ctx, r, hp) {
  formaLaje(ctx, r, 41);
  ctx.fillStyle = '#9da0a6'; ctx.fill();
  ctx.save(); formaLaje(ctx, r, 41); ctx.clip();
  const rnd = semente(17);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = ['#6c6f76', '#c9ccd2', '#7f6a62', '#e8e8ea'][i % 4];
    circulo(ctx, r.x + rnd() * r.w, r.y + rnd() * r.h, 0.7 + rnd() * 1.4); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(r.x, r.y + r.h * 0.82, r.w, r.h);
  ctx.restore();
  formaLaje(ctx, r, 41); ctx.lineWidth = 2; ctx.strokeStyle = '#3b3b40'; ctx.stroke();
  // pips de hp na faixa de cima
  for (let k = 0; k < 3; k++) {
    circulo(ctx, (k - 1) * 11, r.y + 12, 4);
    ctx.fillStyle = k < hp ? '#ffd23f' : 'rgba(0,0,0,0.4)'; ctx.fill();
    ctx.lineWidth = 1.3; ctx.strokeStyle = '#2e2e33'; ctx.stroke();
  }
  // rachaduras pelo hp perdido
  const perdido = 3 - Math.max(0, Math.min(3, hp));
  const rach = [[-0.3, 0.3, -0.05, 0.55, -0.2, 0.85], [0.3, 0.32, 0.08, 0.6, 0.28, 0.9], [0.0, 0.25, 0.06, 0.45, -0.08, 0.62]];
  ctx.strokeStyle = '#2e2e33'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    ctx.beginPath(); ctx.moveTo(c[0] * r.w, r.y + c[1] * r.h); ctx.lineTo(c[2] * r.w, r.y + c[3] * r.h); ctx.lineTo(c[4] * r.w, r.y + c[5] * r.h); ctx.stroke();
  }
  texto(ctx, 'GRANITO', 0, r.y + r.h * 0.62, Math.min(11, r.w * 0.16), 'rgba(40,40,46,0.55)');
}

function martelo(ctx, r, op) {
  laje(ctx, r, '#f7e2b0', 5, '★', '#ffcc33', op);
  const c = corpo(r), s = c.s;
  ctx.save(); ctx.translate(0, c.cy); ctx.rotate(-0.5 + Math.sin((op.t || 0) * 3) * 0.08);
  rr(ctx, -s * 0.09, -s * 0.5, s * 0.18, s * 1.25, s * 0.06); ctx.fillStyle = '#9b6a3a'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
  rr(ctx, -s * 0.55, -s * 0.72, s * 1.1, s * 0.3, s * 0.08);
  const g = ctx.createLinearGradient(-s * 0.55, 0, s * 0.55, 0);
  g.addColorStop(0, '#ffe680'); g.addColorStop(0.5, '#fff6c8'); g.addColorStop(1, '#e8a800');
  ctx.fillStyle = g; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.55, -s * 0.72); ctx.lineTo(-s * 0.8, -s * 0.57); ctx.lineTo(-s * 0.55, -s * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  const k = 0.5 + 0.5 * Math.sin((op.t || 0) * 6);
  ctx.fillStyle = `hsla(${((op.t || 0) * 120) % 360},90%,70%,0.9)`;
  estrela(ctx, s * 0.55, c.cy - s * 0.55, 3 + k * 3, 1.4, 4); ctx.fill();
}

function dinamite(ctx, r, op) {
  laje(ctx, r, '#e9c99a', 9, 'TNT', '#e83b3b', op);
  const c = corpo(r), s = c.s;
  for (const dx of [-0.36, 0, 0.36]) {
    rr(ctx, dx * s - s * 0.17, c.cy - s * 0.45, s * 0.34, s * 1.0, s * 0.1);
    ctx.fillStyle = '#d93030'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(dx * s - s * 0.12, c.cy - s * 0.42, s * 0.07, s * 0.92);
  }
  rr(ctx, -s * 0.6, c.cy + s * 0.05, s * 1.2, s * 0.14, 2); ctx.fillStyle = '#3a2a1c'; ctx.fill();
  ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, c.cy - s * 0.45); ctx.quadraticCurveTo(s * 0.2, c.cy - s * 0.8, s * 0.45, c.cy - s * 0.7); ctx.stroke();
  const f = 0.6 + 0.4 * Math.abs(Math.sin((op.t || 0) * 20));
  estrela(ctx, s * 0.45, c.cy - s * 0.7, s * 0.24 * f, s * 0.08, 7); ctx.fillStyle = '#ffd23f'; ctx.fill();
  circulo(ctx, s * 0.45, c.cy - s * 0.7, s * 0.07); ctx.fillStyle = '#fff'; ctx.fill();
}

function lupa(ctx, r, op) {
  laje(ctx, r, '#e2edf2', 21, 'x2', '#2fb5a0', op);
  const c = corpo(r), s = c.s;
  ctx.save(); ctx.translate(0, c.cy);
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = s * 0.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.3); ctx.lineTo(s * 0.75, s * 0.75); ctx.stroke();
  circulo(ctx, -s * 0.08, -s * 0.08, s * 0.5); ctx.fillStyle = 'rgba(190,235,255,0.7)'; ctx.fill();
  ctx.lineWidth = s * 0.12; ctx.strokeStyle = '#c9a03a'; ctx.stroke();
  ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; circulo(ctx, -s * 0.08, -s * 0.08, s * 0.57); ctx.stroke();
  texto(ctx, 'x2', -s * 0.08, -s * 0.06, s * 0.52, '#1f6f5f');
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-s * 0.08, -s * 0.08, s * 0.38, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------ cenario

function mesaRocha(ctx, x, y, w, h, faixas) {
  ctx.beginPath();
  ctx.moveTo(x, y + h); ctx.lineTo(x + w * 0.08, y + h * 0.12); ctx.lineTo(x + w * 0.12, y);
  ctx.lineTo(x + w * 0.88, y); ctx.lineTo(x + w * 0.92, y + h * 0.12); ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.save(); ctx.clip();
  faixas.forEach((cor, i) => { ctx.fillStyle = cor; ctx.fillRect(x, y + (i * h) / faixas.length, w, h / faixas.length + 1); });
  ctx.restore();
}

function cacto(ctx, x, y, s) {
  ctx.fillStyle = CACTO; ctx.strokeStyle = escurecer(CACTO, 0.35); ctx.lineWidth = 1.5;
  rr(ctx, x - s * 0.18, y - s, s * 0.36, s, s * 0.18); ctx.fill(); ctx.stroke();
  rr(ctx, x - s * 0.55, y - s * 0.7, s * 0.26, s * 0.36, s * 0.13); ctx.fill(); ctx.stroke();
  rr(ctx, x - s * 0.55, y - s * 0.44, s * 0.45, s * 0.16, s * 0.08); ctx.fill();
  rr(ctx, x + s * 0.3, y - s * 0.82, s * 0.26, s * 0.42, s * 0.13); ctx.fill(); ctx.stroke();
  rr(ctx, x + s * 0.1, y - s * 0.5, s * 0.42, s * 0.16, s * 0.08); ctx.fill();
}

const tema = {
  id: 'dinos',
  nome: 'Escavação de Dinos',
  cores: { texto: TINTA, destaque: '#ffd23f', particulas: [AREIA, OCRE, '#fff1c2', TERRACOTA] },
  faixas: (W, H) => ({ topo: W > H ? 92 : 104, base: 0 }),

  fundo(ctx, W, H, L) {
    const horiz = Math.round(Math.min(L.mesa.y - 6, H * 0.36));
    const g = ctx.createLinearGradient(0, 0, 0, horiz);
    g.addColorStop(0, '#5fb6f0'); g.addColorStop(1, '#bfe6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sol
    ctx.fillStyle = 'rgba(255,244,190,0.45)'; circulo(ctx, W * 0.82, L.topo + 46, 44); ctx.fill();
    ctx.fillStyle = '#fff1a6'; circulo(ctx, W * 0.82, L.topo + 46, 26); ctx.fill();
    // mesas de rocha ao longe (estratos)
    mesaRocha(ctx, -W * 0.05, horiz - 70, W * 0.42, 74, ['#e7a873', '#d98c5a', '#e7a873', '#c9714a']);
    mesaRocha(ctx, W * 0.55, horiz - 96, W * 0.5, 100, ['#e9b07c', '#d5834f', '#c56a42', '#e2a06c', '#b85a3a']);
    mesaRocha(ctx, W * 0.3, horiz - 44, W * 0.3, 48, ['#eebd8a', '#d99760', '#c97b4c']);
    // chao de areia com dunas
    const gc = ctx.createLinearGradient(0, horiz, 0, H);
    gc.addColorStop(0, '#f4d9a4'); gc.addColorStop(1, '#e2b877');
    ctx.fillStyle = gc; ctx.fillRect(0, horiz, W, H - horiz);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 4; i++) { elipse(ctx, W * (0.1 + i * 0.3), horiz + 14 + (i % 2) * 10, W * 0.2, 6); ctx.fill(); }
    const rnd = semente(23);
    ctx.fillStyle = 'rgba(150,95,45,0.22)';
    for (let i = 0; i < 70; i++) { circulo(ctx, rnd() * W, horiz + 20 + rnd() * (H - horiz), 1 + rnd() * 2); ctx.fill(); }
    // barraca e cactos
    if (L.mesa.x > 90 || W <= H) {
      const bx = W <= H ? W * 0.12 : L.mesa.x * 0.45, by = horiz + 8, bs = W <= H ? 34 : 56;
      ctx.fillStyle = '#e9ddc0'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx - bs, by); ctx.lineTo(bx, by - bs * 0.9); ctx.lineTo(bx + bs, by); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.moveTo(bx - bs * 0.25, by); ctx.lineTo(bx, by - bs * 0.55); ctx.lineTo(bx + bs * 0.25, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9483a'; ctx.fillRect(bx - 1, by - bs * 1.25, 2, bs * 0.4); ctx.beginPath(); ctx.moveTo(bx + 1, by - bs * 1.25); ctx.lineTo(bx + 12, by - bs * 1.15); ctx.lineTo(bx + 1, by - bs * 1.05); ctx.fill();
    }
    cacto(ctx, W * 0.93, horiz + 16, 26);
    cacto(ctx, W * 0.05, H - 30, 30);
    // carrinho de mao
    const cx = W <= H ? W * 0.84 : W - 70, cy = H - (W <= H ? 70 : 60);
    ctx.fillStyle = '#4f7fb3'; ctx.strokeStyle = TINTA; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 34, cy - 18); ctx.lineTo(cx + 24, cy - 18); ctx.lineTo(cx + 14, cy + 2); ctx.lineTo(cx - 24, cy + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c9925a'; elipse(ctx, cx - 5, cy - 19, 26, 7); ctx.fill();
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + 18, cy - 14); ctx.lineTo(cx + 44, cy - 26); ctx.stroke();
    circulo(ctx, cx - 22, cy + 8, 8); ctx.fillStyle = '#333'; ctx.fill();
  },

  vivo(ctx, W, H, t) {
    // nuvens e um pteranodonte ao longe
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 3; i++) {
      const x = ((i * 173 + t * (6 + i * 3)) % (W + 140)) - 70, y = 130 + i * 28;
      elipse(ctx, x, y, 34, 9); ctx.fill(); circulo(ctx, x - 8, y - 6, 11); ctx.fill(); circulo(ctx, x + 10, y - 8, 13); ctx.fill();
    }
    const px = ((t * 22) % (W + 120)) - 60, py = 150 + Math.sin(t * 0.8) * 14, bat = Math.sin(t * 6) * 0.35;
    ctx.save(); ctx.translate(px, py); ctx.fillStyle = 'rgba(80,60,70,0.55)';
    ctx.beginPath(); ctx.moveTo(-14, -bat * 10); ctx.quadraticCurveTo(-6, -4, 0, 0); ctx.quadraticCurveTo(6, -4, 14, -bat * 10); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(8, 0); ctx.lineTo(0, 1.5); ctx.fill();
    ctx.restore();
  },

  mesa(ctx, L, e) {
    // cova escavada
    const m = L.mesa;
    ctx.save();
    rr(ctx, m.x - 4, m.y - 4, m.w + 8, m.h + 8, 14); ctx.fillStyle = '#c9925a'; ctx.fill();
    rr(ctx, m.x, m.y, m.w, m.h, 12);
    const g = ctx.createLinearGradient(0, m.y, 0, m.y + m.h);
    g.addColorStop(0, '#8a5a34'); g.addColorStop(0.18, '#b07a48'); g.addColorStop(1, '#c48c56');
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    const rnd = semente(31);
    ctx.fillStyle = 'rgba(80,45,20,0.25)';
    for (let i = 0; i < 40; i++) { elipse(ctx, m.x + rnd() * m.w, m.y + rnd() * m.h, 1.5 + rnd() * 3, 1 + rnd() * 2); ctx.fill(); }
    ctx.restore();
    rr(ctx, m.x, m.y, m.w, m.h, 12); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    // barbante e estacas entre as colunas
    const yb = m.y + 5;
    const xs = [m.x + 4];
    for (let c = 1; c < L.colunas; c++) { const a = L.coluna(c); xs.push(a.x - L.gap / 2); }
    xs.push(L.descarteNaMesa ? L.descarte.x - L.gap / 2 : m.x + m.w - 4);
    if (L.descarteNaMesa) xs.push(m.x + m.w - 4);
    ctx.strokeStyle = '#f5f0e0'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(xs[0], yb); ctx.lineTo(xs[xs.length - 1], yb); ctx.stroke();
    for (const x of xs) {
      ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x, m.y + m.h - 6); ctx.globalAlpha = 0.55; ctx.stroke(); ctx.globalAlpha = 1;
      rr(ctx, x - 3, yb - 12, 6, 16, 2); ctx.fillStyle = '#c89a5c'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.strokeStyle = '#f5f0e0'; ctx.lineWidth = 1.4;
      ctx.fillStyle = '#e8483a'; ctx.fillRect(x - 3, yb - 12, 6, 3);
    }
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      rr(ctx, s.x + 3, s.y + 3, s.w - 6, s.h - 6, 8);
      ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(255,240,210,0.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      // pincel
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.6);
      ctx.fillStyle = 'rgba(255,240,210,0.45)'; rr(ctx, -2.5, -16, 5, 20, 2); ctx.fill(); rr(ctx, -5, 3, 10, 10, 3); ctx.fill();
      ctx.restore();
    }
  },

  peca(ctx, carta, r, op) {
    if (carta.tipo === 'pedra') return granito(ctx, r, carta.hp);
    if (carta.tipo === 'coringa') return martelo(ctx, r, op);
    if (carta.tipo === 'bomba') return dinamite(ctx, r, op);
    if (carta.tipo === 'dobro') return lupa(ctx, r, op);
    fossil(ctx, carta.v, r, op);
    if (carta.gelo) ambar(ctx, r);
  },

  cadeado(ctx, a, c, e, t) {
    ctx.save();
    rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 8); ctx.fillStyle = 'rgba(60,35,20,0.45)'; ctx.fill();
    // fitas zebradas
    for (const [yy, rot] of [[a.y + a.h * 0.3, -0.12], [a.y + a.h * 0.62, 0.1]]) {
      ctx.save(); ctx.translate(a.x + a.w / 2, yy); ctx.rotate(rot);
      const w = a.w + 16, h = 12;
      rr(ctx, -w / 2, -h / 2, w, h, 2); ctx.save(); ctx.clip();
      for (let k = -w; k < w; k += 10) { ctx.fillStyle = (k / 10) % 2 ? '#1f1f1f' : '#ffd23f'; ctx.beginPath(); ctx.moveTo(k, -h); ctx.lineTo(k + 10, -h); ctx.lineTo(k + 2, h); ctx.lineTo(k - 8, h); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.restore();
    }
    texto(ctx, 'ÁREA', a.x + a.w / 2, a.y + a.h * 0.44, Math.min(11, a.w * 0.2), '#ffd23f', { contorno: '#1f1f1f', espessura: 3 });
    texto(ctx, 'RESTRITA', a.x + a.w / 2, a.y + a.h * 0.44 + 12, Math.min(10, a.w * 0.15), '#ffd23f', { contorno: '#1f1f1f', espessura: 3 });
    // cones
    for (const dx of [0.2, 0.8]) {
      const cx = a.x + a.w * dx, cy = a.y + a.h - 2;
      ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx, cy - 20); ctx.lineTo(cx + 8, cy); ctx.closePath();
      ctx.fillStyle = '#ff7a1f'; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 4.5, cy - 11, 9, 3);
      ctx.fillStyle = '#ff7a1f'; rr(ctx, cx - 10, cy - 2, 20, 4, 1); ctx.fill(); ctx.stroke();
    }
    // cadeado
    const cx = a.x + a.w / 2, cy = a.y + a.h * 0.16 + 8;
    ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy - 4, 6.5, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - 9, cy - 4, 18, 14, 3); ctx.fillStyle = '#ffcf3f'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = TINTA; circulo(ctx, cx, cy + 2, 2); ctx.fill();
    ctx.restore();
  },

  descarte(ctx, r, e) {
    // balde de terra
    const carga = e.descarteCarga > 0;
    const cx = r.x + r.w / 2, base = r.y + r.h * 0.92, topo = r.y + r.h * 0.36, w0 = r.w * 0.78, w1 = r.w * 0.6;
    ctx.save();
    if (!carga) ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#6b6f76'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, topo, w0 * 0.42, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w0 / 2, topo); ctx.lineTo(cx + w0 / 2, topo); ctx.lineTo(cx + w1 / 2, base); ctx.lineTo(cx - w1 / 2, base); ctx.closePath();
    const g = ctx.createLinearGradient(cx - w0 / 2, 0, cx + w0 / 2, 0);
    g.addColorStop(0, '#9aa3ad'); g.addColorStop(0.5, '#d7dde3'); g.addColorStop(1, '#8a929c');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = '#9b6a3e'; elipse(ctx, cx, topo, w0 / 2, 5); ctx.fill();
    if (!carga) { ctx.fillStyle = '#9b6a3e'; elipse(ctx, cx, topo - 5, w0 * 0.36, 8); ctx.fill(); }
    ctx.restore();
    texto(ctx, carga ? 'balde ↩' : 'cheio', cx, r.y + r.h * 0.66, Math.min(11, r.w * 0.18), TINTA);
  },

  fila(ctx, L) {
    // caixote de achados
    const f = L.fila;
    if (f.vertical) {
      rr(ctx, f.x + 2, f.y - 6, f.w - 4, f.h + 12, 10); ctx.fillStyle = '#b98652'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.strokeStyle = 'rgba(74,44,24,0.45)'; ctx.lineWidth = 1.5;
      for (let y = f.y + 30; y < f.y + f.h; y += 34) { ctx.beginPath(); ctx.moveTo(f.x + 6, y); ctx.lineTo(f.x + f.w - 6, y); ctx.stroke(); }
      texto(ctx, 'achados', f.x + f.w / 2, f.y - 16, 12, '#fff6e0', { contorno: TINTA, espessura: 3 });
      return;
    }
    const p0 = L.filaPos(0), p2 = L.filaPos(L.tamFila - 1);
    const x0 = Math.min(p0.x, p2.x) - 14, x1 = Math.max(p0.x + p0.w, p2.x + p2.w) + 14;
    const y0 = p0.y + p0.h * 0.45, y1 = p0.y + p0.h + 10;
    rr(ctx, x0, y0, x1 - x0, y1 - y0, 6); ctx.fillStyle = '#b98652'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.strokeStyle = 'rgba(74,44,24,0.45)'; ctx.lineWidth = 1.5;
    for (let k = 1; k < 3; k++) { const y = y0 + ((y1 - y0) * k) / 3; ctx.beginPath(); ctx.moveTo(x0 + 4, y); ctx.lineTo(x1 - 4, y); ctx.stroke(); }
    texto(ctx, 'ACHADOS', (x0 + x1) / 2, y1 - 9, 11, 'rgba(74,44,24,0.75)');
    texto(ctx, 'próximo ▸', p0.x + p0.w / 2, p0.y - 12, 12, '#fff6e0', { contorno: TINTA, espessura: 3 });
  },

  hud(ctx, W, H, L, e, t) {
    const paisagem = W > H;
    const x = 10, y = 12, w = W - 20, h = paisagem ? 70 : 82;
    // prancheta
    ctx.save();
    ctx.shadowColor = 'rgba(60,30,10,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    rr(ctx, x, y, w, h, 10); ctx.fillStyle = '#a8743f'; ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, h, 10); ctx.lineWidth = 2; ctx.strokeStyle = TINTA; ctx.stroke();
    rr(ctx, x + 6, y + 8, w - 12, h - 12, 4); ctx.fillStyle = '#fffaf0'; ctx.fill();
    ctx.strokeStyle = 'rgba(79,168,224,0.35)'; ctx.lineWidth = 1;
    for (let yy = y + 26; yy < y + h - 6; yy += 13) { ctx.beginPath(); ctx.moveTo(x + 10, yy); ctx.lineTo(x + w - 10, yy); ctx.stroke(); }
    // prendedor
    rr(ctx, x + w / 2 - 26, y - 6, 52, 14, 4); ctx.fillStyle = '#b8bec6'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#555a62'; ctx.stroke();
    // sitio
    texto(ctx, `Sítio ${e.faseId}`, x + 16, y + 26, paisagem ? 18 : 17, TERRACOTA, { alinhar: 'left' });
    texto(ctx, 'caderno de campo', x + 16, y + 44, 10, 'rgba(74,44,24,0.55)', { alinhar: 'left' });
    // metas
    const mx = x + (paisagem ? 190 : 106), mw = w - (paisagem ? 190 : 106) - (paisagem ? 120 : 84);
    e.metas.forEach((m, k) => {
      const yy = y + 18 + k * 26;
      rr(ctx, mx, yy - 6, 11, 11, 2); ctx.lineWidth = 1.4; ctx.strokeStyle = TINTA; ctx.stroke();
      if (m.feita) { ctx.strokeStyle = '#3e9a2e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(mx + 2, yy); ctx.lineTo(mx + 5, yy + 3); ctx.lineTo(mx + 11, yy - 6); ctx.stroke(); }
      texto(ctx, textoMeta(m, { monte: (n) => 'Leve ' + n + ' T-Rex ao museu' }), mx + 16, yy, 11.5, TINTA, { alinhar: 'left', max: mw - 16 });
      rr(ctx, mx + 16, yy + 8, mw - 16, 6, 3); ctx.fillStyle = '#ead9b8'; ctx.fill();
      rr(ctx, mx + 16, yy + 8, Math.max(6, (mw - 16) * Math.min(1, m.atual / m.alvo)), 6, 3); ctx.fillStyle = m.feita ? CACTO : OCRE; ctx.fill();
    });
    // pontos com ossinho
    const px = x + w - (paisagem ? 60 : 44);
    ctx.save(); ctx.translate(px, y + 26); ctx.rotate(-0.35);
    ctx.fillStyle = '#f4ead7'; ctx.strokeStyle = TINTA; ctx.lineWidth = 1.4;
    rr(ctx, -12, -3, 24, 6, 3); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) for (const k of [-1, 1]) { circulo(ctx, s * 12, k * 3.2, 3.6); ctx.fill(); ctx.stroke(); }
    rr(ctx, -11, -2, 22, 4, 2); ctx.fill();
    ctx.restore();
    texto(ctx, String(e.pontos), px, y + 54, 17, TINTA, { max: 80 });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 10);
      texto(ctx, 'ACHADO x2!', W / 2, y + h + 20, 21 + k * 3, '#ffd23f', { contorno: TERRACOTA, espessura: 5 });
    }
  },

  efeito(fx, P) {
    if (!P.formas.osso) {
      P.formas.osso = (ctx, p) => {
        const s = p.tam / 2;
        ctx.fillRect(-s, -s * 0.22, s * 2, s * 0.44);
        for (const a of [-1, 1]) for (const b of [-1, 1]) { circulo(ctx, a * s, b * s * 0.28, s * 0.32); ctx.fill(); }
      };
      P.formas.gota = (ctx, p) => {
        const s = p.tam / 2;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s, 0, 0, s); ctx.quadraticCurveTo(-s, 0, 0, -s); ctx.fill();
      };
      P.formas.flash = (ctx, p, u) => {
        ctx.globalAlpha *= 1 - u;
        estrela(ctx, 0, 0, p.tam, p.tam * 0.18, 4); ctx.fill();
        circulo(ctx, 0, 0, p.tam * 0.3); ctx.fill();
      };
    }
    switch (fx.tipo) {
      case 'pouso': P.estourar(fx.x, fx.y + 18, [AREIA, '#e6c48c', '#d8b077'], 8, 0.4, { g: 160, vida: 0.5, tam: 6, forma: 'c' }); return true;
      case 'fusao':
        P.estourar(fx.x, fx.y, ['#ffd23f', '#fff1a6', OCRE], 10 + fx.degrau * 3, 0.7 + fx.degrau * 0.14, { forma: 'c', tam: 5, g: 380 });
        P.estourar(fx.x, fx.y, ['#a39b8c', '#c9925a'], 5, 0.6, { forma: 'q', tam: 5 });
        P.estourar(fx.x, fx.y, ['#f4ead7'], 1 + Math.min(3, fx.degrau), 0.7, { forma: 'osso', tam: 12, g: 420 });
        P.anel(fx.x, fx.y, '#fff1a6', 26 + fx.degrau * 6);
        if (fx.degrau > 1) P.texto(fx.x, fx.y - 26, 'x' + fx.degrau, '#ffd23f', 22 + fx.degrau * 2, TINTA);
        return true;
      case 'completar':
        for (let k = 0; k < 5; k++) P.add({ forma: 'flash', x: fx.x + (k - 2) * 26, y: fx.y - 30 - (k % 2) * 30, vida: 0.35 + k * 0.08, tam: 22, cor: '#ffffff' });
        P.estourar(fx.x, fx.y, ['#f4ead7'], 8, 1.4, { forma: 'osso', tam: 14 });
        P.estourar(fx.x, fx.y, ['#ffd23f', '#ffffff', OCRE], 30, 1.5, { forma: 'estrela', tam: 10 });
        P.texto(fx.x, fx.y - 36, 'Pro museu!', '#ffffff', 30, TERRACOTA);
        return true;
      case 'explodir':
        P.estourar(fx.x, fx.y, ['#8a5a34', '#b07a48', '#5a3a20'], 24, 1.4, { forma: 'q', tam: 8 });
        P.subir(fx.x, fx.y, ['rgba(220,190,150,0.8)', 'rgba(190,160,120,0.8)'], 8, { tam: 16, vida: 0.8, larg: 40 });
        P.estourar(fx.x, fx.y, ['#ffd23f', '#ff7a1f'], 10, 1.1, { forma: 'estrela', tam: 9 });
        return true;
      case 'pedra': P.estourar(fx.x, fx.y, ['#9da0a6', '#6c6f76', '#c9ccd2'], 18, 1.2, { forma: 'q', tam: 7 }); return true;
      case 'racha': P.estourar(fx.x, fx.y, ['#9da0a6', '#c9ccd2'], 7, 0.6, { forma: 'q', tam: 5 }); return true;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#ffbe3c', '#e08a14', '#fff0c0'], 14, 0.8, { forma: 'gota', tam: 9, g: 420 });
        P.texto(fx.x, fx.y - 20, 'Livre do âmbar!', '#ffe08a', 16, '#7a3f06');
        return true;
      case 'cadeado':
        P.estourar(fx.x, fx.y, ['#ffd23f', '#1f1f1f'], 14, 1, { forma: 'q', tam: 8 });
        P.texto(fx.x, fx.y - 20, 'Área liberada!', '#ffd23f', 18, '#1f1f1f');
        return true;
      case 'combo': P.texto(fx.x, fx.y - 44, `Combo x${fx.n}!`, '#ffd23f', 22, TINTA); return true;
      default: return false;
    }
  },
};

export default tema;
