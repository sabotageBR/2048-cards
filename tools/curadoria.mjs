// Regenera as tabelas de docs/curadoria.md, uma por perfil de regra (o teste
// A/B da 0.6.0): mede cada mundo com os jogadores do medir.mjs (guloso e
// casual, o mundo inteiro numa mesa so) e mostra, por nivel, o baralho
// (valores e especiais), os juntar do casual (no perfil 'juntar') e a nota do
// mundo, lida dos comentarios "// N: ..." acima de cada mundo em
// src/jogo/fases.js. O texto fora dos marcadores <!-- tabela --> e
// <!-- tabela-juntar --> fica como esta.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './servir.mjs';
import { MUNDOS, pesosDoNivel, especiaisDoNivel, mundoDoPerfil } from '../src/jogo/fases.js';
import { medirMundo, problemas, GULOSO, CASUAL } from './medir.mjs';

const fonte = readFileSync(join(RAIZ, 'src/jogo/fases.js'), 'utf8');
const notas = {};
// a nota pode seguir em mais linhas de comentario
for (const m of fonte.matchAll(/ {2}\/\/ (\d): ([^\n]+(?:\n {2}\/\/ [^\n]+)*)/g)) notas[Number(m[1])] = m[2].replace(/\n {2}\/\/ /g, ' ').trim().replace(/\.$/, '');
const pct = (x) => `${Math.round(x * 100)}%`;

/** A tabela de um perfil: uma linha por nivel e as mesas cheias de cada mundo. */
function tabela(perfil) {
  const juntar = perfil === 'juntar';
  const linhas = [
    `| Fase | Mundo | Nível | Baralho | Especiais | Casual (alvo) | Guloso | Jogadas casual |${juntar ? ' Juntar casual |' : ''} Mesas cheias | Recomeços | Novidade / ajuste |`,
    `|---|---|---|---|---|---|---|---|${juntar ? '---|' : ''}---|---|---|`,
  ];
  const rodape = [];
  for (const base of MUNDOS) {
    const def = mundoDoPerfil(base, perfil);
    const mm = medirMundo(def.id, undefined, undefined, perfil);
    let ant = null;
    for (const nv of mm.niveis) {
      const aviso = problemas(nv, ant).length ? ' ⚠' : '';
      const vs = Object.keys(pesosDoNivel(def, nv.n)).map(Number);
      const esp = Object.entries(especiaisDoNivel(def, nv.n)).map(([k, p]) => `${k} ${pct(p)}`).join(', ') || '—';
      const nota = nv.n === 1 ? notas[def.id] || '' : '';
      const extra = juntar ? ` ${nv.juntou.toFixed(1)} |` : '';
      linhas.push(`| ${nv.N} | ${def.id} | ${nv.alvoValor} | ${vs[0]}–${vs[vs.length - 1]} | ${esp} | ${nv.casual}% (${nv.alvo}%)${aviso} | ${nv.guloso}% | ${nv.jogadas} |${extra} ${nv.cheias.toFixed(2)} | ${nv.recomecos.toFixed(2)} | ${nota} |`);
      ant = nv;
    }
    rodape.push(`- Mundo ${def.id}: o casual completa ${Math.round(mm.completou * 100)}% em ${mm.jogadasCasual} jogadas (mediana) e vê ${mm.cheias.toFixed(2)} mesas cheias.`);
  }
  return [...linhas, '', ...rodape].join('\n');
}

const arq = join(RAIZ, 'docs/curadoria.md');
let doc = readFileSync(arq, 'utf8');
for (const [perfil, marca] of [['hoje', 'tabela'], ['juntar', 'tabela-juntar']]) {
  const ini = `<!-- ${marca} -->`, fim = `<!-- /${marca} -->`;
  const bloco = `${ini}\n${tabela(perfil)}\n${fim}`;
  doc = doc.includes(ini) ? doc.replace(new RegExp(`${ini}[\\s\\S]*?${fim}`), bloco) : doc + '\n' + bloco + '\n';
}
writeFileSync(arq, doc);
process.stdout.write(`docs/curadoria.md: ${MUNDOS.length} mundos nos dois perfis, guloso ${GULOSO} partidas, casual ${2 * CASUAL} partidas por mundo\n`);
