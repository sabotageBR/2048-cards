// HUD em DOM: painel (mundo e nivel, pontos e a barra do nivel com o valor
// que falta), contadores de itens e desfazer, e os botoes de video (rewarded)
// que o main.js libera. A barra vem do progresso do
// nivel (metas.js) a cada jogada; o resto tambem.
// Missao na mesa (0.5.0): a missao ativa no painel, icone e contador, sem
// frase (A: na linha do painel; B: no vao dos botoes). Cumprida, o chip fica
// dourado, o premio voa em arco ate o botao do item e o botao pulsa; o voo
// anda no relogio do jogo (`animar(agora)`), para o ?voo= dos prints congelar.
import { textoMeta, textoMissao } from '../i18n/textos.js';
import { POR_MUNDO, alvoDoNivel } from '../jogo/fases.js';
import { ICONES, ICONES_MISSAO, curto } from './icones.js';

/** O chip fica dourado ate o pouso; o voo comeca em VOO_DE e dura VOO_MS (ms). */
const VOO_DE = 400, VOO_MS = 650;
/** Ponto do arco do voo (bezier quadratica que abre para o lado, no meio do caminho). */
function arco(a, b, u) {
  const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const cx = (a.x + b.x) / 2 - dy * 0.3, cy = (a.y + b.y) / 2 + dx * 0.3;
  const x = (1 - e) ** 2 * a.x + 2 * (1 - e) * e * cx + e * e * b.x;
  const y = (1 - e) ** 2 * a.y + 2 * (1 - e) * e * cy + e * e * b.y;
  return { x, y, esc: 1 + 0.35 * Math.sin(Math.PI * e) };
}
const centro = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, ok: r.width > 0 }; };
const BOTAO = { coringa: 'iCoringa', martelo: 'iMartelo', troca: 'iTroca' };

/**
 * @param {{ T: any, $: (id: string) => HTMLElement }} p
 */
export function criarHud({ T, $ }) {
  let ultimoPontos = -1, ultimoProg = -1, comEscada = false, ultimoNivel = -1;
  let comMissao = false, ultimaMissao = '', ultimoE = null, ultimaInfo = {};
  /** premios de missao comemorando ou voando: { m, t0 } (o primeiro da fila anda; os outros esperam) */
  let festas = [];
  /** depois do pouso: aoPousar(premio) (som e vibracao, no main.js) */
  let aoPousar = () => {};
  $('pontosTxt').textContent = T.pontos;
  $('vDescarteTxt').textContent = T.videoEsvaziar;
  /** Liga a missao na mesa (b: no vao dos botoes, em retrato). */
  function mostrarMissao(sim, b = false, pousar = aoPousar) {
    comMissao = sim;
    aoPousar = pousar;
    $('painel').classList.toggle('missaoB', sim && b);
    if (!sim) $('missao').hidden = true;
  }
  /** Desenha o chip da missao m (feita: dourado, alvo/alvo). */
  function chip(m, feita) {
    const el = $('missao');
    if (!comMissao || !m) { el.hidden = true; ultimaMissao = ''; return; }
    const chave = `${m.id}:${m.atual}:${feita ? 1 : 0}`;
    if (chave === ultimaMissao) return;
    const nova = !ultimaMissao.startsWith(`${m.id}:`);
    ultimaMissao = chave;
    el.hidden = false;
    $('missaoIc').innerHTML = m.tipo === 'cartas' ? `<i class="mcarta">${m.v}</i>` : (ICONES_MISSAO[m.tipo] || '');
    $('missaoConta').textContent = `${curto(feita ? m.alvo : m.atual)}/${curto(m.alvo)}`;
    $('missaoPremio').textContent = ICONES[m.premio] || '';
    el.setAttribute('aria-label', `${textoMissao(T, m)} · ${m.atual}/${m.alvo}`);
    el.classList.toggle('feita', !!feita);
    if (nova && !feita) { el.classList.remove('sobe'); void el.offsetWidth; el.classList.add('sobe'); }
  }
  /** Premios ainda no ar (o botao mostra a conta sem eles ate o pouso). */
  const noAr = (k) => festas.filter((f) => f.m.premio === k).length;
  /**
   * A missao m foi cumprida no instante t0 (ms, relogio do jogo): o chip fica
   * dourado, o premio voa ate o botao e pousa. Varias na mesma jogada, em fila.
   */
  function celebrar(m, t0) {
    const ult = festas[festas.length - 1];
    festas.push({ m, t0: ult ? Math.max(t0, ult.t0 + VOO_DE + VOO_MS) : t0 });
    if (ultimoE) atualizar(ultimoE, ultimaInfo);
  }
  /**
   * Um passo do voo (todo quadro). uFixo (0..1, ?voo= dos prints): congela o
   * primeiro voo nessa fase, sem pousar.
   */
  function animar(agora, uFixo = -1) {
    const voo = $('voo');
    const f = festas[0];
    if (!f || (uFixo < 0 && agora < f.t0)) { voo.hidden = true; return; }
    const t = uFixo >= 0 ? VOO_DE + uFixo * VOO_MS : agora - f.t0;
    chip(f.m, true);
    const botao = $(BOTAO[f.m.premio] || 'iCoringa');
    if (t >= VOO_DE + VOO_MS) {
      festas.shift();
      voo.hidden = true;
      if (ultimoE) atualizar(ultimoE, ultimaInfo);
      botao.classList.remove('chega'); void botao.offsetWidth; botao.classList.add('chega');
      aoPousar(f.m.premio);
      return;
    }
    if (t < VOO_DE) { voo.hidden = true; return; }
    const a = centro($('missao')), b = centro(botao);
    if (!a.ok || !b.ok) { voo.hidden = true; return; }
    const p = arco(a, b, (t - VOO_DE) / VOO_MS);
    $('vooIc').textContent = ICONES[f.m.premio] || '';
    voo.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) scale(${p.esc.toFixed(3)})`;
    voo.hidden = false;
  }
  /** Opcao visual em teste (?visual=escada): os 8 valores do mundo no painel. */
  function mostrarEscada(sim) {
    comEscada = sim;
    $('escada').hidden = !sim;
    $('painel').classList.toggle('comEscada', sim);
    ultimoNivel = -1;
  }
  function atualizar(e, info = {}) {
    ultimoE = e; ultimaInfo = info;
    if (!festas.length) chip(info.missao, false);
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
      // o premio que ainda voa so entra na conta no pouso; o botao ja aparece para receber
      const n = Math.max(0, e.itens[k] - noAr(k));
      b.querySelector('.conta').textContent = String(n);
      b.disabled = !(n > 0);
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
  return { atualizar, progresso, febre, mostrarEscada, mostrarMissao, celebrar, animar };
}
