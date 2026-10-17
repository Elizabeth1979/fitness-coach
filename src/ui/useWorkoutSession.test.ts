import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutSession } from './useWorkoutSession';
import { generateWorkout } from '../generator/generateWorkout';
import { getCheckpoint } from '../storage/store';
import { localDate } from '../domain/date';
import type { Workout } from '../domain/types';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 1 });

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

// Drive animation frames by hand (the hook uses the real-clock adapter).
function driveFrames() {
  let now = 0;
  let queued: FrameRequestCallback | null = null;
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queued = cb; return 1; });
  vi.stubGlobal('cancelAnimationFrame', () => { queued = null; });
  return (sec: number) => {
    for (let i = 0; i < sec * 10; i++) { now += 100; const cb = queued; queued = null; act(() => cb?.(now)); }
  };
}

const tiny: Workout = {
  id: 'tiny', kind: '10min', focus: 'movement', rounds: 1, style: 'circuit',
  segments: [{ kind: 'work', durationSec: 1, cues: [] }, { kind: 'celebrate', durationSec: 1, cues: [] }],
};

describe('useWorkoutSession', () => {
  afterEach(() => { setVisibility('visible'); vi.unstubAllGlobals(); localStorage.clear(); });

  it('saves the exact second on pause, so Resume continues mid-move', () => {
    const advance = driveFrames();
    const { result } = renderHook(() => useWorkoutSession(w, vi.fn()));
    act(() => result.current.start());
    advance(3);
    act(() => result.current.pause());

    const cp = getCheckpoint(localDate(new Date()));
    expect(cp?.segmentIndex).toBe(0);
    expect(cp?.elapsedSec).toBeCloseTo(3, 5);
  });


  it('pause() shows paused and resume() shows running again', () => {
    const { result } = renderHook(() => useWorkoutSession(w, vi.fn()));
    act(() => result.current.start());
    act(() => result.current.pause());
    expect(result.current.state.status).toBe('paused');
    act(() => result.current.resume());
    expect(result.current.state.status).toBe('running');
  });

  it('Pause stops the coach mid-sentence; Skip clears the old line before the next one is said', () => {
    const log: string[] = [];
    vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; constructor(text: string) { this.text = text; } });
    vi.stubGlobal('speechSynthesis', { speak: (u: { text: string }) => log.push(`say ${u.text}`), cancel: () => log.push('cancel'), getVoices: () => [] });
    const { result, unmount } = renderHook(() => useWorkoutSession(w, vi.fn()));
    act(() => result.current.start());
    expect(log).toContain(`say ${w.segments[0].cues[0].say}`);

    log.length = 0;
    act(() => result.current.pause());
    expect(log).toEqual(['cancel']);

    act(() => result.current.resume());
    log.length = 0;
    act(() => result.current.skip());
    expect(log[0]).toBe('cancel');
    expect(log).toContain(`say ${w.segments[1].cues[0].say}`);
    unmount(); // while the fake speech is still installed: putting it away silences the coach too
    expect(log.at(-1)).toBe('cancel');
  });

  it('pauses when the app is hidden (screen locked / another app in front)', () => {
    const { result } = renderHook(() => useWorkoutSession(w, vi.fn()));
    act(() => result.current.start());
    act(() => setVisibility('hidden'));
    expect(result.current.state.status).toBe('paused');
    act(() => setVisibility('visible'));
    expect(result.current.state.status).toBe('paused'); // waits for you to tap Resume
  });

  it('starts idle and transitions to running on start()', () => {
    const workout = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 1 });
    const { result } = renderHook(() => useWorkoutSession(workout, vi.fn()));
    expect(result.current.state.status).toBe('idle');
    act(() => result.current.start());
    expect(result.current.state.status).toBe('running');
  });

  it('resets to idle when the workout changes (no stale state across workouts)', () => {
    const date = new Date('2026-06-24T08:00:00');
    const w1 = generateWorkout({ kind: '10min', date, equipment: ['bodyweight'], seed: 1 });
    const w2 = generateWorkout({ kind: '20min', date, equipment: ['bodyweight'], seed: 2 });
    const { result, rerender } = renderHook(({ w }) => useWorkoutSession(w, vi.fn()), { initialProps: { w: w1 } });
    act(() => result.current.start());
    expect(result.current.state.status).toBe('running');
    rerender({ w: w2 });
    expect(result.current.state.status).toBe('idle');
  });

  it('reports a natural finish as completed', () => {
    const advance = driveFrames();
    const onFinished = vi.fn();
    const { result } = renderHook(() => useWorkoutSession(tiny, onFinished));
    act(() => result.current.start());
    advance(3);
    expect(onFinished).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('reports ending early as not completed', () => {
    const onFinished = vi.fn();
    const { result } = renderHook(() => useWorkoutSession(w, onFinished));
    act(() => result.current.start());
    act(() => result.current.end());
    expect(onFinished).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('does not report a finish when the workout is simply put away', () => {
    const onFinished = vi.fn();
    const { result, rerender } = renderHook(({ wk }) => useWorkoutSession(wk, onFinished), { initialProps: { wk: w as Workout | null } });
    act(() => result.current.start());
    rerender({ wk: null });
    expect(onFinished).not.toHaveBeenCalled();
  });
});
