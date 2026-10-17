// Teste A/B da 0.6.0 (depois do Player Fit Test da 0.5.2, em que a mesa justa
// e os braços de desktop da 0.5.0 empataram): cada jogador cai num braço,
// guardado no save (quem volta fica no mesmo).
//   regra: 'hoje' (a regra da 0.5.2) | 'juntar' (a carta do topo de uma
//          coluna vai ate um topo igual em outra; regras.juntar)
// O main.js etiqueta o braço com poki.measure('variante', <braço>, 'start')
// e manda o tempo de jogo por braço (<braço>/N/min), lido em Other Events.
// Modulo puro: o sorteio (u) entra como parametro.

export const REGRA = ['hoje', 'juntar'];

/** Escolhe em `lista` pelo numero u em [0, 1). */
const pegar = (lista, u) => lista[Math.min(lista.length - 1, Math.floor(Math.max(0, u) * lista.length))];

/**
 * O braço do jogador: mantem o que esta salvo e e valido, sorteia se falta
 * (o save da 0.5.x, com `nucleo` e `desktop`, e sorteado de novo); um braço
 * forcado (?variante= em localhost) vence o salvo.
 * @param {{ regra?: string } | null | undefined} salva
 * @param {{ forcada?: string[], u?: number }} op
 * @returns {{ regra: string }}
 */
export function escolherVariante(salva, op) {
  const s = salva && typeof salva === 'object' ? salva : {};
  const forcada = (op.forcada || []).find((x) => REGRA.includes(x));
  const regra = forcada || (REGRA.includes(s.regra) ? s.regra : pegar(REGRA, op.u || 0));
  return { regra };
}
