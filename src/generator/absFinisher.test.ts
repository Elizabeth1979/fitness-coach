import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import type { Equipment, Workout } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const BW: Equipment[] = ['bodyweight'];
const WED = new Date('2026-06-24T08:00:00');

const coreSegs = (w: Workout) => w.segments.filter((s) => s.block === 'core');
const absSeconds = (w: Workout) => coreSegs(w).reduce((a, s) => a + s.durationSec, 0);

describe('abs finisher', () => {
  it('always ends with a core finisher, right before celebrate, for every kind & style', () => {
    for (const kind of ['10min', '20min', '30min'] as const) {
      for (const style of ['circuit', 'stations'] as const) {
        const w = generateWorkout({ kind, date: WED, equipment: ALL, seed: 3, style });
        const core = coreSegs(w);
        expect(core.length, `${kind}/${style}`).toBeGreaterThan(0);
        expect(core.every((s) => s.round === undefined)).toBe(true); // outside the numbered rounds
        // The core work bouts sit immediately before the celebrate segment.
        const lastWorkIdx = w.segments.map((s) => s.block).lastIndexOf('core');
        expect(w.segments[w.segments.length - 1].kind).toBe('celebrate');
        expect(lastWorkIdx).toBe(w.segments.length - 2);
        // Core work bouts carry the work haptics like any other.
        for (const s of core.filter((s) => s.kind === 'work')) {
          expect(s.cues.some((c) => c.atSec === 0 && c.haptic === 'start')).toBe(true);
          expect(s.cues.some((c) => c.haptic === 'countdown')).toBe(true);
        }
      }
    }
  });

  it('gives a roughly 2–3 min finisher (and never zero) even bodyweight-only', () => {
    for (const kind of ['10min', '20min', '30min'] as const) {
      const w = generateWorkout({ kind, date: WED, equipment: BW, seed: 7 });
      const abs = absSeconds(w);
      expect(abs, kind).toBeGreaterThanOrEqual(60);
      expect(abs, kind).toBeLessThanOrEqual(220);
      expect(coreSegs(w).every((s) => s.exercise === undefined || s.exercise.category === 'core')).toBe(true);
    }
  });

  it('rotates a different core move every 30 seconds', () => {
    const w = generateWorkout({ kind: '20min', date: WED, equipment: BW, seed: 7 });
    const bouts = coreSegs(w).filter((s) => s.kind === 'work');
    expect(bouts.length).toBeGreaterThanOrEqual(2);
    for (const b of bouts) expect(b.durationSec).toBe(30);          // fixed 30s bouts
    for (let i = 1; i < bouts.length; i++) {
      expect(bouts[i].exercise!.id).not.toBe(bouts[i - 1].exercise!.id); // switches each bout
    }
  });

  it('is deterministic', () => {
    const a = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 11 });
    const b = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 11 });
    expect(JSON.stringify(coreSegs(a))).toEqual(JSON.stringify(coreSegs(b)));
  });
});
