// Arenas do duelo: o fundo de cada reino (camada parada em cache + camada
// viva) e a paleta que tinge a mesa e o painel (painelA/B viram --roxoA/B). Tudo proporcional a W x H e ao
// monstro (L.monstro), sem px fixo. Reinos: 1 campos do castelo, 2 pedreira,
// 3 reino gelado, 4 masmorra, 5 vulcao.
import { OURO, TINTA, circulo, elipse, semente, clamp } from './desenho.js';

/** Monstro de reserva quando o layout nao tem arena (laboratorio, testes). */
const monstroDe = (W, H, L) => (L && L.monstro) || { x: W / 2, y: H * 0.3, R: Math.min(W, H) * 0.12 };

/** Reino 1: campos do castelo (prototipo do duelo). */
const campos = {
  id: 'campos',
  paleta: {
    id: 'campos', painelA: '#4a2a4f', painelB: '#2c1530', fundo: '#6db8ee', texto: '#ffffff', acento: '#ffd23f', secundario: '#ff5470', hud: '#3a1d40',
    madeiraA: '#5a3423', madeiraB: '#3a2016', miolo: '#2a1712', friso: OURO, tapeteA: '#9a5b34', tapeteB: '#6e3b1f', runa: '232,184,74',
  },
  parado(ctx, W, H, L) {
    const m = monstroDe(W, H, L);
    const retrato = !L || L.retrato;
    const u = clamp(Math.min(W, H) / 420, 0.7, 1.8);
    const k = m.R / 78;
    const hy = m.y - m.R * 1.25;
    // ceu azul -> pessego
    const g = ctx.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, '#6db8ee'); g.addColorStop(0.65, '#b9dcf2'); g.addColorStop(1, '#ffd5b0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // sol
    const sx = retrato ? W * 0.18 : W * 0.62, sy = hy - (retrato ? 70 : 90) * u, sr = 90 * u;
    const gs = ctx.createRadialGradient(sx, sy, 4, sx, sy, sr);
    gs.addColorStop(0, 'rgba(255,248,214,0.95)'); gs.addColorStop(0.3, 'rgba(255,236,180,0.6)'); gs.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = gs; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    // nuvens paradas
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const rnd = semente(23);
    for (let i = 0; i < 5; i++) {
      const x = rnd() * W, y = 40 * u + rnd() * Math.max(40, hy - 120 * u), s = (0.6 + rnd() * 0.7) * u;
      elipse(ctx, x, y, 34 * s, 10 * s); ctx.fill(); circulo(ctx, x - 10 * s, y - 6 * s, 12 * s); ctx.fill(); circulo(ctx, x + 10 * s, y - 9 * s, 15 * s); ctx.fill();
    }
    // montanhas
    const montanha = (base, cor, neve, picos, amp, fase) => {
      ctx.beginPath(); ctx.moveTo(0, base);
      const pts = [];
      for (let i = 0; i <= picos; i++) {
        const x = (i / picos) * W, y = base - amp * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + fase)));
        pts.push([x, y]);
        ctx.lineTo(x - W / picos / 2, base - amp * 0.25); ctx.lineTo(x, y);
      }
      ctx.lineTo(W, base); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = cor; ctx.fill();
      if (neve) {
        ctx.fillStyle = neve;
        const n = 10 * u;
        for (const [x, y] of pts) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - n, y + n * 1.2); ctx.lineTo(x - n * 0.3, y + n * 0.9); ctx.lineTo(x + n * 0.2, y + n * 1.3); ctx.lineTo(x + n, y + n * 1.2); ctx.closePath(); ctx.fill(); }
      }
    };
    montanha(hy + 8 * u, '#9aa7d6', '#f4f6ff', retrato ? 4 : 7, 90 * u, 0.4);
    montanha(hy + 18 * u, '#7c8bc4', null, retrato ? 5 : 9, 52 * u, 2.1);
    // castelo no morro
    const cx = retrato ? W * 0.8 : W - 100 * u, cy = hy + 6 * k;
    ctx.fillStyle = '#5a5f8e';
    ctx.beginPath(); ctx.ellipse(cx, cy + 10 * k, 70 * k, 22 * k, 0, Math.PI, 0); ctx.fill();
    const torre = (x, w, h) => {
      ctx.fillRect(x - w / 2, cy - h, w, h);
      for (let i = 0; i < 3; i++) ctx.fillRect(x - w / 2 + i * (w / 2.5), cy - h - 4 * k, w / 5, 4 * k);
      ctx.beginPath(); ctx.moveTo(x - w / 2 - 2 * k, cy - h); ctx.lineTo(x, cy - h - w * 1.1); ctx.lineTo(x + w / 2 + 2 * k, cy - h); ctx.closePath(); ctx.fill();
    };
    ctx.fillRect(cx - 30 * k, cy - 26 * k, 60 * k, 26 * k);
    torre(cx - 32 * k, 14 * k, 40 * k); torre(cx + 32 * k, 14 * k, 44 * k); torre(cx, 18 * k, 58 * k);
    ctx.fillStyle = '#ef4466'; ctx.beginPath(); ctx.moveTo(cx, cy - 78 * k); ctx.lineTo(cx, cy - 88 * k); ctx.lineTo(cx + 12 * k, cy - 84 * k); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe9a6'; for (const dx of [-32, 0, 32]) ctx.fillRect(cx + (dx - 2) * k, cy - 30 * k, 4 * k, 7 * k);
    // grama
    const gg = ctx.createLinearGradient(0, hy + 10 * u, 0, H);
    gg.addColorStop(0, '#9bd56b'); gg.addColorStop(0.35, '#6fb34a'); gg.addColorStop(1, '#3d7a2c');
    ctx.fillStyle = gg; ctx.fillRect(0, hy + 10 * u, W, H);
    // arena de terra sob o monstro
    elipse(ctx, m.x, m.y + 2, m.R * 1.9, m.R * 0.42); ctx.fillStyle = '#d8c08a'; ctx.fill();
    elipse(ctx, m.x, m.y + 2, m.R * 1.9, m.R * 0.42); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120,90,40,0.35)'; ctx.stroke();
    // estandartes ao lado da arena
    for (const s of [-1, 1]) {
      const bx = m.x + s * m.R * 1.6, by = m.y - 4;
      ctx.fillStyle = '#5a3a24'; ctx.fillRect(bx - 2 * k, by - m.R * 1.6, 4 * k, m.R * 1.6);
      ctx.fillStyle = s < 0 ? '#c8304a' : '#3a6fd8';
      const fw = 22 * k;
      ctx.beginPath(); ctx.moveTo(bx + 2 * k, by - m.R * 1.55); ctx.lineTo(bx + 2 * k + fw, by - m.R * 1.55); ctx.lineTo(bx + 2 * k + fw, by - m.R * 1.0); ctx.lineTo(bx + 2 * k + fw / 2, by - m.R * 1.12); ctx.lineTo(bx + 2 * k, by - m.R * 1.0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = OURO; circulo(ctx, bx, by - m.R * 1.62, 3.5 * k); ctx.fill();
    }
    // tufos e pedrinhas
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W, y = hy + 20 * u + rnd() * (H - hy - 20 * u);
      if (rnd() < 0.7) { ctx.strokeStyle = 'rgba(40,90,25,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3 * u, y - 6 * u); ctx.moveTo(x, y); ctx.lineTo(x + 2 * u, y - 7 * u); ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(200,200,190,0.6)'; elipse(ctx, x, y, 3 * u, 2 * u); ctx.fill(); }
    }
  },
  vivo(ctx, W, H, t, L) {
    // nuvenzinhas que passam
    const m = monstroDe(W, H, L);
    const u = clamp(Math.min(W, H) / 420, 0.7, 1.8);
    const hy = m.y - m.R * 1.25;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 2; i++) {
      const x = ((i * 211 + t * (6 + i * 4) * u) % (W + 120 * u)) - 60 * u, y = Math.max(30 * u, hy * (0.35 + i * 0.22));
      elipse(ctx, x, y, 26 * u, 7 * u); ctx.fill(); circulo(ctx, x + 6 * u, y - 6 * u, 10 * u); ctx.fill();
    }
  },
};

/** Medidas comuns: monstro, retrato, escala da tela (u), do monstro (k) e o horizonte. */
function medidas(W, H, L) {
  const m = monstroDe(W, H, L);
  return { m, retrato: !L || L.retrato, u: clamp(Math.min(W, H) / 420, 0.7, 1.8), k: m.R / 78, hy: m.y - m.R * 1.25 };
}

/** Faixa de montanhas/penhascos: serra de picos entre base e base - amp. */
function serra(ctx, W, H, base, amp, picos, fase, cor, plana = 0) {
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, base);
  for (let i = 0; i <= picos; i++) {
    const x = (i / picos) * W, y = base - amp * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + fase)));
    if (plana) { ctx.lineTo(x - (W / picos) * 0.32, y); ctx.lineTo(x + (W / picos) * 0.18, y); ctx.lineTo(x + (W / picos) * 0.38, base - amp * 0.2); }
    else { ctx.lineTo(x - W / picos / 2, base - amp * 0.25); ctx.lineTo(x, y); }
  }
  ctx.lineTo(W, base); ctx.lineTo(W, H); ctx.closePath();
  ctx.fillStyle = cor; ctx.fill();
}

/** Chao do horizonte para baixo, em degrade. */
function chao(ctx, W, H, y, cores) {
  const g = ctx.createLinearGradient(0, y, 0, H);
  cores.forEach((c, i) => g.addColorStop(i / (cores.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
}

/** Ceu em degrade do topo ate o horizonte. */
function ceu(ctx, W, H, hy, cores) {
  const g = ctx.createLinearGradient(0, 0, 0, hy);
  cores.forEach((c, i) => g.addColorStop(i / (cores.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/** Pilha de pedras (marco) ao lado da arena. */
function marco(ctx, x, y, k, cores) {
  const pedras = [[0, 0, 15, 8], [-2, -13, 12, 7], [2, -24, 9, 6], [0, -33, 6, 5]];
  for (const [dx, dy, rx, ry] of pedras) {
    elipse(ctx, x + dx * k, y + dy * k, rx * k, ry * k); ctx.fillStyle = cores[0]; ctx.fill();
    ctx.lineWidth = Math.max(1, 1.5 * k); ctx.strokeStyle = cores[1]; ctx.stroke();
  }
}

/** Tocha (haste e chama viva). */
function chama(ctx, x, y, s, t, i) {
  const f = 1 + 0.12 * Math.sin(t * 13 + i * 2) + 0.08 * Math.sin(t * 21 + i);
  const g = ctx.createRadialGradient(x, y, 1, x, y, 26 * s);
  g.addColorStop(0, 'rgba(255,200,90,0.55)'); g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g; circulo(ctx, x, y, 26 * s); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 6 * s, y + 2 * s);
  ctx.quadraticCurveTo(x - 7 * s, y - 8 * s * f, x, y - 16 * s * f);
  ctx.quadraticCurveTo(x + 7 * s, y - 8 * s * f, x + 6 * s, y + 2 * s); ctx.closePath();
  ctx.fillStyle = '#ff8a2a'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 3 * s, y + 1 * s); ctx.quadraticCurveTo(x, y - 9 * s * f, x + 3 * s, y + 1 * s); ctx.closePath();
  ctx.fillStyle = '#ffe27a'; ctx.fill();
}

/** Reino 2: pedreira (penhascos em camadas, andaime e marcos de pedra). */
const pedreira = {
  id: 'pedreira',
  paleta: {
    id: 'pedreira', painelA: '#5a3a26', painelB: '#33200f', fundo: '#f2b46a', texto: '#ffffff', acento: '#ffd23f', secundario: '#ff7a3d', hud: '#3a2418',
    madeiraA: '#7a6a5c', madeiraB: '#4e4238', miolo: '#2b231e', friso: '#d9b26a', tapeteA: '#8a6a4a', tapeteB: '#5e4630', runa: '232,184,74',
  },
  parado(ctx, W, H, L) {
    const { m, retrato, u, k, hy } = medidas(W, H, L);
    ceu(ctx, W, H, hy, ['#f0a860', '#f8cf8e', '#ffe8c0']);
    // sol baixo e poeira
    const sx = retrato ? W * 0.78 : W * 0.7, sy = hy - 60 * u;
    const gs = ctx.createRadialGradient(sx, sy, 4, sx, sy, 110 * u);
    gs.addColorStop(0, 'rgba(255,250,220,0.95)'); gs.addColorStop(0.25, 'rgba(255,230,170,0.6)'); gs.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = gs; ctx.fillRect(sx - 110 * u, sy - 110 * u, 220 * u, 220 * u);
    // penhascos em camadas (topo plano), com estratos
    serra(ctx, W, H, hy + 6 * u, 110 * u, retrato ? 3 : 5, 0.9, '#d7955a', 1);
    serra(ctx, W, H, hy + 16 * u, 70 * u, retrato ? 4 : 7, 2.4, '#bb7642', 1);
    ctx.strokeStyle = 'rgba(120,60,25,0.25)'; ctx.lineWidth = 2 * u;
    for (let i = 1; i <= 4; i++) { const y = hy + 16 * u - i * 14 * u; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + 4 * u); ctx.stroke(); }
    // andaime de madeira com polia (onde os campos tem o castelo)
    const ax = retrato ? W * 0.84 : W - 110 * u, ay = hy + 10 * k;
    ctx.strokeStyle = '#6b4426'; ctx.lineWidth = Math.max(2, 4 * k); ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax - 26 * k, ay); ctx.lineTo(ax - 18 * k, ay - 70 * k); ctx.moveTo(ax + 26 * k, ay); ctx.lineTo(ax + 18 * k, ay - 70 * k);
    ctx.moveTo(ax - 22 * k, ay - 30 * k); ctx.lineTo(ax + 22 * k, ay - 30 * k); ctx.moveTo(ax - 24 * k, ay - 2 * k); ctx.lineTo(ax + 20 * k, ay - 52 * k);
    ctx.moveTo(ax - 26 * k, ay - 70 * k); ctx.lineTo(ax + 44 * k, ay - 76 * k); ctx.stroke();
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = Math.max(1, 1.5 * k);
    ctx.beginPath(); ctx.moveTo(ax + 40 * k, ay - 75 * k); ctx.lineTo(ax + 40 * k, ay - 40 * k); ctx.stroke();
    ctx.fillStyle = '#8d6a44'; ctx.fillRect(ax + 33 * k, ay - 40 * k, 14 * k, 12 * k);
    // chao de terra batida
    chao(ctx, W, H, hy + 10 * u, ['#d9a86c', '#b88350', '#7d5531']);
    // arena: circulo de pedras sob o monstro
    elipse(ctx, m.x, m.y + 2, m.R * 1.9, m.R * 0.42); ctx.fillStyle = '#e6c793'; ctx.fill();
    const rnd = semente(41);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = m.x + Math.cos(a) * m.R * 1.9, y = m.y + 2 + Math.sin(a) * m.R * 0.42;
      if (Math.sin(a) < -0.2) continue; // as de tras ficam atras do monstro
      elipse(ctx, x, y, (5 + rnd() * 4) * k, (3.5 + rnd() * 2) * k); ctx.fillStyle = rnd() < 0.5 ? '#9a8f84' : '#b5aa9c'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.stroke();
    }
    for (const s2 of [-1, 1]) marco(ctx, m.x + s2 * m.R * 1.6, m.y - 2, k, ['#a99d90', '#5e544a']);
    // seixos espalhados
    for (let i = 0; i < 36; i++) {
      const x = rnd() * W, y = hy + 22 * u + rnd() * (H - hy - 22 * u);
      elipse(ctx, x, y, (2 + rnd() * 4) * u, (1.5 + rnd() * 2) * u); ctx.fillStyle = rnd() < 0.5 ? 'rgba(120,85,55,0.55)' : 'rgba(230,200,160,0.6)'; ctx.fill();
    }
  },
  vivo(ctx, W, H, t, L) {
    const { u, hy } = medidas(W, H, L);
    // poeira que passa
    for (let i = 0; i < 7; i++) {
      const x = ((i * 157 + t * (14 + i * 3) * u) % (W + 40)) - 20;
      const y = hy - 40 * u + ((i * 53) % Math.max(60, H - hy)) + Math.sin(t * 1.3 + i) * 6 * u;
      ctx.fillStyle = `rgba(255,236,200,${0.25 + 0.15 * Math.sin(t * 2 + i)})`; circulo(ctx, x, y, (1.5 + (i % 3)) * u); ctx.fill();
    }
  },
};

/** Reino 3: reino gelado (crepusculo com aurora, pinheiros nevados, pista de gelo). */
const gelo = {
  id: 'gelo',
  paleta: {
    id: 'gelo', painelA: '#2c3a66', painelB: '#172040', fundo: '#2a3a7a', texto: '#ffffff', acento: '#7fe3ff', secundario: '#ff7ab0', hud: '#1f2a48',
    madeiraA: '#5a6f8f', madeiraB: '#34445e', miolo: '#1c2638', friso: '#bfe8ff', tapeteA: '#6a7fa0', tapeteB: '#43557a', runa: '170,230,255',
  },
  parado(ctx, W, H, L) {
    const { m, retrato, u, k, hy } = medidas(W, H, L);
    ceu(ctx, W, H, hy, ['#1f2a66', '#3b5fa8', '#8fc4ea', '#d9f1ff']);
    const rnd = semente(53);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.5})`; circulo(ctx, rnd() * W, rnd() * hy * 0.6, (0.6 + rnd()) * u); ctx.fill(); }
    serra(ctx, W, H, hy + 8 * u, 100 * u, retrato ? 4 : 7, 0.4, '#a9c4e6');
    // neve nos picos
    serra(ctx, W, H, hy + 20 * u, 60 * u, retrato ? 5 : 9, 2.1, '#7f9fcf');
    // pinheiros nevados
    const pinheiro = (x, y, s) => {
      ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x - 2 * s, y - 6 * s, 4 * s, 8 * s);
      for (let i = 0; i < 3; i++) {
        const yy = y - 6 * s - i * 11 * s, w = (16 - i * 4) * s;
        ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - 16 * s); ctx.lineTo(x + w, yy); ctx.closePath(); ctx.fillStyle = '#2f6b5a'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - w * 0.55, yy - 7 * s); ctx.lineTo(x, yy - 16 * s); ctx.lineTo(x + w * 0.55, yy - 7 * s); ctx.closePath(); ctx.fillStyle = '#f4faff'; ctx.fill();
      }
    };
    const xs = retrato ? [0.06, 0.16, 0.86, 0.95] : [0.04, 0.1, 0.62, 0.7, 0.88, 0.95];
    xs.forEach((x, i) => pinheiro(W * x, hy + 22 * u, (0.8 + (i % 2) * 0.3) * u));
    chao(ctx, W, H, hy + 18 * u, ['#f2f8ff', '#d6e7f6', '#a9c4e0']);
    // montes de neve
    for (let i = 0; i < 9; i++) { const x = rnd() * W, y = hy + 40 * u + rnd() * (H - hy - 40 * u); elipse(ctx, x, y, (18 + rnd() * 20) * u, (5 + rnd() * 4) * u); ctx.fillStyle = 'rgba(160,190,225,0.35)'; ctx.fill(); }
    // pista de gelo sob o monstro
    elipse(ctx, m.x, m.y + 2, m.R * 1.9, m.R * 0.42);
    const gi = ctx.createLinearGradient(m.x - m.R * 1.9, 0, m.x + m.R * 1.9, 0);
    gi.addColorStop(0, '#bfe6fb'); gi.addColorStop(0.5, '#e8f8ff'); gi.addColorStop(1, '#a8d8f2');
    ctx.fillStyle = gi; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,150,200,0.6)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
    for (const [a, b] of [[-1.2, -0.6], [0.3, 1.0]]) { ctx.beginPath(); ctx.moveTo(m.x + a * m.R, m.y + 2 - m.R * 0.1); ctx.lineTo(m.x + b * m.R, m.y + 2 + m.R * 0.12); ctx.stroke(); }
    // cristais de gelo ao lado da arena
    for (const s2 of [-1, 1]) {
      const bx = m.x + s2 * m.R * 1.62, by = m.y;
      for (const [dx, h, w] of [[0, 46, 8], [-7, 28, 6], [7, 32, 6]]) {
        ctx.beginPath(); ctx.moveTo(bx + (dx - w) * k, by); ctx.lineTo(bx + dx * k, by - h * k); ctx.lineTo(bx + (dx + w) * k, by); ctx.closePath();
        ctx.fillStyle = 'rgba(190,235,255,0.92)'; ctx.fill(); ctx.lineWidth = Math.max(1, 1.5 * k); ctx.strokeStyle = '#5a9ac8'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx + dx * k, by - h * k * 0.9); ctx.lineTo(bx + (dx - w * 0.3) * k, by - 2 * k); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
      }
    }
  },
  vivo(ctx, W, H, t, L) {
    const { u, hy } = medidas(W, H, L);
    // aurora
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let b = 0; b < 2; b++) {
      ctx.beginPath();
      const y0 = hy * (0.18 + b * 0.14);
      ctx.moveTo(0, y0);
      for (let x = 0; x <= W; x += 24 * u) ctx.lineTo(x, y0 + Math.sin(x / (90 * u) + t * 0.5 + b) * 14 * u);
      for (let x = W; x >= 0; x -= 24 * u) ctx.lineTo(x, y0 + 26 * u + Math.sin(x / (70 * u) + t * 0.4 + b * 2) * 10 * u);
      ctx.closePath();
      ctx.fillStyle = b ? `rgba(160,110,255,${0.12 + 0.05 * Math.sin(t)})` : `rgba(90,255,190,${0.14 + 0.05 * Math.sin(t * 0.8)})`;
      ctx.fill();
    }
    ctx.restore();
    // neve caindo
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 26; i++) {
      const vel = (18 + (i % 5) * 7) * u;
      const x = ((i * 97.3 + Math.sin(t * 0.8 + i) * 18 * u) % W + W) % W;
      const y = ((i * 61.7 + t * vel) % (H + 20)) - 10;
      circulo(ctx, x, y, (1 + (i % 3) * 0.7) * u); ctx.fill();
    }
  },
};

/** Reino 4: masmorra (muro de tijolos, arcos, tochas e circulo magico no chao). */
const masmorra = {
  id: 'masmorra',
  paleta: {
    id: 'masmorra', painelA: '#3e2c58', painelB: '#1f1430', fundo: '#2a2238', texto: '#ffffff', acento: '#b89cff', secundario: '#7fe3ff', hud: '#1d1428',
    madeiraA: '#4a3f5c', madeiraB: '#2a2238', miolo: '#150f1f', friso: '#c3cad6', tapeteA: '#5a3a5e', tapeteB: '#3a2340', runa: '180,150,255',
  },
  parado(ctx, W, H, L) {
    const { m, retrato, u, k, hy } = medidas(W, H, L);
    // muro
    const gm = ctx.createLinearGradient(0, 0, 0, hy + 20 * u);
    gm.addColorStop(0, '#2b2340'); gm.addColorStop(1, '#4a3e62');
    ctx.fillStyle = gm; ctx.fillRect(0, 0, W, H);
    const rnd = semente(67);
    const tw = 34 * u, th = 16 * u;
    ctx.lineWidth = Math.max(1, 1.2 * u);
    for (let l = 0, y = hy + 20 * u - th; y > -th; l++, y -= th) {
      for (let x = (l % 2) * -tw / 2; x < W; x += tw) {
        ctx.fillStyle = `rgba(${90 + rnd() * 30},${80 + rnd() * 25},${115 + rnd() * 30},${0.35 + rnd() * 0.25})`;
        ctx.fillRect(x + 1, y + 1, tw - 2, th - 2);
        ctx.strokeStyle = 'rgba(15,10,25,0.55)'; ctx.strokeRect(x + 1, y + 1, tw - 2, th - 2);
      }
    }
    // arcos escuros
    const arco = (x, w, h) => {
      ctx.beginPath(); ctx.moveTo(x - w / 2, hy + 20 * u); ctx.lineTo(x - w / 2, hy + 20 * u - h + w / 2);
      ctx.arc(x, hy + 20 * u - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, hy + 20 * u); ctx.closePath();
      ctx.fillStyle = '#120c1c'; ctx.fill(); ctx.lineWidth = 5 * u; ctx.strokeStyle = '#6a5a86'; ctx.stroke();
      // grade
      ctx.strokeStyle = 'rgba(160,150,190,0.5)'; ctx.lineWidth = 2 * u;
      for (let gx = x - w / 2 + w / 6; gx < x + w / 2; gx += w / 6) { ctx.beginPath(); ctx.moveTo(gx, hy + 20 * u); ctx.lineTo(gx, hy + 20 * u - h + w * 0.2); ctx.stroke(); }
    };
    if (retrato) { arco(W * 0.12, 54 * u, 110 * u); arco(W * 0.88, 54 * u, 110 * u); }
    else { arco(W * 0.6, 70 * u, 140 * u); arco(W * 0.86, 70 * u, 140 * u); }
    // correntes penduradas
    ctx.strokeStyle = 'rgba(150,150,170,0.7)'; ctx.lineWidth = 2 * u;
    for (const x of retrato ? [0.3, 0.7] : [0.2, 0.45, 0.73]) {
      ctx.beginPath(); for (let y = 0; y < hy * 0.45; y += 7 * u) { elipse(ctx, W * x, y, 2.5 * u, 4 * u); ctx.stroke(); }
    }
    // chao de lajes
    chao(ctx, W, H, hy + 20 * u, ['#5a4d70', '#3e3352', '#251d33']);
    ctx.strokeStyle = 'rgba(10,6,18,0.45)'; ctx.lineWidth = Math.max(1, 1.5 * u);
    for (let y = hy + 34 * u, i = 0; y < H; y += (16 + i * 6) * u, i++) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let x = -W; x < W * 2; x += 60 * u) { ctx.beginPath(); ctx.moveTo(W / 2 + (x - W / 2) * 0.35, hy + 20 * u); ctx.lineTo(x, H); ctx.stroke(); }
    // circulo magico sob o monstro
    ctx.save();
    ctx.shadowColor = '#b89cff'; ctx.shadowBlur = 12 * k;
    ctx.strokeStyle = 'rgba(200,170,255,0.85)'; ctx.lineWidth = Math.max(1.5, 2.5 * k);
    elipse(ctx, m.x, m.y + 2, m.R * 1.85, m.R * 0.4); ctx.stroke();
    elipse(ctx, m.x, m.y + 2, m.R * 1.5, m.R * 0.32); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(200,170,255,0.75)';
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      elipse(ctx, m.x + Math.cos(a) * m.R * 1.68, m.y + 2 + Math.sin(a) * m.R * 0.36, 2.5 * k, 1.5 * k); ctx.fill();
    }
    // suportes das tochas ao lado da arena
    for (const s2 of [-1, 1]) {
      const bx = m.x + s2 * m.R * 1.62, by = m.y;
      ctx.fillStyle = '#3a3048'; ctx.fillRect(bx - 3 * k, by - m.R * 1.2, 6 * k, m.R * 1.2);
      ctx.beginPath(); ctx.moveTo(bx - 10 * k, by - m.R * 1.2); ctx.lineTo(bx + 10 * k, by - m.R * 1.2); ctx.lineTo(bx + 6 * k, by - m.R * 1.2 + 8 * k); ctx.lineTo(bx - 6 * k, by - m.R * 1.2 + 8 * k); ctx.closePath();
      ctx.fillStyle = '#6a5a86'; ctx.fill(); ctx.lineWidth = Math.max(1, 1.5 * k); ctx.strokeStyle = TINTA; ctx.stroke();
    }
  },
  vivo(ctx, W, H, t, L) {
    const { m, k } = medidas(W, H, L);
    for (const s2 of [-1, 1]) chama(ctx, m.x + s2 * m.R * 1.62, m.y - m.R * 1.2 - 2 * k, Math.max(0.6, k), t, s2 + 2);
    // poeira brilhante
    for (let i = 0; i < 8; i++) {
      const x = m.x + Math.sin(t * 0.3 + i * 2.1) * m.R * (1.6 + (i % 3) * 0.5);
      const y = m.y - m.R * (0.4 + ((t * 0.15 + i * 0.37) % 1) * 2);
      ctx.fillStyle = `rgba(200,170,255,${0.35 + 0.3 * Math.sin(t * 2 + i)})`; circulo(ctx, x, y, 1.6 * k); ctx.fill();
    }
  },
};

/** Reino 5: vulcao (ceu em brasa, vulcao com lava, chao de basalto rachado). */
const vulcao = {
  id: 'vulcao',
  paleta: {
    id: 'vulcao', painelA: '#5a1e22', painelB: '#2e0c10', fundo: '#3a0f1e', texto: '#ffffff', acento: '#ffb03d', secundario: '#ff4a3d', hud: '#2a0f14',
    madeiraA: '#3a2a30', madeiraB: '#1e1418', miolo: '#120a0c', friso: '#ff8a3d', tapeteA: '#6a2a1e', tapeteB: '#45170f', runa: '255,140,60',
  },
  parado(ctx, W, H, L) {
    const { m, retrato, u, k, hy } = medidas(W, H, L);
    ceu(ctx, W, H, hy, ['#2a0a1a', '#6a1a24', '#c2452a', '#ff9a4a']);
    // vulcao ao fundo com cratera acesa
    const vx = retrato ? W * 0.74 : W * 0.72, vw = (retrato ? 120 : 170) * u, vh = (retrato ? 120 : 150) * u, base = hy + 14 * u;
    ctx.beginPath(); ctx.moveTo(vx - vw, base); ctx.lineTo(vx - vw * 0.18, base - vh); ctx.lineTo(vx + vw * 0.18, base - vh); ctx.lineTo(vx + vw, base); ctx.closePath();
    ctx.fillStyle = '#3a1c22'; ctx.fill();
    const gc = ctx.createRadialGradient(vx, base - vh, 2, vx, base - vh, vw * 0.6);
    gc.addColorStop(0, 'rgba(255,200,90,0.9)'); gc.addColorStop(0.3, 'rgba(255,110,40,0.5)'); gc.addColorStop(1, 'rgba(255,80,30,0)');
    ctx.fillStyle = gc; circulo(ctx, vx, base - vh, vw * 0.6); ctx.fill();
    ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 3 * u; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(vx - vw * 0.08, base - vh); ctx.lineTo(vx - vw * 0.2, base - vh * 0.6); ctx.lineTo(vx - vw * 0.12, base - vh * 0.3); ctx.lineTo(vx - vw * 0.3, base); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vx + vw * 0.1, base - vh); ctx.lineTo(vx + vw * 0.24, base - vh * 0.5); ctx.lineTo(vx + vw * 0.4, base); ctx.stroke();
    serra(ctx, W, H, hy + 18 * u, 50 * u, retrato ? 5 : 9, 1.3, '#2a1418');
    // chao de basalto com rachaduras de lava
    chao(ctx, W, H, hy + 16 * u, ['#3e2a2c', '#2a1c1e', '#170e10']);
    const rnd = semente(79);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      let x = rnd() * W, y = hy + 30 * u + rnd() * (H - hy - 30 * u);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 4; j++) { x += (rnd() - 0.3) * 40 * u; y += (rnd() - 0.5) * 16 * u; ctx.lineTo(x, y); }
      ctx.strokeStyle = 'rgba(255,90,30,0.35)'; ctx.lineWidth = 6 * u; ctx.stroke();
      ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 1.6 * u; ctx.stroke();
    }
    // plataforma de obsidiana sob o monstro
    elipse(ctx, m.x, m.y + 2, m.R * 1.9, m.R * 0.42); ctx.fillStyle = '#2a1f2a'; ctx.fill();
    ctx.lineWidth = Math.max(2, 3 * k); ctx.strokeStyle = '#ff7a2a'; ctx.stroke();
    elipse(ctx, m.x - m.R * 0.5, m.y - m.R * 0.05, m.R * 0.6, m.R * 0.08); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
    // pilares de obsidiana com braseiro
    for (const s2 of [-1, 1]) {
      const bx = m.x + s2 * m.R * 1.62, by = m.y;
      ctx.beginPath(); ctx.moveTo(bx - 8 * k, by); ctx.lineTo(bx - 5 * k, by - m.R * 1.1); ctx.lineTo(bx + 5 * k, by - m.R * 1.1); ctx.lineTo(bx + 8 * k, by); ctx.closePath();
      ctx.fillStyle = '#241a24'; ctx.fill(); ctx.lineWidth = Math.max(1, 1.5 * k); ctx.strokeStyle = '#ff7a2a'; ctx.stroke();
    }
  },
  vivo(ctx, W, H, t, L) {
    const { m, u, k } = medidas(W, H, L);
    for (const s2 of [-1, 1]) chama(ctx, m.x + s2 * m.R * 1.62, m.y - m.R * 1.1 - 2 * k, Math.max(0.6, k) * 1.1, t, s2 + 5);
    // brasas subindo
    for (let i = 0; i < 18; i++) {
      const u2 = (t * (0.12 + (i % 4) * 0.03) + i * 0.137) % 1;
      const x = ((i * 89.1) % W) + Math.sin(t * 1.5 + i) * 10 * u;
      const y = H - u2 * H * 1.05;
      ctx.fillStyle = `rgba(255,${150 + (i % 3) * 30},60,${0.75 * (1 - u2)})`; circulo(ctx, x, y, (1 + (i % 3) * 0.6) * u); ctx.fill();
    }
  },
};

export const ARENAS = { 1: campos, 2: pedreira, 3: gelo, 4: masmorra, 5: vulcao };

/** Arena do reino n (1..5); fora disso, os campos. */
export function arenaDe(reino) {
  return ARENAS[reino] || campos;
}
