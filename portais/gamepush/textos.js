// Textos do build da GamePush: os do jogo (textos-base.js: ingles, portugues e espanhol) mais o
// russo, que so este build tem. tools/empacotar-portal.mjs poe este arquivo no lugar de
// src/i18n/textos.js e o original vira src/i18n/textos-base.js; quem importa os textos nao muda.
//
// - O russo usa o plural russo onde ha numero: o modelo "{n} {um|poucos|muitos}" escolhe a forma
//   pelo numero (1 карту, 2 карты, 5 карт; 11 a 14 sempre "muitos").
// - O idioma escolhido vai para o <html lang>: o leitor de tela le na lingua certa, e o rotulo VIDEO
//   dos botoes de premiado (src/ui/plataforma.css) sai traduzido.
// - Terminologia: Мир (mundo), Уровень (nivel), сброс (descarte), Джокер (coringa), слияние (fusao).
import * as base from './textos-base.js';

/** Russo. As chaves que faltarem caem no ingles. */
export const RU = {
  yes: 'ПОБЕДА!', mundo: 'МИР', mundoRotulo: 'Мир', nivel: 'Уровень', pontos: 'Очки',
  menu: 'Меню', som: 'Звук', desfazer: 'Отменить ход', recomecar: 'Заново', fechar: 'Закрыть', continuar: 'Продолжить',
  recomecarNivel: 'Переиграть уровень', semJogadas: 'Ходов больше нет', continuarVideo: 'Продолжить', gratis: 'Бесплатно',
  fases: 'Уровни', bloqueado: 'Закрыто', pausa: 'Пауза',
  tenteDeNovo: 'Попробуйте ещё раз', segundaChance: 'Второй шанс!',
  metaNivel: 'Соберите {v}', metaCartas: 'Соберите {n}× {v}',
  coringa: 'Джокер', martelo: 'Молот', troca: 'Обмен', febre: 'ЯРОСТЬ ×2',
  bau: 'Сундук мира!',
  naMao: 'в руке', descartarRotulo: 'сброс', semCarga: 'полон', combo: 'КОМБО ×{n}', bomba: 'БОМБА',
  videoEsvaziar: 'Очистить', videoEsvaziarRotulo: 'Очистить сброс (видео)', videoCoringaRotulo: 'Джокер +1 (видео)',
  missoes: 'Задания', missaoFeita: 'Задание выполнено!',
  missaoFusoes: 'Сделайте {n} {слияние|слияния|слияний}', missaoCascata: 'Цепочка ×{x}', missaoCartas: 'Соберите {n}× {v}',
  missaoMontes: 'Соберите {n}× 2048', missaoCombo: 'Комбо ×{n}', missaoDescartes: 'Сбросьте {n} {карту|карты|карт}',
  missaoPontos: 'Наберите {n} {очко|очка|очков} в одном мире',
};

/**
 * A forma russa para o numero n: [1, 21, 31...], [2-4, 22-24...], [0, 5-20, 25-30...].
 * @param {number} n
 * @param {[string, string, string]} formas
 */
export function plural(n, [um, poucos, muitos]) {
  const c = Math.abs(Math.trunc(n)) % 100;
  const d = c % 10;
  if (c >= 11 && c <= 14) return muitos;
  if (d === 1) return um;
  if (d >= 2 && d <= 4) return poucos;
  return muitos;
}

const MODELO_PLURAL = /(\d+)(\s+)\{([^{}|]+)\|([^{}|]+)\|([^{}|]+)\}/g;
/** "5 {карту|карты|карт}" vira "5 карт". @param {string} s */
const flexionar = (s) => s.replace(MODELO_PLURAL, (_, n, esp, a, b, c) => `${n}${esp}${plural(Number(n), [a, b, c])}`);

/** @param {string} cod */
function marcarIdioma(cod) {
  try {
    if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = cod;
  } catch { /* ignora */ }
}

/** @param {readonly string[]} [langs] */
export function escolherIdioma(langs = (typeof navigator !== 'undefined' && navigator.languages) || []) {
  for (const l of langs) {
    const p = String(l).slice(0, 2).toLowerCase();
    if (p === 'ru') return 'ru';
    if (base.escolherIdioma([l]) === p) return p;
  }
  return 'en';
}

/** @param {string} idioma */
export function textos(idioma) {
  const cod = idioma === 'ru' ? 'ru' : base.escolherIdioma([String(idioma || '')]);
  marcarIdioma(cod);
  return cod === 'ru' ? { ...base.textos('en'), ...RU } : base.textos(cod);
}

/** Texto de uma missao, com o plural russo. */
export function textoMissao(T, m) {
  return flexionar(base.textoMissao(T, m));
}

/** Texto de uma meta, com o plural russo. */
export function textoMeta(T, m, teto = 2048) {
  return flexionar(base.textoMeta(T, m, teto));
}
