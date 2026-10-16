import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requestWakeLock, releaseWakeLock } from './wakeLock';

// A stand-in for the browser's WakeLockSentinel: release() fires 'release',
// and drop() simulates the browser releasing it when the page is hidden.
class FakeSentinel extends EventTarget {
  released = false;
  async release(): Promise<void> { this.drop(); }
  drop(): void {
    if (this.released) return;
    this.released = true;
    this.dispatchEvent(new Event('release'));
  }
}

let sentinels: FakeSentinel[];
let request: ReturnType<typeof vi.fn>;

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  sentinels = [];
  request = vi.fn(async () => { const s = new FakeSentinel(); sentinels.push(s); return s; });
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
});

afterEach(async () => {
  await releaseWakeLock();
  setVisibility('visible');
  Reflect.deleteProperty(navigator, 'wakeLock');
});

describe('wake lock', () => {
  it('takes the lock again after the browser drops it while hidden', async () => {
    await requestWakeLock();
    expect(request).toHaveBeenCalledTimes(1);

    setVisibility('hidden');
    sentinels[0].drop();          // the browser releases it
    setVisibility('visible');
    await flush();

    expect(request).toHaveBeenCalledTimes(2);
    expect(sentinels[1].released).toBe(false);
  });

  it('does not request twice while it still holds the lock', async () => {
    await requestWakeLock();
    setVisibility('visible');
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('stops re-taking the lock after release', async () => {
    await requestWakeLock();
    await releaseWakeLock();
    expect(sentinels[0].released).toBe(true);

    setVisibility('visible');
    await flush();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('lets go of a lock that arrives after release was asked for', async () => {
    const inFlight = requestWakeLock();
    await releaseWakeLock();
    await inFlight;
    expect(sentinels[0].released).toBe(true);
  });

  it('does nothing where wake lock is unsupported', async () => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    await expect(requestWakeLock()).resolves.toBeUndefined();
  });
});
