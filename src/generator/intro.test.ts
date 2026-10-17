import { describe, it, expect } from 'vitest';
import { generateWorkout, TARGET_SECONDS } from './generateWorkout';
import { swapMove } from './swapMove';
import { createRng } from './rng';
import { WARMUP_FLOWS } from './warmupFlows';
import { phrases } from '../coach/phrases';
import { trainingSec } from '../domain/workout';
import type { Equipment, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';

// Before the clock starts, the coach says what's waiting (warm-up, the moves,
// the finisher) and what comes first, then counts in. That time is not part of
// the 10/20/30 minutes.

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');
const COUNTS = [phrases.count(3), phrases.count(2), phrases.count(1)];
const build = (kind: Exclude<WorkoutKind, 'free'>, style: WorkoutStyle, seed = 4): Workout =>
  generateWorkout({ kind, date: WED, equipment: ALL, seed, style });
const spoken = (w: Workout) => w.segments[0].cues.map((c) => c.say ?? '').join(' ');
const mainMoves = (w: Workout) => w.segments
  .filter((s) => s.kind === 'prepare' && s.round === 1 && s.block !== 'core')
  .map((s) => s.exercise!.name);

describe('workout intro', () => {
  const variants: [Exclude<WorkoutKind, 'free'>, WorkoutStyle][] = [
    ['10min', 'circuit'], ['20min', 'circuit'], ['30min', 'circuit'], ['20min', 'stations'],
  ];

  it('comes first, and only once', () => {
    for (const [kind, style] of variants) {
      const w = build(kind, style);
      expect(w.segments[0].kind).toBe('intro');
      expect(w.segments.filter((s) => s.kind === 'intro')).toHaveLength(1);
    }
  });

  it('announces the warm-up, every main move and the finisher', () => {
    for (const [kind, style] of variants) {
      const w = build(kind, style);
      const say = spoken(w);
      expect(say).toContain('Elli');
      expect(say).toContain(WARMUP_FLOWS.find((f) => f.id === w.warmupThemeId)!.name);
      for (const name of mainMoves(w)) expect(say).toContain(name);
      expect(say.toLowerCase()).toContain('core');
    }
  });

  it('names the first exercise and how to do it, which then starts with just "Go!"', () => {
    const w = build('20min', 'circuit');
    const first = w.segments.find((s) => s.kind === 'work')!;
    expect(spoken(w)).toContain(phrases.firstUp(first.exercise!));
    expect(first.cues[0]).toMatchObject({ atSec: 0, say: phrases.begin() });
  });

  it('ends with "Get ready" and a one-per-second three-two-one', () => {
    const intro = build('20min', 'circuit').segments[0];
    const tail = intro.cues.slice(-4);
    expect(tail.map((c) => c.say)).toEqual([phrases.getReady(), ...COUNTS]);
    expect(tail.slice(1).map((c) => c.atSec)).toEqual([intro.durationSec - 3, intro.durationSec - 2, intro.durationSec - 1]);
  });

  it('does not count toward the workout length', () => {
    for (const [kind, style] of variants) {
      const w = build(kind, style);
      expect(trainingSec(w)).toBe(w.segments.slice(1).reduce((a, s) => a + s.durationSec, 0));
      expect(Math.abs(trainingSec(w) - TARGET_SECONDS[kind])).toBeLessThanOrEqual(45);
    }
  });

  it('after a swap, announces the new move (still one intro)', () => {
    const w = build('20min', 'circuit');
    const prepIdx = w.segments.findIndex((s) => s.kind === 'prepare' && s.round === 1);
    const oldName = w.segments[prepIdx].exercise!.name;
    const w2 = swapMove(w, prepIdx, ALL, createRng(1));
    const newName = w2.segments[prepIdx].exercise!.name;
    expect(w2.segments.filter((s) => s.kind === 'intro')).toHaveLength(1);
    expect(spoken(w2)).toContain(newName);
    expect(spoken(w2)).not.toContain(oldName);
  });
});
