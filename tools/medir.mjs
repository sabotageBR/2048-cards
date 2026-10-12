// Mede as fases com os dois jogadores do bot.js: o guloso (prova que a fase
// e vencivel: piso de 82%, 78% na ultima do mundo) e o casual (PERFIL_CASUAL,
// a regua da curva de dificuldade: alvoCasual em fases.js). Usado por
// simular.mjs, curadoria.mjs e curva.mjs.
import { POR_MUNDO, posNoMundo, alvoCasual, FAIXA_CASUAL, QUEDA_MAX } from '../src/jogo/fases.js';
import { jogarSozinho, PERFIL_CASUAL } from '../src/jogo/bot.js';

export const GULOSO = 25;
/** Partidas do casual por serie de sementes (sao duas: 2 x CASUAL partidas por fase). */
export const CASUAL = 80;

/** Quantil p de uma lista de numeros. */
export const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

/**
 * Joga a fase com os dois perfis. O guloso usa as tentativas 1..n
 * (`semente + s * 7919`). O casual joga as duas series: a dos testes
 * (`semente + s`) e a das tentativas a partir da 0, a primeira partida de quem
 * joga (main.js usa `semente + tentativas * 7919`). Uma serie so varia uns 10
 * pontos de uma fase para outra conforme o baralho; as duas juntas, bem menos.
 */
export function medirFase(f, nGuloso = GULOSO, nCasual = CASUAL) {
  let v = 0, apos = 0, vc = 0;
  const jog = [], pts = [], at = [], jogC = [], fins = {};
  for (let s = 1; s <= nGuloso; s++) {
    const r = jogarSozinho(f, {}, f.semente + s * 7919);
    if (r.venceu) v++;
    if (r.aposFeitico) apos++;
    jog.push(r.jogadas); pts.push(r.pontos); at.push(r.ataques);
  }
  for (let s = 0; s < nCasual; s++) {
    for (const semente of [f.semente + s * 7919, f.semente + s + 1]) {
      const r = jogarSozinho(f, {}, semente, PERFIL_CASUAL);
      if (r.venceu) vc++;
      else fins[r.fim || 'parou'] = (fins[r.fim || 'parou'] || 0) + 1;
      jogC.push(r.jogadas);
    }
  }
  return {
    id: f.id, mundo: f.mundo, vitorias: v / nGuloso, jogadas: q(jog, 0.5), pontos: [q(pts, 0.25), q(pts, 0.5), q(pts, 0.75)],
    ataques: q(at, 0.5), apos, casual: Math.round((vc / (2 * nCasual)) * 100), jogadasCasual: q(jogC, 0.5), fins,
    alvo: alvoCasual(f.id), piso: posNoMundo(f.id) === POR_MUNDO ? 0.78 : 0.82,
  };
}

/**
 * Problemas da fase medida `m` (lista vazia = ok). `ant` e a fase anterior
 * medida (para a queda): sem ela, so a faixa vale.
 */
export function problemas(m, ant) {
  const r = [];
  if (m.vitorias < m.piso) r.push('ABAIXO DO PISO');
  if (m.jogadas < 5) r.push('TRIVIAL');
  if (m.casual < m.alvo - FAIXA_CASUAL) r.push('PAREDE');
  else if (ant && ant.casual - m.casual > QUEDA_MAX) r.push('QUEDA');
  if (m.casual > m.alvo + FAIXA_CASUAL) r.push('FACIL');
  return r;
}
