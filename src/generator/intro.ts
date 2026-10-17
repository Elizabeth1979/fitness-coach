import type { Cue, Workout } from '../domain/types';
import { phrases } from '../coach/phrases';
import { trainingMin } from '../domain/workout';
import { secsToSay } from '../coach/secsToSay';
import { PREPARE_SEC, prepareCues } from './changeover';
import { warmupFlowName } from './warmupFlows';

// The intro: before the clock starts, the coach says what's waiting and what
// comes first, then "Get ready… three, two, one" — and the first move's "Go!"
// starts the workout. It's sized to what is said (never cut off mid-sentence)
// and isn't part of the 10/20/30 minutes.

// How long a line takes to say, plus a breath after it.
const PAUSE_SEC = 1;
const sayingSec = (text: string): number => Math.ceil(secsToSay(text)) + PAUSE_SEC;

/** The workout with a fresh intro in front (any old one dropped), so it's re-run after a swap. */
export function withIntro(workout: Workout): Workout {
  const body = workout.segments.filter((s) => s.kind !== 'intro');
  const first = body.find((s) => s.kind === 'work')?.exercise;
  const overview = phrases.introOverview({
    minutes: trainingMin(workout),
    focus: workout.focus,
    warmup: warmupFlowName(workout.warmupThemeId),
    moves: body.filter((s) => s.kind === 'prepare' && s.round === 1 && s.block !== 'core').map((s) => s.exercise?.name ?? ''),
    rounds: workout.rounds,
    style: workout.style,
    core: body.some((s) => s.block === 'core'),
  });

  const cues: Cue[] = [];
  let t = 0;
  for (const say of first ? [overview, phrases.firstUp(first)] : [overview]) {
    cues.push({ atSec: t, say });
    t += sayingSec(say);
  }
  cues.push(...prepareCues().map((c) => ({ ...c, atSec: c.atSec + t })));
  return { ...workout, segments: [{ kind: 'intro', durationSec: t + PREPARE_SEC, cues }, ...body] };
}
