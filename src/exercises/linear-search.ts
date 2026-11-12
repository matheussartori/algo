import type { ExerciseDef } from './types';

const many = Array.from({ length: 200 }, (_, i) => i * 3);

export const pirateTreasure: ExerciseDef = {
	id: 'linear-search/pirate-treasure',
	entry: 'findTreeIndexByBranches',
	starter: `function findTreeIndexByBranches(branchesOnTrees: number[], targetBranchCount: number): number {
  return -1
}`,
	solution: `function findTreeIndexByBranches(branchesOnTrees: number[], targetBranchCount: number): number {
  for (let i = 0; i < branchesOnTrees.length; i++) {
    if (branchesOnTrees[i] === targetBranchCount) return i
  }
  return -1
}`,
	tests: [
		{ args: [[2, 4, 6, 8, 10], 6], expected: 2 },
		{ args: [[2, 4, 6, 8, 10], 2], expected: 0 },
		{ args: [[2, 4, 6, 8, 10], 7], expected: -1 },
		{ args: [[], 3], expected: -1, hidden: true },
		{ args: [[9, 1, 5], 5], expected: 2, hidden: true },
		{ args: [many, 597], expected: 199, hidden: true },
	],
	hints: [
		{ 'pt-BR': 'Você precisa olhar cada árvore, uma de cada vez.', en: 'You need to look at each tree, one at a time.' },
		{ 'pt-BR': 'Use um `for` com um índice `i` e compare `branchesOnTrees[i]` com o alvo.', en: 'Use a `for` loop with an index `i` and compare `branchesOnTrees[i]` with the target.' },
		{ 'pt-BR': 'Se achar, retorne `i` na hora. Se o loop acabar sem achar, retorne `-1`.', en: 'If you find it, return `i` right away. If the loop ends without a match, return `-1`.' },
	],
};

export const lostOrange: ExerciseDef = {
	id: 'linear-search/lost-orange',
	entry: 'findOrangeIndexInBasket',
	starter: `function findOrangeIndexInBasket(fruitBasket: string[], targetFruit: string): number {
  return -1
}`,
	solution: `function findOrangeIndexInBasket(fruitBasket: string[], targetFruit: string): number {
  for (let i = 0; i < fruitBasket.length; i++) {
    if (fruitBasket[i] === targetFruit) return i
  }
  return -1
}`,
	tests: [
		{ args: [['apple', 'banana', 'grape', 'orange'], 'orange'], expected: 3 },
		{ args: [['apple', 'banana', 'grape'], 'orange'], expected: -1 },
		{ args: [['orange', 'orange'], 'orange'], expected: 0, hidden: true },
		{ args: [['Orange', 'orange'], 'orange'], expected: 1, hidden: true },
		{ args: [[], 'orange'], expected: -1, hidden: true },
	],
	hints: [
		{ 'pt-BR': 'É a mesma ideia do exercício anterior, só que com strings.', en: 'Same idea as the previous exercise, but with strings.' },
		{ 'pt-BR': 'Se houver mais de uma laranja, qual índice o teste espera? O primeiro.', en: 'If there is more than one orange, which index do the tests expect? The first one.' },
	],
};

export const bobsIdea: ExerciseDef = {
	id: 'linear-search/bobs-idea',
	entry: 'findProposalIndexByName',
	starter: `type ProjectProposal = {
  name: string
  idea: string
}

function findProposalIndexByName(projectProposals: ProjectProposal[], targetName: string): number {
  return -1
}`,
	solution: `type ProjectProposal = {
  name: string
  idea: string
}

function findProposalIndexByName(projectProposals: ProjectProposal[], targetName: string): number {
  for (let i = 0; i < projectProposals.length; i++) {
    if (projectProposals[i].name === targetName) return i
  }
  return -1
}`,
	tests: [
		{
			args: [[{ name: 'Alice', idea: 'Idea A' }, { name: 'Bob', idea: 'Idea B' }, { name: 'Charlie', idea: 'Idea C' }], 'Bob'],
			expected: 1,
		},
		{ args: [[{ name: 'Alice', idea: 'Idea A' }], 'Bob'], expected: -1 },
		{ args: [[{ name: 'Bob', idea: 'Bob' }, { name: 'Bob', idea: 'Again' }], 'Bob'], expected: 0, hidden: true },
		{ args: [[{ name: 'Alice', idea: 'Bob' }], 'Bob'], expected: -1, hidden: true },
	],
	hints: [
		{ 'pt-BR': 'Agora cada elemento é um objeto. O que você deve comparar com `targetName`?', en: 'Each element is now an object. What should you compare with `targetName`?' },
		{ 'pt-BR': 'Compare `projectProposals[i].name`, não o objeto inteiro.', en: 'Compare `projectProposals[i].name`, not the whole object.' },
	],
};

export const hiddenChamber: ExerciseDef = {
	id: 'linear-search/hidden-chamber',
	entry: 'findChamberIndexBySymbol',
	starter: `function findChamberIndexBySymbol(caveLayout: number[][], targetSymbol: number): number {
  return -1
}`,
	solution: `function findChamberIndexBySymbol(caveLayout: number[][], targetSymbol: number): number {
  for (let row = 0; row < caveLayout.length; row++) {
    for (let col = 0; col < caveLayout[row].length; col++) {
      if (caveLayout[row][col] === targetSymbol) return row
    }
  }
  return -1
}`,
	tests: [
		{ args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], 5], expected: 1 },
		{ args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], 9], expected: 2 },
		{ args: [[[1, 2, 3], [4, 5, 6], [7, 8, 9]], 10], expected: -1 },
		{ args: [[[], [3], []], 3], expected: 1, hidden: true },
		{ args: [[[1], [2, 2, 2, 7]], 7], expected: 1, hidden: true },
		{ args: [[], 1], expected: -1, hidden: true },
	],
	hints: [
		{ 'pt-BR': 'Cada câmara é uma linha da matriz. Você precisa olhar dentro de cada linha.', en: 'Each chamber is a row of the matrix. You need to look inside every row.' },
		{ 'pt-BR': 'Use dois loops: um para as linhas e outro para os símbolos de cada linha.', en: 'Use two loops: one for the rows and one for the symbols in each row.' },
		{ 'pt-BR': 'Quando achar, retorne o índice da linha, não da coluna.', en: 'When you find it, return the row index, not the column.' },
	],
};

export const suspectsSafe: ExerciseDef = {
	id: 'linear-search/suspects-safe',
	entry: 'findSuspectIndexBySafeContents',
	starter: `type Suspect = {
  id: number
  safeContents: number[]
}

function findSuspectIndexBySafeContents(suspectsData: Suspect[], targetContents: number[]): number {
  return -1
}`,
	solution: `type Suspect = {
  id: number
  safeContents: number[]
}

function sameContents(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function findSuspectIndexBySafeContents(suspectsData: Suspect[], targetContents: number[]): number {
  for (let i = 0; i < suspectsData.length; i++) {
    if (sameContents(suspectsData[i].safeContents, targetContents)) return i
  }
  return -1
}`,
	tests: [
		{
			args: [
				[
					{ id: 1, safeContents: [10, 20, 30] },
					{ id: 2, safeContents: [40, 50, 60] },
					{ id: 3, safeContents: [70, 80, 90] },
				],
				[40, 50, 60],
			],
			expected: 1,
		},
		{ args: [[{ id: 1, safeContents: [10, 20, 30] }], [40, 50, 60]], expected: -1 },
		{ args: [[{ id: 1, safeContents: [60, 50, 40] }], [40, 50, 60]], expected: -1, hidden: true },
		{ args: [[{ id: 1, safeContents: [40, 50] }, { id: 2, safeContents: [40, 50, 60, 70] }], [40, 50, 60]], expected: -1, hidden: true },
		{ args: [[{ id: 7, safeContents: [] }], []], expected: 0, hidden: true },
	],
	hints: [
		{ 'pt-BR': 'Em JavaScript, `[1, 2] === [1, 2]` é `false`. Por quê?', en: 'In JavaScript, `[1, 2] === [1, 2]` is `false`. Why?' },
		{ 'pt-BR': '`===` compara referências de arrays, não o conteúdo. Escreva uma função que compare elemento a elemento.', en: '`===` compares array references, not contents. Write a function that compares element by element.' },
		{ 'pt-BR': 'Arrays com tamanhos diferentes nunca são iguais: verifique isso primeiro.', en: 'Arrays with different lengths are never equal: check that first.' },
	],
};

export const linearSearchExercises = [pirateTreasure, lostOrange, bobsIdea, hiddenChamber, suspectsSafe];
