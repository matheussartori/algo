import type { Msg } from './i18n';

export type Cell = number | string;

/** Snapshot of an array-based algorithm at one moment of its execution. */
export interface ArrayFrame {
	values: Cell[];
	/** Named pointers into the array, e.g. `{ low: 0, mid: 2, high: 5 }`. */
	pointers?: Record<string, number>;
	/** Index being examined in this step (what "predict" mode asks the learner for). */
	active?: number;
	/** Indexes already ruled out. */
	dimmed?: number[];
	/** Index where the target was found. */
	found?: number;
	/** Variables shown in the side panel. */
	vars?: Record<string, Cell | boolean | null>;
}

export interface Step {
	/** 1-based line of `AlgorithmDef.code` being executed. */
	line: number;
	frame: ArrayFrame;
	note: Msg;
}

/**
 * An algorithm is written once, as a generator that yields steps.
 * The player, the code highlighter, "predict" mode and the tests all read from it.
 */
export interface AlgorithmDef<Input> {
	id: string;
	/** Source shown to the learner. `Step.line` points into it. */
	code: string;
	steps: (input: Input) => Generator<Step, unknown>;
	/** Plain implementation, used to cross-check the traced one in tests. */
	run: (input: Input) => unknown;
}

export function collect<Input>(algo: AlgorithmDef<Input>, input: Input): Step[] {
	return [...algo.steps(input)];
}
