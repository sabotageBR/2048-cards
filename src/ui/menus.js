// Menu de pausa (continuar, recomecar, som, missoes e a escada de cada mundo) e tela de fim.
import { POR_MUNDO, alvoDoNivel } from '../jogo/fases.js';

/**
 * @param {{ T: any, $: (id: string) => HTMLElement, acoes: any }} p
 */
export function criarMenus({ T, $, acoes }) {
  const menu = $('menu'), fim = $('fim');
  let aberto = false;
  $('menuTitulo').textContent = T.pausa;
  $('bContinuar').textContent = T.continuar;
  $('bRecomecar').textContent = T.recomecarNivel;
  $('missoesTitulo').textContent = T.missoes;
  $('fimTitulo').textContent = T.semJogadas;
  $('bFimContinuar').textContent = `${T.continuar} · ${T.gratis}`;
  $('txtFimVideo').textContent = T.continuarVideo;
  $('bFimDeNovo').textContent = T.recomecarNivel;

  function somIcone() {
    $('bSom').classList.toggle('mudo', acoes.mudo());
    const svg = $('bSom').querySelector('svg');
    svg.querySelector('.ligado').style.display = acoes.mudo() ? 'none' : '';
    svg.querySelector('.desligado').style.display = acoes.mudo() ? '' : 'none';
  }

  /** A escada de cada mundo: os 8 valores; os alcancados recomecam dali (pelo kit). */
  function montarFases() {
    const g = $('gradeFases');
    g.innerHTML = '';
    const total = acoes.totalFases();
    const max = acoes.maxFase();
    for (let n = 1; n <= total; n++) {
      const pos = ((n - 1) % POR_MUNDO) + 1;
      if (pos === 1) {
        const h = document.createElement('div');
        h.className = 'mundoTitulo';
        h.textContent = `${T.mundoRotulo} ${Math.floor((n - 1) / POR_MUNDO) + 1}`;
        g.appendChild(h);
      }
      const b = document.createElement('button');
      b.className = 'fase' + (n === acoes.faseAtual() ? ' atual' : n < max ? ' feita' : '');
      b.disabled = n > max;
      b.innerHTML = `${alvoDoNivel(pos)}<small>${n > max ? '🔒' : n < max ? '✓' : ''}</small>`;
      b.setAttribute('aria-label', `${T.mundoRotulo} ${Math.floor((n - 1) / POR_MUNDO) + 1} · ${T.nivel} ${pos}`);
      b.addEventListener('click', () => { if (!b.disabled) acoes.irPara(n); });
      g.appendChild(b);
    }
    const lm = $('listaMissoes');
    lm.innerHTML = '';
    for (const m of acoes.missoes()) {
      const li = document.createElement('div');
      li.className = 'missao' + (m.feita ? ' feita' : '');
      li.innerHTML = `<span class="mt">${m.texto}</span><span class="mp">${m.atual}/${m.alvo}</span><span class="mi">${m.icone}</span>`;
      lm.appendChild(li);
    }
  }

  function abrir() {
    aberto = true;
    montarFases();
    somIcone();
    menu.hidden = false;
    acoes.aoAbrir && acoes.aoAbrir();
  }
  function fechar() {
    if (!aberto) return;
    aberto = false;
    menu.hidden = true;
    acoes.aoFechar && acoes.aoFechar();
  }
  $('bFechar').addEventListener('click', fechar);
  $('bContinuar').addEventListener('click', fechar);
  $('bRecomecar').addEventListener('click', () => { fechar(); acoes.recomecar(); });
  $('bSom').addEventListener('click', () => { acoes.som(); somIcone(); });

  /** Tela de fim (mesa cheia): { pontos, nivel, gratis, video } */
  function mostrarFim(info) {
    $('fimTitulo').textContent = info.titulo || T.semJogadas;
    $('fimPontos').textContent = String(info.pontos);
    $('fimNivel').textContent = info.nivel || '';
    $('bFimContinuar').hidden = !info.gratis;
    $('bFimVideo').hidden = !info.video;
    fim.hidden = false;
  }
  function esconderFim() { fim.hidden = true; }
  $('bFimContinuar').addEventListener('click', () => { esconderFim(); acoes.continuarGratis(); });
  $('bFimVideo').addEventListener('click', () => acoes.continuarVideo());
  $('bFimDeNovo').addEventListener('click', () => { esconderFim(); acoes.deNovo(); });

  return { abrir, fechar, mostrarFim, esconderFim, get aberto() { return aberto; }, get fimAberto() { return !fim.hidden; } };
}
