// Teste A/B da 0.5.0: o sorteio dos braços e a deteccao do computador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escolherVariante, ehComputador, NUCLEO, DESKTOP } from '../src/core/variante.js';

test('sorteia o que falta e cobre todos os braços', () => {
  const vistos = new Set();
  for (let i = 0; i < 6; i++) {
    const v = escolherVariante(null, { computador: true, u: [i / 6, i / 6] });
    vistos.add(v.nucleo); vistos.add(v.desktop);
  }
  for (const b of [...NUCLEO, ...DESKTOP]) assert.ok(vistos.has(b), b);
  // u no limite nao sai da lista
  assert.equal(escolherVariante(null, { computador: true, u: [0.9999, 1] }).desktop, 'desk-d');
});

test('mantem o braço salvo; valor invalido e sorteado de novo', () => {
  const salva = { nucleo: 'mesa-justa', desktop: 'desk-c' };
  assert.deepEqual(escolherVariante(salva, { computador: true, u: [0, 0] }), salva);
  const ruim = escolherVariante({ nucleo: 'mesa-x', desktop: 'desk-b' }, { computador: true, u: [0, 0] });
  assert.deepEqual(ruim, { nucleo: 'mesa-hoje', desktop: 'desk-a' });
});

test('o braço do desktop so existe no computador', () => {
  const cel = escolherVariante({ nucleo: 'mesa-hoje', desktop: 'desk-d' }, { computador: false, u: [0.7, 0.7] });
  assert.deepEqual(cel, { nucleo: 'mesa-hoje', desktop: '' });
  // o computador que antes nao tinha braço ganha um
  assert.equal(escolherVariante(cel, { computador: true, u: [0, 0.5] }).desktop, 'desk-c');
});

test('o braço forcado vence o salvo', () => {
  const v = escolherVariante({ nucleo: 'mesa-hoje', desktop: 'desk-a' }, { computador: true, forcada: ['mesa-justa', 'desk-d'], u: [0, 0] });
  assert.deepEqual(v, { nucleo: 'mesa-justa', desktop: 'desk-d' });
});

test('ehComputador pela media query, sem quebrar sem janela', () => {
  const janela = (fino) => ({ matchMedia: (q) => ({ matches: fino && q.includes('pointer: fine') }) });
  assert.equal(ehComputador(janela(true)), true);
  assert.equal(ehComputador(janela(false)), false);
  assert.equal(ehComputador({}), false);
  assert.equal(ehComputador({ matchMedia: () => { throw new Error('x'); } }), false);
});
