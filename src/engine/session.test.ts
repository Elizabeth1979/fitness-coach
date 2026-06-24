import { describe, it, expect } from 'vitest';
import { WorkoutSession, type SessionEvent } from './session';
import { FakeClock } from './clock';
import type { Workout } from '../domain/types';

function makeWorkout(): Workout {
  return {
    id: 't', kind: '10min', focus: 'movement',
    segments: [
      { kind: 'work', durationSec: 10, cues: [
        { atSec: 0, say: 'Begin.', haptic: 'start' },
        { atSec: 5, haptic: 'countdown' },
      ] },
      { kind: 'rest', durationSec: 4, cues: [{ atSec: 0, say: 'Rest.', haptic: 'rest' }] },
      { kind: 'celebrate', durationSec: 2, cues: [{ atSec: 0, say: 'Great job.' }] },
    ],
  };
}

function run(): { clock: FakeClock; events: SessionEvent[]; session: WorkoutSession } {
  const clock = new FakeClock();
  const events: SessionEvent[] = [];
  const session = new WorkoutSession(makeWorkout(), clock, (e) => events.push(e));
  return { clock, events, session };
}

describe('WorkoutSession', () => {
  it('fires a cue at atSec=0 when a segment starts', () => {
    const { clock, events, session } = run();
    session.start();
    clock.tick(0.1);
    const cues = events.filter((e) => e.type === 'cue');
    expect(cues.some((c) => c.type === 'cue' && c.cue.haptic === 'start')).toBe(true);
  });

  it('fires each cue exactly once', () => {
    const clock = new FakeClock();
    const fired: number[] = [];
    const session = new WorkoutSession(makeWorkout(), clock, (e) => {
      if (e.type === 'cue') fired.push(e.cue.atSec);
    });
    session.start();
    for (let i = 0; i < 200; i++) clock.tick(0.1); // 20s, past the whole workout
    // cues: work(0,5) + rest(0) + celebrate(0) = 4 firings, none repeated
    expect(fired.filter((s) => s === 5).length).toBe(1);
    expect(fired.length).toBe(4);
  });

  it('advances segments and emits finished at the end', () => {
    const { clock, events, session } = run();
    session.start();
    for (let i = 0; i < 200; i++) clock.tick(0.1);
    expect(events.some((e) => e.type === 'finished')).toBe(true);
    expect(events.some((e) => e.type === 'finished' && e.completed === true)).toBe(true);
    expect(session.getState().status).toBe('done');
  });

  it('pause stops time advancing; resume continues', () => {
    const { clock, session } = run();
    session.start();
    clock.tick(2);
    session.pause();
    const remaining = session.getState().segmentRemainingSec;
    clock.tick(5);
    expect(session.getState().segmentRemainingSec).toBe(remaining);
    session.resume();
    clock.tick(1);
    expect(session.getState().segmentRemainingSec).toBeLessThan(remaining);
  });

  it('skip jumps to the next segment', () => {
    const { clock, events, session } = run();
    session.start();
    clock.tick(0.1);
    session.skip();
    clock.tick(0.1);
    const changes = events.filter((e) => e.type === 'segmentChanged');
    expect(changes.length).toBeGreaterThanOrEqual(2);
  });
});
