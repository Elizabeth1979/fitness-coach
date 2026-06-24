import { describe, it, expect } from 'vitest';
import { WARMUP_FLOWS, pickWarmupFlow } from './warmupFlows';
import { exerciseById } from '../domain/exercises';
import { createRng } from './rng';
import type { Category } from '../domain/types';

describe('warm-up flows', () => {
  it('every flow move id resolves to a real warm-up exercise', () => {
    for (const flow of WARMUP_FLOWS) {
      expect(flow.moves.length).toBeGreaterThan(0);
      for (const id of flow.moves) {
        const ex = exerciseById(id);
        expect(ex, `move ${id} in ${flow.id}`).toBeDefined();
        expect(ex?.category).toBe('warmup');
      }
    }
  });

  it('flow ids are unique', () => {
    const ids = WARMUP_FLOWS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('pickWarmupFlow', () => {
  const ALL: Category[] = ['push', 'pull', 'legs', 'hinge', 'carry', 'mobility'];

  it('never repeats a recent theme when an alternative exists', () => {
    const flow = pickWarmupFlow({ workoutCategories: ALL, recentThemeIds: ['shoulder-flow'], rng: createRng(1) });
    expect(flow.id).not.toBe('shoulder-flow');
  });

  it('prefers a flow that preps the day\'s work (upper-body day → Shoulder Flow)', () => {
    const flow = pickWarmupFlow({ workoutCategories: ['push', 'pull'], recentThemeIds: [], rng: createRng(3) });
    expect(flow.id).toBe('shoulder-flow');
  });

  it('is deterministic for the same inputs', () => {
    const a = pickWarmupFlow({ workoutCategories: ALL, recentThemeIds: [], rng: createRng(7) });
    const b = pickWarmupFlow({ workoutCategories: ALL, recentThemeIds: [], rng: createRng(7) });
    expect(a.id).toBe(b.id);
  });
});
