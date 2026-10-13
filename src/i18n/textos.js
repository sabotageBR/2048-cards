// Textos do jogo. Quase tudo e icone; o que sobra cabe aqui. O nome do
// monstro e a especie com um apelido pela posicao no mundo (nomeMonstro); o
// chefao e o "Rei". Ingles e o padrao (Poki e global); PT e ES pelo idioma
// do navegador.

const TEXTOS = {
  en: {
    yes: 'VICTORY!', mundo: 'WORLD', fase: 'Level', pontos: 'Score', recorde: 'Best', novoRecorde: 'New best!',
    menu: 'Menu', som: 'Sound', desfazer: 'Undo', recomecar: 'Restart', fechar: 'Close', continuar: 'Continue',
    jogarDeNovo: 'Play again', semJogadas: 'No moves left', continuarVideo: 'Continue', gratis: 'Free',
    aventura: 'Adventure', classico: 'Endless', fases: 'Levels', bloqueado: 'Locked', pausa: 'Paused',
    tenteDeNovo: 'Try again', segundaChance: 'Second chance!', proximo: 'Next:',
    metaPontos: 'Deal {n} damage', metaCartas: 'Make {n}× {v}',
    metaPedras: 'Break the stones', metaSobreviver: 'Play {n} cards', metaCascata: 'Chain ×{x}',
    coringa: 'Wild', martelo: 'Hammer', troca: 'Swap', febre: 'FURY ×2',
    bau: 'World chest!',
    dano: 'DAMAGE', naMao: 'in hand', descartarRotulo: 'discard', semCarga: 'empty', critico: 'CRITICAL!', livre: 'Free!', combo: 'COMBO ×{n}', bomba: 'BOMB',
    monstros: { gosmo: 'Gosmo', golem: 'Golem', yeti: 'Yeti', espectro: 'Specter', dragao: 'Dragon' },
    epitetos: ['Little', 'Greedy', 'Grumpy', 'Sneaky', 'Stubborn', 'Brute', 'Elder'], nomeMonstro: '{ep} {m}', rei: 'King {m}',
    monstroN: 'Monster {n}', derrotados: '{n} defeated', fimDerrotados: 'Monsters defeated: {n}',
    errou: 'MISS!', enfurecido: 'ENRAGED!', avisoAtaque: '{m} attacks!', avisoChefe: 'Boss fight!',
    dicaLodo: 'It slimed a pile! Merge the slimy card to clean it.', dicaPedra: 'Every {n} moves it drops a stone under a pile.',
    dicaGelo: 'Every {n} moves it freezes a top card.', dicaCorrente: 'Every {n} moves it chains a column for {k} moves.',
    dicaChefe: 'At half HP it gets enraged: faster attacks on two targets.',
    missoes: 'Missions', missaoFeita: 'Mission done!', diario: 'Daily', diarioFim: 'Daily done!', cartasRestantes: '{n} cards left',
    missaoFusoes: 'Merge {n} times', missaoCascata: 'Chain ×{x}', missaoCartas: 'Make {n}× {v}', missaoMontes: 'Land {n} special attacks',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Discard {n} cards', missaoPontos: 'Score {n} in one game',
  },
  pt: {
    yes: 'VITÓRIA!', mundo: 'MUNDO', fase: 'Fase', pontos: 'Pontos', recorde: 'Recorde', novoRecorde: 'Novo recorde!',
    menu: 'Menu', som: 'Som', desfazer: 'Desfazer', recomecar: 'Recomeçar', fechar: 'Fechar', continuar: 'Continuar',
    jogarDeNovo: 'Jogar de novo', semJogadas: 'Sem jogadas', continuarVideo: 'Continuar', gratis: 'Grátis',
    aventura: 'Aventura', classico: 'Infinito', fases: 'Fases', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Tente de novo', segundaChance: 'Segunda chance!', proximo: 'Próximo:',
    metaPontos: 'Cause {n} de dano', metaCartas: 'Faça {n}× {v}',
    metaPedras: 'Quebre as pedras', metaSobreviver: 'Jogue {n} cartas', metaCascata: 'Cascata ×{x}',
    coringa: 'Coringa', martelo: 'Martelo', troca: 'Troca', febre: 'FÚRIA ×2',
    bau: 'Baú do mundo!',
    dano: 'DANO', naMao: 'na mão', descartarRotulo: 'descartar', semCarga: 'sem carga', critico: 'CRÍTICO!', livre: 'Livre!', combo: 'COMBO ×{n}', bomba: 'BOMBA',
    monstros: { gosmo: 'Gosmo', golem: 'Golem', yeti: 'Yeti', espectro: 'Espectro', dragao: 'Dragão' },
    epitetos: ['Pequeno', 'Guloso', 'Ranzinza', 'Sorrateiro', 'Teimoso', 'Brutamontes', 'Ancião'], nomeMonstro: '{m} {ep}', rei: 'Rei {m}',
    monstroN: 'Monstro {n}', derrotados: '{n} derrotados', fimDerrotados: 'Monstros derrotados: {n}',
    errou: 'ERROU!', enfurecido: 'ENFURECIDO!', avisoAtaque: '{m} ataca!', avisoChefe: 'Chefão!',
    dicaLodo: 'Melou uma pilha! Funda a carta melada para limpar.', dicaPedra: 'A cada {n} jogadas joga uma pedra embaixo de uma pilha.',
    dicaGelo: 'A cada {n} jogadas congela a carta do topo.', dicaCorrente: 'A cada {n} jogadas acorrenta uma coluna por {k} jogadas.',
    dicaChefe: 'Com metade da vida ele se enfurece: ataca mais e em dois alvos.',
    missoes: 'Missões', missaoFeita: 'Missão cumprida!', diario: 'Diário', diarioFim: 'Diário completo!', cartasRestantes: '{n} cartas restantes',
    missaoFusoes: 'Funda {n} vezes', missaoCascata: 'Cascata ×{x}', missaoCartas: 'Faça {n}× {v}', missaoMontes: 'Dê {n} golpes especiais',
    missaoCombo: 'Combo ×{n}', missaoDescartes: 'Descarte {n} cartas', missaoPontos: 'Faça {n} pontos numa partida',
  },
  es: {
    yes: '¡VICTORIA!', mundo: 'MUNDO', fase: 'Nivel', pontos: 'Puntos', recorde: 'Récord', novoRecorde: '¡Nuevo récord!',
    menu: 'Menú', som: 'Sonido', desfazer: 'Deshacer', recomecar: 'Reiniciar', fechar: 'Cerrar', continuar: 'Continuar',
    jogarDeNovo: 'Jugar otra vez', semJogadas: 'Sin jugadas', continuarVideo: 'Continuar', gratis: 'Gratis',
    aventura: 'Aventura', classico: 'Infinito', fases: 'Niveles', bloqueado: 'Bloqueado', pausa: 'Pausa',
    tenteDeNovo: 'Inténtalo de nuevo', segundaChance: '¡Segunda oportunidad!', proximo: 'Siguiente:',
    metaPontos: 'Haz {n} de daño', metaCartas: 'Haz {n}× {v}',
    metaPedras: 'Rompe las piedras', metaSobreviver: 'Juega {n} cartas', metaCascata: 'Cascada ×{x}',
    coringa: 'Comodín', martelo: 'Martillo', troca: 'Cambio', febre: 'FURIA ×2',
    bau: '¡Cofre del mundo!',
    dano: 'DAÑO', naMao: 'en mano', descartarRotulo: 'descartar', semCarga: 'sin carga', critico: '¡CRÍTICO!', livre: '¡Libre!', combo: 'COMBO ×{n}', bomba: 'BOMBA',
    monstros: { gosmo: 'Gosmo', golem: 'Gólem', yeti: 'Yeti', espectro: 'Espectro', dragao: 'Dragón' },
    epitetos: ['Pequeño', 'Glotón', 'Gruñón', 'Astuto', 'Terco', 'Bruto', 'Anciano'], nomeMonstro: '{m} {ep}', rei: 'Rey {m}',
    monstroN: 'Monstruo {n}', derrotados: '{n} derrotados', fimDerrotados: 'Monstruos derrotados: {n}',
    errou: '¡FALLÓ!', enfurecido: '¡FURIOSO!', avisoAtaque: '¡{m} ataca!', avisoChefe: '¡Jefe!',
    dicaLodo: '¡Embarró una pila! Fusiona la carta babosa para limpiarla.', dicaPedra: 'Cada {n} jugadas pone una piedra debajo de una pila.',
    dicaGelo: 'Cada {n} jugadas congela la carta de arriba.', dicaCorrente: 'Cada {n} jugadas encadena una columna por {k} jugadas.',
    dicaChefe: 'Con la mitad de la vida se enfurece: ataca más y a dos objetivos.',
    missoes: 'Misiones', missaoFeita: '¡Misión cumplida!', diario: 'Diario', diarioFim: '¡Diario completo!', cartasRestantes: '{n} cartas restantes',
    missaoFusoes: 'Fusiona {n} veces', missaoCascata: 'Cascada ×{x}', missaoCartas: 'Haz {n}× {v}', missaoMontes: 'Da {n} golpes especiales',
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

/** Nome do monstro no idioma: especie + apelido ("Gosmo Guloso"), ou "Rei Gosmo" no chefao. */
export function nomeMonstro(T, def) {
  const m = (T.monstros && T.monstros[def.especie]) || def.especie;
  if (def.chefe) return T.rei.replace('{m}', m);
  const ep = T.epitetos && T.epitetos[def.epiteto];
  return ep ? T.nomeMonstro.replace('{m}', m).replace('{ep}', ep) : m;
}

/** Dica do feitico (aviso da primeira vez). */
export function dicaFeitico(T, feitico, cfg) {
  const mapa = { lodo: T.dicaLodo, pedra: T.dicaPedra, gelo: T.dicaGelo, corrente: T.dicaCorrente };
  return (mapa[feitico] || '').replace('{n}', String(cfg.cada)).replace('{k}', String(cfg.trancaK || 3));
}

/**
 * Texto de uma meta. O monte e dito pela carta que o fecha ("Make 1× 2048";
 * 4096 no chefe), e os pontos pelo nome do contador do painel (DAMAGE).
 */
export function textoMeta(T, m, teto = 2048) {
  const f = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => String(o[k]));
  switch (m.tipo) {
    case 'pontos': return f(T.metaPontos, { n: m.alvo });
    case 'cartas': return f(T.metaCartas, { n: m.alvo, v: m.v });
    case 'montes': return f(T.metaCartas, { n: m.alvo, v: teto });
    case 'pedras': return T.metaPedras;
    case 'sobreviver': return f(T.metaSobreviver, { n: m.alvo });
    case 'cascata': return f(T.metaCascata, { x: m.alvo });
    default: return '';
  }
}
