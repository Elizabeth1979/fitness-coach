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

export class RafClock implements Clock {
  private cb: ((dt: number) => void) | null = null;
  private raf = 0;
  private last = 0;
  onTick(cb: (dt: number) => void): void { this.cb = cb; }
  start(): void {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = (now - this.last) / 1000;
      this.last = now;
      this.cb?.(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop(): void { cancelAnimationFrame(this.raf); }
}
