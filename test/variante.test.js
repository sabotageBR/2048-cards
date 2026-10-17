// Teste A/B da 0.6.0: o sorteio do braço da regra.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escolherVariante, REGRA } from '../src/core/variante.js';

test('sorteia o que falta e cobre os dois braços, com o controle primeiro', () => {
  assert.deepEqual(REGRA, ['hoje', 'juntar']);
  assert.equal(escolherVariante(null, { u: 0 }).regra, 'hoje');
  assert.equal(escolherVariante(null, { u: 0.5 }).regra, 'juntar');
  // u no limite nao sai da lista
  assert.equal(escolherVariante(null, { u: 1 }).regra, 'juntar');
  assert.equal(escolherVariante(undefined, {}).regra, 'hoje');
});

test('mantem o braço salvo; o save da 0.5.x e valor invalido sao sorteados de novo', () => {
  assert.deepEqual(escolherVariante({ regra: 'juntar' }, { u: 0 }), { regra: 'juntar' });
  assert.deepEqual(escolherVariante({ nucleo: 'mesa-justa', desktop: 'desk-c' }, { u: 0.7 }), { regra: 'juntar' });
  assert.deepEqual(escolherVariante({ regra: 'livre' }, { u: 0 }), { regra: 'hoje' });
});

test('o braço forcado vence o salvo; os nomes antigos sao ignorados', () => {
  assert.deepEqual(escolherVariante({ regra: 'hoje' }, { forcada: ['juntar'], u: 0 }), { regra: 'juntar' });
  assert.deepEqual(escolherVariante({ regra: 'juntar' }, { forcada: ['mesa-justa', 'desk-d'], u: 0 }), { regra: 'juntar' });
});
