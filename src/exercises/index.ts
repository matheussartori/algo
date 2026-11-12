import { binarySearchExercises } from './binary-search';
import { linearSearchExercises } from './linear-search';
import type { ExerciseDef } from './types';

export const exercises: Record<string, ExerciseDef> = Object.fromEntries(
	[...linearSearchExercises, ...binarySearchExercises].map((exercise) => [exercise.id, exercise]),
);
