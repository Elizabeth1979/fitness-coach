import { describe, it, expect } from 'vitest';
import { EXERCISES, exercisesByCategory } from './exercises';
import type { Category } from './types';

const REQUIRED: Category[] = ['warmup', 'push', 'pull', 'legs', 'hinge', 'carry', 'crawl', 'mobility'];

describe('exercise library', () => {
  it('has at least one exercise in every required category', () => {
    for (const cat of REQUIRED) {
      expect(exercisesByCategory(cat).length).toBeGreaterThan(0);
    }
  });

  it('every exercise has a non-empty cue, >=1 equipment, >=1 goal', () => {
    for (const ex of EXERCISES) {
      expect(ex.cue.trim().length).toBeGreaterThan(0);
      expect(ex.equipment.length).toBeGreaterThan(0);
      expect(ex.goals.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('has unique ids', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('time-measured exercises declare defaultDurationSec; rep-measured declare defaultReps', () => {
    for (const ex of EXERCISES) {
      if (ex.measure === 'time') expect(ex.defaultDurationSec).toBeGreaterThan(0);
      else expect(ex.defaultReps).toBeGreaterThan(0);
    }
  });
});
