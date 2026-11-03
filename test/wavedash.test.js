// O adaptador da Wavedash, sem navegador: o init uma vez so e por fora do protocolo, a reserva por
// timer, a barra de carregamento, nenhum anuncio e o jogo igual sem window.Wavedash.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESERVA_MS, criarPortalWavedash, criarReveladorWavedash, idiomaWavedash } from '../portais/wavedash.js';

/** Relogio falso: agendar guarda, correr(ms) dispara o que venceu. */
function relogio() {
  let t = 0;
  let seq = 0;
  /** @type {Map<number, {em:number, fn:() => void}>} */
  const fila = new Map();
  return {
    agendar: (/** @type {() => void} */ fn, /** @type {number} */ ms) => { fila.set(++seq, { em: t + ms, fn }); return seq; },
    cancelar: (/** @type {number} */ id) => { fila.delete(id); },
    get pendentes() { return fila.size; },
    async correr(/** @type {number} */ ms) {
      t += ms;
      for (const [id, a] of [...fila]) {
        if (a.em <= t) {
          fila.delete(id);
          a.fn();
        }
      }
      await folga();
    },
  };
}

const folga = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

/**
 * Janela falsa com o SDK da Wavedash que so registra; `semSdk` tira o window.Wavedash.
 * @param {{semSdk?:boolean, idioma?:any, escondida?:boolean}} [o]
 */
function janelaFalsa(o = {}) {
  /** @type {Record<string, Function[]>} */
  const ouv = {};
  /** @type {any[]} */
  const log = [];
  const alvo = (/** @type {string} */ prefixo) => ({
    addEventListener(/** @type {string} */ n, /** @type {Function} */ f) { (ouv[prefixo + n] ||= []).push(f); },
  });
  /** @type {any} */
  const j = {
    ...alvo(''),
    log,
    document: { ...alvo('doc:'), hidden: !!o.escondida },
    disparar(/** @type {string} */ n) { for (const f of ouv[n] || []) f({}); },
  };
  if (!o.semSdk) {
    j.Wavedash = {
      init: () => { log.push('init'); return log.filter((x) => x === 'init').length === 1; },
      updateLoadProgressZeroToOne: (/** @type {number} */ p) => log.push(p),
      getUserLanguage: () => {
        if (o.idioma instanceof Error) throw o.idioma;
        return o.idioma ?? 'en';
      },
    };
  }
  return j;
}

/** O portal da Wavedash numa janela falsa, ja com o init do protocolo feito. */
async function montar(/** @type {any} */ o = {}) {
  const r = relogio();
  const janela = janelaFalsa(o);
  const revelador = criarReveladorWavedash({ janela, agendar: r.agendar, cancelar: r.cancelar });
  const p = criarPortalWavedash({ revelador, janela, agendar: r.agendar, cancelar: r.cancelar });
  /** @type {boolean[]} */
  const pausas = [];
  /** @type {boolean[]} */
  const anuncios = [];
  p.onPausa = (v) => pausas.push(v);
  p.aoAnuncios = (v) => anuncios.push(v);
  await p.init();
  const inits = () => janela.log.filter((/** @type {any} */ x) => x === 'init').length;
  return { p, r, janela, revelador, pausas, anuncios, inits };
}

test('o init sai uma vez so, no aviso de carregamento', async () => {
  const { p, inits, janela } = await montar();
  assert.equal(inits(), 0);
  p.gameLoadingFinished();
  assert.equal(inits(), 1);
  p.gameLoadingFinished();
  p.gameplayStart();
  p.gameplayStop();
  p.gameplayStart();
  assert.equal(inits(), 1);
  // depois do init a barra nao anda mais
  const depois = janela.log.slice(janela.log.indexOf('init') + 1);
  assert.ok(!depois.some((/** @type {any} */ x) => typeof x === 'number'), JSON.stringify(janela.log));
});

test('sem foco: o protocolo segura o carregamento, mas o init sai na hora e nao repete na volta', async () => {
  const { p, janela, pausas, inits } = await montar();
  janela.disparar('blur');
  assert.deepEqual(pausas, [true]);
  p.gameLoadingFinished();
  assert.equal(inits(), 1);
  janela.disparar('focus');
  assert.deepEqual(pausas, [true, false]);
  assert.equal(inits(), 1);
});

test('aba escondida desde o comeco: o init sai assim mesmo', async () => {
  const { p, pausas, inits } = await montar({ escondida: true });
  assert.deepEqual(pausas, [true]);
  p.gameLoadingFinished();
  assert.equal(inits(), 1);
});

test('o primeiro toque tambem revela, se o aviso de carregamento nao veio', async () => {
  const { p, inits } = await montar();
  p.gameplayStart();
  assert.equal(inits(), 1);
  p.gameLoadingFinished();
  assert.equal(inits(), 1);
});

test('reserva: sem aviso nenhum, o init sai pelo timer e uma vez so', async () => {
  const { p, r, inits } = await montar();
  await r.correr(RESERVA_MS - 1);
  assert.equal(inits(), 0);
  await r.correr(1);
  assert.equal(inits(), 1);
  p.gameLoadingFinished();
  await r.correr(RESERVA_MS * 2);
  assert.equal(inits(), 1);
});

test('reserva: o init pelo jogo desarma o timer', async () => {
  const { p, r, inits } = await montar();
  p.gameLoadingFinished();
  assert.equal(r.pendentes, 0);
  await r.correr(RESERVA_MS * 2);
  assert.equal(inits(), 1);
});

test('progresso: a barra sobe em passos, chega a 1 e so depois vem o init', async () => {
  const { p, janela } = await montar();
  janela.disparar('load');
  p.gameLoadingFinished();
  const passos = janela.log.filter((/** @type {any} */ x) => typeof x === 'number');
  assert.ok(passos.length >= 3, JSON.stringify(janela.log));
  for (let i = 1; i < passos.length; i++) assert.ok(passos[i] > passos[i - 1], JSON.stringify(passos));
  assert.ok(passos[0] > 0 && passos.every((x) => x <= 1));
  assert.deepEqual(janela.log.slice(-2), [1, 'init']);
});

test('sem anuncio: intersticial e rewarded resolvem na hora sem premio, sem pausar o jogo', async () => {
  const { p, pausas, anuncios } = await montar();
  assert.deepEqual(anuncios, [false]);
  assert.equal(p.sdkPronto, false);
  p.gameLoadingFinished();
  p.gameplayStart();
  // nenhum timer precisa andar: a resposta vem na mesma volta
  assert.equal(await p.commercialBreak(), false);
  assert.equal(await p.rewardedBreak(), false);
  assert.deepEqual(pausas, []);
});

test('sem window.Wavedash o jogo segue igual: nada lanca, nada fica agendado', async () => {
  const { p, r, inits } = await montar({ semSdk: true });
  assert.equal(r.pendentes, 0);
  assert.doesNotThrow(() => { p.gameLoadingFinished(); p.gameplayStart(); p.gameplayStop(); p.measure(); p.movePill(); });
  assert.equal(inits(), 0);
  assert.equal(await p.rewardedBreak(), false);
  /** @type {string[]} */
  const visto = [];
  p.ligarIdioma((c) => visto.push(c));
  assert.deepEqual(visto, []);
});

test('SDK que lanca no init ou na barra nao derruba o jogo', async () => {
  const r = relogio();
  const janela = janelaFalsa();
  janela.Wavedash.init = () => { throw new Error('x'); };
  janela.Wavedash.updateLoadProgressZeroToOne = () => { throw new Error('y'); };
  const revelador = criarReveladorWavedash({ janela, agendar: r.agendar, cancelar: r.cancelar });
  const p = criarPortalWavedash({ revelador, janela, agendar: r.agendar, cancelar: r.cancelar });
  await p.init();
  assert.doesNotThrow(() => p.gameLoadingFinished());
  assert.equal(revelador.revelado, true);
});

test('idioma: so os que a interface tem; o resto fica no do navegador', async () => {
  const { p } = await montar({ idioma: 'pt-BR' });
  /** @type {string[]} */
  const visto = [];
  p.ligarIdioma((c) => visto.push(c));
  assert.deepEqual(visto, ['pt-BR']);
  assert.equal(idiomaWavedash(janelaFalsa({ idioma: 'es' })), 'es');
  assert.equal(idiomaWavedash(janelaFalsa({ idioma: 'fr' })), null);
  assert.equal(idiomaWavedash(janelaFalsa({ idioma: new Error('sem') })), null);
  assert.equal(idiomaWavedash(janelaFalsa({ semSdk: true })), null);
});
