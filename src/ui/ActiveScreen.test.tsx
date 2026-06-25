import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveScreen } from './ActiveScreen';
import { generateWorkout } from '../generator/generateWorkout';
import type { SessionState } from '../engine/session';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
const firstCircuit = w.segments.findIndex((s) => s.kind === 'work' && s.round === 1);
const state: SessionState = { status: 'running', segmentIndex: firstCircuit, segment: w.segments[firstCircuit], segmentRemainingSec: 20 };

describe('ActiveScreen', () => {
  it('shows the move, a within-round Move label, and the round', () => {
    render(<ActiveScreen state={state} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(w.segments[firstCircuit].exercise!.name)).toBeInTheDocument();
    expect(screen.getByText(/Move \d+ of \d+/)).toBeInTheDocument();
    expect(screen.getByText(/Round \d+ of \d+/)).toBeInTheDocument();
  });

  it('shows a round-rest screen between rounds', () => {
    const rrIndex = w.segments.findIndex((s) => s.kind === 'roundrest');
    const rrState: SessionState = { status: 'running', segmentIndex: rrIndex, segment: w.segments[rrIndex], segmentRemainingSec: 20 };
    render(<ActiveScreen state={rrState} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(/Round \d+ complete/)).toBeInTheDocument();
  });
});
