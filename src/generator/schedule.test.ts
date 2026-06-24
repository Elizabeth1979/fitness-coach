import { describe, it, expect } from 'vitest';
import { focusForDate } from './schedule';

describe('focusForDate', () => {
  it('is strength on Sunday, Tuesday, Thursday', () => {
    expect(focusForDate(new Date('2026-06-21T08:00:00'))).toBe('strength'); // Sun
    expect(focusForDate(new Date('2026-06-23T08:00:00'))).toBe('strength'); // Tue
    expect(focusForDate(new Date('2026-06-25T08:00:00'))).toBe('strength'); // Thu
  });

  it('is movement on the other days', () => {
    expect(focusForDate(new Date('2026-06-22T08:00:00'))).toBe('movement'); // Mon
    expect(focusForDate(new Date('2026-06-24T08:00:00'))).toBe('movement'); // Wed
    expect(focusForDate(new Date('2026-06-26T08:00:00'))).toBe('movement'); // Fri
    expect(focusForDate(new Date('2026-06-27T08:00:00'))).toBe('movement'); // Sat
  });
});
