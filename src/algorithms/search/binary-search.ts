import type { AlgorithmDef, Step } from '../../lib/trace';

export interface BinarySearchInput {
	/** Must be sorted in ascending order. */
	array: number[];
	target: number;
}

const code = `function binarySearch(array: number[], target: number): number {
  let low = 0
  let high = array.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)

    if (array[mid] === target) {
      return mid
    } else if (array[mid] < target) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return -1
}`;

function* steps({ array, target }: BinarySearchInput): Generator<Step, number> {
	const values = [...array];
	let low = 0;
	let high = values.length - 1;
	let comparisons = 0;

	const outside = () => values.map((_, i) => i).filter((i) => i < low || i > high);

	yield {
		line: 3,
		frame: { values, pointers: { low, high }, vars: { target, low, high } },
		note: {
			'pt-BR': `O array está ordenado. A busca começa com o intervalo inteiro: low = ${low}, high = ${high}.`,
			en: `The array is sorted. The search starts with the whole range: low = ${low}, high = ${high}.`,
		},
	};

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const value = values[mid];
		const vars = { target, low, high, mid, 'array[mid]': value };

		yield {
			line: 6,
			frame: { values, active: mid, dimmed: outside(), pointers: { low, mid, high }, vars },
			note: {
				'pt-BR': `O meio do intervalo [${low}, ${high}] é ${mid}. Vamos olhar array[${mid}] = ${value}.`,
				en: `The middle of range [${low}, ${high}] is ${mid}. Let's look at array[${mid}] = ${value}.`,
			},
		};

		comparisons++;
		if (value === target) {
			yield {
				line: 9,
				frame: { values, active: mid, found: mid, dimmed: outside(), pointers: { low, mid, high }, vars },
				note: {
					'pt-BR': `${value} é o alvo! Encontrado no índice ${mid} com ${comparisons} comparação(ões).`,
					en: `${value} is the target! Found at index ${mid} with ${comparisons} comparison(s).`,
				},
			};
			return mid;
		}

		if (value < target) {
			low = mid + 1;
			yield {
				line: 11,
				frame: { values, active: mid, dimmed: outside(), pointers: { low, high }, vars: { ...vars, low } },
				note: {
					'pt-BR': `${value} < ${target}, então o alvo só pode estar à direita. Descartamos a metade esquerda: low = ${low}.`,
					en: `${value} < ${target}, so the target can only be to the right. Discard the left half: low = ${low}.`,
				},
			};
		} else {
			high = mid - 1;
			yield {
				line: 13,
				frame: { values, active: mid, dimmed: outside(), pointers: { low, high }, vars: { ...vars, high } },
				note: {
					'pt-BR': `${value} > ${target}, então o alvo só pode estar à esquerda. Descartamos a metade direita: high = ${high}.`,
					en: `${value} > ${target}, so the target can only be to the left. Discard the right half: high = ${high}.`,
				},
			};
		}
	}

	yield {
		line: 17,
		frame: { values, dimmed: values.map((_, i) => i), vars: { target, low, high } },
		note: {
			'pt-BR': `low (${low}) passou de high (${high}): o intervalo ficou vazio. ${target} não está no array, retornamos -1.`,
			en: `low (${low}) went past high (${high}): the range is empty. ${target} is not in the array, we return -1.`,
		},
	};
	return -1;
}

function run({ array, target }: BinarySearchInput): number {
	let low = 0;
	let high = array.length - 1;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		if (array[mid] === target) return mid;
		if (array[mid] < target) low = mid + 1;
		else high = mid - 1;
	}
	return -1;
}

export const binarySearch: AlgorithmDef<BinarySearchInput> = { id: 'binary-search', code, steps, run };
