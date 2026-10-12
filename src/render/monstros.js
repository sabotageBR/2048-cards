// Monstros do duelo, desenhados no canvas (sem imagens). Uma especie por
// reino: Gosmo (lodo), Golem (pedra), Yeti (gelo), Espectro (corrente) e
// Dragao (tudo). Cada especie e uma funcao (ctx, def, R, t, pose) com a
// origem nos pes; desenharMonstro cuida da posicao, da escala (o chefao e
// maior), da aura, do tremor do golpe e do corpo que encolhe e estica no ataque.
// m = { x, y, R }: centro, linha dos pes e raio. Caixa: 2.1R acima dos pes, +-1.15R.
// pose = { golpe (0..1, 1 = sem golpe), derrotado, ataque (0..1, 1 = parado), furia,
//   espanto (0..1: olhos arregalados e boca em O; com o golpe vira careta de dor) }
// monstroDaFase escolhe a especie pelo mundo e a variante (cor, chifres,
// acessorio, apelido) pela posicao no mundo; a posicao 8 e o chefao de coroa.
// monstroDaCadeia faz o mesmo para o monstro n do Classico e do Diario.
import { TINTA, OURO, TAU, circulo, elipse, misturar, escurecer, rgba, semente, clamp } from './desenho.js';

const lw0 = (R) => Math.max(2, R * 0.045);

/** Curva do ataque (u 0..1): prepara (encolhe) ate 45%, solta (estica, boca aberta) e volta. */
export function curvaAtaque(u) {
  if (!(u >= 0) || u >= 1) return { prep: 0, solta: 0 };
  if (u < 0.45) return { prep: Math.sin((u / 0.45) * Math.PI / 2), solta: 0 };
  if (u < 0.58) { const k = (u - 0.45) / 0.13; return { prep: 1 - k, solta: k }; }
  if (u < 0.8) return { prep: 0, solta: 1 };
  return { prep: 0, solta: 1 - (u - 0.8) / 0.2 };
}

// ------------------------------------------------------------ partes comuns

/** Corpo avermelhado na furia (depois do preenchimento, antes do rosto). */
function tingir(ctx, corpo, pose, t) {
  if (!pose.furia || pose.derrotado) return;
  corpo(); ctx.fillStyle = `rgba(255,30,40,${0.16 + 0.08 * Math.sin(t * 7)})`; ctx.fill();
}

/** Clarao branco do golpe, por cima de tudo. */
function clarao(ctx, corpo, pose) {
  if (pose.golpe < 1) { corpo(); ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - pose.golpe)})`; ctx.fill(); }
}

/**
 * Olhos e sobrancelhas. f: { R, ox, oy, rx, ry, estilo: 'desenho'|'brilho'|'reptil', brava?, sobrancelha? }
 */
function olhos(ctx, def, f, pose, t, lw) {
  const { R } = f;
  const piscar = (t + (def.pos || 0) * 0.7) % 4.2 < 0.12;
  const brava = f.brava || pose.furia;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of [-1, 1]) {
    const ox = s * f.ox, oy = f.oy;
    if (pose.derrotado) {
      const k = Math.min(f.rx, f.ry) * 0.62;
      ctx.strokeStyle = f.estilo === 'brilho' ? '#e9e2f5' : TINTA; ctx.lineWidth = lw * 1.15;
      ctx.beginPath(); ctx.moveTo(ox - k, oy - k); ctx.lineTo(ox + k, oy + k); ctx.moveTo(ox + k, oy - k); ctx.lineTo(ox - k, oy + k); ctx.stroke();
      continue;
    }
    if (pose.golpe < 1) {
      ctx.strokeStyle = f.estilo === 'brilho' ? '#ffffff' : TINTA; ctx.lineWidth = lw * 1.15;
      ctx.beginPath(); ctx.moveTo(ox - s * f.rx * 0.67, oy - f.ry * 0.5); ctx.lineTo(ox + s * f.rx * 0.48, oy); ctx.lineTo(ox - s * f.rx * 0.67, oy + f.ry * 0.5); ctx.stroke();
      continue;
    }
    if (f.estilo === 'brilho') {
      const cor = pose.furia ? '#ff4a4a' : def.olho || '#ffe066';
      ctx.save();
      ctx.shadowColor = cor; ctx.shadowBlur = R * 0.3;
      const e = 1 + (pose.espanto || 0) * 0.25;
      elipse(ctx, ox, oy, f.rx * e, f.ry * e * (piscar && !pose.espanto ? 0.12 : 1), brava && !pose.espanto ? s * 0.3 : 0); ctx.fillStyle = cor; ctx.fill();
      ctx.restore();
      if (!piscar) { elipse(ctx, ox - s * f.rx * 0.2, oy - f.ry * 0.25, f.rx * 0.32, f.ry * 0.24); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); }
      continue;
    }
    // espanto: o branco cresce e a pupila encolhe
    const esp = pose.espanto || 0;
    const rx = f.rx * (1 + esp * 0.22), ry = f.ry * (1 + esp * 0.22), pk = 1 - esp * 0.45;
    elipse(ctx, ox, oy, rx, ry); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = TINTA; ctx.stroke();
    if (piscar && !esp) {
      ctx.fillStyle = def.piscar || def.corA; elipse(ctx, ox, oy, f.rx * 1.05, f.ry * 1.04); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ox - f.rx * 0.86, oy); ctx.lineTo(ox + f.rx * 0.86, oy); ctx.stroke();
    } else if (f.estilo === 'reptil') {
      elipse(ctx, ox + s * f.rx * 0.08, oy + f.ry * 0.12, f.rx * 0.72 * pk, f.ry * 0.8 * pk); ctx.fillStyle = pose.furia ? '#ff3b3b' : def.olho || '#ffd23f'; ctx.fill();
      elipse(ctx, ox + s * f.rx * 0.08, oy + f.ry * 0.12, f.rx * 0.17 * pk, f.ry * 0.7 * pk); ctx.fillStyle = '#1a0d22'; ctx.fill();
      circulo(ctx, ox + s * f.rx * 0.3, oy - f.ry * 0.2, f.rx * 0.16); ctx.fillStyle = '#fff'; ctx.fill();
    } else {
      const px = ox + s * f.rx * 0.14 * (1 - esp), py = oy + f.ry * 0.32 * (1 - esp), pr = f.rx * 0.52 * pk;
      if (pose.furia) { circulo(ctx, px, py, pr * 1.35); ctx.fillStyle = '#ff3b3b'; ctx.fill(); }
      circulo(ctx, px, py, pr); ctx.fillStyle = '#1a0d22'; ctx.fill();
      circulo(ctx, px + f.rx * 0.19, py - f.ry * 0.16, pr * 0.32); ctx.fillStyle = '#fff'; ctx.fill();
    }
    if (f.sobrancelha !== false) {
      ctx.strokeStyle = TINTA; ctx.lineWidth = Math.max(lw * 0.85, R * 0.07);
      // no espanto as sobrancelhas sobem e se erguem no meio
      const yi = esp ? oy - ry * 1.62 : brava ? oy - f.ry * 0.82 : oy - f.ry * 1.44;
      const ye = esp ? oy - ry * 1.38 : brava ? oy - f.ry * 1.5 : oy - f.ry * 0.96;
      ctx.beginPath(); ctx.moveTo(ox - s * f.rx * 0.95, yi); ctx.lineTo(ox + s * f.rx * 0.67, ye); ctx.stroke();
    }
  }
}

/**
 * Boca: crescente com presas; abre no ataque (aberta 0..1) e entorta na derrota.
 * f: { R, by, bl, presas?, presasBaixo? }
 */
function boca(ctx, f, pose, lw) {
  const { R, by, bl } = f;
  if (pose.espanto > 0 && !pose.derrotado && !(pose.aberta > 0.15)) { bocaO(ctx, f, pose.espanto, lw); return; }
  const aberta = pose.derrotado ? 0 : pose.aberta;
  const baixo = pose.derrotado ? by - R * 0.08 : by + R * (0.24 + aberta * 0.34);
  const cima = by + R * (0.12 - aberta * 0.1);
  const forma = () => { ctx.beginPath(); ctx.moveTo(-bl, by); ctx.quadraticCurveTo(0, baixo, bl, by); ctx.quadraticCurveTo(0, cima, -bl, by); ctx.closePath(); };
  forma(); ctx.fillStyle = '#3a0f3e'; ctx.fill();
  if (aberta > 0.15) {
    ctx.save(); forma(); ctx.clip();
    elipse(ctx, 0, (by + baixo) / 2 + R * 0.1 * aberta, bl * 0.55, R * 0.14 * aberta); ctx.fillStyle = '#e8456a'; ctx.fill();
    ctx.restore();
  }
  forma(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = TINTA; ctx.stroke();
  // labio de cima numa posicao x (curva de Bezier simetrica)
  const yCima = (x) => by + (cima - by) * (1 - (x / bl) ** 2) / 2;
  const yBaixo = (x) => by + (baixo - by) * (1 - (x / bl) ** 2) / 2;
  ctx.fillStyle = '#fff';
  if (f.presas !== false && !pose.derrotado) {
    for (const [xc, w, h] of [[0.4, 0.36, 0.12], [-0.42, 0.28, 0.09]]) {
      const x0 = bl * (xc - w / 2), x1 = bl * (xc + w / 2);
      ctx.beginPath(); ctx.moveTo(x0, yCima(x0)); ctx.lineTo(bl * xc, yCima(bl * xc) + R * h); ctx.lineTo(x1, yCima(x1)); ctx.closePath(); ctx.fill();
    }
  }
  if (f.presasBaixo && !pose.derrotado) {
    for (const s of [-1, 1]) {
      const xc = s * bl * 0.62, w = bl * 0.3;
      ctx.beginPath(); ctx.moveTo(xc - w / 2, yBaixo(xc - w / 2) + R * 0.02); ctx.lineTo(xc + s * w * 0.15, yBaixo(xc) - R * 0.2); ctx.lineTo(xc + w / 2, yBaixo(xc + w / 2) + R * 0.02); ctx.closePath();
      ctx.fill(); ctx.lineWidth = lw * 0.5; ctx.strokeStyle = TINTA; ctx.stroke();
    }
  }
}

/** Boca em O do espanto (e 0..1 abre), com a lingua e as duas presas de cima. */
function bocaO(ctx, f, e, lw) {
  const { R, by, bl } = f;
  const rx = bl * (0.36 + 0.14 * e), ry = R * (0.1 + 0.13 * e), cy = by + ry * 0.55;
  elipse(ctx, 0, cy, rx, ry); ctx.fillStyle = '#3a0f3e'; ctx.fill();
  ctx.save(); elipse(ctx, 0, cy, rx, ry); ctx.clip();
  elipse(ctx, 0, cy + ry * 0.75, rx * 0.7, ry * 0.5); ctx.fillStyle = '#e8456a'; ctx.fill();
  ctx.restore();
  elipse(ctx, 0, cy, rx, ry); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = TINTA; ctx.stroke();
  if (f.presas === false) return;
  ctx.fillStyle = '#fff';
  for (const s of [-1, 1]) {
    const x = s * rx * 0.45, y = cy - ry * 0.93;
    ctx.beginPath(); ctx.moveTo(x - rx * 0.18, y); ctx.lineTo(x, y + ry * 0.42); ctx.lineTo(x + rx * 0.18, y); ctx.closePath(); ctx.fill();
  }
}

/**
 * Acessorio da variante (preso ao corpo pelo recorte). f: { R, ox, oy, rx, ry, testa, lado, orelha }
 */
function acessorio(ctx, def, f, corpo, lw) {
  const { R } = f;
  switch (def.acessorio) {
    case 'tapaolho': {
      ctx.save(); corpo(); ctx.clip();
      ctx.strokeStyle = '#1d1420'; ctx.lineWidth = R * 0.07;
      ctx.beginPath(); ctx.moveTo(-R * 1.4, f.oy - R * 0.8); ctx.lineTo(R * 1.4, f.oy + R * 0.3); ctx.stroke();
      ctx.restore();
      elipse(ctx, f.ox, f.oy, f.rx * 1.15, f.ry * 1.05); ctx.fillStyle = '#1d1420'; ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = TINTA; ctx.stroke();
      elipse(ctx, f.ox - f.rx * 0.3, f.oy - f.ry * 0.35, f.rx * 0.25, f.ry * 0.15); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
      break;
    }
    case 'bandana': {
      const y = f.testa, h = R * 0.2;
      ctx.save(); corpo(); ctx.clip();
      ctx.fillStyle = def.bandana || '#e2384d'; ctx.fillRect(-R * 2, y - h / 2, R * 4, h);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let x = -R * 1.2; x < R * 1.2; x += R * 0.22) { circulo(ctx, x, y + ((x / R * 7) % 2 > 1 ? -h * 0.18 : h * 0.18), R * 0.025); ctx.fill(); }
      ctx.strokeStyle = TINTA; ctx.lineWidth = lw * 0.6;
      ctx.beginPath(); ctx.moveTo(-R * 2, y - h / 2); ctx.lineTo(R * 2, y - h / 2); ctx.moveTo(-R * 2, y + h / 2); ctx.lineTo(R * 2, y + h / 2); ctx.stroke();
      ctx.restore();
      // no na lateral, com as pontas soltas
      const x = f.lado;
      ctx.fillStyle = def.bandana || '#e2384d'; ctx.strokeStyle = TINTA; ctx.lineWidth = lw * 0.6;
      for (const [a, k] of [[0.5, 1], [1.1, 0.8]]) {
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + R * 0.18, y + R * 0.05 * a, x + R * 0.28 * k, y + R * 0.3 * a);
        ctx.lineTo(x + R * 0.16 * k, y + R * 0.3 * a); ctx.quadraticCurveTo(x + R * 0.08, y + R * 0.1, x, y + h * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      circulo(ctx, x, y, R * 0.08); ctx.fill(); ctx.stroke();
      break;
    }
    case 'cicatriz': {
      const x0 = -f.ox - f.rx * 0.9, y0 = f.oy - f.ry * 1.7, x1 = -f.ox + f.rx * 0.6, y1 = f.oy + f.ry * 1.6;
      ctx.strokeStyle = '#c23a5a'; ctx.lineWidth = Math.max(1.5, R * 0.04); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.lineWidth = Math.max(1, R * 0.025);
      for (const k of [0.2, 0.5, 0.8]) {
        const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
        ctx.beginPath(); ctx.moveTo(x - R * 0.06, y - R * 0.02); ctx.lineTo(x + R * 0.06, y + R * 0.02); ctx.stroke();
      }
      break;
    }
    case 'brinco': {
      const o = f.orelha;
      ctx.strokeStyle = TINTA; ctx.lineWidth = R * 0.055;
      circulo(ctx, o.x, o.y + R * 0.1, R * 0.1); ctx.stroke();
      ctx.strokeStyle = OURO; ctx.lineWidth = R * 0.03; ctx.stroke();
      circulo(ctx, o.x, o.y + R * 0.2, R * 0.045); ctx.fillStyle = '#4ad7ff'; ctx.fill(); ctx.lineWidth = lw * 0.4; ctx.strokeStyle = TINTA; ctx.stroke();
      break;
    }
    default: break;
  }
}

/** Coroa do chefao: cinco pontas, faixa com joias. */
function coroa(ctx, x, y, w, lw, inclina = 0) {
  const h = w * 0.62;
  ctx.save(); ctx.translate(x, y); ctx.rotate(inclina);
  const pontas = [[-0.5, 0.72], [-0.25, 0.86], [0, 1], [0.25, 0.86], [0.5, 0.72]];
  ctx.beginPath(); ctx.moveTo(-w / 2, 0);
  pontas.forEach(([px, ph], i) => {
    ctx.lineTo(px * w, -h * ph);
    if (i < pontas.length - 1) ctx.lineTo((px + 0.125) * w, -h * 0.36);
  });
  ctx.lineTo(w / 2, 0); ctx.closePath();
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, '#fff1a8'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#d99a12');
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = lw * 0.75; ctx.strokeStyle = TINTA; ctx.stroke();
  ctx.fillStyle = '#c98a10'; ctx.fillRect(-w / 2, -h * 0.24, w, h * 0.24);
  ctx.strokeRect(-w / 2, -h * 0.24, w, h * 0.24);
  for (const [px, ph] of pontas) { circulo(ctx, px * w, -h * ph, w * 0.05); ctx.fillStyle = '#fff6c8'; ctx.fill(); ctx.stroke(); }
  for (const [px, cor] of [[-0.3, '#4ad7ff'], [0, '#ef4466'], [0.3, '#4ad7ff']]) {
    elipse(ctx, px * w, -h * 0.12, w * 0.065, h * 0.085); ctx.fillStyle = cor; ctx.fill(); ctx.lineWidth = lw * 0.4; ctx.stroke();
  }
  ctx.restore();
}

/** Vapor saindo da cabeca na furia. */
function vapor(ctx, x, y, R, t) {
  for (let i = 0; i < 4; i++) {
    const u = (t * 0.9 + i / 4) % 1;
    const s = i % 2 ? 1 : -1;
    circulo(ctx, x + s * R * (0.4 + u * 0.35), y - u * R * 0.55, R * (0.07 + u * 0.12));
    ctx.fillStyle = `rgba(255,240,240,${0.6 * (1 - u)})`; ctx.fill();
  }
}

/** Elo de corrente (Espectro). */
function elo(ctx, x, y, ang, s, cheio) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (cheio) { elipse(ctx, 0, 0, 7 * s, 2.6 * s); ctx.fillStyle = '#8b93a3'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); }
  else { elipse(ctx, 0, 0, 7 * s, 4.5 * s); ctx.lineWidth = 3 * s; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); ctx.lineWidth = 1.6 * s; ctx.strokeStyle = '#c3cad6'; ctx.stroke(); }
  ctx.restore();
}

// ------------------------------------------------------------- especies

/** Gosmo: gosma com chifres (prototipo do duelo). Cospe lodo. */
function gosmo(ctx, def, R, t, pose) {
  const resp = Math.sin(t * 2.3);
  const lw = lw0(R);
  ctx.save();
  ctx.scale(1 - resp * 0.035, 1 + resp * 0.045);
  const corpo = () => {
    ctx.beginPath();
    ctx.moveTo(-R * 1.05, 0);
    ctx.bezierCurveTo(-R * 1.15, -R * 0.95, -R * 0.62, -R * 1.62, 0, -R * 1.62);
    ctx.bezierCurveTo(R * 0.62, -R * 1.62, R * 1.15, -R * 0.95, R * 1.05, 0);
    ctx.quadraticCurveTo(R * 0.85, R * 0.1, R * 0.62, -R * 0.02);
    ctx.quadraticCurveTo(R * 0.45, R * 0.12, R * 0.25, 0);
    ctx.quadraticCurveTo(0, R * 0.1, -R * 0.3, 0);
    ctx.quadraticCurveTo(-R * 0.55, R * 0.12, -R * 0.75, -R * 0.02);
    ctx.quadraticCurveTo(-R * 0.92, R * 0.08, -R * 1.05, 0);
    ctx.closePath();
  };
  if (def.chifres) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * R * 0.32, -R * 1.45);
      ctx.quadraticCurveTo(s * R * 0.55, -R * 2.05, s * R * 0.9, -R * 2.0);
      ctx.quadraticCurveTo(s * R * 0.62, -R * 1.78, s * R * 0.62, -R * 1.32);
      ctx.closePath();
      ctx.fillStyle = def.chifre || '#f3e3c3'; ctx.fill(); ctx.lineWidth = lw * 0.85; ctx.strokeStyle = TINTA; ctx.stroke();
    }
  }
  corpo();
  const g = ctx.createLinearGradient(0, -R * 1.6, 0, 0);
  g.addColorStop(0, def.corA); g.addColorStop(1, def.corB);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  tingir(ctx, corpo, pose, t);
  // gotas de gosma escorrendo
  ctx.fillStyle = rgba(def.corB, 0.9);
  for (const [x, k] of [[-0.62, 0.2], [0.42, 0.55]]) {
    const u = (t * 0.35 + k) % 1;
    elipse(ctx, x * R, -R * 0.1 + u * R * 0.12, R * 0.05, R * (0.07 + u * 0.05)); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; elipse(ctx, -R * 0.48, -R * 1.18, R * 0.24, R * 0.14, -0.6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; circulo(ctx, -R * 0.2, -R * 1.38, R * 0.06); ctx.fill();
  const f = { R, ox: R * 0.36, oy: -R * 0.88, rx: R * 0.21, ry: R * 0.25, estilo: 'desenho', by: -R * 0.42, bl: R * 0.36, testa: -R * 1.22, lado: R * 0.88, orelha: { x: R * 0.98, y: -R * 0.6 } };
  olhos(ctx, def, f, pose, t, lw);
  boca(ctx, f, pose, lw);
  acessorio(ctx, def, f, corpo, lw);
  if (def.chefe) coroa(ctx, R * 0.06, -R * 1.56, R * 0.66, lw, 0.08);
  if (pose.furia && !pose.derrotado) vapor(ctx, 0, -R * 1.5, R, t);
  clarao(ctx, corpo, pose);
  ctx.restore();
}

/** Golem: pedra viva com runa no peito e punhos de rocha. Lanca pedras. */
function golem(ctx, def, R, t, pose) {
  const lw = lw0(R);
  const rnd = semente(31 + (def.pos || 0) * 7);
  const corpo = () => {
    ctx.beginPath();
    ctx.moveTo(-R * 0.8, -R * 0.08);
    ctx.lineTo(-R * 0.92, -R * 0.55);
    ctx.quadraticCurveTo(-R * 1.0, -R * 1.22, -R * 0.62, -R * 1.52);
    ctx.quadraticCurveTo(-R * 0.12, -R * 1.82, R * 0.48, -R * 1.62);
    ctx.quadraticCurveTo(R * 1.0, -R * 1.32, R * 0.94, -R * 0.58);
    ctx.lineTo(R * 0.8, -R * 0.08);
    ctx.quadraticCurveTo(0, R * 0.02, -R * 0.8, -R * 0.08);
    ctx.closePath();
  };
  const pedraG = (y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, def.corA); g.addColorStop(1, def.corB); return g; };
  // pes de bloco
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.roundRect(s * R * 0.45 - R * 0.26, -R * 0.24, R * 0.52, R * 0.26, R * 0.08);
    ctx.fillStyle = def.corB; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  }
  // cristais na cabeca (os "chifres" do golem)
  if (def.chifres) {
    for (const [x, a, h] of [[-0.42, -0.35, 0.42], [-0.12, -0.08, 0.36], [0.3, 0.3, 0.32]]) {
      ctx.save(); ctx.translate(x * R, -R * 1.58 - Math.abs(x) * R * 0.05); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-R * 0.1, R * 0.05); ctx.lineTo(-R * 0.08, -R * h * 0.75); ctx.lineTo(0, -R * h); ctx.lineTo(R * 0.08, -R * h * 0.75); ctx.lineTo(R * 0.1, R * 0.05); ctx.closePath();
      ctx.fillStyle = def.cristal || '#7ff3ff'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R * 0.03, 0); ctx.lineTo(-R * 0.03, -R * h * 0.7); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = lw * 0.5; ctx.stroke();
      ctx.restore();
    }
  }
  corpo(); ctx.fillStyle = pedraG(-R * 1.7, 0); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  tingir(ctx, corpo, pose, t);
  // rachaduras e musgo
  ctx.save(); corpo(); ctx.clip();
  ctx.strokeStyle = rgba(escurecer(def.corB, 0.45), 0.7); ctx.lineWidth = Math.max(1, R * 0.025);
  for (let i = 0; i < 4; i++) {
    let x = (rnd() - 0.5) * R * 1.5, y = -R * (0.2 + rnd() * 1.3);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 3; k++) { x += (rnd() - 0.5) * R * 0.3; y += R * (0.08 + rnd() * 0.1); ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.fillStyle = def.musgo || '#6fb34a';
  for (const [x, y, rx] of [[-0.5, -1.5, 0.28], [0.1, -1.72, 0.22], [0.62, -1.45, 0.18]]) { elipse(ctx, x * R, y * R, rx * R, rx * R * 0.55); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; elipse(ctx, -R * 0.45, -R * 1.2, R * 0.22, R * 0.12, -0.5); ctx.fill();
  // sobrancelha de pedra (a testa projeta sombra sobre os olhos)
  ctx.fillStyle = rgba(escurecer(def.corB, 0.55), 0.85);
  ctx.beginPath(); ctx.moveTo(-R * 1.1, -R * 1.26); ctx.lineTo(R * 1.1, -R * 1.26); ctx.lineTo(R * 1.1, -R * 1.0); ctx.quadraticCurveTo(0, -R * 0.9, -R * 1.1, -R * 1.0); ctx.closePath(); ctx.fill();
  ctx.restore();
  // runa do peito
  const runa = pose.furia ? '#ff4a4a' : def.olho || '#ffd23f';
  ctx.save(); ctx.shadowColor = runa; ctx.shadowBlur = R * (0.2 + 0.1 * Math.sin(t * 3));
  ctx.strokeStyle = runa; ctx.lineWidth = Math.max(1.5, R * 0.05);
  ctx.beginPath(); ctx.moveTo(0, -R * 0.75); ctx.lineTo(R * 0.16, -R * 0.52); ctx.lineTo(0, -R * 0.3); ctx.lineTo(-R * 0.16, -R * 0.52); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -R * 0.68); ctx.lineTo(0, -R * 0.37); ctx.stroke();
  ctx.restore();
  // rosto
  const f = { R, ox: R * 0.32, oy: -R * 1.12, rx: R * 0.14, ry: R * 0.09, estilo: 'brilho', by: -R * 0.82, bl: R * 0.3, presas: false, presasBaixo: true, testa: -R * 1.4, lado: R * 0.88, orelha: { x: R * 0.9, y: -R * 1.1 } };
  olhos(ctx, def, f, pose, t, lw);
  boca(ctx, f, pose, lw);
  acessorio(ctx, def, f, corpo, lw);
  // bracos: sobem na preparacao e batem ao soltar
  for (const s of [-1, 1]) {
    const ombro = { x: s * R * 0.78, y: -R * 1.2 };
    const repouso = { x: s * R * 0.98, y: -R * 0.42 + Math.sin(t * 1.6 + s) * R * 0.02 };
    const alto = { x: s * R * 0.92, y: -R * 1.72 };
    const baixo = { x: s * R * 0.78, y: -R * 0.3 };
    const k = pose.derrotado ? 0 : pose.prep;
    const p = { x: repouso.x + (alto.x - repouso.x) * k + (baixo.x - repouso.x) * pose.aberta, y: repouso.y + (alto.y - repouso.y) * k + (baixo.y - repouso.y) * pose.aberta };
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ombro.x, ombro.y); ctx.lineTo(p.x, p.y); ctx.strokeStyle = TINTA; ctx.lineWidth = R * 0.34 + lw * 2; ctx.stroke();
    ctx.strokeStyle = def.corB; ctx.lineWidth = R * 0.34; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(p.x - R * 0.24, p.y - R * 0.22, R * 0.48, R * 0.44, R * 0.14);
    ctx.fillStyle = pedraG(p.y - R * 0.22, p.y + R * 0.22); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.lineWidth = lw * 0.5;
    for (const dx of [-0.08, 0.06]) { ctx.beginPath(); ctx.moveTo(p.x + dx * R, p.y - R * 0.2); ctx.lineTo(p.x + dx * R, p.y - R * 0.05); ctx.stroke(); }
  }
  if (def.chefe) coroa(ctx, -R * 0.08, -R * 1.7, R * 0.68, lw, -0.06);
  if (pose.furia && !pose.derrotado) vapor(ctx, 0, -R * 1.6, R, t);
  clarao(ctx, corpo, pose);
}

/** Yeti: bola de pelo com chifres de carneiro e presas. Congela o topo. */
function yeti(ctx, def, R, t, pose) {
  const lw = lw0(R);
  const resp = Math.sin(t * 2);
  ctx.save();
  ctx.scale(1 - resp * 0.02, 1 + resp * 0.03);
  const cy = -R * 0.9, rx = R * 0.98, ry = R * 0.9;
  const N = 18;
  const corpo = () => {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = Math.PI / 2 + (i / N) * TAU;
      const x = Math.cos(a) * rx * 0.94, y = cy + Math.sin(a) * ry * 0.94;
      const am = Math.PI / 2 + ((i - 0.5) / N) * TAU;
      const yb = Math.min(-R * 0.02, cy + Math.sin(am) * ry * 1.06);
      if (i === 0) ctx.moveTo(x, Math.min(-R * 0.02, y));
      else ctx.quadraticCurveTo(Math.cos(am) * rx * 1.06, yb, x, Math.min(-R * 0.02, y));
    }
    ctx.closePath();
  };
  // bracos peludos: sobem no rugido
  const k = pose.derrotado ? 0 : Math.max(pose.prep, pose.aberta);
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * R * 0.82, -R * 0.95); ctx.rotate(s * (0.5 + k * 1.9));
    elipse(ctx, 0, R * 0.32, R * 0.2, R * 0.38); ctx.fillStyle = def.corB; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
    elipse(ctx, 0, R * 0.62, R * 0.15, R * 0.11); ctx.fillStyle = def.pele || '#9db7d8'; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // pes
  for (const s of [-1, 1]) { elipse(ctx, s * R * 0.42, -R * 0.06, R * 0.3, R * 0.12); ctx.fillStyle = escurecer(def.pele || '#9db7d8', 0.15); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke(); }
  corpo();
  const g = ctx.createLinearGradient(0, -R * 1.8, 0, 0);
  g.addColorStop(0, def.corA); g.addColorStop(1, def.corB);
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  tingir(ctx, corpo, pose, t);
  elipse(ctx, 0, -R * 0.42, R * 0.48, R * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
  // chifres de carneiro
  if (def.chifres) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * R * 0.42, -R * 1.62);
      ctx.bezierCurveTo(s * R * 0.9, -R * 2.1, s * R * 1.2, -R * 1.6, s * R * 0.98, -R * 1.3);
      ctx.bezierCurveTo(s * R * 0.86, -R * 1.14, s * R * 0.7, -R * 1.3, s * R * 0.8, -R * 1.42);
      ctx.strokeStyle = TINTA; ctx.lineWidth = R * 0.17 + lw * 2; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = def.chifre || '#e8d2a6'; ctx.lineWidth = R * 0.17; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,90,50,0.45)'; ctx.lineWidth = Math.max(1, R * 0.02);
      for (const u of [0.25, 0.45, 0.65]) {
        const x = s * R * (0.42 + u * 0.7), y = -R * (1.62 + Math.sin(u * Math.PI) * 0.28);
        ctx.beginPath(); ctx.moveTo(x - s * R * 0.04, y - R * 0.07); ctx.lineTo(x + s * R * 0.04, y + R * 0.07); ctx.stroke();
      }
    }
  }
  // mascara do rosto
  const mascara = () => elipse(ctx, 0, -R * 1.02, R * 0.56, R * 0.46);
  mascara(); ctx.fillStyle = def.pele || '#9db7d8'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = TINTA; ctx.stroke();
  const f = { R, ox: R * 0.23, oy: -R * 1.12, rx: R * 0.14, ry: R * 0.16, estilo: 'desenho', brava: true, by: -R * 0.84, bl: R * 0.28, presas: false, presasBaixo: true, testa: -R * 1.42, lado: R * 0.9, orelha: { x: R * 0.6, y: -R * 0.95 } };
  olhos(ctx, def, f, pose, t, lw);
  boca(ctx, f, pose, lw);
  acessorio(ctx, def, f, corpo, lw);
  if (def.chefe) coroa(ctx, 0, -R * 1.66, R * 0.66, lw, 0.05);
  if (pose.furia && !pose.derrotado) vapor(ctx, 0, -R * 1.6, R, t);
  clarao(ctx, corpo, pose);
  ctx.restore();
}

/** Espectro: capuz flutuante com olhos acesos e correntes. Tranca colunas. */
function espectro(ctx, def, R, t, pose) {
  const lw = lw0(R);
  const sobe = pose.derrotado ? R * 0.02 : -R * (0.12 + Math.sin(t * 2) * 0.05 + pose.prep * 0.14);
  ctx.save();
  ctx.translate(0, sobe);
  const onda = (k) => Math.sin(t * 3 + k * 1.7) * R * 0.05;
  const corpo = () => {
    ctx.beginPath();
    ctx.moveTo(R * 0.12, -R * 1.95);
    ctx.bezierCurveTo(R * 0.6, -R * 1.88, R * 0.8, -R * 1.45, R * 0.78, -R * 1.05);
    ctx.bezierCurveTo(R * 0.88, -R * 0.7, R * 1.05, -R * 0.4, R * 1.0, -R * 0.05);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const x0 = R * (1.0 - (2 * (i + 1)) / n);
      const xm = R * (1.0 - (2 * (i + 0.5)) / n);
      ctx.quadraticCurveTo(xm, -R * 0.24 + onda(i), x0, -R * 0.05 + onda(i + 0.5) * 0.6);
    }
    ctx.bezierCurveTo(-R * 1.05, -R * 0.4, -R * 0.88, -R * 0.7, -R * 0.78, -R * 1.05);
    ctx.bezierCurveTo(-R * 0.8, -R * 1.5, -R * 0.4, -R * 1.92, R * 0.12, -R * 1.95);
    ctx.closePath();
  };
  // chifres espectrais
  if (def.chifres) {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * R * 0.3, -R * 1.72);
      ctx.quadraticCurveTo(s * R * 0.62, -R * 1.92, s * R * 0.72, -R * 2.08);
      ctx.quadraticCurveTo(s * R * 0.5, -R * 1.72, s * R * 0.55, -R * 1.5); ctx.closePath();
      ctx.fillStyle = def.chifre || '#2a1d3a'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = TINTA; ctx.stroke();
    }
  }
  ctx.save();
  ctx.shadowColor = def.olho || '#7ff3ff'; ctx.shadowBlur = R * 0.25;
  corpo();
  const g = ctx.createLinearGradient(0, -R * 1.95, 0, 0);
  g.addColorStop(0, def.corA); g.addColorStop(1, rgba(def.corB, 0.88));
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  corpo(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  tingir(ctx, corpo, pose, t);
  // dobras do manto
  ctx.save(); corpo(); ctx.clip();
  ctx.strokeStyle = rgba(escurecer(def.corB, 0.4), 0.5); ctx.lineWidth = Math.max(1, R * 0.03);
  for (const x of [-0.45, 0, 0.45]) { ctx.beginPath(); ctx.moveTo(x * R * 0.8, -R * 0.95); ctx.quadraticCurveTo(x * R * 1.05, -R * 0.5, x * R * 1.1, -R * 0.1); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; elipse(ctx, -R * 0.42, -R * 1.45, R * 0.12, R * 0.25, 0.4); ctx.fill();
  ctx.restore();
  // rosto escuro dentro do capuz
  elipse(ctx, 0, -R * 1.22, R * 0.43, R * 0.4); ctx.fillStyle = '#120818'; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = TINTA; ctx.stroke();
  const f = { R, ox: R * 0.17, oy: -R * 1.26, rx: R * 0.1, ry: R * 0.12, estilo: 'brilho', brava: true, by: -R * 1.02, bl: R * 0.14, testa: -R * 1.62, lado: R * 0.7, orelha: { x: R * 0.78, y: -R * 1.1 } };
  olhos(ctx, def, f, pose, t, lw);
  // lamento: boca acesa so no ataque
  if (pose.aberta > 0.1 && !pose.derrotado) {
    ctx.save(); ctx.shadowColor = def.olho || '#7ff3ff'; ctx.shadowBlur = R * 0.2;
    elipse(ctx, 0, -R * 1.03, R * 0.09, R * 0.11 * pose.aberta); ctx.fillStyle = rgba(def.olho || '#7ff3ff', 0.9); ctx.fill();
    ctx.restore();
  }
  // corrente atravessada
  const s = clamp(R / 78, 0.5, 1.4);
  const a = { x: -R * 0.82, y: -R * 0.98 }, b = { x: R * 0.86, y: -R * 0.36 };
  const n = 9, ang = Math.atan2(b.y - a.y, b.x - a.x);
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    elo(ctx, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + Math.sin(k * Math.PI) * R * 0.12, ang, s, i % 2 === 1);
  }
  acessorio(ctx, def, f, corpo, lw);
  // maos que se erguem no ataque
  for (const sd of [-1, 1]) {
    const k = pose.derrotado ? 0 : Math.max(pose.prep, pose.aberta);
    const x = sd * R * (0.98 - k * 0.1), y = -R * (0.72 + k * 0.62);
    ctx.save(); ctx.translate(x, y); ctx.rotate(sd * (0.3 - k * 0.5));
    if (k > 0.2) { ctx.shadowColor = def.olho || '#7ff3ff'; ctx.shadowBlur = R * 0.3 * k; }
    ctx.fillStyle = def.mao || '#d8d0ef'; ctx.lineWidth = lw * 0.6; ctx.strokeStyle = TINTA;
    for (const d of [-1, 0, 1]) { elipse(ctx, d * R * 0.075, -R * 0.12 + Math.abs(d) * R * 0.03, R * 0.04, R * 0.075, d * 0.35); ctx.fill(); ctx.stroke(); }
    elipse(ctx, 0, 0, R * 0.12, R * 0.1); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (def.chefe) coroa(ctx, R * 0.08, -R * 1.9, R * 0.56, lw, 0.12);
  if (pose.furia && !pose.derrotado) vapor(ctx, 0, -R * 1.75, R, t);
  clarao(ctx, corpo, pose);
  ctx.restore();
}

/** Dragao: dragaozinho de barriga listrada, asas e fumaca. Mistura os feiticos. */
function dragao(ctx, def, R, t, pose) {
  const lw = lw0(R);
  const resp = Math.sin(t * 2.1);
  const barriga = def.barriga || '#ffe2a8';
  ctx.save();
  ctx.scale(1 - resp * 0.02, 1 + resp * 0.03);
  const corpo = () => { elipse(ctx, 0, -R * 0.72, R * 0.82, R * 0.72); };
  const cabeca = () => { elipse(ctx, 0, -R * 1.38, R * 0.62, R * 0.45); };
  const tudo = () => { ctx.beginPath(); ctx.ellipse(0, -R * 0.72, R * 0.82, R * 0.72, 0, 0, TAU); ctx.moveTo(R * 0.62, -R * 1.38); ctx.ellipse(0, -R * 1.38, R * 0.62, R * 0.45, 0, 0, TAU); };
  // asas atras
  const bate = Math.sin(t * 3) * R * 0.06 - pose.prep * R * 0.18;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * R * 0.45, -R * 1.12);
    ctx.quadraticCurveTo(s * R * 0.85, -R * 1.62 + bate, s * R * 1.12, -R * 1.72 + bate);
    ctx.quadraticCurveTo(s * R * 1.0, -R * 1.42, s * R * 1.14, -R * 1.18);
    ctx.quadraticCurveTo(s * R * 0.98, -R * 1.08, s * R * 1.08, -R * 0.86);
    ctx.quadraticCurveTo(s * R * 0.85, -R * 0.9, s * R * 0.62, -R * 0.78);
    ctx.closePath();
    ctx.fillStyle = escurecer(def.corB, 0.15); ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.strokeStyle = rgba(TINTA, 0.5); ctx.lineWidth = lw * 0.6;
    ctx.beginPath(); ctx.moveTo(s * R * 0.5, -R * 1.08); ctx.lineTo(s * R * 1.06, -R * 1.2); ctx.moveTo(s * R * 0.5, -R * 1.02); ctx.lineTo(s * R * 1.0, -R * 0.9); ctx.stroke();
  }
  // cauda
  ctx.beginPath(); ctx.moveTo(R * 0.55, -R * 0.2);
  ctx.quadraticCurveTo(R * 1.1, -R * 0.08, R * 1.02, -R * 0.52);
  ctx.lineWidth = R * 0.2 + lw * 2; ctx.strokeStyle = TINTA; ctx.lineCap = 'round'; ctx.stroke();
  ctx.lineWidth = R * 0.2; ctx.strokeStyle = def.corB; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(R * 0.92, -R * 0.52); ctx.lineTo(R * 1.04, -R * 0.78); ctx.lineTo(R * 1.13, -R * 0.5); ctx.closePath();
  ctx.fillStyle = def.chifre || '#ffd9a0'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = TINTA; ctx.stroke();
  // pes com garras
  for (const s of [-1, 1]) {
    elipse(ctx, s * R * 0.42, -R * 0.08, R * 0.28, R * 0.13); ctx.fillStyle = def.corB; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.fillStyle = '#fff';
    for (const d of [-1, 0, 1]) { const x = s * R * 0.42 + d * R * 0.1; ctx.beginPath(); ctx.moveTo(x - R * 0.035, -R * 0.0); ctx.lineTo(x, R * 0.04); ctx.lineTo(x + R * 0.035, -R * 0.0); ctx.fill(); }
  }
  // corpo
  corpo();
  const g = ctx.createLinearGradient(0, -R * 1.5, 0, 0);
  g.addColorStop(0, def.corA); g.addColorStop(1, def.corB);
  ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  // barriga listrada
  ctx.save(); elipse(ctx, 0, -R * 0.58, R * 0.5, R * 0.5); ctx.fillStyle = barriga; ctx.fill(); ctx.clip();
  ctx.strokeStyle = rgba(escurecer(barriga, 0.35), 0.7); ctx.lineWidth = Math.max(1, R * 0.03);
  for (let y = -R * 0.95; y < 0; y += R * 0.15) { ctx.beginPath(); ctx.moveTo(-R * 0.6, y); ctx.quadraticCurveTo(0, y + R * 0.05, R * 0.6, y); ctx.stroke(); }
  ctx.restore();
  elipse(ctx, 0, -R * 0.58, R * 0.5, R * 0.5); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = TINTA; ctx.stroke();
  // bracinhos
  for (const s of [-1, 1]) {
    const k = pose.derrotado ? 0 : pose.prep;
    elipse(ctx, s * R * 0.66, -R * (0.82 + k * 0.2), R * 0.15, R * 0.22, s * (0.6 + k * 0.6)); ctx.fillStyle = def.corA; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = TINTA; ctx.stroke();
  }
  // chifres e crista
  if (def.chifres) {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * R * 0.28, -R * 1.72);
      ctx.quadraticCurveTo(s * R * 0.45, -R * 2.0, s * R * 0.7, -R * 2.06);
      ctx.quadraticCurveTo(s * R * 0.55, -R * 1.85, s * R * 0.52, -R * 1.62); ctx.closePath();
      ctx.fillStyle = def.chifre || '#ffd9a0'; ctx.fill(); ctx.lineWidth = lw * 0.85; ctx.strokeStyle = TINTA; ctx.stroke();
    }
  }
  for (const [x, h] of [[-0.16, 0.14], [0, 0.2], [0.16, 0.14]]) {
    ctx.beginPath(); ctx.moveTo(x * R - R * 0.07, -R * 1.79); ctx.lineTo(x * R, -R * (1.79 + h)); ctx.lineTo(x * R + R * 0.07, -R * 1.79); ctx.closePath();
    ctx.fillStyle = def.crista || '#ffd23f'; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.strokeStyle = TINTA; ctx.stroke();
  }
  // cabeca e focinho
  cabeca(); ctx.fillStyle = def.corA; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
  tingir(ctx, tudo, pose, t);
  elipse(ctx, 0, -R * 1.18, R * 0.4, R * 0.22); ctx.fillStyle = barriga; ctx.fill(); ctx.lineWidth = lw * 0.7; ctx.stroke();
  ctx.fillStyle = TINTA;
  for (const s of [-1, 1]) { elipse(ctx, s * R * 0.12, -R * 1.24, R * 0.04, R * 0.025); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; elipse(ctx, -R * 0.3, -R * 1.58, R * 0.16, R * 0.08, -0.4); ctx.fill();
  const f = { R, ox: R * 0.27, oy: -R * 1.5, rx: R * 0.15, ry: R * 0.15, estilo: 'reptil', brava: true, by: -R * 1.1, bl: R * 0.3, testa: -R * 1.66, lado: R * 0.6, orelha: { x: R * 0.62, y: -R * 1.4 } };
  olhos(ctx, def, f, pose, t, lw);
  boca(ctx, f, pose, lw);
  // fogo na boca ao soltar; fumaca pelas narinas no resto do tempo
  if (pose.aberta > 0.1 && !pose.derrotado) {
    const gf = ctx.createRadialGradient(0, -R * 0.95, 0, 0, -R * 0.95, R * 0.45);
    gf.addColorStop(0, `rgba(255,240,170,${0.9 * pose.aberta})`); gf.addColorStop(0.5, `rgba(255,130,40,${0.6 * pose.aberta})`); gf.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = gf; circulo(ctx, 0, -R * 0.95, R * 0.45); ctx.fill();
  } else if (!pose.derrotado) {
    for (let i = 0; i < 2; i++) {
      const u = (t * 0.6 + i * 0.5) % 1;
      circulo(ctx, (i ? 1 : -1) * R * (0.12 + u * 0.12), -R * (1.3 + u * 0.4), R * (0.04 + u * 0.07));
      ctx.fillStyle = `rgba(230,230,235,${0.5 * (1 - u)})`; ctx.fill();
    }
  }
  acessorio(ctx, def, f, cabeca, lw);
  if (def.chefe) coroa(ctx, 0, -R * 1.76, R * 0.56, lw, -0.05);
  if (pose.furia && !pose.derrotado) vapor(ctx, 0, -R * 1.7, R, t);
  clarao(ctx, tudo, pose);
  ctx.restore();
}

const ESPECIES = { gosmo, golem, yeti, espectro, dragao };

// -------------------------------------------------------------- variantes

/** Especie de cada reino (mundo 1..5). */
export const ESPECIE_DO_REINO = ['gosmo', 'golem', 'yeti', 'espectro', 'dragao'];

/** [corA, corB, olho] das posicoes 1..7 e do chefao (8). */
const PALETAS = {
  gosmo: [['#b77bff', '#6a2bbd'], ['#9be56b', '#3f9a2c'], ['#6fc8ff', '#2a78c9'], ['#ffb15c', '#d8641c'], ['#ff8fc4', '#c43f86'], ['#5fe3c9', '#1d9a86'], ['#ff7a7a', '#b8283c'], ['#d06bff', '#4b1590']],
  golem: [['#bdb6aa', '#7d766c', '#ffd23f'], ['#dcb88c', '#a07850', '#7ff3ff'], ['#a3b4c8', '#5d6f86', '#ffd23f'], ['#aab78c', '#6a7a4e', '#ff9a3d'], ['#d48e6c', '#94533a', '#7ff3ff'], ['#d9adb4', '#9a6a72', '#b6ff7a'], ['#83838e', '#4a4a55', '#ff9a3d'], ['#8f84a3', '#3f3652', '#ffd23f']],
  yeti: [['#f6f9ff', '#c4d5ee'], ['#e2f2ff', '#98c0ea'], ['#fff5e4', '#dcc39e'], ['#f1e7ff', '#bfa8e6'], ['#eceef2', '#a6afbd'], ['#e6fff5', '#9fd8c1'], ['#fff1f5', '#e1b0c0'], ['#ffffff', '#86b8ea']],
  espectro: [['#8a6cc9', '#3d2a6e', '#7ff3ff'], ['#6cc9a4', '#215e4b', '#d8ff7a'], ['#6c95c9', '#25406e', '#ffd23f'], ['#b0607e', '#561f39', '#7ff3ff'], ['#9aa0b2', '#454a5c', '#ff7ad8'], ['#5fc4c9', '#1d5a5e', '#ffe066'], ['#c9a46c', '#6e5225', '#b6ff7a'], ['#6a4aa3', '#170c2a', '#ff5a7a']],
  dragao: [['#ff6a4a', '#b8281c'], ['#7ad65a', '#2f8a2c'], ['#5ab0ff', '#2050b8'], ['#ffc84a', '#c8800c'], ['#b07aff', '#5a2ab8'], ['#7a7a8c', '#2e2e3e'], ['#ff9a3a', '#c0501c'], ['#ff3a4a', '#7a0a1c']],
};
/** Acessorio e chifres por posicao no mundo (1..7); o chefao usa coroa. */
const ACESSORIOS = ['', 'bandana', 'brinco', 'tapaolho', '', 'cicatriz', 'brinco'];
const CHIFRES = [true, false, true, true, false, true, true];
const EXTRA = {
  gosmo: { chifre: '#f3e3c3' },
  golem: { musgo: '#6fb34a', cristal: '#7ff3ff' },
  yeti: { pele: '#9db7d8', chifre: '#e8d2a6', olho: '#ffd23f' },
  espectro: { chifre: '#2a1d3a', mao: '#d8d0ef' },
  dragao: { barriga: '#ffe2a8', chifre: '#ffd9a0', crista: '#ffd23f', olho: '#ffd23f' },
};

/**
 * Variante de uma especie numa posicao do mundo (1..7; 8 = chefao).
 * epiteto: indice do apelido (textos.js); -1 no chefao (que e "Rei").
 */
export function variante(especie, pos) {
  const lista = PALETAS[especie] || PALETAS.gosmo;
  const p = clamp(pos | 0, 1, 8);
  const chefe = p === 8;
  const [corA, corB, olho] = lista[p - 1];
  return {
    ...EXTRA[especie], especie: PALETAS[especie] ? especie : 'gosmo', nome: especie, reino: ESPECIE_DO_REINO.indexOf(especie) + 1 || 1, pos: p, chefe, epiteto: chefe ? -1 : p - 1,
    corA, corB, piscar: misturar(corA, corB, 0.4), ...(olho ? { olho } : {}),
    chifres: chefe ? true : CHIFRES[p - 1], acessorio: chefe ? '' : ACESSORIOS[p - 1],
    escala: chefe ? 1 : 0.9, sombra: especie === 'espectro' ? 0.6 : 1, bandana: '#e2384d',
  };
}

/**
 * Monstro de uma fase (ou do modo sem fases): especie pelo mundo, variante
 * pela posicao no mundo.
 * @param {{ modo?: string, mundo?: number, id?: number }} fase
 */
export function monstroDaFase(fase) {
  const mundo = clamp((fase && fase.mundo) | 0 || 1, 1, 5);
  const pos = fase && fase.id > 0 ? ((fase.id - 1) % 8) + 1 : 1;
  return variante(ESPECIE_DO_REINO[mundo - 1], pos);
}

/**
 * Monstro da cadeia (estado.monstro com cadeia): especie do reino do nivel;
 * as variantes andam a cada volta pelos 5 reinos; o 5o de cada reino e o chefao.
 */
export function monstroDaCadeia(m) {
  if (!m || !m.cadeia) return variante('gosmo', 1);
  const volta = Math.floor((m.nivel - 1) / 25);
  const pos = m.chefe ? 8 : ((volta * 4 + m.pos - 1) % 7) + 1;
  return { ...variante(ESPECIE_DO_REINO[m.reino - 1] || 'gosmo', pos), nivel: m.nivel };
}

/** Aura atras do chefao (dourada) e na furia (vermelha, pulsando). */
function aura(ctx, x, y, R, cor, k) {
  const g = ctx.createRadialGradient(x, y - R * 0.95, R * 0.3, x, y - R * 0.95, R * 1.9);
  g.addColorStop(0, rgba(cor, 0.55 * k)); g.addColorStop(0.55, rgba(cor, 0.22 * k)); g.addColorStop(1, rgba(cor, 0));
  ctx.fillStyle = g; circulo(ctx, x, y - R * 0.95, R * 1.9); ctx.fill();
}

/** Desenha o monstro def em m = { x, y, R }. */
export function desenharMonstro(ctx, def, m, t, pose = {}) {
  const R = m.R * (def.escala || 1);
  const golpe = pose.golpe ?? 1;
  const atk = curvaAtaque(pose.ataque ?? 1);
  const derrotado = !!pose.derrotado;
  const furia = !!pose.furia && !derrotado;
  if (!derrotado && (def.chefe || furia)) {
    if (furia) aura(ctx, m.x, m.y, R, '#ff3040', 0.75 + 0.25 * Math.sin(t * 6));
    else aura(ctx, m.x, m.y, R, '#ffd23f', 0.45 + 0.1 * Math.sin(t * 2));
  }
  elipse(ctx, m.x, m.y + 2, R * 1.15 * (def.sombra || 1), R * 0.2 * (def.sombra || 1)); ctx.fillStyle = 'rgba(20,20,10,0.28)'; ctx.fill();
  const tremor = (golpe < 1 ? Math.sin(golpe * 40) * R * 0.09 * (1 - golpe) : 0) + (furia ? Math.sin(t * 47) * R * 0.012 : 0);
  ctx.save();
  ctx.translate(m.x + tremor, m.y);
  // ataque: encolhe na preparacao, estica ao soltar
  ctx.scale(1 + atk.prep * 0.08 - atk.solta * 0.05, (derrotado ? 0.55 : 1) * (1 - atk.prep * 0.1 + atk.solta * 0.1));
  (ESPECIES[def.especie] || gosmo)(ctx, def, R, t, { golpe, derrotado, furia, prep: derrotado ? 0 : atk.prep, aberta: derrotado ? 0 : atk.solta, espanto: derrotado ? 0 : clamp(pose.espanto || 0) });
  ctx.restore();
}
