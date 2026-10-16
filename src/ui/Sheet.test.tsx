import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sheet } from './Sheet';
import { MoveDetail } from './MoveDetail';
import { generateWorkout } from '../generator/generateWorkout';

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && (
        <Sheet label="Test sheet" onClose={() => { onClose(); setOpen(false); }}>
          <button>First</button>
          <button>Middle</button>
          <button>Last</button>
        </Sheet>
      )}
    </>
  );
}

function openSheet(onClose = vi.fn()) {
  render(<Harness onClose={onClose} />);
  const opener = screen.getByText('Open');
  opener.focus();
  fireEvent.click(opener);
  return { opener, onClose };
}

describe('Sheet', () => {
  it('is a labelled modal dialog and moves focus into it when it opens', () => {
    openSheet();
    expect(screen.getByRole('dialog', { name: 'Test sheet' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('First')).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the sheet', () => {
    openSheet();
    screen.getByText('Last').focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByText('First')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByText('Last')).toHaveFocus();
  });

  it('closes on Escape and hands focus back to what opened it', () => {
    const { opener, onClose } = openSheet();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes on a tap outside, but not on a tap inside', () => {
    const { onClose } = openSheet();
    fireEvent.click(screen.getByText('Middle'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('MoveDetail', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
  const prep = w.segments.findIndex((s) => s.kind === 'prepare' && s.round === 1);

  it('offers Swap when there is something to swap to', () => {
    render(<MoveDetail workout={w} prepareIndex={prep} onSwap={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /swap this move/i })).toBeInTheDocument();
  });

  it('hides Swap and says why when nothing else fits', () => {
    render(<MoveDetail workout={w} prepareIndex={prep} canSwap={false} onSwap={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /swap/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no other move like this fits today/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
  });
});
