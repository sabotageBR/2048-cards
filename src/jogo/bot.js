// Jogador automatico: avalia cada acao legal com uma jogada de antecedencia
// e uma heuristica simples. Serve aos testes de fase, ao simulador de
// dificuldade, ao laboratorio e a mao de ajuda. O perfil casual (op.erro)
// imita uma pessoa: erra a coluna de vez em quando, nao ve o feitico chegando
// e usa o "Continuar" gratis uma vez; e a regua da curva de dificuldade.
import { criarPartida, jogar, acoesLegais, jogadasLegais } from './partida.js';
import { fundeCom, topo, ehPedra } from './regras.js';
import { estrelas as calcEstrelas } from './metas.js';
import { rngPasso } from './baralho.js';

/** Jogador casual: 1 em 5 jogadas vai para uma coluna qualquer. */
export const PERFIL_CASUAL = { erro: 0.2 };

/** Quanto a mesa esta "boa" (maior e melhor). */
export function avaliarMesa(e) {
  if (e.fim === 'venceu') return 1e9;
  if (e.fim === 'mesaCheia') return -1e9 + e.pontos;
  if (e.fim === 'baralhoAcabou') return -1e8 + e.pontos;
  let s = e.pontos;
  for (const col of e.colunas) {
    const cartas = col.filter((k) => !ehPedra(k));
    const n = cartas.length;
    s -= n * n * 7;
    if (n === 0) s += 45;
    for (let i = 1; i < cartas.length; i++) {
      const b = cartas[i - 1], t = cartas[i];
      if (b.tipo !== 'normal' || t.tipo !== 'normal') continue;
      const razao = b.v / t.v;
      if (razao === 2) s += 22;
      else if (razao > 2) s -= Math.log2(razao) * 5;
      else s -= 60; // permissiva: carta maior em cima da menor tranca a de baixo
    }
    const tp = topo(col);
    if (tp && tp.tipo === 'normal' && tp.gelo) s -= 10;
    if (col.length && ehPedra(col[0])) s -= col[0].hp * 45; // quebrar pedras vale mais que empilhar bonito
  }
  s += e.descarteCarga * 55;
  for (let k = 1; k < e.fila.length; k++) {
    const carta = e.fila[k];
    const legais = jogadasLegais(e, carta);
    if (!legais.length) s -= 90 / k;
    else if (legais.some((c) => fundeCom(e.regras, topo(e.colunas[c]), carta))) s += 28 / k;
  }
  // metas: progresso vale pontos
  for (const m of e.metas) s += (m.atual / m.alvo) * 400;
  return s;
}

/**
 * Melhor acao agora (ou null). Com `cego` a nota sai da mesa antes do
 * feitico (quem joga nao sabe onde o monstro vai acertar).
 */
export function melhorJogada(e, t = 0, cego = false) {
  const acoes = acoesLegais(e);
  if (!acoes.length) return null;
  let melhor = null, melhorNota = -Infinity;
  for (const a of acoes) {
    const r = jogar(e, { ...a, t });
    let nota = avaliarMesa(cego && r.meio ? { ...r.meio, fim: r.estado.fim } : r.estado);
    if (a.tipo === 'descartar') nota -= 120;
    if (a.tipo === 'item') nota -= a.item === 'martelo' ? 220 : 160;
    if (nota > melhorNota) { melhorNota = nota; melhor = a; }
  }
  return melhor;
}

/**
 * Joga uma fase ate o fim. Devolve { venceu, fim, estrelas, jogadas, pontos, estado,
 * ataques (feiticos lancados), aposFeitico (perdeu ate 2 jogadas depois de um feitico) }.
 * Com `erro` (perfil casual) a fracao `erro` das jogadas vai para uma coluna
 * sorteada (RNG proprio, derivado da semente), a nota nao ve o feitico e a
 * mesa cheia ganha um "Continuar".
 * @param {object} fase
 * @param {object} regras
 * @param {number} semente
 * @param {{ maxJogadas?: number, passoMs?: number, erro?: number }} [op]
 */
export function jogarSozinho(fase, regras, semente, op = {}) {
  const max = op.maxJogadas || 800;
  const passo = op.passoMs || 900;
  const erro = op.erro || 0;
  let rng = ((semente ^ 0x85ebca6b) >>> 0) || 1;
  const sortear = () => { const [u, r] = rngPasso(rng); rng = r; return u; };
  let e = criarPartida(regras, fase, semente);
  let t = 0, jogadas = 0, ultimoFeitico = -99, continuou = false;
  while (jogadas < max) {
    if (e.fim === 'mesaCheia' && erro && !continuou) {
      continuou = true;
      e = jogar(e, { tipo: 'retomar', t }).estado;
    }
    if (e.fim) break;
    let a = null;
    if (erro && sortear() < erro) {
      const soltas = acoesLegais(e).filter((x) => x.tipo === 'colocar');
      if (soltas.length) a = soltas[Math.floor(sortear() * soltas.length)];
    }
    if (!a) a = melhorJogada(e, t, erro > 0);
    if (!a) break;
    const r = jogar(e, { ...a, t });
    if (r.estado === e) break; // acao recusada: nada mudaria nas proximas
    e = r.estado;
    t += passo;
    jogadas++;
    if (r.eventos.some((ev) => ev.tipo === 'monstro' && ev.alvos.length)) ultimoFeitico = jogadas;
  }
  const venceu = e.fim === 'venceu';
  return {
    venceu, fim: e.fim, estrelas: venceu ? calcEstrelas(e) : 0, jogadas, pontos: e.pontos, estado: e,
    ataques: e.monstro ? e.monstro.lancados : 0, aposFeitico: !venceu && jogadas - ultimoFeitico <= 2,
  };
}
