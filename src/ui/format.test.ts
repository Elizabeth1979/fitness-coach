import { describe, it, expect } from 'vitest';
import { formatTarget, sessionMoves, currentMoveIndex, circuitMoves, roundInfo } from './format';
import { generateWorkout } from '../generator/generateWorkout';
import { SLOTS_SHORT } from '../generator/selectExercises';
import type { Segment } from '../domain/types';

const WIDTH = SLOTS_SHORT.length; // 10-min circuit width

const seg = (over: Partial<Segment>): Segment => ({ kind: 'work', durationSec: 30, cues: [], ...over });
const ex = (m: 'reps' | 'time', extra: Record<string, unknown>) =>
  ({ id: 'x', name: 'X', category: 'push', equipment: ['bodyweight'], goals: ['strength'], unilateral: false, measure: m, cue: '', ...extra }) as Segment['exercise'];

describe('formatTarget', () => {
  it('reps', () => expect(formatTarget(seg({ exercise: ex('reps', { defaultReps: 8 }) }))).toBe('8 reps'));
  it('reps each side', () => expect(formatTarget(seg({ exercise: ex('reps', { defaultReps: 6, unilateral: true }) }))).toBe('6 reps each side'));
  it('seconds', () => expect(formatTarget(seg({ durationSec: 40, exercise: ex('time', { defaultDurationSec: 40 }) }))).toBe('40 seconds'));
  it('minutes', () => expect(formatTarget(seg({ durationSec: 120, exercise: ex('time', { defaultDurationSec: 120 }) }))).toBe('2 minutes'));
  it('rounds non-integer minutes', () => expect(formatTarget(seg({ durationSec: 90, exercise: ex('time', { defaultDurationSec: 90 }) }))).toBe('2 minutes'));
});

describe('sessionMoves', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
  it('returns warm-up move(s) then the circuit repeated each round', () => {
    const moves = sessionMoves(w);
    expect(moves.some((m) => m.isWarmup)).toBe(true);
    // Main circuit moves only (exclude the warm-up and the core finisher).
    expect(moves.filter((m) => !m.isWarmup && m.category !== 'core').length).toBe(WIDTH * w.rounds);
  });
  it('collapses a unilateral exercise (left then right) into one "each side" move', () => {
    const u = { id: 'u', name: 'Uni', category: 'legs', equipment: ['bodyweight'], goals: ['strength'], unilateral: true, measure: 'reps', defaultReps: 6, cue: '' };
    const synthetic = { id: 't', kind: '10min', focus: 'movement', segments: [
      { kind: 'work', exercise: u, side: 'left', durationSec: 20, cues: [] },
      { kind: 'work', exercise: u, side: 'right', durationSec: 20, cues: [] },
    ] } as unknown as import('../domain/types').Workout;
    const moves = sessionMoves(synthetic);
    expect(moves.length).toBe(1);
    expect(moves[0].target).toBe('6 reps each side');
  });
  it('firstSegment is strictly increasing', () => {
    const f = sessionMoves(w).map((m) => m.firstSegment);
    expect([...f].sort((a, b) => a - b)).toEqual(f);
  });
});

describe('currentMoveIndex', () => {
  it('maps a segment index to the active move', () => {
    const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 4 });
    const moves = sessionMoves(w);
    expect(currentMoveIndex(moves, moves[0].firstSegment)).toBe(0);
    expect(currentMoveIndex(moves, moves[2].firstSegment + 1)).toBe(2);
  });
});

describe('circuitMoves', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
  it('returns the circuit once (round 1) — same as the first round of main moves', () => {
    const c = circuitMoves(w);
    expect(c.length).toBe(WIDTH);
    const firstRound = sessionMoves(w).filter((m) => !m.isWarmup).slice(0, WIDTH).map((m) => m.exercise.id);
    expect(c.map((m) => m.exercise.id)).toEqual(firstRound);
  });
});

describe('roundInfo', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
  const prepsInRound = (round: number) =>
    w.segments.map((s, i) => ({ s, i })).filter(({ s }) => s.kind === 'prepare' && s.round === round).map(({ i }) => i);

  it('reports total rounds, moves per round, and the first move of round 1', () => {
    const ri = roundInfo(w, prepsInRound(1)[0]);
    expect(ri.totalRounds).toBe(w.rounds); // 3
    expect(ri.movesPerRound).toBe(WIDTH);
    expect(ri.round).toBe(1);
    expect(ri.moveInRound).toBe(1);
  });

  it('counts the move within the current round', () => {
    expect(roundInfo(w, prepsInRound(1)[1]).moveInRound).toBe(2);
  });

  it('tracks the round number into round 2', () => {
    const ri = roundInfo(w, prepsInRound(2)[0]);
    expect(ri.round).toBe(2);
    expect(ri.moveInRound).toBe(1);
  });

  it('returns round 0 during the warm-up', () => {
    const warm = w.segments.findIndex((s) => s.exercise?.category === 'warmup');
    expect(roundInfo(w, warm).round).toBe(0);
  });
});
