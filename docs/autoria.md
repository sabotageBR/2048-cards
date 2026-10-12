# Autoria e decisões de design

Registro das escolhas feitas pelo usuário (não pela ferramenta), com data, o que foi visto e a decisão. A Poki avalia "direção de design intencional": este arquivo é a prova.

## 2026-10-09 · catálogo da Poki consultado

- Pesquisa por "2048", "solitaire", "merge" e "cards" em poki.com: **Merge Solitaire** (Adgard, jul/2025, nota 4,1, 5,7 mil votos; infinito, com loja de ferramentas por "cash") e **Merge and Double** (Adgard, abr/2025; tiles). Nenhum com campanha por mundos, obstáculos, chefes ou especiais no baralho.
- Decisão: diferencial "tudo junto" (Aventura com obstáculos e chefes + especiais no baralho + naipes como variante), sem moeda.

## 2026-10-09 · regras base

| Pergunta | Opções vistas | Escolha |
|---|---|---|
| Mão de cartas | fila (só a frente joga) · livre (qualquer das 3) · as duas como toggle | **Fila** |
| Escopo | completo em etapas · só MVP | **Completo em etapas** |

## Checkpoint do laboratório (recusado em 2026-10-10, ver abaixo)

Ver `modelos/README.md` e `modelos/prints/`. Preencher após a escolha:

| Pergunta | Opções vistas | Escolha |
|---|---|---|
| Cenário principal | neon · feltro · doce · taverna · espaco · minimal (prints retrato/paisagem/desktop) | |
| Skin principal | neon · classico · blocos · gemas · pixel · papel | |
| Colocação | estrita · permissiva | |
| Colunas / pilha | 3–5 / 4–6 | |
| Naipes | ligado · desligado | |
| O que vira mundo / coleção | | |

Riscos anotados: sobreposição com Merge Solitaire (a diferença precisa aparecer na thumb e nos primeiros 15 s); régua de playtime de puzzle (~8:52).

## 2026-10-10 · identidade: Duelo contra Monstros

Vistos: os 36 pares cenário × skin do laboratório (recusados) e as 27 ideias jogáveis de `modelos/ideias/` em três rodadas (prints em `modelos/ideias/prints/`). Escolhida a ideia `duelo` da rodada 1 ("abre possibilidade de fazer várias coisas").

| Pergunta | Opções vistas | Escolha |
|---|---|---|
| Visual | como o protótipo · arena do duelo com cartas limpas · nova rodada só do duelo | **Como o protótipo** (cartoon), variando desenhos e cores de mundo a mundo |
| Combate | monstro ataca · só tema · RPG leve | **Monstro ataca**: a cada N jogadas, com contagem visível, lança um feitiço com obstáculo já ensinado |
| Extras | bestiário · chefões especiais · Clássico/Diário em duelo · nada além | **Chefões especiais** (fúria) e **Clássico/Diário em duelo**; sem bestiário |
| Arte dos monstros | canvas procedural · imagens prontas | **Canvas procedural** |
| Reinos | 5 reinos com espécie por mundo · outros · monstros variados | **1 Campos do castelo (Gosmo, lodo) · 2 Pedreira (Golem, pedra) · 3 Reino gelado (Yeti, gelo) · 4 Masmorra (Espectro, corrente) · 5 Vulcão (Dragão, tudo)**; chefe na posição 8 de cada mundo |
| Coleção (skins e cenários) | remover · molduras do duelo · manter | **Remover**: o reino define a arena e as cartas são sempre as do duelo |
| Ataque no mundo 1 | lodo a partir da fase 4 · só no mundo 2 · lodo desde a fase 1 | **Lodo a partir da fase 4** (fases 1–3 sem ataque) |

## 2026-10-10 · pilha maior

Pedido do usuário: cada coluna cabe 1 carta a mais. `pilhaMax` padrão passou de 5 para 6, e a fase 34 de 6 para 7. A menor carta medida com a faixa do monstro fica em 52 px (360×640, 5 colunas × 7), acima do piso de 44.

## 2026-10-10 · etapas 2 e 3: o monstro ataca, os 5 reinos e os chefões

Pedido do usuário: "pode seguir para a etapa 2 e 3" (visual da etapa 1 aprovado). Ajustes feitos dentro do que foi decidido, para o usuário conferir nos prints de `docs/duelo/etapa2-*.png` e `etapa3-*.png`:

- **Lodo:** o plano previa "um 2 em cima da pilha". Na colocação estrita isso trava a coluna (só aceitaria 2) e derrubava as fases de monte para menos de 30% no simulador. Virou **uma carta da metade do topo** (topos de 8 a 256): a coluna passa a aceitar só cartas menores até alguém fundir a gosma.
- **Gelo** congela topos de 8 a 128; **pedra** entra no fundo da coluna (as cartas sobem) e não conta para "quebre as pedras"; **corrente** tranca uma coluna por 3 jogadas, com o número no cadeado. Sem alvo justo, o feitiço erra ("ERROU!").
- **Selo da contagem:** ao lado da cabeça do monstro, com o ícone do próximo feitiço e as jogadas que faltam (pulsa em vermelho quando falta 1). Até o feitiço cair, a mesa mostra o estado de antes; um toque adianta a animação.
- **Primeira vez de cada feitiço** (fases 4, 10, 18, 28) e do chefão furioso (fase 8): aviso curto com a dica, uma vez só.
- **Coringa:** saiu da fase 4 (que agora ensina o ataque) e foi para a 6.
- **Monstros:** a espécie pelo reino; a variante pela posição no mundo (cor, chifres, acessório: bandana, brinco, tapa-olho, cicatriz) e um apelido ("Gosmo Guloso", "Dragão Ranzinza"); o chefão da posição 8 é maior, tem coroa e aura e se chama "Rei". Na fúria: olhos vermelhos, corpo avermelhado, vapor, aura pulsando e "ENFURECIDO!". O "FÚRIA ×2" da febre do jogador continua com esse nome, por isso a fúria do chefão é "ENFURECIDO!".
- **Arenas:** pedreira (penhascos, andaime, marcos de pedra), reino gelado (aurora, pinheiros, neve caindo, pista de gelo), masmorra (tijolos, grades, tochas, círculo mágico) e vulcão (lava, brasas, pilares de obsidiana). A paleta do reino tinge a mesa e o painel.

## 2026-10-10 · etapas 4 e 5: Clássico e Diário em cadeia, limpeza e thumb

Pedido do usuário: "pode seguir para a etapa 4 e 5".

- **Cadeia de monstros** no Clássico e no Diário: a vida de cada monstro é de pontos (400 no primeiro, ×1,5 a cada um), ao cair ele afunda, some numa nuvem e o próximo entra. A cada 5 monstros a cadeia muda de reino (a arena troca junto) e o 5º é o "Rei" com fúria; os feitiços são os dos reinos já visitados. No Clássico o bot derruba a mediana de 11 monstros e perde por mesa cheia por volta da jogada 490 (antes jogava sem fim); no Diário derruba 4 ou 5 nas 120 cartas, chegando ao Rei do dia. O Diário sorteia a ordem dos reinos pela data: o primeiro é o "monstro do dia", o mesmo para todo mundo.
- **Limpeza:** as 6 skins, os 6 cenários e a mesa antiga foram para `modelos/legado/` (o laboratório continua abrindo); a build leva só o duelo. Saíram os parâmetros `?cenario=` e `?skin=`.
- **Thumb nova** (`tools/thumb.html`): a arena de um reino, o monstro gigante levando o raio do 2048 que nasce da coluna da cascata e o número do dano. Quatro opções em `marketing/thumb/comparar.png` (e `docs/duelo/etapa5-thumb.png`): **a** Gosmo nos campos, **b** Rei Dragão enfurecido no vulcão, **c** Rei Yeti no gelo, **d** Espectro na masmorra. Pela regra de contraste da Poki que medimos (carta 2048 contra o fundo ≥ 3:1), b (5,1:1) e d (4,4:1) passam; a (1,6:1) e c (1,8:1) não. **Escolha pendente do usuário**; a `b` ficou como provisória para o `npm run poki`.

## 2026-10-11 · curva de dificuldade gradual

Pedido do usuário: "To preso na fase 7, está impossível de matar o monstro, refaça as fases de modo que a dificuldade vai crescendo gradativamente." Plano aprovado: uma régua nova, o **jogador casual** (bot que erra 1 em 5 jogadas, não prevê o feitiço e usa o "Continuar" grátis), e uma curva alvo para as vitórias dele.

- **A curva:** começa em 100% e cai em linha reta até 55% na fase 40. A fase que ensina algo novo fica um pouco acima da linha e o chefão um pouco abaixo. Nenhuma fase pode ter mais de 12 pontos a menos que a anterior. O plano dizia 50% no fim; ficou em 55% porque, abaixo disso, o bot bom também perderia mais que o piso. O gráfico antes/depois está em `docs/duelo/curva.png` e a mesa inicial das fases mais mexidas em `docs/duelo/curva-fases.png`.
- **A ordem das novidades não mudou:** lodo na 4, pedra na 10, gelo na 18, corrente na 28 e chefão com fúria na posição 8.
- **Fase 7:** de "dois montes" passou para "um monte sem a escada pronta" (falta um 256), com coringa no baralho e 2 descartes. O casual vence 88%; antes vencia 43%. Os dois montes estreiam na fase 15.
- **Chefões** com um degrau a mais na mesa inicial. As fases fáceis demais para a posição (9–11, 13, 14, 25, 26, 33) ficaram mais apertadas.
- **Fase 33:** o Dragão estreia atacando a cada 3 jogadas (lodo, pedra e gelo) e a meta passou a ser as pedras e um 512. Foi o único jeito de deixá-la difícil sem mudar o tamanho da pilha.
- **Partidas salvas:** as antigas são descartadas (`VERSAO_ESTADO` 4) para que a fase em andamento recomece já na versão nova. Progresso e estrelas ficam.

## 2026-10-12 · thumb da Poki

Pedido do usuário: "Crie uma thumb para a poki". As opções a–d (coluna da cascata, raio e o número "-2048") tinham elementos demais para o tile pequeno, e a regra da Poki pede um assunto só, sem texto, com pose dinâmica e o personagem principal na skin padrão (developers.poki.com/guide/game-thumbnail). Na categoria Merge, quase todas as thumbs são grades de números; as que se destacam são close-ups de um personagem.

- **Cena nova 'perto'** em `tools/thumb.html`: a arena atrás, na escala normal, o monstro gigante na frente e a carta 2048 voando. Três opções: **h** o Gosmo da fase 1 arregalando os olhos com o 2048 chegando, **e** o Gosmo levando a carta na cabeça (careta e lágrimas) e **f** o Rei Dragão levando a carta no vulcão.
- **Pose de espanto** em `src/render/monstros.js` (`pose.espanto`): olhos arregalados e boca em O; junto com o golpe, vira careta de dor. Sem ela, os olhos "> <" com a boca sorrindo pareciam contentes. O jogo não usa a pose (só a thumb).
- **Escolha do usuário: h**, a que mais se destaca no tile de 94 px e mostra o monstro que o jogador encontra ao abrir o jogo.
- **Régua de contraste vira aviso:** a faixa da carta 2048 contra a média dos cantos (≥ 3:1) era régua nossa, não da Poki, e reprova o céu claro dos campos (h dá 1,5:1) sem que a carta suma. Continuam barrando: nada perto do `#83FFE7`, beirada longe dele, sem tarja e opaca.

## 2026-10-12 · layouts de monstro escolhidos

Vistos na página `modelos/monstros-layout/`: 50 silhuetas (10 por reino), cada uma desenhada no canvas e pintada por cima, mais a faixa "Os de hoje" (Gosmo, Golem, Yeti, Espectro e Dragão), que não entrou na conta. O usuário marcou 17 e copiou a lista.

| Reino | Escolhidos |
|---|---|
| Campos | 01 Gota · 05 Ameba |
| Pedreira | 12 Pedregulho · 13 Muralha · 15 Martelo · 17 Rolamento · 19 Máscara de pedra |
| Gelo | 24 Cubo |
| Masmorra | 31 Lençol · 32 Caveira · 35 Mão · 39 Máscara · 40 Esqueleto |
| Vulcão | 41 Dragão de barriga · 46 Serpente · 47 Elemental · 49 Verme |

`{"ids":["01","05","12","13","15","17","19","24","31","32","35","39","40","41","46","47","49"]}`

Ainda não entram no jogo. A decisão de 2026-10-10 (uma espécie de canvas por reino, com ataque, fúria e derrota) continua valendo: a conta aqui não é uma por reino (2, 5, 1, 5 e 4) e as pinturas são imagem, não o desenho procedural. Poses, fases e thumb ficam para quando o usuário pedir o porte.
