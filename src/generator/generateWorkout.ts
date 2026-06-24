import type {
  Cue, Equipment, Exercise, Focus, Segment, Workout, WorkoutKind,
} from '../domain/types';
import { selectExercises } from './selectExercises';
import { focusForDate } from './schedule';
import { createRng } from './rng';
import { phrases } from '../coach/phrases';

export interface GenerateOptions {
  kind: WorkoutKind;
  date: Date;
  equipment: Equipment[];
  recentExerciseIds?: string[];
  seed?: number;
}

export const TARGET_SECONDS: Record<Exclude<WorkoutKind, 'free'>, number> = {
  '10min': 600, '20min': 1200, '30min': 1800,
};

// How many circuit rounds each length runs. Longer workouts repeat the
// template rather than inventing ever more exercises.
const ROUNDS: Record<WorkoutKind, number> = { '10min': 1, '20min': 2, '30min': 3, free: 2 };

const CELEBRATE_SEC = 18;
const PREPARE_SEC = 4;
const MIN_WORK_SEC = 15;
const MAX_WORK_SEC = 120;

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

// One bout of work: a whole exercise, or one side of a unilateral one.
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

// Spread `drift` seconds across all work bouts (integer shares summing to
// ~drift) so the workout hits its target — never dumped into one giant rest.
function spreadDrift(units: Unit[], drift: number): void {
  if (units.length === 0) return;
  const per = drift / units.length;
  units.forEach((u, i) => {
    const share = Math.round(per * (i + 1)) - Math.round(per * i);
    u.dur = clamp(u.dur + share, MIN_WORK_SEC, MAX_WORK_SEC);
  });
}

function prepareSegment(ex: Exercise, isFirst: boolean, focus: Focus): Segment {
  const lead = isFirst
    ? `${phrases.welcome(focus)} ${phrases.exercise(ex.name)}`
    : phrases.next(ex.name);
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

export function generateWorkout(opts: GenerateOptions): Workout {
  const focus = focusForDate(opts.date);
  const seed = opts.seed ?? Math.floor(opts.date.getTime() / 86_400_000);
  const rng = createRng(seed);
  const recent = opts.recentExerciseIds ?? [];
  const target = targetFor(opts.kind);
  const rounds = ROUNDS[opts.kind];
  const rest = restSec(focus);

  // Assemble the exercise list: warmup once, then `rounds` circuits of the
  // template. Thread recent picks so later rounds vary.
  const items: Exercise[] = [];
  let recentAcc = [...recent];
  for (let r = 0; r < rounds; r++) {
    const sel = selectExercises({
      equipment: opts.equipment, recentExerciseIds: recentAcc, rng, includeWarmup: r === 0,
    });
    items.push(...sel);
    recentAcc = [...recentAcc, ...sel.map((e) => e.id)].slice(-12);
  }

  // Size each work bout so the whole workout lands on target.
  const units = buildUnits(items, focus);
  const fixed = items.length * PREPARE_SEC + items.length * rest + CELEBRATE_SEC;
  const baseWork = units.reduce((s, u) => s + u.dur, 0);
  spreadDrift(units, target - fixed - baseWork);

  // Lay out segments: prepare → work (×sides) → rest, per item.
  const segments: Segment[] = [];
  let cursor = 0;
  items.forEach((ex, i) => {
    segments.push(prepareSegment(ex, i === 0, focus));
    const sides = ex.unilateral ? 2 : 1;
    for (let s = 0; s < sides; s++) segments.push(workSegment(units[cursor++], rng));
    segments.push(restSegment(rest));
  });

  segments.push({
    kind: 'celebrate', durationSec: CELEBRATE_SEC,
    cues: [{ atSec: 0, say: phrases.celebrate(items.filter((e) => e.category !== 'warmup').map((e) => e.category)) }],
  });

  return { id: `w-${seed}-${opts.kind}`, kind: opts.kind, focus, segments };
}
