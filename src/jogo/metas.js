// Metas de fase e estrelas. Tipos:
//   pontos     { alvo }          pontuacao da fase
//   cartas     { v, n }          fazer n cartas de valor v (por fusao)
//   montes     { n }             completar n montes (carta do teto sai da mesa)
//   pedras     { }               quebrar todas as pedras (as do monstro nao contam)
//   sobreviver { n }             jogar n cartas (fases de baralho finito)
//   cascata    { x }             uma cascata de x degraus
// Estrelas: 1 = metas; 2 = pontos >= estrelas[1]; 3 = pontos >= estrelas[2].
// Vida do monstro: 1 - media do progresso suave de cada meta (progresso).
// Meta cumprida nao volta atras (o feitico do monstro nao desfaz nada).

export const TIPOS = ['pontos', 'cartas', 'montes', 'pedras', 'sobreviver', 'cascata'];

/** Trabalho para montar uma carta v a partir de 2s: soma dos valores criados por fusao. */
const phi = (v) => (v > 2 ? v * (Math.log2(v) - 1) : 0);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * @param {any} fase
 * @param {any[][]} [colunas] mesa inicial (desconta o trabalho que ja esta nela)
 * @param {{ teto: number }} [regras]
 * @returns {any[]}
 */
export function criarMetas(fase, colunas = [], regras = { teto: 2048 }) {
  return (fase.metas || []).slice(0, 2).map((m) => {
    const meta = { ...m, atual: 0, feita: false };
    meta.alvo = m.tipo === 'pontos' ? m.alvo : m.tipo === 'cascata' ? m.x : m.tipo === 'pedras' ? 1 : (m.n || 1);
    if (m.tipo === 'cartas' || m.tipo === 'montes') {
      const v = m.tipo === 'cartas' ? m.v : regras.teto;
      let base = 0;
      for (const col of colunas) for (const k of col) if (k.tipo === 'normal' && k.v < v) base += phi(k.v);
      meta.trabalho = Math.max(v, meta.alvo * phi(v) - base);
    }
    return meta;
  });
}

function valorAtual(m, e) {
  switch (m.tipo) {
    case 'pontos': return e.pontos;
    case 'cartas': return e.cartasFeitas[m.v] || 0;
    case 'montes': return e.montes;
    case 'pedras': return e.pedrasTotal > 0 && e.pedrasQuebradas >= e.pedrasTotal ? 1 : 0;
    case 'sobreviver': return e.n;
    case 'cascata': return e.maiorCascata;
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

// Cauda da vida nas metas de carta e de monte: a raiz do trabalho feito ate
// P_CAUDA; dali o progresso encosta devagar em P_TETO. O trabalho feito passa
// da conta quando as cartas se espalham pelas colunas (1,5 a 3x na fase 4), e
// com o teto de antes (0,97) o monstro ficava em 3% de vida, parecendo morto,
// por varias jogadas. Assim ele desce de 25% para uns 9% e so cai no golpe final.
const P_CAUDA = 0.75, P_TETO = 0.92, CAUDA = 0.35;

/** Trabalho feito por fusao em cartas ate v. */
function trabalhoFeito(e, v) {
  let s = 0;
  for (const k of Object.keys(e.cartasFeitas)) { const w = Number(k); if (w <= v) s += w * e.cartasFeitas[k]; }
  return s;
}

/**
 * Progresso suave de uma meta (0..1), para a vida do monstro: cada golpe
 * tira um pouco, mesmo quando a meta conta em degraus (fazer um 16, 1 monte).
 */
export function progresso(m, e) {
  if (m.feita) return 1;
  switch (m.tipo) {
    case 'pontos': case 'sobreviver': case 'cascata': return clamp01(m.atual / m.alvo);
    case 'pedras': {
      if (!(e.pedrasHp > 0)) return 0;
      let resta = 0;
      for (const col of e.colunas) if (col.length && col[0].tipo === 'pedra' && !col[0].lancada) resta += col[0].hp;
      return clamp01(1 - resta / e.pedrasHp);
    }
    case 'cartas': case 'montes': {
      const v = m.tipo === 'cartas' ? m.v : e.regras.teto;
      // a raiz adianta a queda (as ultimas fusoes valem metade do trabalho e
      // a barra ficava parada ate a cascata final); so a meta cumprida zera o
      // monstro: o golpe final e o que fecha
      const s = Math.sqrt(trabalhoFeito(e, v) / (m.trabalho || v));
      if (s <= P_CAUDA) return s;
      return P_CAUDA + (P_TETO - P_CAUDA) * (1 - Math.exp(-(s - P_CAUDA) / CAUDA));
    }
    default: return 0;
  }
}

/**
 * Vida do monstro (0..1): sem metas fica cheia; com a fase vencida, zero. Na
 * cadeia (Classico e Diario) a vida e de pontos: os desde que este monstro entrou.
 */
export function vidaDe(e) {
  if (e.monstro && e.monstro.cadeia) return clamp01(1 - (e.pontos - e.monstro.base) / e.monstro.vidaMax);
  if (e.fim === 'venceu') return 0;
  if (!e.metas.length) return 1;
  const p = e.metas.reduce((s, m) => s + progresso(m, e), 0) / e.metas.length;
  return clamp01(1 - p);
}

/** 1..3 estrelas pela pontuacao. */
export function estrelas(estado) {
  const ref = estado.estrelasRef || [0, 0, 0];
  if (ref[2] > 0 && estado.pontos >= ref[2]) return 3;
  if (ref[1] > 0 && estado.pontos >= ref[1]) return 2;
  return 1;
}
