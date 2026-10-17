// Ponto de entrada do 2048 Cards: liga motor, cena, entrada, HUD, menus, som
// e Poki. Unico modulo que importa core/poki.js.
//
// Fluxo: o mundo entra (zoom recuando) -> o jogador arrasta ou toca para
// jogar a carta da frente da fila numa coluna -> fusoes em cascata -> fez o
// valor do nivel, o nivel sobe na mesma mesa sem parar o jogo: a festa (o
// valor feito piscando, confete e a explosao do mundo) corre por cima da mesa
// enquanto o jogador continua; o intervalo comercial, se for a hora (a partir
// da fase 7, com espaco entre dois; a Poki decide a frequencia), vem logo
// depois da festa e nunca no meio de um arrasto. No 2048 o mundo termina e o
// proximo entra. Nenhum texto explica regra: o desenho, a mao guiada e a
// animacao fazem isso.
// Sem jogada legal e sem descarte: oferta de continuar (gratis 1x por nivel,
// depois video) ou recomecar o nivel pela mesa pronta dele.
// Teste A/B da 0.6.0 (src/core/variante.js): a regra de hoje ou o juntar (a
// carta do topo de uma coluna arrastada ate um topo igual em outra; a mao
// guiada ensina, sem texto). Depois do mundo 5 vem o mundo sem fim (fases.js,
// mundoDef), em que a mesa enche de verdade e o perigo aparece sem texto.

import { criarCena } from './render/cena.js';
import { Transicoes as Tr } from './render/transicoes.js';
import { criarPartida, jogar, desfazerPara, jogadasLegais, paresDeJuntar, perigo, VERSAO_ESTADO } from './jogo/partida.js';
import { melhorJogada } from './jogo/bot.js';
import { ESPECIAIS } from './jogo/baralho.js';
import { podeJuntar, topo } from './jogo/regras.js';
import { MUNDOS, POR_MUNDO, TOTAL_FASES, faseDe, faseGlobal, mundoDe, posNoMundo, mundoDef } from './jogo/fases.js';
import { progressoDoNivel } from './jogo/metas.js';
import { criarAudio } from './core/audio.js';
import { criarArmazem } from './core/armazenamento.js';
import { lerDepuracao } from './core/depuracao.js';
import { escolherVariante } from './core/variante.js';
import { escolherIdioma, textos, textoMissao } from './i18n/textos.js';
import { criarMissoes, progredir, renovar, missaoDaVez } from './jogo/missoes.js';
import { vibrar } from './core/haptico.js';
import { poki } from './core/poki.js';
import { criarHud } from './ui/hud.js';
import { criarMenus } from './ui/menus.js';
import { ICONES } from './ui/icones.js';

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const canvas = /** @type {HTMLCanvasElement} */ ($('cena'));
const cena = criarCena(canvas);
const audio = criarAudio();
const armazem = criarArmazem();
const dep = lerDepuracao();
const T = textos(dep.lang || escolherIdioma());
/** Ultimas medidas mandadas, so com os ganchos de teste (o resumo do ?gesto= mostra). */
const medidas = [];
if (dep.ganchos) {
  const medir = poki.measure.bind(poki);
  poki.measure = (c, o, a) => { medidas.push(`${c}/${o}/${a}`); if (medidas.length > 60) medidas.shift(); medir(c, o, a); };
}

/**
 * Fases sem intervalo comercial no comeco da sessao: o primeiro vem na entrada
 * da fase 7 (ou com 5 min de jogo). Na 0.4.1 vinha na fase 5 e a retencao
 * por nivel caia de 82% para 70% bem ali (Player Fit Test de 2026-10-13).
 */
const FASES_SEM_INTERVALO = 6;
/** Ajuda gratis (mao) por ocio ou recusas seguidas, nos dois primeiros mundos. */
const AJUDA_ATE = POR_MUNDO * 2;
const OCIO_AJUDA = 6000;
/**
 * Jogador novo na fase 1 (ate o primeiro 16), a carta nova do mundo na frente
 * da fila e, no juntar, o primeiro par de topos iguais: o gesto guiado volta
 * logo depois de cada jogada.
 */
const OCIO_GUIA = 1000;
/** Arrasto: anda mais que isso (px) e deixa de ser toque; no hoje, o arrasto de uma carta da mesa conta a partir de ARRASTO_MESA. */
const ARRASTO_MIN = 8;
const ARRASTO_MESA = 30;
const RECUSAS_AJUDA = 3;
// 2: a escada de valores (2026-10-13); o progresso da versao do duelo nao vale aqui
const VERSAO_SAVE = 2;

const salvo = armazem.ler('save', null);
const padraoSave = {
  v: VERSAO_SAVE, fase: 1, max: 1, mudo: false, regras: {},
  itens: { coringa: 0, martelo: 0, troca: 0 }, baus: {}, partida: null, vistas: [], missoes: null, variante: null,
};
const save = salvo && salvo.v === VERSAO_SAVE ? { ...padraoSave, ...salvo, itens: { ...padraoSave.itens, ...(salvo.itens || {}) }, vistas: salvo.vistas || [] } : { ...padraoSave };
if (dep.regras) save.regras = dep.regras;

if (!save.missoes || !save.missoes.missoes) save.missoes = criarMissoes((Date.now() >>> 0) || 1);
// prints da missao na mesa (so local): ?missao=tipo:alvo:atual:premio fixa a missao mostrada
if (dep.missao) {
  const [tipo, alvo, atual, premio] = dep.missao.split(':');
  save.missoes = { missoes: [{ id: 1, tipo, v: tipo === 'cartas' ? 128 : 0, alvo: Number(alvo) || 3, atual: Number(atual) || 0, feita: false, premio: ICONES[premio] ? premio : 'coringa' }], rng: 1, prox: 2 };
}
/** Opcoes de visual em teste (so local): ?visual=descarte,escada,missao,missaob. */
const VISUAL = dep.visual.split(',');
/**
 * Missao na mesa (0.5.0): o chip no painel e o premio voando ate o botao.
 * Ate o usuario aprovar a folha docs/escada/missao-na-mesa.png, so com
 * ?visual=missao (A, no painel) ou missaob (B, no vao dos botoes); sem ele,
 * o aviso "Mission done!" de antes.
 */
const COM_MISSAO = VISUAL.includes('missao') || VISUAL.includes('missaob');
/**
 * O braço do teste A/B, guardado no save (quem volta fica no mesmo). Em
 * localhost vale o forcado por ?variante= e, no resto, o controle (hoje): os
 * prints ficam deterministicos e nada vai para o save.
 */
const V = dep.local
  ? escolherVariante(null, { forcada: dep.variante, u: 0 })
  : escolherVariante(save.variante, { forcada: dep.variante, u: Math.random() });
if (!dep.local) save.variante = V;
/** Mesa com o perigo visivel: o mundo sem fim (a mesa enche de verdade). */
const comPerigo = (e) => !!e && e.mundo > MUNDOS.length;
/** Minutos de jogo em que a telemetria marca o tempo (densos ate 10 min, para a integral da media; a cauda ate 60). */
const MARCOS_MIN = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60];
/** Os mesmos minutos com o braço na categoria (<braço>/N/min): Other Events le o tempo por braço direto. */
const MARCOS_BRACO = new Set([1, 2, 3, 5, 7, 10, 15, 20]);
/** Segundos sem tocar no jogo depois do carregamento (espera/N/s): quem nunca toca sai logo ou fica olhando? */
const MARCOS_ESPERA = [5, 10, 20, 40];

const J = {
  /** n: fase global (1..40) do nivel em jogo */
  n: 1, e: null, tJogo: 0, marco: 0, tocou: false, tEspera: 0, marcoEspera: 0,
  /** 'jogando' | 'vitoria' | 'chance' | 'fim' | 'anuncio' | 'menu' */
  estado: 'jogando',
  /** trans: a transicao de fim de mundo (bloqueia); festa: a subida de nivel por cima do jogo (nao bloqueia); anuncio: o intervalo agendado para depois da festa */
  hist: [], trans: null, festa: null, anuncio: null, tEntrada: -1e9, bloqueio: 0, agora: 0, tVis: 0,
  carregou: false, ultimaAcao: 0, mao: null, maoCalc: 0, arrasto: null, destaque: -1, legal: true,
  tentativas: 0, autoProx: 0, febreAte: 0,
  /** novidade: a carta especial nova do mundo, que a mao guiada mostra na primeira vez (sem texto) */
  ajudaMedida: false, regraMaiorMedida: false, novidade: '', tChance: 0, itemPendente: '', bau: null, tAviso: 0,
  /** medidas de uma vez por sessao: o primeiro juntar (juntou/N/first) e o primeiro arrasto de carta da mesa (regra/arrasto/first) */
  juntouMedido: false, arrastoMesaMedido: false,
  /** guia da fase 1: passos aceitos com a mao na tela (telemetria guia/N/feito) */
  guiaPassos: 0,
  /** intervalos comerciais pedidos; subidas de nivel e jogo ativo desde o ultimo (espacamento proprio) */
  intervalos: 0, subidasDesdeIntervalo: 0, tJogoIntervalo: 0,
  /** videos (rewarded) do nivel: usado = ja deu o premio; visto = ja mediu o visible */
  video: { usado: {}, visto: {} },
  /** perigo da mesa (partida.js): do estado `perigoDe`; o alerta tem intervalo minimo; a medida e uma por nivel */
  perigo: null, perigoDe: null, tAlerta: -1e9, perigoMedido: false,
  /** id da missao no chip (missaoDaVez: a mostrada fica ate ser cumprida) */
  missaoId: -1,
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
  hud.atualizar(J.e, { rotulo: rotulo(), podeDesfazer: J.hist.length > 0 && J.estado === 'jogando', itemPendente: J.itemPendente || '', videos, missao: missaoNaTela() });
}

/** A missao do chip (nada no guia da fase 1: o jogador novo so ve o gesto). */
function missaoNaTela() {
  if (!COM_MISSAO || emGuia() || dep.vitrine || !save.missoes) return null;
  const m = missaoDaVez(save.missoes, J.missaoId);
  J.missaoId = m ? m.id : -1;
  return m;
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
  // o tempo do video nao conta como ocio
  J.agora = Math.max(J.agora, performance.now());
  J.ultimaAcao = J.agora;
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
  J.febreAte = 0; J.ajudaMedida = false; J.perigoMedido = false;
  J.festa = null; J.anuncio = null;
  J.ultimaAcao = J.agora; J.autoProx = J.agora + (dep.auto ? 700 : 0);
  J.tEntrada = entrada && !dep.fixo ? J.agora : -1e9;
  J.bloqueio = J.agora + (entrada && !dep.fixo ? 220 : 0);
  hud.febre(false);
  menus.esconderFim();
  atualizarHud();
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
  n = Math.max(1, n);
  if (n !== J.n) J.tentativas = 0;
  // a partida salva so continua na mesma versao do estado e no mesmo braço do teste A/B
  const ps = save.partida && save.partida.e;
  const salva = retomar && ps && ps.v === VERSAO_ESTADO && !ps.fim && (ps.perfil || 'hoje') === V.regra ? save.partida : null;
  let e;
  if (salva) {
    e = salva.e;
    J.tentativas = salva.tentativas || 0;
    n = faseGlobal(e.mundo, e.nivel);
  } else {
    const f = faseDe(n, J.tentativas, V.regra);
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
 * Novidade do mundo (coringa, bomba, dobro, x4): na primeira vez de cada
 * carta nova nao ha texto; a mao guiada mostra o gesto quando a carta chega
 * a frente da fila e o jogador para 1 s (OCIO_GUIA, como no nivel 1). Roda
 * na entrada da mesa e a cada subida de nivel (o mundo 1 traz duas, nos
 * niveis 2 e 4). Fica marcada em save.vistas quando a carta e jogada numa
 * coluna.
 */
function prepararNovidade() {
  J.novidade = '';
  const m = mundoDef(mundoDe(J.n));
  if (!m || dep.fixo || !J.e) return;
  const nv = m.novidades.find((x) => J.e.nivel >= x.nivel && ESPECIAIS.includes(x.tipo) && !save.vistas.includes('novidade:' + x.tipo));
  if (nv) J.novidade = nv.tipo;
}

/** A carta nova do mundo esta na frente da fila: a mao guia como no nivel 1. */
const novidadeNaFrente = () => !!J.novidade && !!J.e && !!J.e.fila[0] && J.e.fila[0].tipo === J.novidade;

/** O jogador jogou a carta nova numa coluna: a novidade esta vista. */
function novidadeVista(carta) {
  if (!J.novidade || !carta || carta.tipo !== J.novidade) return;
  save.vistas = [...save.vistas, 'novidade:' + J.novidade];
  J.novidade = '';
}

/** A fase 1 de quem nunca passou dela: o gesto guiado volta a cada jogada ate o primeiro 16. */
const emGuia = () => J.n === 1 && save.max <= 1;

/**
 * Braço juntar: o primeiro par de topos iguais da mesa, enquanto o jogador
 * nunca juntou (save.vistas 'juntar'), chama a mao guiada como a carta nova:
 * ela arrasta um topo ate o outro, sem texto.
 */
const juntarPendente = () => !!J.e && J.e.regras.juntar && !save.vistas.includes('juntar') && paresDeJuntar(J.e).length > 0;

/** O juntar que a mao mostra: o do guloso, se ele juntaria; senao o primeiro par. */
function juntarDaMao(a) {
  if (a && a.tipo === 'juntar') return a;
  const p = paresDeJuntar(J.e)[0];
  return p ? { tipo: 'juntar', de: p[0], c: p[1] } : a;
}

// ------------------------------------------------------------- acoes
/**
 * Aplica uma acao do jogador. origem = retangulo de onde a carta saiu (fila ou arrasto).
 * @returns {boolean} se a jogada foi aceita
 */
function aplicar(acao, origem) {
  if (J.estado !== 'jogando' || !J.e) return false;
  const antes = J.e;
  const carta = acao.tipo === 'colocar' ? antes.fila[antes.regras.filaLivre ? (acao.k | 0) : 0]
    : acao.tipo === 'juntar' ? (antes.colunas[acao.de] && topo(antes.colunas[acao.de])) || undefined
      : antes.fila[0];
  const r = jogar(antes, { ...acao, t: J.agora });
  if (!r.eventos.length) return false;
  // a febre pode expirar na mesma acao: o primeiro evento nem sempre e a recusa
  const recusada = r.eventos.some((ev) => ev.tipo === 'recusar');
  cena.linha.acelerar(J.agora);
  // jogou de novo durante a espera da festa: ela nao fica esperando a cascata cortada
  if (J.festa && !J.festa.disparada) J.festa.t0 = Math.min(J.festa.t0, J.agora + 100);
  if (recusada) {
    J.e = r.estado;
    if (r.eventos.some((ev) => ev.tipo === 'febre' && !ev.ligada)) hud.febre(false);
    cena.tocar(r.eventos, J.agora, { antes, depois: r.estado, origem, carta });
    audio.recusa();
    vibrar(10);
    // a regra estrita (maior sobre menor), medida uma vez por sessao; sem texto: o proibido e o tremor explicam
    if (!J.regraMaiorMedida && r.eventos.some((ev) => ev.tipo === 'recusar' && ev.motivo === 'maior')) { J.regraMaiorMedida = true; poki.measure('regra', 'maior', 'first'); }
    J.ultimaAcao = J.agora;
    return false;
  }
  // as primeiras jogadas da fase 1 de quem e novo: ate onde o jogador vai antes de sair (guia/N/feito)
  if (emGuia() && (acao.tipo === 'colocar' || acao.tipo === 'juntar') && J.guiaPassos < 5) { J.guiaPassos++; poki.measure('guia', String(J.guiaPassos), 'feito'); }
  J.hist = [antes];
  J.e = r.estado;
  avisarPerigo(antes, r.estado);
  if (acao.tipo === 'colocar') novidadeVista(carta);
  if (acao.tipo === 'juntar') {
    if (!save.vistas.includes('juntar')) save.vistas = [...save.vistas, 'juntar'];
    // a descoberta do verbo: o primeiro juntar da sessao e a fase em que ele aconteceu
    if (!J.juntouMedido) { J.juntouMedido = true; poki.measure('juntou', rotuloMedida(), 'first'); }
  }
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
  // missoes de sessao: premio em item na hora (o aviso espera o valor feito piscar, se a jogada subiu de nivel)
  const pm = progredir(save.missoes, r.eventos, J.e);
  if (pm.estado !== save.missoes) {
    save.missoes = pm.estado;
    const atraso = r.eventos.some((ev) => ev.tipo === 'nivel') ? 2200 : 0;
    for (const m of pm.concluidas) {
      J.e = { ...J.e, itens: { ...J.e.itens, [m.premio]: (J.e.itens[m.premio] || 0) + 1 } };
      if (COM_MISSAO) hud.celebrar(m, J.agora + atraso);
      else {
        const titulo = T.missaoFeita, texto = `${textoMissao(T, m)} · ${ICONES[m.premio]}+1`;
        if (atraso) setTimeout(() => avisar(titulo, texto), atraso); else avisar(titulo, texto);
      }
      // fora do funil de progresso (start/complete/fail): cai em Other Events
      poki.measure('missao', m.tipo, 'feita');
    }
    if (pm.concluidas.length) save.missoes = renovar(save.missoes);
  }
  // nivel vencido: complete do nivel feito e start do novo na hora (o jogo
  // nao para; e o measure fica calado durante o anuncio). Uma cascata que
  // pula um nivel inteiro comeca e termina ele aqui mesmo.
  const niveis = r.eventos.filter((ev) => ev.tipo === 'nivel');
  niveis.forEach((ev) => {
    poki.measure('level', String(J.n), 'complete');
    J.n = faseGlobal(J.e.mundo, ev.n);
    poki.measure('level', String(J.n), 'start');
  });
  if (niveis.length) {
    J.tentativas = 0;
    renovarVideos();
    J.hist = []; // o desfazer nao volta para o nivel de antes
    J.ajudaMedida = false; // a medida da ajuda e por nivel
    J.perigoMedido = false;
    J.subidasDesdeIntervalo += niveis.length;
    save.fase = J.n;
    save.max = Math.max(save.max, J.n);
    prepararNovidade();
  }
  atualizarHud();
  guardarPartida();
  salvar();
  if (J.e.fim === 'venceu') vencer();
  else {
    if (niveis.length) subirNivel(niveis);
    if (J.e.fim) terminar(J.e.fim);
  }
  return true;
}

/**
 * O perigo entrou na mesa (uma coluna chegou a 1 carta do limite, ou o fio):
 * a medida `<braço>/N/perigo` sai uma vez por nivel nos dois braços (nos
 * mundos 1 a 5 quer dizer "o aviso teria aparecido"); o som grave e a
 * vibracao, so no mundo sem fim, no maximo um a cada 3 s.
 */
function avisarPerigo(antes, depois) {
  if (depois.fim) return;
  const a = perigo(antes), d = perigo(depois);
  const entrou = (d.fio && !a.fio) || d.colunas.some((x, c) => x && !a.colunas[c]);
  if (!entrou) return;
  if (!J.perigoMedido) { J.perigoMedido = true; poki.measure(V.regra, rotuloMedida(), 'perigo'); }
  if (comPerigo(depois) && J.agora - J.tAlerta > 3000) { J.tAlerta = J.agora; audio.alerta(); vibrar([30, 60, 30]); }
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
const CARENCIA_MS = 300000;
/** Entre dois intervalos: pelo menos 2 subidas de nivel e 150 s de jogo ativo (a Poki ainda decide a frequencia). */
const ESPACO_SUBIDAS = 2;
const ESPACO_MS = 150000;
/** O intervalo da subida de nivel vem depois do valor feito piscar (ms depois do comeco da festa), fora de arrasto. */
const ANUNCIO_DEPOIS_MS = 1500;
const espacoOk = () => J.intervalos === 0 || (J.subidasDesdeIntervalo >= ESPACO_SUBIDAS && J.tJogo - J.tJogoIntervalo >= ESPACO_MS);
/**
 * Intervalo comercial na subida de nivel: so depois da carencia (fase 7 ou 5
 * min de jogo), com espaco do anterior e a partir do nivel 3 de cada mundo. O
 * fim do mundo nao tem intervalo: a entrada de cada mundo era onde o funil
 * mais caia (fase 17: 33% saiam, Player Fit Test da 0.4.4); o intervalo devido
 * cai na 2a subida do mundo novo.
 */
const podeIntervalo = () => !dep.semAnuncio && (J.n > FASES_SEM_INTERVALO || J.tJogo >= CARENCIA_MS) && posNoMundo(J.n) >= 3 && espacoOk();
/** "Recomecar o nivel" depois de perder: comercial so com 5 min de jogo (perder e anuncio no comeco espantam). */
const podeIntervaloDeNovo = () => !dep.semAnuncio && J.tJogo >= CARENCIA_MS && espacoOk();
/** Um intervalo foi pedido: o espacamento conta a partir dele. */
function marcarIntervalo() { J.intervalos++; J.subidasDesdeIntervalo = 0; J.tJogoIntervalo = J.tJogo; }

/**
 * Subida de nivel (o motor ja trocou o baralho e a meta): a festa por cima
 * da mesa, depois da cascata, sem parar o jogo: o valor feito piscando,
 * confete e a explosao do mundo. Uma cascata que sobe dois niveis festeja o
 * ultimo. O intervalo comercial, se for a hora, fica agendado para depois da
 * festa (ver atualizar), nunca no meio de um arrasto.
 */
function subirNivel(niveis) {
  const ult = niveis[niveis.length - 1];
  const L = cena.L;
  const espera = Math.min(1200, Math.max(0, cena.linha.fim - J.agora) + 120);
  J.festa = { t0: J.agora + espera, valor: ult.antes, texto: `${ult.antes}!`, fx: L.mesa.x + L.mesa.w / 2, fy: L.mesa.y + L.mesa.h / 2, semente: J.n * 31 + 7, disparada: false };
  if (!J.anuncio && podeIntervalo()) J.anuncio = { em: J.festa.t0 + ANUNCIO_DEPOIS_MS };
}

/** O 2048 do mundo: fim do mundo, bau e a transicao para o proximo. */
function vencer() {
  J.estado = 'vitoria';
  J.festa = null; J.anuncio = null; // o "2048!" e o intervalo do fim do mundo tomam o lugar
  poki.gameplayStop();
  poki.measure('level', String(J.n), 'complete');
  J.subidasDesdeIntervalo++;
  save.max = Math.max(save.max, J.n + 1);
  save.fase = J.n + 1;
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
    tipo: 'mundo', t0: J.agora + espera, trocou: false, festa: false,
    fx: L.mesa.x + L.mesa.w / 2, fy: L.mesa.y + L.mesa.h / 2, semente: J.n * 31 + 7, corMundo: cena.pal.acento,
    texto: '2048!',
  };
}

/** Troca para o proximo mundo no meio da transicao (depois do mundo 5, o mundo sem fim). */
function trocar() {
  J.trans.trocou = true;
  carregarFase(J.n + 1, true);
  if (J.bau) { avisar(T.bau, Object.entries(J.bau).filter(([, n]) => n > 0).map(([k, n]) => `${ICONES[k]}×${n}`).join('  ')); J.bau = null; }
}

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
  J.festa = null; J.anuncio = null; // o cartao da mesa cheia tem o proprio fluxo (e o proprio intervalo)
  if (!medida) {
    poki.measure(V.regra, rotuloMedida(), 'cheia');
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
  poki.measure(V.regra, rotuloMedida(), 'salvo');
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
  const efeitos = cena.atualizar(dt / 1000, J.agora);
  // o premio da missao voando ate o botao (?voo= congela, para os prints)
  if (COM_MISSAO) hud.animar(J.agora, dep.voo);
  // na subida de nivel a barra fica cheia ate a festa comecar; depois, a do nivel novo
  if (J.e) hud.progresso(J.festa && J.agora < J.festa.t0 + 500 ? 1 : progressoDoNivel(J.e));
  for (const e of efeitos) {
    switch (e.tipo) {
      case 'pouso': audio.pouso(); break;
      case 'fusao': audio.fusao(Math.max(1, (J.e ? J.e.combo : 1) - 1) + e.degrau); if (e.degrau === 1) vibrar(12); break;
      case 'completar': audio.critico(); vibrar([20, 40, 30]); break;
      case 'explodir': audio.explodir(); break;
      default: break;
    }
  }
  // a festa da subida de nivel e funcao do tempo: fecha mesmo sob o menu ou o anuncio
  if (J.festa) {
    const t = (J.agora - J.festa.t0) / 1000;
    if (t >= 0 && !J.festa.disparada) {
      J.festa.disparada = true;
      cena.festejar(J.festa.fx, J.festa.fy, J.festa.valor);
      if (J.estado === 'jogando') { audio.subida(Math.log2(J.festa.valor) - 3); vibrar([18, 50, 24]); }
    }
    if (t >= Tr.FESTA_FIM) J.festa = null;
  }
  if (J.estado === 'anuncio' || J.estado === 'menu') return;
  if (J.estado === 'jogando' && J.tocou) {
    J.tJogo += dt;
    const min = Math.floor(J.tJogo / 60000);
    while (J.marco < MARCOS_MIN.length && min >= MARCOS_MIN[J.marco]) {
      const m = MARCOS_MIN[J.marco];
      poki.measure('tempo', String(m), 'min');
      // o tempo por braço do teste A/B (os Funnels do painel so olham 10 eventos adiante)
      if (MARCOS_BRACO.has(m)) poki.measure(V.regra, String(m), 'min');
      J.marco++;
    }
  } else if (J.estado === 'jogando' && J.carregou && !dep.vitrine) {
    // antes do primeiro toque: quanto tempo o jogador olha a mesa sem tocar
    J.tEspera += dt;
    while (J.marcoEspera < MARCOS_ESPERA.length && J.tEspera >= MARCOS_ESPERA[J.marcoEspera] * 1000) { poki.measure('espera', String(MARCOS_ESPERA[J.marcoEspera]), 's'); J.marcoEspera++; }
  }
  if (J.estado === 'chance') {
    if (J.agora - J.tChance > 700) segundaChance();
    return;
  }
  if (J.e && J.e.febre && J.agora >= J.e.febreAte) {
    // a febre expira pelo relogio das acoes; aqui so o HUD apaga
    hud.febre(false);
  }
  // o intervalo da subida de nivel: depois da festa, nunca no meio de um arrasto
  if (J.anuncio && J.estado === 'jogando' && !J.arrasto && J.agora >= J.anuncio.em) {
    J.anuncio = null;
    J.estado = 'anuncio';
    marcarIntervalo();
    const voltar = () => {
      if (J.estado === 'anuncio') J.estado = 'jogando';
      J.ultimaAcao = J.agora;
      atualizarHud();
    };
    poki.commercialBreak().then(voltar, voltar);
  }
  // fim do mundo: a transicao bloqueia ate o mundo novo entrar
  if (J.trans) {
    const t = (J.agora - J.trans.t0) / 1000;
    if (t >= 0 && !J.trans.festa) {
      J.trans.festa = true;
      cena.festejar(J.trans.fx, J.trans.fy, 2048);
      audio.mundo();
    }
    if (!J.trans.trocou && t >= Tr.TROCA[J.trans.tipo]) trocar();
    if (J.trans && t >= Tr.FIM[J.trans.tipo] + 0.4) J.trans = null;
  }
  // mao de ajuda: ocio ou recusas seguidas, nos primeiros mundos (fora da mesa de demonstracao);
  // o guia da fase 1 e a carta nova do mundo (novidade) voltam com 1 s de ocio, em qualquer mundo
  if (J.estado === 'jogando' && J.e && !J.arrasto && !dep.vitrine) {
    const parado = J.agora - J.ultimaAcao;
    const porRecusa = J.e.recusas >= RECUSAS_AJUDA;
    const pendente = juntarPendente();
    const guia = emGuia() || novidadeNaFrente() || pendente;
    const precisa = ((J.n <= AJUDA_ATE || guia) && parado > (guia ? OCIO_GUIA : OCIO_AJUDA)) || porRecusa;
    if (precisa && J.agora - J.maoCalc > 800) {
      J.maoCalc = J.agora;
      // uma medida por nivel: o jogador travou (parado) ou nao entendeu a regra (recusas); o guia (fase 1, carta nova) nao conta
      if (!J.ajudaMedida && !guia) { J.ajudaMedida = true; poki.measure('ajuda', rotuloMedida(), porRecusa ? 'recusa' : 'ocio'); }
      // guarda a jogada; a posicao sai do layout de cada quadro (maoNaTela)
      // no juntar, o primeiro par de topos iguais vem antes (a carta nova da fila espera)
      const b = melhorJogada(J.e, J.agora);
      const a = pendente && !novidadeNaFrente() ? juntarDaMao(b) : b;
      J.mao = a && (a.tipo === 'colocar' || a.tipo === 'descartar' || a.tipo === 'juntar') ? a : null;
    } else if (!precisa) J.mao = null;
  }
  if (dep.auto && J.estado === 'jogando' && J.e && J.agora >= J.autoProx) {
    J.autoProx = J.agora + dep.auto;
    const a = melhorJogada(J.e, J.agora);
    if (a) aplicar(a, a.tipo === 'juntar' ? undefined : cena.L.filaPos(a.k || 0));
  }
}

/**
 * A mao de ajuda na tela, pelo layout atual: no 'colocar', o gesto guiado da
 * carta da fila ate a coluna; no 'juntar', da carta do topo de uma coluna ate
 * o topo igual da outra; no 'descartar', a mao apontando o descarte.
 */
function maoNaTela() {
  const a = J.mao;
  if (!a || J.estado !== 'jogando' || J.arrasto || !J.e) return null;
  const L = cena.L;
  if (a.tipo === 'descartar') return { x: L.descarte.x + L.descarte.w / 2, y: L.descarte.y + L.descarte.h / 2 };
  if (a.tipo === 'juntar') {
    const de = J.e.colunas[a.de], para = J.e.colunas[a.c];
    if (!de || !de.length || !para || !para.length) return null;
    const o = L.carta(a.de, de.length - 1), p = L.carta(a.c, para.length - 1);
    return { x: p.x + p.w / 2, y: p.y + p.h / 2, de: { x: o.x + o.w / 2, y: o.y + o.h / 2 }, carta: topo(de), w: o.w, h: o.h, c: a.c, juntar: true };
  }
  const col = J.e.colunas[a.c], k = a.k || 0;
  if (!col || !J.e.fila[k]) return null;
  const p = L.carta(a.c, Math.min(col.length, L.pilhaMax - 1)), f = L.filaPos(k);
  return { x: p.x + p.w / 2, y: p.y + p.h / 2, de: { x: f.x + f.w / 2, y: f.y + f.h / 2 }, carta: J.e.fila[k], w: f.w, h: f.h, c: a.c };
}

/**
 * Perigo desenhado (so no mundo sem fim): as colunas a 1 carta do limite e o
 * fio, recalculados quando o estado muda; na segunda chance do mundo 1, a
 * coluna que vai ser limpa (a mais cheia, como no motor) treme forte.
 */
function perigoNaTela() {
  if (!comPerigo(J.e)) return null;
  if (J.perigoDe !== J.e) { J.perigoDe = J.e; J.perigo = perigo(J.e); }
  if (J.estado !== 'chance') return J.perigo;
  let forte = -1, qtd = -1;
  J.e.colunas.forEach((col, c) => { if (col.length > qtd) { qtd = col.length; forte = c; } });
  return { ...J.perigo, forte };
}

function quadro() {
  const tr = J.trans;
  const info = { texto: (tr && tr.texto) || T.yes, textoMundo: `${T.mundo} ${mundoDe(J.n + (tr && tr.trocou ? 0 : 1))}` };
  cena.desenhar({
    estado: J.e, agora: J.agora, trans: J.trans, festa: J.festa, tEntrada: J.tEntrada, arrasto: J.arrasto, destaque: J.destaque, legal: J.legal, alvo: J.itemPendente || '',
    mao: maoNaTela(), febre: J.e && J.e.febre && J.agora < J.e.febreAte ? 1 : 0, info, semFila: false, perigo: perigoNaTela(),
  });
}

let ultimo = performance.now();
function frame() {
  // o proximo quadro sai agendado antes de desenhar: um erro no desenho perde
  // um quadro e nao congela a tela (na 0.4.1/0.4.2, o canvas 0x0 do iPad e o
  // roundRect do Safari antigo paravam o laco de vez)
  requestAnimationFrame(frame);
  // um relogio so: o carimbo do requestAnimationFrame pode ficar atras do performance.now()
  const agora = performance.now();
  const dt = Math.max(0, Math.min(100, agora - ultimo));
  ultimo = agora;
  J.agora = agora;
  try {
    atualizar(dt);
    quadroSeguro();
  } catch (err) { relatarErro(err); }
}

/** Desenha o quadro e, no primeiro, tira a tela de carregamento da Poki. */
function quadroSeguro() {
  try {
    quadro();
  } catch (err) {
    // o erro pode sair entre um save e um restore: o contexto volta ao estado inicial
    cena.recuperar();
    throw err;
  }
  carregou();
}

/** Mensagens de erro ja relatadas: cada uma vai uma vez, e nao 60 vezes por segundo. */
const errosRelatados = new Set();
/**
 * O laco segue; o erro e lancado de novo fora dele (uma vez por mensagem),
 * para a Poki e o titulo de depuracao continuarem vendo a pilha.
 */
function relatarErro(err) {
  const msg = String((err && err.message) || err);
  if (errosRelatados.has(msg)) return;
  errosRelatados.add(msg);
  setTimeout(() => { throw err; });
}

/**
 * A Poki tira a tela de carregamento aqui: so com a fonte pronta e a mesa
 * desenhada (na 0.4.1 era antes do primeiro quadro, e 25% dos jogadores de
 * desktop nunca tocavam no jogo). Uma vez por sessao.
 */
function carregou() {
  if (J.carregou) return;
  J.carregou = true;
  poki.gameLoadingFinished();
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
/** Retangulo da carta arrastada (1,1x: a da fila pelo tamanho da fila, a da mesa pelo da coluna). */
function origemArrasto(a) {
  const L = cena.L;
  const w = a.origem === 'coluna' ? L.cw : L.filaPos(0).w, h = a.origem === 'coluna' ? L.ch : L.filaPos(0).h;
  return { x: a.x - w * 0.55, y: a.y - h * 0.55, w: w * 1.1, h: h * 1.1 };
}

function legalEm(c) {
  if (c < 0 || !J.e) return false;
  if (J.arrasto && J.arrasto.origem === 'coluna') return podeJuntar(J.e.regras, J.e.colunas, J.arrasto.de, c).ok;
  if (!J.e.fila.length) return false;
  const k = J.arrasto ? J.arrasto.k : 0;
  return jogadasLegais(J.e, J.e.fila[k]).includes(c);
}

/** A primeira vez na sessao que o jogador arrasta uma carta da mesa (nos dois braços: no hoje, o gesto que nao existe). */
function medirArrastoMesa() {
  if (J.arrastoMesaMedido) return;
  J.arrastoMesaMedido = true;
  poki.measure('regra', 'arrasto', 'first');
}

/** Toque de jogo (ponteiro, tecla ou botao): abre a sessao de gameplay da Poki e marca o primeiro da sessao. */
function tocar() {
  poki.gameplayStart();
  if (!J.tocou) { J.tocou = true; poki.measure('game', 'toque', 'first'); }
}

/** No hoje, o toque numa coluna que joga a carta da mao; se o ponteiro seguir andando, o jogador tentava arrastar uma carta da mesa. */
let toqueMesa = null;

canvas.addEventListener('pointerdown', (e) => {
  audio.iniciar();
  J.agora = Math.max(J.agora, performance.now());
  if (J.estado !== 'jogando' || J.agora < J.bloqueio || !J.e) return;
  tocar();
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
  const desloc = toque ? Math.round(L.ch * 0.7) : 0;
  if (k >= 0 && (k === 0 || J.e.regras.filaLivre) && J.e.fila[k]) {
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignora */ }
    J.arrasto = { origem: 'fila', id: J.e.fila[k].id, k, x, y: y - desloc, x0: x, y0: y, desloc, pid: e.pointerId, moveu: false, rot: 0 };
    J.destaque = -1;
    return;
  }
  const c = L.colunaEm(x, y);
  // juntar: a coluna com cartas espera o soltar (toque = joga a carta da mao ali; arrasto = leva a carta de cima)
  if (c >= 0 && J.e.regras.juntar && J.e.colunas[c].length) {
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignora */ }
    J.arrasto = { origem: 'coluna', de: c, id: topo(J.e.colunas[c]).id, k: 0, x, y: y - desloc, x0: x, y0: y, desloc, pid: e.pointerId, moveu: false, rot: 0 };
    J.destaque = -1;
    return;
  }
  if (c >= 0) {
    toqueMesa = J.e.colunas[c].length ? { pid: e.pointerId, x0: x, y0: y } : null;
    aplicar({ tipo: 'colocar', c, k: 0 }, L.filaPos(0));
    return;
  }
  if (L.descarteEm(x, y)) aplicar({ tipo: 'descartar' }, L.filaPos(0));
});
canvas.addEventListener('pointermove', (e) => {
  if (toqueMesa && toqueMesa.pid === e.pointerId && Math.hypot(e.clientX - toqueMesa.x0, e.clientY - toqueMesa.y0) > ARRASTO_MESA) {
    toqueMesa = null;
    medirArrastoMesa();
  }
  const a = J.arrasto;
  if (!a || a.pid !== e.pointerId) return;
  const dx = e.clientX - a.x;
  a.x = e.clientX; a.y = e.clientY - a.desloc;
  a.rot = Math.max(-0.2, Math.min(0.2, a.rot * 0.8 + dx * 0.004));
  if (!a.moveu && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) > ARRASTO_MIN) {
    a.moveu = true;
    if (a.origem === 'coluna') medirArrastoMesa();
  }
  const c = cena.L.colunaEm(a.x, a.y);
  // a coluna de onde a carta da mesa saiu nao acende (nem o proibido)
  J.destaque = a.origem === 'coluna' && (!a.moveu || c === a.de) ? -1 : c;
  J.legal = legalEm(J.destaque);
});
const soltar = (e) => {
  if (toqueMesa && toqueMesa.pid === e.pointerId) toqueMesa = null;
  const a = J.arrasto;
  if (!a || a.pid !== e.pointerId) return;
  J.arrasto = null; J.destaque = -1;
  J.ultimaAcao = J.agora; // arrastar e soltar fora tambem e acao (a mao de ocio nao conta isso como parado)
  if (J.estado !== 'jogando' || !J.e) return;
  const L = cena.L;
  const c = L.colunaEm(a.x, a.y);
  if (a.origem === 'coluna') {
    const col = J.e.colunas[a.de];
    // teclas ou o desfazer podem ter mudado a mesa durante o arrasto: a carta tem de ser o topo ainda
    const aindaTopo = !!col && col.length > 0 && topo(col).id === a.id;
    if (!a.moveu) {
      if (e.type !== 'pointercancel') aplicar({ tipo: 'colocar', c: a.de, k: 0 }, L.filaPos(0));
      return;
    }
    if (!aindaTopo) return;
    const volta = () => cena.linha.voltar(a.id, origemArrasto(a), L.carta(a.de, col.length - 1), J.agora);
    if (c >= 0 && c !== a.de) { if (!aplicar({ tipo: 'juntar', de: a.de, c }, origemArrasto(a))) volta(); return; }
    volta();
    return;
  }
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
  if (n >= 1 && n <= J.e.regras.colunas) { tocar(); aplicar({ tipo: 'colocar', c: n - 1, k: 0 }, L.filaPos(0)); return; }
  if (e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace' || e.key === 'd' || e.key === 'D') { tocar(); aplicar({ tipo: 'descartar' }, L.filaPos(0)); return; }
  if (e.key === 'z' || e.key === 'Z') { tocar(); desfazer(); }
  if (e.key === 'r' || e.key === 'R') { tocar(); recomecar(); }
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
botao('bDesfazer', () => { if (J.estado === 'jogando') { tocar(); desfazer(); } });
function pedirAlvo(item) {
  if (J.estado !== 'jogando' || !(J.e.itens[item] > 0)) return;
  tocar();
  J.itemPendente = J.itemPendente === item ? '' : item;
  J.ultimaAcao = J.agora;
  atualizarHud();
}
botao('iCoringa', () => pedirAlvo('coringa'));
botao('iMartelo', () => pedirAlvo('martelo'));
botao('iTroca', () => { if (J.estado === 'jogando') { tocar(); aplicar({ tipo: 'item', item: 'troca' }, cena.L.filaPos(0)); } });
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
    totalFases: () => Math.max(TOTAL_FASES, mundoDe(save.max) * POR_MUNDO),
    maxFase: () => save.max,
    faseAtual: () => J.n,
    irPara: (n) => { menus.fechar(); J.trans = null; if (n !== J.n) J.tentativas = 0; else J.tentativas++; carregarFase(n, true); },
    recomecar,
    aoFechar: () => { if (J.estado === 'menu') J.estado = 'jogando'; J.ultimaAcao = J.agora; },
    continuarGratis: () => {
      if (J.estado !== 'fim' || !temGratis()) return;
      poki.measure(V.regra, rotuloMedida(), 'salvo');
      continuar();
    },
    continuarVideo: async () => {
      if (J.estado !== 'fim') return;
      poki.measure('rewarded', 'continuar', 'interact');
      J.estado = 'anuncio';
      const ok = await recompensa();
      J.estado = 'fim';
      J.agora = Math.max(J.agora, performance.now());
      J.ultimaAcao = J.agora;
      if (ok) { menus.esconderFim(); continuar(); }
    },
    deNovo: () => {
      poki.measure('level', rotuloMedida(), 'fail');
      const ir = () => { J.trans = null; recomecar(); };
      if (podeIntervaloDeNovo() && J.estado !== 'anuncio') { marcarIntervalo(); J.estado = 'anuncio'; poki.commercialBreak().then(ir, ir); } else ir();
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

document.addEventListener('visibilitychange', () => {
  audio.pausarAba(document.hidden);
  // a volta da aba nao conta como ocio
  if (!document.hidden) J.ultimaAcao = Math.max(J.agora, performance.now());
});
addEventListener('resize', layout);

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
// as opcoes de visual em teste (so local): ?visual=descarte,escada,missao,missaob; ?guia=0..1
if (dep.visual || dep.guia >= 0) {
  cena.definirVisual({ descarteFila: VISUAL.includes('descarte'), guiaU: dep.guia });
  hud.mostrarEscada(VISUAL.includes('escada'));
}
hud.mostrarMissao(COM_MISSAO, VISUAL.includes('missaob'), () => { audio.completar(); vibrar([16, 40, 16]); });
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
  const e = criarPartida(save.regras, { ...VITRINE, mundo, perfil: V.regra, regras: { ...(mundoDef(mundo).regras || {}), juntar: V.regra === 'juntar' } }, 7);
  const col = e.colunas[1];
  if (col.length) col[col.length - 1] = { ...col[col.length - 1], esp: true };
  const fila = mundo >= 4 ? ['dobro', 'quadruplo', 'bomba'] : ['coringa', 'bomba', 'dobro'];
  e.fila = fila.map((tipo, k) => ({ id: 901 + k, tipo, v: 0 })).slice(0, e.regras.tamFila);
  e.pontos = 2048; e.descarte = { id: 904, tipo: 'normal', v: 4 };
  e.descarteCarga = Math.max(0, e.regras.descarteMax - 2);
  prepararPartida(e, false);
} else {
  // a etiqueta do teste A/B vai antes do primeiro level/N/start (o funil do painel comeca nela)
  poki.measure('variante', V.regra, 'start');
  carregarFase(dep.nivel || save.fase || 1, !dep.fixo, !dep.nivel);
  // prints do voo (so local): a missao de ?missao= cumprida, com o premio ja no inventario e o voo congelado em ?voo=
  if (dep.voo >= 0 && COM_MISSAO && save.missoes.missoes[0]) {
    const m = { ...save.missoes.missoes[0], atual: save.missoes.missoes[0].alvo, feita: true };
    J.e = { ...J.e, itens: { ...J.e.itens, [m.premio]: (J.e.itens[m.premio] || 0) + 1 } };
    hud.celebrar(m, 0);
    atualizarHud();
  }
}
document.querySelectorAll('[aria-label]').forEach((el) => {
  const mapa = { bDesfazer: T.desfazer, bMenu: T.menu, bPausa: T.pausa, bFechar: T.fechar, iCoringa: T.coringa, iMartelo: T.martelo, iTroca: T.troca, bSom: T.som, vDescarte: T.videoEsvaziarRotulo, vCoringa: T.videoCoringaRotulo };
  if (mapa[el.id]) el.setAttribute('aria-label', mapa[el.id]);
});

if (dep.ganchos) {
  window.addEventListener('error', (ev) => { document.title = 'ERRO ' + ev.message; });
  window.addEventListener('unhandledrejection', (ev) => { document.title = 'ERRO ' + (ev.reason && ev.reason.message || ev.reason); });
  /** @type {any} */ (window).__c2 = {
    J, cena, audio, poki, save, jogar: (a) => aplicar(a, a.tipo === 'juntar' ? undefined : cena.L.filaPos(0)),
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
  // topoC: a carta de cima da coluna C (o arrasto do juntar); colC: a proxima casa vazia dela
  if (tok.startsWith('topo')) { const c = Number(tok.slice(4)) || 0; const col = J.e.colunas[c]; const p = L.carta(c, Math.max(0, col.length - 1)); return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; }
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
  // a>b arrasta e solta; a>b~ arrasta e segura (print do meio do arrasto)
  const segura = g.cmd.endsWith('~');
  const [de, para] = g.cmd.replace(/~$/, '').split('>');
  const a = pontoDe(de), b = pontoDe(para);
  ev('pointerdown', a.x, a.y);
  for (let k = 1; k <= 8; k++) ev('pointermove', a.x + ((b.x - a.x) * k) / 8, a.y + ((b.y - a.y) * k) / 8);
  if (!segura) ev('pointerup', b.x, b.y);
}
function resumo() {
  const e = J.e;
  return JSON.stringify({
    estado: J.estado, festa: !!J.festa, anuncio: !!J.anuncio, menu: menus.aberto, fimAberto: menus.fimAberto, pontos: e.pontos, n: e.n, recusas: e.recusas, hist: J.hist.length,
    colunas: e.colunas.map((c) => c.map((k) => k.tipo === 'normal' ? k.v : k.tipo)), fila: e.fila.map((k) => k.tipo === 'normal' ? k.v : k.tipo),
    descarte: e.descarte ? e.descarte.v : null, carga: e.descarteCarga, fim: e.fim, fase: J.n, mundo: e.mundo, nivel: e.nivel, barra: $('barra').style.width, progresso: Number(progressoDoNivel(e).toFixed(3)),
    poki: { jogando: poki.jogando, jaJogou: poki.jaJogou }, variante: V, perfil: e.perfil, perigo: perigo(e), intervalos: J.intervalos, medidas,
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
  // reserva: se o requestAnimationFrame nao andar (aba escondida ao carregar), desenha um quadro e avisa a Poki
  setTimeout(() => {
    if (J.carregou) return;
    J.agora = performance.now();
    try { quadroSeguro(); } catch (err) { relatarErro(err); }
    carregou();
  }, 800);
};
if (document.fonts && document.fonts.load) document.fonts.load('700 40px Fredoka').then(comecar, comecar);
else comecar();
