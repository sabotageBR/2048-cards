// HUD em DOM: painel do duelo (fase e monstro, vida, metas, dano), contadores
// de itens e desfazer. A vida vem da cena a cada quadro (so cai quando o
// golpe chega); o resto muda a cada jogada.
import { textoMeta } from '../i18n/textos.js';

/**
 * @param {{ T: any, $: (id: string) => HTMLElement }} p
 */
export function criarHud({ T, $ }) {
  let ultimoPontos = -1;
  let ultimaVida = -1, ultimaVis = -1;
  $('danoTxt').textContent = T.dano;
  function atualizar(e, info = {}) {
    const pontos = $('pontos');
    if (e.pontos !== ultimoPontos) {
      pontos.textContent = String(e.pontos);
      if (ultimoPontos >= 0 && e.pontos > ultimoPontos) { pontos.classList.remove('pula'); void pontos.offsetWidth; pontos.classList.add('pula'); }
      ultimoPontos = e.pontos;
    }
    $('rotulo').textContent = info.rotulo || '';
    $('recorde').textContent = info.recorde ? `${T.recorde} ${info.recorde}` : '';
    // na cadeia (Classico e Diario) a vida e de pontos: a barra fica mesmo sem metas
    $('painel').classList.toggle('semMeta', !e.metas.length && !(e.monstro && e.monstro.cadeia));
    if (info.metaTexto !== undefined) $('metaTxt').textContent = info.metaTexto;
    else $('metaTxt').textContent = e.metas.map((m) => (m.feita ? '✓ ' : '• ') + textoMeta(T, m, e.regras.teto) + (m.alvo > 1 && !m.feita && m.tipo !== 'montes' && m.tipo !== 'cascata' ? ` (${Math.min(m.atual, m.alvo)}/${m.alvo})` : '')).join('   ');
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
  const largura = (v) => (v > 0.001 ? `max(18px, calc(${(v * 100).toFixed(2)}% - 4px))` : '0px');
  /** Vida do monstro (0..1) e a barra clara que segue atras. */
  function vida(hp, hpVis) {
    if (Math.abs(hp - ultimaVida) > 0.0005) {
      ultimaVida = hp;
      $('barra').style.width = largura(hp);
      $('vidaTxt').textContent = `HP ${Math.ceil(hp * 100 - 0.001)}/100`;
    }
    if (Math.abs(hpVis - ultimaVis) > 0.0005) { ultimaVis = hpVis; $('barraVis').style.width = largura(hpVis); }
  }
  function febre(ligada) {
    const el = $('febre');
    el.hidden = !ligada;
    if (ligada) $('febreTxt').textContent = T.febre;
  }
  return { atualizar, vida, febre };
}
