import { describe, it, expect, afterEach, vi } from 'vitest';
import { localDate, localDayNumber, dateToMs, msToDate, DAY_MS } from './date';

afterEach(() => vi.unstubAllEnvs());

describe('dates', () => {
  it('uses the local date, not the UTC one, east of UTC', () => {
    vi.stubEnv('TZ', 'Asia/Jerusalem');
    const oneThirtyAm = new Date('2026-10-16T22:30:00Z'); // 01:30 on the 17th in Jerusalem
    expect(localDate(oneThirtyAm)).toBe('2026-10-17');
    expect(localDayNumber(oneThirtyAm)).toBe(dateToMs('2026-10-17') / DAY_MS);
  });

  it('uses the local date, not the UTC one, west of UTC', () => {
    vi.stubEnv('TZ', 'America/New_York');
    const tenPm = new Date('2026-10-17T02:00:00Z'); // 22:00 on the 16th in New York
    expect(localDate(tenPm)).toBe('2026-10-16');
  });

  it('gives consecutive days consecutive numbers across a DST change', () => {
    vi.stubEnv('TZ', 'Europe/London'); // clocks go back on 2026-10-25
    const before = localDayNumber(new Date('2026-10-24T12:00:00Z'));
    const after = localDayNumber(new Date('2026-10-26T12:00:00Z'));
    expect(after - before).toBe(2);
    expect(Number.isInteger(before)).toBe(true);
  });

  it('round-trips date strings', () => {
    expect(msToDate(dateToMs('2026-02-28') + DAY_MS)).toBe('2026-03-01');
  });
});
