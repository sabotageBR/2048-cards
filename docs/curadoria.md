# Curadoria das fases

Toda fase foi ajustada à mão e conferida pelo simulador (`node tools/simular.mjs 25`; a tabela abaixo sai de `node tools/curadoria.mjs`): o bot guloso joga 25 sementes por fase. Piso: 82% de vitórias (78% na última do mundo); nenhuma fase trivial (mediana ≥ 5 jogadas). Estrelas: 2★ = 70% da pontuação mediana do bot, 3★ = a mediana (o bot joga melhor que um jogador casual, então 3★ é raro e 2★ é a meta de quem joga bem).

Regra de curva (vault): uma novidade por fase, nunca junto com salto de dificuldade; os 3 primeiros minutos sem derrota (fases 1–3 têm baralho finito pequeno e meta única).

## 2026-10-09 · calibração inicial

<!-- tabela -->
| Fase | Mundo | Vitórias | Jogadas (med) | Pontos q25 / med / q75 | 2★ / 3★ | Novidade / ajuste |
|---|---|---|---|---|---|---|
| 1 | 1 | 100% | 6 | 52 / 76 / 92 | 50 / 80 | colocar e fundir (2 + 2). Meta: fazer um 16 |
| 2 | 1 | 100% | 8 | 120 / 160 / 208 | 110 / 160 | menor sob maior. Meta: fazer um 32 |
| 3 | 1 | 100% | 13 | 412 / 448 / 472 | 320 / 460 | cascata. Meta: fazer um 64 e 400 pontos |
| 4 | 1 | 100% | 14 | 452 / 608 / 1028 | 570 / 810 | coringa. Meta: fazer um 128 |
| 5 | 1 | 100% | 5 | 14592 / 14720 / 15232 | 10500 / 14500 | o monte completo. A coluna 1 esta pronta para uma cascata ate 2048 |
| 6 | 1 | 100% | 9 | 2568 / 3144 / 3476 | 2200 / 3100 | cascata de 3. Meta: cascata x3 e 1500 pontos |
| 7 | 1 | 92% | 39 | 21288 / 29820 / 32796 | 21000 / 30000 | dois montes, com coringa. Meta: 2 montes |
| 8 | 1 | 100% | 40 | 9992 / 15828 / 18164 | 11500 / 16000 | chefe do mundo 1: um monte do zero com baralho dinamico |
| 9 | 2 | 100% | 19 | 424 / 696 / 936 | 490 / 700 | a pedra. Cada fusao na coluna tira 1; quebre-a |
| 10 | 2 | 96% | 29 | 1668 / 2168 / 2820 | 1500 / 2200 | pedra mais dura e um 256 |
| 11 | 2 | 92% | 17 | 544 / 768 / 964 | 600 / 860 | a bomba (sai do baralho) contra duas pedras |
| 12 | 2 | 92% | 13 | 14608 / 15252 / 16420 | 11000 / 15500 | um monte com pedra na coluna alta |
| 13 | 2 | 96% | 27 | 2604 / 2860 / 3724 | 2000 / 2800 | pedras em duas colunas e pontos |
| 14 | 2 | 100% | 7 | 6272 / 6548 / 8256 | 4600 / 6600 | cascata de 4 com uma pedra embaixo |
| 15 | 2 | 92% | 30 | 20804 / 24976 / 30872 | 19500 / 27500 | dois montes, bomba e pedra |
| 16 | 2 | 92% | 81 | 11312 / 15120 / 22100 | 10500 / 15500 | chefe do mundo 2: um monte do zero com duas pedras |
| 17 | 3 | 100% | 10 | 844 / 888 / 952 | 630 / 900 | o gelo: a carta congelada so funde depois de uma fusao na coluna |
| 18 | 3 | 92% | 20 | 1220 / 1348 / 1504 | 940 / 1300 | duas cartas de gelo |
| 19 | 3 | 96% | 8 | 1380 / 1440 / 1700 | 1000 / 1400 | o dobro (sai do baralho) |
| 20 | 3 | 100% | 7 | 18560 / 18920 / 19968 | 13000 / 18500 | um monte com gelo na coluna alta |
| 21 | 3 | 100% | 22 | 1644 / 2544 / 3408 | 1800 / 2600 | gelo e pedra juntos |
| 22 | 3 | 100% | 9 | 8416 / 8532 / 8696 | 5900 / 8500 | cascata de 4 com gelo no meio |
| 23 | 3 | 100% | 28 | 26716 / 27244 / 35924 | 19000 / 27000 | dois montes com dobro |
| 24 | 3 | 96% | 10 | 14360 / 14444 / 15676 | 10500 / 14500 | chefe do mundo 3: 4096 (o 2048 fica na mesa) |
| 25 | 4 | 100% | 20 | 1232 / 1308 / 1792 | 950 / 1400 | cinco colunas |
| 26 | 4 | 100% | 9 | 544 / 672 / 864 | 520 / 740 | o cadeado: a coluna abre ao fazer um 64 |
| 27 | 4 | 88% | 26 | 1232 / 1480 / 2704 | 1300 / 1900 | cadeado por fusoes e uma pedra |
| 28 | 4 | 96% | 32 | 16968 / 19192 / 21820 | 13500 / 19500 | um monte atras do cadeado |
| 29 | 4 | 100% | 12 | 3184 / 3836 / 4560 | 2700 / 3800 | gelo e cadeado |
| 30 | 4 | 100% | 14 | 18656 / 18776 / 19624 | 13000 / 19000 | cascata de 5 |
| 31 | 4 | 100% | 26 | 22264 / 24260 / 31860 | 17000 / 24500 | dois montes com tudo |
| 32 | 4 | 100% | 10 | 14400 / 15024 / 16800 | 10500 / 15000 | chefe do mundo 4: 4096 com cinco colunas e cadeado |
| 33 | 5 | 100% | 25 | 1704 / 1940 / 2168 | 1400 / 1900 | pedras e gelo |
| 34 | 5 | 96% | 21 | 15240 / 16216 / 18468 | 11500 / 16500 | pilha de 6 em cinco colunas |
| 35 | 5 | 100% | 31 | 4132 / 4300 / 6056 | 3000 / 4300 | baralho cheio de especiais, pontos altos |
| 36 | 5 | 92% | 14 | 1400 / 2196 / 4028 | 1500 / 2200 | dois cadeados |
| 37 | 5 | 96% | 34 | 19388 / 20276 / 21800 | 14500 / 21000 | cascata de 5 com pedras |
| 38 | 5 | 92% | 25 | 23556 / 27484 / 28652 | 19000 / 27000 | dois montes com gelo e pedra |
| 39 | 5 | 100% | 38 | 32396 / 35576 / 37800 | 25000 / 35500 | tres montes |
| 40 | 5 | 100% | 16 | 14440 / 15436 / 19908 | 11000 / 15500 | chefe final: 4096 com pedra, gelo e cadeado |
<!-- /tabela -->

## Lições desta rodada

- **Mesa cheia** era a derrota dominante nas fases de "primeiro monte": o descarte só recarregava ao completar um monte. Passou a recarregar também a cada 12 cartas (`REGRAS_PADRAO.descarteRecarga`), e as fases 20 e 23 têm 2 cargas.
- **Chefes triviais:** mesa preparada em escada + item coringa = vitória em 1 jogada. Chefes não dão coringa de item e a mesa inicial fica a mais de um passo do teto.
- **Pedras:** o bot ignorava a pedra; a avaliação passou a penalizar o hp restante (`bot.js`). O jogador recebe a mesma pista pela rachadura que cresce.
- **Gelo (fases 17–24, 29, 31, 33, 38, 40):** carta igual empilhava sobre a congelada e, ao descongelar, a maior ficava sobre a menor: coluna morta. Agora carta igual sobre gelo é recusada; descongela-se fundindo uma menor embaixo (`regras.js`).
- **Cascata x5 (fase 30):** com a escada de 5 cartas pronta a fase vencia em 4 jogadas; agora a escada tem 4 e o jogador precisa de duas cartas 64.

Próxima rodada: medir com jogadores reais (Player Fit Test) e comparar a perda por fase (1 − Completed) com estas taxas.
