// Toda fase tem esquema valido e e passavel pelo bot guloso (>= 82%, >= 78%
// na ultima do mundo). Nenhuma fase e trivial (menos de 5 jogadas na media).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FASES, CLASSICO, POR_MUNDO, faseDe, mundoDe, posNoMundo } from '../src/jogo/fases.js';
import { TIPOS } from '../src/jogo/metas.js';
import { jogarSozinho } from '../src/jogo/bot.js';

const SEMENTES = 25;

test('esquema das fases', () => {
  FASES.forEach((f, i) => {
    assert.equal(f.id, i + 1);
    assert.equal(f.mundo, mundoDe(f.id));
    assert.ok(f.metas.length >= 1 && f.metas.length <= 2, `fase ${f.id}: 1 ou 2 metas`);
    for (const m of f.metas) assert.ok(TIPOS.includes(m.tipo), `fase ${f.id}: meta ${m.tipo}`);
    assert.ok(Array.isArray(f.estrelas) && f.estrelas.length === 3);
    assert.ok(Number.isInteger(f.semente));
    if (f.baralho.total !== Infinity) assert.ok(f.baralho.total >= 10);
  });
  assert.equal(faseDe(1).id, 1);
  assert.equal(posNoMundo(POR_MUNDO + 1), 1);
  assert.equal(CLASSICO.metas.length, 0);
});

test('bot passa cada fase do mundo 1', () => {
  for (const f of FASES) {
    let v = 0, jog = 0;
    for (let s = 1; s <= SEMENTES; s++) {
      const r = jogarSozinho(f, {}, f.semente + s);
      if (r.venceu) v++;
      jog += r.jogadas;
    }
    const piso = posNoMundo(f.id) === POR_MUNDO ? 0.78 : 0.82;
    assert.ok(v / SEMENTES >= piso, `fase ${f.id}: ${v}/${SEMENTES} vitorias (piso ${piso})`);
    assert.ok(jog / SEMENTES >= 5, `fase ${f.id}: trivial (${(jog / SEMENTES).toFixed(1)} jogadas)`);
  }
});

test('classico roda 300 jogadas sem excecao', () => {
  const r = jogarSozinho(CLASSICO, {}, 11, { maxJogadas: 300 });
  assert.ok(r.jogadas >= 100);
  assert.ok(r.pontos > 0);
});

test('variantes de regra rodam no classico', () => {
  for (const regras of [{ colocacao: 'permissiva' }, { naipes: true }, { filaLivre: true }, { colunas: 3 }, { colunas: 5, pilhaMax: 6 }]) {
    const r = jogarSozinho(CLASSICO, regras, 3, { maxJogadas: 120 });
    assert.ok(r.jogadas >= 20, JSON.stringify(regras) + ' ' + r.fim);
  }
});
