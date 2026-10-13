# Curadoria das fases

Toda fase foi ajustada à mão e conferida pelo simulador (`npm run simular`; a tabela abaixo sai de `node tools/curadoria.mjs`, e o gráfico `docs/duelo/curva.png` de `node tools/curva.mjs`). São duas réguas (`tools/medir.mjs`):

- **Guloso** (25 sementes): prova que a fase é vencível por quem joga bem. Piso: 82% de vitórias (78% na última do mundo); nenhuma fase trivial (mediana ≥ 5 jogadas).
- **Casual** (`PERFIL_CASUAL` em `bot.js`, 160 partidas em duas séries de sementes): erra 1 em 5 jogadas, não prevê o feitiço e usa o "Continuar" grátis. Mede a curva: as vitórias dele ficam a até 8 pontos de `alvoCasual(n)` (`fases.js`) e nenhuma fase tem mais de 12 pontos a menos que a anterior.

Estrelas: 2★ = 70% da pontuação mediana do guloso, 3★ = a mediana (o guloso joga melhor que um jogador casual, então 3★ é raro e 2★ é a meta de quem joga bem).

Regra de curva (vault): uma novidade por fase, nunca junto com salto de dificuldade; os 3 primeiros minutos sem derrota (fases 1–3 têm baralho finito pequeno e meta única).

## 2026-10-09 · calibração inicial

2026-10-10: a pilha passou de 5 para 6 cartas (fase 34: de 6 para 7) e a tabela foi regenerada. Mudou pouco, porque o bot raramente enche uma coluna; a fase 12 caiu de 92% para 84%.

2026-10-10, mais tarde: **o monstro ataca** (`src/jogo/monstro.js`, dados em `monstro:` de cada fase). As colunas novas da tabela: "Ataque" (feitiços / a cada quantas jogadas, com a contagem da fúria), "Feitiços (med)" (quantos o monstro lança por partida, mediana) e "Derrotas após feitiço" (partidas perdidas até 2 jogadas depois de um feitiço, em 25). As estrelas das fases com monstro foram recalibradas pela mediana nova (os ataques mexem nos pontos).

2026-10-11: **curva gradual** (ver a seção abaixo). A tabela ganhou as colunas do casual: "Casual (alvo)" (vitórias e o alvo da curva; ⚠ quando sai da faixa ou cai demais) e "Jogadas casual" (mediana, vitórias e derrotas). "Guloso" é a taxa do bot guloso.

<!-- tabela -->
| Fase | Mundo | Casual (alvo) | Jogadas casual | Guloso | Jogadas (med) | Pontos q25 / med / q75 | 2★ / 3★ | Ataque | Feitiços (med) | Derrotas após feitiço | Novidade / ajuste |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 100% (100%) | 8 | 100% | 6 | 52 / 76 / 92 | 50 / 80 | — | — | — | colocar e fundir (2 + 2). Meta: fazer um 16 |
| 2 | 1 | 100% (99%) | 10 | 100% | 8 | 120 / 160 / 208 | 110 / 160 | — | — | — | menor sob maior. Meta: fazer um 32 |
| 3 | 1 | 93% (98%) | 8 | 100% | 6 | 14664 / 14720 / 15704 | 10300 / 14700 | — | — | — | cascata ate o 2048 (o golpe especial): a coluna 1 ja tem a escada, falta o 128 |
| 4 | 1 | 99% (97%) | 12 | 100% | 10 | 652 / 868 / 1028 | 610 / 870 | — | — | — | cascata longa: o 32 sobre o 64 pede 16, 8, 4... Meta: fazer um 128 |
| 5 | 1 | 100% (95%) | 7 | 100% | 6 | 288 / 2176 / 2760 | 1500 / 2200 | — | — | — | coringa (sai do baralho). Meta: cascata x3 |
| 6 | 1 | 93% (94%) | 10 | 100% | 8 | 12712 / 15312 / 16080 | 10700 / 15300 | — | — | — | o monte sem a escada pronta (falta um 256, a coluna 2 ajuda), com coringa e duas cargas de descarte |
| 7 | 1 | 96% (98%) | 7 | 100% | 8 | 14656 / 14800 / 20288 | 10400 / 14800 | lodo / 6 | 1 | 0 | o monstro ataca: a cada 6 jogadas o Gosmo cobre uma pilha com lodo (carta da metade do topo). A escada ja conhecida, do outro lado |
| 8 | 1 | 90% (86%) | 28 | 100% | 12 | 11216 / 14648 / 15228 | 10300 / 14600 | lodo / 7 (fúria 4) | 1 | 0 | chefe do mundo 1: um monte com baralho dinamico (falta um 256); o Rei Gosmo fica furioso |
| 9 | 2 | 99% (96%) | 14 | 100% | 14 | 328 / 704 / 1228 | 490 / 700 | lodo / 5 | 2 | 0 | a pedra. Cada fusao na coluna tira 1; quebre-a |
| 10 | 2 | 96% (95%) | 26 | 100% | 23 | 1520 / 1972 / 2456 | 1400 / 2000 | pedra, lodo / 5 | 4 | 0 | o Golem lanca pedras no fundo das colunas. Pedra mais dura e um 256 |
| 11 | 2 | 90% (88%) | 26 | 92% | 22 | 936 / 1316 / 1888 | 920 / 1300 | pedra, lodo / 4 | 5 | 0 | a bomba (sai do baralho) contra duas pedras duras, sem martelo |
| 12 | 2 | 83% (87%) | 20 | 100% | 13 | 14656 / 15544 / 18644 | 11000 / 15500 | pedra, lodo / 5 | 2 | 0 | um monte com pedra na coluna alta |
| 13 | 2 | 89% (86%) | 34 | 100% | 25 | 2600 / 3260 / 3956 | 2300 / 3300 | pedra, lodo / 5 | 4 | 0 | pedras em duas colunas e pontos |
| 14 | 2 | 86% (85%) | 17 | 96% | 14 | 6312 / 6868 / 9180 | 4600 / 6500 | pedra, lodo / 4 | 3 | 0 | cascata de 4 com uma pedra embaixo (a escada tem 3: falta o 64) |
| 15 | 2 | 81% (84%) | 28 | 100% | 14 | 23148 / 25888 / 28016 | 18000 / 26000 | pedra, lodo / 6 | 2 | 0 | dois montes (as duas escadas esperam um 256), bomba e pedra |
| 16 | 2 | 75% (77%) | 99 | 100% | 42 | 12204 / 16604 / 24668 | 11500 / 16500 | pedra, lodo / 6 (fúria 3) | 8 | 0 | chefe do mundo 2: um monte (falta um 512) com duas pedras |
| 17 | 3 | 88% (87%) | 27 | 100% | 19 | 792 / 1060 / 1356 | 740 / 1100 | pedra, lodo / 5 | 3 | 0 | o gelo: a carta congelada so funde depois de uma fusao na coluna |
| 18 | 3 | 77% (85%) | 25 | 84% | 20 | 1208 / 1316 / 1540 | 910 / 1300 | gelo, lodo / 5 | 3 | 1 | o Yeti congela topos. Duas cartas de gelo |
| 19 | 3 | 78% (79%) | 21 | 96% | 9 | 1380 / 1440 / 2344 | 980 / 1400 | gelo, pedra / 5 | 1 | 1 | o dobro (sai do baralho) |
| 20 | 3 | 82% (78%) | 11 | 100% | 7 | 18568 / 19132 / 20880 | 13500 / 19000 | gelo, lodo / 8 | 0 | 0 | um monte com gelo na coluna alta |
| 21 | 3 | 81% (77%) | 32 | 92% | 25 | 2208 / 2680 / 3328 | 1900 / 2700 | gelo, pedra / 5 | 4 | 0 | gelo e pedra juntos |
| 22 | 3 | 83% (76%) | 25 | 88% | 27 | 2652 / 6184 / 7248 | 4300 / 6200 | gelo, lodo / 6 | 4 | 0 | cascata de 4 com gelo no meio (a escada sobe ate 256: falta o 128) |
| 23 | 3 | 76% (75%) | 42 | 96% | 24 | 27068 / 30592 / 37076 | 21500 / 31000 | gelo, pedra, lodo / 6 | 3 | 0 | dois montes com dobro (as duas escadas esperam um 256) |
| 24 | 3 | 66% (67%) | 32 | 92% | 8 | 29204 / 29240 / 30140 | 20500 / 29000 | gelo, pedra / 9 (fúria 6) | 0 | 0 | chefe do mundo 3: 4096 (o 2048 fica na mesa; a escada espera um 256) |
| 25 | 4 | 74% (77%) | 34 | 88% | 30 | 2076 / 2132 / 2392 | 1500 / 2100 | gelo, pedra, lodo / 4 | 7 | 0 | cinco colunas |
| 26 | 4 | 75% (71%) | 33 | 96% | 24 | 1408 / 2124 / 2680 | 1500 / 2100 | pedra, lodo / 5 | 4 | 0 | o cadeado: a coluna abre ao fazer um 64. Meta: um 256 |
| 27 | 4 | 78% (70%) | 29 | 84% | 32 | 1468 / 2016 / 3220 | 1400 / 2000 | gelo, lodo / 5 | 6 | 4 | cadeado por fusoes e uma pedra |
| 28 | 4 | 74% (74%) | 41 | 96% | 26 | 16028 / 19488 / 24656 | 14500 / 20500 | corrente, lodo / 7 | 3 | 1 | o Espectro tranca colunas com corrente. Um monte atras do cadeado |
| 29 | 4 | 66% (68%) | 29 | 88% | 18 | 3328 / 3568 / 4640 | 2500 / 3600 | corrente, gelo / 4 | 4 | 1 | gelo e cadeado |
| 30 | 4 | 73% (67%) | 23 | 84% | 13 | 18576 / 18720 / 18944 | 13500 / 19000 | corrente, pedra / 5 | 2 | 1 | cascata de 5 |
| 31 | 4 | 72% (65%) | 40 | 100% | 25 | 25700 / 29488 / 31852 | 20500 / 29500 | corrente, lodo, gelo / 5 | 4 | 0 | dois montes com tudo (uma escada espera um 256; a outra, um 128) |
| 32 | 4 | 61% (58%) | 116 | 96% | 29 | 21524 / 23332 / 33852 | 16500 / 23500 | corrente, pedra / 4 (fúria 3) | 8 | 1 | chefe do mundo 4: 4096 com cinco colunas e cadeado (a escada espera um 512) |
| 33 | 5 | 71% (68%) | 34 | 84% | 31 | 3900 / 4572 / 5788 | 3200 / 4600 | lodo, pedra, gelo / 3 | 10 | 3 | o Dragao estreia (lodo, pedra e gelo a cada 3 jogadas) contra pedras e gelo. Meta: as pedras e um 512 |
| 34 | 5 | 66% (62%) | 25 | 100% | 21 | 15240 / 17192 / 24160 | 12000 / 17000 | lodo, pedra, gelo, corrente / 5 | 4 | 0 | pilha de 7 em cinco colunas |
| 35 | 5 | 65% (61%) | 48 | 96% | 32 | 4044 / 4296 / 4784 | 3100 / 4400 | lodo, pedra, gelo / 5 | 6 | 1 | baralho cheio de especiais, pontos altos |
| 36 | 5 | 66% (60%) | 34 | 84% | 14 | 1484 / 2312 / 3412 | 1600 / 2300 | lodo, gelo, corrente / 7 | 1 | 1 | dois cadeados |
| 37 | 5 | 65% (58%) | 31 | 88% | 25 | 18840 / 19844 / 23164 | 14000 / 20000 | lodo, pedra, gelo / 4 | 6 | 0 | cascata de 5 com pedras duras e sem coluna de apoio |
| 38 | 5 | 61% (57%) | 47 | 96% | 25 | 26672 / 28044 / 35208 | 19500 / 27500 | lodo, pedra, gelo / 7 | 3 | 1 | dois montes com gelo e pedra (a segunda escada espera um 512), com duas cargas de descarte |
| 39 | 5 | 52% (56%) | 96 | 100% | 45 | 33300 / 39520 / 45880 | 27500 / 39500 | lodo, pedra, gelo, corrente / 5 | 8 | 0 | tres montes |
| 40 | 5 | 48% (49%) | 85 | 88% | 18 | 21524 / 22524 / 23920 | 16000 / 22500 | lodo, pedra, gelo, corrente / 8 (fúria 4) | 3 | 1 | chefe final: 4096 com pedra, gelo e cadeado (a escada espera um 512; o 256 esta na coluna 3) |
<!-- /tabela -->

## Lições desta rodada

- **Mesa cheia** era a derrota dominante nas fases de "primeiro monte": o descarte só recarregava ao completar um monte. Passou a recarregar também a cada 12 cartas (`REGRAS_PADRAO.descarteRecarga`), e as fases 20 e 23 têm 2 cargas.
- **Chefes triviais:** mesa preparada em escada + item coringa = vitória em 1 jogada. Chefes não dão coringa de item e a mesa inicial fica a mais de um passo do teto.
- **Pedras:** o bot ignorava a pedra; a avaliação passou a penalizar o hp restante (`bot.js`). O jogador recebe a mesma pista pela rachadura que cresce.
- **Gelo (fases 17–24, 29, 31, 33, 38, 40):** carta igual empilhava sobre a congelada e, ao descongelar, a maior ficava sobre a menor: coluna morta. Agora carta igual sobre gelo é recusada; descongela-se fundindo uma menor embaixo (`regras.js`).
- **Cascata x5 (fase 30):** com a escada de 5 cartas pronta a fase vencia em 4 jogadas; agora a escada tem 4 e o jogador precisa de duas cartas 64.

## 2026-10-10 · o monstro ataca

- **Lodo de 2 matava a coluna:** com a colocação estrita, um 2 em cima de uma pilha faz a coluna aceitar só 2. Mesmo 1 lodo a cada 16 jogadas derrubava as fases 7, 8 e 12 para menos de 30%. O lodo passou a ser **uma carta da metade do topo**, só sobre topos de 8 a 256 (nunca em coluna vazia): atrapalha, mas tem conserto (e às vezes vira cascata).
- **Faixas de valor poupam a escada do monte:** o gelo só congela topos de 8 a 128; a pedra entra no fundo e não conta para a meta "quebre as pedras" (senão a vida do monstro subiria).
- **Alvo justo:** o feitiço só cai onde o jogador não fica preso na hora; sem alvo, erra. Preso antes do ataque, o monstro não ataca: a mesa cheia nunca vem junto com um feitiço (`test/monstro.test.js`).
- **Coringa da fase 4 para a 6:** a fase 4 passou a ensinar o ataque do monstro; a 6 (que só repetia a cascata) ensina o coringa. Uma novidade por fase.
- **Fúria dos chefões:** a vida medida pelo trabalho caía quase toda na cascata final, e a fúria (com metade da vida) quase nunca chegava. A vida das metas de carta e de monte passou a usar a raiz do trabalho (cai mais nos primeiros golpes), e o limiar da fúria é por fase: 0,6 nas lutas longas (8, 16) e 0,9 nas curtas (24, 32, 40, que o bot vence em 10 a 20 jogadas). Com isso a fúria aparece em 50% a 90% das partidas do bot.
- **Varredura:** para cada fase, o menor `cada` que passa o piso (com 2 pontos de folga) nas duas séries de sementes. A maioria ficou em 5; 7 (dois montes) em 7, 20 em 8, 24 (chefe curto) em 9.

## 2026-10-10 · Clássico e Diário em cadeia

Sem monstro que ataca, o bot jogava o Clássico sem fim (mais de 1500 jogadas, 280 mil pontos). Com a cadeia (`nivelCadeia` em `monstro.js`: vida 400·1,5^(n−1), contagem `max(4, 9 − n/2)`, feitiços dos reinos visitados, Rei com fúria a cada 5) e 16 sementes:

| Modo | Monstros derrotados (q25 / med / q75) | Jogadas (q25 / med / q75) | Pontos (med) | Fim |
|---|---|---|---|---|
| Clássico | 10 / 11 / 13 | 441 / 491 / 830 | 86 mil | mesa cheia em 16 de 16 |
| Diário (16 datas) | 4 / 5 / 5 | 120 | 6,7 mil | as 120 cartas |

O primeiro monstro cai por volta da jogada 22 e os seguintes a cada ~20 até o sexto; depois o ritmo alonga (o 10º na jogada ~345). Jogadores reais devem ficar abaixo do bot (que olha uma jogada à frente e vê o feitiço).

## 2026-10-11 · curva gradual

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

## 2026-10-12 · mundo 1 depois do Player Fit Test

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
