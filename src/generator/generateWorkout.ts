import type {
  Cue, Equipment, Exercise, Focus, Segment, Workout, WorkoutKind, WorkoutStyle,
} from '../domain/types';
import { selectExercises, candidatesFor, SLOTS, SLOTS_SHORT } from './selectExercises';
import { focusForDate } from './schedule';
import { createRng, pick } from './rng';
import { phrases } from '../coach/phrases';
import { pickWarmupFlow, WARMUP_FLOWS, type WarmupFlow } from './warmupFlows';
import { exerciseById } from '../domain/exercises';

export interface GenerateOptions {
  kind: WorkoutKind;
  date: Date;
  equipment: Equipment[];
  recentExerciseIds?: string[];
  recentThemeIds?: string[];
  seed?: number;
  style?: WorkoutStyle;
  // Force a specific warm-up flow (used by the "Different warm-up" switch). When
  // unset, the Mobility Lottery picks one. The circuit is chosen before the flow,
  // so overriding the warm-up keeps the same circuit; the body re-sizes to budget.
  warmupThemeId?: string;
}

export const TARGET_SECONDS: Record<Exclude<WorkoutKind, 'free'>, number> = {
  '10min': 600, '20min': 1200, '30min': 1800,
};

// How many times the circuit repeats. The 10-min trims to a focused trio so each
// move still gets 3 sets (more effective than 6 moves × 2); longer sessions keep
// the full six-move circuit.
const ROUNDS: Record<WorkoutKind, number> = { '10min': 3, '20min': 3, '30min': 5, free: 3 };

const CELEBRATE_SEC = 18;
const PREPARE_SEC = 4;
// NOTE: the 10-min/2-round budget's worst case is every work bout at this floor.
// It stays within the 45s tolerance only because ≤3 circuit categories are
// unilateral today (see the "worst-case 10-min floor budget" test). Adding
// unilateral exercises to more categories could breach it — that test will catch it.
const MIN_WORK_SEC = 15;
const MAX_WORK_SEC = 120;
const WARMUP_MOVE_SEC = 30;
// The abs finisher always closes the session (within the time budget). ~2–3 min,
// rotating to a different core move every CORE_BOUT_SEC.
const ABS_TARGET: Record<WorkoutKind, number> = { '10min': 120, '20min': 150, '30min': 180, free: 150 };
const CORE_BOUT_SEC = 30;
// Brief catch-your-breath rest between exercises within a round. The real
// recovery is the longer round-rest; keeping this short is what lets a 10-min
// two-round circuit fit its budget (12 short rests would otherwise dominate).
const SHORT_REST_SEC = 12;

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

// Spread `drift` seconds across ONE circuit's work bouts so each round hits its
// budget. Repeatedly distribute the remaining drift across units that still have
// room in the needed direction; clamping returns the unabsorbed remainder to the
// next pass, so the distribution converges instead of stranding seconds on a
// clamped unit. Bounded by `units.length` passes (each non-finishing pass clamps
// at least one more unit); a no-progress pass breaks out.
function spreadDrift(units: Unit[], drift: number): void {
  if (units.length === 0) return;
  let remaining = drift;
  for (let pass = 0; pass < units.length && Math.abs(remaining) >= 1; pass++) {
    const eligible = units.filter((u) =>
      remaining < 0 ? u.dur > MIN_WORK_SEC : u.dur < MAX_WORK_SEC,
    );
    if (eligible.length === 0) break;
    const per = remaining / eligible.length;
    let absorbed = 0;
    eligible.forEach((u, i) => {
      const share = Math.round(per * (i + 1)) - Math.round(per * i);
      const before = u.dur;
      u.dur = clamp(u.dur + share, MIN_WORK_SEC, MAX_WORK_SEC);
      absorbed += u.dur - before;
    });
    if (absorbed === 0) break; // no unit could move; nothing more to do
    remaining -= absorbed;
  }
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

// Station style: the recovery between two sets of the SAME exercise. Uses the
// substantial round-rest length (you've just worked one muscle group hard), and
// leads back in with a countdown haptic so you know when to start the next set.
function setRestSegment(round: number, focus: Focus): Segment {
  const dur = roundRestSec(focus);
  return {
    kind: 'rest', durationSec: dur, round,
    cues: [
      { atSec: 0, say: phrases.rest(), haptic: 'rest' },
      { atSec: Math.max(1, dur - 4), haptic: 'countdown' },
    ],
  };
}

// --- Abs finisher (fixed-length core block at the very end, before celebrate) ---

// Builds the core finisher as a rotation of fixed CORE_BOUT_SEC bouts — a
// different core move every bout (cycling the available, time-based,
// equipment-matched core moves) with a short rest between, to roughly fill
// `absBudget`. Tagged block:'core' so it sits outside the numbered rounds.
function buildAbsFinisher(equipment: Equipment[], absBudget: number, recent: string[], rng: () => number): Segment[] {
  const all = candidatesFor('core', equipment);
  const timed = all.filter((e) => e.measure === 'time');
  const pool = timed.length > 0 ? timed : all;
  if (pool.length === 0) return [];

  // How many 30s bouts fit (each bout carries a short rest except the last).
  const per = CORE_BOUT_SEC + SHORT_REST_SEC;
  const n = clamp(Math.floor((absBudget + SHORT_REST_SEC) / per), 1, 8);

  // A distinct ordering (avoiding recent first); we cycle it so consecutive
  // bouts are always different moves when more than one is available.
  const used = new Set<string>();
  const order: Exercise[] = [];
  while (order.length < pool.length) {
    const free = pool.filter((e) => !used.has(e.id));
    const fresh = free.filter((e) => !recent.includes(e.id));
    const ex = pick(rng, fresh.length > 0 ? fresh : free);
    order.push(ex); used.add(ex.id);
  }

  const segs: Segment[] = [];
  for (let i = 0; i < n; i++) {
    const ex = order[i % order.length];
    const lead = i === 0 ? `${phrases.coreFinisher()} ${phrases.exercise(ex.name)}` : phrases.next(ex.name);
    const cues: Cue[] = [
      { atSec: 0, say: lead, haptic: 'start' },
      { atSec: Math.floor(CORE_BOUT_SEC / 2), say: phrases.encourage(rng) },
      { atSec: CORE_BOUT_SEC - 5, haptic: 'countdown' },
    ];
    segs.push({ kind: 'work', exercise: ex, durationSec: CORE_BOUT_SEC, cues, block: 'core' });
    if (i < n - 1) {
      segs.push({ kind: 'rest', durationSec: SHORT_REST_SEC, block: 'core', cues: [{ atSec: 0, say: phrases.rest(), haptic: 'rest' }] });
    }
  }
  return segs;
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
    slots: opts.kind === '10min' ? SLOTS_SHORT : SLOTS,
  });

  // A forced theme (the "Different warm-up" switch) wins; otherwise the Lottery
  // picks a flow that preps the day's work and avoids recent themes.
  const forced = opts.warmupThemeId ? WARMUP_FLOWS.find((f) => f.id === opts.warmupThemeId) : undefined;
  const flow = forced ?? pickWarmupFlow({ workoutCategories: circuit.map((e) => e.category), recentThemeIds, rng });
  const warmupSegs = buildWarmup(flow, focus, target, rng);
  const warmupTotal = warmupSegs.reduce((s, seg) => s + seg.durationSec, 0);

  const units = buildUnits(circuit, focus);
  const items = circuit.length;
  const roundRest = roundRestSec(focus);
  const style: WorkoutStyle = opts.style ?? 'circuit';
  const baseWork = (): number => units.reduce((s, u) => s + u.dur, 0);

  // Everything except the main work bouts and the abs block.
  const baseFixed = style === 'stations'
    ? warmupTotal + CELEBRATE_SEC + items * PREPARE_SEC + items * (rounds - 1) * roundRest
    : warmupTotal + CELEBRATE_SEC + (rounds - 1) * roundRest + rounds * (items * PREPARE_SEC + items * SHORT_REST_SEC);

  // The abs finisher always closes the session, within the budget. It aims for
  // ABS_TARGET but never takes so much that the main work would be forced below
  // its floor — so a unilateral-heavy long station session simply gets a shorter
  // (but still present) finisher rather than overflowing the time budget.
  const minWork = rounds * units.length * MIN_WORK_SEC;
  const absBudget = Math.min(ABS_TARGET[opts.kind], Math.max(0, target - baseFixed - minWork));
  const absSegs = absBudget >= CORE_BOUT_SEC ? buildAbsFinisher(opts.equipment, absBudget, recent, rng) : [];
  const absTotal = absSegs.reduce((s, seg) => s + seg.durationSec, 0);

  // Size the main work to fill what's left after warm-up, rests, abs and celebrate.
  spreadDrift(units, (target - baseFixed - absTotal) / rounds - baseWork());

  const practiced = absSegs.length > 0
    ? [...circuit.map((e) => e.category), 'core' as const]
    : circuit.map((e) => e.category);
  const celebrate: Segment = {
    kind: 'celebrate', durationSec: CELEBRATE_SEC,
    cues: [{ atSec: 0, say: phrases.celebrate(practiced) }],
  };

  // Lay out the main work, then the abs finisher, then celebrate.
  let segments: Segment[] = [...warmupSegs];
  if (style === 'stations') {
    // Per station: prepare → [work × sides → set-rest] × rounds. Each set is
    // tagged with its set number (round), so set 1 of every station is "round 1".
    let u = 0;
    circuit.forEach((ex) => {
      const sides = ex.unilateral ? 2 : 1;
      const exUnits = units.slice(u, u + sides);
      u += sides;
      segments.push(prepareSegment(ex, phrases.next(ex.name), 1));
      for (let set = 1; set <= rounds; set++) {
        exUnits.forEach((un) => segments.push(workSegment(un, set, rng)));
        if (set < rounds) segments.push(setRestSegment(set, focus));
      }
    });
  } else {
    // [circuit] × rounds, with a round-rest between rounds.
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
  }
  segments.push(...absSegs);
  segments.push(celebrate);

  return { id: `w-${seed}-${opts.kind}-${style}`, kind: opts.kind, focus, rounds, style, warmupThemeId: flow.id, segments };
}
