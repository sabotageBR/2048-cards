// Ideia de JOGABILIDADE (rodada 3): Escalada com Vantagens. A partida nao tem
// fim por meta; cada monte completo sobe um andar e pausa a mesa com 3 cartas
// de vantagem para escolher (estilo roguelite). As vantagens mudam as regras
// do estado (mao livre, descarte, febre, quinta coluna) ou o placar da
// escalada (multiplicador, coringa a cada 12). Visual limpo e escuro, na
// linha da referencia: uma mesa, cartas lisas, numero no canto, HUD minimo.
import { TAU, rr, circulo, texto, misturar, clarear, escurecer, rgba, semente, clamp, easeOut, estrela } from '../kit.js';
import { criarPartida } from '../../../src/jogo/partida.js';
import { melhorJogada } from '../../../src/jogo/bot.js';

const FONTE = '"Ubuntu Sans", "Noto Sans", "Segoe UI", Roboto, system-ui, sans-serif';
const CORES = {
  2: '#2457d6', 4: '#a08c14', 8: '#14843a', 16: '#a01fa6', 32: '#c8601c', 64: '#c0283f',
  128: '#0f8f8c', 256: '#5233c9', 512: '#c93577', 1024: '#1386c2', 2048: '#d9a521', 4096: '#8f63f2',
};
const corDe = (v) => CORES[v] || '#5b6078';
const OURO = '#f2c94c';
const APARECE = 650; // ms entre o monte completo e as vantagens na tela (a cascata termina)

/** Fase da escalada: sem metas, baralho infinito com especiais. */
const FASE = {
  id: 1, mundo: 1, modo: 'escalada', semente: 4242,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.05, bomba: 0.035, dobro: 0.035 } },
  inicio: [[256, 128], [32], [8], []],
  metas: [], estrelas: [0, 0, 0],
};
/** Vitrine: andar 2 na escolha; atras, uma mesa com cascata pronta, pedra, gelo e cadeado. */
const VITRINE = {
  ...FASE, semente: 9,
  inicio: [[1024, 512, 256, 128], [64, 32], [16], []],
  obst: { pedras: { 3: 2 }, gelo: { 2: [8] }, cadeados: { 1: { tipo: 'valor', v: 256 } } },
};

export const VANTAGENS = [
  { id: 'maoLivre', nome: 'Mão livre', desc: 'Jogue qualquer carta da fila', rara: true, cor: '#4fd1ff' },
  { id: 'descarte', nome: '+1 descarte', desc: 'Mais uma carga de descarte', repete: true, cor: '#8c9bff' },
  { id: 'recarga', nome: 'Recarga rápida', desc: 'Descarte recarrega a cada 6 cartas', cor: '#5ee0a0' },
  { id: 'febreFacil', nome: 'Febre fácil', desc: 'Febre com 3 fusões seguidas', cor: '#ff7a45' },
  { id: 'febreLonga', nome: 'Febre longa', desc: 'A febre dura 16 segundos', cor: '#ffb347' },
  { id: 'coringa12', nome: 'Coringa a cada 12', desc: 'Um coringa a cada 12 cartas', cor: '#ff5fd2' },
  { id: 'pontos', nome: 'Pontos ×1,5', desc: 'Todo ponto vale 50% mais', rara: true, cor: OURO },
  { id: 'quinta', nome: 'Quinta coluna', desc: 'Uma coluna a mais na mesa', rara: true, cor: '#9b7bff' },
  { id: 'bomba', nome: 'Bomba agora', desc: 'Uma bomba na frente da fila', repete: true, cor: '#ff4d6a' },
];
const porId = (id) => VANTAGENS.find((v) => v.id === id);

// estado visual compartilhado entre camadas (um tema por celular; mem nao chega a peca nem ao fim)
let selK = -1;
let memVisivel = null;
let recorde = 0;

// ------------------------------------------------------------ regras do modo

function novoId(mem) { mem.idSeq = (mem.idSeq || 0) + 1; return 90000 + mem.idSeq; }

function disponivel(v, mem, e) {
  if (!v.repete && mem.vantagens.includes(v.id)) return false;
  if (v.id === 'descarte') return e.regras.descarteMax < 3;
  if (v.id === 'quinta') return e.regras.colunas < 5;
  if (v.id === 'maoLivre') return !e.regras.filaLivre;
  return true;
}

/** 3 vantagens distintas (menos, se o baralho de vantagens secou). */
function sortearOfertas(mem, e) {
  const rnd = semente((mem.andar * 7919 + (e.rng >>> 0)) >>> 0);
  const livres = VANTAGENS.filter((v) => disponivel(v, mem, e));
  const ofertas = [];
  while (ofertas.length < 3 && livres.length) {
    // raras saem com metade do peso
    const pesos = livres.map((v) => (v.rara ? 0.5 : 1));
    let alvo = rnd() * pesos.reduce((s, p) => s + p, 0);
    let i = 0;
    while (alvo > pesos[i] && i < livres.length - 1) { alvo -= pesos[i]; i++; }
    ofertas.push(livres[i].id);
    livres.splice(i, 1);
  }
  return ofertas;
}

/** Aplica a vantagem `id` ao estado e a mem; despausa. */
export function aplicar(inst, id, agora) {
  const mem = inst.mem;
  let e = inst.e;
  const R = e.regras;
  let relayout = false;
  switch (id) {
    case 'maoLivre': e = { ...e, regras: { ...R, filaLivre: true } }; mem.k = 0; break;
    case 'descarte': {
      const max = Math.min(3, R.descarteMax + 1);
      e = { ...e, regras: { ...R, descarteMax: max }, descarteCarga: Math.min(max, e.descarteCarga + 1) };
      break;
    }
    case 'recarga': e = { ...e, regras: { ...R, descarteRecarga: 6 } }; break;
    case 'febreFacil': e = { ...e, regras: { ...R, febreFusoes: 3 } }; break;
    case 'febreLonga': e = { ...e, regras: { ...R, febreMs: 16000 } }; break;
    case 'pontos': mem.mult = 1.5; break;
    case 'quinta':
      if (R.colunas < 5) { e = { ...e, regras: { ...R, colunas: 5 }, colunas: [...e.colunas, []] }; relayout = true; }
      break;
    case 'bomba': e = { ...e, fila: [{ id: novoId(mem), tipo: 'bomba', v: 0, cor: 0 }, ...e.fila.slice(0, Math.max(0, R.tamFila - 1))] }; break;
    default: break;
  }
  mem.vantagens.push(id);
  mem.pausa = null;
  mem.escolhida = { id, em: agora };
  inst.e = e;
  if (relayout && inst.relayout) inst.relayout();
  if (inst.part && inst.W) {
    const v = porId(id);
    inst.part.estourar(inst.W / 2, inst.H * 0.42, [v.cor, '#ffffff'], 18, 1.0, { forma: 'brilho', tam: 9, g: 120, vida: 0.7 });
  }
}

/** Geometria das cartas de vantagem (desenho e toque). */
function layoutOfertas(W, H, n) {
  const paisagem = W > H;
  const gap = paisagem ? 22 : 10;
  const w = paisagem ? Math.min(176, (W - 120) / 3) : Math.min(118, (W - 32 - gap * 2) / 3);
  const h = Math.round(w * 1.48);
  const total = n * w + (n - 1) * gap;
  const x0 = (W - total) / 2;
  const y = paisagem ? H * 0.5 - h * 0.42 : H * 0.36;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + i * (w + gap), y, w, h }));
}

function filaEm(inst, x, y) {
  const L = inst.Lt;
  for (let k = 0; k < inst.e.fila.length; k++) {
    const p = L.filaPos(k);
    if (x >= p.x - L.gap / 2 && x <= p.x + p.w + L.gap / 2 && y >= p.y - L.gap && y <= p.y + p.h + L.gap) return k;
  }
  return -1;
}
function colunaEm(inst, x, y) {
  const L = inst.Lt;
  for (let c = 0; c < L.colunas; c++) {
    const a = L.coluna(c);
    if (x >= a.x - L.gap / 2 && x <= a.x + a.w + L.gap / 2 && y >= Math.min(a.y, L.mesa.y) - L.gap * 2 && y <= Math.max(a.y + a.h, L.mesa.y + L.mesa.h) + L.gap) return c;
  }
  return -1;
}

const jogo = {
  novaPartida(sem, vitrine) {
    if (!vitrine) return criarPartida({}, FASE, sem);
    const e = criarPartida({ febreFusoes: 3, descarteMax: 2 }, VITRINE, 9);
    e.fila = [{ id: 901, tipo: 'normal', v: 128, cor: 0 }, { id: 902, tipo: 'coringa', v: 0, cor: 0 }, { id: 903, tipo: 'dobro', v: 0, cor: 0 }];
    e.descarte = { id: 904, tipo: 'normal', v: 4, cor: 0 };
    e.descarteCarga = 2;
    e.pontos = 3120;
    e.escVit = true;
    return e;
  },
  aoIniciar(inst) {
    const mem = inst.mem;
    Object.assign(mem, { andar: 1, placar: 0, mult: 1, vantagens: [], k: 0, idSeq: 0, pausa: null });
    if (inst.e.escVit) {
      Object.assign(mem, { andar: 2, placar: 3120, vantagens: ['febreFacil', 'descarte'], pausa: { ofertas: ['febreLonga', 'quinta', 'coringa12'], desde: -1e9 } });
    }
  },
  aoJogar(inst, antes, r, acao, agora) {
    const mem = inst.mem;
    let e = r.estado;
    if (mem.pausa) mem.pausa = null; // jogada forcada (quadro dos prints) durante a escolha
    const delta = e.pontos - antes.pontos;
    if (delta > 0) mem.placar += Math.round(delta * mem.mult);
    if (mem.vantagens.includes('coringa12') && e.n > antes.n && e.n % 12 === 0 && !e.fim && e.fila.length) {
      e = { ...e, fila: [...e.fila.slice(0, -1), { id: novoId(mem), tipo: 'coringa', v: 0, cor: 0 }] };
      mem.avisoCoringa = agora;
    }
    const montes = r.eventos.filter((ev) => ev.tipo === 'completar').length;
    if (montes) {
      mem.andar += montes;
      if (!e.fim) mem.pausa = { ofertas: sortearOfertas(mem, e), desde: agora };
    }
    if (mem.k >= e.fila.length) mem.k = 0;
    recorde = Math.max(recorde, mem.placar);
    return e;
  },
  aoTocar(inst, x, y, agora) {
    const mem = inst.mem;
    if (mem.pausa) {
      if (agora - mem.pausa.desde < APARECE + 120) return true;
      const rects = layoutOfertas(inst.W, inst.H, mem.pausa.ofertas.length);
      const i = rects.findIndex((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
      if (i >= 0) aplicar(inst, mem.pausa.ofertas[i], agora);
      return true;
    }
    if (inst.e.fim || !inst.e.regras.filaLivre) return false;
    const k = filaEm(inst, x, y);
    if (k >= 0) { mem.k = k; return true; }
    const c = colunaEm(inst, x, y);
    if (c >= 0) { inst.agir({ tipo: 'colocar', c, k: Math.min(mem.k || 0, inst.e.fila.length - 1) }, agora); mem.k = 0; return true; }
    return false;
  },
  pausado: (inst) => !!inst.mem.pausa,
  bot(inst, agora) {
    const mem = inst.mem;
    if (mem.pausa) {
      if (agora - mem.pausa.desde > APARECE + 800) {
        const rnd = semente((agora | 0) >>> 0);
        const ofs = mem.pausa.ofertas;
        aplicar(inst, ofs[Math.floor(rnd() * ofs.length)], agora);
      }
      return null;
    }
    return melhorJogada(inst.e, agora);
  },
};

// ------------------------------------------------------------ desenho

/** Cache offscreen das cartas (o brilho com sombra desfocada e caro). */
const cache = new Map();
function emCache(chave, w, h, pad, desenho) {
  const k = `${chave}|${w | 0}|${h | 0}`;
  let cv = cache.get(k);
  if (!cv) {
    if (cache.size > 400) cache.clear();
    cv = document.createElement('canvas');
    cv.width = Math.ceil((w + pad * 2) * 2); cv.height = Math.ceil((h + pad * 2) * 2);
    const g = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
    g.scale(2, 2); g.translate(pad + w / 2, pad + h / 2);
    desenho(g, { x: -w / 2, y: -h / 2, w, h });
    cache.set(k, cv);
  }
  return cv;
}

function base(ctx, r, cor, op = {}) {
  const raio = Math.min(r.w, r.h) * 0.11;
  ctx.save();
  ctx.shadowColor = rgba(op.brilho || cor, op.forca ?? 0.55); ctx.shadowBlur = op.blur ?? 10;
  rr(ctx, r.x, r.y, r.w, r.h, raio);
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, op.topo || misturar(cor, '#ffffff', 0.1)); g.addColorStop(1, op.fundo || escurecer(cor, 0.38));
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  // brilho de vidro na diagonal
  ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.clip();
  const s = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h * 0.7);
  s.addColorStop(0, 'rgba(255,255,255,0.16)'); s.addColorStop(0.45, 'rgba(255,255,255,0.03)'); s.addColorStop(0.46, 'rgba(255,255,255,0)');
  ctx.fillStyle = s; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.restore();
  rr(ctx, r.x + 0.8, r.y + 0.8, r.w - 1.6, r.h - 1.6, raio);
  ctx.lineWidth = 1.6; ctx.strokeStyle = op.borda || clarear(cor, 0.45); ctx.stroke();
}

function numero(ctx, txt, r, cor = '#ffffff', fator = 1) {
  const tam = Math.min(r.h * 0.24, r.w * 0.34) * fator;
  texto(ctx, txt, r.x + r.w * 0.11, r.y + r.h * 0.155, tam, cor, { alinhar: 'left', fonte: FONTE, peso: 700, max: r.w * 0.8 });
}

function cartaNormal(g, r, v) {
  const cor = corDe(v);
  if (v >= 2048) {
    const ouro = v >= 4096;
    base(g, r, cor, { topo: ouro ? '#c9b4ff' : '#ffe08a', fundo: ouro ? '#4a2fa3' : '#9a6a0c', borda: ouro ? '#efe6ff' : '#fff0b8', blur: 16, forca: 0.8 });
  } else base(g, r, cor);
  numero(g, String(v), r, v === 2048 ? '#3a2600' : '#ffffff');
  // numero grande e discreto no corpo (aparece so na carta de cima)
  texto(g, String(v), 0, r.y + r.h * 0.64, Math.min(r.h * 0.34, r.w * 0.5), 'rgba(255,255,255,0.10)', { fonte: FONTE, peso: 700, max: r.w * 0.86 });
}

function cartaPedra(g, r, hp) {
  base(g, r, '#3a3d48', { topo: '#33363f', fundo: '#1b1c22', borda: '#5a5e6b', forca: 0.25, blur: 6 });
  const rnd = semente(13);
  g.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 40; i++) { circulo(g, r.x + rnd() * r.w, r.y + rnd() * r.h, 0.6 + rnd() * 1.2); g.fill(); }
  texto(g, 'pedra', r.x + r.w * 0.11, r.y + r.h * 0.155, Math.min(r.h * 0.15, r.w * 0.22), '#9aa0ad', { alinhar: 'left', fonte: FONTE, peso: 600 });
  const perdido = 3 - clamp(hp, 0, 3);
  const rach = [[0.3, 0.32, 0.46, 0.5, 0.38, 0.7], [0.68, 0.3, 0.56, 0.52, 0.7, 0.66], [0.5, 0.36, 0.52, 0.58, 0.44, 0.78]];
  g.strokeStyle = 'rgba(210,215,225,0.55)'; g.lineWidth = 1.1; g.lineJoin = 'round';
  for (let k = 0; k < perdido; k++) {
    const c = rach[k];
    g.beginPath(); g.moveTo(r.x + c[0] * r.w, r.y + c[1] * r.h); g.lineTo(r.x + c[2] * r.w, r.y + c[3] * r.h); g.lineTo(r.x + c[4] * r.w, r.y + c[5] * r.h); g.stroke();
  }
  for (let k = 0; k < 3; k++) {
    circulo(g, (k - 1) * r.w * 0.16, r.y + r.h * 0.86, Math.max(2, r.w * 0.045));
    if (k < hp) { g.fillStyle = '#d6dae3'; g.fill(); } else { g.lineWidth = 1; g.strokeStyle = '#6b7080'; g.stroke(); }
  }
}

function cartaCoringa(g, r) {
  base(g, r, '#2a2d52', { topo: '#2b2f5a', fundo: '#14162e', borda: 'rgba(0,0,0,0)', brilho: '#ff5fd2', forca: 0.45 });
  const raio = Math.min(r.w, r.h) * 0.11;
  const arco = g.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  ['#ff5f6d', '#ffc371', '#5ee0a0', '#4fd1ff', '#9b7bff', '#ff5fd2'].forEach((c, i, a) => arco.addColorStop(i / (a.length - 1), c));
  rr(g, r.x + 0.9, r.y + 0.9, r.w - 1.8, r.h - 1.8, raio); g.lineWidth = 2; g.strokeStyle = arco; g.stroke();
  texto(g, '★', r.x + r.w * 0.11, r.y + r.h * 0.155, Math.min(r.h * 0.2, r.w * 0.3), '#ffffff', { alinhar: 'left', fonte: FONTE });
  estrela(g, 0, r.y + r.h * 0.6, r.w * 0.26, r.w * 0.11);
  g.fillStyle = arco; g.fill();
}

function cartaDobro(g, r) {
  base(g, r, '#5b3cc4', { topo: '#3a2779', fundo: '#170d30', borda: '#b49cff', brilho: '#a98bff' });
  numero(g, '×2', r);
  texto(g, '×2', 0, r.y + r.h * 0.62, Math.min(r.h * 0.36, r.w * 0.52), 'rgba(200,180,255,0.35)', { fonte: FONTE, peso: 700 });
}

function cartaBomba(g, r) {
  base(g, r, '#c0283f', { topo: '#4a1220', fundo: '#22070d', borda: '#ff6f86', brilho: '#ff4d6a' });
  texto(g, 'bomba', r.x + r.w * 0.11, r.y + r.h * 0.155, Math.min(r.h * 0.15, r.w * 0.22), '#ffb3c0', { alinhar: 'left', fonte: FONTE, peso: 600 });
  const R = r.w * 0.2, cy = r.y + r.h * 0.62;
  g.lineWidth = 2; g.strokeStyle = '#ffd0d8';
  circulo(g, 0, cy, R); g.stroke();
  g.beginPath(); g.moveTo(R * 0.6, cy - R * 0.8); g.quadraticCurveTo(R * 1.1, cy - R * 1.5, R * 1.5, cy - R * 1.2); g.stroke();
}

function gelo(ctx, r) {
  const raio = Math.min(r.w, r.h) * 0.11;
  rr(ctx, r.x, r.y, r.w, r.h, raio);
  ctx.fillStyle = 'rgba(170,220,255,0.30)'; ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(215,242,255,0.95)'; ctx.stroke();
  ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, raio); ctx.clip();
  ctx.strokeStyle = 'rgba(235,250,255,0.55)'; ctx.lineWidth = 1;
  for (const [a, b] of [[0.1, 0.55], [0.35, 0.85], [0.6, 1.1]]) { ctx.beginPath(); ctx.moveTo(r.x + r.w * a, r.y + r.h); ctx.lineTo(r.x + r.w * b, r.y); ctx.stroke(); }
  ctx.restore();
  const fx = r.x + r.w - r.w * 0.17, fy = r.y + r.h * 0.15, s = r.w * 0.08;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3;
  for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(fx - Math.cos(a) * s, fy - Math.sin(a) * s); ctx.lineTo(fx + Math.cos(a) * s, fy + Math.sin(a) * s); ctx.stroke(); }
}

function icone(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = Math.max(1.4, s * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (id) {
    case 'maoLivre':
      for (const [dx, a] of [[-0.42, -0.35], [0, 0], [0.42, 0.35]]) { ctx.save(); ctx.rotate(a); rr(ctx, dx * s - s * 0.22, -s * 0.36 - (dx === 0 ? s * 0.18 : 0), s * 0.44, s * 0.66, s * 0.08); ctx.stroke(); ctx.restore(); }
      break;
    case 'descarte':
      rr(ctx, -s * 0.5, -s * 0.1, s, s * 0.55, s * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, s * 0.22); ctx.lineTo(0, -s * 0.55); ctx.moveTo(-s * 0.24, -s * 0.32); ctx.lineTo(0, -s * 0.55); ctx.lineTo(s * 0.24, -s * 0.32); ctx.stroke();
      break;
    case 'recarga':
      ctx.beginPath(); ctx.arc(0, 0, s * 0.48, -Math.PI * 0.3, Math.PI * 1.35); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.5); ctx.lineTo(s * 0.32, -s * 0.12); ctx.lineTo(s * 0.72, -s * 0.16); ctx.stroke();
      break;
    case 'febreFacil': case 'febreLonga':
      ctx.beginPath(); ctx.moveTo(0, -s * 0.62);
      ctx.bezierCurveTo(s * 0.55, -s * 0.15, s * 0.45, s * 0.55, 0, s * 0.55);
      ctx.bezierCurveTo(-s * 0.45, s * 0.55, -s * 0.55, -s * 0.05, -s * 0.12, -s * 0.2);
      ctx.bezierCurveTo(-s * 0.05, -s * 0.38, 0, -s * 0.45, 0, -s * 0.62); ctx.stroke();
      if (id === 'febreLonga') { ctx.lineWidth *= 0.8; circulo(ctx, s * 0.5, s * 0.42, s * 0.22); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * 0.5, s * 0.3); ctx.lineTo(s * 0.5, s * 0.44); ctx.lineTo(s * 0.6, s * 0.48); ctx.stroke(); }
      break;
    case 'coringa12':
      estrela(ctx, 0, 0, s * 0.58, s * 0.25); ctx.stroke();
      break;
    case 'pontos':
      texto(ctx, '×1,5', 0, 0, s * 0.62, '#ffffff', { fonte: FONTE, peso: 700 });
      break;
    case 'quinta':
      {
        const a0 = ctx.globalAlpha;
        for (let k = 0; k < 5; k++) {
          const xx = (k - 2) * s * 0.26;
          ctx.globalAlpha = a0 * (k === 4 ? 1 : 0.6);
          rr(ctx, xx - s * 0.08, -s * 0.48, s * 0.16, s * 0.96, s * 0.05);
          if (k === 4) ctx.fill(); else ctx.stroke();
        }
      }
      break;
    case 'bomba':
      circulo(ctx, -s * 0.06, s * 0.1, s * 0.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.24); ctx.quadraticCurveTo(s * 0.45, -s * 0.62, s * 0.66, -s * 0.5); ctx.stroke();
      break;
    default: break;
  }
  ctx.restore();
}

function quebrar(ctx, txt, max) {
  const palavras = txt.split(' ');
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const tenta = atual ? atual + ' ' + p : p;
    if (ctx.measureText(tenta).width > max && atual) { linhas.push(atual); atual = p; } else atual = tenta;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function cartaVantagem(ctx, v, q, u, t) {
  ctx.save();
  ctx.globalAlpha = u;
  ctx.translate(0, (1 - easeOut(u)) * 28);
  ctx.save();
  ctx.shadowColor = v.rara ? 'rgba(242,201,76,0.55)' : 'rgba(0,0,0,0.6)'; ctx.shadowBlur = v.rara ? 22 : 18; ctx.shadowOffsetY = v.rara ? 0 : 8;
  rr(ctx, q.x, q.y, q.w, q.h, 14);
  const g = ctx.createLinearGradient(0, q.y, 0, q.y + q.h);
  g.addColorStop(0, '#24274a'); g.addColorStop(1, '#121327');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  rr(ctx, q.x + 1, q.y + 1, q.w - 2, q.h - 2, 13);
  if (v.rara) {
    const o = ctx.createLinearGradient(q.x, q.y, q.x + q.w, q.y + q.h);
    o.addColorStop(0, '#fff1b8'); o.addColorStop(0.5, OURO); o.addColorStop(1, '#a8780f');
    ctx.strokeStyle = o; ctx.lineWidth = 2.2;
  } else { ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.2; }
  ctx.stroke();
  const cx = q.x + q.w / 2;
  if (v.rara) {
    rr(ctx, cx - 22, q.y - 9, 44, 18, 9); ctx.fillStyle = OURO; ctx.fill();
    texto(ctx, 'RARA', cx, q.y, 10.5, '#2a1d00', { fonte: FONTE, peso: 700 });
  }
  const iy = q.y + q.h * 0.3, ir = q.w * 0.22;
  const gi = ctx.createRadialGradient(cx - ir * 0.3, iy - ir * 0.3, ir * 0.1, cx, iy, ir);
  gi.addColorStop(0, clarear(v.cor, 0.25)); gi.addColorStop(1, escurecer(v.cor, 0.35));
  ctx.save(); ctx.shadowColor = rgba(v.cor, 0.6); ctx.shadowBlur = 14 + Math.sin(t * 3) * 3;
  circulo(ctx, cx, iy, ir); ctx.fillStyle = gi; ctx.fill(); ctx.restore();
  icone(ctx, v.id, cx, iy, ir * 1.05);
  const tn = Math.min(15, q.w * 0.13);
  ctx.font = `700 ${tn}px ${FONTE}`;
  const nomes = quebrar(ctx, v.nome, q.w - 16).slice(0, 2);
  const yn = q.y + q.h * (nomes.length > 1 ? 0.55 : 0.58);
  nomes.forEach((l, i) => texto(ctx, l, cx, yn + i * tn * 1.15, tn, '#ffffff', { fonte: FONTE, peso: 700 }));
  const td = Math.min(12, q.w * 0.102);
  ctx.font = `500 ${td}px ${FONTE}`;
  const yd = yn + nomes.length * tn * 1.15 + td * 0.6;
  quebrar(ctx, v.desc, q.w - 18).slice(0, 3).forEach((l, i) => texto(ctx, l, cx, yd + i * td * 1.25, td, 'rgba(255,255,255,0.68)', { fonte: FONTE, peso: 500 }));
  ctx.restore();
}

const tema = {
  id: 'escalada',
  nome: 'Escalada com Vantagens',
  cores: { texto: '#ffffff', destaque: OURO, particulas: ['#ffffff', OURO] },
  faixas: (W, H) => ({ topo: W > H ? 92 : 112, base: 0 }),
  jogo,

  fundo(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0d22'); g.addColorStop(0.55, '#141634'); g.addColorStop(1, '#090a18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rnd = semente(21);
    for (let i = 0; i < 46; i++) { ctx.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.22})`; circulo(ctx, rnd() * W, rnd() * H * 0.7, 0.5 + rnd() * 0.9); ctx.fill(); }
    // cordilheira bem discreta: a escalada
    const serra = (y, amp, cor, fase) => {
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) ctx.lineTo(x, y - Math.abs(Math.sin(x / (W * 0.21) + fase)) * amp - Math.sin(x / 37 + fase) * amp * 0.12);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = cor; ctx.fill();
    };
    serra(H * 0.78, H * 0.12, 'rgba(60,64,130,0.22)', 0.4);
    serra(H * 0.86, H * 0.08, 'rgba(30,32,72,0.55)', 1.7);
  },

  mesa(ctx, L, e, t, mem) {
    selK = e.regras.filaLivre && mem.k !== undefined ? mem.k : -1;
    memVisivel = mem;
    const m = L.mesa;
    const febre = e.febre ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
    ctx.save();
    ctx.shadowColor = febre ? rgba(OURO, 0.6 + febre * 0.3) : 'rgba(110,96,255,0.45)'; ctx.shadowBlur = 18 + febre * 10;
    rr(ctx, m.x, m.y, m.w, m.h, L.pad * 1.1);
    ctx.fillStyle = 'rgba(18,20,46,0.78)'; ctx.fill();
    ctx.restore();
    rr(ctx, m.x, m.y, m.w, m.h, L.pad * 1.1);
    ctx.lineWidth = 1.6; ctx.strokeStyle = febre ? rgba(OURO, 0.7 + febre * 0.3) : 'rgba(150,140,255,0.55)'; ctx.stroke();
    for (let c = 0; c < L.colunas; c++) {
      if (e.colunas[c].length) continue;
      const s = L.carta(c, 0);
      rr(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, Math.min(s.w, s.h) * 0.11);
      ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke(); ctx.setLineDash([]);
    }
  },

  peca(ctx, carta, r, op) {
    const pad = 14;
    let cv;
    if (carta.tipo === 'pedra') cv = emCache(`p${carta.hp}`, r.w, r.h, pad, (g, q) => cartaPedra(g, q, carta.hp));
    else if (carta.tipo === 'coringa') cv = emCache('c', r.w, r.h, pad, cartaCoringa);
    else if (carta.tipo === 'dobro') cv = emCache('d', r.w, r.h, pad, cartaDobro);
    else if (carta.tipo === 'bomba') cv = emCache('b', r.w, r.h, pad, cartaBomba);
    else cv = emCache(`n${carta.v}`, r.w, r.h, pad, (g, q) => cartaNormal(g, q, carta.v));
    ctx.drawImage(cv, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2);
    const t = op.t || 0;
    if (carta.tipo === 'bomba') {
      const k = 0.6 + 0.4 * Math.abs(Math.sin(t * 14));
      const R = r.w * 0.2, cy = r.y + r.h * 0.62;
      ctx.save(); ctx.shadowColor = '#ffd36b'; ctx.shadowBlur = 10;
      estrela(ctx, R * 1.5, cy - R * 1.2, R * 0.42 * k, R * 0.16, 6); ctx.fillStyle = '#ffd36b'; ctx.fill(); ctx.restore();
    }
    if (carta.tipo === 'normal' && carta.v >= 2048) {
      // reflexo passando
      ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, Math.min(r.w, r.h) * 0.11); ctx.clip();
      const x = r.x - r.w + ((t * 0.6) % 1.6) * r.w * 2;
      const s = ctx.createLinearGradient(x, 0, x + r.w * 0.5, 0);
      s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.5, 'rgba(255,255,255,0.35)'); s.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = s; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore();
    }
    if (carta.gelo) gelo(ctx, r);
    let realce = 0, cor = '#ffffff';
    if (op.fila) {
      if (selK >= 0) { if (op.k === selK) { realce = 0.65 + 0.35 * Math.abs(Math.sin(t * 4)); cor = OURO; } }
      else realce = op.destaque || 0;
    }
    if (realce > 0) {
      rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, Math.min(r.w, r.h) * 0.14);
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(cor, realce); ctx.stroke();
    }
  },

  cadeado(ctx, a, c, e) {
    const g = e.cadeados[c] || {};
    rr(ctx, a.x - 2, a.y - 2, a.w + 4, a.h + 4, 10);
    ctx.fillStyle = 'rgba(6,7,18,0.66)'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
    const cx = a.x + a.w / 2, cy = a.y + Math.min(a.h * 0.32, 70), s = Math.min(16, a.w * 0.24);
    ctx.strokeStyle = '#d9dcff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy - s * 0.3, s * 0.5, Math.PI, 0); ctx.stroke();
    rr(ctx, cx - s * 0.7, cy - s * 0.3, s * 1.4, s * 1.1, s * 0.2); ctx.stroke();
    const rot = g.tipo === 'valor' ? `faça ${g.v}` : g.tipo === 'fusoes' ? `${g.n} fusões` : g.tipo === 'montes' ? `${g.n} monte(s)` : g.tipo === 'pedras' ? 'pedras' : g.tipo === 'jogadas' ? `${g.n} jogadas` : '';
    texto(ctx, rot, cx, cy + s * 1.35, Math.min(11, a.w * 0.17), 'rgba(217,220,255,0.85)', { fonte: FONTE, peso: 600, max: a.w - 4 });
  },

  descarte(ctx, r, e) {
    const carga = e.descarteCarga > 0;
    rr(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, Math.min(r.w, r.h) * 0.11);
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4; ctx.strokeStyle = carga ? 'rgba(200,190,255,0.6)' : 'rgba(200,190,255,0.2)'; ctx.stroke(); ctx.setLineDash([]);
    if (!e.descarte) {
      ctx.globalAlpha = carga ? 0.6 : 0.22;
      icone(ctx, 'descarte', r.x + r.w / 2, r.y + r.h * 0.42, r.w * 0.36);
      ctx.globalAlpha = 1;
    }
    const n = e.regras.descarteMax;
    for (let k = 0; k < n; k++) {
      circulo(ctx, r.x + r.w / 2 + (k - (n - 1) / 2) * 9, r.y + r.h + 9, 2.6);
      if (k < e.descarteCarga) { ctx.fillStyle = '#c9c2ff'; ctx.fill(); } else { ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(201,194,255,0.4)'; ctx.stroke(); }
    }
  },

  fila(ctx, L, e) {
    const f = L.fila;
    const p0 = L.filaPos(0);
    if (f.vertical) {
      rr(ctx, f.x, f.y, f.w, f.h, 14); ctx.fillStyle = 'rgba(18,20,46,0.5)'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(150,140,255,0.25)'; ctx.stroke();
    } else {
      const gl = ctx.createRadialGradient(W2(L), p0.y + p0.h * 0.6, 4, W2(L), p0.y + p0.h * 0.6, L.W * 0.4);
      gl.addColorStop(0, 'rgba(110,96,255,0.16)'); gl.addColorStop(1, 'rgba(110,96,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(0, p0.y - 30, L.W, p0.h + 60);
    }
    const rot = e.regras.filaLivre ? 'toque para escolher' : 'próximas';
    texto(ctx, rot.toUpperCase(), f.vertical ? f.x + f.w / 2 : W2(L), f.vertical ? f.y - 10 : p0.y - 12, 10, 'rgba(200,196,255,0.6)', { fonte: FONTE, peso: 700 });
  },

  hud(ctx, W, H, L, e, t, mem) {
    memVisivel = mem;
    const paisagem = W > H;
    const y = 16;
    texto(ctx, 'ANDAR', 24, y + 6, 10.5, 'rgba(200,196,255,0.7)', { alinhar: 'left', fonte: FONTE, peso: 700 });
    // o andar novo aparece junto com as vantagens (nao no instante da jogada)
    const andar = mem.pausa && t * 1000 - mem.pausa.desde < APARECE ? (mem.andar || 2) - 1 : mem.andar || 1;
    texto(ctx, String(andar), 22, y + 34, 34, '#ffffff', { alinhar: 'left', fonte: FONTE, peso: 700 });
    const placar = String(mem.placar || 0);
    const g = ctx.createLinearGradient(0, y + 10, 0, y + 44);
    g.addColorStop(0, '#f1a6ff'); g.addColorStop(1, '#b86bff');
    texto(ctx, placar, W / 2, y + 26, 34, g, { fonte: FONTE, peso: 700, max: W * 0.5 });
    texto(ctx, (mem.mult || 1) > 1 ? `PONTOS ×${String(mem.mult).replace('.', ',')}` : 'PONTOS', W / 2, y + 52, 10.5, (mem.mult || 1) > 1 ? OURO : 'rgba(200,196,255,0.6)', { fonte: FONTE, peso: 700 });
    // vantagens adquiridas (com contagem nas repetidas)
    const conta = {};
    for (const id of mem.vantagens || []) conta[id] = (conta[id] || 0) + 1;
    const ids = Object.keys(conta);
    const passo = 30;
    const x0 = paisagem ? W - 26 - (ids.length - 1) * passo : W / 2 - ((ids.length - 1) * passo) / 2;
    const yi = paisagem ? y + 26 : y + 78;
    ids.forEach((id, i) => {
      const v = porId(id);
      const x = x0 + i * passo;
      circulo(ctx, x, yi, 12); ctx.fillStyle = rgba(v.cor, 0.22); ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = v.rara ? OURO : rgba(v.cor, 0.8); ctx.stroke();
      icone(ctx, id, x, yi, 12);
      if (conta[id] > 1) texto(ctx, `×${conta[id]}`, x + 11, yi + 10, 9.5, '#ffffff', { fonte: FONTE, peso: 700, contorno: '#0b0d22', espessura: 3 });
    });
    if (e.febre) {
      const k = 0.5 + 0.5 * Math.sin(t * 9);
      const fy = paisagem ? y + 58 : y + 100;
      rr(ctx, W / 2 - 46, fy - 10, 92, 20, 10); ctx.fillStyle = rgba('#ff7a45', 0.2 + k * 0.2); ctx.fill();
      texto(ctx, 'FEBRE ×2', W / 2, fy, 11.5, '#ffd0b8', { fonte: FONTE, peso: 700 });
    }
    if (mem.avisoCoringa && t * 1000 - mem.avisoCoringa < 1400) {
      const u = (t * 1000 - mem.avisoCoringa) / 1400;
      ctx.globalAlpha = 1 - u;
      texto(ctx, '+ coringa na fila', W / 2, L.fila.vertical ? L.fila.y - 26 : L.filaPos(0).y - 30, 12, '#ff9be6', { fonte: FONTE, peso: 700 });
      ctx.globalAlpha = 1;
    }
    // escolha de vantagem
    const pa = mem.pausa;
    if (pa) {
      const u = clamp((t * 1000 - pa.desde - APARECE) / 260);
      if (u > 0) {
        ctx.fillStyle = `rgba(5,6,16,${0.86 * u})`; ctx.fillRect(0, 0, W, H);
        const rects = layoutOfertas(W, H, pa.ofertas.length);
        const ty = rects[0] ? rects[0].y - (paisagem ? 58 : 66) : H * 0.3;
        ctx.globalAlpha = u;
        texto(ctx, `ANDAR ${mem.andar}`, W / 2, ty, 12, OURO, { fonte: FONTE, peso: 700 });
        texto(ctx, 'Escolha uma vantagem', W / 2, ty + 26, paisagem ? 26 : 22, '#ffffff', { fonte: FONTE, peso: 700 });
        ctx.globalAlpha = 1;
        pa.ofertas.forEach((id, i) => cartaVantagem(ctx, porId(id), rects[i], clamp(u * 1.6 - i * 0.25), t));
      }
    }
    if (mem.escolhida && t * 1000 - mem.escolhida.em < 1200) {
      const u = (t * 1000 - mem.escolhida.em) / 1200;
      const v = porId(mem.escolhida.id);
      ctx.globalAlpha = 1 - u;
      texto(ctx, v.nome, W / 2, H * 0.42 - u * 30, 22, v.cor, { fonte: FONTE, peso: 700 });
      ctx.globalAlpha = 1;
    }
  },

  efeito(fx, P, mem, agora) {
    if (!P.formas.brilho) {
      P.formas.brilho = (ctx, p) => { const s = p.tam / 2; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.22, -s * 0.22); ctx.lineTo(s, 0); ctx.lineTo(s * 0.22, s * 0.22); ctx.lineTo(0, s); ctx.lineTo(-s * 0.22, s * 0.22); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.22, -s * 0.22); ctx.closePath(); ctx.fill(); };
      P.formas.rotulo = (ctx, p) => { ctx.font = `700 ${p.tam}px ${FONTE}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = p.halo || 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.fillText(p.txt, 0, 0); };
      P.formas.feixe = (ctx, p, u) => { const g = ctx.createLinearGradient(0, -p.tam, 0, 0); g.addColorStop(0, 'rgba(242,201,76,0)'); g.addColorStop(1, `rgba(255,236,170,${0.7 * (1 - u)})`); ctx.fillStyle = g; ctx.fillRect(-p.larg / 2, -p.tam, p.larg, p.tam); };
    }
    const rot = (x, y, txt, cor, tam, halo) => P.add({ forma: 'rotulo', x, y, vy: -46, vida: 0.95, tam, cor, txt, halo, arrasto: 1 });
    switch (fx.tipo) {
      case 'pouso': P.anel(fx.x, fx.y, 'rgba(255,255,255,0.55)', 22, 0.35); return true;
      case 'fusao': {
        const cor = corDe(fx.valor);
        P.anel(fx.x, fx.y, clarear(cor, 0.4), 26 + fx.degrau * 5, 0.42);
        P.estourar(fx.x, fx.y, [clarear(cor, 0.5), '#ffffff'], 6 + fx.degrau * 2, 0.55 + fx.degrau * 0.08, { forma: 'brilho', tam: 8, g: 160, vida: 0.55 });
        if (fx.degrau > 1) rot(fx.x, fx.y - 22, `×${fx.degrau}`, '#ffffff', 18 + fx.degrau * 2, rgba(cor, 0.9));
        return true;
      }
      case 'completar':
        P.add({ forma: 'feixe', x: fx.x, y: fx.y + 20, vida: 0.7, tam: 240, larg: 46, cor: OURO, arrasto: 1 });
        P.subir(fx.x, fx.y, [OURO, '#ffffff'], 14, { forma: 'brilho', tam: 9, larg: 40, vida: 1.0, forca: 1.4 });
        rot(fx.x, fx.y - 34, 'ANDAR +1', OURO, 20, 'rgba(242,201,76,0.8)');
        return true;
      case 'explodir':
        P.anel(fx.x, fx.y, '#ff6f86', 34, 0.45);
        P.estourar(fx.x, fx.y, ['#ff6f86', '#ffd36b'], 14, 1.0, { forma: 'brilho', tam: 8, g: 240 });
        return true;
      case 'pedra': P.estourar(fx.x, fx.y, ['#8a8f9c', '#4a4d58', '#c9ccd6'], 14, 0.9, { forma: 'q', tam: 5, g: 420 }); P.anel(fx.x, fx.y, 'rgba(201,204,214,0.6)', 30); return true;
      case 'racha': P.estourar(fx.x, fx.y, ['#8a8f9c', '#c9ccd6'], 5, 0.5, { forma: 'q', tam: 4, g: 420 }); return true;
      case 'gelo': P.estourar(fx.x, fx.y, ['#dff6ff', '#9fdcff'], 12, 0.7, { forma: 'q', tam: 4, g: 120, vida: 0.7 }); P.anel(fx.x, fx.y, '#bfe9ff', 28); return true;
      case 'cadeado': P.anel(fx.x, fx.y, OURO, 40, 0.5); rot(fx.x, fx.y - 10, 'ABERTO', OURO, 15); return true;
      case 'combo': rot(fx.x, fx.y - 46, `COMBO ×${fx.n}`, '#d9d4ff', 14); return true;
      default: return false;
    }
  },

  fim(ctx, W, H, e) {
    const mem = memVisivel || {};
    ctx.fillStyle = 'rgba(5,6,16,0.78)'; ctx.fillRect(0, 0, W, H);
    const cy = H * 0.42;
    texto(ctx, 'ESCALADA ENCERRADA', W / 2, cy - 64, 12, OURO, { fonte: FONTE, peso: 700 });
    texto(ctx, `Andar ${mem.andar || 1}`, W / 2, cy - 26, 40, '#ffffff', { fonte: FONTE, peso: 700 });
    texto(ctx, `${mem.placar || 0} pontos`, W / 2, cy + 14, 18, '#d9b6ff', { fonte: FONTE, peso: 600 });
    texto(ctx, `recorde da sessão: ${Math.max(recorde, mem.placar || 0)}`, W / 2, cy + 40, 12.5, 'rgba(255,255,255,0.6)', { fonte: FONTE, peso: 500 });
    texto(ctx, e.fim === 'mesaCheia' ? 'mesa cheia · toque para escalar de novo' : 'toque para escalar de novo', W / 2, cy + 78, 13, '#ffffff', { fonte: FONTE, peso: 600, max: W - 32 });
  },
};

function W2(L) { return L.W / 2; }

export default tema;
