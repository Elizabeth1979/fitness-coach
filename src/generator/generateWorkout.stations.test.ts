import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import type { Equipment, Segment, Workout } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00'); // movement day
const TUE = new Date('2026-06-23T08:00:00'); // strength day

function total(segs: Segment[]): number {
  return segs.reduce((s, seg) => s + seg.durationSec, 0);
}

// The ordered exercise ids of the main (non-warmup) prepares — one per station.
function stationOrder(w: Workout): string[] {
  return w.segments
    .filter((s) => s.kind === 'prepare' && s.exercise)
    .map((s) => s.exercise!.id);
}

describe('generateWorkout — station style', () => {
  it('is deterministic and tags the workout style', () => {
    const a = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 7, style: 'stations' });
    const b = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 7, style: 'stations' });
    expect(a.style).toBe('stations');
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('groups all sets of one exercise before the next (one prepare per station)', () => {
    const w = generateWorkout({ kind: '30min', date: WED, equipment: ALL, seed: 4, style: 'stations' });
    const order = stationOrder(w);
    // One prepare per station: no exercise id repeats, and there are as many
    // prepares as there are distinct main exercises (the circuit width).
    expect(new Set(order).size).toBe(order.length);
    // Within the workout, all work segments for a station are contiguous (same id
    // run), proving sets are grouped rather than interleaved round-robin.
    const workIds = w.segments.filter((s) => s.kind === 'work' && s.exercise && s.exercise.category !== 'warmup' && s.block !== 'core').map((s) => s.exercise!.id);
    const runs: string[] = [];
    for (const id of workIds) if (runs[runs.length - 1] !== id) runs.push(id);
    expect(runs).toEqual(order); // each id appears in exactly one contiguous run
  });

  it('does each exercise `rounds` times as sets, tagged 1..rounds, no round-rest', () => {
    const w = generateWorkout({ kind: '30min', date: TUE, equipment: ALL, seed: 4, style: 'stations' });
    expect(w.segments.some((s) => s.kind === 'roundrest')).toBe(false); // stations recover via set-rests
    // Pick the first station's exercise and count its work-set tags.
    const firstId = stationOrder(w)[0];
    const sets = new Set(
      w.segments.filter((s) => s.kind === 'work' && s.exercise?.id === firstId).map((s) => s.round),
    );
    expect([...sets].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([1, 2, 3, 4, 5]);
  });

  it('total duration stays within 45s of target across seeds and both focuses', () => {
    for (const [kind, target] of [['10min', 600], ['20min', 1200], ['30min', 1800]] as const) {
      for (const date of [WED, TUE]) {
        for (let seed = 0; seed <= 60; seed++) {
          const w = generateWorkout({ kind, date, equipment: ALL, seed, style: 'stations' });
          const got = total(w.segments);
          expect(Math.abs(got - target), `${kind} ${date.toISOString()} seed ${seed} → ${got}s`).toBeLessThanOrEqual(45);
        }
      }
    }
  });

  it('still opens with a warm-up flow and ends with celebrate', () => {
    const w = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 4, style: 'stations' });
    expect(w.segments[0].exercise?.category).toBe('warmup');
    expect(w.segments[w.segments.length - 1].kind).toBe('celebrate');
  });
});
