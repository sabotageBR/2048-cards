// Reducer da partida: imutabilidade, eventos, descarte, itens, febre, fim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPartida, jogar, acoesLegais, temJogada, desfazerPara } from '../src/jogo/partida.js';
import { progresso, progressoDoNivel } from '../src/jogo/metas.js';
import { faseDe, faseGlobal, alvoDoNivel, MUNDOS, kitDoNivel } from '../src/jogo/fases.js';

const fase = (extra = {}) => ({
  id: 99, mundo: 1, semente: 1,
  baralho: { pesos: { 2: 1 }, total: 50, dinamico: false },
  inicio: [[], [], [], []], metas: [], ...extra,
});

function congelar(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) congelar(o[k]); }
  return o;
}

test('criarPartida enche a fila e e serializavel', () => {
  const e = criarPartida({}, fase(), 7);
  assert.equal(e.fila.length, 3);
  assert.equal(e.colunas.length, 4);
  assert.equal(e.restantes, 47);
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e);
});

test('jogar nao muta a entrada e devolve eventos em ordem', () => {
  const e0 = congelar(criarPartida({}, fase({ inicio: [[2], [], [], []] }), 7));
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.notEqual(r.estado, e0);
  assert.equal(r.estado.colunas[0][0].v, 4);
  assert.equal(r.eventos[0].tipo, 'fundir');
  assert.ok(r.eventos.some((ev) => ev.tipo === 'fila'));
  assert.equal(r.estado.n, 1);
  assert.equal(r.estado.pontos, 4);
});

test('recusa nao aplica a jogada', () => {
  const e0 = criarPartida({}, fase({ inicio: [[2], [], [], []], baralho: { pesos: { 8: 1 }, total: 20, dinamico: false } }), 3);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.eventos[0].tipo, 'recusar');
  assert.equal(r.eventos[0].motivo, 'maior');
  assert.deepEqual(r.estado.colunas, e0.colunas);
  assert.equal(r.estado.recusas, 1);
});

test('descarte: pilha com lugares por nivel, sem recarga', () => {
  const e0 = criarPartida({ descarteMax: 2 }, fase({ inicio: [[1024], [], [], []], baralho: { pesos: { 1024: 1 }, total: 40, dinamico: false } }), 3);
  assert.equal(e0.descarteCarga, 2);
  let e = e0;
  for (let k = 0; k < 2; k++) e = jogar(e, { tipo: 'descartar', t: 0 }).estado;
  assert.equal(e.descarteCarga, 0);
  assert.equal(e.descarte.v, 1024);
  const cheio = jogar(e, { tipo: 'descartar', t: 0 });
  assert.equal(cheio.eventos[0].motivo, 'semDescarte');
  assert.equal(cheio.estado, e, 'recusa devolve o mesmo estado');
  // completar um monte nem jogar muitas cartas devolve lugar
  const m = jogar(e, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(m.estado.montes, 1);
  assert.equal(m.estado.descarteCarga, 0);
  let x = { ...e0, fila: e0.fila.map((k, i) => ({ ...k, v: 2, id: 600 + i })), baralho: { ...e0.baralho, pesos: { 2: 1 } } };
  x = jogar(x, { tipo: 'descartar', t: 0 }).estado;
  for (let k = 0; k < 20; k++) x = jogar(x, { tipo: 'colocar', c: 1 + (k % 3), t: 0 }).estado;
  assert.equal(x.descarteCarga, 1, 'jogar cartas nao recarrega');
});

test('descarte: a subida de nivel esvazia a pilha; retomar libera um lugar', () => {
  const e0 = naEscada(1, 1, [[8], [], [4], []], [2, 8, 2]);
  const max = e0.regras.descarteMax;
  const d = jogar(e0, { tipo: 'descartar', t: 0 }).estado;
  assert.equal(d.descarteCarga, max - 1);
  const r = jogar(d, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.nivel, 2);
  const v = r.eventos.find((ev) => ev.tipo === 'descarteVazio');
  assert.ok(v, 'evento da pilha esvaziando');
  assert.equal(v.n, 1);
  assert.equal(r.estado.descarteCarga, max);
  assert.equal(r.estado.descarte, null);
  const preso = { ...d, descarteCarga: 0, fim: 'mesaCheia' };
  assert.equal(jogar(preso, { tipo: 'retomar', t: 0 }).estado.descarteCarga, 1);
  // o premio do video esvazia a pilha; com ela vazia, nao faz nada
  const v2 = jogar(d, { tipo: 'esvaziar', t: 0 });
  assert.equal(v2.estado.descarteCarga, max);
  assert.equal(v2.estado.descarte, null);
  assert.equal(v2.eventos[0].tipo, 'descarteVazio');
  assert.equal(v2.estado.n, d.n, 'nao conta como jogada');
  assert.equal(jogar(e0, { tipo: 'esvaziar', t: 0 }).eventos.length, 0);
});

test('ordem dos eventos numa cascata de 3 degraus', () => {
  const e0 = criarPartida({}, fase({ inicio: [[8, 4, 2], [], [], []], baralho: { pesos: { 2: 1 }, total: 20, dinamico: false } }), 3);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  const tipos = r.eventos.map((ev) => ev.tipo);
  assert.deepEqual(tipos.slice(0, 3), ['fundir', 'fundir', 'fundir']);
  assert.deepEqual(r.eventos.slice(0, 3).map((ev) => ev.degrau), [1, 2, 3]);
  assert.equal(r.estado.maiorCascata, 3);
  assert.equal(r.estado.pontos, 4 * 1 + 8 * 2 + 16 * 3);
  assert.ok(tipos.includes('combo') === false, 'combo so a partir da segunda fusao seguida');
});

test('febre liga depois de 5 fusoes seguidas e expira pelo tempo da acao', () => {
  const e0 = criarPartida({ febreFusoes: 2, febreMs: 1000 }, fase({ inicio: [[2], [2], [2], [2]], baralho: { pesos: { 2: 1 }, total: 30, dinamico: false } }), 3);
  let r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  r = jogar(r.estado, { tipo: 'colocar', c: 1, t: 100 });
  assert.equal(r.estado.febre, true);
  assert.ok(r.eventos.some((ev) => ev.tipo === 'febre' && ev.ligada));
  const p = r.estado.pontos;
  r = jogar(r.estado, { tipo: 'colocar', c: 2, t: 200 });
  assert.equal(r.estado.pontos - p, 8, 'pontos em dobro na febre');
  r = jogar(r.estado, { tipo: 'colocar', c: 3, t: 5000 });
  assert.equal(r.estado.febre, false);
  assert.ok(r.eventos[0].tipo === 'febre' && !r.eventos[0].ligada);
});

test('itens: coringa, martelo, troca e desfazer', () => {
  const e0 = criarPartida({}, fase({ inicio: [[32], [8], [], []], itens: { coringa: 1, martelo: 1, troca: 1 }, baralho: { pesos: { 2: 1, 4: 1 }, total: 30, dinamico: false } }), 5);
  const c = jogar(e0, { tipo: 'item', item: 'coringa', c: 0, t: 0 });
  assert.equal(c.estado.colunas[0][0].v, 64);
  assert.equal(c.estado.itens.coringa, 0);
  assert.equal(c.estado.fila.length, 3, 'item nao gasta a fila');
  const m = jogar(c.estado, { tipo: 'item', item: 'martelo', c: 1, t: 0 });
  assert.deepEqual(m.estado.colunas[1], []);
  const t = jogar(m.estado, { tipo: 'item', item: 'troca', t: 0 });
  assert.equal(t.estado.fila[0].id, m.estado.fila[1].id);
  const d = desfazerPara(e0);
  assert.equal(d.itens.desfazer, 0);
  assert.equal(jogar(t.estado, { tipo: 'item', item: 'troca', t: 0 }).eventos.length, 0);
});

test('bomba e dobro como cartas da fila', () => {
  const e0 = criarPartida({}, fase({ inicio: [[16, 8], [4], [], []], baralho: { pesos: { 2: 1 }, total: 30, dinamico: false } }), 5);
  const bomba = { ...e0, fila: [{ id: 500, tipo: 'bomba', v: 0 }, ...e0.fila.slice(1)] };
  const b = jogar(bomba, { tipo: 'colocar', c: 0, t: 0 });
  assert.deepEqual(b.estado.colunas[0].map((k) => k.v), [16]);
  assert.equal(b.eventos[0].tipo, 'bomba');
  const dobro = { ...e0, fila: [{ id: 501, tipo: 'dobro', v: 0 }, ...e0.fila.slice(1)] };
  const d = jogar(dobro, { tipo: 'colocar', c: 0, t: 0 });
  assert.deepEqual(d.estado.colunas[0].map((k) => k.v), [32], '8 -> 16 funde com 16');
  assert.equal(d.estado.maiorCascata, 2);
  assert.equal(jogar(dobro, { tipo: 'colocar', c: 2, t: 0 }).eventos[0].motivo, 'semAlvo');
});

test('carta x4: o topo vezes 4, marca a carta e sobe os dois niveis do caminho', () => {
  // nivel 3 (64) com um 16 no topo: x4 faz 64 (passa pelo 32) e cascateia com o 64 de baixo
  const e0 = naEscada(4, 3, [[64, 16], [], [], []], [2, 2, 2]);
  const q = { ...e0, fila: [{ id: 530, tipo: 'quadruplo', v: 0 }, ...e0.fila.slice(1)] };
  const r = jogar(q, { tipo: 'colocar', c: 0, t: 0 });
  const d = r.eventos.find((ev) => ev.tipo === 'dobro');
  assert.deepEqual([d.valor, d.fator], [64, 4]);
  assert.deepEqual(r.estado.colunas[0].map((k) => k.v), [128]);
  assert.equal('esp' in r.estado.colunas[0][0], false, 'a cascata faz uma carta nova');
  assert.equal(r.estado.cartasFeitas[32], 1, 'o valor do meio conta como feito');
  assert.equal(r.estado.nivel, 5, 'o 64 e o 128 sobem o nivel 3 e o 4');
  // sem cascata a carta fica marcada; no 1024 o x4 para no teto
  const s = criarPartida({}, fase({ inicio: [[1024], [8], [], []], baralho: { pesos: { 2: 1 }, total: 30, dinamico: false } }), 5);
  const t = jogar({ ...s, fila: [{ id: 531, tipo: 'quadruplo', v: 0 }, ...s.fila.slice(1)] }, { tipo: 'colocar', c: 1, t: 0 });
  assert.equal(t.estado.colunas[1][0].v, 32);
  assert.equal(t.estado.colunas[1][0].esp, true);
  const u = jogar({ ...s, fila: [{ id: 532, tipo: 'quadruplo', v: 0 }, ...s.fila.slice(1)] }, { tipo: 'colocar', c: 0, t: 0 });
  assert.ok(u.eventos.some((ev) => ev.tipo === 'completar' && ev.valor === 2048), '1024 x4 vira 2048 e sai da mesa');
});

test('um especial por carta: a segunda vez e recusada ate a carta fundir de novo', () => {
  const e0 = criarPartida({}, fase({ inicio: [[32], [], [], []], itens: { coringa: 1 }, baralho: { pesos: { 2: 1 }, total: 30, dinamico: false } }), 5);
  const comFila = (e, ...tipos) => ({ ...e, fila: [...tipos.map((tipo, k) => (typeof tipo === 'number' ? { id: 520 + k, tipo: 'normal', v: tipo } : { id: 520 + k, tipo, v: 0 })), ...e.fila].slice(0, 3) });
  // dobro: 32 -> 64 marcado
  const d = jogar(comFila(e0, 'dobro', 'coringa'), { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(d.estado.colunas[0][0].v, 64);
  assert.equal(d.estado.colunas[0][0].esp, true);
  // o coringa da fila e o do item sao recusados no 64 marcado
  const c = jogar(d.estado, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(c.eventos[0].tipo, 'recusar');
  assert.equal(c.eventos[0].motivo, 'usada');
  assert.equal(jogar(d.estado, { tipo: 'item', item: 'coringa', c: 0, t: 0 }).eventos[0].motivo, 'usada');
  assert.ok(!acoesLegais(d.estado).some((a) => a.c === 0 && (a.tipo === 'colocar' || a.item === 'coringa')));
  // uma fusao normal (64 + 64) limpa a marca: o especial volta a valer
  const n = jogar(comFila(d.estado, 64, 'dobro'), { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(n.estado.colunas[0][0].v, 128);
  assert.equal('esp' in n.estado.colunas[0][0], false);
  const de = jogar(n.estado, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(de.estado.colunas[0][0].v, 256);
  // o dobro que cascateia faz uma carta nova (limpa)
  const k = criarPartida({}, fase({ inicio: [[16, 8], [], [], []], baralho: { pesos: { 2: 1 }, total: 30, dinamico: false } }), 5);
  const kc = jogar(comFila(k, 'dobro'), { tipo: 'colocar', c: 0, t: 0 });
  assert.deepEqual(kc.estado.colunas[0].map((x) => x.v), [32]);
  assert.equal('esp' in kc.estado.colunas[0][0], false);
});

test('metas e fim de fase', () => {
  const f = fase({ inicio: [[2], [], [], []], metas: [{ tipo: 'cartas', v: 4, n: 1 }] });
  const e0 = criarPartida({}, f, 7);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.fim, 'venceu');
  const fim = r.eventos.find((ev) => ev.tipo === 'fimFase');
  assert.equal(fim.pontos, 4);
  assert.ok(r.eventos.some((ev) => ev.tipo === 'meta' && ev.feita));
  assert.equal(jogar(r.estado, { tipo: 'colocar', c: 1, t: 0 }).eventos.length, 0, 'depois do fim nada se aplica');
});

test('mesa cheia sem descarte termina; retomar limpa a coluna mais cheia', () => {
  const f = fase({ regras: { pilhaMax: 3, colunas: 3, descarteMax: 0 }, inicio: [[8, 4, 2], [8, 4, 2], [8, 4, 2]], baralho: { pesos: { 64: 1 }, total: 30, dinamico: false } });
  const e0 = criarPartida({}, f, 7);
  assert.equal(e0.fim, null, 'o fim so e avaliado depois de uma jogada');
  assert.equal(temJogada(e0), false);
  const t = jogar({ ...e0, descarteCarga: 1 }, { tipo: 'descartar', t: 0 });
  assert.equal(t.estado.fim, 'mesaCheia');
  assert.ok(t.eventos.some((ev) => ev.tipo === 'fimPartida' && ev.motivo === 'mesaCheia'));
  const r = jogar(t.estado, { tipo: 'retomar', t: 0 });
  assert.equal(r.estado.fim, null);
  assert.equal(r.estado.continuacoes, 1);
  assert.equal(r.estado.colunas.filter((c) => c.length === 0).length, 1);
});

test('baralho acabou termina a partida', () => {
  const f = fase({ baralho: { pesos: { 2: 1 }, total: 3, dinamico: false } });
  let e = criarPartida({}, f, 7);
  assert.equal(e.restantes, 0);
  e = jogar(e, { tipo: 'colocar', c: 0, t: 0 }).estado;
  e = jogar(e, { tipo: 'colocar', c: 0, t: 0 }).estado;
  const r = jogar(e, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.fim, 'baralhoAcabou');
});

test('acoesLegais lista colunas, descarte e itens', () => {
  const e0 = criarPartida({}, fase({ inicio: [[2], [], [], []], itens: { martelo: 1 } }), 7);
  const a = acoesLegais(e0);
  assert.equal(a.filter((x) => x.tipo === 'colocar').length, 4);
  assert.ok(a.some((x) => x.tipo === 'descartar'));
  assert.equal(a.filter((x) => x.item === 'martelo').length, 1);
});

/** Partida da escada no nivel n do mundo m, com a fila trocada por `fila` (valores). */
function naEscada(m, n, inicio, fila) {
  const f = { ...faseDe(faseGlobal(m, n)), ...(inicio ? { inicio } : {}) };
  const e = criarPartida({}, f, 3);
  return { ...e, fila: fila.map((v, k) => ({ id: 700 + k, tipo: 'normal', v })) };
}

test('escada: fazer o valor do nivel sobe o nivel na mesma mesa', () => {
  const e0 = naEscada(1, 1, [[8], [], [4], []], [8, 2, 2]);
  assert.equal(e0.nivel, 1);
  assert.equal(e0.metas[0].v, 16);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  const nv = r.eventos.find((ev) => ev.tipo === 'nivel');
  assert.deepEqual([nv.n, nv.valor, nv.antes], [2, 32, 16]);
  assert.equal(r.estado.nivel, 2);
  assert.equal(r.estado.metas[0].v, 32);
  assert.equal(r.estado.fim, null);
  assert.deepEqual(r.estado.colunas[0].map((k) => k.v), [16], 'a mesa segue');
  assert.deepEqual(r.estado.baralho.pesos, criarPartida({}, faseDe(2), 1).baralho.pesos, 'o baralho do nivel novo');
  assert.equal(progressoDoNivel(r.estado), 0, 'a barra do nivel novo comeca vazia');
});

test('escada: uma cascata sobe dois niveis de uma vez', () => {
  // nivel 2 (32) com [32, 16, 8] e um 8: 16, 32, 64 -> passa o 32 e o 64
  const e0 = naEscada(1, 2, [[32, 16, 8], [], [], []], [8, 4, 4]);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.deepEqual(r.eventos.filter((ev) => ev.tipo === 'nivel').map((ev) => ev.n), [3, 4]);
  assert.equal(r.estado.nivel, 4);
  assert.equal(r.estado.metas[0].v, 128);
});

test('escada: na subida, as cartas abaixo do piso saem da mesa com pontos', () => {
  // nivel 5 (256) -> 6 (512): o baralho do 512 comeca no 4; os 2 saem
  const e0 = naEscada(1, 5, [[128, 64, 32, 16, 8], [2], [4, 2], []], [8, 4, 4]);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.nivel, 6);
  const piso = Math.min(...Object.keys(r.estado.baralho.pesos).map(Number));
  assert.equal(piso, 4);
  const g = r.eventos.find((ev) => ev.tipo === 'graduar');
  assert.deepEqual(g.cartas.map((k) => k.valor), [2, 2]);
  assert.equal(g.pontos, 4);
  assert.deepEqual(r.estado.colunas.map((c) => c.map((k) => k.v)), [[256], [], [4], []]);
  const idx = r.eventos.findIndex((ev) => ev.tipo === 'nivel');
  assert.ok(r.eventos.findIndex((ev) => ev.tipo === 'graduar') > idx, 'graduar vem depois do nivel');
});

test('escada: desfazer e "Continuar" gratis renovam a cada nivel', () => {
  const e0 = { ...naEscada(1, 1, [[8], [], [4], []], [8, 2, 2]), continuacoes: 1, itens: { coringa: 0, martelo: 0, troca: 0, desfazer: 0 } };
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.continuacoes, 0);
  assert.equal(r.estado.itens.desfazer, 1);
});

test('escada: o 2048 sai da mesa e fecha o mundo', () => {
  const e0 = naEscada(2, 8, [[1024, 512, 256], [], [], []], [256, 4, 4]);
  assert.equal(e0.nivel, 8);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.ok(r.eventos.some((ev) => ev.tipo === 'completar' && ev.valor === 2048));
  assert.equal(r.estado.fim, 'venceu');
  assert.ok(r.eventos.some((ev) => ev.tipo === 'fimFase'));
  assert.equal(progressoDoNivel(r.estado), 1);
});

test('escada: o kit de cada nivel e a fase global', () => {
  for (const m of MUNDOS) {
    for (let n = 1; n <= 8; n++) {
      const f = faseDe(faseGlobal(m.id, n));
      assert.equal(f.mundo, m.id);
      assert.equal(f.nivel, n);
      const e = criarPartida({}, f, f.semente);
      assert.equal(e.nivel, n);
      assert.equal(e.metas[0].v, alvoDoNivel(n));
      assert.equal(e.colunas.length, m.regras && m.regras.colunas ? m.regras.colunas : 4);
      if (n > 1) assert.deepEqual(kitDoNivel(m, n).slice(0, 2), [[alvoDoNivel(n) / 2], [alvoDoNivel(n) / 4]]);
      const vs = Object.keys(e.baralho.pesos).map(Number);
      assert.ok(Math.max(...vs) < alvoDoNivel(n), 'o baralho nunca da o valor do nivel');
    }
  }
  assert.notEqual(faseDe(5, 0).semente, faseDe(5, 1).semente, 'recomecar muda a semente');
});

test('pontos das fusoes somam os pontos da partida (com febre, graduar e monte)', async () => {
  const { melhorJogada } = await import('../src/jogo/bot.js');
  for (const N of [3, 8, 13, 30]) {
    const f = faseDe(N);
    let e = criarPartida({}, f, f.semente);
    let soma = 0;
    for (let k = 0, t = 0; k < 300 && !e.fim; k++, t += 700) {
      const a = melhorJogada(e, t);
      if (!a) break;
      const r = jogar(e, { ...a, t });
      for (const ev of r.eventos) if (ev.pontos && ev.tipo !== 'fimFase') soma += ev.pontos;
      e = r.estado;
    }
    assert.equal(soma, e.pontos, `fase ${N}`);
  }
});

test('progresso do nivel: zero no inicio, sobe com as fusoes, um so na meta', () => {
  const f = fase({ inicio: [[4], [], [2], []], metas: [{ tipo: 'cartas', v: 16, n: 1 }] });
  let e = criarPartida({}, f, 1);
  assert.equal(progressoDoNivel(e), 0);
  e = { ...e, fila: [{ id: 801, tipo: 'normal', v: 4 }, { id: 802, tipo: 'normal', v: 8 }, { id: 803, tipo: 'normal', v: 2 }] };
  e = jogar(e, { tipo: 'colocar', c: 0, t: 0 }).estado; // 4 + 4 = 8
  const p1 = progressoDoNivel(e);
  assert.ok(p1 > 0 && p1 < 1, 'a fusao anda a barra: ' + p1);
  assert.ok(progresso(e.metas[0], e) <= 0.92);
  e = jogar(e, { tipo: 'colocar', c: 0, t: 1 }).estado; // 8 + 8 = 16: vence
  assert.equal(e.fim, 'venceu');
  assert.equal(progressoDoNivel(e), 1);
});

test('progresso do nivel: trabalho alem da conta nao enche a barra antes da meta', () => {
  const f = fase({ inicio: [[], [], [], []], metas: [{ tipo: 'cartas', v: 128, n: 1 }] });
  const e0 = criarPartida({}, f, 1);
  let antes = 0;
  for (const x of [0.25, 0.5, 1, 1.5, 2, 3, 5]) {
    const n = Math.round((x * e0.metas[0].trabalho) / 64);
    const p = progressoDoNivel({ ...e0, cartasFeitas: { 64: n } });
    assert.ok(p >= antes, `a barra nunca volta (x=${x}: ${p})`);
    assert.ok(p <= 0.92, `falta a fusao final (x=${x}: ${p})`);
    if (x <= 3) assert.ok(p > antes, `cada fusao ainda anda um pouco (x=${x})`);
    antes = p;
  }
  assert.ok(Math.abs(progressoDoNivel({ ...e0, cartasFeitas: { 64: Math.round((0.25 * e0.metas[0].trabalho) / 64) } }) - 0.5) < 0.03);
});
