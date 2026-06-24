import type { Focus } from '../domain/types';

// PRD weekly structure: Sun/Tue/Thu = strength; all other days = movement.
const STRENGTH_DAYS = new Set([0, 2, 4]); // 0=Sun, 2=Tue, 4=Thu

export function focusForDate(date: Date): Focus {
  return STRENGTH_DAYS.has(date.getDay()) ? 'strength' : 'movement';
}
