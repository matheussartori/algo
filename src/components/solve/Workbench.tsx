import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Playback } from '../../game/engine';
import type { ExerciseDef } from '../../exercises/types';
import { type Locale, t, type UiKey } from '../../lib/i18n';
import { runInWorker } from '../../lib/runner/client';
import type { CodeLang, RunResponse, TestCase } from '../../lib/runner/core';
import { format } from '../../lib/runner/format';
import { CodeEditor } from '../exercise/CodeEditor';
import { Inline } from '../Inline';
import { Splitter } from './Splitter';
import { Stage } from './Stage';

interface Props {
	exercise: ExerciseDef;
	/** JavaScript versions, derived at build time so the page doesn't ship the transpiler. */
	js: { starter: string; solution: string };
	lang: Locale;
	lessonHref: string;
	next: { href: string; title: string } | null;
}

type LeftTab = 'problem' | 'lesson' | 'hints';
type BottomTab = 'tests' | 'console';
type MobileTab = 'problem' | 'code';
type Mode = 'run' | 'submit';

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

const LAYOUT_KEY = 'algo:solve:layout';
const DEFAULT_LAYOUT = { left: 38, stage: 42, bottom: 30, sceneOpen: true };

export default function Workbench({ exercise, js, lang, lessonHref, next }: Props) {
	const starters = useMemo(() => ({ ts: exercise.starter, js: js.starter }), [exercise.starter, js.starter]);
	const solutions = { ts: exercise.solution, js: js.solution };
	const key = (codeLang: CodeLang) => `algo:exercise:${exercise.id}:${codeLang}`;

	const [codeLang, setCodeLang] = useState<CodeLang>('ts');
	const [code, setCode] = useState(starters.ts);
	const [response, setResponse] = useState<RunResponse | null>(null);
	const [mode, setMode] = useState<Mode>('run');
	const [running, setRunning] = useState(false);
	const [runs, setRuns] = useState(0);
	const [solved, setSolved] = useState(false);
	const [hintsShown, setHintsShown] = useState(0);
	const [showSolution, setShowSolution] = useState(false);
	const [confirmReset, setConfirmReset] = useState(false);
	const [leftTab, setLeftTab] = useState<LeftTab>('problem');
	const [bottomTab, setBottomTab] = useState<BottomTab>('tests');
	const [mobileTab, setMobileTab] = useState<MobileTab>('problem');
	const [layout, setLayout] = useState(DEFAULT_LAYOUT);
	const [playback, setPlayback] = useState<Playback | null>(null);
	const resultsRef = useRef<HTMLDivElement>(null);

	// Restore saved code, language, layout and progress after hydration (never during SSR).
	useEffect(() => {
		const savedLang = storage.get('algo:lang') === 'js' ? 'js' : 'ts';
		setCodeLang(savedLang);
		setCode(storage.get(key(savedLang)) ?? starters[savedLang]);
		setSolved(storage.get(`algo:solved:${exercise.id}`) !== null);
		try {
			const saved = JSON.parse(storage.get(LAYOUT_KEY) ?? 'null');
			if (saved) setLayout({ ...DEFAULT_LAYOUT, ...saved });
		} catch {
			// a broken saved layout falls back to the default
		}
	}, []);

	const changeLayout = (patch: Partial<typeof DEFAULT_LAYOUT>) =>
		setLayout((current) => {
			const next = { ...current, ...patch };
			storage.set(LAYOUT_KEY, JSON.stringify(next));
			return next;
		});

	const changeCode = (value: string) => {
		setCode(value);
		setConfirmReset(false);
		storage.set(key(codeLang), value);
	};

	const changeLang = (value: CodeLang) => {
		if (value === codeLang) return;
		setCodeLang(value);
		storage.set('algo:lang', value);
		setCode(storage.get(key(value)) ?? starters[value]);
		setResponse(null);
	};

	const visibleTests = exercise.tests.filter((test) => !test.hidden);
	const ranTests: TestCase[] = mode === 'submit' ? exercise.tests : visibleTests;

	const run = useCallback(
		async (which: Mode) => {
			const tests = which === 'submit' ? exercise.tests : exercise.tests.filter((test) => !test.hidden);
			setRunning(true);
			setMode(which);
			setBottomTab('tests');
			setMobileTab('code');
			const result = await runInWorker({ code, lang: codeLang, entry: exercise.entry, tests });
			setResponse(result);
			setRuns((n) => n + 1);
			setRunning(false);
			setPlayback(toPlayback(result, tests));
			if (which === 'submit' && result.kind === 'ok' && result.results.every((r) => r.pass)) {
				storage.set(`algo:solved:${exercise.id}`, new Date().toISOString());
				setSolved(true);
			}
			resultsRef.current?.scrollTo({ top: 0 });
		},
		[code, codeLang, exercise],
	);

	// Cmd/Ctrl+Enter runs, Cmd/Ctrl+Shift+Enter submits, from anywhere on the page.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return;
			event.preventDefault();
			event.stopPropagation();
			run(event.shiftKey ? 'submit' : 'run');
		};
		window.addEventListener('keydown', onKey, { capture: true });
		return () => window.removeEventListener('keydown', onKey, { capture: true });
	}, [run]);

	const reset = () => {
		if (!confirmReset) return setConfirmReset(true);
		changeCode(starters[codeLang]);
		setResponse(null);
		setPlayback(null);
	};

	const passed = response?.kind === 'ok' ? response.results.filter((r) => r.pass).length : 0;
	const allPassed = response?.kind === 'ok' && passed === ranTests.length;
	const justSolved = allPassed && mode === 'submit';
	const idle = { slots: exercise.tests[0].args[0] as unknown[], target: exercise.tests[0].args[1] };

	const leftTabs: { id: LeftTab; label: string }[] = [
		{ id: 'problem', label: t(lang, 'exercise.problem') },
		{ id: 'lesson', label: t(lang, 'exercise.lesson') },
		{ id: 'hints', label: t(lang, 'exercise.hints') },
	];

	return (
		<div
			className="solve-workbench"
			data-mobile-tab={mobileTab}
			style={{ '--left': `${layout.left}%`, '--stage': `${layout.stage}%`, '--bottom': `${layout.bottom}%` } as React.CSSProperties}
		>
			<nav className="solve-mobile-tabs algo-segmented" role="tablist" aria-label={t(lang, 'exercise.problem')}>
				{(['problem', 'code'] as const).map((tab) => (
					<button key={tab} type="button" role="tab" aria-selected={mobileTab === tab} onClick={() => setMobileTab(tab)}>
						{t(lang, tab === 'problem' ? 'exercise.problem' : 'exercise.code')}
					</button>
				))}
			</nav>

			<section className="solve-pane solve-pane--left" id="solve-left" aria-label={t(lang, 'exercise.problem')}>
				<div className="solve-tabs" role="tablist">
					{leftTabs.map((tab) => (
						<button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-controls="solve-left-panel" aria-selected={leftTab === tab.id} onClick={() => setLeftTab(tab.id)}>
							{tab.label}
							{tab.id === 'hints' && hintsShown > 0 && <span className="solve-tabs__count">{hintsShown}</span>}
						</button>
					))}
				</div>
				<div className="solve-pane__scroll" id="solve-left-panel" role="tabpanel" aria-labelledby={`tab-${leftTab}`}>
					{leftTab === 'problem' && (
						<article className="solve-problem">
							<p className="solve-problem__kicker">
								{t(lang, 'exercise.exercise')} {exercise.order} {t(lang, 'exercise.of')} 5 · {t(lang, `exercise.difficulty${exercise.order}` as UiKey)}
								{solved && <span className="solve-badge">{t(lang, 'exercise.done')}</span>}
							</p>
							<h1>{exercise.title[lang]}</h1>
							<p className="solve-problem__story">
								<Inline text={exercise.story[lang]} />
							</p>
							<h2>{t(lang, 'exercise.task')}</h2>
							<p>
								<Inline text={exercise.task[lang]} />
							</p>
							<h2>{t(lang, 'exercise.examples')}</h2>
							<ul className="solve-examples">
								{exercise.examples.map((example) => (
									<li key={example.call}>
										<code>
											{example.call} <span className="solve-examples__arrow">→</span> {example.result}
										</code>
										{example.note && <span className="solve-examples__note">{example.note[lang]}</span>}
									</li>
								))}
							</ul>
						</article>
					)}
					{leftTab === 'lesson' && (
						<article className="solve-problem">
							<h2>{t(lang, 'exercise.lesson')}</h2>
							<p>
								<Inline text={exercise.recap[lang]} />
							</p>
							<a className="algo-button algo-button--ghost" href={lessonHref}>
								{t(lang, 'exercise.openLesson')}
							</a>
						</article>
					)}
					{leftTab === 'hints' && (
						<article className="solve-problem">
							<p className="solve-muted">{t(lang, 'exercise.noHints')}</p>
							{hintsShown > 0 && (
								<ol className="solve-hints">
									{exercise.hints.slice(0, hintsShown).map((hint, i) => (
										<li key={i}>
											<Inline text={hint[lang]} />
										</li>
									))}
								</ol>
							)}
							{hintsShown < exercise.hints.length ? (
								<button type="button" className="algo-button algo-button--ghost" onClick={() => setHintsShown((n) => n + 1)}>
									{t(lang, 'exercise.nextHint')} ({hintsShown + 1}/{exercise.hints.length})
								</button>
							) : (
								<p className="solve-muted">{t(lang, 'exercise.noMoreHints')}</p>
							)}
							<div className="solve-solution">
								<button
									type="button"
									className="algo-button algo-button--ghost"
									onClick={() => setShowSolution((s) => !s)}
									disabled={runs === 0}
									aria-describedby={runs === 0 ? 'solution-locked' : undefined}
								>
									{t(lang, showSolution ? 'exercise.hideSolution' : 'exercise.solution')}
								</button>
								{runs === 0 && (
									<p className="solve-muted" id="solution-locked">
										{t(lang, 'exercise.solutionLocked')}
									</p>
								)}
								{showSolution && (
									<>
										<p>{t(lang, 'exercise.solutionWarning')}</p>
										<pre>
											<code>{solutions[codeLang]}</code>
										</pre>
									</>
								)}
							</div>
						</article>
					)}
				</div>
			</section>

			<Splitter
				orientation="vertical"
				value={layout.left}
				min={24}
				max={60}
				onChange={(left) => changeLayout({ left })}
				controls="solve-left"
				label={t(lang, 'exercise.resizePanels')}
			/>

			<section className="solve-pane solve-pane--right" data-scene={layout.sceneOpen ? 'open' : 'closed'} aria-label={t(lang, 'exercise.code')}>
				{layout.sceneOpen && (
					<>
						<div className="solve-stage-slot" id="solve-stage">
							<Stage lang={lang} world={exercise.scene} goal={exercise.goal} idle={idle} playback={playback} />
						</div>
						<Splitter
							orientation="horizontal"
							value={layout.stage}
							min={22}
							max={60}
							onChange={(stage) => changeLayout({ stage })}
							controls="solve-stage"
							label={t(lang, 'exercise.resizePanels')}
						/>
					</>
				)}

				<div className="solve-editor">
					<div className="solve-toolbar">
						<div className="algo-segmented" role="tablist" aria-label={t(lang, 'exercise.code')}>
							{(['ts', 'js'] as const).map((l) => (
								<button key={l} type="button" role="tab" aria-selected={codeLang === l} onClick={() => changeLang(l)}>
									{l === 'ts' ? 'TypeScript' : 'JavaScript'}
								</button>
							))}
						</div>
						<div className="solve-toolbar__end">
							<button type="button" className="algo-button algo-button--ghost algo-button--small" onClick={() => changeLayout({ sceneOpen: !layout.sceneOpen })} aria-pressed={layout.sceneOpen}>
								{t(lang, layout.sceneOpen ? 'exercise.hideScene' : 'exercise.showScene')}
							</button>
							<button type="button" className="algo-button algo-button--ghost algo-button--small" data-confirm={confirmReset} onClick={reset} onBlur={() => setConfirmReset(false)}>
								{t(lang, confirmReset ? 'exercise.resetConfirm' : 'exercise.reset')}
							</button>
						</div>
					</div>
					<div className="solve-editor__code">
						<CodeEditor value={code} typescript={codeLang === 'ts'} onChange={changeCode} onRun={() => run('run')} label={exercise.entry} />
					</div>
				</div>

				<Splitter
					orientation="horizontal"
					value={100 - layout.bottom}
					min={40}
					max={85}
					onChange={(value) => changeLayout({ bottom: 100 - value })}
					controls="solve-results"
					label={t(lang, 'exercise.resizePanels')}
				/>

				<div className="solve-results" id="solve-results">
					<div className="solve-tabs" role="tablist">
						{(['tests', 'console'] as const).map((tab) => (
							<button key={tab} type="button" role="tab" aria-selected={bottomTab === tab} onClick={() => setBottomTab(tab)}>
								{t(lang, tab === 'tests' ? 'exercise.tests' : 'exercise.console')}
								{tab === 'tests' && response?.kind === 'ok' && (
									<span className="solve-tabs__count" data-pass={allPassed}>
										{passed}/{ranTests.length}
									</span>
								)}
								{tab === 'console' && response && 'logs' in response && response.logs.length > 0 && <span className="solve-tabs__count">{response.logs.length}</span>}
							</button>
						))}
					</div>
					<div className="solve-pane__scroll" ref={resultsRef} aria-live="polite">
						{bottomTab === 'tests' ? (
							<Results lang={lang} response={response} tests={ranTests} mode={mode} entry={exercise.entry} justSolved={justSolved} allPassed={allPassed} next={next} lessonHref={lessonHref} />
						) : response && 'logs' in response && response.logs.length > 0 ? (
							<pre className="solve-console">{response.logs.join('\n')}</pre>
						) : (
							<p className="solve-muted">{t(lang, 'exercise.consoleEmpty')}</p>
						)}
					</div>
					<div className="solve-actions">
						<p className="solve-actions__hint">{t(lang, 'exercise.runHint')}</p>
						<button type="button" className="algo-button algo-button--ghost" onClick={() => run('run')} disabled={running} title={t(lang, 'exercise.shortcutRun')}>
							{running && mode === 'run' ? t(lang, 'exercise.running') : t(lang, 'exercise.run')}
							<kbd>⌘↵</kbd>
						</button>
						<button type="button" className="algo-button" onClick={() => run('submit')} disabled={running} title={t(lang, 'exercise.shortcutSubmit')}>
							{running && mode === 'submit' ? t(lang, 'exercise.running') : t(lang, 'exercise.submit')}
							<kbd>⇧⌘↵</kbd>
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}

interface ResultsProps {
	lang: Locale;
	response: RunResponse | null;
	tests: TestCase[];
	mode: Mode;
	entry: string;
	justSolved: boolean;
	allPassed: boolean;
	next: Props['next'];
	lessonHref: string;
}

function Results({ lang, response, tests, mode, entry, justSolved, allPassed, next, lessonHref }: ResultsProps) {
	if (!response) return <p className="solve-muted">{t(lang, 'exercise.testsEmpty')}</p>;
	if (response.kind === 'timeout') return <p className="algo-error">{t(lang, 'exercise.timeout')}</p>;
	if (response.kind === 'compile-error')
		return (
			<p className="algo-error">
				{t(lang, 'exercise.compileError')}: <code>{response.message}</code>
			</p>
		);
	if (response.kind === 'missing-entry')
		return (
			<p className="algo-error">
				{t(lang, 'exercise.missingEntry')} <code>{response.entry}</code>.
			</p>
		);

	return (
		<>
			{justSolved ? (
				<div className="solve-win">
					<p className="solve-win__title">{t(lang, 'exercise.solved')}</p>
					<p>{t(lang, 'exercise.solvedAgain')}</p>
					<div className="solve-win__actions">
						{next && (
							<a className="algo-button" href={next.href}>
								{t(lang, 'exercise.next')}: {next.title}
							</a>
						)}
						<a className={next ? 'algo-button algo-button--ghost' : 'algo-button'} href={lessonHref}>
							{t(lang, 'exercise.backToLesson')}
						</a>
					</div>
				</div>
			) : (
				allPassed && mode === 'run' && <p className="solve-summary" data-pass="true">{t(lang, 'exercise.allPassedRun')}</p>
			)}
			<ul className="solve-tests">
				{response.results.map((result, i) => {
					const test = tests[i];
					return (
						<li key={i} data-pass={result.pass}>
							<span className="solve-tests__icon" aria-hidden="true">
								{result.pass ? '✓' : '✗'}
							</span>
							<span className="sr-only">{result.pass ? 'ok' : 'falhou'}</span>
							<div className="solve-tests__body">
								<span className="solve-tests__name">
									{test.name?.[lang] ?? `${t(lang, 'exercise.hiddenTest')} ${i + 1}`}
									{test.hidden && <span className="solve-tests__tag">{t(lang, 'exercise.hiddenTest')}</span>}
								</span>
								{(!test.hidden || !result.pass) && (
									<code className="solve-tests__call">
										{entry}({test.args.map((a) => clip(format(a))).join(', ')})
									</code>
								)}
								{!result.pass && (
									<div className="solve-tests__detail">
										{result.error ? (
											<code>{result.error}</code>
										) : result.reads !== undefined ? (
											<span>{t(lang, 'exercise.tooManyReads', { reads: result.reads, max: test.maxReads ?? 0 })}</span>
										) : (
											<dl className="solve-diff">
												<div>
													<dt>{t(lang, 'exercise.expected')}</dt>
													<dd>
														<code>{format(test.expected)}</code>
													</dd>
												</div>
												<div>
													<dt>{t(lang, 'exercise.received')}</dt>
													<dd>
														<code>{result.received}</code>
													</dd>
												</div>
											</dl>
										)}
									</div>
								)}
							</div>
						</li>
					);
				})}
			</ul>
		</>
	);
}

/** Long arrays (200 trees) would flood the row: keep the start and say how many more. */
function clip(text: string, max = 80): string {
	return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/** The stage acts out the first failing test, or the first test when everything passed. */
function toPlayback(response: RunResponse, tests: TestCase[]): Playback | null {
	const pick = (index: number, extra: Partial<Playback>): Playback => ({
		slots: Array.isArray(tests[index].args[0]) ? (tests[index].args[0] as unknown[]) : [],
		target: tests[index].args[1],
		trace: [],
		returned: null,
		expected: tests[index].expected,
		pass: false,
		failed: false,
		...extra,
	});
	if (response.kind !== 'ok') return pick(0, { failed: true });
	const failing = response.results.findIndex((r) => !r.pass);
	const index = failing === -1 ? 0 : failing;
	const result = response.results[index];
	const returned = Number(result.received);
	return pick(index, {
		trace: result.trace ?? [],
		returned: result.received !== undefined && Number.isFinite(returned) ? returned : null,
		pass: result.pass,
		failed: result.error !== undefined,
	});
}
