import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateWorkout } from '../generator/generateWorkout';
import { recordCompletion, getPrefs, setPrefs, currentStreak, loadStore, saveCheckpoint, getCheckpoint, clearCheckpoint, getRecentThemes, pushRecentTheme, suggestedSore, getIdeas, addIdea, removeIdea } from './store';

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

afterEach(() => vi.unstubAllGlobals());

const KEY = 'mwe.store.v1';
const TODAY = '2026-06-24';
const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 1 });
const completion = { date: '2026-06-24', kind: '20min', focus: 'movement', exerciseIds: ['pushup'], durationSec: 1200 };
const saveRaw = (data: unknown): void => localStorage.setItem(KEY, JSON.stringify(data));

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

  it('saves, reads, and clears a checkpoint', () => {
    expect(getCheckpoint(TODAY)).toBeNull();
    saveCheckpoint({ workout: w, segmentIndex: 3, elapsedSec: 0, date: TODAY });
    expect(getCheckpoint(TODAY)?.segmentIndex).toBe(3);
    clearCheckpoint();
    expect(getCheckpoint(TODAY)).toBeNull();
  });

  it('tracks recent warm-up themes — newest last, de-duped, capped', () => {
    expect(getRecentThemes()).toEqual([]);
    pushRecentTheme('hip-flow');
    pushRecentTheme('shoulder-flow');
    pushRecentTheme('hip-flow'); // re-selecting moves it to newest, no dupes
    expect(getRecentThemes()).toEqual(['shoulder-flow', 'hip-flow']);
    pushRecentTheme('a');
    pushRecentTheme('b');
    pushRecentTheme('c'); // capped at 3
    expect(getRecentThemes()).toEqual(['a', 'b', 'c']);
  });

  it('suggests a complementary sore area from the last session (alternate upper/lower)', () => {
    expect(suggestedSore()).toBe('none'); // no history
    recordCompletion({ date: '2026-06-24', kind: '20min', focus: 'movement', exerciseIds: ['x'], durationSec: 1200, sore: 'shoulders' });
    expect(suggestedSore()).toBe('legs'); // worked legs last time → rest legs
    recordCompletion({ date: '2026-06-25', kind: '20min', focus: 'movement', exerciseIds: ['x'], durationSec: 1200, sore: 'legs' });
    expect(suggestedSore()).toBe('shoulders');
    recordCompletion({ date: '2026-06-26', kind: '20min', focus: 'movement', exerciseIds: ['x'], durationSec: 1200, sore: 'none' });
    expect(suggestedSore()).toBe('none'); // a balanced session → no strong suggestion
  });

  it('round-trips a real checkpoint unchanged', () => {
    saveCheckpoint({ workout: w, segmentIndex: 2, elapsedSec: 4.5, date: TODAY });
    expect(getCheckpoint(TODAY)).toEqual({ workout: w, segmentIndex: 2, elapsedSec: 4.5, date: TODAY });
  });

  it('only offers to resume a workout from the same day', () => {
    saveCheckpoint({ workout: w, segmentIndex: 2, elapsedSec: 4.5, date: '2026-06-23' });
    expect(getCheckpoint('2026-06-23')).not.toBeNull();
    expect(getCheckpoint('2026-06-24')).toBeNull();
  });
});

describe('store — ideas for the app', () => {
  it('saves ideas newest last, trimmed, and ignores blank ones', () => {
    expect(getIdeas()).toEqual([]);
    addIdea('  A 45-minute option  ', '2026-10-17');
    addIdea('   ', '2026-10-17');
    addIdea('Music I can pick', '2026-10-18');
    expect(getIdeas()).toMatchObject([
      { text: 'A 45-minute option', date: '2026-10-17' },
      { text: 'Music I can pick', date: '2026-10-18' },
    ]);
    expect(new Set(getIdeas().map((i) => i.id)).size).toBe(2); // each gets its own id
  });

  it('removes one idea and keeps the rest', () => {
    addIdea('one', TODAY); addIdea('two', TODAY); addIdea('three', TODAY);
    expect(removeIdea(1).map((i) => i.text)).toEqual(['one', 'three']);
    expect(getIdeas().map((i) => i.text)).toEqual(['one', 'three']);
  });

  it('keeps ideas when other things are saved', () => {
    addIdea('one', TODAY);
    recordCompletion(completion);
    setPrefs({ equipment: ['bodyweight'] });
    expect(getIdeas()).toMatchObject([{ text: 'one', date: TODAY }]);
  });

  it('drops broken saved ideas', () => {
    saveRaw({ ideas: [{ text: 'ok', date: TODAY }, { text: 5, date: TODAY }, 'loose', { text: 'no date' },
      { text: 'bad id', date: TODAY, id: 3 }, { text: 'bad sent', date: TODAY, sent: 'yes' }] });
    expect(getIdeas()).toEqual([{ text: 'ok', date: TODAY }]);
  });
});

describe('store — damaged or outdated saved data', () => {
  it.each([['not JSON', '{oops'], ['a number', '42'], ['a list', '[]'], ['null', 'null']])(
    'starts from defaults when the saved data is %s', (_label, raw) => {
      localStorage.setItem(KEY, raw);
      const s = loadStore();
      expect(s.completions).toEqual([]);
      expect(s.prefs.equipment).toEqual(['bodyweight', 'pullup_bar', 'weights', 'blocks_bands']);
      expect(s.checkpoint).toBeUndefined();
    });

  it('keeps valid completions and drops broken ones', () => {
    saveRaw({ completions: [completion, { date: 'yesterday' }, null, { ...completion, durationSec: '20' }, { ...completion, sore: 'elbow' }] });
    expect(loadStore().completions).toEqual([completion]);
  });

  it('replaces prefs it does not recognise with defaults', () => {
    saveRaw({ prefs: { equipment: ['kettlebell'], style: 'tabata', music: 'yes', voiceURI: 7, level: 9 } });
    expect(getPrefs()).toEqual({ equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'] });
  });

  it('keeps valid prefs', () => {
    const prefs = { equipment: ['bodyweight' as const], style: 'stations' as const, music: false, voiceURI: 'v1', level: 2 };
    saveRaw({ prefs });
    expect(getPrefs()).toEqual(prefs);
  });

  it('drops a checkpoint written by an older app version (segment shape changed)', () => {
    const old = { ...w, segments: w.segments.map(({ cues: _cues, ...rest }) => rest) };
    saveRaw({ checkpoint: { workout: old, segmentIndex: 0, elapsedSec: 0, date: TODAY } });
    expect(getCheckpoint(TODAY)).toBeNull();
  });

  it.each([
    ['index past the end', { workout: w, segmentIndex: w.segments.length, elapsedSec: 0, date: TODAY }],
    ['fractional index', { workout: w, segmentIndex: 1.5, elapsedSec: 0, date: TODAY }],
    ['negative time', { workout: w, segmentIndex: 0, elapsedSec: -1, date: TODAY }],
    ['no segments', { workout: { ...w, segments: [] }, segmentIndex: 0, elapsedSec: 0, date: TODAY }],
    ['unknown workout kind', { workout: { ...w, kind: '45min' }, segmentIndex: 0, elapsedSec: 0, date: TODAY }],
    ['no date (older app version)', { workout: w, segmentIndex: 0, elapsedSec: 0 }],
  ])('drops a checkpoint with %s', (_label, checkpoint) => {
    saveRaw({ checkpoint });
    expect(getCheckpoint(TODAY)).toBeNull();
  });

  it('ignores a non-list of recent themes', () => {
    saveRaw({ recentThemes: 'hip-flow' });
    expect(getRecentThemes()).toEqual([]);
  });
});

describe('store — storage that refuses to work', () => {
  it('keeps going when storage is full', () => {
    vi.stubGlobal('localStorage', { ...makeMemStorage(), setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } });
    expect(() => recordCompletion(completion)).not.toThrow();
    expect(() => saveCheckpoint({ workout: w, segmentIndex: 0, elapsedSec: 0, date: TODAY })).not.toThrow();
  });

  it('starts from defaults when storage is blocked', () => {
    vi.stubGlobal('localStorage', { ...makeMemStorage(), getItem: () => { throw new DOMException('blocked', 'SecurityError'); } });
    expect(loadStore().completions).toEqual([]);
    expect(currentStreak('2026-06-24')).toBe(0);
  });
});
