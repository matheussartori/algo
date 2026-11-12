import type { Msg } from '../lib/i18n';
import type { TestCase } from '../lib/runner/core';

/** Which stage plays the learner's run. Each kind is one small scene shared by many exercises. */
export type SceneKind = 'island' | 'pond';

export interface ExerciseDef {
	/** Stable id, also the URL (`/solve/<id>/`) and the storage key for the learner's code. */
	id: string;
	/** Docs slug of the lesson this exercise practices, without locale (`search/linear-search`). */
	lesson: string;
	/** Position in the lesson's ladder of five, 1 = easiest. */
	order: 1 | 2 | 3 | 4 | 5;
	title: Msg;
	/** The story: two to four sentences, at most ~60 words (see the algo-exercise skill). */
	story: Msg;
	/** The spec, separate from the story: input, output, the edge case. Inline markdown. */
	task: Msg;
	/** Shown under the task. `call` and `result` are code. */
	examples: { call: string; result: string; note?: Msg }[];
	/** One-paragraph recap of the lesson, for the "Lesson" tab of the solve screen. */
	recap: Msg;
	/** What the stage says while idle, in the character's voice. */
	goal: Msg;
	scene: SceneKind;
	/** Name of the function the learner must implement. */
	entry: string;
	/** TypeScript starter. The JavaScript one is derived from it. */
	starter: string;
	/** TypeScript reference solution. Tested in CI against `tests`. */
	solution: string;
	/** Visible tests run on Run; every test runs on Submit. */
	tests: TestCase[];
	/** Ordered from a gentle nudge to almost the answer. */
	hints: Msg[];
}
