// Folhas dos 5 mundos (render/temas/, Elementos) para revisar o visual: tira
// os prints do jogo pelo Chrome headless em docs/mundos/prints/ (retrato,
// paisagem, as regras na tela e a festa da subida de nivel) e fotografa
// tools/mundos.html em docs/mundos/<folha>.png (a folha `festa` vai para
// docs/escada/subida-de-nivel.png, a `juntar` para docs/escada/juntar.png
// e a `missao` para docs/escada/missao-na-mesa.png).
// Uso: node tools/mundos.mjs [retrato|paisagem|cartas|regras|explosoes|festa|juntar|missao ...]   (padrao: todas)
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { servir, RAIZ } from './servir.mjs';
import { chrome, shot } from './shot.mjs';

const PORTA = 5356;
const PRINTS = join(RAIZ, 'docs/mundos/prints');
const FOLHAS = { retrato: '2120x1130', paisagem: '2040x980', cartas: '1570x1700', regras: '1690x1090', explosoes: '1300x1960', festa: '1690x1130', juntar: '2120x2000', missao: '2120x1830' };
/** Folhas que saem fora de docs/mundos/. */
const SAIDA = { festa: 'docs/escada/subida-de-nivel.png', juntar: 'docs/escada/juntar.png', missao: 'docs/escada/missao-na-mesa.png' };
const BASE = 'fixo&semanuncio&semanim&lang=pt';
const MESA = 'vitrine&' + BASE;
/** Fase global do comeco de cada mundo (o ?vitrine segue o mundo dela). */
const INICIO = [1, 9, 17, 25, 33];
/** Gestos das regras: tres descartes enchem a pilha (3/3); o video esvazia. */
const ENCHER = 'nivel=2&semanuncio&semanim&lang=pt&gesto=key:d@600;key:d@1000;key:d@1400';
/**
 * O juntar (braço do teste A/B da 0.6.0) na abertura do nivel 1: a 1a jogada
 * faz um 4 ao lado do 4 da coluna 1; a mao guiada arrasta um ate o outro
 * (?guia= congela o gesto); topo2>topo0~ segura a carta da mesa no ar.
 */
const JUNTAR = `nivel=1&${BASE}&variante=juntar`;
/** A abertura do nivel 1 (o 16 em 3 jogadas, com cascata) e uma 4a jogada durante a festa da subida. */
const ABERTURA = 'nivel=1&fixo&semanuncio&semanim&lang=pt&gesto=fila0>col2@400;fila0>col2@1000;fila0>col0@1600;fila0>col1@3300';

const pedidas = process.argv.slice(2).filter((f) => FOLHAS[f]);
const folhas = pedidas.length ? pedidas : Object.keys(FOLHAS);

/** Prints que cada folha usa: [query, tamanho, arquivo, espera]. */
function printsDe(folha) {
  if (folha === 'retrato') {
    return INICIO.map((N, i) => [`${MESA}&nivel=${N}`, '390x844', `${i + 1}-retrato.png`, 2500]);
  }
  if (folha === 'paisagem') return INICIO.map((N, i) => [`${MESA}&nivel=${N}`, '1280x720', `${i + 1}-paisagem.png`, 2500]);
  if (folha === 'regras') {
    return [
      [MESA, '390x844', 'regra-selo.png', 2500],
      [`${MESA}&gesto=tap:col1@800`, '390x844', 'regra-recusa.png', 950],
      [ENCHER, '390x844', 'regra-cheio.png', 3600],
      [`${ENCHER};click:vDescarte@2000`, '390x844', 'regra-video.png', 14000],
    ];
  }
  if (folha === 'juntar') {
    return [
      [`${JUNTAR}&guia=0.45&gesto=fila0>col2@400`, '390x844', 'juntar-1.png', 3200],
      [`${JUNTAR}&gesto=fila0>col2@400;topo2>topo0~@1400`, '390x844', 'juntar-2.png', 1900],
      [`${JUNTAR}&gesto=topo2>topo0~@600`, '390x844', 'juntar-3.png', 1100],
      [`${JUNTAR}&gesto=fila0>col2@400;topo2>topo0@1400`, '390x844', 'juntar-4.png', 1720],
      [`${JUNTAR}&gesto=fila0>col2@400;topo2>topo0@1400`, '390x844', 'juntar-5.png', 2700],
      [`${JUNTAR}&guia=0.45&gesto=fila0>col2@400`, '1280x720', 'juntar-paisagem.png', 3200],
    ];
  }
  if (folha === 'missao') {
    // a missao fixa (?missao=) no nivel 2 da Floresta; o voo do premio congelado (?voo=)
    const M = `nivel=2&${BASE}&missao=cascata:3:1:coringa`;
    const VOO = `nivel=2&${BASE}&missao=combo:5:2:martelo`;
    return [
      [`${M}&visual=missao`, '390x844', 'missao-a.png', 2000],
      [`${M}&visual=missaob`, '390x844', 'missao-b.png', 2000],
      [`${M}&visual=missao`, '1280x720', 'missao-paisagem.png', 2000],
      ...[0.04, 0.5, 0.96].map((u, i) => [`${VOO}&visual=missaob&voo=${u}`, '390x844', `missao-voo-${i + 1}.png`, 2000]),
    ];
  }
  if (folha === 'festa') {
    return [
      [ABERTURA, '390x844', 'festa-1.png', 1900],
      [ABERTURA, '390x844', 'festa-2.png', 2650],
      [ABERTURA, '390x844', 'festa-3.png', 3100],
      [ABERTURA, '390x844', 'festa-4.png', 3600],
    ];
  }
  return [];
}

/** Roda as tarefas com no maximo n ao mesmo tempo. */
async function emLotes(tarefas, n) {
  const fila = tarefas.slice();
  await Promise.all(Array.from({ length: n }, async () => { while (fila.length) await fila.shift()(); }));
}

async function fotografarFolha(folha) {
  const perfil = mkdtempSync(join(tmpdir(), 'c2-mundos-'));
  const [w, h] = FOLHAS[folha].split('x');
  const saida = join(RAIZ, SAIDA[folha] || `docs/mundos/${folha}.png`);
  await chrome([
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${perfil}`,
    `--window-size=${w},${h}`, '--virtual-time-budget=5000', `--screenshot=${saida}`,
    `http://127.0.0.1:${PORTA}/tools/mundos.html?folha=${folha}`,
  ], 120000);
  rmSync(perfil, { recursive: true, force: true });
  process.stdout.write(`${SAIDA[folha] || `docs/mundos/${folha}.png`}\n`);
}

mkdirSync(PRINTS, { recursive: true });
const fechar = await servir(PORTA);
try {
  const tarefas = folhas.flatMap(printsDe).map(([query, tam, arq, espera]) => () => shot(PORTA, query, tam, join(PRINTS, arq), espera));
  await emLotes(tarefas, 4);
  for (const f of folhas) await fotografarFolha(f);
} finally {
  await fechar();
}
