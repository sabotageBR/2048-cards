// Mundos da Aventura: cada mundo e uma mesa continua de 8 niveis, a escada de
// valores 16, 32, ... 2048. O nivel sobe quando a fusao cria o valor do nivel;
// no 2048 a carta sai da mesa e o mundo termina. Uma novidade por mundo,
// validada por simulacao em test/fases.test.js (ver docs/curadoria.md).
//
//   { id, regras?, inicio: [[fundo..topo], ...], especiais: { tipo: { de, p } },
//     novidade: { tipo, nivel }, faixa?: { div, larg }, niveis?: { n: { div?, larg? } }, semente }
//
// Fase global N (1..40) = (mundo - 1) * 8 + nivel: o numero da telemetria e do mapa.
// O baralho de cada nivel tem `larg` valores, de max(4, alvo/div) para baixo,
// com os pesos de PESOS_PADRAO: cada nivel custa mais ou menos o mesmo. Ao
// subir de nivel, as cartas abaixo do piso novo saem da mesa (graduar).
// Recomecar um nivel abre o kit: [alvo/2] [alvo/4] e as outras colunas vazias.

export const POR_MUNDO = 8;

/** Valor que o nivel n (1..8) pede. */
export const alvoDoNivel = (n) => 16 * 2 ** (n - 1);

/** Faixa padrao do baralho: 5 valores, do alvo/8 para baixo. */
const FAIXA = { div: 8, larg: 5 };
/** Pesos do menor para o maior valor da faixa (a forma de PESOS_PADRAO). */
const FORMA = [6, 5, 3.5, 2.2, 1.4, 0.9, 0.5, 0.3];

const sem = (id) => 2048 * 31 + id * 9973;

/** Os 5 mundos, na ordem em que as novidades complicam. */
export const MUNDOS = [
  // 1: so cartas; o coringa entra no nivel 3 (64)
  {
    id: 1, inicio: [[4], [], [2], []],
    especiais: { coringa: { de: 3, p: 0.05 } },
    novidade: { tipo: 'coringa', nivel: 3 }, semente: sem(1),
  },
  // 2: a bomba (destroi o topo da coluna escolhida)
  {
    id: 2, inicio: [[8], [], [4], []],
    especiais: { coringa: { de: 1, p: 0.04 }, bomba: { de: 1, p: 0.06 } },
    novidade: { tipo: 'bomba', nivel: 1 }, semente: sem(2),
  },
  // 3: o dobro (dobra o topo e cascateia). O 2048 tem o baralho largo (6 valores).
  {
    id: 3, inicio: [[8], [], [4], []],
    especiais: { coringa: { de: 1, p: 0.04 }, bomba: { de: 1, p: 0.04 }, dobro: { de: 1, p: 0.06 } },
    niveis: { 8: { larg: 6 } },
    novidade: { tipo: 'dobro', nivel: 1 }, semente: sem(3),
  },
  // 4: a carta x4 (o topo vezes 4, sem passar do 2048, e cascateia). Ela
  // ajuda muito: o baralho e largo (6 valores), o descarte tem 2 lugares e o
  // 1024 e o 2048 tem cartas grandes (do alvo/4 para baixo, 6 e 7 valores).
  {
    id: 4, regras: { descarteMax: 2 }, inicio: [[8], [], [4], []],
    especiais: { coringa: { de: 1, p: 0.04 }, bomba: { de: 1, p: 0.04 }, dobro: { de: 1, p: 0.03 }, quadruplo: { de: 1, p: 0.05 } },
    faixa: { div: 8, larg: 6 }, niveis: { 7: { div: 4, larg: 6 }, 8: { div: 4, larg: 7 } },
    novidade: { tipo: 'quadruplo', nivel: 1 }, semente: sem(4),
  },
  // 5: tudo junto em 3 colunas. O 1024 e o 2048 tem baralho largo de cartas
  // grandes (do alvo/4 para baixo, 6 e 7 valores).
  {
    id: 5, regras: { colunas: 3 }, inicio: [[8], [4], []],
    especiais: { coringa: { de: 1, p: 0.05 }, bomba: { de: 1, p: 0.05 }, dobro: { de: 1, p: 0.05 }, quadruplo: { de: 1, p: 0.04 } },
    niveis: { 7: { div: 4, larg: 6 }, 8: { div: 4, larg: 7 } },
    novidade: { tipo: 'colunas', nivel: 1 }, semente: sem(5),
  },
];

export const TOTAL_FASES = MUNDOS.length * POR_MUNDO;

/** Pesos do baralho no nivel n do mundo. */
export function pesosDoNivel(def, n) {
  const f = { ...FAIXA, ...(def.faixa || {}), ...((def.niveis || {})[n] || {}) };
  const vs = [];
  for (let v = Math.max(4, alvoDoNivel(n) / f.div); v >= 2 && vs.length < f.larg; v /= 2) vs.unshift(v);
  const p = {};
  vs.forEach((v, i) => { p[v] = FORMA[i]; });
  return p;
}

/** Especiais que ja entraram no nivel n: { tipo: chance }. */
export function especiaisDoNivel(def, n) {
  const r = {};
  for (const [tipo, x] of Object.entries(def.especiais || {})) if (n >= x.de) r[tipo] = x.p;
  return r;
}

/** A escada do mundo: alvo, pesos e especiais de cada nivel (vai no estado da partida). */
export function escadaDoMundo(def) {
  const r = [];
  for (let n = 1; n <= POR_MUNDO; n++) r.push({ alvo: alvoDoNivel(n), pesos: pesosDoNivel(def, n), especiais: especiaisDoNivel(def, n) });
  return r;
}

/** Mesa de quem comeca (ou recomeca) o nivel n: a do mundo no nivel 1; o kit nos outros. */
export function kitDoNivel(def, n) {
  if (n <= 1) return def.inicio.map((c) => c.slice());
  const T = alvoDoNivel(n);
  const colunas = def.inicio.map(() => []);
  colunas[0] = [T / 2];
  colunas[1] = [T / 4];
  return colunas;
}

export const mundoDe = (N) => Math.floor((Math.max(1, N | 0) - 1) / POR_MUNDO) + 1;
export const posNoMundo = (N) => ((Math.max(1, N | 0) - 1) % POR_MUNDO) + 1;
export const faseGlobal = (mundo, nivel) => (mundo - 1) * POR_MUNDO + nivel;

/**
 * Definicao da partida que comeca na fase global N (mundo e nivel), com o
 * kit do nivel. `tentativa` muda a semente a cada recomeco.
 */
export function faseDe(N, tentativa = 0) {
  const id = Math.min(TOTAL_FASES, Math.max(1, N | 0));
  const def = MUNDOS[mundoDe(id) - 1];
  const nivel = posNoMundo(id);
  return {
    id, mundo: def.id, nivel, regras: def.regras || {},
    inicio: kitDoNivel(def, nivel), escada: escadaDoMundo(def),
    semente: (def.semente + nivel * 977 + (tentativa | 0) * 7919) >>> 0,
  };
}

/** As 40 fases globais (o comeco de cada nivel pelo kit). */
export const FASES = Array.from({ length: TOTAL_FASES }, (_, i) => faseDe(i + 1));

/**
 * Classico: baralho infinito e dinamico, sem metas. Fora do jogo por enquanto
 * (so o laboratorio e os testes de variante usam).
 */
export const CLASSICO = {
  id: 0, mundo: 0, modo: 'classico', semente: 20261009,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.05, bomba: 0.02, dobro: 0.02 } },
  metas: [],
};

/** Piso da curva em cada mundo: em quantas partidas (%) o casual passa o 2048 sem recomecar. */
const PISO_CURVA = [94, 92, 90, 80, 70];

/**
 * Curva de dificuldade: em quantas partidas (%) o jogador casual (bot.js,
 * PERFIL_CASUAL) passa a fase N sem recomecar o nivel. Cada mundo e uma
 * rampa: 100 no 16 (ninguem perde nos niveis curtos) descendo ate o piso do
 * mundo no 2048, mais devagar no comeco (quadratica); o piso cai de mundo a
 * mundo. O simulador aceita `FAIXA_CASUAL` pontos em volta do alvo e nenhuma
 * queda maior que `QUEDA_MAX` de um nivel para o seguinte.
 */
export function alvoCasual(N) {
  const u = (posNoMundo(N) - 1) / (POR_MUNDO - 1);
  return Math.round(100 - (100 - PISO_CURVA[mundoDe(N) - 1]) * u * u);
}
export const FAIXA_CASUAL = 8;
export const QUEDA_MAX = 12;

/** Ritmo: jogadas por nivel (mediana do casual, com os recomecos) no maximo. */
export const ritmoMax = (n) => (mundoDe(n) === 1 ? 60 : 80);
