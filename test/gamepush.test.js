// O adaptador da GamePush, sem navegador: SDK falso e relogio falso. O intervalo de 180 s, o premio
// so com true, o botao de video que some sem anuncio, o gameStart unico, o mudo e a pausa da
// plataforma, o idioma e o comeco da pagina em 8 s (ou antes, com o SDK ou sem ele).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESPERA_SDK_MS, INTERVALO_MS, criarPortalGamePush, idiomaGamePush } from '../portais/gamepush.js';
import { GAMEPUSH, HOSTS_SDK, carregadorOficial, iniciarJogo, paginaGamePush } from '../portais/gamepush-pagina.mjs';

/** Um emissor como os do SDK. */
function emissor() {
  /** @type {Map<string, Function[]>} */
  const m = new Map();
  return {
    on(/** @type {string} */ ev, /** @type {Function} */ f) { m.set(ev, [...(m.get(ev) || []), f]); },
    emit(/** @type {string} */ ev, /** @type {...any} */ ...a) { for (const f of m.get(ev) || []) f(...a); },
    tem(/** @type {string} */ ev) { return (m.get(ev) || []).length > 0; },
  };
}

/**
 * O gp falso: registra as chamadas; os anuncios resolvem com `resultado` (padrao true) e emitem
 * start/close como o real.
 */
function gpFalso({ idioma = 'en', disponivel = true, resultado = true, mudo = false } = {}) {
  const chamadas = [];
  const gpEv = emissor(), somEv = emissor(), adsEv = emissor();
  const cfg = { disponivel, resultado, pausado: false };
  /** @param {string} fn @param {any} [arg] */
  const anuncio = (fn, arg) => {
    chamadas.push(arg === undefined ? fn : `${fn} ${JSON.stringify(arg)}`);
    if (!cfg.disponivel) return Promise.resolve(false);
    adsEv.emit('start');
    return Promise.resolve().then(() => { adsEv.emit('close', cfg.resultado === true); return cfg.resultado; });
  };
  const gp = {
    language: idioma,
    get isPaused() { return cfg.pausado; },
    on: gpEv.on, sounds: { on: somEv.on, isMuted: mudo, isSFXMuted: false },
    ads: {
      on: adsEv.on,
      get isFullscreenAvailable() { return cfg.disponivel; },
      get isRewardedAvailable() { return cfg.disponivel; },
      showFullscreen() { return anuncio('showFullscreen'); },
      showRewardedVideo(/** @type {any} */ o) { return anuncio('showRewardedVideo', o); },
    },
    gameStart() { chamadas.push('gameStart'); },
    gameplayStart() { chamadas.push('gameplayStart'); },
    gameplayStop() { chamadas.push('gameplayStop'); },
  };
  return { gp, chamadas, cfg, gpEv, somEv };
}

/** Janela falsa: ouvintes registrados e disparados na mao. */
function janelaFalsa() {
  /** @type {Record<string, Function[]>} */
  const ouv = {};
  const alvo = (/** @type {string} */ p) => ({ addEventListener(/** @type {string} */ n, /** @type {Function} */ f) { (ouv[p + n] ||= []).push(f); } });
  return { ...alvo(''), document: { ...alvo('doc:'), hidden: false }, disparar(/** @type {string} */ n) { for (const f of ouv[n] || []) f({}); } };
}

/** Deixa as promessas andarem. */
const andar = async (n = 20) => { for (let i = 0; i < n; i++) await Promise.resolve(); };

/**
 * Um portal com SDK falso (ou sem SDK: sdk null), relogio falso e os ganchos do jogo registrados.
 * @param {{sdk?: any, chega?: boolean}} [o] chega false: o SDK fica para depois (resolver())
 */
async function montar({ sdk = gpFalso(), chega = true } = {}) {
  const relogio = { t: 0 };
  /** @type {(gp:any) => void} */
  let resolver = () => {};
  const promessa = chega ? Promise.resolve(sdk && sdk.gp) : new Promise((ok) => { resolver = ok; });
  const janela = janelaFalsa();
  const p = criarPortalGamePush({ sdk: promessa, janela, relogio: () => relogio.t, agendar: () => 0, cancelar: () => {} });
  const ev = { som: /** @type {string[]} */ ([]), pausa: /** @type {boolean[]} */ ([]), botoes: /** @type {boolean[]} */ ([]), idioma: /** @type {string[]} */ ([]) };
  p.onAdStart = () => ev.som.push('mudo');
  p.onAdEnd = () => ev.som.push('volta');
  p.onPausa = (v) => ev.pausa.push(v);
  p.aoAnuncios = (v) => ev.botoes.push(v);
  p.ligarIdioma((c) => ev.idioma.push(c));
  const iniciado = p.init();
  if (chega) await iniciado;
  await andar();
  return { p, relogio, ev, janela, resolver: (/** @type {any} */ g) => { resolver(g); return andar(); }, sdk };
}

/** O jogo carregou e o jogador tocou: gameStart e gameplayStart. */
async function jogando(/** @type {any} */ m) {
  m.p.gameLoadingFinished();
  m.p.gameplayStart();
  await andar();
}

test('o intersticial so sai com 180 s desde o gameStart e desde o anterior', async () => {
  const m = await montar();
  await jogando(m);
  const { chamadas } = m.sdk;
  assert.equal(INTERVALO_MS, 180000);
  m.relogio.t = INTERVALO_MS - 1;
  assert.equal(await m.p.commercialBreak(), false);
  assert.ok(!chamadas.includes('showFullscreen'), 'nada antes de 180 s do gameStart');
  m.relogio.t = INTERVALO_MS;
  m.p.gameplayStart();
  assert.equal(await m.p.commercialBreak(), true);
  assert.equal(chamadas.filter((c) => c === 'showFullscreen').length, 1);
  // o proximo conta do fim do anterior
  m.p.gameplayStart();
  await andar();
  m.relogio.t = INTERVALO_MS * 2 - 1;
  assert.equal(await m.p.commercialBreak(), false);
  m.relogio.t = INTERVALO_MS * 2;
  m.p.gameplayStart();
  await andar();
  assert.equal(await m.p.commercialBreak(), true);
  assert.equal(chamadas.filter((c) => c === 'showFullscreen').length, 2);
  assert.ok(!chamadas.some((c) => /Preloader|Sticky/.test(c)));
});

test('o intersticial pausa e cala o jogo durante o anuncio e devolve no fim', async () => {
  const m = await montar();
  await jogando(m);
  m.relogio.t = INTERVALO_MS;
  await m.p.commercialBreak();
  assert.deepEqual(m.ev.som, ['mudo', 'volta']);
  assert.deepEqual(m.ev.pausa, [true, false]);
});

test('sem intersticial fora da jogada (o cartao da mesa cheia) nem sem anuncio disponivel', async () => {
  const m = await montar();
  await jogando(m);
  m.relogio.t = INTERVALO_MS * 3;
  m.p.gameplayStop();
  assert.equal(await m.p.commercialBreak(), false);
  m.p.gameplayStart();
  m.sdk.cfg.disponivel = false;
  assert.equal(await m.p.commercialBreak(), false);
  assert.ok(!m.sdk.chamadas.includes('showFullscreen'));
});

test('o premio so sai com true, e o pedido leva o aviso de falha da GamePush', async () => {
  for (const [resultado, esperado] of [[true, true], ['true', false], [1, false], [{}, false], [false, false]]) {
    const sdk = gpFalso({ resultado });
    const m = await montar({ sdk });
    await jogando(m);
    assert.equal(await m.p.rewardedBreak(), esperado, JSON.stringify(resultado));
    assert.ok(sdk.chamadas.includes('showRewardedVideo {"showFailedOverlay":true}'));
  }
});

test('premiado rejeitado: sem premio e sem quebrar', async () => {
  const sdk = gpFalso();
  sdk.gp.ads.showRewardedVideo = () => Promise.reject(new Error('falhou'));
  const m = await montar({ sdk });
  await jogando(m);
  assert.equal(await m.p.rewardedBreak(), false);
});

test('o botao de video so aparece com premiado disponivel, e some quando deixa de haver', async () => {
  const m = await montar();
  assert.deepEqual(m.ev.botoes, [true]);
  assert.equal(m.p.sdkPronto, true);
  m.sdk.cfg.disponivel = false;
  assert.equal(m.p.sdkPronto, false, 'o "Continuar" com video confere de novo');
  m.p.gameplayStart();
  assert.deepEqual(m.ev.botoes, [true, false]);
  m.sdk.cfg.disponivel = true;
  await m.p.rewardedBreak();
  assert.deepEqual(m.ev.botoes, [true, false, true]);
});

test('sem SDK (bloqueado): sem botao de video, sem anuncio, sem gameStart, sem idioma', async () => {
  const m = await montar({ sdk: null });
  assert.deepEqual(m.ev.botoes, [false]);
  assert.equal(m.p.sdkPronto, false);
  await jogando(m);
  assert.equal(await m.p.commercialBreak(), false);
  assert.equal(await m.p.rewardedBreak(), false);
  assert.deepEqual(m.ev.idioma, []);
});

test('gameStart uma vez so, mesmo com varios avisos de carregamento', async () => {
  const m = await montar();
  await jogando(m);
  m.p.gameLoadingFinished();
  m.p.gameplayStop();
  m.p.gameplayStart();
  await andar();
  assert.equal(m.sdk.chamadas.filter((c) => c === 'gameStart').length, 1);
  assert.ok(m.sdk.chamadas.indexOf('gameStart') < m.sdk.chamadas.indexOf('gameplayStart'));
});

test('o SDK que chega depois do jogo: o gameStart sai quando ele chega, e o idioma tambem', async () => {
  const sdk = gpFalso({ idioma: 'ru' });
  const m = await montar({ sdk, chega: false });
  m.p.gameLoadingFinished();
  assert.equal(sdk.chamadas.length, 0);
  await m.resolver(sdk.gp);
  assert.deepEqual(sdk.chamadas, ['gameStart']);
  assert.deepEqual(m.ev.idioma, ['ru']);
});

test('gameStart mesmo com a aba escondida (por fora do protocolo)', async () => {
  const m = await montar();
  m.janela.document.hidden = true;
  m.janela.disparar('doc:visibilitychange');
  m.p.gameLoadingFinished();
  assert.deepEqual(m.sdk.chamadas, ['gameStart']);
});

test('mudo da plataforma: cala sem pausar, soma com o anuncio e nao mexe no botao de som do jogador', async () => {
  const m = await montar();
  await jogando(m);
  m.sdk.somEv.emit('mute');
  assert.deepEqual(m.ev.som, ['mudo']);
  assert.deepEqual(m.ev.pausa, []);
  // um anuncio com a plataforma muda: o fim do anuncio nao devolve o som
  await m.p.rewardedBreak();
  assert.deepEqual(m.ev.som, ['mudo']);
  assert.deepEqual(m.ev.pausa, [true, false]);
  m.sdk.somEv.emit('unmute');
  assert.deepEqual(m.ev.som, ['mudo', 'volta']);
  m.sdk.somEv.emit('mute:sfx');
  m.sdk.somEv.emit('unmute:sfx');
  assert.deepEqual(m.ev.som, ['mudo', 'volta', 'mudo', 'volta']);
});

test('a plataforma ja muda na partida: o jogo comeca calado', async () => {
  const m = await montar({ sdk: gpFalso({ mudo: true }) });
  assert.deepEqual(m.ev.som, ['mudo']);
});

test('pausa da plataforma: para e cala; a volta solta, e o toque solta uma pausa que ficou para tras', async () => {
  const m = await montar();
  m.sdk.gpEv.emit('pause');
  assert.deepEqual(m.ev.pausa, [true]);
  assert.deepEqual(m.ev.som, ['mudo']);
  m.sdk.gpEv.emit('resume');
  assert.deepEqual(m.ev.pausa, [true, false]);
  assert.deepEqual(m.ev.som, ['mudo', 'volta']);
  // a aba some (o protocolo) e a plataforma pausa junto: so volta quando os dois soltam
  m.janela.document.hidden = true;
  m.janela.disparar('doc:visibilitychange');
  m.sdk.gpEv.emit('pause');
  m.janela.document.hidden = false;
  m.janela.disparar('doc:visibilitychange');
  assert.equal(m.ev.pausa.at(-1), true);
  m.janela.disparar('pointerdown');
  assert.equal(m.ev.pausa.at(-1), false, 'o SDK nao esta em pausa: o toque solta');
});

test('idioma: o da plataforma quando o jogo tem a lingua', () => {
  assert.equal(idiomaGamePush({ language: 'ru' }), 'ru');
  assert.equal(idiomaGamePush({ language: 'pt' }), 'pt');
  assert.equal(idiomaGamePush({ language: 'fr' }), null);
  assert.equal(idiomaGamePush({ get language() { throw new Error('x'); } }), null);
});

/** Janela e documento falsos para o comeco da pagina, com timers na mao. */
function paginaFalsa() {
  const timers = [];
  /** @type {Function[]} */
  const erros = [];
  const scripts = [];
  let resolver = (/** @type {any} */ _v) => {};
  const w = {
    __gp: new Promise((ok) => { resolver = ok; }),
    setTimeout(/** @type {Function} */ f, /** @type {number} */ ms) { timers.push({ f, ms }); },
    addEventListener(/** @type {string} */ n, /** @type {Function} */ f) { if (n === 'error') erros.push(f); },
  };
  const d = {
    createElement() { return {}; },
    body: { appendChild(/** @type {any} */ s) { scripts.push(s); } },
  };
  return { w, d, timers, scripts, resolver: (/** @type {any} */ v) => resolver(v), errar(/** @type {string} */ src) { for (const f of erros) f({ target: { tagName: 'SCRIPT', src } }); } };
}

test('a pagina: sem SDK, o jogo entra em 8 s, uma vez', async () => {
  const pg = paginaFalsa();
  iniciarJogo(pg.w, pg.d, ESPERA_SDK_MS);
  assert.equal(ESPERA_SDK_MS, 8000);
  assert.deepEqual(pg.timers.map((t) => t.ms), [8000]);
  assert.equal(pg.scripts.length, 0);
  pg.timers[0].f();
  pg.timers[0].f();
  assert.deepEqual(pg.scripts, [{ type: 'module', src: 'src/main.js' }]);
  pg.resolver({});
  await andar();
  assert.equal(pg.scripts.length, 1);
});

test('a pagina: o SDK chegou, o jogo entra na hora', async () => {
  const pg = paginaFalsa();
  iniciarJogo(pg.w, pg.d, ESPERA_SDK_MS);
  pg.resolver({});
  await andar();
  assert.equal(pg.scripts.length, 1);
  pg.timers[0].f();
  assert.equal(pg.scripts.length, 1);
});

test('a pagina: os quatro enderecos do SDK falharam, o jogo entra sem esperar', () => {
  const pg = paginaFalsa();
  iniciarJogo(pg.w, pg.d, ESPERA_SDK_MS);
  pg.errar('https://outro.exemplo/x.js');
  for (let i = 0; i < 3; i++) pg.errar(`https://h${i}.exemplo/sdk/game-score.js?projectId=1`);
  assert.equal(pg.scripts.length, 0);
  pg.errar('https://h3.exemplo/sdk/game-score.js?projectId=1');
  assert.equal(pg.scripts.length, 1);
});

test('a pagina leva o carregador oficial com os ids do jogo e o onGPInit antes dele', () => {
  const html = '<head>\n<link rel="stylesheet" href="src/ui/estilo.css">\n</head>\n<body>\n'
    + '<i class="selo-video" aria-hidden="true">🎬</i><i class="selo-video" aria-hidden="true">🎬</i><i class="selo-inline" aria-hidden="true">🎬</i>\n'
    + '<script type="module" src="src/main.js"></script>\n</body>';
  const p = paginaGamePush(html);
  const carregador = p.indexOf(carregadorOficial(GAMEPUSH));
  assert.ok(carregador > 0);
  assert.ok(p.indexOf('window.onGPInit') < carregador);
  assert.ok(p.includes('?projectId=32795&publicToken=LYIXUhygYxQsMmyYulu5blk0xXUVOQZ3&callback=onGPInit'));
  assert.ok(!p.includes('<script type="module" src="src/main.js">'));
  assert.equal(p.split('class="rotulo-video"').length - 1, 3);
  assert.deepEqual([...HOSTS_SDK], ['gs.eponesh.com', 's3.gamepush.com', 's3-eu.gamepush.com', 'gamepush.com']);
  assert.throws(() => paginaGamePush(html.replace('<script type="module" src="src/main.js"></script>', '')), /index\.html/);
});

test('o portal do modulo e o objeto que o main.js espera', async () => {
  const { portal } = await import('../portais/gamepush.js');
  for (const k of ['init', 'gameLoadingFinished', 'gameplayStart', 'gameplayStop', 'commercialBreak', 'rewardedBreak', 'measure', 'ligarIdioma', 'movePill']) {
    assert.equal(typeof portal[k], 'function', k);
  }
  assert.equal(portal.sdkPronto, false);
});

/** Os textos do build da GamePush, montados como o empacotador os monta (textos-base.js ao lado). */
let textosMontados = null;
const textosGamePush = () => (textosMontados ||= montarTextos());
async function montarTextos() {
  const { cpSync, mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const raiz = new URL('..', import.meta.url).pathname;
  const d = mkdtempSync(join(tmpdir(), 'c2-textos-'));
  cpSync(join(raiz, 'src/i18n/textos.js'), join(d, 'textos-base.js'));
  cpSync(join(raiz, 'portais/gamepush/textos.js'), join(d, 'textos.js'));
  return { gp: await import(join(d, 'textos.js')), base: await import(join(raiz, 'src/i18n/textos.js')) };
}

test('russo: toda chave do ingles traduzida, sem sobra de ingles', async () => {
  const { gp, base } = await textosGamePush();
  const en = base.textos('en');
  for (const k of Object.keys(en)) {
    assert.ok(Object.hasOwn(gp.RU, k), `falta ${k}`);
    assert.ok(!/[a-z]{3,}/i.test(gp.RU[k].replace(/\{\w+\}/g, '')), `${k}: ${gp.RU[k]}`);
  }
  assert.deepEqual(Object.keys(gp.RU).filter((k) => !Object.hasOwn(en, k)), []);
});

test('russo: o idioma vem do navegador ou da plataforma, e o resto fica como no jogo', async () => {
  const { gp, base } = await textosGamePush();
  assert.equal(gp.escolherIdioma(['ru-RU', 'en']), 'ru');
  assert.equal(gp.escolherIdioma(['de', 'pt-BR']), 'pt');
  assert.equal(gp.escolherIdioma(['de', 'fr']), 'en');
  assert.equal(gp.escolherIdioma(['es-AR']), 'es');
  assert.equal(gp.textos('ru').nivel, 'Уровень');
  assert.deepEqual(gp.textos('pt'), base.textos('pt'));
  assert.deepEqual(gp.textos('xx'), base.textos('en'));
});

test('russo: plural pelo numero (1 карту, 2 карты, 5 карт, 11 карт, 21 карту)', async () => {
  const { gp } = await textosGamePush();
  const T = gp.textos('ru');
  const m = (tipo, alvo) => gp.textoMissao(T, { tipo, alvo, v: 64 });
  assert.equal(m('descartes', 1), 'Сбросьте 1 карту');
  assert.equal(m('descartes', 3), 'Сбросьте 3 карты');
  assert.equal(m('descartes', 5), 'Сбросьте 5 карт');
  assert.equal(m('descartes', 11), 'Сбросьте 11 карт');
  assert.equal(m('descartes', 21), 'Сбросьте 21 карту');
  assert.equal(m('fusoes', 12), 'Сделайте 12 слияний');
  assert.equal(m('fusoes', 22), 'Сделайте 22 слияния');
  assert.equal(m('pontos', 5000), 'Наберите 5000 очков в одном мире');
  assert.equal(m('cartas', 2), 'Соберите 2× 64');
  assert.equal(gp.textoMeta(T, { tipo: 'cartas', alvo: 1, v: 128 }), 'Соберите 128');
  // nas outras linguas o texto e o do jogo
  const en = gp.textos('en');
  assert.equal(gp.textoMissao(en, { tipo: 'descartes', alvo: 5 }), 'Discard 5 cards');
});
