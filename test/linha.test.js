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
