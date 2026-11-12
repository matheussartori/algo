import { transform } from 'sucrase';
import { deepEqual, format, IDENTIFIER } from './format';

export { deepEqual, format };

export type CodeLang = 'ts' | 'js';

export interface TestCase {
	args: unknown[];
	expected: unknown;
	/** Hidden tests only report pass/fail, so learners can't hard-code answers. */
	hidden?: boolean;
	/** Short label shown next to the test ("empty island", "two trees with 5 branches"). */
	name?: { 'pt-BR': string; en: string };
	/**
	 * Max number of element reads allowed on the first argument (an array).
	 * Lets an exercise require an O(log n) solution instead of a linear scan.
	 */
	maxReads?: number;
}

export interface TestResult {
	pass: boolean;
	received?: string;
	error?: string;
	/** Set when `maxReads` was exceeded. */
	reads?: number;
	/**
	 * Indexes of the first argument (an array) in the order the code read them, capped at
	 * TRACE_LIMIT. The exercise stage replays it: the character goes where the code looked.
	 */
	trace?: number[];
}

export const TRACE_LIMIT = 400;

export interface RunRequest {
	code: string;
	lang: CodeLang;
	entry: string;
	tests: TestCase[];
}

export type RunResponse =
	| { kind: 'ok'; results: TestResult[]; logs: string[] }
	| { kind: 'compile-error'; message: string }
	| { kind: 'missing-entry'; entry: string; logs: string[] }
	| { kind: 'timeout' };

/** Strips TypeScript syntax. No type checking: that is a separate, optional step. */
export function toJs(code: string, lang: CodeLang): string {
	const source = code.replace(/^\s*export\s+(default\s+)?/gm, '');
	if (lang === 'js') return source;
	return transform(source, { transforms: ['typescript'], disableESTransforms: true }).code;
}

/** Converts a TypeScript starter into a readable JavaScript one. */
export function tsToJsStarter(code: string): string {
	return toJs(code, 'ts')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/**
 * Runs learner code against the tests. Pure and synchronous: the browser calls it
 * inside a Web Worker (which enforces the timeout), and Vitest calls it directly.
 */
export function execute({ code, lang, entry, tests }: RunRequest): RunResponse {
	if (!IDENTIFIER.test(entry)) throw new Error(`Invalid entry name: ${entry}`);

	let js: string;
	try {
		js = toJs(code, lang);
	} catch (error) {
		return { kind: 'compile-error', message: errorMessage(error) };
	}

	const logs: string[] = [];
	const fakeConsole = {
		log: (...values: unknown[]) => logs.push(values.map((v) => (typeof v === 'string' ? v : format(v))).join(' ')),
	};
	(fakeConsole as Record<string, unknown>).info = fakeConsole.log;
	(fakeConsole as Record<string, unknown>).warn = fakeConsole.log;
	(fakeConsole as Record<string, unknown>).error = fakeConsole.log;

	let fn: unknown;
	try {
		fn = new Function('console', `${js}\n;return typeof ${entry} === 'function' ? ${entry} : undefined;`)(fakeConsole);
	} catch (error) {
		return { kind: 'compile-error', message: errorMessage(error) };
	}
	if (typeof fn !== 'function') return { kind: 'missing-entry', entry, logs };

	let lastTrace: number[] = [];
	const results = tests.map(({ args, expected, maxReads }): TestResult => {
		lastTrace = [];
		try {
			const input = structuredClone(args);
			const counter = { reads: 0, trace: lastTrace };
			const traced = Array.isArray(input[0]);
			if (traced) input[0] = countReads(input[0] as unknown[], counter);
			const received = fn(...input);
			const result: TestResult = { pass: deepEqual(received, expected), received: format(received) };
			if (traced) result.trace = counter.trace;
			if (maxReads !== undefined && counter.reads > maxReads) {
				result.pass = false;
				result.reads = counter.reads;
			}
			return result;
		} catch (error) {
			return { pass: false, error: errorMessage(error), trace: lastTrace.length ? lastTrace : undefined };
		}
	});

	return { kind: 'ok', results, logs };
}

function countReads<T>(array: T[], counter: { reads: number; trace: number[] }): T[] {
	return new Proxy(array, {
		get(target, key, receiver) {
			if (typeof key === 'string' && /^\d+$/.test(key)) {
				counter.reads++;
				if (counter.trace.length < TRACE_LIMIT) counter.trace.push(Number(key));
			}
			return Reflect.get(target, key, receiver);
		},
	});
}

/** Generous read budget for a binary search over `n` elements (two reads per iteration). */
export function binarySearchBudget(n: number): number {
	return 2 * Math.ceil(Math.log2(n + 1)) + 2;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
