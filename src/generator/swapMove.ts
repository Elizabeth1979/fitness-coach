import type { Equipment, Exercise, Segment, Workout } from '../domain/types';
import { candidatesFor, maxOneSided } from './selectExercises';
import { pick } from './rng';
import { phrases } from '../coach/phrases';
import { MIN_WORK_SEC } from './generateWorkout';
import { SWITCH_SEC, annotateChangeovers, switchSegment, workCues } from './changeover';

// The circuit repeats every round, so a slot's exercise appears once per round
// (once per set in stations). Swapping replaces that exercise in EVERY bout.
//
// A bout is reshaped when the sidedness changes, so a "switch sides" step only
// ever sits between the two sides of a one-sided move:
//   one-sided → two-sided: left · switch · right merge into one bout (same total time)
//   two-sided → one-sided: one bout splits into left · switch · right
// Same sidedness keeps every duration and cue. Afterwards the rests are
// re-announced, so "Next up: …" names the new move.
export function swapMove(workout: Workout, prepareIndex: number, equipment: Equipment[], rng: () => number): Workout {
  const prep = workout.segments[prepareIndex];
  const current = prep?.exercise;
  if (!prep || prep.kind !== 'prepare' || !current) return workout;

  // Respect the day's one-sided budget (none in the 10-min session).
  const others = new Set(workout.segments
    .filter((s) => s.kind === 'work' && s.side && s.exercise && s.exercise.id !== current.id)
    .map((s) => s.exercise!.id));
  // A one-sided move needs room for two sides plus the switch in every bout.
  const roomForTwoSides = boutTotals(workout.segments, current.id)
    .every((t) => t >= SWITCH_SEC + 2 * MIN_WORK_SEC);
  const all = candidatesFor(current.category, equipment)
    .filter((e) => e.id !== current.id && (!e.unilateral || roomForTwoSides));
  const twoSided = all.filter((e) => !e.unilateral);
  const pool = others.size >= maxOneSided(workout.kind) && twoSided.length > 0 ? twoSided : all;
  if (pool.length === 0) return workout;
  const next = pick(rng, pool);
  const cheer = phrases.encouragementDeck(rng);

  const isBout = (s: Segment | undefined): boolean =>
    !!s && (s.kind === 'work' || s.kind === 'switch') && s.exercise?.id === current.id;

  const out: Segment[] = [];
  const segs = workout.segments;
  for (let i = 0; i < segs.length;) {
    const seg = segs[i];
    if (seg.kind === 'prepare' && seg.exercise?.id === current.id) { out.push({ ...seg, exercise: next }); i++; continue; }
    if (!isBout(seg)) { out.push(seg); i++; continue; }
    let j = i;
    while (isBout(segs[j])) j++; // one bout: a single work, or left · switch · right
    out.push(...reshape(segs.slice(i, j), next, cheer));
    i = j;
  }

  return { ...workout, segments: annotateChangeovers(out, workout.rounds) };
}

/** Total seconds of each bout (work, or left · switch · right) of one exercise. */
function boutTotals(segs: Segment[], id: string): number[] {
  const totals: number[] = [];
  let run = 0;
  for (const s of [...segs, undefined]) {
    if (s && (s.kind === 'work' || s.kind === 'switch') && s.exercise?.id === id) run += s.durationSec;
    else if (run > 0) { totals.push(run); run = 0; }
  }
  return totals;
}

function reshape(bout: Segment[], next: Exercise, cheer: () => string): Segment[] {
  const wasOneSided = bout.some((s) => s.kind === 'switch' || s.side !== undefined);
  if (wasOneSided === !!next.unilateral) return bout.map((s) => ({ ...s, exercise: next }));

  const { round, block } = bout[0];
  const total = bout.reduce((a, s) => a + s.durationSec, 0);
  const work = (durationSec: number, side?: 'left' | 'right'): Segment => ({
    kind: 'work', exercise: next, durationSec, round, cues: workCues(durationSec, cheer),
    ...(side ? { side } : {}), ...(block ? { block } : {}),
  });
  if (!next.unilateral) return [work(total)];
  const side = Math.max(MIN_WORK_SEC, Math.round((total - SWITCH_SEC) / 2));
  return [work(side, 'left'), switchSegment(next, round), work(side, 'right')];
}
