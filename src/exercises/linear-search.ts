import type { ExerciseDef } from './types';

const bigIsland = Array.from({ length: 200 }, (_, i) => (i * 7) % 211);

export const pirateTreasure: ExerciseDef = {
	id: 'linear-search/pirate-treasure',
	lesson: 'search/linear-search',
	order: 1,
	scene: 'island',
	title: { 'pt-BR': 'O mapa do Barba-Rala', en: "Captain Stubble's map" },
	story: {
		'pt-BR':
			'O Capitão Barba-Rala achou o mapa do avô. Nada de X, nada de passos: só o desenho de uma árvore com **5 galhos**. A ilha tem árvores pra todo lado, cada uma com um número diferente de galhos, e o capitão não confia na própria vista. Ele vai de árvore em árvore, contando.',
		en: "Captain Stubble found his grandfather's map. No X, no paces: just a drawing of a tree with **5 branches**. The island is full of trees, each with a different number of branches, and the captain doesn't trust his eyes. He'll go tree by tree, counting.",
	},
	task: {
		'pt-BR':
			'Escreva `findTreasureTree(trees, branches)`. `trees[i]` é o número de galhos da árvore `i`, da praia pra dentro da ilha. Retorne o índice da primeira árvore com `branches` galhos. Se nenhuma bater, retorne `-1` e o capitão volta pro navio.',
		en: 'Write `findTreasureTree(trees, branches)`. `trees[i]` is how many branches tree `i` has, from the beach inland. Return the index of the first tree with `branches` branches. If none match, return `-1` and the captain goes back to the ship.',
	},
	examples: [
		{ call: 'findTreasureTree([3, 7, 2, 9, 5, 4], 5)', result: '4' },
		{
			call: 'findTreasureTree([3, 7, 2], 5)',
			result: '-1',
			note: { 'pt-BR': 'Nenhuma árvore tem 5 galhos.', en: 'No tree has 5 branches.' },
		},
	],
	recap: {
		'pt-BR':
			'Busca linear: olha um elemento de cada vez, do primeiro ao último, e para no primeiro que bate com o alvo. Se o laço acabar sem achar, o alvo não está lá. No pior caso são `n` comparações, ou seja, O(n).',
		en: "Linear search: look at one element at a time, first to last, and stop at the first match. If the loop ends without one, the target isn't there. Worst case is `n` comparisons, so O(n).",
	},
	goal: { 'pt-BR': 'Mapa: árvore de 5 galhos', en: 'Map: tree with 5 branches' },
	entry: 'findTreasureTree',
	starter: `function findTreasureTree(trees: number[], branches: number): number {
  return -1
}`,
	solution: `function findTreasureTree(trees: number[], branches: number): number {
  for (let i = 0; i < trees.length; i++) {
    if (trees[i] === branches) return i
  }
  return -1
}`,
	tests: [
		{
			args: [[3, 7, 2, 9, 5, 4, 8, 6], 5],
			expected: 4,
			name: { 'pt-BR': 'o tesouro está no meio da ilha', en: 'the treasure is mid-island' },
		},
		{
			args: [[5, 1, 6], 5],
			expected: 0,
			name: { 'pt-BR': 'é a primeira árvore', en: "it's the first tree" },
		},
		{
			args: [[2, 8, 3, 6], 5],
			expected: -1,
			name: { 'pt-BR': 'nenhuma árvore bate', en: 'no tree matches' },
		},
		{
			args: [[], 5],
			expected: -1,
			hidden: true,
			name: { 'pt-BR': 'ilha sem árvores', en: 'an island with no trees' },
		},
		{
			args: [[4, 5, 9, 5], 5],
			expected: 1,
			hidden: true,
			name: { 'pt-BR': 'duas árvores com 5 galhos: vale a primeira', en: 'two trees with 5 branches: the first one counts' },
		},
		{
			args: [bigIsland, 5],
			expected: bigIsland.indexOf(5),
			hidden: true,
			name: { 'pt-BR': 'uma ilha com 200 árvores', en: 'an island with 200 trees' },
		},
	],
	hints: [
		{
			'pt-BR': 'O capitão faz uma coisa só, várias vezes: chega numa árvore e conta. Que estrutura repete algo pra cada posição do array?',
			en: 'The captain does one thing, over and over: walk up to a tree and count. What repeats something for each position of an array?',
		},
		{
			'pt-BR': 'Um `for` com `i` de `0` até `trees.length - 1`. Dentro dele, compare `trees[i]` com `branches`.',
			en: 'A `for` with `i` from `0` to `trees.length - 1`. Inside it, compare `trees[i]` with `branches`.',
		},
		{
			'pt-BR': 'Achou? `return i` na hora, sem esperar o laço acabar. O `return -1` fica depois do laço, pra quando nenhuma árvore bateu.',
			en: 'Found it? `return i` right there, without waiting for the loop to end. The `return -1` goes after the loop, for when no tree matched.',
		},
	],
};

export const linearSearchExercises = [pirateTreasure];
