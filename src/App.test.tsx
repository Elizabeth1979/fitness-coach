import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import App from './App';

const todaysList = () => within(screen.getByRole('region', { name: "Today's workout" }));
const firstMove = () => todaysList().getAllByRole('button', { name: /Tap to (swap this move|see how to do it)/ })[0];
const firstMoveName = () => firstMove().getAttribute('aria-label')?.split(',')[0];
const chooseLength = (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: /change workout/i }));
  fireEvent.click(screen.getByRole('radio', { name: label }));
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const warmupName = () => todaysList().getByText(/^Warm-up/).textContent;
const moveNames = () => todaysList().getAllByRole('button', { name: /Tap to/ }).map((b) => b.getAttribute('aria-label')?.split(',')[0]);
const openChange = () => fireEvent.click(screen.getByRole('button', { name: /change workout/i }));
const pick = (group: string, label: string) => {
  const radio = within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', { name: label });
  fireEvent.click(radio);
  return radio;
};

describe('App — home', () => {
  it("shows today's workout and a Start button", () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
    expect(todaysList().getByText(/20 min/)).toBeInTheDocument();
  });

  it('rebuilds the workout when the length changes', () => {
    render(<App />);
    chooseLength('10 min');
    expect(todaysList().getByText(/10 min/)).toBeInTheDocument();
  });

  it('keeps a swapped move until a choice changes the workout', () => {
    render(<App />);
    const original = firstMoveName();
    fireEvent.click(firstMove());
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Swap this move' }));
    const swapped = firstMoveName();
    expect(swapped).not.toBe(original);

    chooseLength('10 min');
    chooseLength('20 min');
    expect(firstMoveName()).toBe(original);
  });
});

describe('App — every button does its one job', () => {
  it('New warm-up and New moves sit on Home, next to what they change', () => {
    render(<App />);
    const warm = warmupName();
    fireEvent.click(screen.getByRole('button', { name: 'New warm-up' }));
    expect(warmupName()).not.toBe(warm);
    const moves = moveNames();
    fireEvent.click(screen.getByRole('button', { name: 'New moves' }));
    expect(moveNames()).not.toEqual(moves);
  });

  it('each Change-sheet choice selects only itself', () => {
    render(<App />);
    openChange();
    for (const [group, label] of [['Workout length', '30 min'], ['Sore area', 'Back'], ['Workout style', 'Stations'], ['Equipment', 'Bodyweight only']]) {
      const radio = pick(group, label);
      expect(radio).toHaveAttribute('aria-checked', 'true');
      const checked = within(screen.getByRole('radiogroup', { name: group })).getAllByRole('radio', { checked: true });
      expect(checked).toEqual([radio]);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(todaysList().getByText(/30 min/)).toBeInTheDocument();
    expect(todaysList().getByText(/sets each/)).toBeInTheDocument();
  });

  it('Start opens the intro; Pause and Resume swap; Skip goes to the first move; End goes home', () => {
    render(<App />);
    const first = todaysList().getByText(/^Warm-up/); // the warm-up comes first
    expect(first).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }));
    expect(screen.getByText("Today's workout")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByText("Today's workout")).not.toBeInTheDocument();
    expect(screen.getByText('Warm-up', { selector: '.active-phase' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'End workout' }));
    expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument();
  });

  it('a quick second tap does not hit the next screen (Start → Skip, End → Start)', () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    render(<App />);
    now += 1000;
    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }), { detail: 1 }); // the same tap, again
    expect(screen.getByText("Today's workout")).toBeInTheDocument(); // still on the intro

    now += 1000;
    fireEvent.click(screen.getByRole('button', { name: 'End workout' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }), { detail: 1 });
    expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument(); // still home
  });
});

describe('App — the phone\'s Back button steps back inside the app', () => {
  const pressBack = () => history.back();

  it('closes an open sheet instead of leaving the app', async () => {
    render(<App />);
    openChange();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    pressBack();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument();
  });

  it('mid-workout: pauses and goes home, where Resume picks up the same spot', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Start workout' }));
    expect(screen.getByText("Today's workout")).toBeInTheDocument();
    pressBack();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Resume where you stopped/ }));
    expect(screen.getByText("Today's workout")).toBeInTheDocument();
  });

  it('closing a sheet with its own button gives the Back press back', async () => {
    render(<App />);
    const before = history.length;
    openChange();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(history.state).toBeNull()); // our extra entry is gone again
    expect(history.length).toBeGreaterThanOrEqual(before);
  });
});
