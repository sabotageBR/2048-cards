// Missoes de sessao: 3 ativas, cumpriveis na mesma sessao, com premio em
// item na hora. Quando uma e cumprida, outra entra no lugar (semente). Puro.
//
//   { id, tipo, alvo, atual, feita, premio }
//   tipos: fusoes (n fusoes) | cascata (uma cascata de x degraus) | cartas (n cartas de valor v)
//          | montes (n montes) | combo (n fusoes seguidas) | descartes (n descartes) | pontos (n numa partida)
import { rngPasso } from './baralho.js';

const MODELOS = [
  { tipo: 'fusoes', alvos: [15, 30, 60] },
  { tipo: 'cascata', alvos: [2, 3, 4] },
  { tipo: 'cartas', v: [64, 128, 256, 512], alvos: [1, 2, 3] },
  { tipo: 'montes', alvos: [1, 2, 3] },
  { tipo: 'combo', alvos: [3, 5, 7] },
  { tipo: 'descartes', alvos: [2, 4] },
  { tipo: 'pontos', alvos: [1500, 4000, 10000] },
];
const PREMIOS = ['coringa', 'martelo', 'troca'];

function sortearMissao(rng, k, evitar) {
  for (let tent = 0; tent < 12; tent++) {
    let u;
    [u, rng] = rngPasso(rng);
    const m = MODELOS[Math.floor(u * MODELOS.length)];
    if (evitar.includes(m.tipo)) continue;
    [u, rng] = rngPasso(rng);
    const alvo = m.alvos[Math.floor(u * m.alvos.length)];
    let v = 0;
    if (m.v) { [u, rng] = rngPasso(rng); v = m.v[Math.floor(u * m.v.length)]; }
    [u, rng] = rngPasso(rng);
    return { rng, missao: { id: k, tipo: m.tipo, v, alvo, atual: 0, feita: false, premio: PREMIOS[Math.floor(u * PREMIOS.length)] } };
  }
  return { rng, missao: { id: k, tipo: 'fusoes', v: 0, alvo: 15, atual: 0, feita: false, premio: 'coringa' } };
}

/** @returns {{ missoes: any[], rng: number, prox: number }} */
export function criarMissoes(semente) {
  let rng = (semente >>> 0) || 1;
  const missoes = [];
  for (let k = 0; k < 3; k++) {
    const r = sortearMissao(rng, k + 1, missoes.map((m) => m.tipo));
    rng = r.rng;
    missoes.push(r.missao);
  }
  return { missoes, rng, prox: 4 };
}

/**
 * Avanca as missoes com os eventos de uma jogada e o estado novo.
 * Devolve { estado, concluidas } (estado novo das missoes; concluidas sao as que fecharam agora).
 */
export function progredir(estadoM, eventos, partida) {
  let mudou = false;
  const concluidas = [];
  const missoes = estadoM.missoes.map((m) => {
    if (m.feita) return m;
    let atual = m.atual;
    for (const ev of eventos) {
      if (m.tipo === 'fusoes' && ev.tipo === 'fundir') atual++;
      if (m.tipo === 'cascata' && ev.tipo === 'fundir') atual = Math.max(atual, ev.degrau);
      if (m.tipo === 'cartas' && ev.tipo === 'fundir' && ev.valor === m.v) atual++;
      if (m.tipo === 'montes' && ev.tipo === 'completar') atual++;
      if (m.tipo === 'combo' && ev.tipo === 'combo') atual = Math.max(atual, ev.n);
      if (m.tipo === 'descartes' && ev.tipo === 'descartar') atual++;
    }
    if (m.tipo === 'pontos') atual = Math.max(atual, partida.pontos);
    atual = Math.min(m.alvo, atual);
    if (atual === m.atual) return m;
    mudou = true;
    const feita = atual >= m.alvo;
    const nova = { ...m, atual, feita };
    if (feita) concluidas.push(nova);
    return nova;
  });
  return { estado: mudou ? { ...estadoM, missoes } : estadoM, concluidas };
}

/** Troca as missoes feitas por novas. */
export function renovar(estadoM) {
  if (!estadoM.missoes.some((m) => m.feita)) return estadoM;
  let rng = estadoM.rng, prox = estadoM.prox;
  const missoes = estadoM.missoes.map((m) => {
    if (!m.feita) return m;
    const r = sortearMissao(rng, prox++, estadoM.missoes.map((x) => x.tipo));
    rng = r.rng;
    return r.missao;
  });
  return { missoes, rng, prox };
}
