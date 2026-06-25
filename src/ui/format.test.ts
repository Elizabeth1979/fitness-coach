import { describe, it, expect } from 'vitest';
import { formatTarget, sessionMoves, currentMoveIndex } from './format';
import { generateWorkout } from '../generator/generateWorkout';
import type { Segment } from '../domain/types';

const seg = (over: Partial<Segment>): Segment => ({ kind: 'work', durationSec: 30, cues: [], ...over });
const ex = (m: 'reps' | 'time', extra: Record<string, unknown>) =>
  ({ id: 'x', name: 'X', category: 'push', equipment: ['bodyweight'], goals: ['strength'], unilateral: false, measure: m, cue: '', ...extra }) as Segment['exercise'];

describe('formatTarget', () => {
  it('reps', () => expect(formatTarget(seg({ exercise: ex('reps', { defaultReps: 8 }) }))).toBe('8 reps'));
  it('reps each side', () => expect(formatTarget(seg({ exercise: ex('reps', { defaultReps: 6, unilateral: true }) }))).toBe('6 reps each side'));
  it('seconds', () => expect(formatTarget(seg({ durationSec: 40, exercise: ex('time', { defaultDurationSec: 40 }) }))).toBe('40 seconds'));
  it('minutes', () => expect(formatTarget(seg({ durationSec: 120, exercise: ex('time', { defaultDurationSec: 120 }) }))).toBe('2 minutes'));
});

describe('sessionMoves', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
  it('returns warm-up move(s) then 6 main moves, in order', () => {
    const moves = sessionMoves(w);
    expect(moves.some((m) => m.isWarmup)).toBe(true);
    const main = moves.filter((m) => !m.isWarmup);
    expect(main.map((m) => m.category)).toEqual(['push', 'pull', 'legs', 'hinge', 'carry', 'mobility'].filter((c) => main.some((m) => m.category === c)));
    expect(main.length).toBe(6);
  });
  it('collapses a unilateral exercise into one move with "each side"', () => {
    const moves = sessionMoves(w);
    const uni = moves.find((m) => m.exercise.unilateral);
    if (uni) expect(uni.target).toContain('each side');
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
