// Grafico da curva de dificuldade em docs/duelo/curva.png: mede as 40 fases
// com o jogador casual (medir.mjs) e desenha tools/curva.html pelo Chrome
// headless, com a curva de antes do ajuste de 2026-10-11 (ANTES) para
// comparar. Uso: node tools/curva.mjs [saida.png]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { servir, RAIZ } from './servir.mjs';
import { FASES, POR_MUNDO, posNoMundo, FAIXA_CASUAL } from '../src/jogo/fases.js';
import { medirFase } from './medir.mjs';

/**
 * Vitorias do casual (%) antes do ajuste (2026-10-11, 40 partidas por fase,
 * tentativas 0..39): o serrote com a parede na fase 7 que o usuario achou.
 */
const ANTES = [100, 100, 100, 93, 78, 100, 43, 53, 98, 83, 100, 75, 98, 95, 43, 70, 95, 98, 65, 80,
  80, 90, 65, 35, 100, 100, 85, 63, 85, 83, 40, 40, 95, 70, 90, 78, 83, 48, 50, 33];

const saida = resolve(process.argv[2] || join(RAIZ, 'docs/duelo/curva.png'));
const medidas = FASES.map((f) => medirFase(f));
const d = {
  antes: ANTES, depois: medidas.map((m) => m.casual), alvo: medidas.map((m) => m.alvo), faixa: FAIXA_CASUAL,
  chefes: FASES.filter((f) => posNoMundo(f.id) === POR_MUNDO).map((f) => f.id), jogadas: medidas.map((m) => m.jogadasCasual),
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
