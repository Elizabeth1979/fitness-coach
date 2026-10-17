import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import { swapMove } from './swapMove';
import { NEXT_UP_LEAD_SEC, CHANGEOVER_SEC } from './changeover';
import { createRng } from './rng';
import { phrases } from '../coach/phrases';
import { secsToSay } from '../coach/secsToSay';
import type { Equipment, Segment, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';

// Changeovers: getting from one exercise to the next. Elli found them too fast:
// the next move was only announced 4s before it started, and "three-two-one"
// came out in a rushed burst (each count queued behind the still-speaking name).

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');
const COUNTS = [phrases.count(3), phrases.count(2), phrases.count(1)];

const build = (kind: WorkoutKind, style: WorkoutStyle, seed: number, level = 0): Workout =>
  generateWorkout({ kind, date: WED, equipment: ALL, seed, style, level });

const variants: [WorkoutKind, WorkoutStyle][] = [
  ['10min', 'circuit'], ['20min', 'circuit'], ['30min', 'circuit'],
  ['10min', 'stations'], ['20min', 'stations'], ['30min', 'stations'],
];

const isRest = (s: Segment) => s.kind === 'rest' || s.kind === 'roundrest';
const countCues = (s: Segment) => s.cues.filter((c) => c.say && COUNTS.includes(c.say));
const firstSay = (s: Segment) => s.cues.find((c) => c.atSec === 0)?.say ?? '';

describe('changeovers between exercises', () => {
  it('every prepare ends with a real one-per-second three-two-one, nothing spoken over it', () => {
    for (const [kind, style] of variants) {
      for (const p of build(kind, style, 4).segments.filter((s) => s.kind === 'prepare')) {
        const counts = countCues(p);
        expect(counts.map((c) => c.say)).toEqual(COUNTS);
        expect(counts.map((c) => c.atSec)).toEqual([p.durationSec - 3, p.durationSec - 2, p.durationSec - 1]);
        // Only a short heads-up may be spoken before the count, with ≥2s to finish.
        const before = p.cues.filter((c) => c.say && !COUNTS.includes(c.say));
        expect(before.every((c) => c.atSec <= p.durationSec - 5)).toBe(true);
      }
    }
  });

  it('every rest that leads straight into a move names it as the rest starts', () => {
    for (const [kind, style] of variants) {
      const segs = build(kind, style, 4).segments;
      segs.forEach((s, i) => {
        const next = segs[i + 1];
        if (!isRest(s) || next?.kind !== 'work' || !next.exercise) return;
        expect(firstSay(s), `${kind}/${style} #${i}`).toContain(phrases.nextUp(next.exercise, next.reps));
      });
    }
  });

  it('a rest that leads straight into a move (no prepare after it) ends with three-two-one', () => {
    for (const [kind, style] of variants) {
      const segs = build(kind, style, 4).segments;
      segs.forEach((s, i) => {
        if (!isRest(s) || segs[i + 1]?.kind !== 'work') return;
        const counts = countCues(s);
        expect(counts.map((c) => c.atSec), `${kind}/${style} #${i}`).toEqual([s.durationSec - 3, s.durationSec - 2, s.durationSec - 1]);
      });
    }
  });

  it('every exercise ends with three-two-one, so you know it is almost done', () => {
    for (const [kind, style] of variants) {
      for (const s of build(kind, style, 4).segments.filter((x) => x.kind === 'work')) {
        const counts = countCues(s);
        expect(counts.map((c) => c.atSec), `${kind}/${style} ${s.exercise?.name}`).toEqual([s.durationSec - 3, s.durationSec - 2, s.durationSec - 1]);
        // Nothing else is spoken in the 2s before the count (it would delay "three").
        const crowding = s.cues.filter((c) => c.say && !COUNTS.includes(c.say) && c.atSec > s.durationSec - 5);
        expect(crowding, `${kind}/${style} ${s.exercise?.name}`).toEqual([]);
      }
    }
  });

  it('every exercise gets encouragement, without repeating a line until the list runs out', () => {
    const cheers = new Set(phrases.encouragements);
    for (const [kind, style] of variants) {
      const said: string[] = [];
      for (const s of build(kind, style, 4).segments.filter((x) => x.kind === 'work')) {
        const mine = s.cues.filter((c) => c.say && cheers.has(c.say));
        expect(mine.length, `${kind}/${style} ${s.exercise?.name} (${s.durationSec}s)`).toBeGreaterThanOrEqual(1);
        said.push(...mine.map((c) => c.say!));
      }
      const firstRun = said.slice(0, phrases.encouragements.length);
      expect(new Set(firstRun).size, `${kind}/${style}`).toBe(firstRun.length);
    }
  });

  it('one-sided moves get a "switch sides" gap with a countdown between left and right', () => {
    let switches = 0;
    for (const [kind, style] of variants) {
      for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const segs = build(kind, style, seed).segments;
        segs.forEach((s, i) => {
          if (s.kind !== 'work' || s.side !== 'left') return;
          const gap = segs[i + 1];
          const right = segs[i + 2];
          const where = `${kind}/${style}/seed${seed} ${s.exercise?.name}`;
          expect(gap?.kind, where).toBe('switch');
          expect(gap.exercise?.id, where).toBe(s.exercise?.id);
          expect(gap.durationSec, where).toBeGreaterThanOrEqual(8);
          expect(firstSay(gap), where).toBe(phrases.switchSides());
          expect(countCues(gap).map((c) => c.atSec), where).toEqual([gap.durationSec - 3, gap.durationSec - 2, gap.durationSec - 1]);
          expect(right?.kind === 'work' && right.side === 'right', where).toBe(true);
          switches++;
        });
      }
    }
    expect(switches).toBeGreaterThan(0); // the library has one-sided moves, so some workouts use them
  });

  // Elli (#18): "Rest, Next up" and then a separate "Get ready" screen was one screen too many.
  // Research (README "The research behind it"): 15–30s between circuit moves; she chose 15s.
  it('between moves there is ONE 15-second screen: it names the move, then three-two-one', () => {
    let changeovers = 0;
    for (const [kind, style] of variants) {
      for (const seed of [1, 2, 3, 4]) {
        const segs = build(kind, style, seed).segments;
        segs.forEach((s, i) => {
          if (s.kind !== 'prepare') return;
          const where = `${kind}/${style}/seed${seed} prepare #${i}`;
          expect(s.durationSec, where).toBe(CHANGEOVER_SEC);
          expect(segs[i - 1]?.kind, where).not.toBe('rest'); // no second rest screen in front of it
          expect(firstSay(s), where).toContain(phrases.nextUp(s.exercise!, segs[i + 1]?.reps));
          changeovers++;
        });
      }
    }
    expect(changeovers).toBeGreaterThan(0);
    expect(CHANGEOVER_SEC).toBe(15);
  });

  it('a round break leaves "next up" to the changeover after it, which opens with the new round', () => {
    const segs = build('20min', 'circuit', 4).segments;
    const rr = segs.findIndex((s) => s.kind === 'roundrest');
    expect(firstSay(segs[rr])).not.toContain('Next up');
    expect(segs[rr + 1].kind).toBe('prepare');
    expect(firstSay(segs[rr + 1])).toMatch(/^Round 2\./);
  });

  // Elli (#21): "it says next flutter kicks, but it's not clear we move to the core section.
  // Only when it starts does it say core finisher — a backward announcement."
  it('the core finisher is announced in the rest before it, not once it has started', () => {
    for (const [kind, style] of variants) {
      const segs = build(kind, style, 4).segments;
      const first = segs.findIndex((s) => s.block === 'core');
      if (first < 0) continue;
      expect(segs[first].kind, `${kind}/${style}`).toBe('rest');
      expect(firstSay(segs[first]), `${kind}/${style}`).toContain(phrases.coreAhead());
      expect(firstSay(segs[first + 1]), `${kind}/${style}`).toBe(phrases.begin());
      expect(segs.filter((s) => s.block === 'core' && firstSay(s).includes(phrases.coreAhead())), `${kind}/${style}`).toHaveLength(1);
    }
  });

  it('cues within every segment are in time order (the engine plays them in order)', () => {
    for (const [kind, style] of variants) {
      for (const s of build(kind, style, 4).segments) {
        const t = s.cues.map((c) => c.atSec);
        expect(t).toEqual([...t].sort((a, b) => a - b));
      }
    }
  });

  it('after a swap, the changeover before the swapped move announces the NEW move', () => {
    const w = build('20min', 'circuit', 4);
    const prepIdx = w.segments.findIndex((s) => s.kind === 'prepare' && s.round === 1);
    const w2 = swapMove(w, prepIdx, ALL, createRng(1));
    const newEx = w2.segments[prepIdx].exercise!;
    const oldName = w.segments[prepIdx].exercise!.name;
    expect(firstSay(w2.segments[prepIdx])).toContain(phrases.nextUp(newEx, w2.segments[prepIdx + 1].reps));
    expect(firstSay(w2.segments[prepIdx])).not.toContain(oldName);
  });

  // Elli (#13): "the next exercise was not announced" — she wants to hear it during the move,
  // before its closing three-two-one, not only once the rest has begun.
  it('every move names the next one about 10s before it ends (not a left side, not the same move again)', () => {
    let named = 0;
    for (const [kind, style] of variants) {
      for (const seed of [1, 2, 3, 4]) {
        const segs = build(kind, style, seed).segments;
        segs.forEach((s, i) => {
          if (s.kind !== 'work') return;
          const ahead = segs.slice(i + 1).find((x) => x.kind === 'work' || x.kind === 'switch' || x.kind === 'celebrate');
          const nextMove = ahead?.kind === 'work' && ahead.exercise?.id !== s.exercise?.id ? ahead.exercise : undefined;
          const headsUp = s.cues.filter((c) => c.say?.startsWith('Next up'));
          const where = `${kind}/${style}/seed${seed} #${i} ${s.exercise?.name} (${s.durationSec}s)`;
          if (!nextMove) { expect(headsUp, where).toEqual([]); return; }
          expect(headsUp, where).toEqual([{ atSec: s.durationSec - NEXT_UP_LEAD_SEC, say: phrases.comingUp(nextMove) }]);
          named++;
        });
      }
    }
    expect(named).toBeGreaterThan(0);
    expect(NEXT_UP_LEAD_SEC).toBe(10);
  });

  it('after a swap, the move before the swapped one names the NEW move', () => {
    const w = build('20min', 'circuit', 4);
    const prepIdx = w.segments.findIndex((s, i) => i > 0 && s.kind === 'prepare' && s.round === 1 && w.segments[i - 1]?.kind === 'work');
    const w2 = swapMove(w, prepIdx, ALL, createRng(1));
    const before = w2.segments[prepIdx - 1];
    expect(before.cues.find((c) => c.say?.startsWith('Next up'))?.say).toBe(phrases.comingUp(w2.segments[prepIdx].exercise!));
    // Re-annotating never stacks a second heads-up.
    expect(before.cues.filter((c) => c.say?.startsWith('Next up'))).toHaveLength(1);
  });

  it('no spoken line runs into the next one (speech queues, so overlap = a late, rushed count)', () => {
    for (const [kind, style] of variants) {
      for (const [seed, level] of [[1, 0], [2, 0], [3, 0], [4, 0], [5, -2], [6, 3]]) {
        const lines: { at: number; say: string; where: string }[] = [];
        let t0 = 0;
        for (const s of build(kind, style, seed, level).segments) {
          for (const c of s.cues) if (c.say) lines.push({ at: t0 + c.atSec, say: c.say, where: `${s.kind} ${s.exercise?.name ?? ''}` });
          t0 += s.durationSec;
        }
        lines.sort((a, b) => a.at - b.at);
        for (let i = 0; i + 1 < lines.length; i++) {
          const gap = lines[i + 1].at - lines[i].at;
          expect(secsToSay(lines[i].say), `${kind}/${style}/seed${seed} at ${lines[i].at}s (${lines[i].where}): "${lines[i].say}" → next line ${gap}s later: "${lines[i + 1].say}"`)
            .toBeLessThanOrEqual(gap);
        }
      }
    }
  });

  it('a counted move is announced as "as many as you can, up to N" — a goal, not a test (Elli #16)', () => {
    let counted = 0;
    for (const [kind, style] of variants) {
      const segs = build(kind, style, 4).segments;
      segs.forEach((s, i) => {
        const next = segs[i + 1];
        if (s.kind !== 'prepare' || next?.kind !== 'work') return;
        expect(firstSay(s), `${kind}/${style} ${s.exercise?.name}`).toContain(phrases.nextUp(s.exercise!, next.reps));
        if (next.reps) { expect(firstSay(s)).toContain(`as many as you can, up to ${next.reps}`); counted++; }
      });
    }
    expect(counted).toBeGreaterThan(0);
  });
});
