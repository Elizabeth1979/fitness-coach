import { describe, it, expect, vi } from 'vitest';
import { FakeClock } from './clock';

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
