import type { Exercise } from '../domain/types';

// One tap after a workout — "Too easy / Just right / Too hard" — nudges the next
// ones by a level. The length is fixed (10/20/30 min), so harder means more reps
// in the same time and shorter rests between rounds/sets; easier means fewer
// reps. (Longer rests would squeeze the moves below their minimum in a long
// stations session, so easier never lengthens them.)

export type Feel = 'easy' | 'right' | 'hard';
export const MIN_LEVEL = -2;
export const MAX_LEVEL = 3;
const REPS_PER_LEVEL = 0.15;  // ±15% of the default rep target per level
const REST_PER_LEVEL = 5;     // seconds off each round/set rest per level above 0
// A round rest says "Round N complete… Next up: <move + how-to>" and later
// "Round N+1. Here we go." — 20s keeps the two from running into each other.
const MIN_REST_SEC = 20;

const clampLevel = (n: number): number => Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n));

/** The level after one tap. */
export function nextLevel(level: number, feel: Feel): number {
  return clampLevel(level + (feel === 'easy' ? 1 : feel === 'hard' ? -1 : 0));
}

/** The rep target at a level (rep-counted moves only; timed moves have none). */
export function repsFor(ex: Pick<Exercise, 'measure' | 'defaultReps'>, level: number): number | undefined {
  if (ex.measure !== 'reps' || !ex.defaultReps) return undefined;
  return Math.max(1, Math.round(ex.defaultReps * (1 + REPS_PER_LEVEL * clampLevel(level))));
}

/** A round/set rest at a level: shorter as it rises, never longer than the base. */
export function restFor(baseSec: number, level: number): number {
  return Math.max(MIN_REST_SEC, baseSec - REST_PER_LEVEL * Math.max(0, clampLevel(level)));
}
