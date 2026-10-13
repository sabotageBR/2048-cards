// HUD em DOM: painel (mundo e nivel, pontos e a barra do nivel com o valor
// que falta), contadores de itens e desfazer, e os botoes de video (rewarded)
// que o main.js libera. A barra vem do progresso do
// nivel (metas.js) a cada jogada; o resto tambem.
import { textoMeta } from '../i18n/textos.js';
import { POR_MUNDO, alvoDoNivel } from '../jogo/fases.js';

/**
 * @param {{ T: any, $: (id: string) => HTMLElement }} p
 */
export function criarHud({ T, $ }) {
  let ultimoPontos = -1, ultimoProg = -1, comEscada = false, ultimoNivel = -1;
  $('pontosTxt').textContent = T.pontos;
  $('vDescarteTxt').textContent = T.videoEsvaziar;
  /** Opcao visual em teste (?visual=escada): os 8 valores do mundo no painel. */
  function mostrarEscada(sim) {
    comEscada = sim;
    $('escada').hidden = !sim;
    $('painel').classList.toggle('comEscada', sim);
    ultimoNivel = -1;
  }
  function atualizar(e, info = {}) {
    const pontos = $('pontos');
    if (e.pontos !== ultimoPontos) {
      pontos.textContent = String(e.pontos);
      if (ultimoPontos >= 0 && e.pontos > ultimoPontos) { pontos.classList.remove('pula'); void pontos.offsetWidth; pontos.classList.add('pula'); }
      ultimoPontos = e.pontos;
    }
    $('rotulo').textContent = info.rotulo || '';
    if (comEscada && e.nivel !== ultimoNivel) {
      ultimoNivel = e.nivel;
      const el = $('escada');
      el.innerHTML = '';
      for (let k = 1; k <= POR_MUNDO; k++) {
        const i = document.createElement('i');
        i.textContent = String(alvoDoNivel(k));
        if (k < e.nivel) i.className = 'feito';
        else if (k === e.nivel) i.className = 'alvo';
        el.appendChild(i);
      }
    }
    $('metaTxt').textContent = e.metas.map((m) => textoMeta(T, m, e.regras.teto)).join('   ');
    $('nDesfazer').textContent = e.itens.desfazer > 1 ? String(e.itens.desfazer) : '';
    /** @type {HTMLButtonElement} */ ($('bDesfazer')).disabled = !(info.podeDesfazer && e.itens.desfazer > 0);
    const videos = info.videos || {};
    $('vDescarte').hidden = !videos.descarte;
    $('vCoringa').hidden = !videos.coringa;
    const temItens = e.itens.coringa + e.itens.martelo + e.itens.troca > 0;
    $('base').hidden = !temItens && !videos.descarte && !videos.coringa;
    for (const [id, k] of [['iCoringa', 'coringa'], ['iMartelo', 'martelo'], ['iTroca', 'troca']]) {
      const b = /** @type {HTMLButtonElement} */ ($(id));
      b.querySelector('.conta').textContent = String(e.itens[k]);
      b.disabled = !(e.itens[k] > 0);
      b.hidden = !(e.itens[k] > 0);
      b.classList.toggle('pendente', info.itemPendente === k);
    }
  }
  /** Progresso do nivel (0..1) na barra. */
  function progresso(p) {
    if (Math.abs(p - ultimoProg) < 0.0005) return;
    ultimoProg = p;
    $('barra').style.width = p > 0.001 ? `max(18px, calc(${(p * 100).toFixed(2)}% - 4px))` : '0px';
  }
  function febre(ligada) {
    const el = $('febre');
    el.hidden = !ligada;
    if (ligada) $('febreTxt').textContent = T.febre;
  }
  return { atualizar, progresso, febre, mostrarEscada };
}
