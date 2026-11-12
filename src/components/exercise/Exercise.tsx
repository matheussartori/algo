import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExerciseDef } from '../../exercises/types';
import { type Locale, t } from '../../lib/i18n';
import { runInWorker } from '../../lib/runner/client';
import type { CodeLang, RunResponse } from '../../lib/runner/core';
import { format } from '../../lib/runner/format';
import { Inline } from '../Inline';
import { CodeEditor } from './CodeEditor';

interface Props {
	exercise: ExerciseDef;
	/** JavaScript versions, derived at build time so the page doesn't ship the transpiler. */
	js: { starter: string; solution: string };
	lang: Locale;
}

const storage = {
	get(key: string): string | null {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	set(key: string, value: string) {
		try {
			localStorage.setItem(key, value);
		} catch {
			// Private mode or blocked storage: the exercise still works, it just won't remember.
		}
	},
};

export default function Exercise({ exercise, js, lang }: Props) {
	const starters = useMemo(() => ({ ts: exercise.starter, js: js.starter }), [exercise.starter, js.starter]);
	const solutions = { ts: exercise.solution, js: js.solution };
	const key = (codeLang: CodeLang) => `algo:exercise:${exercise.id}:${codeLang}`;

	const [codeLang, setCodeLang] = useState<CodeLang>('ts');
	const [code, setCode] = useState(starters.ts);
	const [response, setResponse] = useState<RunResponse | null>(null);
	const [running, setRunning] = useState(false);
	const [hintsShown, setHintsShown] = useState(0);
	const [showSolution, setShowSolution] = useState(false);
	const [runs, setRuns] = useState(0);

	// Restore saved preference and code after hydration (never during SSR).
	useEffect(() => {
		const savedLang = storage.get('algo:lang') === 'js' ? 'js' : 'ts';
		setCodeLang(savedLang);
		setCode(storage.get(key(savedLang)) ?? starters[savedLang]);
	}, []);

	const changeCode = (next: string) => {
		setCode(next);
		storage.set(key(codeLang), next);
	};

	const changeLang = (next: CodeLang) => {
		if (next === codeLang) return;
		setCodeLang(next);
		storage.set('algo:lang', next);
		setCode(storage.get(key(next)) ?? starters[next]);
		setResponse(null);
	};

	const run = useCallback(async () => {
		setRunning(true);
		const result = await runInWorker({ code, lang: codeLang, entry: exercise.entry, tests: exercise.tests });
		setResponse(result);
		setRuns((r) => r + 1);
		setRunning(false);
		if (result.kind === 'ok' && result.results.every((r) => r.pass)) {
			storage.set(`algo:solved:${exercise.id}`, new Date().toISOString());
		}
	}, [code, codeLang, exercise]);

	const reset = () => {
		changeCode(starters[codeLang]);
		setResponse(null);
	};

	const passed = response?.kind === 'ok' ? response.results.filter((r) => r.pass).length : 0;
	const allPassed = response?.kind === 'ok' && passed === exercise.tests.length;

	return (
		<div className="algo-exercise not-content">
			<div className="algo-exercise__toolbar">
				<div className="algo-segmented" role="tablist">
					{(['ts', 'js'] as const).map((l) => (
						<button key={l} type="button" role="tab" aria-selected={codeLang === l} onClick={() => changeLang(l)}>
							{l === 'ts' ? 'TypeScript' : 'JavaScript'}
						</button>
					))}
				</div>
				<span className="algo-exercise__shortcut">{t(lang, 'exercise.shortcut')}</span>
			</div>

			<CodeEditor
				value={code}
				typescript={codeLang === 'ts'}
				onChange={changeCode}
				onRun={run}
				label={exercise.entry}
			/>

			<div className="algo-exercise__actions">
				<button type="button" className="algo-button" onClick={run} disabled={running}>
					{t(lang, running ? 'exercise.running' : 'exercise.run')}
				</button>
				<button type="button" className="algo-button algo-button--ghost" onClick={reset}>
					{t(lang, 'exercise.reset')}
				</button>
				<button
					type="button"
					className="algo-button algo-button--ghost"
					onClick={() => setHintsShown((n) => n + 1)}
					disabled={hintsShown >= exercise.hints.length}
				>
					{hintsShown >= exercise.hints.length
						? t(lang, 'exercise.noMoreHints')
						: `${t(lang, 'exercise.hint')} ${hintsShown + 1}/${exercise.hints.length}`}
				</button>
				<button
					type="button"
					className="algo-button algo-button--ghost"
					onClick={() => setShowSolution((s) => !s)}
					disabled={runs === 0}
					title={runs === 0 ? t(lang, 'exercise.solutionLocked') : undefined}
				>
					{t(lang, showSolution ? 'exercise.hideSolution' : 'exercise.solution')}
				</button>
			</div>

			{hintsShown > 0 && (
				<ol className="algo-exercise__hints">
					{exercise.hints.slice(0, hintsShown).map((hint, i) => (
						<li key={i}>
							<Inline text={hint[lang]} />
						</li>
					))}
				</ol>
			)}

			{showSolution && (
				<div className="algo-exercise__solution">
					<p>{t(lang, 'exercise.solutionWarning')}</p>
					<pre>
						<code>{solutions[codeLang]}</code>
					</pre>
				</div>
			)}

			{response && (
				<div className="algo-exercise__results" aria-live="polite">
					{response.kind === 'timeout' && <p className="algo-error">{t(lang, 'exercise.timeout')}</p>}
					{response.kind === 'compile-error' && (
						<p className="algo-error">
							{t(lang, 'exercise.compileError')}: <code>{response.message}</code>
						</p>
					)}
					{response.kind === 'missing-entry' && (
						<p className="algo-error">
							{t(lang, 'exercise.missingEntry')} <code>{response.entry}</code>.
						</p>
					)}
					{response.kind === 'ok' && (
						<>
							<p className="algo-exercise__summary" data-pass={allPassed}>
								{allPassed ? t(lang, 'exercise.allPassed') : `${passed}/${exercise.tests.length} ${t(lang, 'exercise.passed')}`}
							</p>
							<ul className="algo-exercise__tests">
								{response.results.map((result, i) => {
									const test = exercise.tests[i];
									return (
										<li key={i} data-pass={result.pass}>
											<span className="algo-exercise__icon">{result.pass ? '✓' : '✗'}</span>
											{test.hidden ? (
												<span>
													{t(lang, 'exercise.hiddenTest')} #{i + 1}
												</span>
											) : (
												<code>
													{exercise.entry}({test.args.map((a) => format(a)).join(', ')})
												</code>
											)}
											{!result.pass && (
												<div className="algo-exercise__detail">
													{result.error ? (
														<code>{result.error}</code>
													) : result.reads !== undefined ? (
														<span>
															{lang === 'en'
																? `Read ${result.reads} elements, the limit is ${test.maxReads}. Is this really a binary search?`
																: `Leu ${result.reads} elementos, o limite é ${test.maxReads}. É mesmo uma busca binária?`}
														</span>
													) : test.hidden ? null : (
														<span>
															{t(lang, 'exercise.expected')} <code>{format(test.expected)}</code>, {t(lang, 'exercise.received')}{' '}
															<code>{result.received}</code>
														</span>
													)}
												</div>
											)}
										</li>
									);
								})}
							</ul>
						</>
					)}
					{'logs' in response && response.logs.length > 0 && (
						<details className="algo-exercise__console" open>
							<summary>{t(lang, 'exercise.console')}</summary>
							<pre>{response.logs.join('\n')}</pre>
						</details>
					)}
				</div>
			)}
		</div>
	);
}
