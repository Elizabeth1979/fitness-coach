import type { Equipment, Segment, Workout } from '../domain/types';
import { candidatesFor } from './selectExercises';
import { pick } from './rng';
import { annotateChangeovers } from './changeover';

// The circuit repeats every round, so a slot's exercise appears once per round.
// Swapping replaces that exercise in EVERY round (matched by id), reusing each
// segment's own duration so the total time is unaffected. The rests are then
// re-announced, so "Next up: …" names the new move rather than the old one.
export function swapMove(workout: Workout, prepareIndex: number, equipment: Equipment[], rng: () => number): Workout {
  const prep = workout.segments[prepareIndex];
  const current = prep?.exercise;
  if (!prep || prep.kind !== 'prepare' || !current) return workout;

  const pool = candidatesFor(current.category, equipment).filter((e) => e.id !== current.id);
  if (pool.length === 0) return workout;
  const next = pick(rng, pool);
  const currentId = current.id;

  const segments: Segment[] = workout.segments.map((seg) =>
    (seg.kind === 'prepare' || seg.kind === 'work') && seg.exercise?.id === currentId
      ? { ...seg, exercise: next }
      : seg,
  );

  return { ...workout, segments: annotateChangeovers(segments, workout.rounds) };
}
