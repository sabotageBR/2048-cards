// Simulador de dificuldade: o bot guloso joga cada fase N vezes com sementes
// distintas e o relatorio mostra vitorias, jogadas e pontos (mediana e
// quartis). Falha se alguma fase ficar abaixo do piso (82%, 78% na ultima
// do mundo) ou for trivial. Uso: node tools/simular.mjs [sementes=25] [fase]
import { FASES, POR_MUNDO, posNoMundo } from '../src/jogo/fases.js';
import { jogarSozinho } from '../src/jogo/bot.js';

const N = Number(process.argv[2]) || 25;
const so = Number(process.argv[3]) || 0;
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
let ok = true;
process.stdout.write('fase  mundo  vit%   jogadas(med)  pontos(q25/med/q75)   estrelas[2,3]   nota\n');
for (const f of FASES) {
  if (so && f.id !== so) continue;
  let v = 0;
  const jog = [], pts = [];
  for (let s = 1; s <= N; s++) {
    const r = jogarSozinho(f, {}, f.semente + s * 7919);
    if (r.venceu) v++;
    jog.push(r.jogadas); pts.push(r.pontos);
  }
  const piso = posNoMundo(f.id) === POR_MUNDO ? 0.78 : 0.82;
  const taxa = v / N;
  const trivial = q(jog, 0.5) < 5;
  const nota = taxa < piso ? 'ABAIXO DO PISO' : trivial ? 'TRIVIAL' : '';
  if (nota) ok = false;
  process.stdout.write(`${String(f.id).padStart(4)}  ${String(f.mundo).padStart(5)}  ${String(Math.round(taxa * 100)).padStart(4)}  ${String(q(jog, 0.5)).padStart(12)}  ${String(q(pts, 0.25)).padStart(7)}/${String(q(pts, 0.5)).padStart(6)}/${String(q(pts, 0.75)).padStart(6)}   ${String(f.estrelas[1]).padStart(6)},${String(f.estrelas[2]).padStart(6)}   ${nota}\n`);
}
process.exit(ok ? 0 : 1);
