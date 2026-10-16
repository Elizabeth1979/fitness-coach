import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import { swapMove } from './swapMove';
import { createRng } from './rng';
import { phrases } from '../coach/phrases';
import type { Equipment, Segment, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';

// Changeovers: getting from one exercise to the next. Elli found them too fast:
// the next move was only announced 4s before it started, and "three-two-one"
// came out in a rushed burst (each count queued behind the still-speaking name).

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');
const COUNTS = [phrases.count(3), phrases.count(2), phrases.count(1)];

const build = (kind: WorkoutKind, style: WorkoutStyle, seed: number): Workout =>
  generateWorkout({ kind, date: WED, equipment: ALL, seed, style });

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

  it('every rest that leads into an exercise names it as the rest starts', () => {
    for (const [kind, style] of variants) {
      const segs = build(kind, style, 4).segments;
      segs.forEach((s, i) => {
        const next = segs[i + 1];
        if (!isRest(s) || !next?.exercise) return;
        expect(firstSay(s), `${kind}/${style} #${i}`).toContain(phrases.nextUp(next.exercise));
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

  it('gives about 20 seconds to get from one main exercise to the next', () => {
    for (const [kind, style] of variants) {
      const segs = build(kind, style, 4).segments;
      segs.forEach((s, i) => {
        if (s.kind !== 'prepare' || i === 0) return;
        // The time between the previous move ending and this one starting.
        let gap = s.durationSec;
        for (let j = i - 1; j >= 0 && segs[j].kind !== 'work'; j--) gap += segs[j].durationSec;
        expect(gap, `${kind}/${style} prepare #${i}`).toBeGreaterThanOrEqual(20);
      });
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

  it('after a swap, the rest before the swapped move announces the NEW move', () => {
    const w = build('20min', 'circuit', 4);
    const prepIdx = w.segments.findIndex((s) => s.kind === 'prepare' && s.round === 1);
    const w2 = swapMove(w, prepIdx, ALL, createRng(1));
    const newEx = w2.segments[prepIdx].exercise!;
    const oldName = w.segments[prepIdx].exercise!.name;
    const restBefore = w2.segments[prepIdx - 1];
    expect(isRest(restBefore)).toBe(true);
    expect(firstSay(restBefore)).toContain(phrases.nextUp(newEx));
    expect(firstSay(restBefore)).not.toContain(oldName);
  });

  it('no spoken line runs into the next one (speech queues, so overlap = a late, rushed count)', () => {
    const WORDS_PER_SEC = 2.5; // a deliberately slow estimate of the coach's speaking rate
    const secsToSay = (text: string) => text.split(/\s+/).filter(Boolean).length / WORDS_PER_SEC;
    for (const [kind, style] of variants) {
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const lines: { at: number; say: string; where: string }[] = [];
        let t0 = 0;
        for (const s of build(kind, style, seed).segments) {
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
});

