import type { Category, Equipment, Exercise, SoreArea } from '../domain/types';
import { EXERCISES, exercisesByCategory } from '../domain/exercises';
import { pick } from './rng';

// Fixed template (after warmup). "carry" slot may also draw from "crawl".
export const SLOTS: Category[] = ['push', 'pull', 'legs', 'hinge', 'carry', 'mobility'];
// The short (10-min) session trims to a focused trio so each move still gets ≥3
// sets in the budget. push/pull are never unilateral, so the time math is stable.
export const SLOTS_SHORT: Category[] = ['push', 'pull', 'legs'];

// When an area is sore, drop the categories that load it; the freed slots are
// backfilled with the rest (so e.g. a sore shoulder shifts the day toward legs).
export const AVOID_FOR_SORE: Record<SoreArea, Category[]> = {
  none: [],
  shoulders: ['push', 'pull'],
  back: ['hinge', 'pull'],
  legs: ['legs', 'hinge'],
};
// Backfill priority for the freed slots — lower body first, to emphasise it.
const EMPHASIS_ORDER: Category[] = ['legs', 'hinge', 'push', 'pull', 'carry', 'crawl', 'mobility'];

// Given a base slot template and a sore area, return a same-width slot list with
// the avoided categories removed and the gaps refilled from EMPHASIS_ORDER
// (new categories first, then repeats — repeats just pick a different exercise).
export function slotsForSore(base: Category[], sore: SoreArea): Category[] {
  const avoid = AVOID_FOR_SORE[sore];
  if (avoid.length === 0) return base;
  const out = base.filter((s) => !avoid.includes(s));
  const prefs = EMPHASIS_ORDER.filter((c) => !avoid.includes(c));
  for (const c of prefs) { if (out.length >= base.length) break; if (!out.includes(c)) out.push(c); }
  for (let i = 0; out.length < base.length && prefs.length > 0; i = (i + 1) % prefs.length) out.push(prefs[i]);
  return out;
}

function hasEquipment(ex: Exercise, available: Equipment[]): boolean {
  return ex.equipment.every((eq) => available.includes(eq));
}

export function candidatesFor(category: Category, available: Equipment[]): Exercise[] {
  const cats: Category[] = category === 'carry' ? ['carry', 'crawl'] : [category];
  return EXERCISES.filter((e) => cats.includes(e.category) && hasEquipment(e, available));
}

function choose(
  pool: Exercise[],
  recent: string[],
  used: Set<string>,
  rng: () => number,
): Exercise | null {
  const free = pool.filter((e) => !used.has(e.id));
  if (free.length === 0) return null;
  const fresh = free.filter((e) => !recent.includes(e.id));
  return pick(rng, fresh.length > 0 ? fresh : free);
}

export interface SelectOptions {
  equipment: Equipment[];
  recentExerciseIds: string[];
  rng: () => number;
  includeWarmup: boolean;
  slots?: Category[];
}

export function selectExercises(opts: SelectOptions): Exercise[] {
  const { equipment, recentExerciseIds, rng, includeWarmup } = opts;
  const slots = opts.slots ?? SLOTS;
  const used = new Set<string>();
  const out: Exercise[] = [];

  if (includeWarmup) {
    const warmup = choose(
      exercisesByCategory('warmup').filter((e) => hasEquipment(e, equipment)),
      recentExerciseIds, used, rng,
    );
    if (warmup) { out.push(warmup); used.add(warmup.id); }
  }

  for (const slot of slots) {
    const chosen = choose(candidatesFor(slot, equipment), recentExerciseIds, used, rng);
    if (chosen) { out.push(chosen); used.add(chosen.id); }
  }

  return out;
}
