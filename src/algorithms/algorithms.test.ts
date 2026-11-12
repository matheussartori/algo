import { describe, expect, it } from 'vitest';
import { collect } from '../lib/trace';
import { algorithms } from './index';
import { binarySearch } from './search/binary-search';
import { linearSearch } from './search/linear-search';

function randomSorted(n: number): number[] {
	const set = new Set<number>();
	while (set.size < n) set.add(Math.floor(Math.random() * n * 4));
	return [...set].sort((a, b) => a - b);
}

describe.each(Object.values(algorithms))('$id', (algo) => {
	it('only points at existing code lines', () => {
		const lines = algo.code.split('\n').length;
		for (let n = 0; n < 12; n++) {
			const array = randomSorted(n);
			for (const target of [array[0] ?? 1, array[n - 1] ?? 2, -1]) {
				for (const step of collect(algo, { array, target })) {
					expect(step.line).toBeGreaterThanOrEqual(1);
					expect(step.line).toBeLessThanOrEqual(lines);
					expect(step.note['pt-BR']).not.toBe('');
					expect(step.note.en).not.toBe('');
				}
			}
		}
	});
});

describe.each([linearSearch, binarySearch])('$id trace matches the plain implementation', (algo) => {
	it.each(Array.from({ length: 40 }, (_, k) => k))('random case %i', () => {
		const array = randomSorted(1 + Math.floor(Math.random() * 30));
		const target = Math.random() < 0.6 ? array[Math.floor(Math.random() * array.length)] : -5;
		const generator = algo.steps({ array, target });
		let result = generator.next();
		const steps = [];
		while (!result.done) {
			steps.push(result.value);
			result = generator.next();
		}
		const expected = algo.run({ array, target });
		expect(result.value).toBe(expected);
		const last = steps.at(-1)!;
		expect(last.frame.found ?? -1).toBe(expected);
	});
});

it('binary search examines at most ⌈log2(n+1)⌉ elements', () => {
	const array = Array.from({ length: 1000 }, (_, i) => i);
	const examined = collect(binarySearch, { array, target: -1 }).filter((s) => s.line === 6).length;
	expect(examined).toBeLessThanOrEqual(Math.ceil(Math.log2(1001)));
});
