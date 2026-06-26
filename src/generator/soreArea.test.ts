import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import { AVOID_FOR_SORE, slotsForSore, SLOTS } from './selectExercises';
import type { Equipment, SoreArea, Workout } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00');
const TUE = new Date('2026-06-23T08:00:00');

const circuitCats = (w: Workout) =>
  w.segments.filter((s) => s.kind === 'prepare' && s.exercise && s.round === 1).map((s) => s.exercise!.category);
const total = (w: Workout) => w.segments.reduce((a, s) => a + s.durationSec, 0);

describe('slotsForSore', () => {
  it('keeps the base when nothing is sore', () => {
    expect(slotsForSore(SLOTS, 'none')).toEqual(SLOTS);
  });
  it('drops avoided categories and keeps the same width', () => {
    for (const sore of ['shoulders', 'back', 'legs'] as const) {
      const slots = slotsForSore(SLOTS, sore);
      expect(slots.length).toBe(SLOTS.length);
      for (const avoided of AVOID_FOR_SORE[sore]) expect(slots).not.toContain(avoided);
    }
  });
});

describe('generateWorkout — sore area', () => {
  it('never programs a move from the sore area, and emphasises the rest', () => {
    for (const sore of ['shoulders', 'back', 'legs'] as const) {
      const w = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 5, sore });
      const cats = circuitCats(w);
      for (const avoided of AVOID_FOR_SORE[sore]) {
        expect(cats, `${sore} should avoid ${avoided}`).not.toContain(avoided);
      }
      expect(cats.length).toBe(SLOTS.length); // still a full circuit
    }
  });

  it('is deterministic', () => {
    const a = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 9, sore: 'shoulders' });
    const b = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 9, sore: 'shoulders' });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('stays within 45s of target for every sore area, kind, style and focus', () => {
    const T = { '10min': 600, '20min': 1200, '30min': 1800 } as const;
    for (const kind of ['10min', '20min', '30min'] as const) {
      for (const style of ['circuit', 'stations'] as const) {
        for (const sore of ['none', 'shoulders', 'back', 'legs'] as SoreArea[]) {
          for (const date of [WED, TUE]) {
            for (let seed = 0; seed <= 40; seed++) {
              const got = total(generateWorkout({ kind, date, equipment: ALL, seed, style, sore }));
              expect(Math.abs(got - T[kind]), `${kind}/${style}/${sore}/seed${seed} → ${got}`).toBeLessThanOrEqual(45);
            }
          }
        }
      }
    }
  });
});
