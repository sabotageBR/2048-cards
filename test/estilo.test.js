// Fronteiras do codigo que a Poki e o projeto cobram (ver CLAUDE.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
/** @param {string} dir @returns {string[]} */
const arquivos = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? arquivos(p) : [p];
});
const src = arquivos(join(raiz, 'src')).filter((p) => /\.(js|css)$/.test(p));
const ler = (p) => readFileSync(p, 'utf8');
const rel = (p) => relative(raiz, p);

test('sem console.log/info/debug no jogo', () => {
  for (const p of src) assert.ok(!/console\.(log|info|debug)\s*\(/.test(ler(p)), rel(p));
});

test('so src/core/portal.js importa o SDK da Poki, e so src/main.js importa o portal', () => {
  for (const p of src) {
    if (rel(p) !== 'src/core/portal.js' && rel(p) !== 'src/core/poki.js') assert.ok(!/core\/poki\.js|\.\/poki\.js/.test(ler(p)), rel(p));
    if (rel(p) !== 'src/main.js' && rel(p) !== 'src/core/portal.js') assert.ok(!/core\/portal\.js|\.\/portal\.js/.test(ler(p)), rel(p));
  }
});

test('a marca da Poki so aparece no wrapper dela: o resto vai para os zips dos portais', () => {
  for (const p of src) {
    if (rel(p) === 'src/core/poki.js' || rel(p) === 'src/core/portal.js') continue;
    assert.ok(!/poki/i.test(ler(p)), rel(p));
  }
});

test('src/ nao cita os testes de jogadores de outra plataforma', () => {
  for (const p of src) {
    if (rel(p) === 'src/core/poki.js') continue;
    assert.ok(!/Player Fit|Web Fit/i.test(ler(p)), rel(p));
  }
});

test('nada de sorteio de regra: o jogo joga so a REGRA_DO_JOGO', () => {
  const main = ler(join(raiz, 'src/main.js'));
  assert.ok(!/variante|V\.regra|Math\.random|'hoje'/.test(main), 'main.js com resto do teste A/B');
  assert.ok(/faseDe\(n, J\.tentativas, REGRA_DO_JOGO\)/.test(main));
  for (const p of src) assert.ok(!/variante\.js|escolherVariante/.test(ler(p)), rel(p));
});

test('main.js le o relogio so por relogio(): performance.now() direto salta a pausa do portal', () => {
  const linhas = ler(join(raiz, 'src/main.js')).split('\n')
    .filter((l) => /performance\.now\(\)/.test(l) && !/^\s*(\/\/|\*)/.test(l)).map((l) => l.trim());
  assert.deepEqual(linhas, [
    'let ultimo = performance.now();',
    'function relogio() { return (J.pausado ? J.pausadoEm : performance.now()) - J.desconto; }',
    'J.pausadoEm = performance.now();',
    'J.desconto += performance.now() - J.pausadoEm;',
  ]);
});

test('so o armazenamento toca o localStorage', () => {
  for (const p of src) {
    if (rel(p) === 'src/core/armazenamento.js') continue;
    assert.ok(!/localStorage/.test(ler(p)), rel(p));
  }
});

test('so a depuracao le a URL', () => {
  for (const p of src) {
    if (rel(p) === 'src/core/depuracao.js') continue;
    assert.ok(!/location\.(search|hash)|URLSearchParams/.test(ler(p)), rel(p));
  }
});

test('logica pura nao usa Math.random, DOM nem relogio', () => {
  for (const p of src.filter((x) => /src\/jogo\//.test(x))) {
    const t = ler(p);
    assert.ok(!/Math\.random|document\.|window\.|Date\.now|performance\.now|setTimeout/.test(t), rel(p));
  }
});

test('src/ nao importa modelos/ nem tools/', () => {
  for (const p of src) assert.ok(!/from\s+['"][^'"]*(modelos|tools)\//.test(ler(p)), rel(p));
});

test('unica URL externa e a do SDK da Poki', () => {
  const permitida = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
  for (const p of [...src, join(raiz, 'index.html')]) {
    const urls = ler(p).match(/https?:\/\/[^\s"'`)<>]+/g) || [];
    for (const u of urls) assert.equal(u, permitida, `${rel(p)}: ${u}`);
  }
  assert.ok(ler(join(raiz, 'index.html')).includes(permitida));
});

test('index.html pede viewport-fit=cover', () => {
  assert.ok(/viewport-fit=cover/.test(ler(join(raiz, 'index.html'))));
});
