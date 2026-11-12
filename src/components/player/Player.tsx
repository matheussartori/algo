import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { algorithms } from '../../algorithms';
import { type Locale, t } from '../../lib/i18n';
import { collect, type Step } from '../../lib/trace';
import { ArrayView } from './ArrayView';
import { Icon } from './Icon';
import { Stage3D } from './Stage3D';

interface Props {
	algo: string;
	input: unknown;
	lang: Locale;
	/** Build-time highlighted code (Shiki), one `.line` span per source line. */
	codeHtml: string;
	/** Start in predict mode. */
	predict?: boolean;
	/** No 3D stage: for pages that already have a scene behind the player. */
	compact?: boolean;
}

const SPEEDS = [0.5, 1, 2] as const;
const BASE_DELAY_MS = 1100;

type Question = { answer: number | 'none' } | null;

/** What the learner must predict to go from step `i` to step `i + 1`, if anything. */
function questionFor(steps: Step[], i: number): Question {
	const next = steps[i + 1];
	if (!next) return null;
	const current = steps[i];
	if (next.frame.active !== undefined && next.frame.active !== current.frame.active) return { answer: next.frame.active };
	if (i + 1 === steps.length - 1 && next.frame.active === undefined && next.frame.found === undefined) return { answer: 'none' };
	return null;
}

export default function Player({ algo, input, lang, codeHtml, predict = false, compact = false }: Props) {
	const steps = useMemo(() => collect(algorithms[algo], input), [algo, input]);
	const [index, setIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
	const [mode, setMode] = useState<'watch' | 'predict'>(predict ? 'predict' : 'watch');
	const [feedback, setFeedback] = useState<{ kind: 'right' | 'wrong' | 'reveal'; picked?: number } | null>(null);
	const [score, setScore] = useState({ right: 0, total: 0 });
	const [misses, setMisses] = useState(0);
	const codeRef = useRef<HTMLDivElement>(null);
	const uid = useId();

	const step = steps[index];
	const atEnd = index === steps.length - 1;
	const question = mode === 'predict' ? questionFor(steps, index) : null;

	// Highlight the current line in the static Shiki markup.
	useEffect(() => {
		const lines = codeRef.current?.querySelectorAll<HTMLElement>('.line');
		lines?.forEach((line, i) => line.classList.toggle('is-current', i + 1 === step.line));
	}, [step.line]);

	useEffect(() => {
		if (!playing) return;
		if (atEnd) {
			setPlaying(false);
			return;
		}
		const timer = setTimeout(() => setIndex((i) => i + 1), BASE_DELAY_MS / speed);
		return () => clearTimeout(timer);
	}, [playing, index, atEnd, speed]);

	const go = (next: number) => {
		setIndex(Math.max(0, Math.min(steps.length - 1, next)));
		setFeedback(null);
		setMisses(0);
	};

	const switchMode = (next: 'watch' | 'predict') => {
		setMode(next);
		setPlaying(false);
		setScore({ right: 0, total: 0 });
		go(0);
	};

	const answer = (picked: number | 'none') => {
		if (!question) return;
		if (picked === question.answer) {
			if (misses === 0) setScore((s) => ({ right: s.right + 1, total: s.total + 1 }));
			setIndex((i) => i + 1);
			setFeedback({ kind: 'right' });
			setMisses(0);
			return;
		}
		const nextMisses = misses + 1;
		setMisses(nextMisses);
		if (nextMisses === 1) setScore((s) => ({ ...s, total: s.total + 1 }));
		if (nextMisses >= 2) {
			setIndex((i) => i + 1);
			setFeedback({ kind: 'reveal' });
			setMisses(0);
		} else {
			setFeedback({ kind: 'wrong', picked: typeof picked === 'number' ? picked : undefined });
		}
	};

	const marked =
		feedback?.kind === 'wrong' && feedback.picked !== undefined
			? { index: feedback.picked, kind: 'wrong' as const }
			: feedback?.kind === 'reveal' && step.frame.active !== undefined
				? { index: step.frame.active, kind: 'reveal' as const }
				: undefined;

	return (
		<div className={`algo-player not-content${compact ? ' algo-player--compact' : ''}`} data-mode={mode}>
			<div className="algo-player__toolbar">
				<div className="algo-segmented" role="tablist">
					{(['watch', 'predict'] as const).map((m) => (
						<button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}>
							{t(lang, m === 'watch' ? 'player.watch' : 'player.predict')}
						</button>
					))}
				</div>
				{mode === 'predict' && (
					<span className="algo-player__score">
						{t(lang, 'player.score')}: {score.right}/{score.total}
					</span>
				)}
				<span className="algo-player__counter">
					{t(lang, 'player.step')} {index + 1}/{steps.length}
				</span>
			</div>

			<div className="algo-player__stage">
				{!compact && <Stage3D frame={step.frame} />}
				<ArrayView frame={step.frame} uid={uid} onPick={question ? answer : undefined} marked={marked} />
				{question && (
					<div className="algo-player__prompt">
						<span>{t(lang, 'player.predictPrompt')}</span>
						<button type="button" className="algo-button algo-button--ghost algo-button--small" onClick={() => answer('none')}>
							{t(lang, 'player.predictNone')}
						</button>
					</div>
				)}
				{feedback && (
					<p className="algo-player__feedback" data-kind={feedback.kind} aria-live="polite">
						{t(lang, feedback.kind === 'right' ? 'player.predictRight' : feedback.kind === 'wrong' ? 'player.predictWrong' : 'player.predictReveal')}
					</p>
				)}
				<p className="algo-player__note" aria-live="polite">
					{step.note[lang]}
				</p>
			</div>

			<div className="algo-player__body">
				<div className="algo-player__code" ref={codeRef} dangerouslySetInnerHTML={{ __html: codeHtml }} />
				{step.frame.vars && (
					<dl className="algo-player__vars" aria-label={t(lang, 'player.variables')}>
						{Object.entries(step.frame.vars).map(([name, value]) => (
							<div key={name}>
								<dt>{name}</dt>
								<dd>{typeof value === 'string' ? JSON.stringify(value) : String(value)}</dd>
							</div>
						))}
					</dl>
				)}
			</div>

			<div className="algo-player__controls">
				<button type="button" className="algo-icon" onClick={() => go(0)} disabled={index === 0} aria-label={t(lang, 'player.first')}>
					<Icon name="first" />
				</button>
				<button type="button" className="algo-icon" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t(lang, 'player.prev')}>
					<Icon name="prev" />
				</button>
				{mode === 'watch' ? (
					<button
						type="button"
						className="algo-icon algo-icon--primary"
						onClick={() => (atEnd ? (go(0), setPlaying(true)) : setPlaying((p) => !p))}
						aria-label={t(lang, playing ? 'player.pause' : atEnd ? 'player.restart' : 'player.play')}
					>
						<Icon name={playing ? 'pause' : atEnd ? 'restart' : 'play'} />
					</button>
				) : null}
				<button
					type="button"
					className="algo-icon"
					onClick={() => go(index + 1)}
					disabled={atEnd || question !== null}
					aria-label={t(lang, 'player.next')}
				>
					<Icon name="next" />
				</button>
				{mode === 'watch' && (
					<>
						<input
							className="algo-player__scrub"
							type="range"
							min={0}
							max={steps.length - 1}
							value={index}
							onChange={(e) => go(Number(e.target.value))}
							aria-label={t(lang, 'player.step')}
						/>
						<label className="algo-player__speed">
							<span className="sr-only">{t(lang, 'player.speed')}</span>
							<select value={speed} onChange={(e) => setSpeed(Number(e.target.value) as (typeof SPEEDS)[number])}>
								{SPEEDS.map((s) => (
									<option key={s} value={s}>
										{s}×
									</option>
								))}
							</select>
						</label>
					</>
				)}
				{mode === 'predict' && atEnd && (
					<button type="button" className="algo-button algo-button--ghost" onClick={() => switchMode('predict')}>
						{t(lang, 'player.restart')}
					</button>
				)}
			</div>
		</div>
	);
}
