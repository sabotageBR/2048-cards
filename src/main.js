// Ponto de entrada do 2048 Cards: liga motor, cena, entrada, HUD, menus, som
// e Poki. Unico modulo que importa core/poki.js.
//
// Fluxo: a fase entra (zoom recuando) -> o jogador arrasta ou toca para
// jogar a carta da frente da fila numa coluna -> fusoes em cascata -> com a
// meta cumprida vem o "YES!" estilo Blumgi, o intervalo comercial (a partir
// da fase 5; a Poki decide a frequencia) e a proxima fase, sem tela no meio.
// Sem jogada legal e sem descarte: oferta de continuar (gratis 1x, depois
// video) ou jogar de novo.

import { criarCena } from './render/cena.js';
import { Transicoes as Tr } from './render/transicoes.js';
import { criarPartida, jogar, desfazerPara, jogadasLegais, VERSAO_ESTADO } from './jogo/partida.js';
import { melhorJogada } from './jogo/bot.js';
import { FASES, CLASSICO, POR_MUNDO, faseDe, mundoDe, posNoMundo } from './jogo/fases.js';
import { criarAudio } from './core/audio.js';
import { criarArmazem } from './core/armazenamento.js';
import { lerDepuracao } from './core/depuracao.js';
import { escolherIdioma, textos, textoMissao, nomeMonstro as nomeDe, dicaFeitico } from './i18n/textos.js';
import { criarMissoes, progredir, renovar } from './jogo/missoes.js';
import { faseDiaria } from './jogo/diario.js';
import { vibrar } from './core/haptico.js';
import { poki } from './core/poki.js';
import { criarHud } from './ui/hud.js';
import { criarMenus } from './ui/menus.js';
import { monstroDaFase, monstroDaCadeia } from './render/monstros.js';

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
const VERSAO_SAVE = 1;

const salvo = armazem.ler('save', null);
const padraoSave = {
  v: VERSAO_SAVE, fase: 1, max: 1, estrelas: {}, recorde: 0, mudo: false, modo: 'aventura', regras: {},
  itens: { coringa: 0, martelo: 0, troca: 0 }, ganhos: {}, baus: {}, partida: null, vistas: [], missoes: null, diario: { data: '', pontos: 0 },
};
const save = salvo && salvo.v === VERSAO_SAVE ? { ...padraoSave, ...salvo, itens: { ...padraoSave.itens, ...(salvo.itens || {}) }, vistas: salvo.vistas || [] } : { ...padraoSave };
// save.cenario e save.skin (da Colecao antiga) podem estar no save: sao ignorados, o visual e o do reino.
if (dep.regras) save.regras = dep.regras;

/** Data local AAAA-MM-DD (semente do diario). */
const dataLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
if (!save.missoes || !save.missoes.missoes) save.missoes = criarMissoes((Date.now() >>> 0) || 1);
/** Minutos de jogo em que a telemetria marca o tempo. */
const MARCOS_MIN = [1, 2, 3, 5, 7, 10, 15];

const J = {
  modo: 'aventura', n: 1, fase: null, e: null, tJogo: 0, marco: 0, tocou: false,
  /** 'jogando' | 'vitoria' | 'refazendo' | 'chance' | 'fim' | 'anuncio' | 'menu' */
  estado: 'jogando',
  hist: [], trans: null, tEntrada: -1e9, tRefazer: 0, bloqueio: 0, agora: 0, tVis: 0,
  carregou: false, ultimaAcao: 0, mao: null, maoCalc: 0, arrasto: null, destaque: -1, legal: true,
  tentativas: 0, continuouGratis: false, autoProx: 0, congelado: false, novoRecorde: false, febreAte: 0, recordeInicial: 0,
  ajudaMedida: false, feiticoNovo: '', tChance: 0,
};

function salvar() {
  save.mudo = audio.mudo;
  armazem.gravar('save', save);
}

// ------------------------------------------------------------ layout
function layout() {
  const W = innerWidth, H = innerHeight;
  const dpr = Math.min(2, devicePixelRatio || 1);
  // o topo da arena e o fim do painel (em retrato os botoes ficam nos cantos da arena)
  const rp = $('painel').getBoundingClientRect();
  const topo = dep.semHud ? 10 : rp.bottom + 6;
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
/** Nome do monstro da partida no idioma ("Gosmo Guloso", "Rei Golem"). */
const nomeMonstro = () => nomeDe(T, cena.monstro);

/** Monstro do estado: o da fase na Aventura; o da cadeia no Classico e no Diario. */
const defDoEstado = (e) => (e && e.monstro && e.monstro.cadeia ? monstroDaCadeia(e.monstro) : monstroDaFase(J.fase || {}));
/** Na cadeia, o numero do monstro que esta na tela (o motor pode ja estar no proximo). */
const nivelVisivel = () => cena.monstro.nivel || 1;

function rotulo() {
  if (J.modo === 'classico') return `${T.monstroN.replace('{n}', String(nivelVisivel()))} · ${nomeMonstro()}`;
  if (J.modo === 'diario') return `${T.diario} · ${nomeMonstro()}`;
  return `${T.fase} ${J.n} · ${nomeMonstro()}`;
}

/** Segundo campo da telemetria: o numero da fase na Aventura, o nome do modo fora dela. */
const rotuloMedida = () => (J.modo === 'aventura' ? String(J.n) : J.modo);

/** Linha de baixo do painel nos modos em cadeia (na Aventura sao as metas). */
function metaTexto() {
  if (J.modo === 'classico') return `${T.classico} · ${T.derrotados.replace('{n}', String(nivelVisivel() - 1))}`;
  if (J.modo === 'diario') return `${T.monstroN.replace('{n}', String(nivelVisivel()))} · ${T.cartasRestantes.replace('{n}', String(Math.max(0, J.e.restantes) + J.e.fila.length))}`;
  return undefined;
}

function atualizarHud() {
  hud.atualizar(J.e, { rotulo: rotulo(), metaTexto: metaTexto(), recorde: J.modo !== 'aventura' ? J.recordeInicial : 0, podeDesfazer: J.hist.length > 0 && J.estado === 'jogando', itemPendente: J.itemPendente || '' });
}

function prepararPartida(e, entrada) {
  J.e = e;
  J.hist = [];
  const def = defDoEstado(e);
  aplicarVisual(def.reino);
  cena.definirRegras(e.regras);
  posAviso();
  cena.novaBatalha(def, e);
  J.estado = 'jogando';
  J.mao = null; J.maoCalc = 0; J.arrasto = null; J.destaque = -1;
  J.continuouGratis = false; J.novoRecorde = false; J.febreAte = 0; J.ajudaMedida = false;
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

/** Itens bonus da fase entram no inventario uma vez; o inventario e persistente. */
function comInventario(e, fase) {
  if (fase.itens && !save.ganhos[fase.id]) {
    save.ganhos[fase.id] = true;
    for (const k of Object.keys(save.itens)) save.itens[k] += fase.itens[k] || 0;
  }
  return { ...e, itens: { ...e.itens, coringa: save.itens.coringa, martelo: save.itens.martelo, troca: save.itens.troca } };
}

function guardarPartida() {
  if (!J.e) return;
  for (const k of Object.keys(save.itens)) save.itens[k] = J.e.itens[k] || 0;
  save.partida = J.e.fim ? null : { modo: J.modo, n: J.n, e: J.e, tentativas: J.tentativas };
}

function carregarFase(n, entrada = true, retomar = false) {
  if (n > FASES.length) n = FASES.length;
  if (n !== J.n) J.tentativas = 0;
  J.modo = 'aventura';
  J.n = n;
  J.fase = faseDe(n);
  const salva = retomar && save.partida && save.partida.modo === 'aventura' && save.partida.n === n ? save.partida : null;
  let e;
  if (salva && salva.e && salva.e.v === VERSAO_ESTADO && !salva.e.fim) { e = salva.e; J.tentativas = salva.tentativas || 0; }
  else e = comInventario(criarPartida(save.regras, J.fase, J.fase.semente + J.tentativas * 7919), J.fase);
  prepararPartida(e, entrada);
  save.fase = n; save.modo = 'aventura';
  avisarNovidade(J.fase);
  guardarPartida();
  salvar();
  poki.measure('level', String(n), 'start');
}

/**
 * Primeira vez de um feitico (ou do chefao furioso): aviso curto com a dica.
 * O do chefao sai na entrada da fase; o do feitico espera o primeiro impacto
 * (avisarFeitico), quando a carta atingida esta na tela. Fica marcado em
 * save.vistas so quando aparece.
 */
function avisarNovidade(fase) {
  J.feiticoNovo = '';
  const m = fase && fase.monstro;
  if (!m || dep.fixo) return;
  const anteriores = FASES.filter((f) => f.id < fase.id && f.monstro);
  const novo = m.feiticos.find((f) => !anteriores.some((a) => a.monstro.feiticos.includes(f)));
  if (novo) { if (!save.vistas.includes('feitico:' + novo)) J.feiticoNovo = novo; return; }
  if (!m.furia || anteriores.some((a) => a.monstro.furia) || save.vistas.includes('chefe')) return;
  save.vistas = [...save.vistas, 'chefe'];
  setTimeout(() => avisar(T.avisoChefe, T.dicaChefe, 4000), 900);
}

/** No primeiro impacto do feitico novo da fase: o aviso com a dica. */
function avisarFeitico(feitico) {
  if (!J.feiticoNovo || feitico !== J.feiticoNovo || !J.fase || !J.fase.monstro) return;
  J.feiticoNovo = '';
  save.vistas = [...save.vistas, 'feitico:' + feitico];
  salvar();
  avisar(T.avisoAtaque.replace('{m}', nomeMonstro()), dicaFeitico(T, feitico, J.fase.monstro), 4500);
}

function iniciarClassico(entrada = true, retomar = false) {
  J.modo = 'classico';
  J.fase = CLASSICO;
  J.recordeInicial = save.recorde;
  const salva = retomar && save.partida && save.partida.modo === 'classico' ? save.partida : null;
  let e;
  if (salva && salva.e && salva.e.v === VERSAO_ESTADO && !salva.e.fim) e = salva.e;
  else {
    const semente = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
    e = comInventario(criarPartida(save.regras, CLASSICO, semente || 1), CLASSICO);
  }
  prepararPartida(e, entrada);
  save.modo = 'classico';
  guardarPartida();
  salvar();
  poki.measure('mode', 'classico', 'start');
}

function iniciarDiario(entrada = true) {
  J.modo = 'diario';
  const hoje = dataLocal();
  J.fase = faseDiaria(hoje);
  J.recordeInicial = save.diario.data === hoje ? save.diario.pontos : 0;
  prepararPartida(comInventario(criarPartida(save.regras, J.fase, J.fase.semente), J.fase), entrada);
  save.modo = 'diario';
  save.partida = null;
  salvar();
  poki.measure('mode', 'diario', 'start');
}

// ------------------------------------------------------------- acoes
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
  const recusada = r.eventos[0].tipo === 'recusar';
  cena.linha.acelerar(J.agora);
  if (recusada) {
    J.e = r.estado;
    cena.tocar(r.eventos, J.agora, { antes, depois: r.estado, origem, carta });
    audio.recusa();
    J.ultimaAcao = J.agora;
    return false;
  }
  J.hist = [antes];
  J.e = r.estado;
  cena.tocar(r.eventos, J.agora, { antes, depois: r.estado, meio: r.meio, origem, carta });
  J.ultimaAcao = J.agora;
  J.mao = null; J.maoCalc = 0;
  for (const ev of r.eventos) {
    if (ev.tipo === 'febre') { hud.febre(ev.ligada); if (ev.ligada) { audio.febre(); J.febreAte = ev.ate; } }
    if (ev.tipo === 'descartar') audio.descartar();
    if (ev.tipo === 'troca') audio.tique();
    if (ev.tipo === 'martelo') audio.explodir();
  }
  if (J.modo !== 'aventura' && J.e.pontos > J.recordeInicial && !J.novoRecorde && J.recordeInicial > 0) {
    J.novoRecorde = true;
    cena.part.texto(cena.W / 2, cena.L.mesa.y - 10, T.novoRecorde, '#ffd84a', 28);
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
  if (J.modo !== 'aventura' && J.e.pontos > J.recordeInicial && J.e.pontos > (J.modo === 'classico' ? save.recorde : 0)) {
    if (J.modo === 'classico') save.recorde = J.e.pontos;
  }
  atualizarHud();
  guardarPartida();
  salvar();
  if (J.e.fim === 'venceu') { if (J.modo === 'aventura') vencer(); else terminar('fimDiario'); }
  else if (J.e.fim === 'mesaCheia') terminar('mesaCheia');
  else if (J.e.fim === 'baralhoAcabou') terminar(J.modo === 'aventura' ? 'baralhoAcabou' : 'fimDiario');
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
  cena.sincronizar(J.e);
  aplicarVisual(cena.monstro.reino);
  audio.tique();
  J.ultimaAcao = J.agora;
  atualizarHud();
}

function recomecar() {
  J.trans = null;
  if (J.modo === 'classico') iniciarClassico(true);
  else if (J.modo === 'diario') iniciarDiario(true);
  else { J.tentativas++; carregarFase(J.n, true); }
}

/** Jogo ativo (ms) antes do primeiro intervalo fora da passagem de fase. */
const CARENCIA_MS = 180000;
/** Intervalo comercial na passagem de fase: so depois da carencia (fase 5 ou 3 min de jogo). */
const podeIntervalo = () => !dep.semAnuncio && ((J.modo === 'aventura' && J.n >= FASES_SEM_INTERVALO) || J.tJogo >= CARENCIA_MS);
/** "Jogar de novo" depois de perder: comercial so com 3 min de jogo (perder e anuncio no comeco espantam). */
const podeIntervaloDeNovo = () => !dep.semAnuncio && J.tJogo >= CARENCIA_MS;

function vencer() {
  J.estado = 'vitoria';
  poki.gameplayStop();
  poki.measure('level', String(J.n), 'complete');
  const ev = { estrelas: 1 };
  const est = Math.max(1, Math.min(3, (J.e.estrelasRef[2] > 0 && J.e.pontos >= J.e.estrelasRef[2]) ? 3 : (J.e.estrelasRef[1] > 0 && J.e.pontos >= J.e.estrelasRef[1]) ? 2 : 1));
  ev.estrelas = est;
  save.estrelas[J.n] = Math.max(save.estrelas[J.n] || 0, est);
  save.max = Math.max(save.max, Math.min(FASES.length, J.n + 1));
  save.partida = null;
  const fimMundo = posNoMundo(J.n) === POR_MUNDO;
  if (fimMundo && !save.baus[mundoDe(J.n)]) {
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
  // o "VITORIA!" espera o golpe final chegar no monstro (fim da cascata + voo do golpe + o monstro caindo)
  const espera = Math.min(1600, Math.max(0, cena.linha.fim - J.agora) + ESPERA_DERROTA);
  J.trans = {
    tipo: fimMundo ? 'mundo' : 'fase', t0: J.agora + espera, trocou: false, anuncio: false, parada: -1, festa: false,
    fx: L.mesa.x + L.mesa.w / 2, fy: L.mesa.y + L.mesa.h / 2, estrelas: est, semente: J.n * 31 + 7, corMundo: cena.pal.acento, fimMundo,
    // trilha do mundo com o proximo monstro (a passagem de mundo tem o "MUNDO N" no lugar)
    trilha: fimMundo || J.n >= FASES.length ? null : { pos: posNoMundo(J.n), total: POR_MUNDO, nome: nomeDe(T, monstroDaFase(faseDe(J.n + 1))), rotulo: T.proximo },
  };
}

/** ms entre o fim da cascata e o "VITORIA!": o golpe voa (320) e o monstro cai. */
const ESPERA_DERROTA = 700;

/** Troca para a proxima fase no meio da transicao (com intervalo, se for a hora). */
function trocar() {
  J.trans.trocou = true;
  if (J.n >= FASES.length) { carregarFase(1, true); return; }
  carregarFase(J.n + 1, true);
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

function terminar(motivo, medida = false) {
  poki.gameplayStop();
  if (motivo === 'baralhoAcabou' && J.modo === 'aventura') {
    // derrota sem cartao: a mesa treme e a fase recomeca
    J.estado = 'refazendo';
    J.tRefazer = J.agora;
    audio.fim();
    cena.part.texto(cena.W / 2, cena.L.mesa.y + cena.L.mesa.h / 2, T.tenteDeNovo, '#ffffff', 30);
    poki.measure('level', String(J.n), 'fail');
    return;
  }
  if (motivo === 'mesaCheia' && !medida) {
    poki.measure('mesa', rotuloMedida(), 'cheia');
    if (J.modo === 'aventura' && mundoDe(J.n) === 1 && !J.continuouGratis) {
      // mundo 1: a segunda chance (o "Continuar" gratis) vem sozinha, sem cartao
      J.continuouGratis = true;
      J.estado = 'chance';
      J.tChance = J.agora;
      return;
    }
  }
  J.estado = 'fim';
  if (motivo === 'fimDiario') audio.yes(false); else audio.fim();
  if (J.modo === 'classico') save.recorde = Math.max(save.recorde, J.e.pontos);
  if (J.modo === 'diario') {
    const hoje = dataLocal();
    if (save.diario.data !== hoje || J.e.pontos > save.diario.pontos) save.diario = { data: hoje, pontos: J.e.pontos };
    poki.measure('mode', 'diario', 'complete');
  }
  save.partida = null;
  salvar();
  const comVideo = motivo === 'mesaCheia' && J.continuouGratis && (poki.sdkPronto || dep.local);
  if (comVideo) poki.measure('rewarded', 'continuar', 'visible');
  menus.mostrarFim({
    titulo: motivo === 'fimDiario' ? T.diarioFim : T.semJogadas,
    derrotados: J.e.monstro && J.e.monstro.cadeia ? J.e.monstro.derrotados : undefined,
    pontos: J.e.pontos, recorde: J.modo !== 'aventura' ? J.recordeInicial : 0, novo: J.modo !== 'aventura' && J.e.pontos > J.recordeInicial,
    gratis: motivo === 'mesaCheia' && !J.continuouGratis, video: comVideo,
  });
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
  const efeitos = cena.atualizar(dt / 1000, J.agora, J.e);
  const v = cena.vida;
  hud.vida(v.hp, v.hpVis);
  for (const e of efeitos) {
    switch (e.tipo) {
      case 'pouso': audio.pouso(); break;
      case 'fusao': audio.fusao(Math.max(1, (J.e ? J.e.combo : 1) - 1) + e.degrau); if (e.degrau === 1) vibrar(12); break;
      case 'completar': audio.completar(); vibrar([18, 60, 28]); break;
      case 'explodir': audio.explodir(); break;
      case 'pedra': audio.pedra(); break;
      case 'racha': audio.pedra(); break;
      case 'gelo': audio.gelo(); break;
      case 'cadeado': audio.cadeado(); break;
      case 'golpe': if (e.critico) { audio.critico(); vibrar([20, 40, 30]); } else audio.golpe(); break;
      case 'derrotado': audio.derrota(); break;
      case 'feitico': audio.feitico(); break;
      case 'impacto': audio.impacto(e.feitico); vibrar(20); avisarFeitico(e.feitico); break;
      case 'erro': audio.erro(); break;
      case 'furia': audio.furia(); vibrar([30, 50, 30]); break;
      case 'novoMonstro': audio.entrada(); aplicarVisual(e.def.reino); if (J.e) atualizarHud(); break;
      default: break;
    }
  }
  if (J.estado === 'anuncio' || J.estado === 'menu') return;
  if (J.estado === 'jogando' && J.tocou) {
    J.tJogo += dt;
    const min = Math.floor(J.tJogo / 60000);
    while (J.marco < MARCOS_MIN.length && min >= MARCOS_MIN[J.marco]) { poki.measure('tempo', String(MARCOS_MIN[J.marco]), 'min'); J.marco++; }
  }
  if (J.estado === 'refazendo') {
    if (J.agora - J.tRefazer > 900) { J.tentativas++; carregarFase(J.n, true); }
    return;
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
  // mao de ajuda: ocio ou recusas seguidas, nos primeiros mundos
  if (J.estado === 'jogando' && J.e && !J.arrasto) {
    const parado = J.agora - J.ultimaAcao;
    const porRecusa = J.e.recusas >= RECUSAS_AJUDA;
    const guiaInicial = J.modo === 'aventura' && J.n === 1 && save.max <= 1 && !J.tocou;
    const precisa = (J.modo === 'aventura' && J.n <= AJUDA_ATE && parado > (guiaInicial ? OCIO_GUIA : OCIO_AJUDA)) || porRecusa;
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
  const info = { texto: T.yes, textoMundo: `${T.mundo} ${mundoDe(J.n + (J.trans && J.trans.trocou ? 0 : 1))}` };
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
  // o feitico do monstro ainda no ar: o toque so adianta (pegar a carta da fila continua valendo)
  if (cena.linha.feiticoPendente(J.agora)) {
    cena.linha.acelerar(J.agora);
    if (!(L.filaEm(x, y) === 0 && !J.itemPendente)) return;
  }
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
  if (cena.linha.feiticoPendente(J.agora)) { cena.linha.acelerar(J.agora); return; }
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
    totalFases: () => FASES.length,
    maxFase: () => save.max,
    faseAtual: () => J.n,
    modo: () => J.modo,
    estrelas: (n) => save.estrelas[n] || 0,
    irPara: (n) => { menus.fechar(); J.trans = null; carregarFase(n, true); },
    recomecar,
    modoAventura: () => { J.trans = null; carregarFase(save.fase || 1, true); },
    modoClassico: () => { J.trans = null; iniciarClassico(true); },
    aoFechar: () => { if (J.estado === 'menu') J.estado = 'jogando'; },
    continuarGratis: () => {
      if (J.estado !== 'fim' || J.continuouGratis) return;
      J.continuouGratis = true;
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
      const ir = () => { J.trans = null; recomecar(); };
      if (podeIntervaloDeNovo() && J.estado !== 'anuncio') { J.estado = 'anuncio'; poki.commercialBreak().then(ir, ir); } else ir();
    },
    modoDiario: () => { J.trans = null; iniciarDiario(true); },
    diarioHoje: () => (save.diario.data === dataLocal() ? save.diario.pontos : -1),
    missoes: () => save.missoes.missoes.map((m) => ({ ...m, texto: textoMissao(T, m), icone: ICONES[m.premio] })),
  },
});

/** Arena e cores do painel do reino (1..5): o mundo na Aventura; o do monstro da vez na cadeia. */
function aplicarVisual(reino = 1) {
  cena.definirReino(reino);
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
aplicarVisual();
layout();
J.agora = performance.now();
/** Mesa de demonstracao (prints e laboratorio): todos os valores, pedra, gelo e especiais na fila. */
const VITRINE = {
  id: 0, mundo: 1, modo: 'vitrine', semente: 7,
  baralho: { pesos: { 2: 1, 4: 1, 8: 1 }, total: 40, dinamico: false },
  inicio: [[1024, 512, 256, 128, 64], [32, 16, 8], [4, 2], []],
  obst: { pedras: { 3: 3 }, gelo: { 2: [2] } },
  metas: [{ tipo: 'montes', n: 1 }], estrelas: [0, 5000, 9000], itens: { coringa: 1, martelo: 1, troca: 1 },
};
if (dep.vitrine) {
  J.modo = 'aventura'; J.n = 1; J.fase = VITRINE;
  const e = criarPartida(save.regras, VITRINE, 7);
  e.fila = [{ id: 901, tipo: 'coringa', v: 0, cor: 0 }, { id: 902, tipo: 'bomba', v: 0, cor: 0 }, { id: 903, tipo: 'dobro', v: 0, cor: 0 }].slice(0, e.regras.tamFila);
  e.pontos = 2048; e.descarte = { id: 904, tipo: 'normal', v: 4, cor: 0 };
  prepararPartida(e, false);
} else if (dep.modo === 'classico' || (!dep.nivel && !dep.modo && save.modo === 'classico')) iniciarClassico(!dep.fixo, !dep.modo);
else if (dep.modo === 'diario' || (!dep.nivel && !dep.modo && save.modo === 'diario')) iniciarDiario(!dep.fixo);
else carregarFase(dep.nivel || save.fase || 1, !dep.fixo, !dep.nivel);
document.querySelectorAll('[aria-label]').forEach((el) => {
  const mapa = { bDesfazer: T.desfazer, bMenu: T.menu, bPausa: T.pausa, bFechar: T.fechar, iCoringa: T.coringa, iMartelo: T.martelo, iTroca: T.troca, bSom: T.som };
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
    descarte: e.descarte ? e.descarte.v : null, carga: e.descarteCarga, fim: e.fim, fase: J.n, modo: J.modo, poki: { jogando: poki.jogando, jaJogou: poki.jaJogou },
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
