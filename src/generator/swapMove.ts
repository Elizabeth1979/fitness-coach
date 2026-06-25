import type { Cue, Equipment, Segment, Workout } from '../domain/types';
import { candidatesFor } from './selectExercises';
import { pick } from './rng';
import { phrases } from '../coach/phrases';

// The circuit repeats every round, so a slot's exercise appears once per round.
// Swapping replaces that exercise in EVERY round (matched by id), reusing each
// segment's own duration so the total time is unaffected.
export function swapMove(workout: Workout, prepareIndex: number, equipment: Equipment[], rng: () => number): Workout {
  const prep = workout.segments[prepareIndex];
  const current = prep?.exercise;
  if (!prep || prep.kind !== 'prepare' || !current) return workout;

  const pool = candidatesFor(current.category, equipment).filter((e) => e.id !== current.id);
  if (pool.length === 0) return workout;
  const next = pick(rng, pool);
  const currentId = current.id;

  const segments: Segment[] = workout.segments.map((seg) => {
    if (seg.kind === 'prepare' && seg.exercise?.id === currentId) {
      const cues: Cue[] = [
        { atSec: 0, say: phrases.next(next.name), haptic: 'next' },
        { atSec: 1, say: phrases.count(3) },
        { atSec: 2, say: phrases.count(2) },
        { atSec: 3, say: phrases.count(1) },
      ];
      return { ...seg, exercise: next, cues };
    }
    if (seg.kind === 'work' && seg.exercise?.id === currentId) {
      return { ...seg, exercise: next };
    }
    return seg;
  });

  return { ...workout, segments };
}
