// Regenera a tabela de docs/curadoria.md: mede cada mundo com os dois
// jogadores (medir.mjs: guloso e casual, o mundo inteiro numa mesa so) e
// mostra, por nivel, o baralho (valores e especiais) e a nota do mundo, lida
// dos comentarios "// N: ..." acima de cada mundo em src/jogo/fases.js. O
// texto fora dos marcadores <!-- tabela --> fica como esta.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './servir.mjs';
import { MUNDOS, pesosDoNivel, especiaisDoNivel } from '../src/jogo/fases.js';
import { medirMundo, problemas, GULOSO, CASUAL } from './medir.mjs';

const fonte = readFileSync(join(RAIZ, 'src/jogo/fases.js'), 'utf8');
const notas = {};
// a nota pode seguir em mais linhas de comentario
for (const m of fonte.matchAll(/ {2}\/\/ (\d): ([^\n]+(?:\n {2}\/\/ [^\n]+)*)/g)) notas[Number(m[1])] = m[2].replace(/\n {2}\/\/ /g, ' ').trim().replace(/\.$/, '');
const linhas = [
  '| Fase | Mundo | Nível | Baralho | Especiais | Casual (alvo) | Guloso | Jogadas casual | Mesas cheias | Recomeços | Novidade / ajuste |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
];
const pct = (x) => `${Math.round(x * 100)}%`;
for (const def of MUNDOS) {
  const mm = medirMundo(def.id);
  let ant = null;
  for (const nv of mm.niveis) {
    const aviso = problemas(nv, ant).length ? ' ⚠' : '';
    const vs = Object.keys(pesosDoNivel(def, nv.n)).map(Number);
    const esp = Object.entries(especiaisDoNivel(def, nv.n)).map(([k, p]) => `${k} ${pct(p)}`).join(', ') || '—';
    const nota = nv.n === 1 ? notas[def.id] || '' : '';
    linhas.push(`| ${nv.N} | ${def.id} | ${nv.alvoValor} | ${vs[0]}–${vs[vs.length - 1]} | ${esp} | ${nv.casual}% (${nv.alvo}%)${aviso} | ${nv.guloso}% | ${nv.jogadas} | ${nv.cheias.toFixed(2)} | ${nv.recomecos.toFixed(2)} | ${nota} |`);
    ant = nv;
  }
}
const arq = join(RAIZ, 'docs/curadoria.md');
const atual = readFileSync(arq, 'utf8');
const ini = '<!-- tabela -->', fim = '<!-- /tabela -->';
const bloco = `${ini}\n${linhas.join('\n')}\n${fim}`;
const novo = atual.includes(ini) ? atual.replace(new RegExp(`${ini}[\\s\\S]*?${fim}`), bloco) : atual + '\n' + bloco + '\n';
writeFileSync(arq, novo);
process.stdout.write(`docs/curadoria.md: ${MUNDOS.length} mundos, guloso ${GULOSO} partidas, casual ${2 * CASUAL} partidas por mundo\n`);
