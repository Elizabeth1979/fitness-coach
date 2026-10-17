import type { Cue, Exercise, Segment } from '../domain/types';
import { phrases } from '../coach/phrases';
import { secsToSay } from '../coach/secsToSay';

// Changeovers: getting from one exercise to the next.
//
// Every exercise names the next move NEXT_UP_LEAD_SEC before it ends ("Next up:
// Plank."), then ends with a spoken "three… two… one…" so you know it's almost
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
/** During a move, the next one is named this long before the end (Elli: "about 10 seconds before"). */
export const NEXT_UP_LEAD_SEC = 10;
// An encouragement (≤ 8 words, ~3.2s — phrases.test.ts) is over this long before the heads-up.
const CHEER_CLEAR_SEC = 4;

const COUNT_WORDS = new Set([phrases.count(3), phrases.count(2), phrases.count(1)]);

/** Counts at dur-3, dur-2, dur-1, so "one" lands one second before the next segment starts. */
function countdownCues(durationSec: number): Cue[] {
  return [3, 2, 1].map((n) => ({ atSec: durationSec - n, say: phrases.count(n) }));
}

/**
 * Encouragement in every exercise: a third of the way through a short one (so
 * halfway stays free for "Switch sides."), about every 30s in a long one. Always
 * over before the "Next up" heads-up, which is over before the closing
 * "three-two-one" (speech can't overlap).
 */
export function encouragementCues(dur: number, cheer: () => string): Cue[] {
  const latest = dur - NEXT_UP_LEAD_SEC - CHEER_CLEAR_SEC;
  const times: number[] = [];
  if (dur < 60) times.push(Math.max(1, Math.min(Math.floor(dur / 3), latest)));
  else for (let t = 30; t <= latest; t += 30) times.push(t);
  return times.map((atSec) => ({ atSec, say: cheer() }));
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
const HEADS_UP = phrases.comingUp({ name: '|' }).split('|')[0]; // "Next up: " — what every heads-up starts with
const isHeadsUp = (c: Cue): boolean => !!c.say?.startsWith(HEADS_UP);

/**
 * The move that comes after the exercise at `i`, worth naming during it: none on a
 * left side (the switch comes next), between sets of the same move, or at the end.
 */
function nextMoveAfter(segments: Segment[], i: number): Exercise | undefined {
  const ahead = segments.slice(i + 1).find((s) => s.kind === 'work' || s.kind === 'switch' || s.kind === 'celebrate');
  return ahead?.kind === 'work' && ahead.exercise?.id !== segments[i].exercise?.id ? ahead.exercise : undefined;
}

const HALFWAY_WORDS = new Set([phrases.switchSides(), phrases.otherDirection()]);
const isHalfway = (c: Cue): boolean => !!c.say && HALFWAY_WORDS.has(c.say);

/** What a move that goes two ways says halfway — unless it's already split into left · switch · right. */
function halfwayLine(seg: Segment): string | undefined {
  if (seg.side || !seg.exercise) return undefined;
  return seg.exercise.unilateral ? phrases.switchSides() : seg.exercise.bothDirections ? phrases.otherDirection() : undefined;
}

/**
 * The second, closest to halfway, where `say` fits between the lines already
 * there: it starts once the line before has finished and ends a breath (1s)
 * before the next one. Undefined if a short move has no such gap.
 */
function quietMoment(cues: Cue[], durationSec: number, say: string): number | undefined {
  const spoken = cues.filter((c) => c.say);
  const fits = (t: number) => spoken.every((c) =>
    c.atSec < t ? c.atSec + secsToSay(c.say!) <= t : t + secsToSay(say) + 1 <= c.atSec);
  const mid = Math.floor(durationSec / 2);
  for (let d = 0; d <= 5; d++) {
    for (const t of d === 0 ? [mid] : [mid - d, mid + d]) if (t >= 1 && fits(t)) return t;
  }
  return undefined;
}

/** An exercise's cues with the heads-up, the halfway line and the closing countdown (re)applied, in time order. */
function exerciseCues(seg: Segment, upNext?: Exercise): Cue[] {
  const headsUp: Cue[] = upNext ? [{ atSec: seg.durationSec - NEXT_UP_LEAD_SEC, say: phrases.comingUp(upNext) }] : [];
  const cues = [...seg.cues.filter((c) => !isCount(c) && !isHeadsUp(c) && !isHalfway(c)), ...headsUp, ...countdownCues(seg.durationSec)];
  const half = halfwayLine(seg);
  const at = half ? quietMoment(cues, seg.durationSec, half) : undefined;
  if (half && at !== undefined) cues.push({ atSec: at, say: half, haptic: 'next' });
  return cues.sort((a, b) => a.atSec - b.atSec);
}

/** A segment's cues with the closing countdown (re)applied, in time order. */
function withClosingCount(seg: Segment): Cue[] {
  return [...seg.cues.filter((c) => !isCount(c)), ...countdownCues(seg.durationSec)]
    .sort((a, b) => a.atSec - b.atSec);
}

/**
 * Pure post-pass over a finished segment list (idempotent, so it can be re-run
 * after a swap): every exercise names the next move ~10s before it ends; one
 * that goes two ways (and isn't split into sides) says so halfway; every
 * exercise and switch-sides gap ends with the countdown; every rest names the
 * exercise that follows it; and a rest that leads straight into a move — with
 * no "get ready" in between — also ends with the countdown.
 */
export function annotateChangeovers(segments: Segment[], rounds: number): Segment[] {
  return segments.map((seg, i) => {
    if (seg.kind === 'work') return { ...seg, cues: exerciseCues(seg, nextMoveAfter(segments, i)) };
    if (seg.kind === 'switch') return { ...seg, cues: withClosingCount(seg) };
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
