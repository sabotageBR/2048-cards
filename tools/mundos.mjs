// Folhas dos 5 mundos (render/temas/, Elementos) para revisar o visual: tira
// os prints do jogo pelo Chrome headless em docs/mundos/prints/ (retrato,
// paisagem e as regras na tela) e fotografa tools/mundos.html em
// docs/mundos/<folha>.png.
// Uso: node tools/mundos.mjs [retrato|paisagem|cartas|regras ...]   (padrao: todas)
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { servir, RAIZ } from './servir.mjs';
import { chrome, shot } from './shot.mjs';

const PORTA = 5356;
const PRINTS = join(RAIZ, 'docs/mundos/prints');
const FOLHAS = { retrato: '2120x1130', paisagem: '2040x980', cartas: '1570x1700', regras: '1690x1090' };
const BASE = 'fixo&semanuncio&semanim&lang=pt';
const MESA = 'vitrine&' + BASE;
/** Fase global do comeco de cada mundo (o ?vitrine segue o mundo dela). */
const INICIO = [1, 9, 17, 25, 33];
/** Gestos das regras: tres descartes enchem a pilha (3/3); o video esvazia. */
const ENCHER = 'nivel=2&semanuncio&semanim&lang=pt&gesto=key:d@600;key:d@1000;key:d@1400';

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
  const saida = join(RAIZ, 'docs/mundos', `${folha}.png`);
  await chrome([
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${perfil}`,
    `--window-size=${w},${h}`, '--virtual-time-budget=5000', `--screenshot=${saida}`,
    `http://127.0.0.1:${PORTA}/tools/mundos.html?folha=${folha}`,
  ], 120000);
  rmSync(perfil, { recursive: true, force: true });
  process.stdout.write(`docs/mundos/${folha}.png\n`);
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
