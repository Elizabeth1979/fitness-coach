import type { Workout } from './types';

/** The workout's own length — everything after the intro (the intro is not part of the 10/20/30 minutes). */
export function trainingSec(workout: Workout): number {
  return workout.segments.reduce((a, s) => (s.kind === 'intro' ? a : a + s.durationSec), 0);
}

/** `trainingSec` in whole minutes, as shown and spoken ("20 minutes"). */
export const trainingMin = (workout: Workout): number => Math.round(trainingSec(workout) / 60);
