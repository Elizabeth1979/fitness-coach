import type { Category, Exercise } from './types';

export const EXERCISES: Exercise[] = [
  // --- Warmup / mobility flows ---
  { id: 'dog-flow', name: 'Downward Dog to Upward Dog', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'coordination'], unilateral: false, measure: 'time', cue: 'Flow slowly between Downward Dog and Upward Dog. Breathe.', defaultDurationSec: 60 },
  { id: 'dynamic-stretch', name: 'Dynamic Stretching', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'fun'], unilateral: false, measure: 'time', cue: 'Loosen up with easy swings and circles.', defaultDurationSec: 60 },
  { id: 'hip-openers', name: 'Hip Openers', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'balance'], unilateral: false, measure: 'time', cue: 'Open the hips with slow controlled circles.', defaultDurationSec: 60 },

  // --- Push ---
  { id: 'pushup', name: 'Push-up', category: 'push', equipment: ['bodyweight'], goals: ['strength', 'skill'], unilateral: false, measure: 'reps', cue: 'Push-ups. Hands under shoulders, body in one line.', defaultReps: 8 },
  { id: 'pike-pushup', name: 'Pike Push-up', category: 'push', equipment: ['bodyweight'], goals: ['strength', 'skill'], unilateral: false, measure: 'reps', cue: 'Pike Push-ups. Hips high, lower the crown of your head.', defaultReps: 6 },
  { id: 'wall-handstand', name: 'Face-to-Wall Handstand', category: 'push', equipment: ['bodyweight'], goals: ['strength', 'skill', 'balance'], unilateral: false, measure: 'time', cue: 'Face-to-wall handstand. Walk your feet up, hold strong.', defaultDurationSec: 30 },

  // --- Pull ---
  { id: 'dead-hang', name: 'Dead Hang', category: 'pull', equipment: ['pullup_bar'], goals: ['strength', 'skill'], unilateral: false, measure: 'time', cue: 'Dead Hang. Relax your shoulders and just hang.', defaultDurationSec: 30 },
  { id: 'scap-pull', name: 'Scapular Pull-up', category: 'pull', equipment: ['pullup_bar'], goals: ['strength', 'skill'], unilateral: false, measure: 'reps', cue: 'Scapular Pull-ups. Pull your shoulder blades down, small range.', defaultReps: 8 },
  { id: 'negative-pullup', name: 'Negative Pull-up', category: 'pull', equipment: ['pullup_bar'], goals: ['strength', 'skill'], unilateral: false, measure: 'reps', cue: 'Negative Pull-ups. Jump to the top, lower as slowly as you can.', defaultReps: 5 },
  { id: 'band-pull', name: 'Band-Assisted Pull-up', category: 'pull', equipment: ['pullup_bar', 'blocks_bands'], goals: ['strength', 'skill'], unilateral: false, measure: 'reps', cue: 'Band-assisted Pull-ups. Drive your elbows down.', defaultReps: 6 },

  // --- Legs ---
  { id: 'cossack', name: 'Cossack Squat', category: 'legs', equipment: ['bodyweight'], goals: ['strength', 'mobility', 'balance'], unilateral: true, measure: 'reps', cue: 'Cossack Squat. Shift side to side, keep one leg long.', defaultReps: 6 },
  { id: 'bulgarian', name: 'Bulgarian Split Squat', category: 'legs', equipment: ['bodyweight'], goals: ['strength', 'balance'], unilateral: true, measure: 'reps', cue: 'Bulgarian Split Squat. Back foot elevated, sink straight down.', defaultReps: 8 },
  { id: 'deep-squat', name: 'Deep Squat Hold', category: 'legs', equipment: ['bodyweight'], goals: ['mobility', 'balance'], unilateral: false, measure: 'time', cue: 'Deep Squat. Sit at the bottom, chest tall, breathe.', defaultDurationSec: 40 },

  // --- Hinge ---
  { id: 'rdl', name: 'Romanian Deadlift', category: 'hinge', equipment: ['weights'], goals: ['strength', 'mobility'], unilateral: false, measure: 'reps', cue: 'Romanian Deadlift. Hinge at the hips, soft knees, flat back.', defaultReps: 8 },
  { id: 'single-rdl', name: 'Single-Leg Romanian Deadlift', category: 'hinge', equipment: ['bodyweight'], goals: ['strength', 'balance', 'coordination'], unilateral: true, measure: 'reps', cue: 'Single-Leg Deadlift. Reach back with one leg, stay balanced.', defaultReps: 6 },

  // --- Carry ---
  { id: 'farmer', name: 'Farmer Carry', category: 'carry', equipment: ['weights'], goals: ['strength', 'coordination'], unilateral: false, measure: 'time', cue: 'Farmer Carry. Weights at your sides, tall and steady, walk.', defaultDurationSec: 40 },
  { id: 'suitcase', name: 'Suitcase Carry', category: 'carry', equipment: ['weights'], goals: ['strength', 'balance', 'coordination'], unilateral: true, measure: 'time', cue: 'Suitcase Carry. One weight, resist the lean, walk tall.', defaultDurationSec: 30 },
  { id: 'overhead-carry', name: 'Overhead Carry', category: 'carry', equipment: ['weights'], goals: ['strength', 'balance', 'skill'], unilateral: false, measure: 'time', cue: 'Overhead Carry. Press up, ribs down, walk slowly.', defaultDurationSec: 30 },

  // --- Crawl ---
  { id: 'bear', name: 'Bear Crawl', category: 'crawl', equipment: ['bodyweight'], goals: ['coordination', 'strength', 'fun'], unilateral: false, measure: 'time', cue: 'Bear Crawl. Knees an inch off the floor, opposite hand and foot.', defaultDurationSec: 30 },
  { id: 'crab', name: 'Crab Walk', category: 'crawl', equipment: ['bodyweight'], goals: ['coordination', 'mobility', 'fun'], unilateral: false, measure: 'time', cue: 'Crab Walk. Hips up, travel in any direction.', defaultDurationSec: 30 },
  { id: 'leopard', name: 'Leopard Crawl', category: 'crawl', equipment: ['bodyweight'], goals: ['coordination', 'strength', 'skill'], unilateral: false, measure: 'time', cue: 'Leopard Crawl. Low and smooth, stay quiet.', defaultDurationSec: 30 },

  // --- Core ---
  { id: 'hollow', name: 'Hollow Hold', category: 'core', equipment: ['bodyweight'], goals: ['strength', 'skill'], unilateral: false, measure: 'time', cue: 'Hollow Hold. Low back pressed down, reach long.', defaultDurationSec: 30 },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', category: 'core', equipment: ['pullup_bar'], goals: ['strength', 'skill'], unilateral: false, measure: 'reps', cue: 'Hanging Leg Raises. Hang tall, lift with control.', defaultReps: 6 },

  // --- Balance ---
  { id: 'single-leg-stand', name: 'Single-Leg Balance', category: 'balance', equipment: ['bodyweight'], goals: ['balance', 'skill'], unilateral: true, measure: 'time', cue: 'Single-Leg Balance. Soft knee, eyes forward, breathe.', defaultDurationSec: 20 },

  // --- Mobility (cooldown / between) ---
  { id: 'shoulder-mobility', name: 'Shoulder Mobility', category: 'mobility', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Shoulder circles, big and slow, both directions.', defaultDurationSec: 40 },
  { id: 'block-squat', name: 'Supported Deep Squat', category: 'mobility', equipment: ['blocks_bands'], goals: ['mobility', 'balance'], unilateral: false, measure: 'time', cue: 'Sit into a deep squat on the blocks, relax and breathe.', defaultDurationSec: 40 },
  { id: 'downdog', name: 'Downward Dog', category: 'mobility', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Downward Dog. Pedal the heels, lengthen the spine.', defaultDurationSec: 40 },
];

export function exercisesByCategory(category: Category): Exercise[] {
  return EXERCISES.filter((e) => e.category === category);
}
