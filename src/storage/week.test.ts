import { describe, it, expect } from 'vitest';
import { weekView } from './week';

describe('weekView', () => {
  // 2026-06-24 is a Wednesday.
  it('returns Mon..Sun for the week containing today', () => {
    const w = weekView([], '2026-06-24');
    expect(w.map((d) => d.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(w[0].date).toBe('2026-06-22');
    expect(w[6].date).toBe('2026-06-28');
  });
  it('marks done days and today', () => {
    const w = weekView(['2026-06-22', '2026-06-24'], '2026-06-24');
    expect(w[0].done).toBe(true);   // Mon
    expect(w[2].done).toBe(true);   // Wed
    expect(w[1].done).toBe(false);  // Tue
    expect(w[2].isToday).toBe(true);
    expect(w.filter((d) => d.isToday).length).toBe(1);
  });
  it('ignores dates outside this week', () => {
    const w = weekView(['2026-06-15'], '2026-06-24');
    expect(w.some((d) => d.done)).toBe(false);
  });
});
