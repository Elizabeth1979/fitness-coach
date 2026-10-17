export type Category =
  | 'warmup' | 'push' | 'pull' | 'legs' | 'hinge'
  | 'carry' | 'crawl' | 'core' | 'balance' | 'mobility';

export type Equipment = 'bodyweight' | 'pullup_bar' | 'weights' | 'blocks_bands';

export type Goal = 'strength' | 'mobility' | 'balance' | 'coordination' | 'skill' | 'fun';

export type HapticKind = 'start' | 'rest' | 'next' | 'countdown';

export type Measure = 'time' | 'reps';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  equipment: Equipment[];
  goals: Goal[];
  // One side at a time. Main moves split into left · switch · right; a warm-up move (fixed length) hears "Switch sides." halfway.
  unilateral: boolean;
  // Round in circles: "Now the other way." halfway through.
  bothDirections?: boolean;
  measure: Measure;
  cue: string;
  defaultDurationSec?: number;
  defaultReps?: number;
}

export interface Cue {
  atSec: number;
  say?: string;
  haptic?: HapticKind;
}

// 'intro' = the spoken overview before the clock starts (not part of the workout length).
// 'switch' = the short gap between the left and right side of a one-sided move.
export type SegmentKind = 'intro' | 'prepare' | 'work' | 'switch' | 'rest' | 'roundrest' | 'celebrate';

export interface Segment {
  kind: SegmentKind;
  exercise?: Exercise;
  side?: 'left' | 'right';
  round?: number;
  // Marks segments that belong to a special block rather than a numbered round.
  // 'core' = the abs finisher at the very end (before celebrate).
  block?: 'core';
  durationSec: number;
  // The rep target of a rep-counted move at the workout's effort level.
  reps?: number;
  cues: Cue[];
}

export type WorkoutKind = '10min' | '20min' | '30min' | 'free';
export type Focus = 'strength' | 'movement';
// How the main work is ordered:
//  - 'circuit'  : do all exercises once, then repeat the whole set each round.
//  - 'stations' : do every set of one exercise (with rest between) before moving on.
export type WorkoutStyle = 'circuit' | 'stations';
// A body area that's sore/tired today: the generator drops the moves that load
// it and emphasises the rest. 'none' = a normal balanced session.
export type SoreArea = 'none' | 'shoulders' | 'back' | 'legs';

export interface Workout {
  id: string;
  kind: WorkoutKind;
  focus: Focus;
  rounds: number;
  style: WorkoutStyle;
  warmupThemeId?: string;
  // Effort level from "How did that feel?" (0 = default; see generator/effort.ts).
  level?: number;
  segments: Segment[];
}
