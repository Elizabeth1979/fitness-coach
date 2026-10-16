// Calendar dates as 'YYYY-MM-DD' strings. "Today" is always the date on the
// user's own clock — a workout at 1am belongs to that day, not to whatever the
// date happens to be in UTC. Date-string arithmetic runs in UTC so it never
// trips over daylight-saving changes.

export const DAY_MS = 86_400_000;

const pad = (n: number): string => String(n).padStart(2, '0');

/** The local calendar date of `d`, as 'YYYY-MM-DD'. */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → milliseconds at that date's UTC midnight. */
export function dateToMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Milliseconds (a UTC midnight) → 'YYYY-MM-DD'. */
export function msToDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days since 1970-01-01 on the local calendar — the daily workout seed. */
export function localDayNumber(d: Date): number {
  return dateToMs(localDate(d)) / DAY_MS;
}
