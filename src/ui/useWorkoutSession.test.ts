import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutSession } from './useWorkoutSession';
import { generateWorkout } from '../generator/generateWorkout';

describe('useWorkoutSession', () => {
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
