// Baralho: semente, piedade, faixa dinamica, especiais com espacamento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPartida, jogar } from '../src/jogo/partida.js';
import { rngPasso, valoresPermitidos, sortear, ESPACO_ESPECIAL } from '../src/jogo/baralho.js';

const fase = (extra = {}) => ({ id: 1, mundo: 1, semente: 1, baralho: { total: Infinity }, metas: [], ...extra });

test('mesma semente, mesma sequencia; sementes diferentes, sequencias diferentes', () => {
  const a = criarPartida({}, fase(), 42), b = criarPartida({}, fase(), 42), c = criarPartida({}, fase(), 43);
  const seq = (e) => { const s = []; for (let i = 0; i < 30; i++) { const r = sortear(e); e = r.estado; s.push(r.carta.v + ':' + r.carta.tipo); } return s.join(','); };
  assert.equal(seq(a), seq(b));
  assert.notEqual(seq(a), seq(c));
  assert.equal(typeof a.rng, 'number');
  const [u, a2] = rngPasso(1);
  assert.ok(u >= 0 && u < 1);
  assert.ok(Number.isInteger(a2));
});

test('faixa dinamica cresce com a mesa', () => {
  const e = criarPartida({}, fase(), 1);
  assert.deepEqual(valoresPermitidos(e), [2, 4, 8]);
  const grande = { ...e, colunas: [[{ id: 1, tipo: 'normal', v: 512, cor: 0 }], [], [], []] };
  assert.deepEqual(valoresPermitidos(grande), [2, 4, 8, 16, 32, 64]);
  const fixo = { ...e, baralho: { ...e.baralho, dinamico: false, pesos: { 2: 1, 128: 1 } } };
  assert.deepEqual(valoresPermitidos(fixo), [2, 128]);
});

test('distribuicao segue os pesos (+-20%)', () => {
  let e = criarPartida({}, fase({ baralho: { total: Infinity, dinamico: false, pesos: { 2: 3, 4: 1 } } }), 9);
  const cont = { 2: 0, 4: 0 };
  for (let i = 0; i < 4000; i++) { const r = sortear(e); e = r.estado; cont[r.carta.v]++; }
  const p = cont[2] / 4000;
  assert.ok(Math.abs(p - 0.75) < 0.05, `p(2)=${p}`);
});

test('piedade: sem jogada legal, a proxima carta cabe', () => {
  // mesa cheia de 2 no topo e fila com 64: a proxima carta tem de ser 2
  const f = fase({ regras: { colunas: 3, pilhaMax: 2 }, inicio: [[4, 2], [4, 2], [4, 2]], baralho: { total: Infinity, dinamico: false, pesos: { 2: 1, 64: 5 } } });
  let e = criarPartida({}, f, 5);
  e = { ...e, fila: [{ id: 900, tipo: 'normal', v: 64, cor: 0 }, ...e.fila.slice(1)] };
  for (let i = 0; i < 20; i++) { const r = sortear(e); e = r.estado; assert.equal(r.carta.v, 2); }
});

test('especiais respeitam o espacamento minimo', () => {
  let e = criarPartida({}, fase({ baralho: { total: Infinity, especiais: { coringa: 1 } } }), 5);
  const tipos = [];
  for (let i = 0; i < 40; i++) { const r = sortear(e); e = r.estado; tipos.push(r.carta.tipo); }
  let ultimo = -99;
  tipos.forEach((t, i) => { if (t === 'coringa') { assert.ok(i - ultimo > ESPACO_ESPECIAL, `especial em ${i} depois de ${ultimo}`); ultimo = i; } });
  assert.ok(tipos.includes('coringa'));
});

test('naipes: cartas com cor 0..3', () => {
  let e = criarPartida({ naipes: true }, fase(), 5);
  const cores = new Set();
  for (let i = 0; i < 60; i++) { const r = sortear(e); e = r.estado; cores.add(r.carta.cor); }
  assert.deepEqual([...cores].sort(), [0, 1, 2, 3]);
  const r = jogar(e, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.colunas[0].length, 1);
});
