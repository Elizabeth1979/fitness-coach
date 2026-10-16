import { DAY_MS, dateToMs } from '../domain/date';

/** Consecutive-day streak ending today or yesterday (one grace day). */
export function computeStreak(dates: string[], today: string): number {
  const days = new Set(dates.map(dateToMs));
  if (days.size === 0) return 0;
  const todayMs = dateToMs(today);

  // Allow the streak to end today or yesterday.
  let cursor: number;
  if (days.has(todayMs)) cursor = todayMs;
  else if (days.has(todayMs - DAY_MS)) cursor = todayMs - DAY_MS;
  else return 0;

  let streak = 0;
  while (days.has(cursor)) { streak++; cursor -= DAY_MS; }
  return streak;
}
