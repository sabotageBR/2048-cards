// Mede os mundos com os jogadores do bot.js, cada um jogando o mundo
// inteiro numa mesa so (jogarMundo): o guloso (prova que cada nivel e
// passavel sem recomecar: piso de 82%, 78% no 2048) e o casual (PERFIL_CASUAL, a regua da
// curva de dificuldade, alvoCasual em fases.js, e do ritmo: jogadas por
// nivel). Na mesa justa, mais duas reguas: o acaso (PERFIL_ACASO) nao passa
// o nivel 5 e o distraido (PERFIL_DISTRAIDO) nao fecha o mundo, sem recomecar
// (ACASO_MAX e DISTRAIDO_MAX). Usado por simular.mjs, curadoria.mjs e curva.mjs.
import { POR_MUNDO, mundoDef, faseGlobal, alvoDoNivel, alvoCasual, FAIXA_CASUAL, QUEDA_MAX, ritmoMax, ACASO_MAX, DISTRAIDO_MAX } from '../src/jogo/fases.js';
import { jogarMundo, PERFIL_CASUAL, PERFIL_ACASO, PERFIL_DISTRAIDO } from '../src/jogo/bot.js';

export const GULOSO = 25;
/** Partidas do casual por serie de sementes (sao duas: 2 x CASUAL partidas por mundo). */
export const CASUAL = 80;
/** Piso do guloso (% de partidas que passam o nivel sem recomecar): 78 no 2048, o ultimo do mundo. */
export const pisoGuloso = (n) => (n === POR_MUNDO ? 78 : 82);
/** Partidas do acaso e do distraido por mundo (sem recomecar). */
export const SOLTOS = 100;

/** Quantil p de uma lista de numeros. */
export const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };

/**
 * Joga o mundo m na mesa `perfil` ('mesa-hoje' ou 'mesa-justa'). O guloso usa
 * `semente + s * 7919` (s = 1..n); o casual joga duas series, `semente + s * 7919`
 * e `semente + s + 1`; o acaso e o distraido, `semente + s * 104729`, sem recomecar.
 * Por nivel: em quantas partidas que chegaram ao nivel o casual o passou sem
 * recomecar (`casual`, %), jogadas (mediana, contando os recomecos), mesas
 * cheias e recomecos por partida. Por mundo: `acaso` (% que passam o nivel 5)
 * e `distraido` (% que fecham o mundo).
 */
export function medirMundo(m, nGuloso = GULOSO, nCasual = CASUAL, perfil = 'mesa-hoje', nSoltos = SOLTOS) {
  const def = mundoDef(m);
  let limpo = 0;
  const jogG = [], runsG = [];
  for (let s = 1; s <= nGuloso; s++) {
    const r = jogarMundo(m, def.semente + s * 7919, { perfil });
    if (r.completou && r.niveis.every((nv) => nv.recomecos === 0)) limpo++;
    jogG.push(r.jogadas);
    runsG.push(r);
  }
  /** Em quantas partidas (%) que chegaram ao nivel n ele foi passado sem recomecar. */
  const semRecomeco = (rs, n) => {
    const ch = rs.filter((r) => r.niveis[n - 1].chegou);
    return ch.length ? Math.round((ch.filter((r) => r.niveis[n - 1].passou && r.niveis[n - 1].recomecos === 0).length / ch.length) * 100) : 0;
  };
  const runs = [];
  for (let s = 0; s < nCasual; s++) {
    for (const semente of [def.semente + s * 7919, def.semente + s + 1]) runs.push(jogarMundo(m, semente, { ...PERFIL_CASUAL, perfil }));
  }
  let acaso = 0, distraido = 0;
  for (let s = 1; s <= nSoltos; s++) {
    const a = jogarMundo(m, def.semente + s * 104729, { ...PERFIL_ACASO, perfil, maxRecomecos: 0 });
    if (a.niveis[4].passou) acaso++;
    if (jogarMundo(m, def.semente + s * 104729, { ...PERFIL_DISTRAIDO, perfil, maxRecomecos: 0 }).completou) distraido++;
  }
  const niveis = [];
  for (let n = 1; n <= POR_MUNDO; n++) {
    const chegaram = runs.filter((r) => r.niveis[n - 1].chegou);
    const N = faseGlobal(m, n);
    niveis.push({
      N, n, alvoValor: alvoDoNivel(n),
      guloso: semRecomeco(runsG, n), casual: semRecomeco(runs, n),
      jogadas: q(chegaram.map((r) => r.niveis[n - 1].jogadas), 0.5),
      descartes: chegaram.reduce((a, r) => a + r.niveis[n - 1].descartes, 0) / Math.max(1, chegaram.length),
      cheias: chegaram.reduce((a, r) => a + r.niveis[n - 1].cheias, 0) / Math.max(1, chegaram.length),
      recomecos: chegaram.reduce((a, r) => a + r.niveis[n - 1].recomecos, 0) / Math.max(1, chegaram.length),
      alvo: alvoCasual(N, perfil), ritmo: ritmoMax(N), piso: pisoGuloso(n),
    });
  }
  return {
    mundo: m, perfil, gulosoLimpo: limpo / nGuloso, jogadasGuloso: q(jogG, 0.5),
    acaso: Math.round((acaso / nSoltos) * 100), distraido: Math.round((distraido / nSoltos) * 100),
    cheias: runs.reduce((a, r) => a + r.niveis.reduce((b, nv) => b + nv.cheias, 0), 0) / runs.length,
    completou: runs.filter((r) => r.completou).length / runs.length, jogadasCasual: q(runs.map((r) => r.jogadas), 0.5), niveis,
  };
}

/**
 * Problemas do nivel medido `nv` (lista vazia = ok). `ant` e o nivel anterior
 * medido (para a queda): sem ele, so o piso, a faixa e o ritmo valem.
 */
export function problemas(nv, ant) {
  const r = [];
  if (nv.guloso < nv.piso) r.push('ABAIXO DO PISO');
  if (nv.casual < nv.alvo - FAIXA_CASUAL) r.push('PAREDE');
  else if (ant && ant.casual - nv.casual > QUEDA_MAX) r.push('QUEDA');
  if (nv.casual > nv.alvo + FAIXA_CASUAL) r.push('FACIL');
  if (nv.jogadas > nv.ritmo) r.push('LENTO');
  return r;
}

/**
 * Problemas do mundo medido (lista vazia = ok): na mesa justa, o acaso passa o
 * nivel 5 (ACASO) ou o distraido fecha o mundo (DISTRAIDO) em partidas demais.
 * Na mesa de hoje (o controle do teste A/B) esses numeros so aparecem.
 */
export function problemasMundo(mm) {
  const r = [];
  if (mm.perfil !== 'mesa-justa') return r;
  if (mm.acaso > ACASO_MAX) r.push('ACASO');
  if (mm.distraido > DISTRAIDO_MAX) r.push('DISTRAIDO');
  return r;
}
