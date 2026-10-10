# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 2048 Cards

Paciência de fusão com cartas para a Poki: arraste a carta da frente da fila para uma coluna; cartas iguais fundem e dobram; uma menor pode descer sob uma maior e sobe em cascata até virar 2048 e sair da mesa. É feito **só com HTML + JavaScript**: ES modules nativos, canvas 2D e WebAudio, no mesmo padrão do `../stringcut`. Nada de bundler, framework ou TypeScript. O jogo publicado não tem dependência nenhuma (não há `npm install`). As ferramentas usam o Node 18+ e chamam os binários `google-chrome`, `zip` e `unzip`.

- **Plano aprovado:** `~/.claude/plans/quero-criar-um-jogo-humming-steele.md` (2026-10-09).
- **Referência visual:** as 3 capturas em `docs/referencia/` (jogo de referência, neon). Concorrente direto na Poki: *Merge Solitaire* (Adgard). O diferencial precisa aparecer na tela: Aventura com obstáculos e chefes, cartas especiais no baralho, cascata com febre, sem moeda.
- **Escolhas de identidade** (cenário, skin, regras padrão) são do usuário, no checkpoint do laboratório (`modelos/`), e ficam registradas em `docs/autoria.md`. Os 36 pares cenário × skin foram recusados (2026-10-10); `modelos/ideias/` tem 27 direções jogáveis em três rodadas (`RODADAS` em `ideias.js`; a 3 traz visual limpo, app comercial, jogabilidade com ganchos `jogo` e temas limpos, depois de o usuário recusar as anteriores por "poluído" e "cara de amador") sobre o motor real: cada tema em `modelos/ideias/temas/` desenha tudo e segue o contrato do cabeçalho de `ideias.js` (relógio só por `t` e pelo `agora` do `efeito`, nunca `performance.now()`, senão o `?quadro=` dos prints quebra).

## Regra do jogo
- **Mesa:** 4 colunas (3–5), pilha máxima de 5 cartas por coluna, 1 slot de descarte (1 carga; recarrega ao completar um monte e a cada 12 cartas jogadas, `descarteRecarga`). Fila de 3 cartas: só a da frente joga (`filaLivre` como variante).
- **Colocação estrita** (padrão): coluna vazia ou topo igual ou maior. Igual funde (dobra). Menor empilha sob a maior. Maior sobre menor é recusada. `permissiva` como variante.
- **Cascata:** depois de uma fusão, se o novo valor for igual à carta de baixo, funde de novo; cada degrau sobe o multiplicador. Ao chegar ao teto (2048; 4096 nas fases de chefe) a carta sai da mesa e libera a coluna.
- **Fila com semente** (mulberry32 dentro do estado) e "piedade": sem jogada legal ou 2 jogadas secas, a próxima carta vem das que servem. Cartas especiais saem do baralho com espaçamento mínimo: coringa (funde com qualquer topo), bomba (destrói o topo da coluna escolhida), dobro (dobra o topo e cascateia).
- **Obstáculos:** pedra (fundo da coluna, hp 3, cada fusão na coluna tira 1), gelo (carta que não funde até uma fusão na coluna; carta igual sobre ela é recusada), cadeado (coluna trancada até um gatilho), chefe (teto 4096).
- **Itens** (sem moeda): coringa, martelo (remove o topo), troca (frente com a seguinte), desfazer (1 por fase).
- **Febre:** 5 fusões seguidas ligam 10 s de pontos em dobro.
- **Fim:** Aventura termina com as metas (até 2 por fase) ou com o baralho; derrota sem cartão (a fase recomeça). Mesa cheia sem descarte: "Continuar" grátis 1x, depois vídeo, ou jogar de novo.
- **Modos:** Aventura (5 mundos × 8 fases, `src/jogo/fases.js`), Clássico infinito (recorde), Diário (semente pela data local, 120 cartas, `diario.js`).
- **Missões de sessão:** 3 ativas, prêmio em item na hora, renovadas por semente (`missoes.js`, alimentado pelos eventos de cada jogada no `main.js`).

## Estrutura
- **`src/jogo/`, lógica pura** (sem DOM, sem sorteio fora do estado, sem relógio; o tempo entra em `acao.t`):
  - `regras.js`: presets (`REGRAS_PADRAO`), `podeColocar`, `fundeCom`;
  - `colunas.js`: `colocar`, `cascata`, `completar`, `descongelar`, `danificarPedra`;
  - `baralho.js`: `sortear` (pesos, faixa dinâmica, especiais, piedade), `rngPasso`, `encherFila`;
  - `partida.js`: `criarPartida(regras, fase, semente)`, `jogar(estado, acao) => { estado, eventos }`, `acoesLegais`, `desfazerPara`;
  - `obstaculos.js`, `metas.js`, `fases.js`, `diario.js`, `missoes.js`, `bot.js` (`melhorJogada`, `jogarSozinho`).
- **`src/render/`:** `layout.js` (geometria pura de W×H), `cartas.js` (skins e cache), `cenarios.js`, `mesa.js` (desenho compartilhado com laboratório e thumb), `linha.js` (eventos → linha do tempo de tweens; `acelerar()` quando o jogador toca de novo), `particulas.js`, `cena.js`, `transicoes.js` (porte do stringcut).
- **`src/ui/`:** `hud.js` (placar e barra da meta), `menus.js` (pausa, fases, modos, fim), `estilo.css`, fontes Fredoka (OFL, em `LICENCAS.txt`).
- **`src/core/`:** `poki.js` (cópia do stringcut), `audio.js` (com a nota sem fim do memecats), `armazenamento.js`, `depuracao.js`, `haptico.js` (vibração, no-op no iOS), `rng.js`.
- **`src/i18n/textos.js`:** EN é o padrão, com PT e ES.
- **`src/main.js`** liga tudo e é o **único** módulo que importa `poki.js`.

## Como as peças se ligam
- **Estado imutável.** `jogar(estado, acao)` aceita `colocar{c,k?}`, `descartar`, `item{item,c?}` e `retomar` (o "Continuar" da mesa cheia), sempre com `t` em ms, e devolve um estado novo e a lista de eventos na ordem em que aconteceram (`colocar`, `recusar`, `fundir{degrau}`, `completar`, `pedra`, `gelo`, `cadeado`, `bomba`, `dobro`, `combo`, `febre`, `meta`, `fila`, `fimFase`, `fimPartida`...; a lista completa está no cabeçalho de `partida.js`). Ação recusada devolve o mesmo estado. O `main.js` guarda o estado anterior em `J.hist` para o desfazer.
- **Partida salva:** o estado em andamento vai para `save.partida` (JSON puro, o RNG junto). Mudou o formato do estado? Suba `VERSAO_ESTADO` em `partida.js` e a conferência `e.v === 1` do `main.js`, que está escrita à mão.
- **Render desenha o estado novo.** `linha.js` monta a agenda (voo 180 ms, squash 90, cada degrau 140, 2048 sai em 350) e mantém fantasmas das cartas que sumiram, valores antigos até o meio da fusão, tremores e efeitos. Uma ação nova chama `acelerar()`; o input nunca é bloqueado pela cascata (só por transição, anúncio e menu).
- **Som sincronizado com o visual:** `cena.atualizar` devolve os efeitos cujo instante chegou; o `main.js` toca o som de cada um.
- **Fases são dados curados à mão** e validados por `test/fases.test.js` (bot guloso vence ≥ 82%, ≥ 78% na última do mundo; nenhuma fase trivial). O teste usa as sementes `semente + s` e o simulador usa `semente + s * 7919`: uma fase ajustada precisa passar nos dois. O comentário `// N: texto` acima de cada fase vira a coluna "Novidade" da tabela de `docs/curadoria.md`; regenere com `node tools/curadoria.mjs` (só reescreve o trecho entre `<!-- tabela -->`).
- **A build só leva `index.html`, `LICENCAS.txt` e `src/`** (`tools/empacotar.mjs`).

## Convenções
- Código e comentários em português, comentários em ASCII. 2 espaços, aspas simples, ponto e vírgula, `catch { /* ignora */ }`, JSDoc no lugar de tipos.
- Fronteiras vigiadas por `test/estilo.test.js`: só `main.js` importa `poki.js`; só `armazenamento.js` toca o `localStorage`; só `depuracao.js` lê a URL; `src/jogo/` não usa `Math.random`, DOM nem relógio; sem `console.log`; a única URL externa é o SDK da Poki.
- **Um relógio só:** `performance.now()`, com passo de reserva por timer quando o rAF para.
- **Toda proposta visual vai como imagem ou protótipo jogável**, nunca só como descrição.

## Poki
- SDK por tag síncrona no `<head>`. `gameLoadingFinished` uma vez, na primeira fase pronta. `gameplayStart` só em `pointerdown` real (ou tecla/botão de jogo). `gameplayStop` na vitória, no fim e ao abrir o menu.
- `commercialBreak` só na passagem de fase, a partir da fase 5; a transição congela até ele voltar. Sem pre-roll.
- Rewarded só por escolha, ao lado de um botão grátis maior; prêmio só com `=== true`. Sem SDK os botões de vídeo somem (`body.sem-anuncio`). Em localhost há um anúncio simulado.
- Áudio mudo antes do anúncio, ao esconder a aba e no botão de som.

## Comandos
| Comando | O que faz |
|---|---|
| `npm test` | Testes do motor, das fases, do layout, do wrapper Poki e das fronteiras (~1 s) |
| `node --test test/partida.test.js` | Um arquivo de teste; filtre por nome com `--test-name-pattern="cascata"` |
| `npm run servir` | Servidor estático em `127.0.0.1:5360` (módulos ES não carregam por `file://`) |
| `node tools/shot.mjs "<query>" LxA saida.png [ms]` | Print do jogo no Chrome headless. `saida` = `-` imprime o título (que vira `ERRO ...` se houver exceção) e o `data-estado` do `?gesto=` |
| `npm run simular` | Bot guloso joga as 40 fases (25 sementes): vitórias, jogadas e pontos; falha abaixo do piso (`docs/curadoria.md`). Uma fase só: `node tools/simular.mjs 25 12` |
| `node tools/curadoria.mjs` | Regenera a tabela de `docs/curadoria.md` (simulador + notas `// N:` de `fases.js`) |
| `npm run sdkcheck` | Banco de testes do SDK em 5 cenários (Chrome headless), `tools/sdkcheck.html` |
| `node tools/prints-modelos.mjs` | Prints do laboratório (36 pares cenário × skin) e folhas de comparação em `modelos/prints/` |
| `node tools/prints-ideias.mjs [tema...]` | Prints das ideias (retrato, quadro no meio da cascata via `?quadro=ms`, paisagem e a grade) em `modelos/ideias/prints/`. Com `?auto` o rAF do headless quase não anda: use `?quadro=` para quadros determinísticos |
| `node tools/thumb.mjs [a b c d]` | Renderiza as opções de thumb e mede cada uma; `--final` grava `marketing/thumb/2048-cards-{1256,628}.{png,jpg}` e `conferir.png` |
| `npm run poki` | Testes, simulador, thumb, empacotamento (`dist/` e `dist-poki/`), sdkcheck da build e prints (`docs/prints/`) |

`shot`, `sdkcheck` e `prints-build` sobem o próprio servidor (portas 5352, 4350 e 4351), então não precisam do `npm run servir`. O Chrome headless delas resolve `game-cdn.poki.com` para um endereço morto, ou seja, roda sempre **sem SDK**. `dist/` e `dist-poki/` ficam fora do git, mas `npm run poki` reescreve PNGs versionados (`marketing/thumb/`, `docs/prints/`).

**Parâmetros de teste** (só em `localhost`, `127.0.0.1` e `file://`; ver `src/core/depuracao.js`): `?nivel=`, `?modo=classico|diario`, `?auto=ms`, `?fixo`, `?semanuncio`, `?lang=`, `?cenario=&skin=`, `?regras={json}`, `?vitrine`, `?gesto=fila0>col2@300;tap:col1@900;tap:desc@1200;key:z@1500;click:iCoringa@2000`, `?semhud`, `?menu`, `?quadro=ms` (joga até vencer e congela a transição nesse instante), `?filme=12&dur=6000&larg=360` (quadros JPEG para GIF). Fora do local, só `window.__cards2048Teste = { nivel, fixo, modo }` (usado por `tools/sdkcheck.html`) liga ganchos, e o jogo continua se comportando como na Poki.
