// Obstaculos da Aventura: pedra (fundo da coluna, com hp), gelo (carta que
// nao funde ate uma fusao na coluna), cadeado (coluna trancada ate um
// gatilho) e chefe (teto 4096). Monta a mesa inicial de uma fase.
import { ehPedra } from './regras.js';

/**
 * Mesa inicial da fase: pedras, cartas de inicio (fundo -> topo), gelo e
 * cadeados. Devolve { colunas, cadeados, proxId, pedrasTotal }.
 */
export function montarMesa(fase, regras, proxId) {
  const colunas = [];
  for (let c = 0; c < regras.colunas; c++) colunas.push([]);
  const obst = fase.obst || {};
  let pedrasTotal = 0;
  for (const [c, hp] of Object.entries(obst.pedras || {})) {
    const i = Number(c);
    if (i < colunas.length) { colunas[i].push({ id: proxId++, tipo: 'pedra', v: 0, cor: 0, hp: Math.max(1, hp | 0) }); pedrasTotal++; }
  }
  (fase.inicio || []).forEach((valores, c) => {
    if (c >= colunas.length) return;
    for (const v of valores) colunas[c].push({ id: proxId++, tipo: 'normal', v, cor: regras.naipes ? (proxId % 4) : 0 });
  });
  for (const [c, valores] of Object.entries(obst.gelo || {})) {
    const i = Number(c);
    if (i >= colunas.length) continue;
    for (const v of valores) colunas[i].push({ id: proxId++, tipo: 'normal', v, cor: regras.naipes ? (proxId % 4) : 0, gelo: true });
  }
  const cadeados = {};
  for (const [c, g] of Object.entries(obst.cadeados || {})) if (Number(c) < colunas.length) cadeados[c] = { ...g };
  return { colunas, cadeados, proxId, pedrasTotal };
}

/** O gatilho do cadeado ja foi cumprido? */
export function gatilhoCumprido(g, estado) {
  switch (g.tipo) {
    case 'valor': return (estado.cartasFeitas[g.v] || 0) >= (g.n || 1);
    case 'fusoes': return estado.fusoes >= (g.n || 1);
    case 'montes': return estado.montes >= (g.n || 1);
    case 'pedras': return estado.pedrasTotal > 0 && estado.pedrasQuebradas >= estado.pedrasTotal;
    case 'jogadas': return estado.n >= (g.n || 1);
    default: return false;
  }
}

/** Abre os cadeados cujo gatilho foi cumprido (evento 'cadeado'). */
export function abrirCadeados(estado, eventos) {
  const chaves = Object.keys(estado.cadeados);
  if (!chaves.length) return estado;
  let mudou = false;
  const cadeados = { ...estado.cadeados };
  for (const c of chaves) {
    if (gatilhoCumprido(cadeados[c], estado)) {
      delete cadeados[c];
      eventos.push({ tipo: 'cadeado', c: Number(c) });
      mudou = true;
    }
  }
  return mudou ? { ...estado, cadeados } : estado;
}

/** Quantas pedras ainda ha na mesa. */
export function pedrasNaMesa(colunas) {
  let n = 0;
  for (const col of colunas) if (col.length && ehPedra(col[0])) n++;
  return n;
}
