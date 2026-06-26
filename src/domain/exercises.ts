import type { Category, Exercise } from './types';

export const EXERCISES: Exercise[] = [
  // --- Warmup / mobility flows ---
  { id: 'dog-flow', name: 'Downward Dog to Upward Dog', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'coordination'], unilateral: false, measure: 'time', cue: 'Flow slowly between Downward Dog and Upward Dog. Breathe.', defaultDurationSec: 60 },
  { id: 'dynamic-stretch', name: 'Dynamic Stretching', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'fun'], unilateral: false, measure: 'time', cue: 'Loosen up with easy swings and circles.', defaultDurationSec: 60 },
  { id: 'hip-openers', name: 'Hip Openers', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'balance'], unilateral: false, measure: 'time', cue: 'Open the hips with slow controlled circles.', defaultDurationSec: 60 },

  // --- Warm-up flow moves (used by warmupFlows.ts) ---
  { id: 'hip-circles', name: 'Hip Circles', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Hip circles. Hands on hips, big slow circles each way.', defaultDurationSec: 30 },
  { id: 'leg-swings', name: 'Leg Swings', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'coordination'], unilateral: false, measure: 'time', cue: 'Leg swings. Hold something, swing one leg, then the other.', defaultDurationSec: 30 },
  { id: 'wu-deep-squat', name: 'Deep Squat Hold', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Sink into a deep squat. Relax into it and breathe.', defaultDurationSec: 30 },
  { id: 'cossack-shifts', name: 'Cossack Shifts', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'balance'], unilateral: false, measure: 'time', cue: 'Cossack shifts. Sink side to side, stay low and easy.', defaultDurationSec: 30 },
  { id: 'marching', name: 'Marching in Place', category: 'warmup', equipment: ['bodyweight'], goals: ['coordination', 'fun'], unilateral: false, measure: 'time', cue: 'March in place. Lift the knees, easy rhythm.', defaultDurationSec: 30 },
  { id: 'arm-circles', name: 'Arm Circles', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Arm circles. Forward and back, open the shoulders.', defaultDurationSec: 30 },
  { id: 'scapular-circles', name: 'Scapular Circles', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Scapular circles. Roll the shoulder blades, slow.', defaultDurationSec: 30 },
  { id: 'cat-cow', name: 'Cat-Cow', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Cat-cow. Round and arch the spine with your breath.', defaultDurationSec: 30 },
  { id: 'wall-slides', name: 'Wall Slides', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Wall slides. Back to the wall, slide the arms up and down.', defaultDurationSec: 30 },
  { id: 'shoulder-cars', name: 'Shoulder Rotations', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'skill'], unilateral: false, measure: 'time', cue: 'Slow shoulder rotations. Controlled, full range.', defaultDurationSec: 30 },
  { id: 'bear-hold', name: 'Bear Hold', category: 'warmup', equipment: ['bodyweight'], goals: ['coordination', 'strength'], unilateral: false, measure: 'time', cue: 'Bear position hold. Knees an inch off the floor, steady.', defaultDurationSec: 30 },
  { id: 'wrist-mobility', name: 'Wrist Mobility', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility'], unilateral: false, measure: 'time', cue: 'Wrist mobility. Circle and stretch the wrists gently.', defaultDurationSec: 30 },
  { id: 'hip-shifts', name: 'Hip Shifts', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'coordination'], unilateral: false, measure: 'time', cue: 'On all fours, rock the hips back and forth.', defaultDurationSec: 30 },
  { id: 'spinal-waves', name: 'Spinal Waves', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'skill'], unilateral: false, measure: 'time', cue: 'Spinal waves. Ripple through the spine, slow and smooth.', defaultDurationSec: 30 },
  { id: 'step-touch', name: 'Step-Touch', category: 'warmup', equipment: ['bodyweight'], goals: ['coordination', 'fun'], unilateral: false, measure: 'time', cue: 'Step-touch. Side to side, let it feel like a groove.', defaultDurationSec: 30 },
  { id: 'salsa-basic', name: 'Salsa Basic', category: 'warmup', equipment: ['bodyweight'], goals: ['coordination', 'fun'], unilateral: false, measure: 'time', cue: 'Salsa basic. Forward and back, find your rhythm.', defaultDurationSec: 30 },
  { id: 'hip-rotations', name: 'Hip Rotations', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'fun'], unilateral: false, measure: 'time', cue: 'Hip rotations. Loose circles, let the hips flow.', defaultDurationSec: 30 },
  { id: 'arm-flow', name: 'Arm Flow', category: 'warmup', equipment: ['bodyweight'], goals: ['mobility', 'fun'], unilateral: false, measure: 'time', cue: 'Arm flow. Let the arms move freely with the music.', defaultDurationSec: 30 },
  { id: 'light-bouncing', name: 'Light Bouncing', category: 'warmup', equipment: ['bodyweight'], goals: ['fun', 'coordination'], unilateral: false, measure: 'time', cue: 'Light bouncing. Soft knees, bounce and shake it out.', defaultDurationSec: 30 },
  { id: 'free-dance', name: 'Free Dance', category: 'warmup', equipment: ['bodyweight'], goals: ['fun', 'coordination', 'mobility'], unilateral: false, measure: 'time', cue: 'Put on a song you love and move however feels good.', defaultDurationSec: 120 },

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
  { id: 'plank', name: 'Plank', category: 'core', equipment: ['bodyweight'], goals: ['strength'], unilateral: false, measure: 'time', cue: 'Plank. One straight line head to heels, breathe steady.', defaultDurationSec: 30 },
  { id: 'dead-bug', name: 'Dead Bug', category: 'core', equipment: ['bodyweight'], goals: ['strength', 'coordination'], unilateral: false, measure: 'time', cue: 'Dead Bug. Low back down, reach opposite arm and leg, slow.', defaultDurationSec: 30 },
  { id: 'flutter-kicks', name: 'Flutter Kicks', category: 'core', equipment: ['bodyweight'], goals: ['strength'], unilateral: false, measure: 'time', cue: 'Flutter Kicks. Legs low and long, small quick kicks.', defaultDurationSec: 30 },
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

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
