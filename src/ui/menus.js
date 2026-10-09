// Menu de pausa (continuar, recomecar, som, modos, fases) e tela de fim.
import { POR_MUNDO } from '../jogo/fases.js';
import { desenharCarta } from '../render/cartas.js';
import { CENARIOS } from '../render/cenarios.js';

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
  $('colecaoTitulo').firstChild.textContent = T.colecao + ' ';

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

  /** Previa de uma skin (carta 64) ou de um cenario (fundo + carta). */
  function previa(canvas, tipo, id) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = 64, h = 80;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    if (tipo === 'cenario' && id === 'auto') {
      ctx.fillStyle = '#2a2340'; ctx.fillRect(0, 0, w, h);
      ctx.font = '700 28px Fredoka, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
      ctx.fillText('🌍', w / 2, h / 2);
      return;
    }
    if (tipo === 'cenario') {
      const cen = CENARIOS[id];
      cen.parado(ctx, w, h);
      desenharCarta(ctx, 'blocos', { id: 1, tipo: 'normal', v: 64, cor: 0 }, { x: 14, y: 14, w: 36, h: 50, pal: cen.paleta, dpr });
    } else {
      ctx.fillStyle = '#2a2340'; ctx.fillRect(0, 0, w, h);
      desenharCarta(ctx, id, { id: 1, tipo: 'normal', v: 64, cor: 0 }, { x: 10, y: 8, w: 44, h: 61, pal: CENARIOS.neon.paleta, dpr });
    }
  }

  function montarColecao() {
    $('colecaoEstrelas').textContent = `${acoes.estrelasTotal()}★`;
    for (const [idGrade, tipo, lista] of [['gradeSkins', 'skin', acoes.skins()], ['gradeCenarios', 'cenario', acoes.cenarios()]]) {
      const g = $(idGrade);
      g.innerHTML = '';
      for (const p of lista) {
        const b = document.createElement('button');
        b.className = 'peca';
        b.disabled = !p.livre;
        b.setAttribute('aria-pressed', String(p.atual));
        b.title = p.id;
        const c = document.createElement('canvas');
        b.appendChild(c);
        previa(c, tipo, p.id);
        if (!p.livre) {
          const custo = document.createElement('span');
          custo.className = 'custo';
          custo.textContent = tipo === 'skin' ? T.estrelasPara.replace('{n}', String(p.custo)) : `${T.mundo} ${p.custo}`;
          b.appendChild(custo);
        }
        b.addEventListener('click', () => { if (p.livre) { acoes.vestir(tipo, p.id); montarColecao(); } });
        g.appendChild(b);
      }
    }
  }

  function abrir() {
    aberto = true;
    montarFases();
    montarColecao();
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

  /** Tela de fim: { pontos, recorde, novo, gratis, video } */
  function mostrarFim(info) {
    $('fimTitulo').textContent = info.titulo || T.semJogadas;
    $('fimPontos').textContent = String(info.pontos);
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
