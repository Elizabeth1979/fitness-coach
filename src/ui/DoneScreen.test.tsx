import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoneScreen } from './DoneScreen';

describe('DoneScreen', () => {
  it('lists practiced categories and a this-week strip', () => {
    render(<DoneScreen categories={['push', 'pull', 'mobility']} streak={2} workout={null} onHome={vi.fn()} />);
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('Pull')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });
});
