/**
 * The stage engine. The runner records which indexes of the input array the learner's code
 * read and what it returned; `toBeats` turns that into a short script and the director plays
 * it on any Scene. Scenes only draw: one scene per world (island, pond…), shared by every
 * exercise set in that world, and every scene gets the same beats.
 */

export interface SceneSetup {
	/** The values on stage (branches per tree, numbers on the lily pads…). */
	slots: unknown[];
	target: unknown;
	/** How many slots exist in total when `slots` was trimmed for display. */
	total: number;
	/** What the character is after, already localized ("Mapa: árvore de 5 galhos"). */
	goal?: string;
}

export interface Scene {
	idle(): void;
	/** Move to slot `i`; `-1` is home. */
	moveTo(i: number): Promise<void>;
	/** Look at slot `i` (dig, peek, knock). */
	inspect(i: number, isTarget: boolean): Promise<void>;
	/** The code answered `i` and it is right. */
	found(i: number): Promise<void>;
	/** The code answered `i` and there is nothing there. */
	nothing(i: number): Promise<void>;
	celebrate(): Promise<void>;
	frustrated(): Promise<void>;
	/** The code crashed, timed out or did not compile. */
	confused(): Promise<void>;
	/** The code read past the end of the array. */
	outOfBounds(i: number): Promise<void>;
	setSpeed(speed: number): void;
	destroy(): void;
}

export type Beat =
	| { type: 'move'; i: number }
	| { type: 'inspect'; i: number; isTarget: boolean }
	| { type: 'found'; i: number }
	| { type: 'nothing'; i: number }
	| { type: 'outOfBounds'; i: number }
	| { type: 'celebrate' }
	| { type: 'frustrated' }
	| { type: 'confused' };

export interface Playback {
	slots: unknown[];
	target: unknown;
	/** Indexes the code read, in order. */
	trace: number[];
	/** What the code returned, when it returned a number. */
	returned: number | null;
	expected: unknown;
	pass: boolean;
	/** Crash, timeout or compile error: nothing ran to the end. */
	failed: boolean;
}

/** Long runs are cut: the scene shows the first visits and the last ones. */
export const MAX_VISITS = 24;

/**
 * `total` is the real length when `run.slots` was trimmed for display: reads past the shown
 * slots but inside the array happen off stage, only reads past `total` fall off the edge.
 */
export function toBeats(run: Playback, total = run.slots.length): Beat[] {
	const beats: Beat[] = [];
	let trace = run.trace;
	if (trace.length > MAX_VISITS) trace = [...trace.slice(0, MAX_VISITS - 6), ...trace.slice(-6)];
	for (const i of trace) {
		if (i >= total || i < 0) {
			beats.push({ type: 'outOfBounds', i });
			continue;
		}
		if (i >= run.slots.length) continue;
		beats.push({ type: 'move', i });
		beats.push({ type: 'inspect', i, isTarget: Object.is(run.slots[i], run.target) });
	}
	if (run.failed) {
		beats.push({ type: 'confused' });
		beats.push({ type: 'move', i: -1 });
		return beats;
	}
	const answer = run.returned;
	const inRange = answer !== null && answer >= 0 && answer < run.slots.length;
	if (run.pass) {
		if (inRange) {
			if (trace[trace.length - 1] !== answer) beats.push({ type: 'move', i: answer });
			beats.push({ type: 'found', i: answer });
		}
		beats.push({ type: 'celebrate' });
		return beats;
	}
	if (inRange) {
		beats.push({ type: 'move', i: answer });
		beats.push({ type: 'nothing', i: answer });
	}
	beats.push({ type: 'frustrated' });
	beats.push({ type: 'move', i: -1 });
	return beats;
}

/** One line per beat, for the screen-reader log and the reduced-motion view. */
export type Narrate = (beat: Beat) => string | null;

export function createDirector(scene: Scene, onBeat?: (beat: Beat, index: number) => void) {
	let token = 0;
	return {
		async play(beats: Beat[]) {
			const mine = ++token;
			await scene.moveTo(-1);
			for (const [index, beat] of beats.entries()) {
				if (mine !== token) return;
				onBeat?.(beat, index);
				switch (beat.type) {
					case 'move': await scene.moveTo(beat.i); break;
					case 'inspect': await scene.inspect(beat.i, beat.isTarget); break;
					case 'found': await scene.found(beat.i); break;
					case 'nothing': await scene.nothing(beat.i); break;
					case 'outOfBounds': await scene.outOfBounds(beat.i); break;
					case 'celebrate': await scene.celebrate(); break;
					case 'frustrated': await scene.frustrated(); break;
					case 'confused': await scene.confused(); break;
				}
			}
			if (mine === token) scene.idle();
		},
		/** Cancels a playback in progress (a new run, or "skip"). */
		stop() {
			token++;
			scene.idle();
		},
	};
}
