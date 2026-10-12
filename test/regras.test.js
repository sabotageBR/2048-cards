// Regras de colocacao e cascata (estrita, permissiva, naipes, teto).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGRAS_PADRAO, normalizarRegras, podeColocar, fundeCom } from '../src/jogo/regras.js';
import { colocar, cascata, completar, descongelar, danificarPedra } from '../src/jogo/colunas.js';

const N = (v, id = v, extra = {}) => ({ id, tipo: 'normal', v, cor: 0, ...extra });
const R = normalizarRegras();

test('normalizarRegras limita os valores', () => {
  const r = normalizarRegras({ colunas: 9, pilhaMax: 1, teto: 3000, colocacao: 'x' });
  assert.equal(r.colunas, 5);
  assert.equal(r.pilhaMax, 3);
  assert.equal(r.teto, 2048);
  assert.equal(r.colocacao, 'estrita');
  assert.deepEqual(normalizarRegras(), { ...REGRAS_PADRAO });
});

test('estrita: igual funde, menor empilha, maior e recusada, cheia e recusada', () => {
  assert.equal(podeColocar(R, [N(8)], N(8)).modo, 'fusao');
  assert.equal(podeColocar(R, [N(8)], N(4)).modo, 'empilha');
  assert.equal(podeColocar(R, [N(8)], N(16)).motivo, 'maior');
  assert.equal(podeColocar(R, [], N(16)).modo, 'empilha');
  const cheia = [N(128), N(64), N(32), N(16), N(8), N(4)];
  assert.equal(podeColocar(R, cheia, N(2)).motivo, 'cheia');
  assert.equal(podeColocar(R, cheia, N(4)).modo, 'fusao', 'fusao nao ocupa espaco');
  assert.equal(podeColocar(R, [N(8)], N(4), { trancada: true }).motivo, 'trancada');
});

test('permissiva aceita maior sobre menor', () => {
  const P = normalizarRegras({ colocacao: 'permissiva' });
  assert.equal(podeColocar(P, [N(8)], N(16)).modo, 'empilha');
});

test('naipes: so funde com a mesma cor', () => {
  const Nn = normalizarRegras({ naipes: true });
  assert.equal(fundeCom(Nn, N(8, 1, { cor: 1 }), N(8, 2, { cor: 1 })), true);
  assert.equal(fundeCom(Nn, N(8, 1, { cor: 1 }), N(8, 2, { cor: 2 })), false);
  assert.equal(podeColocar(Nn, [N(8, 1, { cor: 1 })], N(8, 2, { cor: 2 })).modo, 'empilha');
});

test('coringa funde com qualquer topo e vira 2 na coluna vazia', () => {
  const ev = [];
  const r = colocar([N(32)], R, 0, { id: 9, tipo: 'coringa', v: 0, cor: 0 }, ev);
  assert.equal(r.col[0].v, 64);
  assert.equal(r.fusao, true);
  const v = colocar([], R, 0, { id: 9, tipo: 'coringa', v: 0, cor: 0 }, []);
  assert.equal(v.col[0].v, 2);
  assert.equal(v.col[0].tipo, 'normal');
});

test('bomba precisa de alvo; dobro precisa de carta normal no topo', () => {
  assert.equal(podeColocar(R, [], { tipo: 'bomba' }).motivo, 'vazia');
  assert.equal(podeColocar(R, [N(8)], { tipo: 'bomba' }).modo, 'bomba');
  assert.equal(podeColocar(R, [{ id: 1, tipo: 'pedra', hp: 2 }], { tipo: 'dobro' }).motivo, 'semAlvo');
  assert.equal(podeColocar(R, [N(8)], { tipo: 'dobro' }).modo, 'dobro');
});

test('cascata funde degrau a degrau e sobe o multiplicador', () => {
  const ev = [];
  const r = colocar([N(64), N(32), N(16), N(8)], R, 2, N(8, 99), ev);
  assert.deepEqual(r.col.map((k) => k.v), [128]);
  assert.equal(r.degrau, 4);
  assert.deepEqual(r.valores, [16, 32, 64, 128]);
  const fus = ev.filter((e) => e.tipo === 'fundir');
  assert.deepEqual(fus.map((e) => e.degrau), [1, 2, 3, 4]);
  assert.ok(fus.every((e) => e.c === 2));
});

test('2048 sai da mesa e libera a coluna; no chefe fica ate 4096', () => {
  const ev = [];
  const r = colocar([N(1024)], R, 0, N(1024, 5), ev);
  const c = completar(r.col, R, 0, ev);
  assert.equal(c.completou, 2048);
  assert.deepEqual(c.col, []);
  assert.ok(ev.some((e) => e.tipo === 'completar' && e.valor === 2048));
  const chefe = normalizarRegras({ teto: 4096 });
  const r2 = colocar([N(1024)], chefe, 0, N(1024, 5), []);
  assert.equal(completar(r2.col, chefe, 0, []).completou, 0);
  assert.equal(r2.col[0].v, 2048);
});

test('gelo nao funde ate uma fusao na coluna; depois cascateia', () => {
  const gelo = N(8, 1, { gelo: true });
  assert.equal(podeColocar(R, [N(16), gelo], N(8)).motivo, 'gelo', 'igual sobre gelo e recusada');
  assert.equal(podeColocar(R, [N(16), gelo], N(4)).modo, 'empilha');
  const ev = [];
  // [16, 8(gelo), 4] + 4 -> 8 funde? nao: 4+4=8, descongela o 8, 8+8=16, 16+16=32
  const r = colocar([N(16, 1), N(8, 2, { gelo: true }), N(4, 3)], R, 0, N(4, 4), ev);
  assert.deepEqual(r.col.map((k) => k.v), [32]);
  assert.ok(ev.some((e) => e.tipo === 'gelo' && e.id === 2));
  assert.equal(r.degrau, 3);
});

test('pedra perde 1 por fusao e quebra', () => {
  const pedra = { id: 1, tipo: 'pedra', v: 0, cor: 0, hp: 2 };
  const ev = [];
  const r = colocar([pedra, N(4, 2), N(2, 3)], R, 0, N(2, 4), ev);
  // 2+2=4 (dano 1), 4+4=8 (dano 2: quebra)
  assert.deepEqual(r.col.map((k) => k.v), [8]);
  assert.equal(r.pedras, 1);
  assert.ok(ev.some((e) => e.tipo === 'pedra' && e.quebrou));
  const d = danificarPedra([{ ...pedra, hp: 3 }, N(4)], 0, []);
  assert.equal(d.col[0].hp, 2);
  assert.equal(descongelar([N(2)], 0, []).length, 1);
  assert.equal(cascata([N(4), N(4)], R, 0, [], 1, []).col[0].v, 8);
});
