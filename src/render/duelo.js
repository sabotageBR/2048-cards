// Estado visual da batalha: golpes em voo ate o monstro, vida mostrada (so
// cai quando o golpe chega), critico do monte completo e clarao; do outro
// lado, o ataque do monstro (pose, projetil, impacto, erro), a furia do
// chefao e o selo com a contagem e o proximo feitico. atualizar() muda o
// estado (com o dt e o relogio unico do jogo); desenhar() e puro.
// O estado do jogo ja tem a vida final: aqui so se escolhe QUANDO mostrar.
import { TINTA, OURO, circulo, elipse, rgba, semente, clamp, nivel, texto, escurecer } from './desenho.js';
import { CORES_DUELO } from './cartaDuelo.js';
import { desenharMonstro, monstroDaFase } from './monstros.js';

/** Formas de particula do duelo: corte, raio, orbe, caco e lasca. */
export function registrarFormas(P) {
  if (P.formas.corte) return;
  P.formas.corte = (ctx, p, u) => {
    const L = p.tam;
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.quadraticCurveTo(0, -L * 0.18, L / 2, 0);
    ctx.quadraticCurveTo(0, -L * 0.06, -L / 2, 0);
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha *= 1 - u * 0.5; ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,140,0.9)'; ctx.lineWidth = 2; ctx.stroke();
  };
  P.formas.raio = (ctx, p, u) => {
    const rnd = semente(1 + Math.floor(p.t * 40));
    const n = 9;
    ctx.save();
    ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 18;
    for (const [larg, cor] of [[p.tam * (1 - u * 0.6), '#ffe27a'], [p.tam * 0.4 * (1 - u * 0.5), '#ffffff']]) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      for (let i = 1; i < n; i++) {
        const k = i / n, j = (rnd() - 0.5) * 34 * (1 - Math.abs(k - 0.5));
        ctx.lineTo(p.dx * k + j, p.dy * k + j * 0.4);
      }
      ctx.lineTo(p.dx, p.dy);
      ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.restore();
  };
  P.formas.orbe = (ctx, p) => {
    const r0 = p.tam / 2;
    for (let k = 3; k >= 1; k--) {
      circulo(ctx, -p.vx * 0.022 * k, -p.vy * 0.022 * k, r0 * (1 - k * 0.2));
      ctx.fillStyle = rgba(p.cor, 0.5 - k * 0.12); ctx.fill();
    }
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r0 * 1.6);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, p.cor); g.addColorStop(1, rgba(p.cor, 0));
    circulo(ctx, 0, 0, r0 * 1.6); ctx.fillStyle = g; ctx.fill();
  };
  P.formas.caco = (ctx, p) => {
    ctx.beginPath(); ctx.moveTo(0, -p.tam / 2); ctx.lineTo(p.tam * 0.22, p.tam / 2); ctx.lineTo(-p.tam * 0.22, p.tam / 2); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.stroke();
  };
  P.formas.lasca = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.4); ctx.lineTo(s * 0.2, -s); ctx.lineTo(s, s * 0.1); ctx.lineTo(-s * 0.1, s); ctx.closePath();
    ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
  };
  // projeteis dos feiticos: a particula gira (rot), entao a forma se desenha na origem
  P.formas.gosma = (ctx, p) => {
    const r0 = p.tam / 2, v = Math.hypot(p.vx, p.vy) || 1;
    ctx.rotate(Math.atan2(p.vy, p.vx) - p.rot);
    for (let k = 3; k >= 1; k--) { circulo(ctx, -k * r0 * 0.7, 0, r0 * (0.55 - k * 0.1)); ctx.fillStyle = rgba(p.cor, 0.6 - k * 0.12); ctx.fill(); }
    elipse(ctx, 0, 0, r0 * (1 + Math.min(0.4, v / 2500)), r0 * 0.85); ctx.fillStyle = p.cor; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r0 * 0.14); ctx.strokeStyle = TINTA; ctx.stroke();
    elipse(ctx, r0 * 0.15, -r0 * 0.3, r0 * 0.3, r0 * 0.18); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
  };
  P.formas.rocha = (ctx, p) => {
    const s = p.tam / 2;
    ctx.beginPath(); ctx.moveTo(-s, -s * 0.2); ctx.lineTo(-s * 0.5, -s * 0.9); ctx.lineTo(s * 0.4, -s * 0.85); ctx.lineTo(s, -s * 0.1); ctx.lineTo(s * 0.6, s * 0.8); ctx.lineTo(-s * 0.55, s * 0.85); ctx.closePath();
    const g = ctx.createLinearGradient(0, -s, 0, s); g.addColorStop(0, '#c8beb2'); g.addColorStop(1, '#6e665e');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1.5, s * 0.14); ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.1, s * 0.1); ctx.lineTo(s * 0.05, s * 0.5); ctx.lineWidth = Math.max(1, s * 0.08); ctx.strokeStyle = 'rgba(40,30,30,0.5)'; ctx.stroke();
  };
  P.formas.cristal = (ctx, p) => {
    const s = p.tam / 2;
    ctx.save(); ctx.shadowColor = '#bff1ff'; ctx.shadowBlur = s;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.55, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.55, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(200,240,255,0.95)'; ctx.fill(); ctx.restore();
    ctx.lineWidth = Math.max(1.2, s * 0.1); ctx.strokeStyle = '#3f8fc0'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(-s * 0.2, 0); ctx.strokeStyle = '#ffffff'; ctx.stroke();
  };
  P.formas.elo = (ctx, p) => {
    const s = p.tam / 14;
    for (const [dx, cheio] of [[-6, false], [6, true]]) {
      elipse(ctx, dx * s, 0, 8 * s, cheio ? 3 * s : 5 * s);
      if (cheio) { ctx.fillStyle = '#9aa3b3'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); }
      else { ctx.lineWidth = 3.2 * s; ctx.strokeStyle = '#2b2f38'; ctx.stroke(); ctx.lineWidth = 1.8 * s; ctx.strokeStyle = '#d3d9e3'; ctx.stroke(); }
    }
  };
}

/** Icone de cada feitico (selo da contagem). */
export function iconeFeitico(ctx, feitico, x, y, r, corLodo = '#9a6bff') {
  ctx.save(); ctx.translate(x, y);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const lw = Math.max(1.5, r * 0.14);
  switch (feitico) {
    case 'lodo': {
      ctx.beginPath(); ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.95, -r * 0.05, r * 0.8, r, 0, r);
      ctx.bezierCurveTo(-r * 0.8, r, -r * 0.95, -r * 0.05, 0, -r);
      ctx.fillStyle = corLodo; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
      elipse(ctx, -r * 0.28, r * 0.15, r * 0.15, r * 0.25, 0.3); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
      break;
    }
    case 'pedra': {
      ctx.beginPath(); ctx.moveTo(-r, r * 0.1); ctx.lineTo(-r * 0.55, -r * 0.75); ctx.lineTo(r * 0.35, -r * 0.85); ctx.lineTo(r, -r * 0.05); ctx.lineTo(r * 0.7, r * 0.8); ctx.lineTo(-r * 0.6, r * 0.8); ctx.closePath();
      const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#d2c8bc'); g.addColorStop(1, '#7a7168');
      ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = TINTA; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.4); ctx.lineTo(r * 0.1, r * 0.05); ctx.lineTo(0, r * 0.45); ctx.lineWidth = lw * 0.6; ctx.stroke();
      break;
    }
    case 'gelo': {
      ctx.strokeStyle = '#2a5f8a'; ctx.lineWidth = lw * 1.9;
      const raios = () => { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3 + Math.PI / 2; ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(-Math.cos(a) * r, -Math.sin(a) * r); } for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3 + Math.PI / 2, bx = Math.cos(a) * r * 0.6, by = Math.sin(a) * r * 0.6; for (const d of [-0.6, 0.6]) { ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + d) * r * 0.32, by + Math.sin(a + d) * r * 0.32); } } };
      raios(); ctx.stroke();
      ctx.strokeStyle = '#d8f4ff'; ctx.lineWidth = lw * 0.9; raios(); ctx.stroke();
      break;
    }
    case 'corrente': {
      for (const [dx, a, cheio] of [[-r * 0.38, -0.7, false], [r * 0.38, -0.7, true]]) {
        ctx.save(); ctx.translate(dx, 0); ctx.rotate(a);
        elipse(ctx, 0, 0, r * 0.62, r * 0.36);
        ctx.lineWidth = r * 0.3; ctx.strokeStyle = TINTA; ctx.stroke();
        ctx.lineWidth = r * 0.16; ctx.strokeStyle = cheio ? '#c3cad6' : '#e8ecf2'; ctx.stroke();
        ctx.restore();
      }
      break;
    }
    default: break;
  }
  ctx.restore();
}

const VOO = 0.32;        // s do orbe da carta ate o monstro
const GOLPE_MS = 260;    // monstro piscando e tremendo
const CLARAO_MS = 420;   // tela clara do critico
const ATAQUE_MS = 580;   // pose do ataque (solta em 45%, quando o projetil sai)
const FURIA_MS = 700;    // rugido da furia
const TROCA_MS = 950;    // cadeia: do monstro caido ate o proximo entrar
const ENTRADA_MS = 520;  // o proximo monstro cresce do chao

/** Cor do projetil e do respingo de cada feitico. */
const COR_FEITICO = { pedra: '#9a8f84', gelo: '#bfeaff', corrente: '#c3cad6' };
const FORMA_FEITICO = { lodo: 'gosma', pedra: 'rocha', gelo: 'cristal', corrente: 'elo' };

export function criarDuelo() {
  let def = monstroDaFase({});
  /** @type {{ t: number, dano: number, degrau: number, critico?: boolean }[]} */
  let fila = [];
  let golpe = -1e9, clarao = -1e9, tAtaque = -1e9, tFuria = -1e9, tDerrota = -1e9, tEntrada = -1e9;
  let hp = 1, hpVis = 1, derrotou = false, furia = false;
  /** cadeia: o proximo monstro, esperando o atual cair (a vida mostrada mira o zero) */
  let pendente = null;
  const rnd = semente(5);
  const corLodo = () => def.corA || '#9a6bff';

  /** Fase nova: monstro novo e vida cheia (ou a do estado retomado). */
  function novaBatalha(defNovo, vida, emFuria = false) {
    def = defNovo || def;
    fila = []; golpe = -1e9; clarao = -1e9; tAtaque = -1e9; tFuria = -1e9; tDerrota = -1e9; tEntrada = -1e9; derrotou = false;
    hp = hpVis = vida;
    furia = emFuria;
    pendente = null;
  }
  /** Desfazer: os golpes em voo somem e o monstro, a vida e a furia voltam na hora. */
  function sincronizar(vida, emFuria = false, defEstado = null) {
    fila = []; derrotou = false; tAtaque = -1e9; pendente = null;
    if (defEstado) def = defEstado;
    hp = hpVis = vida;
    furia = emFuria;
  }
  /** Cadeia: o monstro atual caiu no motor; os golpes em voo levam a vida a zero e o proximo entra depois. */
  function esperarDerrota(proximo) { pendente = proximo; }

  /** O monstro se prepara para lancar o feitico (pose e brilho na boca). */
  function atacar(fx, agora, P, m) {
    tAtaque = agora;
    if (!m) return;
    const cor = fx.feitico === 'lodo' ? corLodo() : COR_FEITICO[fx.feitico] || '#ffffff';
    const esc = clamp(m.R / 78, 0.6, 1.4);
    P.subir(fx.x, fx.y - m.R * 0.2, [cor, '#ffffff'], 8, { tam: 6 * esc, vida: 0.55, larg: m.R * 1.4, forca: 1.3, forma: 'estrela' });
  }

  /** Projetil do monstro ate o alvo, em arco, chegando em fx.dur ms. */
  function lancar(fx, P, m) {
    const T = fx.dur / 1000, g = 900;
    const dx = fx.para.x - fx.de.x, dy = fx.para.y - fx.de.y;
    const esc = m ? clamp(m.R / 78, 0.6, 1.4) : 1;
    const cor = fx.feitico === 'lodo' ? corLodo() : COR_FEITICO[fx.feitico] || '#ffffff';
    P.add({
      forma: FORMA_FEITICO[fx.feitico] || 'c', x: fx.de.x, y: fx.de.y, vx: dx / T, vy: (dy - 0.5 * g * T * T) / T, g, arrasto: 1,
      vida: T, tam: (fx.feitico === 'corrente' ? 42 : 34) * esc, cor, vr: fx.feitico === 'lodo' ? 0 : 9, firme: true,
    });
  }

  /** Impacto do feitico na mesa. */
  function impactar(fx, P, esc) {
    switch (fx.feitico) {
      case 'lodo': {
        const c = corLodo();
        P.estourar(fx.x, fx.y, [c, escurecer(c, 0.3), '#ffffff'], 16, 0.9 * esc, { forma: 'c', tam: 8 * esc, g: 700, vida: 0.55 });
        P.anel(fx.x, fx.y, c, 46 * esc);
        break;
      }
      case 'pedra':
        P.estourar(fx.x, fx.y, ['#9a8f84', '#c3b8ab', '#6e665e'], 14, 1.0 * esc, { forma: 'lasca', tam: 9 * esc });
        P.subir(fx.x, fx.y, ['rgba(160,145,130,0.7)', 'rgba(200,190,175,0.6)'], 6, { tam: 14 * esc, vida: 0.8, larg: 40 * esc });
        break;
      case 'gelo':
        P.estourar(fx.x, fx.y, ['#e1f6ff', '#9fdcff', '#ffffff'], 18, 0.9 * esc, { forma: 'caco', tam: 10 * esc, g: 300 });
        P.flocos(fx.x, fx.y, 12);
        P.anel(fx.x, fx.y, '#bff1ff', 50 * esc);
        break;
      case 'corrente':
        P.estourar(fx.x, fx.y, ['#c3cad6', '#8b93a3', '#ffe27a'], 14, 0.9 * esc, { forma: 'q', tam: 6 * esc });
        P.anel(fx.x, fx.y, '#c3cad6', 52 * esc);
        break;
      default: break;
    }
  }

  /** Feitico sem alvo: o projetil se desfaz no ar. */
  function errar(fx, P, esc, txt) {
    P.subir(fx.x, fx.y, ['rgba(255,255,255,0.8)', 'rgba(220,220,230,0.7)'], 8, { tam: 12 * esc, vida: 0.7, larg: 30 * esc });
    P.texto(fx.x, fx.y - 10 * esc, txt.errou || 'MISS!', '#ffffff', 26 * esc, TINTA);
  }

  /** Furia do chefao: rugido, faisca vermelha e o aviso. */
  function enfurecer(agora, P, m, txt) {
    furia = true; tFuria = agora;
    if (!m) return;
    const esc = clamp(m.R / 78, 0.6, 1.4);
    P.estourar(m.x, m.y - m.R, ['#ff3b3b', '#ff9a3d', '#ffe27a'], 26, 1.4 * esc, { forma: 'estrela', tam: 10 * esc, g: 200 });
    P.anel(m.x, m.y - m.R, '#ff3b3b', m.R * 1.6, 0.6);
    P.texto(m.x, m.y - m.R * 2.05, txt.enfurecido || 'ENRAGED!', '#ff4a4a', 30 * esc, '#2a0a10');
  }

  /** Efeito da linha do tempo que vira golpe: dispara o orbe (ou o raio) e agenda a chegada. */
  function golpear(fx, agora, P, m) {
    if (!m) return;
    const alvoY = m.y - m.R * 0.8;
    const esc = clamp(m.R / 78, 0.6, 1.4);
    if (fx.tipo === 'fusao') {
      const cor = CORES_DUELO[Math.min(11, nivel(fx.valor))];
      P.add({ forma: 'orbe', x: fx.x, y: fx.y, vx: (m.x - fx.x) / VOO, vy: (alvoY - fx.y) / VOO, g: 0, arrasto: 1, vida: VOO, tam: (14 + fx.degrau * 3) * esc, cor });
      fila.push({ t: agora + VOO * 1000, dano: fx.dano || fx.valor, degrau: fx.degrau });
    } else if (fx.tipo === 'completar') {
      P.add({ forma: 'raio', x: fx.x, y: fx.y, dx: m.x - fx.x, dy: alvoY - fx.y, vida: 0.5, tam: 12 * esc, cor: '#fff3a0' });
      fila.push({ t: agora + 140, dano: fx.dano || fx.valor, degrau: 4, critico: true });
    }
  }

  function aplicarGolpe(g, agora, P, m, txt) {
    golpe = agora;
    const esc = clamp(m.R / 78, 0.6, 1.4);
    const jx = (rnd() - 0.5) * m.R * 0.9;
    if (g.critico) {
      clarao = agora;
      P.texto(m.x, m.y - m.R * 2.05, txt.critico || 'CRITICAL!', '#ffe27a', 34 * esc, '#a3122b');
      P.texto(m.x + jx * 0.3, m.y - m.R * 1.1, '-' + g.dano, '#ffffff', 40 * esc, '#a3122b');
      P.estourar(m.x, m.y - m.R * 0.8, ['#ffe27a', '#ffffff', '#ff8a3d'], 34, 1.6 * esc, { forma: 'estrela', tam: 12 * esc, g: 300 });
      for (let k = 0; k < 3; k++) P.add({ forma: 'corte', x: m.x, y: m.y - m.R * (0.5 + k * 0.32), vida: 0.35, tam: m.R * 2.2, rot: -0.7 + k * 0.7, cor: '#fff' });
    } else {
      P.texto(m.x + jx, m.y - m.R * 1.3, '-' + g.dano, '#ffffff', (20 + Math.min(12, g.degrau * 3)) * esc, '#a3122b');
      P.add({ forma: 'corte', x: m.x + jx * 0.4, y: m.y - m.R * 0.8, vida: 0.26, tam: m.R * 1.7, rot: -0.65 + (rnd() - 0.5) * 0.4, cor: '#fff' });
      P.estourar(m.x + jx * 0.4, m.y - m.R * 0.8, ['#ffffff', '#ffe27a'], 8, 0.7 * esc, { forma: 'c', tam: 5 * esc });
    }
  }

  /**
   * @param {number} dt s
   * @param {number} agora ms
   * @param {number} vidaReal vida do estado (0..1)
   * @param {number} [porVir] golpes da jogada que ainda nao sairam da mesa (linha.golpesPorVir)
   * @returns {any[]} golpes que chegaram e a derrota do monstro (para o som)
   */
  function atualizar(dt, agora, vidaEstado, P, m, txt, porVir = 0) {
    const out = [];
    const vidaReal = pendente ? 0 : vidaEstado;
    if (vidaReal > hp && !fila.length) hp = vidaReal;
    if (fila.length && m) {
      const chegaram = fila.filter((g) => agora >= g.t);
      if (chegaram.length) {
        fila = fila.filter((g) => agora < g.t);
        chegaram.forEach((g, i) => {
          aplicarGolpe(g, agora, P, m, txt);
          // a queda se divide entre todos os golpes da jogada, ate os que nem sairam
          const faltam = fila.length + porVir + chegaram.length - 1 - i;
          hp -= (hp - Math.min(hp, vidaReal)) / (faltam + 1);
          out.push({ tipo: 'golpe', critico: !!g.critico, dano: g.dano });
        });
      }
    } else if (!m) fila = [];
    // salvaguarda: progresso sem golpe (bomba, martelo) alcanca a vida real devagar
    // (com golpe agendado, nao: a barra so desce quando ele chega)
    const ocioso = !fila.length && !porVir;
    if (ocioso && agora - golpe > 900 && hp > vidaReal) hp += (vidaReal - hp) * (1 - Math.pow(0.88, dt * 60));
    if (hpVis < hp) hpVis = hp;
    hpVis += (hp - hpVis) * (1 - Math.pow(0.94, dt * 60));
    // o monstro cai no ultimo golpe da jogada, nao antes
    if (!derrotou && ocioso && vidaReal <= 0 && hp <= 0.001) { derrotou = true; tDerrota = agora; hp = 0; out.push({ tipo: 'derrotado' }); }
    // cadeia: o caido some numa nuvem e o proximo entra
    if (pendente && derrotou && agora - tDerrota >= TROCA_MS) {
      if (m) {
        const esc = clamp(m.R / 78, 0.6, 1.4);
        P.subir(m.x, m.y - m.R * 0.3, ['rgba(255,255,255,0.9)', 'rgba(230,225,240,0.8)'], 12, { tam: 22 * esc, vida: 0.7, larg: m.R * 1.8, forca: 0.8 });
        P.estourar(m.x, m.y - m.R * 0.9, ['#ffe27a', '#ffffff'], 14, 1.1 * esc, { forma: 'estrela', tam: 9 * esc, g: 200 });
      }
      def = pendente; pendente = null;
      derrotou = false; furia = false; fila = [];
      hp = hpVis = vidaEstado;
      tEntrada = agora; tAtaque = -1e9; tFuria = -1e9;
      out.push({ tipo: 'novoMonstro', def });
    }
    return out;
  }

  function desenhar(ctx, m, t, agora) {
    const golpeU = clamp((agora - golpe) / GOLPE_MS);
    const ataque = (agora - tAtaque) / ATAQUE_MS;
    // o rugido da furia e um ataque sem projetil
    const rugido = (agora - tFuria) / FURIA_MS;
    const pose = { golpe: golpeU, derrotado: derrotou, furia, ataque: ataque >= 0 && ataque < 1 ? ataque : rugido >= 0 && rugido < 1 ? 0.45 + rugido * 0.55 : 1 };
    // cadeia: o caido afunda antes da nuvem; o novo cresce do chao com um quique
    const queda = derrotou && pendente ? clamp((agora - tDerrota - TROCA_MS * 0.55) / (TROCA_MS * 0.45)) : 0;
    const u = (agora - tEntrada) / ENTRADA_MS;
    const k = queda > 0 ? 1 - queda : u >= 0 && u < 1 ? 1 + 1.6 * Math.pow(u - 1, 3) + 0.6 * Math.pow(u - 1, 2) : 1;
    if (k === 1) { desenharMonstro(ctx, def, m, t, pose); return; }
    if (k <= 0.01) return;
    ctx.save();
    ctx.translate(m.x, m.y); ctx.scale(k, k); ctx.translate(-m.x, -m.y);
    desenharMonstro(ctx, def, m, t, pose);
    ctx.restore();
  }

  /**
   * Selo da contagem: icone do proximo feitico e quantas jogadas faltam,
   * ao lado da cabeca do monstro (pulsa quando falta 1).
   * @param {any} mon estado.monstro (da mesa visivel) ou null
   * @param {number} limite x maximo (a mesa, em paisagem; a tela, em retrato)
   */
  function selo(ctx, m, mon, agora, limite) {
    if (!m || !mon || derrotou || pendente) return;
    const r = Math.max(15, m.R * 0.3);
    const x = Math.min(m.x + m.R * 1.25, limite - r - 4), y = m.y - m.R * 1.72;
    const urgente = mon.conta <= 1;
    const k = urgente ? 1 + 0.08 * Math.sin(agora / 90) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    if (urgente || furia) { ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = r * 0.8; }
    circulo(ctx, 0, 0, r); ctx.fillStyle = '#2a1630'; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(2, r * 0.16); ctx.strokeStyle = urgente || furia ? '#ff4a4a' : OURO; ctx.stroke();
    iconeFeitico(ctx, mon.proximo, -r * 0.08, -r * 0.08, r * 0.55, corLodo());
    const nr = r * 0.48;
    circulo(ctx, r * 0.62, r * 0.6, nr); ctx.fillStyle = urgente ? '#ef4466' : '#ffd23f'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.strokeStyle = TINTA; ctx.stroke();
    texto(ctx, String(Math.max(0, mon.conta)), r * 0.62, r * 0.62, nr * 1.35, urgente ? '#ffffff' : TINTA, { max: nr * 1.6 });
    ctx.restore();
  }

  /** Por cima de tudo: clarao do critico e vinheta vermelha da furia (febre). */
  function frente(ctx, W, H, agora, febre) {
    const u = (agora - clarao) / CLARAO_MS;
    if (u >= 0 && u < 1) { ctx.fillStyle = `rgba(255,250,225,${0.75 * (1 - u) * (1 - u)})`; ctx.fillRect(0, 0, W, H); }
    if (febre) {
      const k = 0.5 + 0.5 * Math.sin(agora / 125);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,40,60,0)'); g.addColorStop(1, `rgba(255,40,60,${0.25 + 0.2 * k})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }

  return {
    novaBatalha, sincronizar, esperarDerrota, golpear, atualizar, desenhar, frente, selo, atacar, lancar, impactar, errar, enfurecer,
    get hp() { return hp; }, get hpVis() { return hpVis; }, get def() { return def; }, get ocupado() { return fila.length > 0; }, get furia() { return furia; },
  };
}

