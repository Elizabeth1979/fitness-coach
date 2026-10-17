import { describe, it, expect } from 'vitest';
import { generateWorkout, TARGET_SECONDS } from './generateWorkout';
import { swapMove } from './swapMove';
import { createRng } from './rng';
import { nextLevel, repsFor, MIN_LEVEL, MAX_LEVEL } from './effort';
import { trainingSec } from '../domain/workout';
import { EXERCISES } from '../domain/exercises';
import type { Equipment, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';

// One tap after a workout ("Too easy / Just right / Too hard") nudges the next
// ones. The length is fixed, so harder = more reps in the same time + shorter
// rests between rounds/sets; easier = fewer reps (rests stay as they are).

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');
const build = (level: number, kind: Exclude<WorkoutKind, 'free'> = '20min', style: WorkoutStyle = 'circuit') =>
  generateWorkout({ kind, date: WED, equipment: ALL, seed: 4, style, level });
const repsOf = (w: Workout) => w.segments.filter((s) => s.kind === 'work' && s.reps !== undefined && !s.block).map((s) => s.reps!);
const rests = (w: Workout) => w.segments.filter((s) => s.kind === 'roundrest').map((s) => s.durationSec);
const pushUp = EXERCISES.find((e) => e.measure === 'reps' && (e.defaultReps ?? 0) >= 8)!;

describe('effort level', () => {
  it('moves one step per tap, within bounds', () => {
    expect(nextLevel(0, 'easy')).toBe(1);
    expect(nextLevel(0, 'right')).toBe(0);
    expect(nextLevel(0, 'hard')).toBe(-1);
    expect(nextLevel(MAX_LEVEL, 'easy')).toBe(MAX_LEVEL);
    expect(nextLevel(MIN_LEVEL, 'hard')).toBe(MIN_LEVEL);
  });

  it('scales a rep target, and leaves timed moves alone', () => {
    expect(repsFor(pushUp, 0)).toBe(pushUp.defaultReps);
    expect(repsFor(pushUp, 2)!).toBeGreaterThan(pushUp.defaultReps!);
    expect(repsFor(pushUp, -2)!).toBeLessThan(pushUp.defaultReps!);
    expect(repsFor(EXERCISES.find((e) => e.measure === 'time')!, 2)).toBeUndefined();
  });

  it('harder: more reps and shorter round rests; easier: fewer reps, same rests', () => {
    const [easy, normal, hard] = [build(-2), build(0), build(3)];
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(sum(repsOf(hard))).toBeGreaterThan(sum(repsOf(normal)));
    expect(sum(repsOf(easy))).toBeLessThan(sum(repsOf(normal)));
    expect(Math.max(...rests(hard))).toBeLessThan(Math.min(...rests(normal)));
    expect(rests(easy)).toEqual(rests(normal));
    expect(hard.level).toBe(3);
  });

  it('keeps every length on time at every level', () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level++) {
      for (const kind of ['10min', '20min', '30min'] as const) {
        for (const style of ['circuit', 'stations'] as const) {
          const w = build(level, kind, style);
          expect(Math.abs(trainingSec(w) - TARGET_SECONDS[kind]), `${kind}/${style}/level ${level}`).toBeLessThanOrEqual(45);
        }
      }
    }
  });

  it('a swapped-in move gets its rep target at the same level', () => {
    const w = build(3);
    const prep = w.segments.findIndex((s) => s.kind === 'prepare' && s.round === 1);
    for (let r = 0; r < 10; r++) {
      const w2 = swapMove(w, prep, ALL, createRng(r));
      const work = w2.segments[prep + 1];
      expect(work.reps).toBe(repsFor(work.exercise!, 3));
    }
  });
});
