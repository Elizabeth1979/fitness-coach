import { describe, it, expect } from 'vitest';
import { computeStreak } from './streak';

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-06-22', '2026-06-23', '2026-06-24'], '2026-06-24')).toBe(3);
  });
  it('counts a streak that ended yesterday (grace) but not older gaps', () => {
    expect(computeStreak(['2026-06-23'], '2026-06-24')).toBe(1);
    expect(computeStreak(['2026-06-21'], '2026-06-24')).toBe(0);
  });
  it('dedupes multiple sessions on the same day', () => {
    expect(computeStreak(['2026-06-24', '2026-06-24', '2026-06-23'], '2026-06-24')).toBe(2);
  });
  it('returns 0 for no history', () => {
    expect(computeStreak([], '2026-06-24')).toBe(0);
  });
});
