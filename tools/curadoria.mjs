// Regenera a tabela de docs/curadoria.md: roda o simulador (25 sementes por
// fase) e junta a nota de cada fase, lida dos comentarios "// N: ..." de
// src/jogo/fases.js. O texto fora dos marcadores <!-- tabela --> fica como esta.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './servir.mjs';
import { FASES, POR_MUNDO, posNoMundo } from '../src/jogo/fases.js';
import { jogarSozinho } from '../src/jogo/bot.js';

const N = 25;
const fonte = readFileSync(join(RAIZ, 'src/jogo/fases.js'), 'utf8');
const notas = {};
for (const m of fonte.matchAll(/\/\/ (\d+): ([^\n]+)/g)) notas[Number(m[1])] = m[2].trim().replace(/\.$/, '');
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const linhas = ['| Fase | Mundo | Vitórias | Jogadas (med) | Pontos q25 / med / q75 | 2★ / 3★ | Novidade / ajuste |', '|---|---|---|---|---|---|---|'];
for (const f of FASES) {
  let v = 0;
  const jog = [], pts = [];
  for (let s = 1; s <= N; s++) { const r = jogarSozinho(f, {}, f.semente + s * 7919); if (r.venceu) v++; jog.push(r.jogadas); pts.push(r.pontos); }
  const piso = posNoMundo(f.id) === POR_MUNDO ? 0.78 : 0.82;
  const aviso = v / N < piso ? ' ⚠' : '';
  linhas.push(`| ${f.id} | ${f.mundo} | ${Math.round((v / N) * 100)}%${aviso} | ${q(jog, 0.5)} | ${q(pts, 0.25)} / ${q(pts, 0.5)} / ${q(pts, 0.75)} | ${f.estrelas[1]} / ${f.estrelas[2]} | ${notas[f.id] || ''} |`);
}
const arq = join(RAIZ, 'docs/curadoria.md');
const atual = readFileSync(arq, 'utf8');
const ini = '<!-- tabela -->', fim = '<!-- /tabela -->';
const bloco = `${ini}\n${linhas.join('\n')}\n${fim}`;
const novo = atual.includes(ini) ? atual.replace(new RegExp(`${ini}[\\s\\S]*?${fim}`), bloco) : atual + '\n' + bloco + '\n';
writeFileSync(arq, novo);
process.stdout.write(`docs/curadoria.md: ${FASES.length} fases, ${N} sementes\n`);
