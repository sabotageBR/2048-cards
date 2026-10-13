// Renderiza a thumb da Poki (tools/thumb.html) pelo Chrome headless.
// Uso:
//   node tools/thumb.mjs --final   mede a ESCOLHIDA contra a regra da Poki (falha alto se
//                                  sair dela) e grava marketing/thumb/2048-cards-{1256,628}.{png,jpg}
//                                  e a folha de conferencia marketing/thumb/conferir.png
//   node tools/thumb.mjs [opcoes]  as opcoes (padrao: fusao cascata leque escada) em
//                                  marketing/thumb/opcoes/<opcao>-<tamanho>.png, lado a lado em
//                                  marketing/thumb/comparar.png, os tiles pequenos de cada uma em
//                                  marketing/thumb/comparar-tiles.png, e as medidas de cada uma
//   node tools/thumb.mjs --perto [opcoes]  marca de magenta os pixels perto do #83FFE7
//                                  (marketing/thumb/opcoes/<opcao>-perto.png), para achar o que reprova
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { servir, RAIZ } from './servir.mjs';

/**
 * Opcao escolhida pelo usuario (tools/thumb.html). A do duelo (h, o Gosmo
 * assustado, 2026-10-12) ficou na master; no branch so-cartas o usuario
 * escolheu a cascata (2026-10-13, build 0.4.0), com as cartas da Floresta.
 */
const ESCOLHIDA = 'cascata';
const OPCOES = ['fusao', 'cascata', 'leque', 'escada'];
/** Tamanhos entregues: o minimo da Poki (628) e o dobro. */
const TAMANHOS = [1256, 628];
/**
 * Limites da medida (?medir em tools/thumb.html, na thumb de 628 px). Barram:
 * quase nada perto do #83FFE7, beirada longe dele, nenhuma tarja e opaca.
 * So avisa: a faixa da carta 2048 com menos de 3:1 contra a media dos cantos
 * (regua nossa, nao da Poki; reprova o ceu claro dos campos sem que a carta suma).
 */
const LIMITES = { pertoPoki: 0.01, bordaPoki: 30, contraste: 3 };

/** Roda o Chrome e devolve o stdout (o DOM, com --dump-dom). */
function chrome(args, ms) {
  return new Promise((ok) => {
    const p = spawn('google-chrome', args, { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    const t = setTimeout(() => p.kill('SIGKILL'), ms);
    p.on('close', () => { clearTimeout(t); ok(out); });
  });
}

const porta = 4352;
const fechar = await servir(porta);

/** Print de tools/thumb.html?query numa janela LxA. */
async function print(query, larg, alt, arq) {
  const perfil = mkdtempSync(join(tmpdir(), 'c2-thumb-'));
  await chrome(['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, `--window-size=${larg},${alt}`, '--virtual-time-budget=2000', `--screenshot=${arq}`,
    `http://127.0.0.1:${porta}/tools/thumb.html?${query}`], 90000);
  rmSync(perfil, { recursive: true, force: true });
  process.stdout.write(`thumb -> ${relative(RAIZ, arq)}\n`);
}

/** Mede a opcao o (?medir) e devolve as falhas contra LIMITES. */
async function conferir(o) {
  const perfil = mkdtempSync(join(tmpdir(), 'c2-thumb-'));
  const dom = await chrome(['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, '--window-size=628,628', '--virtual-time-budget=2000', '--dump-dom',
    `http://127.0.0.1:${porta}/tools/thumb.html?opcao=${o}&medir`], 90000);
  rmSync(perfil, { recursive: true, force: true });
  const json = (dom.match(/<pre id="medidas">([^<]*)<\/pre>/) || [])[1];
  if (!json) return { m: null, falhas: ['sem medidas (a pagina nao terminou?)'], avisos: [] };
  const m = JSON.parse(json);
  const falhas = [], avisos = [];
  if (m.pertoPoki > LIMITES.pertoPoki) falhas.push(`${(m.pertoPoki * 100).toFixed(1)}% dos pixels perto do #83FFE7`);
  if (m.bordaPoki < LIMITES.bordaPoki) falhas.push(`beirada perto do #83FFE7 (Delta E ${m.bordaPoki})`);
  if (m.tarja.length) falhas.push(`tarja ou borda em: ${m.tarja.join(', ')}`);
  for (const [quem, c] of Object.entries(m.contraste)) if (c < LIMITES.contraste) avisos.push(`contraste da ${quem} com os cantos ${c}:1`);
  if (!m.opaca) falhas.push('pixels transparentes');
  return { m, falhas, avisos };
}

if (process.argv.includes('--perto')) {
  const pedidas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dir = join(RAIZ, 'marketing/thumb/opcoes');
  mkdirSync(dir, { recursive: true });
  for (const o of pedidas.length ? pedidas : OPCOES) await print(`opcao=${o}&perto`, 628, 628, join(dir, `${o}-perto.png`));
} else if (process.argv.includes('--final') && !ESCOLHIDA) {
  process.stdout.write('sem thumb escolhida: rode sem --final, mostre as opcoes ao usuario e grave a escolha em ESCOLHIDA\n');
  await fechar();
  process.exit(1);
} else if (process.argv.includes('--final')) {
  const { m, falhas, avisos } = await conferir(ESCOLHIDA);
  process.stdout.write(`medidas: ${JSON.stringify(m)}\n`);
  if (avisos.length) process.stdout.write('aviso: ' + avisos.join('; ') + '\n');
  if (falhas.length) {
    process.stdout.write('FALHOU (regra da Poki):\n  ' + falhas.join('\n  ') + '\n');
    await fechar();
    process.exit(1);
  }
  const dir = join(RAIZ, 'marketing/thumb');
  mkdirSync(dir, { recursive: true });
  for (const s of TAMANHOS) {
    const png = join(dir, `2048-cards-${s}.png`);
    await print(`opcao=${ESCOLHIDA}&s=${s}`, s, s, png);
    const jpg = png.replace(/\.png$/, '.jpg');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', jpg]);
    process.stdout.write(`thumb -> ${relative(RAIZ, jpg)}\n`);
  }
  // 28 + (314+28) + (204+28) + (140+28) + (94+28) = 892; 314 + 2*28 = 370
  await print(`opcao=${ESCOLHIDA}&grade`, 892, 370, join(dir, 'conferir.png'));
} else {
  const opcoes = process.argv.slice(2).length ? process.argv.slice(2) : OPCOES;
  const dir = join(RAIZ, 'marketing/thumb/opcoes');
  mkdirSync(dir, { recursive: true });
  for (const o of opcoes) for (const s of TAMANHOS) await print(`opcao=${o}&s=${s}`, s, s, join(dir, `${o}-${s}.png`));
  // as opcoes lado a lado (628 px), com as medidas de cada uma
  const lado = join(RAIZ, 'marketing/thumb/comparar.png');
  const ent = opcoes.flatMap((o) => ['-i', join(dir, `${o}-628.png`)]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...ent, '-filter_complex', `hstack=inputs=${opcoes.length}`, lado]);
  process.stdout.write(`thumb -> ${relative(RAIZ, lado)}\n`);
  // os tiles pequenos (314 a 94 px sobre o fundo da Poki), uma linha por opcao
  for (const o of opcoes) await print(`opcao=${o}&grade`, 892, 370, join(dir, `${o}-tiles.png`));
  const tiles = join(RAIZ, 'marketing/thumb/comparar-tiles.png');
  const entT = opcoes.flatMap((o) => ['-i', join(dir, `${o}-tiles.png`)]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...entT, '-filter_complex', `vstack=inputs=${opcoes.length}`, tiles]);
  process.stdout.write(`thumb -> ${relative(RAIZ, tiles)}\n`);
  for (const o of opcoes) {
    const { m, falhas, avisos } = await conferir(o);
    process.stdout.write(`${o}: ${JSON.stringify(m)}${falhas.length ? '\n   fora da regra: ' + falhas.join('; ') : ''}${avisos.length ? '\n   aviso: ' + avisos.join('; ') : ''}\n`);
  }
}
await fechar();
