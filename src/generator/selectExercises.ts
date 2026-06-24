import type { Category, Equipment, Exercise } from '../domain/types';
import { EXERCISES, exercisesByCategory } from '../domain/exercises';
import { pick } from './rng';

// Fixed template (after warmup). "carry" slot may also draw from "crawl".
export const SLOTS: Category[] = ['push', 'pull', 'legs', 'hinge', 'carry', 'mobility'];

function hasEquipment(ex: Exercise, available: Equipment[]): boolean {
  return ex.equipment.every((eq) => available.includes(eq));
}

function candidatesFor(category: Category, available: Equipment[]): Exercise[] {
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
}

export function selectExercises(opts: SelectOptions): Exercise[] {
  const { equipment, recentExerciseIds, rng, includeWarmup } = opts;
  const used = new Set<string>();
  const out: Exercise[] = [];

  if (includeWarmup) {
    const warmup = choose(
      exercisesByCategory('warmup').filter((e) => hasEquipment(e, equipment)),
      recentExerciseIds, used, rng,
    );
    if (warmup) { out.push(warmup); used.add(warmup.id); }
  }

  for (const slot of SLOTS) {
    const chosen = choose(candidatesFor(slot, equipment), recentExerciseIds, used, rng);
    if (chosen) { out.push(chosen); used.add(chosen.id); }
  }

  return out;
}
