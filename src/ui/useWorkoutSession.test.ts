import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutSession } from './useWorkoutSession';
import { generateWorkout } from '../generator/generateWorkout';
import { getCheckpoint } from '../storage/store';
import { localDate } from '../domain/date';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 1 });

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useWorkoutSession', () => {
  afterEach(() => { setVisibility('visible'); vi.unstubAllGlobals(); localStorage.clear(); });

  it('saves the exact second on pause, so Resume continues mid-move', () => {
    // Drive animation frames by hand (the hook uses the real-clock adapter).
    let now = 0;
    let queued: FrameRequestCallback | null = null;
    vi.stubGlobal('performance', { now: () => now });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queued = cb; return 1; });
    vi.stubGlobal('cancelAnimationFrame', () => { queued = null; });
    const advance = (sec: number) => {
      for (let i = 0; i < sec * 10; i++) { now += 100; const cb = queued; queued = null; act(() => cb?.(now)); }
    };

    const { result } = renderHook(() => useWorkoutSession(w));
    act(() => result.current.start());
    advance(3);
    act(() => result.current.pause());

    const cp = getCheckpoint(localDate(new Date()));
    expect(cp?.segmentIndex).toBe(0);
    expect(cp?.elapsedSec).toBeCloseTo(3, 5);
  });


  it('pause() shows paused and resume() shows running again', () => {
    const { result } = renderHook(() => useWorkoutSession(w));
    act(() => result.current.start());
    act(() => result.current.pause());
    expect(result.current.state.status).toBe('paused');
    act(() => result.current.resume());
    expect(result.current.state.status).toBe('running');
  });

  it('pauses when the app is hidden (screen locked / another app in front)', () => {
    const { result } = renderHook(() => useWorkoutSession(w));
    act(() => result.current.start());
    act(() => setVisibility('hidden'));
    expect(result.current.state.status).toBe('paused');
    act(() => setVisibility('visible'));
    expect(result.current.state.status).toBe('paused'); // waits for you to tap Resume
  });

  it('starts idle and transitions to running on start()', () => {
    const workout = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 1 });
    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe('idle');
    act(() => result.current.start());
    expect(result.current.state.status).toBe('running');
  });

  it('resets to idle when the workout changes (no stale state across workouts)', () => {
    const date = new Date('2026-06-24T08:00:00');
    const w1 = generateWorkout({ kind: '10min', date, equipment: ['bodyweight'], seed: 1 });
    const w2 = generateWorkout({ kind: '20min', date, equipment: ['bodyweight'], seed: 2 });
    const { result, rerender } = renderHook(({ w }) => useWorkoutSession(w), { initialProps: { w: w1 } });
    act(() => result.current.start());
    expect(result.current.state.status).toBe('running');
    rerender({ w: w2 });
    expect(result.current.state.status).toBe('idle');
  });
});
