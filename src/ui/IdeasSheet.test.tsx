import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdeasSheet } from './IdeasSheet';
import { addIdea, getIdeas, markIdeaSent, unsentIdeas } from '../storage/store';
import { sendPendingIdeas } from '../ideas/send';

// Stand-in for the network: "online" marks everything sent, "offline" leaves it waiting.
let online = true;
vi.mock('../ideas/send', () => ({
  sendPendingIdeas: vi.fn(async () => {
    const waiting = unsentIdeas();
    if (!online) return waiting.length;
    for (const i of waiting) markIdeaSent(i.id);
    return 0;
  }),
}));

beforeEach(() => { localStorage.clear(); online = true; vi.mocked(sendPendingIdeas).mockClear(); });

const box = () => screen.getByRole('textbox', { name: /what would make the app better/i });
function send(text: string) {
  fireEvent.change(box(), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Send idea' }));
}

describe('IdeasSheet', () => {
  it('sends an idea, clears the box and lists it as sent', async () => {
    render(<IdeasSheet onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Send idea' })).toBeDisabled();
    send('A 45-minute option');
    expect(box()).toHaveValue('');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Sent'));
    expect(screen.getByText('A 45-minute option')).toBeInTheDocument();
    expect(screen.getByText(/· Sent$/)).toBeInTheDocument();
    expect(getIdeas()[0]).toMatchObject({ text: 'A 45-minute option', sent: true });
  });

  it('keeps an idea waiting when offline, and it can still be taken back', async () => {
    online = false;
    render(<IdeasSheet onClose={vi.fn()} />);
    send('Offline idea');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/back online/));
    expect(screen.getByText(/Waiting to send/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete idea: Offline idea' }));
    expect(screen.queryByText('Offline idea')).not.toBeInTheDocument();
    expect(getIdeas()).toEqual([]);
  });

  it('sends ideas left on the phone as soon as it opens', async () => {
    addIdea('Saved earlier', '2026-10-17');
    render(<IdeasSheet onClose={vi.fn()} />);
    expect(sendPendingIdeas).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText(/· Sent$/)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /delete idea/i })).not.toBeInTheDocument();
  });

  it('starts in the text box so you can type right away', () => {
    render(<IdeasSheet onClose={vi.fn()} />);
    expect(box()).toHaveFocus();
  });
});
