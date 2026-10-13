// Reducer central da partida. Estado em JSON puro, nunca mutado:
// jogar(estado, acao) devolve { estado, eventos }. Sem DOM, sem sorteio fora
// do estado (o RNG vive em estado.rng) e sem relogio (o tempo entra em acao.t, em ms).
//
// Acoes:
//   { tipo: 'colocar', c, k?, t }   joga a carta da frente (ou a k-esima, com filaLivre) na coluna c
//   { tipo: 'descartar', t }        manda a carta da frente para o descarte
//   { tipo: 'item', item, c?, t }   coringa (c), martelo (c), troca
//   { tipo: 'retomar', t }          continuar depois da mesa cheia: limpa a coluna mais cheia
//   { tipo: 'esvaziar', t }         esvazia a pilha do descarte (premio do video)
//
// Eventos (na ordem em que acontecem): colocar, recusar, fundir, completar,
// bomba, dobro, martelo, troca, item, descartar, combo, comboFim, febre, meta,
// nivel, graduar, descarteVazio, fila, limpar, fimFase, fimPartida. fundir,
// dobro e completar levam `pontos`: os pontos daquela fusao.
//
// Descarte: uma pilha com `regras.descarteMax` lugares por nivel
// (`descarteCarga` = lugares livres; `descarte` = a carta de cima). Cheia,
// recusa; esvazia na subida de nivel (evento `descarteVazio`).
//
// Escada (fase com `escada`, ver fases.js): a partida e o mundo inteiro. A
// meta de cada nivel e fazer o valor dele; cumprida, o nivel sobe na mesma
// jogada (evento `nivel`; uma cascata pode subir mais de um), o baralho passa
// a ser o do nivel novo e as cartas abaixo do piso dele saem da mesa
// (`graduar`). O desfazer, o "Continuar" gratis e o descarte renovam. No ultimo nivel a
// partida e vencida. Sem escada, a fase tem as metas dela e termina nelas.
import { normalizarRegras, podeColocar, topo } from './regras.js';
import { colocar, cascata, completar, graduar, dobrada } from './colunas.js';
import { encherFila, jogadasLegais, PESOS_PADRAO } from './baralho.js';
import { criarMetas, avaliar, todasFeitas } from './metas.js';

// Sobe quando o formato do estado muda ou quando as fases mudam (a partida
// salva carrega a mesa e as metas de quando comecou): o main.js descarta a
// partida salva de outra versao. 6: a escada de valores, sem monstro; 7: um
// especial por carta (`esp`) e o descarte com lugares por nivel (2026-10-13);
// 8: a escada nova da 0.4.2 (coringa e bomba no mundo 1, baralho curto, os
// mundos 2 a 4 deslocados).
export const VERSAO_ESTADO = 8;

/** Mesa inicial: as cartas de `inicio` (fundo -> topo) em cada coluna. */
function montarMesa(fase, regras, proxId) {
  const colunas = [];
  for (let c = 0; c < regras.colunas; c++) colunas.push([]);
  (fase.inicio || []).forEach((valores, c) => {
    if (c >= colunas.length) return;
    for (const v of valores) colunas[c].push({ id: proxId++, tipo: 'normal', v });
  });
  return { colunas, proxId };
}

/** Meta de um degrau da escada: fazer o valor dele. */
const metaDoDegrau = (d) => [{ tipo: 'cartas', v: d.alvo, n: 1 }];

/**
 * @param {object} regrasBase regras do jogador (laboratorio/ajustes)
 * @param {object} fase definicao da fase (fases.js): com `escada` e `nivel`, um mundo da Aventura
 * @param {number} semente
 */
export function criarPartida(regrasBase, fase, semente) {
  const regras = normalizarRegras({ ...(regrasBase || {}), ...(fase.regras || {}) });
  const mesa = montarMesa(fase, regras, 1);
  const escada = fase.escada || null;
  const nivel = escada ? Math.min(escada.length, Math.max(1, fase.nivel | 0)) : 0;
  const degrau = escada ? escada[nivel - 1] : null;
  const b = fase.baralho || {};
  let e = {
    v: VERSAO_ESTADO, regras, faseId: fase.id, mundo: fase.mundo || 0, modo: fase.modo || 'aventura',
    rng: (semente >>> 0) || 1, proxId: mesa.proxId, n: 0,
    colunas: mesa.colunas, escada, nivel,
    baralho: degrau
      ? { pesos: degrau.pesos, especiais: degrau.especiais || {}, dinamico: false, minimo: 8 }
      : { pesos: b.pesos || PESOS_PADRAO, especiais: b.especiais || {}, dinamico: b.dinamico !== false, minimo: b.minimo || 8 },
    fila: [], descarte: null, descarteCarga: regras.descarteMax,
    restantes: escada || b.total === undefined || b.total === null || b.total === Infinity ? Infinity : Math.max(1, b.total | 0),
    pontos: 0, combo: 0, fusoesSeguidas: 0, secas: 0, febreAte: 0, febre: false,
    maiorCascata: 0, montes: 0, cartasFeitas: {}, fusoes: 0,
    itens: { coringa: 0, martelo: 0, troca: 0, desfazer: 1, ...(fase.itens || {}) },
    metas: criarMetas(degrau ? { metas: metaDoDegrau(degrau) } : fase, mesa.colunas, regras),
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
  if (e.itens.coringa > 0) for (const c of jogadasLegais(e, { tipo: 'coringa', v: 0 })) r.push({ tipo: 'item', item: 'coringa', c });
  if (e.itens.martelo > 0) e.colunas.forEach((col, c) => { if (col.length) r.push({ tipo: 'item', item: 'martelo', c }); });
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
  let fusao = false, degrau = 0, valores = [];
  let passo = 0; // o quadruplo passa pelo dobro: o valor do meio tambem conta como feito
  if (modo === 'bomba') {
    const t = topo(col);
    eventos.push({ tipo: 'bomba', c, id: t.id, valor: t.v });
    col = col.slice(0, -1);
  } else if (modo === 'dobro') {
    const t = topo(col);
    const fator = Math.min(carta.tipo === 'quadruplo' ? 4 : 2, e.regras.teto / t.v);
    const novo = dobrada(t, true, fator);
    if (fator > 2) passo = t.v * 2;
    eventos.push({ tipo: 'dobro', c, id: novo.id, valor: novo.v, fator });
    const r = cascata([...col.slice(0, -1), novo], e.regras, c, eventos, 1, [novo.v]);
    col = r.col; fusao = true; degrau = r.degrau; valores = r.valores;
  } else {
    const r = colocar(col, e.regras, c, carta, eventos);
    col = r.col; fusao = r.fusao; degrau = r.degrau; valores = r.valores;
  }
  const mult = e.febre ? 2 : 1;
  let pontos = e.pontos;
  const cartasFeitas = valores.length ? { ...e.cartasFeitas } : e.cartasFeitas;
  valores.forEach((v, i) => { pontos += v * (i + 1) * mult; cartasFeitas[v] = (cartasFeitas[v] || 0) + 1; });
  if (passo) cartasFeitas[passo] = (cartasFeitas[passo] || 0) + 1;
  let montes = e.montes;
  if (fusao) {
    const comp = completar(col, e.regras, c, eventos);
    col = comp.col;
    if (comp.completou) {
      montes++;
      pontos += comp.completou * mult;
    }
  }
  colunas[c] = col;
  marcarPontos(eventos, k0, mult);
  let fusoesSeguidas = e.fusoesSeguidas, secas = e.secas, combo = e.combo;
  if (fusao) {
    fusoesSeguidas++; secas = 0; combo = fusoesSeguidas;
    if (combo >= 2) eventos.push({ tipo: 'combo', n: combo });
  } else if (modo !== 'bomba') {
    if (combo >= 2) eventos.push({ tipo: 'comboFim', n: combo });
    fusoesSeguidas = 0; secas++; combo = 0;
  }
  return {
    ...e, colunas, pontos, cartasFeitas, montes, fusoesSeguidas, secas, combo,
    fusoes: e.fusoes + valores.length,
    maiorCascata: Math.max(e.maiorCascata, degrau),
  };
}

/** Pontos de cada fusao (mesma conta dos pontos acima): degrau d vale valor * d. */
function marcarPontos(eventos, k0, mult) {
  for (let i = k0; i < eventos.length; i++) {
    const ev = eventos[i];
    if (ev.tipo === 'fundir') ev.pontos = ev.valor * ev.degrau * mult;
    else if (ev.tipo === 'dobro' || ev.tipo === 'completar') ev.pontos = ev.valor * mult;
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

/** Conta a jogada. */
function contarJogada(e) {
  return { ...e, n: e.n + 1 };
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
  const r = podeColocar(e.regras, e.colunas[c], carta);
  if (!r.ok) {
    eventos.push({ tipo: 'recusar', c, motivo: r.motivo, id: carta.id });
    return { e: { ...e, recusas: e.recusas + 1 }, aplicou: false };
  }
  let n = { ...e, fila: e.fila.filter((_, i) => i !== k), recusas: 0 };
  n = aplicarCarta(n, carta, c, r.modo, eventos);
  n = ligarFebre(n, acao.t || 0, eventos);
  n = contarJogada(n);
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
  n = contarJogada(n);
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
    const carta = { id: e.proxId, tipo: 'coringa', v: 0 };
    const r = podeColocar(e.regras, e.colunas[c], carta);
    if (!r.ok) { eventos.push({ tipo: 'recusar', c, motivo: r.motivo, id: carta.id }); return { e, aplicou: false }; }
    eventos.push({ tipo: 'item', item, c, id: carta.id });
    let n = { ...e, itens, proxId: e.proxId + 1 };
    n = aplicarCarta(n, carta, c, r.modo, eventos);
    n = ligarFebre(n, acao.t || 0, eventos);
    return { e: n, aplicou: true };
  }
  if (item === 'martelo') {
    const col = e.colunas[c];
    if (!col || !col.length) return { e, aplicou: false };
    const t = topo(col);
    eventos.push({ tipo: 'item', item, c, id: t.id });
    eventos.push({ tipo: 'martelo', c, id: t.id, valor: t.v });
    const colunas = e.colunas.slice();
    colunas[c] = col.slice(0, -1);
    return { e: { ...e, itens, colunas }, aplicou: true };
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

/** Premio do video: a pilha do descarte esvazia (como na subida de nivel). */
function acEsvaziar(e, acao, eventos) {
  if (e.descarteCarga >= e.regras.descarteMax) return { e, aplicou: false };
  if (e.descarte) eventos.push({ tipo: 'descarteVazio', id: e.descarte.id, carta: e.descarte, n: e.regras.descarteMax - e.descarteCarga });
  return { e: { ...e, descarte: null, descarteCarga: e.regras.descarteMax }, aplicou: true };
}

/** Continuar: limpa a coluna mais cheia e libera 1 lugar no descarte. */
function acRetomar(e, acao, eventos) {
  if (e.fim !== 'mesaCheia') return { e, aplicou: false };
  let melhor = -1, qtd = -1;
  e.colunas.forEach((col, c) => { if (col.length > qtd) { qtd = col.length; melhor = c; } });
  if (melhor < 0 || qtd <= 0) return { e, aplicou: false };
  const colunas = e.colunas.slice();
  eventos.push({ tipo: 'limpar', c: melhor, ids: colunas[melhor].map((k) => k.id) });
  colunas[melhor] = [];
  return {
    e: { ...e, colunas, fim: null, continuacoes: e.continuacoes + 1, descarteCarga: Math.max(1, e.descarteCarga), fusoesSeguidas: 0, secas: 0, combo: 0 },
    aplicou: true,
  };
}

/** Sem jogada, sem descarte e sem item que salve: a mesa esta cheia. */
export function presa(e) {
  const martela = e.itens.martelo > 0 && e.colunas.some((col) => col.length);
  return !temJogada(e) && e.descarteCarga <= 0 && !(e.itens.coringa > 0 && jogadasLegais(e, { tipo: 'coringa', v: 0 }).length) && !martela;
}

/**
 * Sobe um nivel da escada: meta nova, baralho novo, cartas abaixo do piso
 * fora da mesa (com os pontos delas), desfazer e "Continuar" gratis de novo,
 * pilha do descarte vazia. A fila nao muda (as cartas que ja estavam nela
 * continuam valendo).
 */
function subirNivel(e, eventos) {
  const nivel = e.nivel + 1;
  const d = e.escada[nivel - 1];
  eventos.push({ tipo: 'nivel', n: nivel, valor: d.alvo, antes: e.escada[e.nivel - 1].alvo });
  const piso = Math.min(...Object.keys(d.pesos).map(Number));
  const g = graduar(e.colunas, piso);
  let pontos = e.pontos;
  if (g.cartas.length) {
    for (const k of g.cartas) pontos += k.valor;
    eventos.push({ tipo: 'graduar', piso, cartas: g.cartas, pontos: pontos - e.pontos });
  }
  if (e.descarte) eventos.push({ tipo: 'descarteVazio', id: e.descarte.id, carta: e.descarte, n: e.regras.descarteMax - e.descarteCarga });
  return {
    ...e, nivel, colunas: g.colunas, pontos, descarte: null, descarteCarga: e.regras.descarteMax,
    baralho: { ...e.baralho, pesos: d.pesos, especiais: d.especiais || {} },
    metas: criarMetas({ metas: metaDoDegrau(d) }, g.colunas, e.regras, e.cartasFeitas),
    itens: { ...e.itens, desfazer: Math.max(1, e.itens.desfazer) },
    continuacoes: 0,
  };
}

/**
 * Fecha a jogada: metas, subida de nivel, vitoria e mesa cheia.
 * @returns {any}
 */
function fecharJogada(e, eventos) {
  for (;;) {
    const m = avaliar(e, eventos);
    if (m.mudou) e = { ...e, metas: m.metas };
    if (!todasFeitas(e.metas)) break;
    if (e.escada && e.nivel < e.escada.length) { e = subirNivel(e, eventos); continue; }
    eventos.push({ tipo: 'fimFase', pontos: e.pontos });
    return { ...e, fim: 'venceu' };
  }
  if (!e.fila.length) {
    eventos.push({ tipo: 'fimPartida', motivo: 'baralhoAcabou' });
    return { ...e, fim: 'baralhoAcabou' };
  }
  if (presa(e)) {
    eventos.push({ tipo: 'fimPartida', motivo: 'mesaCheia' });
    return { ...e, fim: 'mesaCheia' };
  }
  return e;
}

/**
 * Aplica uma acao. Nunca muta a entrada.
 * @returns {{ estado: any, eventos: any[] }}
 */
export function jogar(estado, acao) {
  const eventos = [];
  if (!acao || (estado.fim && acao.tipo !== 'retomar')) return { estado, eventos };
  const t = acao.t || 0;
  const e = expirarFebre(estado, t, eventos);
  let r;
  switch (acao.tipo) {
    case 'colocar': r = acColocar(e, acao, eventos); break;
    case 'descartar': r = acDescartar(e, acao, eventos); break;
    case 'item': r = acItem(e, acao, eventos); break;
    case 'retomar': r = acRetomar(e, acao, eventos); break;
    case 'esvaziar': r = acEsvaziar(e, acao, eventos); break;
    default: return { estado, eventos };
  }
  if (!r.aplicou) return { estado: r.e === e && e === estado ? estado : r.e, eventos };
  return { estado: fecharJogada(r.e, eventos), eventos };
}
