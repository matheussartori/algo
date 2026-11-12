import type { RunRequest, RunResponse } from './core';

const TIMEOUT_MS = 3000;

/**
 * Runs learner code in a fresh Web Worker: the page never freezes, the code has no DOM
 * access, and an infinite loop is killed after the timeout. Not a security sandbox for
 * third-party code (see README).
 */
export function runInWorker(request: RunRequest): Promise<RunResponse> {
	return new Promise((resolve) => {
		const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
		const finish = (response: RunResponse) => {
			clearTimeout(timer);
			worker.terminate();
			resolve(response);
		};
		const timer = setTimeout(() => finish({ kind: 'timeout' }), TIMEOUT_MS);
		worker.onmessage = (event: MessageEvent<RunResponse>) => finish(event.data);
		worker.onerror = (event) => {
			event.preventDefault();
			finish({ kind: 'compile-error', message: event.message });
		};
		worker.postMessage(request);
	});
}
