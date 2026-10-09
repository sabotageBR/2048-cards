// Desafio diario: a mesma partida para todo mundo no mesmo dia (semente pela
// data local, que vem do main.js). Baralho finito: o jogo acaba quando as
// cartas terminam, e a pontuacao do dia e o recorde.
import { hashTexto } from '../core/rng.js';
import { CLASSICO } from './fases.js';

export const CARTAS_DO_DIA = 120;

/** @param {string} dataISO AAAA-MM-DD */
export const sementeDoDia = (dataISO) => hashTexto('2048cards:diario:' + dataISO);

export function faseDiaria(dataISO) {
  return {
    ...CLASSICO, id: 0, modo: 'diario', semente: sementeDoDia(dataISO),
    baralho: { ...CLASSICO.baralho, total: CARTAS_DO_DIA },
    metas: [{ tipo: 'sobreviver', n: CARTAS_DO_DIA }], estrelas: [0, 0, 0],
  };
}
