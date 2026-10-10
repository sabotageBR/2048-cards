// Prints das ideias de identidade (modelos/ideias/): por tema, o retrato na
// vitrine, um quadro no meio da cascata (?quadro=) e a paisagem; mais a grade
// de cada rodada. Uso: node tools/prints-ideias.mjs [tema...]
// Saida em modelos/ideias/prints/.
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { servir, RAIZ } from './servir.mjs';
import { chrome } from './shot.mjs';

const TODOS = ['bichos', 'sushi', 'pocoes', 'duelo', 'cidade', 'bolo', 'neve', 'dinos', 'olimpo', 'robos', 'aboboras', 'hq', 'grafite', 'mahjong', 'discos',
  'neon2', 'vidro', 'escuro', 'esmalte', 'cristal', 'argila', 'rival', 'relogio', 'escalada', 'sumie', 'zen', 'deco'];
const pedidos = process.argv.slice(2).filter((a) => TODOS.includes(a));
const temas = pedidos.length ? pedidos : TODOS;
const saida = join(RAIZ, 'modelos/ideias/prints');
mkdirSync(saida, { recursive: true });
// porta sorteada: varias execucoes em paralelo nao colidem
const porta = 5400 + Math.floor(Math.random() * 500);
const fechar = await servir(porta);

async function print(query, tam, arq, espera = 2500) {
  const perfil = mkdtempSync(join(tmpdir(), 'c2-ideias-'));
  await chrome([
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, `--window-size=${tam.replace('x', ',')}`, `--virtual-time-budget=${espera}`,
    `--screenshot=${join(saida, arq)}`, `http://127.0.0.1:${porta}/modelos/ideias/index.html?${query}`,
  ], 120000);
  rmSync(perfil, { recursive: true, force: true });
}

const t0 = Date.now();
for (const id of temas) {
  await print(`ideia=${id}&vitrine&bot=0`, '390x844', `${id}-retrato.png`);
  await print(`ideia=${id}&vitrine&quadro=650`, '390x844', `${id}-cascata.png`);
  await print(`ideia=${id}&vitrine&bot=0`, '1280x720', `${id}-paisagem.png`);
  process.stdout.write(`${id}: ok (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
}
if (!pedidos.length) {
  await print('rodada=1&vitrine&parado', '1800x1250', 'grade-rodada1.png', 3000);
  await print('rodada=2&vitrine&parado', '1800x2350', 'grade-rodada2.png', 3000);
  await print('rodada=3&vitrine&parado', '1800x2350', 'grade-rodada3.png', 3000);
}
await fechar();
process.stdout.write(`prints em modelos/ideias/prints (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
