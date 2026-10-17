export interface Clock {
  start(): void;
  stop(): void;
  onTick(cb: (dtSec: number) => void): void;
}

export class FakeClock implements Clock {
  private cb: ((dt: number) => void) | null = null;
  private running = false;
  onTick(cb: (dt: number) => void): void { this.cb = cb; }
  start(): void { this.running = true; }
  stop(): void { this.running = false; }
  tick(dtSec: number): void { if (this.running && this.cb) this.cb(dtSec); }
}

// Longest gap one frame may report. Browsers stop animation frames while the
// page is hidden (screen locked, another app in front); without this cap the
// whole time away would arrive as one giant tick that fires every remaining
// cue at once and cuts the move short. Time away is not workout time.
export const MAX_FRAME_SEC = 0.25;

export class RafClock implements Clock {
  private cb: ((dt: number) => void) | null = null;
  private raf = 0;
  private last = 0;
  onTick(cb: (dt: number) => void): void { this.cb = cb; }
  start(): void {
    this.last = performance.now();
    const loop = (now: number) => {
      // ≥ 0: the first frame's timestamp can be just before start() (it marks when the frame began).
      const dt = Math.max(0, Math.min((now - this.last) / 1000, MAX_FRAME_SEC));
      this.last = now;
      this.cb?.(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop(): void { cancelAnimationFrame(this.raf); }
}
