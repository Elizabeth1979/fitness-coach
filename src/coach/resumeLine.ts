import type { Segment } from '../domain/types';
import { phrases } from './phrases';
import { secsToSay } from './secsToSay';

/**
 * What the coach says on Resume. Pause cuts the coach off mid-sentence, so say
 * again what this part is about: a move's name and how-to, or what a rest (or
 * the intro) announced. Only if it ends before the next cue: speech queues, so
 * a late line would push the counts into a rushed burst.
 */
export function resumeLine(seg: Segment | null, elapsedSec: number): string | null {
  if (!seg) return null;
  const line = seg.exercise && seg.kind !== 'rest' && seg.kind !== 'roundrest'
    ? phrases.backTo(seg.exercise)
    : seg.cues.find((c) => c.atSec === 0)?.say;
  if (!line) return null;
  const nextAt = seg.cues.find((c) => c.say && c.atSec > elapsedSec)?.atSec ?? seg.durationSec;
  return secsToSay(line) <= nextAt - elapsedSec ? line : null;
}
