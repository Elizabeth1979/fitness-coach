import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTapGuard, TAP_GUARD_MS } from './useTapGuard';

function Screen({ onTap }: { onTap: () => void }) {
  const guard = useTapGuard();
  return <main onClickCapture={guard}><button onClick={onTap}>Skip</button></main>;
}

describe('useTapGuard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('drops a tap that lands right after the screen appears (the tail of a double-tap)', () => {
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const onTap = vi.fn();
    render(<Screen onTap={onTap} />);
    now += TAP_GUARD_MS - 1;
    fireEvent.click(screen.getByRole('button'), { detail: 1 });
    expect(onTap).not.toHaveBeenCalled();
    now += 1;
    fireEvent.click(screen.getByRole('button'), { detail: 1 });
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('lets keyboard presses through at once', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const onTap = vi.fn();
    render(<Screen onTap={onTap} />);
    fireEvent.click(screen.getByRole('button'), { detail: 0 });
    expect(onTap).toHaveBeenCalledOnce();
  });
});
