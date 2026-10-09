// Fases da Aventura (5 mundos x 8) e definicoes do Classico e do Diario.
// Cada fase e ajustada a mao (ver docs/curadoria.md) e validada por
// simulacao em test/fases.test.js. Uma novidade por fase.
//
//   { id, mundo, regras?, baralho: { pesos?, especiais?, total?, dinamico?, minimo? },
//     inicio?: [[fundo..topo], ...], obst?: { pedras, gelo, cadeados }, chefe?,
//     metas: [...ate 2], estrelas: [0, p2, p3], itens?: {...}, semente }

export const POR_MUNDO = 8;
export const MUNDOS = 5;

const M1 = (id, extra) => ({ id, mundo: 1, semente: 2048 * 31 + id * 977, ...extra });

/** Mundo 1: o basico. Baralho finito e pequeno, sem derrota. */
export const FASES = [
  // 1: colocar e fundir (2 + 2). Meta: fazer um 16.
  M1(1, {
    baralho: { pesos: { 2: 4, 4: 2 }, total: 24, dinamico: false },
    inicio: [[4], [], [2], []],
    metas: [{ tipo: 'cartas', v: 16, n: 1 }],
    estrelas: [0, 50, 80],
  }),
  // 2: menor sob maior. Meta: fazer um 32.
  M1(2, {
    baralho: { pesos: { 2: 4, 4: 3, 8: 1.5 }, total: 30, dinamico: false },
    inicio: [[16], [], [8], []],
    metas: [{ tipo: 'cartas', v: 32, n: 1 }],
    estrelas: [0, 110, 160],
  }),
  // 3: cascata. Meta: fazer um 64 e 400 pontos.
  M1(3, {
    baralho: { pesos: { 2: 4, 4: 3, 8: 2, 16: 1 }, total: 34, dinamico: false },
    inicio: [[32, 16], [], [8, 4], []],
    metas: [{ tipo: 'cartas', v: 64, n: 1 }, { tipo: 'pontos', alvo: 400 }],
    estrelas: [0, 320, 460],
  }),
  // 4: coringa. Meta: fazer um 128.
  M1(4, {
    baralho: { pesos: { 2: 4, 4: 3, 8: 2, 16: 1.2 }, especiais: { coringa: 0.12 }, total: 40, dinamico: false },
    inicio: [[64], [32, 16], [8], []],
    metas: [{ tipo: 'cartas', v: 128, n: 1 }],
    estrelas: [0, 570, 810],
  }),
  // 5: o monte completo. A coluna 1 esta pronta para uma cascata ate 2048.
  M1(5, {
    baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 2, 128: 2 }, total: 44, dinamico: false },
    inicio: [[1024, 512, 256, 128], [64], [32], []],
    metas: [{ tipo: 'montes', n: 1 }],
    estrelas: [0, 10500, 14500],
  }),
  // 6: cascata de 3. Meta: cascata x3 e 1500 pontos.
  M1(6, {
    baralho: { pesos: { 2: 3, 4: 3, 8: 2.5, 16: 2, 32: 1.2, 64: 0.6 }, total: 46, dinamico: false },
    inicio: [[256, 128, 64], [], [32, 16], []],
    metas: [{ tipo: 'cascata', x: 3 }, { tipo: 'pontos', alvo: 1500 }],
    estrelas: [0, 2200, 3100],
  }),
  // 7: dois montes, com coringa. Meta: 2 montes.
  M1(7, {
    baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { coringa: 0.1 }, total: 72, dinamico: false },
    inicio: [[1024, 512, 256], [1024, 256], [128, 64], []],
    metas: [{ tipo: 'montes', n: 2 }],
    estrelas: [0, 21000, 30000],
    itens: { coringa: 1 },
  }),
  // 8: chefe do mundo 1: um monte do zero com baralho dinamico.
  M1(8, {
    baralho: { pesos: { 2: 6, 4: 5, 8: 3.5, 16: 2.2, 32: 1.4, 64: 0.9, 128: 0.5 }, especiais: { coringa: 0.08 }, total: 190, dinamico: true, minimo: 8 },
    inicio: [[1024, 256], [128, 64], [], []],
    metas: [{ tipo: 'montes', n: 1 }],
    estrelas: [0, 11500, 16000],
    itens: { martelo: 1 },
  }),
];

const P = { 2: 4, 4: 3, 8: 2.2, 16: 1.5, 32: 1, 64: 0.6, 128: 0.35 };
const Pd = { 2: 6, 4: 5, 8: 3.5, 16: 2.2, 32: 1.4, 64: 0.9, 128: 0.5 };
const F = (id, mundo, extra) => ({ id, mundo, semente: 2048 * 31 + id * 977, ...extra });

/** Mundo 2 (espaco): pedra (asteroide) e bomba. */
FASES.push(
  // 9: a pedra. Cada fusao na coluna tira 1; quebre-a.
  F(9, 2, { baralho: { pesos: P, total: 40, dinamico: false }, obst: { pedras: { 1: 2 } }, inicio: [[32, 16], [], [8], []],
    metas: [{ tipo: 'pedras' }], estrelas: [0, 490, 700] }),
  // 10: pedra mais dura e um 256.
  F(10, 2, { baralho: { pesos: P, total: 48, dinamico: false }, obst: { pedras: { 3: 2 } }, inicio: [[128, 64], [32], [16, 8], []],
    metas: [{ tipo: 'cartas', v: 256, n: 1 }, { tipo: 'pedras' }], estrelas: [0, 1500, 2200] }),
  // 11: a bomba (sai do baralho) contra duas pedras.
  F(11, 2, { baralho: { pesos: P, especiais: { bomba: 0.1 }, total: 50, dinamico: false }, obst: { pedras: { 0: 2, 3: 2 } }, inicio: [[], [64, 32], [16], []],
    metas: [{ tipo: 'pedras' }], estrelas: [0, 600, 860], itens: { martelo: 1 } }),
  // 12: um monte com pedra na coluna alta.
  F(12, 2, { baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 2, 128: 1.5 }, total: 56, dinamico: false }, obst: { pedras: { 0: 3 } }, inicio: [[1024, 512, 256], [128, 64], [32], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 11000, 15500] }),
  // 13: pedras em duas colunas e pontos.
  F(13, 2, { baralho: { pesos: P, especiais: { coringa: 0.06, bomba: 0.06 }, total: 60, dinamico: false }, obst: { pedras: { 1: 3, 2: 3 } }, inicio: [[256, 128], [], [], [64, 32]],
    metas: [{ tipo: 'pontos', alvo: 2500 }, { tipo: 'pedras' }], estrelas: [0, 2000, 2800] }),
  // 14: cascata de 4 com uma pedra embaixo.
  F(14, 2, { baralho: { pesos: { 2: 3, 4: 3, 8: 3, 16: 2.5, 32: 2, 64: 1.5 }, total: 50, dinamico: false }, obst: { pedras: { 2: 2 } }, inicio: [[512, 256, 128, 64], [], [32, 16], []],
    metas: [{ tipo: 'cascata', x: 4 }], estrelas: [0, 4600, 6600] }),
  // 15: dois montes, bomba e pedra.
  F(15, 2, { baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { bomba: 0.08, coringa: 0.06 }, total: 80, dinamico: false }, obst: { pedras: { 3: 3 } }, inicio: [[1024, 512, 256], [1024, 256, 128], [64, 32], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 19500, 27500], itens: { coringa: 1 } }),
  // 16: chefe do mundo 2: um monte do zero com duas pedras.
  F(16, 2, { baralho: { pesos: Pd, especiais: { bomba: 0.06, coringa: 0.06 }, total: 210, dinamico: true, minimo: 8 }, obst: { pedras: { 0: 2, 3: 2 } }, inicio: [[], [1024, 256], [128, 64], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 10500, 15500], itens: { martelo: 1 } }),
);

/** Mundo 3 (doce): gelo e dobro. */
FASES.push(
  // 17: o gelo: a carta congelada so funde depois de uma fusao na coluna.
  F(17, 3, { baralho: { pesos: P, total: 44, dinamico: false }, obst: { gelo: { 0: [16] } }, inicio: [[64, 32], [], [8, 4], []],
    metas: [{ tipo: 'cartas', v: 128, n: 1 }], estrelas: [0, 630, 900] }),
  // 18: duas cartas de gelo.
  F(18, 3, { baralho: { pesos: P, total: 50, dinamico: false }, obst: { gelo: { 1: [32], 2: [8] } }, inicio: [[128, 64], [], [], [16]],
    metas: [{ tipo: 'pontos', alvo: 1200 }], estrelas: [0, 940, 1300] }),
  // 19: o dobro (sai do baralho).
  F(19, 3, { baralho: { pesos: P, especiais: { dobro: 0.1 }, total: 50, dinamico: false }, obst: { gelo: { 3: [32] } }, inicio: [[256, 128], [64], [16, 8], []],
    metas: [{ tipo: 'cartas', v: 512, n: 1 }], estrelas: [0, 1000, 1400] }),
  // 20: um monte com gelo na coluna alta.
  F(20, 3, { regras: { descarteMax: 2 }, baralho: { pesos: { 2: 1.5, 4: 2, 8: 2, 16: 2, 32: 2.5, 64: 3, 128: 1.5 }, especiais: { dobro: 0.06 }, total: 76, dinamico: false }, obst: { gelo: { 0: [128] } }, inicio: [[1024, 512, 256], [64, 32], [], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 13000, 18500] }),
  // 21: gelo e pedra juntos.
  F(21, 3, { baralho: { pesos: P, especiais: { bomba: 0.05, dobro: 0.05 }, total: 60, dinamico: false }, obst: { pedras: { 3: 3 }, gelo: { 1: [64] } }, inicio: [[256, 128], [], [32, 16], []],
    metas: [{ tipo: 'pedras' }, { tipo: 'cartas', v: 256, n: 1 }], estrelas: [0, 1800, 2600] }),
  // 22: cascata de 4 com gelo no meio.
  F(22, 3, { baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2.5, 32: 3, 64: 1.5 }, total: 66, dinamico: false }, obst: { gelo: { 0: [64] } }, inicio: [[512, 256, 128], [], [32, 16], []],
    metas: [{ tipo: 'cascata', x: 4 }], estrelas: [0, 5900, 8500] }),
  // 23: dois montes com dobro.
  F(23, 3, { regras: { descarteMax: 2 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { dobro: 0.08, coringa: 0.05 }, total: 120, dinamico: false }, obst: { gelo: { 2: [64] } }, inicio: [[1024, 512, 256], [1024, 512, 128], [], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 19000, 27000], itens: { troca: 1, martelo: 1 } }),
  // 24: chefe do mundo 3: 4096 (o 2048 fica na mesa).
  F(24, 3, { chefe: true, baralho: { pesos: Pd, especiais: { dobro: 0.06, coringa: 0.06 }, total: 170, dinamico: true, minimo: 8 }, obst: { gelo: { 1: [128] } }, inicio: [[2048, 1024], [256, 128], [64, 32], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 10500, 14500], itens: { martelo: 1 } }),
);

/** Mundo 4 (taverna): cadeado e 5 colunas. */
FASES.push(
  // 25: cinco colunas.
  F(25, 4, { regras: { colunas: 5 }, baralho: { pesos: P, total: 48, dinamico: false }, inicio: [[128, 64], [], [32], [], [16, 8]],
    metas: [{ tipo: 'pontos', alvo: 1200 }], estrelas: [0, 950, 1400] }),
  // 26: o cadeado: a coluna abre ao fazer um 64.
  F(26, 4, { regras: { colunas: 5 }, baralho: { pesos: P, total: 50, dinamico: false }, obst: { cadeados: { 4: { tipo: 'valor', v: 64 } } }, inicio: [[64, 32], [], [16, 8], [], []],
    metas: [{ tipo: 'cartas', v: 128, n: 1 }], estrelas: [0, 520, 740] }),
  // 27: cadeado por fusoes e uma pedra.
  F(27, 4, { regras: { colunas: 5 }, baralho: { pesos: P, especiais: { bomba: 0.05 }, total: 56, dinamico: false }, obst: { cadeados: { 0: { tipo: 'fusoes', n: 10 } }, pedras: { 4: 3 } }, inicio: [[], [128, 64], [32], [], []],
    metas: [{ tipo: 'pedras' }, { tipo: 'cartas', v: 256, n: 1 }], estrelas: [0, 1300, 1900] }),
  // 28: um monte atras do cadeado.
  F(28, 4, { regras: { colunas: 5 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 2, 128: 1.5 }, total: 96, dinamico: false }, obst: { cadeados: { 0: { tipo: 'valor', v: 256 } } }, inicio: [[1024, 512, 256], [128, 64], [32], [], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 13500, 19500] }),
  // 29: gelo e cadeado.
  F(29, 4, { regras: { colunas: 5 }, baralho: { pesos: P, especiais: { dobro: 0.05, coringa: 0.05 }, total: 60, dinamico: false }, obst: { cadeados: { 2: { tipo: 'valor', v: 128 } }, gelo: { 0: [64] } }, inicio: [[256, 128], [], [], [32, 16], []],
    metas: [{ tipo: 'pontos', alvo: 2800 }], estrelas: [0, 2700, 3800] }),
  // 30: cascata de 5.
  F(30, 4, { regras: { colunas: 5 }, baralho: { pesos: { 2: 2, 4: 2.5, 8: 3, 16: 2.5, 32: 2.5, 64: 2 }, total: 84, dinamico: false }, inicio: [[1024, 512, 256, 128], [], [32, 16], [], [8]],
    metas: [{ tipo: 'cascata', x: 5 }], estrelas: [0, 13000, 19000] }),
  // 31: dois montes com tudo.
  F(31, 4, { regras: { colunas: 5 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { bomba: 0.05, dobro: 0.05, coringa: 0.05 }, total: 90, dinamico: false }, obst: { pedras: { 4: 3 }, gelo: { 2: [64] }, cadeados: { 3: { tipo: 'montes', n: 1 } } }, inicio: [[1024, 512, 256], [1024, 256, 128], [], [], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 17000, 24500], itens: { coringa: 1 } }),
  // 32: chefe do mundo 4: 4096 com cinco colunas e cadeado.
  F(32, 4, { chefe: true, regras: { colunas: 5 }, baralho: { pesos: Pd, especiais: { coringa: 0.06, bomba: 0.04, dobro: 0.04 }, total: 180, dinamico: true, minimo: 8 }, obst: { cadeados: { 4: { tipo: 'valor', v: 512 } }, pedras: { 0: 2 } }, inicio: [[], [2048, 1024], [256, 128], [64], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 10500, 15000], itens: { martelo: 1 } }),
);

/** Mundo 5 (feltro): misturas e os chefes. */
FASES.push(
  // 33: pedras e gelo.
  F(33, 5, { baralho: { pesos: P, especiais: { bomba: 0.05, dobro: 0.05 }, total: 64, dinamico: false }, obst: { pedras: { 0: 3, 3: 3 }, gelo: { 1: [64], 2: [16] } }, inicio: [[], [128], [32], []],
    metas: [{ tipo: 'pedras' }, { tipo: 'cartas', v: 256, n: 1 }], estrelas: [0, 1400, 1900], itens: { martelo: 1 } }),
  // 34: pilha de 6 em cinco colunas.
  F(34, 5, { regras: { colunas: 5, pilhaMax: 6 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 2, 128: 1.5 }, total: 110, dinamico: false }, inicio: [[1024, 512, 256], [128, 64], [32], [16], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 11500, 16500] }),
  // 35: baralho cheio de especiais, pontos altos.
  F(35, 5, { baralho: { pesos: P, especiais: { coringa: 0.1, bomba: 0.08, dobro: 0.08 }, total: 70, dinamico: false }, inicio: [[256, 128], [64], [32, 16], [8]],
    metas: [{ tipo: 'pontos', alvo: 4000 }], estrelas: [0, 3000, 4300] }),
  // 36: dois cadeados.
  F(36, 5, { regras: { colunas: 5 }, baralho: { pesos: P, especiais: { coringa: 0.05 }, total: 64, dinamico: false }, obst: { cadeados: { 0: { tipo: 'valor', v: 128 }, 4: { tipo: 'fusoes', n: 14 } } }, inicio: [[], [256, 128], [64, 32], [16], []],
    metas: [{ tipo: 'cartas', v: 512, n: 1 }], estrelas: [0, 1500, 2200] }),
  // 37: cascata de 5 com pedras.
  F(37, 5, { baralho: { pesos: { 2: 3, 4: 3, 8: 3, 16: 2.5, 32: 2, 64: 1.5 }, total: 64, dinamico: false }, obst: { pedras: { 1: 2, 3: 2 } }, inicio: [[1024, 512, 256, 128], [], [64, 32], []],
    metas: [{ tipo: 'cascata', x: 5 }, { tipo: 'pedras' }], estrelas: [0, 14500, 21000] }),
  // 38: dois montes com gelo e pedra.
  F(38, 5, { baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { dobro: 0.05, coringa: 0.05 }, total: 110, dinamico: false }, obst: { pedras: { 3: 2 }, gelo: { 1: [128] } }, inicio: [[1024, 512, 256], [1024, 512], [64, 32], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 19000, 27000], itens: { coringa: 1 } }),
  // 39: tres montes.
  F(39, 5, { regras: { colunas: 5 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { coringa: 0.06, dobro: 0.05 }, total: 130, dinamico: false }, inicio: [[1024, 512, 256], [1024, 512], [1024, 128, 64], [32], []],
    metas: [{ tipo: 'montes', n: 3 }], estrelas: [0, 25000, 35500], itens: { coringa: 1, troca: 1 } }),
  // 40: chefe final: 4096 com pedra, gelo e cadeado.
  F(40, 5, { chefe: true, regras: { colunas: 5 }, baralho: { pesos: Pd, especiais: { coringa: 0.06, bomba: 0.05, dobro: 0.05 }, total: 200, dinamico: true, minimo: 8 }, obst: { pedras: { 0: 2 }, gelo: { 2: [256] }, cadeados: { 4: { tipo: 'valor', v: 1024 } } }, inicio: [[], [2048, 1024], [], [128, 64], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 11000, 15500], itens: { martelo: 1, troca: 1 } }),
);

/** Classico: baralho infinito e dinamico, sem metas, com recorde. */
export const CLASSICO = {
  id: 0, mundo: 0, modo: 'classico', semente: 20261009,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.05, bomba: 0.02, dobro: 0.02 } },
  metas: [], estrelas: [0, 0, 0],
};

export const faseDe = (n) => FASES[Math.min(FASES.length, Math.max(1, n | 0)) - 1];
export const mundoDe = (n) => Math.floor((Math.max(1, n | 0) - 1) / POR_MUNDO) + 1;
export const posNoMundo = (n) => ((Math.max(1, n | 0) - 1) % POR_MUNDO) + 1;
