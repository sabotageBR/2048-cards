// Capas e promos dos portais (CrazyGames, Y8, Wavedash, itch.io e GamePush), recompostas de tools/thumb.html com o titulo.
// Sai o PNG exato do canvas (lido do dataURL do #medidas), sem depender do tamanho da janela.
// Uso: node tools/capas.mjs [saida=../distribuicao/2048-cards] [--so=<pasta>] [--porta=6103]
// --so=wavedash (ou itch, ou gamepush) refaz so as pecas dessa pasta (as outras ja entregues ficam como estao).
// A GamePush pede o titulo e nenhum outro texto nas capas (como a Wavedash: so a carta 2048), e nenhum
// texto nos icones nem no fundo: nem numero de carta (?icone e ?cenario em tools/thumb.html).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { servir, RAIZ } from './servir.mjs';

const args = process.argv.slice(2);
const saida = resolve(args.find((a) => !a.startsWith('--')) || join(RAIZ, '../distribuicao/2048-cards'));
const so = (args.find((a) => a.startsWith('--so=')) || '').slice(5);
const portaArg = Number((args.find((a) => a.startsWith('--porta=')) || '').slice(8));
const PECAS = [
  ['crazygames/cover-landscape-1920x1080.png', 1920, 1080],
  ['crazygames/cover-portrait-800x1200.png', 800, 1200],
  ['crazygames/cover-square-800x800.png', 800, 800],
  ['y8/promo-landscape-1920x1080.png', 1920, 1080],
  ['y8/promo-portrait-1080x1920.png', 1080, 1920],
  ['y8/promo-card-760x570.png', 760, 570],
  ['fontes/capa-1080x1620.png', 1080, 1620], // o primeiro quadro do video retrato da CrazyGames
  // a Wavedash nao aceita texto alem do titulo na capa: sem a pilha 1024, 512, 256, 128
  ['wavedash/cover-1920x1080.png', 1920, 1080, '&so2048'],
  // a itch.io (315:250, composicao 4:3): tambem so o titulo e a carta 2048
  ['itch/cover-630x500.png', 630, 500, '&so2048'],
  ['gamepush/cover-1920x1080.png', 1920, 1080, '&so2048'],
  ['gamepush/cover-portrait-1080x1920.png', 1080, 1920, '&so2048'],
  ['gamepush/icon-1024x1024.png', 1024, 1024, '&icone'],
  ['gamepush/icon-512x384.png', 512, 384, '&icone'],
  ['gamepush/icon-800x1200.png', 800, 1200, '&icone'],
  ['gamepush/background-1920x1080.png', 1920, 1080, '&cenario=1'],
];

/** Roda o Chrome e devolve o DOM. */
function chrome(args, ms) {
  return new Promise((ok) => {
    const p = spawn('google-chrome', args, { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    const t = setTimeout(() => p.kill('SIGKILL'), ms);
    p.on('close', () => { clearTimeout(t); ok(out); });
  });
}

const porta = portaArg || 6103;
const fechar = await servir(porta);
for (const [nome, l, a, extra = ''] of PECAS.filter(([n]) => !so || n.startsWith(`${so}/`))) {
  const perfil = mkdtempSync(join(tmpdir(), 'c2-capa-'));
  const dom = await chrome(['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, '--window-size=900,900', '--virtual-time-budget=4000', '--dump-dom',
    `http://127.0.0.1:${porta}/tools/thumb.html?opcao=cascata&capa&l=${l}&a=${a}${extra}`], 120000);
  rmSync(perfil, { recursive: true, force: true });
  const b64 = (dom.match(/data:image\/png;base64,([^<]+)</) || [])[1];
  if (!b64) {
    process.stdout.write(`sem PNG: ${nome}\n`);
    await fechar();
    process.exit(1);
  }
  const arq = join(saida, nome);
  mkdirSync(join(arq, '..'), { recursive: true });
  writeFileSync(arq, Buffer.from(b64, 'base64'));
  // a GamePush recusa fundo transparente: o canvas e opaco, mas o PNG dele tem canal alfa; sai em RGB
  if (nome.startsWith('gamepush/')) {
    const rgb = `${arq}.rgb.png`;
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', arq, '-pix_fmt', 'rgb24', rgb]);
    if (r.status !== 0) throw new Error(`ffmpeg: ${nome}`);
    renameSync(rgb, arq);
  }
  process.stdout.write(`${arq} (${l}x${a})\n`);
}
await fechar();
