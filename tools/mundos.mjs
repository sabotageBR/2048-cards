// Folhas dos 5 mundos (render/temas/, Elementos) para revisar o visual: tira
// os prints do jogo pelo Chrome headless em docs/mundos/prints/ (retrato,
// paisagem, as regras na tela e a festa da subida de nivel) e fotografa
// tools/mundos.html em docs/mundos/<folha>.png (a folha `festa` vai para
// docs/escada/subida-de-nivel.png, a `desktop` para docs/escada/visual-desktop.png
// e a `missao` para docs/escada/missao-na-mesa.png).
// Uso: node tools/mundos.mjs [retrato|paisagem|cartas|regras|explosoes|festa|desktop|missao ...]   (padrao: todas)
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { servir, RAIZ } from './servir.mjs';
import { chrome, shot } from './shot.mjs';

const PORTA = 5356;
const PRINTS = join(RAIZ, 'docs/mundos/prints');
const FOLHAS = { retrato: '2120x1130', paisagem: '2040x980', cartas: '1570x1700', regras: '1690x1090', explosoes: '1300x1960', festa: '1690x1130', desktop: '1990x1620', missao: '2120x1830' };
/** Folhas que saem fora de docs/mundos/. */
const SAIDA = { festa: 'docs/escada/subida-de-nivel.png', desktop: 'docs/escada/visual-desktop.png', missao: 'docs/escada/missao-na-mesa.png' };
const BASE = 'fixo&semanuncio&semanim&lang=pt';
const MESA = 'vitrine&' + BASE;
/** Fase global do comeco de cada mundo (o ?vitrine segue o mundo dela). */
const INICIO = [1, 9, 17, 25, 33];
/** Gestos das regras: tres descartes enchem a pilha (3/3); o video esvazia. */
const ENCHER = 'nivel=2&semanuncio&semanim&lang=pt&gesto=key:d@600;key:d@1000;key:d@1400';
/** Braços do desktop no teste A/B (?variante=): o gesto guiado do nivel 1 congelado em 3 fases (?guia=: clica, arrasta, solta). */
const DESKTOP = [['a', ''], ['c', 'desk-c'], ['d', 'desk-d']];
const FASES_GUIA = [0.06, 0.42, 0.74];
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
  if (folha === 'desktop') {
    const guia = DESKTOP.flatMap(([id, v]) => FASES_GUIA.map((u, i) => [`nivel=1&${BASE}&guia=${u}${v ? `&variante=${v}` : ''}`, '1031x580', `desktop-${id}-${i + 1}.png`, 2500]))
      .filter(([, , arq]) => !/desktop-d-[12]/.test(arq)); // na D a folha so usa a soltura
    // as teclas fixas sem o gesto: a mesa de demonstracao da Floresta e a do Cosmos (3 colunas)
    return guia.concat([1, 33].map((N, i) => [`${MESA}&nivel=${N}&variante=desk-d`, '1031x580', `desktop-d-mesa${i + 1}.png`, 2500]));
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
