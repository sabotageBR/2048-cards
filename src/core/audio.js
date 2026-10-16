// Sons sintetizados com WebAudio: nenhum arquivo, nenhuma requisicao.
// O contexto so nasce no primeiro toque (politica de autoplay). O mudo do
// anuncio zera o ganho mestre ANTES de pedir o anuncio e suspende o contexto
// 80 ms depois (padrao do hexadrop: o onStart do SDK pode nao chegar).
// Infra copiada do stringcut. Sons que se repetem ficam baixos, curtos e sem
// melodia (pedido do usuario, 2026-10-16).

const ESCALA_MAIOR = [0, 2, 4, 5, 7, 9, 11];
const PENTATONICA = [0, 2, 4, 7, 9];
const DO5 = 523.25;

/**
 * Nota da fusao k (1, 2, 3...): sobe um grau da pentatonica de do a cada
 * degrau da cascata, por duas oitavas, e volta ao comeco (qualquer sequencia
 * soa afinada com o sino da subida, que e da escala maior de do).
 */
export function notaFusao(k) {
  const g = Math.max(0, Math.floor(k) - 1) % 10;
  return DO5 * Math.pow(2, (PENTATONICA[g % 5] + 12 * Math.floor(g / 5)) / 12);
}

export function criarAudio() {
  /** @type {AudioContext|null} */
  let ctx = null;
  /** @type {GainNode|null} */
  let mestre = null;
  /** @type {AudioBuffer|null} */
  let ruidoBuf = null;
  let mudo = false;
  let mudoAnuncio = false;
  let abaOculta = false;
  const VOLUME = 0.6;

  const ganhoAlvo = () => (mudo || mudoAnuncio || abaOculta ? 0 : VOLUME);

  function iniciar() {
    if (ctx) {
      if (ctx.state === 'suspended' && !mudoAnuncio && !abaOculta) ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      ctx = new AC();
      mestre = ctx.createGain();
      mestre.gain.value = ganhoAlvo();
      mestre.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }

  function aplicarGanho() {
    if (!ctx || !mestre) return;
    try {
      mestre.gain.setTargetAtTime(ganhoAlvo(), ctx.currentTime, 0.02);
    } catch { /* ignora */ }
  }

  function tom(f, dur, tipo = 'sine', vol = 0.2, f2 = 0, atraso = 0) {
    if (!ctx || !mestre || mudo || mudoAnuncio) return;
    const t = ctx.currentTime + atraso;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = /** @type {OscillatorType} */ (tipo);
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(mestre);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function ruido(dur, freq, q, vol, atraso = 0, tipo = 'bandpass', f2 = 0) {
    if (!ctx || !mestre || mudo || mudoAnuncio) return;
    if (!ruidoBuf) {
      ruidoBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.8), ctx.sampleRate);
      const d = ruidoBuf.getChannelData(0);
      let s = 12345;
      for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) >>> 0; d[i] = s / 2147483648 - 1; }
    }
    const t = ctx.currentTime + atraso;
    const s = ctx.createBufferSource();
    s.buffer = ruidoBuf;
    const f = ctx.createBiquadFilter();
    f.type = /** @type {BiquadFilterType} */ (tipo);
    f.frequency.setValueAtTime(freq, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(mestre);
    s.start(t);
    s.stop(t + dur + 0.03);
  }

  return {
    iniciar,
    tom,
    ruido,
    get ctx() { return ctx; },
    get mudo() { return mudo; },
    /** true se o som esta zerado agora (mudo, anuncio ou aba oculta) */
    get calado() { return ganhoAlvo() === 0; },
    /** @param {boolean} v */
    definirMudo(v) { mudo = v; aplicarGanho(); },
    mudoParaAnuncio() {
      mudoAnuncio = true;
      aplicarGanho();
      setTimeout(() => {
        if (mudoAnuncio && ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
      }, 80);
    },
    /** @param {boolean} oculta */
    pausarAba(oculta) {
      abaOculta = oculta;
      aplicarGanho();
      if (!ctx) return;
      if (oculta) ctx.suspend().catch(() => {});
      else if (!mudoAnuncio) ctx.resume().catch(() => {});
    },
    voltarDoAnuncio() {
      mudoAnuncio = false;
      if (ctx && ctx.state === 'suspended' && !abaOculta) ctx.resume().catch(() => {});
      aplicarGanho();
    },
    /** carta pousa na coluna: um toque grave e abafado (toca a cada jogada, entao fica baixo) */
    pouso() { ruido(0.035, 1200, 0.7, 0.05, 0, 'lowpass', 300); tom(170, 0.07, 'sine', 0.06, 110); },
    /**
     * fusao: uma batida de marimba (a nota redonda e o toque curto da baqueta,
     * 4 vezes acima), que sobe com o combo (k); a partir do 3o, um eco baixinho
     * uma oitava acima.
     */
    fusao(k = 1) {
      const f = notaFusao(k);
      tom(f, 0.34, 'sine', 0.1);
      tom(f * 4, 0.07, 'sine', 0.014);
      if (k >= 3) tom(f * 2, 0.22, 'sine', 0.025 * Math.min(1, (k - 2) / 6), 0, 0.05);
    },
    /** premio (video, missao, bau): um "ding" de uma nota, com a quinta baixinha por cima */
    completar() { tom(1046.5, 0.45, 'sine', 0.06); tom(1568, 0.3, 'sine', 0.015, 0, 0.01); },
    /** jogada recusada */
    recusa() { tom(140, 0.14, 'square', 0.05, 90); ruido(0.08, 300, 1, 0.2); },
    descartar() { ruido(0.22, 1400, 0.8, 0.25, 0, 'bandpass', 300); },
    explodir() { ruido(0.3, 500, 0.5, 0.6, 0, 'lowpass', 80); tom(90, 0.25, 'sine', 0.25, 40); },
    febre() { tom(300, 0.6, 'sawtooth', 0.04, 1200); ruido(0.6, 800, 0.5, 0.1, 0, 'bandpass', 4000); [784, 988, 1175, 1568].forEach((f, i) => tom(f, 0.2, 'triangle', 0.08, 0, 0.3 + i * 0.07)); },
    /** perigo na mesa justa (coluna quase cheia, ou o fio): duas batidas graves, como um coracao */
    alerta() { tom(75, 0.12, 'sine', 0.2, 55); tom(75, 0.12, 'sine', 0.16, 55, 0.2); },
    /** fim de partida (mesa cheia), curto e sem drama */
    fim() { [392, 330, 262].forEach((f, i) => tom(f, 0.22, 'triangle', 0.07, 0, i * 0.12)); },
    /**
     * Subida de nivel (1..8 no mundo): um sino curto e baixo, sem melodia, que
     * sobe um grau da escala a cada nivel. Toca a cada minuto: nada de fanfarra.
     */
    subida(nivel = 1) {
      const g = Math.max(0, Math.floor(nivel) - 1);
      const f = DO5 * Math.pow(2, ESCALA_MAIOR[g % 7] / 12 + Math.floor(g / 7));
      tom(f, 0.55, 'sine', 0.06);
      tom(f * 2, 0.3, 'sine', 0.015);
    },
    /** Fim do mundo (o "2048!"): um acorde de sino, as notas juntas e sem melodia, que se apaga devagar. */
    mundo() {
      [[523.25, 0.04], [659.25, 0.03], [784, 0.03], [1046.5, 0.025]].forEach(([f, v]) => tom(f, 1.3, 'sine', v));
      tom(2093, 0.5, 'sine', 0.008);
    },
    tique() { tom(900, 0.05, 'triangle', 0.08, 1200); },
    /** o 2048 saindo da mesa: um baque grave e macio (o acorde do mundo vem logo depois) */
    critico() { tom(120, 0.35, 'sine', 0.14, 50); ruido(0.12, 400, 0.6, 0.06, 0, 'lowpass', 120); },
  };
}
