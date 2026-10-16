import type { Cue, Exercise, Segment } from '../domain/types';
import { phrases } from '../coach/phrases';

// Changeovers: getting from one exercise to the next.
//
// Every exercise ends with a spoken "three… two… one…" so you know it's almost
// done.
//
// A changeover is a rest (CHANGE_REST_SEC) that names what's coming the moment
// it starts — so the whole rest is time to walk over and get into position —
// followed, before a new exercise, by a short "get ready" (PREPARE_SEC) that
// ends in a real one-per-second "three… two… one…", then "Go!".
//
// Counting matters: speech can't overlap, so any cue spoken while a longer line
// is still playing queues up and fires late. Every count therefore sits in a
// quiet window — nothing long is ever scheduled less than 2s before it.

export const PREPARE_SEC = 5;
export const CHANGE_REST_SEC = 15;
/** Between the left and right side of a one-sided move: "Switch sides." … three, two, one. */
export const SWITCH_SEC = 10;

const COUNT_WORDS = new Set([phrases.count(3), phrases.count(2), phrases.count(1)]);

/** Counts at dur-3, dur-2, dur-1, so "one" lands one second before the next segment starts. */
function countdownCues(durationSec: number): Cue[] {
  return [3, 2, 1].map((n) => ({ atSec: durationSec - n, say: phrases.count(n) }));
}

/**
 * Encouragement in every exercise: halfway through a short one, about every 30s
 * in a long one. Never later than 6s before the end, so a line has finished
 * before the closing "three-two-one" (speech can't overlap).
 */
export function encouragementCues(dur: number, cheer: () => string): Cue[] {
  const latest = dur - 6;
  const times: number[] = [];
  if (dur < 60) times.push(Math.floor(dur / 2));
  else for (let t = 30; t <= latest; t += 30) times.push(t);
  return times.filter((t) => t >= 1 && t <= latest).map((atSec) => ({ atSec, say: cheer() }));
}

/** An exercise's own cues: "Go!", then encouragement. (The closing count comes from annotateChangeovers.) */
export function workCues(dur: number, cheer: () => string): Cue[] {
  return [{ atSec: 0, say: phrases.begin(), haptic: 'start' }, ...encouragementCues(dur, cheer)];
}

/** The gap between the left and right side of a one-sided move. */
export function switchSegment(ex: Exercise, round?: number): Segment {
  return { kind: 'switch', exercise: ex, durationSec: SWITCH_SEC, round, cues: [{ atSec: 0, say: phrases.switchSides(), haptic: 'next' }] };
}

/** The "get ready" beat right before an exercise: a short heads-up, then a clean count. */
export function prepareCues(): Cue[] {
  return [{ atSec: 0, say: phrases.getReady(), haptic: 'next' }, ...countdownCues(PREPARE_SEC)];
}

const isCount = (c: Cue): boolean => !!c.say && COUNT_WORDS.has(c.say);

/** A segment's cues with the closing countdown (re)applied, in time order. */
function withClosingCount(seg: Segment): Cue[] {
  return [...seg.cues.filter((c) => !isCount(c)), ...countdownCues(seg.durationSec)]
    .sort((a, b) => a.atSec - b.atSec);
}

/**
 * Pure post-pass over a finished segment list (idempotent, so it can be re-run
 * after a swap): every exercise and switch-sides gap ends with the countdown; every rest names the
 * exercise that follows it; and a rest that leads straight into a move — with
 * no "get ready" in between — also ends with the countdown.
 */
export function annotateChangeovers(segments: Segment[], rounds: number): Segment[] {
  return segments.map((seg, i) => {
    if (seg.kind === 'work' || seg.kind === 'switch') return { ...seg, cues: withClosingCount(seg) };
    if (seg.kind !== 'rest' && seg.kind !== 'roundrest') return seg;
    const next = segments[i + 1];
    const upNext = next && (next.kind === 'prepare' || next.kind === 'work') ? next.exercise : undefined;
    const base = seg.kind === 'roundrest' ? phrases.roundComplete(seg.round ?? 1, rounds) : phrases.rest();
    const opening: Cue = {
      atSec: 0,
      say: upNext ? `${base} ${phrases.nextUp(upNext)}` : base,
      haptic: seg.cues.find((c) => c.atSec === 0)?.haptic ?? 'rest',
    };
    const kept = seg.cues.filter((c) => c.atSec !== 0 && !isCount(c));
    const counts = next?.kind === 'work' ? countdownCues(seg.durationSec) : [];
    const cues = [opening, ...kept, ...counts].sort((a, b) => a.atSec - b.atSec);
    return { ...seg, cues };
  });
}
