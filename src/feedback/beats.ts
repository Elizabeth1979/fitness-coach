// Background percussion: synthesized drum grooves (no audio files) that play
// quietly under the coach's voice. Pure Web Audio — offline, tiny, license-free.
// It's drum grooves, not real recordings. The voice plays through the system TTS
// (a separate output), so we "duck" by lowering our own music gain while it speaks.

export type BeatStyle = 'cuban' | 'afrobeat';

export interface Beats {
  start(): void;
  stop(): void;
  setMuted(muted: boolean): void;
  duck(text: string): void;   // briefly lower the music while a line is spoken
  readonly available: boolean;
}

type Voice = 'kick' | 'congaLo' | 'congaHi' | 'clave' | 'shaker' | 'bell';
// One bar = 16 sixteenth-note steps. Each style maps a voice to the steps it hits.
type Pattern = Record<Voice, number[]>;

const PATTERNS: Record<BeatStyle, Pattern> = {
  // Son clave (3-2) + a tumbao-ish conga feel + steady shaker.
  cuban: {
    kick:    [0, 10],
    clave:   [0, 3, 6, 10, 12],
    congaLo: [4, 14],
    congaHi: [7, 11, 15],
    shaker:  [2, 6, 10, 14],
    bell:    [],
  },
  // Driving kick, agogô-style bell line, djembe-ish congas, busy shaker.
  afrobeat: {
    kick:    [0, 6, 8, 14],
    bell:    [0, 2, 3, 5, 7, 8, 11, 13],
    congaLo: [4, 12],
    congaHi: [2, 10, 15],
    shaker:  [0, 2, 4, 6, 8, 10, 12, 14],
    clave:   [],
  },
};

const BPM = 102;
const BG_GAIN = 0.16;       // background level under the voice
const DUCK_GAIN = 0.05;     // level while the coach is speaking
const BARS_PER_STYLE = 8;   // rotate Cuban ↔ Afrobeat every 8 bars ("mix")

function getAudioCtx(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null;
}

export class WebBeats implements Beats {
  readonly available: boolean;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private muted = false;
  private running = false;
  private step = 0;
  private bar = 0;
  private nextTime = 0;
  private duckUntil = 0;

  constructor() {
    this.available = getAudioCtx() !== null;
  }

  private ensure(): boolean {
    if (this.ctx) return true;
    const Ctx = getAudioCtx();
    if (!Ctx) return false;
    try {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : BG_GAIN;
      this.master.connect(this.ctx.destination);
      // a small reusable noise buffer for shaker/hat
      const len = Math.floor(this.ctx.sampleRate * 0.2);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch { return false; }
  }

  start(): void {
    if (this.running || !this.ensure() || !this.ctx) return;
    this.running = true;
    void this.ctx.resume();
    this.step = 0; this.bar = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    // Lookahead scheduler: queue notes ~120ms ahead on a 25ms timer.
    this.timer = setInterval(() => this.schedule(), 25);
  }

  stop(): void {
    this.running = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.master && this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0, t, 0.1);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(muted ? 0 : BG_GAIN, t, 0.05);
    }
  }

  duck(text: string): void {
    if (!this.ctx || !this.master || this.muted || !this.running) return;
    // Estimate the spoken length from the text so the music lifts back at the end.
    const ms = Math.min(4000, Math.max(700, text.length * 55));
    const t = this.ctx.currentTime;
    this.duckUntil = Math.max(this.duckUntil, t + ms / 1000);
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(DUCK_GAIN, t, 0.04);
    this.master.gain.setTargetAtTime(BG_GAIN, this.duckUntil, 0.25);
  }

  private currentStyle(): BeatStyle {
    return Math.floor(this.bar / BARS_PER_STYLE) % 2 === 0 ? 'cuban' : 'afrobeat';
  }

  private schedule(): void {
    if (!this.ctx || !this.running) return;
    const sixteenth = 60 / BPM / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      const pat = PATTERNS[this.currentStyle()];
      (Object.keys(pat) as Voice[]).forEach((v) => {
        if (pat[v].includes(this.step)) this.hit(v, this.nextTime, this.step);
      });
      this.nextTime += sixteenth;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar++;
    }
  }

  // --- drum voices (all wrapped so a failure never breaks the workout) ---
  private hit(voice: Voice, t: number, step: number): void {
    const ctx = this.ctx, out = this.master;
    if (!ctx || !out) return;
    try {
      const accent = step % 4 === 0 ? 1 : 0.7;
      switch (voice) {
        case 'kick': this.drum(t, 130, 42, 0.16, 0.9 * accent, 'sine'); break;
        case 'congaLo': this.drum(t, 240, 150, 0.14, 0.5 * accent, 'sine'); break;
        case 'congaHi': this.drum(t, 380, 250, 0.12, 0.45 * accent, 'triangle'); break;
        case 'clave': this.click(t, 1500, 0.045, 0.5 * accent); break;
        case 'bell': this.click(t, 720, 0.09, 0.32 * accent); break;
        case 'shaker': this.shake(t, 0.05, 0.22 * accent); break;
      }
    } catch { /* audio glitch; stay silent */ }
  }

  private drum(t: number, f0: number, f1: number, dur: number, gain: number, type: OscillatorType): void {
    const ctx = this.ctx!, out = this.master!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  private click(t: number, freq: number, dur: number, gain: number): void {
    const ctx = this.ctx!, out = this.master!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(out);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  private shake(t: number, dur: number, gain: number): void {
    const ctx = this.ctx!, out = this.master!;
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hp).connect(g).connect(out);
    src.start(t); src.stop(t + dur + 0.02);
  }
}

export class NullBeats implements Beats {
  readonly available = false;
  start(): void {}
  stop(): void {}
  setMuted(): void {}
  duck(): void {}
}

export function createBeats(): Beats {
  return getAudioCtx() ? new WebBeats() : new NullBeats();
}
