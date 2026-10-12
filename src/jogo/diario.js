// Desafio diario: a mesma partida para todo mundo no mesmo dia (semente pela
// data local, que vem do main.js). Baralho finito: o jogo acaba quando as
// cartas terminam, e a pontuacao do dia e o recorde. O "monstro do dia": a
// cadeia comeca pelo reino que a data sorteia (ordem dos reinos embaralhada).
import { hashTexto } from '../core/rng.js';
import { CLASSICO } from './fases.js';
import { rngPasso } from './baralho.js';

export const CARTAS_DO_DIA = 120;

/** @param {string} dataISO AAAA-MM-DD */
export const sementeDoDia = (dataISO) => hashTexto('2048cards:diario:' + dataISO);

/** Ordem dos reinos do dia (embaralhada pela semente). */
export function ordemDoDia(semente) {
  const ordem = [1, 2, 3, 4, 5];
  let rng = (semente ^ 0x5bd1e995) >>> 0 || 1;
  for (let i = ordem.length - 1; i > 0; i--) {
    let u;
    [u, rng] = rngPasso(rng);
    const j = Math.floor(u * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return ordem;
}

export function faseDiaria(dataISO) {
  const semente = sementeDoDia(dataISO);
  return {
    ...CLASSICO, id: 0, modo: 'diario', semente,
    monstro: { cadeia: true, ordem: ordemDoDia(semente) },
    baralho: { ...CLASSICO.baralho, total: CARTAS_DO_DIA },
    metas: [{ tipo: 'sobreviver', n: CARTAS_DO_DIA }], estrelas: [0, 0, 0],
  };
}
