import { describe, it, expect } from 'vitest';
import { swapMove } from './swapMove';
import { generateWorkout } from './generateWorkout';
import { createRng } from './rng';
import type { Equipment } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];

describe('swapMove', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ALL, seed: 4 });
  // find the first main (non-warmup) prepare segment
  const prepIdx = w.segments.findIndex((s) => s.kind === 'prepare' && s.exercise && s.exercise.category !== 'warmup');
  const oldId = w.segments[prepIdx].exercise!.id;
  const oldCat = w.segments[prepIdx].exercise!.category;

  it('replaces that move with a different exercise of the same category', () => {
    const w2 = swapMove(w, prepIdx, ALL, createRng(1));
    expect(w2.segments[prepIdx].exercise!.id).not.toBe(oldId);
    expect(w2.segments[prepIdx].exercise!.category).toBe(oldCat);
  });
  it('keeps total duration unchanged (durations reused)', () => {
    const total = (x: typeof w) => x.segments.reduce((s, seg) => s + seg.durationSec, 0);
    expect(total(swapMove(w, prepIdx, ALL, createRng(2)))).toBe(total(w));
  });
  it('does not mutate the original workout', () => {
    const before = w.segments[prepIdx].exercise!.id;
    swapMove(w, prepIdx, ALL, createRng(3));
    expect(w.segments[prepIdx].exercise!.id).toBe(before);
  });
  it('swaps every occurrence of the slot across rounds (circuit repeats)', () => {
    const exA = { id: 'exA', name: 'A', category: 'push', equipment: ['bodyweight'], goals: ['strength'], unilateral: false, measure: 'reps', defaultReps: 8, cue: '' };
    const synthetic = { id: 't', kind: '20min', focus: 'movement', rounds: 2, segments: [
      { kind: 'prepare', exercise: exA, durationSec: 4, cues: [], round: 1 },
      { kind: 'work', exercise: exA, durationSec: 20, cues: [], round: 1 },
      { kind: 'rest', durationSec: 15, cues: [], round: 1 },
      { kind: 'prepare', exercise: exA, durationSec: 4, cues: [], round: 2 },
      { kind: 'work', exercise: exA, durationSec: 20, cues: [], round: 2 },
      { kind: 'rest', durationSec: 15, cues: [], round: 2 },
    ] } as unknown as import('../domain/types').Workout;
    const out = swapMove(synthetic, 0, ALL, createRng(1));
    expect(out.segments[1].exercise!.id).not.toBe('exA');                       // round 1 swapped
    expect(out.segments[4].exercise!.id).toBe(out.segments[1].exercise!.id);    // round 2 swapped to the SAME new exercise
    expect(out.segments[3].exercise!.id).toBe(out.segments[1].exercise!.id);    // round 2 prepare updated too
  });
});
