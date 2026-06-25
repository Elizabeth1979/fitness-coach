import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import type { Equipment, Segment, Workout } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00'); // movement day
const TUE = new Date('2026-06-23T08:00:00'); // strength day

function total(segs: Segment[]): number {
  return segs.reduce((s, seg) => s + seg.durationSec, 0);
}

// The ordered exercise ids of each round's circuit, taken from the round-tagged prepares.
function circuitByRound(w: Workout): string[][] {
  const byRound: Record<number, string[]> = {};
  for (const seg of w.segments) {
    if (seg.kind === 'prepare' && seg.round && seg.exercise) {
      (byRound[seg.round] ??= []).push(seg.exercise.id);
    }
  }
  return Object.keys(byRound).map(Number).sort((a, b) => a - b).map((k) => byRound[k]);
}

describe('generateWorkout', () => {
  it('is deterministic for the same inputs', () => {
    const a = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 99 });
    const b = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 99 });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('sets focus from the weekday', () => {
    expect(generateWorkout({ kind: '20min', date: TUE, equipment: ALL, seed: 1 }).focus).toBe('strength');
    expect(generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 1 }).focus).toBe('movement');
  });

  it('total duration stays within 45s of target across seeds and both focuses', () => {
    for (const [kind, target] of [['10min', 600], ['20min', 1200], ['30min', 1800]] as const) {
      for (const date of [WED, TUE]) {
        for (let seed = 0; seed < 24; seed++) {
          const w = generateWorkout({ kind, date, equipment: ALL, seed });
          expect(Math.abs(total(w.segments) - target)).toBeLessThanOrEqual(45);
        }
      }
    }
  });

  it('repeats the SAME circuit for the kind-appropriate number of rounds', () => {
    for (const [kind, expected] of [['10min', 2], ['20min', 3], ['30min', 5]] as const) {
      const w = generateWorkout({ kind, date: WED, equipment: ALL, seed: 4 });
      expect(w.rounds).toBe(expected);
      const byRound = circuitByRound(w);
      expect(byRound.length).toBe(expected);
      for (const r of byRound) expect(r).toEqual(byRound[0]); // identical every round
    }
  });

  it('places a round-rest between rounds (rounds - 1 of them), tagged by round', () => {
    const w = generateWorkout({ kind: '30min', date: TUE, equipment: ALL, seed: 4 });
    const roundRests = w.segments.filter((s) => s.kind === 'roundrest');
    expect(roundRests.length).toBe(w.rounds - 1);
    expect(roundRests.map((s) => s.round)).toEqual([1, 2, 3, 4]);
  });

  it('tags main segments with their round; leaves warm-up and celebrate untagged', () => {
    const w = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 4 });
    const tagged = w.segments.filter((s) => s.round !== undefined);
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.every((s) => s.round! >= 1 && s.round! <= w.rounds)).toBe(true);
    expect(w.segments.find((s) => s.kind === 'celebrate')!.round).toBeUndefined();
    expect(w.segments.find((s) => s.exercise?.category === 'warmup')!.round).toBeUndefined();
  });

  it('ends with a celebrate segment whose first cue lists categories', () => {
    const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed: 4 });
    const last = w.segments[w.segments.length - 1];
    expect(last.kind).toBe('celebrate');
    expect(last.cues[0].say?.toLowerCase()).toContain('push');
  });

  it('every work segment fires a start haptic at 0 and a countdown haptic before the end', () => {
    const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed: 4 });
    const work = w.segments.filter((s) => s.kind === 'work');
    expect(work.length).toBeGreaterThan(0);
    for (const seg of work) {
      expect(seg.cues.some((c) => c.atSec === 0 && c.haptic === 'start')).toBe(true);
      expect(seg.cues.some((c) => c.haptic === 'countdown')).toBe(true);
    }
  });

  it('splits unilateral exercises into left and right work segments', () => {
    const w = generateWorkout({ kind: '30min', date: TUE, equipment: ALL, seed: 4 });
    const sides = w.segments.filter((s) => s.side).map((s) => s.side);
    for (let i = 0; i < sides.length; i += 2) {
      expect(sides[i]).toBe('left');
      expect(sides[i + 1]).toBe('right');
    }
  });

  it('starts with a themed warm-up flow announced by the coach', () => {
    const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed: 4 });
    expect(w.warmupThemeId).toBeTruthy();
    const first = w.segments[0];
    expect(first.kind).toBe('work');
    expect(first.exercise?.category).toBe('warmup');
    expect(first.cues[0].say?.toLowerCase()).toContain("today's warm-up:");
  });

  it('keeps warm-up segments short (not stretched by the time budget)', () => {
    const w = generateWorkout({ kind: '30min', date: WED, equipment: ALL, seed: 4 });
    const warmup = w.segments.filter((s) => s.exercise?.category === 'warmup');
    expect(warmup.length).toBeGreaterThan(0);
    for (const s of warmup) expect([30, 120]).toContain(s.durationSec);
  });

  it('avoids a recent warm-up theme', () => {
    const themed = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 4 });
    const avoided = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 4, recentThemeIds: [themed.warmupThemeId!] });
    expect(avoided.warmupThemeId).not.toBe(themed.warmupThemeId);
  });
});
