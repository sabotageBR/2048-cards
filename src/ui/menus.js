// Menu de pausa (continuar, recomecar, som, modos, fases) e tela de fim.
import { POR_MUNDO } from '../jogo/fases.js';

/**
 * @param {{ T: any, $: (id: string) => HTMLElement, acoes: any, onFechar?: () => void }} p
 */
export function criarMenus({ T, $, acoes }) {
  const menu = $('menu'), fim = $('fim');
  let aberto = false;
  $('menuTitulo').textContent = T.pausa;
  $('bContinuar').textContent = T.continuar;
  $('bRecomecar').textContent = T.recomecar;
  $('bAventura').textContent = T.aventura;
  $('bClassico').textContent = T.classico;
  $('missoesTitulo').textContent = T.missoes;
  $('fimTitulo').textContent = T.semJogadas;
  $('bFimContinuar').textContent = `${T.continuar} · ${T.gratis}`;
  $('txtFimVideo').textContent = T.continuarVideo;
  $('bFimDeNovo').textContent = T.jogarDeNovo;

  function somIcone() {
    $('bSom').classList.toggle('mudo', acoes.mudo());
    const svg = $('bSom').querySelector('svg');
    svg.querySelector('.ligado').style.display = acoes.mudo() ? 'none' : '';
    svg.querySelector('.desligado').style.display = acoes.mudo() ? '' : 'none';
  }

  function montarFases() {
    const g = $('gradeFases');
    g.innerHTML = '';
    const total = acoes.totalFases();
    const max = acoes.maxFase();
    for (let n = 1; n <= total; n++) {
      const b = document.createElement('button');
      b.className = 'fase' + (n === acoes.faseAtual() && acoes.modo() === 'aventura' ? ' atual' : '');
      b.disabled = n > max;
      const est = acoes.estrelas(n);
      b.innerHTML = `${n}<small>${est ? '★'.repeat(est) : (n > max ? '🔒' : '')}</small>`;
      b.addEventListener('click', () => { if (!b.disabled) acoes.irPara(n); });
      g.appendChild(b);
    }
    $('bAventura').setAttribute('aria-pressed', String(acoes.modo() === 'aventura'));
    $('bClassico').setAttribute('aria-pressed', String(acoes.modo() === 'classico'));
    $('bAventura').textContent = `${T.aventura} · ${T.mundo} ${Math.floor((max - 1) / POR_MUNDO) + 1}`;
    $('bDiario').setAttribute('aria-pressed', String(acoes.modo() === 'diario'));
    const hoje = acoes.diarioHoje();
    $('bDiario').textContent = `${T.diario}${hoje >= 0 ? ' · ' + hoje : ''}`;
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
  $('bAventura').addEventListener('click', () => { fechar(); acoes.modoAventura(); });
  $('bClassico').addEventListener('click', () => { fechar(); acoes.modoClassico(); });
  $('bDiario').addEventListener('click', () => { fechar(); acoes.modoDiario(); });

  /** Tela de fim: { pontos, recorde, novo, gratis, video, derrotados? } */
  function mostrarFim(info) {
    $('fimTitulo').textContent = info.titulo || T.semJogadas;
    $('fimPontos').textContent = String(info.pontos);
    $('fimMonstros').hidden = info.derrotados === undefined;
    if (info.derrotados !== undefined) $('fimMonstros').textContent = T.fimDerrotados.replace('{n}', String(info.derrotados));
    $('fimRecorde').textContent = info.novo ? T.novoRecorde : (info.recorde ? `${T.recorde} ${info.recorde}` : '');
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
