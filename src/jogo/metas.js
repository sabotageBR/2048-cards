// Metas do nivel. Tipos:
//   cartas { v, n }   fazer n cartas de valor v (por fusao)
//   montes { n }      completar n montes (carta do teto sai da mesa)
// Na escada cada nivel tem uma meta: fazer o valor do nivel. O progresso do
// nivel (a barra do painel) e o progresso suave da meta, contado desde que
// ela entrou. Meta cumprida nao volta atras.

export const TIPOS = ['cartas', 'montes'];

/** Trabalho para montar uma carta v a partir de 2s: soma dos valores criados por fusao. */
const phi = (v) => (v > 2 ? v * (Math.log2(v) - 1) : 0);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** Trabalho feito por fusao em cartas ate v (cartasFeitas acumula a partida inteira). */
function trabalhoFeito(cartasFeitas, v) {
  let s = 0;
  for (const k of Object.keys(cartasFeitas)) { const w = Number(k); if (w <= v) s += w * cartasFeitas[k]; }
  return s;
}

/**
 * @param {{ metas?: any[] }} fase
 * @param {any[][]} [colunas] mesa de quando a meta entra (desconta o trabalho que ja esta nela)
 * @param {{ teto: number }} [regras]
 * @param {Record<string, number>} [cartasFeitas] o trabalho de antes nao conta para a barra
 * @returns {any[]}
 */
export function criarMetas(fase, colunas = [], regras = { teto: 2048 }, cartasFeitas = {}) {
  return (fase.metas || []).slice(0, 2).map((m) => {
    const meta = { ...m, atual: 0, feita: false, alvo: m.n || 1 };
    const v = m.tipo === 'cartas' ? m.v : regras.teto;
    let base = 0;
    for (const col of colunas) for (const k of col) if (k.tipo === 'normal' && k.v < v) base += phi(k.v);
    meta.trabalho = Math.max(v, meta.alvo * phi(v) - base);
    meta.feitoAntes = trabalhoFeito(cartasFeitas, v);
    return meta;
  });
}

function valorAtual(m, e) {
  switch (m.tipo) {
    case 'cartas': return e.cartasFeitas[m.v] || 0;
    case 'montes': return e.montes;
    default: return 0;
  }
}

/** Recalcula as metas; devolve { metas, mudou } e empurra eventos 'meta'. */
export function avaliar(estado, eventos) {
  let mudou = false;
  const metas = estado.metas.map((m, k) => {
    if (m.feita) return m;
    const atual = Math.min(m.alvo, valorAtual(m, estado));
    const feita = atual >= m.alvo;
    if (atual === m.atual && feita === m.feita) return m;
    mudou = true;
    eventos.push({ tipo: 'meta', k, atual, alvo: m.alvo, feita, antes: m.atual });
    return { ...m, atual, feita };
  });
  return { metas: mudou ? metas : estado.metas, mudou };
}

export const todasFeitas = (metas) => metas.length > 0 && metas.every((m) => m.feita);

// Cauda da barra: a raiz do trabalho feito ate P_CAUDA; dali o progresso
// encosta devagar em P_TETO. O trabalho feito passa da conta quando as cartas
// se espalham pelas colunas, e a barra nao pode parecer cheia antes da fusao
// que fecha o nivel.
const P_CAUDA = 0.75, P_TETO = 0.92, CAUDA = 0.35;

/** Progresso suave de uma meta (0..1): cada fusao anda um pouco, mesmo quando a meta conta em degraus. */
export function progresso(m, e) {
  if (m.feita) return 1;
  const v = m.tipo === 'cartas' ? m.v : e.regras.teto;
  // a raiz adianta a barra (as ultimas fusoes valem metade do trabalho)
  const s = Math.sqrt(Math.max(0, trabalhoFeito(e.cartasFeitas, v) - (m.feitoAntes || 0)) / (m.trabalho || v));
  if (s <= P_CAUDA) return s;
  return P_CAUDA + (P_TETO - P_CAUDA) * (1 - Math.exp(-(s - P_CAUDA) / CAUDA));
}

/** Progresso do nivel (0..1): zero sem metas; um com a partida vencida. */
export function progressoDoNivel(e) {
  if (e.fim === 'venceu') return 1;
  if (!e.metas.length) return 0;
  return clamp01(e.metas.reduce((s, m) => s + progresso(m, e), 0) / e.metas.length);
}
