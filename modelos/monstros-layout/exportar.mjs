// Exporta cada silhueta num PNG quadrado (referencia da pintura) ou a folha
// de conferencia. Uso: node modelos/monstros-layout/exportar.mjs [--folha] [01 02]
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { servir } from '../../tools/servir.mjs';
import { CATALOGO } from './catalogo.js';

function chrome(args) {
  return new Promise((ok) => {
    const p = spawn('google-chrome', args, { stdio: ['ignore', 'pipe', 'ignore'] });
    const t = setTimeout(() => p.kill('SIGKILL'), 60000);
    p.on('close', () => { clearTimeout(t); ok(); });
  });
}

async function shot(porta, url, w, h, saida) {
  const perfil = mkdtempSync(join(tmpdir(), 'ml-'));
  await chrome([
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', `--user-data-dir=${perfil}`,
    `--window-size=${w},${h}`, '--virtual-time-budget=3000', '--screenshot=' + saida, url,
  ]);
  rmSync(perfil, { recursive: true, force: true });
}

const pasta = dirname(fileURLToPath(import.meta.url));
const porta = 5367;
const fechar = await servir(porta);
const base = `http://127.0.0.1:${porta}/modelos/monstros-layout/exportar.html`;
try {
  if (process.argv.includes('--folha')) {
    await shot(porta, base + '?folha=1', 1600, 940, join(pasta, 'folha.png'));
  } else {
    const pedidos = process.argv.slice(2).filter((a) => /^\d\d$/.test(a));
    const lista = pedidos.length ? CATALOGO.filter((m) => pedidos.includes(m.id)) : CATALOGO;
    const dir = join(pasta, 'desenhos');
    mkdirSync(dir, { recursive: true });
    const fila = lista[Symbol.iterator]();
    const um = async () => {
      for (;;) {
        const passo = fila.next();
        if (passo.done) return;
        const id = passo.value.id;
        await shot(porta, `${base}?id=${id}`, 640, 640, join(dir, `${id}.png`));
        process.stdout.write(id + '\n');
      }
    };
    await Promise.all([um(), um(), um()]);
  }
} finally {
  await fechar();
}
