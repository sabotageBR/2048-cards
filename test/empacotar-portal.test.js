// O empacotador dos portais: uma build limpa passa, e cada sobra reprova.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { conferirBuild, URLS } from '../tools/empacotar-portal.mjs';

const raiz = new URL('..', import.meta.url).pathname;

/** Uma build como a do empacotador, numa pasta temporaria. */
function montar(portal = 'y8') {
  const d = mkdtempSync(join(tmpdir(), 'c2-build-'));
  for (const item of ['index.html', 'LICENCAS.txt', 'src']) cpSync(join(raiz, item), join(d, item), { recursive: true });
  rmSync(join(d, 'src/core/poki.js'));
  cpSync(join(raiz, 'portais/protocolo.js'), join(d, 'src/core/protocolo.js'));
  cpSync(join(raiz, `portais/${portal}.js`), join(d, 'src/core/portal.js'));
  writeFileSync(join(d, 'src/core/ids.js'), 'export const IDS = { appId: \'\', gameId: \'\' };\n');
  const html = readFileSync(join(d, 'index.html'), 'utf8').replace(/<!-- Unico script[^\n]*\n<script src="https:[^\n]*\n/, '');
  writeFileSync(join(d, 'index.html'), html);
  return d;
}

const comBuild = (/** @type {(d:string) => void} */ mexer, /** @type {RegExp} */ esperado, portal = 'y8') => {
  const d = montar(portal);
  try {
    mexer(d);
    const f = conferirBuild(d, /** @type {any} */ (portal));
    assert.ok(f.some((x) => esperado.test(x)), `esperava ${esperado}, veio ${JSON.stringify(f)}`);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
};

test('a build limpa passa nos quatro portais', () => {
  for (const portal of ['y8', 'crazygames', 'wavedash', 'itch']) {
    const d = montar(portal);
    assert.deepEqual(conferirBuild(d, /** @type {any} */ (portal)), []);
    rmSync(d, { recursive: true, force: true });
  }
});

test('reprova a marca no nome do arquivo', () => comBuild((d) => writeFileSync(join(d, 'src/core/poki-resto.js'), 'export {};\n'), /no nome/));
test('reprova a marca no conteudo, em qualquer caixa', () => comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), '// feito para a POKI\n'), /marca de outro portal em src\/core\/rng\.js/));
test('reprova a marca em arquivo que nao e texto', () => comBuild((d) => writeFileSync(join(d, 'src/ui/fontes/x.woff2'), Buffer.from('\u0000\u0001poki\u0002', 'latin1')), /x\.woff2/));
test('reprova URL externa', () => comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), 'export const u = \'https://exemplo.com/x.js\';\n'), /URL externa/));
test('reprova URL sem esquema', () => comBuild((d) => writeFileSync(join(d, 'src/ui/x.css'), 'a { background: url("//exemplo.com/x.png"); }\n'), /URL externa/));
test('reprova o SDK do outro portal', () => comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), `export const u = '${URLS.crazygames}';\n`), /outro portal|URL externa/));
test('reprova console.log', () => comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), 'console.log(1);\n'), /console\.log/));
test('reprova import quebrado', () => comBuild((d) => rmSync(join(d, 'src/core/audio.js')), /import quebrado em src\/main\.js/));
test('reprova import dinamico quebrado', () => comBuild((d) => writeFileSync(join(d, 'src/core/x.js'), 'export const f = () => import(\'./nao-existe.js\');\n'), /import quebrado/));
test('reprova import sem nome quebrado', () => comBuild((d) => writeFileSync(join(d, 'src/core/x.js'), 'import \'./nao-existe.js\';\n'), /import quebrado/));
test('reprova caminho absoluto', () => comBuild((d) => writeFileSync(join(d, 'index.html'), '<script src="/src/main.js"></script>'), /caminho absoluto/));
test('reprova a fonte que falta no css', () => comBuild((d) => rmSync(join(d, 'src/ui/fontes/fredoka-latin-700-normal.woff2')), /import quebrado em src\/ui\/estilo\.css/));
test('reprova o sorteio na build', () => comBuild((d) => writeFileSync(join(d, 'src/core/variante.js'), 'export {};\n'), /variante\.js/));
test('reprova resto do teste A/B no main.js', () => comBuild((d) => {
  const p = join(d, 'src/main.js');
  writeFileSync(p, `${readFileSync(p, 'utf8')}\nconst r = Math.random() < 0.5 ? 'hoje' : 'juntar';\n`);
}, /teste A\/B/));
test('reprova outra regra padrao', () => comBuild((d) => {
  const p = join(d, 'src/jogo/fases.js');
  writeFileSync(p, readFileSync(p, 'utf8').replace('REGRA_DO_JOGO = \'juntar\'', 'REGRA_DO_JOGO = \'hoje\''));
}, /nao e o juntar/));
test('reprova build sem index.html', () => comBuild((d) => {
  rmSync(join(d, 'index.html'));
  mkdirSync(join(d, 'vazio'));
}, /sem index\.html/));

test('Wavedash: reprova qualquer URL externa, ate o SDK de um portal', () => comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), `export const u = '${URLS.y8}';\n`), /URL externa/, 'wavedash'));
test('Wavedash: reprova a marca de outro portal no conteudo', () => {
  for (const marca of ['// feito para a CrazyGames', '// ids da Y8', '// o SDK da GameDistribution']) {
    comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), `${marca}\n`), /marca de outro portal em src\/core\/rng\.js/, 'wavedash');
  }
});
test('Wavedash: reprova a marca de outro portal no nome', () => comBuild((d) => writeFileSync(join(d, 'src/core/y8.js'), 'export {};\n'), /no nome/, 'wavedash'));
test('Wavedash: reprova o build sem a chamada Wavedash.init', () => comBuild((d) => {
  const p = join(d, 'src/core/portal.js');
  writeFileSync(p, readFileSync(p, 'utf8').replace(/Wavedash\.init\(/g, 'Wavedash.iniciar('));
}, /sem a chamada Wavedash\.init/, 'wavedash'));
test('Wavedash: reprova console.log e build sem index.html', () => {
  comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), 'console.log(1);\n'), /console\.log/, 'wavedash');
  comBuild((d) => rmSync(join(d, 'index.html')), /sem index\.html/, 'wavedash');
});

test('itch.io: reprova qualquer URL externa e a marca de outro portal, a Wavedash inclusive', () => {
  comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), `export const u = '${URLS.crazygames}';\n`), /URL externa/, 'itch');
  for (const marca of ['// feito para a CrazyGames', '// ids da Y8', '// o init da Wavedash']) {
    comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), `${marca}\n`), /marca de outro portal em src\/core\/rng\.js/, 'itch');
  }
  comBuild((d) => writeFileSync(join(d, 'src/core/wavedash.js'), 'export {};\n'), /no nome/, 'itch');
});
test('itch.io: reprova localStorage.clear(), que apagaria o save dos outros jogos da itch', () => comBuild((d) => writeFileSync(join(d, 'src/core/rng.js'), 'export const zerar = () => localStorage.clear();\n'), /localStorage\.clear/, 'itch'));
test('itch.io: reprova caminho acima de 240 caracteres e caminho absoluto', () => {
  comBuild((d) => { mkdirSync(join(d, 'src', 'x'.repeat(240)), { recursive: true }); writeFileSync(join(d, 'src', 'x'.repeat(240), 'a.txt'), 'a'); }, /acima de 240/, 'itch');
  comBuild((d) => writeFileSync(join(d, 'index.html'), '<script src="/src/main.js"></script>'), /caminho absoluto/, 'itch');
});
