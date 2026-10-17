import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPendingIdeas, type SendIdea } from './send';
import { addIdea, getIdeas, loadStore } from '../storage/store';

const KEY = 'mwe.store.v1';
beforeEach(() => localStorage.clear());

const ok: SendIdea = vi.fn<SendIdea>().mockResolvedValue(true);

describe('sendPendingIdeas', () => {
  it('sends each unsent idea once and marks it sent', async () => {
    addIdea('A 45-minute option', '2026-10-17');
    addIdea('Music I can pick', '2026-10-17');
    const send = vi.fn<SendIdea>().mockResolvedValue(true);
    expect(await sendPendingIdeas(send)).toBe(0);
    expect(send).toHaveBeenCalledTimes(2);
    expect(getIdeas().every((i) => i.sent)).toBe(true);

    await sendPendingIdeas(send);
    expect(send).toHaveBeenCalledTimes(2); // nothing left to send
  });

  it('keeps an idea waiting when sending fails, and sends it next time with the same id', async () => {
    addIdea('Offline idea', '2026-10-17');
    const fail = vi.fn<SendIdea>().mockResolvedValue(false);
    expect(await sendPendingIdeas(fail)).toBe(1);
    expect(getIdeas()[0].sent).toBeFalsy();

    const send = vi.fn<SendIdea>().mockResolvedValue(true);
    await sendPendingIdeas(send);
    expect(send.mock.calls[0][0].id).toBe(fail.mock.calls[0][0].id);
    expect(getIdeas()[0].sent).toBe(true);
  });

  it('treats a crash while sending like a failure', async () => {
    addIdea('Idea', '2026-10-17');
    expect(await sendPendingIdeas(vi.fn<SendIdea>().mockRejectedValue(new TypeError('Failed to fetch')))).toBe(1);
  });

  it('gives ideas saved by the older version an id that sticks, then sends them', async () => {
    localStorage.setItem(KEY, JSON.stringify({ ideas: [{ text: 'Saved before syncing existed', date: '2026-10-17' }] }));
    const fail = vi.fn<SendIdea>().mockResolvedValue(false);
    await sendPendingIdeas(fail);
    const id = fail.mock.calls[0][0].id;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(loadStore().ideas?.[0].id).toBe(id);
    await sendPendingIdeas(ok);
    expect(getIdeas()[0]).toMatchObject({ id, text: 'Saved before syncing existed', sent: true });
  });

  it('does nothing (and loads nothing) when there is nothing to send', async () => {
    const send = vi.fn<SendIdea>();
    expect(await sendPendingIdeas(send)).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('takes turns, so two calls at once send each idea only once', async () => {
    addIdea('Idea', '2026-10-17');
    const send = vi.fn<SendIdea>().mockResolvedValue(true);
    await Promise.all([sendPendingIdeas(send), sendPendingIdeas(send)]);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
