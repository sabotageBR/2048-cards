// Laboratorio visual: grade cenario x skin, cada celula com uma mesa de
// exemplo jogada pelo bot, mais os toggles de regra. Consome src/ direto
// (nada daqui vai para a build: tools/empacotar.mjs so copia src/).
import { calcularLayout } from '../src/render/layout.js';
import { desenharMesa } from '../src/render/mesa.js';
import { criarLinha } from '../src/render/linha.js';
import { CENARIOS, CENARIOS_IDS } from '../src/render/cenarios.js';
import { SKINS, limparCache } from '../src/render/cartas.js';
import { criarPartida, jogar } from '../src/jogo/partida.js';
import { melhorJogada } from '../src/jogo/bot.js';
import { CLASSICO } from '../src/jogo/fases.js';

const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
const W = 300, H = 380, DPR = Math.min(2, devicePixelRatio || 1);
/** Mesa de exemplo: valores altos ja na mesa para a cascata aparecer cedo. */
const FASE = {
  ...CLASSICO, id: 0, semente: 3,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.08, bomba: 0.04, dobro: 0.04 } },
  inicio: [[512, 256, 128], [64, 32], [16, 8], []],
};

function regrasDoPainel() {
  const esp = $('especiais').checked;
  return {
    regras: {
      colocacao: $('colocacao').value, filaLivre: $('filaLivre').value === '1', naipes: $('naipes').checked,
      colunas: Number($('colunas').value), pilhaMax: Number($('pilhaMax').value),
    },
    fase: esp ? FASE : { ...FASE, baralho: { ...FASE.baralho, especiais: {} } },
  };
}

/** @type {any[]} */
const celulas = [];
let escolhida = null;

function criarCelula(cenId, skin) {
  const cen = CENARIOS[cenId];
  const td = document.createElement('td');
  const box = document.createElement('div');
  box.className = 'celula';
  const canvas = document.createElement('canvas');
  canvas.width = W * DPR; canvas.height = H * DPR;
  box.appendChild(canvas);
  const acoes = document.createElement('div');
  acoes.className = 'acoes';
  const jogar = document.createElement('a');
  jogar.textContent = 'Jogar';
  jogar.target = '_blank';
  const escolher = document.createElement('button');
  escolher.textContent = 'Escolher';
  acoes.append(jogar, escolher);
  box.appendChild(acoes);
  td.appendChild(box);
  const ctx = canvas.getContext('2d');
  const fundo = document.createElement('canvas');
  fundo.width = W * DPR; fundo.height = H * DPR;
  const g = fundo.getContext('2d'); g.scale(DPR, DPR); cen.parado(g, W, H);
  const cel = { cenId, skin, cen, canvas, ctx, fundo, box, jogar, escolher, estado: null, linha: criarLinha(), L: null, prox: 0 };
  celulas.push(cel);
  escolher.addEventListener('click', () => {
    if (escolhida) escolhida.box.classList.remove('escolhida');
    escolhida = cel;
    box.classList.add('escolhida');
    const r = regrasDoPainel().regras;
    $('saida').textContent = JSON.stringify({ cenario: cenId, skin, regras: r }, null, 2);
  });
  return td;
}

function reiniciar() {
  const { regras, fase } = regrasDoPainel();
  limparCache();
  for (const c of celulas) {
    c.estado = criarPartida(regras, fase, 3);
    c.L = calcularLayout({ W, H, topo: 8, base: 0, colunas: regras.colunas, pilhaMax: regras.pilhaMax, tamFila: 3 });
    c.linha.limpar();
    c.prox = performance.now() + 400 + Math.random() * 600;
    const q = `cenario=${c.cenId}&skin=${c.skin}&regras=${encodeURIComponent(JSON.stringify(regras))}&modo=classico&fixo&semanuncio`;
    c.jogar.href = `../index.html?${q}`;
  }
}

function montarGrade() {
  const t = $('grade');
  t.innerHTML = '';
  const cab = document.createElement('tr');
  cab.innerHTML = '<th></th>' + SKINS.map((s) => `<th>skin: ${s}</th>`).join('');
  t.appendChild(cab);
  for (const cenId of CENARIOS_IDS) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.className = 'linha';
    th.textContent = `cenário: ${CENARIOS[cenId].nome}`;
    tr.appendChild(th);
    for (const skin of SKINS) tr.appendChild(criarCelula(cenId, skin));
    t.appendChild(tr);
  }
}

let ultimo = performance.now();
function quadro() {
  const agora = performance.now();
  const dt = Math.min(0.1, (agora - ultimo) / 1000);
  ultimo = agora;
  const ritmo = Number($('ritmo').value);
  for (const c of celulas) {
    if (!c.estado) continue;
    if (ritmo > 0 && agora >= c.prox) {
      c.prox = agora + ritmo;
      if (c.estado.fim) c.estado = criarPartida(regrasDoPainel().regras, regrasDoPainel().fase, (agora | 0) >>> 0);
      else {
        const a = melhorJogada(c.estado, agora);
        if (a) {
          const antes = c.estado;
          const r = jogar(antes, { ...a, t: agora });
          c.estado = r.estado;
          c.linha.montar(r.eventos, c.L, agora, { antes, depois: r.estado, origem: c.L.filaPos(a.k || 0), carta: antes.fila[a.k || 0] });
        } else c.estado = criarPartida(regrasDoPainel().regras, regrasDoPainel().fase, (agora | 0) >>> 0);
      }
    }
    c.linha.drenarEfeitos(agora);
    c.linha.podar(agora - 50);
    const ctx = c.ctx;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(c.fundo, 0, 0, W, H);
    c.cen.vivo(ctx, W, H, agora / 1000);
    desenharMesa(ctx, c.estado, c.L, { skin: c.skin, pal: { ...c.cen.paleta, naipes: c.estado.regras.naipes }, agora, dpr: DPR, linha: c.linha });
  }
  requestAnimationFrame(quadro);
}

montarGrade();
reiniciar();
for (const id of ['colocacao', 'filaLivre', 'naipes', 'colunas', 'pilhaMax', 'especiais']) $(id).addEventListener('change', reiniciar);
$('reiniciar').addEventListener('click', reiniciar);
if (document.fonts && document.fonts.load) document.fonts.load('700 40px Fredoka').then(() => { limparCache(); requestAnimationFrame(quadro); }, () => requestAnimationFrame(quadro));
else requestAnimationFrame(quadro);
