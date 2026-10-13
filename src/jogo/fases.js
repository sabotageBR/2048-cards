// Fases da Aventura (5 mundos x 8) e definicoes do Classico e do Diario.
// Cada fase e ajustada a mao (ver docs/curadoria.md) e validada por
// simulacao em test/fases.test.js. Uma novidade por fase.
//
//   { id, mundo, regras?, baralho: { pesos?, especiais?, total?, dinamico?, minimo? },
//     inicio?: [[fundo..topo], ...], obst?: { pedras, gelo, cadeados }, chefe?,
//     monstro?: { cada, feiticos, furia? } (ataque do monstro, ver monstro.js),
//     metas: [...ate 2], estrelas: [0, p2, p3], itens?: {...}, semente }
//
// O monstro de cada mundo ataca com o feitico do reino (lodo do Gosmo a
// partir da fase 7, pedra do Golem a partir da 10, gelo do Yeti a partir da
// 18, corrente do Espectro a partir da 28; o Dragao mistura tudo), sempre um
// obstaculo que a fase anterior ja ensinou. Os chefoes (posicao 8) ficam
// furiosos quando a vida cai ate o limiar: contagem menor e dois alvos.

export const POR_MUNDO = 8;
export const MUNDOS = 5;

/** O monstro lanca um dos feiticos (repetido pesa mais) a cada `cada` jogadas. */
const ataque = (cada, ...feiticos) => ({ cada, feiticos });
/**
 * Chefao: com a vida em `hp` fica furioso (contagem `furia`, dois alvos). O
 * limiar e por fase: nas lutas curtas (24, 32, 40) a furia vem no primeiro golpe forte.
 */
const chefao = (cada, furia, hp, ...feiticos) => ({ cada, feiticos, furia: { hp, cada: furia, alvos: 2 } });

const M1 = (id, extra) => ({ id, mundo: 1, semente: 2048 * 31 + id * 977, ...extra });

/**
 * Mundo 1: o basico, curto, com o golpe especial (cascata ate o 2048) ja na
 * fase 3 e o monstro atacando so a partir da 7. Baralho finito e pequeno.
 */
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
  // 3: cascata ate o 2048 (o golpe especial): a coluna 1 ja tem a escada, falta o 128.
  M1(3, {
    regras: { descarteMax: 2 },
    baralho: { pesos: { 4: 1, 8: 1.5, 16: 2, 32: 3, 64: 3, 128: 1 }, total: 40, dinamico: false },
    inicio: [[1024, 512, 256, 128], [64], [32], []],
    metas: [{ tipo: 'montes', n: 1 }],
    estrelas: [0, 10300, 14700],
  }),
  // 4: cascata longa: o 32 sobre o 64 pede 16, 8, 4... Meta: fazer um 128.
  M1(4, {
    baralho: { pesos: { 2: 3, 4: 3, 8: 2.5, 16: 2 }, total: 40, dinamico: false },
    inicio: [[64, 32], [], [8, 4], []],
    metas: [{ tipo: 'cartas', v: 128, n: 1 }],
    estrelas: [0, 610, 870],
  }),
  // 5: coringa (sai do baralho). Meta: cascata x3.
  M1(5, {
    baralho: { pesos: { 2: 3, 4: 3, 8: 2.5, 16: 2, 32: 1.2, 64: 0.6 }, especiais: { coringa: 0.12 }, total: 46, dinamico: false },
    inicio: [[256, 128, 64], [], [32, 16], []],
    metas: [{ tipo: 'cascata', x: 3 }],
    estrelas: [0, 1500, 2200],
  }),
  // 6: o monte sem a escada pronta (falta um 256, a coluna 2 ajuda), com coringa e duas cargas de descarte.
  M1(6, {
    regras: { descarteMax: 2 },
    baralho: { pesos: { 4: 1.5, 8: 2, 16: 2, 32: 2.2, 64: 2.2, 128: 1.6 }, especiais: { coringa: 0.16 }, total: 60, dinamico: false },
    inicio: [[1024, 512, 256], [128, 64], [32], []],
    metas: [{ tipo: 'montes', n: 1 }],
    estrelas: [0, 10700, 15300],
  }),
  // 7: o monstro ataca: a cada 6 jogadas o Gosmo cobre uma pilha com lodo (carta da metade do topo). A escada ja conhecida, do outro lado.
  M1(7, {
    monstro: ataque(6, 'lodo'), regras: { descarteMax: 2 },
    baralho: { pesos: { 4: 1, 8: 1.5, 16: 2, 32: 3, 64: 3, 128: 1 }, total: 40, dinamico: false },
    inicio: [[32], [64], [], [1024, 512, 256, 128]],
    metas: [{ tipo: 'montes', n: 1 }],
    estrelas: [0, 10400, 14800],
  }),
  // 8: chefe do mundo 1: um monte com baralho dinamico (falta um 256); o Rei Gosmo fica furioso.
  M1(8, {
    monstro: chefao(7, 4, 0.6, 'lodo'),
    baralho: { pesos: { 2: 6, 4: 5, 8: 3.5, 16: 2.2, 32: 1.4, 64: 0.9, 128: 0.5 }, especiais: { coringa: 0.1 }, total: 190, dinamico: true, minimo: 8 },
    inicio: [[1024, 512, 256], [64], [32], []],
    metas: [{ tipo: 'montes', n: 1 }],
    estrelas: [0, 10300, 14600],
    itens: { martelo: 1 },
  }),
];

const P = { 2: 4, 4: 3, 8: 2.2, 16: 1.5, 32: 1, 64: 0.6, 128: 0.35 };
const Pd = { 2: 6, 4: 5, 8: 3.5, 16: 2.2, 32: 1.4, 64: 0.9, 128: 0.5 };
const F = (id, mundo, extra) => ({ id, mundo, semente: 2048 * 31 + id * 977, ...extra });

/** Mundo 2 (espaco): pedra (asteroide) e bomba. */
FASES.push(
  // 9: a pedra. Cada fusao na coluna tira 1; quebre-a.
  F(9, 2, { monstro: ataque(5, 'lodo'), baralho: { pesos: P, total: 40, dinamico: false }, obst: { pedras: { 1: 2 } }, inicio: [[32, 16], [], [8], []],
    metas: [{ tipo: 'pedras' }], estrelas: [0, 490, 700] }),
  // 10: o Golem lanca pedras no fundo das colunas. Pedra mais dura e um 256.
  F(10, 2, { monstro: ataque(5, 'pedra', 'pedra', 'lodo'), baralho: { pesos: P, total: 56, dinamico: false }, obst: { pedras: { 3: 2 } }, inicio: [[128, 64], [32], [16, 8], []],
    metas: [{ tipo: 'cartas', v: 256, n: 1 }, { tipo: 'pedras' }], estrelas: [0, 1400, 2000] }),
  // 11: a bomba (sai do baralho) contra duas pedras duras, sem martelo.
  F(11, 2, { monstro: ataque(4, 'pedra', 'pedra', 'lodo'), baralho: { pesos: P, especiais: { bomba: 0.1 }, total: 40, dinamico: false }, obst: { pedras: { 0: 3, 3: 3 } }, inicio: [[], [64, 32], [16], []],
    metas: [{ tipo: 'pedras' }], estrelas: [0, 920, 1300] }),
  // 12: um monte com pedra na coluna alta.
  F(12, 2, { monstro: ataque(5, 'pedra', 'pedra', 'lodo'), regras: { descarteMax: 2 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 2, 128: 1.5 }, total: 76, dinamico: false }, obst: { pedras: { 0: 3 } }, inicio: [[1024, 512, 256], [128, 64], [32], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 11000, 15500] }),
  // 13: pedras em duas colunas e pontos.
  F(13, 2, { monstro: ataque(5, 'pedra', 'pedra', 'lodo'), baralho: { pesos: P, especiais: { coringa: 0.06, bomba: 0.06 }, total: 50, dinamico: false }, obst: { pedras: { 1: 3, 2: 3 } }, inicio: [[256, 128], [], [], [64, 32]],
    metas: [{ tipo: 'pontos', alvo: 2500 }, { tipo: 'pedras' }], estrelas: [0, 2300, 3300] }),
  // 14: cascata de 4 com uma pedra embaixo (a escada tem 3: falta o 64).
  F(14, 2, { monstro: ataque(4, 'pedra', 'pedra', 'lodo'), baralho: { pesos: { 2: 3, 4: 3, 8: 3, 16: 2.5, 32: 2, 64: 1.5 }, total: 40, dinamico: false }, obst: { pedras: { 2: 2 } }, inicio: [[512, 256, 128], [], [32, 16], []],
    metas: [{ tipo: 'cascata', x: 4 }], estrelas: [0, 4600, 6500] }),
  // 15: dois montes (as duas escadas esperam um 256), bomba e pedra.
  F(15, 2, { monstro: ataque(6, 'pedra', 'pedra', 'lodo'), regras: { descarteMax: 2 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { bomba: 0.08, coringa: 0.06 }, total: 80, dinamico: false }, obst: { pedras: { 3: 3 } }, inicio: [[1024, 512, 256], [1024, 512, 256], [64, 32], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 18000, 26000], itens: { coringa: 1 } }),
  // 16: chefe do mundo 2: um monte (falta um 512) com duas pedras.
  F(16, 2, { monstro: chefao(6, 3, 0.6, 'pedra', 'pedra', 'lodo'), baralho: { pesos: Pd, especiais: { bomba: 0.06, coringa: 0.06 }, total: 210, dinamico: true, minimo: 8 }, obst: { pedras: { 0: 2, 3: 2 } }, inicio: [[], [1024, 512], [128, 64], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 11500, 16500], itens: { martelo: 1 } }),
);

/** Mundo 3 (doce): gelo e dobro. */
FASES.push(
  // 17: o gelo: a carta congelada so funde depois de uma fusao na coluna.
  F(17, 3, { monstro: ataque(5, 'pedra', 'lodo'), baralho: { pesos: P, total: 44, dinamico: false }, obst: { gelo: { 0: [16] } }, inicio: [[32, 16], [], [8, 4], []],
    metas: [{ tipo: 'cartas', v: 128, n: 1 }], estrelas: [0, 740, 1100] }),
  // 18: o Yeti congela topos. Duas cartas de gelo.
  F(18, 3, { monstro: ataque(5, 'gelo', 'gelo', 'lodo'), baralho: { pesos: P, total: 38, dinamico: false }, obst: { gelo: { 1: [32], 2: [8] } }, inicio: [[128, 64], [], [], [16]],
    metas: [{ tipo: 'pontos', alvo: 1200 }], estrelas: [0, 910, 1300] }),
  // 19: o dobro (sai do baralho).
  F(19, 3, { monstro: ataque(5, 'gelo', 'gelo', 'pedra'), baralho: { pesos: P, especiais: { dobro: 0.1 }, total: 76, dinamico: false }, obst: { gelo: { 3: [32] } }, inicio: [[256, 128], [64], [16, 8], []],
    metas: [{ tipo: 'cartas', v: 512, n: 1 }], estrelas: [0, 980, 1400] }),
  // 20: um monte com gelo na coluna alta.
  F(20, 3, { monstro: ataque(8, 'gelo', 'gelo', 'lodo'), regras: { descarteMax: 2 }, baralho: { pesos: { 2: 1.5, 4: 2, 8: 2, 16: 2, 32: 2.5, 64: 3, 128: 1.5 }, especiais: { dobro: 0.06 }, total: 76, dinamico: false }, obst: { gelo: { 0: [128] } }, inicio: [[1024, 512, 256], [64, 32], [], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 13500, 19000] }),
  // 21: gelo e pedra juntos.
  F(21, 3, { monstro: ataque(5, 'gelo', 'gelo', 'pedra'), baralho: { pesos: P, especiais: { bomba: 0.05, dobro: 0.05 }, total: 60, dinamico: false }, obst: { pedras: { 3: 3 }, gelo: { 1: [64] } }, inicio: [[256, 128], [], [32, 16], []],
    metas: [{ tipo: 'pedras' }, { tipo: 'cartas', v: 256, n: 1 }], estrelas: [0, 1900, 2700] }),
  // 22: cascata de 4 com gelo no meio (a escada sobe ate 256: falta o 128).
  F(22, 3, { monstro: ataque(6, 'gelo', 'gelo', 'lodo'), baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2.5, 32: 3, 64: 1.5 }, total: 52, dinamico: false }, obst: { gelo: { 0: [64] } }, inicio: [[512, 256], [], [32, 16], []],
    metas: [{ tipo: 'cascata', x: 4 }], estrelas: [0, 4300, 6200] }),
  // 23: dois montes com dobro (as duas escadas esperam um 256).
  F(23, 3, { monstro: ataque(6, 'gelo', 'gelo', 'pedra', 'lodo'), regras: { descarteMax: 2 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { dobro: 0.08, coringa: 0.05 }, total: 120, dinamico: false }, obst: { gelo: { 2: [64] } }, inicio: [[1024, 512, 256], [1024, 512, 256], [], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 21500, 31000], itens: { troca: 1, martelo: 1 } }),
  // 24: chefe do mundo 3: 4096 (o 2048 fica na mesa; a escada espera um 256).
  F(24, 3, { monstro: chefao(9, 6, 0.9, 'gelo', 'pedra'), chefe: true, regras: { descarteMax: 2 }, baralho: { pesos: Pd, especiais: { dobro: 0.06, coringa: 0.06 }, total: 170, dinamico: true, minimo: 8 }, obst: { gelo: { 1: [128] } }, inicio: [[2048, 1024, 512, 256], [128, 64], [32], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 20500, 29000], itens: { martelo: 1 } }),
);

/** Mundo 4 (taverna): cadeado e 5 colunas. */
FASES.push(
  // 25: cinco colunas.
  F(25, 4, { monstro: ataque(4, 'gelo', 'pedra', 'lodo'), regras: { colunas: 5 }, baralho: { pesos: P, total: 44, dinamico: false }, inicio: [[128, 64], [], [32], [], [16, 8]],
    metas: [{ tipo: 'pontos', alvo: 2000 }], estrelas: [0, 1500, 2100] }),
  // 26: o cadeado: a coluna abre ao fazer um 64. Meta: um 256.
  F(26, 4, { monstro: ataque(5, 'pedra', 'lodo'), regras: { colunas: 5 }, baralho: { pesos: P, total: 50, dinamico: false }, obst: { cadeados: { 4: { tipo: 'valor', v: 64 } } }, inicio: [[64, 32], [], [16, 8], [], []],
    metas: [{ tipo: 'cartas', v: 256, n: 1 }], estrelas: [0, 1500, 2100] }),
  // 27: cadeado por fusoes e uma pedra.
  F(27, 4, { monstro: ataque(5, 'gelo', 'lodo'), regras: { colunas: 5 }, baralho: { pesos: P, especiais: { bomba: 0.05 }, total: 46, dinamico: false }, obst: { cadeados: { 0: { tipo: 'fusoes', n: 12 } }, pedras: { 4: 3 } }, inicio: [[], [128, 64], [32], [], []],
    metas: [{ tipo: 'pedras' }, { tipo: 'cartas', v: 256, n: 1 }], estrelas: [0, 1400, 2000] }),
  // 28: o Espectro tranca colunas com corrente. Um monte atras do cadeado.
  F(28, 4, { monstro: ataque(7, 'corrente', 'corrente', 'lodo'), regras: { colunas: 5, descarteMax: 2 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 2, 128: 1.5 }, total: 96, dinamico: false }, obst: { cadeados: { 0: { tipo: 'valor', v: 256 } } }, inicio: [[1024, 512, 256], [128, 64], [32], [], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 14500, 20500] }),
  // 29: gelo e cadeado.
  F(29, 4, { monstro: ataque(4, 'corrente', 'corrente', 'gelo'), regras: { colunas: 5 }, baralho: { pesos: P, especiais: { dobro: 0.05, coringa: 0.05 }, total: 44, dinamico: false }, obst: { cadeados: { 2: { tipo: 'valor', v: 128 } }, gelo: { 0: [64] } }, inicio: [[256, 128], [], [], [32, 16], []],
    metas: [{ tipo: 'pontos', alvo: 3200 }], estrelas: [0, 2500, 3600] }),
  // 30: cascata de 5.
  F(30, 4, { monstro: ataque(5, 'corrente', 'corrente', 'pedra'), regras: { colunas: 5 }, baralho: { pesos: { 2: 2, 4: 2.5, 8: 3, 16: 2.5, 32: 2.5, 64: 2 }, total: 40, dinamico: false }, inicio: [[1024, 512, 256, 128], [], [32, 16], [], [8]],
    metas: [{ tipo: 'cascata', x: 5 }], estrelas: [0, 13500, 19000] }),
  // 31: dois montes com tudo (uma escada espera um 256; a outra, um 128).
  F(31, 4, { monstro: ataque(5, 'corrente', 'corrente', 'lodo', 'gelo'), regras: { colunas: 5 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { bomba: 0.05, dobro: 0.05, coringa: 0.05 }, total: 96, dinamico: false }, obst: { pedras: { 4: 3 }, gelo: { 2: [64] }, cadeados: { 3: { tipo: 'montes', n: 1 } } }, inicio: [[1024, 512, 256], [1024, 512, 128], [], [], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 20500, 29500], itens: { coringa: 1 } }),
  // 32: chefe do mundo 4: 4096 com cinco colunas e cadeado (a escada espera um 512).
  F(32, 4, { monstro: chefao(4, 3, 0.9, 'corrente', 'corrente', 'pedra'), chefe: true, regras: { colunas: 5 }, baralho: { pesos: Pd, especiais: { coringa: 0.06, bomba: 0.04, dobro: 0.04 }, total: 180, dinamico: true, minimo: 8 }, obst: { cadeados: { 4: { tipo: 'valor', v: 512 } }, pedras: { 0: 2 } }, inicio: [[], [2048, 1024, 512], [256, 128], [64], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 16500, 23500], itens: { martelo: 1 } }),
);

/** Mundo 5 (feltro): misturas e os chefes. */
FASES.push(
  // 33: o Dragao estreia (lodo, pedra e gelo a cada 3 jogadas) contra pedras e gelo. Meta: as pedras e um 512.
  F(33, 5, { monstro: ataque(3, 'lodo', 'pedra', 'gelo'), baralho: { pesos: P, especiais: { bomba: 0.05, dobro: 0.05 }, total: 80, dinamico: false }, obst: { pedras: { 0: 3, 3: 3 }, gelo: { 1: [64], 2: [16] } }, inicio: [[], [256, 128], [32], []],
    metas: [{ tipo: 'pedras' }, { tipo: 'cartas', v: 512, n: 1 }], estrelas: [0, 3200, 4600] }),
  // 34: pilha de 7 em cinco colunas.
  F(34, 5, { monstro: ataque(5, 'lodo', 'pedra', 'gelo', 'corrente'), regras: { colunas: 5, pilhaMax: 7 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 2, 128: 1.5 }, total: 90, dinamico: false }, inicio: [[1024, 512, 256], [128, 64], [32], [16], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 12000, 17000] }),
  // 35: baralho cheio de especiais, pontos altos.
  F(35, 5, { monstro: ataque(5, 'lodo', 'pedra', 'gelo'), baralho: { pesos: P, especiais: { coringa: 0.06, bomba: 0.08, dobro: 0.06 }, total: 56, dinamico: false }, inicio: [[256, 128], [64], [32, 16], [8]],
    metas: [{ tipo: 'pontos', alvo: 4000 }], estrelas: [0, 3100, 4400] }),
  // 36: dois cadeados.
  F(36, 5, { monstro: ataque(7, 'lodo', 'gelo', 'corrente'), regras: { colunas: 5 }, baralho: { pesos: P, especiais: { coringa: 0.05 }, total: 52, dinamico: false }, obst: { cadeados: { 0: { tipo: 'valor', v: 128 }, 4: { tipo: 'fusoes', n: 14 } } }, inicio: [[], [256, 128], [64, 32], [16], []],
    metas: [{ tipo: 'cartas', v: 512, n: 1 }], estrelas: [0, 1600, 2300] }),
  // 37: cascata de 5 com pedras duras e sem coluna de apoio.
  F(37, 5, { monstro: ataque(4, 'lodo', 'pedra', 'gelo'), baralho: { pesos: { 2: 3, 4: 3, 8: 3, 16: 2.5, 32: 2, 64: 1.5 }, total: 48, dinamico: false }, obst: { pedras: { 1: 3, 3: 3 } }, inicio: [[1024, 512, 256, 128], [], [], []],
    metas: [{ tipo: 'cascata', x: 5 }, { tipo: 'pedras' }], estrelas: [0, 14000, 20000] }),
  // 38: dois montes com gelo e pedra (a segunda escada espera um 512), com duas cargas de descarte.
  F(38, 5, { monstro: ataque(7, 'lodo', 'pedra', 'gelo'), regras: { descarteMax: 2 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { dobro: 0.05, coringa: 0.05 }, total: 110, dinamico: false }, obst: { pedras: { 3: 2 }, gelo: { 1: [128] } }, inicio: [[1024, 512, 256], [1024, 512], [64, 32], []],
    metas: [{ tipo: 'montes', n: 2 }], estrelas: [0, 19500, 27500], itens: { coringa: 1 } }),
  // 39: tres montes.
  F(39, 5, { monstro: ataque(5, 'lodo', 'pedra', 'gelo', 'corrente'), regras: { colunas: 5 }, baralho: { pesos: { 2: 2, 4: 2, 8: 2, 16: 2, 32: 2, 64: 1.5, 128: 1 }, especiais: { coringa: 0.06, dobro: 0.05 }, total: 150, dinamico: false }, inicio: [[1024, 512, 256], [1024, 512], [1024, 128, 64], [32], []],
    metas: [{ tipo: 'montes', n: 3 }], estrelas: [0, 27500, 39500], itens: { coringa: 1, troca: 1 } }),
  // 40: chefe final: 4096 com pedra, gelo e cadeado (a escada espera um 512; o 256 esta na coluna 3).
  F(40, 5, { monstro: chefao(8, 4, 0.92, 'lodo', 'pedra', 'gelo', 'corrente'), chefe: true, regras: { colunas: 5 }, baralho: { pesos: Pd, especiais: { coringa: 0.06, bomba: 0.05, dobro: 0.05 }, total: 200, dinamico: true, minimo: 8 }, obst: { pedras: { 0: 2 }, gelo: { 2: [256] }, cadeados: { 4: { tipo: 'valor', v: 1024 } } }, inicio: [[], [2048, 1024, 512], [256], [128, 64], []],
    metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 16000, 22500], itens: { martelo: 1, troca: 1 } }),
);

/** Classico: baralho infinito e dinamico, sem metas, com recorde; os monstros vem em cadeia (monstro.js). */
export const CLASSICO = {
  id: 0, mundo: 0, modo: 'classico', semente: 20261009,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.05, bomba: 0.02, dobro: 0.02 } },
  monstro: { cadeia: true },
  metas: [], estrelas: [0, 0, 0],
};

/** Fases que ensinam um obstaculo ou feitico novo: a curva alivia um pouco nelas. */
const ENSINA = new Set([1, 7, 9, 10, 17, 18, 25, 28, 33]);

/**
 * Curva de dificuldade: vitorias esperadas (%) do jogador casual (bot.js,
 * PERFIL_CASUAL) na fase n. Cai de 100 a 55 ao longo das 40 fases; +5 na
 * fase que ensina, -6 no chefao. O simulador aceita `FAIXA_CASUAL` pontos em
 * volta do alvo e nenhuma queda maior que `QUEDA_MAX` de uma fase para a seguinte.
 */
export function alvoCasual(n) {
  const tendencia = 100 - 45 * (n - 1) / (FASES.length - 1);
  return Math.min(100, Math.round(tendencia + (ENSINA.has(n) ? 5 : 0) - (posNoMundo(n) === POR_MUNDO ? 6 : 0)));
}
export const FAIXA_CASUAL = 8;
export const QUEDA_MAX = 12;

export const faseDe = (n) => FASES[Math.min(FASES.length, Math.max(1, n | 0)) - 1];
export const mundoDe = (n) => Math.floor((Math.max(1, n | 0) - 1) / POR_MUNDO) + 1;
export const posNoMundo = (n) => ((Math.max(1, n | 0) - 1) % POR_MUNDO) + 1;
