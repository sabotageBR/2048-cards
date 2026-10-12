// Layout cabe na tela em retrato e paisagem, com carta de pelo menos 44 px.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularLayout } from '../src/render/layout.js';

const TELAS = [[360, 640], [360, 780], [390, 844], [640, 360], [844, 390], [836, 470], [1031, 580], [1920, 1080], [768, 1024]];

test('carta >= 44 px e tudo dentro da tela', () => {
  // pilha 6 e o padrao; 5 colunas x 7 e a fase 34
  for (const [W, H] of TELAS) for (const [colunas, pilhaMax] of [[3, 6], [4, 6], [5, 6], [5, 7]]) {
    const L = calcularLayout({ W, H, topo: 72, base: 0, colunas, pilhaMax, tamFila: 3 });
    assert.ok(L.cw >= 44, `${W}x${H} ${colunas}x${pilhaMax}: cw ${L.cw}`);
    assert.ok(L.mesa.x >= 0 && L.mesa.x + L.mesa.w <= W + 1, `${W}x${H} ${colunas}: mesa larga`);
    assert.ok(L.mesa.y >= 72 && L.mesa.y + L.mesa.h <= H + 1, `${W}x${H} ${colunas}: mesa alta (${L.mesa.y}+${L.mesa.h})`);
    for (let k = 0; k < 3; k++) {
      const p = L.filaPos(k);
      assert.ok(p.x >= 0 && p.x + p.w <= W + 1 && p.y + p.h <= H + 1, `${W}x${H} ${colunas}: fila ${k} fora`);
    }
    const d = L.descarte;
    assert.ok(d.x >= 0 && d.x + d.w <= W + 1 && d.y + d.h <= H + 1, `${W}x${H} ${colunas}: descarte fora`);
    // fila nao sobrepoe a mesa
    const f = L.filaPos(0);
    const cruza = f.x < L.mesa.x + L.mesa.w && f.x + f.w > L.mesa.x && f.y < L.mesa.y + L.mesa.h && f.y + f.h > L.mesa.y;
    assert.ok(!cruza, `${W}x${H} ${colunas}: fila sobre a mesa`);
    assert.equal(L.colunaEm(L.carta(colunas - 1, 0).x + 2, L.mesa.y + 10), colunas - 1);
    assert.equal(L.colunaEm(-5, -5), -1);
    assert.equal(L.filaEm(f.x + 3, f.y + 3), 0);
  }
});

test('arena do duelo: o monstro cabe acima (retrato) ou ao lado (paisagem) da mesa', () => {
  for (const [W, H] of TELAS) for (const [colunas, pilhaMax] of [[4, 6], [5, 6], [5, 7]]) {
    const retrato = H >= W * 0.95;
    const topo = retrato ? 112 : 92;
    const L = calcularLayout({ W, H, topo, base: 0, colunas, pilhaMax, tamFila: 3, arena: true });
    const m = L.monstro;
    const nome = `${W}x${H} ${colunas}x${pilhaMax}`;
    assert.ok(L.cw >= 44, `${nome}: cw ${L.cw}`);
    assert.ok(m && m.R >= 28, `${nome}: monstro`);
    // caixa do monstro: chifres a 2.1R acima dos pes, corpo +-1.15R
    assert.ok(m.y - m.R * 2.1 >= topo - 2, `${nome}: monstro sob o HUD (${m.y - m.R * 2.1} < ${topo})`);
    assert.ok(m.x - m.R * 1.15 >= -2 && m.x + m.R * 1.15 <= W + 2, `${nome}: monstro fora da tela`);
    if (retrato) assert.ok(m.y <= L.mesa.y + 2, `${nome}: pes do monstro dentro da mesa`);
    else assert.ok(m.x + m.R * 1.15 <= L.mesa.x + 2, `${nome}: monstro sobre a mesa`);
    assert.ok(L.mesa.y + L.mesa.h <= H + 1 && L.mesa.x + L.mesa.w <= W + 1, `${nome}: mesa fora`);
    const f = L.filaPos(L.tamFila - 1);
    assert.ok(f.x + f.w <= W + 1 && f.y + f.h <= H + 1, `${nome}: fila fora`);
  }
});
