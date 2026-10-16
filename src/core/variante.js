// Teste A/B da 0.5.0 (depois do Player Fit Test da 0.4.4): cada jogador cai
// num braço de cada experimento, guardado no save (quem volta fica no mesmo).
//   nucleo:  'mesa-hoje' (a mesa da 0.4.4) | 'mesa-justa' (fases.js: a mesa
//            enche de verdade do nivel 4 em diante)
//   desktop: 'desk-a' (a mao de hoje) | 'desk-c' (a seta do mouse e as teclas
//            1..N junto do gesto) | 'desk-d' (as teclas sempre na mesa); so
//            existe no computador (no celular fica '')
// O main.js etiqueta cada braço com poki.measure('variante', <braço>, 'start')
// e o painel da Poki le o efeito por Funnels que comecam nessa etiqueta.
// Modulo puro: o sorteio (u) e a janela entram como parametros.

export const NUCLEO = ['mesa-hoje', 'mesa-justa'];
export const DESKTOP = ['desk-a', 'desk-c', 'desk-d'];

/** Escolhe em `lista` pelo numero u em [0, 1). */
const pegar = (lista, u) => lista[Math.min(lista.length - 1, Math.floor(Math.max(0, u) * lista.length))];

/**
 * Os braços do jogador: mantem o que esta salvo e e valido, sorteia o que
 * falta; um braço forcado (?variante= em localhost) vence o salvo.
 * @param {{ nucleo?: string, desktop?: string } | null | undefined} salva
 * @param {{ computador: boolean, forcada?: string[], u?: number[] }} op
 * @returns {{ nucleo: string, desktop: string }}
 */
export function escolherVariante(salva, op) {
  const s = salva && typeof salva === 'object' ? salva : {};
  const forcada = op.forcada || [];
  const u = op.u || [0, 0];
  const fN = forcada.find((x) => NUCLEO.includes(x));
  const fD = forcada.find((x) => DESKTOP.includes(x));
  const nucleo = fN || (NUCLEO.includes(s.nucleo) ? s.nucleo : pegar(NUCLEO, u[0]));
  let desktop = '';
  if (op.computador) desktop = fD || (DESKTOP.includes(s.desktop) ? s.desktop : pegar(DESKTOP, u[1]));
  return { nucleo, desktop };
}

/**
 * Computador: ponteiro fino que paira (mouse ou trackpad). O celular e o
 * tablet tem ponteiro grosso. A janela e injetavel (testes).
 * @param {any} [janela]
 */
export function ehComputador(janela = globalThis) {
  try {
    return !!(janela && janela.matchMedia && janela.matchMedia('(hover: hover) and (pointer: fine)').matches);
  } catch {
    return false;
  }
}
