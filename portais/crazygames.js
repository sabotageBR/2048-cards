/**
 * CrazyGames: SDK HTML5 v3 (docs.crazygames.com). Este build e o da Basic Launch, em que a
 * plataforma nao serve anuncio nenhum: so o ciclo de vida e o idioma. A Full Launch pede os
 * anuncios, o muteAudio e o progresso no SDK.data.
 */
import { carregarScript, criarPortal } from './protocolo.js';

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

/**
 * @param {object} [p]
 * @param {any} [p.janela]
 * @param {(url:string) => Promise<void>} [p.carregar]
 */
export function criarAdaptadorCrazyGames({ janela = globalThis, carregar = carregarScript } = {}) {
  /** @type {any} */
  let sdk = null;
  let jogando = false;
  /** @param {() => void} fn */
  const seguro = (fn) => {
    try {
      fn();
    } catch { /* fora dos dominios dela o SDK lanca */ }
  };
  return {
    async iniciar() {
      await carregar(SDK_URL);
      await janela.CrazyGames.SDK.init();
      const s = janela.CrazyGames.SDK;
      if (s.environment === 'disabled') return { anuncios: false, idioma: null };
      sdk = s;
      seguro(() => sdk.game.loadingStart());
      /** @type {string|null} */
      let idioma = null;
      seguro(() => { idioma = sdk.user.systemInfo.locale || null; });
      return { anuncios: false, idioma };
    },
    gameLoadingFinished() {
      if (!sdk) return;
      seguro(() => sdk.game.loadingStop());
      // o primeiro gameplayStart fecha a medida de download: vale quando da para jogar
      this.gameplayStart();
    },
    gameplayStart() {
      if (!sdk || jogando) return;
      jogando = true;
      seguro(() => sdk.game.gameplayStart());
    },
    gameplayStop() {
      if (!sdk || !jogando) return;
      jogando = false;
      seguro(() => sdk.game.gameplayStop());
    },
  };
}

export const portal = criarPortal({ adaptador: criarAdaptadorCrazyGames() });
