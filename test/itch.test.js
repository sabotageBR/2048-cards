// O adaptador da itch.io, sem navegador: nenhum SDK, nenhum anuncio, idioma do navegador e a
// pausa do protocolo como nos outros portais.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPortalItch } from '../portais/itch.js';

/** Janela falsa: so registra os ouvintes e dispara na mao. */
function janelaFalsa() {
  /** @type {Record<string, Function[]>} */
  const ouv = {};
  const alvo = (/** @type {string} */ prefixo) => ({
    addEventListener(/** @type {string} */ n, /** @type {Function} */ f) { (ouv[prefixo + n] ||= []).push(f); },
  });
  return {
    ...alvo(''),
    document: { ...alvo('doc:'), hidden: false },
    disparar(/** @type {string} */ n) { for (const f of ouv[n] || []) f({}); },
  };
}

async function montar() {
  /** @type {Set<number>} */
  const timers = new Set();
  let seq = 0;
  const janela = janelaFalsa();
  const p = criarPortalItch({ janela, agendar: () => { timers.add(++seq); return seq; }, cancelar: (id) => { timers.delete(id); } });
  /** @type {boolean[]} */
  const pausas = [];
  /** @type {boolean[]} */
  const anuncios = [];
  /** @type {string[]} */
  const idiomas = [];
  p.onPausa = (v) => pausas.push(v);
  p.aoAnuncios = (v) => anuncios.push(v);
  p.ligarIdioma((c) => idiomas.push(c));
  await p.init();
  return { p, janela, pausas, anuncios, idiomas, timers };
}

test('sem anuncio: os botoes de video somem, intersticial e rewarded resolvem na hora sem premio', async () => {
  const { p, pausas, anuncios, timers } = await montar();
  assert.deepEqual(anuncios, [false]);
  assert.equal(p.sdkPronto, false);
  p.gameLoadingFinished();
  p.gameplayStart();
  assert.equal(await p.commercialBreak(), false);
  assert.equal(await p.rewardedBreak(), false);
  assert.deepEqual(pausas, []);
  assert.equal(timers.size, 0);
});

test('idioma: nenhum vem do portal, fica o do navegador', async () => {
  const { idiomas } = await montar();
  assert.deepEqual(idiomas, []);
});

test('foco perdido pausa e a volta solta, como nos outros portais', async () => {
  const { janela, pausas } = await montar();
  janela.disparar('blur');
  janela.disparar('focus');
  assert.deepEqual(pausas, [true, false]);
});

test('o portal do modulo e o objeto que o main.js espera', async () => {
  const { portal } = await import('../portais/itch.js');
  for (const k of ['init', 'gameLoadingFinished', 'gameplayStart', 'gameplayStop', 'commercialBreak', 'rewardedBreak', 'measure', 'ligarIdioma']) {
    assert.equal(typeof portal[k], 'function', k);
  }
  assert.equal(portal.sdkPronto, false);
});
