import type {
  Cue, Equipment, Exercise, Focus, Segment, Workout, WorkoutKind,
} from '../domain/types';
import { selectExercises } from './selectExercises';
import { focusForDate } from './schedule';
import { createRng } from './rng';
import { phrases } from '../coach/phrases';
import { pickWarmupFlow, type WarmupFlow } from './warmupFlows';
import { exerciseById } from '../domain/exercises';

export interface GenerateOptions {
  kind: WorkoutKind;
  date: Date;
  equipment: Equipment[];
  recentExerciseIds?: string[];
  recentThemeIds?: string[];
  seed?: number;
}

export const TARGET_SECONDS: Record<Exclude<WorkoutKind, 'free'>, number> = {
  '10min': 600, '20min': 1200, '30min': 1800,
};

const ROUNDS: Record<WorkoutKind, number> = { '10min': 1, '20min': 2, '30min': 3, free: 2 };

const CELEBRATE_SEC = 18;
const PREPARE_SEC = 4;
const MIN_WORK_SEC = 15;
const MAX_WORK_SEC = 120;
const WARMUP_MOVE_SEC = 30;
const FREE_DANCE_SEC = 120;

function targetFor(kind: WorkoutKind): number {
  return kind === 'free' ? TARGET_SECONDS['20min'] : TARGET_SECONDS[kind];
}

function baseWorkSec(ex: Exercise, focus: Focus): number {
  if (ex.measure === 'time') return ex.defaultDurationSec ?? 30;
  const perRep = focus === 'strength' ? 3.5 : 3;
  return Math.round((ex.defaultReps ?? 8) * perRep);
}

function restSec(focus: Focus): number {
  return focus === 'strength' ? 30 : 20;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

interface Unit { ex: Exercise; side?: 'left' | 'right'; dur: number; }

function buildUnits(items: Exercise[], focus: Focus): Unit[] {
  const units: Unit[] = [];
  for (const ex of items) {
    const d = baseWorkSec(ex, focus);
    if (ex.unilateral) {
      units.push({ ex, side: 'left', dur: d });
      units.push({ ex, side: 'right', dur: d });
    } else {
      units.push({ ex, dur: d });
    }
  }
  return units;
}

// Spread `drift` seconds across all main work bouts so the workout hits target.
function spreadDrift(units: Unit[], drift: number): void {
  if (units.length === 0) return;
  const per = drift / units.length;
  units.forEach((u, i) => {
    const share = Math.round(per * (i + 1)) - Math.round(per * i);
    u.dur = clamp(u.dur + share, MIN_WORK_SEC, MAX_WORK_SEC);
  });
}

function prepareSegment(ex: Exercise, lead: string): Segment {
  const cues: Cue[] = [
    { atSec: 0, say: lead, haptic: 'next' },
    { atSec: 1, say: phrases.count(3) },
    { atSec: 2, say: phrases.count(2) },
    { atSec: 3, say: phrases.count(1) },
  ];
  return { kind: 'prepare', exercise: ex, durationSec: PREPARE_SEC, cues };
}

function workSegment(u: Unit, rng: () => number): Segment {
  const cues: Cue[] = [{ atSec: 0, say: phrases.begin(), haptic: 'start' }];
  if (u.dur >= 25) cues.push({ atSec: Math.floor(u.dur / 2), say: phrases.encourage(rng) });
  cues.push({ atSec: Math.max(1, u.dur - 5), haptic: 'countdown' });
  return { kind: 'work', exercise: u.ex, side: u.side, durationSec: u.dur, cues };
}

function restSegment(dur: number): Segment {
  return { kind: 'rest', durationSec: dur, cues: [{ atSec: 0, say: phrases.rest(), haptic: 'rest' }] };
}

// --- Warm-up flow rendering ---

function warmupMoveCount(target: number, flow: WarmupFlow): number {
  if (flow.free) return 1;
  const warmupTarget = clamp(Math.round(target * 0.15), 60, 180);
  return clamp(Math.round(warmupTarget / WARMUP_MOVE_SEC), 2, flow.moves.length);
}

// A warm-up move is a short, gentle work segment (start cue + a mid encouragement
// + a soft countdown). The first one carries the welcome + theme announcement.
function warmupSegment(ex: Exercise, dur: number, say: string, rng: () => number): Segment {
  const cues: Cue[] = [{ atSec: 0, say, haptic: 'start' }];
  if (dur >= 25) cues.push({ atSec: Math.floor(dur / 2), say: phrases.encourage(rng) });
  cues.push({ atSec: Math.max(1, dur - 5), haptic: 'countdown' });
  return { kind: 'work', exercise: ex, durationSec: dur, cues };
}

function buildWarmup(flow: WarmupFlow, focus: Focus, target: number, rng: () => number): Segment[] {
  const count = warmupMoveCount(target, flow);
  const moves = flow.moves.slice(0, count)
    .map((id) => exerciseById(id))
    .filter((e): e is Exercise => e !== undefined);
  const dur = flow.free ? FREE_DANCE_SEC : WARMUP_MOVE_SEC;
  const intro = `${phrases.welcome(focus)} ${phrases.warmupAnnounce(flow.name)}`;
  return moves.map((ex, i) => {
    const say = i === 0 ? `${intro} ${phrases.exercise(ex.name)}` : phrases.exercise(ex.name);
    return warmupSegment(ex, dur, say, rng);
  });
}

export function generateWorkout(opts: GenerateOptions): Workout {
  const focus = focusForDate(opts.date);
  const seed = opts.seed ?? Math.floor(opts.date.getTime() / 86_400_000);
  const rng = createRng(seed);
  const recent = opts.recentExerciseIds ?? [];
  const recentThemeIds = opts.recentThemeIds ?? [];
  const target = targetFor(opts.kind);
  const rounds = ROUNDS[opts.kind];
  const rest = restSec(focus);

  // Main exercises: `rounds` circuits of the 6-slot template (no warm-up here).
  const main: Exercise[] = [];
  let recentAcc = [...recent];
  for (let r = 0; r < rounds; r++) {
    const sel = selectExercises({
      equipment: opts.equipment, recentExerciseIds: recentAcc, rng, includeWarmup: false,
    });
    main.push(...sel);
    recentAcc = [...recentAcc, ...sel.map((e) => e.id)].slice(-12);
  }

  // Lottery: a warm-up flow that preps the day's work and avoids recent themes.
  const flow = pickWarmupFlow({ workoutCategories: main.map((e) => e.category), recentThemeIds, rng });
  const warmupSegs = buildWarmup(flow, focus, target, rng);
  const warmupTotal = warmupSegs.reduce((s, seg) => s + seg.durationSec, 0);

  // Size the MAIN work bouts so warm-up + main + celebrate ≈ target.
  const units = buildUnits(main, focus);
  const mainFixed = main.length * PREPARE_SEC + main.length * rest + CELEBRATE_SEC;
  const baseWork = units.reduce((s, u) => s + u.dur, 0);
  spreadDrift(units, target - warmupTotal - mainFixed - baseWork);

  const segments: Segment[] = [...warmupSegs];
  let cursor = 0;
  main.forEach((ex) => {
    segments.push(prepareSegment(ex, phrases.next(ex.name)));
    const sides = ex.unilateral ? 2 : 1;
    for (let s = 0; s < sides; s++) segments.push(workSegment(units[cursor++], rng));
    segments.push(restSegment(rest));
  });

  segments.push({
    kind: 'celebrate', durationSec: CELEBRATE_SEC,
    cues: [{ atSec: 0, say: phrases.celebrate(main.map((e) => e.category)) }],
  });

  return { id: `w-${seed}-${opts.kind}`, kind: opts.kind, focus, warmupThemeId: flow.id, segments };
}
