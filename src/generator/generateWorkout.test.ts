import { describe, it, expect } from 'vitest';
import { trainingSec } from '../domain/workout';
import { generateWorkout } from './generateWorkout';
import type { Equipment, Workout } from '../domain/types';
import { EXERCISES } from '../domain/exercises';
import { SLOTS_SHORT } from './selectExercises';
import { phrases } from '../coach/phrases';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00'); // movement day
const TUE = new Date('2026-06-23T08:00:00'); // strength day


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

  it('bodyweight only: never needs equipment, still pulls, and fits the time, in every length and style', () => {
    for (const [kind, target] of [['10min', 600], ['20min', 1200], ['30min', 1800]] as const) {
      for (const style of ['circuit', 'stations'] as const) {
        for (const date of [WED, TUE]) {
          for (let seed = 0; seed <= 40; seed++) {
            const w = generateWorkout({ kind, date, equipment: ['bodyweight'], seed, style });
            const label = `${kind} ${style} ${date.toISOString()} seed ${seed}`;
            expect(Math.abs(trainingSec(w) - target), label).toBeLessThanOrEqual(45);
            for (const seg of w.segments) {
              if (seg.exercise) expect(seg.exercise.equipment, `${label}: ${seg.exercise.id}`).toEqual(['bodyweight']);
            }
            expect(w.segments.some((seg) => seg.kind === 'work' && seg.exercise?.category === 'pull'), `${label}: has a pull`).toBe(true);
          }
        }
      }
    }
  });

  it('total duration stays within 45s of target across many seeds and both focuses', () => {
    for (const [kind, target] of [['10min', 600], ['20min', 1200], ['30min', 1800]] as const) {
      const maxSeed = kind === '10min' ? 400 : 60; // 10-min is the tightest budget — sweep it hard
      for (const date of [WED, TUE]) {
        for (let seed = 0; seed <= maxSeed; seed++) {
          const w = generateWorkout({ kind, date, equipment: ALL, seed });
          const got = trainingSec(w);
          expect(Math.abs(got - target), `${kind} ${date.toISOString()} seed ${seed} → ${got}s`).toBeLessThanOrEqual(45);
        }
      }
    }
  });

  it('repeats the SAME circuit for the kind-appropriate number of rounds', () => {
    for (const [kind, expected] of [['10min', 3], ['20min', 3], ['30min', 5]] as const) {
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

  // Elli (#15): "Deep Squat Hold, 37 seconds — weird". Leftover time is spread over the moves, and it
  // used to land to the second. Every move now gets a round number (a multiple of 5s); sides match.
  it('gives every move a round number of seconds (a multiple of 5), the same on both sides', () => {
    for (const kind of ['10min', '20min', '30min'] as const) {
      for (const style of ['circuit', 'stations'] as const) {
        for (const date of [WED, TUE]) {
          for (const [seed, level] of [[1, 0], [2, 0], [3, 1], [4, -2], [5, 3], [6, 0], [7, 0], [8, 2]]) {
            for (const equipment of [ALL, ['bodyweight'] as Equipment[]]) {
              const segs = generateWorkout({ kind, date, equipment, seed, style, level }).segments;
              segs.forEach((s, i) => {
                if (s.kind !== 'work') return;
                const where = `${kind}/${style}/seed${seed} ${s.exercise?.name} ${s.durationSec}s`;
                expect(s.durationSec % 5, where).toBe(0);
                if (s.side === 'right') expect(segs[i - 2].durationSec, where).toBe(s.durationSec);
              });
            }
          }
        }
      }
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

  it('starts with a themed warm-up flow right after the intro', () => {
    const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed: 4 });
    expect(w.warmupThemeId).toBeTruthy();
    const first = w.segments[1];
    expect(first.kind).toBe('work');
    expect(first.exercise?.category).toBe('warmup');
  });

  it('says how to do each warm-up move as it starts (the intro already did for the first)', () => {
    const w = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 4 });
    for (const s of w.segments.filter((x) => x.exercise?.category === 'warmup').slice(1)) {
      expect(s.cues[0].say).toContain(phrases.howTo(s.exercise!));
    }
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

  it('worst-case 10-min floor budget stays within 45s — guards against adding unilateral exercises', () => {
    // The 10-min budget is tightest when every work bout is clamped to the
    // MIN_WORK_SEC floor — which happens when circuit slots are unilateral
    // (each unilateral slot = 2 work units). This computes that worst case from
    // the LIBRARY: if a future change adds unilateral exercises to enough of the
    // short-circuit categories, `worstTotal` rises and this fails before a real
    // breach. Constants mirror generateWorkout.ts (10-min = 3 rounds over the
    // SLOTS_SHORT trio, strength = the larger round-rest, warm-up capped at 90s).
    const MIN_WORK_SEC = 15, PREPARE = 5, CHANGE_REST = 15, SWITCH = 10, ROUND_REST_STRENGTH = 35, CELEBRATE = 18, WARMUP_MAX_10MIN = 90;
    const rounds = 3;
    const items = SLOTS_SHORT.length; // short circuit width (3)
    const maxUnilateralSlots = SLOTS_SHORT.filter((cat) => {
      const cats = cat === 'carry' ? ['carry', 'crawl'] : [cat];
      return EXERCISES.some((e) => cats.includes(e.category) && e.unilateral);
    }).length;
    const units = items + maxUnilateralSlots; // each unilateral slot adds a 2nd work unit
    const floorWork = rounds * units * MIN_WORK_SEC;
    // changeover rest after the warm-up + between moves; the round-rest between rounds
    const fixed = WARMUP_MAX_10MIN + CHANGE_REST + CELEBRATE + (rounds - 1) * ROUND_REST_STRENGTH
      + rounds * (items * PREPARE + (items - 1) * CHANGE_REST)
      + rounds * maxUnilateralSlots * SWITCH; // switch-sides gap per one-sided move per round
    const worstTotal = floorWork + fixed;
    expect(worstTotal - 600).toBeLessThanOrEqual(45);
  });

  it('the 10-minute workout uses two-sided moves, so the core finisher always fits', () => {
    for (const sore of ['none', 'shoulders', 'back', 'legs'] as const) {
      for (const style of ['circuit', 'stations'] as const) {
        for (let seed = 0; seed < 25; seed++) {
          const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed, style, sore });
          const where = `${style}/${sore}/seed${seed}`;
          expect(w.segments.filter((s) => s.kind === 'work' && s.side).length, where).toBe(0);
          expect(w.segments.some((s) => s.block === 'core'), where).toBe(true);
        }
      }
    }
  });
});

