import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordCompletion, getPrefs, setPrefs, currentStreak, loadStore } from './store';

const makeMemStorage = (): Storage => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => { store[key] = value; },
    removeItem: (key: string): void => { delete store[key]; },
    clear: (): void => { for (const k of Object.keys(store)) delete store[k]; },
    get length(): number { return Object.keys(store).length; },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
  };
};

beforeEach(() => {
  vi.stubGlobal('localStorage', makeMemStorage());
});

describe('store', () => {
  it('records completions and computes the streak', () => {
    recordCompletion({ date: '2026-06-23', kind: '20min', focus: 'strength', exerciseIds: ['pushup'], durationSec: 1200 });
    recordCompletion({ date: '2026-06-24', kind: '20min', focus: 'movement', exerciseIds: ['bear'], durationSec: 1200 });
    expect(currentStreak('2026-06-24')).toBe(2);
    expect(loadStore().completions.length).toBe(2);
  });

  it('persists prefs', () => {
    setPrefs({ voiceURI: 'abc', equipment: ['bodyweight'] });
    expect(getPrefs().voiceURI).toBe('abc');
    expect(getPrefs().equipment).toEqual(['bodyweight']);
  });
});
