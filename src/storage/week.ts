import { DAY_MS, dateToMs, msToDate } from '../domain/date';

const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface DayCell { label: string; date: string; done: boolean; isToday: boolean }

export function weekView(completionDates: string[], today: string): DayCell[] {
  const done = new Set(completionDates);
  const todayMs = dateToMs(today);
  // JS getUTCDay: 0=Sun..6=Sat. Shift so Monday is the start.
  const dow = new Date(todayMs).getUTCDay();
  const mondayOffset = (dow + 6) % 7;
  const monday = todayMs - mondayOffset * DAY_MS;
  return LABELS.map((label, i) => {
    const date = msToDate(monday + i * DAY_MS);
    return { label, date, done: done.has(date), isToday: date === today };
  });
}
