// Subida de nivel, fim de fase e fim de mundo no estilo do Blumgi Bounce (porte de stringcut/src/render/transicoes.js).
/*
 * Subida de nivel, fim de fase e fim de mundo no estilo do Blumgi Bounce
 * (medido quadro a quadro na gravacao de referencia). Tudo e funcao pura do
 * tempo t (s desde a vitoria), para o modo &quadro=ms congelar qualquer instante.
 *
 * Nivel (~1,7 s, a mesa nao troca): flash + soco de camera -> o valor feito
 *        ("128!") -> confete -> a trilha dos 8 valores do mundo, o feito
 *        acendendo e o proximo pulsando. O jogo segue na mesma mesa.
 * Fase  (~2,3 s ate trocar): flash branco + feixe + soco de camera -> "YES!"
 *        com extrusao colorida ciclando -> confete dos dois lados -> "YES!" sai
 *        por cima -> corte para o nivel novo, que nasce lavado de branco e com
 *        zoom 1,25x recuando para 1.
 * Mundo (~3,3 s ate trocar): o mesmo, confete dobrado, as bolinhas do HUD voam
 *        para o centro e estouram, "WORLD N", varredura diagonal na cor do
 *        mundo novo e o mesmo zoom de entrada.
 */
export const Transicoes = (() => {
  const TAU = Math.PI * 2;
  const CORES = ['#ff4fa3', '#ff9a3d', '#ffd93b', '#43dd6e', '#2fd0ff', '#5b7cff', '#a55bff', '#ff5be0'];
  const CONFETE = ['#ff4fa3', '#ffd93b', '#7a5cff', '#3ee08f', '#38c8ff', '#ff8a3d', '#ffffff'];
  const TROCA = { nivel: 1.7, fase: 2.3, mundo: 3.3 };
  const FIM = { nivel: 1.7, fase: 2.3, mundo: 3.95 };

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
  const easeIn = (u) => Math.pow(clamp(u), 3);
  const backOut = (u) => { const c = 1.9; const x = clamp(u) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };

  function rng(s) {
    let a = s >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Camera durante a vitoria: soco de ~6% focado no alvo. */
  function camera(tipo, t) {
    if (t < 0 || t > 0.4) return { zoom: 1 };
    return { zoom: 1 + 0.065 * (1 - easeOut(t / 0.38)) };
  }

  /** Entrada do nivel novo (t = s desde a troca): zoom 1,25 -> 1 e lavado branco. */
  function entrada(t) {
    if (t >= 0.6) return { zoom: 1, branco: 0 };
    return { zoom: 1 + 0.25 * (1 - easeOut(t / 0.55)), branco: 0.62 * (1 - easeOut(t / 0.42)) };
  }

  /** Texto com face branca, contorno colorido e extrusao 3D (estilo Blumgi). */
  function textoBlumgi(ctx, txt, x, y, tam, corIdx, alpha = 1, glitch = 0) {
    const cor = CORES[corIdx % CORES.length];
    const escura = sombrear(cor, 0.55);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${tam}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const prof = Math.max(3, tam * 0.075);
    if (glitch > 0) {
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = '#ff2d6f';
      ctx.fillText(txt, x - glitch, y);
      ctx.fillStyle = '#2de1ff';
      ctx.fillText(txt, x + glitch, y);
      ctx.globalAlpha = alpha;
    }
    // extrusao
    for (let k = Math.round(prof); k >= 1; k--) {
      ctx.strokeStyle = escura;
      ctx.lineWidth = tam * 0.16;
      ctx.strokeText(txt, x + k * 0.55, y + k);
      ctx.fillStyle = escura;
      ctx.fillText(txt, x + k * 0.55, y + k);
    }
    // contorno colorido + face branca
    ctx.strokeStyle = cor;
    ctx.lineWidth = tam * 0.16;
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(txt, x, y);
    // brilho interno leve
    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = cor;
    ctx.fillText(txt, x + tam * 0.025, y + tam * 0.04);
    ctx.restore();
  }

  function sombrear(h, k) {
    const n = parseInt(h.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  /** "YES!" (ou o texto dado): entra, treme, sai por cima. */
  function desenharGrito(ctx, t, W, H, txt, ini = 0.08, sai = 1.3, tamFator = 1) {
    if (t < ini || t > sai + 0.32) return;
    // textos longos ("VITORIA!") encolhem para caber na largura
    const tam = Math.min(W * 0.22, H * 0.2, 170) * tamFator * Math.min(1, 5 / Math.max(4, txt.length));
    const u = (t - ini) / 0.3;
    let esc = u < 1 ? 1.7 - 0.7 * backOut(u) : 1;
    if (u >= 1) esc = 1 + Math.sin((t - ini) * 9) * 0.015;
    const alpha = clamp(0.3 + u * 1.6);
    let y = H * 0.3;
    let glitch = u < 0.6 ? (1 - u / 0.6) * 10 : 0;
    if (t > sai) {
      const v = (t - sai) / 0.3;
      y -= easeIn(v) * (H * 0.3 + tam * 1.2);
      glitch = 4 + v * 10;
    }
    const corIdx = Math.floor(t * 15);
    ctx.save();
    ctx.translate(W / 2, y);
    ctx.rotate(Math.sin(t * 11) * 0.035 * (u < 1 ? 1.6 : 1));
    ctx.scale(esc, esc);
    textoBlumgi(ctx, txt, 0, 0, tam, corIdx, alpha, glitch);
    ctx.restore();
  }

  /** Confete fechado no tempo: dois canhoes nas laterais (pos. pura de t). */
  function desenharConfete(ctx, t, W, H, semente, inicios) {
    const g = 1250, k = 1.7;
    for (let c = 0; c < inicios.length; c++) {
      const t0 = inicios[c];
      const dt = t - t0;
      if (dt < 0 || dt > 2.6) continue;
      const r = rng(semente + c * 977);
      const n = Math.round(Math.min(90, 40 + W / 14));
      for (let i = 0; i < n * 2; i++) {
        const lado = i % 2 ? 1 : -1;
        const x0 = lado < 0 ? -10 : W + 10;
        const y0 = H * (0.48 + r() * 0.18);
        const vel = (900 + r() * 1100) * Math.min(1.25, Math.max(0.7, W / 900));
        const ang = -0.95 - r() * 0.75;
        const vx = Math.cos(ang) * vel * -lado;
        const vy = Math.sin(ang) * vel;
        const e = Math.exp(-k * dt);
        const fx = (1 - e) / k;
        let x = x0 + vx * fx;
        let y = y0 + vy * fx + (g / k) * (dt - fx);
        x += Math.sin(dt * (7 + r() * 5) + i) * 9;
        const tamP = 5 + r() * 7;
        const rot = dt * (5 + r() * 10) + r() * TAU;
        const fade = dt > 2.1 ? 1 - (dt - 2.1) / 0.5 : 1;
        if (y > H + 20) continue;
        ctx.save();
        ctx.globalAlpha = clamp(fade);
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.scale(1, Math.cos(dt * (8 + r() * 6) + i));
        ctx.fillStyle = CONFETE[Math.floor(r() * CONFETE.length)];
        ctx.fillRect(-tamP / 2, -tamP / 2, tamP, tamP * (0.6 + r() * 0.5));
        ctx.restore();
      }
    }
  }

  function desenharFlash(ctx, t, W, H, fx) {
    if (t < 0.32) {
      ctx.fillStyle = `rgba(255,255,255,${0.82 * (1 - t / 0.32)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (t < 0.65) {
      const a = 0.75 * (1 - t / 0.65);
      const larg = Math.max(46, W * 0.07) * (1 + t * 0.6);
      const g = ctx.createLinearGradient(fx - larg, 0, fx + larg, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(fx - larg, 0, larg * 2, H);
    }
  }

  /** Bolinhas do HUD voando para o centro e estourando (fim de mundo). */
  function desenharBolinhas(ctx, t, W, H, pontos) {
    const ini = 1.45, junta = 1.95;
    if (t < ini || !pontos || !pontos.length) return;
    const cx = W / 2, cy = H * 0.42;
    if (t < junta) {
      const u = easeIn((t - ini) / (junta - ini));
      pontos.forEach((p, k) => {
        const mx = (p.x + cx) / 2 + (k - pontos.length / 2) * 24, my = Math.min(p.y, cy) - 80;
        const x = (1 - u) * (1 - u) * p.x + 2 * (1 - u) * u * mx + u * u * cx;
        const y = (1 - u) * (1 - u) * p.y + 2 * (1 - u) * u * my + u * u * cy;
        const r = 7 + u * 9;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = CORES[(k + Math.floor(t * 15)) % CORES.length];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
      });
      return;
    }
    const v = (t - junta) / 0.6;
    if (v > 1) return;
    ctx.strokeStyle = `rgba(255,255,255,${1 - v})`;
    ctx.lineWidth = 14 * (1 - v) + 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 20 + easeOut(v) * Math.max(W, H) * 0.45, 0, TAU);
    ctx.stroke();
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU;
      const d = 20 + easeOut(v) * 190;
      ctx.fillStyle = CONFETE[k % CONFETE.length];
      ctx.globalAlpha = 1 - v;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 6 * (1 - v) + 1, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /** Varredura diagonal na cor do mundo novo; cobre a tela inteira em TROCA.mundo. */
  function desenharVarredura(ctx, t, W, H, cor) {
    const ini = 2.95, fim = 3.65;
    if (t < ini || t > fim) return;
    const u = (t - ini) / (fim - ini);
    const inc = H * 0.5;
    const larg = W + inc + 80;
    // a frente entra pela esquerda e a traseira sai pela direita
    const frente = -inc + easeOut(Math.min(1, u * 2)) * (larg + inc);
    const tras = u < 0.5 ? -inc - 40 : -inc + easeIn((u - 0.5) * 2) * (larg + inc);
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(tras, H);
    ctx.lineTo(tras + inc, 0);
    ctx.lineTo(frente + inc, 0);
    ctx.lineTo(frente, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(frente, H);
    ctx.lineTo(frente + inc, 0);
    if (u > 0.5) { ctx.moveTo(tras, H); ctx.lineTo(tras + inc, 0); }
    ctx.stroke();
  }

  /**
   * Trilha do mundo (na subida de nivel e na passagem de fase, sem clique):
   * os niveis do mundo, o vencido acendendo, o proximo pulsando, o valor de
   * cada um embaixo (se vier) e o proximo alvo. trilha = { pos (1..total, o
   * nivel vencido), total, nome, rotulo, valores? }.
   */
  function desenharTrilha(ctx, t, W, H, trilha, cor, fim = TROCA.fase) {
    const ini = 0.4;
    if (!trilha || t < ini || t > fim) return;
    const u = easeOut((t - ini) / 0.35);
    const sai = t > fim - 0.2 ? (t - (fim - 0.2)) / 0.2 : 0;
    const n = trilha.total;
    const larg = Math.min(W * 0.8, 420);
    const passo = larg / (n - 1);
    const r = clamp(passo * 0.24, 8, 16);
    const tamTxt = Math.round(clamp(r * 1.3, 14, 22));
    const cy = H * 0.5 + (1 - u) * 24;
    const comValores = !!trilha.valores;
    const tamVal = Math.round(clamp(r * 0.95, 10, 15));
    const x0 = W / 2 - larg / 2;
    const xk = (k) => x0 + (k - 1) * passo;
    ctx.save();
    ctx.globalAlpha = clamp(u) * (1 - sai);
    // placa
    const px = x0 - r * 2.2, pw = larg + r * 4.4, py = cy - r * 2.2, ph = r * 3.3 + tamTxt * 1.9 + (comValores ? tamVal * 1.4 : 0);
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, r * 1.4);
    ctx.fillStyle = 'rgba(28,14,38,0.82)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    // a vencida acende em 0,7..1,0 s; a seguinte pulsa depois disso
    const acende = backOut((t - 0.7) / 0.3);
    ctx.lineCap = 'round';
    for (let k = 1; k < n; k++) {
      ctx.beginPath(); ctx.moveTo(xk(k) + r, cy); ctx.lineTo(xk(k + 1) - r, cy);
      ctx.lineWidth = Math.max(3, r * 0.35);
      ctx.strokeStyle = k < trilha.pos || (k === trilha.pos && t > 0.9) ? cor : 'rgba(255,255,255,0.3)';
      ctx.stroke();
    }
    for (let k = 1; k <= n; k++) {
      let rk = r;
      const feita = k < trilha.pos || (k === trilha.pos && t > 0.7);
      if (k === trilha.pos) rk *= t > 0.7 ? clamp(acende, 0, 1.4) * 0.25 + 0.75 : 1;
      if (k === trilha.pos + 1 && t > 1) rk *= 1 + Math.sin((t - 1) * 9) * 0.1;
      ctx.beginPath(); ctx.arc(xk(k), cy, rk, 0, TAU);
      ctx.fillStyle = feita ? cor : k === trilha.pos + 1 ? '#ffffff' : 'rgba(255,255,255,0.14)';
      ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = feita || k === trilha.pos + 1 ? '#ffffff' : 'rgba(255,255,255,0.55)'; ctx.stroke();
      if (feita) {
        // visto
        ctx.beginPath(); ctx.moveTo(xk(k) - rk * 0.42, cy + rk * 0.02); ctx.lineTo(xk(k) - rk * 0.1, cy + rk * 0.34); ctx.lineTo(xk(k) + rk * 0.45, cy - rk * 0.32);
        ctx.lineWidth = Math.max(2.5, rk * 0.26); ctx.strokeStyle = '#ffffff'; ctx.stroke();
      }
      if (comValores) {
        ctx.font = `700 ${tamVal}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = feita || k === trilha.pos + 1 ? '#ffffff' : 'rgba(255,255,255,0.55)';
        ctx.fillText(String(trilha.valores[k - 1]), xk(k), cy + r + tamVal * 0.85);
      }
    }
    // "Proximo: 256"
    ctx.font = `700 ${tamTxt}px Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const txt = `${trilha.rotulo} ${trilha.nome}`;
    const ty = cy + r * 1.3 + tamTxt * 0.95 + (comValores ? tamVal * 1.3 : 0);
    ctx.lineWidth = Math.max(3, tamTxt * 0.22); ctx.strokeStyle = '#1c0e26'; ctx.strokeText(txt, W / 2, ty, pw - r * 2);
    ctx.fillStyle = '#ffffff'; ctx.fillText(txt, W / 2, ty, pw - r * 2);
    ctx.restore();
  }

  /**
   * Desenha a camada da transicao (tela). info: { W, H, fx, texto, mundo,
   * textoMundo, pontos, corMundo, semente, trilha? }.
   */
  function desenhar(ctx, tipo, t, info) {
    const { W, H } = info;
    desenharFlash(ctx, t, W, H, info.fx);
    const canhoes = tipo === 'mundo' ? [0.12, 0.62] : [0.12];
    desenharConfete(ctx, t, W, H, info.semente || 7, canhoes);
    if (tipo === 'nivel') desenharGrito(ctx, t, W, H, info.texto || 'YES!', 0.08, 1.15, 0.9);
    else desenharGrito(ctx, t, W, H, info.texto || 'YES!');
    if (tipo === 'fase' || tipo === 'nivel') desenharTrilha(ctx, t, W, H, info.trilha, info.corMundo || '#43dd6e', TROCA[tipo]);
    if (tipo === 'mundo') {
      desenharBolinhas(ctx, t, W, H, info.pontos);
      desenharVarredura(ctx, t, W, H, info.corMundo || '#ffd84a');
      if (t > 1.95 && t < 3.95) {
        const u = (t - 1.95) / 0.32;
        const sai = t > 3.55 ? easeIn((t - 3.55) / 0.35) : 0;
        const tam = Math.min(W * 0.15, H * 0.15, 120);
        const esc = u < 1 ? 1.6 - 0.6 * backOut(u) : 1 + Math.sin(t * 7) * 0.02;
        ctx.save();
        ctx.translate(W / 2, H * 0.42 - sai * (H * 0.42 + tam));
        ctx.rotate(Math.sin(t * 9) * 0.03);
        ctx.scale(esc, esc);
        textoBlumgi(ctx, info.textoMundo || 'WORLD 2', 0, 0, tam, Math.floor(t * 15) + 3, clamp(u * 2), sai > 0 ? 6 + sai * 8 : 0);
        ctx.restore();
      }
    }
  }

  return { CORES, TROCA, FIM, camera, entrada, desenhar, textoBlumgi, easeOut, easeIn, backOut, clamp };
})();
