// Videos e screenshots dos portais: jogo real do BUILD DO PORTAL (dist-portais/y8), por um host de
// fora, sem nenhum parametro de teste: a tela e a do jogador, sem os botoes de video, com a regra
// juntar. Quem joga e o guloso do proprio jogo (a mao de ajuda), pelo __c2.auto. O relogio virtual
// (tools/relogio-virtual.js) entra antes da pagina, entao cada quadro e exato, por mais lento que o
// Chrome sem GPU seja, e a corrida ate o ponto certo da partida fica fora do video.
//   node tools/video-portais.mjs sondar <nivel>                  jogadas em cada subida de nivel
//   node tools/video-portais.mjs print <nivel> <jogadas> <cartas> <LxA> <dpr> <saida.png> [calmo|juntar]
//   node tools/video-portais.mjs video <nivel> <jogadas> <LxA> <dpr> <saida.mp4> [seg=21] [ms=750]
//   node tools/video-portais.mjs <tudo|prints|videos> [pasta=../distribuicao/2048-cards]   os de PRINTS e VIDEOS
//   node tools/video-portais.mjs itch [pasta=../distribuicao/2048-cards]   os screenshots da itch.io, do build
//        dela (dist-portais/itch): os 5 primeiros de PRINTS, no tamanho do embed (960x600, densidade 4/3)
//   node tools/video-portais.mjs gamepush [pasta=../distribuicao/2048-cards]   os screenshots da GamePush, do
//        build dela (dist-portais/gamepush): os 5 primeiros de PRINTS em 1280x720 e 720x1280, em ingles e, em
//        gamepush/ru/, em russo (o idioma do navegador); sem o SDK, entao sem botao de video
//   node tools/video-portais.mjs gamepush-videos [pasta]   o video retrato da GamePush (1080x1920, do build
//        dela, em fontes/jogo-9x16.mp4) e os dois videos da loja, de ate 20 s e sem audio
// PORTA e PORTA_DEV (variaveis de ambiente) trocam as portas do servidor e do DevTools; BUILD troca o build
// dos modos print e video (padrao y8) e IDIOMA (en, pt, es, ru) o idioma do navegador.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { RAIZ, servir } from './servir.mjs';
import { abrirChrome, espera } from './chrome-cdp.mjs';
import { fonteRelogio } from './relogio-virtual.js';

const FPS = 30;
const HOST = 'jogo.portal.test';
// PORTAS=n desloca as duas, para rodar mais de uma copia ao mesmo tempo (ate 6119 e 9619)
const desloca = Number(process.env.PORTAS || 0);
const porta = Number(process.env.PORTA) || 6102 + desloca, portaDep = Number(process.env.PORTA_DEV) || 9612 + desloca;
/** O build servido: o da Y8, ou o da itch.io no modo itch (BUILD troca nos modos print e video). */
let build = process.env.BUILD || 'y8';
/** O idioma do navegador (o jogo sem SDK fica nele): IDIOMA ou o modo gamepush. */
let idioma = process.env.IDIOMA || '';
/** Os hosts do SDK da GamePush: mortos aqui, o build dela abre sem SDK (e sem rede de fora). */
const SDK_MORTO = ['gs.eponesh.com', 's3.gamepush.com', 's3-eu.gamepush.com', 'gamepush.com'].map((h) => `MAP ${h} ~NOTFOUND`);
/** Passo do guloso na corrida ate o ponto da partida (fora do video). */
const RAPIDO = 120;

/** Tamanhos: CSS e densidade de cada entrega (a mesa ocupa mais a tela com menos CSS). */
const TELAS = {
  standard: ['760x570', 1], wide: ['960x540', 4 / 3], v16x9: ['960x540', 2], v2x3: ['540x810', 2], v4x3: ['640x480', 1.5], itch: ['960x600', 4 / 3],
  gpPaisagem: ['960x540', 4 / 3], gpRetrato: ['540x960', 4 / 3], v9x16: ['540x960', 2],
};

/**
 * Screenshots: [nivel, jogadas, cartas na mesa, modo]. A corrida vai ate as duas contas sem sair do
 * mundo do nivel (saiu, a ferramenta reprova: um quadro de cada mundo). Modo: 'calmo' espera a febre
 * e os avisos passarem; 'juntar' faz o mesmo com dois topos iguais e leva um ate o outro, com o mouse
 * de verdade (o verbo do jogo); sem modo, a festa fica na tela.
 */
const PRINTS = [
  [3, 30, 8, 'calmo'],
  [10, 10, 7, 'juntar'],
  [19, 30, 8, 'calmo'],
  [29, 20, 7, ''],
  [34, 10, 7, 'juntar'],
  [10, 85, 7, 'calmo'],
];
const TEM_PAR = "(() => { const t = __c2.J.e.colunas.filter((c) => c.length).map((c) => c[c.length - 1]).filter((k) => k.tipo === 'normal').map((k) => k.v); return new Set(t).size < t.length; })()";
/** Videos: [saida, tela, nivel, jogadas antes de gravar]. */
const VIDEOS = [
  ['fontes/jogo-16x9.mp4', 'v16x9', 10, 110], // o fim do mundo 2 e a entrada do 3
  ['fontes/jogo-2x3.mp4', 'v2x3', 21, 62], // o fim do mundo 3 e a entrada do 4
  ['fontes/jogo-4x3.mp4', 'v4x3', 29, 91], // o fim do mundo 4 e a entrada do 5, de 3 colunas
];

/** @param {Awaited<ReturnType<typeof abrirChrome>>} c */
async function abrirJogo(c, nivel, L, A, dpr) {
  await c.cmd('Page.enable');
  await c.cmd('Runtime.enable');
  await c.cmd('Emulation.setDeviceMetricsOverride', { width: L, height: A, deviceScaleFactor: dpr, mobile: false });
  // o idioma do navegador: o jogo sem SDK abre nele
  const lingua = idioma ? `Object.defineProperty(navigator, 'languages', { get: () => ['${idioma}'] }); Object.defineProperty(navigator, 'language', { get: () => '${idioma}' });` : '';
  await c.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `${fonteRelogio({ fps: FPS })}${lingua}window.__cards2048Teste = { nivel: ${nivel} };` });
  await c.cmd('Page.navigate', { url: `http://${HOST}:${porta}/index.html` });
  for (let k = 0; k < 200 && !(await c.av('!!(window.__c2 && window.__c2.J.e)')); k++) await espera(50);
  if (!(await c.av('!!window.__c2'))) throw new Error('o jogo nao abriu');
  // as animacoes CSS nao seguem o relogio virtual; a mao de ajuda nao e o assunto do video
  await c.av("document.body.classList.add('sem-animacao'); __c2.save.vistas = ['juntar', 'novidade:coringa', 'novidade:bomba', 'novidade:dobro', 'novidade:quadruplo'];");
  await c.av('__relogio.quadro(12)');
}

/** Corre a partida, fora do video, ate o guloso fazer `jogadas` no mundo e a mesa ter `cartas`. */
async function correr(c, jogadas, cartas = 0, condicao = 'true', parar = 45) {
  const mundo = await c.av('__c2.J.e.mundo');
  if (jogadas > 0) {
    await c.av(`__c2.auto(${RAPIDO})`);
    // o await deixa a promessa do intervalo comercial voltar: sem SDK ela resolve na hora, mas nao no meio de um laco
    const r = await c.av(`(async () => { let i = 0; while (i < 20000 && (__c2.J.e.n < ${jogadas} || __c2.J.e.colunas.flat().length < ${cartas} || !(${condicao}) || __c2.J.estado !== 'jogando') && __c2.J.estado !== 'fim' && __c2.J.e.mundo === ${mundo}) { __relogio.quadro(1); await null; i++; } return __c2.J.estado; })()`);
    if (r === 'fim') throw new Error('o guloso encheu a mesa antes do ponto pedido');
    if (await c.av(`__c2.J.e.mundo !== ${mundo}`)) throw new Error(`o mundo ${mundo} acabou antes do ponto pedido`);
  }
  // o auto() joga uma vez ao ser chamado: para parar, so empurra a proxima jogada
  await c.av('__c2.J.autoProx = 1e15');
  await assentar(c, parar);
}

/** Deixa a jogada assentar; o ocio nao conta, para a mao de ajuda nao entrar no quadro. */
const assentar = (c, quadros) => c.av(`(async () => { for (let i = 0; i < ${quadros}; i++) { __c2.J.ultimaAcao = __c2.J.agora; __relogio.quadro(1); await null; } })()`);

const situacao = (c) => c.av("JSON.stringify({ mundo: __c2.J.e.mundo, nivel: __c2.J.e.nivel, jogadas: __c2.J.e.n, estado: __c2.J.estado, perfil: __c2.J.e.perfil, cols: __c2.J.e.colunas.map((k) => k.map((x) => x.v || x.tipo)), fila: __c2.J.e.fila.map((x) => x.v || x.tipo), rotulo: document.getElementById('rotulo').textContent })");

async function comChrome(fn) {
  const fechar = await servir(porta, join(RAIZ, 'dist-portais', build));
  const c = await abrirChrome({ portaDep, argumentos: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1, ${SDK_MORTO.join(', ')}`] });
  try {
    return await fn(c);
  } finally {
    await c.fechar();
    await fechar();
  }
}

async function sondar(nivel) {
  await comChrome(async (c) => {
    await abrirJogo(c, nivel, 640, 480, 1);
    await c.av(`__c2.auto(${RAPIDO})`);
    let ant = '';
    for (let i = 0; i < 300; i++) {
      await c.av('(async () => { for (let k = 0; k < 10; k++) { __relogio.quadro(1); await null; } })()');
      const s = JSON.parse(await situacao(c));
      const chave = `${s.mundo}/${s.nivel}/${s.estado}`;
      if (chave !== ant) process.stdout.write(`${chave}\t${s.jogadas} jogadas\t${JSON.stringify(s.cols)}\n`);
      ant = chave;
      if (s.estado === 'fim' || s.mundo > Math.floor((nivel - 1) / 8) + 1) break;
    }
  });
}

/** Segura o topo de uma coluna sobre o topo igual de outra, sem soltar. */
async function segurarJuntar(c) {
  const [de, para] = await c.av(`(() => {
    const L = __c2.cena.L, cols = __c2.J.e.colunas;
    let melhor = [];
    let menor = 99;
    for (let a = 0; a < cols.length; a++) for (let b = 0; b < cols.length; b++) {
      if (a === b || !cols[a].length || !cols[b].length) continue;
      const x = cols[a][cols[a].length - 1], y = cols[b][cols[b].length - 1];
      if (x.tipo !== 'normal' || x.v !== y.v || cols[b].length >= menor) continue;
      menor = cols[b].length;
      const p = L.carta(a, cols[a].length - 1), q = L.carta(b, cols[b].length - 1);
      // a coluna mais curta: a carta segura nao passa da tela. O ponteiro para abaixo do topo, para
      // a faixa com o numero da carta de la ficar a vista
      melhor = [[p.x + p.w / 2, p.y + p.h / 2], [q.x + q.w / 2, q.y + q.h]];
    }
    return melhor;
  })()`);
  await c.cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: de[0], y: de[1], button: 'left', buttons: 1, clickCount: 1 });
  for (let k = 1; k <= 8; k++) {
    await c.cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: de[0] + ((para[0] - de[0]) * k) / 8, y: de[1] + ((para[1] - de[1]) * k) / 8, button: 'left', buttons: 1 });
  }
  await c.av('__relogio.quadro(3)');
}

async function imprimir(c, nivel, jogadas, cartas, modo, tam, dpr, saida) {
  const [L, A] = tam.split('x').map(Number);
  await abrirJogo(c, nivel, L, A, dpr);
  await correr(c, jogadas, cartas, modo === 'juntar' ? TEM_PAR : 'true', modo ? 100 : 45);
  if (modo) {
    await c.av("(async () => { let i = 0; while (i < 600 && __c2.J.e.febre && __c2.J.agora < __c2.J.e.febreAte) { __c2.J.ultimaAcao = __c2.J.agora; __relogio.quadro(1); await null; i++; } })()");
    await assentar(c, 30);
  }
  if (modo === 'juntar') await segurarJuntar(c);
  const s = await c.cmd('Page.captureScreenshot', { format: 'png' });
  mkdirSync(dirname(saida), { recursive: true });
  writeFileSync(saida, Buffer.from(s.result.data, 'base64'));
  const f = JSON.parse(await situacao(c));
  process.stdout.write(`${saida}: ${f.rotulo}, ${f.jogadas} jogadas, regra ${f.perfil}, ${JSON.stringify(f.cols)}\n`);
  if (f.perfil !== 'juntar') throw new Error('a tela nao esta no juntar');
}

async function gravar(c, nivel, jogadas, tam, dpr, saida, seg, ms) {
  const [L, A] = tam.split('x').map(Number);
  await abrirJogo(c, nivel, L, A, dpr);
  await correr(c, jogadas);
  await c.av(`__c2.auto(${ms})`);
  const quadros = mkdtempSync(join(tmpdir(), 'c2-quadros-'));
  const total = Math.round(seg * FPS);
  const marcos = [];
  for (let i = 0; i < total; i++) {
    await c.av('window.__relogio.quadro()');
    const s = await c.cmd('Page.captureScreenshot', { format: 'jpeg', quality: 96 });
    writeFileSync(join(quadros, `${String(i).padStart(5, '0')}.jpg`), Buffer.from(s.result.data, 'base64'));
    if (i % FPS === 0) {
      const f = JSON.parse(await situacao(c));
      if (f.perfil !== 'juntar') throw new Error('o video saiu do juntar');
      marcos.push(`${i / FPS}s m${f.mundo}n${f.nivel} ${f.estado}`);
    }
  }
  const erros = await c.av('window.__relogio.erros().length');
  mkdirSync(dirname(saida), { recursive: true });
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', join(quadros, '%05d.jpg'), '-an',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-r', String(FPS), '-threads', '4',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', saida]);
  rmSync(quadros, { recursive: true, force: true });
  if (r.status !== 0 || erros) throw new Error(`gravacao: ffmpeg ${r.status}, ${erros} erros na pagina`);
  process.stdout.write(`${saida}: ${marcos.join(' | ')}\n`);
}

const [modo, ...resto] = process.argv.slice(2);
if (modo === 'sondar') await sondar(Number(resto[0]));
else if (modo === 'print') {
  const [nivel, jogadas, cartas, tam, dpr, saida, md] = resto;
  await comChrome((c) => imprimir(c, Number(nivel), Number(jogadas), Number(cartas), md || '', tam, Number(dpr), saida));
} else if (modo === 'video') {
  const [nivel, jogadas, tam, dpr, saida, seg, ms] = resto;
  await comChrome((c) => gravar(c, Number(nivel), Number(jogadas), tam, Number(dpr), saida, Number(seg || 21), Number(ms || 750)));
} else if (modo === 'tudo' || modo === 'prints' || modo === 'videos') {
  const pasta = resolve(resto[0] || join(RAIZ, '../distribuicao/2048-cards'));
  for (let k = 0; k < PRINTS.length && modo !== 'videos'; k++) {
    const [nivel, jogadas, cartas, md] = PRINTS[k];
    await comChrome((c) => imprimir(c, nivel, jogadas, cartas, md, TELAS.standard[0], TELAS.standard[1], join(pasta, `y8/screenshot-standard-${k + 1}-760x570.png`)));
    await comChrome((c) => imprimir(c, nivel, jogadas, cartas, md, TELAS.wide[0], TELAS.wide[1], join(pasta, `y8/screenshot-widescreen-${k + 1}-1280x720.png`)));
  }
  if (modo !== 'prints') for (const [nome, tela, nivel, jogadas] of VIDEOS) await comChrome((c) => gravar(c, nivel, jogadas, TELAS[tela][0], TELAS[tela][1], join(pasta, nome), 21, 750));
} else if (modo === 'itch') {
  // um quadro de cada mundo, do build da itch.io (rode antes o empacotador com o alvo itch)
  build = 'itch';
  const pasta = resolve(resto[0] || join(RAIZ, '../distribuicao/2048-cards'));
  const [L, A] = TELAS.itch[0].split('x').map(Number);
  const nome = `${Math.round(L * TELAS.itch[1])}x${Math.round(A * TELAS.itch[1])}`;
  for (let k = 0; k < 5; k++) {
    const [nivel, jogadas, cartas, md] = PRINTS[k];
    await comChrome((c) => imprimir(c, nivel, jogadas, cartas, md, TELAS.itch[0], TELAS.itch[1], join(pasta, `itch/screenshot-${k + 1}-${nome}.png`)));
  }
} else if (modo === 'gamepush') {
  // um quadro de cada mundo, do build da GamePush (rode antes o empacotador com o alvo gamepush), em
  // paisagem e retrato, em ingles e em russo
  build = 'gamepush';
  const pasta = resolve(resto[0] || join(RAIZ, '../distribuicao/2048-cards'));
  for (const lingua of ['en', 'ru']) {
    idioma = lingua;
    const sub = lingua === 'en' ? 'gamepush' : 'gamepush/ru';
    for (const [tela, nome] of [['gpPaisagem', 'landscape'], ['gpRetrato', 'portrait']]) {
      const [L, A] = TELAS[tela][0].split('x').map(Number);
      const tam = `${Math.round(L * TELAS[tela][1])}x${Math.round(A * TELAS[tela][1])}`;
      for (let k = 0; k < 5; k++) {
        const [nivel, jogadas, cartas, md] = PRINTS[k];
        await comChrome((c) => imprimir(c, nivel, jogadas, cartas, md, TELAS[tela][0], TELAS[tela][1], join(pasta, `${sub}/screenshot-${nome}-${k + 1}-${tam}.png`)));
      }
    }
  }
} else if (modo === 'gamepush-videos') {
  // o retrato sai do build da GamePush (o fim do mundo 3 e a entrada do 4, como o 2x3); a paisagem e a
  // gravacao 16x9 que ja esta em fontes/ (o build da Y8, em ingles: a tela e a mesma). A loja aceita ate
  // 20 s, sem audio: os dois sao cortados em 19,9 s, sem recodificar
  build = 'gamepush';
  idioma = 'en';
  const pasta = resolve(resto[0] || join(RAIZ, '../distribuicao/2048-cards'));
  await comChrome((c) => gravar(c, 21, 62, TELAS.v9x16[0], TELAS.v9x16[1], join(pasta, 'fontes/jogo-9x16.mp4'), 21, 750));
  for (const [de, para] of [['fontes/jogo-16x9.mp4', 'gamepush/video-landscape-1920x1080.mp4'], ['fontes/jogo-9x16.mp4', 'gamepush/video-portrait-1080x1920.mp4']]) {
    mkdirSync(dirname(join(pasta, para)), { recursive: true });
    const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', join(pasta, de), '-t', '19.9', '-an', '-c:v', 'copy', '-movflags', '+faststart', join(pasta, para)]);
    if (r.status !== 0) throw new Error(`ffmpeg: ${para}`);
    process.stdout.write(`${join(pasta, para)}\n`);
  }
} else {
  process.stdout.write('uso: node tools/video-portais.mjs <sondar|print|video|tudo|prints|videos|itch|gamepush|gamepush-videos> ...\n');
  process.exit(1);
}
