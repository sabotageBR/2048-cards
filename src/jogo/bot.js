// Jogador automatico: avalia cada acao legal com uma jogada de antecedencia
// e uma heuristica simples. Serve aos testes de fase, ao simulador de
// dificuldade, ao laboratorio e a mao de ajuda. O perfil casual (op.erro)
// imita uma pessoa: erra a coluna de vez em quando e usa o "Continuar"
// gratis; e a regua da curva de dificuldade.
import { criarPartida, jogar, acoesLegais, jogadasLegais } from './partida.js';
import { fundeCom, topo } from './regras.js';
import { rngPasso } from './baralho.js';
import { faseDe, faseGlobal, POR_MUNDO } from './fases.js';

/** Jogador casual: 1 em 5 jogadas vai para uma coluna qualquer. */
export const PERFIL_CASUAL = { erro: 0.2 };

/** Quanto a mesa esta "boa" (maior e melhor). */
export function avaliarMesa(e) {
  if (e.fim === 'venceu') return 1e9;
  if (e.fim === 'mesaCheia') return -1e9 + e.pontos;
  if (e.fim === 'baralhoAcabou') return -1e8 + e.pontos;
  let s = e.pontos;
  for (const col of e.colunas) {
    const n = col.length;
    s -= n * n * 7;
    if (n === 0) s += 45;
    for (let i = 1; i < col.length; i++) {
      const b = col[i - 1], t = col[i];
      if (b.tipo !== 'normal' || t.tipo !== 'normal') continue;
      const razao = b.v / t.v;
      if (razao === 2) s += 22;
      else if (razao > 2) s -= Math.log2(razao) * 5;
      else s -= 60; // maior em cima (permissiva) tranca a de baixo
    }
  }
  s += e.descarteCarga * 55;
  for (let k = 1; k < e.fila.length; k++) {
    const carta = e.fila[k];
    const legais = jogadasLegais(e, carta);
    if (!legais.length) s -= 90 / k;
    else if (legais.some((c) => fundeCom(e.regras, topo(e.colunas[c]), carta))) s += 28 / k;
  }
  // metas: progresso vale pontos (na escada, a meta cumprida e o nivel novo)
  for (const m of e.metas) s += (m.atual / m.alvo) * 400;
  s += (e.nivel || 0) * 400;
  return s;
}

/** Melhor acao agora (ou null). */
export function melhorJogada(e, t = 0) {
  const acoes = acoesLegais(e);
  if (!acoes.length) return null;
  let melhor = null, melhorNota = -Infinity;
  for (const a of acoes) {
    const r = jogar(e, { ...a, t });
    let nota = avaliarMesa(r.estado);
    if (a.tipo === 'descartar') nota -= 120;
    if (a.tipo === 'item') nota -= a.item === 'martelo' ? 220 : 160;
    if (nota > melhorNota) { melhorNota = nota; melhor = a; }
  }
  return melhor;
}

/** Sorteio proprio do bot (o erro do casual), derivado da semente. */
function sorteador(semente) {
  let rng = ((semente ^ 0x85ebca6b) >>> 0) || 1;
  return () => { const [u, r] = rngPasso(rng); rng = r; return u; };
}

/** A jogada do bot: a melhor, ou (casual) uma coluna qualquer na fracao `erro`. */
function escolher(e, t, erro, sortear) {
  if (erro && sortear() < erro) {
    const soltas = acoesLegais(e).filter((x) => x.tipo === 'colocar');
    if (soltas.length) return soltas[Math.floor(sortear() * soltas.length)];
  }
  return melhorJogada(e, t);
}

/**
 * Joga uma fase ate o fim. Devolve { venceu, fim, jogadas, pontos, estado }.
 * Com `erro` (perfil casual) a fracao `erro` das jogadas vai para uma coluna
 * sorteada e a mesa cheia ganha um "Continuar".
 * @param {object} fase
 * @param {object} regras
 * @param {number} semente
 * @param {{ maxJogadas?: number, passoMs?: number, erro?: number }} [op]
 */
export function jogarSozinho(fase, regras, semente, op = {}) {
  const max = op.maxJogadas || 800;
  const passo = op.passoMs || 900;
  const erro = op.erro || 0;
  const sortear = sorteador(semente);
  let e = criarPartida(regras, fase, semente);
  let t = 0, jogadas = 0, continuou = false;
  while (jogadas < max) {
    if (e.fim === 'mesaCheia' && erro && !continuou) {
      continuou = true;
      e = jogar(e, { tipo: 'retomar', t }).estado;
    }
    if (e.fim) break;
    const a = escolher(e, t, erro, sortear);
    if (!a) break;
    const r = jogar(e, { ...a, t });
    if (r.estado === e) break; // acao recusada: nada mudaria nas proximas
    e = r.estado;
    t += passo;
    jogadas++;
  }
  return { venceu: e.fim === 'venceu', fim: e.fim, jogadas, pontos: e.pontos, estado: e };
}

/**
 * Joga um mundo inteiro numa mesa so, como o jogador: o nivel sobe na mesma
 * mesa; na mesa cheia vem o "Continuar" gratis do nivel e, sem ele, o nivel
 * recomeca pelo kit (semente nova). Devolve
 * { completou, jogadas, niveis: [{ jogadas, descartes, juntou, cheias, recomecos, chegou, passou }] }
 * (`chegou`: comecou o nivel; `passou`: fechou o nivel; `juntou`: jogadas de
 * juntar, no perfil 'juntar').
 * @param {number} mundo 1..5 (ou o mundo sem fim, 6+)
 * @param {number} semente
 * @param {{ erro?: number, maxJogadas?: number, maxRecomecos?: number, nivel?: number, regras?: object, perfil?: string }} [op]
 */
export function jogarMundo(mundo, semente, op = {}) {
  const erro = op.erro || 0;
  const max = op.maxJogadas || 3000;
  const maxRec = op.maxRecomecos === undefined ? 8 : op.maxRecomecos;
  const sortear = sorteador(semente);
  const niveis = Array.from({ length: POR_MUNDO }, () => ({ jogadas: 0, descartes: 0, juntou: 0, cheias: 0, recomecos: 0, chegou: false, passou: false }));
  const nova = (nivel, tentativa) => criarPartida(op.regras || {}, faseDe(faseGlobal(mundo, nivel), tentativa, op.perfil), (semente + tentativa * 7919) >>> 0);
  let tentativa = 0;
  let e = nova(op.nivel || 1, 0);
  niveis[e.nivel - 1].chegou = true;
  let t = 0, jogadas = 0;
  while (jogadas < max && e.fim !== 'venceu') {
    const nv = niveis[e.nivel - 1];
    if (e.fim === 'mesaCheia') {
      nv.cheias++;
      if (e.continuacoes === 0) { e = jogar(e, { tipo: 'retomar', t }).estado; continue; }
      if (nv.recomecos >= maxRec) break;
      nv.recomecos++;
      e = nova(e.nivel, ++tentativa);
      continue;
    }
    if (e.fim) break;
    const a = escolher(e, t, erro, sortear);
    if (!a) break;
    const r = jogar(e, { ...a, t });
    if (r.estado === e) break;
    const antes = e.nivel;
    e = r.estado;
    t += 900;
    jogadas++;
    nv.jogadas++;
    if (a.tipo === 'descartar') nv.descartes++;
    if (a.tipo === 'juntar') nv.juntou++;
    if (e.nivel > antes || e.fim === 'venceu') {
      for (let n = antes; n < e.nivel; n++) { niveis[n - 1].passou = true; niveis[n].chegou = true; }
      if (e.fim === 'venceu') niveis[e.nivel - 1].passou = true;
    }
  }
  return { completou: e.fim === 'venceu', jogadas, niveis, pontos: e.pontos, estado: e };
}
