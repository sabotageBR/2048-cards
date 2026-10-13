// Textos do jogo. Quase tudo e icone; o que sobra cabe aqui (rotulos e
// premios, nenhum texto explica regra). Ingles e o padrao (Poki e global);
// PT e ES pelo idioma do navegador.

const TEXTOS = {
  en: {
    yes: 'VICTORY!', mundo: 'WORLD', mundoRotulo: 'World', nivel: 'Level', pontos: 'Score',
    menu: 'Menu', som: 'Sound', desfazer: 'Undo', recomecar: 'Restart', fechar: 'Close', continuar: 'Continue',
    recomecarNivel: 'Restart level', semJogadas: 'No moves left', continuarVideo: 'Continue', gratis: 'Free',
    fases: 'Levels', bloqueado: 'Locked', pausa: 'Paused',
    tenteDeNovo: 'Try again', segundaChance: 'Second chance!',
    metaNivel: 'Make a {v}', metaCartas: 'Make {n}× {v}',
    coringa: 'Wild', martelo: 'Hammer', troca: 'Swap', febre: 'FURY ×2',
    bau: 'World chest!',
    naMao: 'in hand', descartarRotulo: 'discard', semCarga: 'full', combo: 'COMBO ×{n}', bomba: 'BOMB',
    videoEsvaziar: 'Empty', videoEsvaziarRotulo: 'Empty the discard (video)', videoCoringaRotulo: 'Wild +1 (video)',
    missoes: 'Missions', missaoFeita: 'Mission done!',
    missaoFusoes: 'Merge {n} times', missaoCascata: 'Chain ×{x}', missaoCartas: 'Make {n}× {v}', missaoMontes: 'Make {n}× 2048',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Discard {n} cards', missaoPontos: 'Score {n} in one world',
  },
  pt: {
    yes: 'VITÓRIA!', mundo: 'MUNDO', mundoRotulo: 'Mundo', nivel: 'Nível', pontos: 'Pontos',
    menu: 'Menu', som: 'Som', desfazer: 'Desfazer', recomecar: 'Recomeçar', fechar: 'Fechar', continuar: 'Continuar',
    recomecarNivel: 'Recomeçar o nível', semJogadas: 'Sem jogadas', continuarVideo: 'Continuar', gratis: 'Grátis',
    fases: 'Níveis', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Tente de novo', segundaChance: 'Segunda chance!',
    metaNivel: 'Faça um {v}', metaCartas: 'Faça {n}× {v}',
    coringa: 'Coringa', martelo: 'Martelo', troca: 'Troca', febre: 'FÚRIA ×2',
    bau: 'Baú do mundo!',
    naMao: 'na mão', descartarRotulo: 'descartar', semCarga: 'cheio', combo: 'COMBO ×{n}', bomba: 'BOMBA',
    videoEsvaziar: 'Esvaziar', videoEsvaziarRotulo: 'Esvaziar o descarte (vídeo)', videoCoringaRotulo: 'Coringa +1 (vídeo)',
    missoes: 'Missões', missaoFeita: 'Missão cumprida!',
    missaoFusoes: 'Funda {n} vezes', missaoCascata: 'Cascata ×{x}', missaoCartas: 'Faça {n}× {v}', missaoMontes: 'Faça {n}× 2048',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Descarte {n} cartas', missaoPontos: 'Faça {n} pontos num mundo',
  },
  es: {
    yes: '¡VICTORIA!', mundo: 'MUNDO', mundoRotulo: 'Mundo', nivel: 'Nivel', pontos: 'Puntos',
    menu: 'Menú', som: 'Sonido', desfazer: 'Deshacer', recomecar: 'Reiniciar', fechar: 'Cerrar', continuar: 'Continuar',
    recomecarNivel: 'Reiniciar el nivel', semJogadas: 'Sin jugadas', continuarVideo: 'Continuar', gratis: 'Gratis',
    fases: 'Niveles', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Inténtalo de nuevo', segundaChance: '¡Segunda oportunidad!',
    metaNivel: 'Haz un {v}', metaCartas: 'Haz {n}× {v}',
    coringa: 'Comodín', martelo: 'Martillo', troca: 'Cambio', febre: 'FURIA ×2',
    bau: '¡Cofre del mundo!',
    naMao: 'en mano', descartarRotulo: 'descartar', semCarga: 'lleno', combo: 'COMBO ×{n}', bomba: 'BOMBA',
    videoEsvaziar: 'Vaciar', videoEsvaziarRotulo: 'Vaciar el descarte (vídeo)', videoCoringaRotulo: 'Comodín +1 (vídeo)',
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
