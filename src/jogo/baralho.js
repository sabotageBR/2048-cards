// Sorteio das cartas da fila: pesos por valor, faixa que cresce com a mesa,
// cartas especiais com espacamento minimo e "piedade" (depois de jogadas
// secas ou sem jogada legal, a proxima carta vem das que servem). O RNG
// (mulberry32) vive no estado como um uint32, por isso desfazer devolve a
// mesma carta seguinte.
import { podeColocar, fundeCom, topo } from './regras.js';
import { maiorNaMesa } from './colunas.js';

export const PESOS_PADRAO = Object.freeze({ 2: 6, 4: 5, 8: 3.5, 16: 2.2, 32: 1.4, 64: 0.9, 128: 0.5, 256: 0.3 });
/** Cartas normais entre duas especiais, no minimo. */
export const ESPACO_ESPECIAL = 6;
/** Jogadas secas seguidas que ligam a piedade (o baralho do nivel pode trocar; 0 desliga o gatilho). */
export const SECAS_PADRAO = 2;
/** Tipos de carta especial, na ordem do sorteio. */
export const ESPECIAIS = ['coringa', 'bomba', 'dobro', 'quadruplo'];

/** Um passo do mulberry32: devolve [u em [0,1), estado novo]. */
export function rngPasso(a) {
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** Valores que o baralho pode dar agora: ate max(8, maior/8), limitado pelo teto/8. */
export function valoresPermitidos(estado) {
  const b = estado.baralho;
  const pesos = b.pesos || PESOS_PADRAO;
  const todos = Object.keys(pesos).map(Number).filter((v) => pesos[v] > 0).sort((x, y) => x - y);
  if (b.dinamico === false) return todos;
  const maior = maiorNaMesa(estado.colunas);
  const maxV = Math.min(estado.regras.teto / 8, Math.max(b.minimo || 8, maior / 8));
  const ok = todos.filter((v) => v <= maxV);
  return ok.length ? ok : todos.slice(0, 1);
}

/** Colunas onde a carta pode ir agora. */
export function jogadasLegais(estado, carta) {
  const r = [];
  for (let c = 0; c < estado.colunas.length; c++) {
    if (podeColocar(estado.regras, estado.colunas[c], carta).ok) r.push(c);
  }
  return r;
}

/** Escolha ponderada. */
function escolher(valores, pesos, u) {
  let soma = 0;
  for (const v of valores) soma += pesos[v] || 1;
  let x = u * soma;
  for (const v of valores) {
    x -= pesos[v] || 1;
    if (x < 0) return v;
  }
  return valores[valores.length - 1];
}

/**
 * Sorteia a proxima carta. Devolve { estado, carta } (estado com rng, proxId e
 * contadores novos; a carta ainda nao esta na fila).
 */
export function sortear(estado) {
  const b = estado.baralho;
  const regras = estado.regras;
  let rng = estado.rng;
  let u;
  const esp = b.especiais || {};
  let tipo = 'normal';
  if (estado.desdeEspecial >= ESPACO_ESPECIAL) {
    [u, rng] = rngPasso(rng);
    let acum = 0;
    for (const k of ESPECIAIS) {
      acum += esp[k] || 0;
      if (u < acum) { tipo = k; break; }
    }
  }
  const id = estado.proxId;
  let carta;
  if (tipo !== 'normal') {
    carta = { id, tipo, v: 0 };
  } else {
    let valores = valoresPermitidos(estado);
    const pesos = b.pesos || PESOS_PADRAO;
    // piedade: sem jogada legal para a frente da fila, ou `secas` jogadas secas
    // seguidas (2; a mesa justa desliga ou espaca o gatilho), a proxima carta
    // vem das que fundem (ou das que cabem)
    const frente = estado.fila[0];
    const semLegal = frente && jogadasLegais(estado, frente).length === 0;
    const lim = b.secas ?? SECAS_PADRAO;
    if (semLegal || (lim > 0 && estado.secas >= lim)) {
      const fundem = valores.filter((v) => estado.colunas.some((col) => fundeCom(regras, topo(col), { tipo: 'normal', v })));
      const cabem = valores.filter((v) => jogadasLegais(estado, { tipo: 'normal', v }).length);
      if (fundem.length) valores = fundem;
      else if (cabem.length) valores = cabem;
    }
    [u, rng] = rngPasso(rng);
    const v = escolher(valores, pesos, u);
    carta = { id, tipo: 'normal', v };
  }
  return {
    estado: {
      ...estado, rng, proxId: id + 1,
      desdeEspecial: tipo === 'normal' ? estado.desdeEspecial + 1 : 0,
      restantes: estado.restantes === Infinity ? Infinity : estado.restantes - 1,
    },
    carta,
  };
}

/** Enche a fila ate o tamanho das regras, enquanto houver baralho. */
export function encherFila(estado) {
  let e = estado;
  const fila = e.fila.slice();
  while (fila.length < e.regras.tamFila && e.restantes > 0) {
    const r = sortear({ ...e, fila });
    e = r.estado;
    fila.push(r.carta);
  }
  return { ...e, fila };
}
