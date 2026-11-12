import { describe, expect, it } from 'vitest';
import { execute, tsToJsStarter } from '../lib/runner/core';
import { exercises } from './index';

const linearScan = (entry: string) => `function ${entry}(items: any[], target: any): any {
  for (let i = 0; i < items.length; i++) if (items[i] === target) return i
  return -1
}`;

describe.each(Object.values(exercises))('$id', (exercise) => {
	const run = (code: string, lang: 'ts' | 'js' = 'ts') =>
		execute({ code, lang, entry: exercise.entry, tests: exercise.tests });

	it('reference solution passes every test (TS)', () => {
		const response = run(exercise.solution);
		expect(response.kind).toBe('ok');
		if (response.kind === 'ok') expect(response.results.filter((r) => !r.pass)).toEqual([]);
	});

	it('reference solution passes every test (JS)', () => {
		const response = run(tsToJsStarter(exercise.solution), 'js');
		expect(response.kind).toBe('ok');
		if (response.kind === 'ok') expect(response.results.every((r) => r.pass)).toBe(true);
	});

	it('starter compiles in both languages but does not pass', () => {
		for (const [code, lang] of [[exercise.starter, 'ts'], [tsToJsStarter(exercise.starter), 'js']] as const) {
			const response = run(code, lang);
			expect(response.kind).toBe('ok');
			if (response.kind === 'ok') expect(response.results.some((r) => !r.pass)).toBe(true);
		}
	});

	it('has visible and hidden tests, and hints in both languages', () => {
		expect(exercise.tests.some((t) => !t.hidden)).toBe(true);
		expect(exercise.tests.some((t) => t.hidden)).toBe(true);
		for (const hint of exercise.hints) expect(hint.en && hint['pt-BR']).toBeTruthy();
	});

	it('names every test and keeps the story short', () => {
		for (const test of exercise.tests) expect(test.name?.en && test.name['pt-BR']).toBeTruthy();
		for (const lang of ['pt-BR', 'en'] as const) expect(exercise.story[lang].split(/\s+/).length).toBeLessThanOrEqual(70);
	});

	if (exercise.id.startsWith('binary-search/')) {
		it('rejects a linear scan', () => {
			const response = run(linearScan(exercise.entry));
			expect(response.kind).toBe('ok');
			if (response.kind === 'ok') expect(response.results.some((r) => !r.pass && r.reads)).toBe(true);
		});
	}
});

describe('runner', () => {
	it('records the indexes the code read, in order', () => {
		const response = execute({
			code: 'function f(a, t) { for (let i = a.length - 1; i >= 0; i--) if (a[i] === t) return i; return -1 }',
			lang: 'js',
			entry: 'f',
			tests: [{ args: [[1, 2, 3], 2], expected: 1 }],
		});
		expect(response).toMatchObject({ kind: 'ok', results: [{ pass: true, trace: [2, 1] }] });
	});

	const tests = [{ args: [1, 2], expected: 3 }];

	it('reports syntax errors', () => {
		expect(execute({ code: 'function sum(a, b) { return a + }', lang: 'js', entry: 'sum', tests }).kind).toBe('compile-error');
	});

	it('reports a missing entry function', () => {
		expect(execute({ code: 'function add(a, b) { return a + b }', lang: 'js', entry: 'sum', tests }).kind).toBe('missing-entry');
	});

	it('captures console.log and runtime errors', () => {
		const response = execute({
			code: 'function sum(a: number, b: number) { console.log("hi", [a]); throw new Error("boom") }',
			lang: 'ts',
			entry: 'sum',
			tests,
		});
		expect(response).toMatchObject({ kind: 'ok', logs: ['hi [1]'], results: [{ pass: false, error: 'Error: boom' }] });
	});

	it('accepts arrow functions and export', () => {
		const response = execute({ code: 'export const sum = (a: number, b: number): number => a + b', lang: 'ts', entry: 'sum', tests });
		expect(response).toMatchObject({ kind: 'ok', results: [{ pass: true }] });
	});

	it('does not let one test mutate the args of another', () => {
		const response = execute({
			code: 'function f(a) { a.push(1); return a.length }',
			lang: 'js',
			entry: 'f',
			tests: [{ args: [[]], expected: 1 }],
		});
		expect(response).toMatchObject({ kind: 'ok', results: [{ pass: true }] });
	});
});
