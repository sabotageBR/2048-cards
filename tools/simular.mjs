// Simulador de dificuldade (medir.mjs): o bot guloso joga cada mundo 25 vezes
// e o casual 160, sempre numa mesa so (o nivel sobe na mesma mesa; na mesa
// cheia vem o "Continuar" gratis do nivel e, sem ele, o recomeco pelo kit).
// Por nivel: em quantas partidas o guloso e o casual passaram o nivel sem
// recomecar, o alvo da curva, as jogadas do casual (mediana, com os
// recomecos), os descartes do casual (media, com os recomecos; o limite e o
// descarteMax do mundo por nivel), os juntar do casual (media, no perfil 'juntar'),
// mesas cheias e recomecos por partida. Falha se algum nivel
// ficar abaixo do piso do guloso (82%; 78% no 2048), sair da faixa do casual (PAREDE ou
// FACIL; no perfil 'juntar', so PAREDE), cair mais que QUEDA_MAX em relacao ao
// anterior (QUEDA) ou passar do ritmo (LENTO).
// Uso: node tools/simular.mjs [mundo...] [--regra=hoje|juntar]  (sem --regra, as duas;
// o mundo 6 e o primeiro do mundo sem fim)
import { MUNDOS, POR_MUNDO, PERFIS, mundoDef } from '../src/jogo/fases.js';
import { normalizarRegras } from '../src/jogo/regras.js';
import { medirMundo, problemas } from './medir.mjs';

const args = process.argv.slice(2);
const so = args.map(Number).filter(Boolean);
const regra = (args.find((a) => a.startsWith('--regra=')) || '').slice(8);
const perfis = regra ? [regra] : PERFIS;
const mundos = so.length ? so : MUNDOS.map((d) => d.id);
const p = (x, n) => String(x).padStart(n);
let ok = true;
for (const perfil of perfis) for (const m of mundos) {
  const def = mundoDef(m);
  const mm = medirMundo(m, undefined, undefined, perfil);
  const novas = def.novidades.map((x) => x.tipo).join(', ') || 'sem fim';
  process.stdout.write(`\n${perfil} · mundo ${m} (${novas}): o casual completa ${Math.round(mm.completou * 100)}% em ${mm.jogadasCasual} jogadas (mediana), com ${mm.cheias.toFixed(2)} mesas cheias; o guloso, sem recomecar, ${Math.round(mm.gulosoLimpo * 100)}% em ${mm.jogadasGuloso}\n`);
  process.stdout.write(`fase nivel valor  guloso  casual alvo  jogadas  desc/${String(normalizarRegras(def.regras).descarteMax).padEnd(2)} junt/N cheias recomecos   nota\n`);
  let ant = null;
  for (const nv of mm.niveis) {
    const nota = problemas(nv, ant);
    if (nota.length) ok = false;
    process.stdout.write(`${p(nv.N, 4)} ${p(nv.n, 5)} ${p(nv.alvoValor, 5)}  ${p(nv.guloso, 5)}%  ${p(nv.casual, 5)}% ${p(nv.alvo, 3)}  ${p(nv.jogadas, 7)}  ${p(nv.descartes.toFixed(1), 6)} ${p(nv.juntou.toFixed(1), 6)}  ${p(nv.cheias.toFixed(2), 6)} ${p(nv.recomecos.toFixed(2), 9)}   ${nota.join(' ')}\n`);
    ant = nv;
  }
}
process.stdout.write(`\n${POR_MUNDO} niveis por mundo; ${ok ? 'tudo dentro da curva' : 'HA PROBLEMAS'}\n`);
process.exit(ok ? 0 : 1);
