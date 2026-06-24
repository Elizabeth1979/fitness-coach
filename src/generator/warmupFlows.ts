import type { Category } from '../domain/types';
import { pick } from './rng';

export interface WarmupFlow {
  id: string;
  name: string;        // announced by the coach
  preps: Category[];   // body areas this flow prepares
  fun: boolean;        // novelty/adherence bump
  free: boolean;       // single free-movement segment
  moves: string[];     // ordered warm-up-move exercise ids
}

export const WARMUP_FLOWS: WarmupFlow[] = [
  { id: 'hip-flow', name: 'Hip Flow', preps: ['legs', 'hinge'], fun: false, free: false,
    moves: ['hip-circles', 'leg-swings', 'wu-deep-squat', 'cossack-shifts', 'marching'] },
  { id: 'shoulder-flow', name: 'Shoulder Flow', preps: ['push', 'pull'], fun: false, free: false,
    moves: ['arm-circles', 'scapular-circles', 'cat-cow', 'wall-slides', 'shoulder-cars'] },
  { id: 'animal-flow', name: 'Animal Flow', preps: ['crawl', 'core'], fun: false, free: false,
    moves: ['bear-hold', 'wrist-mobility', 'hip-shifts', 'cat-cow', 'spinal-waves'] },
  { id: 'dance-flow', name: 'Dance Flow', preps: ['balance', 'mobility'], fun: true, free: false,
    moves: ['step-touch', 'salsa-basic', 'hip-rotations', 'arm-flow', 'light-bouncing'] },
  { id: 'free-dance', name: 'Free Dance', preps: [], fun: true, free: true,
    moves: ['free-dance'] },
];

export interface PickWarmupOptions {
  workoutCategories: Category[];
  recentThemeIds: string[];
  rng: () => number;
}

// Lottery: avoid recent themes, then pick the highest-weighted flow (prep-match
// counts double; "fun" flows get a bump so Dance surfaces regularly), breaking
// ties with the seeded rng.
export function pickWarmupFlow(opts: PickWarmupOptions): WarmupFlow {
  const { workoutCategories, recentThemeIds, rng } = opts;
  const fresh = WARMUP_FLOWS.filter((f) => !recentThemeIds.includes(f.id));
  const poolFlows = fresh.length > 0 ? fresh : WARMUP_FLOWS;
  const cats = new Set(workoutCategories);
  const weight = (f: WarmupFlow): number =>
    1 + f.preps.filter((c) => cats.has(c)).length * 2 + (f.fun ? 2 : 0);
  const maxW = Math.max(...poolFlows.map(weight));
  const top = poolFlows.filter((f) => weight(f) === maxW);
  return pick(rng, top);
}
