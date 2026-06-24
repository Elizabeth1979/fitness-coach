import type { Equipment } from '../domain/types';
import { computeStreak } from './streak';

export interface Completion {
  date: string;        // YYYY-MM-DD
  kind: string;
  focus: string;
  exerciseIds: string[];
  durationSec: number;
}

export interface Prefs {
  voiceURI?: string;
  equipment: Equipment[];
}

export interface Store {
  version: 1;
  completions: Completion[];
  prefs: Prefs;
}

const KEY = 'mwe.store.v1';
const DEFAULT: Store = {
  version: 1,
  completions: [],
  prefs: { equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'] },
};

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw) as Store;
    return { ...structuredClone(DEFAULT), ...parsed, prefs: { ...DEFAULT.prefs, ...parsed.prefs }, completions: Array.isArray(parsed.completions) ? parsed.completions : [] };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function saveStore(s: Store): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function recordCompletion(c: Completion): void {
  const s = loadStore();
  s.completions.push(c);
  saveStore(s);
}

export function getPrefs(): Prefs { return loadStore().prefs; }

export function setPrefs(p: Prefs): void {
  const s = loadStore();
  s.prefs = p;
  saveStore(s);
}

export function currentStreak(today: string): number {
  return computeStreak(loadStore().completions.map((c) => c.date), today);
}
