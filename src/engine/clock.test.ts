import { describe, it, expect, vi, afterEach } from 'vitest';
import { FakeClock, RafClock, MAX_FRAME_SEC } from './clock';

describe('FakeClock', () => {
  it('delivers ticks only while started', () => {
    const clock = new FakeClock();
    const cb = vi.fn();
    clock.onTick(cb);

    clock.tick(1);          // not started yet
    expect(cb).not.toHaveBeenCalled();

    clock.start();
    clock.tick(0.5);
    clock.tick(0.5);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(0.5);

    clock.stop();
    clock.tick(1);
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

describe('RafClock', () => {
  afterEach(() => vi.unstubAllGlobals());

  // Drives animation frames by hand: each frame() call runs the queued callback at `now` ms.
  function stubFrames(startMs: number) {
    let queued: FrameRequestCallback | null = null;
    vi.stubGlobal('performance', { now: () => startMs });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queued = cb; return 1; });
    vi.stubGlobal('cancelAnimationFrame', () => { queued = null; });
    return (nowMs: number) => { const cb = queued; queued = null; cb?.(nowMs); };
  }

  it('reports the real time between frames', () => {
    const frame = stubFrames(1000);
    const clock = new RafClock();
    const cb = vi.fn();
    clock.onTick(cb);
    clock.start();
    frame(1016);
    frame(1116);
    expect(cb.mock.calls.map(([dt]) => dt)).toEqual([0.016, 0.1]);
  });

  it('never runs time backwards: a first frame stamped before start() counts as 0', () => {
    // A frame's timestamp is when the frame began, which can be just before start() was called.
    const frame = stubFrames(1000);
    const clock = new RafClock();
    const cb = vi.fn();
    clock.onTick(cb);
    clock.start();
    frame(990);
    frame(1006);
    expect(cb.mock.calls.map(([dt]) => dt)).toEqual([0, 0.016]);
  });

  it('caps a long gap (page was hidden) instead of jumping ahead', () => {
    const frame = stubFrames(1000);
    const clock = new RafClock();
    const cb = vi.fn();
    clock.onTick(cb);
    clock.start();
    frame(61_000); // a minute with the screen locked
    expect(cb).toHaveBeenCalledWith(MAX_FRAME_SEC);
  });

  it('stops delivering ticks after stop()', () => {
    const frame = stubFrames(1000);
    const clock = new RafClock();
    const cb = vi.fn();
    clock.onTick(cb);
    clock.start();
    clock.stop();
    frame(1016);
    expect(cb).not.toHaveBeenCalled();
  });
});
