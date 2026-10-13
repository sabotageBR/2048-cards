# Curadoria dos mundos

Cada mundo foi ajustado e conferido pelo simulador (`npm run simular`; a tabela abaixo sai de `node tools/curadoria.mjs`, e o gráfico `docs/escada/curva.png` de `node tools/curva.mjs`). O bot joga **o mundo inteiro numa mesa só** (`jogarMundo` em `bot.js`): o nível sobe na mesma mesa; na mesa cheia vem o "Continuar" grátis do nível e, sem ele, o recomeço pela mesa pronta do nível (`[alvo/2] [alvo/4]`, semente nova). São duas réguas (`tools/medir.mjs`):

- **Guloso** (25 partidas por mundo): prova que cada nível é passável por quem joga bem. Piso: passa o nível sem recomeçar em 82% das partidas que chegaram a ele (78% no 2048).
- **Casual** (`PERFIL_CASUAL` em `bot.js`, 160 partidas em duas séries de sementes): erra 1 em 5 jogadas e usa o "Continuar" grátis. Mede a curva: em quantas partidas ele passa o nível sem recomeçar fica a até 8 pontos de `alvoCasual(N)` (`fases.js`), nenhum nível tem mais de 12 pontos a menos que o anterior, e a mediana de jogadas do nível (com os recomeços) fica dentro de `ritmoMax` (60 no mundo 1, 80 nos outros).

## 2026-10-13 · a escada de valores (branch `so-cartas`)

Pedido do usuário: tirar os monstros e deixar só o jogo de cartas, com a fase subindo a cada valor novo (ver `docs/autoria.md`). O que as medidas mostraram e o que mudou por causa delas:

- **Baralho que acompanha o nível.** Com o baralho dinâmico de antes, numa mesa contínua o casual levava 558 jogadas até o 2048 e, recomeçando da mesa pronta, passava o 2048 em só 15%. Com 5 valores do alvo/8 para baixo (o 2048 usa cartas de 16 a 256), cada nível custa mais ou menos o mesmo: cerca de 40 a 55 jogadas nos níveis do 256 em diante.
- **Limpeza na subida (`graduar`).** As cartas abaixo do piso do baralho novo saem da mesa: sem isso, um 2 esquecido no topo trava a coluna, e a mesa cheia no 2048 aparecia 5 vezes mais (20 contra 4 em 40 mundos).
- **A curva virou uma rampa por mundo.** A reta de 100 a 55 das fases do duelo não serve à escada: os níveis do 16 ao 128 duram 5 a 30 jogadas e ninguém perde neles. Cada mundo vai de 100 no 16 ao piso dele no 2048 (`PISO_CURVA`: 94, 92, 90, 80, 70). Bomba, dobro e ×4 ajudam, então os mundos 2 a 4 são de folga, para brincar com a carta nova; o desafio fica nas 3 colunas.
- **Piso do guloso por nível**, como era por fase: no mundo inteiro sem recomeçar ele faz 64% no mundo 5, porque a conta acumula os 8 níveis.

## 2026-10-13 · um especial por carta, o descarte por nível e a carta ×4

Pedidos do usuário depois de jogar a 0.3.0 (ver `docs/autoria.md`): a carta que recebeu um coringa ou um dobro não recebe outro até fundir de novo; o descarte vira uma pilha com lugares por nível e um contador; os naipes saem ("difícil de entender") e o mundo 4 ganha a carta ×4.

- **A marca do especial tirou força de todos os mundos**, mais dos que dependiam de encadear especiais. O 2048 do mundo 3 ficou no teto da faixa (100%): ganhou o baralho de 6 valores.
- **Descarte:** antes era 1 carga que voltava a cada 12 cartas (na prática, 5 a 7 descartes por nível, e um furo: com a carga cheia, descartar saía de graça). Agora são 3 lugares por nível (2 no mundo 4), sem recarga. O casual usa em média 1 a 3 descartes por nível nos níveis do 256 em diante (a coluna `desc` do `npm run simular`).
- **Mundo 4 (×4).** A carta ×4 sozinha deixava o mundo inteiro em 96 a 100%. O que segurou: baralho largo (6 valores), 2 lugares no descarte e, no 1024 e no 2048, cartas grandes em baralho largo (do alvo/4 para baixo, 6 e 7 valores). O piso foi de 70 para 80: sem naipes, o mundo 4 é de folga como o 2 e o 3.
- **Mundo 5 (3 colunas, tudo junto, agora com o ×4).** Com o 2048 a 60%, o guloso caía abaixo do piso (68% nas sementes do teste); o piso foi para 70 e o 1024 e o 2048 têm o mesmo baralho largo de cartas grandes do mundo 4.

<!-- tabela -->
| Fase | Mundo | Nível | Baralho | Especiais | Casual (alvo) | Guloso | Jogadas casual | Mesas cheias | Recomeços | Novidade / ajuste |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 16 | 2–4 | — | 100% (100%) | 100% | 7 | 0.00 | 0.00 | so cartas; o coringa entra no nivel 3 (64) |
| 2 | 1 | 32 | 2–4 | — | 100% (100%) | 100% | 15 | 0.00 | 0.00 |  |
| 3 | 1 | 64 | 2–8 | coringa 5% | 100% (100%) | 100% | 18 | 0.00 | 0.00 |  |
| 4 | 1 | 128 | 2–16 | coringa 5% | 100% (99%) | 100% | 30 | 0.00 | 0.00 |  |
| 5 | 1 | 256 | 2–32 | coringa 5% | 99% (98%) | 100% | 43 | 0.07 | 0.01 |  |
| 6 | 1 | 512 | 4–64 | coringa 5% | 93% (97%) | 100% | 47 | 0.21 | 0.07 |  |
| 7 | 1 | 1024 | 8–128 | coringa 5% | 96% (96%) | 100% | 43 | 0.15 | 0.04 |  |
| 8 | 1 | 2048 | 16–256 | coringa 5% | 93% (94%) | 100% | 47 | 0.26 | 0.07 |  |
| 9 | 2 | 16 | 2–4 | coringa 4%, bomba 6% | 100% (100%) | 100% | 5 | 0.00 | 0.00 | a bomba (destroi o topo da coluna escolhida) |
| 10 | 2 | 32 | 2–4 | coringa 4%, bomba 6% | 100% (100%) | 100% | 13 | 0.00 | 0.00 |  |
| 11 | 2 | 64 | 2–8 | coringa 4%, bomba 6% | 100% (99%) | 100% | 24 | 0.01 | 0.00 |  |
| 12 | 2 | 128 | 2–16 | coringa 4%, bomba 6% | 100% (99%) | 100% | 32 | 0.01 | 0.00 |  |
| 13 | 2 | 256 | 2–32 | coringa 4%, bomba 6% | 100% (97%) | 100% | 47 | 0.04 | 0.00 |  |
| 14 | 2 | 512 | 4–64 | coringa 4%, bomba 6% | 96% (96%) | 100% | 50 | 0.18 | 0.04 |  |
| 15 | 2 | 1024 | 8–128 | coringa 4%, bomba 6% | 99% (94%) | 100% | 54 | 0.10 | 0.01 |  |
| 16 | 2 | 2048 | 16–256 | coringa 4%, bomba 6% | 99% (92%) | 100% | 54 | 0.13 | 0.01 |  |
| 17 | 3 | 16 | 2–4 | coringa 4%, bomba 4%, dobro 6% | 100% (100%) | 100% | 5 | 0.00 | 0.00 | o dobro (dobra o topo e cascateia). O 2048 tem o baralho largo (6 valores) |
| 18 | 3 | 32 | 2–4 | coringa 4%, bomba 4%, dobro 6% | 100% (100%) | 100% | 12 | 0.00 | 0.00 |  |
| 19 | 3 | 64 | 2–8 | coringa 4%, bomba 4%, dobro 6% | 100% (99%) | 100% | 17 | 0.00 | 0.00 |  |
| 20 | 3 | 128 | 2–16 | coringa 4%, bomba 4%, dobro 6% | 100% (98%) | 100% | 24 | 0.00 | 0.00 |  |
| 21 | 3 | 256 | 2–32 | coringa 4%, bomba 4%, dobro 6% | 100% (97%) | 100% | 39 | 0.06 | 0.00 |  |
| 22 | 3 | 512 | 4–64 | coringa 4%, bomba 4%, dobro 6% | 94% (95%) | 100% | 43 | 0.16 | 0.06 |  |
| 23 | 3 | 1024 | 8–128 | coringa 4%, bomba 4%, dobro 6% | 96% (93%) | 100% | 39 | 0.13 | 0.04 |  |
| 24 | 3 | 2048 | 8–256 | coringa 4%, bomba 4%, dobro 6% | 96% (90%) | 100% | 57 | 0.17 | 0.04 |  |
| 25 | 4 | 16 | 2–4 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 100% (100%) | 100% | 5 | 0.00 | 0.00 | a carta x4 (o topo vezes 4, sem passar do 2048, e cascateia). Ela ajuda muito: o baralho e largo (6 valores), o descarte tem 2 lugares e o 1024 e o 2048 tem cartas grandes (do alvo/4 para baixo, 6 e 7 valores) |
| 26 | 4 | 32 | 2–4 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 100% (100%) | 100% | 9 | 0.00 | 0.00 |  |
| 27 | 4 | 64 | 2–8 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 100% (98%) | 100% | 12 | 0.00 | 0.00 |  |
| 28 | 4 | 128 | 2–16 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 100% (96%) | 100% | 18 | 0.01 | 0.00 |  |
| 29 | 4 | 256 | 2–32 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 100% (93%) | 100% | 31 | 0.01 | 0.00 |  |
| 30 | 4 | 512 | 2–64 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 91% (90%) | 100% | 45 | 0.29 | 0.09 |  |
| 31 | 4 | 1024 | 8–256 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 89% (85%) | 100% | 34 | 0.36 | 0.12 |  |
| 32 | 4 | 2048 | 8–512 | coringa 4%, bomba 4%, dobro 3%, quadruplo 5% | 85% (80%) | 96% | 40 | 0.55 | 0.17 |  |
| 33 | 5 | 16 | 2–4 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 100% (100%) | 100% | 5 | 0.00 | 0.00 | tudo junto em 3 colunas. O 1024 e o 2048 tem baralho largo de cartas grandes (do alvo/4 para baixo, 6 e 7 valores) |
| 34 | 5 | 32 | 2–4 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 100% (99%) | 100% | 9 | 0.00 | 0.00 |  |
| 35 | 5 | 64 | 2–8 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 100% (98%) | 100% | 15 | 0.01 | 0.00 |  |
| 36 | 5 | 128 | 2–16 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 100% (94%) | 100% | 20 | 0.01 | 0.00 |  |
| 37 | 5 | 256 | 2–32 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 95% (90%) | 100% | 35 | 0.20 | 0.06 |  |
| 38 | 5 | 512 | 4–64 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 83% (85%) | 88% | 42 | 0.52 | 0.17 |  |
| 39 | 5 | 1024 | 8–256 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 81% (78%) | 84% | 44 | 0.68 | 0.19 |  |
| 40 | 5 | 2048 | 8–512 | coringa 5%, bomba 5%, dobro 5%, quadruplo 4% | 70% (70%) | 84% | 55 | 1.18 | 0.44 |  |
<!-- /tabela -->

## Histórico: o duelo contra monstros (`master`)

### 2026-10-09 · calibração inicial

2026-10-10: a pilha passou de 5 para 6 cartas (fase 34: de 6 para 7) e a tabela foi regenerada. Mudou pouco, porque o bot raramente enche uma coluna; a fase 12 caiu de 92% para 84%.

2026-10-10, mais tarde: **o monstro ataca** (`src/jogo/monstro.js`, dados em `monstro:` de cada fase). As colunas novas da tabela: "Ataque" (feitiços / a cada quantas jogadas, com a contagem da fúria), "Feitiços (med)" (quantos o monstro lança por partida, mediana) e "Derrotas após feitiço" (partidas perdidas até 2 jogadas depois de um feitiço, em 25). As estrelas das fases com monstro foram recalibradas pela mediana nova (os ataques mexem nos pontos).

2026-10-11: **curva gradual** (ver a seção abaixo). A tabela ganhou as colunas do casual: "Casual (alvo)" (vitórias e o alvo da curva; ⚠ quando sai da faixa ou cai demais) e "Jogadas casual" (mediana, vitórias e derrotas). "Guloso" é a taxa do bot guloso.

(A tabela das 40 fases do duelo está na `master`.)

### Lições desta rodada

- **Mesa cheia** era a derrota dominante nas fases de "primeiro monte": o descarte só recarregava ao completar um monte. Passou a recarregar também a cada 12 cartas (`REGRAS_PADRAO.descarteRecarga`), e as fases 20 e 23 têm 2 cargas.
- **Chefes triviais:** mesa preparada em escada + item coringa = vitória em 1 jogada. Chefes não dão coringa de item e a mesa inicial fica a mais de um passo do teto.
- **Pedras:** o bot ignorava a pedra; a avaliação passou a penalizar o hp restante (`bot.js`). O jogador recebe a mesma pista pela rachadura que cresce.
- **Gelo (fases 17–24, 29, 31, 33, 38, 40):** carta igual empilhava sobre a congelada e, ao descongelar, a maior ficava sobre a menor: coluna morta. Agora carta igual sobre gelo é recusada; descongela-se fundindo uma menor embaixo (`regras.js`).
- **Cascata x5 (fase 30):** com a escada de 5 cartas pronta a fase vencia em 4 jogadas; agora a escada tem 4 e o jogador precisa de duas cartas 64.

### 2026-10-10 · o monstro ataca

- **Lodo de 2 matava a coluna:** com a colocação estrita, um 2 em cima de uma pilha faz a coluna aceitar só 2. Mesmo 1 lodo a cada 16 jogadas derrubava as fases 7, 8 e 12 para menos de 30%. O lodo passou a ser **uma carta da metade do topo**, só sobre topos de 8 a 256 (nunca em coluna vazia): atrapalha, mas tem conserto (e às vezes vira cascata).
- **Faixas de valor poupam a escada do monte:** o gelo só congela topos de 8 a 128; a pedra entra no fundo e não conta para a meta "quebre as pedras" (senão a vida do monstro subiria).
- **Alvo justo:** o feitiço só cai onde o jogador não fica preso na hora; sem alvo, erra. Preso antes do ataque, o monstro não ataca: a mesa cheia nunca vem junto com um feitiço (`test/monstro.test.js`).
- **Coringa da fase 4 para a 6:** a fase 4 passou a ensinar o ataque do monstro; a 6 (que só repetia a cascata) ensina o coringa. Uma novidade por fase.
- **Fúria dos chefões:** a vida medida pelo trabalho caía quase toda na cascata final, e a fúria (com metade da vida) quase nunca chegava. A vida das metas de carta e de monte passou a usar a raiz do trabalho (cai mais nos primeiros golpes), e o limiar da fúria é por fase: 0,6 nas lutas longas (8, 16) e 0,9 nas curtas (24, 32, 40, que o bot vence em 10 a 20 jogadas). Com isso a fúria aparece em 50% a 90% das partidas do bot.
- **Varredura:** para cada fase, o menor `cada` que passa o piso (com 2 pontos de folga) nas duas séries de sementes. A maioria ficou em 5; 7 (dois montes) em 7, 20 em 8, 24 (chefe curto) em 9.

### 2026-10-10 · Clássico e Diário em cadeia

Sem monstro que ataca, o bot jogava o Clássico sem fim (mais de 1500 jogadas, 280 mil pontos). Com a cadeia (`nivelCadeia` em `monstro.js`: vida 400·1,5^(n−1), contagem `max(4, 9 − n/2)`, feitiços dos reinos visitados, Rei com fúria a cada 5) e 16 sementes:

| Modo | Monstros derrotados (q25 / med / q75) | Jogadas (q25 / med / q75) | Pontos (med) | Fim |
|---|---|---|---|---|
| Clássico | 10 / 11 / 13 | 441 / 491 / 830 | 86 mil | mesa cheia em 16 de 16 |
| Diário (16 datas) | 4 / 5 / 5 | 120 | 6,7 mil | as 120 cartas |

O primeiro monstro cai por volta da jogada 22 e os seguintes a cada ~20 até o sexto; depois o ritmo alonga (o 10º na jogada ~345). Jogadores reais devem ficar abaixo do bot (que olha uma jogada à frente e vê o feitiço).

### 2026-10-11 · curva gradual

O usuário travou na fase 7 ("impossível de matar o monstro"). Pelo guloso ela passava (84%), mas o guloso joga melhor que uma pessoa. O jogador casual mostrou um serrote: a fase 7 com 43% depois de três fases quase garantidas; 15, 24, 31, 32 e 40 entre 33% e 43%; e fases do meio do jogo (9–11, 13, 14, 25, 26, 33) quase sempre vencidas. O gráfico `docs/duelo/curva.png` mostra o antes e o depois.

**A curva alvo** (`alvoCasual`): começa em 100% e cai em linha reta até 55% na fase 40. A fase que ensina um feitiço ou obstáculo novo (a 1ª de cada mundo e as fases 4, 10, 18 e 28) fica 5 pontos acima da linha, e o chefão, 6 pontos abaixo. O plano previa terminar em 50%, mas nas fases 35 a 37 o casual só desce abaixo de ~65% se o guloso também cair abaixo do piso de 82%. O erro dele custa pouco em fases de pontos e de pedras. Por isso a ponta subiu 5 pontos.

**Lições:**

- **"Dois montes" no mundo 1 era a parede.** A fase 7 virou "o monte sem a escada pronta": falta um 256, com coringa no baralho e 2 cargas de descarte. A estreia dos dois montes foi para a fase 15, com as duas escadas esperando um 256.
- **Chefões começam com a escada mais alta.** O "monte do zero" (fases 8, 16) e o 4096 com metade da escada (24, 32, 40) levavam o casual a mais de 100 jogadas e a menos de 55% de vitórias. A mesa inicial ganhou um degrau. Na 24 a escada já sobe até 256, e o Rei Yeti ataca a cada 9 jogadas, com gelo e pedra meio a meio.
- **Para endurecer uma fase fácil, o que funciona é baralho menor e meta maior.** Um monstro mais rápido nem sempre deixa a fase mais difícil: com `cada` menor, as fases 17 e 30 ficaram até mais fáceis no casual. A explicação provável é que o lodo põe a metade do topo, e isso às vezes puxa uma cascata. Ficaram mais apertadas: 11, 13, 14, 18, 25, 26, 27, 29, 30, 35, 36 e 37.
- **Uma série de sementes só engana.** Com 40 partidas, a mesma fase variava 10 a 20 pontos entre a série dos testes (`semente + s`) e a das tentativas (`semente + s·7919`). O casual passou a jogar as duas, 80 partidas em cada.
- **Bug achado no caminho:** `acoesLegais` oferecia o martelo em coluna trancada, e o motor recusava. O bot entrava em loop e, na mesa, o toque não fazia nada. O martelo só vale em coluna aberta, e `presa` também passou a ignorar o martelo quando todas as colunas com cartas estão trancadas.
- **`VERSAO_ESTADO` 4:** a partida salva leva a mesa e as metas de quando começou, então a subida descarta as partidas salvas antigas e quem estava na fase 7 recomeça na versão nova.

Próxima rodada: medir com jogadores reais (Player Fit Test) e comparar a perda por fase (1 − Completed) com estas taxas.

### 2026-10-12 · mundo 1 depois do Player Fit Test

A parcial do Player Fit Test da Poki (0.1.0, 393 partidas) mostrou que quase ninguém perde nas primeiras fases: o jogador fecha o jogo no meio da fase. Saíram 26% na fase 3 e 34% na fase 4, contra 2% a 5% de derrotas. A análise completa está em `docs/autoria.md`. O mundo 1 foi refeito para pôr o golpe especial no primeiro minuto e tirar o ataque do monstro dos ~3 primeiros minutos:

| Fase | Antes | Agora | Casual (alvo) | Jogadas casual |
|---|---|---|---|---|
| 3 | cascata pequena, "fazer um 64" e "400 pontos" (duas metas) | **cascata até o 2048**: escada [1024, 512, 256, 128] pronta, sem ataque | 93% (98) | 8 (antes 14) |
| 4 | o monstro ataca (lodo a cada 5), fazer um 128 | cascata longa (o 32 sobre o 64 pede 16, 8, 4…), fazer um 128, **sem ataque** | 99% (97) | 12 (antes 26) |
| 5 | o monte com a escada pronta | coringa, só "cascata ×3" (sem a meta de pontos) | 100% (95) | 7 |
| 6 | coringa | o monte sem a escada pronta, sem ataque | 93% (94) | 10 |
| 7 | o monte sem a escada pronta | **o monstro ataca** (lodo a cada 6) com a escada já conhecida, do outro lado | 96% (98) | 7 |
| 8 | chefão: falta um 512 (67 jogadas) | chefão: falta um 256, ataque a cada 7 (fúria a cada 4) | 90% (86) | 28 (antes 67) |

**Lições:**

- **Tirar o lodo pode deixar a fase mais difícil.** A carta da metade do topo arma a cascata: a fase 4 antiga, sem o monstro, caiu de 98% para 69% no casual. Sem ataque, a mesa e o baralho é que precisam armar a escada: a fase 4 começa com [64, 32], e o baralho da fase 3 é quase todo de 32 e 64 (com o baralho de 2 a 64 do jeito antigo, a fase 3 ficava em 65%).
- **A fase que ensina o feitiço passou da 4 para a 7** (`ENSINA` = {1, 7, 9, 10, 17, 18, 25, 28, 33}).
- **O guloso costuma vencer a fase 7 antes do primeiro feitiço.** Com a semente 1 ele vence antes da 6ª jogada. Uma pessoa joga mais devagar e vê o ataque. Quem passar sem ver vê na fase 8. O aviso do feitiço agora sai no primeiro impacto, então ele aparece onde o ataque acontecer.
- **O mundo 1 ficou mais curto:** das fases 1 a 7, 62 jogadas do casual em vez de 85. Isso dá mais vitórias por minuto, que é o que o funil pede: quem chega à fase 6 passa dos 3 minutos.
