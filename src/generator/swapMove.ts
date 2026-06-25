import type { Cue, Equipment, Segment, Workout } from '../domain/types';
import { candidatesFor } from './selectExercises';
import { pick } from './rng';
import { phrases } from '../coach/phrases';

export function swapMove(workout: Workout, prepareIndex: number, equipment: Equipment[], rng: () => number): Workout {
  const prep = workout.segments[prepareIndex];
  const current = prep?.exercise;
  if (!prep || prep.kind !== 'prepare' || !current) return workout;

  const pool = candidatesFor(current.category, equipment).filter((e) => e.id !== current.id);
  if (pool.length === 0) return workout;
  const next = pick(rng, pool);

  // Bound the retag to THIS move's work segments: stop at the next rest/prepare.
  const after = workout.segments.findIndex((s, i) => i > prepareIndex && (s.kind === 'rest' || s.kind === 'prepare'));
  const workEnd = after === -1 ? workout.segments.length : after;

  const segments: Segment[] = workout.segments.map((seg, i) => {
    if (i === prepareIndex) {
      const cues: Cue[] = [
        { atSec: 0, say: phrases.next(next.name), haptic: 'next' },
        { atSec: 1, say: phrases.count(3) },
        { atSec: 2, say: phrases.count(2) },
        { atSec: 3, say: phrases.count(1) },
      ];
      return { ...seg, exercise: next, cues };
    }
    if (i > prepareIndex && i < workEnd && seg.kind === 'work') {
      return { ...seg, exercise: next };
    }
    return seg;
  });

  return { ...workout, segments };
}
