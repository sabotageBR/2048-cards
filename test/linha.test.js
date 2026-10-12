// Linha do tempo: a carta que completa o monte sai da mesa com o valor do teto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLinha } from '../src/render/linha.js';
import { calcularLayout } from '../src/render/layout.js';
import { criarPartida, jogar } from '../src/jogo/partida.js';

test('fantasma do monte completo mostra 2048 ao sair (nao o valor antigo)', () => {
  const fase = { id: 1, mundo: 1, semente: 1, baralho: { pesos: { 2: 1 }, total: 20, dinamico: false }, inicio: [[1024, 512, 256, 128], [], [], []], metas: [{ tipo: 'montes', n: 2 }] };
  const antes = { ...criarPartida({}, fase, 1), fila: [{ id: 900, tipo: 'normal', v: 128, cor: 0 }] };
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

test('feitico do monstro: a mesa mostrada e a de antes ate o impacto; acelerar aplica na hora', () => {
  const fase = { id: 1, mundo: 1, semente: 1, baralho: { pesos: { 2: 1 }, total: 20, dinamico: false }, inicio: [[64], [], [], []], metas: [{ tipo: 'pontos', alvo: 9999 }], monstro: { cada: 1, feiticos: ['pedra'] } };
  const antes = criarPartida({}, fase, 1);
  const r = jogar(antes, { tipo: 'colocar', c: 1, t: 0 });
  assert.ok(r.meio, 'houve feitico');
  const L = calcularLayout({ W: 390, H: 844, topo: 112, colunas: 4, pilhaMax: 6, tamFila: 3, arena: true });
  const linha = criarLinha();
  linha.montar(r.eventos, L, 0, { antes, depois: r.estado, meio: r.meio, origem: L.filaPos(0), carta: antes.fila[0] });
  const efs = linha.drenarEfeitos(5000);
  const imp = efs.find((e) => e.tipo === 'impacto');
  assert.ok(imp && efs.some((e) => e.tipo === 'feitico') && efs.some((e) => e.tipo === 'projetil'));
  assert.equal(linha.visivel(r.estado, 0), r.meio);
  assert.equal(linha.visivel(r.estado, imp.t - 1), r.meio);
  assert.equal(linha.visivel(r.estado, imp.t), r.estado);
  assert.ok(linha.fim >= imp.t);
  // a carta que subiu de altura desliza depois do impacto
  const alvo = r.eventos.find((e) => e.tipo === 'monstro').alvos[0];
  const subiu = r.estado.colunas[alvo.c][1];
  if (subiu) {
    const p = linha.pose(subiu.id, imp.t + 40);
    assert.ok(p && p.x !== undefined, 'desliza');
  }
  // estado trocado (desfazer, jogada nova): nada de mesa antiga
  assert.equal(linha.visivel({ ...r.estado, colunas: r.estado.colunas.slice() }, 0).colunas !== r.meio.colunas, true);
  linha.acelerar(10);
  assert.equal(linha.visivel(r.estado, 10), r.estado);
  assert.equal(linha.feiticoPendente(10), false);
});

test('golpe final: a barra so desce quando o golpe chega e o monstro cai no ultimo da cascata', async () => {
  const { criarDuelo } = await import('../src/render/duelo.js');
  const { vidaDe } = await import('../src/jogo/metas.js');
  const fase = { id: 1, mundo: 1, semente: 1, baralho: { pesos: { 2: 1 }, total: 20, dinamico: false }, inicio: [[32, 16, 8], [], [], []], metas: [{ tipo: 'cartas', v: 64, n: 1 }] };
  const antes = { ...criarPartida({}, fase, 1), fila: [{ id: 900, tipo: 'normal', v: 8, cor: 0 }] };
  const r = jogar(antes, { tipo: 'colocar', c: 0, t: 0 }); // 8+8, 16+16, 32+32: vence no 3o degrau
  assert.equal(r.estado.fim, 'venceu');
  const L = calcularLayout({ W: 390, H: 844, topo: 112, colunas: 4, pilhaMax: 6, tamFila: 3, arena: true });
  const linha = criarLinha();
  // o ultimo golpe saiu ha muito tempo: a salvaguarda (bomba, martelo) nao pode adiantar a queda
  const t0 = 5000;
  linha.montar(r.eventos, L, t0, { antes, depois: r.estado, origem: L.filaPos(0), carta: antes.fila[0] });
  const duelo = criarDuelo();
  const vida0 = vidaDe(antes);
  duelo.novaBatalha(null, vida0);
  const P = { add() {}, texto() {}, estourar() {}, anel() {}, subir() {} };
  const golpes = [], hps = [];
  let derrota = -1;
  for (let t = t0; t <= t0 + 2500; t += 16) {
    for (const fx of linha.drenarEfeitos(t)) if (fx.tipo === 'fusao' || fx.tipo === 'completar') duelo.golpear(fx, t, P, L.monstro);
    for (const o of duelo.atualizar(0.016, t, vidaDe(r.estado), P, L.monstro, {}, linha.golpesPorVir())) {
      if (o.tipo === 'golpe') golpes.push(t);
      if (o.tipo === 'derrotado') derrota = t;
    }
    hps.push({ t, hp: duelo.hp });
  }
  assert.equal(golpes.length, 3);
  assert.ok(hps.filter((h) => h.t < golpes[0]).every((h) => h.hp === vida0), 'nada desce antes do primeiro golpe');
  for (let i = 0; i < 2; i++) {
    const depois = hps.find((h) => h.t === golpes[i]).hp;
    assert.ok(depois > 0.001, `o golpe ${i + 1} ainda deixa vida (${depois})`);
  }
  assert.equal(derrota, golpes[2], 'cai no ultimo golpe');
});
