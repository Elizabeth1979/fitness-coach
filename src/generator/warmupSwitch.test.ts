import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import { WARMUP_FLOWS } from './warmupFlows';
import type { Equipment, Segment, Workout } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');

const total = (segs: Segment[]) => segs.reduce((s, x) => s + x.durationSec, 0);
const mainExercises = (w: Workout) =>
  w.segments.filter((s) => s.kind === 'prepare' && s.exercise).map((s) => s.exercise!.id);

describe('generateWorkout — forced warm-up theme', () => {
  it('uses the forced theme', () => {
    for (const f of WARMUP_FLOWS) {
      const w = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 3, warmupThemeId: f.id });
      expect(w.warmupThemeId).toBe(f.id);
      expect(w.segments[0].exercise?.category).toBe('warmup');
    }
  });

  it('keeps the SAME circuit when only the warm-up theme is forced', () => {
    const base = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 3 });
    const other = WARMUP_FLOWS.find((f) => f.id !== base.warmupThemeId)!.id;
    const forced = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 3, warmupThemeId: other });
    expect(forced.warmupThemeId).toBe(other);
    expect(mainExercises(forced)).toEqual(mainExercises(base)); // circuit unchanged
  });

  it('stays within 45s of target for every theme, kind and style', () => {
    for (const [kind, target] of [['10min', 600], ['20min', 1200], ['30min', 1800]] as const) {
      for (const style of ['circuit', 'stations'] as const) {
        for (const f of WARMUP_FLOWS) {
          const w = generateWorkout({ kind, date: WED, equipment: ALL, seed: 5, style, warmupThemeId: f.id });
          const got = total(w.segments);
          expect(Math.abs(got - target), `${kind}/${style}/${f.id} → ${got}s`).toBeLessThanOrEqual(45);
        }
      }
    }
  });
});
