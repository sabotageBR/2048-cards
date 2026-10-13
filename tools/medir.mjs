// Mede os mundos com os dois jogadores do bot.js, cada um jogando o mundo
// inteiro numa mesa so (jogarMundo): o guloso (prova que cada nivel e
// passavel sem recomecar: piso de 82%, 78% no 2048) e o casual (PERFIL_CASUAL, a regua da
// curva de dificuldade, alvoCasual em fases.js, e do ritmo: jogadas por
// nivel). Usado por simular.mjs, curadoria.mjs e curva.mjs.
import { MUNDOS, POR_MUNDO, faseGlobal, alvoDoNivel, alvoCasual, FAIXA_CASUAL, QUEDA_MAX, ritmoMax } from '../src/jogo/fases.js';
import { jogarMundo, PERFIL_CASUAL } from '../src/jogo/bot.js';

export const GULOSO = 25;
/** Partidas do casual por serie de sementes (sao duas: 2 x CASUAL partidas por mundo). */
export const CASUAL = 80;
/** Piso do guloso (% de partidas que passam o nivel sem recomecar): 78 no 2048, o ultimo do mundo. */
export const pisoGuloso = (n) => (n === POR_MUNDO ? 78 : 82);

/** Quantil p de uma lista de numeros. */
export const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };

/**
 * Joga o mundo m com os dois perfis. O guloso usa `semente + s * 7919`
 * (s = 1..n); o casual joga duas series, `semente + s * 7919` e `semente + s + 1`.
 * Por nivel: em quantas partidas que chegaram ao nivel o casual o passou sem
 * recomecar (`casual`, %), jogadas (mediana, contando os recomecos), mesas
 * cheias e recomecos por partida.
 */
export function medirMundo(m, nGuloso = GULOSO, nCasual = CASUAL) {
  const def = MUNDOS[m - 1];
  let limpo = 0;
  const jogG = [], runsG = [];
  for (let s = 1; s <= nGuloso; s++) {
    const r = jogarMundo(m, def.semente + s * 7919);
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
    for (const semente of [def.semente + s * 7919, def.semente + s + 1]) runs.push(jogarMundo(m, semente, PERFIL_CASUAL));
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
      alvo: alvoCasual(N), ritmo: ritmoMax(N), piso: pisoGuloso(n),
    });
  }
  return {
    mundo: m, gulosoLimpo: limpo / nGuloso, jogadasGuloso: q(jogG, 0.5),
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
