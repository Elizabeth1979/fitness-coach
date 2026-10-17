import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DoneScreen } from './DoneScreen';

describe('DoneScreen', () => {
  it('lists practiced categories and a this-week strip', () => {
    render(<DoneScreen categories={['push', 'pull', 'mobility']} streak={2} workout={null} onHome={vi.fn()} />);
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('Pull')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('asks how it felt: one tap, says what changes next time, and can be changed', () => {
    const onFeel = vi.fn();
    render(<DoneScreen categories={['push']} streak={1} workout={null} onHome={vi.fn()} onFeel={onFeel} />);
    const group = screen.getByRole('radiogroup', { name: 'How did that feel?' });
    fireEvent.click(within(group).getByRole('radio', { name: 'Too easy' }));
    expect(onFeel).toHaveBeenLastCalledWith('easy');
    expect(within(group).getByRole('radio', { name: 'Too easy' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/a little harder/);
    fireEvent.click(within(group).getByRole('radio', { name: 'Too hard' }));
    expect(onFeel).toHaveBeenLastCalledWith('hard');
    expect(screen.getByRole('status')).toHaveTextContent(/a little easier/);
  });

  it('opens the ideas sheet from "Note an idea"', () => {
    render(<DoneScreen categories={['push']} streak={1} workout={null} onHome={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /note an idea/i }));
    expect(screen.getByRole('dialog', { name: 'Your ideas' })).toBeInTheDocument();
  });
});
