// Regras da mesa: presets e validacao de colocacao. Modulo puro.
//
// Uma coluna e um vetor de cartas do fundo (indice 0) ao topo. A carta nova
// entra sempre pelo topo. Carta: { id, tipo, v, cor, gelo?, hp? }
//   tipo 'normal'  : valor v (potencia de 2) e cor (0..3, so com naipes)
//   tipo 'coringa' : funde com qualquer topo e dobra; em coluna vazia vira 2
//   tipo 'bomba'   : destroi o topo da coluna escolhida (ou quebra a pedra)
//   tipo 'dobro'   : dobra o topo da coluna escolhida e dispara a cascata
//   tipo 'pedra'   : obstaculo sem valor no fundo da coluna, com hp
//   gelo true      : carta congelada; nao funde ate uma fusao na coluna

export const REGRAS_PADRAO = Object.freeze({
  colunas: 4,            // 3..5
  pilhaMax: 5,           // cartas por coluna (a pedra conta)
  colocacao: 'estrita',  // 'estrita': topo >= carta | 'permissiva': qualquer carta
  naipes: false,         // so funde valor e cor iguais
  filaLivre: false,      // qualquer carta da fila pode ser jogada
  tamFila: 3,
  teto: 2048,            // valor que sai da mesa (4096 na fase de chefe)
  descarteMax: 1,
  descarteRecarga: 12,   // 0 = so ao completar um monte; N = tambem a cada N cartas jogadas
  febreFusoes: 5,        // fusoes seguidas para ligar a febre
  febreMs: 10000,
});

const TETOS = [1024, 2048, 4096, 8192];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** @param {Partial<typeof REGRAS_PADRAO>} [r] */
export function normalizarRegras(r = {}) {
  const n = { ...REGRAS_PADRAO, ...r };
  n.colunas = clamp(n.colunas | 0, 3, 5);
  n.pilhaMax = clamp(n.pilhaMax | 0, 3, 8);
  n.tamFila = clamp(n.tamFila | 0, 1, 5);
  n.descarteMax = clamp(n.descarteMax | 0, 0, 3);
  n.descarteRecarga = Math.max(0, n.descarteRecarga | 0);
  if (!TETOS.includes(n.teto)) n.teto = 2048;
  if (n.colocacao !== 'permissiva') n.colocacao = 'estrita';
  n.naipes = !!n.naipes;
  n.filaLivre = !!n.filaLivre;
  return n;
}

export const ehPedra = (c) => !!c && c.tipo === 'pedra';
export const ehCoringa = (c) => !!c && c.tipo === 'coringa';
export const ehAlvo = (c) => !!c && (c.tipo === 'bomba' || c.tipo === 'dobro');
/** Topo da coluna (null se vazia). */
export const topo = (col) => (col.length ? col[col.length - 1] : null);

/**
 * A carta funde com o topo?
 * @param {typeof REGRAS_PADRAO} regras
 */
export function fundeCom(regras, t, carta) {
  if (!t || ehPedra(t) || !carta) return false;
  if (carta.tipo === 'coringa') return true; // descongela e dobra
  if (carta.tipo !== 'normal') return false;
  if (t.gelo) return false;
  if (t.v !== carta.v) return false;
  if (regras.naipes && t.cor !== carta.cor) return false;
  return true;
}

/**
 * Pode colocar a carta nessa coluna? Devolve { ok, modo } ou { ok: false, motivo }.
 * modo: 'fusao' | 'empilha' | 'bomba' | 'dobro'
 * motivo: 'trancada' | 'vazia' | 'semAlvo' | 'cheia' | 'maior' | 'gelo'
 * @param {typeof REGRAS_PADRAO} regras
 * @param {any[]} coluna
 * @param {any} carta
 * @param {{ trancada?: boolean }} [op]
 */
export function podeColocar(regras, coluna, carta, op = {}) {
  if (!carta) return { ok: false, motivo: 'semCarta' };
  if (op.trancada) return { ok: false, motivo: 'trancada' };
  const t = topo(coluna);
  if (carta.tipo === 'bomba') return t ? { ok: true, modo: 'bomba' } : { ok: false, motivo: 'vazia' };
  if (carta.tipo === 'dobro') {
    return t && !ehPedra(t) && !t.gelo ? { ok: true, modo: 'dobro' } : { ok: false, motivo: 'semAlvo' };
  }
  if (fundeCom(regras, t, carta)) return { ok: true, modo: 'fusao' };
  // carta igual sobre gelo: recusada (senao, ao descongelar, a maior fica em cima da menor)
  if (t && t.gelo && carta.tipo === 'normal' && t.v === carta.v) return { ok: false, motivo: 'gelo' };
  if (coluna.length >= regras.pilhaMax) return { ok: false, motivo: 'cheia' };
  if (!t || ehPedra(t)) return { ok: true, modo: 'empilha' };
  if (carta.tipo === 'coringa') return { ok: true, modo: 'empilha' };
  if (regras.colocacao === 'estrita' && t.v < carta.v) return { ok: false, motivo: 'maior' };
  return { ok: true, modo: 'empilha' };
}
