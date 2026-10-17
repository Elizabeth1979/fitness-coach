import { describe, it, expect } from 'vitest';
import { resumeLine } from './resumeLine';
import { phrases } from './phrases';
import type { Exercise, Segment } from '../domain/types';

// Pause cuts the coach off mid-sentence. On Resume the coach says again what
// this part is about, but only if it fits before the next line (speech queues).

const squat = { id: 'sq', name: 'Goblet Squat', cue: 'Goblet squat. Hold the weight at your chest, sit down between your heels.' } as Exercise;
const work: Segment = { kind: 'work', exercise: squat, durationSec: 40, cues: [{ atSec: 0, say: 'Go!' }, { atSec: 20, say: 'Nice and steady.' }, { atSec: 37, say: 'three' }] };
const rest: Segment = { kind: 'rest', durationSec: 15, cues: [{ atSec: 0, say: 'Rest. Take a deep breath. Next up: Goblet Squat.' }, { atSec: 12, say: 'three' }] };

describe('resumeLine', () => {
  it('during a move: its name and how to do it', () => {
    expect(resumeLine(work, 5)).toBe(phrases.backTo(squat));
  });

  it('during a rest: what it announced (the "Next up")', () => {
    expect(resumeLine(rest, 2)).toBe(rest.cues[0].say);
  });

  it('says nothing when the line would run into the next cue', () => {
    expect(resumeLine(work, 16)).toBeNull(); // 4s before "Nice and steady."
    expect(resumeLine(rest, 9)).toBeNull();  // 3s before the count
  });

  it('says nothing without a segment', () => {
    expect(resumeLine(null, 0)).toBeNull();
  });
});
