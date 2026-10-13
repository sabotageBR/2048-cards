// Simulador de dificuldade (medir.mjs): o bot guloso joga cada mundo 25 vezes
// e o casual 160, sempre numa mesa so (o nivel sobe na mesma mesa; na mesa
// cheia vem o "Continuar" gratis do nivel e, sem ele, o recomeco pelo kit).
// Por nivel: em quantas partidas o guloso e o casual passaram o nivel sem
// recomecar, o alvo da curva, as jogadas do casual (mediana, com os
// recomecos), os descartes do casual (media, com os recomecos; o limite e o
// descarteMax do mundo por nivel), mesas cheias e recomecos por partida. Falha se algum nivel
// ficar abaixo do piso do guloso (82%; 78% no 2048), sair da faixa do casual (PAREDE ou
// FACIL), cair mais que QUEDA_MAX em relacao ao anterior (QUEDA) ou passar do
// ritmo (LENTO).
// Uso: node tools/simular.mjs [mundo...]
import { MUNDOS, POR_MUNDO } from '../src/jogo/fases.js';
import { normalizarRegras } from '../src/jogo/regras.js';
import { medirMundo, problemas } from './medir.mjs';

const so = process.argv.slice(2).map(Number).filter(Boolean);
const p = (x, n) => String(x).padStart(n);
let ok = true;
for (const def of MUNDOS) {
  if (so.length && !so.includes(def.id)) continue;
  const mm = medirMundo(def.id);
  process.stdout.write(`\nmundo ${def.id} (${def.novidade.tipo}): o casual completa ${Math.round(mm.completou * 100)}% em ${mm.jogadasCasual} jogadas (mediana); o guloso, sem recomecar, ${Math.round(mm.gulosoLimpo * 100)}% em ${mm.jogadasGuloso}\n`);
  process.stdout.write(`fase nivel valor  guloso  casual alvo  jogadas  desc/${String(normalizarRegras(def.regras).descarteMax).padEnd(2)} cheias recomecos   nota\n`);
  let ant = null;
  for (const nv of mm.niveis) {
    const nota = problemas(nv, ant);
    if (nota.length) ok = false;
    process.stdout.write(`${p(nv.N, 4)} ${p(nv.n, 5)} ${p(nv.alvoValor, 5)}  ${p(nv.guloso, 5)}%  ${p(nv.casual, 5)}% ${p(nv.alvo, 3)}  ${p(nv.jogadas, 7)}  ${p(nv.descartes.toFixed(1), 6)}  ${p(nv.cheias.toFixed(2), 6)} ${p(nv.recomecos.toFixed(2), 9)}   ${nota.join(' ')}\n`);
    ant = nv;
  }
}
process.stdout.write(`\n${POR_MUNDO} niveis por mundo; ${ok ? 'tudo dentro da curva' : 'HA PROBLEMAS'}\n`);
process.exit(ok ? 0 : 1);
