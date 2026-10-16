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

## 2026-10-12 · retenção depois do Player Fit Test (0.2.0)

Pedido do usuário: "o 2048 cards está em Player fit test e ainda não terminou mas temos as preliminares dos game event … analise e vamos melhorar o jogo para aumentar a retenção".

**O que a Poki exige:** tempo médio de 3 min ou mais e pelo menos 25% dos jogadores com 3 min ou mais.

**A parcial da 0.1.0** (393 partidas, painel Game Events):
- Tempo médio de 2 min 36 s. Só 16% passam de 3 min (`tempo/3/min`), e 13% saem sem tocar no jogo.
- O funil da Aventura:

| Fase | Entraram | Venceram | Perderam | Saíram no meio |
|---|---|---|---|---|
| 1 | 98% | 79% | 0% | 12% |
| 2 | 77% | 84% | 0% | 15% |
| 3 | 66% | 61% | 2,3% | 26% |
| 4 | 40% | 51% | 5,1% | 34% |
| 5 | 20% | 70% | 1,3% | 25% |
| 6 | 14% | 84% | 0% | 13% |

- Celular e computador mostram o mesmo desenho.

**Leitura:**
- Quem chega à fase 6 é praticamente quem passa dos 3 min.
- As pessoas saem a um ritmo quase constante (~0,9% por segundo) até o 3º minuto. Desistem, não perdem.
- O que pesa é o que cada segundo mostra:
  - o golpe especial, que é a cena da thumb, só vinha na fase 5;
  - a fase 3 tinha três novidades e uma meta de pontos sem progresso na tela;
  - a fase 4 dobrava a duração e estreava um ataque que parecia o jogo bagunçando a mesa;
  - "Special attack ×1" não dizia o que fazer.
- O painel também escondia derrotas: a mesa cheia não mandava `fail`, e "Jogar de novo" passava comercial a partir da fase 4.

**Escolhas do usuário:**
- **Reorganizar o mundo 1:** o golpe especial vem na fase 3.
- **Ataque do monstro mais tarde.** Ele estreia na fase 7. O usuário talvez o tire de vez ("Talvez eu extingue o ataque"); por isso ele continua só como dado em `monstro:` de cada fase.
- **Comercial:** sai só do "Jogar de novo" antes de 3 min. O da passagem de fase continua a partir de 4→5.
- **Aprovou as quatro propostas visuais** (`docs/retencao/propostas.png`):
  - a trilha do mundo na vitória, com 8 marcas, a coroa no chefão e "Next: <monstro>", sem clique;
  - a carta de lodo marcada, com baba verde que some quando a carta funde;
  - o gesto guiado na fase 1, em que a mão arrasta a carta da fila até a pilha a partir de 1 s, até o primeiro toque;
  - as metas "Make 1× 2048" e "Deal N damage (x/N)".

**Também entrou:**
- **Primeira mesa cheia no mundo 1:** o "Continuar" grátis vem sozinho ("Second chance!"), sem o cartão.
- **Aviso do feitiço:** sai no primeiro impacto, não ao carregar a fase.
- **Telemetria nova:** `mesa/N/cheia`, `continuar/N/gratis` e `ajuda/N/ocio|recusa`. As missões viraram `missao/<tipo>/feita`, fora do funil de progresso.
- **Versão 0.2.0,** para comparar no filtro Version.
- **`VERSAO_ESTADO` 5.**

**Próximo passo:** subir a 0.2.0 na Poki e rodar outro Player Fit Test, comparando as duas versões em:
- tempo médio e % com 3 min;
- saída nas fases 3 a 5;
- os eventos novos.

## 2026-10-13 · branch `so-cartas`: sem monstros, a escada de valores

Pedido do usuário: "Retire completamente a temática de monstros ou chefe de fases. Transforme o jogo somente em um jogo de cartas. [...] As cartas coringa, multiplicadores, carta bomba, continua valendo. [...] A evolução das fases inicial vai ser a medida q ele consegue chegar em um valor novo. Me de opções". Feito num branch (`so-cartas`); a 0.2.0 do duelo segue na `master` para o Player Fit Test.

| Pergunta | Opções vistas | Escolha |
|---|---|---|
| Como a fase sobe | mesa contínua (o nível sobe na mesma mesa) · uma fase por valor (mesa nova a cada fase) · recorde de carta (cada partida do zero) | **Mesa contínua** |
| Mundos depois do 2048 | a escada de novo com uma regra nova · teto que sobe (4096, 8192...) · fases numeradas sem fim · só visual | **A escada de novo, uma regra nova por mundo** |
| Obstáculos (pedra, gelo, cadeado) | ficam só na mesa · entram pelo baralho · saem | **Saem** |
| Clássico e Diário | escada sem fim · como antes do duelo · tirar por enquanto | **Tirar por enquanto** |
| Sequência dos mundos | um especial por mundo · especiais no mundo 1 e a mesa muda depois · especiais novos (quádruplo ×4) | **Um especial por mundo**: 1 só cartas (coringa no nível 3) · 2 + bomba · 3 + dobro · 4 + naipes vermelho/preto · 5 tudo junto em 3 colunas |

Medida que embasou as opções: numa mesa vazia, com o baralho do Clássico sem monstro, o casual faz o 16 na jogada 6, o 32 na 14, o 64 na 35, o 128 na 77, o 256 na 139, o 512 na 233, o 1024 na 348 e o 2048 na 558.

**Ajustes que as medidas pediram** (no plano aprovado ou feitos na calibragem; detalhes e números em `docs/curadoria.md`), para o usuário conferir:
- **Baralho por nível** (5 valores do alvo/8 para baixo) e **limpeza na subida** (as cartas abaixo do piso saem da mesa): estavam no plano aprovado.
- **A curva virou uma rampa por mundo** (100 no 16 até 94, 92, 90, 70 e 60 no 2048). Bomba e dobro tornam os mundos 2 e 3 fáceis por natureza; o desafio fica nos naipes e nas 3 colunas.
- **Mundo 4 com 5 colunas.** Os naipes em 4 colunas eram parede (o casual passava o 128 em diante em 13% a 31%). Ficou com 5 colunas, 2 descartes, baralho de 3 valores e mais coringas. A regra escolhida (só funde mesma cor; o coringa funde com tudo) não mudou.
- **Mundo 5 sem naipes:** "tudo junto" foi lido como os três especiais juntos, em 3 colunas. Naipes em 3 colunas seriam bem mais duros.
- **Saíram as estrelas** (o mapa mostra a escada de cada mundo) e a missão de montes ficou só em "Faça 1× 2048".
- **Telemetria:** `level/N/complete` na subida; `level/N/start` do nível novo no fim da pausa, depois do anúncio (o banco do SDK pede o start depois do comercial).
- **Progresso salvo da versão do duelo é descartado** (`VERSAO_SAVE` 2, `VERSAO_ESTADO` 6).
- **Opções de visual para o usuário escolher** (`docs/escada/visual-retrato.png`, `visual-paisagem.png`, `visual-naipes.png`; mesma mesa em todas, pelo `?visual=`): A como está · B cartas maiores (descarte ao lado da fila: 62 → 73 px em 390×844) · C mesa quieta (sem cenário, a cor do mundo) · D escada no painel (os 8 valores, o alvo em destaque); e o naipe como ponto, símbolo de baralho ou borda da cor. **Escolha pendente.**
- **Cartas só com números.** Ao ver a primeira rodada de thumbs, o usuário recusou o emblema do miolo ("parece uma cabeça de um cavalo cagalhão") e pediu "as cartas somente com números, sem desenho". O miolo da carta de valor passou a ser o número grande na cor dele (os emblemas por valor saíram), e o dobro virou um "×2" grande. O coringa (estrela) e a bomba mantêm o ícone, que diz o que a carta faz.
- **Thumbs sem monstro** (pedido do usuário: "gere as novas thumbs desse jogo repaginado para a poki"): quatro cenas com a carta 2048 como assunto, num fundo limpo com raios de luz, já com as cartas só de números (`docs/escada/thumbs.png`, tiles em `marketing/thumb/comparar-tiles.png`): **fusao** (dois 1024 se chocam e o 2048 salta), **cascata** (o 2048 sai voando da pilha), **leque** (512, 2048 e 1024 em leque) e **escada** (256, 512, 1024 e 2048 em degraus). As quatro passam na régua; a moldura holográfica das cartas nobres tinha um trecho verde-água perto do #83FFE7, que um último passo de cor da thumb leva para o azul. **Escolha pendente.**
- **Provisório até o usuário escolher o visual:** o cenário de cada mundo (o dos reinos, sem o palco do monstro), o painel (mundo e nível, pontos, barra com "Faça um 64"), a marca do naipe (ponto vermelho ou preto no canto) e a pausa de nível (o valor feito e a trilha dos 8 valores). A thumb do Gosmo não serve mais e saiu do `npm run poki`; o nome segue "2048 Cards". Versão 0.3.0.

## 2026-10-13 · depois de jogar a 0.3.0: um especial por carta, descarte com limite, ×4 e vídeos

Pedidos do usuário: "A carta especial só pode ser usado 1x por carta (tem q aparecer um proibido visivel ao usuario quando não pode). Por ex: eu deixei uma coluna somente com 1 carta e sempre que via a especial eu jogava nela, isso eu ia multiplicando e passando as fases"; "Quero 1 layout diferente por mundo. Layout de cenários e de cartas. Quero aprovar antes"; "Na coluna descartar, tem que ter um limite de cartas e tem que ter um contador pequeno". Durante o trabalho, sobre os naipes do mundo 4: "nao gostei dessa mecanica [...] retirar. dificil de entender, troque por outra"; e "Adicione tambem alguma coisa como recompensa no ads da poki".

| Pergunta | Opções vistas | Escolha |
|---|---|---|
| Quando a carta volta a aceitar um especial | ao fundir de novo · nunca mais (até sair da mesa) | **Ao fundir de novo** (vale para coringa, dobro e ×4, da fila e do item; a bomba fica livre) |
| Limite do descarte | por nível (a pilha esvazia na subida) · por mundo · recarga como hoje, à vista | **Por nível**, com o contador "n/N" |
| Direção do visual por mundo | lugares refeitos · elementos · mesas de jogo | **Elementos**: Floresta, Oceano, Neve, Deserto, Cosmos (a aprovar mundo a mundo, por imagem) |
| No lugar dos naipes (mundo 4) | carta ×4 · vassoura · mão livre · pilha curta | **Carta ×4** |

**Decisões minhas, para o usuário conferir:**
- **O sinal de proibido** aparece em três lugares: um selo pequeno no topo que já recebeu especial, enquanto coringa, dobro ou ×4 está na mão; um sinal grande na coluna ilegal sob o arrasto (qualquer motivo); e um salto rápido na jogada recusada (na coluna ou no descarte). Na primeira vez sai um aviso com a regra.
- **Descarte:** 3 lugares por nível (2 no mundo 4), sem recarga; o "Continuar" libera 1 lugar; cheio, aparece "cheio" e o contador fica vermelho. Na primeira vez que enche, um aviso diz que ele esvazia na subida.
- **×4:** não passa do 2048 (um 1024 vira 2048 e sai da mesa); o valor do meio conta como feito (×4 num 32 passa pelo 64 e sobe esse nível também). Entra também no mundo 5 ("tudo junto").
- **Curva:** sem os naipes, o mundo 4 virou mundo de folga como o 2 e o 3 (piso de 70 para 80), e o mundo 5 foi de 60 para 70 (com 60 o bot guloso não passava o 2048 nas sementes do teste). Detalhes em `docs/curadoria.md`.
- **Vídeos com prêmio** (só por escolha, 1x por nível cada, na barra de baixo): **"🎬 Esvaziar"** quando o descarte enche e **"🎬 ★+1"** (um coringa) quando não há coringa e a mesa aperta, a partir da fase 2. Telemetria `rewarded/descarte|coringa/visible|interact`.
- `VERSAO_ESTADO` 7: a partida salva antes disso é descartada.

**Aprovação dos mundos Elementos (mesmo dia).** Vistas as folhas de `docs/mundos/` (hoje × proposta em retrato, as cartas de cada mundo, a paisagem e as regras na tela), o usuário respondeu: "Ta aprovado, pode implementar". Os 5 temas viraram o padrão (`src/render/temas/`) e o que perdeu saiu do código: o cenário dos reinos (`arena.js`), a carta do duelo (`cartaDuelo.js`), a mesa de grimório com lápide, o `?tema=` e a opção de fundo quieto (`?visual=quieto`, que contrariava o pedido de um cenário por mundo). As 4 opções de thumb foram refeitas com as cartas da Floresta (a escolha segue pendente) e a página da thumb passou a carregar a Fredoka, que nunca tinha sido declarada nela.

**Build 0.4.0 e a thumb (mesmo dia).** Pedido: "gera a nova build da poki". A versão subiu para 0.4.0 (regra do projeto: uma versão por envio, para comparar no filtro Version). A thumb que ia junto era ainda a do Gosmo (do duelo); entre as 4 opções sem monstro, refeitas com as cartas da Floresta, o usuário escolheu a **cascata** (o 2048 sai voando do topo da pilha). Pacote: `dist-poki/2048-cards-0.4.0.zip` e `2048-cards-0.4.0-thumb.png`.
- **0.4.1:** no inspetor da Poki (desktop, cerca de 850×475) a tela de pausa abria quase toda abaixo da tela (print do usuário). Causa: o `#menu` era um grid com a linha `auto`; a linha crescia até o conteúdo inteiro (a grade das 40 fases) e o cartão, centrado nela, descia; no celular também abria do meio para baixo. Virou flex, e o cartão fica centrado e rola por dentro em qualquer tamanho.

## 2026-10-13 · Player Fit Test da 0.4.1 e a 0.4.2 (retenção)

Pedido do usuário: "analise o player fit test do jogo [...] e analise como podemos melhorar a retenção". O teste **passou** (500 gameplays, média 4m05s, 38% dos jogadores acima de 3 min; a régua da Poki é 3 min e 25%). O que o painel mostrou (versão 0.4.1, 608 gameplays no filtro; detalhes no plano `~/.claude/plans/analise-o-player-fit-fluffy-lerdorf.md`):

- Metade sai antes de 2 min; quem passa de 3 min fica (24% acima de 5 min).
- **Nível 1:** 27% nunca fazem o 16. Em desktop, 21% saem no nível 1 e **25% nunca clicam no canvas** (celular: 5% e 7%).
- **Níveis 4→5→6 (128, 256, 512):** retenção de 70% por nível, três vezes seguidas, depois de 82% no 3→4. É onde os níveis ficam longos (30, 43, 47 jogadas de mediana), nada novo acontece e entra o primeiro anúncio (fase 5).
- 88% nunca viam a bomba (mundo 2); 11% somavam 3 recusas seguidas nos dois primeiros níveis; só 22 mesas cheias em 608 partidas (ninguém sai derrotado, sai entediado ou sem entender).
- As gravações curtas (5 vistas): o jogador novo espalha 2 e 4 pelas 4 colunas e não chega ao 16; quem passa cai numa fila só de 2 com quatro 32 na mesa e o descarte 3/3.

| Pergunta | Opções vistas | Escolha |
|---|---|---|
| Escada de novidades (88% nunca chegam à bomba) | coringa no nível 2 e bomba no nível 4 do mundo 1, deslocando os outros · manter uma novidade por mundo e só encurtar os níveis | **Coringa no 2 e bomba no 4 do mundo 1**: 2 dobro · 3 ×4 · 4 descarte com 2 lugares · 5 três colunas |
| Primeiro anúncio (fase 5, onde a retenção cai de 82% para 70%) | adiar para a fase 7 ou 5 min, com espaçamento próprio · manter | **Adiar** (voltar depois do Web Fit se a receita pesar) |

**Decisões minhas, para o usuário conferir:**
- **Abertura roteirizada do nível 1:** mesa `[[8, 4], [], [2], []]`; com a fila da semente (2, 2, 4) o 16 sai em 3 jogadas, cada uma ensinando uma regra (igual funde; menor sob a maior; a fusão encadeia). A mão guiada volta 1 s depois de cada jogada até o primeiro 16, com uma frase no pé da mesa ("Números iguais fundem!", "A carta menor desce sob a maior", "Qualquer carta cabe na coluna vazia").
- **Mundo 1 pela metade:** cartas do alvo/4 para baixo e menos 2 no baralho (`forma` `[4, 4, 3, 2, 1.2]`): 2, 9, 12, 21, 22, 22, 23, 22 jogadas por nível (eram 7, 15, 18, 30, 43, 47, 43, 47). O casual segue a 99–100% e o guloso a 100%; o ritmo do mundo 1 no teste caiu de 60 para 40 jogadas.
- **Mundos 2 a 4 deslocados** sem mexer no piso da curva (94, 92, 90, 80, 70): o ×4 levou junto o baralho largo; o mundo 4 ficou com o descarte de 2 lugares e todos os especiais (2048 a 86% no casual, alvo 80). Partida salva da 0.4.1 é descartada (`VERSAO_ESTADO` 8).
- **Primeiro minuto:** `gameLoadingFinished` só depois do primeiro quadro desenhado com a fonte (antes saía na avaliação do módulo, com o canvas ainda vazio); teclas e botões contam como primeiro toque; a recusa vibra e, na primeira "maior sobre menor", um aviso diz a regra; o aviso do coringa do mundo 1, que nunca aparecia jogando direto (só ao recarregar a mesa), agora sai na subida de nível.
- **Anúncios:** primeiro na fase 7 ou com 5 min de jogo; entre dois, pelo menos 2 subidas de nível e 150 s de jogo.
- **Neve:** os números das cartas ficaram mais escuros (o laranja e o amarelo estavam a 2.0–2.3 de contraste sobre o branco; agora o pior passa de 4.5).
- **Telemetria nova:** `guia/N/feito` (as 5 primeiras jogadas da fase 1 de quem é novo), `regra/maior/first`, e `ajuda/N/*` medida por nível (antes, uma por mesa carregada).
- **Metas para o próximo Player Fit Test (0.4.2):** nível 1 completo ≥ 85%, toque em desktop ≥ 85%, retenção 4→5→6 ≥ 80%, 3 min+ ≥ 45%.

## 2026-10-13 · depois de jogar a 0.4.2: subida sem pausa, explosão por mundo, nenhum texto explicativo (0.4.3)

Pedidos do usuário, com prints: "Retirar esse painel de progresso e mesmo com o numero da conquista (no print seria o 16!) piscando na tela, ele pode continuar jogando. Hoje eu sinto que ele trava o usuario de jogar"; "A cada mundo a carta explode diferente, cada mundo muda de acordo com a temática"; "retire esse texto aqui tambem [o aviso 'Grande demais para essa pilha'] e qualquer outro texto explicativo"; "Tem os escritos explicando as cartas novas, tire isso. Somente desenho e animação para explicar".

**O que mudou (plano `~/.claude/plans/1-retirar-esse-painel-wise-rainbow.md`):**
- **Subida de nível sem pausa.** A placa da trilha dos 8 valores e o bloqueio de 1,8 a 2,9 s saíram. O valor feito ("16!") entra, pisca e sai por cima da mesa (~1,8 s) com um canhão de confete nas cores do mundo e a explosão grande do mundo no centro da mesa; a barra fica cheia por meio segundo e cai para o nível novo. O jogador continua jogando por baixo: a jogada seguinte entra no meio da festa (folha `docs/escada/subida-de-nivel.png`). O `level/N/start` do nível novo sai na hora da subida; o intervalo comercial, quando é a hora (fase 7+, com espaço), vem ~1,5 s depois de o "16!" aparecer e nunca no meio de um arrasto (espera soltar a carta). O fim do mundo ("2048!", "WORLD N", varredura) continua como transição com bloqueio, porque troca a mesa.
- **Cada mundo explode diferente** (folha `docs/mundos/explosoes.png`, fusão, 2048 e festa): Floresta folhas e pétalas que giram e caem devagar balançando, com pólen; Oceano bolhas que sobem balançando e estouram num anel, com um jato de gotas no 2048 e na festa; Neve flocos de seis braços caindo devagar e cacos de gelo; Deserto grãos de areia baixos e rápidos que assentam, com poeira (gêiser no 2048); Cosmos faíscas de quatro pontas e riscos neon com rastro (mistura lighter) e a supernova de anéis. As cores dos valores não mudam; o confete e o clarão do 2048 seguem a paleta do mundo. Bomba, martelo, pouso e os textos "×n"/"COMBO" ficaram iguais em todos os mundos.
- **Nenhum texto explicativo.** Saíram: o aviso da regra estrita na primeira recusa, o aviso de "um especial por carta", o de descarte cheio, os avisos escritos de cada carta nova (coringa, bomba, dobro, ×4, descarte de 2, 3 colunas) e a frase do guia no pé da mesa. Ficaram, por não serem explicação: os rótulos da mesa ("na mão", "descartar", "cheio", o contador), "Faça um 64" no painel, o sinal de proibido, "COMBO ×n", "×degrau", "Segunda chance!" e os dois avisos de prêmio (baú do mundo e missão cumprida; o da missão espera o "16!" passar quando a jogada sobe de nível).

**Decisões minhas, para o usuário conferir:**
- **A carta nova se explica pela mão guiada:** na primeira vez que um coringa, bomba, dobro ou ×4 chega à frente da fila, se o jogador parar 1 s, a mão arrasta a carta até a coluna certa (o mesmo gesto do nível 1), uma vez por tipo. O descarte de 2 lugares e as 3 colunas não têm nada para mostrar.
- **As medidas ficaram:** `regra/maior/first` (primeira recusa de maior sobre menor) e `guia/N/feito` continuam, agora sem texto junto; no próximo teste elas dizem se a regra se explica sozinha.
- **O "16!" fica no alto da mesa** (sobre o topo das colunas), pequeno o bastante para não esconder a fila, e sem o soco de câmera da versão com pausa (deslocaria o visual durante um arrasto).
- `?quadro=` e `?filme=` saíram da depuração (estavam mortos no jogo). Versão 0.4.3; `VERSAO_ESTADO` não mudou.

## 2026-10-13 · Player Fit Test da 0.4.2 parado e a 0.4.4 (robustez)

O usuário parou o Player Fit Test da 0.4.2 com 143 sessões, para testar a versão nova, e pediu para conferir os Game Events e se a nova já trazia as correções obrigatórias. Depois da análise: "pode fazer a 0.4.4".

**Game Events da 0.4.2 contra a 0.4.1 (608 sessões):**

| Métrica | Meta | 0.4.1 | 0.4.2 |
|---|---|---|---|
| Toque no desktop | ≥ 85% | 75% | 79% |
| Nível 1 completo (geral / celular / desktop) | ≥ 85% | 73% / — / 63% | 83% / 91% / 70% |
| Retenção 4→5 / 5→6 / 6→7 | ≥ 80% | 70 / 70 / 71% | 77 / 80 / 76% |
| Chegam ao nível 7 | | 15% | 22% |
| `tempo/N/min` 1 / 3 / 7 / 10 min | 3 min+ ≥ 45% no teste | 54 / 32 / 18 / 12% | 57 / 31 / 13 / 6% |

O jogador passa mais níveis, mas não joga mais tempo, e a cauda (7 min ou mais) caiu (amostra pequena). O nível 3 piorou (70% completam; eram 81%). 64% das sessões tentam maior sobre menor (`regra/maior/first`). Rewarded: descarte 36% veem e 21% deles clicam; coringa 33% e 6%.

**A 0.4.4 (sem mudança de visual nem de regra):** a página Errors da Poki mostrava erros que congelavam a tela. O `frame()` só agendava o próximo quadro no fim, e um erro no desenho parava o laço para sempre: o `drawImage` de um canvas 0×0 (`InvalidStateError`, 5 sessões em tablets com WebKit) e o `ctx.roundRect` do Safari antigo (na placa da trilha, que a 0.4.3 já tirou). Agora o próximo quadro é agendado antes de desenhar, um erro custa um quadro (e ainda vai para a Poki, uma vez por mensagem), a cena não desenha com o canvas 0×0 e, quando o Android devolve o contexto do canvas em branco (`canvas.contextlost`), o fundo e as cartas são refeitos. Conferido no Chrome headless com o jogo num iframe que começa 0×0: a 0.4.3 fica com a tela transparente para sempre; a 0.4.4 desenha a mesa quando o iframe ganha tamanho. `Failed to fetch` e `Object.hasOwn` vêm do SDK da Poki (`poki-sdk-hoist`), não do jogo.

**Fica para o usuário escolher:** o desktop (79% tocam, 70% fazem o 16) com um cursor de mouse junto da mão guiada e as teclas 1 a 4 desenhadas sobre as colunas, que mudaria o visual.

## 2026-10-16 · Player Fit Test da 0.4.4 e a 0.5.0 (rumo aos 7 minutos)

O usuário pediu para analisar os testes no painel da Poki e ver "como vamos subir drasticamente a retenção para a casa dos 7 minutos". Análise e plano em `~/.claude/plans/analise-os-testes-do-toasty-oasis.md`.

**O teste da 0.4.4 (13 Oct, 500 gameplays) passou de novo no mesmo lugar:** média 4m01s e 38% engajados (a 0.4.1 tinha 4m05s e 38%). Histograma: 0–1 min 27%, 1–2 min 24%, 2–3 min 11%, 3–4 min 10%, 4–5 min 4%, 5 min ou mais 23%.

**Game Events da 0.4.4 (655 gameplays: 285 desktop, 310 celular):**

| Métrica | Geral | Desktop | Celular | 0.4.1 |
|---|---|---|---|---|
| Toque no jogo | 79% | 69% | 88% | desktop 75% |
| Nível 1 completo | 73% | 65% | 79% | 73% |
| `tempo/N/min` 1 / 3 / 7 / 10 / 15 min | 55 / 31 / 15 / 10 / 6% | 49 / 26 / 14 / 11 / 7% | 60 / 34 / 15 / 9 / 5% | 54 / 32 / 18 / 12 / – |

- **A saída é por minuto, não por nível:** cada nível do mundo 1 perde ~20% (3→4 78%, 4→5 76%, 5→6 80%, 6→7 82%, 7→8 79%), e os níveis pela metade da 0.4.2 não mudaram os minutos.
- **A entrada de cada mundo é onde mais cai:** fase 9 78%, fase 17 69% (33% saem), fase 25 80%.
- **1,2% zeram as 40 fases** (8 jogadores), e o jogo voltava calado ao mundo 1.
- **Não há risco:** mesa cheia em ~7% das partidas, "Failed" ≈ 0%, o "Continuar" por vídeo aparece em 1,7%.
- A mão de ócio (6 s parado) dispara para 31% de quem chega à fase 3 e para 50% de quem chega à 8 (a medida estava suja: contava o tempo de menu, vídeo e aba).
- Rewarded: descarte 38% veem e 12% dos que veem clicam; coringa 30% e 3,6%.

**O motor explicou:** o jogo se jogava sozinho. Jogando 100% ao acaso, 87% chegavam ao nível 4; o distraído (metade das jogadas ao acaso) fechava o mundo 1 sem recomeçar em 74% das partidas; o casual ocupava 8 das 24 vagas. Pelo vault, o Web Fit Test de puzzle pede ~8:30–9:40, e o fator Player Fit → Web Fit foi ×1,32 a ×1,74: **7 min no Player Fit Test é a meta certa**. No Hexa Drop, oito versões de recompensa renderam +16 s; a perda constante pede desafio novo.

**Escolhas do usuário (todas as recomendadas):**
1. **Núcleo: mesa justa, em A/B.** A partir do nível 4 a mesa enche de verdade; a coluna quase cheia treme e avermelha, sem texto; o "Continuar" vira o salvamento; jogar ao acaso deixa de passar. Sorteada por jogador contra a mesa de hoje no mesmo teste.
2. **Ganchos:** a missão ativa na mesa (ícone e contador) e o mundo infinito depois da fase 40. Ficaram de fora: recorde por mundo e prévia do próximo mundo.
3. **Mundo novo:** o anúncio do fim do mundo passa para a 2ª subida do mundo novo, e a carta nova chega já nas primeiras jogadas, com a mão guiada.
4. **Desktop:** as opções C e D sorteadas contra a A. A B (só a seta) saiu: no Clock Tinker ela não mudou o toque.

**O que entrou na 0.5.0:**
- **Teste A/B** (`src/core/variante.js`, `save.variante`; etiqueta `variante/<braço>/start` antes do primeiro `level/N/start`; leitura por Funnels no painel). Medidas por braço: `<braço>/N/cheia`, `<braço>/N/salvo`, `<braço>/N/perigo`.
- **Mesa justa** (`justa.niveis` em `fases.js`, do nível 4 em diante): descarte de 2 do nível 5 em diante nos mundos 1 a 3; a piedade das 2 secas desligada ou espaçada para 3; no mundo 1, baralho de 6 valores quase iguais do nível 5 em diante. No simulador, o casual do mundo 1 vê 1,56 mesa cheia (eram 0,23) com o mesmo ritmo (142 jogadas); o distraído fecha o mundo 1 em 10% (eram 74%). Tabelas em `docs/curadoria.md`.
- **Entrada de mundo:** sem intervalo no fim do mundo; mundos 2 e 3 com abertura roteirizada (o dobro e o ×4 na segunda carta fazem o 16).
- **Mundo sem fim** (6, 7, ...): todas as cartas, descarte de 2, mesa justa nos dois braços, os 5 cenários em ciclo, baú a cada mundo.
- **Medidas:** o ócio zera ao fechar o menu, na volta do vídeo, ao escolher item, no arrasto solto e na volta da aba; marcos de tempo 1–8, 10, 12, 15, 20, 25, 30, 40, 50 e 60 min.

**Decisões minhas, para o usuário conferir:**
- A pilha continua com 6: no simulador, 5 ou 6 dão o mesmo resultado (a mesa trava pela regra estrita), e mudar a pilha mexeria no layout no meio do teste.
- No braço justo, a mão de ócio (que mostra a jogada do guloso) fica só até a fase 3; a ajuda por recusas continua.
- O braço é sorteado por jogador e guardado no save; os mundos 6+ usam a mesa justa nos dois braços.
- Os mundos 4 e 5 abrem como antes: a novidade deles é uma regra, e a abertura nova deixava o 2048 do mundo 4 fácil demais na mesa de hoje.

**Fica para o usuário:** aprovar a missão na mesa pela folha `docs/escada/missao-na-mesa.png` (A no painel ou B no vão dos botões). Até lá ela só liga com `?visual=missao|missaob`, e o jogo segue com o aviso "Mission done!". Depois, enviar a 0.5.0 e pedir dois Player Fit Tests. Metas: média ≥ 5:00; 3 min ≥ 40%, 7 min ≥ 22%, 10 min ≥ 15%; toque no desktop ≥ 80% no braço vencedor; perda nas fases 9 e 17 ≤ 12%; no braço justo, `tempo/3/min` não abaixo do de hoje.

## 2026-10-16 · sons que irritavam (0.5.1)

Pedidos do usuário, jogando a 0.5.0: "a musiquinha quando conquista um número acima... e um barulho de esvaziamento dos pontos estão muito irritantes"; "o barulho do aterrissar da carta também me incomoda".

**O que mudou (`src/core/audio.js`):**
- **Subida de nível:** a fanfarra de 4 notas (triângulo com quadrada embaixo, 6 pipocos de confete e um sopro 1,3 s depois) virou `subida(nivel)`, um sino curto e baixo de uma nota só, sem melodia, que sobe um grau da escala a cada nível do mundo (8 dB mais baixo no pico).
- **Limpeza da subida:** as cartas pequenas que saem da mesa não tocam mais o trilo de bipes agudos (um por carta, 70 ms um do outro); fica só o brilho visual.
- **Pouso da carta:** o chiado de ruído virou um toque grave e abafado, 8 dB mais baixo no pico.
- **Fim do mundo** (depois de ouvir os WAVs: "esse barulho do mundo depois me incomoda, mude"): tocavam três sons empilhados, o `completar()` e o `critico()` quando o 2048 sai da mesa (arpejo com zumbido, chiado, estrondo e serrote) e a fanfarra meio segundo depois. Agora é um baque grave e macio quando o 2048 sai e, meio segundo depois, `audio.mundo()`: um acorde de sino com as notas juntas, sem melodia, que se apaga em ~1,3 s (7 dB mais baixo na média).
- **Prêmio** (vídeo, missão cumprida, baú): o `completar()` virou um "ding" de uma nota, 12 dB mais baixo.
- **Fusão** ("o barulho da fusão também não me agrada, coloque um mais agradável"): o estalo de ruído e a "nota sem fim" (sete senos em oitavas, timbre de órgão oco, do memecats) viraram uma batida de marimba: a nota redonda e um toque curto de baqueta 4 vezes acima, sem ruído (5 dB mais baixo no pico, o mesmo volume médio). Continua subindo com a cascata, agora pela pentatônica de dó (duas oitavas e volta), afinada com o sino da subida. Alternativas ouvidas em WAV: bolha e kalimba.
