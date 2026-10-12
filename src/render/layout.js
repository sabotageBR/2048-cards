// Geometria pura da tela: mesa (colunas e descarte), fila e medidas da
// carta, como funcao de (W, H) e das faixas ocupadas pelo HUD. Retrato: HUD
// em cima, mesa no meio, fila embaixo. Paisagem: fila numa coluna a direita.
// Com `arena`, o monstro do duelo ganha espaco: em retrato uma faixa entre o
// HUD e a mesa; em paisagem uma coluna a esquerda. L.monstro = { x, y, R }
// (centro, linha dos pes e raio).

const PROPORCAO = 0.72;      // largura / altura da carta
const SOBREPOSICAO = 0.30;   // faixa visivel de cada carta coberta (fracao da altura)
const CARTA_MAX = 118;       // largura maxima da carta (desktop)
const CARTA_MIN = 44;

/**
 * @param {{ W: number, H: number, topo: number, base?: number, colunas: number, pilhaMax: number, tamFila: number, arena?: boolean }} p
 */
export function calcularLayout({ W, H, topo, base = 0, colunas, pilhaMax, tamFila, arena = false }) {
  const retrato = H >= W * 0.95;
  const margem = Math.max(10, Math.min(W, H) * 0.03);
  const faixa = arena && retrato ? Math.round(Math.max(120, Math.min(230, H * 0.26))) : 0;
  const esq = arena && !retrato ? Math.round(Math.max(110, Math.min(260, W * 0.19))) : 0;
  const topoHud = topo;
  topo += faixa;
  const Wt = W;
  W -= esq;
  const passoFator = SOBREPOSICAO;
  const alturaColuna = (ch) => ch + (pilhaMax - 1) * ch * passoFator;
  // descarte: na mesma linha das colunas, salvo retrato com 5 colunas (vai para junto da fila)
  const descarteNaMesa = !(retrato && colunas >= 5);
  const slots = colunas + (descarteNaMesa ? 1 : 0);
  let cw, ch;
  const gap = Math.max(6, Math.round(Math.min(W, H) * 0.02));
  const pad = Math.max(10, Math.round(Math.min(W, H) * 0.028));
  if (retrato) {
    // fila embaixo: altura = carta da fila (1,08x) + folga
    const porLargura = (W - margem * 2 - pad * 2 - gap * (slots - 1)) / slots;
    // altura: topo + pad + coluna + pad + fila + base
    const filaFator = 1.08 / PROPORCAO + 0.5; // fila em alturas de carta (carta maior + folga)
    const disp = H - topo - base - margem * 2 - pad * 2;
    const porAltura = (disp / (alturaColuna(1) + filaFator)) * PROPORCAO;
    cw = Math.min(CARTA_MAX, porLargura, porAltura);
  } else {
    const filaLarg = (cw0) => cw0 * 1.08 + gap * 2 + margem; // coluna da fila a direita
    const disp = H - topo - base - margem * 2 - pad * 2;
    const porAltura = (disp / alturaColuna(1)) * PROPORCAO;
    let c0 = Math.min(CARTA_MAX, porAltura);
    const porLargura = (W - margem * 2 - pad * 2 - gap * (slots - 1) - filaLarg(c0)) / slots;
    cw = Math.min(c0, porLargura);
  }
  cw = Math.max(CARTA_MIN, Math.floor(cw));
  ch = Math.round(cw / PROPORCAO);
  const passo = Math.round(ch * passoFator);
  const colAlt = ch + (pilhaMax - 1) * passo;
  const mesaW = slots * cw + (slots - 1) * gap + pad * 2;
  const mesaH = colAlt + pad * 2;
  const filaCw = Math.round(cw * 1.08), filaCh = Math.round(filaCw / PROPORCAO);
  let mesa, fila;
  if (retrato) {
    const filaH = filaCh + gap * 2;
    const livre = H - topo - base - mesaH - filaH;
    const y = topo + Math.max(margem, livre * 0.32);
    mesa = { x: Math.round((W - mesaW) / 2), y: Math.round(y), w: mesaW, h: mesaH };
    const fy = Math.min(H - base - margem - filaCh, mesa.y + mesaH + Math.max(gap * 2, livre * 0.3));
    fila = { vertical: false, x: 0, y: Math.round(fy), w: W, h: filaCh, cw: filaCw, ch: filaCh, gap: Math.round(gap * 1.2) };
  } else {
    const filaW = filaCw + gap * 2;
    const total = mesaW + gap * 2 + filaW;
    const x0 = esq + Math.round((W - total) / 2);
    mesa = { x: x0, y: Math.round(topo + (H - topo - base - mesaH) / 2), w: mesaW, h: mesaH };
    fila = { vertical: true, x: mesa.x + mesaW + gap * 2, y: mesa.y, w: filaW, h: mesaH, cw: filaCw, ch: filaCh, gap: Math.round(gap * 1.2) };
  }
  const colX = (c) => mesa.x + pad + c * (cw + gap);
  const colY = mesa.y + pad;
  /** @type {{x:number,y:number,w:number,h:number}} */
  let descarte;
  if (descarteNaMesa) descarte = { x: colX(colunas), y: colY, w: cw, h: ch };
  else descarte = { x: Math.round(fila.x + fila.w / 2 - (tamFila * (filaCw + fila.gap) + filaCw + fila.gap * 3) / 2), y: fila.y, w: filaCw, h: filaCh };
  // posicoes da fila: a frente e a mais perto da mesa
  function filaPos(k) {
    if (fila.vertical) {
      // a frente em tamanho cheio; as previas menores, encavaladas entre si
      if (k === 0) return { x: fila.x + gap, y: fila.y + gap, w: filaCw, h: filaCh };
      const pw = Math.round(filaCw * 0.62), ph = Math.round(filaCh * 0.62);
      const sobra = fila.h - gap * 3 - filaCh - ph;
      const passoV = Math.max(ph * 0.4, Math.min(ph * 0.72, sobra / Math.max(1, tamFila - 2)));
      const y = Math.round(fila.y + gap * 2 + filaCh + (k - 1) * passoV);
      return { x: fila.x + gap + Math.round((filaCw - pw) / 2), y, w: pw, h: ph };
    }
    const n = tamFila;
    const largTotal = n * filaCw + (n - 1) * fila.gap + (descarteNaMesa ? 0 : filaCw + fila.gap * 3);
    const x0 = Math.round(fila.x + fila.w / 2 - largTotal / 2 + (descarteNaMesa ? 0 : filaCw + fila.gap * 3));
    return { x: x0 + k * (filaCw + fila.gap), y: fila.y, w: filaCw, h: filaCh };
  }
  /** @type {{x:number,y:number,R:number}|null} */
  let monstro = null;
  if (faixa) {
    const y = Math.round(topo + (mesa.y - topo) * 0.45 - 14);
    const R = Math.round(Math.max(30, Math.min(84, Wt * 0.2, (y - topoHud - 6) / 2.1)));
    monstro = { x: Math.round(Wt / 2), y, R };
  } else if (esq) {
    // no meio do espaco livre a esquerda da mesa (a coluna reservada e o minimo)
    const R = Math.round(Math.max(28, Math.min(92, mesa.x * 0.36, (H - topoHud) * 0.2)));
    monstro = { x: Math.round(Math.max(R * 1.2, mesa.x / 2)), y: Math.round(mesa.y + mesa.h * 0.78), R };
  }
  return {
    W: Wt, H, retrato, topo: topoHud, base, margem, gap, pad, cw, ch, passo, colunas, pilhaMax, tamFila, mesa, fila, descarte, descarteNaMesa, monstro, faixa, esq,
    coluna: (c) => ({ x: colX(c), y: colY, w: cw, h: colAlt }),
    carta: (c, i) => ({ x: colX(c), y: colY + i * passo, w: cw, h: ch }),
    filaPos,
    colunaEm(px, py) {
      if (py < mesa.y || py > mesa.y + mesa.h) return -1;
      for (let c = 0; c < colunas; c++) {
        const x = colX(c);
        if (px >= x - gap / 2 && px <= x + cw + gap / 2) return c;
      }
      return -1;
    },
    descarteEm: (px, py) => px >= descarte.x - gap && px <= descarte.x + descarte.w + gap && py >= descarte.y - gap && py <= descarte.y + descarte.h + gap,
    filaEm(px, py) {
      for (let k = 0; k < tamFila; k++) {
        const p = filaPos(k);
        if (px >= p.x - gap / 2 && px <= p.x + p.w + gap / 2 && py >= p.y - gap && py <= p.y + p.h + gap) return k;
      }
      return -1;
    },
  };
}
