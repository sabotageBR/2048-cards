// Layout cabe na tela em retrato e paisagem, com carta de pelo menos 44 px.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularLayout } from '../src/render/layout.js';

const TELAS = [[360, 640], [360, 780], [390, 844], [640, 360], [844, 390], [836, 470], [1031, 580], [1920, 1080], [768, 1024]];

test('carta >= 44 px e tudo dentro da tela', () => {
  for (const [W, H] of TELAS) for (const colunas of [3, 4, 5]) {
    const L = calcularLayout({ W, H, topo: 72, base: 0, colunas, pilhaMax: 5, tamFila: 3 });
    assert.ok(L.cw >= 44, `${W}x${H} ${colunas} colunas: cw ${L.cw}`);
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
