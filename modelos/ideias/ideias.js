// Ideias de identidade: 5 temas jogaveis sobre o motor real (src/jogo/) e a
// linha do tempo de animacao (src/render/linha.js). Cada tema desenha tudo
// (fundo, mesa, pecas, fila, HUD e efeitos) num canvas; a geometria parte de
// calcularLayout e o tema pode trocar a posicao das pecas (geo).
// Grade: os 5 lado a lado, o bot joga ate o primeiro toque em cada celular.
//   ?ideia=bichos   um tema so, em tela cheia (teclas 1-5, D descarta, Z desfaz, R recomeca, A bot)
//   ?vitrine        mesa de demonstracao (fase de chefe: um toque na frente da fila fecha uma cascata ate 4096)
//   ?bot=0          sem o bot
//   ?quadro=600     prints: faz a melhor jogada e congela a cena 600 ms depois (simulado em passos de 16 ms)
//   ?parado         prints da grade: desenha alguns quadros e para (o headless nao vence 10 canvases animando)
// Nada daqui vai para a build (tools/empacotar.mjs so copia src/).
//
// Contrato de um tema (export default):
//   id, nome, cores: { texto, particulas: [] }
//   faixas?(W, H) -> { topo, base }        faixas livres para HUD (padrao topo 88)
//   geo?(L) -> parcial de L                carta(c,i), coluna(c), filaPos(k), descarte (ver geoTorre no kit)
//   fundo(ctx, W, H, L)                    camada parada (vai para cache); L ja com a geo do tema
//   vivo?(ctx, W, H, t, e, mem)            camada animada atras da mesa (t em segundos)
//   mesa?(ctx, L, e, t, mem)               base das colunas e slots vazios
//   peca(ctx, carta, r, op)                r centrado na origem { x: -w/2, y: -h/2, w, h };
//                                          carta.tipo: normal (v, gelo?) | coringa | bomba | dobro | pedra (hp)
//                                          op: { t, fila, frente, k, destaque (0..1), alpha }
//   cadeado?(ctx, area, c, e, t)           coluna trancada (por cima das pecas dela)
//   descarte?(ctx, r, e, t)                slot do descarte (a peca descartada vem por cima)
//   fila?(ctx, L, e, t)                    decoracao da fila (desenhada antes de todas as pecas)
//   frente?(ctx, L, e, t, mem)             camada por cima das pecas
//   hud(ctx, W, H, L, e, t, mem)
//   efeito?(fx, P, mem, agora) -> true se tratou   fx: { tipo, x, y, valor?, degrau?, n? }; agora em ms (mesmo relogio de t * 1000)
//        tipos: pouso | fusao | completar | explodir | pedra | racha | gelo | cadeado | combo
//   fim?(ctx, W, H, e, t, tema, mem)       tela de fim (padrao: faixa escura com texto)
//   jogo?: ganchos das ideias de JOGABILIDADE (tudo opcional; o estado do modo fica em inst.mem):
//     novaPartida?(semente, vitrine) -> estado  partida inicial propria
//     aoIniciar?(inst, agora)                    depois de criar ou recomecar (inst.mem ja limpo)
//     aoPasso?(inst, agora, dt)                  todo quadro, antes do bot (relogio, rival...)
//     aoJogar?(inst, antes, r, acao, agora) -> estado?   depois de cada jogada; um estado devolvido substitui inst.e
//     aoTocar?(inst, x, y, agora) -> true        toque consumido pelo modo (escolhas na tela)
//     pausado?(inst) -> boolean                  bloqueia jogadas e o bot (ex.: escolha de vantagem)
//     bot?(inst, agora) -> acao|null             jogada do bot quando o modo precisa de outra escolha
//   Para encerrar por conta propria (ex.: tempo esgotado): inst.e = { ...inst.e, fim: 'tempo' }; inst.fimEm = agora.
//   inst.agir(acao, agora) joga como o toque; inst.relayout() refaz o layout (mudou colunas/tamFila); inst.part = particulas.
import { calcularLayout } from '../../src/render/layout.js';
import { criarLinha } from '../../src/render/linha.js';
import { criarPartida, jogar, desfazerPara, jogadasLegais } from '../../src/jogo/partida.js';
import { melhorJogada } from '../../src/jogo/bot.js';
import { criarParticulas, texto, rr } from './kit.js';
import bichos from './temas/bichos.js';
import sushi from './temas/sushi.js';
import pocoes from './temas/pocoes.js';
import duelo from './temas/duelo.js';
import cidade from './temas/cidade.js';
import bolo from './temas/bolo.js';
import neve from './temas/neve.js';
import dinos from './temas/dinos.js';
import olimpo from './temas/olimpo.js';
import robos from './temas/robos.js';
import aboboras from './temas/aboboras.js';
import hq from './temas/hq.js';
import grafite from './temas/grafite.js';
import mahjong from './temas/mahjong.js';
import discos from './temas/discos.js';
import neon2 from './temas/neon2.js';
import vidro from './temas/vidro.js';
import escuro from './temas/escuro.js';
import esmalte from './temas/esmalte.js';
import cristal from './temas/cristal.js';
import argila from './temas/argila.js';
import rival from './temas/rival.js';
import relogio from './temas/relogio.js';
import escalada from './temas/escalada.js';
import sumie from './temas/sumie.js';
import zen from './temas/zen.js';
import deco from './temas/deco.js';

/** Rodadas de ideias (a 1 veio depois de o usuario recusar os 36 pares do laboratorio; a 2 pediu mais 10). */
export const RODADAS = [
  { n: 3, titulo: 'Rodada 3 · 12 ideias limpas: visual, app comercial, jogabilidade e temas', temas: [neon2, vidro, escuro, esmalte, cristal, argila, rival, relogio, escalada, sumie, zen, deco] },
  { n: 2, titulo: 'Rodada 2 · 10 ideias novas', temas: [bolo, neve, dinos, olimpo, robos, aboboras, hq, grafite, mahjong, discos] },
  { n: 1, titulo: 'Rodada 1 · 5 ideias', temas: [bichos, sushi, pocoes, duelo, cidade] },
];
export const TEMAS = RODADAS.flatMap((r) => r.temas);

/** Fichas das ideias (texto da pagina). */
export const FICHAS = {
  bichos: {
    gancho: 'O menor sobe nas costas do maior.',
    regra: 'A regra estrita vira bom senso: o elefante não sobe no rato. Dois bichos iguais viram o próximo da escada (pintinho → sapo → coelho → … → elefante → baleia). A baleia de 2048 sai num esguicho.',
    mundo: 'Mundos são habitats (fazenda, savana, gelo, selva, oceano). Pedra = rocha com musgo, gelo = bicho num cubo de gelo, cadeado = cercado, chefe = baleia-azul 4096.',
    thumb: 'Torre bamba de bichos com a baleia esguichando no topo.',
    favor: 'A regra se ensina sozinha; os bichos viram coleção (álbum) sem moeda; som de bicho a cada fusão.',
    contra: '11 personagens para desenhar bem; o número fica em segundo plano; pode parecer infantil para quem tem mais de 12 anos.',
  },
  sushi: {
    gancho: 'Restaurante de esteira: a fila é a esteira.',
    regra: 'A esteira traz os pratos (a fila de 3) e as colunas são pilhas de pratos no balcão. Pratos iguais viram um prato melhor, e a cor do prato diz o valor, como nos restaurantes de verdade. O barco de 2048 sai para o cliente.',
    mundo: 'Mundos são restaurantes (rua de Tóquio, praia, festival…). Pedra = pote de cerâmica, gelo = prato congelado, cadeado = placa "reservado", chefe = o crítico 4096.',
    thumb: 'Barco de sushi kawaii com rostinhos, saindo de uma pilha de pratos.',
    favor: 'Ninguém faz isso na Poki; comida kawaii agrada o público de 9 a 14 anos; a esteira explica a fila sem tutorial; o "plim" do prato é ótimo de ouvir.',
    contra: 'Muita comida para desenhar; fica longe da palavra "cards" (o nome pode mudar); pode lembrar jogos de "sushi sort".',
  },
  pocoes: {
    gancho: 'Tubos de ensaio e reação em cadeia.',
    regra: 'Cada coluna é um tubo e cada carta é uma camada de poção (a cor diz o valor). Poções iguais reagem e viram a seguinte, e a cascata borbulha de camada em camada. O elixir de 2048 transborda em brilho.',
    mundo: 'Mundos são oficinas (floresta, vulcão, gruta de cristal…). Pedra = sedimento no fundo do tubo, gelo = camada cristalizada, cadeado = tubo lacrado com cera, chefe = pedra filosofal 4096.',
    thumb: 'Tubo transbordando de elixir dourado, com as camadas reagindo.',
    favor: 'Milhões já entendem tubos de "water sort"; faixas largas leem bem em telas pequenas; borbulha e brilho custam pouco para desenhar e dão muito retorno visual.',
    contra: 'Pode ser confundido com um jogo de ordenar cores; magia é um tema comum; o número dentro do líquido precisa de contraste.',
  },
  duelo: {
    gancho: 'Cada fase é uma batalha contra um monstro.',
    regra: 'O monstro fica em cima com uma barra de vida, que é a meta da fase. Cada fusão é um golpe (dano = pontos), a cascata é um combo e o 2048 é o golpe especial. Os obstáculos são feitiços do monstro.',
    mundo: 'Mundos são reinos com um monstro por fase e um chefão a cada 8 (4096). Pedra = escudo de pedra, gelo = feitiço de gelo, cadeado = corrente.',
    thumb: 'Monstro gigante levando o golpe de uma cascata de cartas brilhantes, com o número do dano.',
    favor: 'Mostra na tela o diferencial "Aventura com chefes", que o Merge Solitaire não tem; cada fusão ganha sentido (dano visível); monstros viram bestiário.',
    contra: 'Precisa de arte de monstro por mundo; promete combate (o monstro só "ataca" pelos obstáculos que a fase já tem).',
  },
  cidade: {
    gancho: 'Cada 2048 é um prédio pronto no horizonte.',
    regra: 'As colunas são terrenos e cada carta é um bloco de prédio: valor maior, bloco mais largo. O menor sobe no maior e o prédio afina como um arranha-céu. O 2048 inaugura o prédio, que vai para o skyline, e a sua cidade cresce a cada monte.',
    mundo: 'Mundos são cidades (Rio, Tóquio, Nova York…). Pedra = entulho, gelo = bloco embargado, cadeado = tapume, chefe = arranha-céu 4096.',
    thumb: 'Arranha-céu aceso subindo no pôr do sol, com fogos.',
    favor: 'O progresso aparece fora da mesa (o skyline do jogador cresce), o que segura o jogador sem moeda; visual que agrada de 9 a 40 anos; janelas leem bem em tamanho pequeno.',
    contra: '"Cidade" lembra jogo de gestão; fundir andares é menos intuitivo que os bichos; precisa de um skyline por mundo.',
  },
  bolo: {
    gancho: 'O bolo de andares já é a regra: camada menor em cima da maior.',
    regra: 'Cada carta é uma camada de bolo; camadas iguais viram uma maior e mais enfeitada (morango, granulado, chocolate…). O bolo afina para cima como um bolo de casamento. O 2048 é o bolo completo, com cereja, que sai para a festa.',
    mundo: 'Mundos são festas (aniversário, casamento, piquenique, Natal…). Pedra = bolo queimado, gelo = camada congelada, cadeado = redoma de vidro, chefe = bolo de 7 andares 4096. O dobro vira fermento (faz crescer x2).',
    thumb: 'Bolo de andares gigante com a cereja caindo no topo.',
    favor: 'Metáfora perfeita da regra estrita (ninguém põe o andar grande em cima do pequeno); comida fofa atrai o público mais novo; o fermento explica o dobro.',
    contra: 'Comida de novo, como o sushi; pode lembrar jogos de confeitaria de montar; o 2048 vira um bolo enorme, difícil de mostrar pequeno.',
  },
  neve: {
    gancho: 'Cada coluna é um boneco de neve em construção.',
    regra: 'Bolas de neve iguais viram uma bola maior; a menor sempre vai em cima da maior, como num boneco de verdade. Quanto maior o valor, mais acessórios (botões, cachecol, nariz de cenoura, cartola). O 2048 é o boneco completo, que sai de trenó.',
    mundo: 'Mundos são paisagens de inverno (vila, floresta, polo, montanha, aurora). O gelo vira o obstáculo mais natural do jogo (bola presa num bloco de gelo). Pedra = rocha congelada, cadeado = presente embrulhado, chefe = boneco gigante 4096.',
    thumb: 'Boneco de neve de cartola, com a neve caindo e as luzes da vila.',
    favor: 'Leitura instantânea (bola grande embaixo); clima de fim de ano, bom para destaque sazonal na Poki em dezembro; paleta branca e azul limpa, diferente de tudo.',
    contra: 'Tema sazonal (fora do inverno perde a graça); bolas brancas exigem cor no número e nos acessórios para diferenciar os valores.',
  },
  dinos: {
    gancho: 'Cada fusão monta um dinossauro maior.',
    regra: 'As colunas são quadras de escavação, com o barbante dos arqueólogos, e cada carta é uma laje com um fóssil. Fósseis iguais se juntam num dino maior: ovo → filhote → … → braquiossauro → T-Rex. O 2048 é o esqueleto do T-Rex, que vai para o museu.',
    mundo: 'Mundos são sítios (deserto, cânion, geleira, selva, vulcão). Pedra = rocha dura, gelo = fóssil preso no âmbar (sai com uma fusão), cadeado = fita de "área restrita", chefe = mega-dino 4096. O dobro é uma lupa.',
    thumb: 'Fóssil de T-Rex saindo da terra, com ferramentas e poeira.',
    favor: 'Dinossauro é sucesso garantido de 6 a 12 anos; o âmbar dá sentido ao gelo; a coleção de fósseis (museu) é uma meta sem moeda.',
    contra: 'Precisa de 11 silhuetas de dino bem feitas; tons de terra podem apagar a mesa se não houver cor no número.',
  },
  olimpo: {
    gancho: 'As colunas são colunas de verdade: gregas.',
    regra: 'Cada carta é um tambor de mármore, e a coluna sobe afinando até o capitel. Tambores iguais viram um mais nobre (mármore → ouro → cristal). O 2048 é a coroa de louros dourada, que sobe ao Olimpo.',
    mundo: 'Mundos são templos de deuses (Zeus, Poseidon, Atena, Hades, Ártemis). Pedra = pedra bruta, gelo = hera enrolando o tambor, cadeado = portão de bronze, chefe = Titã 4096. Coringa = ambrosia, bomba = raio de Zeus, dobro = asas de Hermes.',
    thumb: 'Templo branco e dourado nas nuvens, com um raio atingindo a coluna.',
    favor: 'Trocadilho que se explica sozinho (colunas!); visual nobre e elegante, que agrada também os adultos; a mitologia rende chefes famosos.',
    contra: 'Mármore branco em céu claro pede contraste cuidadoso; mitologia pode soar escolar para quem tem 9 anos.',
  },
  robos: {
    gancho: 'Peças iguais se juntam num robô maior.',
    regra: 'Cada carta é um módulo com visor de LED: parafuso → engrenagem → bateria → chip → motor → braço → cabeça → robô. A cascata é a linha de montagem trabalhando sozinha. O 2048 é o robô gigante, que sai voando.',
    mundo: 'Mundos são fábricas (oficina, fundição, laboratório, base lunar, megafábrica). Pedra = sucata enferrujada, gelo = peça congelada em nitrogênio, cadeado = porta com scanner, chefe = mecha 4096. Coringa = chave universal, bomba = pulso eletromagnético, dobro = turbo.',
    thumb: 'Robô gigante decolando de uma pilha de módulos, entre faíscas.',
    favor: 'Robôs e montagem agradam o público de 9 a 14 anos; o visor de LED deixa o número superlegível; faíscas e vapor dão muito retorno visual.',
    contra: 'Mais frio e menos fofo; a fábrica pode ficar cinza demais sem cuidado com a cor.',
  },
  aboboras: {
    gancho: 'Halloween fofo: abóboras que crescem e brilham.',
    regra: 'Abóboras menores sobem nas maiores, e as iguais viram uma abóbora maior, com a vela mais forte e uma cara mais engraçada. O 2048 é o Rei Abóbora, que flutua até a lua.',
    mundo: 'Mundos são lugares assombrados (horta, cemitério, castelo, pântano, mansão). Pedra = lápide, gelo = teia de aranha, cadeado = portão do cemitério, chefe = abóbora gigante 4096. Bomba = fantasma "BU!".',
    thumb: 'Pilha de abóboras sorridentes com a lua cheia e morcegos.',
    favor: 'Outubro é agora (dá para lançar junto com o Halloween); assusta na medida certa para crianças; a luz das velas dá um brilho bonito e barato.',
    contra: 'Sazonal (funciona melhor como evento ou mundo do que como identidade fixa); abóboras são todas laranja, então cada valor pede uma diferença forte.',
  },
  hq: {
    gancho: 'Cada fusão é um "POW!" de quadrinho.',
    regra: 'As cartas viram quadrinhos com retícula, contorno grosso e o número em letreiro de HQ. Cada fusão é uma onomatopeia (POW, BAM, ZAP), a cascata escala até "KA-BOOM!" e o 2048 é uma página de abertura de herói.',
    mundo: 'Mundos são capítulos de uma revista (cidade, laboratório, espaço, esgoto, covil do vilão). Pedra = bloco de concreto, gelo = raio congelante do vilão, cadeado = cofre "ultrassecreto", chefe = supervilão 4096.',
    thumb: 'Carta 2048 estourando num balão "KA-BOOM!" com retícula colorida.',
    favor: 'Estilo fortíssimo, que ninguém usa em jogo de fusão; as onomatopeias já são retorno visual pronto; agrada de 9 a 40 anos.',
    contra: 'O visual carregado pode cansar; há risco de parecer marca de editora (precisa de heróis próprios).',
  },
  grafite: {
    gancho: 'Adesivos e spray num muro de tijolo.',
    regra: 'As cartas são adesivos colados no muro (tortinhos, com fita) e o número aparece em letra de grafite. Cada fusão é um jato de spray com respingos, e o 2048 vira um mural gigante assinado.',
    mundo: 'Mundos são bairros (beco, pista de skate, metrô, viaduto, telhado). Pedra = bloco de concreto, gelo = adesivo pintado de cinza pela prefeitura (volta com uma fusão), cadeado = porta de enrolar, chefe = mural 4096. Bomba = bomba de tinta (gíria do grafite).',
    thumb: 'Muro colorido com um 2048 em letra de grafite pingando tinta.',
    favor: 'O mais descolado: atrai quem tem 12 anos ou mais e acha o resto infantil; cores vivas sobre tijolo; som de spray e de skate.',
    contra: 'Pode afastar os mais novos; letra de grafite é difícil de ler, e o número precisa continuar claro.',
  },
  mahjong: {
    gancho: 'Peças de mahjong grossas, de marfim e jade.',
    regra: 'As cartas viram peças de pedra com espessura, gravadas com bambus, círculos, flores e dragões que mudam com o valor. Peças iguais se fundem num brilho de jade. O 2048 é o Dragão Dourado.',
    mundo: 'Mundos são salões (jardim de bambu, ponte, pagode, montanha, palácio). Pedra = jade bruto, gelo = selo de cera vermelho, cadeado = caixa laqueada trancada, chefe = dragão celestial 4096. Bomba = estalinho.',
    thumb: 'Peça de dragão dourado brilhando sobre peças de jade.',
    favor: 'Fala direto com o público de paciência e mahjong, que é enorme na Poki; aparência premium e calma; a cascata faz "clac" de pedra.',
    contra: 'Mais adulto e sóbrio; exige respeito cultural (nada de ideogramas falsos); peças grossas ocupam espaço em telas pequenas.',
  },
  discos: {
    gancho: 'A febre vira "Disco Fever": loja de discos dos anos 70.',
    regra: 'Cada carta é a capa de um disco, com arte setentista (sol, listras, ondas) e o número grande. Discos iguais viram um disco melhor, e o 2048 é o disco de platina, que sai girando. Cada degrau da cascata toca uma nota mais aguda.',
    mundo: 'Mundos são gêneros (funk, rock, disco, soul, reggae). Pedra = disco riscado, gelo = disco lacrado no plástico (abre com uma fusão), cadeado = vitrine de raridades, chefe = disco de diamante 4096. Coringa = disco colorido, dobro = lado B.',
    thumb: 'Disco de platina saindo da capa, com o toca-discos girando.',
    favor: 'Retrô quente, diferente do neon; a música dá à cascata uma identidade sonora forte; a febre ganha um nome perfeito.',
    contra: 'A referência aos anos 70 é mais dos pais do que das crianças; se a arte for fraca, as capas parecem cartas comuns.',
  },
  neon2: {
    cat: 'Visual limpo',
    rotulos: ['Como fica', 'No jogo'],
    gancho: 'A referência, com acabamento de jogo publicado.',
    regra: 'Fundo índigo profundo com uma mesa só, de borda luminosa. As cartas são lisas, com borda de luz na cor do valor, o número grande no canto e um brilho de vidro. Sem personagem e sem cenário: o brilho e a animação fazem o trabalho.',
    mundo: 'Cada mundo troca só a cor da luz (roxo, ciano, magenta, verde, ouro). Pedra, gelo e cadeado viram estados de luz: pedra apagada, gelo azul com cristais finos, cadeado com a coluna escurecida.',
    thumb: 'Cascata de cartas acendendo em sequência até um 2048 dourado.',
    favor: 'É o visual que você já escolheu como referência; lê bem em qualquer tela; custa pouco desenhar e anima muito bem.',
    contra: 'Fica mais perto do Merge Solitaire e dos clones; a diferença tem que vir dos modos e da animação.',
  },
  vidro: {
    cat: 'Visual limpo',
    rotulos: ['Como fica', 'No jogo'],
    gancho: 'Cartas de vidro fosco sobre luz colorida.',
    regra: 'Manchas de cor suaves se movem devagar no fundo, e as cartas são placas de vidro fosco tingidas pelo valor, com borda clara e sombra macia. A mesa é um vidro maior. Visual atual, de sistema operacional moderno.',
    mundo: 'Cada mundo troca a paleta das manchas (aurora, pôr do sol, oceano, floresta, noite). O gelo deixa a carta mais opaca, a pedra é um vidro escuro rachado e o cadeado embaça a coluna inteira.',
    thumb: 'Um 2048 de vidro brilhando sobre um fundo de aurora.',
    favor: 'Limpo e moderno, diferente de todo jogo de fusão na Poki; agrada de 12 a 40 anos; o desfoque esconde a simplicidade do desenho.',
    contra: 'Pode parecer frio; o contraste do número em vidro claro exige cuidado.',
  },
  escuro: {
    cat: 'Visual limpo',
    rotulos: ['Como fica', 'No jogo'],
    gancho: 'Preto fosco, uma cor por valor e números elegantes.',
    regra: 'Fundo grafite quase preto, cartas foscas com uma faixa fina de cor por valor e números grandes e elegantes. Nada brilha, só o 2048, em dourado. Muito espaço vazio e animações curtas e precisas.',
    mundo: 'Os mundos mudam só a cor de destaque. Os obstáculos são formas simples: pedra = carta texturizada, gelo = contorno tracejado azul, cadeado = coluna hachurada.',
    thumb: 'Um 2048 dourado sozinho numa mesa preta.',
    favor: 'O mais sofisticado e calmo; foco total na jogada; ótimo para quem acha jogos de fusão infantis.',
    contra: 'Pouco retorno visual para o público mais novo; a thumb precisa de muito contraste para chamar o clique.',
  },
  esmalte: {
    cat: 'App comercial',
    rotulos: ['Como fica', 'No jogo'],
    gancho: 'Cartas grossas e brilhantes, como nos jogos de loja.',
    regra: 'Cada carta é uma peça grossa de esmalte com bisel, brilho especular e sombra projetada; a cor fica mais rica conforme o valor sobe. Fundo em degradê suave com bokeh e botões em pílula brilhante. É a linguagem dos puzzles mais baixados.',
    mundo: 'Os mundos trocam a paleta e o fundo (manhã, tarde, noite...). A pedra vira granito polido, o gelo uma capa de gelo com reflexo e o cadeado uma corrente cromada.',
    thumb: 'Um 2048 dourado de esmalte saltando com brilho e estrelas.',
    favor: 'Parece jogo publicado de cara; volume e brilho dão prazer ao toque; funciona para todas as idades.',
    contra: 'Visual comum entre os jogos de celular; dá mais trabalho de desenho (luz, sombra e bisel em cada estado).',
  },
  cristal: {
    cat: 'App comercial',
    rotulos: ['Como fica', 'No jogo'],
    gancho: 'Cartas de cristal com reflexo e luz que atravessa.',
    regra: 'As cartas são blocos de cristal translúcido com arestas prismáticas, reflexo e a cor do valor por dentro. Raios de luz e cáusticas passam pelo fundo escuro azulado. Luxuoso e calmo.',
    mundo: 'Os mundos são tipos de cristal (quartzo, safira, esmeralda, rubi, diamante). Pedra = rocha bruta com veio, gelo = cristal fosco, cadeado = moldura de metal.',
    thumb: 'Um 2048 de diamante refratando luz em arco-íris.',
    favor: 'Sensação de prêmio a cada fusão; boa leitura, porque o número fica no centro iluminado; chama atenção na thumb.',
    contra: 'O visual de joia pode lembrar jogos de combinar gemas; muito brilho junto pode cansar.',
  },
  argila: {
    cat: 'App comercial',
    rotulos: ['Como fica', 'No jogo'],
    gancho: 'Formas macias em 3D pastel, como argila.',
    regra: 'Cartas fofas com sombras interna e externa suaves, cantos bem redondos, cores pastel foscas e números em relevo. Fundo liso pastel com poucas formas soltas. Lembra os apps de design atual e os jogos calmos de loja.',
    mundo: 'Os mundos trocam a paleta pastel (menta, pêssego, lavanda, céu, areia). Pedra = argila cinza craquelada, gelo = camada leitosa, cadeado = tampa arredondada.',
    thumb: 'Pilha de cartas fofas em pastel, com um 2048 em relevo.',
    favor: 'Aconchegante sem ser infantil; muito limpo; o relevo dá a sensação tátil de apertar.',
    contra: 'Pouco contraste por natureza (pastel); pode parecer aplicativo de produtividade.',
  },
  rival: {
    cat: 'Jogabilidade',
    rotulos: ['Como joga', 'No jogo'],
    gancho: 'Você contra o bot, mesa contra mesa.',
    regra: 'Sua mesa fica embaixo e a do rival, em miniatura, em cima; os dois jogam ao mesmo tempo. Cada monte que você completa congela uma carta na mesa do rival, e o contrário também. Vence quem fizer 2 montes primeiro.',
    mundo: 'Vira um modo "Duelo" ao lado da Aventura, com rivais cada vez mais rápidos e um campeonato por semana. Também serve de chefe: o chefe do mundo é um rival.',
    thumb: 'Duas mesas frente a frente, com um raio de gelo indo de uma para a outra.',
    favor: 'Competição sem precisar de online; tensão constante; é algo que o Merge Solitaire não tem.',
    contra: 'Em tela pequena a mesa do rival fica pequena; o bot precisa de níveis bem calibrados para não frustrar.',
  },
  relogio: {
    cat: 'Jogabilidade',
    rotulos: ['Como joga', 'No jogo'],
    gancho: '60 segundos, e cada fusão compra tempo.',
    regra: 'Um pavio de 60 s queima no alto da tela. Cada fusão devolve tempo (mais a cada degrau da cascata) e um monte completo dá +10 s. Quando o pavio acaba, a partida termina e vale a pontuação.',
    mundo: 'Modo "Corrida" e desafio diário com ranking; partidas curtas, que encaixam bem na Poki; dá para fazer chefes-relâmpago na Aventura.',
    thumb: 'Pavio queimando sobre uma cascata, com "+3 s" saltando.',
    favor: 'Partidas de 1 a 3 minutos, ótimas para "só mais uma"; recompensa a cascata de forma clara; fácil de entender.',
    contra: 'A pressão do tempo afasta quem gosta de pensar com calma; o tempo inicial precisa ser bem calibrado.',
  },
  escalada: {
    cat: 'Jogabilidade',
    rotulos: ['Como joga', 'No jogo'],
    gancho: 'A cada monte, escolha 1 de 3 vantagens.',
    regra: 'A partida é uma escalada: cada monte completo pausa a mesa e oferece 3 cartas de vantagem, como mão livre, +1 descarte, febre com 3 fusões, coringa a cada 12 cartas ou pontos x1,5. As vantagens se acumulam e mudam o jeito de jogar.',
    mundo: 'Modo "Escalada" no estilo roguelite: cada tentativa é diferente, com recorde de andares e vantagens raras desbloqueadas com as estrelas da Aventura (sem moeda).',
    thumb: 'Três cartas de vantagem brilhando sobre a mesa, uma delas sendo escolhida.',
    favor: 'O gênero do momento (estilo Balatro), com rejogabilidade enorme; traz decisões interessantes além de onde pôr a carta.',
    contra: 'As vantagens precisam de equilíbrio cuidadoso; explicar cada uma em pouco texto é difícil.',
  },
  sumie: {
    cat: 'Tema',
    rotulos: ['Como fica', 'Mundos e obstáculos'],
    gancho: 'Papel de arroz, pincel e um carimbo vermelho.',
    regra: 'Fundo de papel washi com uma montanha em tinta diluída. As cartas são de papel, com o número pintado a pincel e um carimbo vermelho que cresce com o valor. Nada mais na tela.',
    mundo: 'Os mundos são estações (primavera, verão, outono, inverno, lua). Pedra = pedra pintada a nanquim, gelo = papel encerado, cadeado = fita de papel selada.',
    thumb: 'Um 2048 pintado a pincel, com o carimbo vermelho, sobre papel creme.',
    favor: 'Elegante e calmo, com identidade forte e quase nenhum enfeite; tinta e papel escondem a simplicidade do desenho.',
    contra: 'Pouca cor (os valores precisam de diferença clara); estética mais adulta.',
  },
  zen: {
    cat: 'Tema',
    rotulos: ['Como fica', 'Mundos e obstáculos'],
    gancho: 'Seixos polidos sobre areia rastelada.',
    regra: 'A mesa é um jardim de areia com sulcos, e cada carta é um seixo liso e polido com o número gravado. Os valores altos viram pedras raras (jade, ônix, ouro). Silencioso e tátil.',
    mundo: 'Os mundos são jardins (musgo, bambu, cerejeira, neve, lua). Pedra = rocha bruta, gelo = seixo com geada, cadeado = corda trançada amarrada na coluna.',
    thumb: 'Um seixo dourado 2048 no centro de círculos na areia.',
    favor: 'O mais relaxante; formas simples e bonitas; o som de pedra batendo é ótimo.',
    contra: 'Seixos redondos aproveitam pior o espaço do que cartas; pouca energia para o público mais novo.',
  },
  deco: {
    cat: 'Tema',
    rotulos: ['Como fica', 'Mundos e obstáculos'],
    gancho: 'Anos 20: preto, creme e filetes dourados.',
    regra: 'Fundo preto com um padrão geométrico dourado bem sutil. As cartas são placas creme com moldura art déco em ouro e números em tipografia elegante; os valores altos ganham mais ouro e um leque. Luxo contido.',
    mundo: 'Os mundos são lugares da época (hotel, trem, teatro, transatlântico, arranha-céu). Pedra = mármore negro, gelo = vidro jateado, cadeado = grade dourada.',
    thumb: 'Um 2048 dourado com leque art déco sobre fundo preto.',
    favor: 'Sofisticado e raro nos jogos casuais; preto e ouro rendem uma thumb forte; agrada os adultos.',
    contra: 'Pode soar adulto demais para quem tem 9 anos; muito ouro exige cuidado para não lembrar cassino.',
  },
};

const DEMO = {
  id: 7, mundo: 1, modo: 'aventura', semente: 2048,
  baralho: { total: Infinity, dinamico: true, minimo: 8, especiais: { coringa: 0.06, bomba: 0.04, dobro: 0.04 } },
  inicio: [[512, 256, 128], [64, 32], [16, 8], []],
  obst: { pedras: { 3: 2 }, gelo: { 2: [4] } },
  metas: [{ tipo: 'montes', n: 1 }, { tipo: 'pontos', alvo: 6000 }],
  estrelas: [0, 6000, 9000],
};
// vitrine: fase de chefe (teto 4096) para o 2048 aparecer na mesa e a cascata ir ate o 4096
const VITRINE = {
  ...DEMO, semente: 7, chefe: true,
  inicio: [[2048, 1024, 512, 256, 128], [32, 16], [8], []],
  obst: { pedras: { 3: 3 }, gelo: { 2: [4] }, cadeados: { 1: { tipo: 'valor', v: 256 } } },
};

const q = new URLSearchParams(location.search);
const VIT = q.has('vitrine');
const QUADRO = q.has('quadro') ? Number(q.get('quadro')) || 0 : -1;
const PARADO = q.has('parado');
const BOT = q.get('bot') !== '0' && QUADRO < 0 && !PARADO;

function novaPartida(semente) {
  if (VIT) {
    const e = criarPartida({}, VITRINE, 7);
    e.fila = [{ id: 901, tipo: 'normal', v: 128, cor: 0 }, { id: 902, tipo: 'coringa', v: 0, cor: 0 }, { id: 903, tipo: 'bomba', v: 0, cor: 0 }];
    e.descarte = { id: 904, tipo: 'normal', v: 2, cor: 0 };
    e.pontos = 2480;
    e.metas = e.metas.map((m) => (m.tipo === 'pontos' ? { ...m, atual: 2480 } : m));
    return e;
  }
  return criarPartida({}, DEMO, semente);
}

/**
 * Um celular: canvas, estado, linha do tempo, particulas e o tema.
 * @param {any} tema
 * @param {HTMLCanvasElement} canvas
 */
function criarInstancia(tema, canvas, op) {
  const inst = {
    tema, canvas, ctx: /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d')),
    W: op.W, H: op.H, dpr: op.dpr, e: partidaDoTema(tema, DEMO.semente), linha: criarLinha(), part: criarParticulas(),
    L: null, Lt: null, fundo: null, hist: [], mem: {}, bot: op.bot, prox: performance.now() + 900, mira: -1, fimEm: 0,
  };
  // atalhos para os ganchos de jogabilidade: jogar (ex.: com k da mao livre) e refazer o layout (ex.: coluna extra)
  inst.agir = (acao, agora = performance.now()) => agir(inst, acao, agora);
  inst.relayout = () => redimensionar(inst, inst.W, inst.H, inst.dpr);
  redimensionar(inst, op.W, op.H, op.dpr);
  if (tema.jogo && tema.jogo.aoIniciar) tema.jogo.aoIniciar(inst, performance.now());
  return inst;
}

function partidaDoTema(tema, semente) {
  return tema.jogo && tema.jogo.novaPartida ? tema.jogo.novaPartida(semente, VIT) : novaPartida(semente);
}

function redimensionar(inst, W, H, dpr) {
  inst.W = W; inst.H = H; inst.dpr = dpr;
  inst.canvas.width = Math.round(W * dpr); inst.canvas.height = Math.round(H * dpr);
  const fx = inst.tema.faixas ? inst.tema.faixas(W, H) : { topo: 88, base: 0 };
  const r = inst.e.regras;
  inst.L = calcularLayout({ W, H, topo: fx.topo, base: fx.base || 0, colunas: r.colunas, pilhaMax: r.pilhaMax, tamFila: r.tamFila });
  inst.Lt = { ...inst.L, ...(inst.tema.geo ? inst.tema.geo(inst.L) : {}) };
  inst.fundo = document.createElement('canvas');
  inst.fundo.width = inst.canvas.width; inst.fundo.height = inst.canvas.height;
  const g = /** @type {CanvasRenderingContext2D} */ (inst.fundo.getContext('2d'));
  g.scale(dpr, dpr);
  inst.tema.fundo(g, W, H, inst.Lt);
  inst.linha.limpar();
}

function reiniciar(inst, semente) {
  inst.e = partidaDoTema(inst.tema, semente);
  inst.hist = [];
  inst.linha.limpar();
  inst.part.limpar();
  inst.mem = {};
  inst.fimEm = 0;
  if (inst.tema.jogo && inst.tema.jogo.aoIniciar) inst.tema.jogo.aoIniciar(inst, performance.now());
}

const pausado = (inst) => !!(inst.tema.jogo && inst.tema.jogo.pausado && inst.tema.jogo.pausado(inst));

/** Coluna sob o ponto (area da coluna inteira, com folga), ou -1. */
function colunaEm(inst, x, y) {
  const L = inst.Lt;
  for (let c = 0; c < L.colunas; c++) {
    const a = L.coluna(c);
    const topoA = Math.min(a.y, L.mesa.y) - L.gap * 2;
    const baseA = Math.max(a.y + a.h, L.mesa.y + L.mesa.h) + L.gap;
    if (x >= a.x - L.gap / 2 && x <= a.x + a.w + L.gap / 2 && y >= topoA && y <= baseA) return c;
  }
  return -1;
}
function noDescarte(inst, x, y) {
  const d = inst.Lt.descarte, g = inst.L.gap * 1.5;
  return x >= d.x - g && x <= d.x + d.w + g && y >= d.y - g * 2 && y <= d.y + d.h + g;
}

function agir(inst, acao, agora) {
  const antes = inst.e;
  inst.linha.acelerar(agora);
  const r = jogar(antes, { ...acao, t: agora });
  if (r.estado !== antes && acao.tipo !== 'retomar') inst.hist.push(antes);
  if (inst.hist.length > 30) inst.hist.shift();
  inst.e = r.estado;
  const k = acao.k || 0;
  inst.linha.montar(r.eventos, inst.Lt, agora, { antes, depois: r.estado, origem: inst.Lt.filaPos(k), carta: antes.fila[k] });
  const j = inst.tema.jogo;
  if (j && j.aoJogar) { const novo = j.aoJogar(inst, antes, r, acao, agora); if (novo) inst.e = novo; }
  if (inst.e.fim && !inst.fimEm) inst.fimEm = agora;
}

function tocar(inst, x, y) {
  const agora = performance.now();
  inst.bot = false;
  const j = inst.tema.jogo;
  if (j && j.aoTocar && j.aoTocar(inst, x, y, agora)) return;
  if (inst.e.fim) { if (!inst.linha.ocupada(agora) && agora - inst.fimEm > 500) reiniciar(inst, (agora | 0) >>> 0); return; }
  if (pausado(inst)) return;
  const c = colunaEm(inst, x, y);
  if (c >= 0) { agir(inst, { tipo: 'colocar', c, k: 0 }, agora); return; }
  if (noDescarte(inst, x, y)) agir(inst, { tipo: 'descartar' }, agora);
}

function desfazer(inst) {
  if (!inst.hist.length) return;
  inst.e = desfazerPara(inst.hist.pop());
  inst.e = { ...inst.e, itens: { ...inst.e.itens, desfazer: 1 } };
  inst.linha.limpar();
}

// ------------------------------------------------------------ desenho

function desenharPeca(inst, carta, rect, pose, op) {
  if (!rect) return;
  const ctx = inst.ctx;
  const esc = pose ? pose.esc || 1 : 1;
  const escY = pose ? pose.escY || 1 : 1;
  const alpha = (pose && pose.alpha !== undefined ? pose.alpha : 1) * (op.alpha ?? 1);
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h);
  if (op.rot) ctx.rotate(op.rot);
  ctx.scale(esc * (op.esc || 1), esc * escY * (op.esc || 1));
  ctx.translate(0, -rect.h / 2);
  inst.tema.peca(ctx, carta, { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h }, { t: op.t, fila: !!op.fila, frente: !!op.frente, k: op.k ?? -1, destaque: op.destaque || 0, alpha });
  ctx.restore();
}

function desenhar(inst, agora) {
  const { ctx, tema, e, linha, W, H, dpr } = inst;
  const L = inst.Lt;
  const t = agora / 1000;
  const pose = (id) => linha.pose(id, agora);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(inst.fundo, 0, 0, W, H);
  if (tema.vivo) tema.vivo(ctx, W, H, t, e, inst.mem);
  if (tema.mesa) tema.mesa(ctx, L, e, t, inst.mem);
  if (tema.fila) tema.fila(ctx, L, e, t);

  // mira (mouse/toque): coluna legal clara, ilegal avermelhada
  if (inst.mira >= 0 && !e.fim && e.fila.length) {
    const a = L.coluna(inst.mira);
    const ok = jogadasLegais(e, e.fila[0]).includes(inst.mira);
    ctx.save();
    rr(ctx, a.x - L.gap * 0.45, a.y - L.gap * 0.45, a.w + L.gap * 0.9, a.h + L.gap * 0.9, L.gap);
    ctx.fillStyle = ok ? 'rgba(255,255,255,0.16)' : 'rgba(255,60,60,0.16)';
    ctx.fill();
    ctx.restore();
  }

  const flutuantes = [];
  for (let c = 0; c < L.colunas; c++) {
    const col = e.colunas[c];
    const dx = linha.tremor(c, agora);
    col.forEach((k, i) => {
      const p = pose(k.id);
      const base = L.carta(c, i);
      const carta = k.tipo === 'normal' ? { ...k, v: linha.valor(k.id, agora, k.v) } : k;
      if (p && (p.voando || p.x !== undefined)) { flutuantes.push({ carta, p, base }); return; }
      desenharPeca(inst, carta, { ...base, x: base.x + dx }, p, { t });
    });
    if (e.cadeados[c] && tema.cadeado) tema.cadeado(ctx, L.coluna(c), c, e, t);
  }
  for (const g of linha.fantasmas(agora)) desenharPeca(inst, g.carta, g, { esc: g.esc, alpha: g.alpha }, { t, rot: g.rot });
  for (const f of flutuantes) {
    const p = f.p;
    desenharPeca(inst, f.carta, { x: p.x ?? f.base.x, y: p.y ?? f.base.y, w: p.w || f.base.w, h: p.h || f.base.h }, p, { t });
  }

  // descarte
  const d = L.descarte;
  const dxD = linha.tremor(-1, agora);
  if (tema.descarte) tema.descarte(ctx, { ...d, x: d.x + dxD }, e, t);
  if (e.descarte) {
    const p = pose(e.descarte.id);
    if (p && p.x !== undefined) desenharPeca(inst, e.descarte, p, p, { t });
    else desenharPeca(inst, e.descarte, { ...d, x: d.x + dxD }, null, { t, alpha: 0.5, esc: 0.9 });
  }

  // fila (a decoracao ja foi desenhada antes das colunas)
  for (let k = e.fila.length - 1; k >= 0; k--) {
    const carta = e.fila[k];
    const p = pose(carta.id);
    const base = L.filaPos(k);
    const ent = p && p.entrando ? p.entrando : 0;
    const rect = p && p.x !== undefined ? p : { ...base, x: base.x + (L.fila.vertical ? 0 : 30 * ent), y: base.y + (L.fila.vertical ? 30 * ent : 0) };
    desenharPeca(inst, carta, rect, p, { t, fila: true, frente: k === 0, k, destaque: k === 0 ? 0.35 + 0.35 * Math.abs(Math.sin(agora / 350)) : 0 });
  }

  if (tema.frente) tema.frente(ctx, L, e, t, inst.mem);
  inst.part.desenhar(ctx);
  tema.hud(ctx, W, H, L, e, t, inst.mem);
  // a tela de fim espera a cascata terminar
  if (e.fim && !linha.ocupada(agora) && agora - inst.fimEm > 250) (tema.fim || fimPadrao)(ctx, W, H, e, t, tema, inst.mem);
}

function fimPadrao(ctx, W, H, e, t, tema) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, H * 0.36, W, H * 0.2);
  const venceu = e.fim === 'venceu';
  texto(ctx, venceu ? 'Fase completa!' : 'Sem jogadas', W / 2, H * 0.43, Math.min(44, W * 0.1), (tema.cores && tema.cores.destaque) || '#ffd84a', { contorno: 'rgba(0,0,0,0.6)' });
  texto(ctx, 'toque para jogar de novo', W / 2, H * 0.5, Math.min(20, W * 0.05), '#ffffff');
  ctx.restore();
}

function passo(inst, agora, dt) {
  const { linha, part, tema } = inst;
  const j = tema.jogo;
  if (j && j.aoPasso) j.aoPasso(inst, agora, dt);
  if (inst.bot && agora >= inst.prox && !linha.ocupada(agora)) {
    inst.prox = agora + (VIT ? 1600 : 1100);
    if (inst.e.fim) { if (agora - inst.fimEm > 1600) reiniciar(inst, (agora | 0) >>> 0); }
    else if (j && j.bot) { const a = j.bot(inst, agora); if (a && !pausado(inst)) agir(inst, a, agora); }
    else if (!pausado(inst)) {
      const a = melhorJogada(inst.e, agora);
      if (a) agir(inst, a, agora); else reiniciar(inst, (agora | 0) >>> 0);
    }
  }
  for (const fx of linha.drenarEfeitos(agora)) {
    const tratou = tema.efeito ? tema.efeito(fx, part, inst.mem, agora) : false;
    if (!tratou) efeitoPadrao(fx, part, tema);
  }
  linha.podar(agora - 50);
  part.atualizar(dt);
}

function efeitoPadrao(fx, P, tema) {
  const cores = (tema.cores && tema.cores.particulas) || ['#ffffff', '#ffd84a'];
  if (fx.tipo === 'fusao') { P.estourar(fx.x, fx.y, cores, 10 + fx.degrau * 4, 0.8 + fx.degrau * 0.15); if (fx.degrau > 1) P.texto(fx.x, fx.y - 20, 'x' + fx.degrau, '#ffd84a', 22); }
  else if (fx.tipo === 'completar') { P.estourar(fx.x, fx.y, cores, 40, 1.6, { forma: 'estrela', tam: 10 }); P.texto(fx.x, fx.y - 30, String(fx.valor), '#ffd84a', 34); }
  else if (fx.tipo === 'explodir' || fx.tipo === 'pedra') P.estourar(fx.x, fx.y, ['#8a8f98', '#5b606b', '#c9ced6'], 18, 1.1);
  else if (fx.tipo === 'racha') P.estourar(fx.x, fx.y, ['#8a8f98', '#c9ced6'], 6, 0.6);
  else if (fx.tipo === 'gelo') P.estourar(fx.x, fx.y, ['#dff6ff', '#9fdcff'], 14, 0.7, { g: 60, vida: 0.9 });
  else if (fx.tipo === 'combo') P.texto(fx.x, fx.y - 40, 'Combo x' + fx.n, '#ffffff', 22);
}

// ------------------------------------------------------------ paginas

function ligarEntrada(inst) {
  const pos = (ev) => {
    const r = inst.canvas.getBoundingClientRect();
    return [((ev.clientX - r.left) * inst.W) / r.width, ((ev.clientY - r.top) * inst.H) / r.height];
  };
  inst.canvas.addEventListener('pointerdown', (ev) => { ev.preventDefault(); const [x, y] = pos(ev); tocar(inst, x, y); });
  inst.canvas.addEventListener('pointermove', (ev) => { const [x, y] = pos(ev); inst.mira = colunaEm(inst, x, y); });
  inst.canvas.addEventListener('pointerleave', () => { inst.mira = -1; });
}

/** @type {any[]} */
const instancias = [];

function montarGrade() {
  const grade = /** @type {HTMLElement} */ (document.getElementById('grade'));
  const dpr = Math.min(2, devicePixelRatio || 1);
  const so = Number(q.get('rodada')) || 0;
  // so anima o que esta na tela (15 celulares de uma vez pesam)
  const obs = 'IntersectionObserver' in window
    ? new IntersectionObserver((ents) => ents.forEach((en) => { const x = instancias.find((i) => i.canvas === en.target); if (x) x.visivel = en.isIntersecting; }), { rootMargin: '200px' })
    : null;
  let num = 0;
  const contagem = {};
  for (const r of [...RODADAS].sort((a, b) => a.n - b.n)) { contagem[r.n] = num; num += r.temas.length; }
  for (const rodada of RODADAS) {
    if (so && rodada.n !== so) continue;
    const sec = document.createElement('section');
    sec.innerHTML = `<h2 class="rodada">${rodada.titulo}</h2><div class="cartoes"></div>`;
    grade.appendChild(sec);
    const caixa = /** @type {HTMLElement} */ (sec.querySelector('.cartoes'));
    rodada.temas.forEach((tema, i) => {
      const f = FICHAS[tema.id];
      const art = document.createElement('article');
      art.className = 'ideia';
      art.innerHTML = `
        <h2><span class="n">${contagem[rodada.n] + i + 1}</span> ${tema.nome}</h2>
        ${f.cat ? `<span class="cat">${f.cat}</span>` : ''}
        <p class="gancho">${f.gancho}</p>
        <div class="celular"><canvas></canvas></div>
        <p class="acoes"><a href="?ideia=${tema.id}${VIT ? '&vitrine' : ''}" target="_blank">Abrir em tela cheia ↗</a></p>
        <dl>
          <dt>${(f.rotulos || [])[0] || 'A regra vira história'}</dt><dd>${f.regra}</dd>
          <dt>${(f.rotulos || [])[1] || 'Mundos e obstáculos'}</dt><dd>${f.mundo}</dd>
          <dt>Thumb</dt><dd>${f.thumb}</dd>
          <dt>A favor</dt><dd>${f.favor}</dd>
          <dt>Contra</dt><dd>${f.contra}</dd>
        </dl>`;
      caixa.appendChild(art);
      const canvas = /** @type {HTMLCanvasElement} */ (art.querySelector('canvas'));
      const inst = criarInstancia(tema, canvas, { W: 390, H: 844, dpr, bot: BOT });
      inst.visivel = true;
      ligarEntrada(inst);
      instancias.push(inst);
      if (obs) obs.observe(canvas);
    });
  }
  const bReiniciar = document.getElementById('reiniciar');
  if (bReiniciar) bReiniciar.addEventListener('click', () => instancias.forEach((x) => { reiniciar(x, DEMO.semente); x.bot = BOT; x.prox = performance.now() + 600; }));
}

function montarUnica(id) {
  document.body.classList.add('unica');
  const tema = TEMAS.find((x) => x.id === id) || TEMAS[0];
  document.title = `2048 Cards · ${tema.nome}`;
  const canvas = document.createElement('canvas');
  canvas.id = 'tela';
  document.body.appendChild(canvas);
  const medir = () => [Math.max(320, innerWidth), Math.max(320, innerHeight), Math.min(2, devicePixelRatio || 1)];
  const [W, H, dpr] = medir();
  const inst = criarInstancia(tema, canvas, { W, H, dpr, bot: BOT && q.has('auto') });
  ligarEntrada(inst);
  instancias.push(inst);
  addEventListener('resize', () => { const [w, h, d] = medir(); redimensionar(inst, w, h, d); if (QUADRO >= 0) congelar(); });
  addEventListener('keydown', (ev) => {
    const n = Number(ev.key);
    if (n >= 1 && n <= inst.e.regras.colunas) { inst.bot = false; if (!inst.e.fim && !pausado(inst)) agir(inst, { tipo: 'colocar', c: n - 1, k: 0 }, performance.now()); }
    else if (ev.key === 'd' || ev.key === 'D') { inst.bot = false; if (!pausado(inst)) agir(inst, { tipo: 'descartar' }, performance.now()); }
    else if (ev.key === 'z' || ev.key === 'Z') desfazer(inst);
    else if (ev.key === 'r' || ev.key === 'R') reiniciar(inst, (performance.now() | 0) >>> 0);
    else if (ev.key === 'a' || ev.key === 'A') { inst.bot = !inst.bot; inst.prox = performance.now(); }
  });
}

/** ?quadro=ms: uma jogada do bot em T0 e a cena simulada ate T0 + ms, sem rAF. */
const T0 = 1000;
function congelar() {
  for (const inst of instancias) {
    reiniciar(inst, DEMO.semente);
    inst.bot = false;
    desenhar(inst, T0 - 16); // o tema inicia o que guarda em mem (ex.: a vida mostrada do monstro)
    const a = melhorJogada(inst.e, T0);
    if (a) agir(inst, a, T0);
    for (let t = T0; t <= T0 + QUADRO; t += 16) passo(inst, t, 0.016);
  }
}
/** Redesenha o quadro congelado (o resize limpa o canvas). */
function redesenharCongelado() {
  for (const inst of instancias) desenhar(inst, T0 + QUADRO);
  requestAnimationFrame(redesenharCongelado);
}

let ultimo = performance.now();
function quadro() {
  const agora = performance.now();
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  for (const inst of instancias) { if (inst.visivel === false) continue; passo(inst, agora, dt); desenhar(inst, agora); }
  requestAnimationFrame(quadro);
}

const unica = q.get('ideia');
const iniciar = () => {
  if (unica) montarUnica(unica); else montarGrade();
  if (QUADRO >= 0) { congelar(); requestAnimationFrame(redesenharCongelado); }
  else if (PARADO) {
    let n = 0;
    const poucos = () => { for (const inst of instancias) desenhar(inst, T0); if (++n < 20) requestAnimationFrame(poucos); };
    requestAnimationFrame(poucos);
  } else requestAnimationFrame(quadro);
};
if (document.fonts && document.fonts.load) document.fonts.load('700 40px Fredoka').then(iniciar, iniciar);
else iniciar();
