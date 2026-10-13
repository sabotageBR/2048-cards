// Grafico da curva de dificuldade em docs/escada/curva.png: mede os 40 niveis
// (5 mundos x 8, cada mundo numa mesa so) com o jogador casual (medir.mjs) e
// desenha tools/curva.html pelo Chrome headless.
// Uso: node tools/curva.mjs [saida.png]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { servir, RAIZ } from './servir.mjs';
import { MUNDOS, POR_MUNDO, FAIXA_CASUAL } from '../src/jogo/fases.js';
import { medirMundo } from './medir.mjs';

const NOMES = { coringa: 'só cartas (+ coringa)', bomba: '+ bomba', dobro: '+ dobro', quadruplo: '+ ×4', colunas: '3 colunas' };
const saida = resolve(process.argv[2] || join(RAIZ, 'docs/escada/curva.png'));
const niveis = MUNDOS.flatMap((m) => medirMundo(m.id).niveis);
const d = {
  depois: niveis.map((nv) => nv.casual), alvo: niveis.map((nv) => nv.alvo), faixa: FAIXA_CASUAL,
  chefes: MUNDOS.map((m) => m.id * POR_MUNDO), jogadas: niveis.map((nv) => nv.jogadas),
  mundos: MUNDOS.map((m) => `Mundo ${m.id} · ${NOMES[m.novidade.tipo]}`),
};

const porta = 4353;
const fechar = await servir(porta);
const perfil = mkdtempSync(join(tmpdir(), 'c2-curva-'));
mkdirSync(dirname(saida), { recursive: true });
await new Promise((ok) => {
  const p = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${perfil}`, '--window-size=1200,680', '--force-device-scale-factor=2', '--virtual-time-budget=2000', `--screenshot=${saida}`,
    `http://127.0.0.1:${porta}/tools/curva.html?d=${encodeURIComponent(JSON.stringify(d))}`], { stdio: 'ignore' });
  const t = setTimeout(() => p.kill('SIGKILL'), 90000);
  p.on('close', () => { clearTimeout(t); ok(); });
});
rmSync(perfil, { recursive: true, force: true });
await fechar();
process.stdout.write(`curva -> ${relative(RAIZ, saida)}\n`);
