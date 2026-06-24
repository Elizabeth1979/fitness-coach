const DAY = 86_400_000;

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Consecutive-day streak ending today or yesterday (one grace day). */
export function computeStreak(dates: string[], today: string): number {
  const days = new Set(dates.map(toUTC));
  if (days.size === 0) return 0;
  const todayMs = toUTC(today);

  // Allow the streak to end today or yesterday.
  let cursor: number;
  if (days.has(todayMs)) cursor = todayMs;
  else if (days.has(todayMs - DAY)) cursor = todayMs - DAY;
  else return 0;

  let streak = 0;
  while (days.has(cursor)) { streak++; cursor -= DAY; }
  return streak;
}
