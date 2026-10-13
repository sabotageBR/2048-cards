// Festa da subida de nivel e transicao de fim de mundo no estilo do Blumgi
// Bounce (porte de stringcut/src/render/transicoes.js). Tudo e funcao pura
// do tempo t (s desde o inicio), sem relogio proprio.
/*
 * Festa (subida de nivel; nao bloqueia, a mesa nao troca): clarao suave ->
 *        o valor feito ("128!") entra, pisca e sai por cima (~1,8 s) -> um
 *        canhao de confete nas cores do mundo (ate FESTA_FIM). O jogador
 *        continua jogando por baixo; a explosao de particulas do mundo sai
 *        de efeitos.js, nao daqui.
 * Mundo (~3,3 s ate trocar): flash branco + feixe + soco de camera -> "2048!"
 *        com extrusao colorida ciclando -> confete dos dois lados -> "2048!"
 *        sai por cima -> "WORLD N" e a varredura diagonal na cor do mundo ->
 *        corte para o mundo novo, que nasce lavado de branco e com zoom 1,25x
 *        recuando para 1.
 */
export const Transicoes = (() => {
  const TAU = Math.PI * 2;
  const CORES = ['#ff4fa3', '#ff9a3d', '#ffd93b', '#43dd6e', '#2fd0ff', '#5b7cff', '#a55bff', '#ff5be0'];
  const CONFETE = ['#ff4fa3', '#ffd93b', '#7a5cff', '#3ee08f', '#38c8ff', '#ff8a3d', '#ffffff'];
  const TROCA = { mundo: 3.3 };
  const FIM = { mundo: 3.95 };
  /** Fim da festa da subida de nivel (s): o confete acaba. */
  const FESTA_FIM = 2.6;

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

  /** Entrada do mundo novo (t = s desde a troca): zoom 1,25 -> 1 e lavado branco. */
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

  /**
   * O grito ("2048!", "128!"): entra, treme, sai por cima. op.y troca a altura
   * (padrao H*0,3); op.pisca faz o texto pulsar e piscar enquanto fica.
   */
  function desenharGrito(ctx, t, W, H, txt, ini = 0.08, sai = 1.3, tamFator = 1, op = {}) {
    if (t < ini || t > sai + 0.32) return;
    // textos longos ("VITORIA!") encolhem para caber na largura
    const tam = Math.min(W * 0.22, H * 0.2, 170) * tamFator * Math.min(1, 5 / Math.max(4, txt.length));
    const u = (t - ini) / 0.3;
    let esc = u < 1 ? 1.7 - 0.7 * backOut(u) : 1;
    if (u >= 1) esc = 1 + Math.sin((t - ini) * 9) * 0.015;
    let alpha = clamp(0.3 + u * 1.6);
    const y0 = op.y !== undefined ? op.y : H * 0.3;
    let y = y0;
    let glitch = u < 0.6 ? (1 - u / 0.6) * 10 : 0;
    if (op.pisca && u >= 1) {
      esc *= 1 + Math.sin((t - ini) * 14) * 0.06;
      alpha *= 0.78 + 0.22 * Math.sin((t - ini) * 20);
    }
    if (t > sai) {
      const v = (t - sai) / 0.3;
      y -= easeIn(v) * (y0 + tam * 1.2);
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

  /** Confete fechado no tempo: canhoes nas duas laterais (pos. pura de t), nas cores dadas. */
  function desenharConfete(ctx, t, W, H, semente, inicios, cores = CONFETE) {
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
        ctx.fillStyle = cores[Math.floor(r() * cores.length)];
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

  /** Varredura diagonal na cor do mundo que termina; cobre a tela inteira em TROCA.mundo. */
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
   * A festa da subida de nivel, por cima do jogo (nao bloqueia):
   * info = { W, H, texto, y (altura do texto), cores (confete), semente }.
   */
  function festa(ctx, t, info) {
    const { W, H } = info;
    if (t < 0 || t > FESTA_FIM) return;
    if (t < 0.25) { ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - t / 0.25)})`; ctx.fillRect(0, 0, W, H); }
    desenharConfete(ctx, t, W, H, info.semente || 7, [0.1], info.cores || CONFETE);
    desenharGrito(ctx, t, W, H, info.texto || '16!', 0.05, 1.45, 0.8, { y: info.y, pisca: true });
  }

  /**
   * Desenha a camada da transicao de fim de mundo (tela). info: { W, H, fx,
   * texto, textoMundo, corMundo, cores (confete), semente }.
   */
  function desenhar(ctx, tipo, t, info) {
    const { W, H } = info;
    desenharFlash(ctx, t, W, H, info.fx);
    desenharConfete(ctx, t, W, H, info.semente || 7, [0.12, 0.62], info.cores);
    desenharGrito(ctx, t, W, H, info.texto || '2048!');
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

  return { CORES, TROCA, FIM, FESTA_FIM, camera, entrada, desenhar, festa, textoBlumgi, easeOut, easeIn, backOut, clamp };
})();
