// Linha do tempo: a carta que completa o monte sai da mesa com o valor do
// teto; na subida de nivel as cartas pequenas sobem e somem depois da cascata
// e a pilha do descarte sai; a jogada recusada mostra o proibido.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLinha } from '../src/render/linha.js';
import { calcularLayout } from '../src/render/layout.js';
import { criarPartida, jogar } from '../src/jogo/partida.js';

test('fantasma do monte completo mostra 2048 ao sair (nao o valor antigo)', () => {
  const fase = { id: 1, mundo: 1, semente: 1, baralho: { pesos: { 2: 1 }, total: 20, dinamico: false }, inicio: [[1024, 512, 256, 128], [], [], []], metas: [{ tipo: 'montes', n: 2 }] };
  const antes = { ...criarPartida({}, fase, 1), fila: [{ id: 900, tipo: 'normal', v: 128 }] };
  const r = jogar(antes, { tipo: 'colocar', c: 0, t: 0 });
  const ev = r.eventos.find((e) => e.tipo === 'completar');
  assert.ok(ev, 'a jogada completa o monte');
  const L = calcularLayout({ W: 390, H: 844, topo: 72, colunas: 4, pilhaMax: 5, tamFila: 3 });
  const linha = criarLinha();
  linha.montar(r.eventos, L, 0, { antes, depois: r.estado, origem: L.filaPos(0), carta: antes.fila[0] });
  // depois do ultimo degrau a carta esta saindo: tem que mostrar o valor completado
  const vistos = [];
  for (let t = 0; t <= 2000; t += 10) {
    const g = linha.fantasmas(t).find((f) => f.carta.id === ev.id);
    if (g) vistos.push(g.carta.v);
  }
  assert.ok(vistos.length > 0, 'o fantasma do monte aparece');
  assert.equal(vistos[vistos.length - 1], ev.valor);
  // e antes da cascata chegar nele ainda mostra o valor de antes
  assert.equal(vistos[0], 1024);
});

test('subida de nivel: as cartas abaixo do piso saem depois da cascata, uma de cada vez', async () => {
  const { faseDe, faseGlobal } = await import('../src/jogo/fases.js');
  // nivel 5 (256) do mundo 2 (baralho do alvo/8): o 8 jogado fecha o 256; o baralho do 512 comeca no 4 e os 2 saem
  const f = { ...faseDe(faseGlobal(2, 5)), inicio: [[128, 64, 32, 16, 8], [2], [4, 2], []] };
  const antes = { ...criarPartida({}, f, 1), fila: [{ id: 900, tipo: 'normal', v: 8 }] };
  const r = jogar(antes, { tipo: 'colocar', c: 0, t: 0 });
  const g = r.eventos.find((e) => e.tipo === 'graduar');
  assert.ok(g && g.cartas.length === 2, 'duas cartas saem');
  const L = calcularLayout({ W: 390, H: 844, topo: 72, colunas: 4, pilhaMax: 6, tamFila: 3 });
  const linha = criarLinha();
  linha.montar(r.eventos, L, 0, { antes, depois: r.estado, origem: L.filaPos(0), carta: antes.fila[0] });
  const fimCascata = 180 + 5 * 140;
  for (const k of g.cartas) {
    // parada no lugar durante a cascata, depois sobe e some
    const cedo = linha.fantasmas(fimCascata - 50).find((x) => x.carta.id === k.id);
    assert.ok(cedo && cedo.alpha === 1, `a carta ${k.id} espera a cascata`);
    assert.ok(!linha.fantasmas(4000).some((x) => x.carta.id === k.id), `a carta ${k.id} some`);
  }
  const efeitos = linha.drenarEfeitos(5000).filter((e) => e.tipo === 'graduar');
  assert.equal(efeitos.length, 2);
  assert.ok(efeitos[1].t > efeitos[0].t, 'uma de cada vez');
  assert.ok(efeitos[0].t >= fimCascata, 'depois da cascata');
});

test('recusa mostra o proibido na coluna; a pilha do descarte sai na subida de nivel', async () => {
  const { faseDe, faseGlobal } = await import('../src/jogo/fases.js');
  const L = calcularLayout({ W: 390, H: 844, topo: 72, colunas: 4, pilhaMax: 6, tamFila: 3 });
  // dobro sobre o topo que ja recebeu um especial: recusa (usada) e o proibido na coluna 0
  const f = { ...faseDe(faseGlobal(3, 2)), inicio: [[16], [], [], []] };
  const e0 = criarPartida({}, f, 1);
  const antes = { ...e0, colunas: [[{ id: 1, tipo: 'normal', v: 16, esp: true }], [], [], []], fila: [{ id: 900, tipo: 'dobro', v: 0 }, ...e0.fila.slice(1)] };
  const r = jogar(antes, { tipo: 'colocar', c: 0, t: 0 });
  assert.equal(r.eventos[0].motivo, 'usada');
  const linha = criarLinha();
  linha.montar(r.eventos, L, 1000, { antes, depois: r.estado });
  assert.deepEqual(linha.proibidos(1100).map((p) => p.c), [0]);
  assert.equal(linha.proibidos(1000 + 700).length, 0, 'o proibido some');
  // descarte com uma carta e a subida de nivel: o fantasma da carta de cima sai
  const g = { ...faseDe(faseGlobal(1, 1)), inicio: [[8], [], [4], []] };
  let e = { ...criarPartida({}, g, 3), fila: [2, 8, 2].map((v, k) => ({ id: 950 + k, tipo: 'normal', v })) };
  e = jogar(e, { tipo: 'descartar', t: 0 }).estado;
  const s = jogar(e, { tipo: 'colocar', c: 0, t: 0 });
  const vazio = s.eventos.find((ev) => ev.tipo === 'descarteVazio');
  assert.ok(vazio && vazio.id === 950);
  const l2 = criarLinha();
  l2.montar(s.eventos, L, 0, { antes: e, depois: s.estado });
  const visto = [];
  for (let t = 0; t <= 1500; t += 20) if (l2.fantasmas(t).some((x) => x.carta.id === 950)) visto.push(t);
  assert.ok(visto.length > 0, 'a carta do descarte aparece saindo');
});
