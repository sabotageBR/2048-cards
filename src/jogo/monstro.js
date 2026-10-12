// Monstro que ataca. A cada `cada` jogadas (colocar ou descartar; itens,
// recusas e o "Continuar" nao contam) ele lanca o feitico anunciado num alvo
// sorteado, com um obstaculo que o jogador ja conhece. Modulo puro: o RNG do
// monstro vive em estado.monstro.rng, separado do baralho (as fases curadas
// continuam tirando as mesmas cartas).
//
// Dados da fase:
//   monstro: { cada, feiticos: ['lodo'|'pedra'|'gelo'|'corrente', ...], pedraHp?, trancaK?,
//              furia?: { hp, cada, feiticos?, alvos? } }
//   feiticos repetidos pesam mais no sorteio. Fase sem `monstro`: o monstro so apanha.
//
// Feiticos:
//   lodo      cobre um topo de 8 a 256 com uma carta da metade do valor (a coluna
//             passa a aceitar so cartas menores ate alguem fundir a gosma)
//   pedra     pedra com pedraHp no fundo de uma coluna (as cartas sobem); nao conta para a meta
//   gelo      congela o topo de 8 a 128 (sobra carta menor que descongela)
// Os limites de valor poupam a escada do monte: o feitico atrapalha, mas tem
// conserto. (Um 2 em cima de tudo matava a coluna: na colocacao estrita ela
// so aceitaria 2.)
//   corrente  tranca uma coluna por trancaK jogadas (uma de cada vez, so com 4+ colunas)
// Um alvo so vale se o jogador nao fica preso logo depois; sem alvo valido o
// feitico erra (alvos: []). Na furia (vida <= furia.hp) a contagem encurta e
// o feitico pode pegar mais de um alvo, sempre num evento so.
//
// Eventos: furia {}, monstro { feitico, alvos: [{ c, id?, altura?, n? }], proximo, conta },
//          derrotado { nivel, reino } (so na cadeia)
//
// Cadeia (Classico e Diario, monstro: { cadeia: true, ordem? }): a vida e de
// pontos (vidaMax do nivel), e ao zerar o proximo monstro entra no mesmo lance,
// sem levar o dano que sobrou. A cada 5 monstros a cadeia muda de reino (na
// `ordem`; o Diario sorteia a dele pela data) e o 5o e o chefao com furia. Os
// feiticos sao os dos reinos ja visitados (o Dragao traz todos) e a contagem
// encurta com o nivel.
import { rngPasso } from './baralho.js';
import { topo, ehPedra } from './regras.js';

export const FEITICOS = ['lodo', 'pedra', 'gelo', 'corrente'];

/** Faixa do topo que o lodo cobre e que o gelo congela. */
const LODO = [8, 256];
const GELO = [8, 128];
const naFaixa = (t, f) => t && t.tipo === 'normal' && !t.gelo && t.v >= f[0] && t.v <= f[1];

function sortearProximo(m) {
  const lista = (m.emFuria && m.furia && m.furia.feiticos) || m.feiticos;
  const [u, rng] = rngPasso(m.rng);
  return { ...m, rng, proximo: lista[Math.floor(u * lista.length)] };
}

/**
 * Monstro da partida (ou null para o monstro que so apanha).
 * @param {any} cfg fase.monstro
 * @param {number} semente semente da partida
 */
export function criarMonstro(cfg, semente) {
  if (cfg && cfg.cadeia) return criarCadeia(cfg, semente);
  if (!cfg || !(cfg.cada > 0) || !Array.isArray(cfg.feiticos) || !cfg.feiticos.length) return null;
  const feiticos = cfg.feiticos.filter((f) => FEITICOS.includes(f));
  if (!feiticos.length) return null;
  const f = cfg.furia;
  return sortearProximo({
    cada: cfg.cada, conta: cfg.cada, feiticos, proximo: '',
    rng: ((semente ^ 0x9e3779b9) >>> 0) || 1,
    pedraHp: Math.max(1, cfg.pedraHp | 0 || 2), trancaK: Math.max(1, cfg.trancaK | 0 || 3),
    furia: f ? { hp: f.hp ?? 0.5, cada: Math.max(1, f.cada | 0 || cfg.cada), feiticos: f.feiticos || null, alvos: Math.max(1, f.alvos | 0 || 1) } : null,
    emFuria: false, lancados: 0,
  });
}

/** Contagem de agora (a da furia, se ela ja comecou). */
const cadaDe = (m) => (m.emFuria && m.furia ? m.furia.cada : m.cada);

/**
 * O monstro apanhou: com a vida na marca da furia, ela comeca (uma vez so).
 * @param {any} e estado
 * @param {number} vida vida atual (0..1)
 */
export function ferir(e, vida, eventos) {
  const m = e.monstro;
  if (!m || !m.furia || m.emFuria || vida > m.furia.hp) return e;
  eventos.push({ tipo: 'furia' });
  let n = { ...m, emFuria: true, conta: Math.min(m.conta, m.furia.cada) };
  if (m.furia.feiticos) n = sortearProximo(n);
  return { ...e, monstro: n };
}

/** Colunas onde o feitico pode cair (antes do teste de "preso"). */
export function candidatos(e, feitico) {
  const r = [];
  const cad = e.cadeados || {};
  const abertas = e.colunas.filter((_, c) => !cad[c]).length;
  const correnteViva = Object.values(cad).some((g) => g && g.monstro);
  e.colunas.forEach((col, c) => {
    if (cad[c]) return;
    const t = topo(col);
    switch (feitico) {
      case 'lodo':
        if (col.length < e.regras.pilhaMax && naFaixa(t, LODO)) r.push(c);
        break;
      case 'pedra':
        if (col.length < e.regras.pilhaMax && !(col.length && ehPedra(col[0]))) r.push(c);
        break;
      case 'gelo':
        if (naFaixa(t, GELO)) r.push(c);
        break;
      case 'corrente':
        if (e.colunas.length >= 4 && !correnteViva && abertas - 1 >= 2) r.push(c);
        break;
      default: break;
    }
  });
  return r;
}

/** Aplica o feitico na coluna c. Devolve { e, alvo }. */
export function aplicarFeitico(e, feitico, c) {
  const colunas = e.colunas.slice();
  const col = colunas[c];
  const m = e.monstro;
  switch (feitico) {
    case 'lodo': {
      const t = col[col.length - 1];
      const carta = { id: e.proxId, tipo: 'normal', v: t.v / 2, cor: t.cor || 0 };
      colunas[c] = [...col, carta];
      return { e: { ...e, colunas, proxId: e.proxId + 1 }, alvo: { c, id: carta.id, altura: col.length, valor: carta.v } };
    }
    case 'pedra': {
      const hp = m ? m.pedraHp : 2;
      const p = { id: e.proxId, tipo: 'pedra', v: 0, cor: 0, hp, hpMax: hp, lancada: true };
      colunas[c] = [p, ...col];
      return { e: { ...e, colunas, proxId: e.proxId + 1 }, alvo: { c, id: p.id } };
    }
    case 'gelo': {
      const t = col[col.length - 1];
      colunas[c] = [...col.slice(0, -1), { ...t, gelo: true }];
      return { e: { ...e, colunas }, alvo: { c, id: t.id } };
    }
    case 'corrente': {
      const n = e.n + (m ? m.trancaK : 3);
      return { e: { ...e, cadeados: { ...e.cadeados, [c]: { tipo: 'jogadas', n, monstro: true } } }, alvo: { c, n } };
    }
    default: return { e, alvo: null };
  }
}

/**
 * Gasta a contagem da jogada; no zero lanca o feitico anunciado.
 * `meio` e o estado com a contagem gasta e antes do feitico (o render mostra
 * a mesa assim ate o impacto); sem feitico, meio e null.
 * @param {any} e estado depois da jogada do jogador
 * @param {(e: any) => boolean} presa o jogador ficaria sem saida?
 * @returns {{ e: any, meio: any }}
 */
export function atacar(e, eventos, presa) {
  const m = e.monstro;
  if (!m) return { e, meio: null };
  if (m.conta > 1) return { e: { ...e, monstro: { ...m, conta: m.conta - 1 } }, meio: null };
  const meio = { ...e, monstro: { ...m, conta: 0 } };
  const feitico = m.proximo;
  const nAlvos = m.emFuria && m.furia ? m.furia.alvos : 1;
  let rng = m.rng;
  let n = meio;
  const alvos = [];
  for (let i = 0; i < nAlvos; i++) {
    const ok = candidatos(n, feitico).filter((c) => !presa(aplicarFeitico(n, feitico, c).e));
    if (!ok.length) break;
    let u;
    [u, rng] = rngPasso(rng);
    const r = aplicarFeitico(n, feitico, ok[Math.floor(u * ok.length)]);
    n = r.e;
    alvos.push(r.alvo);
  }
  const prox = sortearProximo({ ...m, rng, conta: cadaDe(m), lancados: m.lancados + 1 });
  eventos.push({ tipo: 'monstro', feitico, alvos, proximo: prox.proximo, conta: prox.conta });
  return { e: { ...n, monstro: prox }, meio };
}

// ------------------------------------------------------------- cadeia

/** Feitico de cada reino (1..5); o vulcao (Dragao) mistura todos. */
export const FEITICO_DO_REINO = { 1: ['lodo'], 2: ['pedra'], 3: ['gelo'], 4: ['corrente'], 5: ['lodo', 'pedra', 'gelo', 'corrente'] };
export const POR_REINO = 5;
/** Vida (em pontos) do monstro n da cadeia. */
export const vidaDoNivel = (n) => Math.round(400 * Math.pow(1.5, n - 1));

/** Parametros do nivel n da cadeia (reino, posicao, chefao, ataque, vida). */
export function nivelCadeia(n, ordem = [1, 2, 3, 4, 5]) {
  const etapa = Math.floor((n - 1) / POR_REINO);
  const reino = ordem[etapa % ordem.length];
  const pos = ((n - 1) % POR_REINO) + 1;
  const chefe = pos === POR_REINO;
  const lista = [];
  for (let k = 0; k <= Math.min(etapa, ordem.length - 1); k++) for (const f of FEITICO_DO_REINO[ordem[k]]) if (!lista.includes(f)) lista.push(f);
  // o feitico do reino atual pesa o dobro
  const feiticos = [...lista, ...FEITICO_DO_REINO[reino].filter((f) => lista.includes(f))];
  const cada = Math.max(4, 9 - Math.floor(n / 2));
  return {
    reino, pos, chefe, cada, feiticos, vidaMax: vidaDoNivel(n),
    furia: chefe ? { hp: 0.5, cada: Math.max(3, cada - 2), feiticos: null, alvos: 2 } : null,
  };
}

function montarNivel(n, ordem, rng, base, derrotados) {
  const p = nivelCadeia(n, ordem);
  return sortearProximo({
    cadeia: true, ordem, nivel: n, base, vidaMax: p.vidaMax, derrotados, reino: p.reino, pos: p.pos, chefe: p.chefe,
    cada: p.cada, conta: p.cada, feiticos: p.feiticos.filter((f) => FEITICOS.includes(f)), proximo: '', rng,
    pedraHp: 2, trancaK: 3, furia: p.furia, emFuria: false, lancados: 0,
  });
}

/** Primeiro monstro da cadeia. */
export function criarCadeia(cfg, semente) {
  const ordem = Array.isArray(cfg.ordem) && cfg.ordem.length ? cfg.ordem.slice() : [1, 2, 3, 4, 5];
  return montarNivel(1, ordem, ((semente ^ 0x9e3779b9) >>> 0) || 1, 0, 0);
}

/** O monstro da cadeia caiu: evento e o proximo entra (o dano que sobrou nao passa). */
export function derrotar(e, eventos) {
  const m = e.monstro;
  eventos.push({ tipo: 'derrotado', nivel: m.nivel, reino: m.reino });
  return { ...e, monstro: montarNivel(m.nivel + 1, m.ordem, m.rng, e.pontos, m.derrotados + 1) };
}

/** "Continuar" depois da mesa cheia: o monstro da uma folga na contagem. */
export function folga(e) {
  const m = e.monstro;
  if (!m) return e;
  return { ...e, monstro: { ...m, conta: Math.max(m.conta, Math.min(3, cadaDe(m))) } };
}
