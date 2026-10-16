import { describe, it, expect } from 'vitest';
import { swapMove } from './swapMove';
import { generateWorkout } from './generateWorkout';
import { createRng } from './rng';
import type { Equipment, Workout } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');

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

  describe('one-sided and two-sided moves', () => {
    const total = (x: Workout) => x.segments.reduce((a, seg) => a + seg.durationSec, 0);
    // Invariant: a switch-sides step only ever sits between the left and right of a one-sided move.
    const switchesAreValid = (x: Workout) => x.segments.every((seg, i) =>
      seg.kind !== 'switch' || (seg.exercise?.unilateral === true
        && x.segments[i - 1]?.side === 'left' && x.segments[i + 1]?.side === 'right'
        && x.segments[i - 1]?.exercise?.id === seg.exercise.id && x.segments[i + 1]?.exercise?.id === seg.exercise.id));
    const oneSided = (x: Workout, id: string) => x.segments.filter((seg) => seg.exercise?.id === id && seg.kind === 'work');

    it('swapping a one-sided move for a two-sided one merges the sides (same total time)', () => {
      let tried = 0;
      for (let seed = 0; seed < 30; seed++) {
        const w = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed });
        const idx = w.segments.findIndex((seg) => seg.kind === 'prepare' && seg.exercise?.unilateral);
        if (idx < 0) continue;
        for (let r = 0; r < 6; r++) {
          const out = swapMove(w, idx, ALL, createRng(r));
          const ex = out.segments[idx].exercise!;
          if (ex.unilateral) continue;
          tried++;
          expect(switchesAreValid(out)).toBe(true);
          expect(oneSided(out, ex.id).every((seg) => seg.side === undefined)).toBe(true);
          expect(total(out)).toBe(total(w));
        }
      }
      expect(tried).toBeGreaterThan(0);
    });

    it('never swaps in a one-sided move when a bout has no room for two sides plus the switch', () => {
      for (const kind of ['20min', '30min'] as const) {
        for (let seed = 0; seed < 15; seed++) {
          const w = generateWorkout({ kind, date: WED, equipment: ALL, seed });
          w.segments.forEach((seg, idx) => {
            if (seg.kind !== 'prepare' || seg.round !== 1 || !seg.exercise || seg.exercise.unilateral) return;
            const bouts = w.segments.filter((x) => x.kind === 'work' && x.exercise?.id === seg.exercise!.id);
            if (bouts.every((b) => b.durationSec >= 40)) return; // room — covered below
            for (let r = 0; r < 4; r++) {
              const out = swapMove(w, idx, ALL, createRng(r));
              expect(out.segments[idx].exercise!.unilateral, `${kind}/seed${seed} ${seg.exercise.name}`).toBeFalsy();
              expect(switchesAreValid(out)).toBe(true);
            }
          });
        }
      }
    });

    it('with room, a two-sided move swapped for a one-sided one splits: left, switch sides, right (same time)', () => {
      const W = (id: string) => ({ id, name: id, category: 'legs', equipment: ['bodyweight'], goals: ['strength'], unilateral: false, measure: 'time', defaultDurationSec: 60, cue: '' });
      const sq = W('bw-squat');
      const synthetic = { id: 't', kind: '30min', focus: 'movement', rounds: 2, segments: [
        { kind: 'prepare', exercise: sq, durationSec: 5, cues: [], round: 1 },
        { kind: 'work', exercise: sq, durationSec: 60, cues: [], round: 1 },
        { kind: 'rest', durationSec: 15, cues: [], round: 1 },
        { kind: 'prepare', exercise: sq, durationSec: 5, cues: [], round: 2 },
        { kind: 'work', exercise: sq, durationSec: 60, cues: [], round: 2 },
      ] } as unknown as Workout;
      let split = 0;
      for (let r = 0; r < 20; r++) {
        const out = swapMove(synthetic, 0, ['bodyweight'], createRng(r));
        if (!out.segments[0].exercise!.unilateral) continue;
        split++;
        expect(out.segments.map((x) => x.side ?? x.kind)).toEqual(['prepare', 'left', 'switch', 'right', 'rest', 'prepare', 'left', 'switch', 'right']);
        expect(switchesAreValid(out)).toBe(true);
        expect(total(out)).toBe(total(synthetic));
      }
      expect(split).toBeGreaterThan(0);
    });

    it('in the 10-minute workout, a swap stays two-sided', () => {
      for (let seed = 0; seed < 20; seed++) {
        const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed });
        w.segments.forEach((seg, idx) => {
          if (seg.kind !== 'prepare' || !seg.exercise || seg.round !== 1) return;
          const out = swapMove(w, idx, ALL, createRng(seed));
          expect(out.segments[idx].exercise!.unilateral, `seed ${seed} ${seg.exercise.name}`).toBeFalsy();
        });
      }
    });
  });
});

