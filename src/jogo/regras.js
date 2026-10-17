// Regras da mesa: presets e validacao de colocacao. Modulo puro.
//
// Uma coluna e um vetor de cartas do fundo (indice 0) ao topo. A carta nova
// entra sempre pelo topo. Carta: { id, tipo, v, esp? }
//   tipo 'normal'    : valor v (potencia de 2)
//   tipo 'coringa'   : funde com qualquer topo e dobra; em coluna vazia vira 2
//   tipo 'bomba'     : destroi o topo da coluna escolhida
//   tipo 'dobro'     : dobra o topo da coluna escolhida e dispara a cascata
//   tipo 'quadruplo' : o mesmo, vezes 4 (sem passar do teto)
// Um especial por carta: a carta que recebeu um coringa, um dobro ou um
// quadruplo fica com `esp` e recusa outro ate fundir de novo (ver dobrada em
// colunas.js). A bomba nao olha a marca.
//
// Juntar (regras.juntar, o braço 'juntar' do teste A/B da 0.6.0): a carta do
// topo de uma coluna vai ate outra coluna cujo topo tem o mesmo valor e funde
// (com a cascata), como uma carta da mao. So para fundir: cada juntar tira
// uma carta da mesa, entao nunca entra em laco.

export const REGRAS_PADRAO = Object.freeze({
  colunas: 4,            // 3..5
  pilhaMax: 6,           // cartas por coluna
  colocacao: 'estrita',  // 'estrita': topo >= carta | 'permissiva': qualquer carta
  filaLivre: false,      // qualquer carta da fila pode ser jogada
  juntar: false,         // a carta do topo vai ate um topo igual em outra coluna
  tamFila: 3,
  teto: 2048,            // valor que sai da mesa
  descarteMax: 3,        // lugares da pilha do descarte em cada nivel (esvazia na subida)
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
  n.descarteMax = clamp(n.descarteMax | 0, 0, 9);
  if (!TETOS.includes(n.teto)) n.teto = 2048;
  if (n.colocacao !== 'permissiva') n.colocacao = 'estrita';
  n.filaLivre = !!n.filaLivre;
  n.juntar = !!n.juntar;
  return n;
}

export const ehCoringa = (c) => !!c && c.tipo === 'coringa';
/** O especial olha a marca `esp` do topo (um especial por carta)? A bomba nao. */
export const respeitaMarca = (c) => !!c && (c.tipo === 'coringa' || c.tipo === 'dobro' || c.tipo === 'quadruplo');
/** Topo da coluna (null se vazia). */
export const topo = (col) => (col.length ? col[col.length - 1] : null);

/**
 * A carta funde com o topo?
 * @param {typeof REGRAS_PADRAO} _regras
 */
export function fundeCom(_regras, t, carta) {
  if (!t || !carta) return false;
  if (carta.tipo === 'coringa') return !t.esp;
  if (carta.tipo !== 'normal') return false;
  return t.v === carta.v;
}

/**
 * Pode colocar a carta nessa coluna? Devolve { ok, modo } ou { ok: false, motivo }.
 * modo: 'fusao' | 'empilha' | 'bomba' | 'dobro'
 * motivo: 'semCarta' | 'vazia' | 'semAlvo' | 'usada' (o topo ja recebeu um especial) | 'cheia' | 'maior'
 * @param {typeof REGRAS_PADRAO} regras
 * @param {any[]} coluna
 * @param {any} carta
 */
export function podeColocar(regras, coluna, carta) {
  if (!carta) return { ok: false, motivo: 'semCarta' };
  const t = topo(coluna);
  if (carta.tipo === 'bomba') return t ? { ok: true, modo: 'bomba' } : { ok: false, motivo: 'vazia' };
  if (carta.tipo === 'dobro' || carta.tipo === 'quadruplo') return !t ? { ok: false, motivo: 'semAlvo' } : t.esp ? { ok: false, motivo: 'usada' } : { ok: true, modo: 'dobro' };
  if (fundeCom(regras, t, carta)) return { ok: true, modo: 'fusao' };
  // o coringa so empilha na coluna vazia (vira 2); no topo marcado, recusa
  if (carta.tipo === 'coringa' && t) return { ok: false, motivo: 'usada' };
  if (coluna.length >= regras.pilhaMax) return { ok: false, motivo: 'cheia' };
  if (!t) return { ok: true, modo: 'empilha' };
  if (regras.colocacao === 'estrita' && t.v < carta.v) return { ok: false, motivo: 'maior' };
  return { ok: true, modo: 'empilha' };
}

/**
 * Pode juntar o topo da coluna `de` com o topo da coluna `c`? Devolve { ok }
 * ou { ok: false, motivo }. motivo: 'regra' (regra desligada) | 'mesma' |
 * 'vazia' (alguma das duas) | 'juntar' (topos diferentes). A marca `esp` nao
 * impede: a fusao a limpa (dobrada).
 * @param {typeof REGRAS_PADRAO} regras
 * @param {any[][]} colunas
 * @param {number} de
 * @param {number} c
 */
export function podeJuntar(regras, colunas, de, c) {
  if (!regras.juntar) return { ok: false, motivo: 'regra' };
  if (de === c) return { ok: false, motivo: 'mesma' };
  const a = colunas[de] && topo(colunas[de]);
  const b = colunas[c] && topo(colunas[c]);
  if (!a || !b) return { ok: false, motivo: 'vazia' };
  if (a.tipo !== 'normal' || b.tipo !== 'normal' || a.v !== b.v) return { ok: false, motivo: 'juntar' };
  return { ok: true };
}
