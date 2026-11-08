/**
 * GamePush (docs.gamepush.com). O index.html do build (tools/empacotar-portal.mjs, com
 * portais/gamepush-pagina.mjs) traz o carregador oficial do SDK e, antes dele, a promessa
 * window.__gp, que o callback onGPInit resolve com o gp: o SDK nao cria variavel global. A pagina so
 * carrega o jogo (src/main.js) quando o SDK chega, quando os quatro enderecos dele falham ou em
 * ESPERA_SDK_MS; ate la fica a tela de carregamento #carregando (cartas pulando, sem texto).
 *
 * O portal e o do protocolo (foco perdido e aba escondida pausam e mutam; mudo e pausa so quando o
 * anuncio comeca) com o gp por baixo, e mais:
 * - gameStart uma vez por carga, quando o jogo ja desenhou o primeiro quadro e o SDK esta pronto (o
 *   que vier por ultimo), por fora do protocolo: com a aba escondida o protocolo seguraria o aviso;
 * - intersticial (commercialBreak, que o jogo pede na subida de nivel): showFullscreen so com o jogo
 *   em andamento, com isFullscreenAvailable e com INTERVALO_MS desde o gameStart e desde o anterior.
 *   Fora disso resolve false na hora, sem anuncio. Nada de preloader nem de sticky;
 * - premiado (rewardedBreak): showRewardedVideo({ showFailedOverlay: true }), e o premio so sai com
 *   true. Os botoes de video (.anuncio) so aparecem com isRewardedAvailable, conferido de novo cada
 *   vez que um deles aparece (o atributo hidden muda) e depois de cada anuncio;
 * - a pausa da plataforma (gp 'pause'/'resume') e o mudo dela (gp.sounds 'mute', 'mute:sfx') somam
 *   com a pausa do protocolo: o jogo para e cala enquanto qualquer um pedir. O botao de som do
 *   jogador (save.mudo) fica como ele deixou;
 * - o idioma vem do gp.language quando o jogo tem a lingua (IDIOMAS); senao fica o do navegador.
 *
 * Sem SDK (bloqueador, sem rede) tudo vira no-op: sem anuncio, sem botao de video, jogo inteiro.
 */
import { criarPortal } from './protocolo.js';

/**
 * Minimo entre o gameStart e o primeiro intersticial, e entre dois intersticiais (ms). O checklist de
 * moderacao da GamePush pede: nenhum anuncio logo ao abrir nem antes de o jogador entender o jogo, e
 * no maximo um a cada 3 minutos. O jogo ainda tem o espacamento proprio (fase 7, subidas, 150 s).
 */
export const INTERVALO_MS = 180000;
/** O index.html carrega o jogo sem o SDK depois deste prazo, desde a abertura da pagina (ms). */
export const ESPERA_SDK_MS = 8000;
/** As linguas da interface: outro idioma da plataforma fica no do navegador. */
export const IDIOMAS = ['en', 'pt', 'es', 'ru'];
/**
 * Prazos do protocolo: o init espera o SDK tanto quanto a pagina; um anuncio que nao comeca em 10 s
 * desliga os anuncios da sessao (a contagem regressiva do painel vem antes do 'start').
 */
export const PRAZOS_GAMEPUSH = Object.freeze({ init: ESPERA_SDK_MS, semResposta: { next: 10000, reward: 10000 } });

/**
 * Le uma propriedade do SDK sem deixar erro escapar.
 * @template T
 * @param {() => T} fn
 * @param {T} padrao
 * @returns {T}
 */
function ler(fn, padrao) {
  try {
    const v = fn();
    return v === undefined || v === null ? padrao : v;
  } catch {
    return padrao;
  }
}

/** @param {any} fn @param {...any} args */
function chamar(fn, ...args) {
  if (typeof fn !== 'function') return;
  try {
    fn(...args);
  } catch { /* ignora */ }
}

/**
 * A promessa do gp que o index.html guarda em window.__gp; sem ela, o jogo segue sem SDK.
 * @param {any} janela
 * @returns {Promise<any>}
 */
export function promessaDoSdk(janela) {
  try {
    const p = janela && janela.__gp;
    if (p && typeof p.then === 'function') return p;
  } catch { /* ignora */ }
  return Promise.resolve(null);
}

/**
 * O idioma da plataforma, so se a interface tem essa lingua.
 * @param {any} gp
 * @param {string[]} [idiomas]
 * @returns {string|null}
 */
export function idiomaGamePush(gp, idiomas = IDIOMAS) {
  const cod = String(ler(() => gp.language, '')).slice(0, 2).toLowerCase();
  return idiomas.includes(cod) ? cod : null;
}

const relogioPadrao = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * O adaptador do protocolo sobre o gp.
 * @param {object} p
 * @param {Promise<any>} p.sdk a promessa do gp (resolve com null sem SDK, ou nunca)
 * @param {() => number} [p.relogio] ms
 * @param {number} [p.intervaloMs]
 * @param {(gp:any) => void} [p.aoSdk] o SDK chegou (antes de o protocolo saber)
 */
export function criarAdaptadorGamePush({ sdk, relogio = relogioPadrao, intervaloMs = INTERVALO_MS, aoSdk = () => {} }) {
  /** @type {any} */
  let gp = null;
  let carregou = false;
  let iniciou = false;
  /** @type {number|null} */
  let tInicio = null;
  /** @type {number|null} */
  let tUltimo = null;
  /** @type {{aoComecar:() => void, aoTerminar:() => void}|null} o anuncio em curso */
  let pedido = null;

  /** gameStart: uma vez, com o jogo desenhado e o SDK pronto. */
  function tentarGameStart() {
    if (iniciou || !carregou || !gp) return;
    iniciou = true;
    tInicio = relogio();
    chamar(() => gp.gameStart());
  }

  const adaptador = {
    get gp() { return gp; },
    get iniciou() { return iniciou; },

    /** O jogo desenhou o primeiro quadro (o portal chama por fora do protocolo). */
    carregou() {
      carregou = true;
      tentarGameStart();
    },

    /** O intersticial pode sair agora: SDK, gameStart, os dois intervalos e a disponibilidade. */
    intersticialLiberado() {
      if (!gp || tInicio === null) return false;
      const agora = relogio();
      if (agora - tInicio < intervaloMs) return false;
      if (tUltimo !== null && agora - tUltimo < intervaloMs) return false;
      return !!ler(() => gp.ads.isFullscreenAvailable, false);
    },

    /** Ha premiado para oferecer agora. */
    premiadoDisponivel() {
      return !!gp && !!ler(() => gp.ads.isRewardedAvailable, false);
    },

    async iniciar() {
      const g = await sdk;
      if (!g) return { anuncios: false, idioma: null };
      gp = g;
      try {
        g.ads.on('start', () => { if (pedido) pedido.aoComecar(); });
        g.ads.on('close', () => { if (pedido) pedido.aoTerminar(); });
      } catch { /* ignora */ }
      chamar(aoSdk, g);
      tentarGameStart();
      return { anuncios: true, idioma: idiomaGamePush(g) };
    },

    gameLoadingFinished() {
      carregou = true;
      tentarGameStart();
    },

    gameplayStart() {
      tentarGameStart();
      if (gp) chamar(() => gp.gameplayStart());
    },

    gameplayStop() {
      if (gp) chamar(() => gp.gameplayStop());
    },

    /**
     * @param {'next'|'reward'} tipo
     * @param {string} _nome
     * @param {{aoComecar:() => void, aoTerminar:() => void}} o
     * @returns {Promise<boolean>}
     */
    anuncio(tipo, _nome, o) {
      if (!gp) return Promise.resolve(false);
      if (tipo === 'next' && !adaptador.intersticialLiberado()) return Promise.resolve(false);
      pedido = o;
      if (tipo === 'next') tUltimo = relogio();
      /** @param {any} v */
      const fim = (v) => {
        if (pedido === o) pedido = null;
        // o intervalo conta do fim do anuncio
        if (tipo === 'next') tUltimo = relogio();
        return v === true;
      };
      let r;
      try {
        r = tipo === 'next' ? gp.ads.showFullscreen() : gp.ads.showRewardedVideo({ showFailedOverlay: true });
      } catch {
        r = false;
      }
      return Promise.resolve(r).then(fim, () => fim(false));
    },
  };
  return adaptador;
}

/**
 * Tira a tela de carregamento da pagina.
 * @param {any} janela
 */
function tirarCarregamento(janela) {
  try {
    const el = janela.document.getElementById('carregando');
    if (el) el.remove();
  } catch { /* ignora */ }
}

/**
 * O portal da GamePush: o protocolo com o adaptador do gp e as camadas da plataforma.
 * @param {object} [p]
 * @param {Promise<any>} [p.sdk]
 * @param {any} [p.janela]
 * @param {Partial<typeof import('./protocolo.js').PRAZOS_PADRAO>} [p.prazos]
 * @param {(fn:() => void, ms:number) => any} [p.agendar]
 * @param {(id:any) => void} [p.cancelar]
 * @param {() => number} [p.relogio]
 * @param {number} [p.intervaloMs]
 */
export function criarPortalGamePush({ sdk, janela = globalThis, prazos, agendar, cancelar, relogio, intervaloMs } = {}) {
  const plataforma = { pausa: false, mudo: false };
  /** Os ganchos que o main.js pendura no portal: o audio, a pausa e os botoes de video. */
  const jogo = { mudar: null, voltar: null, pausa: null, anuncios: null };
  let protocoloParado = false;
  let protocoloAnuncios = false;
  let mudoAplicado = false;
  let pausaAplicada = false;
  /** @type {boolean|null} */
  let botoesAplicados = null;

  const adaptador = criarAdaptadorGamePush({ sdk: sdk || promessaDoSdk(janela), relogio, intervaloMs, aoSdk: ligarPlataforma });
  const portal = criarPortal({
    adaptador, janela, agendar, cancelar,
    prazos: { ...PRAZOS_GAMEPUSH, ...(prazos || {}), semResposta: { ...PRAZOS_GAMEPUSH.semResposta, ...((prazos && prazos.semResposta) || {}) } },
  });

  /** Mudo e pausa do jogo: a soma do protocolo (anuncio, foco, aba) com a plataforma. */
  function aplicar() {
    const mudo = protocoloParado || plataforma.pausa || plataforma.mudo;
    if (mudo !== mudoAplicado) {
      mudoAplicado = mudo;
      chamar(mudo ? jogo.mudar : jogo.voltar);
    }
    const pausa = protocoloParado || plataforma.pausa;
    if (pausa !== pausaAplicada) {
      pausaAplicada = pausa;
      chamar(jogo.pausa, pausa);
    }
  }

  /** Os botoes de video: so com o SDK de pe e um premiado disponivel agora. */
  function atualizarBotoes() {
    const ligados = protocoloAnuncios && adaptador.premiadoDisponivel();
    if (ligados === botoesAplicados) return;
    botoesAplicados = ligados;
    chamar(jogo.anuncios, ligados);
  }

  /** Um botao de video (ou o cartao dele) aparece: a disponibilidade e conferida de novo. */
  function vigiarBotoes() {
    try {
      const doc = janela.document;
      const MO = janela.MutationObserver;
      if (!doc || !doc.body || typeof MO !== 'function') return;
      new MO(() => atualizarBotoes()).observe(doc.body, { attributes: true, attributeFilter: ['hidden'], subtree: true });
    } catch { /* ignora */ }
  }

  /** @param {any} gp */
  function ligarPlataforma(gp) {
    plataforma.pausa = !!ler(() => gp.isPaused, false);
    const som = { geral: !!ler(() => gp.sounds.isMuted, false), efeitos: !!ler(() => gp.sounds.isSFXMuted, false) };
    const mudo = () => {
      plataforma.mudo = som.geral || som.efeitos;
      aplicar();
    };
    try {
      gp.on('pause', () => { plataforma.pausa = true; aplicar(); });
      gp.on('resume', () => { plataforma.pausa = false; aplicar(); });
      // o jogo nao tem musica: todo som e efeito, e o mute:music nao muda nada
      gp.sounds.on('mute', () => { som.geral = true; mudo(); });
      gp.sounds.on('unmute', () => { som.geral = false; mudo(); });
      gp.sounds.on('mute:sfx', () => { som.efeitos = true; mudo(); });
      gp.sounds.on('unmute:sfx', () => { som.efeitos = false; mudo(); });
    } catch { /* ignora */ }
    // um toque no jogo com o SDK fora de pausa solta uma pausa que ficou para tras
    try {
      if (janela.addEventListener) {
        janela.addEventListener('pointerdown', () => {
          if (plataforma.pausa && !ler(() => gp.isPaused, true)) { plataforma.pausa = false; aplicar(); }
        }, true);
      }
    } catch { /* ignora */ }
    mudo();
    vigiarBotoes();
  }

  /** @param {() => any} get @param {(v:any) => void} set */
  const acessor = (get, set) => ({ get, set, configurable: true, enumerable: true });
  const sdkPronto = /** @type {() => boolean} */ (/** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(portal, 'sdkPronto')).get);
  Object.defineProperties(portal, {
    // o protocolo chama estes tres; o main.js grava neles os ganchos do jogo
    onAdStart: acessor(() => () => { protocoloParado = true; aplicar(); }, (f) => { jogo.mudar = f; }),
    onAdEnd: acessor(() => () => { protocoloParado = false; aplicar(); }, (f) => { jogo.voltar = f; }),
    onPausa: acessor(() => (/** @type {boolean} */ v) => { protocoloParado = !!v; aplicar(); }, (f) => { jogo.pausa = f; }),
    aoAnuncios: acessor(() => (/** @type {boolean} */ v) => { protocoloAnuncios = !!v; atualizarBotoes(); }, (f) => { jogo.anuncios = f; botoesAplicados = null; }),
    // o main.js mostra o "Continuar" com video e pede o premiado por aqui
    sdkPronto: { get: () => sdkPronto.call(portal) && adaptador.premiadoDisponivel(), configurable: true, enumerable: true },
  });

  const carregou = portal.gameLoadingFinished;
  portal.gameLoadingFinished = () => {
    tirarCarregamento(janela);
    adaptador.carregou();
    carregou();
  };
  const comecou = portal.gameplayStart;
  portal.gameplayStart = () => {
    atualizarBotoes();
    comecou();
  };
  const intervalo = portal.commercialBreak;
  // so na passagem com o jogo em andamento: o "Recomecar o nivel" do cartao da mesa cheia, que pode
  // ter o premiado na mesma tela, fica sem intersticial
  portal.commercialBreak = () => (portal.emJogo && adaptador.intersticialLiberado()
    ? intervalo().then((v) => { atualizarBotoes(); return v; })
    : Promise.resolve(false));
  const premio = portal.rewardedBreak;
  portal.rewardedBreak = () => premio().then((v) => { atualizarBotoes(); return v; });
  return portal;
}

export const portal = criarPortalGamePush();
