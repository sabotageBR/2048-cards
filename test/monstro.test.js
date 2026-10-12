// Monstro que ataca: contagem, feiticos e seus alvos, furia, vida que nunca
// sobe, RNG do baralho intacto, mesa cheia nunca junto do feitico, save; e a
// cadeia do Classico e do Diario.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPartida, jogar, presa } from '../src/jogo/partida.js';
import { criarMonstro, candidatos, aplicarFeitico, atacar, nivelCadeia, vidaDoNivel } from '../src/jogo/monstro.js';
import { vidaDe } from '../src/jogo/metas.js';
import { FASES, CLASSICO, faseDe } from '../src/jogo/fases.js';
import { faseDiaria, ordemDoDia, sementeDoDia } from '../src/jogo/diario.js';
import { jogarSozinho, melhorJogada } from '../src/jogo/bot.js';

const fase = (extra = {}) => ({
  id: 99, mundo: 1, semente: 1,
  baralho: { pesos: { 2: 1 }, total: 60, dinamico: false },
  inicio: [[], [], [], []], metas: [{ tipo: 'pontos', alvo: 99999 }], estrelas: [0, 100, 200], ...extra,
});
const N = (v, extra = {}) => ({ id: 500 + v, tipo: 'normal', v, cor: 0, ...extra });
/** Estado com a mesa e o monstro dados (fila de 2s). */
function montar(colunas, monstro, extra = {}) {
  const e = criarPartida({}, fase({ monstro, ...extra }), 7);
  return { ...e, colunas: colunas.map((c) => c.map((k) => (typeof k === 'number' ? N(k) : k))) };
}
const evMonstro = (r) => r.eventos.find((ev) => ev.tipo === 'monstro');

test('fase sem monstro: ele so apanha', () => {
  const e = criarPartida({}, fase(), 7);
  assert.equal(e.monstro, null);
  const r = jogar(e, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(evMonstro(r), undefined);
  assert.equal(r.meio, null);
});

test('colocar e descartar contam; recusa, item e retomar nao', () => {
  let e = montar([[4], [], [], []], { cada: 9, feiticos: ['lodo'] });
  e = { ...e, itens: { ...e.itens, troca: 1 } };
  assert.equal(e.monstro.conta, 9);
  e = jogar(e, { tipo: 'colocar', c: 1, t: 0 }).estado;
  assert.equal(e.monstro.conta, 8);
  e = jogar(e, { tipo: 'descartar', t: 0 }).estado;
  assert.equal(e.monstro.conta, 7);
  const recusa = jogar({ ...e, fila: [N(8), ...e.fila.slice(1)] }, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(recusa.eventos[0].tipo, 'recusar');
  assert.equal(recusa.estado.monstro.conta, 7);
  e = jogar(e, { tipo: 'item', item: 'troca', t: 0 }).estado;
  assert.equal(e.monstro.conta, 7);
});

test('no zero lanca o feitico anunciado; meio e a mesa antes dele', () => {
  const e0 = montar([[16], [], [], []], { cada: 1, feiticos: ['lodo'] });
  assert.equal(e0.monstro.proximo, 'lodo');
  const r = jogar(e0, { tipo: 'colocar', c: 1, t: 0 });
  const ev = evMonstro(r);
  assert.ok(ev, 'evento monstro');
  assert.equal(ev.feitico, 'lodo');
  assert.deepEqual(ev.alvos.map((a) => a.c), [0]);
  assert.equal(ev.alvos[0].valor, 8);
  assert.deepEqual(r.estado.colunas[0].map((k) => k.v), [16, 8]);
  assert.deepEqual(r.meio.colunas[0].map((k) => k.v), [16]);
  assert.equal(r.meio.monstro.conta, 0);
  assert.equal(r.estado.monstro.conta, 1);
  assert.equal(r.estado.monstro.lancados, 1);
  // o evento do monstro vem depois de tudo o que o jogador fez
  assert.equal(r.eventos.indexOf(ev), r.eventos.length - 1);
});

test('golpe fatal: com a fase vencida nao ha feitico', () => {
  const e0 = montar([[16], [], [], []], { cada: 1, feiticos: ['lodo'] }, { metas: [{ tipo: 'cartas', v: 4, n: 1 }] });
  const r = jogar({ ...e0, colunas: [[N(16)], [N(2)], [], []] }, { tipo: 'colocar', c: 1, t: 0 });
  assert.equal(r.estado.fim, 'venceu');
  assert.equal(evMonstro(r), undefined);
});

test('lodo: so sobre topo normal de 8 a 256, nunca em coluna cheia, congelada ou trancada', () => {
  const e = montar([[4], [512], [N(32, { gelo: true })], [256]], { cada: 1, feiticos: ['lodo'] });
  assert.deepEqual(candidatos(e, 'lodo'), [3]);
  const cheia = montar([[64, 32, 16, 8, 8, 8], [], [], [16]], { cada: 1, feiticos: ['lodo'] });
  assert.deepEqual(candidatos(cheia, 'lodo'), [3]);
  const trancada = { ...montar([[16], [], [], []], { cada: 1, feiticos: ['lodo'] }), cadeados: { 0: { tipo: 'jogadas', n: 9 } } };
  assert.deepEqual(candidatos(trancada, 'lodo'), []);
});

test('pedra: no fundo (as cartas sobem), nunca onde ja ha pedra; nao conta para a meta', () => {
  const pedra = { id: 600, tipo: 'pedra', v: 0, cor: 0, hp: 3, hpMax: 3 };
  const e = montar([[pedra, 8], [64, 32], [], [16]], { cada: 1, feiticos: ['pedra'], pedraHp: 2 }, { metas: [{ tipo: 'pedras' }] });
  assert.deepEqual(candidatos(e, 'pedra'), [1, 2, 3]);
  const r = aplicarFeitico(e, 'pedra', 1);
  const col = r.e.colunas[1];
  assert.equal(col[0].tipo, 'pedra');
  assert.equal(col[0].hp, 2);
  assert.ok(col[0].lancada);
  assert.deepEqual(col.slice(1).map((k) => k.v), [64, 32]);
  // quebrar a pedra do monstro nao cumpre a meta de pedras
  const e2 = { ...r.e, pedrasTotal: 1, pedrasHp: 3, fila: [N(32), ...r.e.fila.slice(1)] };
  const vida0 = vidaDe(e2);
  let x = jogar(e2, { tipo: 'colocar', c: 1, t: 0 }).estado; // 32+32 -> 64 -> 128: duas fusoes
  assert.equal(x.colunas[1][0].tipo, 'normal', 'a pedra do monstro quebrou');
  assert.equal(x.pedrasQuebradas, 0);
  assert.equal(x.metas[0].feita, false);
  assert.ok(vidaDe(x) >= vida0 - 1e-9, 'pedra do monstro nao mexe na vida');
});

test('gelo: congela topo normal de 8 a 128', () => {
  const e = montar([[4], [256], [64], [N(16, { gelo: true })]], { cada: 1, feiticos: ['gelo'] });
  assert.deepEqual(candidatos(e, 'gelo'), [2]);
  const r = aplicarFeitico(e, 'gelo', 2);
  assert.equal(r.e.colunas[2][0].gelo, true);
  assert.equal(r.alvo.id, e.colunas[2][0].id);
});

test('corrente: 4+ colunas, uma de cada vez, nunca a ultima aberta, abre depois de K jogadas', () => {
  const tres = criarPartida({}, fase({ regras: { colunas: 3 }, inicio: [[], [], []], monstro: { cada: 1, feiticos: ['corrente'] } }), 7);
  assert.deepEqual(candidatos(tres, 'corrente'), []);
  let e = montar([[], [], [], []], { cada: 1, feiticos: ['corrente'], trancaK: 2 });
  e = { ...e, cadeados: { 3: { tipo: 'valor', v: 4096 } } };
  assert.deepEqual(candidatos(e, 'corrente'), [0, 1, 2]);
  const r = jogar(e, { tipo: 'colocar', c: 0, t: 0 });
  const ev = evMonstro(r);
  const c = ev.alvos[0].c;
  assert.ok(r.estado.cadeados[c].monstro);
  // com uma corrente do monstro viva nao vem outra
  assert.deepEqual(candidatos(r.estado, 'corrente'), []);
  // duas jogadas depois a coluna abre
  let x = r.estado;
  const livre = [0, 1, 2].find((k) => k !== c);
  for (let i = 0; i < 2; i++) x = jogar({ ...x, monstro: { ...x.monstro, conta: 9 } }, { tipo: 'colocar', c: livre, t: 0 }).estado;
  assert.equal(x.cadeados[c], undefined);
  // sobra so uma aberta: nao tranca
  const quase = { ...montar([[], [], [], []], { cada: 1, feiticos: ['corrente'] }), cadeados: { 0: { tipo: 'valor', v: 4096 }, 1: { tipo: 'valor', v: 4096 } } };
  assert.deepEqual(candidatos(quase, 'corrente'), []);
});

test('sem alvo valido o feitico erra e a contagem recomeca', () => {
  const e0 = montar([[4], [2], [], []], { cada: 1, feiticos: ['gelo'] });
  const r = jogar(e0, { tipo: 'colocar', c: 2, t: 0 });
  const ev = evMonstro(r);
  assert.deepEqual(ev.alvos, []);
  assert.equal(r.estado.monstro.conta, 1);
  assert.deepEqual(r.estado.colunas.map((c) => c.map((k) => !!k.gelo)), r.meio.colunas.map((c) => c.map((k) => !!k.gelo)));
});

test('furia: dispara uma vez, encurta a contagem e pega dois alvos', () => {
  const cfg = { cada: 6, feiticos: ['lodo'], furia: { hp: 0.5, cada: 1, alvos: 2 } };
  let e = montar([[16], [32], [64], []], cfg, { metas: [{ tipo: 'pontos', alvo: 40 }] });
  e = { ...e, fila: [N(16), N(2), N(2)] };
  const r = jogar(e, { tipo: 'colocar', c: 0, t: 0 }); // 16+16 = 32 (cascata 64): 32 + 64 = 96 pontos > 50%
  assert.equal(r.eventos.filter((ev) => ev.tipo === 'furia').length, 1);
  assert.ok(r.estado.monstro.emFuria);
  const ev = evMonstro(r);
  assert.ok(ev, 'na furia a contagem caiu para 1 e ele ja ataca');
  assert.equal(ev.alvos.length, 2);
  const r2 = jogar(r.estado, { tipo: 'colocar', c: 3, t: 0 });
  assert.equal(r2.eventos.filter((ev) => ev.tipo === 'furia').length, 0);
});

test('o RNG do baralho nao muda com o ataque', () => {
  const com = montar([[16], [], [], []], { cada: 1, feiticos: ['lodo'] });
  const sem = { ...com, monstro: null };
  const a = jogar(com, { tipo: 'colocar', c: 1, t: 0 }).estado;
  const b = jogar(sem, { tipo: 'colocar', c: 1, t: 0 }).estado;
  assert.equal(a.rng, b.rng);
  assert.deepEqual(a.fila, b.fila);
  // a semente do monstro e outra: o baralho da fase curada continua o mesmo
  assert.notEqual(criarMonstro({ cada: 3, feiticos: ['lodo'] }, 7).rng, 7);
});

test('a vida nunca sobe e so zera com a fase vencida', () => {
  for (const id of [4, 8, 10, 16, 18, 24, 28, 32, 40]) {
    const f = faseDe(id);
    let e = criarPartida({}, f, f.semente + 3);
    let vida = vidaDe(e);
    for (let t = 0; !e.fim && t < 600; t++) {
      const a = melhorJogada(e, t * 900);
      if (!a) break;
      e = jogar(e, { ...a, t: t * 900 }).estado;
      const v = vidaDe(e);
      assert.ok(v <= vida + 1e-9, `fase ${id}: a vida subiu (${vida} -> ${v})`);
      if (e.fim !== 'venceu') assert.ok(v > 0, `fase ${id}: vida zero sem vencer`);
      vida = v;
    }
  }
});

test('a mesa cheia nunca vem na mesma jogada de um feitico (cada: 1)', () => {
  for (const id of [7, 12, 23, 31, 39]) {
    const f = { ...faseDe(id), monstro: { cada: 1, feiticos: ['lodo', 'pedra', 'gelo', 'corrente'], furia: { hp: 0.6, cada: 1, alvos: 2 } } };
    for (let s = 1; s <= 25; s++) {
      let e = criarPartida({}, f, f.semente + s);
      for (let t = 0; !e.fim && t < 400; t++) {
        const a = melhorJogada(e, t * 900);
        if (!a) break;
        const r = jogar(e, { ...a, t: t * 900 });
        const ev = evMonstro(r);
        if (ev && ev.alvos.length) assert.notEqual(r.estado.fim, 'mesaCheia', `fase ${id} semente ${s}`);
        e = r.estado;
      }
    }
  }
});

test('preso antes do ataque: o monstro nao ataca e a mesa cheia sai', () => {
  const e0 = montar([[2, 2, 2, 2, 2], [4, 4, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4]], { cada: 1, feiticos: ['pedra'] });
  const e = { ...e0, descarteCarga: 0, fila: [N(2), N(8), N(8)] };
  const r = jogar(e, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.estado.fim, 'mesaCheia');
  assert.equal(evMonstro(r), undefined);
  assert.ok(presa(r.estado));
});

test('o estado com monstro volta igual do JSON (partida salva)', () => {
  const f = faseDe(40);
  const r = jogarSozinho(f, {}, f.semente + 1, { maxJogadas: 12 });
  const e = r.estado;
  assert.ok(e.monstro);
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e);
  // e o feitico seguinte sai igual
  const a = atacar({ ...e, monstro: { ...e.monstro, conta: 1 } }, [], presa);
  const b = atacar(JSON.parse(JSON.stringify({ ...e, monstro: { ...e.monstro, conta: 1 } })), [], presa);
  assert.deepEqual(a.e, b.e);
});

test('cada fase so usa feiticos ja ensinados e todo chefao fica furioso', () => {
  const ensina = { lodo: 4, pedra: 10, gelo: 18, corrente: 28 };
  for (const f of FASES) {
    if (f.id <= 3) assert.equal(f.monstro, undefined, `fase ${f.id}: tutorial sem ataque`);
    if (!f.monstro) continue;
    for (const ft of f.monstro.feiticos) assert.ok(f.id >= ensina[ft], `fase ${f.id}: ${ft} antes da fase ${ensina[ft]}`);
    if (f.id % 8 === 0) assert.ok(f.monstro.furia && f.monstro.furia.alvos >= 2, `fase ${f.id}: chefao sem furia`);
  }
});

// ------------------------------------------------------------- cadeia

test('cadeia: o Classico comeca no monstro 1, com a vida em pontos', () => {
  const e = criarPartida({}, CLASSICO, 5);
  assert.ok(e.monstro.cadeia);
  assert.equal(e.monstro.nivel, 1);
  assert.equal(e.monstro.vidaMax, vidaDoNivel(1));
  assert.equal(vidaDe(e), 1);
  assert.equal(vidaDe({ ...e, pontos: vidaDoNivel(1) / 4 }), 0.75);
});

test('cadeia: ao zerar, derrotado e o proximo entra cheio, sem feitico e sem levar o dano que sobrou', () => {
  let e = criarPartida({}, CLASSICO, 5);
  e = { ...e, colunas: [[N(256)], [], [], []], fila: [N(256), N(2), N(2)], pontos: vidaDoNivel(1) - 10, monstro: { ...e.monstro, conta: 1 } };
  const r = jogar(e, { tipo: 'colocar', c: 0, t: 0 }); // 256 + 256 = 512 pontos: passa muito da vida
  const ev = r.eventos.find((x) => x.tipo === 'derrotado');
  assert.ok(ev && ev.nivel === 1);
  assert.equal(evMonstro(r), undefined, 'golpe fatal sem feitico');
  assert.equal(r.estado.monstro.nivel, 2);
  assert.equal(r.estado.monstro.derrotados, 1);
  assert.equal(r.estado.monstro.base, r.estado.pontos);
  assert.equal(vidaDe(r.estado), 1);
  assert.equal(r.estado.monstro.conta, r.estado.monstro.cada);
});

test('cadeia: vida cresce, contagem encurta, chefao a cada 5 e feiticos dos reinos visitados', () => {
  for (let n = 1; n < 30; n++) {
    assert.ok(vidaDoNivel(n + 1) > vidaDoNivel(n));
    assert.ok(nivelCadeia(n + 1).cada <= nivelCadeia(n).cada);
    assert.equal(nivelCadeia(n).chefe, n % 5 === 0);
    if (n % 5 === 0) assert.ok(nivelCadeia(n).furia && nivelCadeia(n).furia.alvos === 2);
  }
  const uniq = (n) => [...new Set(nivelCadeia(n).feiticos)].sort();
  assert.deepEqual(uniq(1), ['lodo']);
  assert.deepEqual(uniq(6), ['lodo', 'pedra']);
  assert.deepEqual(uniq(11), ['gelo', 'lodo', 'pedra']);
  assert.deepEqual(uniq(16), ['corrente', 'gelo', 'lodo', 'pedra']);
  assert.deepEqual([nivelCadeia(1).reino, nivelCadeia(6).reino, nivelCadeia(21).reino, nivelCadeia(26).reino], [1, 2, 5, 1]);
  // o reino do Dragao traz todos os feiticos de uma vez
  assert.deepEqual([...new Set(nivelCadeia(1, [5, 1, 2, 3, 4]).feiticos)].sort(), ['corrente', 'gelo', 'lodo', 'pedra']);
});

test('diario: o monstro do dia vem da data e e o mesmo para todos', () => {
  const a = ordemDoDia(sementeDoDia('2026-10-10'));
  assert.deepEqual([...a].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(ordemDoDia(sementeDoDia('2026-10-10')), a);
  const reinos = new Set();
  for (let d = 1; d <= 28; d++) reinos.add(ordemDoDia(sementeDoDia(`2026-11-${String(d).padStart(2, '0')}`))[0]);
  assert.ok(reinos.size >= 4, 'os dias variam o reino');
  const f = faseDiaria('2026-10-10');
  const e = criarPartida({}, f, f.semente);
  assert.equal(e.monstro.reino, a[0]);
  assert.deepEqual(JSON.parse(JSON.stringify(e)), e);
});

test('cadeia: o Classico com o bot derruba monstros e termina', () => {
  const r = jogarSozinho(CLASSICO, {}, 11, { maxJogadas: 400 });
  assert.ok(r.estado.monstro.derrotados >= 5, `derrotados ${r.estado.monstro.derrotados}`);
  assert.ok(r.ataques > 10);
});
