// Os 5 mundos (e o primeiro do mundo sem fim) tem esquema valido e cada nivel
// e passavel pelo bot guloso sem recomecar (>= 82%; 78% no 2048), jogando o
// mundo inteiro numa mesa so, nos dois perfis de mesa do teste A/B. A
// dificuldade cresce aos poucos: o jogador casual fica perto da curva
// (alvoCasual do perfil), nenhum nivel cai de repente em relacao ao anterior e
// nenhum passa do ritmo. Na mesa justa, jogar ao acaso nao passa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MUNDOS, NOVIDADES, FASES, CLASSICO, POR_MUNDO, TOTAL_FASES, PERFIS, faseDe, faseGlobal, mundoDe, posNoMundo, alvoDoNivel,
  pesosDoNivel, especiaisDoNivel, alvoCasual, FAIXA_CASUAL, QUEDA_MAX, ritmoMax, mundoDef, mundoDoPerfil, escadaDoMundo,
  ACASO_MAX, DISTRAIDO_MAX,
} from '../src/jogo/fases.js';
import { jogarMundo, jogarSozinho, melhorJogada, PERFIL_CASUAL, PERFIL_ACASO, PERFIL_DISTRAIDO } from '../src/jogo/bot.js';
import { criarPartida, jogar } from '../src/jogo/partida.js';
import { ESPECIAIS } from '../src/jogo/baralho.js';

const SEMENTES = 25;
/** Os mundos medidos: os 5 curados e o primeiro do mundo sem fim. */
const MEDIDOS = [...MUNDOS.map((m) => m.id), MUNDOS.length + 1];

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
    for (const perfil of PERFIS) {
      const d = mundoDoPerfil(m, perfil);
      for (let n = 1; n <= POR_MUNDO; n++) {
        const vs = Object.keys(pesosDoNivel(d, n)).map(Number);
        assert.ok(vs.length >= 2 && Math.min(...vs) >= 2 && Math.max(...vs) < alvoDoNivel(n), `${perfil} mundo ${m.id} nivel ${n}: ${vs}`);
      }
    }
    // a mesa justa so mexe do nivel 4 em diante (nenhuma derrota nos primeiros minutos)
    for (const n of Object.keys((m.justa || {}).niveis || {})) assert.ok(Number(n) >= 4, `mundo ${m.id}: a mesa justa mexe no nivel ${n}`);
    if (m.fila) assert.ok(m.fila.length <= 3, `mundo ${m.id}: a fila roteirizada tem ${m.fila.length} cartas`);
  });
  assert.deepEqual(especiaisDoNivel(MUNDOS[0], 1), {}, 'o nivel 1 do mundo 1 e so cartas');
  assert.ok(especiaisDoNivel(MUNDOS[0], 2).coringa > 0, 'o coringa do mundo 1 entra no nivel 2');
  assert.ok(!especiaisDoNivel(MUNDOS[0], 3).bomba && especiaisDoNivel(MUNDOS[0], 4).bomba > 0, 'a bomba do mundo 1 entra no nivel 4');
  for (let N = 1; N <= TOTAL_FASES + 2 * POR_MUNDO; N++) {
    const f = faseDe(N);
    assert.equal(f.id, N);
    assert.equal(f.mundo, mundoDe(N));
    assert.equal(faseGlobal(mundoDe(N), posNoMundo(N)), N);
    assert.equal(f.escada.length, POR_MUNDO);
  }
  // o mundo sem fim: todas as cartas, 4 colunas, descarte de 2 lugares
  const m6 = mundoDef(6), m7 = mundoDef(7);
  assert.equal(m6.id, 6);
  assert.notEqual(m6.semente, m7.semente);
  assert.deepEqual(Object.keys(especiaisDoNivel(m6, 1)).sort(), [...ESPECIAIS].sort());
  assert.equal(faseDe(41).regras.descarteMax, 2);
  assert.equal(CLASSICO.metas.length, 0);
});

test('mesa de hoje igual a da 0.4.4 e niveis 1 a 3 iguais nos dois perfis', () => {
  for (const m of MUNDOS) {
    const hoje = escadaDoMundo(mundoDoPerfil(m, 'mesa-hoje'));
    const justa = escadaDoMundo(mundoDoPerfil(m, 'mesa-justa'));
    assert.deepEqual(hoje, escadaDoMundo(m), `mundo ${m.id}: a mesa de hoje mudou`);
    for (const d of hoje) assert.ok(d.descarte === undefined && d.secas === undefined, `mundo ${m.id}: a mesa de hoje troca descarte ou piedade`);
    for (let n = 0; n < 3; n++) assert.deepEqual(justa[n], hoje[n], `mundo ${m.id} nivel ${n + 1}: os perfis diferem`);
  }
  assert.equal(faseDe(5, 0, 'mesa-justa').perfil, 'mesa-justa');
  assert.equal(faseDe(5, 0, 'outro').perfil, 'mesa-hoje');
});

/**
 * Joga o mundo m com `n` sementes (`semente + s`) e devolve, por nivel, em
 * quantas partidas que chegaram a ele (%) o nivel foi passado sem recomecar
 * e as jogadas (mediana).
 */
function medir(m, n, op = {}, desloc = 0) {
  const def = mundoDef(m);
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

/** Os perfis que o mundo m tem (o mundo sem fim e igual nos dois). */
const perfisDe = (m) => (m > MUNDOS.length ? [PERFIS[0]] : PERFIS);

test('o guloso passa cada nivel sem recomecar, nos dois perfis', () => {
  for (const m of MEDIDOS) for (const perfil of perfisDe(m)) {
    medir(m, SEMENTES, { perfil }).forEach((nv, k) => {
      assert.ok(nv.chegaram > 0, `${perfil} mundo ${m}: o guloso nao chega ao nivel ${k + 1}`);
      const piso = k + 1 === POR_MUNDO ? 78 : 82;
      assert.ok(nv.pct >= piso, `${perfil} fase ${faseGlobal(m, k + 1)}: ${nv.pct.toFixed(0)}% sem recomecar (piso ${piso}%)`);
    });
  }
});

test('curva gradual: o jogador casual segue alvoCasual e o ritmo, nos dois perfis', () => {
  // metade das partidas do simulador (40 por serie): a folga e maior porque a
  // amostra e menor; a regua fina e `npm run simular`
  const N = 40, folga = 4;
  for (const m of MEDIDOS) for (const perfil of perfisDe(m)) {
    const a = medir(m, N, { ...PERFIL_CASUAL, perfil }), b = medir(m, N, { ...PERFIL_CASUAL, perfil }, 104729);
    let ant = null;
    for (let k = 0; k < POR_MUNDO; k++) {
      const F = faseGlobal(m, k + 1);
      const casual = Math.round((a[k].pct + b[k].pct) / 2);
      const alvo = alvoCasual(F, perfil);
      assert.ok(Math.abs(casual - alvo) <= FAIXA_CASUAL + folga, `${perfil} fase ${F}: casual ${casual}% (alvo ${alvo}%)`);
      if (ant !== null) assert.ok(ant - casual <= QUEDA_MAX + folga, `${perfil} fase ${F}: caiu de ${ant}% para ${casual}%`);
      const jog = Math.max(a[k].jogadas, b[k].jogadas);
      assert.ok(jog <= ritmoMax(F) * 1.15, `${perfil} fase ${F}: ${jog} jogadas (ritmo ${ritmoMax(F)})`);
      ant = casual;
    }
  }
});

test('mesa justa: jogar ao acaso nao passa e o casual ve a mesa encher', () => {
  const n = 60, folga = 5;
  for (const m of MUNDOS) {
    let acaso = 0, distraido = 0;
    for (let s = 1; s <= n; s++) {
      const sem = m.semente + s * 104729 + 13;
      if (jogarMundo(m.id, sem, { ...PERFIL_ACASO, perfil: 'mesa-justa', maxRecomecos: 0 }).niveis[4].passou) acaso++;
      if (jogarMundo(m.id, sem, { ...PERFIL_DISTRAIDO, perfil: 'mesa-justa', maxRecomecos: 0 }).completou) distraido++;
    }
    assert.ok((acaso / n) * 100 <= ACASO_MAX + folga, `mundo ${m.id}: o acaso passa o nivel 5 em ${Math.round((acaso / n) * 100)}%`);
    assert.ok((distraido / n) * 100 <= DISTRAIDO_MAX + folga, `mundo ${m.id}: o distraido fecha o mundo em ${Math.round((distraido / n) * 100)}%`);
  }
  // o casual ve de 0,8 a 2,5 mesas cheias por mundo (o "Continuar" gratis salva); na mesa de hoje, bem menos no mundo 1
  const cheias = (m, perfil) => {
    let c = 0;
    for (let s = 1; s <= 40; s++) c += jogarMundo(m, mundoDef(m).semente + s * 7919, { ...PERFIL_CASUAL, perfil }).niveis.reduce((a, nv) => a + nv.cheias, 0);
    return c / 40;
  };
  for (const m of [1, 2, 3, 4]) {
    const c = cheias(m, 'mesa-justa');
    assert.ok(c >= 0.8 && c <= 2.5, `mundo ${m}: o casual ve ${c.toFixed(2)} mesas cheias na mesa justa`);
  }
  assert.ok(cheias(1, 'mesa-hoje') < 0.6, 'a mesa de hoje do mundo 1 quase nunca enche');
});

/**
 * Entrada do mundo m (nivel 1, primeira tentativa) jogada pela mao de ajuda
 * (o guloso, sem itens: a mao nunca mostra item): devolve as jogadas ate sair
 * do nivel 1, se a carta nova foi jogada numa coluna e se houve cascata (um
 * degrau >= 2) ou salto de nivel (o x4 no 8 faz o 32 e sobe dois).
 */
function entrada(m) {
  const f = faseDe(faseGlobal(m, 1));
  let e = criarPartida({}, f, f.semente);
  const nova = MUNDOS[m - 1].novidades[0].tipo;
  const naFrente = e.fila.slice(0, 2).some((k) => k.tipo === nova);
  let jogadas = 0, grande = false, jogouNova = false;
  while (jogadas < 4 && e.nivel === 1 && !e.fim) {
    const a = melhorJogada(e, jogadas * 900);
    if (!a) break;
    if (e.fila[0].tipo === nova) jogouNova = a.tipo === 'colocar';
    const r = jogar(e, { ...a, t: jogadas * 900 });
    if (r.eventos.some((ev) => ev.tipo === 'fundir' && ev.degrau >= 2) || r.eventos.filter((ev) => ev.tipo === 'nivel').length >= 2) grande = true;
    e = r.estado;
    jogadas++;
  }
  return { naFrente, jogadas, nivel: e.nivel, grande, jogouNova };
}

test('entrada dos mundos 2 e 3: a carta nova chega a frente e faz o 16 em cascata', () => {
  for (const m of [2, 3]) {
    const r = entrada(m);
    assert.ok(r.naFrente, `mundo ${m}: a carta nova nao esta nas 2 primeiras da fila`);
    assert.ok(r.jogouNova, `mundo ${m}: a mao nao joga a carta nova numa coluna`);
    assert.ok(r.nivel >= 2 && r.jogadas <= 3, `mundo ${m}: ${r.jogadas} jogadas, nivel ${r.nivel}`);
    assert.ok(r.grande, `mundo ${m}: sem cascata nem salto de nivel`);
    // o recomeco do nivel 1 nao repete o roteiro
    assert.equal(faseDe(faseGlobal(m, 1), 1).fila, undefined);
    assert.equal(faseDe(faseGlobal(m, 2)).fila, undefined);
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
