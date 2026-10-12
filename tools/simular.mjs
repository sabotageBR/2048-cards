// Simulador de dificuldade (medir.mjs): o bot guloso joga cada fase 25 vezes
// e o casual 40. O relatorio mostra vitorias, jogadas, pontos (mediana e
// quartis), feiticos do monstro por partida (mediana), derrotas que vieram
// ate 2 jogadas depois de um feitico e, do casual, vitorias contra o alvo da
// curva e jogadas. Falha se alguma fase ficar abaixo do piso do guloso (82%,
// 78% na ultima do mundo), for trivial, sair da faixa do casual (PAREDE ou
// FACIL) ou cair mais que QUEDA_MAX em relacao a anterior (QUEDA).
// Uso: node tools/simular.mjs [fase...]
import { FASES } from '../src/jogo/fases.js';
import { medirFase, problemas } from './medir.mjs';

const so = process.argv.slice(2).map(Number).filter(Boolean);
const p = (x, n) => String(x).padStart(n);
let ok = true;
process.stdout.write('fase  mundo  vit%  jogadas  pontos(q25/med/q75)    estrelas[2,3]  ataques  apos  casual alvo  jog.c   nota\n');
let ant = null;
for (const f of FASES) {
  const quer = !so.length || so.includes(f.id);
  // a queda compara com a fase anterior, entao ela e medida mesmo fora da lista
  if (!quer && !so.includes(f.id + 1)) { ant = null; continue; }
  const m = medirFase(f);
  if (quer) {
    const nota = problemas(m, ant);
    if (nota.length) ok = false;
    process.stdout.write(`${p(f.id, 4)}  ${p(f.mundo, 5)}  ${p(Math.round(m.vitorias * 100), 4)}  ${p(m.jogadas, 7)}  ${p(m.pontos[0], 7)}/${p(m.pontos[1], 6)}/${p(m.pontos[2], 6)}   ${p(f.estrelas[1], 6)},${p(f.estrelas[2], 6)}  ${p(m.ataques, 7)}  ${p(m.apos, 4)}  ${p(m.casual, 5)}% ${p(m.alvo, 3)}  ${p(m.jogadasCasual, 5)}   ${nota.join(' ')}${nota.length ? ' ' + JSON.stringify(m.fins) : ''}\n`);
  }
  ant = m;
}
process.exit(ok ? 0 : 1);
