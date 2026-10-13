// Temas de mundo: o cenario, a paleta, as cartas e a mesa de cada mundo
// (Elementos, aprovados pelo usuario em 2026-10-13): 1 Floresta, 2 Oceano,
// 3 Neve, 4 Deserto, 5 Cosmos.
// Contrato de um tema:
//   { id, nome, paleta, parado(ctx, W, H, L), vivo(ctx, W, H, t, L),
//     carta(ctx, carta, r), temBrilho(carta), brilho(ctx, carta, r, t), cor(v), raio(w),
//     mesa: { tabuleiro, tapete, vazio, descarte, rotulo, rotuloContorno } }
// `paleta` pinta o painel e a tela: painelA/B (viram --roxoA/B), fundo,
// texto, acento, secundario e hud. `carta` pinta a parte parada da carta num
// retangulo centrado na origem (vai para a cache de cartas.js); `brilho` anda
// por cima a cada quadro. `cartas` e `mesa` saem de kit.js. O tempo entra so
// por `t` (s), nunca por performance.now().
import floresta from './floresta.js';
import oceano from './oceano.js';
import neve from './neve.js';
import deserto from './deserto.js';
import cosmos from './cosmos.js';

export const TEMAS = { 1: floresta, 2: oceano, 3: neve, 4: deserto, 5: cosmos };

/** Tema do mundo n (1..5); fora disso, o do mundo 1. */
export function temaDe(mundo) {
  return TEMAS[mundo] || floresta;
}
