import type { Msg } from '../lib/i18n';
import type { TestCase } from '../lib/runner/core';

export interface ExerciseDef {
	/** Stable id, also used as the storage key for the learner's code. */
	id: string;
	/** Name of the function the learner must implement. */
	entry: string;
	/** TypeScript starter. The JavaScript one is derived from it. */
	starter: string;
	/** TypeScript reference solution. Tested in CI against `tests`. */
	solution: string;
	tests: TestCase[];
	/** Ordered from a gentle nudge to almost the answer. */
	hints: Msg[];
}
