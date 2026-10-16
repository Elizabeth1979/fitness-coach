import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
