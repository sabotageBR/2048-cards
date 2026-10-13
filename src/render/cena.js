// Cena do duelo: canvas de tela cheia com a arena do reino (camada parada em
// cache), o monstro, a mesa com a linha do tempo, particulas, mao de ajuda,
// entrada de fase e transicoes. Nao conhece a Poki nem o DOM alem do canvas.
// Um relogio so: o `agora` do main.js (ms) move a linha, os golpes e o monstro.
import { calcularLayout } from './layout.js';
import { desenharMesa, desenharMao, desenharGuia } from './mesa.js';
import { criarLinha } from './linha.js';
import { criarParticulas } from './particulas.js';
import { arenaDe } from './arena.js';
import { limparCache } from './cartas.js';
import { corDuelo, definirRotulosDuelo } from './cartaDuelo.js';
import { criarDuelo, registrarFormas } from './duelo.js';
import { monstroDaCadeia } from './monstros.js';
import { TINTA } from './desenho.js';
import { vidaDe } from '../jogo/metas.js';
import { Transicoes as Tr } from './transicoes.js';

const FONTE = 'Fredoka, "Arial Rounded MT Bold", system-ui, sans-serif';

/** @param {HTMLCanvasElement} canvas */
export function criarCena(canvas) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const linha = criarLinha();
  const part = criarParticulas();
  registrarFormas(part);
  const duelo = criarDuelo();
  let W = 1, H = 1, dpr = 1, topo = 0, base = 0;
  let L = null;
  let regras = { colunas: 4, pilhaMax: 6, tamFila: 3 };
  let arena = arenaDe(1);
  let reino = 1;
  /** @type {HTMLCanvasElement|null} */ let fundo = null;
  let tVis = 0;
  let txt = { naMao: 'in hand', descartar: 'discard', semCarga: 'empty', critico: 'CRITICAL!', livre: 'Free!', combo: 'COMBO ×{n}', errou: 'MISS!', enfurecido: 'ENRAGED!' };

  const layout = () => calcularLayout({ W, H, topo, base, colunas: regras.colunas, pilhaMax: regras.pilhaMax, tamFila: regras.tamFila, arena: true });

  function redimensionar(w, h, d, t, b) {
    W = w; H = h; dpr = d; topo = t; base = b || 0;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    L = layout();
    fundo = null;
    limparCache();
  }

  function definirRegras(r) {
    const mudou = !L || r.colunas !== regras.colunas || r.pilhaMax !== regras.pilhaMax || r.tamFila !== regras.tamFila;
    regras = { colunas: r.colunas, pilhaMax: r.pilhaMax, tamFila: r.tamFila };
    L = layout();
    if (mudou) fundo = null; // a arena acompanha a posicao do monstro
    linha.limpar();
  }

  /** Reino da arena (1..5). */
  function definirReino(n) {
    if (n === reino) return;
    reino = n;
    arena = arenaDe(n);
    fundo = null;
  }

  /** Textos do idioma desenhados no canvas. */
  function definirTextos(T) {
    txt = { naMao: T.naMao, descartar: T.descartarRotulo, semCarga: T.semCarga, critico: T.critico, livre: T.livre, combo: T.combo, errou: T.errou, enfurecido: T.enfurecido };
    definirRotulosDuelo({ bomba: T.bomba });
    limparCache();
  }

  const emFuria = (e) => !!(e && e.monstro && e.monstro.emFuria);
  /** Fase nova (ou partida retomada): monstro, vida e furia. */
  function novaBatalha(def, estado) {
    duelo.novaBatalha(def, vidaDe(estado), emFuria(estado));
    part.limpar();
  }
  /** Desfazer: a vida mostrada (e a furia; na cadeia, o proprio monstro) volta para a do estado. */
  function sincronizar(estado) {
    const cadeia = estado && estado.monstro && estado.monstro.cadeia;
    duelo.sincronizar(vidaDe(estado), emFuria(estado), cadeia ? monstroDaCadeia(estado.monstro) : null);
  }

  function prepararFundo() {
    fundo = document.createElement('canvas');
    fundo.width = canvas.width; fundo.height = canvas.height;
    const g = /** @type {CanvasRenderingContext2D} */ (fundo.getContext('2d'));
    g.scale(dpr, dpr);
    arena.parado(g, W, H, L);
  }

  /** Agenda as animacoes de uma jogada. Na cadeia, um monstro derrotado espera os golpes para cair. */
  function tocar(eventos, agora, info) {
    linha.montar(eventos, L, agora, info);
    if (eventos.some((e) => e.tipo === 'derrotado') && info.depois && info.depois.monstro) duelo.esperarDerrota(monstroDaCadeia(info.depois.monstro));
  }

  function efeito(e, agora) {
    const esc = Math.max(0.6, Math.min(1.4, L.cw / 62));
    switch (e.tipo) {
      case 'pouso':
        part.estourar(e.x, e.y + L.ch * 0.3, ['#ffe27a', '#f6c453', '#fff3c2'], 9, 0.4 * esc, { g: 160, vida: 0.45, tam: 4 * esc, forma: 'c' });
        break;
      case 'fusao': {
        const cor = corDuelo(e.valor);
        part.estourar(e.x, e.y, [cor, '#ffe27a', '#ffffff'], 8 + e.degrau * 3, (0.7 + e.degrau * 0.12) * esc, { forma: 'estrela', tam: 8 * esc, g: 300 });
        part.anel(e.x, e.y, cor, (28 + e.degrau * 6) * esc);
        duelo.golpear(e, agora, part, L.monstro);
        if (e.degrau > 1) part.texto(e.x, e.y - L.ch * 0.4, '×' + e.degrau, '#ffe27a', (22 + e.degrau * 2) * esc, TINTA);
        break;
      }
      case 'completar':
        part.estourar(e.x, e.y, ['#ffe27a', '#ffffff', '#12bfd2'], 30, 1.5 * esc, { forma: 'estrela', tam: 11 * esc });
        duelo.golpear(e, agora, part, L.monstro);
        break;
      case 'explodir':
        part.estourar(e.x, e.y, ['#ff8a3d', '#ffd23f', '#ff3b3b'], 22, 1.3 * esc, { forma: 'estrela', tam: 9 * esc });
        part.subir(e.x, e.y, ['rgba(70,60,70,0.7)', 'rgba(120,110,120,0.6)'], 7, { tam: 16 * esc, vida: 0.8, larg: 30 * esc });
        part.anel(e.x, e.y, '#ffd23f', 50 * esc);
        break;
      case 'pedra': part.estourar(e.x, e.y, ['#8d919b', '#5b5f69', '#c3c7cf'], 18, 1.1 * esc, { forma: 'lasca', tam: 9 * esc }); break;
      case 'racha': part.estourar(e.x, e.y, ['#8d919b', '#c3c7cf'], 7, 0.6 * esc, { forma: 'lasca', tam: 6 * esc }); break;
      case 'gelo': part.estourar(e.x, e.y, ['#e1f6ff', '#9fdcff', '#ffffff'], 16, 0.8 * esc, { forma: 'caco', tam: 10 * esc, g: 300 }); break;
      case 'cadeado':
        part.estourar(e.x, e.y, ['#c3cad6', '#8b93a3', '#e8b84a'], 14, 0.9 * esc, { forma: 'q', tam: 6 * esc });
        part.texto(e.x, e.y - 20, txt.livre, '#ffe27a', 20 * esc, TINTA);
        break;
      case 'combo':
        if (e.n >= 2) part.texto(e.x, e.y - L.ch * 0.75, txt.combo.replace('{n}', String(e.n)), '#ff9f2f', (22 + Math.min(10, e.n * 2)) * esc, TINTA);
        break;
      // ataque do monstro
      case 'feitico': duelo.atacar(e, agora, part, L.monstro); break;
      case 'projetil': duelo.lancar(e, part, L.monstro); break;
      case 'impacto': duelo.impactar(e, part, esc); break;
      case 'erro': duelo.errar(e, part, esc, txt); break;
      case 'furia': duelo.enfurecer(agora, part, L.monstro, txt); break;
      default: break;
    }
  }

  /**
   * @param {number} dt s
   * @param {number} agora ms
   * @param {any} [estado] estado do jogo (a vida do monstro sai dele)
   * @returns {any[]} efeitos que aconteceram neste passo (para o som), golpes incluidos
   */
  function atualizar(dt, agora, estado) {
    tVis += dt;
    part.atualizar(dt);
    const prontos = linha.drenarEfeitos(agora);
    for (const e of prontos) efeito(e, agora);
    const golpes = estado && L ? duelo.atualizar(dt, agora, vidaDe(estado), part, L.monstro, txt, linha.golpesPorVir()) : [];
    // cadeia: o proximo monstro pode ser de outro reino (a arena troca junto)
    for (const g of golpes) if (g.tipo === 'novoMonstro' && g.def.reino !== reino) definirReino(g.def.reino);
    linha.podar(agora - 50);
    return golpes.length ? prontos.concat(golpes) : prontos;
  }

  /**
   * @param {{ estado: any, agora: number, trans?: any, tEntrada?: number, arrasto?: any, destaque?: number, legal?: boolean, mao?: any, febre?: number, info?: any, semFila?: boolean, alvo?: string }} q
   */
  function desenhar(q) {
    if (!L) return;
    if (!fundo) prepararFundo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(fundo, 0, 0, W, H);
    arena.vivo(ctx, W, H, tVis, L);
    const pal = arena.paleta;
    const t = q.agora / 1000;
    // entrada de fase e soco de camera da vitoria
    let zoom = 1, branco = 0;
    if (q.tEntrada !== undefined && q.tEntrada > -1e8) {
      const en = Tr.entrada((q.agora - q.tEntrada) / 1000);
      zoom = en.zoom; branco = en.branco;
    }
    // a transicao pode comecar no futuro (espera o golpe final): antes disso nao existe
    const trans = q.trans && q.agora >= q.trans.t0 ? q.trans : null;
    if (trans) zoom *= Tr.camera(trans.tipo, (q.agora - trans.t0) / 1000).zoom;
    ctx.save();
    if (zoom !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); }
    // ate o feitico cair, a mesa mostrada e a de antes dele
    const vis = q.estado ? linha.visivel(q.estado, q.agora) : null;
    if (L.monstro) {
      duelo.desenhar(ctx, L.monstro, t, q.agora);
      if (vis && !trans) duelo.selo(ctx, L.monstro, vis.monstro, q.agora, L.retrato ? W : L.mesa.x);
    }
    if (vis) {
      desenharMesa(ctx, vis, L, { pal, agora: q.agora, t, dpr, linha, arrasto: q.arrasto, destaque: q.destaque, legal: q.legal, febre: q.febre || 0, semFila: q.semFila, alvo: q.alvo || '', textos: txt });
    }
    part.desenhar(ctx);
    if (q.mao && q.mao.de) desenharGuia(ctx, q.mao, tVis, dpr);
    else if (q.mao) desenharMao(ctx, q.mao.x, q.mao.y, tVis, '#fff');
    ctx.restore();
    duelo.frente(ctx, W, H, q.agora, !!q.febre);
    if (branco > 0) { ctx.fillStyle = `rgba(255,255,255,${branco})`; ctx.fillRect(0, 0, W, H); }
    if (trans) {
      Tr.desenhar(ctx, trans.tipo, (q.agora - trans.t0) / 1000, { W, H, fx: trans.fx, fy: trans.fy, texto: q.info && q.info.texto, textoMundo: q.info && q.info.textoMundo, pontos: [], corMundo: trans.corMundo, semente: trans.semente, trilha: trans.trilha });
    }
  }

  return {
    redimensionar, definirRegras, definirReino, definirTextos, novaBatalha, sincronizar, tocar, atualizar, desenhar, part, linha,
    get L() { return L; }, get pal() { return arena.paleta; }, get reino() { return reino; },
    get W() { return W; }, get H() { return H; },
    /** vida mostrada (hp) e a barra clara que segue atras (hpVis) */
    get vida() { return { hp: duelo.hp, hpVis: duelo.hpVis }; },
    get monstro() { return duelo.def; },
  };
}

export { FONTE };
