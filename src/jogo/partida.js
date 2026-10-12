// Reducer central da partida. Estado em JSON puro, nunca mutado:
// jogar(estado, acao) devolve { estado, eventos }. Sem DOM, sem sorteio fora
// do estado (o RNG vive em estado.rng) e sem relogio (o tempo entra em acao.t, em ms).
//
// Acoes:
//   { tipo: 'colocar', c, k?, t }   joga a carta da frente (ou a k-esima, com filaLivre) na coluna c
//   { tipo: 'descartar', t }        manda a carta da frente para o descarte
//   { tipo: 'item', item, c?, t }   coringa (c), martelo (c), troca
//   { tipo: 'retomar', t }          continuar depois da mesa cheia: limpa a coluna mais cheia
//
// Eventos (na ordem em que acontecem): colocar, recusar, fundir, completar,
// pedra, gelo, cadeado, bomba, dobro, martelo, troca, item, descartar,
// recarga, combo, comboFim, febre, meta, fila, limpar, furia, monstro,
// derrotado (cadeia), fimFase, fimPartida. fundir, dobro e completar levam `dano`: os pontos que
// aquele golpe deu. O ataque do monstro (monstro.js) vem depois da jogada:
// jogar devolve tambem `meio`, a mesa antes do feitico (null sem feitico).
import { normalizarRegras, podeColocar, topo, ehPedra } from './regras.js';
import { colocar, cascata, completar } from './colunas.js';
import { encherFila, jogadasLegais, ESPACO_ESPECIAL, PESOS_PADRAO } from './baralho.js';
import { montarMesa, abrirCadeados } from './obstaculos.js';
import { criarMetas, avaliar, todasFeitas, vidaDe, estrelas as calcEstrelas } from './metas.js';
import { criarMonstro, ferir, atacar, folga, derrotar } from './monstro.js';

// Sobe quando o formato do estado muda ou quando as fases mudam (a partida
// salva carrega a mesa e as metas de quando comecou): o main.js descarta a
// partida salva de outra versao. 4: curva de dificuldade refeita (2026-10-11).
export const VERSAO_ESTADO = 4;

/**
 * @param {object} regrasBase regras do jogador (laboratorio/ajustes)
 * @param {object} fase definicao da fase (fases.js)
 * @param {number} semente
 */
export function criarPartida(regrasBase, fase, semente) {
  const regras = normalizarRegras({ ...(regrasBase || {}), ...(fase.regras || {}), ...(fase.chefe ? { teto: 4096 } : {}) });
  const mesa = montarMesa(fase, regras, 1);
  const b = fase.baralho || {};
  let pedrasHp = 0;
  for (const col of mesa.colunas) if (col.length && ehPedra(col[0])) pedrasHp += col[0].hp;
  let e = {
    v: VERSAO_ESTADO, regras, faseId: fase.id, modo: fase.modo || 'aventura',
    rng: (semente >>> 0) || 1, proxId: mesa.proxId, n: 0,
    colunas: mesa.colunas, cadeados: mesa.cadeados, chefe: !!fase.chefe,
    baralho: { pesos: b.pesos || PESOS_PADRAO, especiais: b.especiais || {}, dinamico: b.dinamico !== false, minimo: b.minimo || 8 },
    fila: [], descarte: null, descarteCarga: regras.descarteMax, desdeRecarga: 0,
    restantes: b.total === undefined || b.total === null || b.total === Infinity ? Infinity : Math.max(1, b.total | 0),
    pontos: 0, combo: 0, fusoesSeguidas: 0, secas: 0, febreAte: 0, febre: false,
    maiorCascata: 0, montes: 0, cartasFeitas: {}, fusoes: 0, pedrasQuebradas: 0, pedrasTotal: mesa.pedrasTotal, pedrasHp,
    itens: { coringa: 0, martelo: 0, troca: 0, desfazer: 1, ...(fase.itens || {}) },
    metas: criarMetas(fase, mesa.colunas, regras), estrelasRef: fase.estrelas || [0, 0, 0],
    monstro: criarMonstro(fase.monstro, semente >>> 0),
    fim: null, recusas: 0, desdeEspecial: 2, continuacoes: 0,
  };
  e = encherFila(e);
  return e;
}

/** Colunas legais para a carta (indices). */
export { jogadasLegais };

/** Acoes possiveis agora (sem o tempo). */
export function acoesLegais(e) {
  const r = [];
  if (e.fim) return r;
  const idx = e.regras.filaLivre ? e.fila.map((_, k) => k) : (e.fila.length ? [0] : []);
  for (const k of idx) for (const c of jogadasLegais(e, e.fila[k])) r.push({ tipo: 'colocar', c, k });
  if (e.descarteCarga > 0 && e.fila.length) r.push({ tipo: 'descartar' });
  if (e.itens.coringa > 0) for (const c of jogadasLegais(e, { tipo: 'coringa', v: 0, cor: 0 })) r.push({ tipo: 'item', item: 'coringa', c });
  if (e.itens.martelo > 0) e.colunas.forEach((col, c) => { if (col.length && !e.cadeados[c]) r.push({ tipo: 'item', item: 'martelo', c }); });
  if (e.itens.troca > 0 && e.fila.length >= 2) r.push({ tipo: 'item', item: 'troca' });
  return r;
}

/** Ha jogada legal para a frente da fila (ou qualquer carta, com filaLivre)? */
export function temJogada(e) {
  if (!e.fila.length) return false;
  const idx = e.regras.filaLivre ? e.fila.map((_, k) => k) : [0];
  return idx.some((k) => jogadasLegais(e, e.fila[k]).length > 0);
}

/** Estado para onde o desfazer volta (gasta 1 uso). */
export function desfazerPara(anterior) {
  return { ...anterior, itens: { ...anterior.itens, desfazer: Math.max(0, anterior.itens.desfazer - 1) }, fim: null };
}

// ------------------------------------------------------------ interno

/** Aplica a carta na coluna c (ja validada). Devolve o estado com a mesa nova e os contadores. */
function aplicarCarta(e, carta, c, modo, eventos) {
  const k0 = eventos.length;
  const colunas = e.colunas.slice();
  let col = colunas[c];
  let fusao = false, degrau = 0, valores = [], pedras = 0;
  if (modo === 'bomba') {
    const t = topo(col);
    if (ehPedra(t)) { eventos.push({ tipo: 'pedra', c, id: t.id, hp: 0, quebrou: true }); pedras = t.lancada ? 0 : 1; }
    else eventos.push({ tipo: 'bomba', c, id: t.id, valor: t.v });
    col = col.slice(0, -1);
  } else if (modo === 'dobro') {
    const t = topo(col);
    const novo = { ...t, v: t.v * 2 };
    eventos.push({ tipo: 'dobro', c, id: novo.id, valor: novo.v });
    const r = cascata([...col.slice(0, -1), novo], e.regras, c, eventos, 1, [novo.v]);
    col = r.col; fusao = true; degrau = r.degrau; valores = r.valores; pedras = r.pedras;
  } else {
    const r = colocar(col, e.regras, c, carta, eventos);
    col = r.col; fusao = r.fusao; degrau = r.degrau; valores = r.valores; pedras = r.pedras;
  }
  const mult = e.febre ? 2 : 1;
  let pontos = e.pontos;
  const cartasFeitas = valores.length ? { ...e.cartasFeitas } : e.cartasFeitas;
  valores.forEach((v, i) => { pontos += v * (i + 1) * mult; cartasFeitas[v] = (cartasFeitas[v] || 0) + 1; });
  let montes = e.montes;
  let descarteCarga = e.descarteCarga;
  if (fusao) {
    const comp = completar(col, e.regras, c, eventos);
    col = comp.col;
    if (comp.completou) {
      montes++;
      pontos += comp.completou * mult;
      if (descarteCarga < e.regras.descarteMax) { descarteCarga++; eventos.push({ tipo: 'recarga', carga: descarteCarga }); }
    }
  }
  colunas[c] = col;
  marcarDano(eventos, k0, mult);
  let fusoesSeguidas = e.fusoesSeguidas, secas = e.secas, combo = e.combo;
  if (fusao) {
    fusoesSeguidas++; secas = 0; combo = fusoesSeguidas;
    if (combo >= 2) eventos.push({ tipo: 'combo', n: combo });
  } else if (modo !== 'bomba') {
    if (combo >= 2) eventos.push({ tipo: 'comboFim', n: combo });
    fusoesSeguidas = 0; secas++; combo = 0;
  }
  return {
    ...e, colunas, pontos, cartasFeitas, montes, descarteCarga, fusoesSeguidas, secas, combo,
    fusoes: e.fusoes + valores.length,
    maiorCascata: Math.max(e.maiorCascata, degrau),
    pedrasQuebradas: e.pedrasQuebradas + pedras,
  };
}

/** Pontos de cada golpe (mesma conta dos pontos acima): degrau d vale valor * d. */
function marcarDano(eventos, k0, mult) {
  for (let i = k0; i < eventos.length; i++) {
    const ev = eventos[i];
    if (ev.tipo === 'fundir') ev.dano = ev.valor * ev.degrau * mult;
    else if (ev.tipo === 'dobro' || ev.tipo === 'completar') ev.dano = ev.valor * mult;
  }
}

function ligarFebre(e, t, eventos) {
  if (e.febre || e.fusoesSeguidas < e.regras.febreFusoes) return e;
  eventos.push({ tipo: 'febre', ligada: true, ate: t + e.regras.febreMs });
  return { ...e, febre: true, febreAte: t + e.regras.febreMs };
}

function expirarFebre(e, t, eventos) {
  if (!e.febre || t < e.febreAte) return e;
  eventos.push({ tipo: 'febre', ligada: false });
  return { ...e, febre: false, fusoesSeguidas: 0 };
}

/** Conta a jogada: recarga do descarte por cartas jogadas. */
function contarJogada(e, eventos) {
  let { descarteCarga, desdeRecarga } = e;
  desdeRecarga++;
  if (e.regras.descarteRecarga > 0 && desdeRecarga >= e.regras.descarteRecarga && descarteCarga < e.regras.descarteMax) {
    descarteCarga++; desdeRecarga = 0;
    eventos.push({ tipo: 'recarga', carga: descarteCarga });
  }
  return { ...e, n: e.n + 1, descarteCarga, desdeRecarga };
}

function reporFila(e, eventos) {
  const antes = e.fila.length;
  const n = encherFila(e);
  for (let k = antes; k < n.fila.length; k++) eventos.push({ tipo: 'fila', carta: n.fila[k], k });
  return n;
}

function acColocar(e, acao, eventos) {
  const k = e.regras.filaLivre ? Math.max(0, acao.k | 0) : 0;
  const carta = e.fila[k];
  const c = acao.c | 0;
  if (!carta || c < 0 || c >= e.colunas.length) return { e, aplicou: false };
  const r = podeColocar(e.regras, e.colunas[c], carta, { trancada: !!e.cadeados[c] });
  if (!r.ok) {
    eventos.push({ tipo: 'recusar', c, motivo: r.motivo, id: carta.id });
    return { e: { ...e, recusas: e.recusas + 1 }, aplicou: false };
  }
  let n = { ...e, fila: e.fila.filter((_, i) => i !== k), recusas: 0 };
  n = aplicarCarta(n, carta, c, r.modo, eventos);
  n = ligarFebre(n, acao.t || 0, eventos);
  n = contarJogada(n, eventos);
  n = reporFila(n, eventos);
  return { e: n, aplicou: true };
}

function acDescartar(e, acao, eventos) {
  if (e.descarteCarga <= 0 || !e.fila.length) {
    eventos.push({ tipo: 'recusar', c: -1, motivo: 'semDescarte' });
    return { e, aplicou: false };
  }
  const carta = e.fila[0];
  eventos.push({ tipo: 'descartar', id: carta.id, carta, carga: e.descarteCarga - 1 });
  let n = { ...e, fila: e.fila.slice(1), descarte: carta, descarteCarga: e.descarteCarga - 1, recusas: 0 };
  n = contarJogada(n, eventos);
  n = reporFila(n, eventos);
  return { e: n, aplicou: true };
}

function acItem(e, acao, eventos) {
  const item = acao.item;
  if (!(e.itens[item] > 0)) return { e, aplicou: false };
  const c = acao.c | 0;
  const itens = { ...e.itens, [item]: e.itens[item] - 1 };
  if (item === 'coringa') {
    if (c < 0 || c >= e.colunas.length) return { e, aplicou: false };
    const carta = { id: e.proxId, tipo: 'coringa', v: 0, cor: 0 };
    const r = podeColocar(e.regras, e.colunas[c], carta, { trancada: !!e.cadeados[c] });
    if (!r.ok) { eventos.push({ tipo: 'recusar', c, motivo: r.motivo, id: carta.id }); return { e, aplicou: false }; }
    eventos.push({ tipo: 'item', item, c, id: carta.id });
    let n = { ...e, itens, proxId: e.proxId + 1 };
    n = aplicarCarta(n, carta, c, r.modo, eventos);
    n = ligarFebre(n, acao.t || 0, eventos);
    return { e: n, aplicou: true };
  }
  if (item === 'martelo') {
    const col = e.colunas[c];
    if (!col || !col.length || e.cadeados[c]) return { e, aplicou: false };
    const t = topo(col);
    eventos.push({ tipo: 'item', item, c, id: t.id });
    let pedras = e.pedrasQuebradas;
    if (ehPedra(t)) { eventos.push({ tipo: 'pedra', c, id: t.id, hp: 0, quebrou: true }); if (!t.lancada) pedras++; }
    else eventos.push({ tipo: 'martelo', c, id: t.id, valor: t.v });
    const colunas = e.colunas.slice();
    colunas[c] = col.slice(0, -1);
    return { e: { ...e, itens, colunas, pedrasQuebradas: pedras }, aplicou: true };
  }
  if (item === 'troca') {
    if (e.fila.length < 2) return { e, aplicou: false };
    const fila = e.fila.slice();
    [fila[0], fila[1]] = [fila[1], fila[0]];
    eventos.push({ tipo: 'troca', ids: [fila[0].id, fila[1].id] });
    return { e: { ...e, itens, fila }, aplicou: true };
  }
  return { e, aplicou: false };
}

/** Continuar: limpa a coluna mais cheia (a pedra fica) e devolve 1 descarte. */
function acRetomar(e, acao, eventos) {
  if (e.fim !== 'mesaCheia') return { e, aplicou: false };
  let melhor = -1, qtd = -1;
  e.colunas.forEach((col, c) => {
    const n = col.filter((k) => !ehPedra(k)).length;
    if (n > qtd) { qtd = n; melhor = c; }
  });
  if (melhor < 0 || qtd <= 0) return { e, aplicou: false };
  const colunas = e.colunas.slice();
  eventos.push({ tipo: 'limpar', c: melhor, ids: colunas[melhor].filter((k) => !ehPedra(k)).map((k) => k.id) });
  colunas[melhor] = colunas[melhor].filter((k) => ehPedra(k));
  return {
    e: folga({ ...e, colunas, fim: null, continuacoes: e.continuacoes + 1, descarteCarga: Math.max(1, e.descarteCarga), fusoesSeguidas: 0, secas: 0, combo: 0 }),
    aplicou: true,
  };
}

/** Sem jogada, sem descarte e sem item que salve: a mesa esta cheia. */
export function presa(e) {
  const martela = e.itens.martelo > 0 && e.colunas.some((col, c) => col.length && !e.cadeados[c]);
  return !temJogada(e) && e.descarteCarga <= 0 && !(e.itens.coringa > 0 && jogadasLegais(e, { tipo: 'coringa', v: 0, cor: 0 }).length) && !martela;
}

/**
 * Fecha a jogada: cadeados, metas, vitoria, furia, ataque do monstro (so se a
 * jogada contou e o golpe nao foi fatal) e mesa cheia. Preso antes do ataque,
 * o monstro nao ataca: a mesa cheia nunca vem junto com um feitico.
 * @returns {{ e: any, meio: any }}
 */
function fecharJogada(e, eventos, contou) {
  e = abrirCadeados(e, eventos);
  const m = avaliar(e, eventos);
  if (m.mudou) e = { ...e, metas: m.metas };
  if (e.fim) return { e, meio: null };
  if (todasFeitas(e.metas)) {
    const est = calcEstrelas(e);
    eventos.push({ tipo: 'fimFase', estrelas: est, pontos: e.pontos });
    return { e: { ...e, fim: 'venceu' }, meio: null };
  }
  if (!e.fila.length) {
    eventos.push({ tipo: 'fimPartida', motivo: 'baralhoAcabou' });
    return { e: { ...e, fim: 'baralhoAcabou' }, meio: null };
  }
  let meio = null;
  if (e.monstro && e.monstro.cadeia && vidaDe(e) <= 0) e = derrotar(e, eventos); // o golpe fatal da cadeia nao tem feitico
  else if (e.monstro) {
    e = ferir(e, vidaDe(e), eventos);
    if (contou && !presa(e)) ({ e, meio } = atacar(e, eventos, presa));
  }
  if (presa(e)) {
    eventos.push({ tipo: 'fimPartida', motivo: 'mesaCheia' });
    return { e: { ...e, fim: 'mesaCheia' }, meio };
  }
  return { e, meio };
}

/**
 * Aplica uma acao. Nunca muta a entrada. `meio`: a mesa depois da jogada e
 * antes do feitico do monstro (null quando ele nao atacou).
 * @returns {{ estado: any, eventos: any[], meio: any }}
 */
export function jogar(estado, acao) {
  const eventos = [];
  if (!acao || (estado.fim && acao.tipo !== 'retomar')) return { estado, eventos, meio: null };
  const t = acao.t || 0;
  let e = expirarFebre(estado, t, eventos);
  let r;
  switch (acao.tipo) {
    case 'colocar': r = acColocar(e, acao, eventos); break;
    case 'descartar': r = acDescartar(e, acao, eventos); break;
    case 'item': r = acItem(e, acao, eventos); break;
    case 'retomar': r = acRetomar(e, acao, eventos); break;
    default: return { estado, eventos, meio: null };
  }
  if (!r.aplicou) return { estado: r.e === e && e === estado ? estado : r.e, eventos, meio: null };
  const f = fecharJogada(r.e, eventos, acao.tipo === 'colocar' || acao.tipo === 'descartar');
  return { estado: f.e, eventos, meio: f.meio };
}
