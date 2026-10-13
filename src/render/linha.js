// Linha do tempo das animacoes: transforma os eventos de uma jogada numa
// agenda absoluta (ms) de voos, deslizes, pulsos, fantasmas (cartas que ja
// nao existem no estado), valores antigos, tremores e efeitos. O render
// desenha sempre o estado NOVO e consulta aqui a pose de cada carta.
// Uma acao nova no meio da cascata chama acelerar(): tudo o que falta
// termina em ate 80 ms. Funcoes puras do tempo: ?quadro=ms congela.
//
// Subida de nivel: depois da cascata, as cartas abaixo do piso do baralho
// novo (evento graduar) sobem e somem, uma de cada vez, e a carta de cima do
// descarte sai (a pilha esvazia). Jogada recusada: tremor e o sinal de
// proibido sobre a coluna (ou o descarte).

export const DUR = {
  voo: 180, squash: 90, degrau: 140, sair: 350, fila: 160, explodir: 220, tremor: 220, volta: 160,
  graduar: 70, proibido: 650,
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
const easeInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const lerp = (a, b, u) => a + (b - a) * u;
const lerpRect = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });

export function criarLinha() {
  /** @type {any[]} */ let tweens = [];    // { id, tipo:'voo'|'desliza'|'volta', ini, fim, de, para, arco }
  /** @type {any[]} */ let squashes = [];  // { id, ini, fim }
  /** @type {any[]} */ let pulsos = [];    // { id, ini, fim }
  /** @type {any[]} */ let fantasmas = []; // { id, carta, pos, voo?, saida:{ tipo, ini, fim }, ini }
  /** @type {any[]} */ let valores = [];   // { id, ate, valor }
  /** @type {any[]} */ let tremores = [];  // { c, ini, fim }
  /** @type {any[]} */ let entradas = [];  // { id, ini, fim }
  /** @type {any[]} */ let proibidos = []; // { c, ini, fim } (c = -1: o descarte)
  /** @type {any[]} */ let efeitos = [];   // { t, tipo, x, y, cor, ... } (consumidos pela cena)
  let ultimoFim = 0;

  function posAntes(antes, L, id) {
    for (let c = 0; c < antes.colunas.length; c++) {
      const i = antes.colunas[c].findIndex((k) => k.id === id);
      if (i >= 0) return L.carta(c, i);
    }
    const k = antes.fila.findIndex((x) => x.id === id);
    if (k >= 0) return L.filaPos(k);
    if (antes.descarte && antes.descarte.id === id) return { ...L.descarte };
    return null;
  }

  function centro(p) { return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; }

  /**
   * Agenda as animacoes de uma jogada.
   * @param {any[]} eventos
   * @param {any} L layout
   * @param {number} agora
   * @param {{ antes: any, depois: any, origem?: any, carta?: any }} info
   *   origem: retangulo de onde a carta jogada saiu (fila ou arrasto)
   */
  function montar(eventos, L, agora, info) {
    const { antes, depois } = info;
    const t0 = agora;
    const presentes = new Set();
    for (const col of depois.colunas) for (const k of col) presentes.add(k.id);
    for (const k of depois.fila) presentes.add(k.id);
    if (depois.descarte) presentes.add(depois.descarte.id);
    // fantasmas: tudo o que estava na mesa/fila e sumiu
    const porId = new Map();
    const registrar = (carta, pos) => {
      if (presentes.has(carta.id) || porId.has(carta.id) || !pos) return;
      const f = { id: carta.id, carta: { ...carta }, pos, voo: null, saida: { tipo: 'encolher', ini: t0, fim: t0 + DUR.degrau }, ini: t0 };
      porId.set(carta.id, f);
      fantasmas.push(f);
    };
    antes.colunas.forEach((col, c) => col.forEach((k, i) => registrar(k, L.carta(c, i))));
    antes.fila.forEach((k, i) => registrar(k, L.filaPos(i)));
    const jogada = info.carta || antes.fila[0];
    const origem = info.origem || (jogada ? posAntes(antes, L, jogada.id) : null) || L.filaPos(0);
    let t = t0;
    let nA = 0, cAtual = -1, degraus = 0;
    for (const ev of eventos) {
      switch (ev.tipo) {
        case 'colocar': {
          const para = L.carta(ev.c, ev.altura);
          tweens.push({ id: ev.id, tipo: 'voo', ini: t0, fim: t0 + DUR.voo, de: origem, para, arco: 1 });
          squashes.push({ id: ev.id, ini: t0 + DUR.voo, fim: t0 + DUR.voo + DUR.squash });
          t = t0 + DUR.voo;
          efeitos.push({ t, tipo: 'pouso', ...centro(para) });
          break;
        }
        case 'fundir': {
          if (ev.degrau === 1) { cAtual = ev.c; nA = antes.colunas[ev.c].length; degraus = 0; }
          degraus = ev.degrau;
          const tk = t0 + DUR.voo + (ev.degrau - 1) * DUR.degrau;
          const alvo = L.carta(ev.c, Math.max(0, nA - ev.degrau));
          valores.push({ id: ev.id, ate: tk + DUR.degrau * 0.45, valor: ev.valor / 2 });
          pulsos.push({ id: ev.id, ini: tk, fim: tk + DUR.degrau });
          const g = porId.get(ev.idEntra);
          if (g) {
            if (ev.degrau === 1 && jogada && ev.idEntra === jogada.id) {
              g.pos = origem;
              g.voo = { ini: t0, fim: t0 + DUR.voo, de: origem, para: alvo };
            }
            g.saida = { tipo: 'encolher', ini: tk, fim: tk + DUR.degrau, em: alvo };
          }
          efeitos.push({ t: tk + DUR.degrau * 0.4, tipo: 'fusao', ...centro(alvo), valor: ev.valor, degrau: ev.degrau, pontos: ev.pontos });
          t = tk + DUR.degrau;
          break;
        }
        case 'dobro': {
          const col = antes.colunas[ev.c];
          nA = col.length + 1; cAtual = ev.c; degraus = 0;
          const alvo = L.carta(ev.c, col.length - 1);
          const g = porId.get(jogada && jogada.id);
          if (g) { g.pos = origem; g.voo = { ini: t0, fim: t0 + DUR.voo, de: origem, para: alvo }; g.saida = { tipo: 'encolher', ini: t0 + DUR.voo, fim: t0 + DUR.voo + DUR.degrau, em: alvo }; }
          valores.push({ id: ev.id, ate: t0 + DUR.voo + DUR.degrau * 0.45, valor: ev.valor / (ev.fator || 2) });
          pulsos.push({ id: ev.id, ini: t0 + DUR.voo, fim: t0 + DUR.voo + DUR.degrau });
          efeitos.push({ t: t0 + DUR.voo + DUR.degrau * 0.4, tipo: 'fusao', ...centro(alvo), valor: ev.valor, degrau: 1, pontos: ev.pontos });
          t = t0 + DUR.voo + DUR.degrau;
          break;
        }
        case 'completar': {
          const g = porId.get(ev.id);
          const pos = g ? g.pos : L.carta(ev.c, 0);
          // o fantasma guarda a carta de antes da cascata; quem sai e o valor completado
          if (g) { g.carta = { ...g.carta, v: ev.valor }; g.saida = { tipo: 'sair', ini: t, fim: t + DUR.sair, em: pos }; }
          efeitos.push({ t: t + 60, tipo: 'completar', ...centro(pos), valor: ev.valor, pontos: ev.pontos });
          t += DUR.sair * 0.6;
          break;
        }
        case 'bomba': case 'martelo': {
          const g = porId.get(ev.id);
          const tb = ev.tipo === 'bomba' ? t0 + DUR.voo : t0;
          if (ev.tipo === 'bomba' && jogada) {
            const gj = porId.get(jogada.id);
            const alvo = g ? g.pos : L.carta(ev.c, 0);
            if (gj) { gj.pos = origem; gj.voo = { ini: t0, fim: tb, de: origem, para: alvo }; gj.saida = { tipo: 'explodir', ini: tb, fim: tb + DUR.explodir, em: alvo }; }
          }
          if (g) g.saida = { tipo: 'explodir', ini: tb, fim: tb + DUR.explodir, em: g.pos };
          tremores.push({ c: ev.c, ini: tb, fim: tb + DUR.tremor });
          efeitos.push({ t: tb, tipo: 'explodir', ...centro(g ? g.pos : L.carta(ev.c, 0)) });
          t = tb + DUR.explodir * 0.5;
          break;
        }
        case 'recusar': {
          const c = ev.c >= 0 ? ev.c : -1;
          tremores.push({ c, ini: t0, fim: t0 + DUR.tremor });
          proibidos = proibidos.filter((p) => p.c !== c);
          proibidos.push({ c, ini: t0, fim: t0 + DUR.proibido });
          break;
        }
        case 'descarteVazio': {
          const pos = { ...L.descarte };
          const f = { id: ev.id, carta: { ...ev.carta }, pos, voo: null, saida: { tipo: 'sair', ini: t + 120, fim: t + 120 + DUR.sair, em: pos }, ini: t0 };
          fantasmas.push(f);
          break;
        }
        case 'descartar': {
          tweens.push({ id: ev.id, tipo: 'voo', ini: t0, fim: t0 + DUR.voo, de: origem, para: { ...L.descarte }, arco: 0.5 });
          t = t0 + DUR.voo;
          break;
        }
        case 'limpar': {
          ev.ids.forEach((id, i) => {
            const g = porId.get(id);
            if (g) g.saida = { tipo: 'sair', ini: t0 + i * 40, fim: t0 + i * 40 + DUR.sair, em: g.pos };
          });
          tremores.push({ c: ev.c, ini: t0, fim: t0 + DUR.tremor });
          t = t0 + DUR.sair;
          break;
        }
        case 'combo': efeitos.push({ t, tipo: 'combo', n: ev.n, ...centro(L.carta(cAtual >= 0 ? cAtual : 0, Math.max(0, nA - degraus))) }); break;
        case 'graduar': {
          // depois da cascata: as cartas pequenas sobem e somem, uma de cada vez
          ev.cartas.forEach((k, i) => {
            const g = porId.get(k.id);
            const ti = t + 120 + i * DUR.graduar;
            if (g) g.saida = { tipo: 'sair', ini: ti, fim: ti + DUR.sair, em: g.pos };
            if (g) efeitos.push({ t: ti, tipo: 'graduar', ...centro(g.pos), valor: k.valor });
          });
          t += 120 + ev.cartas.length * DUR.graduar;
          break;
        }
        case 'item': {
          if (ev.item === 'coringa' && info.origem) { /* a carta coringa do item e um fantasma registrado abaixo */ }
          break;
        }
        default: break;
      }
    }
    // item coringa: a carta nao estava em lugar nenhum; cria o fantasma do voo
    const itemCoringa = eventos.find((e) => e.tipo === 'item' && e.item === 'coringa');
    if (itemCoringa && !porId.has(itemCoringa.id)) {
      const f = eventos.find((e) => e.tipo === 'fundir' && e.degrau === 1 && e.idEntra === itemCoringa.id);
      const col = antes.colunas[itemCoringa.c];
      const alvo = L.carta(itemCoringa.c, Math.max(0, col.length - 1));
      const g = { id: itemCoringa.id, carta: { id: itemCoringa.id, tipo: 'coringa', v: 0 }, pos: origem, voo: { ini: t0, fim: t0 + DUR.voo, de: origem, para: alvo }, saida: { tipo: 'encolher', ini: t0 + DUR.voo, fim: t0 + DUR.voo + DUR.degrau, em: alvo }, ini: t0 };
      if (f) { fantasmas.push(g); porId.set(g.id, g); }
    }
    // cartas que mudaram de altura na coluna (a carta de baixo saiu)
    deslizar(antes, depois, L, () => t0, t0);
    // fila: quem deslizou e quem entrou
    const idxAntes = new Map(antes.fila.map((k, i) => [k.id, i]));
    depois.fila.forEach((k, i) => {
      if (idxAntes.has(k.id)) {
        const de = idxAntes.get(k.id);
        if (de !== i) tweens.push({ id: k.id, tipo: 'desliza', ini: t0, fim: t0 + DUR.fila, de: L.filaPos(de), para: L.filaPos(i), arco: 0 });
      } else entradas.push({ id: k.id, ini: t0 + 40, fim: t0 + 40 + DUR.fila });
    });
    ultimoFim = Math.max(ultimoFim, t + DUR.sair);
  }

  /**
   * Desliza as cartas que continuam na mesma coluna em outra altura. Ate `mov`
   * a carta fica na altura antiga; depois desce (ou sobe) em DUR.reflow.
   */
  function deslizar(de, para, L, movDe, ini) {
    for (let c = 0; c < para.colunas.length; c++) {
      const antes = new Map((de.colunas[c] || []).map((k, i) => [k.id, i]));
      para.colunas[c].forEach((k, i) => {
        if (!antes.has(k.id) || antes.get(k.id) === i) return;
        const mov = movDe(c);
        tweens.push({ id: k.id, tipo: 'desliza', ini, mov, fim: mov + DUR.reflow, de: L.carta(c, antes.get(k.id)), para: L.carta(c, i), arco: 0 });
      });
    }
  }

  /** Carta arrastada e solta fora: volta para a fila. */
  function voltar(id, de, para, agora) {
    tweens.push({ id, tipo: 'volta', ini: agora, fim: agora + DUR.volta, de, para, arco: 0 });
  }

  /** Pose de uma carta que existe no estado, ou null. */
  function pose(id, agora) {
    let r = null;
    for (const tw of tweens) {
      if (tw.id !== id || agora < tw.ini || agora > tw.fim) continue;
      const comeco = tw.mov !== undefined ? tw.mov : tw.ini;
      const u = easeOut((agora - comeco) / Math.max(1, tw.fim - comeco));
      r = { ...lerpRect(tw.de, tw.para, u), esc: 1, escY: 1, alpha: 1, voando: tw.tipo === 'voo' };
      if (tw.arco) r.y -= Math.sin(u * Math.PI) * tw.para.h * 0.25 * tw.arco;
      if (tw.tipo === 'voo') r.esc = 1 + Math.sin(u * Math.PI) * 0.08;
    }
    for (const s of squashes) {
      if (s.id !== id || agora < s.ini || agora > s.fim) continue;
      const u = (agora - s.ini) / Math.max(1, s.fim - s.ini);
      r = r || { esc: 1, escY: 1, alpha: 1 };
      r.escY = 1 - Math.sin(u * Math.PI) * 0.16;
      r.esc = (r.esc || 1) * (1 + Math.sin(u * Math.PI) * 0.06);
    }
    for (const p of pulsos) {
      if (p.id !== id || agora < p.ini || agora > p.fim) continue;
      const u = (agora - p.ini) / Math.max(1, p.fim - p.ini);
      r = r || { esc: 1, escY: 1, alpha: 1 };
      r.esc = (r.esc || 1) * (1 + Math.sin(u * Math.PI) * 0.2);
    }
    for (const e of entradas) {
      if (e.id !== id || agora < e.ini || agora > e.fim) continue;
      const u = easeOut((agora - e.ini) / Math.max(1, e.fim - e.ini));
      r = r || { esc: 1, escY: 1, alpha: 1 };
      r.alpha = u;
      r.entrando = 1 - u;
    }
    return r;
  }

  /** Valor a mostrar para a carta (antes do meio da fusao e o antigo). */
  function valor(id, agora, atual) {
    let v = atual;
    for (const x of valores) if (x.id === id && agora < x.ate) v = x.valor;
    return v;
  }

  /** Fantasmas vivos agora: { carta, x, y, w, h, esc, alpha, rot }. */
  function listarFantasmas(agora) {
    const out = [];
    for (const g of fantasmas) {
      if (agora < g.ini || agora >= g.saida.fim) continue;
      let rect = g.pos, esc = 1, alpha = 1, rot = 0;
      if (g.voo && agora <= g.voo.fim) {
        const u = easeOut((agora - g.voo.ini) / Math.max(1, g.voo.fim - g.voo.ini));
        rect = lerpRect(g.voo.de, g.voo.para, u);
        rect.y -= Math.sin(u * Math.PI) * g.voo.para.h * 0.25;
        esc = 1 + Math.sin(u * Math.PI) * 0.08;
      } else if (g.voo) rect = g.voo.para;
      if (agora >= g.saida.ini) {
        const u = clamp((agora - g.saida.ini) / Math.max(1, g.saida.fim - g.saida.ini));
        const em = g.saida.em || rect;
        if (g.saida.tipo === 'encolher') { rect = { ...em }; esc = 1 - easeOut(u) * 0.85; alpha = 1 - u * 0.6; }
        else if (g.saida.tipo === 'sair') { rect = { ...em, y: em.y - easeInOut(u) * em.h * 2.2 }; esc = 1 + easeOut(u) * 0.35; alpha = 1 - u * u; rot = Math.sin(u * 6) * 0.08; }
        else if (g.saida.tipo === 'explodir') { rect = { ...em }; esc = 1 + u * 0.3; alpha = 1 - easeOut(u); }
      }
      const carta = { ...g.carta, v: valor(g.id, agora, g.carta.v) };
      out.push({ carta, x: rect.x, y: rect.y, w: rect.w, h: rect.h, esc, alpha, rot });
    }
    return out;
  }

  /** Deslocamento horizontal da coluna (tremor). c = -1 e o descarte. */
  function tremor(c, agora) {
    let dx = 0;
    for (const tr of tremores) {
      if (tr.c !== c || agora < tr.ini || agora > tr.fim) continue;
      const u = (agora - tr.ini) / Math.max(1, tr.fim - tr.ini);
      dx += Math.sin(u * Math.PI * 4) * (1 - u) * 7;
    }
    return dx;
  }

  /** Sinais de proibido vivos: { c, u } (u de 0 a 1 ao longo da vida). */
  function listarProibidos(agora) {
    return proibidos.filter((p) => agora >= p.ini && agora < p.fim).map((p) => ({ c: p.c, u: (agora - p.ini) / (p.fim - p.ini) }));
  }

  /** Efeitos cujo instante chegou (removidos da fila). */
  function drenarEfeitos(agora) {
    const prontos = efeitos.filter((e) => e.t <= agora);
    if (prontos.length) efeitos = efeitos.filter((e) => e.t > agora);
    return prontos;
  }

  function acelerar(agora) {
    const limite = agora + 80;
    const corta = (x) => { if (x.fim > limite) { x.ini = Math.min(x.ini, agora); if (x.mov !== undefined) x.mov = Math.min(x.mov, agora); x.fim = limite; } };
    tweens.forEach(corta); squashes.forEach(corta); pulsos.forEach(corta); tremores.forEach(corta); entradas.forEach(corta);
    for (const v of valores) v.ate = Math.min(v.ate, limite);
    for (const g of fantasmas) { if (g.voo) corta(g.voo); corta(g.saida); }
    for (const e of efeitos) e.t = Math.min(e.t, limite);
    ultimoFim = Math.min(ultimoFim, limite);
  }

  function ocupada(agora) { return agora < ultimoFim; }

  function podar(agora) {
    const viva = (x) => x.fim > agora;
    tweens = tweens.filter(viva); squashes = squashes.filter(viva); pulsos = pulsos.filter(viva); tremores = tremores.filter(viva); entradas = entradas.filter(viva);
    valores = valores.filter((v) => v.ate > agora);
    fantasmas = fantasmas.filter((g) => g.saida.fim > agora);
    proibidos = proibidos.filter(viva);
  }

  function limpar() { tweens = []; squashes = []; pulsos = []; fantasmas = []; valores = []; tremores = []; entradas = []; efeitos = []; proibidos = []; ultimoFim = 0; }

  return { montar, voltar, pose, valor, fantasmas: listarFantasmas, proibidos: listarProibidos, tremor, drenarEfeitos, acelerar, ocupada, podar, limpar, get fim() { return ultimoFim; } };
}
