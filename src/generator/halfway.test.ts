import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import { swapMove } from './swapMove';
import { createRng } from './rng';
import { WARMUP_FLOWS } from './warmupFlows';
import { EXERCISES, exerciseById } from '../domain/exercises';
import { phrases } from '../coach/phrases';
import type { Equipment, Exercise, Segment } from '../domain/types';

// Elli (#11): hip circles and leg swings never said to switch. A move done one side
// at a time, or round in circles, now has that in the library, and a move that isn't
// split into left · switch · right (the warm-up's fixed 30s moves) hears it halfway.

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');
const HALFWAY = [phrases.switchSides(), phrases.otherDirection()];

const halfwayCues = (s: Segment) => s.cues.filter((c) => c.say && HALFWAY.includes(c.say));
const expected = (ex: Exercise | undefined) =>
  ex?.unilateral ? phrases.switchSides() : ex?.bothDirections ? phrases.otherDirection() : undefined;

describe('moves that go two ways', () => {
  it('the library marks every move whose how-to says it goes one side, then the other, or round in circles', () => {
    for (const ex of EXERCISES) {
      if (/one leg, then the other|one side|each side/i.test(ex.cue)) expect(ex.unilateral, ex.name).toBe(true);
      if (/circle|rotation|each way|both directions/i.test(ex.cue)) expect(ex.unilateral || ex.bothDirections, ex.name).toBe(true);
    }
    expect(exerciseById('leg-swings')?.unilateral).toBe(true);
    expect(exerciseById('hip-circles')?.bothDirections).toBe(true);
  });

  it('every warm-up move that goes two ways says so about halfway (with a buzz), and nothing else does', () => {
    let heard = 0;
    for (const f of WARMUP_FLOWS) {
      const segs = generateWorkout({ kind: '30min', date: WED, equipment: ALL, seed: 2, warmupThemeId: f.id }).segments;
      for (const s of segs.filter((x) => x.kind === 'work' && x.exercise?.category === 'warmup')) {
        const want = expected(s.exercise);
        const got = halfwayCues(s);
        if (!want) { expect(got, s.exercise?.name).toEqual([]); continue; }
        expect(got.map((c) => c.say), s.exercise?.name).toEqual([want]);
        expect(Math.abs(got[0].atSec - s.durationSec / 2), s.exercise?.name).toBeLessThanOrEqual(5);
        expect(got[0].haptic).toBe('next');
        heard++;
      }
    }
    expect(heard).toBeGreaterThanOrEqual(3); // hip circles, leg swings, arm circles, …
  });

  it('a main move split into left · switch · right gets no extra halfway line', () => {
    for (const style of ['circuit', 'stations'] as const) {
      for (let seed = 1; seed <= 8; seed++) {
        for (const s of generateWorkout({ kind: '30min', date: WED, equipment: ALL, seed, style }).segments) {
          if (s.side) expect(halfwayCues(s), s.exercise?.name).toEqual([]);
        }
      }
    }
  });

  it('a swap re-does the halfway line for the new move (never keeps the old one)', () => {
    for (let seed = 0; seed < 25; seed++) {
      const w = generateWorkout({ kind: '30min', date: WED, equipment: ALL, seed });
      w.segments.forEach((seg, idx) => {
        if (seg.kind !== 'prepare' || seg.round !== 1) return;
        for (const s of swapMove(w, idx, ALL, createRng(seed)).segments) {
          if (s.kind !== 'work' || s.side) continue;
          const want = expected(s.exercise);
          expect(halfwayCues(s).map((c) => c.say).filter((x) => x !== want), s.exercise?.name).toEqual([]);
        }
      });
    }
  });
});
