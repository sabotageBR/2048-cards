// O index.html do build da GamePush (so o empacotador e os testes usam este arquivo; ele nao vai no
// zip). A pagina do jogo ganha:
// - a promessa window.__gp, que o callback onGPInit resolve com o gp, ANTES do carregador oficial;
// - o carregador oficial do painel (Public Zone > Install Code), copiado sem mudar nada alem do
//   projectId e do publicToken;
// - o comeco do jogo (iniciarJogo): o src/main.js so entra quando o SDK chega, quando os quatro
//   enderecos do SDK falham (bloqueador, sem rede) ou em ESPERA_SDK_MS desde a abertura;
// - a tela de carregamento #carregando (cartas pulando, sem texto), que o portal tira no primeiro
//   quadro do jogo;
// - src/ui/plataforma.css (o cirilico do russo, o toque longo do iOS, a tela de carregamento e o
//   rotulo VIDEO dos botoes de premiado) e o rotulo nos tres botoes de video.
import { ESPERA_SDK_MS } from './gamepush.js';

/** O projeto do jogo no painel da GamePush (publicos: vao no HTML). */
export const GAMEPUSH = Object.freeze({ projectId: '32795', publicToken: 'LYIXUhygYxQsMmyYulu5blk0xXUVOQZ3' });

/** Os quatro enderecos do SDK, em base64, como no carregador oficial. */
export const SDK_B64 = 'aHR0cHM6Ly9ncy5lcG9uZXNoLmNvbS9zZGsvZ2FtZS1zY29yZS5qcyxodHRwczovL3MzLmdhbWVwdXNoLmNvbS9maWxlcy9ncy9zZGsvZ2FtZS1zY29yZS5qcyxodHRwczovL3MzLWV1LmdhbWVwdXNoLmNvbS9zZGsvZ2FtZS1zY29yZS5qcyxodHRwczovL2dhbWVwdXNoLmNvbS9zZGsvZ2FtZS1zY29yZS5qcw==';
/** Os hosts desses enderecos: as unicas URLs externas que o build pode pedir. */
export const HOSTS_SDK = Object.freeze(Buffer.from(SDK_B64, 'base64').toString('utf8').split(',').map((u) => new URL(u).hostname));

/**
 * O carregador oficial, exatamente como o painel o entrega.
 * @param {{projectId:string, publicToken:string}} ids
 */
export const carregadorOficial = ({ projectId, publicToken }) => `<script>
((s,c,o,r,e)=>{var f=0,p=0,t={},a=r.map(()=>new AbortController),l=u=>{t[u]=1;var d=c.createElement(o);d.async=1;d.src=u+e;d.onerror=()=>{d.remove();n()};var g=c.getElementsByTagName(o)[0];g.parentNode.insertBefore(d,g)},n=()=>{var u=r.find(u=>!t[u]);u&&l(u)},j=u=>{if(f)return;f=1;a.forEach(x=>x.abort());u?l(u):n()},q=()=>{++p>=r.length&&j()};r.forEach((u,i)=>s.fetch(u,{method:"HEAD",signal:a[i].signal}).then(x=>x.ok?j(u):q()).catch(q));s.setTimeout(j,5000)})(window,document,"script",atob("${SDK_B64}").split(","),"?projectId=${projectId}&publicToken=${publicToken}&callback=onGPInit");
</script>`;

/** Guarda o gp numa promessa: o jogo (modulos ES) roda depois de o SDK chamar o callback. */
export const PROMESSA_GP = '<script>window.__gp = new Promise(function (ok) { window.onGPInit = ok; });</script>';

/**
 * O comeco do jogo. Vai para a pagina pelo toString, entao e autocontido e em ES5.
 * @param {any} w a janela
 * @param {any} d o documento
 * @param {number} esperaMs
 */
export function iniciarJogo(w, d, esperaMs) {
  var foi = false;
  var falhas = 0;
  function comecar() {
    if (foi) return;
    foi = true;
    var s = d.createElement('script');
    s.type = 'module';
    s.src = 'src/main.js';
    d.body.appendChild(s);
  }
  // o SDK chegou: o jogo ja abre no idioma da plataforma
  w.__gp.then(comecar);
  // sem o SDK no prazo, o jogo abre assim mesmo, inteiro e sem anuncio
  w.setTimeout(comecar, esperaMs);
  // os quatro enderecos do SDK falharam (bloqueador, sem rede): nao ha o que esperar
  w.addEventListener('error', function (e) {
    var t = e && e.target;
    if (t && t.tagName === 'SCRIPT' && /\/game-score\.js(\?|$)/.test(t.src || '') && ++falhas >= 4) comecar();
  }, true);
  // o cirilico do russo (src/ui/plataforma.css) chega enquanto o SDK carrega
  if (d.fonts && d.fonts.load) {
    ['600', '700'].forEach(function (peso) {
      d.fonts.load(peso + ' 20px Fredoka', 'Мир').then(null, function () {});
    });
  }
}

/** A tela de carregamento: tres cartas sem numero pulando. */
export const CARREGANDO = '<div id="carregando" aria-hidden="true"><div class="cartas"><i></i><i></i><i></i></div></div>';
/** O rotulo VIDEO dos botoes de premiado (o texto vem do CSS, pelo idioma do <html lang>). */
export const ROTULO_VIDEO = '<small class="rotulo-video"></small>';

/** O script do jogo no index.html de origem: e trocado pelo bloco da GamePush. */
const JOGO = '<script type="module" src="src/main.js"></script>';
const ESTILO = '<link rel="stylesheet" href="src/ui/estilo.css">';

/**
 * Troca `de` por `para` exatamente `vezes` vezes; outra contagem quer dizer que o index.html mudou.
 * @param {string} html @param {string} de @param {string} para @param {number} [vezes]
 */
function trocar(html, de, para, vezes = 1) {
  const n = html.split(de).length - 1;
  if (n !== vezes) throw new Error(`index.html: esperava ${vezes}x "${de}", achei ${n}`);
  return html.split(de).join(para);
}

/** O bloco que entra no lugar do script do jogo. @param {{projectId:string, publicToken:string}} ids */
export const blocoGamePush = (ids) => `${PROMESSA_GP}\n${carregadorOficial(ids)}\n<script>(${iniciarJogo.toString()})(window, document, ${ESPERA_SDK_MS});</script>`;

/**
 * O index.html da GamePush a partir do do jogo (ja sem a tag do outro SDK).
 * @param {string} html
 * @param {{projectId:string, publicToken:string}} [ids]
 * @returns {string}
 */
export function paginaGamePush(html, ids = GAMEPUSH) {
  let h = trocar(html, ESTILO, `${ESTILO}\n<link rel="stylesheet" href="src/ui/plataforma.css">`);
  h = trocar(h, '<body>\n', `<body>\n${CARREGANDO}\n`);
  h = trocar(h, '<i class="selo-video" aria-hidden="true">🎬</i>', `<i class="selo-video" aria-hidden="true">🎬${ROTULO_VIDEO}</i>`, 2);
  h = trocar(h, '<i class="selo-inline" aria-hidden="true">🎬</i>', `<i class="selo-inline" aria-hidden="true">🎬${ROTULO_VIDEO}</i>`, 1);
  return trocar(h, JOGO, blocoGamePush(ids));
}
