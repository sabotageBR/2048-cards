// 50 layouts de monstro para a pagina de escolha. Nao entra na build.
// assunto e a frase curta (em ingles) que acompanha o desenho na pintura.

export const REINOS = {
  campos: { nome: 'Campos', frase: 'bright green living slime with wet highlights and drips' },
  pedreira: { nome: 'Pedreira', frase: 'warm sandstone rock with blocky facets and a few cracks' },
  gelo: { nome: 'Gelo', frase: 'white and pale blue fur or ice with soft cold highlights' },
  masmorra: { nome: 'Masmorra', frase: 'a violet ghostly creature with a soft inner glow' },
  vulcao: { nome: 'Vulcão', frase: 'red-orange scales or flame with a small gold fire accent' },
};

/** Os cinco que ja estao no jogo, so para comparar. Nao entram na escolha dos 50. */
export const ATUAIS = [
  { especie: 'gosmo', nome: 'Gosmo', reino: 'campos' },
  { especie: 'golem', nome: 'Golem', reino: 'pedreira' },
  { especie: 'yeti', nome: 'Yeti', reino: 'gelo' },
  { especie: 'espectro', nome: 'Espectro', reino: 'masmorra' },
  { especie: 'dragao', nome: 'Dragão', reino: 'vulcao' },
];

export const CATALOGO = [
  { id: '01', reino: 'campos', nome: 'Gota', assunto: 'one teardrop of slime with a scalloped dripping base' },
  { id: '02', reino: 'campos', nome: 'Poça', assunto: 'a very wide, very short puddle of slime with eyes on top' },
  { id: '03', reino: 'campos', nome: 'Torre de gotas', assunto: 'three slime balls stacked, largest at the bottom' },
  { id: '04', reino: 'campos', nome: 'Lesma', assunto: 'a long low slime slug with two eyestalks' },
  { id: '05', reino: 'campos', nome: 'Ameba', assunto: 'a round slime with three fat pseudopod arms' },
  { id: '06', reino: 'campos', nome: 'Sapo', assunto: 'a squat slime frog with eyes bulging on top of the head and a wide mouth' },
  { id: '07', reino: 'campos', nome: 'Dupla', assunto: 'two slime blobs standing shoulder to shoulder as one creature' },
  { id: '08', reino: 'campos', nome: 'Caracol', assunto: 'a slime snail with a spiral shell and two short eyestalks' },
  { id: '09', reino: 'campos', nome: 'Taça', assunto: 'slime wobbling over the rim of a cup that is made of the same slime' },
  { id: '10', reino: 'campos', nome: 'Medusa', assunto: 'a slime jellyfish bell with short dangling tentacles' },

  { id: '11', reino: 'pedreira', nome: 'Pilha', assunto: 'three rocks stacked into a body, with two side rocks for arms' },
  { id: '12', reino: 'pedreira', nome: 'Pedregulho', assunto: 'one huge round boulder with tiny legs and two big fists' },
  { id: '13', reino: 'pedreira', nome: 'Muralha', assunto: 'a wide castle wall with battlements and a face in the middle' },
  { id: '14', reino: 'pedreira', nome: 'Estátua', assunto: 'a stiff blocky humanoid statue of separate stone rectangles' },
  { id: '15', reino: 'pedreira', nome: 'Martelo', assunto: 'a hammer whose stone head is the body and whose handle is the leg' },
  { id: '16', reino: 'pedreira', nome: 'Arco', assunto: 'two stone pillars and an arch, with a face in the opening' },
  { id: '17', reino: 'pedreira', nome: 'Rolamento', assunto: 'a round boulder sitting inside a stone ring' },
  { id: '18', reino: 'pedreira', nome: 'Cristal', assunto: 'a cluster of crystal spikes growing from a low rock, face on the tallest' },
  { id: '19', reino: 'pedreira', nome: 'Máscara de pedra', assunto: 'a giant stone mask with a tiny body and tiny legs underneath' },
  { id: '20', reino: 'pedreira', nome: 'Totem', assunto: 'a tall narrow pole of three stacked stone faces' },

  { id: '21', reino: 'gelo', nome: 'Yeti atarracado', assunto: 'a very wide short yeti, huge fur body, tiny head sunk into the shoulders, long arms' },
  { id: '22', reino: 'gelo', nome: 'Pinguim', assunto: 'a tall oval penguin of ice with a pale belly, beak and flippers' },
  { id: '23', reino: 'gelo', nome: 'Boneco', assunto: 'three stacked snowballs, stick arms, a small smile' },
  { id: '24', reino: 'gelo', nome: 'Cubo', assunto: 'a single ice cube with short arms and legs sticking out of the sides' },
  { id: '25', reino: 'gelo', nome: 'Floco', assunto: 'a six-point snowflake body with a face in the center' },
  { id: '26', reino: 'gelo', nome: 'Foca', assunto: 'a low horizontal seal with whiskers, front flippers and a tail' },
  { id: '27', reino: 'gelo', nome: 'Pinheiro', assunto: 'three stacked ice triangles like a fir tree, face on the middle one' },
  { id: '28', reino: 'gelo', nome: 'Estalactite', assunto: 'a hanging icicle, wide at the top and pointed at the bottom, with tiny arms' },
  { id: '29', reino: 'gelo', nome: 'Coruja', assunto: 'a round snowy owl with ear tufts, huge eyes and tiny wings' },
  { id: '30', reino: 'gelo', nome: 'Morsa', assunto: 'a round walrus with two long tusks and flippers' },

  { id: '31', reino: 'masmorra', nome: 'Lençol', assunto: 'a classic ghost sheet with a rounded top and a wavy hem' },
  { id: '32', reino: 'masmorra', nome: 'Caveira', assunto: 'a floating skull only, no body, with a jaw' },
  { id: '33', reino: 'masmorra', nome: 'Armadura oca', assunto: 'an empty suit of armor, helmet separated from the chest by a visible gap' },
  { id: '34', reino: 'masmorra', nome: 'Corrente', assunto: 'a loop of chain links forming the body, two eyes in the empty middle' },
  { id: '35', reino: 'masmorra', nome: 'Mão', assunto: 'one giant hand standing on its wrist, fingers up, a face on the palm' },
  { id: '36', reino: 'masmorra', nome: 'Morcego', assunto: 'a small bat body with both wings raised overhead' },
  { id: '37', reino: 'masmorra', nome: 'Sombra', assunto: 'a smooth horned shadow blob, two eyes and no mouth' },
  { id: '38', reino: 'masmorra', nome: 'Lanterna', assunto: 'a lantern body with a glowing face in the glass and a small handle on top' },
  { id: '39', reino: 'masmorra', nome: 'Máscara', assunto: 'a theatrical smiling mask with two ribbons hanging at the sides' },
  { id: '40', reino: 'masmorra', nome: 'Esqueleto', assunto: 'a cute round skull, an oval ribcage and short bone arms and legs' },

  { id: '41', reino: 'vulcao', nome: 'Dragão de barriga', assunto: 'a round-bellied dragon with small wings, short legs and a curled tail' },
  { id: '42', reino: 'vulcao', nome: 'Salamandra', assunto: 'a long low salamander with four legs and a flame crest along the back' },
  { id: '43', reino: 'vulcao', nome: 'Ovo rachado', assunto: 'an egg with a zigzag crack and eyes plus a small flame peeking out the top' },
  { id: '44', reino: 'vulcao', nome: 'Imp', assunto: 'a huge head, tiny horns, tiny wings and a very small pot-belly body' },
  { id: '45', reino: 'vulcao', nome: 'Tartaruga', assunto: 'a big lava-shell dome with a head poking out one side and four feet' },
  { id: '46', reino: 'vulcao', nome: 'Serpente', assunto: 'one coiled snake loop with the head raised on top' },
  { id: '47', reino: 'vulcao', nome: 'Elemental', assunto: 'a flame-shaped body with a face and no limbs' },
  { id: '48', reino: 'vulcao', nome: 'Wyvern', assunto: 'a two-legged dragon whose wings are its arms, plus a long tail' },
  { id: '49', reino: 'vulcao', nome: 'Verme', assunto: 'a thick segmented worm rising out of a crack, mouth at the top' },
  { id: '50', reino: 'vulcao', nome: 'Duas cabeças', assunto: 'one body with exactly two heads side by side and two short legs' },
];

/** Layouts marcados em 2026-10-12. A pagina de ataque usa esta lista. */
export const ESCOLHIDOS = ['01', '05', '12', '13', '15', '17', '19', '24', '31', '32', '35', '39', '40', '41', '46', '47', '49'];

export function porId(id) {
  return CATALOGO.find((m) => m.id === id) || null;
}
