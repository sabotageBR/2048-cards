// Pagina de escolha dos 50 layouts. A marca fica no localStorage deste navegador.
import { ATUAIS, CATALOGO, ESCOLHIDOS, REINOS } from './catalogo.js';
import { NOTAS } from './notas.js';
import { desenharAtaque } from './ataques.js';
import { desenharLayout } from './silhuetas.js';
import { desenharMonstro, variante } from '../../src/render/monstros.js';

const CHAVE = 'monstros-layout-escolha';
const W = 360;
const H = 320;

function ler() {
  try {
    const ids = JSON.parse(localStorage.getItem(CHAVE) || '[]');
    return new Set(Array.isArray(ids) ? ids : []);
  } catch { return new Set(); }
}

function gravar(escolha) {
  try { localStorage.setItem(CHAVE, JSON.stringify([...escolha].sort())); } catch { /* ignora */ }
}

function tela(canvas, desenhar) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e7e2f2';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H - 22);
  ctx.strokeStyle = 'rgba(42,22,48,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-150, 1);
  ctx.lineTo(150, 1);
  ctx.stroke();
  desenhar(ctx);
  ctx.restore();
}

const QUADROS = [1, 0.18, 0.4, 0.55, 0.7, 0.9];

function poseAtual(ctx, item, u, R) {
  desenharMonstro(ctx, variante(item.especie, 1), { x: 0, y: 0, R }, 1.3, { ataque: u, golpe: 1 });
}

function tira(n, fw, fh, desenhar) {
  const c = document.createElement('canvas');
  c.className = 'tira';
  c.width = fw * n;
  c.height = fh;
  const ctx = c.getContext('2d');
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.translate(i * fw, 0);
    ctx.fillStyle = '#e7e2f2';
    ctx.fillRect(0, 0, fw, fh);
    ctx.translate(fw / 2, fh - 6);
    desenhar(ctx, i);
    ctx.restore();
  }
  return c;
}

function celula(legenda, ...nos) {
  const box = document.createElement('div');
  box.className = 'celula';
  const s = document.createElement('span');
  s.textContent = legenda;
  box.append(s, ...nos);
  return box;
}

/** Prepara, golpe (segurado) e volta. O video dos quadros pintados nao rodou. */
function quadroAtaque(ctx, id, i, R) {
  if (i === 2 || i === 3) {
    desenharAtaque(ctx, id, R);
    return;
  }
  ctx.save();
  if (i === 1) ctx.scale(1.08, 0.88);
  else if (i === 4) ctx.scale(0.97, 1.05);
  desenharLayout(ctx, id, R);
  ctx.restore();
}

function spritesDesenho(id) {
  const caixa = document.createElement('div');
  caixa.className = 'sprites';
  const visor = document.createElement('canvas');
  visor.className = 'desenho';
  let i = 0;
  const frame = () => tela(visor, (ctx) => quadroAtaque(ctx, id, i, 96));
  frame();
  setInterval(() => { i = (i + 1) % 6; frame(); }, 140);
  caixa.append(visor, tira(6, 88, 80, (ctx, n) => quadroAtaque(ctx, id, n, 28)));
  return caixa;
}

function cartaAtual(item) {
  const el = document.createElement('article');
  el.className = 'carta atual';
  el.dataset.reino = item.reino;
  const parado = document.createElement('canvas');
  parado.className = 'desenho';
  tela(parado, (ctx) => poseAtual(ctx, item, 1, 108));
  const ataque = document.createElement('canvas');
  ataque.className = 'desenho';
  tela(ataque, (ctx) => poseAtual(ctx, item, 0.7, 108));
  const faixa = tira(QUADROS.length, 88, 80, (ctx, i) => poseAtual(ctx, item, QUADROS[i], 30));
  el.append(
    celula('parado', parado),
    celula('ataque', ataque),
    celula('sprites', faixa),
    rotulo(item.nome, REINOS[item.reino].nome, 'o de hoje'),
  );
  return el;
}

function linhaEscolhida(item) {
  const el = document.createElement('article');
  el.className = 'linha';
  const quem = document.createElement('div');
  quem.className = 'quem';
  const nome = document.createElement('strong');
  nome.textContent = `${item.id} ${item.nome}`;
  const reino = document.createElement('span');
  reino.textContent = REINOS[item.reino].nome;
  quem.append(nome, reino);

  const parado = document.createElement('canvas');
  parado.className = 'desenho';
  tela(parado, (ctx) => desenharLayout(ctx, item.id, 108));
  const ataque = document.createElement('canvas');
  ataque.className = 'desenho';
  tela(ataque, (ctx) => desenharAtaque(ctx, item.id, 96));
  const pinturaAtaque = document.createElement('img');
  pinturaAtaque.className = 'pintura';
  pinturaAtaque.alt = '';
  pinturaAtaque.src = `pinturas-ataque/${item.id}.png`;

  const img = document.createElement('img');
  img.className = 'pintura';
  img.alt = '';
  img.src = `pinturas/${item.id}.png`;
  const vazio = document.createElement('p');
  vazio.className = 'vazio';
  vazio.textContent = 'sem pintura';
  img.addEventListener('error', () => { img.replaceWith(vazio); });

  el.append(
    quem,
    celula('parado', parado),
    celula('ataque', ataque, pinturaAtaque),
    celula('pintura', img),
    celula('sprites', spritesDesenho(item.id)),
  );
  return el;
}

function rotulo(nome, reino, extra) {
  const box = document.createElement('div');
  box.className = 'rotulo';
  const t = document.createElement('strong');
  t.textContent = nome;
  const s = document.createElement('span');
  s.textContent = extra ? `${reino} · ${extra}` : reino;
  box.append(t, s);
  return box;
}

function cartaLayout(item, escolha) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'carta';
  el.dataset.reino = item.reino;
  el.dataset.id = item.id;
  if (escolha.has(item.id)) el.classList.add('escolhida');
  el.setAttribute('aria-pressed', escolha.has(item.id) ? 'true' : 'false');

  const canvas = document.createElement('canvas');
  canvas.className = 'desenho';
  tela(canvas, (ctx) => desenharLayout(ctx, item.id, 108));

  const img = document.createElement('img');
  img.className = 'pintura';
  img.alt = '';
  img.src = `pinturas/${item.id}.png`;
  const vazio = document.createElement('p');
  vazio.className = 'vazio';
  vazio.textContent = 'sem pintura';
  img.addEventListener('error', () => { img.replaceWith(vazio); });

  el.append(canvas, img);
  if (NOTAS[item.id]) {
    const nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = NOTAS[item.id];
    el.append(nota);
  }
  el.append(rotulo(`${item.id} ${item.nome}`, REINOS[item.reino].nome));

  el.addEventListener('click', () => {
    if (escolha.has(item.id)) escolha.delete(item.id);
    else escolha.add(item.id);
    const on = escolha.has(item.id);
    el.classList.toggle('escolhida', on);
    el.setAttribute('aria-pressed', on ? 'true' : 'false');
    gravar(escolha);
    contar(escolha);
  });
  return el;
}

function contar(escolha) {
  const n = escolha.size;
  document.getElementById('conta').textContent = n === 1 ? '1 escolhido' : `${n} escolhidos`;
}

function main() {
  const escolha = ler();
  const atuais = document.getElementById('atuais');
  const grade = document.getElementById('grade');
  for (const item of ATUAIS) atuais.append(cartaAtual(item));
  const escolhidos = document.getElementById('escolhidos');
  for (const id of ESCOLHIDOS) {
    const item = CATALOGO.find((m) => m.id === id);
    if (item) escolhidos.append(linhaEscolhida(item));
  }
  for (const item of CATALOGO) grade.append(cartaLayout(item, escolha));
  contar(escolha);

  let reino = 'todos';
  const aplicar = () => {
    for (const el of grade.querySelectorAll('.carta')) {
      el.hidden = reino !== 'todos' && el.dataset.reino !== reino;
    }
  };

  const reinos = document.getElementById('reinos');
  for (const [id, rot] of [['todos', 'Todos'], ...Object.entries(REINOS).map(([id, r]) => [id, r.nome])]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = rot;
    b.className = id === 'todos' ? 'on' : '';
    b.addEventListener('click', () => {
      reino = id;
      for (const outro of reinos.children) outro.classList.remove('on');
      b.classList.add('on');
      aplicar();
    });
    reinos.append(b);
  }

  const vistas = document.getElementById('vistas');
  for (const [id, rot] of [['ambos', 'Os dois'], ['desenho', 'Desenho'], ['pintura', 'Pintura']]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = rot;
    if (id === 'ambos') b.classList.add('on');
    b.addEventListener('click', () => {
      document.body.dataset.vista = id;
      for (const outro of vistas.children) outro.classList.remove('on');
      b.classList.add('on');
    });
    vistas.append(b);
  }
  document.body.dataset.vista = 'ambos';

  document.getElementById('copiar').addEventListener('click', async () => {
    const texto = JSON.stringify({ ids: [...escolha].sort() });
    const botao = document.getElementById('copiar');
    try {
      await navigator.clipboard.writeText(texto);
      botao.textContent = 'Copiado';
    } catch {
      const caixa = document.createElement('textarea');
      caixa.value = texto;
      document.body.append(caixa);
      caixa.select();
      document.execCommand('copy');
      caixa.remove();
      botao.textContent = 'Copiado';
    }
    setTimeout(() => { botao.textContent = 'Copiar escolha'; }, 1400);
  });
}

main();
