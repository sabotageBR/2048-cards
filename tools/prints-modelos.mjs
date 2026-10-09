// Prints do laboratorio: cada par cenario x skin em retrato (390x844) na
// vitrine, mais paisagem e desktop para os pares "naturais", e folhas de
// comparacao (uma por cenario, uma por skin e a visao geral da grade).
// Uso: node tools/prints-modelos.mjs [--rapido]   (saida em modelos/prints/)
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { servir, RAIZ } from './servir.mjs';
import { shot } from './shot.mjs';

const CENARIOS = ['neon', 'feltro', 'doce', 'taverna', 'espaco', 'minimal'];
const SKINS = ['neon', 'classico', 'blocos', 'gemas', 'pixel', 'papel'];
const NATURAIS = { neon: 'neon', feltro: 'classico', doce: 'blocos', taverna: 'papel', espaco: 'gemas', minimal: 'pixel' };
const saida = join(RAIZ, 'modelos/prints');
const rapido = process.argv.includes('--rapido');
mkdirSync(saida, { recursive: true });
const porta = 5353;
const fechar = await servir(porta);
const t0 = Date.now();
const q = (c, s) => `vitrine&fixo&semanuncio&cenario=${c}&skin=${s}&lang=en`;
for (const c of CENARIOS) {
  for (const s of SKINS) {
    if (rapido && NATURAIS[c] !== s) continue;
    await shot(porta, q(c, s), '390x844', join(saida, `retrato-${c}-${s}.png`), 1800);
  }
  await shot(porta, q(c, NATURAIS[c]), '844x390', join(saida, `paisagem-${c}-${NATURAIS[c]}.png`), 1800);
  await shot(porta, q(c, NATURAIS[c]), '1280x720', join(saida, `desktop-${c}-${NATURAIS[c]}.png`), 1800);
  process.stdout.write(`${c}: ok (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
}
await fechar();
// folhas de comparacao (ImageMagick montage)
const montage = (arqs, cols, out, rotulos) => {
  if (!arqs.every(existsSync)) return;
  const args = ['-background', '#1b1626', '-fill', 'white', '-font', 'DejaVu-Sans-Bold', '-pointsize', '28', '-geometry', '+8+8', '-tile', `${cols}x`];
  for (let i = 0; i < arqs.length; i++) args.push('-label', rotulos[i], arqs[i]);
  args.push(out);
  const r = spawnSync('montage', args, { encoding: 'utf8' });
  if (r.status !== 0) process.stdout.write(`montage falhou: ${r.stderr}\n`);
};
if (!rapido) {
  for (const c of CENARIOS) montage(SKINS.map((s) => join(saida, `retrato-${c}-${s}.png`)), 6, join(saida, `folha-cenario-${c}.png`), SKINS.map((s) => `skin ${s}`));
  for (const s of SKINS) montage(CENARIOS.map((c) => join(saida, `retrato-${c}-${s}.png`)), 6, join(saida, `folha-skin-${s}.png`), CENARIOS.map((c) => `cenario ${c}`));
}
montage(CENARIOS.map((c) => join(saida, `paisagem-${c}-${NATURAIS[c]}.png`)), 2, join(saida, 'folha-paisagem.png'), CENARIOS.map((c) => `${c} + ${NATURAIS[c]}`));
montage(CENARIOS.map((c) => join(saida, `desktop-${c}-${NATURAIS[c]}.png`)), 2, join(saida, 'folha-desktop.png'), CENARIOS.map((c) => `${c} + ${NATURAIS[c]}`));
process.stdout.write(`prints em modelos/prints (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
