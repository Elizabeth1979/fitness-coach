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
});
