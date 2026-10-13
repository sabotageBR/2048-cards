// Ponto de entrada do 2048 Cards: liga motor, cena, entrada, HUD, menus, som
// e Poki. Unico modulo que importa core/poki.js.
//
// Fluxo: o mundo entra (zoom recuando) -> o jogador arrasta ou toca para
// jogar a carta da frente da fila numa coluna -> fusoes em cascata -> fez o
// valor do nivel, o nivel sobe na mesma mesa: pausa curta com o valor feito e
// a trilha do mundo, o intervalo comercial (a partir da fase 5; a Poki decide
// a frequencia) e o jogo segue. No 2048 o mundo termina e o proximo entra.
// Sem jogada legal e sem descarte: oferta de continuar (gratis 1x por nivel,
// depois video) ou recomecar o nivel pela mesa pronta dele.

import { criarCena } from './render/cena.js';
import { Transicoes as Tr } from './render/transicoes.js';
import { criarPartida, jogar, desfazerPara, jogadasLegais, VERSAO_ESTADO } from './jogo/partida.js';
import { melhorJogada } from './jogo/bot.js';
import { ESPECIAIS } from './jogo/baralho.js';
import { respeitaMarca } from './jogo/regras.js';
import { MUNDOS, POR_MUNDO, TOTAL_FASES, faseDe, faseGlobal, mundoDe, posNoMundo, alvoDoNivel } from './jogo/fases.js';
import { progressoDoNivel } from './jogo/metas.js';
import { criarAudio } from './core/audio.js';
import { criarArmazem } from './core/armazenamento.js';
import { lerDepuracao } from './core/depuracao.js';
import { escolherIdioma, textos, textoMissao } from './i18n/textos.js';
import { criarMissoes, progredir, renovar } from './jogo/missoes.js';
import { vibrar } from './core/haptico.js';
import { poki } from './core/poki.js';
import { criarHud } from './ui/hud.js';
import { criarMenus } from './ui/menus.js';

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const canvas = /** @type {HTMLCanvasElement} */ ($('cena'));
const cena = criarCena(canvas);
const audio = criarAudio();
const armazem = criarArmazem();
const dep = lerDepuracao();
const T = textos(dep.lang || escolherIdioma());

/** Fases sem intervalo comercial no comeco da sessao: o primeiro vem na entrada da fase 5. */
const FASES_SEM_INTERVALO = 4;
/** Ajuda gratis (mao) por ocio ou recusas seguidas, nos dois primeiros mundos. */
const AJUDA_ATE = POR_MUNDO * 2;
const OCIO_AJUDA = 6000;
/** Jogador novo na fase 1, antes do primeiro toque: o gesto guiado aparece logo. */
const OCIO_GUIA = 1000;
const RECUSAS_AJUDA = 3;
// 2: a escada de valores (2026-10-13); o progresso da versao do duelo nao vale aqui
const VERSAO_SAVE = 2;

const salvo = armazem.ler('save', null);
const padraoSave = {
  v: VERSAO_SAVE, fase: 1, max: 1, mudo: false, regras: {},
  itens: { coringa: 0, martelo: 0, troca: 0 }, baus: {}, partida: null, vistas: [], missoes: null,
};
const save = salvo && salvo.v === VERSAO_SAVE ? { ...padraoSave, ...salvo, itens: { ...padraoSave.itens, ...(salvo.itens || {}) }, vistas: salvo.vistas || [] } : { ...padraoSave };
if (dep.regras) save.regras = dep.regras;

if (!save.missoes || !save.missoes.missoes) save.missoes = criarMissoes((Date.now() >>> 0) || 1);
/** Minutos de jogo em que a telemetria marca o tempo. */
const MARCOS_MIN = [1, 2, 3, 5, 7, 10, 15];

const J = {
  /** n: fase global (1..40) do nivel em jogo */
  n: 1, e: null, tJogo: 0, marco: 0, tocou: false,
  /** 'jogando' | 'nivel' | 'vitoria' | 'chance' | 'fim' | 'anuncio' | 'menu' */
  estado: 'jogando',
  hist: [], trans: null, tEntrada: -1e9, bloqueio: 0, agora: 0, tVis: 0,
  carregou: false, ultimaAcao: 0, mao: null, maoCalc: 0, arrasto: null, destaque: -1, legal: true,
  tentativas: 0, autoProx: 0, congelado: false, febreAte: 0,
  ajudaMedida: false, novidade: '', tChance: 0, itemPendente: '', bau: null, tAviso: 0,
  /** videos (rewarded) do nivel: usado = ja deu o premio; visto = ja mediu o visible */
  video: { usado: {}, visto: {} },
};

function salvar() {
  save.mudo = audio.mudo;
  armazem.gravar('save', save);
}

// ------------------------------------------------------------ layout
function layout() {
  const W = innerWidth, H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  // a mesa comeca abaixo do HUD inteiro: painel e, em retrato, a linha de botoes
  const rp = $('painel').getBoundingClientRect();
  const topo = dep.semHud ? 10 : $('topo').getBoundingClientRect().bottom + 6;
  const base = $('base').hidden ? 0 : $('base').getBoundingClientRect().height + 8;
  document.documentElement.style.setProperty('--febreY', `${Math.round(rp.bottom + 8)}px`);
  cena.redimensionar(W, H, dpr, topo, base);
  posAviso();
}

/** O aviso aparece no meio da mesa (no comeco da fase quase sempre vazio). */
function posAviso() {
  const L = cena.L;
  if (L) document.documentElement.style.setProperty('--avisoY', `${Math.round(L.mesa.y + L.mesa.h * 0.5)}px`);
}

// ------------------------------------------------------------- fases
/** "Mundo 1 · Nivel 3". */
const rotulo = () => `${T.mundoRotulo} ${mundoDe(J.n)} · ${T.nivel} ${posNoMundo(J.n)}`;

/** Segundo campo da telemetria: o numero da fase global. */
const rotuloMedida = () => String(J.n);

function atualizarHud() {
  const videos = videosLivres();
  for (const tipo of Object.keys(videos)) {
    if (!videos[tipo] || J.video.visto[tipo]) continue;
    J.video.visto[tipo] = true;
    poki.measure('rewarded', tipo, 'visible');
  }
  hud.atualizar(J.e, { rotulo: rotulo(), podeDesfazer: J.hist.length > 0 && J.estado === 'jogando', itemPendente: J.itemPendente || '', videos });
}

/**
 * Videos (rewarded) que podem aparecer agora, 1x por nivel cada, so por
 * escolha: esvaziar o descarte cheio; um coringa a mais quando nao ha
 * nenhum e a mesa aperta (uma coluna a 2 cartas do limite), a partir da fase 2.
 */
function videosLivres() {
  const e = J.e;
  if (!e || e.fim) return { descarte: false, coringa: false };
  const aperta = e.colunas.some((col) => col.length >= e.regras.pilhaMax - 2);
  return {
    descarte: !J.video.usado.descarte && e.regras.descarteMax > 0 && e.descarteCarga <= 0,
    coringa: !J.video.usado.coringa && J.n >= 2 && e.itens.coringa <= 0 && aperta,
  };
}

/** Video escolhido na barra de baixo: so premia com true. */
async function premioVideo(tipo) {
  if (J.estado !== 'jogando' || !videosLivres()[tipo]) return;
  poki.measure('rewarded', tipo, 'interact');
  J.estado = 'anuncio';
  const ok = await recompensa();
  if (J.estado === 'anuncio') J.estado = 'jogando';
  if (!ok || !J.e || J.estado !== 'jogando') { atualizarHud(); return; }
  J.video.usado[tipo] = true;
  if (tipo === 'descarte') {
    const antes = J.e;
    const r = jogar(antes, { tipo: 'esvaziar', t: J.agora });
    if (r.eventos.length || r.estado !== antes) { J.e = r.estado; cena.tocar(r.eventos, J.agora, { antes, depois: r.estado }); }
  } else J.e = { ...J.e, itens: { ...J.e.itens, coringa: J.e.itens.coringa + 1 } };
  J.hist = []; // o desfazer nao devolve o premio
  audio.completar();
  atualizarHud();
  guardarPartida();
  salvar();
}

/** Nivel novo (ou recomeco): os videos do nivel voltam. */
function renovarVideos() { J.video = { usado: {}, visto: {} }; }

function prepararPartida(e, entrada) {
  J.e = e;
  J.hist = [];
  renovarVideos();
  aplicarVisual(e.mundo || 1);
  cena.definirRegras(e.regras);
  posAviso();
  J.estado = 'jogando';
  J.mao = null; J.maoCalc = 0; J.arrasto = null; J.destaque = -1;
  J.febreAte = 0; J.ajudaMedida = false;
  J.ultimaAcao = J.agora; J.autoProx = J.agora + (dep.auto ? 700 : 0);
  J.tEntrada = entrada && !dep.fixo ? J.agora : -1e9;
  J.bloqueio = J.agora + (entrada && !dep.fixo ? 220 : 0);
  hud.febre(false);
  menus.esconderFim();
  atualizarHud();
  if (!J.carregou) {
    J.carregou = true;
    poki.gameLoadingFinished();
  }
}

/** O inventario de itens e persistente: a partida nova comeca com ele. */
const comInventario = (e) => ({ ...e, itens: { ...e.itens, coringa: save.itens.coringa, martelo: save.itens.martelo, troca: save.itens.troca } });

function guardarPartida() {
  if (!J.e) return;
  for (const k of Object.keys(save.itens)) save.itens[k] = J.e.itens[k] || 0;
  save.partida = J.e.fim ? null : { n: J.n, e: J.e, tentativas: J.tentativas };
}

/**
 * Comeca a fase global n pela mesa pronta do nivel (o mundo inteiro, se for o
 * nivel 1). Com `retomar`, a partida salva continua de onde parou (o mundo e
 * o nivel vem dela). Cada recomeco do mesmo nivel muda a semente.
 */
function carregarFase(n, entrada = true, retomar = false) {
  n = Math.min(TOTAL_FASES, Math.max(1, n));
  if (n !== J.n) J.tentativas = 0;
  const salva = retomar && save.partida && save.partida.e && save.partida.e.v === VERSAO_ESTADO && !save.partida.e.fim ? save.partida : null;
  let e;
  if (salva) {
    e = salva.e;
    J.tentativas = salva.tentativas || 0;
    n = faseGlobal(e.mundo, e.nivel);
  } else {
    const f = faseDe(n, J.tentativas);
    e = comInventario(criarPartida(save.regras, f, f.semente));
  }
  J.n = n;
  prepararPartida(e, entrada);
  save.fase = n;
  save.max = Math.max(save.max, n);
  prepararNovidade();
  guardarPartida();
  salvar();
  poki.measure('level', String(n), 'start');
}

/**
 * Novidade do mundo (coringa, bomba, dobro, x4, 3 colunas): na primeira
 * vez, um aviso curto com a dica. A carta especial espera aparecer na fila
 * (avisarNovidade, a cada jogada); a regra nova sai na entrada do mundo.
 * Fica marcada em save.vistas so quando aparece.
 */
function prepararNovidade() {
  J.novidade = '';
  const m = MUNDOS[mundoDe(J.n) - 1];
  if (!m || dep.fixo || !J.e || J.e.nivel < m.novidade.nivel || save.vistas.includes('novidade:' + m.novidade.tipo)) return;
  J.novidade = m.novidade.tipo;
  avisarNovidade(900);
}

/** O aviso da novidade, se for a hora (a carta especial ja esta na fila). @returns {boolean} se avisou */
function avisarNovidade(atraso = 0) {
  const tipo = J.novidade;
  if (!tipo || !J.e) return false;
  const carta = ESPECIAIS.includes(tipo);
  if (carta && !J.e.fila.some((k) => k.tipo === tipo)) return false;
  J.novidade = '';
  save.vistas = [...save.vistas, 'novidade:' + tipo];
  salvar();
  const [titulo, texto] = T.novidade[tipo] || ['', ''];
  setTimeout(() => avisar(titulo, texto, 4200), atraso);
  return true;
}

/**
 * Regras que aparecem jogando, na primeira vez (save.vistas): um especial
 * por carta (o topo marcado com coringa, dobro ou x4 na mao) e o descarte
 * cheio (esvazia na subida de nivel).
 */
function avisarRegras() {
  if (!J.e || dep.fixo || J.novidade) return;
  const ver = (chave, [titulo, texto]) => {
    if (save.vistas.includes(chave)) return false;
    save.vistas = [...save.vistas, chave];
    avisar(titulo, texto, 4200);
    return true;
  };
  if (respeitaMarca(J.e.fila[0]) && J.e.colunas.some((col) => col.length && col[col.length - 1].esp) && ver('regra:especial', T.regraEspecial)) return;
  if (J.e.regras.descarteMax > 0 && J.e.descarteCarga <= 0) ver('regra:descarte', T.descarteCheio);
}

// ------------------------------------------------------------- acoes// ------------------------------------------------------------- acoes
/**
 * Aplica uma acao do jogador. origem = retangulo de onde a carta saiu (fila ou arrasto).
 * @returns {boolean} se a jogada foi aceita
 */
function aplicar(acao, origem) {
  if (J.estado !== 'jogando' || !J.e) return false;
  const antes = J.e;
  const carta = acao.tipo === 'colocar' ? antes.fila[antes.regras.filaLivre ? (acao.k | 0) : 0] : antes.fila[0];
  const r = jogar(antes, { ...acao, t: J.agora });
  if (!r.eventos.length) return false;
  // a febre pode expirar na mesma acao: o primeiro evento nem sempre e a recusa
  const recusada = r.eventos.some((ev) => ev.tipo === 'recusar');
  cena.linha.acelerar(J.agora);
  if (recusada) {
    J.e = r.estado;
    if (r.eventos.some((ev) => ev.tipo === 'febre' && !ev.ligada)) hud.febre(false);
    cena.tocar(r.eventos, J.agora, { antes, depois: r.estado, origem, carta });
    audio.recusa();
    J.ultimaAcao = J.agora;
    return false;
  }
  J.hist = [antes];
  J.e = r.estado;
  cena.tocar(r.eventos, J.agora, { antes, depois: r.estado, origem, carta });
  J.ultimaAcao = J.agora;
  J.mao = null; J.maoCalc = 0;
  for (const ev of r.eventos) {
    if (ev.tipo === 'febre') { hud.febre(ev.ligada); if (ev.ligada) { audio.febre(); J.febreAte = ev.ate; } }
    if (ev.tipo === 'descartar') audio.descartar();
    if (ev.tipo === 'troca') audio.tique();
    if (ev.tipo === 'martelo') audio.explodir();
  }
  J.itemPendente = '';
  // missoes de sessao: premio em item na hora
  const pm = progredir(save.missoes, r.eventos, J.e);
  if (pm.estado !== save.missoes) {
    save.missoes = pm.estado;
    for (const m of pm.concluidas) {
      J.e = { ...J.e, itens: { ...J.e.itens, [m.premio]: (J.e.itens[m.premio] || 0) + 1 } };
      avisar(T.missaoFeita, `${textoMissao(T, m)} · ${ICONES[m.premio]}+1`);
      // fora do funil de progresso (start/complete/fail): cai em Other Events
      poki.measure('missao', m.tipo, 'feita');
    }
    if (pm.concluidas.length) save.missoes = renovar(save.missoes);
  }
  // nivel vencido: complete na hora; o start do nivel novo sai no fim da pausa
  // (seguirNivel), depois do intervalo comercial. Uma cascata que pula um
  // nivel inteiro comeca e termina ele aqui mesmo.
  const niveis = r.eventos.filter((ev) => ev.tipo === 'nivel');
  niveis.forEach((ev, i) => {
    if (i > 0) poki.measure('level', String(J.n), 'start');
    poki.measure('level', String(J.n), 'complete');
    J.n = faseGlobal(J.e.mundo, ev.n);
  });
  if (niveis.length) {
    J.tentativas = 0;
    renovarVideos();
    J.hist = []; // o desfazer nao volta para o nivel de antes
    save.fase = J.n;
    save.max = Math.max(save.max, J.n);
  }
  if (!avisarNovidade()) avisarRegras();
  atualizarHud();
  guardarPartida();
  salvar();
  if (J.e.fim === 'venceu') {
    if (niveis.length) poki.measure('level', String(J.n), 'start'); // o 2048 veio na mesma cascata
    vencer();
  } else if (niveis.length) subirNivel(niveis);
  else if (J.e.fim) terminar(J.e.fim);
  return true;
}

/** Origem visual de um item usado: o botao dele, embaixo. */
function origemItem() {
  const L = cena.L;
  return { x: cena.W / 2 - L.cw / 2, y: cena.H - L.ch * 1.2, w: L.cw, h: L.ch };
}

function desfazer() {
  if (J.estado !== 'jogando' || !J.hist.length || !(J.e.itens.desfazer > 0)) return;
  J.e = desfazerPara(J.hist.pop());
  cena.linha.limpar();
  audio.tique();
  J.ultimaAcao = J.agora;
  atualizarHud();
}

/** Recomeca o nivel em jogo pela mesa pronta dele (semente nova). */
function recomecar() {
  J.trans = null;
  J.tentativas++;
  carregarFase(J.n, true);
}

/** Jogo ativo (ms) antes do primeiro intervalo fora da passagem de fase. */
const CARENCIA_MS = 180000;
/** Intervalo comercial na subida de nivel e no fim do mundo: so depois da carencia (fase 5 ou 3 min de jogo). */
const podeIntervalo = () => !dep.semAnuncio && (J.n > FASES_SEM_INTERVALO || J.tJogo >= CARENCIA_MS);
/** "Recomecar o nivel" depois de perder: comercial so com 3 min de jogo (perder e anuncio no comeco espantam). */
const podeIntervaloDeNovo = () => !dep.semAnuncio && J.tJogo >= CARENCIA_MS;

/** A trilha do mundo na transicao: os 8 valores, o vencido acendendo, o proximo alvo. */
function trilhaDe(pos) {
  const valores = [];
  for (let k = 1; k <= POR_MUNDO; k++) valores.push(alvoDoNivel(k));
  return { pos, total: POR_MUNDO, valores, rotulo: T.proximo, nome: pos < POR_MUNDO ? String(alvoDoNivel(pos + 1)) : '' };
}

/**
 * Subida de nivel (o motor ja trocou o baralho e a meta): pausa curta com o
 * valor feito e a trilha, na mesma mesa, depois da cascata. O intervalo
 * comercial, se for a hora, vem no fim da pausa.
 */
function subirNivel(niveis) {
  J.estado = 'nivel';
  poki.gameplayStop();
  const ult = niveis[niveis.length - 1];
  const L = cena.L;
  const espera = Math.min(1200, Math.max(0, cena.linha.fim - J.agora) + 120);
  J.trans = {
    tipo: 'nivel', t0: J.agora + espera, trocou: false, anuncio: false, parada: -1, festa: false, fimMundo: false,
    fx: L.mesa.x + L.mesa.w / 2, fy: L.mesa.y + L.mesa.h / 2, semente: J.n * 31 + 7, corMundo: cena.pal.acento,
    texto: `${ult.antes}!`, trilha: trilhaDe(ult.n - 1),
  };
}

/** Fim da pausa da subida de nivel: o jogo segue (ou a mesa cheia que veio junto aparece). */
function seguirNivel() {
  J.trans.trocou = true;
  if (J.estado !== 'nivel') return;
  poki.measure('level', String(J.n), 'start');
  J.estado = 'jogando';
  J.ultimaAcao = J.agora;
  if (J.e.fim) terminar(J.e.fim);
}

/** O 2048 do mundo: fim do mundo, bau e a transicao para o proximo. */
function vencer() {
  J.estado = 'vitoria';
  poki.gameplayStop();
  poki.measure('level', String(J.n), 'complete');
  save.max = Math.max(save.max, Math.min(TOTAL_FASES, J.n + 1));
  save.fase = Math.min(TOTAL_FASES, J.n + 1);
  save.partida = null;
  if (!save.baus[mundoDe(J.n)]) {
    // bau de fim de mundo: 1 a 3 itens, sorteio com semente do mundo
    const m = mundoDe(J.n);
    save.baus[m] = true;
    const r = ((m * 2654435761) >>> 0) % 3;
    const ganho = { coringa: 1, martelo: r >= 1 ? 1 : 0, troca: r >= 2 ? 1 : 0 };
    for (const k of Object.keys(ganho)) save.itens[k] += ganho[k];
    J.bau = ganho;
  }
  salvar();
  const L = cena.L;
  // o "2048!" espera o 2048 sair da mesa (fim da cascata)
  const espera = Math.min(1600, Math.max(0, cena.linha.fim - J.agora) + 200);
  J.trans = {
    tipo: 'mundo', t0: J.agora + espera, trocou: false, anuncio: false, parada: -1, festa: false,
    fx: L.mesa.x + L.mesa.w / 2, fy: L.mesa.y + L.mesa.h / 2, semente: J.n * 31 + 7, corMundo: cena.pal.acento, fimMundo: true,
    texto: '2048!', trilha: null,
  };
}

/** Troca para o proximo mundo no meio da transicao (com intervalo, se for a hora). */
function trocar() {
  J.trans.trocou = true;
  if (J.trans.tipo === 'nivel') { seguirNivel(); return; }
  carregarFase(J.n >= TOTAL_FASES ? 1 : J.n + 1, true);
  if (J.bau) { avisar(T.bau, Object.entries(J.bau).filter(([, n]) => n > 0).map(([k, n]) => `${ICONES[k]}×${n}`).join('  ')); J.bau = null; }
}

const ICONES = { coringa: '★', martelo: '🔨', troca: '⇄' };
/** Aviso curto, dentro do fluxo (<= 4 s), sem tela. */
function avisar(titulo, texto, ms = 2600) {
  const el = $('aviso');
  $('avisoTitulo').textContent = titulo;
  $('avisoTxt').textContent = texto;
  el.hidden = false;
  audio.completar();
  clearTimeout(J.tAviso);
  J.tAviso = setTimeout(() => { el.hidden = true; }, ms);
}

/** O "Continuar" gratis do nivel ainda nao foi usado? (o motor renova a cada nivel) */
const temGratis = () => !!J.e && J.e.continuacoes === 0;

/**
 * Mesa cheia: no mundo 1 a segunda chance vem sozinha; senao o cartao com
 * "Continuar" (gratis 1x por nivel, depois video) e "Recomecar o nivel".
 * O progresso do mundo fica salvo: recomecar volta so ao comeco do nivel.
 */
function terminar(motivo, medida = false) {
  poki.gameplayStop();
  if (!medida) {
    poki.measure('mesa', rotuloMedida(), 'cheia');
    if (mundoDe(J.n) === 1 && temGratis()) {
      // mundo 1: a segunda chance (o "Continuar" gratis) vem sozinha, sem cartao
      J.estado = 'chance';
      J.tChance = J.agora;
      return;
    }
  }
  J.estado = 'fim';
  audio.fim();
  salvar();
  const gratis = motivo === 'mesaCheia' && temGratis();
  const comVideo = motivo === 'mesaCheia' && !gratis && (poki.sdkPronto || dep.local);
  if (comVideo) poki.measure('rewarded', 'continuar', 'visible');
  menus.mostrarFim({ titulo: T.semJogadas, pontos: J.e.pontos, nivel: rotulo(), gratis, video: comVideo });
}

/** A segunda chance do mundo 1, um instante depois da mesa encher: libera a coluna mais cheia. */
function segundaChance() {
  J.estado = 'fim';
  continuar();
  if (J.estado !== 'jogando') { terminar('mesaCheia', true); return; }
  poki.measure('continuar', rotuloMedida(), 'gratis');
  cena.part.texto(cena.W / 2, cena.L.mesa.y + cena.L.mesa.h / 2, T.segundaChance, '#ffd84a', 30);
}

function continuar() {
  if (J.estado !== 'fim') return;
  const antes = J.e;
  const r = jogar(antes, { tipo: 'retomar', t: J.agora });
  if (r.estado.fim) return;
  J.e = r.estado;
  J.estado = 'jogando';
  J.hist = [];
  cena.tocar(r.eventos, J.agora, { antes, depois: r.estado, origem: cena.L.filaPos(0) });
  audio.explodir();
  J.ultimaAcao = J.agora;
  atualizarHud();
}

// ------------------------------------------------------------ loop
function atualizar(dt) {
  J.tVis += dt / 1000;
  if (J.trans && J.trans.parada >= 0) J.trans.t0 = J.agora - J.trans.parada;
  const efeitos = cena.atualizar(dt / 1000, J.agora);
  // na subida de nivel a barra fica cheia ate a festa comecar; depois, a do nivel novo
  if (J.e) hud.progresso(J.trans && J.trans.tipo === 'nivel' && J.agora < J.trans.t0 + 500 ? 1 : progressoDoNivel(J.e));
  for (const e of efeitos) {
    switch (e.tipo) {
      case 'pouso': audio.pouso(); break;
      case 'fusao': audio.fusao(Math.max(1, (J.e ? J.e.combo : 1) - 1) + e.degrau); if (e.degrau === 1) vibrar(12); break;
      case 'completar': audio.completar(); audio.critico(); vibrar([20, 40, 30]); break;
      case 'graduar': audio.graduar(); break;
      case 'explodir': audio.explodir(); break;
      default: break;
    }
  }
  if (J.estado === 'anuncio' || J.estado === 'menu') return;
  if (J.estado === 'jogando' && J.tocou) {
    J.tJogo += dt;
    const min = Math.floor(J.tJogo / 60000);
    while (J.marco < MARCOS_MIN.length && min >= MARCOS_MIN[J.marco]) { poki.measure('tempo', String(MARCOS_MIN[J.marco]), 'min'); J.marco++; }
  }
  if (J.estado === 'chance') {
    if (J.agora - J.tChance > 700) segundaChance();
    return;
  }
  if (J.e && J.e.febre && J.agora >= J.e.febreAte) {
    // a febre expira pelo relogio das acoes; aqui so o HUD apaga
    hud.febre(false);
  }
  if (J.trans) {
    const t = (J.agora - J.trans.t0) / 1000;
    if (t >= 0 && !J.trans.festa) {
      J.trans.festa = true;
      cena.part.estourar(J.trans.fx, J.trans.fy, '#ffd84a', 30, 1.5, 1);
      audio.yes(J.trans.fimMundo);
      if (J.trans.tipo === 'nivel') vibrar([18, 50, 24]);
    }
    if (!J.trans.trocou && !J.trans.anuncio && t >= Tr.TROCA[J.trans.tipo]) {
      if (podeIntervalo()) {
        const trans = J.trans;
        trans.anuncio = true;
        trans.parada = J.agora - trans.t0;
        const voltar = () => {
          trans.parada = -1;
          if (J.trans === trans && !trans.trocou) trocar();
        };
        poki.commercialBreak().then(voltar, voltar);
      } else trocar();
    }
    if (J.trans && t >= Tr.FIM[J.trans.tipo] + 0.4) J.trans = null;
  }
  // mao de ajuda: ocio ou recusas seguidas, nos primeiros mundos (fora da mesa de demonstracao)
  if (J.estado === 'jogando' && J.e && !J.arrasto && !dep.vitrine) {
    const parado = J.agora - J.ultimaAcao;
    const porRecusa = J.e.recusas >= RECUSAS_AJUDA;
    const guiaInicial = J.n === 1 && save.max <= 1 && !J.tocou;
    const precisa = (J.n <= AJUDA_ATE && parado > (guiaInicial ? OCIO_GUIA : OCIO_AJUDA)) || porRecusa;
    if (precisa && J.agora - J.maoCalc > 800) {
      J.maoCalc = J.agora;
      // uma medida por fase: o jogador travou (parado) ou nao entendeu a regra (recusas); o guia inicial nao conta
      if (!J.ajudaMedida && !guiaInicial) { J.ajudaMedida = true; poki.measure('ajuda', rotuloMedida(), porRecusa ? 'recusa' : 'ocio'); }
      // guarda a jogada; a posicao sai do layout de cada quadro (maoNaTela)
      const a = melhorJogada(J.e, J.agora);
      J.mao = a && (a.tipo === 'colocar' || a.tipo === 'descartar') ? a : null;
    } else if (!precisa) J.mao = null;
  }
  if (dep.auto && J.estado === 'jogando' && J.e && J.agora >= J.autoProx) {
    J.autoProx = J.agora + dep.auto;
    const a = melhorJogada(J.e, J.agora);
    if (a) aplicar(a, cena.L.filaPos(a.k || 0));
  }
}

/**
 * A mao de ajuda na tela, pelo layout atual: no 'colocar', o gesto guiado da
 * carta da fila ate a coluna; no 'descartar', a mao apontando o descarte.
 */
function maoNaTela() {
  const a = J.mao;
  if (!a || J.estado !== 'jogando' || J.arrasto || !J.e) return null;
  const L = cena.L;
  if (a.tipo === 'descartar') return { x: L.descarte.x + L.descarte.w / 2, y: L.descarte.y + L.descarte.h / 2 };
  const col = J.e.colunas[a.c], k = a.k || 0;
  if (!col || !J.e.fila[k]) return null;
  const p = L.carta(a.c, Math.min(col.length, L.pilhaMax - 1)), f = L.filaPos(k);
  return { x: p.x + p.w / 2, y: p.y + p.h / 2, de: { x: f.x + f.w / 2, y: f.y + f.h / 2 }, carta: J.e.fila[k], w: f.w, h: f.h };
}

function quadro() {
  const tr = J.trans;
  const info = { texto: (tr && tr.texto) || T.yes, textoMundo: `${T.mundo} ${mundoDe(Math.min(TOTAL_FASES, J.n + (tr && tr.trocou ? 0 : 1)))}` };
  cena.desenhar({
    estado: J.e, agora: J.agora, trans: J.trans, tEntrada: J.tEntrada, arrasto: J.arrasto, destaque: J.destaque, legal: J.legal, alvo: J.itemPendente || '',
    mao: maoNaTela(), febre: J.e && J.e.febre && J.agora < J.e.febreAte ? 1 : 0, info, semFila: false,
  });
}

let ultimo = performance.now();
function frame() {
  // um relogio so: o carimbo do requestAnimationFrame pode ficar atras do performance.now()
  const agora = performance.now();
  const dt = Math.max(0, Math.min(100, agora - ultimo));
  ultimo = agora;
  J.agora = agora;
  atualizar(dt);
  quadro();
  requestAnimationFrame(frame);
}

/** Reserva: se o requestAnimationFrame parar com a pagina visivel, a simulacao anda por timer. */
function reserva() {
  const agora = performance.now();
  if (!document.hidden && agora - ultimo > 120) {
    const dt = Math.min(100, agora - ultimo);
    ultimo = agora;
    J.agora = agora;
    atualizar(dt);
  }
}

// ----------------------------------------------------------- entrada
function origemArrasto(a) {
  const L = cena.L, p = L.filaPos(0);
  return { x: a.x - p.w * 0.55, y: a.y - p.h * 0.55, w: p.w * 1.1, h: p.h * 1.1 };
}

function legalEm(c) {
  if (c < 0 || !J.e || !J.e.fila.length) return false;
  const k = J.arrasto ? J.arrasto.k : 0;
  return jogadasLegais(J.e, J.e.fila[k]).includes(c);
}

canvas.addEventListener('pointerdown', (e) => {
  audio.iniciar();
  if (dep.quadro < 0 && !dep.filme) J.agora = Math.max(J.agora, performance.now());
  if (J.estado !== 'jogando' || J.agora < J.bloqueio || !J.e) return;
  poki.gameplayStart();
  if (!J.tocou) { J.tocou = true; poki.measure('game', 'toque', 'first'); }
  const L = cena.L;
  const x = e.clientX, y = e.clientY;
  if (J.itemPendente) {
    const c = L.colunaEm(x, y);
    const item = J.itemPendente;
    J.itemPendente = '';
    atualizarHud();
    if (c >= 0) aplicar({ tipo: 'item', item, c }, origemItem());
    return;
  }
  const k = L.filaEm(x, y);
  const toque = e.pointerType === 'touch';
  if (k >= 0 && (k === 0 || J.e.regras.filaLivre) && J.e.fila[k]) {
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignora */ }
    const desloc = toque ? Math.round(L.ch * 0.7) : 0;
    J.arrasto = { id: J.e.fila[k].id, k, x, y: y - desloc, x0: x, y0: y, desloc, pid: e.pointerId, moveu: false, rot: 0 };
    J.destaque = -1;
    return;
  }
  const c = L.colunaEm(x, y);
  if (c >= 0) { aplicar({ tipo: 'colocar', c, k: 0 }, L.filaPos(0)); return; }
  if (L.descarteEm(x, y)) aplicar({ tipo: 'descartar' }, L.filaPos(0));
});
canvas.addEventListener('pointermove', (e) => {
  const a = J.arrasto;
  if (!a || a.pid !== e.pointerId) return;
  const dx = e.clientX - a.x;
  a.x = e.clientX; a.y = e.clientY - a.desloc;
  a.rot = Math.max(-0.2, Math.min(0.2, a.rot * 0.8 + dx * 0.004));
  if (Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > 8) a.moveu = true;
  J.destaque = cena.L.colunaEm(a.x, a.y);
  J.legal = legalEm(J.destaque);
});
const soltar = (e) => {
  const a = J.arrasto;
  if (!a || a.pid !== e.pointerId) return;
  J.arrasto = null; J.destaque = -1;
  if (J.estado !== 'jogando' || !J.e) return;
  const L = cena.L;
  const c = L.colunaEm(a.x, a.y);
  if (a.moveu && c >= 0) { if (!aplicar({ tipo: 'colocar', c, k: a.k }, origemArrasto(a))) cena.linha.voltar(a.id, origemArrasto(a), L.filaPos(a.k), J.agora); return; }
  if (a.moveu && L.descarteEm(a.x, a.y)) { if (!aplicar({ tipo: 'descartar' }, origemArrasto(a))) cena.linha.voltar(a.id, origemArrasto(a), L.filaPos(a.k), J.agora); return; }
  if (a.moveu) cena.linha.voltar(a.id, origemArrasto(a), L.filaPos(a.k), J.agora);
};
canvas.addEventListener('pointerup', soltar);
canvas.addEventListener('pointercancel', soltar);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
const ROLAGEM = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown', 'Home', 'End']);
window.addEventListener('keydown', (e) => {
  if (ROLAGEM.has(e.key)) e.preventDefault();
  if (e.repeat) return;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (menus.aberto) menus.fechar();
    else if (J.estado === 'jogando') abrirMenu();
    return;
  }
  if (menus.aberto || J.estado !== 'jogando' || !J.e) return;
  const L = cena.L;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= J.e.regras.colunas) { poki.gameplayStart(); aplicar({ tipo: 'colocar', c: n - 1, k: 0 }, L.filaPos(0)); return; }
  if (e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace' || e.key === 'd' || e.key === 'D') { poki.gameplayStart(); aplicar({ tipo: 'descartar' }, L.filaPos(0)); return; }
  if (e.key === 'z' || e.key === 'Z') { poki.gameplayStart(); desfazer(); }
  if (e.key === 'r' || e.key === 'R') { poki.gameplayStart(); recomecar(); }
});
window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

// --------------------------------------------------------- anuncios
/** Rewarded: so premia com true. Sem SDK, so no teste local (anuncio simulado). */
async function recompensa() {
  if (poki.sdkPronto) return poki.rewardedBreak();
  if (dep.local) return anuncioLocal();
  return false;
}

function anuncioLocal() {
  return new Promise((ok) => {
    const el = $('anuncio');
    const antes = J.estado;
    J.estado = 'anuncio';
    audio.mudoParaAnuncio();
    el.hidden = false;
    let n = 3;
    $('anNum').textContent = String(n);
    const fim = (premio) => {
      clearInterval(id);
      el.hidden = true;
      audio.voltarDoAnuncio();
      J.estado = antes === 'anuncio' ? 'jogando' : antes;
      ok(premio === true);
    };
    const id = setInterval(() => { n--; $('anNum').textContent = String(n); if (n <= 0) fim(true); }, 1000);
    $('anFechar').onclick = () => fim(false);
  });
}

// --------------------------------------------------------------- hud
const hud = criarHud({ T, $ });
function botao(id, fn) {
  $(id).addEventListener('click', () => { audio.iniciar(); audio.tique(); fn(); });
}
botao('bDesfazer', () => { if (J.estado === 'jogando') { poki.gameplayStart(); desfazer(); } });
function pedirAlvo(item) {
  if (J.estado !== 'jogando' || !(J.e.itens[item] > 0)) return;
  poki.gameplayStart();
  J.itemPendente = J.itemPendente === item ? '' : item;
  atualizarHud();
}
botao('iCoringa', () => pedirAlvo('coringa'));
botao('iMartelo', () => pedirAlvo('martelo'));
botao('iTroca', () => { if (J.estado === 'jogando') { poki.gameplayStart(); aplicar({ tipo: 'item', item: 'troca' }, cena.L.filaPos(0)); } });
botao('vDescarte', () => premioVideo('descarte'));
botao('vCoringa', () => premioVideo('coringa'));

function abrirMenu() {
  if (J.estado !== 'jogando') return;
  poki.gameplayStop();
  J.estado = 'menu';
  menus.abrir();
}
const menus = criarMenus({
  T, $,
  acoes: {
    mudo: () => audio.mudo,
    som: () => { audio.iniciar(); audio.definirMudo(!audio.mudo); salvar(); },
    totalFases: () => TOTAL_FASES,
    maxFase: () => save.max,
    faseAtual: () => J.n,
    irPara: (n) => { menus.fechar(); J.trans = null; if (n !== J.n) J.tentativas = 0; else J.tentativas++; carregarFase(n, true); },
    recomecar,
    aoFechar: () => { if (J.estado === 'menu') J.estado = 'jogando'; },
    continuarGratis: () => {
      if (J.estado !== 'fim' || !temGratis()) return;
      poki.measure('continuar', rotuloMedida(), 'gratis');
      continuar();
    },
    continuarVideo: async () => {
      if (J.estado !== 'fim') return;
      poki.measure('rewarded', 'continuar', 'interact');
      J.estado = 'anuncio';
      const ok = await recompensa();
      J.estado = 'fim';
      if (ok) { menus.esconderFim(); continuar(); }
    },
    deNovo: () => {
      poki.measure('level', rotuloMedida(), 'fail');
      const ir = () => { J.trans = null; recomecar(); };
      if (podeIntervaloDeNovo() && J.estado !== 'anuncio') { J.estado = 'anuncio'; poki.commercialBreak().then(ir, ir); } else ir();
    },
    missoes: () => save.missoes.missoes.map((m) => ({ ...m, texto: textoMissao(T, m), icone: ICONES[m.premio] })),
  },
});

/** Cenario e cores do painel do mundo (1..5). */
function aplicarVisual(mundo = 1) {
  cena.definirReino(mundo);
  document.body.style.background = cena.pal.fundo;
  document.documentElement.style.setProperty('--acento', cena.pal.acento);
  document.documentElement.style.setProperty('--secundario', cena.pal.secundario);
  document.documentElement.style.setProperty('--vidro', cena.pal.hud);
  document.documentElement.style.setProperty('--texto', cena.pal.texto);
  document.documentElement.style.setProperty('--roxoA', cena.pal.painelA);
  document.documentElement.style.setProperty('--roxoB', cena.pal.painelB);
}
botao('bMenu', abrirMenu);
botao('bPausa', abrirMenu);

document.addEventListener('visibilitychange', () => audio.pausarAba(document.hidden));
addEventListener('resize', () => { layout(); if (J.congelado) quadro(); });

// ------------------------------------------------------------- init
poki.onAdStart = () => audio.mudoParaAnuncio();
poki.onAdEnd = () => audio.voltarDoAnuncio();
poki.init().then(() => {
  if (!poki.sdkPronto && !dep.local) document.body.classList.add('sem-anuncio');
  poki.movePill(0, 64);
});
audio.definirMudo(!!save.mudo);
cena.definirTextos(T);
if (dep.semAnim) document.body.classList.add('sem-animacao');
// opcoes de visual em teste (so local): ?visual=descarte,escada
if (dep.visual) {
  const v = dep.visual.split(',');
  cena.definirVisual({ descarteFila: v.includes('descarte') });
  hud.mostrarEscada(v.includes('escada'));
}
aplicarVisual();
layout();
J.agora = performance.now();
/**
 * Mesa de demonstracao (prints e laboratorio): todos os valores, os especiais
 * na fila, um topo que ja recebeu especial e a pilha do descarte com 2 cartas.
 * Segue o mundo do ?nivel= (com as regras dele: 3 colunas no mundo 5).
 */
const VITRINE = {
  id: 0, modo: 'vitrine', semente: 7,
  baralho: { pesos: { 2: 1, 4: 1, 8: 1 }, total: 40, dinamico: false },
  inicio: [[1024, 512, 256, 128, 64], [32, 16, 8], [4, 2], [2]],
  metas: [{ tipo: 'montes', n: 1 }], itens: { coringa: 1, martelo: 1, troca: 1 },
};
if (dep.vitrine) {
  const mundo = mundoDe(dep.nivel || 1);
  J.n = faseGlobal(mundo, 1);
  const e = criarPartida(save.regras, { ...VITRINE, mundo, regras: MUNDOS[mundo - 1].regras || {} }, 7);
  const col = e.colunas[1];
  if (col.length) col[col.length - 1] = { ...col[col.length - 1], esp: true };
  const fila = mundo >= 4 ? ['dobro', 'quadruplo', 'bomba'] : ['coringa', 'bomba', 'dobro'];
  e.fila = fila.map((tipo, k) => ({ id: 901 + k, tipo, v: 0 })).slice(0, e.regras.tamFila);
  e.pontos = 2048; e.descarte = { id: 904, tipo: 'normal', v: 4 };
  e.descarteCarga = Math.max(0, e.regras.descarteMax - 2);
  prepararPartida(e, false);
} else carregarFase(dep.nivel || save.fase || 1, !dep.fixo, !dep.nivel);
document.querySelectorAll('[aria-label]').forEach((el) => {
  const mapa = { bDesfazer: T.desfazer, bMenu: T.menu, bPausa: T.pausa, bFechar: T.fechar, iCoringa: T.coringa, iMartelo: T.martelo, iTroca: T.troca, bSom: T.som, vDescarte: T.videoEsvaziarRotulo, vCoringa: T.videoCoringaRotulo };
  if (mapa[el.id]) el.setAttribute('aria-label', mapa[el.id]);
});

if (dep.ganchos) {
  window.addEventListener('error', (ev) => { document.title = 'ERRO ' + ev.message; });
  window.addEventListener('unhandledrejection', (ev) => { document.title = 'ERRO ' + (ev.reason && ev.reason.message || ev.reason); });
  /** @type {any} */ (window).__c2 = {
    J, cena, audio, poki, save, jogar: (a) => aplicar(a, cena.L.filaPos(0)),
    auto(ms) { dep.auto = ms; J.autoProx = J.agora; },
    /** forca a mesa cheia (banco de testes do SDK) */
    fimTeste() { if (J.estado === 'jogando') { J.e = { ...J.e, fim: 'mesaCheia' }; terminar('mesaCheia'); } },
  };
}

// --------------------------------------------------- modos de teste
function lerGestos() {
  return dep.gesto.split(';').filter(Boolean).map((g) => { const [cmd, ms] = g.split('@'); return { cmd, ms: Number(ms) || 0 }; });
}
function pontoDe(tok) {
  const L = cena.L;
  if (tok.startsWith('fila')) { const p = L.filaPos(Number(tok.slice(4)) || 0); return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; }
  if (tok.startsWith('col')) { const c = Number(tok.slice(3)) || 0; const col = J.e.colunas[c]; const p = L.carta(c, Math.min(col.length, L.pilhaMax - 1)); return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; }
  if (tok === 'desc') return { x: L.descarte.x + L.descarte.w / 2, y: L.descarte.y + L.descarte.h / 2 };
  const [x, y] = tok.split(',').map(Number);
  return { x, y };
}
function fazerGesto(g) {
  const ev = (tipo, x, y) => canvas.dispatchEvent(new PointerEvent(tipo, { pointerId: 7, clientX: x, clientY: y, bubbles: true, isPrimary: true, pointerType: 'mouse' }));
  if (g.cmd.startsWith('key:')) { window.dispatchEvent(new KeyboardEvent('keydown', { key: g.cmd.slice(4), bubbles: true })); return; }
  if (g.cmd.startsWith('click:')) { $(g.cmd.slice(6)).click(); return; }
  if (g.cmd.startsWith('tap:')) { const p = pontoDe(g.cmd.slice(4)); ev('pointerdown', p.x, p.y); ev('pointerup', p.x, p.y); return; }
  const [de, para] = g.cmd.split('>');
  const a = pontoDe(de), b = pontoDe(para);
  ev('pointerdown', a.x, a.y);
  for (let k = 1; k <= 8; k++) ev('pointermove', a.x + ((b.x - a.x) * k) / 8, a.y + ((b.y - a.y) * k) / 8);
  ev('pointerup', b.x, b.y);
}
function resumo() {
  const e = J.e;
  return JSON.stringify({
    estado: J.estado, menu: menus.aberto, fimAberto: menus.fimAberto, pontos: e.pontos, n: e.n, recusas: e.recusas, hist: J.hist.length,
    colunas: e.colunas.map((c) => c.map((k) => k.tipo === 'normal' ? k.v : k.tipo)), fila: e.fila.map((k) => k.tipo === 'normal' ? k.v : k.tipo),
    descarte: e.descarte ? e.descarte.v : null, carga: e.descarteCarga, fim: e.fim, fase: J.n, mundo: e.mundo, nivel: e.nivel, barra: $('barra').style.width, progresso: Number(progressoDoNivel(e).toFixed(3)),
    poki: { jogando: poki.jogando, jaJogou: poki.jaJogou },
  });
}

const comecar = () => {
  if (dep.gesto) {
    const gs = lerGestos();
    for (const g of gs) setTimeout(() => fazerGesto(g), g.ms);
    setTimeout(() => { document.body.dataset.estado = resumo(); document.title = 'PRONTO'; }, Math.max(...gs.map((g) => g.ms)) + 600);
  }
  if (dep.menu) abrirMenu();
  ultimo = performance.now();
  requestAnimationFrame(frame);
  setInterval(reserva, 50);
};
if (document.fonts && document.fonts.load) document.fonts.load('700 40px Fredoka').then(comecar, comecar);
else comecar();
