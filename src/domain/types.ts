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
  unilateral: boolean;
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

export type SegmentKind = 'prepare' | 'work' | 'rest' | 'roundrest' | 'celebrate';

export interface Segment {
  kind: SegmentKind;
  exercise?: Exercise;
  side?: 'left' | 'right';
  round?: number;
  durationSec: number;
  cues: Cue[];
}

export type WorkoutKind = '10min' | '20min' | '30min' | 'free';
export type Focus = 'strength' | 'movement';

export interface Workout {
  id: string;
  kind: WorkoutKind;
  focus: Focus;
  rounds: number;
  warmupThemeId?: string;
  segments: Segment[];
}
