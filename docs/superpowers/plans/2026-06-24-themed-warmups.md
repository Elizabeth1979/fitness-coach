# Themed Warm-Ups & Mobility Lottery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace v1's single daily warm-up exercise with a named, never-repeating, body-aware warm-up *flow* (Hip / Shoulder / Animal / Dance / Free Dance) chosen by a "Mobility Lottery" and announced by the coach.

**Architecture:** Build on v1's functional-core / imperative-shell. New pure module `warmupFlows.ts` defines the flows + lottery; new warm-up *moves* are added to the existing exercise library; `generateWorkout` renders the chosen flow as fixed-length segments at the front of the workout (excluded from the time-budget drift), then the main 6-slot circuit fills the rest. The chosen theme is persisted so the lottery avoids repeats day to day.

**Tech Stack:** Same as v1 — React + Vite + TypeScript (strict) + Vitest. No new dependencies.

## Global Constraints

- **Package manager:** `npm`. Tests: `npx vitest run <path>`. Full build gate: `npm run build` (`tsc -b` + vite) — must stay clean. Do NOT run `npm run dev` (it hangs a non-interactive agent).
- **TypeScript strict ON**; no `any` in committed code.
- **Pure logic** (`src/domain`, `src/generator`, `src/coach/phrases.ts`, `src/storage/streak.ts`) must not import browser APIs.
- **Determinism:** same `{kind, date, equipment, recentExerciseIds, recentThemeIds, seed}` ⇒ identical `Workout` (use the seeded `rng` for every random choice).
- **Coach tone:** calm, encouraging, present-tense; never calorie/weight/guilt/military. New copy lives in `src/coach/phrases.ts`.
- **Hard-coded user name:** "Elli".
- **Commit after every task** on branch `feature/themed-warmups` with a `feat:`/`test:` message.

---

### Task 1: Warm-up moves + flows + the Mobility Lottery

**Files:**
- Modify: `src/domain/exercises.ts` (add ~20 warm-up moves + an `exerciseById` helper)
- Create: `src/generator/warmupFlows.ts`
- Test: `src/generator/warmupFlows.test.ts`

**Interfaces:**
- Consumes: `Category`, `Exercise` from `domain/types`; `EXERCISES`, `exerciseById` from `domain/exercises`; `pick` from `generator/rng`.
- Produces:
  - `exerciseById(id: string): Exercise | undefined`
  - `interface WarmupFlow { id: string; name: string; preps: Category[]; fun: boolean; free: boolean; moves: string[] }`
  - `WARMUP_FLOWS: WarmupFlow[]`
  - `interface PickWarmupOptions { workoutCategories: Category[]; recentThemeIds: string[]; rng: () => number }`
  - `pickWarmupFlow(opts: PickWarmupOptions): WarmupFlow`

- [ ] **Step 1: Write the failing test**

Create `src/generator/warmupFlows.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { WARMUP_FLOWS, pickWarmupFlow } from './warmupFlows';
import { exerciseById } from '../domain/exercises';
import { createRng } from './rng';
import type { Category } from '../domain/types';

describe('warm-up flows', () => {
  it('every flow move id resolves to a real warm-up exercise', () => {
    for (const flow of WARMUP_FLOWS) {
      expect(flow.moves.length).toBeGreaterThan(0);
      for (const id of flow.moves) {
        const ex = exerciseById(id);
        expect(ex, `move ${id} in ${flow.id}`).toBeDefined();
        expect(ex?.category).toBe('warmup');
      }
    }
  });

  it('flow ids are unique', () => {
    const ids = WARMUP_FLOWS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('pickWarmupFlow', () => {
  const ALL: Category[] = ['push', 'pull', 'legs', 'hinge', 'carry', 'mobility'];

  it('never repeats a recent theme when an alternative exists', () => {
    const flow = pickWarmupFlow({ workoutCategories: ALL, recentThemeIds: ['shoulder-flow'], rng: createRng(1) });
    expect(flow.id).not.toBe('shoulder-flow');
  });

  it('prefers a flow that preps the day\'s work (upper-body day → Shoulder Flow)', () => {
    const flow = pickWarmupFlow({ workoutCategories: ['push', 'pull'], recentThemeIds: [], rng: createRng(3) });
    expect(flow.id).toBe('shoulder-flow');
  });

  it('is deterministic for the same inputs', () => {
    const a = pickWarmupFlow({ workoutCategories: ALL, recentThemeIds: [], rng: createRng(7) });
    const b = pickWarmupFlow({ workoutCategories: ALL, recentThemeIds: [], rng: createRng(7) });
    expect(a.id).toBe(b.id);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/generator/warmupFlows.test.ts
```
Expected: FAIL (`warmupFlows` and `exerciseById` not found).

- [ ] **Step 3: Add the warm-up moves and `exerciseById` to the library**

In `src/domain/exercises.ts`, insert these entries INTO the `EXERCISES` array, right after the existing three warm-up entries (the `hip-openers` line) and before the `// --- Push ---` comment:

```ts
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
```

Then add this function at the end of `src/domain/exercises.ts` (after `exercisesByCategory`):

```ts
export function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
```

- [ ] **Step 4: Create the flows + lottery**

Create `src/generator/warmupFlows.ts`:

```ts
import type { Category } from '../domain/types';
import { pick } from './rng';

export interface WarmupFlow {
  id: string;
  name: string;        // announced by the coach
  preps: Category[];   // body areas this flow prepares
  fun: boolean;        // novelty/adherence bump
  free: boolean;       // single free-movement segment
  moves: string[];     // ordered warm-up-move exercise ids
}

export const WARMUP_FLOWS: WarmupFlow[] = [
  { id: 'hip-flow', name: 'Hip Flow', preps: ['legs', 'hinge'], fun: false, free: false,
    moves: ['hip-circles', 'leg-swings', 'wu-deep-squat', 'cossack-shifts', 'marching'] },
  { id: 'shoulder-flow', name: 'Shoulder Flow', preps: ['push', 'pull'], fun: false, free: false,
    moves: ['arm-circles', 'scapular-circles', 'cat-cow', 'wall-slides', 'shoulder-cars'] },
  { id: 'animal-flow', name: 'Animal Flow', preps: ['crawl', 'core'], fun: false, free: false,
    moves: ['bear-hold', 'wrist-mobility', 'hip-shifts', 'cat-cow', 'spinal-waves'] },
  { id: 'dance-flow', name: 'Dance Flow', preps: ['balance', 'mobility'], fun: true, free: false,
    moves: ['step-touch', 'salsa-basic', 'hip-rotations', 'arm-flow', 'light-bouncing'] },
  { id: 'free-dance', name: 'Free Dance', preps: [], fun: true, free: true,
    moves: ['free-dance'] },
];

export interface PickWarmupOptions {
  workoutCategories: Category[];
  recentThemeIds: string[];
  rng: () => number;
}

// Lottery: avoid recent themes, then pick the highest-weighted flow (prep-match
// counts double; "fun" flows get a bump so Dance surfaces regularly), breaking
// ties with the seeded rng.
export function pickWarmupFlow(opts: PickWarmupOptions): WarmupFlow {
  const { workoutCategories, recentThemeIds, rng } = opts;
  const fresh = WARMUP_FLOWS.filter((f) => !recentThemeIds.includes(f.id));
  const poolFlows = fresh.length > 0 ? fresh : WARMUP_FLOWS;
  const cats = new Set(workoutCategories);
  const weight = (f: WarmupFlow): number =>
    1 + f.preps.filter((c) => cats.has(c)).length * 2 + (f.fun ? 2 : 0);
  const maxW = Math.max(...poolFlows.map(weight));
  const top = poolFlows.filter((f) => weight(f) === maxW);
  return pick(rng, top);
}
```

- [ ] **Step 5: Run the test (expect PASS)**

```bash
npx vitest run src/generator/warmupFlows.test.ts src/domain/exercises.test.ts
```
Expected: PASS. (The existing `exercises.test.ts` still passes — every invariant holds for the new time-measured warm-up moves.)

- [ ] **Step 6: Commit**

```bash
git add src/domain/exercises.ts src/generator/warmupFlows.ts src/generator/warmupFlows.test.ts
git commit -m "feat: add warm-up move library, themed flows, and the Mobility Lottery"
```

---

### Task 2: Render the warm-up flow in the generator

**Files:**
- Modify: `src/domain/types.ts` (add `warmupThemeId?` to `Workout`)
- Modify: `src/coach/phrases.ts` (add `warmupAnnounce`)
- Modify: `src/generator/generateWorkout.ts` (replace the generator)
- Test: `src/generator/generateWorkout.test.ts` (add warm-up tests)

**Interfaces:**
- Consumes: `pickWarmupFlow`, `WarmupFlow`, `exerciseById` (Task 1); `selectExercises`, `focusForDate`, `createRng`, `phrases`.
- Produces:
  - `phrases.warmupAnnounce(flowName: string): string`
  - `Workout` gains optional `warmupThemeId?: string`
  - `GenerateOptions` gains optional `recentThemeIds?: string[]`
  - `generateWorkout` now prepends a themed warm-up; the returned `Workout.warmupThemeId` is the chosen flow's id.

- [ ] **Step 1: Write the failing tests**

Add these tests to `src/generator/generateWorkout.test.ts` (inside the existing `describe('generateWorkout', ...)` block — the existing `ALL`, `WED`, `TUE`, `total` helpers are already defined in that file):

```ts
  it('starts with a themed warm-up flow announced by the coach', () => {
    const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed: 4 });
    expect(w.warmupThemeId).toBeTruthy();
    const first = w.segments[0];
    expect(first.kind).toBe('work');
    expect(first.exercise?.category).toBe('warmup');
    expect(first.cues[0].say?.toLowerCase()).toContain("today's warm-up:");
  });

  it('keeps warm-up segments short (not stretched by the time budget)', () => {
    const w = generateWorkout({ kind: '30min', date: WED, equipment: ALL, seed: 4 });
    const warmup = w.segments.filter((s) => s.exercise?.category === 'warmup');
    expect(warmup.length).toBeGreaterThan(0);
    for (const s of warmup) expect([30, 120]).toContain(s.durationSec);
  });

  it('avoids a recent warm-up theme', () => {
    const themed = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 4 });
    const avoided = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 4, recentThemeIds: [themed.warmupThemeId!] });
    expect(avoided.warmupThemeId).not.toBe(themed.warmupThemeId);
  });
```

- [ ] **Step 2: Run them to confirm they fail**

```bash
npx vitest run src/generator/generateWorkout.test.ts
```
Expected: FAIL (`warmupThemeId` undefined; no warm-up `work` segment first).

- [ ] **Step 3: Add the `warmupThemeId` field to `Workout`**

In `src/domain/types.ts`, change the `Workout` interface to:

```ts
export interface Workout {
  id: string;
  kind: WorkoutKind;
  focus: Focus;
  warmupThemeId?: string;
  segments: Segment[];
}
```

- [ ] **Step 4: Add the announcement phrase**

In `src/coach/phrases.ts`, add this property to the `phrases` object (e.g. right after `next`):

```ts
  warmupAnnounce: (flowName: string): string => `Today's warm-up: ${flowName}.`,
```

- [ ] **Step 5: Replace the generator**

Replace the entire contents of `src/generator/generateWorkout.ts` with:

```ts
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

const ROUNDS: Record<WorkoutKind, number> = { '10min': 1, '20min': 2, '30min': 3, free: 2 };

const CELEBRATE_SEC = 18;
const PREPARE_SEC = 4;
const MIN_WORK_SEC = 15;
const MAX_WORK_SEC = 120;
const WARMUP_MOVE_SEC = 30;
const FREE_DANCE_SEC = 120;

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

// Spread `drift` seconds across all main work bouts so the workout hits target.
function spreadDrift(units: Unit[], drift: number): void {
  if (units.length === 0) return;
  const per = drift / units.length;
  units.forEach((u, i) => {
    const share = Math.round(per * (i + 1)) - Math.round(per * i);
    u.dur = clamp(u.dur + share, MIN_WORK_SEC, MAX_WORK_SEC);
  });
}

function prepareSegment(ex: Exercise, lead: string): Segment {
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

// --- Warm-up flow rendering ---

function warmupMoveCount(target: number, flow: WarmupFlow): number {
  if (flow.free) return 1;
  const warmupTarget = clamp(Math.round(target * 0.15), 60, 180);
  return clamp(Math.round(warmupTarget / WARMUP_MOVE_SEC), 2, flow.moves.length);
}

// A warm-up move is a short, gentle work segment (start cue + a mid encouragement
// + a soft countdown). The first one carries the welcome + theme announcement.
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
  const dur = flow.free ? FREE_DANCE_SEC : WARMUP_MOVE_SEC;
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
  const rest = restSec(focus);

  // Main exercises: `rounds` circuits of the 6-slot template (no warm-up here).
  const main: Exercise[] = [];
  let recentAcc = [...recent];
  for (let r = 0; r < rounds; r++) {
    const sel = selectExercises({
      equipment: opts.equipment, recentExerciseIds: recentAcc, rng, includeWarmup: false,
    });
    main.push(...sel);
    recentAcc = [...recentAcc, ...sel.map((e) => e.id)].slice(-12);
  }

  // Lottery: a warm-up flow that preps the day's work and avoids recent themes.
  const flow = pickWarmupFlow({ workoutCategories: main.map((e) => e.category), recentThemeIds, rng });
  const warmupSegs = buildWarmup(flow, focus, target, rng);
  const warmupTotal = warmupSegs.reduce((s, seg) => s + seg.durationSec, 0);

  // Size the MAIN work bouts so warm-up + main + celebrate ≈ target.
  const units = buildUnits(main, focus);
  const mainFixed = main.length * PREPARE_SEC + main.length * rest + CELEBRATE_SEC;
  const baseWork = units.reduce((s, u) => s + u.dur, 0);
  spreadDrift(units, target - warmupTotal - mainFixed - baseWork);

  const segments: Segment[] = [...warmupSegs];
  let cursor = 0;
  main.forEach((ex) => {
    segments.push(prepareSegment(ex, phrases.next(ex.name)));
    const sides = ex.unilateral ? 2 : 1;
    for (let s = 0; s < sides; s++) segments.push(workSegment(units[cursor++], rng));
    segments.push(restSegment(rest));
  });

  segments.push({
    kind: 'celebrate', durationSec: CELEBRATE_SEC,
    cues: [{ atSec: 0, say: phrases.celebrate(main.map((e) => e.category)) }],
  });

  return { id: `w-${seed}-${opts.kind}`, kind: opts.kind, focus, warmupThemeId: flow.id, segments };
}
```

- [ ] **Step 6: Run the full generator + phrases suite (expect PASS)**

```bash
npx vitest run src/generator/generateWorkout.test.ts src/coach/phrases.test.ts
```
Expected: PASS — the three new warm-up tests AND the six pre-existing ones (determinism, weekday focus, total-within-45s, celebrate-lists-categories, every-work-segment-has-start+countdown, unilateral split). If the duration test is off, adjust `WARMUP_MOVE_SEC` or the `0.15` warm-up fraction — do NOT loosen the 45s tolerance.

- [ ] **Step 7: Verify the whole suite + strict build**

```bash
npx vitest run
npm run build
```
Expected: all tests green; `tsc -b` + vite clean.

- [ ] **Step 8: Commit**

```bash
git add src/domain/types.ts src/coach/phrases.ts src/generator/generateWorkout.ts src/generator/generateWorkout.test.ts
git commit -m "feat: render a themed warm-up flow at the front of each workout"
```

---

### Task 3: Persist recent themes and wire them through the app

**Files:**
- Modify: `src/storage/store.ts` (recent-theme tracking)
- Modify: `src/App.tsx` (thread `recentThemeIds`, record the chosen theme)
- Test: `src/storage/store.test.ts` (recent-themes round-trip)

**Interfaces:**
- Consumes: `getRecentThemes`, `pushRecentTheme` (this task); `generateWorkout` `recentThemeIds`/`warmupThemeId` (Task 2).
- Produces:
  - `getRecentThemes(): string[]`
  - `pushRecentTheme(id: string, keep?: number): void` (newest last, de-duped, capped at `keep`, default 3)

- [ ] **Step 1: Write the failing test**

Add this test to `src/storage/store.test.ts` (the file already stubs `localStorage` per test via `vi.stubGlobal`; import the two new functions at the top):

```ts
  it('tracks recent warm-up themes — newest last, de-duped, capped', () => {
    expect(getRecentThemes()).toEqual([]);
    pushRecentTheme('hip-flow');
    pushRecentTheme('shoulder-flow');
    pushRecentTheme('hip-flow'); // re-selecting moves it to newest, no dupes
    expect(getRecentThemes()).toEqual(['shoulder-flow', 'hip-flow']);
    pushRecentTheme('a');
    pushRecentTheme('b');
    pushRecentTheme('c'); // capped at 3
    expect(getRecentThemes()).toEqual(['a', 'b', 'c']);
  });
```

Update the import line at the top of `src/storage/store.test.ts` to include the new functions, e.g.:

```ts
import { recordCompletion, getPrefs, setPrefs, currentStreak, loadStore, saveCheckpoint, getCheckpoint, clearCheckpoint, getRecentThemes, pushRecentTheme } from './store';
```
(Keep whatever names the file already imported; just add `getRecentThemes` and `pushRecentTheme`.)

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/storage/store.test.ts
```
Expected: FAIL (`getRecentThemes`/`pushRecentTheme` not exported).

- [ ] **Step 3: Implement recent-theme tracking**

In `src/storage/store.ts`:

1. Add `recentThemes?: string[];` to the `Store` interface (after `checkpoint?`).
2. Add these two functions at the end of the file:

```ts
export function getRecentThemes(): string[] {
  const r = loadStore().recentThemes;
  return Array.isArray(r) ? r : [];
}

export function pushRecentTheme(id: string, keep = 3): void {
  const s = loadStore();
  const list = (Array.isArray(s.recentThemes) ? s.recentThemes : []).filter((t) => t !== id);
  list.push(id);
  s.recentThemes = list.slice(-keep);
  saveStore(s);
}
```

- [ ] **Step 4: Run the test (expect PASS)**

```bash
npx vitest run src/storage/store.test.ts
```
Expected: PASS.

- [ ] **Step 5: Wire it into the app**

In `src/App.tsx`:

1. Add `getRecentThemes` and `pushRecentTheme` to the existing import from `./storage/store`:
```ts
import { recordCompletion, currentStreak, getPrefs, getCheckpoint, getRecentThemes, pushRecentTheme } from './storage/store';
```
2. Replace the `handleStart` function with:
```ts
  function handleStart(kind: WorkoutKind) {
    const w = generateWorkout({
      kind, date: new Date(), equipment: getPrefs().equipment, recentThemeIds: getRecentThemes(),
    });
    if (w.warmupThemeId) pushRecentTheme(w.warmupThemeId);
    setResumeFrom(null);
    setWorkout(w);
    setPhase('active');
  }
```

- [ ] **Step 6: Verify the whole suite + strict build**

```bash
npx vitest run
npm run build
```
Expected: all tests green; build clean. (App.tsx has no unit test in v1; the build's `tsc -b` is the type gate, and the wiring is exercised manually.)

- [ ] **Step 7: Commit**

```bash
git add src/storage/store.ts src/storage/store.test.ts src/App.tsx
git commit -m "feat: persist recent warm-up themes so the lottery never repeats day to day"
```

---

## Self-Review

**Spec coverage** (against `docs/superpowers/specs/2026-06-24-themed-warmups-and-rotation-design.md`):
- Named themed warm-up flows (Hip/Shoulder/Animal/Dance + Free Dance) → Task 1 `WARMUP_FLOWS` ✓
- 2-minute free-dance warm-up ("put on a song…") → `free-dance` move (120s) + `free` flow ✓
- Mobility Lottery: never repeat recent theme → Task 1 `pickWarmupFlow` + Task 3 persistence ✓
- Body-aware (preps the day's work) → `preps` weighting in `pickWarmupFlow` ✓
- Coach announces by name ("Today's warm-up: …") → Task 2 `phrases.warmupAnnounce` + first warm-up cue ✓
- Warm-up flows are short (2–3 min, scale with length, not drift-stretched) → `warmupMoveCount` + excluded from `spreadDrift` ✓
- Determinism preserved → seeded `rng` threaded through lottery + warm-up build ✓
- **Out of scope (deliberately deferred, per the design doc):** the non-negotiable/rotating *main-template* redesign. This plan keeps v1's fixed 6-slot main template and only upgrades the warm-up slot. Noted in the design doc as a separable follow-up.

**Placeholder scan:** No TBD/TODO. Every code step has complete code.

**Type consistency:** `WarmupFlow` shape is identical across Task 1 (definition) and Task 2 (consumption). `pickWarmupFlow`/`exerciseById` signatures match their call sites. `Workout.warmupThemeId?` (Task 2) is read in Task 3's `App.handleStart`. `GenerateOptions.recentThemeIds?` (Task 2) is supplied by Task 3. `getRecentThemes`/`pushRecentTheme` names match between `store.ts` and `App.tsx`.

> Known soft spot: Task 2 changes the generator's time-budget (warm-up is now fixed and excluded from drift). The "total within 45s" test is the guard — if it fails, tune `WARMUP_MOVE_SEC` / the 0.15 fraction, not the tolerance.
