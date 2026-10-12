// Reducer da partida: imutabilidade, eventos, descarte, itens, febre, fim.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPartida, jogar, acoesLegais, temJogada, desfazerPara, presa } from '../src/jogo/partida.js';
import { estrelas } from '../src/jogo/metas.js';

const fase = (extra = {}) => ({
  id: 99, mundo: 1, semente: 1,
  baralho: { pesos: { 2: 1 }, total: 50, dinamico: false },
  inicio: [[], [], [], []], metas: [], estrelas: [0, 100, 200], ...extra,
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

test('descarte gasta a carga e recarrega ao completar um monte', () => {
  const e0 = criarPartida({}, fase({ inicio: [[1024], [], [], []], baralho: { pesos: { 1024: 1 }, total: 20, dinamico: false } }), 3);
  const d = jogar(e0, { tipo: 'descartar', t: 0 });
  assert.equal(d.estado.descarteCarga, 0);
  assert.equal(d.estado.descarte.v, 1024);
  const d2 = jogar(d.estado, { tipo: 'descartar', t: 0 });
  assert.equal(d2.eventos[0].motivo, 'semDescarte');
  const m = jogar(d.estado, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(m.estado.montes, 1);
  assert.equal(m.estado.descarteCarga, 1);
  assert.ok(m.eventos.some((ev) => ev.tipo === 'completar'));
  assert.deepEqual(m.estado.colunas[0], []);
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
  const bomba = { ...e0, fila: [{ id: 500, tipo: 'bomba', v: 0, cor: 0 }, ...e0.fila.slice(1)] };
  const b = jogar(bomba, { tipo: 'colocar', c: 0, t: 0 });
  assert.deepEqual(b.estado.colunas[0].map((k) => k.v), [16]);
  assert.equal(b.eventos[0].tipo, 'bomba');
  const dobro = { ...e0, fila: [{ id: 501, tipo: 'dobro', v: 0, cor: 0 }, ...e0.fila.slice(1)] };
  const d = jogar(dobro, { tipo: 'colocar', c: 0, t: 0 });
  assert.deepEqual(d.estado.colunas[0].map((k) => k.v), [32], '8 -> 16 funde com 16');
  assert.equal(d.estado.maiorCascata, 2);
  assert.equal(jogar(dobro, { tipo: 'colocar', c: 2, t: 0 }).eventos[0].motivo, 'semAlvo');
});

test('metas, estrelas e fim de fase', () => {
  const f = fase({ inicio: [[2], [], [], []], metas: [{ tipo: 'cartas', v: 4, n: 1 }], estrelas: [0, 3, 100] });
  const e0 = criarPartida({}, f, 7);
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.fim, 'venceu');
  const fim = r.eventos.find((ev) => ev.tipo === 'fimFase');
  assert.equal(fim.estrelas, 2);
  assert.equal(estrelas(r.estado), 2);
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

test('martelo nao vale em coluna trancada (nem salva da mesa cheia)', () => {
  const tranca = { tipo: 'valor', v: 1024 };
  const f = (cadeados) => fase({ regras: { pilhaMax: 3, colunas: 3, descarteMax: 0 }, inicio: [[8, 4, 2], [8, 4, 2], [8, 4, 2]], obst: { cadeados }, itens: { martelo: 1 }, baralho: { pesos: { 64: 1 }, total: 30, dinamico: false } });
  const todas = criarPartida({}, f({ 0: tranca, 1: tranca, 2: tranca }), 7);
  assert.equal(acoesLegais(todas).filter((x) => x.item === 'martelo').length, 0);
  assert.equal(jogar(todas, { tipo: 'item', item: 'martelo', c: 0, t: 0 }).estado, todas);
  assert.ok(presa(todas));
  const uma = criarPartida({}, f({ 0: tranca, 1: tranca }), 7);
  assert.deepEqual(acoesLegais(uma).filter((x) => x.item === 'martelo').map((x) => x.c), [2]);
  assert.ok(!presa(uma));
});

test('cadeado abre pelo gatilho', () => {
  const f = fase({ inicio: [[2], [], [], []], obst: { cadeados: { 3: { tipo: 'valor', v: 4 } } } });
  const e0 = criarPartida({}, f, 7);
  assert.equal(jogar(e0, { tipo: 'colocar', c: 3, t: 0 }).eventos[0].motivo, 'trancada');
  const r = jogar(e0, { tipo: 'colocar', c: 0, t: 0 });
  assert.ok(r.eventos.some((ev) => ev.tipo === 'cadeado' && ev.c === 3));
  assert.deepEqual(r.estado.cadeados, {});
});

test('dano dos golpes soma os pontos da partida (com febre e montes)', async () => {
  const { melhorJogada } = await import('../src/jogo/bot.js');
  const { FASES } = await import('../src/jogo/fases.js');
  for (const id of [5, 7, 15, 23]) {
    let e = criarPartida({}, FASES[id - 1], FASES[id - 1].semente);
    let dano = 0;
    for (let k = 0, t = 0; k < 200 && !e.fim; k++, t += 700) {
      const a = melhorJogada(e, t);
      if (!a) break;
      const r = jogar(e, { ...a, t });
      for (const ev of r.eventos) if (ev.dano) dano += ev.dano;
      e = r.estado;
    }
    assert.equal(dano, e.pontos, `fase ${id}`);
  }
});

test('vida do monstro: cheia no inicio, cai com os golpes, zero so na vitoria', async () => {
  const { vidaDe, progresso } = await import('../src/jogo/metas.js');
  const f = fase({ inicio: [[4], [], [2], []], metas: [{ tipo: 'cartas', v: 16, n: 1 }] });
  let e = criarPartida({}, f, 1);
  assert.equal(vidaDe(e), 1);
  e = { ...e, fila: [{ id: 801, tipo: 'normal', v: 4, cor: 0 }, { id: 802, tipo: 'normal', v: 8, cor: 0 }, { id: 803, tipo: 'normal', v: 2, cor: 0 }] };
  e = jogar(e, { tipo: 'colocar', c: 0, t: 0 }).estado; // 4 + 4 = 8
  const v1 = vidaDe(e);
  assert.ok(v1 < 1 && v1 > 0, 'o golpe tira vida: ' + v1);
  assert.ok(progresso(e.metas[0], e) <= 0.97);
  e = jogar(e, { tipo: 'colocar', c: 0, t: 1 }).estado; // 8 + 8 = 16: vence
  assert.equal(e.fim, 'venceu');
  assert.equal(vidaDe(e), 0);
});

test('vida do monstro: trabalho alem da conta nao deixa o monstro com cara de morto', async () => {
  const { vidaDe } = await import('../src/jogo/metas.js');
  const f = fase({ inicio: [[], [], [], []], metas: [{ tipo: 'cartas', v: 128, n: 1 }] });
  const e0 = criarPartida({}, f, 1);
  // cartas espalhadas: muito trabalho feito e nenhum 128 (a fase 4 chega a 3x a conta)
  let antes = 1;
  for (const x of [0.25, 0.5, 1, 1.5, 2, 3, 5]) {
    const n = Math.round((x * e0.metas[0].trabalho) / 64);
    const v = vidaDe({ ...e0, cartasFeitas: { 64: n } });
    assert.ok(v <= antes, `a vida nunca sobe (x=${x}: ${v})`);
    assert.ok(v >= 0.08, `sobra vida ate o golpe final (x=${x}: ${v})`);
    if (x <= 3) assert.ok(v < antes, `cada golpe ainda tira um pouco (x=${x})`);
    antes = v;
  }
  // o comeco segue a raiz (a furia dos chefoes mira 60% a 92% de vida)
  assert.ok(Math.abs(vidaDe({ ...e0, cartasFeitas: { 64: Math.round((0.25 * e0.metas[0].trabalho) / 64) } }) - 0.5) < 0.03);
});
