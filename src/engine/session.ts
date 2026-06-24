import type { Cue, Segment, Workout } from '../domain/types';
import type { Clock } from './clock';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'done';

export interface SessionState {
  status: SessionStatus;
  segmentIndex: number;
  segment: Segment | null;
  segmentRemainingSec: number;
}

export type SessionEvent =
  | { type: 'tick'; state: SessionState }
  | { type: 'segmentChanged'; index: number; segment: Segment }
  | { type: 'cue'; cue: Cue }
  | { type: 'finished'; completed: boolean };

export class WorkoutSession {
  private index = 0;
  private elapsedInSeg = 0;
  private cueCursor = 0;
  private sortedCues: Cue[] = [];
  private status: SessionStatus = 'idle';
  private readonly workout: Workout;
  private readonly clock: Clock;
  private readonly onEvent: (e: SessionEvent) => void;

  constructor(workout: Workout, clock: Clock, onEvent: (e: SessionEvent) => void) {
    this.workout = workout;
    this.clock = clock;
    this.onEvent = onEvent;
    this.clock.onTick((dt) => this.handleTick(dt));
  }

  getState(): SessionState {
    const segment = this.workout.segments[this.index] ?? null;
    return {
      status: this.status,
      segmentIndex: this.index,
      segment,
      segmentRemainingSec: segment ? Math.max(0, segment.durationSec - this.elapsedInSeg) : 0,
    };
  }

  start(): void {
    if (this.status !== 'idle') return;
    this.status = 'running';
    this.clock.start();
    this.enterSegment(0);
  }

  startAt(index: number, elapsedSec: number): void {
    if (this.status !== 'idle') return;
    this.status = 'running';
    this.clock.start();
    this.enterSegmentResumed(index, elapsedSec);
  }

  pause(): void { if (this.status === 'running') this.status = 'paused'; }
  resume(): void { if (this.status === 'paused') this.status = 'running'; }

  skip(): void {
    if (this.status === 'running' || this.status === 'paused') this.advance();
  }

  end(): void { this.finish(false); }

  private finish(completed: boolean): void {
    this.status = 'done';
    this.clock.stop();
    this.onEvent({ type: 'finished', completed });
  }

  private beginSegment(i: number, elapsedSec: number): void {
    this.index = i;
    this.elapsedInSeg = elapsedSec;
    this.cueCursor = 0;
    const segment = this.workout.segments[i];
    this.sortedCues = [...segment.cues].sort((a, b) => a.atSec - b.atSec);
    this.onEvent({ type: 'segmentChanged', index: i, segment });
  }

  private enterSegment(i: number): void {
    this.beginSegment(i, 0);
    this.fireDueCues();
    this.onEvent({ type: 'tick', state: this.getState() });
  }

  private enterSegmentResumed(i: number, elapsedSec: number): void {
    this.beginSegment(i, elapsedSec);
    // Suppress cues that already played before the resume point (do not replay them).
    while (this.cueCursor < this.sortedCues.length && this.sortedCues[this.cueCursor].atSec <= elapsedSec) {
      this.cueCursor++;
    }
    this.onEvent({ type: 'tick', state: this.getState() });
  }

  private advance(): void {
    const next = this.index + 1;
    if (next >= this.workout.segments.length) { this.finish(true); return; }
    this.enterSegment(next);
  }

  private fireDueCues(): void {
    while (this.cueCursor < this.sortedCues.length && this.elapsedInSeg >= this.sortedCues[this.cueCursor].atSec) {
      this.onEvent({ type: 'cue', cue: this.sortedCues[this.cueCursor] });
      this.cueCursor++;
    }
  }

  private handleTick(dtSec: number): void {
    if (this.status !== 'running') return;
    this.elapsedInSeg += dtSec;
    this.fireDueCues();
    const seg = this.workout.segments[this.index];
    if (this.elapsedInSeg >= seg.durationSec) { this.advance(); return; }
    this.onEvent({ type: 'tick', state: this.getState() });
  }
}
