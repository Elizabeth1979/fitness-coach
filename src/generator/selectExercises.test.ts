import { describe, it, expect } from 'vitest';
import { selectExercises, SLOTS } from './selectExercises';
import { createRng } from './rng';
import type { Equipment } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];

describe('selectExercises', () => {
  // The 'carry' slot intentionally draws from carry OR crawl (bear/crab/leopard),
  // so that position may be either category — assert per-slot, not strict equality.
  it('with warmup: returns warmup first, then one exercise per slot (carry slot may be a crawl)', () => {
    const out = selectExercises({ equipment: ALL, recentExerciseIds: [], rng: createRng(1), includeWarmup: true });
    expect(out[0].category).toBe('warmup');
    const cats = out.slice(1).map((e) => e.category);
    expect(cats).toHaveLength(SLOTS.length);
    SLOTS.forEach((slot, i) => {
      if (slot === 'carry') expect(['carry', 'crawl']).toContain(cats[i]);
      else expect(cats[i]).toBe(slot);
    });
  });

  it('without warmup: returns one exercise per slot and no warmup', () => {
    const out = selectExercises({ equipment: ALL, recentExerciseIds: [], rng: createRng(1), includeWarmup: false });
    const cats = out.map((e) => e.category);
    expect(cats).toHaveLength(SLOTS.length);
    SLOTS.forEach((slot, i) => {
      if (slot === 'carry') expect(['carry', 'crawl']).toContain(cats[i]);
      else expect(cats[i]).toBe(slot);
    });
    expect(cats).not.toContain('warmup');
  });

  it('only picks exercises whose equipment is all available', () => {
    const bodyOnly: Equipment[] = ['bodyweight'];
    const out = selectExercises({ equipment: bodyOnly, recentExerciseIds: [], rng: createRng(3), includeWarmup: true });
    for (const ex of out) {
      for (const eq of ex.equipment) expect(bodyOnly).toContain(eq);
    }
  });

  it('avoids recent exercises when an alternative exists', () => {
    // Pull slot has several options; force avoidance of dead-hang.
    const out = selectExercises({ equipment: ALL, recentExerciseIds: ['dead-hang'], rng: createRng(5), includeWarmup: true });
    const pull = out.find((e) => e.category === 'pull');
    expect(pull?.id).not.toBe('dead-hang');
  });
});
