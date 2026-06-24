import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordCompletion, getPrefs, setPrefs, currentStreak, loadStore } from './store';

beforeEach(() => {
  // Clear localStorage or mock storage
  if (typeof localStorage !== 'undefined' && localStorage.clear) {
    localStorage.clear();
  } else if (typeof localStorage !== 'undefined') {
    // Fallback if clear is not available
    for (const key of Object.keys(localStorage)) {
      localStorage.removeItem(key);
    }
  }
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
