import { binarySearchExercises } from './binary-search';
import { linearSearchExercises } from './linear-search';
import type { ExerciseDef } from './types';

export const exerciseList: ExerciseDef[] = [...linearSearchExercises, ...binarySearchExercises];

export const exercises: Record<string, ExerciseDef> = Object.fromEntries(exerciseList.map((exercise) => [exercise.id, exercise]));

/** Every lesson has a ladder of five exercises; slots without one yet are `null`. */
export function ladder(lesson: string): (ExerciseDef | null)[] {
	const own = exerciseList.filter((e) => e.lesson === lesson);
	return [1, 2, 3, 4, 5].map((order) => own.find((e) => e.order === order) ?? null);
}

export function solveHref(id: string, lang: 'pt-BR' | 'en'): string {
	return `${lang === 'en' ? '/en' : ''}/solve/${id}/`;
}

export function lessonHref(lesson: string, lang: 'pt-BR' | 'en'): string {
	return `${lang === 'en' ? '/en' : ''}/${lesson}/`;
}
