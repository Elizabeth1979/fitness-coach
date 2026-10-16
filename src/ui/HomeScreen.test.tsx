import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';
import { generateWorkout } from '../generator/generateWorkout';
import { circuitMoves } from './format';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });

describe('HomeScreen', () => {
  it("shows today's circuit once, each move name, a target, and the round count", () => {
    render(<HomeScreen workout={w} kind="10min" onKind={vi.fn()} streak={3} onReroll={vi.fn()} onStart={vi.fn()} onOpenMove={vi.fn()} />);
    for (const m of circuitMoves(w)) {
      expect(screen.getByText(m.exercise.name)).toBeInTheDocument();
    }
    expect(screen.getAllByText(/reps|seconds|minutes/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\d+ rounds/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
  });

  it('shows the Swap pill only on moves that have something to swap to', () => {
    const moves = circuitMoves(w);
    const blocked = moves[0].firstSegment - 1;
    render(<HomeScreen workout={w} kind="10min" onKind={vi.fn()} streak={0} onReroll={vi.fn()} onStart={vi.fn()} onOpenMove={vi.fn()}
      canSwap={(i) => i !== blocked} />);
    expect(screen.getAllByText('Swap')).toHaveLength(moves.length - 1);
    expect(screen.getByRole('button', { name: new RegExp(`^${moves[0].exercise.name}.*see how to do it`) })).toBeInTheDocument();
  });
});
