const DAY = 86_400_000;
const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface DayCell { label: string; date: string; done: boolean; isToday: boolean }

export function weekView(completionDates: string[], today: string): DayCell[] {
  const done = new Set(completionDates);
  const todayMs = toUTC(today);
  // JS getUTCDay: 0=Sun..6=Sat. Shift so Monday is the start.
  const dow = new Date(todayMs).getUTCDay();
  const mondayOffset = (dow + 6) % 7;
  const monday = todayMs - mondayOffset * DAY;
  return LABELS.map((label, i) => {
    const date = iso(monday + i * DAY);
    return { label, date, done: done.has(date), isToday: date === today };
  });
}
