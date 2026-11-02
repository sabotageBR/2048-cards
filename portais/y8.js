/**
 * Y8: SDK minimo 2.x (docs.y8.com/sdk). A propria Y8 roda o pre-roll; o jogo so pede `next` na
 * passagem e `reward` por escolha. Sem os ids, nao ha SDK nem anuncio.
 */
import { IDS } from './ids.js';
import { carregarScript, criarPortal } from './protocolo.js';

const SDK_URL = 'https://cdn.y8.com/minimal-sdk/2-0/y8.min.js';

/**
 * @param {object} p
 * @param {{appId:string, gameId:string}} p.ids
 * @param {any} [p.janela]
 * @param {(url:string) => Promise<void>} [p.carregar]
 * @param {(fn:() => void, ms:number) => any} [p.agendar]
 */
export function criarAdaptadorY8({ ids, janela = globalThis, carregar = carregarScript, agendar = (fn, ms) => setTimeout(fn, ms) }) {
  /** @type {any} */
  let sdk = null;
  return {
    async iniciar() {
      if (!ids.appId || !ids.gameId) return { anuncios: false, idioma: null };
      const pronto = new Promise((ok) => {
        janela.addEventListener('y8sdk.ready', () => ok(undefined), { once: true });
      });
      await carregar(SDK_URL);
      // o script e assincrono: o evento pode ter saido antes do ouvinte
      if (janela.y8 && janela.y8.emitReadyEvent) janela.y8.emitReadyEvent();
      await pronto;
      sdk = janela.y8.sdk();
      const r = sdk.init({ appId: ids.appId, autoLogin: false }, { gameId: String(ids.gameId), preloadAdBreaks: 'on', sound: 'on' });
      if (r && r.catch) r.catch(() => {});
      /** @type {string|null} */
      let idioma = null;
      try {
        const loc = await Promise.race([sdk.getPlatformLocale(), new Promise((ok) => { agendar(() => ok(null), 1500); })]);
        // `en` e tambem o que o www responde: nao diz nada sobre o jogador
        if (loc && !/^en/i.test(loc)) idioma = loc;
      } catch { /* fica o idioma do navegador */ }
      return { anuncios: true, idioma };
    },
    gameLoadingFinished() {},
    gameplayStart() {},
    gameplayStop() {},
    /**
     * @param {'next'|'reward'} tipo
     * @param {string} nome
     * @param {{aoComecar:() => void, aoTerminar:() => void}} o
     */
    anuncio(tipo, nome, { aoComecar, aoTerminar }) {
      return new Promise((ok, falha) => {
        let viu = false;
        /** @type {any} */
        const pedido = {
          type: tipo,
          name: nome,
          beforeAd: aoComecar,
          afterAd: () => {
            aoTerminar();
            // o adBreakDone costuma vir logo depois; sem ele, a passagem nao espera
            agendar(() => ok(viu), 1500);
          },
          adBreakDone: () => ok(viu),
        };
        if (tipo === 'reward') {
          pedido.beforeReward = (/** @type {() => void} */ mostrar) => mostrar();
          pedido.adViewed = () => { viu = true; };
          pedido.adDismissed = () => {};
        }
        const r = sdk.showAd(pedido);
        if (r && r.catch) r.catch(falha);
      });
    },
  };
}

export const portal = criarPortal({ adaptador: criarAdaptadorY8({ ids: IDS }) });
