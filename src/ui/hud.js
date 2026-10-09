// HUD em DOM: placar, barra da meta, contadores de itens e descarte.
import { textoMeta } from '../i18n/textos.js';

/**
 * @param {{ T: any, $: (id: string) => HTMLElement }} p
 */
export function criarHud({ T, $ }) {
  let ultimoPontos = -1;
  function atualizar(e, info = {}) {
    const pontos = $('pontos');
    if (e.pontos !== ultimoPontos) {
      pontos.textContent = String(e.pontos);
      if (ultimoPontos >= 0 && e.pontos > ultimoPontos) { pontos.classList.remove('pula'); void pontos.offsetWidth; pontos.classList.add('pula'); }
      ultimoPontos = e.pontos;
    }
    $('rotulo').textContent = info.rotulo || '';
    $('recorde').textContent = info.recorde ? `${T.recorde} ${info.recorde}` : '';
    const placar = $('pontos').closest('.placar');
    const m = e.metas[0];
    if (m) {
      placar.classList.remove('semMeta');
      const feitas = e.metas.filter((x) => x.feita).length;
      const total = e.metas.length;
      const prog = e.metas.reduce((s, x) => s + Math.min(1, x.atual / x.alvo), 0) / total;
      $('barra').style.width = `${Math.round(prog * 100)}%`;
      const pend = e.metas.find((x) => !x.feita) || m;
      $('metaTxt').textContent = (total > 1 ? `${feitas}/${total} · ` : '') + textoMeta(T, pend) + (pend.alvo > 1 && pend.tipo !== 'pontos' ? ` (${pend.atual}/${pend.alvo})` : '');
    } else placar.classList.add('semMeta');
    $('nDesfazer').textContent = e.itens.desfazer > 1 ? String(e.itens.desfazer) : '';
    /** @type {HTMLButtonElement} */ ($('bDesfazer')).disabled = !(info.podeDesfazer && e.itens.desfazer > 0);
    const temItens = e.itens.coringa + e.itens.martelo + e.itens.troca > 0;
    $('base').hidden = !temItens;
    for (const [id, k] of [['iCoringa', 'coringa'], ['iMartelo', 'martelo'], ['iTroca', 'troca']]) {
      const b = /** @type {HTMLButtonElement} */ ($(id));
      b.querySelector('.conta').textContent = String(e.itens[k]);
      b.disabled = !(e.itens[k] > 0);
      b.hidden = !(e.itens[k] > 0);
      b.classList.toggle('pendente', info.itemPendente === k);
    }
  }
  function febre(ligada) {
    const el = $('febre');
    el.hidden = !ligada;
    if (ligada) $('febreTxt').textContent = T.febre;
  }
  return { atualizar, febre };
}
