/**
 * itch.io (itch.io/docs/creators/html5): o jogo roda num iframe de html-classic.itch.zone, numa
 * subpasta do upload, sem SDK nenhum. Nao ha anuncio: intersticial e rewarded respondem "sem
 * anuncio" na hora (o protocolo recusa sem SDK de anuncios) e os botoes de video somem. O
 * Continuar gratis da mesa cheia e o recomeco do nivel seguem iguais.
 *
 * O idioma e o do navegador, porque nao ha conta de quem joga. O save fica no localStorage com o
 * prefixo do jogo (src/core/armazenamento.js): a origem e a mesma de todos os jogos HTML da itch,
 * e ela nao muda de um upload para o outro, entao o progresso passa de uma versao para a seguinte.
 */
import { criarPortal } from './protocolo.js';

/** O adaptador do protocolo: nada a carregar, sem anuncio e sem idioma de conta. */
export function criarAdaptadorItch() {
  return {
    async iniciar() {
      return { anuncios: false, idioma: null };
    },
    gameLoadingFinished() {},
    gameplayStart() {},
    gameplayStop() {},
  };
}

/**
 * O portal da itch.io: o protocolo (foco perdido e aba escondida pausam e mutam) com o adaptador
 * sem SDK.
 * @param {object} [p]
 * @param {any} [p.janela]
 * @param {Partial<typeof import('./protocolo.js').PRAZOS_PADRAO>} [p.prazos]
 * @param {(fn:() => void, ms:number) => any} [p.agendar]
 * @param {(id:any) => void} [p.cancelar]
 */
export function criarPortalItch({ janela = globalThis, prazos, agendar, cancelar } = {}) {
  return criarPortal({ adaptador: criarAdaptadorItch(), janela, prazos, agendar, cancelar });
}

export const portal = criarPortalItch();
