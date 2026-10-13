// Operacoes de coluna: colocar, fundir em cascata, completar o monte e
// graduar (limpeza na subida de nivel). Funcoes puras: devolvem colunas novas
// e empurram eventos no vetor recebido.
import { fundeCom, topo } from './regras.js';

/**
 * A carta com o valor dobrado (ou vezes `fator`). `esp` marca que ela recebeu
 * um especial (coringa, dobro, quadruplo): nao aceita outro ate fundir de
 * novo, numa jogada normal ou na cascata, quando sai limpa (e uma carta nova).
 */
export function dobrada(k, esp = false, fator = 2) {
  const novo = { ...k, v: k.v * fator };
  if (esp) novo.esp = true; else delete novo.esp;
  return novo;
}

/**
 * Funde o topo com a carta de baixo enquanto forem iguais (cascata).
 * A primeira fusao (carta nova no topo) ja aconteceu quando isto e chamado,
 * com degrau 1; aqui vem o resto.
 * @returns {{ col: any[], degrau: number, valores: number[] }}
 */
export function cascata(col, regras, c, eventos, degrau = 1, valores = []) {
  while (col.length >= 2) {
    const t = col[col.length - 1];
    const b = col[col.length - 2];
    if (b.tipo !== 'normal' || t.tipo !== 'normal') break;
    if (b.v !== t.v) break;
    degrau++;
    const novo = dobrada(b);
    col = [...col.slice(0, -2), novo];
    valores.push(novo.v);
    eventos.push({ tipo: 'fundir', c, id: novo.id, idEntra: t.id, degrau, valor: novo.v });
  }
  return { col, degrau, valores };
}

/**
 * Coloca a carta no topo: funde (e cascateia) ou empilha.
 * @returns {{ col: any[], fusao: boolean, degrau: number, valores: number[] }}
 */
export function colocar(col, regras, c, carta, eventos) {
  const t = topo(col);
  if (fundeCom(regras, t, carta)) {
    const novo = dobrada(t, carta.tipo === 'coringa');
    const base = [...col.slice(0, -1), novo];
    eventos.push({ tipo: 'fundir', c, id: novo.id, idEntra: carta.id, degrau: 1, valor: novo.v });
    const r = cascata(base, regras, c, eventos, 1, [novo.v]);
    return { col: r.col, fusao: true, degrau: r.degrau, valores: r.valores };
  }
  const nova = carta.tipo === 'coringa' ? { id: carta.id, tipo: 'normal', v: 2 } : carta;
  eventos.push({ tipo: 'colocar', c, id: nova.id, altura: col.length, valor: nova.v });
  return { col: [...col, nova], fusao: false, degrau: 0, valores: [] };
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

/**
 * Limpeza na subida de nivel: as cartas abaixo do piso do baralho novo saem
 * da mesa (nenhuma carta nova as fundiria mais). Na colocacao estrita a
 * coluna desce do fundo ao topo, entao sai sempre um pedaco do topo.
 * @returns {{ colunas: any[][], cartas: { c: number, id: number, valor: number }[] }}
 */
export function graduar(colunas, piso) {
  const cartas = [];
  const novas = colunas.map((col, c) => {
    if (!col.some((k) => k.tipo === 'normal' && k.v < piso)) return col;
    return col.filter((k) => {
      if (k.tipo !== 'normal' || k.v >= piso) return true;
      cartas.push({ c, id: k.id, valor: k.v });
      return false;
    });
  });
  return { colunas: cartas.length ? novas : colunas, cartas };
}

/** Maior valor em jogo. */
export function maiorNaMesa(colunas) {
  let m = 0;
  for (const col of colunas) for (const k of col) if (k.tipo === 'normal' && k.v > m) m = k.v;
  return m;
}
