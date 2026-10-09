// Metas de fase e estrelas. Tipos:
//   pontos     { alvo }          pontuacao da fase
//   cartas     { v, n }          fazer n cartas de valor v (por fusao)
//   montes     { n }             completar n montes (carta do teto sai da mesa)
//   pedras     { }               quebrar todas as pedras
//   sobreviver { n }             jogar n cartas (fases de baralho finito)
//   cascata    { x }             uma cascata de x degraus
// Estrelas: 1 = metas; 2 = pontos >= estrelas[1]; 3 = pontos >= estrelas[2].

export const TIPOS = ['pontos', 'cartas', 'montes', 'pedras', 'sobreviver', 'cascata'];

/** @returns {any[]} */
export function criarMetas(fase) {
  return (fase.metas || []).slice(0, 2).map((m) => {
    const meta = { ...m, atual: 0, feita: false };
    meta.alvo = m.tipo === 'pontos' ? m.alvo : m.tipo === 'cascata' ? m.x : m.tipo === 'pedras' ? 1 : (m.n || 1);
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

/** 1..3 estrelas pela pontuacao. */
export function estrelas(estado) {
  const ref = estado.estrelasRef || [0, 0, 0];
  if (ref[2] > 0 && estado.pontos >= ref[2]) return 3;
  if (ref[1] > 0 && estado.pontos >= ref[1]) return 2;
  return 1;
}
