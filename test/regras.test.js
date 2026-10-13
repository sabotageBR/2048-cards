// Regras de colocacao e cascata (estrita, permissiva, especiais, teto).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGRAS_PADRAO, normalizarRegras, podeColocar, fundeCom } from '../src/jogo/regras.js';
import { colocar, cascata, completar, graduar } from '../src/jogo/colunas.js';

const N = (v, id = v, extra = {}) => ({ id, tipo: 'normal', v, ...extra });
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
});

test('permissiva aceita maior sobre menor', () => {
  const P = normalizarRegras({ colocacao: 'permissiva' });
  assert.equal(podeColocar(P, [N(8)], N(16)).modo, 'empilha');
});

test('coringa funde com qualquer topo e vira 2 na coluna vazia', () => {
  const ev = [];
  const r = colocar([N(32)], R, 0, { id: 9, tipo: 'coringa', v: 0 }, ev);
  assert.equal(r.col[0].v, 64);
  assert.equal(r.fusao, true);
  const v = colocar([], R, 0, { id: 9, tipo: 'coringa', v: 0 }, []);
  assert.equal(v.col[0].v, 2);
  assert.equal(v.col[0].tipo, 'normal');
});

test('bomba precisa de alvo; dobro precisa de carta normal no topo', () => {
  assert.equal(podeColocar(R, [], { tipo: 'bomba' }).motivo, 'vazia');
  assert.equal(podeColocar(R, [N(8)], { tipo: 'bomba' }).modo, 'bomba');
  assert.equal(podeColocar(R, [], { tipo: 'dobro' }).motivo, 'semAlvo');
  assert.equal(podeColocar(R, [N(8)], { tipo: 'dobro' }).modo, 'dobro');
});

test('um especial por carta: coringa e dobro recusam o topo marcado; a bomba nao', () => {
  const M = N(16, 1, { esp: true });
  assert.equal(podeColocar(R, [M], { tipo: 'dobro' }).motivo, 'usada');
  assert.equal(podeColocar(R, [M], { tipo: 'quadruplo' }).motivo, 'usada');
  assert.equal(podeColocar(R, [N(16)], { tipo: 'quadruplo' }).modo, 'dobro');
  assert.equal(podeColocar(R, [], { tipo: 'quadruplo' }).motivo, 'semAlvo');
  assert.equal(podeColocar(R, [M], { tipo: 'coringa' }).motivo, 'usada');
  assert.equal(fundeCom(R, M, { tipo: 'coringa' }), false);
  const cheia = [N(512), N(256), N(128), N(64), N(32), N(16, 1, { esp: true })];
  assert.equal(podeColocar(R, cheia, { tipo: 'coringa' }).motivo, 'usada', 'o motivo e a marca, nao a pilha');
  assert.equal(podeColocar(R, [M], { tipo: 'bomba' }).modo, 'bomba');
  assert.equal(podeColocar(R, [M], N(16, 2)).modo, 'fusao', 'carta normal funde com a marcada');
  assert.equal(podeColocar(R, [], { tipo: 'coringa' }).modo, 'empilha');
});

test('a marca do especial: o coringa marca; a fusao normal e a cascata limpam', () => {
  const c = colocar([N(32)], R, 0, { id: 9, tipo: 'coringa', v: 0 }, []);
  assert.equal(c.col[0].esp, true);
  const n = colocar([N(64, 1, { esp: true })], R, 0, N(64, 2), []);
  assert.equal(n.col[0].v, 128);
  assert.equal('esp' in n.col[0], false);
  const k = colocar([N(64, 1, { esp: true }), N(32)], R, 0, { id: 9, tipo: 'coringa', v: 0 }, []);
  assert.deepEqual(k.col.map((x) => x.v), [128]);
  assert.equal('esp' in k.col[0], false, 'a cascata faz uma carta nova');
  const v = colocar([], R, 0, { id: 9, tipo: 'coringa', v: 0 }, []);
  assert.equal('esp' in v.col[0], false, 'o coringa na coluna vazia vira um 2 limpo');
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

test('2048 sai da mesa e libera a coluna; com teto 4096 fica', () => {
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

test('graduar tira da mesa so as cartas abaixo do piso', () => {
  const cols = [[N(64, 1), N(32, 2), N(4, 3), N(2, 4)], [N(8, 5)], [], [N(2, 6)]];
  const g = graduar(cols, 4);
  assert.deepEqual(g.colunas.map((c) => c.map((k) => k.v)), [[64, 32, 4], [8], [], []]);
  assert.deepEqual(g.cartas.map((k) => [k.c, k.id, k.valor]), [[0, 4, 2], [3, 6, 2]]);
  assert.equal(graduar(cols, 2).colunas, cols, 'sem carta abaixo do piso, a mesa e a mesma');
  assert.equal(cascata([N(4), N(4)], R, 0, [], 1, []).col[0].v, 8);
});
