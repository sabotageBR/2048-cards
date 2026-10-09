// Textos do jogo. Quase tudo e icone; o que sobra cabe aqui.
// Ingles e o padrao (Poki e global); PT e ES pelo idioma do navegador.

const TEXTOS = {
  en: {
    yes: 'YES!', mundo: 'WORLD', fase: 'Level', pontos: 'Score', recorde: 'Best', novoRecorde: 'New best!',
    menu: 'Menu', som: 'Sound', desfazer: 'Undo', recomecar: 'Restart', fechar: 'Close', continuar: 'Continue',
    jogarDeNovo: 'Play again', semJogadas: 'No moves left', continuarVideo: 'Continue', gratis: 'Free',
    aventura: 'Adventure', classico: 'Endless', fases: 'Levels', bloqueado: 'Locked', pausa: 'Paused',
    tenteDeNovo: 'Try again',
    metaPontos: 'Score {n}', metaCartas: 'Make {n}× {v}', metaMontes: 'Complete {n} pile', metaMontesPl: 'Complete {n} piles',
    metaPedras: 'Break the stones', metaSobreviver: 'Play {n} cards', metaCascata: 'Chain ×{x}',
    coringa: 'Wild', martelo: 'Hammer', troca: 'Swap', febre: 'FEVER!',
    bau: 'World chest!', novaSkin: 'New card skin!', colecao: 'Collection', cenario: 'Table', skin: 'Cards', estrelasPara: '{n}★ to unlock',
    missoes: 'Missions', missaoFeita: 'Mission done!', diario: 'Daily', diarioFim: 'Daily done!', cartasRestantes: '{n} cards left',
    missaoFusoes: 'Merge {n} times', missaoCascata: 'Chain ×{x}', missaoCartas: 'Make {n}× {v}', missaoMontes: 'Complete {n} piles',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Discard {n} cards', missaoPontos: 'Score {n} in one game',
  },
  pt: {
    yes: 'BOA!', mundo: 'MUNDO', fase: 'Fase', pontos: 'Pontos', recorde: 'Recorde', novoRecorde: 'Novo recorde!',
    menu: 'Menu', som: 'Som', desfazer: 'Desfazer', recomecar: 'Recomeçar', fechar: 'Fechar', continuar: 'Continuar',
    jogarDeNovo: 'Jogar de novo', semJogadas: 'Sem jogadas', continuarVideo: 'Continuar', gratis: 'Grátis',
    aventura: 'Aventura', classico: 'Infinito', fases: 'Fases', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Tente de novo',
    metaPontos: 'Faça {n} pontos', metaCartas: 'Faça {n}× {v}', metaMontes: 'Complete {n} monte', metaMontesPl: 'Complete {n} montes',
    metaPedras: 'Quebre as pedras', metaSobreviver: 'Jogue {n} cartas', metaCascata: 'Cascata ×{x}',
    coringa: 'Coringa', martelo: 'Martelo', troca: 'Troca', febre: 'FEBRE!',
    bau: 'Baú do mundo!', novaSkin: 'Novas cartas!', colecao: 'Coleção', cenario: 'Mesa', skin: 'Cartas', estrelasPara: '{n}★ para liberar',
    missoes: 'Missões', missaoFeita: 'Missão cumprida!', diario: 'Diário', diarioFim: 'Diário completo!', cartasRestantes: '{n} cartas restantes',
    missaoFusoes: 'Funda {n} vezes', missaoCascata: 'Cascata ×{x}', missaoCartas: 'Faça {n}× {v}', missaoMontes: 'Complete {n} montes',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Descarte {n} cartas', missaoPontos: 'Faça {n} pontos numa partida',
  },
  es: {
    yes: '¡SÍ!', mundo: 'MUNDO', fase: 'Nivel', pontos: 'Puntos', recorde: 'Récord', novoRecorde: '¡Nuevo récord!',
    menu: 'Menú', som: 'Sonido', desfazer: 'Deshacer', recomecar: 'Reiniciar', fechar: 'Cerrar', continuar: 'Continuar',
    jogarDeNovo: 'Jugar otra vez', semJogadas: 'Sin jugadas', continuarVideo: 'Continuar', gratis: 'Gratis',
    aventura: 'Aventura', classico: 'Infinito', fases: 'Niveles', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Inténtalo de nuevo',
    metaPontos: 'Haz {n} puntos', metaCartas: 'Haz {n}× {v}', metaMontes: 'Completa {n} pila', metaMontesPl: 'Completa {n} pilas',
    metaPedras: 'Rompe las piedras', metaSobreviver: 'Juega {n} cartas', metaCascata: 'Cascada ×{x}',
    coringa: 'Comodín', martelo: 'Martillo', troca: 'Cambio', febre: '¡FIEBRE!',
    bau: '¡Cofre del mundo!', novaSkin: '¡Cartas nuevas!', colecao: 'Colección', cenario: 'Mesa', skin: 'Cartas', estrelasPara: '{n}★ para desbloquear',
    missoes: 'Misiones', missaoFeita: '¡Misión cumplida!', diario: 'Diario', diarioFim: '¡Diario completo!', cartasRestantes: '{n} cartas restantes',
    missaoFusoes: 'Fusiona {n} veces', missaoCascata: 'Cascada ×{x}', missaoCartas: 'Haz {n}× {v}', missaoMontes: 'Completa {n} pilas',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Descarta {n} cartas', missaoPontos: 'Haz {n} puntos en una partida',
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

/** Texto de uma meta. */
export function textoMeta(T, m) {
  const f = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => String(o[k]));
  switch (m.tipo) {
    case 'pontos': return f(T.metaPontos, { n: m.alvo });
    case 'cartas': return f(T.metaCartas, { n: m.alvo, v: m.v });
    case 'montes': return f(m.alvo > 1 ? T.metaMontesPl : T.metaMontes, { n: m.alvo });
    case 'pedras': return T.metaPedras;
    case 'sobreviver': return f(T.metaSobreviver, { n: m.alvo });
    case 'cascata': return f(T.metaCascata, { x: m.alvo });
    default: return '';
  }
}
