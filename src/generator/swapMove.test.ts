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
});
