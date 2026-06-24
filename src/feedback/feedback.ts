import type { HapticKind } from '../domain/types';

export const HAPTIC_PATTERNS: Record<HapticKind, number[]> = {
  start: [180],            // one buzz: exercise starts
  rest: [120, 80, 120],    // two buzzes: rest
  next: [90, 60, 90, 60, 90], // three buzzes: new exercise
  countdown: [40],         // short tick: 5s remaining
};

// Earcon tones (Hz) per kind, for devices without vibration (iOS).
const EARCON_HZ: Record<HapticKind, number> = {
  start: 660, rest: 440, next: 550, countdown: 880,
};

export interface Feedback {
  fire(kind: HapticKind): void;
}

export class WebFeedback implements Feedback {
  private ctx: AudioContext | null = null;

  private canVibrate(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  fire(kind: HapticKind): void {
    if (this.canVibrate()) {
      navigator.vibrate(HAPTIC_PATTERNS[kind]);
      return;
    }
    this.earcon(kind);
  }

  private earcon(kind: HapticKind): void {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx ??= new Ctx();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = EARCON_HZ[kind];
      gain.gain.value = 0.08;
      osc.connect(gain).connect(this.ctx.destination);
      const t = this.ctx.currentTime;
      osc.start(t);
      osc.stop(t + 0.12);
    } catch { /* audio not available; silent */ }
  }
}

export class NullFeedback implements Feedback {
  fire(): void {}
}

export function createFeedback(): Feedback {
  return typeof navigator !== 'undefined' && typeof window !== 'undefined'
    ? new WebFeedback() : new NullFeedback();
}
