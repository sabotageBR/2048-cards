/**
 * Protocolo dos portais Y8 e CrazyGames. tools/empacotar-portal.mjs copia este arquivo para
 * src/core/protocolo.js e o adaptador do portal para src/core/portal.js. Mesma base do Clock
 * Tinker e do String Cut.
 *
 * Regras dos portais:
 * - mudo e pausa so quando o anuncio COMECA, nunca no pedido; uma pausa pulada nao toca no jogo;
 * - foco perdido e aba escondida tambem pausam e mutam, com o mesmo onAdStart/onAdEnd. Os motivos
 *   (anuncio, foco, aba) sao separados e o jogo so e avisado quando o conjunto muda;
 * - sem resposta no prazo, os anuncios desligam na sessao, para nao travar toda passagem;
 * - depois de comecar, vale o teto de seguranca; um anuncio que comeca atrasado ainda muta;
 * - nada vai ao SDK durante anuncio ou sem foco: o estado e acertado na volta.
 *
 * O jogo funciona igual sem SDK, com bloqueador e sem os ids: nenhuma promessa daqui rejeita.
 */

/** Prazos em ms. */
export const PRAZOS_PADRAO = Object.freeze({ init: 4000, semResposta: { next: 6000, reward: 10000 }, teto: 180000 });

/**
 * @typedef {object} Adaptador
 * @property {() => Promise<{anuncios:boolean, idioma:string|null}>} iniciar
 * @property {() => void} gameLoadingFinished
 * @property {() => void} gameplayStart
 * @property {() => void} gameplayStop
 * @property {(tipo:'next'|'reward', nome:string, o:{aoComecar:() => void, aoTerminar:() => void}) => Promise<boolean>} [anuncio]
 */

/**
 * @param {object} p
 * @param {Adaptador} p.adaptador
 * @param {any} [p.janela] o alvo dos eventos de foco
 * @param {Partial<typeof PRAZOS_PADRAO>} [p.prazos]
 * @param {(fn:() => void, ms:number) => any} [p.agendar]
 * @param {(id:any) => void} [p.cancelar]
 */
export function criarPortal({ adaptador, janela = globalThis, prazos, agendar = (fn, ms) => setTimeout(fn, ms), cancelar = (id) => clearTimeout(id) }) {
  const limites = { ...PRAZOS_PADRAO, ...(prazos || {}) };
  /** @type {Set<string>} */
  const motivos = new Set();
  let parado = false;
  let vivo = false;
  let comAnuncios = false;
  let pedidoCarregou = false;
  let enviouCarregou = false;
  let emJogo = false;
  let emJogoNoSdk = false;
  let jogou = false;
  let emAnuncio = false;
  /** @type {string|null} */
  let idioma = null;
  /** @type {((cod:string) => void)|null} */
  let aoIdioma = null;
  /** @type {Promise<void>|null} */
  let promessaInit = null;

  /** @param {(() => void)|null|undefined} fn */
  function avisar(fn) {
    if (typeof fn !== 'function') return;
    try {
      fn();
    } catch { /* ignora */ }
  }

  /** @param {'gameLoadingFinished'|'gameplayStart'|'gameplayStop'} nome */
  function enviar(nome) {
    try {
      adaptador[nome]();
    } catch { /* ignora */ }
  }

  /** Leva ao SDK o que ficou pendente: o carregamento e depois o estado de jogo. */
  function sincronizar() {
    if (!vivo || motivos.size) return;
    if (pedidoCarregou && !enviouCarregou) {
      enviouCarregou = true;
      enviar('gameLoadingFinished');
    }
    if (!enviouCarregou || emJogo === emJogoNoSdk) return;
    emJogoNoSdk = emJogo;
    enviar(emJogo ? 'gameplayStart' : 'gameplayStop');
  }

  /** Avisa o jogo so quando o conjunto de motivos muda. */
  function atualizar() {
    const agora = motivos.size > 0;
    if (agora === parado) return;
    parado = agora;
    avisar(agora ? portal.onAdStart : portal.onAdEnd);
    try {
      if (portal.onPausa) portal.onPausa(agora);
    } catch { /* ignora */ }
    if (!agora) sincronizar();
  }

  /** @param {string} motivo */
  function parar(motivo) {
    motivos.add(motivo);
    atualizar();
  }

  /** @param {string} motivo */
  function seguir(motivo) {
    if (motivos.delete(motivo)) atualizar();
  }

  /** @param {boolean} ligados */
  function definirAnuncios(ligados) {
    comAnuncios = ligados;
    try {
      if (portal.aoAnuncios) portal.aoAnuncios(ligados);
    } catch { /* ignora */ }
  }

  /**
   * Um anuncio. Resolve com o que o adaptador disser, ou false sem resposta.
   * @param {'next'|'reward'} tipo
   * @param {string} nome
   * @returns {Promise<boolean>}
   */
  function pedirAnuncio(tipo, nome) {
    return new Promise((resolve) => {
      let terminou = false;
      /** @type {any} */
      let id = null;
      /** @type {any} */
      let idTeto = null;
      const desarmar = () => {
        if (id !== null) cancelar(id);
        id = null;
      };
      /** @param {boolean} v */
      const fim = (v) => {
        if (terminou) return;
        terminou = true;
        desarmar();
        resolve(v);
      };
      const aoTerminar = () => {
        if (idTeto !== null) cancelar(idTeto);
        idTeto = null;
        seguir('anuncio');
      };
      const aoComecar = () => {
        desarmar();
        parar('anuncio');
        idTeto = agendar(() => {
          idTeto = null;
          seguir('anuncio');
          fim(false);
        }, limites.teto);
      };
      id = agendar(() => {
        id = null;
        definirAnuncios(false);
        fim(false);
      }, limites.semResposta[tipo]);
      let pedido;
      try {
        pedido = /** @type {NonNullable<Adaptador['anuncio']>} */ (adaptador.anuncio)(tipo, nome, { aoComecar, aoTerminar });
      } catch {
        pedido = false;
      }
      Promise.resolve(pedido).then((v) => {
        aoTerminar();
        fim(v === true);
      }, () => {
        aoTerminar();
        fim(false);
      });
    });
  }

  /**
   * @param {'next'|'reward'} tipo
   * @param {string} nome
   */
  async function rodarAnuncio(tipo, nome) {
    emJogo = false;
    sincronizar();
    emAnuncio = true;
    const resultado = await pedirAnuncio(tipo, nome);
    emAnuncio = false;
    sincronizar();
    return resultado;
  }

  const portal = {
    /** @type {(() => void)|null} */
    onAdStart: null,
    /** @type {(() => void)|null} */
    onAdEnd: null,
    /** @type {((parado:boolean) => void)|null} anuncio, foco perdido ou aba escondida; so os portais chamam */
    onPausa: null,
    /** @type {((ligados:boolean) => void)|null} */
    aoAnuncios: null,

    get emJogo() { return emJogo; },
    get jogando() { return emJogo; },
    get jaJogou() { return jogou && comAnuncios; },
    get emAnuncio() { return emAnuncio; },
    get sdkPronto() { return vivo && comAnuncios; },
    get pronto() { return vivo && comAnuncios; },
    get dispositivo() { return null; },

    init() {
      if (promessaInit) return promessaInit;
      if (janela && janela.addEventListener) {
        janela.addEventListener('blur', () => parar('foco'));
        janela.addEventListener('focus', () => seguir('foco'));
        // o clique de volta chega com a entrada desligada: a captura religa antes
        janela.addEventListener('pointerdown', () => seguir('foco'), true);
      }
      // no celular trocar de app esconde a aba sem blur na janela
      const doc = janela && janela.document;
      if (doc && doc.addEventListener) {
        const aba = () => (doc.hidden ? parar('aba') : seguir('aba'));
        doc.addEventListener('visibilitychange', aba);
        aba();
      }
      promessaInit = new Promise((resolve) => {
        const id = agendar(resolve, limites.init);
        Promise.resolve().then(() => adaptador.iniciar()).then((r) => {
          vivo = true;
          idioma = (r && r.idioma) || null;
          if (idioma && aoIdioma) aoIdioma(idioma);
          definirAnuncios(!!(r && r.anuncios));
          sincronizar();
          cancelar(id);
          resolve(undefined);
        }, () => {
          cancelar(id);
          resolve(undefined);
        });
      });
      return promessaInit;
    },

    /** @param {(cod:string) => void} fn so se o jogador nao escolheu um idioma */
    ligarIdioma(fn) {
      aoIdioma = fn;
      if (idioma) fn(idioma);
    },

    gameLoadingFinished() {
      pedidoCarregou = true;
      sincronizar();
    },

    gameplayStart() {
      if (emJogo || emAnuncio) return;
      pedidoCarregou = true;
      emJogo = true;
      jogou = true;
      sincronizar();
    },

    gameplayStop() {
      if (!emJogo) return;
      emJogo = false;
      sincronizar();
    },

    async commercialBreak() {
      if (!vivo || !comAnuncios || emAnuncio || !jogou) return false;
      await rodarAnuncio('next', 'passagem');
      return true;
    },

    async rewardedBreak() {
      if (!vivo || !comAnuncios || emAnuncio) return false;
      return rodarAnuncio('reward', 'recompensa');
    },

    measure() {},
    captureError() {},
    movePill() {},
    openExternalLink() { return false; },
  };
  return portal;
}

/**
 * Carrega o script do SDK; rejeita em erro de rede.
 * @param {string} url
 * @returns {Promise<void>}
 */
export function carregarScript(url) {
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => falha(new Error('sdk'));
    document.head.appendChild(s);
  });
}
