import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ActiveScreen } from './ActiveScreen';
import { generateWorkout } from '../generator/generateWorkout';
import type { SessionState } from '../engine/session';
import { EXERCISES } from '../domain/exercises';
import { trainingSec } from '../domain/workout';
import { formatClock, timeLeft } from './format';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
const firstCircuit = w.segments.findIndex((s) => s.kind === 'work' && s.round === 1);
const state: SessionState = { status: 'running', segmentIndex: firstCircuit, segment: w.segments[firstCircuit], segmentRemainingSec: 20 };

describe('ActiveScreen', () => {
  it('has a Back button, greyed out when there is no move before', () => {
    const onBack = vi.fn();
    const { unmount } = render(<ActiveScreen state={state} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onBack={onBack} onEnd={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledOnce();
    unmount();
    const first = w.segments.findIndex((s) => s.kind === 'work');
    render(<ActiveScreen state={{ ...state, segmentIndex: first, segment: w.segments[first] }} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onBack={onBack} onEnd={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
  });

  it('between moves shows one calm "Rest · Next up" screen for the coming move', () => {
    const i = w.segments.findIndex((s) => s.kind === 'prepare' && s.round === 2);
    const prep = w.segments[i];
    const { container } = render(<ActiveScreen state={{ status: 'running', segmentIndex: i, segment: prep, segmentRemainingSec: 10 }} workout={w}
      onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText('Rest · Next up')).toBeInTheDocument();
    expect(screen.getByText(prep.exercise!.name)).toBeInTheDocument();
    expect(container.querySelector('main')).toHaveAttribute('data-tone', 'rest');
    expect(screen.queryByText('Next up', { selector: '.next-eyebrow' })).not.toBeInTheDocument();
  });

  it('pauses the workout and opens the ideas sheet to note an idea', () => {
    const onPause = vi.fn();
    render(<ActiveScreen state={state} workout={w} onPause={onPause} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Note an idea' }));
    expect(onPause).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: 'Your ideas' })).toBeInTheDocument();
  });

  it('does not pause again when already paused', () => {
    const onPause = vi.fn();
    render(<ActiveScreen state={{ ...state, status: 'paused' }} workout={w} onPause={onPause} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Note an idea' }));
    expect(onPause).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Your ideas' })).toBeInTheDocument();
  });

  it('shows the move, a within-round Move label, and the round', () => {
    render(<ActiveScreen state={state} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(w.segments[firstCircuit].exercise!.name)).toBeInTheDocument();
    expect(screen.getByText(/Move \d+ of \d+/)).toBeInTheDocument();
    expect(screen.getByText(/Round \d+ of \d+/)).toBeInTheDocument();
  });

  it('shows how to do the current move, without repeating its name', () => {
    const seg = { ...w.segments[firstCircuit], exercise: EXERCISES.find((e) => e.id === 'hip-circles')! };
    render(<ActiveScreen state={{ ...state, segment: seg }} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText('Hands on hips, big slow circles each way.')).toBeInTheDocument();
  });

  it('shows a round-rest screen between rounds', () => {
    const rrIndex = w.segments.findIndex((s) => s.kind === 'roundrest');
    const rrState: SessionState = { status: 'running', segmentIndex: rrIndex, segment: w.segments[rrIndex], segmentRemainingSec: 20 };
    render(<ActiveScreen state={rrState} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(/Round \d+ complete/)).toBeInTheDocument();
  });

  it('shows a switch-sides step for one-sided moves, and which side you are on', () => {
    const one = generateWorkout({ kind: '20min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
    const swIdx = one.segments.findIndex((s) => s.kind === 'switch');
    expect(swIdx).toBeGreaterThan(0);
    const at = (i: number): SessionState => ({ status: 'running', segmentIndex: i, segment: one.segments[i], segmentRemainingSec: 5 });
    const { unmount } = render(<ActiveScreen state={at(swIdx)} workout={one} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText('Switch sides')).toBeInTheDocument();
    expect(screen.getByText(/right side next/i)).toBeInTheDocument();
    unmount();
    render(<ActiveScreen state={at(swIdx - 1)} workout={one} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(/left side/i)).toBeInTheDocument();
  });

  it('during the left side, "Next up" is the right side, not the next exercise', () => {
    const one = generateWorkout({ kind: '20min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
    const leftIdx = one.segments.findIndex((s) => s.kind === 'work' && s.side === 'left');
    const nextExercise = one.segments.slice(leftIdx + 1).find((s) => s.kind === 'prepare')!.exercise!.name;
    const state: SessionState = { status: 'running', segmentIndex: leftIdx, segment: one.segments[leftIdx], segmentRemainingSec: 5 };
    render(<ActiveScreen state={state} workout={one} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText('Right side')).toBeInTheDocument();
    expect(screen.queryByText(nextExercise)).not.toBeInTheDocument();
  });

  it('during the intro: lists the moves, counts in to the first one, and holds the workout clock', () => {
    const intro: SessionState = { status: 'running', segmentIndex: 0, segment: w.segments[0], segmentRemainingSec: 12 };
    render(<ActiveScreen state={intro} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText("Today's workout")).toBeInTheDocument();
    const list = screen.getByRole('list', { name: /rounds of/ });
    for (const s of w.segments.filter((x) => x.kind === 'prepare' && x.round === 1)) {
      expect(within(list).getByText(s.exercise!.name)).toBeInTheDocument();
    }
    expect(screen.getByText('First up')).toBeInTheDocument();
    expect(screen.getByText(w.segments[1].exercise!.name)).toBeInTheDocument();
    expect(screen.getByText('starting in')).toBeInTheDocument();
    expect(screen.getByText(`${formatClock(trainingSec(w))} left`)).toBeInTheDocument();
  });

  it('shows the time left in the whole workout', () => {
    render(<ActiveScreen state={state} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(`${formatClock(timeLeft(w, firstCircuit, 20))} left`)).toBeInTheDocument();
  });
});
