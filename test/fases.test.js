// Os 5 mundos tem esquema valido e cada nivel e passavel pelo bot guloso sem
// recomecar (>= 82%; 78% no 2048), jogando o mundo inteiro numa mesa so. A dificuldade
// cresce aos poucos: o jogador casual fica perto da curva (alvoCasual), nenhum
// nivel cai de repente em relacao ao anterior e nenhum passa do ritmo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MUNDOS, NOVIDADES, FASES, CLASSICO, POR_MUNDO, TOTAL_FASES, faseDe, faseGlobal, mundoDe, posNoMundo, alvoDoNivel,
  pesosDoNivel, especiaisDoNivel, alvoCasual, FAIXA_CASUAL, QUEDA_MAX, ritmoMax,
} from '../src/jogo/fases.js';
import { jogarMundo, jogarSozinho, melhorJogada, PERFIL_CASUAL } from '../src/jogo/bot.js';
import { criarPartida, jogar } from '../src/jogo/partida.js';
import { ESPECIAIS } from '../src/jogo/baralho.js';

const SEMENTES = 25;

test('esquema dos mundos', () => {
  assert.equal(TOTAL_FASES, 40);
  assert.equal(FASES.length, TOTAL_FASES);
  MUNDOS.forEach((m, i) => {
    assert.equal(m.id, i + 1);
    assert.ok(Number.isInteger(m.semente));
    assert.ok(m.novidades.length >= 1, `mundo ${m.id}: sem novidade`);
    for (const nv of m.novidades) {
      assert.ok(NOVIDADES.includes(nv.tipo), `mundo ${m.id}: novidade ${nv.tipo}`);
      if (ESPECIAIS.includes(nv.tipo)) assert.equal(m.especiais[nv.tipo].de, nv.nivel, `mundo ${m.id}: a novidade ${nv.tipo} entra no nivel em que a carta entra`);
    }
    for (const t of Object.keys(m.especiais)) assert.ok(ESPECIAIS.includes(t), `mundo ${m.id}: especial ${t}`);
    for (let n = 1; n <= POR_MUNDO; n++) {
      const vs = Object.keys(pesosDoNivel(m, n)).map(Number);
      assert.ok(vs.length >= 2 && Math.min(...vs) >= 2 && Math.max(...vs) < alvoDoNivel(n), `mundo ${m.id} nivel ${n}: ${vs}`);
    }
  });
  assert.deepEqual(especiaisDoNivel(MUNDOS[0], 1), {}, 'o nivel 1 do mundo 1 e so cartas');
  assert.ok(especiaisDoNivel(MUNDOS[0], 2).coringa > 0, 'o coringa do mundo 1 entra no nivel 2');
  assert.ok(!especiaisDoNivel(MUNDOS[0], 3).bomba && especiaisDoNivel(MUNDOS[0], 4).bomba > 0, 'a bomba do mundo 1 entra no nivel 4');
  for (let N = 1; N <= TOTAL_FASES; N++) {
    const f = faseDe(N);
    assert.equal(f.id, N);
    assert.equal(faseGlobal(mundoDe(N), posNoMundo(N)), N);
    assert.equal(f.escada.length, POR_MUNDO);
  }
  assert.equal(CLASSICO.metas.length, 0);
});

/**
 * Joga o mundo m com `n` sementes (`semente + s`) e devolve, por nivel, em
 * quantas partidas que chegaram a ele (%) o nivel foi passado sem recomecar
 * e as jogadas (mediana).
 */
function medir(m, n, op = {}, desloc = 0) {
  const def = MUNDOS[m - 1];
  const runs = [];
  for (let s = 1; s <= n; s++) runs.push(jogarMundo(m, def.semente + s + desloc, op));
  return Array.from({ length: POR_MUNDO }, (_, k) => {
    const ch = runs.filter((r) => r.niveis[k].chegou);
    const ok = ch.filter((r) => r.niveis[k].passou && r.niveis[k].recomecos === 0).length;
    const jog = ch.map((r) => r.niveis[k].jogadas).sort((a, b) => a - b);
    return { pct: ch.length ? (ok / ch.length) * 100 : 0, jogadas: jog[Math.floor(jog.length / 2)] || 0, chegaram: ch.length };
  });
}

/**
 * Joga a fase com o guloso (a mao de ajuda) ate sair do nivel 1 ou esgotar
 * `max` jogadas. Devolve { jogadas, nivel, degrau } (o maior degrau de cascata).
 */
function abertura(tentativa, max) {
  const f = faseDe(1, tentativa);
  let e = criarPartida({}, f, f.semente);
  let jogadas = 0, degrau = 0;
  while (jogadas < max && e.nivel === 1 && !e.fim) {
    const a = melhorJogada(e, jogadas * 900);
    if (!a) break;
    const r = jogar(e, { ...a, t: jogadas * 900 });
    for (const ev of r.eventos) if (ev.tipo === 'fundir') degrau = Math.max(degrau, ev.degrau);
    e = r.estado;
    jogadas++;
  }
  return { jogadas, nivel: e.nivel, degrau };
}

test('abertura do mundo 1: a mao de ajuda faz o 16 em 3 jogadas com cascata', () => {
  // a primeira entrada e roteirizada (semente fixa): igual funde, menor sob a maior, a fusao encadeia
  const a = abertura(0, 3);
  assert.equal(a.nivel, 2, `fechou em ${a.jogadas} jogadas`);
  assert.equal(a.jogadas, 3);
  assert.ok(a.degrau >= 2, 'a ultima jogada cascateia');
  // recomecos do nivel 1 (semente nova): ainda curtos
  for (let t = 1; t <= 4; t++) {
    const r = abertura(t, 5);
    assert.equal(r.nivel, 2, `recomeco ${t}: ${r.jogadas} jogadas sem fechar o 16`);
  }
});

test('o guloso passa cada nivel sem recomecar', () => {
  for (const m of MUNDOS) {
    medir(m.id, SEMENTES).forEach((nv, k) => {
      assert.ok(nv.chegaram > 0, `mundo ${m.id}: o guloso nao chega ao nivel ${k + 1}`);
      const piso = k + 1 === POR_MUNDO ? 78 : 82;
      assert.ok(nv.pct >= piso, `fase ${faseGlobal(m.id, k + 1)}: ${nv.pct.toFixed(0)}% sem recomecar (piso ${piso}%)`);
    });
  }
});

test('curva gradual: o jogador casual segue alvoCasual e o ritmo', () => {
  // metade das partidas do simulador (40 por serie): a folga e maior porque a
  // amostra e menor; a regua fina e `npm run simular`
  const N = 40, folga = 4;
  for (const m of MUNDOS) {
    const a = medir(m.id, N, PERFIL_CASUAL), b = medir(m.id, N, PERFIL_CASUAL, 104729);
    let ant = null;
    for (let k = 0; k < POR_MUNDO; k++) {
      const F = faseGlobal(m.id, k + 1);
      const casual = Math.round((a[k].pct + b[k].pct) / 2);
      const alvo = alvoCasual(F);
      assert.ok(Math.abs(casual - alvo) <= FAIXA_CASUAL + folga, `fase ${F}: casual ${casual}% (alvo ${alvo}%)`);
      if (ant !== null) assert.ok(ant - casual <= QUEDA_MAX + folga, `fase ${F}: caiu de ${ant}% para ${casual}%`);
      const jog = Math.max(a[k].jogadas, b[k].jogadas);
      assert.ok(jog <= ritmoMax(F) * 1.15, `fase ${F}: ${jog} jogadas (ritmo ${ritmoMax(F)})`);
      ant = casual;
    }
  }
});

test('classico roda 300 jogadas sem excecao', () => {
  const r = jogarSozinho(CLASSICO, {}, 11, { maxJogadas: 300 });
  assert.ok(r.jogadas >= 100);
  assert.ok(r.pontos > 0);
});

test('variantes de regra rodam no classico', () => {
  for (const regras of [{ colocacao: 'permissiva' }, { filaLivre: true }, { colunas: 3 }, { colunas: 5, pilhaMax: 7 }]) {
    const r = jogarSozinho(CLASSICO, regras, 3, { maxJogadas: 120 });
    assert.ok(r.jogadas >= 20, JSON.stringify(regras) + ' ' + r.fim);
  }
});
