// Monta a build de um portal sem a Poki: copia o jogo para dist-portais/<portal>/, troca o wrapper
// da Poki pelo adaptador de portais/ e zipa com index.html na raiz. Reprova (conferirBuild) sobra da
// marca em nome ou conteudo, URL externa fora do SDK do portal, console.log, import quebrado e resto
// do teste A/B: a regra e fixa em juntar. Na Wavedash, nenhuma URL externa, nenhuma marca de outro
// portal e a chamada Wavedash.init tem de estar no build.
// Uso: [Y8_APP_ID=.. Y8_GAME_ID=..] node tools/empacotar-portal.mjs <y8|crazygames|wavedash> [pasta do zip]
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { RAIZ } from './servir.mjs';

// a Wavedash injeta o SDK dela na pagina: o build nao pede URL nenhuma
export const URLS = {
  y8: 'https://cdn.y8.com/minimal-sdk/2-0/y8.min.js',
  crazygames: 'https://sdk.crazygames.com/crazygames-sdk-v3.js',
  wavedash: '',
};
const OUTRO = { y8: 'crazygames.com', crazygames: 'y8.com' };
// na Wavedash, a marca de qualquer outro portal reprova: em qualquer arquivo os nomes longos e, nos
// de texto, o "y8" solto (num binario, dois bytes assim aparecem por acaso)
const MARCAS = /crazy ?games|gamedistribution|y8\.com/i;
const MARCA_Y8 = /\by8\b/i;
const TAG = '<!-- Unico script externo permitido pela Poki. -->\n<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>\n';
const MAX_ARQUIVOS = 1500;

/** @param {string} d @returns {string[]} */
const listar = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? listar(p) : [p];
});

/**
 * Os caminhos locais que o arquivo pede, com o que pede cada um relativo a ele.
 * @param {string} t texto do arquivo
 * @param {string} ext
 * @returns {string[]}
 */
function pedidos(t, ext) {
  const achados = [];
  const juntar = (/** @type {RegExp} */ re) => { for (const m of t.matchAll(re)) achados.push(m[1]); };
  if (ext === '.js') {
    juntar(/^\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/gm);
    juntar(/^\s*import\s+['"]([^'"]+)['"]/gm);
    juntar(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g);
  }
  if (ext === '.html') juntar(/<(?:script|link|img)\b[^>]*?\b(?:src|href)="([^"]+)"/g);
  if (ext === '.css') juntar(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g);
  return achados.filter((u) => !/^(https?:|data:)/.test(u));
}

/**
 * Confere uma build pronta. Devolve as falhas (vazio = pode zipar).
 * @param {string} dist
 * @param {'y8'|'crazygames'|'wavedash'} portal
 * @returns {string[]}
 */
export function conferirBuild(dist, portal) {
  const falhas = [];
  const arquivos = listar(dist);
  for (const p of arquivos) {
    const r = relative(dist, p);
    const ext = extname(p);
    if (/poki/i.test(r) || (portal === 'wavedash' && /y8|crazy|gamedistribution/i.test(r))) falhas.push(`marca de outro portal no nome: ${r}`);
    const bruto = readFileSync(p).toString('latin1');
    if (/poki/i.test(bruto)) falhas.push(`marca de outro portal em ${r}: ${(bruto.match(/.{0,40}poki.{0,40}/i) || [''])[0]}`);
    if (OUTRO[portal] && bruto.includes(OUTRO[portal])) falhas.push(`SDK do outro portal em ${r}`);
    if (portal === 'wavedash' && MARCAS.test(bruto)) falhas.push(`marca de outro portal em ${r}: ${(bruto.match(new RegExp(`.{0,40}(${MARCAS.source}).{0,40}`, 'i')) || [''])[0]}`);
    if (portal === 'wavedash' && /\.(html|js|css|txt|json)$/.test(p) && MARCA_Y8.test(bruto)) falhas.push(`marca de outro portal em ${r}: ${(bruto.match(/.{0,40}\by8\b.{0,40}/i) || [''])[0]}`);
    if (!/\.(html|js|css)$/.test(p)) continue;
    const t = readFileSync(p, 'utf8');
    for (const u of t.match(/https?:\/\/[^\s"'`)<>]+/g) || []) if (u !== URLS[portal]) falhas.push(`URL externa em ${r}: ${u}`);
    for (const m of t.matchAll(/["'(]\/\/[a-z0-9-]+\.[a-z0-9.-]+/gi)) falhas.push(`URL externa em ${r}: ${m[0].slice(1)}`);
    if (/console\.(log|info|debug)\s*\(/.test(t)) falhas.push(`console.log em ${r}`);
    for (const u of pedidos(t, ext)) {
      // a CrazyGames nao aceita caminho absoluto: ele falha no iframe dela
      if (u.startsWith('/')) falhas.push(`caminho absoluto em ${r}: ${u}`);
      else if (!existsSync(join(dirname(p), u.split(/[?#]/)[0]))) falhas.push(`import quebrado em ${r}: ${u}`);
    }
  }
  const html = join(dist, 'index.html');
  if (!existsSync(html)) falhas.push('sem index.html na raiz');
  else if (!readFileSync(html, 'utf8').includes('src/main.js')) falhas.push('index.html sem o jogo');
  if (arquivos.length > MAX_ARQUIVOS) falhas.push(`${arquivos.length} arquivos, acima do limite da CrazyGames`);
  // sem o init a Wavedash deixa o jogo escondido atras da tela de carregamento dela
  if (portal === 'wavedash' && !arquivos.some((p) => p.endsWith('.js') && /\bWavedash\.init\(/.test(readFileSync(p, 'utf8')))) falhas.push('sem a chamada Wavedash.init no build');
  // a regra: nada de sorteio, e o que o jogo passa ao faseDe e o juntar
  if (existsSync(join(dist, 'src/core/variante.js'))) falhas.push('o sorteio do teste A/B foi na build: src/core/variante.js');
  const main = join(dist, 'src/main.js');
  if (existsSync(main)) {
    const t = readFileSync(main, 'utf8');
    if (/variante|V\.regra|escolherVariante|Math\.random|'hoje'/.test(t)) falhas.push('resto do teste A/B em src/main.js');
    if (!/faseDe\(n, J\.tentativas, REGRA_DO_JOGO\)/.test(t)) falhas.push('src/main.js nao passa a REGRA_DO_JOGO ao faseDe');
  }
  const fases = join(dist, 'src/jogo/fases.js');
  if (existsSync(fases) && !/export const REGRA_DO_JOGO = 'juntar';/.test(readFileSync(fases, 'utf8'))) falhas.push('a regra do jogo nao e o juntar');
  return falhas;
}

/**
 * Monta dist-portais/<portal>.
 * @param {'y8'|'crazygames'|'wavedash'} portal
 * @param {{appId:string, gameId:string}} ids
 * @returns {string} a pasta da build
 */
function montar(portal, ids) {
  const dist = join(RAIZ, 'dist-portais', portal);
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  for (const item of ['index.html', 'LICENCAS.txt', 'src']) cpSync(join(RAIZ, item), join(dist, item), { recursive: true });
  rmSync(join(dist, 'src/core/poki.js'));
  cpSync(join(RAIZ, 'portais/protocolo.js'), join(dist, 'src/core/protocolo.js'));
  cpSync(join(RAIZ, `portais/${portal}.js`), join(dist, 'src/core/portal.js'));
  if (portal === 'y8') writeFileSync(join(dist, 'src/core/ids.js'), `export const IDS = ${JSON.stringify(ids)};\n`);
  const pagina = join(dist, 'index.html');
  const html = readFileSync(pagina, 'utf8');
  if (html.split(TAG).length !== 2) throw new Error('a tag do SDK da Poki mudou no index.html');
  writeFileSync(pagina, html.replace(TAG, ''));
  return dist;
}

/** Zipa a build; o nome diz se falta id. Devolve o caminho do zip. */
function zipar(dist, portal, saidaZip, nomeBase, semIds) {
  const zip = join(saidaZip, `${nomeBase}${semIds ? '-sem-ids' : ''}.zip`);
  mkdirSync(saidaZip, { recursive: true });
  // um zip por pasta: o de antes (com ou sem ids) nao fica ao lado do novo
  for (const velho of [`${nomeBase}.zip`, `${nomeBase}-sem-ids.zip`]) rmSync(join(saidaZip, velho), { force: true });
  const z = spawnSync('zip', ['-qr', '-X', zip, '.'], { cwd: dist, encoding: 'utf8' });
  if (z.status !== 0) throw new Error(`zip: ${z.stderr}`);
  const lista = spawnSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).stdout.trim().split('\n');
  if (spawnSync('unzip', ['-tq', zip]).status !== 0 || !lista.includes('index.html')) throw new Error('zip invalido ou sem index.html na raiz');
  return zip;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portal = /** @type {'y8'|'crazygames'|'wavedash'} */ (process.argv[2]);
  if (!Object.hasOwn(URLS, portal)) {
    process.stdout.write('uso: node tools/empacotar-portal.mjs <y8|crazygames|wavedash> [pasta do zip]\n');
    process.exit(1);
  }
  const saidaZip = resolve(process.argv[3] || join(RAIZ, '../distribuicao/2048-cards', portal));
  const versao = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).version;
  const ids = { appId: process.env.Y8_APP_ID || '', gameId: process.env.Y8_GAME_ID || '' };
  const semIds = portal === 'y8' && !(ids.appId && ids.gameId);
  const dist = montar(portal, ids);
  const falhas = conferirBuild(dist, portal);
  if (falhas.length) {
    process.stdout.write('FALHOU:\n  ' + falhas.join('\n  ') + '\n');
    process.exit(1);
  }
  const nomeBase = `2048-cards-${portal}-${versao}`;
  const zip = zipar(dist, portal, saidaZip, nomeBase, semIds);
  // a CrazyGames e a Wavedash recebem a pasta: o zip extraido fica ao lado, com o mesmo nome
  if (portal === 'crazygames' || portal === 'wavedash') {
    const pasta = join(saidaZip, nomeBase);
    rmSync(pasta, { recursive: true, force: true });
    if (spawnSync('unzip', ['-q', zip, '-d', pasta]).status !== 0) throw new Error('nao extraiu o zip');
  }
  const sha = createHash('sha256').update(readFileSync(zip)).digest('hex');
  process.stdout.write(`${zip}: ${listar(dist).length} arquivos, ${(statSync(zip).size / 1024).toFixed(0)} KB, sha256 ${sha}\n`);
  if (semIds) process.stdout.write('AVISO: sem Y8_APP_ID e Y8_GAME_ID, o zip sai sem anuncios: serve de rascunho, nao de envio final\n');
}
