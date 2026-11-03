/**
 * Wavedash (docs.wavedash.com): a plataforma injeta window.Wavedash na pagina antes de qualquer
 * script do jogo. Nao ha script a carregar e nao ha anuncio: intersticial e rewarded respondem
 * "sem anuncio" na hora (o protocolo recusa sem SDK de anuncios) e os botoes de video somem.
 *
 * O jogo fica escondido atras da tela de carregamento da Wavedash ate o Wavedash.init(), que ja
 * chama o loadComplete(). Ele sai uma vez so e por fora do protocolo: o protocolo segura o
 * gameLoadingFinished enquanto ha pausa (foco perdido, aba escondida), e com o jogo escondido o
 * jogador nao tem como devolver o foco. Por isso o portal daqui revela no gameLoadingFinished e no
 * gameplayStart antes de seguir para o protocolo, e uma reserva por timer revela se nada o fez.
 * Nada aqui espera o requestAnimationFrame, que o Chrome segura num iframe oculto de outra origem.
 *
 * Sem window.Wavedash (fora dela, local) tudo vira no-op e o jogo roda igual.
 */
import { criarPortal } from './protocolo.js';

/** A reserva: sem aviso de carregamento ate aqui (ms desde o modulo), o init sai assim mesmo. */
export const RESERVA_MS = 8000;
/** Os idiomas da interface do jogo: outro idioma da Wavedash fica no do navegador. */
export const IDIOMAS = ['en', 'pt', 'es'];

/**
 * O revelador: a barra de carregamento da Wavedash e o init, uma vez so.
 * @param {object} [p]
 * @param {any} [p.janela]
 * @param {(fn:() => void, ms:number) => any} [p.agendar]
 * @param {(id:any) => void} [p.cancelar]
 * @param {number} [p.reservaMs]
 */
export function criarReveladorWavedash({ janela = globalThis, agendar = (fn, ms) => setTimeout(fn, ms), cancelar = (id) => clearTimeout(id), reservaMs = RESERVA_MS } = {}) {
  let revelado = false;
  let ultimo = 0;
  /** @type {any} */
  let id = null;
  const temSdk = () => {
    try {
      return !!(janela && janela.Wavedash);
    } catch {
      return false;
    }
  };
  const revelador = {
    get revelado() { return revelado; },

    /** @param {number} p de 0 a 1; a barra so anda para a frente, e nada depois do init */
    progresso(p) {
      if (revelado || !(p > ultimo) || !temSdk()) return;
      ultimo = Math.min(1, p);
      try {
        janela.Wavedash.updateLoadProgressZeroToOne(ultimo);
      } catch { /* ignora */ }
    },

    /** Tira o jogo de tras da tela de carregamento. */
    revelar() {
      if (revelado) return;
      revelador.progresso(1);
      revelado = true;
      if (id !== null) cancelar(id);
      id = null;
      if (!temSdk()) return;
      try {
        janela.Wavedash.init();
      } catch { /* ignora */ }
    },
  };
  // sem a Wavedash nao ha o que revelar: nem timer pendurado (fora dela e nos testes do Node)
  if (!temSdk()) return revelador;
  id = agendar(() => {
    id = null;
    revelador.revelar();
  }, reservaMs);
  revelador.progresso(0.2);
  // a pagina inteira (estilo e fontes pedidas) chegou: mais um passo da barra
  try {
    if (janela && janela.addEventListener) janela.addEventListener('load', () => revelador.progresso(0.8), { once: true });
  } catch { /* ignora */ }
  return revelador;
}

/**
 * O idioma do jogador na Wavedash, so se a interface tem esse idioma.
 * @param {any} janela
 * @param {string[]} idiomas
 * @returns {string|null}
 */
export function idiomaWavedash(janela, idiomas = IDIOMAS) {
  try {
    const cod = String(janela.Wavedash.getUserLanguage() || '');
    return idiomas.includes(cod.slice(0, 2).toLowerCase()) ? cod : null;
  } catch {
    return null;
  }
}

/**
 * @param {object} p
 * @param {ReturnType<typeof criarReveladorWavedash>} p.revelador
 * @param {any} [p.janela]
 * @param {string[]} [p.idiomas]
 */
export function criarAdaptadorWavedash({ revelador, janela = globalThis, idiomas = IDIOMAS }) {
  return {
    async iniciar() {
      revelador.progresso(0.5);
      return { anuncios: false, idioma: idiomaWavedash(janela, idiomas) };
    },
    gameLoadingFinished() { revelador.revelar(); },
    gameplayStart() { revelador.revelar(); },
    gameplayStop() {},
  };
}

/**
 * O portal do protocolo com o init por fora dele: o aviso de carregamento e o primeiro toque
 * revelam na hora, com o jogo pausado ou sem foco.
 * @param {object} p
 * @param {ReturnType<typeof criarReveladorWavedash>} p.revelador
 * @param {any} [p.janela]
 * @param {Partial<typeof import('./protocolo.js').PRAZOS_PADRAO>} [p.prazos]
 * @param {(fn:() => void, ms:number) => any} [p.agendar]
 * @param {(id:any) => void} [p.cancelar]
 */
export function criarPortalWavedash({ revelador, janela = globalThis, prazos, agendar, cancelar }) {
  const portal = criarPortal({ adaptador: criarAdaptadorWavedash({ revelador, janela }), janela, prazos, agendar, cancelar });
  const carregou = portal.gameLoadingFinished;
  const comecou = portal.gameplayStart;
  portal.gameLoadingFinished = () => {
    revelador.revelar();
    carregou();
  };
  portal.gameplayStart = () => {
    revelador.revelar();
    comecou();
  };
  return portal;
}

export const portal = criarPortalWavedash({ revelador: criarReveladorWavedash() });
