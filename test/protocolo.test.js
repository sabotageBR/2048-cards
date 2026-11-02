// O protocolo dos portais e os adaptadores da Y8 e da CrazyGames, sem navegador.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarPortal } from '../portais/protocolo.js';
import { criarAdaptadorY8 } from '../portais/y8.js';
import { criarAdaptadorCrazyGames } from '../portais/crazygames.js';

/** Relogio falso: agendar guarda, correr(ms) dispara o que venceu. */
function relogio() {
  let t = 0;
  let seq = 0;
  /** @type {Map<number, {em:number, fn:() => void}>} */
  const fila = new Map();
  return {
    agendar: (/** @type {() => void} */ fn, /** @type {number} */ ms) => { fila.set(++seq, { em: t + ms, fn }); return seq; },
    cancelar: (/** @type {number} */ id) => { fila.delete(id); },
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

/** Janela falsa com disparo manual dos eventos; `document` opcional, com a aba visivel. */
function janelaFalsa(comDocumento = false) {
  /** @type {Record<string, Function[]>} */
  const ouv = {};
  const alvo = (/** @type {string} */ prefixo) => ({
    addEventListener(/** @type {string} */ n, /** @type {Function} */ f) { (ouv[prefixo + n] ||= []).push(f); },
  });
  /** @type {any} */
  const j = {
    ...alvo(''),
    disparar(/** @type {string} */ n) { for (const f of ouv[n] || []) f({}); },
  };
  if (comDocumento) {
    j.document = { ...alvo('doc:'), hidden: false };
    j.esconder = (/** @type {boolean} */ v) => {
      j.document.hidden = v;
      for (const f of ouv['doc:visibilitychange'] || []) f({});
    };
  }
  return j;
}

/** Portal com adaptador falso; `anuncio` decide o que o SDK faz. */
async function montar(/** @type {any} */ extra = {}) {
  const r = relogio();
  const janela = janelaFalsa(!!extra.comDocumento);
  /** @type {string[]} */
  const log = [];
  const adaptador = {
    iniciar: async () => ({ anuncios: extra.anuncios !== false, idioma: extra.idioma || null }),
    gameLoadingFinished: () => log.push('sdk:loading'),
    gameplayStart: () => log.push('sdk:start'),
    gameplayStop: () => log.push('sdk:stop'),
    anuncio: extra.anuncio,
  };
  const p = criarPortal({ adaptador, janela, agendar: r.agendar, cancelar: r.cancelar });
  p.onAdStart = () => log.push('mudo');
  p.onAdEnd = () => log.push('volta');
  await p.init();
  return { p, r, janela, log };
}

test('pausa pulada nao muta nem pausa', async () => {
  const { p, log } = await montar({ anuncio: async () => false });
  /** @type {boolean[]} */
  const pausas = [];
  p.onPausa = (v) => pausas.push(v);
  p.gameLoadingFinished();
  p.gameplayStart();
  assert.equal(await p.commercialBreak(), true);
  assert.ok(!log.includes('mudo'));
  assert.deepEqual(pausas, []);
});

test('muta e pausa quando o anuncio comeca, nao no pedido, e volta uma vez no fim', async () => {
  /** @type {any} */
  let o;
  /** @type {any} */
  let fim;
  const { p, log } = await montar({ anuncio: (/** @type {any} */ _t, /** @type {any} */ _n, /** @type {any} */ c) => { o = c; return new Promise((ok) => { fim = ok; }); } });
  /** @type {boolean[]} */
  const pausas = [];
  p.onPausa = (v) => pausas.push(v);
  p.gameplayStart();
  const pedido = p.commercialBreak();
  await folga();
  assert.ok(!log.includes('mudo'));
  assert.deepEqual(pausas, []);
  o.aoComecar();
  assert.equal(log.filter((x) => x === 'mudo').length, 1);
  assert.deepEqual(pausas, [true]);
  o.aoTerminar();
  fim(false);
  await pedido;
  assert.equal(log.filter((x) => x === 'volta').length, 1);
  assert.deepEqual(pausas, [true, false]);
});

test('sem resposta os anuncios desligam na sessao', async () => {
  let pedidos = 0;
  const { p, r } = await montar({ anuncio: () => { pedidos++; return new Promise(() => {}); } });
  /** @type {boolean[]} */
  const avisos = [];
  p.aoAnuncios = (v) => avisos.push(v);
  p.gameplayStart();
  const pedido = p.commercialBreak();
  await r.correr(6000);
  await pedido;
  assert.equal(p.sdkPronto, false);
  assert.deepEqual(avisos, [false]);
  assert.equal(await p.commercialBreak(), false);
  assert.equal(await p.rewardedBreak(), false);
  assert.equal(pedidos, 1);
});

test('anuncio que comeca atrasado ainda muta, e o fim desmuta', async () => {
  /** @type {any} */
  let o;
  const { p, r, log } = await montar({ anuncio: (/** @type {any} */ _t, /** @type {any} */ _n, /** @type {any} */ c) => { o = c; return new Promise(() => {}); } });
  p.gameplayStart();
  const pedido = p.commercialBreak();
  await r.correr(6000);
  await pedido;
  o.aoComecar();
  assert.ok(log.includes('mudo'));
  o.aoTerminar();
  assert.ok(log.includes('volta'));
});

test('anuncio de 60 s ainda premia; o teto de 180 s solta o jogo', async () => {
  /** @type {any} */
  let o;
  /** @type {any} */
  let fim;
  const { p, r, log } = await montar({ anuncio: (/** @type {any} */ _t, /** @type {any} */ _n, /** @type {any} */ c) => { o = c; return new Promise((ok) => { fim = ok; }); } });
  const pedido = p.rewardedBreak();
  await folga();
  o.aoComecar();
  await r.correr(60000);
  o.aoTerminar();
  fim(true);
  assert.equal(await pedido, true);
  const segundo = p.rewardedBreak();
  await folga();
  o.aoComecar();
  await r.correr(180000);
  assert.equal(await segundo, false);
  assert.equal(log.at(-1), 'volta');
});

test('premio so com true do adaptador', async () => {
  const { p } = await montar({ anuncio: async () => 'sim' });
  assert.equal(await p.rewardedBreak(), false);
});

test('foco: muta, nada vai ao SDK e o estado acerta na volta', async () => {
  const { p, janela, log } = await montar({});
  p.gameLoadingFinished();
  p.gameplayStart();
  log.length = 0;
  janela.disparar('blur');
  p.gameplayStop();
  assert.deepEqual(log, ['mudo']);
  janela.disparar('focus');
  assert.deepEqual(log, ['mudo', 'volta', 'sdk:stop']);
});

test('foco perdido pausa o jogo; o clique de volta solta antes de o jogo receber o toque', async () => {
  const { p, janela } = await montar({});
  /** @type {boolean[]} */
  const pausas = [];
  p.onPausa = (v) => pausas.push(v);
  janela.disparar('blur');
  assert.deepEqual(pausas, [true]);
  janela.disparar('pointerdown');
  assert.deepEqual(pausas, [true, false]);
});

test('aba escondida pausa e muta, sem depender do blur, e os motivos se somam', async () => {
  const { p, janela, log } = await montar({ comDocumento: true });
  /** @type {boolean[]} */
  const pausas = [];
  p.onPausa = (v) => pausas.push(v);
  janela.esconder(true);
  assert.deepEqual(pausas, [true]);
  assert.deepEqual(log, ['mudo']);
  // o clique nao solta a aba escondida; a volta da aba, sim
  janela.disparar('blur');
  janela.esconder(false);
  assert.deepEqual(pausas, [true], 'ainda sem foco');
  janela.disparar('focus');
  assert.deepEqual(pausas, [true, false]);
  assert.deepEqual(log, ['mudo', 'volta']);
});

test('fim do anuncio sem foco nao desmuta; a volta do foco desmuta uma vez', async () => {
  /** @type {any} */
  let o;
  /** @type {any} */
  let fim;
  const { p, janela, log } = await montar({ anuncio: (/** @type {any} */ _t, /** @type {any} */ _n, /** @type {any} */ c) => { o = c; return new Promise((ok) => { fim = ok; }); } });
  const pedido = p.commercialBreak;
  p.gameplayStart();
  const em = pedido();
  await folga();
  o.aoComecar();
  janela.disparar('blur');
  o.aoTerminar();
  fim(false);
  await em;
  assert.ok(!log.includes('volta'));
  janela.disparar('pointerdown');
  assert.equal(log.filter((x) => x === 'volta').length, 1);
});

test('eventos antes do SDK responder saem na ordem depois', async () => {
  const r = relogio();
  /** @type {any} */
  let responder;
  /** @type {string[]} */
  const log = [];
  const adaptador = {
    iniciar: () => new Promise((ok) => { responder = ok; }),
    gameLoadingFinished: () => log.push('loading'),
    gameplayStart: () => log.push('start'),
    gameplayStop: () => log.push('stop'),
  };
  const p = criarPortal({ adaptador, janela: janelaFalsa(), agendar: r.agendar, cancelar: r.cancelar });
  p.init();
  p.gameplayStart();
  await folga();
  responder({ anuncios: false, idioma: null });
  await folga();
  assert.deepEqual(log, ['loading', 'start']);
});

test('SDK que nunca responde: o init resolve no prazo e o jogo segue sem anuncios', async () => {
  const r = relogio();
  const adaptador = { iniciar: () => new Promise(() => {}), gameLoadingFinished() {}, gameplayStart() {}, gameplayStop() {} };
  const p = criarPortal({ adaptador, janela: janelaFalsa(), agendar: r.agendar, cancelar: r.cancelar });
  let resolveu = false;
  p.init().then(() => { resolveu = true; });
  await r.correr(4000);
  assert.equal(resolveu, true);
  assert.equal(p.sdkPronto, false);
  assert.equal(await p.rewardedBreak(), false);
});

test('sem anuncios: commercial e rewarded recusam sem tocar no jogo', async () => {
  const { p, log } = await montar({ anuncios: false });
  p.gameplayStart();
  assert.equal(await p.commercialBreak(), false);
  assert.equal(await p.rewardedBreak(), false);
  assert.equal(p.jaJogou, false);
  assert.ok(!log.includes('mudo'));
});

test('o wrapper imita o da outra plataforma: medidas e pilula nao lancam', async () => {
  const { p } = await montar({});
  assert.doesNotThrow(() => { p.measure(); p.movePill(); p.captureError(); });
  assert.equal(p.openExternalLink(), false);
  // main.js embrulha o measure para os ganchos de teste
  assert.doesNotThrow(() => p.measure.bind(p)('a', 'b', 'c'));
});

test('idioma: chega mesmo se a ligacao vier depois do init', async () => {
  const { p } = await montar({ idioma: 'pt-BR' });
  /** @type {string[]} */
  const visto = [];
  p.ligarIdioma((c) => visto.push(c));
  assert.deepEqual(visto, ['pt-BR']);
});

test('Y8 sem ids nao carrega o SDK', async () => {
  let carregou = false;
  const a = criarAdaptadorY8({ ids: { appId: '', gameId: '' }, janela: janelaFalsa(), carregar: async () => { carregou = true; } });
  assert.deepEqual(await a.iniciar(), { anuncios: false, idioma: null });
  assert.equal(carregou, false);
});

test('Y8 com um id so tambem nao carrega o SDK', async () => {
  let carregou = false;
  const a = criarAdaptadorY8({ ids: { appId: 'a', gameId: '' }, janela: janelaFalsa(), carregar: async () => { carregou = true; } });
  assert.deepEqual(await a.iniciar(), { anuncios: false, idioma: null });
  assert.equal(carregou, false);
});

test('Y8: SDK bloqueado nao derruba o portal e os anuncios ficam desligados', async () => {
  const r = relogio();
  const adaptador = criarAdaptadorY8({ ids: { appId: 'a', gameId: '1' }, janela: janelaFalsa(), carregar: () => Promise.reject(new Error('sdk')) });
  const p = criarPortal({ adaptador, janela: janelaFalsa(), agendar: r.agendar, cancelar: r.cancelar });
  await p.init();
  assert.equal(p.sdkPronto, false);
  assert.equal(await p.rewardedBreak(), false);
});

test('Y8: `en` nao vale como idioma; premio so com adViewed', async () => {
  const janela = /** @type {any} */ (janelaFalsa());
  /** @type {any} */
  let visto;
  const sdk = {
    init: () => {},
    getPlatformLocale: async () => 'en',
    showAd: (/** @type {any} */ c) => { visto = c; },
  };
  janela.y8 = { sdk: () => sdk, emitReadyEvent: () => janela.disparar('y8sdk.ready') };
  const a = criarAdaptadorY8({ ids: { appId: 'a', gameId: '1' }, janela, carregar: async () => {} });
  assert.deepEqual(await a.iniciar(), { anuncios: true, idioma: null });
  let comecou = 0;
  let terminou = 0;
  const o = { aoComecar: () => { comecou++; }, aoTerminar: () => { terminou++; } };
  const fechado = a.anuncio('reward', 'x', o);
  visto.beforeAd();
  visto.adDismissed();
  visto.afterAd();
  visto.adBreakDone({ breakStatus: 'dismissed' });
  assert.equal(await fechado, false);
  const visto2 = a.anuncio('reward', 'x', o);
  visto.adViewed();
  visto.adBreakDone({ breakStatus: 'viewed' });
  assert.equal(await visto2, true);
  assert.equal(comecou, 1);
  assert.equal(terminou, 1);
});

test('CrazyGames: loadingStop abre o gameplayStart; fora do dominio nao chama nada', async () => {
  /** @type {string[]} */
  const log = [];
  const janela = {
    CrazyGames: { SDK: { environment: 'local', init: async () => {}, user: { systemInfo: { locale: 'es-ES' } },
      game: { loadingStart: () => log.push('ls'), loadingStop: () => log.push('lp'), gameplayStart: () => log.push('gs'), gameplayStop: () => log.push('gp') } } },
  };
  const a = criarAdaptadorCrazyGames({ janela, carregar: async () => {} });
  assert.deepEqual(await a.iniciar(), { anuncios: false, idioma: 'es-ES' });
  a.gameLoadingFinished();
  a.gameplayStart();
  a.gameplayStop();
  assert.deepEqual(log, ['ls', 'lp', 'gs', 'gp']);
  janela.CrazyGames.SDK.environment = 'disabled';
  log.length = 0;
  const b = criarAdaptadorCrazyGames({ janela, carregar: async () => {} });
  await b.iniciar();
  b.gameLoadingFinished();
  b.gameplayStart();
  assert.deepEqual(log, []);
});

test('CrazyGames: a Basic Launch nunca liga anuncio, nem com o SDK de pe', async () => {
  const janela = { CrazyGames: { SDK: { environment: 'crazygames', init: async () => {}, user: { systemInfo: { locale: 'pt-BR' } }, game: { loadingStart() {}, loadingStop() {}, gameplayStart() {}, gameplayStop() {} } } } };
  const r = relogio();
  const p = criarPortal({ adaptador: criarAdaptadorCrazyGames({ janela, carregar: async () => {} }), janela: janelaFalsa(), agendar: r.agendar, cancelar: r.cancelar });
  await p.init();
  assert.equal(p.sdkPronto, false);
  assert.equal(await p.rewardedBreak(), false);
});
