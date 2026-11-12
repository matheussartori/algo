import { describe, expect, it } from 'vitest';
import { toBeats } from './engine';

const run = (trace: number[], over: object = {}) => ({ slots: [3, 7, 5], target: 5, trace, returned: 2, expected: 2, pass: true, failed: false, ...over });

describe('toBeats', () => {
	it('walks, inspects and celebrates a passing run', () => {
		expect(toBeats(run([0, 1, 2])).map((b) => b.type)).toEqual(['move', 'inspect', 'move', 'inspect', 'move', 'inspect', 'found', 'celebrate']);
	});

	it('falls off the edge only past the real length', () => {
		const trimmed = toBeats(run([1, 40], { returned: 40, expected: 40 }), 200);
		expect(trimmed.some((b) => b.type === 'outOfBounds')).toBe(false);
		const past = toBeats(run([3], { pass: false, returned: -1 }));
		expect(past[0]).toEqual({ type: 'outOfBounds', i: 3 });
	});

	it('gets confused and goes home when the code crashed', () => {
		expect(toBeats(run([0], { failed: true, pass: false })).slice(-2)).toEqual([{ type: 'confused' }, { type: 'move', i: -1 }]);
	});
});
