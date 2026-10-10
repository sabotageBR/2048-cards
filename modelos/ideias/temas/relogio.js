// Ideia de JOGABILIDADE (rodada 3): Corrida contra o Relogio. Um pavio de 60 s
// queima no alto; cada fusao devolve tempo (400 ms + 300 ms por degrau a mais
// da cascata) e cada monte, +10 s. A febre faz o pavio queimar na metade da
// velocidade. Acabou o pavio, acabou a partida: vale a pontuacao.
// O tempo ganho entra no instante em que a fusao aparece na tela (efeito), em
// sincronia com o "+0,7 s"; o pavio nao apaga com uma cascata ainda rolando.
// Visual limpo (o mesmo desenho de cartas do Duelo), com acento ambar.
import { TAU, rr, circulo, texto, escurecer, rgba, clamp, semente } from '../kit.js';
import { criarPartida } from '../../../src/jogo/partida.js';
import { FONTE_LIMPA, milhar, cartaLimpa, mesaLimpa, descarteLimpo, cadeadoLimpo, efeitoLimpo, rotuloSobe } from './rival.js';

const AMBAR = '#ffb547';
const VERMELHO = '#ff5a4d';
const TEMPO_INICIAL = 60000;
const fmt = (ms) => (Math.max(0, ms) / 1000).toFixed(1).replace('.', ',');
const ganhoFusao = (degrau) => 400 + 300 * (degrau - 1);

const FASE_CORRIDA = {
  id: 0, mundo: 0, modo: 'corrida', semente: 6060,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.05, bomba: 0.03, dobro: 0.03 } },
  inicio: [[512, 256, 128], [64, 32], [16, 8], []],
  obst: { pedras: { 3: 2 }, gelo: { 2: [4] } },
  metas: [], estrelas: [0, 0, 0],
};

let vitrineAtual = false;
let recorde = 0;
let ultimoFoiRecorde = false;

const carta = (id, v) => ({ id, tipo: 'normal', v, cor: 0 });

/** Encerra a corrida (uma vez): guarda o recorde da sessao. */
function encerrar(inst, motivo, agora) {
  const m = inst.mem;
  if (m.encerrado) return;
  m.encerrado = true;
  ultimoFoiRecorde = inst.e.pontos > recorde && inst.e.pontos > 0;
  if (ultimoFoiRecorde) recorde = inst.e.pontos;
  if (motivo && !inst.e.fim) { inst.e = { ...inst.e, fim: motivo }; inst.fimEm = agora; }
}

/** Pavio: corda que encurta, cinza queimada atras e a faisca na ponta acesa. */
function pavio(ctx, x0, x1, y, f, t, critico, febre) {
  const xp = x0 + (x1 - x0) * f;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.setLineDash([2, 5]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(xp, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.setLineDash([]);
  const pulso = critico ? 0.65 + 0.35 * Math.abs(Math.sin(t * 6)) : 1;
  const cor = critico ? VERMELHO : '#e6c391';
  if (xp > x0 + 1) {
    ctx.globalAlpha = pulso;
    ctx.lineWidth = 8; ctx.strokeStyle = escurecer(cor, 0.45);
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xp, y); ctx.stroke();
    ctx.lineWidth = 5.5; ctx.strokeStyle = cor;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xp, y); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = rgba(escurecer(cor, 0.5), 0.75);
    for (let x = x0 + 3; x < xp - 3; x += 6) { ctx.beginPath(); ctx.moveTo(x, y + 2.4); ctx.lineTo(x + 3, y - 2.4); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  // faisca
  const quente = febre ? '#8fe3ff' : AMBAR;
  const rg = 12 + 3 * Math.sin(t * 23) + 2 * Math.sin(t * 37);
  const g = ctx.createRadialGradient(xp, y, 0, xp, y, rg);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, quente); g.addColorStop(1, rgba(quente, 0));
  ctx.fillStyle = g; circulo(ctx, xp, y, rg); ctx.fill();
  ctx.strokeStyle = rgba(quente, 0.9); ctx.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    const a = i * (TAU / 7) + t * 5;
    const l = 5 + 5 * Math.abs(Math.sin(t * 17 + i * 1.7));
    ctx.beginPath(); ctx.moveTo(xp + Math.cos(a) * 4, y + Math.sin(a) * 4); ctx.lineTo(xp + Math.cos(a) * (4 + l), y + Math.sin(a) * (4 + l)); ctx.stroke();
  }
  ctx.restore();
}

function pilula(ctx, x, y, txt, cor, alinhar = 'left') {
  ctx.font = `700 11px ${FONTE_LIMPA}`;
  const w = ctx.measureText(txt).width + 16;
  const x0 = alinhar === 'left' ? x : x - w;
  rr(ctx, x0, y - 10, w, 20, 10); ctx.fillStyle = rgba(cor, 0.16); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = rgba(cor, 0.6); ctx.stroke();
  texto(ctx, txt, x0 + w / 2, y, 11, cor, { fonte: FONTE_LIMPA, peso: 700 });
}

const tema = {
  id: 'relogio',
  nome: 'Corrida contra o Relógio',
  cores: { texto: '#ffffff', destaque: AMBAR, particulas: [AMBAR, '#ffffff'] },
  faixas: (W, H) => (W > H * 1.15 ? { topo: 112, base: 0 } : { topo: 142, base: 0 }),

  fundo(ctx, W, H, L) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#121217'); g.addColorStop(1, '#1b1418');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const brilho = ctx.createRadialGradient(W / 2, 40, 0, W / 2, 40, Math.max(W, 420) * 0.7);
    brilho.addColorStop(0, 'rgba(255,181,71,0.12)'); brilho.addColorStop(1, 'rgba(255,181,71,0)');
    ctx.fillStyle = brilho; ctx.fillRect(0, 0, W, H);
    // mostrador de relogio bem apagado atras da mesa
    const m = L.mesa, cx = m.x + m.w / 2, cy = m.y + m.h / 2, R = Math.max(m.w, m.h) * 0.62;
    ctx.strokeStyle = 'rgba(255,181,71,0.05)';
    ctx.lineWidth = 1; circulo(ctx, cx, cy, R); ctx.stroke();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU, l = i % 5 ? 6 : 14;
      ctx.lineWidth = i % 5 ? 1 : 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    const rnd = semente(4);
    for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(255,214,150,${0.03 + rnd() * 0.06})`; circulo(ctx, rnd() * W, rnd() * H, rnd() * 1.4 + 0.4); ctx.fill(); }
  },

  mesa(ctx, L, e) { mesaLimpa(ctx, L, e, AMBAR); },
  peca(ctx, k, r, op) { cartaLimpa(ctx, k, r, op); },
  cadeado(ctx, a, c, e) { cadeadoLimpo(ctx, a, c, e); },
  descarte(ctx, r, e) { descarteLimpo(ctx, r, e, AMBAR); },
  fila(ctx, L) {
    const p = L.filaPos(0);
    texto(ctx, 'próxima', p.x + p.w / 2, p.y - 12, 11, 'rgba(255,255,255,0.5)', { fonte: FONTE_LIMPA, peso: 600 });
  },

  hud(ctx, W, H, L, e, t, mem) {
    const agora = t * 1000;
    const tempo = mem.tempo ?? TEMPO_INICIAL;
    const critico = tempo < 10000 && !e.fim;
    const febre = !!mem.febreAtiva;
    // pavio
    const y = 34, x0 = 24, x1 = W - 112;
    pavio(ctx, x0, x1, y, clamp(tempo / TEMPO_INICIAL), t, critico, febre);
    const esc = critico ? 1 + 0.08 * Math.abs(Math.sin(t * 6)) : 1;
    ctx.save();
    ctx.translate(W - 24, y + 1); ctx.scale(esc, esc);
    texto(ctx, fmt(tempo) + ' s', 0, 0, 24, critico ? VERMELHO : '#ffffff', { alinhar: 'right', fonte: FONTE_LIMPA, peso: 800 });
    ctx.restore();
    if (tempo > TEMPO_INICIAL) pilula(ctx, x1 - 6, y + 22, `+${fmt(tempo - TEMPO_INICIAL)} s guardados`, AMBAR, 'right');
    if (mem.ganhoEm && agora - mem.ganhoEm < 700) {
      const u = (agora - mem.ganhoEm) / 700;
      ctx.save(); ctx.globalAlpha = 1 - u;
      texto(ctx, `+${fmt(mem.ganho)} s`, W - 24, y + 24 - u * 10, 13, AMBAR, { alinhar: 'right', fonte: FONTE_LIMPA, peso: 800 });
      ctx.restore();
    }
    if (febre) pilula(ctx, x0 - 4, y + 22, 'FEBRE · pavio a ½', '#8fe3ff');
    // placar grande
    const py = L.fila.vertical ? 82 : 96;
    texto(ctx, milhar(e.pontos), W / 2, py, 38, '#ffffff', { fonte: FONTE_LIMPA, peso: 800, sombra: 'rgba(0,0,0,0.35)' });
    texto(ctx, recorde > 0 ? `pontos · recorde ${milhar(recorde)}` : 'pontos', W / 2, py + 27, 11.5, 'rgba(255,255,255,0.5)', { fonte: FONTE_LIMPA, peso: 600 });
  },

  efeito(fx, P, mem, agora) {
    const tratou = efeitoLimpo(fx, P, AMBAR);
    if (mem.encerrado) return tratou;
    let ganho = 0;
    if (fx.tipo === 'fusao') {
      ganho = ganhoFusao(fx.degrau);
      rotuloSobe(P, fx.x + 30, fx.y - 4, `+${fmt(ganho)} s`, AMBAR, 15);
    } else if (fx.tipo === 'completar') {
      ganho = 10000;
      rotuloSobe(P, fx.x, fx.y - 58, '+10 s', AMBAR, 24);
    }
    if (ganho) {
      mem.tempo = (mem.tempo ?? TEMPO_INICIAL) + ganho;
      mem.ganho = mem.ganhoEm && agora - mem.ganhoEm < 700 ? mem.ganho + ganho : ganho;
      mem.ganhoEm = agora;
    }
    return tratou;
  },

  fim(ctx, W, H, e) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,7,10,0.72)'; ctx.fillRect(0, 0, W, H);
    const w = Math.min(W - 40, 340), h = 200, x = W / 2 - w / 2, y = H * 0.42 - h / 2;
    ctx.shadowColor = rgba(AMBAR, 0.45); ctx.shadowBlur = 26;
    rr(ctx, x, y, w, h, 18); ctx.fillStyle = 'rgba(24,20,24,0.97)'; ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, x, y, w, h, 18); ctx.lineWidth = 2; ctx.strokeStyle = AMBAR; ctx.stroke();
    texto(ctx, e.fim === 'tempo' ? 'Tempo!' : 'Sem jogadas', W / 2, y + 42, 30, AMBAR, { fonte: FONTE_LIMPA, peso: 800 });
    texto(ctx, milhar(e.pontos), W / 2, y + 92, 40, '#ffffff', { fonte: FONTE_LIMPA, peso: 800 });
    texto(ctx, ultimoFoiRecorde ? 'novo recorde!' : `recorde ${milhar(recorde)}`, W / 2, y + 128, 14, ultimoFoiRecorde ? AMBAR : 'rgba(255,255,255,0.6)', { fonte: FONTE_LIMPA, peso: 700 });
    texto(ctx, 'toque para correr de novo', W / 2, y + 168, 14, 'rgba(255,255,255,0.7)', { fonte: FONTE_LIMPA, peso: 600 });
    ctx.restore();
  },

  jogo: {
    novaPartida(semente, vitrine) {
      vitrineAtual = !!vitrine;
      if (!vitrine) return criarPartida({}, FASE_CORRIDA, semente);
      const e = criarPartida({}, {
        ...FASE_CORRIDA, semente: 7,
        inicio: [[1024, 512, 256, 128], [32, 16], [8], []],
        obst: { pedras: { 3: 3 }, gelo: { 2: [4] }, cadeados: { 1: { tipo: 'valor', v: 256 } } },
      }, 7);
      return {
        ...e, pontos: 2480,
        fila: [carta(901, 128), { id: 902, tipo: 'dobro', v: 0, cor: 0 }, { id: 903, tipo: 'bomba', v: 0, cor: 0 }],
        descarte: carta(904, 4),
      };
    },

    aoIniciar(inst) {
      const m = inst.mem;
      m.tempo = vitrineAtual ? 23000 : TEMPO_INICIAL;
      m.encerrado = false;
      m.febreAtiva = false;
    },

    aoPasso(inst, agora, dt) {
      const m = inst.mem, e = inst.e;
      if (m.encerrado) return;
      if (e.fim) { encerrar(inst, null, agora); return; }
      m.febreAtiva = !!(e.febre && agora < e.febreAte);
      m.tempo -= dt * 1000 * (m.febreAtiva ? 0.5 : 1);
      // o pavio so apaga quando a cascata em andamento ja creditou o tempo dela
      if (m.tempo <= 0 && !inst.linha.ocupada(agora)) { m.tempo = 0; encerrar(inst, 'tempo', agora); }
      else if (m.tempo < 0) m.tempo = 0;
    },

    aoJogar(inst, antes, r, acao, agora) {
      if (inst.e.fim) encerrar(inst, null, agora);
      return null;
    },
  },
};

export default tema;
