// Icones do HUD: os itens (coringa, martelo, troca) e um desenho por tipo de
// missao, no traco dos botoes (viewBox 24, linha 2.6, pontas redondas). Sem
// texto: a missao na mesa e o icone e o contador. A carta de valor (missao
// `cartas`) e desenhada no hud.js, com o numero dela.

/** Itens do inventario (premios das missoes e do bau). */
export const ICONES = { coringa: '★', martelo: '🔨', troca: '⇄' };

const svg = (corpo) => `<svg viewBox="0 0 24 24" aria-hidden="true">${corpo}</svg>`;

/** Desenho de cada tipo de missao (missoes.js). */
export const ICONES_MISSAO = {
  // duas cartas que se encontram
  fusoes: svg('<rect x="2.5" y="6" width="7.5" height="11" rx="2"/><rect x="14" y="6" width="7.5" height="11" rx="2"/><path d="M10.5 11.5h3"/>'),
  // a escada da cascata, subindo
  cascata: svg('<path d="M3.5 20.5h5v-5h5v-5h5"/><path d="M14.5 4h5v5"/><path d="M19.5 4l-6 6"/>'),
  // a carta que sai da mesa, com raios
  montes: svg('<rect x="7" y="7" width="10" height="13.5" rx="2.5"/><path d="M12 2.5v2M4.5 5l1.5 1.5M19.5 5 18 6.5M3 12h2M19 12h2"/>'),
  // o raio do combo
  combo: svg('<path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z"/>'),
  // a carta descendo para o descarte
  descartes: svg('<rect x="8" y="2.5" width="8" height="10" rx="2"/><path d="M12 13.5v4M9.5 15.5l2.5 2.5 2.5-2.5"/><path d="M4 18v3h16v-3"/>'),
  // a taca dos pontos
  pontos: svg('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5A2.5 2.5 0 0 0 8 10M16 6h2.5A2.5 2.5 0 0 1 16 10"/><path d="M12 13v4M8.5 20.5h7"/>'),
};

/** Contador curto: 1500 vira 1.5k. */
export function curto(n) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
}
