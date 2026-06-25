import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveScreen } from './ActiveScreen';
import { generateWorkout } from '../generator/generateWorkout';
import type { SessionState } from '../engine/session';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
const firstWork = w.segments.findIndex((s) => s.kind === 'work');
const state: SessionState = { status: 'running', segmentIndex: firstWork, segment: w.segments[firstWork], segmentRemainingSec: 20 };

describe('ActiveScreen', () => {
  it('shows the current move name and a Move N of M progress label', () => {
    render(<ActiveScreen state={state} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(w.segments[firstWork].exercise!.name)).toBeInTheDocument();
    expect(screen.getByText(/Move \d+ of \d+/)).toBeInTheDocument();
  });
});
