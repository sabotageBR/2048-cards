// Temas de mundo: o cenario, a paleta, as cartas e a mesa de cada mundo
// (Elementos, aprovados pelo usuario em 2026-10-13): 1 Floresta, 2 Oceano,
// 3 Neve, 4 Deserto, 5 Cosmos.
// Contrato de um tema:
//   { id, nome, paleta, parado(ctx, W, H, L), vivo(ctx, W, H, t, L),
//     carta(ctx, carta, r), temBrilho(carta), brilho(ctx, carta, r, t), cor(v), raio(w),
//     mesa: { tabuleiro, tapete, vazio, descarte, rotulo, rotuloContorno },
//     formas?: { nome: (ctx, p, u) => void },   // formas de particula do mundo (formas.js)
//     efeito?(e, part, esc) => boolean }        // a explosao do mundo (true = tratou)
// `paleta` pinta o painel e a tela: painelA/B (viram --roxoA/B), fundo,
// texto, acento, secundario e hud; `festa` e a lista do confete e `clarao` a
// cor da tela clara do 2048. `carta` pinta a parte parada da carta num
// retangulo centrado na origem (vai para a cache de cartas.js); `brilho` anda
// por cima a cada quadro. `cartas` e `mesa` saem de kit.js. `efeito` recebe
// e = { tipo: 'fusao'|'completar'|'graduar'|'festa', x, y, valor?, degrau?,
// cor } e o emissor de particulas (efeitos.js tem o padrao e os textos).
// O tempo entra so por `t` (s), nunca por performance.now().
import floresta from './floresta.js';
import oceano from './oceano.js';
import neve from './neve.js';
import deserto from './deserto.js';
import cosmos from './cosmos.js';

export const TEMAS = { 1: floresta, 2: oceano, 3: neve, 4: deserto, 5: cosmos };

/** Tema do mundo n: 1..5 e, no mundo sem fim (6, 7, ...), os cinco de novo, na ordem. */
export function temaDe(mundo) {
  const n = Math.max(1, mundo | 0);
  return TEMAS[((n - 1) % 5) + 1] || floresta;
}
