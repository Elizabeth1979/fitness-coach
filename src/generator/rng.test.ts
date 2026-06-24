import { describe, it, expect } from 'vitest';
import { createRng, pick } from './rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces floats in [0,1)', () => {
    const r = createRng(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('pick selects deterministically from an array', () => {
    const r = createRng(7);
    const choice = pick(r, ['a', 'b', 'c', 'd']);
    expect(['a', 'b', 'c', 'd']).toContain(choice);
    expect(pick(createRng(7), ['a', 'b', 'c', 'd'])).toBe(choice);
  });
});
