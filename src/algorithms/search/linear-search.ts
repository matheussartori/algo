import type { AlgorithmDef, Cell, Step } from '../../lib/trace';

export interface LinearSearchInput {
	array: Cell[];
	target: Cell;
}

const code = `function linearSearch(array: number[], target: number): number {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === target) {
      return i
    }
  }
  return -1
}`;

function* steps({ array, target }: LinearSearchInput): Generator<Step, number> {
	const values = [...array];

	yield {
		line: 1,
		frame: { values, vars: { target } },
		note: {
			'pt-BR': `Vamos procurar ${target} olhando um elemento de cada vez, da esquerda para a direita.`,
			en: `We will look for ${target} one element at a time, from left to right.`,
		},
	};

	for (let i = 0; i < values.length; i++) {
		const dimmed = range(0, i);
		const value = values[i];

		yield {
			line: 3,
			frame: { values, active: i, dimmed, pointers: { i }, vars: { target, i, 'array[i]': value } },
			note: {
				'pt-BR': `array[${i}] é ${value}. É igual a ${target}?`,
				en: `array[${i}] is ${value}. Is it equal to ${target}?`,
			},
		};

		if (value === target) {
			yield {
				line: 4,
				frame: { values, active: i, dimmed, found: i, pointers: { i }, vars: { target, i, 'array[i]': value } },
				note: {
					'pt-BR': `Sim! Encontramos ${target} no índice ${i} depois de ${i + 1} comparação(ões).`,
					en: `Yes! Found ${target} at index ${i} after ${i + 1} comparison(s).`,
				},
			};
			return i;
		}
	}

	yield {
		line: 7,
		frame: { values, dimmed: range(0, values.length), vars: { target } },
		note: {
			'pt-BR': `Olhamos os ${values.length} elementos e nenhum era ${target}. Retornamos -1.`,
			en: `We checked all ${values.length} elements and none was ${target}. We return -1.`,
		},
	};
	return -1;
}

function run({ array, target }: LinearSearchInput): number {
	for (let i = 0; i < array.length; i++) {
		if (array[i] === target) return i;
	}
	return -1;
}

function range(from: number, to: number): number[] {
	return Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k);
}

export const linearSearch: AlgorithmDef<LinearSearchInput> = { id: 'linear-search', code, steps, run };
