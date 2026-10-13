// Textos do jogo. Quase tudo e icone; o que sobra cabe aqui. Ingles e o
// padrao (Poki e global); PT e ES pelo idioma do navegador.

const TEXTOS = {
  en: {
    yes: 'VICTORY!', mundo: 'WORLD', mundoRotulo: 'World', nivel: 'Level', pontos: 'Score',
    menu: 'Menu', som: 'Sound', desfazer: 'Undo', recomecar: 'Restart', fechar: 'Close', continuar: 'Continue',
    recomecarNivel: 'Restart level', semJogadas: 'No moves left', continuarVideo: 'Continue', gratis: 'Free',
    fases: 'Levels', bloqueado: 'Locked', pausa: 'Paused',
    tenteDeNovo: 'Try again', segundaChance: 'Second chance!', proximo: 'Next:',
    metaNivel: 'Make a {v}', metaCartas: 'Make {n}× {v}',
    coringa: 'Wild', martelo: 'Hammer', troca: 'Swap', febre: 'FURY ×2',
    bau: 'World chest!',
    naMao: 'in hand', descartarRotulo: 'discard', semCarga: 'full', combo: 'COMBO ×{n}', bomba: 'BOMB',
    novidade: {
      coringa: ['Wild card!', 'It merges with any top card.'],
      bomba: ['Bomb!', 'Drop it on a pile to blow up the top card.'],
      dobro: ['Double!', 'It doubles the top card, and the chain goes on.'],
      quadruplo: ['×4 card!', 'It multiplies the top card by 4, and the chain goes on.'],
      colunas: ['3 columns!', 'Less room: plan your piles.'],
      descarte: ['Tight discard!', 'Only 2 places per level. Spend them wisely.'],
    },
    guiaIgual: 'Same numbers merge!', guiaMenor: 'Smaller cards go under bigger ones', guiaVazia: 'Any card fits an empty column',
    videoEsvaziar: 'Empty', videoEsvaziarRotulo: 'Empty the discard (video)', videoCoringaRotulo: 'Wild +1 (video)',
    regraEspecial: ['One special per card', 'This card already got a special. Merge it again to free it.'],
    regraMaior: ['Too big for that pile', 'A card only goes on a bigger or equal one. Or on an empty column.'],
    descarteCheio: ['Discard full', 'It empties when you reach the next level.'],
    missoes: 'Missions', missaoFeita: 'Mission done!',
    missaoFusoes: 'Merge {n} times', missaoCascata: 'Chain ×{x}', missaoCartas: 'Make {n}× {v}', missaoMontes: 'Make {n}× 2048',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Discard {n} cards', missaoPontos: 'Score {n} in one world',
  },
  pt: {
    yes: 'VITÓRIA!', mundo: 'MUNDO', mundoRotulo: 'Mundo', nivel: 'Nível', pontos: 'Pontos',
    menu: 'Menu', som: 'Som', desfazer: 'Desfazer', recomecar: 'Recomeçar', fechar: 'Fechar', continuar: 'Continuar',
    recomecarNivel: 'Recomeçar o nível', semJogadas: 'Sem jogadas', continuarVideo: 'Continuar', gratis: 'Grátis',
    fases: 'Níveis', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Tente de novo', segundaChance: 'Segunda chance!', proximo: 'Próximo:',
    metaNivel: 'Faça um {v}', metaCartas: 'Faça {n}× {v}',
    coringa: 'Coringa', martelo: 'Martelo', troca: 'Troca', febre: 'FÚRIA ×2',
    bau: 'Baú do mundo!',
    naMao: 'na mão', descartarRotulo: 'descartar', semCarga: 'cheio', combo: 'COMBO ×{n}', bomba: 'BOMBA',
    novidade: {
      coringa: ['Coringa!', 'Funde com qualquer carta do topo.'],
      bomba: ['Bomba!', 'Solte numa pilha para explodir a carta do topo.'],
      dobro: ['Dobro!', 'Dobra a carta do topo, e a cascata segue.'],
      quadruplo: ['Carta ×4!', 'Multiplica a carta do topo por 4, e a cascata segue.'],
      colunas: ['3 colunas!', 'Menos espaço: planeje as pilhas.'],
      descarte: ['Descarte apertado!', 'Só 2 lugares por nível. Use com cuidado.'],
    },
    guiaIgual: 'Números iguais fundem!', guiaMenor: 'A carta menor desce sob a maior', guiaVazia: 'Qualquer carta cabe na coluna vazia',
    videoEsvaziar: 'Esvaziar', videoEsvaziarRotulo: 'Esvaziar o descarte (vídeo)', videoCoringaRotulo: 'Coringa +1 (vídeo)',
    regraEspecial: ['Um especial por carta', 'Essa carta já recebeu um especial. Funda ela de novo para liberar.'],
    regraMaior: ['Grande demais para essa pilha', 'A carta só entra sobre uma maior ou igual. Ou numa coluna vazia.'],
    descarteCheio: ['Descarte cheio', 'Ele esvazia quando o nível sobe.'],
    missoes: 'Missões', missaoFeita: 'Missão cumprida!',
    missaoFusoes: 'Funda {n} vezes', missaoCascata: 'Cascata ×{x}', missaoCartas: 'Faça {n}× {v}', missaoMontes: 'Faça {n}× 2048',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Descarte {n} cartas', missaoPontos: 'Faça {n} pontos num mundo',
  },
  es: {
    yes: '¡VICTORIA!', mundo: 'MUNDO', mundoRotulo: 'Mundo', nivel: 'Nivel', pontos: 'Puntos',
    menu: 'Menú', som: 'Sonido', desfazer: 'Deshacer', recomecar: 'Reiniciar', fechar: 'Cerrar', continuar: 'Continuar',
    recomecarNivel: 'Reiniciar el nivel', semJogadas: 'Sin jugadas', continuarVideo: 'Continuar', gratis: 'Gratis',
    fases: 'Niveles', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Inténtalo de nuevo', segundaChance: '¡Segunda oportunidad!', proximo: 'Siguiente:',
    metaNivel: 'Haz un {v}', metaCartas: 'Haz {n}× {v}',
    coringa: 'Comodín', martelo: 'Martillo', troca: 'Cambio', febre: 'FURIA ×2',
    bau: '¡Cofre del mundo!',
    naMao: 'en mano', descartarRotulo: 'descartar', semCarga: 'lleno', combo: 'COMBO ×{n}', bomba: 'BOMBA',
    novidade: {
      coringa: ['¡Comodín!', 'Se fusiona con cualquier carta de arriba.'],
      bomba: ['¡Bomba!', 'Suéltala en una pila para explotar la carta de arriba.'],
      dobro: ['¡Doble!', 'Duplica la carta de arriba y la cascada sigue.'],
      quadruplo: ['¡Carta ×4!', 'Multiplica por 4 la carta de arriba y la cascada sigue.'],
      colunas: ['¡3 columnas!', 'Menos espacio: planea tus pilas.'],
      descarte: ['¡Descarte ajustado!', 'Solo 2 lugares por nivel. Úsalos con cuidado.'],
    },
    guiaIgual: '¡Los números iguales se fusionan!', guiaMenor: 'La carta menor va debajo de la mayor', guiaVazia: 'Cualquier carta cabe en la columna vacía',
    videoEsvaziar: 'Vaciar', videoEsvaziarRotulo: 'Vaciar el descarte (vídeo)', videoCoringaRotulo: 'Comodín +1 (vídeo)',
    regraEspecial: ['Un especial por carta', 'Esta carta ya recibió un especial. Fusiónala de nuevo para liberarla.'],
    regraMaior: ['Demasiado grande para esa pila', 'La carta solo entra sobre una mayor o igual. O en una columna vacía.'],
    descarteCheio: ['Descarte lleno', 'Se vacía al subir de nivel.'],
    missoes: 'Misiones', missaoFeita: '¡Misión cumplida!',
    missaoFusoes: 'Fusiona {n} veces', missaoCascata: 'Cascada ×{x}', missaoCartas: 'Haz {n}× {v}', missaoMontes: 'Haz {n}× 2048',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Descarta {n} cartas', missaoPontos: 'Haz {n} puntos en un mundo',
  },
};

/** @param {readonly string[]} [langs] */
export function escolherIdioma(langs = (typeof navigator !== 'undefined' && navigator.languages) || []) {
  for (const l of langs) {
    const p = String(l).slice(0, 2).toLowerCase();
    if (p in TEXTOS) return p;
  }
  return 'en';
}

/** @param {string} idioma */
export function textos(idioma) {
  return { ...TEXTOS.en, ...(TEXTOS[/** @type {'en'} */ (idioma)] || {}) };
}

/** Texto de uma missao. */
export function textoMissao(T, m) {
  const f = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => String(o[k]));
  const mapa = { fusoes: T.missaoFusoes, cascata: T.missaoCascata, cartas: T.missaoCartas, montes: T.missaoMontes, combo: T.missaoCombo, descartes: T.missaoDescartes, pontos: T.missaoPontos };
  return f(mapa[m.tipo] || '', { n: m.alvo, x: m.alvo, v: m.v });
}

/**
 * Texto de uma meta: o valor do nivel ("Make a 64"); o monte e dito pela
 * carta que o fecha ("Make 1× 2048").
 */
export function textoMeta(T, m, teto = 2048) {
  const f = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => String(o[k]));
  switch (m.tipo) {
    case 'cartas': return m.alvo === 1 ? f(T.metaNivel, { v: m.v }) : f(T.metaCartas, { n: m.alvo, v: m.v });
    case 'montes': return f(T.metaCartas, { n: m.alvo, v: teto });
    default: return '';
  }
}
