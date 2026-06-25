import type { Category, Exercise, Segment, Workout } from '../domain/types';

export function formatTarget(seg: Segment): string {
  const ex = seg.exercise;
  if (!ex) return '';
  if (ex.measure === 'reps') {
    const n = ex.defaultReps ?? 0;
    return ex.unilateral ? `${n} reps each side` : `${n} reps`;
  }
  const s = seg.durationSec;
  if (s >= 90) {
    const mins = s / 60;
    return `${Number.isInteger(mins) ? mins : Math.round(mins)} minutes`;
  }
  return `${s} seconds`;
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

export function currentMoveIndex(moves: SessionMove[], segmentIndex: number): number {
  let idx = 0;
  for (let i = 0; i < moves.length; i++) {
    if (moves[i].firstSegment <= segmentIndex) idx = i; else break;
  }
  return idx;
}
