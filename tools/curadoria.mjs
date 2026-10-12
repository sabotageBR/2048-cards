// Regenera a tabela de docs/curadoria.md: mede cada fase com os dois
// jogadores (medir.mjs: guloso e casual) e junta a nota de cada fase, lida dos
// comentarios "// N: ..." de src/jogo/fases.js. O texto fora dos marcadores
// <!-- tabela --> fica como esta.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './servir.mjs';
import { FASES } from '../src/jogo/fases.js';
import { medirFase, problemas, GULOSO, CASUAL } from './medir.mjs';

const fonte = readFileSync(join(RAIZ, 'src/jogo/fases.js'), 'utf8');
const notas = {};
for (const m of fonte.matchAll(/\/\/ (\d+): ([^\n]+)/g)) notas[Number(m[1])] = m[2].trim().replace(/\.$/, '');
const linhas = [
  '| Fase | Mundo | Casual (alvo) | Jogadas casual | Guloso | Jogadas (med) | Pontos q25 / med / q75 | 2★ / 3★ | Ataque | Feitiços (med) | Derrotas após feitiço | Novidade / ajuste |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
];
const ataque = (m) => (m ? `${[...new Set(m.feiticos)].join(', ')} / ${m.cada}${m.furia ? ` (fúria ${m.furia.cada})` : ''}` : '—');
let ant = null;
for (const f of FASES) {
  const m = medirFase(f);
  const aviso = problemas(m, ant).length ? ' ⚠' : '';
  linhas.push(`| ${f.id} | ${f.mundo} | ${m.casual}% (${m.alvo}%)${aviso} | ${m.jogadasCasual} | ${Math.round(m.vitorias * 100)}% | ${m.jogadas} | ${m.pontos.join(' / ')} | ${f.estrelas[1]} / ${f.estrelas[2]} | ${ataque(f.monstro)} | ${f.monstro ? m.ataques : '—'} | ${f.monstro ? m.apos : '—'} | ${notas[f.id] || ''} |`);
  ant = m;
}
const arq = join(RAIZ, 'docs/curadoria.md');
const atual = readFileSync(arq, 'utf8');
const ini = '<!-- tabela -->', fim = '<!-- /tabela -->';
const bloco = `${ini}\n${linhas.join('\n')}\n${fim}`;
const novo = atual.includes(ini) ? atual.replace(new RegExp(`${ini}[\\s\\S]*?${fim}`), bloco) : atual + '\n' + bloco + '\n';
writeFileSync(arq, novo);
process.stdout.write(`docs/curadoria.md: ${FASES.length} fases, guloso ${GULOSO} sementes, casual ${2 * CASUAL} partidas\n`);
