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

// How many times the circuit repeats. The SAME six exercises every round.
const ROUNDS: Record<WorkoutKind, number> = { '10min': 2, '20min': 3, '30min': 5, free: 3 };

const CELEBRATE_SEC = 18;
const PREPARE_SEC = 4;
const MIN_WORK_SEC = 15;
const MAX_WORK_SEC = 120;
const WARMUP_MOVE_SEC = 30;
// Brief catch-your-breath rest between exercises within a round. The real
// recovery is the longer round-rest; keeping this short is what lets a 10-min
// two-round circuit fit its budget (12 short rests would otherwise dominate).
const SHORT_REST_SEC = 15;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function targetFor(kind: WorkoutKind): number {
  return kind === 'free' ? TARGET_SECONDS['20min'] : TARGET_SECONDS[kind];
}

// The substantial rest between rounds; strength rests a touch longer.
function roundRestSec(focus: Focus): number {
  return focus === 'strength' ? 35 : 30;
}

// Free-dance warm-up, capped so a 2-minute dance can't blow a short (10-min) budget.
function freeDanceSec(target: number): number {
  return clamp(Math.round(target * 0.15), 90, 120);
}

function baseWorkSec(ex: Exercise, focus: Focus): number {
  if (ex.measure === 'time') return ex.defaultDurationSec ?? 30;
  const perRep = focus === 'strength' ? 3.5 : 3;
  return Math.round((ex.defaultReps ?? 8) * perRep);
}

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

// Spread `drift` seconds across ONE circuit's work bouts so each round hits its budget.
// Two-pass: first proportional, then redistribute any unabsorbed remainder to units
// that still have room (handles the case where many units are clamped at MIN_WORK_SEC).
function spreadDrift(units: Unit[], drift: number): void {
  if (units.length === 0) return;
  const per = drift / units.length;
  let unabsorbed = 0;
  units.forEach((u, i) => {
    const share = Math.round(per * (i + 1)) - Math.round(per * i);
    const before = u.dur;
    u.dur = clamp(u.dur + share, MIN_WORK_SEC, MAX_WORK_SEC);
    // Track how much of the intended share could not be applied due to clamping.
    // A negative value means we still need to reduce by more; positive means add more.
    unabsorbed += share - (u.dur - before);
  });
  if (Math.abs(unabsorbed) < 1) return;
  // Redistribute the leftover to units that still have room.
  const eligible = units.filter((u) =>
    unabsorbed < 0 ? u.dur > MIN_WORK_SEC : u.dur < MAX_WORK_SEC,
  );
  if (eligible.length === 0) return;
  const extra = unabsorbed / eligible.length;
  eligible.forEach((u, i) => {
    const share = Math.round(extra * (i + 1)) - Math.round(extra * i);
    u.dur = clamp(u.dur + share, MIN_WORK_SEC, MAX_WORK_SEC);
  });
}

function prepareSegment(ex: Exercise, lead: string, round: number): Segment {
  const cues: Cue[] = [
    { atSec: 0, say: lead, haptic: 'next' },
    { atSec: 1, say: phrases.count(3) },
    { atSec: 2, say: phrases.count(2) },
    { atSec: 3, say: phrases.count(1) },
  ];
  return { kind: 'prepare', exercise: ex, durationSec: PREPARE_SEC, cues, round };
}

function workSegment(u: Unit, round: number, rng: () => number): Segment {
  const cues: Cue[] = [{ atSec: 0, say: phrases.begin(), haptic: 'start' }];
  if (u.dur >= 25) cues.push({ atSec: Math.floor(u.dur / 2), say: phrases.encourage(rng) });
  cues.push({ atSec: Math.max(1, u.dur - 5), haptic: 'countdown' });
  return { kind: 'work', exercise: u.ex, side: u.side, durationSec: u.dur, cues, round };
}

function shortRestSegment(round: number): Segment {
  return { kind: 'rest', durationSec: SHORT_REST_SEC, round, cues: [{ atSec: 0, say: phrases.rest(), haptic: 'rest' }] };
}

function roundRestSegment(round: number, total: number, focus: Focus): Segment {
  const dur = roundRestSec(focus);
  return {
    kind: 'roundrest',
    durationSec: dur,
    round,
    cues: [
      { atSec: 0, say: phrases.roundComplete(round, total), haptic: 'rest' },
      { atSec: Math.max(1, dur - 4), say: phrases.roundStart(round + 1) },
    ],
  };
}

// --- Warm-up flow rendering (fixed-length, excluded from drift) ---

function warmupMoveCount(target: number, flow: WarmupFlow): number {
  if (flow.free) return 1;
  const warmupTarget = clamp(Math.round(target * 0.15), 60, 180);
  return clamp(Math.round(warmupTarget / WARMUP_MOVE_SEC), 2, flow.moves.length);
}

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
  const dur = flow.free ? freeDanceSec(target) : WARMUP_MOVE_SEC;
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

  // One circuit (Push·Pull·Legs·Hinge·Carry-or-Crawl·Mobility), selected ONCE.
  // The same circuit repeats every round.
  const circuit = selectExercises({
    equipment: opts.equipment, recentExerciseIds: recent, rng, includeWarmup: false,
  });

  // Lottery: a warm-up flow that preps the day's work and avoids recent themes.
  const flow = pickWarmupFlow({ workoutCategories: circuit.map((e) => e.category), recentThemeIds, rng });
  const warmupSegs = buildWarmup(flow, focus, target, rng);
  const warmupTotal = warmupSegs.reduce((s, seg) => s + seg.durationSec, 0);

  // Size ONE circuit's work bouts so warm-up + (work+short-rests)*rounds +
  // round-rests + celebrate ≈ target, then replicate with identical durations.
  const units = buildUnits(circuit, focus);
  const items = circuit.length;
  const roundRest = roundRestSec(focus);
  const fixed = warmupTotal + CELEBRATE_SEC
    + (rounds - 1) * roundRest
    + rounds * (items * PREPARE_SEC + items * SHORT_REST_SEC);
  const perRoundWork = (target - fixed) / rounds;
  const baseWork = units.reduce((s, u) => s + u.dur, 0);
  spreadDrift(units, perRoundWork - baseWork);

  // Lay out: warm-up → [circuit] × rounds (round-rest between) → celebrate.
  const segments: Segment[] = [...warmupSegs];
  for (let r = 1; r <= rounds; r++) {
    let u = 0;
    circuit.forEach((ex) => {
      segments.push(prepareSegment(ex, phrases.next(ex.name), r));
      const sides = ex.unilateral ? 2 : 1;
      for (let s = 0; s < sides; s++) segments.push(workSegment(units[u++], r, rng));
      segments.push(shortRestSegment(r));
    });
    if (r < rounds) segments.push(roundRestSegment(r, rounds, focus));
  }

  segments.push({
    kind: 'celebrate', durationSec: CELEBRATE_SEC,
    cues: [{ atSec: 0, say: phrases.celebrate(circuit.map((e) => e.category)) }],
  });

  return { id: `w-${seed}-${opts.kind}`, kind: opts.kind, focus, rounds, warmupThemeId: flow.id, segments };
}
