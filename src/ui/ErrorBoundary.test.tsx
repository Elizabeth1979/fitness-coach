import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { generateWorkout } from '../generator/generateWorkout';
import { saveCheckpoint, getCheckpoint, recordCompletion, loadStore } from '../storage/store';

let shouldThrow = true;
function Flaky() {
  if (shouldThrow) throw new Error('boom');
  return <p>Home screen</p>;
}

beforeEach(() => {
  shouldThrow = true;
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs caught errors
});
afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  it('shows a way back instead of a blank screen', () => {
    render(<ErrorBoundary><Flaky /></ErrorBoundary>);
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Back to home' }));
    expect(screen.getByText('Home screen')).toBeInTheDocument();
  });

  it('clears the resume point but keeps the streak history', () => {
    const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 1 });
    saveCheckpoint({ workout: w, segmentIndex: 0, elapsedSec: 0 });
    recordCompletion({ date: '2026-06-24', kind: '10min', focus: 'movement', exerciseIds: ['x'], durationSec: 600 });

    render(<ErrorBoundary><Flaky /></ErrorBoundary>);

    expect(getCheckpoint()).toBeNull();
    expect(loadStore().completions).toHaveLength(1);
  });
});
