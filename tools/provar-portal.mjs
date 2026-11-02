// Prova um build de portal num Chrome de verdade, pelo DevTools Protocol: serve o ZIP ENTREGUE
// extraido, por um nome de host de fora (como no portal: sem os parametros de teste nem o anuncio
// simulado de localhost) e confere o que so aparece com o jogo rodando: a regra fixa em juntar, os
// botoes de video sumindo, uma jogada com o mouse de verdade, a pausa parando o relogio inteiro e,
// na Y8, os anuncios com um SDK falso. Com pasta, grava as telas que a CrazyGames olha.
// Uso: node tools/provar-portal.mjs <y8|crazygames> [pasta das telas]
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { RAIZ, servir } from './servir.mjs';
import { abrirChrome, espera } from './chrome-cdp.mjs';

const portal = process.argv[2];
if (portal !== 'y8' && portal !== 'crazygames') {
  process.stdout.write('uso: node tools/provar-portal.mjs <y8|crazygames> [pasta das telas]\n');
  process.exit(1);
}
const pastaTelas = process.argv[3] ? resolve(process.argv[3]) : null;
const porta = 6100, portaDep = 9610;
const HOST = 'jogo.portal.test';
const TAMANHOS = [[800, 450], [821, 462], [907, 510], [1080, 607], [1920, 1080], [390, 844]];
const SDK_Y8 = 'https://cdn.y8.com/minimal-sdk/2-0/y8.min.js';
// o SDK da Y8 fingido pela prova: so o que o adaptador usa
const Y8_FALSO = `(function () {
  window.__y8 = { pedidos: [], modo: 'visto', ms: 900 };
  var sdk = {
    init: function () { return Promise.resolve(); },
    getPlatformLocale: function () { return Promise.resolve('pt-BR'); },
    showAd: function (c) {
      __y8.pedidos.push(c.type);
      if (__y8.modo === 'mudo') return;
      if (c.beforeReward) c.beforeReward(function () {});
      setTimeout(function () {
        c.beforeAd();
        setTimeout(function () {
          if (__y8.modo === 'visto' && c.adViewed) c.adViewed();
          if (__y8.modo === 'fechou' && c.adDismissed) c.adDismissed();
          c.afterAd();
          c.adBreakDone({ breakStatus: 'viewed' });
        }, __y8.ms);
      }, 300);
    },
  };
  window.y8 = { sdk: function () { return sdk; }, emitReadyEvent: function () { window.dispatchEvent(new Event('y8sdk.ready')); } };
})();`;

const pastaZip = join(RAIZ, '../distribuicao/2048-cards', portal);
const nomeZip = readdirSync(pastaZip).find((n) => n.endsWith('.zip'));
if (!nomeZip) {
  process.stdout.write(`sem zip em ${pastaZip}: rode node tools/empacotar-portal.mjs ${portal}\n`);
  process.exit(1);
}
const build = mkdtempSync(join(tmpdir(), 'c2-prova-'));
if (spawnSync('unzip', ['-q', join(pastaZip, nomeZip), '-d', build]).status !== 0) throw new Error('nao extraiu o zip');
const fechar = await servir(porta, build);
const c = await abrirChrome({ portaDep, argumentos: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`] });
const { cmd, av } = c;

const falhas = [];
const conferir = (ok, msg) => { process.stdout.write(`${ok ? 'ok   ' : 'FALHA'} ${msg}\n`); if (!ok) falhas.push(msg); };
const erros = [];
const pedidos = [];
c.ao('Runtime.exceptionThrown', (p) => erros.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text));
c.ao('Network.requestWillBeSent', (p) => pedidos.push(p.request.url));
await cmd('Page.enable');
await cmd('Runtime.enable');
await cmd('Network.enable');

const foraUrl = `http://${HOST}:${porta}/index.html`;
const localUrl = `http://127.0.0.1:${porta}/index.html`;

/**
 * Abre o jogo do zero. teste = os ganchos de tools/sdkcheck (__cards2048Teste), que ligam o __c2
 * sem nenhum parametro de localhost; save = o que ja estava no armazenamento do jogador.
 */
async function abrir(url, { teste = null, save = null } = {}) {
  await cmd('Page.navigate', { url: new URL(url).origin + '/LICENCAS.txt' });
  await espera(150);
  await av('localStorage.clear()');
  const fonte = `${teste ? `window.__cards2048Teste = ${JSON.stringify(teste)};` : ''}${save ? `localStorage.setItem('cards2048.save', ${JSON.stringify(JSON.stringify(save))});` : ''}`;
  const reg = fonte ? await cmd('Page.addScriptToEvaluateOnNewDocument', { source: fonte }) : null;
  await cmd('Page.navigate', { url });
  for (let k = 0; k < 60 && (await av("document.readyState !== 'complete' || !document.getElementById('rotulo').textContent")); k++) await espera(100);
  if (reg) await cmd('Page.removeScriptToEvaluateOnNewDocument', { identifier: reg.result.identifier });
  await espera(250);
}
const regra = () => av('JSON.stringify({ perfil: __c2.J.e.perfil, juntar: __c2.J.e.regras.juntar, n: __c2.J.n })');
const jogaJuntar = (s) => { const r = JSON.parse(s || '{}'); return r.perfil === 'juntar' && r.juntar === true; };

// ------------------------------------------------- 1. como o jogador recebe
pedidos.length = 0;
await abrir(foraUrl);
await espera(1200);
conferir(await av('document.title') === '2048 Cards', 'o titulo e 2048 Cards');
conferir(/1/.test((await av("document.getElementById('rotulo').textContent")) || ''), `o jogo abriu (${await av("document.getElementById('rotulo').textContent")})`);
conferir(await av('typeof window.__c2') === 'undefined', 'fora de localhost nao ha ganchos de teste');
const pintou = await av("(() => { const cv = document.getElementById('cena'); const d = cv.getContext('2d').getImageData(cv.width / 2, cv.height / 2, 1, 1).data; return d[3]; })()");
conferir(pintou === 255, 'a cena foi desenhada');
conferir(await av("document.body.classList.contains('sem-anuncio')"), 'sem anuncios, o corpo marca sem-anuncio');
conferir(await av("['vDescarte', 'vCoringa', 'bFimVideo'].every((id) => getComputedStyle(document.getElementById(id)).display === 'none')"), 'os botoes de video somem');
const externos = [...new Set(pedidos.filter((u) => /^https?:/.test(u) && !u.includes(`${HOST}:${porta}`)))];
process.stdout.write(`     pedidos externos: ${externos.join(' ') || 'nenhum'}\n`);
conferir(!pedidos.some((u) => /poki/i.test(u)), 'nenhum pedido a outro portal');
if (portal === 'y8') conferir(externos.length === 0, 'a Y8 sem ids nao pede nada de fora');
else conferir(externos.every((u) => /crazygames\.com/.test(u)), 'a CrazyGames so pede o SDK dela');

// ------------------------------------------------- 2. a regra: ninguem cai em hoje
for (let k = 0; k < 6; k++) {
  await abrir(foraUrl, { teste: {} });
  const r = await regra();
  conferir(jogaJuntar(r), `jogador novo ${k + 1}: ${r}`);
}
for (const nivel of [1, 9, 17, 25, 33, 41, 49]) {
  await abrir(foraUrl, { teste: { nivel } });
  const r = await regra();
  conferir(jogaJuntar(r), `fase ${nivel}: ${r}`);
}
const partidaHoje = await (async () => {
  await abrir(foraUrl, { teste: { nivel: 12 } });
  return av(`JSON.stringify({ ...__c2.J.e, perfil: 'hoje', regras: { ...__c2.J.e.regras, juntar: false } })`);
})();
await abrir(foraUrl, { teste: {}, save: { v: 2, fase: 12, max: 12, variante: { regra: 'hoje' }, partida: { n: 12, e: JSON.parse(partidaHoje), tentativas: 0 } } });
{
  const r = await regra();
  conferir(jogaJuntar(r), `save antigo com braco e partida no hoje: ${r}`);
}
await abrir(`${localUrl}?variante=hoje&regras=${encodeURIComponent('{"juntar":false}')}`);
{
  const r = await regra();
  conferir(jogaJuntar(r), `em localhost, com ?variante=hoje e ?regras: ${r}`);
}

// ------------------------------------------------- 3. o mouse de verdade
await abrir(foraUrl, { teste: {} });
await espera(500);
const centro = (col, k) => av(`(() => { const p = __c2.cena.L.carta(${col}, ${k}); return [p.x + p.w / 2, p.y + p.h / 2]; })()`);
const mouse = (type, [x, y], extra = {}) => cmd('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...extra });
const colunas = () => av('JSON.stringify(__c2.J.e.colunas.map((c) => c.map((k) => k.v)))');
conferir(await colunas() === '[[8,4],[],[2],[]]', `a abertura guiada: ${await colunas()}`);
const pt2 = await centro(2, 0);
await mouse('mousePressed', pt2);
await mouse('mouseReleased', pt2);
await espera(500);
conferir(await colunas() === '[[8,4],[],[4],[]]', `o clique joga a carta da mao: ${await colunas()}`);
const de = await centro(2, 0), para = await centro(0, 1);
await mouse('mousePressed', de);
for (let k = 1; k <= 8; k++) await mouse('mouseMoved', [de[0] + ((para[0] - de[0]) * k) / 8, de[1] + ((para[1] - de[1]) * k) / 8]);
await mouse('mouseReleased', para);
await espera(900);
conferir((await av('__c2.J.n')) === 2 && (await colunas()) === '[[16],[],[],[]]', `arrastar o topo ate o topo igual junta, em cascata, e sobe de nivel: ${await colunas()}`);

// ------------------------------------------------- 4. a pausa para o jogo inteiro
const instante = () => av('JSON.stringify({ agora: __c2.J.agora, tVis: __c2.J.tVis, tJogo: __c2.J.tJogo, pausado: __c2.J.pausado, calado: __c2.audio.calado, relogio: __c2.relogio() })');
await av("window.__venceu = 0; __c2.J.agenda.push({ em: __c2.J.agora + 700, fn: () => { window.__venceu = 1; } })");
await av("window.dispatchEvent(new Event('blur'))");
await espera(150);
const a = JSON.parse(await instante());
await espera(2000);
const b = JSON.parse(await instante());
conferir(a.pausado && a.agora === b.agora && a.tVis === b.tVis && a.tJogo === b.tJogo && a.relogio === b.relogio, `sem foco, o relogio do jogo para (${a.agora.toFixed(0)} -> ${b.agora.toFixed(0)})`);
conferir(a.calado, 'sem foco, o som muta');
conferir(await av('document.body.classList.contains("pausado")'), 'sem foco, as animacoes CSS param');
conferir(await av('window.__venceu') === 0, 'sem foco, um prazo do jogo nao vence');
// o clique de volta: o toque le o relogio, e antes da troca para relogio() ele saltava toda a pausa
const livre = await av('(() => { const k = __c2.J.e.colunas.findIndex((c) => !c.length); const p = __c2.cena.L.carta(k, 0); return [p.x + p.w / 2, p.y + p.h / 2]; })()');
await mouse('mousePressed', livre);
await mouse('mouseReleased', livre);
await espera(60);
const d = JSON.parse(await instante());
conferir(!d.pausado && d.agora - b.agora < 1000, `o clique de volta solta a pausa sem saltar o relogio (${b.agora.toFixed(0)} -> ${d.agora.toFixed(0)}, pausa de ${(2150 / 1000).toFixed(1)} s)`);
conferir(!d.calado, 'com o foco de volta, o som volta');
await espera(900);
conferir(await av('window.__venceu') === 1, 'o prazo vence depois da volta');
await av("window.dispatchEvent(new Event('blur'))");
await espera(100);
await av("window.dispatchEvent(new Event('focus'))");
await espera(300);
const e = JSON.parse(await instante());
conferir(!e.pausado && !e.calado, 'o evento focus tambem solta a pausa');
await av("Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange'))");
await espera(100);
const f = JSON.parse(await instante());
await espera(600);
const g = JSON.parse(await instante());
conferir(f.pausado && f.calado && f.agora === g.agora, 'aba escondida pausa e muta');
await av("delete document.hidden; document.dispatchEvent(new Event('visibilitychange'))");
await espera(200);
conferir(!JSON.parse(await instante()).pausado, 'a volta da aba solta a pausa');
await av('__c2.auto(250)');
await espera(3000);
const jogou = await av('JSON.stringify({ jogadas: __c2.J.e.n, estado: __c2.J.estado })');
conferir(JSON.parse(jogou).jogadas > 3, `continua jogando sem erro: ${jogou}`);
conferir(!erros.length, `sem excecao na pagina ${erros.slice(0, 3).join(' | ')}`);

// ------------------------------------------------- 5. SDK
if (portal === 'crazygames') {
  await abrir(localUrl);
  await espera(2500);
  const amb = await av('window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.environment');
  conferir(amb === 'local', `SDK real da CrazyGames carregado em localhost (ambiente ${amb})`);
  await abrir(foraUrl);
  await espera(2500);
  const fora = await av('window.CrazyGames && window.CrazyGames.SDK && window.CrazyGames.SDK.environment');
  process.stdout.write(`     SDK real fora dos dominios dela: ambiente ${fora}\n`);
  conferir(await av("document.body.classList.contains('sem-anuncio')"), 'CrazyGames: sem anuncios na Basic Launch, com o SDK de pe');
} else {
  // os ids e o SDK entram pela rede, sem refazer o zip: e o mesmo adaptador do envio final
  await cmd('Fetch.enable', { patterns: [{ urlPattern: '*src/core/ids.js*' }, { urlPattern: `${SDK_Y8}*` }] });
  c.ao('Fetch.requestPaused', (p) => {
    const sdk = p.request.url.startsWith(SDK_Y8);
    const corpo = sdk ? Y8_FALSO : "export const IDS = { appId: 'falso', gameId: '1' };\n";
    cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'text/javascript' }, { name: 'access-control-allow-origin', value: '*' }], body: Buffer.from(corpo).toString('base64') });
  });
  await abrir(foraUrl, { teste: { nivel: 5 } });
  await espera(600);
  conferir(!(await av("document.body.classList.contains('sem-anuncio')")), 'com ids e SDK, os botoes de video voltam');
  conferir(await av("document.getElementById('pontosTxt').textContent") === 'Pontos', 'o idioma do portal chega depois do init e troca a tela');
  conferir(await av("document.getElementById('bContinuar').textContent") === 'Continuar', 'o idioma do portal troca o menu');
  const encher = "__c2.J.e = { ...__c2.J.e, descarteCarga: 0 }; __c2.J.video.usado = {}; __c2.J.estado === 'jogando'";
  const agoraJ = () => av('JSON.stringify({ pausado: __c2.J.pausado, calado: __c2.audio.calado, agora: __c2.J.agora, estado: __c2.J.estado, carga: __c2.J.e.descarteCarga })');
  await av("__y8.modo = 'fechou'");
  await av(encher);
  await av("document.getElementById('vDescarte').click()");
  await espera(120);
  const p0 = JSON.parse(await agoraJ());
  conferir(!p0.pausado && !p0.calado && p0.estado === 'anuncio', 'no pedido, o som e o relogio seguem');
  await espera(600);
  const p1 = JSON.parse(await agoraJ());
  await espera(400);
  const p2 = JSON.parse(await agoraJ());
  conferir(p1.pausado && p1.calado && p1.agora === p2.agora, 'quando o anuncio comeca, muta e para o relogio');
  await espera(800);
  const p3 = JSON.parse(await agoraJ());
  conferir(!p3.pausado && !p3.calado && p3.estado === 'jogando' && p3.carga === 0, 'anuncio fechado no meio nao premia');
  conferir(p3.agora - p2.agora < 1200, `a volta do anuncio nao salta o relogio (${p2.agora.toFixed(0)} -> ${p3.agora.toFixed(0)})`);
  await av("__y8.modo = 'visto'");
  await av(encher);
  await av("document.getElementById('vDescarte').click()");
  await espera(2000);
  conferir(JSON.parse(await agoraJ()).carga > 0, 'anuncio visto ate o fim premia');
  await av("__y8.modo = 'mudo'");
  await av(encher);
  await av("document.getElementById('vDescarte').click()");
  await espera(10600);
  const p4 = JSON.parse(await agoraJ());
  conferir(p4.estado === 'jogando' && !p4.pausado, 'SDK sem resposta: o jogo volta sozinho no prazo');
  conferir(await av('__c2.portal.sdkPronto') === false && await av("document.body.classList.contains('sem-anuncio')"), 'SDK sem resposta: os anuncios desligam na sessao e os botoes somem');
  await cmd('Fetch.disable');
}
conferir(!erros.length, `sem excecao na pagina ${erros.slice(0, 3).join(' | ')}`);

if (pastaTelas) {
  mkdirSync(pastaTelas, { recursive: true });
  await abrir(foraUrl, { teste: { nivel: 12, fixo: true } });
  await av('__c2.auto(150)');
  await espera(3000);
  await av('__c2.J.autoProx = 1e15');
  for (const [l, h] of TAMANHOS) {
    await cmd('Emulation.setDeviceMetricsOverride', { width: l, height: h, deviceScaleFactor: 1, mobile: false });
    await espera(700);
    const s = await cmd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(pastaTelas, `${portal}-${l}x${h}.png`), Buffer.from(s.result.data, 'base64'));
  }
}
await c.fechar();
await fechar();
rmSync(build, { recursive: true, force: true });
process.stdout.write(`${falhas.length ? `${falhas.length} FALHAS` : 'tudo ok'} (${nomeZip})\n`);
process.exit(falhas.length ? 1 : 0);
