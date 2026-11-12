import { binarySearchBudget as budget } from '../lib/runner/core';
import type { ExerciseDef } from './types';

const bigShelf = Array.from({ length: 1000 }, (_, i) => 100 + i * 7);

const mustBeBinary = {
	'pt-BR': 'Os testes ocultos usam arrays grandes e contam quantos elementos você lê. Uma busca linear não passa.',
	en: 'Hidden tests use large arrays and count how many elements you read. A linear scan will not pass.',
};

export const libraryBook: ExerciseDef = {
	id: 'binary-search/library-book',
	entry: 'findBookIndex',
	starter: `function findBookIndex(libraryBooks: number[], bookId: number): number {
  return -1
}`,
	solution: `function findBookIndex(libraryBooks: number[], bookId: number): number {
  let low = 0
  let high = libraryBooks.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (libraryBooks[mid] === bookId) return mid
    if (libraryBooks[mid] < bookId) low = mid + 1
    else high = mid - 1
  }
  return -1
}`,
	tests: [
		{ args: [[102, 205, 308, 410, 523, 636, 749, 852, 965, 1078], 410], expected: 3 },
		{ args: [[102, 205, 308, 410, 523, 636, 749, 852, 965, 1078], 1078], expected: 9 },
		{ args: [[102, 205, 308, 410, 523, 636, 749, 852, 965, 1078], 500], expected: -1 },
		{ args: [[], 1], expected: -1, hidden: true },
		{ args: [bigShelf, 100 + 990 * 7], expected: 990, hidden: true, maxReads: budget(1000) },
		{ args: [bigShelf, 101], expected: -1, hidden: true, maxReads: budget(1000) },
	],
	hints: [
		mustBeBinary,
		{ 'pt-BR': 'Mantenha duas variáveis, `low` e `high`, marcando onde o livro ainda pode estar.', en: 'Keep two variables, `low` and `high`, marking where the book can still be.' },
		{ 'pt-BR': 'Olhe o meio. Se for menor que o alvo, tudo à esquerda dele também é: `low = mid + 1`.', en: 'Look at the middle. If it is smaller than the target, everything to its left is too: `low = mid + 1`.' },
	],
};

const pastries = [
	'Croissant2022', 'CroissantAlmond', 'CroissantApricot', 'CroissantBanana', 'CroissantButtery',
	'CroissantCaramel', 'CroissantFlaky', 'CroissantGourmet', 'CroissantHazelnut', 'CroissantOrange',
	'DanishAlmond', 'DanishApricot', 'DanishButtery', 'DanishChocolate', 'DanishCinnamon',
	'DanishCranberry', 'DanishGourmet', 'DanishHazelnut', 'DanishLemon', 'DanishOrange',
	'EclairButterscotch', 'EclairCaramel', 'EclairChocolate', 'EclairCoconut', 'EclairDelight',
	'EclairMango', 'EclairPineapple', 'EclairRaspberry', 'EclairSpecial', 'EclairVanilla',
	'MacaronBlueberry', 'MacaronCinnamon', 'MacaronCoffee', 'MacaronHazelnut', 'MacaronLavender',
	'MacaronOrange', 'MacaronPistachio', 'MacaronRose', 'MacaronSpecial', 'MacaronVanilla',
	'SconeBlueberry', 'SconeCherry', 'SconeChocolate', 'SconeCinnamon', 'SconeCranberry',
	'SconeHazelnut', 'SconeLemon', 'SconePeach', 'SconeStrawberry', 'SconeVanilla',
];

export const bakeryPastry: ExerciseDef = {
	id: 'binary-search/bakery-pastry',
	entry: 'findPastryIndex',
	starter: `function findPastryIndex(bakeryPastries: string[], pastryCode: string): number {
  return -1
}`,
	solution: `function findPastryIndex(bakeryPastries: string[], pastryCode: string): number {
  let low = 0
  let high = bakeryPastries.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const current = bakeryPastries[mid]
    if (current === pastryCode) return mid
    if (current < pastryCode) low = mid + 1
    else high = mid - 1
  }
  return -1
}`,
	tests: [
		{ args: [pastries, 'SconeLemon'], expected: 46, maxReads: budget(pastries.length) },
		{ args: [pastries, 'CroissantAlmond'], expected: 1, maxReads: budget(pastries.length) },
		{ args: [pastries, 'BrownieDeluxe'], expected: -1, maxReads: budget(pastries.length) },
		{ args: [pastries, 'MacaronRose'], expected: 37, hidden: true, maxReads: budget(pastries.length) },
		{ args: [pastries, 'Scone'], expected: -1, hidden: true, maxReads: budget(pastries.length) },
	],
	hints: [
		mustBeBinary,
		{ 'pt-BR': 'Strings também podem ser comparadas com `<` e `>`: a ordem é a de dicionário.', en: 'Strings can be compared with `<` and `>` too: the order is dictionary order.' },
		{ 'pt-BR': 'Atenção: maiúsculas vêm antes de minúsculas e dígitos antes de letras (`"Croissant2022" < "CroissantAlmond"`).', en: 'Careful: uppercase comes before lowercase and digits before letters (`"Croissant2022" < "CroissantAlmond"`).' },
	],
};

const signals = Array.from({ length: 1000 }, (_, i) => i * 10);

export const spacecraftNavigation: ExerciseDef = {
	id: 'binary-search/spacecraft-navigation',
	entry: 'findClosestFrequency',
	starter: `function findClosestFrequency(beaconFrequencies: number[], targetFrequency: number): number {
  return 0
}`,
	solution: `function findClosestFrequency(beaconFrequencies: number[], targetFrequency: number): number {
  let low = 0
  let high = beaconFrequencies.length - 1
  // Find the first frequency >= target
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (beaconFrequencies[mid] < targetFrequency) low = mid + 1
    else high = mid
  }
  if (low > 0) {
    const before = beaconFrequencies[low - 1]
    const after = beaconFrequencies[low]
    if (targetFrequency - before <= Math.abs(after - targetFrequency)) return low - 1
  }
  return low
}`,
	tests: [
		{ args: [[100, 200, 300, 400, 500], 350], expected: 2 },
		{ args: [[100, 200, 300, 400, 500], 420], expected: 3 },
		{ args: [[100, 200, 300, 400, 500], 50], expected: 0 },
		{ args: [[100, 200, 300, 400, 500], 900], expected: 4 },
		{ args: [[100, 200, 300, 400, 500], 300], expected: 2, hidden: true },
		{ args: [[42], 7], expected: 0, hidden: true },
		{ args: [signals, 4567], expected: 457, hidden: true, maxReads: budget(1000) + 4 },
		{ args: [signals, 4565], expected: 456, hidden: true, maxReads: budget(1000) + 4 },
	],
	hints: [
		mustBeBinary,
		{ 'pt-BR': 'Primeiro encontre a posição onde o alvo seria inserido para manter o array ordenado.', en: 'First find the position where the target would be inserted to keep the array sorted.' },
		{ 'pt-BR': 'A resposta é essa posição ou a anterior. Compare as duas distâncias (empate: fica a menor).', en: 'The answer is that position or the one before it. Compare both distances (tie: keep the smaller one).' },
	],
};

const longLog = Array.from({ length: 1000 }, (_, i) => (i < 731 ? i : i + 1));

export const missingTimestamp: ExerciseDef = {
	id: 'binary-search/missing-timestamp',
	entry: 'findMissingTimestamp',
	starter: `function findMissingTimestamp(transactions: number[]): number {
  return 0
}`,
	solution: `function findMissingTimestamp(transactions: number[]): number {
  // Before the gap, transactions[i] === i. After it, transactions[i] > i.
  let low = 0
  let high = transactions.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (transactions[mid] === mid) low = mid + 1
    else high = mid
  }
  return low
}`,
	tests: [
		{ args: [[0, 1, 2, 3, 5, 6, 7, 8]], expected: 4 },
		{ args: [[1, 2, 3]], expected: 0 },
		{ args: [[0, 1, 2]], expected: 3 },
		{ args: [[]], expected: 0, hidden: true },
		{ args: [[0, 2]], expected: 1, hidden: true },
		{ args: [longLog], expected: 731, hidden: true, maxReads: budget(1000) },
	],
	hints: [
		mustBeBinary,
		{ 'pt-BR': 'Sem buracos, `transactions[i] === i` para todo `i`. O que muda depois do primeiro buraco?', en: 'With no gaps, `transactions[i] === i` for every `i`. What changes after the first gap?' },
		{ 'pt-BR': 'Procure o primeiro índice onde `transactions[i] !== i`. Se não existir, a resposta é o tamanho do array.', en: 'Look for the first index where `transactions[i] !== i`. If there is none, the answer is the array length.' },
	],
};

const bases = ['A', 'C', 'G', 'T'];
const allSequences = bases.flatMap((a) => bases.flatMap((b) => bases.flatMap((c) => bases.flatMap((d) => bases.map((e) => a + b + c + d + e)))));
const catalog = allSequences.filter((_, i) => i % 3 !== 0);

export const geneticMutation: ExerciseDef = {
	id: 'binary-search/genetic-mutation',
	entry: 'searchForMutation',
	starter: `function searchForMutation(dnaSequences: string[], targetSequence: string): boolean {
  return false
}`,
	solution: `function searchForMutation(dnaSequences: string[], targetSequence: string): boolean {
  let low = 0
  let high = dnaSequences.length - 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const current = dnaSequences[mid]
    if (current === targetSequence) return true
    if (current < targetSequence) low = mid + 1
    else high = mid - 1
  }
  return false
}`,
	tests: [
		{ args: [['ACGT', 'ATCG', 'CGTA', 'GTAC', 'TACG'], 'ATCG'], expected: true },
		{ args: [['ACGT', 'ATCG', 'CGTA', 'GTAC', 'TACG'], 'GGGG'], expected: false },
		{ args: [[], 'ACGT'], expected: false, hidden: true },
		{ args: [catalog, catalog[600]], expected: true, hidden: true, maxReads: budget(catalog.length) },
		{ args: [catalog, allSequences[600]], expected: false, hidden: true, maxReads: budget(catalog.length) },
	],
	hints: [
		mustBeBinary,
		{ 'pt-BR': 'É uma busca binária normal; só muda o que você retorna.', en: 'It is a regular binary search; only the return value changes.' },
	],
};

export const binarySearchExercises = [libraryBook, bakeryPastry, spacecraftNavigation, missingTimestamp, geneticMutation];
