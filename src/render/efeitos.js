// Efeitos de particula de cada jogada (pouso, fusao, 2048, limpeza, bomba,
// combo) e da festa da subida de nivel. Os textos ("x3", "COMBO x4") sao
// iguais em todos os mundos; o estouro e do tema (temas/*.js, `efeito`), com
// o padrao daqui como reserva. Puro: recebe o emissor de particulas e o tema,
// sem canvas nem relogio, entao a folha de tools/mundos.html desenha o mesmo
// quadro que o jogo.
import { TINTA } from './desenho.js';

/** As formas de particula do tema entram no emissor (a cada troca de tema). */
export function registrarFormas(part, tema) {
  Object.assign(part.formas, tema.formas || {});
}

/**
 * Toca um efeito.
 * e = { tipo: 'pouso'|'fusao'|'completar'|'graduar'|'explodir'|'combo'|'festa', x, y, valor?, degrau?, n? };
 * c = { part, tema, esc (escala pela largura da carta), ch (altura da carta), textos: { combo } }.
 */
export function tocarEfeito(e, c) {
  const { part, tema, esc, ch } = c;
  const cor = tema.cor(e.valor || 2);
  if (e.tipo === 'combo') {
    if (e.n >= 2) part.texto(e.x, e.y - ch * 0.75, c.textos.combo.replace('{n}', String(e.n)), '#ff9f2f', (22 + Math.min(10, e.n * 2)) * esc, TINTA);
    return;
  }
  if (e.tipo === 'fusao' && e.degrau > 1) part.texto(e.x, e.y - ch * 0.4, '×' + e.degrau, '#ffe27a', (22 + e.degrau * 2) * esc, TINTA);
  const ev = { ...e, cor };
  if (tema.efeito && tema.efeito(ev, part, esc)) return;
  efeitoPadrao(ev, part, esc, ch, tema.paleta);
}

/** O estouro de sempre (estrelas e anel), para o que o tema nao trata. */
function efeitoPadrao(e, part, esc, ch, pal) {
  switch (e.tipo) {
    case 'pouso':
      part.estourar(e.x, e.y + ch * 0.3, ['#ffe27a', '#f6c453', '#fff3c2'], 9, 0.4 * esc, { g: 160, vida: 0.45, tam: 4 * esc, forma: 'c' });
      break;
    case 'fusao':
      part.estourar(e.x, e.y, [e.cor, '#ffe27a', '#ffffff'], 8 + e.degrau * 3, (0.7 + e.degrau * 0.12) * esc, { forma: 'estrela', tam: 8 * esc, g: 300 });
      part.anel(e.x, e.y, e.cor, (28 + e.degrau * 6) * esc);
      break;
    case 'completar':
      part.estourar(e.x, e.y, ['#ffe27a', '#ffffff', '#12bfd2'], 30, 1.5 * esc, { forma: 'estrela', tam: 11 * esc });
      part.anel(e.x, e.y, '#ffe27a', 70 * esc);
      break;
    case 'graduar':
      // a carta pequena sai da mesa: brilho para cima, na cor dela
      part.estourar(e.x, e.y, [e.cor, '#ffffff'], 8, 0.6 * esc, { forma: 'estrela', tam: 6 * esc, g: -120, vida: 0.6 });
      break;
    case 'explodir':
      part.estourar(e.x, e.y, ['#ff8a3d', '#ffd23f', '#ff3b3b'], 22, 1.3 * esc, { forma: 'estrela', tam: 9 * esc });
      part.subir(e.x, e.y, ['rgba(70,60,70,0.7)', 'rgba(120,110,120,0.6)'], 7, { tam: 16 * esc, vida: 0.8, larg: 30 * esc });
      part.anel(e.x, e.y, '#ffd23f', 50 * esc);
      break;
    case 'festa':
      part.estourar(e.x, e.y, (pal && pal.festa) || ['#ffd84a'], 30, 1.5 * esc, { vida: 1 });
      break;
    default: break;
  }
}
