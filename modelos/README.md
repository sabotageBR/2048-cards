# 2048 Cards · laboratório visual (checkpoint da Etapa 2)

Abra `modelos/laboratorio.html` servido pela rede (`npm run servir` e depois `http://127.0.0.1:5360/modelos/laboratorio.html`; os módulos ES não carregam por `file://`). A grade mostra **6 cenários × 6 skins**, cada célula com uma mesa de exemplo jogada pelo bot (cascatas, especiais, descarte). Nada daqui entra na build: o laboratório importa `src/` direto e `tools/empacotar.mjs` só copia `src/`.

- **Toggles de regra** (recriam todas as mesas): colocação estrita ou permissiva · mão em fila ou livre · naipes · 3–5 colunas · pilha 4–6 · cartas especiais · ritmo do bot.
- **Jogar**: abre o jogo em tela cheia com aquele par e aquelas regras (Clássico).
- **Escolher**: marca a célula e escreve o JSON `{ cenario, skin, regras }` para copiar em `docs/autoria.md`.
- **Prints**: `node tools/prints-modelos.mjs` gera em `modelos/prints/` um retrato 390×844 por par (mesa de vitrine: todos os valores, pedra, gelo, especiais e itens), paisagem e desktop dos pares "naturais", e as folhas de comparação `folha-cenario-*.png`, `folha-skin-*.png`, `folha-paisagem.png` e `folha-desktop.png`.

## Cenários

| Cenário | A favor (Poki, 9–14 anos) | Contra |
|---|---|---|
| **Neon** (sintetizador, referência) | Contraste alto, cartas brilham, thumb vistosa. É o visual do jogo de referência, então o gancho "já provado" | É também o visual mais próximo do que já existe (Merge Solitaire e clones de app); sintetizador é saturado no catálogo. Risco de "cara de kit" se ficar só no degradê + grade |
| **Feltro** (mesa de cassino) | Lê-se como "paciência" em 1 s; público adulto de solitaire gosta | Cassino afasta o público jovem e a Poki evita referência a jogo de azar; thumb escura e genérica |
| **Doce** (pastel, balas) | O mais distinto do catálogo de merge; fofo para 9–14 anos e para os dois gêneros; thumb clara e colorida | HUD claro pede texto escuro (contraste menor); cartas saturadas sobre pastel podem "gritar"; menos tensão para o Clássico |
| **Taverna** (madeira e pergaminho) | Aconchegante, coeso com cartas de papel; mesa clara deixa os números legíveis | Tema "medieval" não conversa com números 2048; paleta marrom rende thumb apagada |
| **Espaço** (nebulosa, planeta) | Progressão natural por mundos (um planeta por mundo); obstáculos ganham ficção (pedra = asteroide, gelo = cometa, chefe = buraco negro); mesa escura com borda ciano destaca qualquer skin | Espaço também é comum na Poki; o fundo precisa de mais elementos próprios para não virar "só estrelas" |
| **Minimal** (claro, chapado) | Legibilidade máxima; o "2048 original" é assim | Zero identidade e zero thumb; é o que a game review chama de genérico |

## Skins de carta

| Skin | A favor | Contra |
|---|---|---|
| **Neon** (escura, borda brilhante) | Combina com fundos escuros; o brilho destaca a cor do valor | Em fundo claro perde força; brilho custa desenho (mitigado pela cache) |
| **Clássico** (branca, índice e miolo) | Lê-se como carta de baralho; números grandes e escuros | Mais "sóbria", menos juice; miolo colorido pequeno em 44 px |
| **Blocos** (tile chapado) | O mais legível em 30 px; igual ao 2048 que todo mundo conhece | Igual ao 2048 que todo mundo conhece (menos identidade) |
| **Gemas** (cristal facetado) | "Premium", brilho e facetas dão sensação de prêmio ao fundir; boa em qualquer fundo | Facetas somem em cartas pequenas; valores altos (1024+) ficam carregados |
| **Pixel** (retrô, contorno grosso) | Identidade forte e barata; números com contorno leem bem | Público 9–14 nem sempre liga para retrô; combina mal com Doce e Feltro |
| **Papel** (traço à mão) | Caloroso e único; combina com Taverna e Doce | Contraste menor (tinta sobre creme) nas cartas cobertas; traço fica fino em 44 px |

## Variantes de regra (toggles)

| Variante | Efeito no jogo | Recomendação |
|---|---|---|
| Estrita (padrão) × permissiva | A estrita obriga a planejar a ordem; a permissiva deixa trancar cartas e é mais fácil de errar sem perceber | **Estrita**: é a regra que o usuário descreveu e a que dá cascatas limpas |
| Fila (só a frente) × livre | Livre é mais fácil e estratégico, mas tira a tensão e difere dos concorrentes | **Fila**, como já decidido; livre pode ser um item futuro ("ver a fila") |
| Naipes | Mais difícil e mais lento; a piedade compensa, mas o jogador casual demora a entender a cor | Desligado por padrão; talvez um mundo tardio ou modo "difícil" |
| 3 / 4 / 5 colunas | 3 é tenso demais; 5 fica apertado em retrato (descarte vai para a fila) | **4** por padrão; **5** só do mundo 4 em diante |
| Pilha 4 / 5 / 6 | 4 enche rápido; 6 deixa a coluna comprida em paisagem | **5** |

## Minha recomendação

**Espaço + Gemas como identidade do jogo**, com os outros cenários virando **mundos** da Aventura (um planeta por mundo, cada um com um detalhe só dele) e as outras skins como **coleção** desbloqueável por estrelas:
- os obstáculos ganham ficção coerente: pedra → asteroide, gelo → cometa congelado, cadeado → escotilha, chefe 4096 → buraco negro;
- a mesa escura com borda ciano destaca todas as skins, então a coleção funciona sem quebrar a arte;
- a thumb pode ser uma cascata de gemas com o planeta ao fundo, longe do `#83FFE7`;
- distância do Merge Solitaire e do jogo de referência (que é neon).

Segunda opção: **Neon + Neon**, a mais fiel à referência e de maior contraste, aceitando que fica mais perto do que já existe. Terceira: **Doce + Blocos** para mirar o público mais novo, com a HUD redesenhada em tons escuros.

Os descartados saem da build depois da escolha, para a arte ficar coesa ("um traço e uma luz só").
