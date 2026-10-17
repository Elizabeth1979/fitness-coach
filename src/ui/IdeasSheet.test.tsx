import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdeasSheet } from './IdeasSheet';
import { addIdea, getIdeas } from '../storage/store';

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'share');
});

const box = () => screen.getByRole('textbox', { name: /what would make the app better/i });

describe('IdeasSheet', () => {
  it('saves an idea on this phone, clears the box and lists it', () => {
    render(<IdeasSheet onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save idea' })).toBeDisabled();
    fireEvent.change(box(), { target: { value: 'A 45-minute option' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save idea' }));
    expect(box()).toHaveValue('');
    expect(screen.getByText('A 45-minute option')).toBeInTheDocument();
    expect(getIdeas().map((i) => i.text)).toEqual(['A 45-minute option']);
  });

  it('starts in the text box so you can type right away', () => {
    render(<IdeasSheet onClose={vi.fn()} />);
    expect(box()).toHaveFocus();
  });

  it('deletes an idea', () => {
    addIdea('Keep me', '2026-10-17');
    addIdea('Drop me', '2026-10-17');
    render(<IdeasSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete idea: Drop me' }));
    expect(screen.queryByText('Drop me')).not.toBeInTheDocument();
    expect(getIdeas().map((i) => i.text)).toEqual(['Keep me']);
  });

  it('offers to share only once there is something to share', () => {
    render(<IdeasSheet onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /share|copy/i })).not.toBeInTheDocument();
  });

  it("uses the phone's share menu when it has one", async () => {
    const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    addIdea('A 45-minute option', '2026-10-17');
    render(<IdeasSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share ideas' }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Ideas for Move With Elli',
      text: 'Ideas for Move With Elli:\n- A 45-minute option (2026-10-17)',
    }));
  });

  it('copies the list when there is no share menu', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    addIdea('A 45-minute option', '2026-10-17');
    render(<IdeasSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy ideas' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/copied/i));
    expect(writeText).toHaveBeenCalledWith('Ideas for Move With Elli:\n- A 45-minute option (2026-10-17)');
  });

  it('shows the list as text to copy by hand when copying is blocked', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    addIdea('A 45-minute option', '2026-10-17');
    render(<IdeasSheet onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy ideas' }));
    expect(await screen.findByRole('textbox', { name: 'Your ideas as text' }))
      .toHaveValue('Ideas for Move With Elli:\n- A 45-minute option (2026-10-17)');
  });
});
