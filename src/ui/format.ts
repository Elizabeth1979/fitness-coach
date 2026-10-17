import type { Category, Exercise, Segment, Workout } from '../domain/types';
import { trainingSec } from '../domain/workout';

export function formatTarget(seg: Segment): string {
  const ex = seg.exercise;
  if (!ex) return '';
  if (ex.measure === 'reps') {
    const n = seg.reps ?? ex.defaultReps ?? 0;
    // A goal to grow into, not a test you fail when the time runs out (Elli #16).
    return ex.unilateral ? `Up to ${n} reps each side` : `Up to ${n} reps`;
  }
  const s = seg.durationSec;
  if (s >= 90) {
    const mins = s / 60;
    return `${Number.isInteger(mins) ? mins : Math.round(mins)} minutes`;
  }
  return `${s} seconds`;
}

/** Seconds as m:ss. */
export function formatClock(sec: number): string {
  return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;
}

/** Seconds left in the whole workout. Holds at the full length during the intro: the clock starts when it ends. */
export function timeLeft(workout: Workout, segmentIndex: number, segmentRemainingSec: number): number {
  if (workout.segments[segmentIndex]?.kind === 'intro') return trainingSec(workout);
  return workout.segments.slice(segmentIndex + 1).reduce((a, s) => a + s.durationSec, segmentRemainingSec);
}

export interface SessionMove {
  index: number;
  exercise: Exercise;
  category: Category;
  isWarmup: boolean;
  target: string;
  firstSegment: number;
}

export function sessionMoves(workout: Workout): SessionMove[] {
  const moves: SessionMove[] = [];
  let lastId: string | null = null;
  let lastSide: string | undefined;
  workout.segments.forEach((seg, i) => {
    if (seg.kind !== 'work' || !seg.exercise) return;
    // Collapse the second side of a unilateral exercise into the first move.
    if (seg.exercise.id === lastId && lastSide === 'left' && seg.side === 'right') {
      lastSide = seg.side;
      return;
    }
    lastId = seg.exercise.id;
    lastSide = seg.side;
    moves.push({
      index: moves.length,
      exercise: seg.exercise,
      category: seg.exercise.category,
      isWarmup: seg.exercise.category === 'warmup',
      target: formatTarget(seg),
      firstSegment: i,
    });
  });
  return moves;
}

// The warm-up moves (the themed flow shown once at the start).
export function warmupMoves(workout: Workout): SessionMove[] {
  return sessionMoves(workout).filter((m) => m.isWarmup);
}

// The abs/core finisher moves (the block at the very end).
export function coreMoves(workout: Workout): SessionMove[] {
  return sessionMoves(workout).filter((m) => m.category === 'core');
}

export function currentMoveIndex(moves: SessionMove[], segmentIndex: number): number {
  let idx = 0;
  for (let i = 0; i < moves.length; i++) {
    if (moves[i].firstSegment <= segmentIndex) idx = i; else break;
  }
  return idx;
}

// The circuit shown once on Home: the main moves of round 1 (identical every round).
export function circuitMoves(workout: Workout): SessionMove[] {
  return sessionMoves(workout).filter(
    (m) => !m.isWarmup && workout.segments[m.firstSegment].round === 1,
  );
}

export interface RoundInfo {
  round: number;        // 1..rounds inside a circuit; 0 during intro / warm-up / celebrate
  totalRounds: number;
  moveInRound: number;  // 1-based circuit slot within the round; 0 outside a round
  movesPerRound: number;
}

export interface StationInfo {
  station: number;        // 1-based station you're on; 0 during warm-up
  totalStations: number;  // number of exercises (one prepare each)
  set: number;            // 1-based set within the station
  totalSets: number;
}

// Station style: which exercise (station) and which set you're on. Stations are
// delimited by their single prepare; the segment's `round` carries the set number.
export function stationInfo(workout: Workout, segmentIndex: number): StationInfo {
  const totalStations = workout.segments.filter((s) => s.kind === 'prepare').length;
  let station = 0;
  for (let i = 0; i <= segmentIndex && i < workout.segments.length; i++) {
    if (workout.segments[i].kind === 'prepare') station++;
  }
  const set = workout.segments[segmentIndex]?.round ?? 1;
  return { station, totalStations, set, totalSets: workout.rounds };
}

export function roundInfo(workout: Workout, segmentIndex: number): RoundInfo {
  const totalRounds = workout.rounds;
  const movesPerRound = workout.segments.filter(
    (s) => s.kind === 'prepare' && s.round === 1,
  ).length;
  const seg = workout.segments[segmentIndex];
  const round = seg?.round ?? 0;
  let moveInRound = 0;
  if (round > 0) {
    for (let i = 0; i <= segmentIndex && i < workout.segments.length; i++) {
      const s = workout.segments[i];
      if (s.kind === 'prepare' && s.round === round) moveInRound++;
    }
  }
  return { round, totalRounds, moveInRound, movesPerRound };
}

/**
 * Where the Back button goes: the start of the move before the one you're on (or
 * about to do) — its changeover, so it's named and counted in again; a core move's
 * lead-in rest; or, in the warm-up, the move itself. Undefined when there's none.
 */
export function previousMoveStart(workout: Workout, segmentIndex: number): number | undefined {
  const segs = workout.segments;
  const seg = segs[segmentIndex];
  if (!seg || seg.kind === 'intro') return undefined;
  const moves = sessionMoves(workout);
  // A changeover belongs to the move after it; a break sits after the move just done.
  const inMove = seg.kind === 'prepare' || seg.kind === 'work' || seg.kind === 'switch';
  const here = currentMoveIndex(moves, seg.kind === 'prepare' ? segmentIndex + 1 : segmentIndex);
  const target = moves[inMove ? here - 1 : here];
  if (!target) return undefined;
  const first = target.firstSegment;
  const before = segs[first - 1];
  const start = before && (before.kind === 'prepare' || (before.kind === 'rest' && before.block === 'core')) ? first - 1 : first;
  return start < segmentIndex ? start : undefined;
}
