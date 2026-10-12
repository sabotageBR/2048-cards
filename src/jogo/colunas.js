// Operacoes de coluna: colocar, fundir em cascata, descongelar, danificar a
// pedra, completar o monte. Funcoes puras: devolvem colunas novas e empurram
// eventos no vetor recebido.
import { ehPedra, fundeCom, topo } from './regras.js';

/**
 * Descongela as cartas da coluna depois de uma fusao.
 * @returns {any[]} coluna nova
 */
export function descongelar(col, c, eventos) {
  if (!col.some((k) => k.gelo)) return col;
  return col.map((k) => {
    if (!k.gelo) return k;
    eventos.push({ tipo: 'gelo', c, id: k.id });
    const { gelo: _g, ...resto } = k;
    return resto;
  });
}

/** Cada fusao na coluna tira 1 da pedra do fundo; com 0 ela quebra. lancada: pedra do monstro. */
export function danificarPedra(col, c, eventos) {
  if (!col.length || !ehPedra(col[0])) return { col, quebrou: false };
  const p = { ...col[0], hp: col[0].hp - 1 };
  if (p.hp <= 0) {
    eventos.push({ tipo: 'pedra', c, id: p.id, hp: 0, quebrou: true });
    return { col: col.slice(1), quebrou: true, lancada: !!p.lancada };
  }
  eventos.push({ tipo: 'pedra', c, id: p.id, hp: p.hp, quebrou: false });
  return { col: [p, ...col.slice(1)], quebrou: false };
}

/**
 * Funde o topo com a carta de baixo enquanto forem iguais (cascata).
 * A primeira fusao (carta nova no topo) ja aconteceu quando isto e chamado,
 * com degrau 1; aqui vem o resto. Cada fusao descongela a coluna e danifica
 * a pedra.
 * @returns {{ col: any[], degrau: number, valores: number[], pedras: number }}
 */
export function cascata(col, regras, c, eventos, degrau = 1, valores = []) {
  let pedras = 0;
  for (;;) {
    col = descongelar(col, c, eventos);
    const d = danificarPedra(col, c, eventos);
    col = d.col;
    if (d.quebrou && !d.lancada) pedras++; // a pedra do monstro nao conta para a meta
    if (col.length < 2) break;
    const t = col[col.length - 1];
    const b = col[col.length - 2];
    if (ehPedra(b) || b.gelo || t.gelo || b.tipo !== 'normal' || t.tipo !== 'normal') break;
    if (b.v !== t.v) break;
    if (regras.naipes && b.cor !== t.cor) break;
    degrau++;
    const novo = { ...b, v: b.v * 2 };
    col = [...col.slice(0, -2), novo];
    valores.push(novo.v);
    eventos.push({ tipo: 'fundir', c, id: novo.id, idEntra: t.id, degrau, valor: novo.v });
  }
  return { col, degrau, valores, pedras };
}

/**
 * Coloca a carta no topo: funde (e cascateia) ou empilha.
 * @returns {{ col: any[], fusao: boolean, degrau: number, valores: number[], pedras: number }}
 */
export function colocar(col, regras, c, carta, eventos) {
  const t = topo(col);
  if (fundeCom(regras, t, carta)) {
    const novo = { ...t, v: t.v * 2 };
    delete novo.gelo;
    const base = [...col.slice(0, -1), novo];
    eventos.push({ tipo: 'fundir', c, id: novo.id, idEntra: carta.id, degrau: 1, valor: novo.v });
    const r = cascata(base, regras, c, eventos, 1, [novo.v]);
    return { col: r.col, fusao: true, degrau: r.degrau, valores: r.valores, pedras: r.pedras };
  }
  const nova = carta.tipo === 'coringa' ? { id: carta.id, tipo: 'normal', v: 2, cor: carta.cor || 0 } : carta;
  eventos.push({ tipo: 'colocar', c, id: nova.id, altura: col.length, valor: nova.v });
  return { col: [...col, nova], fusao: false, degrau: 0, valores: [], pedras: 0 };
}

/**
 * Se o topo chegou ao teto, a carta sai da mesa (monte completo).
 * @returns {{ col: any[], completou: number }} valor completado ou 0
 */
export function completar(col, regras, c, eventos) {
  const t = topo(col);
  if (!t || t.tipo !== 'normal' || t.v < regras.teto) return { col, completou: 0 };
  eventos.push({ tipo: 'completar', c, id: t.id, valor: t.v });
  return { col: col.slice(0, -1), completou: t.v };
}

/** Maior valor em jogo. */
export function maiorNaMesa(colunas) {
  let m = 0;
  for (const col of colunas) for (const k of col) if (k.tipo === 'normal' && k.v > m) m = k.v;
  return m;
}
