// Parametros de teste na URL. So valem em file://, localhost e 127.0.0.1:
// na Poki nada disso existe. Unico modulo que le a URL.
//   ?nivel=12        comeca na fase 12 (Aventura)
//   ?modo=classico   abre no Classico
//   ?auto=700        joga sozinho (uma acao a cada 700 ms)
//   ?fixo            sem a animacao de entrada
//   ?semanuncio      nao pede intervalo comercial (prints e testes longos)
//   ?lang=pt         forca o idioma (en, pt, es)
//   ?cenario=neon&skin=neon   visual (ids de cenarios.js e cartas.js)
//   ?regras={"colunas":5}     regras do laboratorio (JSON)
//   ?quadro=900      joga ate vencer e congela a transicao no instante dado (ms)
//   ?filme=12&dur=6000&larg=360   quadros JPEG em <pre id="filme"> (GIFs)
//   ?gesto=fila0>col2@300;tap:col1@900;tap:desc@1200;key:z@1500   gestos simulados (ms)
//   ?vitrine         mesa de demonstracao (todos os valores, pedra, gelo, especiais)
//   ?semhud          esconde o HUD (thumb)
//   ?menu            abre o menu ao carregar
//
// Fora disso, so o banco de testes de tools/sdkcheck.html liga os ganchos
// (window.__cards2048Teste = { nivel, fixo }); nesse caso "local" continua
// falso, para o jogo se comportar como na Poki (sem premio sem SDK).

export function lerDepuracao() {
  const base = {
    local: false, ganchos: false, nivel: 0, modo: '', auto: 0, fixo: false, semAnuncio: false, lang: '',
    cenario: '', skin: '', regras: null, quadro: -1, filme: 0, dur: 0, larg: 0, semHud: false, menu: false, gesto: '', vitrine: false,
  };
  let local = false;
  try {
    local = location.protocol === 'file:' || /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  } catch {
    local = false;
  }
  const teste = /** @type {any} */ (globalThis).__cards2048Teste;
  if (!local && teste && typeof teste === 'object') {
    return Object.assign(base, { ganchos: true, nivel: Math.max(0, teste.nivel | 0), fixo: !!teste.fixo, modo: teste.modo || '' });
  }
  if (!local) return base;
  const q = new URLSearchParams(location.search || location.hash.slice(1));
  const num = (k, d) => (q.has(k) ? Number(q.get(k)) || d : 0);
  let regras = null;
  try { regras = q.has('regras') ? JSON.parse(q.get('regras') || 'null') : null; } catch { regras = null; }
  return Object.assign(base, {
    local: true,
    ganchos: true,
    nivel: q.has('nivel') ? Math.max(1, parseInt(q.get('nivel') || '1', 10) || 1) : 0,
    modo: q.get('modo') || '',
    auto: q.has('auto') ? Math.max(120, num('auto', 700)) : 0,
    fixo: q.has('fixo'),
    semAnuncio: q.has('semanuncio') || q.has('quadro') || q.has('filme'),
    lang: q.get('lang') || '',
    cenario: q.get('cenario') || '',
    skin: q.get('skin') || '',
    regras,
    quadro: q.has('quadro') ? Number(q.get('quadro')) || 0 : -1,
    filme: num('filme', 12),
    dur: num('dur', 6000),
    larg: num('larg', 360),
    semHud: q.has('semhud'),
    menu: q.has('menu'),
    gesto: q.get('gesto') || '',
    vitrine: q.has('vitrine'),
  });
}
