// Um Chrome headless proprio, falado pelo DevTools Protocol, para as ferramentas dos portais.
// Cada um tem perfil temporario e porta propria, e fechar() mata so ele.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const espera = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{ portaDep: number, argumentos?: string[] }} o
 */
export async function abrirChrome({ portaDep, argumentos = [] }) {
  // um Chrome esquecido na porta responderia no lugar do novo, com a pagina errada
  const ocupada = await fetch(`http://127.0.0.1:${portaDep}/json/version`).then(() => true, () => false);
  if (ocupada) throw new Error(`a porta ${portaDep} ja tem um Chrome`);
  const perfil = mkdtempSync(join(tmpdir(), 'c2-chrome-'));
  const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--lang=en-US', '--accept-lang=en-US', `--remote-debugging-port=${portaDep}`, `--user-data-dir=${perfil}`,
    '--window-size=1280,720', ...argumentos, 'about:blank'], { stdio: 'ignore' });
  // morto por timeout ou Ctrl-C, nao deixa o Chrome para tras
  const largar = () => { chrome.kill('SIGKILL'); process.exit(130); };
  process.once('SIGTERM', largar);
  process.once('SIGINT', largar);
  let alvo = null;
  for (let k = 0; k < 80 && !alvo; k++) {
    await espera(250);
    try { alvo = (await (await fetch(`http://127.0.0.1:${portaDep}/json`)).json()).find((t) => t.type === 'page') || null; } catch { /* ignora */ }
  }
  if (!alvo) {
    chrome.kill('SIGKILL');
    throw new Error(`o Chrome nao abriu a porta ${portaDep}`);
  }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pendentes = new Map();
  /** @type {Map<string, ((params:any) => void)[]>} */
  const ouvintes = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(String(ev.data));
    if (m.id && pendentes.has(m.id)) { pendentes.get(m.id)(m); pendentes.delete(m.id); }
    for (const f of ouvintes.get(m.method) || []) f(m.params);
  });
  const cmd = (/** @type {string} */ method, params = {}) => new Promise((r) => { const i = ++id; pendentes.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return {
    cmd,
    /** Avalia na pagina e devolve o valor (promessas sao esperadas). */
    av: async (/** @type {string} */ expr) => (await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value,
    /** @param {string} metodo @param {(params:any) => void} fn */
    ao(metodo, fn) { ouvintes.set(metodo, [...(ouvintes.get(metodo) || []), fn]); },
    async fechar() {
      process.off('SIGTERM', largar);
      process.off('SIGINT', largar);
      try { ws.close(); } catch { /* ignora */ }
      chrome.kill('SIGKILL');
      await espera(200);
      rmSync(perfil, { recursive: true, force: true });
    },
  };
}
