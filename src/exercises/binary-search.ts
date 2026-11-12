import { binarySearchBudget as budget } from '../lib/runner/core';
import type { ExerciseDef } from './types';

const bigPond = Array.from({ length: 1000 }, (_, i) => 3 + i * 4);

export const frogMail: ExerciseDef = {
	id: 'binary-search/frog-mail',
	lesson: 'search/binary-search',
	order: 1,
	scene: 'pond',
	title: { 'pt-BR': 'Correio do Sapo Ribas', en: 'Ribbit Post' },
	story: {
		'pt-BR':
			'O Sapo Ribas entrega cartas no lago. As vitórias-régias boiam em fila, numeradas em ordem crescente, e são centenas. Sapo não anda, sapo pula, e cada pulo cansa. Se for de folha em folha, a carta chega no inverno.',
		en: 'Ribbit delivers mail on the pond. The lily pads float in a row, numbered in increasing order, and there are hundreds of them. Frogs don\'t walk, they jump, and every jump is tiring. Going pad by pad, the letter arrives next winter.',
	},
	task: {
		'pt-BR':
			'Escreva `findLilyPad(pads, address)`. `pads` está em ordem crescente e não tem números repetidos. Retorne o índice da folha com o número `address`, ou `-1` se ela não existir. O Ribas aguenta poucos pulos: com 1.000 folhas, umas 20 olhadas no máximo.',
		en: 'Write `findLilyPad(pads, address)`. `pads` is in increasing order with no repeats. Return the index of the pad numbered `address`, or `-1` if there is none. Ribbit can only take a few jumps: with 1,000 pads, about 20 looks at most.',
	},
	examples: [
		{ call: 'findLilyPad([3, 8, 15, 23, 42, 57, 61, 90], 42)', result: '4' },
		{
			call: 'findLilyPad([3, 8, 15], 10)',
			result: '-1',
			note: { 'pt-BR': 'Não existe folha 10.', en: 'There is no pad 10.' },
		},
	],
	recap: {
		'pt-BR':
			'Busca binária: num array ordenado, olhe o meio. Se for o alvo, achou. Se o alvo for menor, ele só pode estar à esquerda; se for maior, à direita. Cada olhada descarta metade, então 1.000 elementos pedem uns 10 passos: O(log n).',
		en: 'Binary search: in a sorted array, look at the middle. If it is the target, done. If the target is smaller, it can only be on the left; if larger, on the right. Each look throws away half, so 1,000 elements take about 10 steps: O(log n).',
	},
	goal: { 'pt-BR': 'Carta para a folha 42', en: 'Letter for pad 42' },
	entry: 'findLilyPad',
	starter: `function findLilyPad(pads: number[], address: number): number {
  return -1
}`,
	solution: `function findLilyPad(pads: number[], address: number): number {
  let low = 0
  let high = pads.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (pads[mid] === address) return mid
    if (pads[mid] < address) low = mid + 1
    else high = mid - 1
  }
  return -1
}`,
	tests: [
		{
			args: [[3, 8, 15, 23, 42, 57, 61, 90], 42],
			expected: 4,
			name: { 'pt-BR': 'a folha 42 existe', en: 'pad 42 exists' },
		},
		{
			args: [[3, 8, 15, 23, 42], 3],
			expected: 0,
			name: { 'pt-BR': 'é a primeira folha', en: "it's the first pad" },
		},
		{
			args: [[3, 8, 15], 10],
			expected: -1,
			name: { 'pt-BR': 'endereço que não existe', en: 'an address that does not exist' },
		},
		{
			args: [[], 42],
			expected: -1,
			hidden: true,
			name: { 'pt-BR': 'lago vazio', en: 'an empty pond' },
		},
		{
			args: [[42], 42],
			expected: 0,
			hidden: true,
			name: { 'pt-BR': 'uma folha só', en: 'a single pad' },
		},
		{
			args: [bigPond, 3 + 777 * 4],
			expected: 777,
			hidden: true,
			maxReads: budget(1000),
			name: { 'pt-BR': '1.000 folhas, sem cansar o sapo', en: '1,000 pads, without tiring the frog' },
		},
		{
			args: [bigPond, 4000],
			expected: -1,
			hidden: true,
			maxReads: budget(1000),
			name: { 'pt-BR': '1.000 folhas, endereço errado', en: '1,000 pads, wrong address' },
		},
	],
	hints: [
		{
			'pt-BR': 'Pula pro meio. O número de lá é maior ou menor que o endereço? Qual metade do lago dá pra esquecer?',
			en: 'Jump to the middle. Is that number bigger or smaller than the address? Which half of the pond can you forget?',
		},
		{
			'pt-BR': 'Guarde as pontas do pedaço que ainda pode ter a folha: `low = 0`, `high = pads.length - 1`. O meio é `Math.floor((low + high) / 2)`.',
			en: 'Keep the ends of the stretch that can still hold the pad: `low = 0`, `high = pads.length - 1`. The middle is `Math.floor((low + high) / 2)`.',
		},
		{
			'pt-BR': 'Repita enquanto `low <= high`. Meio menor que o endereço: `low = mid + 1`. Maior: `high = mid - 1`. Se o laço acabar, retorne `-1`.',
			en: 'Repeat while `low <= high`. Middle smaller than the address: `low = mid + 1`. Bigger: `high = mid - 1`. If the loop ends, return `-1`.',
		},
	],
};

export const binarySearchExercises = [frogMail];
