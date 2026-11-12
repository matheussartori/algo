import { createIslandScene } from '../../game/scenes/island';
import { createPondScene } from '../../game/scenes/pond';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type Beat, createDirector, type Playback, type Scene, toBeats } from '../../game/engine';
import { createStripScene } from '../../game/scenes/strip';
import type { SceneSetup } from '../../game/engine';
import type { SceneKind } from '../../exercises/types';
import { type Locale, type Msg, t } from '../../lib/i18n';
import { format } from '../../lib/runner/format';

/**
 * Illustrated worlds, one per SceneKind. A world missing here (or one that fails to start)
 * falls back to the strip, which carries the same information.
 */
const worlds: Partial<Record<SceneKind, (host: HTMLElement, setup: SceneSetup) => Scene>> = { island: createIslandScene, pond: createPondScene };

function createScene(kind: SceneKind, host: HTMLElement, setup: SceneSetup): Scene {
	const world = worlds[kind];
	if (world) {
		try {
			return world(host, setup);
		} catch {
			// no WebGL/WebGPU, a missing asset: the strip still tells the story
		}
	}
	return createStripScene(host, setup);
}

interface Props {
	lang: Locale;
	world: SceneKind;
	goal: Msg;
	/** The input the stage shows before any run (the first visible test). */
	idle: { slots: unknown[]; target: unknown };
	/** The latest run to act out; a new object restarts the scene. */
	playback: Playback | null;
}

/** How many slots fit on stage; longer arrays show the start and a "+n" cell. */
const MAX_SLOTS = 12;

export function Stage({ lang, world, goal, idle, playback }: Props) {
	const host = useRef<HTMLDivElement>(null);
	const director = useRef<ReturnType<typeof createDirector> | null>(null);
	const scene = useRef<Scene | null>(null);
	const [speed, setSpeed] = useState(1);
	const [line, setLine] = useState('');
	const [playing, setPlaying] = useState(false);
	const [take, setTake] = useState(0);

	const shown = playback ?? { ...idle, trace: [], returned: null, expected: null, pass: false, failed: false };
	const slots = useMemo(() => shown.slots.slice(0, MAX_SLOTS), [shown.slots]);

	useEffect(() => {
		if (!host.current) return;
		const built = createScene(world, host.current, { slots, target: shown.target, total: shown.slots.length, goal: goal[lang] });
		scene.current = built;
		built.setSpeed(speed);
		director.current = createDirector(built, (beat) => {
			const said = narrate(beat, lang, slots);
			if (said) setLine(said);
		});
		built.idle();
		if (playback) {
			const visible = { ...playback, slots };
			setPlaying(true);
			director.current.play(toBeats(visible, playback.slots.length)).finally(() => setPlaying(false));
		} else setLine('');
		return () => {
			director.current?.stop();
			built.destroy();
		};
	}, [playback, slots, take]);

	useEffect(() => scene.current?.setSpeed(speed), [speed]);

	// A replay rebuilds the scene, so the marks of the last take don't leak into the next one.
	const replay = () => setTake((n) => n + 1);
	const skip = () => {
		director.current?.stop();
		setPlaying(false);
		if (playback) setLine(verdict(playback, lang));
	};

	return (
		<div className="solve-stage">
			<div className="solve-stage__top">
				<p className="solve-stage__goal">{goal[lang]}</p>
				<div className="solve-stage__controls">
					<button type="button" className="algo-button algo-button--ghost algo-button--small" onClick={() => setSpeed(speed === 1 ? 2 : 1)} aria-label={t(lang, 'exercise.speed')}>
						{speed}×
					</button>
					{playing ? (
						<button type="button" className="algo-button algo-button--ghost algo-button--small" onClick={skip}>
							{t(lang, 'exercise.skip')}
						</button>
					) : (
						<button type="button" className="algo-button algo-button--ghost algo-button--small" onClick={replay} disabled={!playback}>
							{t(lang, 'exercise.replay')}
						</button>
					)}
				</div>
			</div>
			<div className="solve-stage__world" ref={host} />
			<p className="solve-stage__line" aria-live="polite">
				{line || (lang === 'en' ? 'Run your code and the scene follows what it does.' : 'Rode o código e a cena segue o que ele fizer.')}
			</p>
		</div>
	);
}

function narrate(beat: Beat, lang: Locale, slots: unknown[]): string | null {
	const pt = lang === 'pt-BR';
	switch (beat.type) {
		case 'move':
			return beat.i < 0 ? null : pt ? `Olhando a posição ${beat.i}…` : `Checking position ${beat.i}…`;
		case 'inspect':
			return pt ? `Posição ${beat.i}: ${format(slots[beat.i])}.` : `Position ${beat.i}: ${format(slots[beat.i])}.`;
		case 'found':
			return pt ? `Achou na posição ${beat.i}.` : `Found it at position ${beat.i}.`;
		case 'nothing':
			return pt ? `O código disse ${beat.i}, mas não é ali.` : `The code said ${beat.i}, but it isn't there.`;
		case 'outOfBounds':
			return pt ? `Leu a posição ${beat.i}, que não existe.` : `It read position ${beat.i}, which doesn't exist.`;
		case 'celebrate':
			return pt ? 'Certo.' : 'Right.';
		case 'frustrated':
			return pt ? 'Não era isso. Volta pro começo.' : 'Not that. Back to the start.';
		case 'confused':
			return pt ? 'O código parou antes de responder.' : 'The code stopped before answering.';
	}
}

function verdict(run: Playback, lang: Locale): string {
	const pt = lang === 'pt-BR';
	if (run.failed) return pt ? 'O código parou antes de responder.' : 'The code stopped before answering.';
	if (run.pass) return pt ? `Certo: ${format(run.returned)}.` : `Right: ${format(run.returned)}.`;
	return pt ? `Retornou ${format(run.returned)}, era ${format(run.expected)}.` : `Returned ${format(run.returned)}, expected ${format(run.expected)}.`;
}
