import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarMissoes, progredir, renovar, missaoDaVez } from '../src/jogo/missoes.js';

test('tres missoes de tipos diferentes, deterministicas pela semente', () => {
  const a = criarMissoes(5), b = criarMissoes(5);
  assert.equal(a.missoes.length, 3);
  assert.deepEqual(a, b);
  assert.equal(new Set(a.missoes.map((m) => m.tipo)).size, 3);
});

test('progredir conta eventos e renovar troca as feitas', () => {
  let em = { missoes: [{ id: 1, tipo: 'fusoes', v: 0, alvo: 2, atual: 0, feita: false, premio: 'coringa' }, { id: 2, tipo: 'cascata', v: 0, alvo: 3, atual: 0, feita: false, premio: 'troca' }], rng: 9, prox: 3 };
  const evs = [{ tipo: 'fundir', degrau: 1, valor: 4 }, { tipo: 'fundir', degrau: 2, valor: 8 }];
  const r = progredir(em, evs, { pontos: 0 });
  assert.equal(r.concluidas.length, 1);
  assert.equal(r.estado.missoes[0].feita, true);
  assert.equal(r.estado.missoes[1].atual, 2);
  const n = renovar(r.estado);
  assert.equal(n.missoes[0].feita, false);
  assert.equal(n.missoes[0].id, 3);
  assert.equal(n.missoes[1].id, 2);
});

test('missaoDaVez: a mostrada fica ate ser feita; depois, a mais perto de cumprir', () => {
  const m = (id, atual, alvo, feita = false) => ({ id, tipo: 'fusoes', v: 0, alvo, atual, feita, premio: 'coringa' });
  const e = { missoes: [m(1, 1, 10), m(2, 3, 4), m(3, 2, 4)], rng: 1, prox: 4 };
  assert.equal(missaoDaVez(e).id, 2);
  assert.equal(missaoDaVez(e, 1).id, 1, 'a mostrada nao troca no meio');
  assert.equal(missaoDaVez({ ...e, missoes: [m(1, 1, 10), m(2, 4, 4, true), m(3, 2, 4)] }, 2).id, 3);
  // empate: a de menor id
  assert.equal(missaoDaVez({ ...e, missoes: [m(5, 1, 2), m(4, 2, 4)] }).id, 4);
  assert.equal(missaoDaVez({ ...e, missoes: [m(1, 2, 2, true)] }), null);
});
