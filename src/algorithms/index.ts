import type { AlgorithmDef } from '../lib/trace';
import { binarySearch } from './search/binary-search';
import { linearSearch } from './search/linear-search';

// Inputs differ per algorithm; the player only forwards them.
export const algorithms: Record<string, AlgorithmDef<any>> = {
	[linearSearch.id]: linearSearch,
	[binarySearch.id]: binarySearch,
};

export type AlgorithmId = keyof typeof algorithms;
