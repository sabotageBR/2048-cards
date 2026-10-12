// Toda fase tem esquema valido e e passavel pelo bot guloso (>= 82%, >= 78%
// na ultima do mundo). Nenhuma fase e trivial (menos de 5 jogadas na media).
// A dificuldade cresce aos poucos: o jogador casual fica perto da curva
// (alvoCasual) e nenhuma fase cai de repente em relacao a anterior.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FASES, CLASSICO, POR_MUNDO, faseDe, mundoDe, posNoMundo, alvoCasual, FAIXA_CASUAL, QUEDA_MAX } from '../src/jogo/fases.js';
import { TIPOS } from '../src/jogo/metas.js';
import { jogarSozinho, PERFIL_CASUAL } from '../src/jogo/bot.js';

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

test('curva gradual: o jogador casual segue alvoCasual', () => {
  // metade das partidas do simulador (40 por serie): a folga e maior porque a
  // amostra e menor; a regua fina e `npm run simular`
  const N = 40, folga = 4;
  let ant = null;
  for (const f of FASES) {
    let v = 0;
    for (let s = 0; s < N; s++) {
      if (jogarSozinho(f, {}, f.semente + s * 7919, PERFIL_CASUAL).venceu) v++;
      if (jogarSozinho(f, {}, f.semente + s + 1, PERFIL_CASUAL).venceu) v++;
    }
    const casual = Math.round((v / (2 * N)) * 100);
    const alvo = alvoCasual(f.id);
    assert.ok(Math.abs(casual - alvo) <= FAIXA_CASUAL + folga, `fase ${f.id}: casual ${casual}% (alvo ${alvo}%)`);
    if (ant !== null) assert.ok(ant - casual <= QUEDA_MAX + folga, `fase ${f.id}: caiu de ${ant}% para ${casual}%`);
    ant = casual;
  }
});

test('classico roda 300 jogadas sem excecao', () => {
  const r = jogarSozinho(CLASSICO, {}, 11, { maxJogadas: 300 });
  assert.ok(r.jogadas >= 100);
  assert.ok(r.pontos > 0);
});

test('variantes de regra rodam no classico', () => {
  for (const regras of [{ colocacao: 'permissiva' }, { naipes: true }, { filaLivre: true }, { colunas: 3 }, { colunas: 5, pilhaMax: 7 }]) {
    const r = jogarSozinho(CLASSICO, regras, 3, { maxJogadas: 120 });
    assert.ok(r.jogadas >= 20, JSON.stringify(regras) + ' ' + r.fim);
  }
});
