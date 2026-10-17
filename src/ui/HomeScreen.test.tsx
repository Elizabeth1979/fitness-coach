import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('switches between all equipment and bodyweight only in the Change sheet', () => {
    const onEquipment = vi.fn();
    render(<HomeScreen workout={w} kind="10min" onKind={vi.fn()} streak={0} onReroll={vi.fn()} onStart={vi.fn()} onOpenMove={vi.fn()}
      equipment={['bodyweight', 'pullup_bar', 'weights', 'blocks_bands']} onEquipment={onEquipment} />);
    fireEvent.click(screen.getByRole('button', { name: /change workout/i }));
    const group = screen.getByRole('radiogroup', { name: 'Equipment' });
    expect(screen.getByRole('radio', { name: 'Everything' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Bodyweight only' }));
    expect(onEquipment).toHaveBeenCalledWith(['bodyweight']);
    expect(group).toBeInTheDocument();
  });

  it('shows bodyweight only as chosen when that is the saved setting', () => {
    render(<HomeScreen workout={w} kind="10min" onKind={vi.fn()} streak={0} onReroll={vi.fn()} onStart={vi.fn()} onOpenMove={vi.fn()}
      equipment={['bodyweight']} onEquipment={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /change workout/i }));
    expect(screen.getByRole('radio', { name: 'Bodyweight only' })).toHaveAttribute('aria-checked', 'true');
  });

  it('opens the ideas sheet from "Note an idea"', () => {
    render(<HomeScreen workout={w} kind="10min" onKind={vi.fn()} streak={0} onReroll={vi.fn()} onStart={vi.fn()} onOpenMove={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /note an idea/i }));
    expect(screen.getByRole('dialog', { name: 'Your ideas' })).toBeInTheDocument();
  });
});
