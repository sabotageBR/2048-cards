// Mundos da Aventura: cada mundo e uma mesa continua de 8 niveis, a escada de
// valores 16, 32, ... 2048. O nivel sobe quando a fusao cria o valor do nivel;
// no 2048 a carta sai da mesa e o mundo termina. As novidades entram na ordem
// dos mundos (o mundo 1 tem duas, cedo: o Player Fit Test da 0.4.1 mostrou que
// 88% dos jogadores nunca chegavam ao mundo 2), validadas por simulacao em
// test/fases.test.js (ver docs/curadoria.md).
//
//   { id, regras?, inicio: [[fundo..topo], ...], fila?: [valor | especial, ...], especiais: { tipo: { de, p } },
//     novidades: [{ tipo, nivel }], faixa?: { div, larg, forma? }, niveis?: { n: { div?, larg?, forma?, descarte?, secas? } },
//     porPerfil?: { <perfil>: { niveis: { n: {...} } } }, semente }
//
// Fase global N = (mundo - 1) * 8 + nivel: o numero da telemetria e do mapa.
// Os 5 mundos curados sao as fases 1..40; depois deles vem o mundo sem fim
// (mundoDef: 6, 7, ...), que recicla os cenarios com todas as regras.
//
// Dois perfis de regra, sorteados no main.js (teste A/B da 0.6.0, depois do
// Player Fit Test da 0.5.2: a mesa justa da 0.5.0 empatou com a de hoje):
// 'hoje' e a regra da 0.5.2; 'juntar' deixa arrastar a carta do topo de uma
// coluna ate um topo igual em outra (regras.juntar). Os baralhos sao os
// mesmos: a unica diferenca e o verbo. `porPerfil` guarda um ajuste de
// niveis por perfil, se a curadoria pedir.
//
// `fila`: a abertura roteirizada do mundo (as primeiras cartas da fila, so no
// nivel 1 e na primeira tentativa). Nos mundos 2 e 3 ela traz a carta nova
// logo na segunda jogada, para a mao guiada mostrar o gesto (antes, a carta
// nova so chegava a frente no nivel 1 em 5 a 7% das partidas). Os mundos 4 e
// 5 trazem uma regra, nao uma carta, e abrem como antes.
// O baralho de cada nivel tem `larg` valores, de max(4, alvo/div) para baixo,
// com os pesos de `forma` (do menor para o maior; o padrao e a forma de
// PESOS_PADRAO): cada nivel custa mais ou menos o mesmo. Ao subir de nivel,
// as cartas abaixo do piso novo saem da mesa (graduar). Recomecar um nivel
// abre o kit: [alvo/2] [alvo/4] e as outras colunas vazias.
//
// A mesa do nivel 1 do mundo 1 e uma abertura roteirizada: com a fila que a
// semente da (2, 2, 4), o 16 sai em 3 jogadas com cascata, e cada jogada
// ensina uma regra (igual funde; menor desce sob a maior; a fusao encadeia).
// test/fases.test.js confere isso com o bot guloso, que e a mao de ajuda.

export const POR_MUNDO = 8;

/** Valor que o nivel n (1..8) pede. */
export const alvoDoNivel = (n) => 16 * 2 ** (n - 1);

/** Faixa padrao do baralho: 5 valores, do alvo/8 para baixo. */
const FAIXA = { div: 8, larg: 5 };
/** Pesos do menor para o maior valor da faixa (a forma de PESOS_PADRAO). */
const FORMA = [6, 5, 3.5, 2.2, 1.4, 0.9, 0.5, 0.3];

const sem = (id) => 2048 * 31 + id * 9973;

/** Perfis de regra do teste A/B (o main.js sorteia um por jogador; o controle primeiro). */
export const PERFIS = ['hoje', 'juntar'];

/** Os 5 mundos, na ordem em que as novidades complicam. */
export const MUNDOS = [
  // 1: a abertura roteirizada (o 16 em 3 jogadas com cascata); o coringa entra
  // no nivel 2 e a bomba no 4. Niveis curtos: cartas do alvo/4 para baixo e
  // menos 2 no baralho (o Player Fit Test da 0.4.1 perdia 30% por nivel do 128 ao 512).
  {
    id: 1, inicio: [[8, 4], [], [2], []],
    especiais: { coringa: { de: 2, p: 0.05 }, bomba: { de: 4, p: 0.06 } },
    faixa: { div: 4, larg: 5, forma: [4, 4, 3, 2, 1.2] },
    novidades: [{ tipo: 'coringa', nivel: 2 }, { tipo: 'bomba', nivel: 4 }], semente: sem(1),
  },
  // 2: o dobro (dobra o topo e cascateia). O 2048 tem o baralho largo (6 valores).
  // A entrada traz o dobro na segunda carta: no 4 sobre o 8, ele faz o 16 em cascata.
  {
    id: 2, inicio: [[8, 4], [], [2], []], fila: [2, 'dobro', 4],
    especiais: { coringa: { de: 1, p: 0.04 }, bomba: { de: 1, p: 0.04 }, dobro: { de: 1, p: 0.06 } },
    niveis: { 8: { larg: 6 } },
    novidades: [{ tipo: 'dobro', nivel: 1 }], semente: sem(2),
  },
  // 3: a carta x4 (o topo vezes 4, sem passar do 2048, e cascateia). Ela
  // ajuda muito: o baralho e largo (6 valores) e o 1024 e o 2048 tem cartas
  // grandes (do alvo/4 para baixo, 6 e 7 valores). A entrada traz o x4 na
  // segunda carta: no 2 sobre o 8, ele faz o 16 em cascata.
  {
    id: 3, inicio: [[8, 2], [], [4], []], fila: [4, 'quadruplo', 2],
    especiais: { coringa: { de: 1, p: 0.04 }, bomba: { de: 1, p: 0.04 }, dobro: { de: 1, p: 0.03 }, quadruplo: { de: 1, p: 0.05 } },
    faixa: { div: 8, larg: 6 }, niveis: { 7: { div: 4, larg: 6 }, 8: { div: 4, larg: 7 } },
    novidades: [{ tipo: 'quadruplo', nivel: 1 }], semente: sem(3),
  },
  // 4: o descarte aperta (2 lugares por nivel), com todos os especiais. O
  // baralho e largo (6 valores) e o 1024 e o 2048 tem cartas grandes.
  {
    id: 4, regras: { descarteMax: 2 }, inicio: [[8], [], [4], []],
    especiais: { coringa: { de: 1, p: 0.04 }, bomba: { de: 1, p: 0.04 }, dobro: { de: 1, p: 0.04 }, quadruplo: { de: 1, p: 0.04 } },
    faixa: { div: 8, larg: 6 }, niveis: { 7: { div: 4, larg: 6 }, 8: { div: 4, larg: 7 } },
    novidades: [{ tipo: 'descarte', nivel: 1 }], semente: sem(4),
  },
  // 5: tudo junto em 3 colunas. O 1024 e o 2048 tem baralho largo de cartas
  // grandes (do alvo/4 para baixo, 6 e 7 valores).
  {
    id: 5, regras: { colunas: 3 }, inicio: [[8], [4], []],
    especiais: { coringa: { de: 1, p: 0.05 }, bomba: { de: 1, p: 0.05 }, dobro: { de: 1, p: 0.05 }, quadruplo: { de: 1, p: 0.04 } },
    niveis: { 7: { div: 4, larg: 6 }, 8: { div: 4, larg: 7 } },
    novidades: [{ tipo: 'colunas', nivel: 1 }], semente: sem(5),
  },
];

/** Tipos de novidade que um mundo pode trazer (as cartas especiais, as 3 colunas e o descarte apertado). */
export const NOVIDADES = ['coringa', 'bomba', 'dobro', 'quadruplo', 'colunas', 'descarte'];

export const TOTAL_FASES = MUNDOS.length * POR_MUNDO;

/**
 * O mundo sem fim (6, 7, ...), depois do mundo 5: todas as cartas especiais
 * em 4 colunas, o descarte de 2 lugares e a piedade espacada ou desligada do
 * nivel 4 em diante (a mesa enche de verdade e o perigo aparece, ver main.js).
 * Recicla os cenarios (temaDe em render/temas/index.js).
 */
const SEM_FIM = {
  regras: { descarteMax: 2 }, inicio: [[8, 4], [], [2], []], fila: [2, 2, 4],
  especiais: { coringa: { de: 1, p: 0.04 }, bomba: { de: 1, p: 0.04 }, dobro: { de: 1, p: 0.04 }, quadruplo: { de: 1, p: 0.04 } },
  faixa: { div: 8, larg: 6 },
  niveis: { 4: { secas: 0 }, 5: { secas: 3 }, 6: { secas: 0 }, 7: { div: 4, larg: 6, secas: 3 }, 8: { div: 4, larg: 7, secas: 0 } },
  novidades: [],
};

/** Definicao do mundo m: um dos 5 curados ou, depois deles, o mundo sem fim. */
export function mundoDef(m) {
  const k = Math.max(1, m | 0);
  return k <= MUNDOS.length ? MUNDOS[k - 1] : { ...SEM_FIM, id: k, semente: sem(k) };
}

/** O mundo com os niveis do perfil (`porPerfil[perfil].niveis` por cima dos do mundo; hoje nenhum mundo usa). */
export function mundoDoPerfil(def, perfil) {
  const ajuste = def.porPerfil && def.porPerfil[perfil];
  if (!ajuste) return def;
  const niveis = { ...(def.niveis || {}) };
  for (const [n, x] of Object.entries(ajuste.niveis || {})) niveis[n] = { ...(niveis[n] || {}), ...x };
  return { ...def, niveis };
}

/** Pesos do baralho no nivel n do mundo. */
export function pesosDoNivel(def, n) {
  const f = { ...FAIXA, ...(def.faixa || {}), ...((def.niveis || {})[n] || {}) };
  const vs = [];
  for (let v = Math.max(4, alvoDoNivel(n) / f.div); v >= 2 && vs.length < f.larg; v /= 2) vs.unshift(v);
  const forma = f.forma || FORMA;
  const p = {};
  vs.forEach((v, i) => { p[v] = forma[Math.min(i, forma.length - 1)]; });
  return p;
}

/** Especiais que ja entraram no nivel n: { tipo: chance }. */
export function especiaisDoNivel(def, n) {
  const r = {};
  for (const [tipo, x] of Object.entries(def.especiais || {})) if (n >= x.de) r[tipo] = x.p;
  return r;
}

/**
 * A escada do mundo: alvo, pesos e especiais de cada nivel (vai no estado da
 * partida); `descarte` (lugares) e `secas` (gatilho da piedade) so quando o
 * nivel troca o padrao das regras.
 */
export function escadaDoMundo(def) {
  const r = [];
  for (let n = 1; n <= POR_MUNDO; n++) {
    const nv = (def.niveis || {})[n] || {};
    const d = { alvo: alvoDoNivel(n), pesos: pesosDoNivel(def, n), especiais: especiaisDoNivel(def, n) };
    if (nv.descarte !== undefined) d.descarte = nv.descarte;
    if (nv.secas !== undefined) d.secas = nv.secas;
    r.push(d);
  }
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
 * kit do nivel. `tentativa` muda a semente a cada recomeco; `perfil` e a
 * regra do teste A/B ('hoje' ou 'juntar': liga regras.juntar em todos os
 * mundos, inclusive o sem fim).
 */
export function faseDe(N, tentativa = 0, perfil = PERFIS[0]) {
  const id = Math.max(1, N | 0);
  const p = PERFIS.includes(perfil) ? perfil : PERFIS[0];
  const def = mundoDoPerfil(mundoDef(mundoDe(id)), p);
  const nivel = posNoMundo(id);
  const regras = p === 'juntar' ? { ...(def.regras || {}), juntar: true } : def.regras || {};
  const f = {
    id, mundo: def.id, nivel, regras, perfil: p,
    inicio: kitDoNivel(def, nivel), escada: escadaDoMundo(def),
    semente: (def.semente + nivel * 977 + (tentativa | 0) * 7919) >>> 0,
  };
  if (def.fila && nivel === 1 && !tentativa) f.fila = def.fila.slice();
  return f;
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

/**
 * Piso da curva em cada mundo: em quantas partidas (%) o casual passa o 2048
 * sem recomecar; no mundo sem fim, PISO_SEM_FIM. O mesmo nos dois perfis (o
 * baralho e o mesmo; ver curvaSoPiso).
 */
const PISO_CURVA = [94, 92, 90, 80, 70];
const PISO_SEM_FIM = 80;

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
  const m = mundoDe(N);
  const piso = m > MUNDOS.length ? PISO_SEM_FIM : PISO_CURVA[m - 1];
  return Math.round(100 - (100 - piso) * u * u);
}
export const FAIXA_CASUAL = 8;
export const QUEDA_MAX = 12;

/**
 * No perfil 'juntar' a curva vale so pelo piso: o verbo novo deixa o jogo
 * mais facil de proposito, com o mesmo baralho (o teste A/B mede o verbo, nao
 * um baralho diferente). As outras reguas (guloso, queda, ritmo) valem igual.
 */
export const curvaSoPiso = (perfil) => perfil === 'juntar';

/** Ritmo: jogadas por nivel (mediana do casual, com os recomecos) no maximo. O mundo 1 e curto de proposito (ver a nota dele). */
export const ritmoMax = (n) => (mundoDe(n) === 1 ? 40 : 80);
