# Move With Elli — "The Spine" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 "Spine" of Move With Elli — press Start, get voice-guided through a rule-generated full-body workout, finish with a capability summary, streak saved — as an offline PWA.

**Architecture:** Functional-core / imperative-shell. A pure, fully unit-tested core (`domain` → `generator` → `engine`) emits a precomputed list of timed `Segment`s each carrying its own scheduled cues. Thin browser adapters (`coach` voice, `feedback` haptics, `storage`) and a React UI sit on top. A clock-driven state machine plays segments; a Screen Wake Lock keeps the clock alive.

**Tech Stack:** React + Vite + TypeScript (strict) + Tailwind v4 (`@tailwindcss/vite`) + Vitest + `@testing-library/react` + `vite-plugin-pwa` (Workbox). Deploy: GitHub Pages via Actions.

## Global Constraints

- **Package manager:** `npm`. Test runner: `vitest` (commands: `npx vitest run <path>` for one-shot).
- **TypeScript strict mode on**; no `any` in committed code.
- **The pure core (`src/domain`, `src/generator`, `src/engine`, `src/storage/streak.ts`, `src/coach/phrases.ts`) must not import any browser API** (`window`, `navigator`, `document`, `speechSynthesis`). This keeps it testable with a fake clock.
- **Coach tone:** calm, encouraging, present-tense. Never military/guilt/calorie/body-weight language. All spoken copy lives in `src/coach/phrases.ts`.
- **Determinism:** generation is seeded — same `{kind, date, equipment, recentExerciseIds, seed}` ⇒ identical `Workout`.
- **Single user name:** "Elli" (hard-coded in v1 phrases).
- **GitHub Pages base path:** `/fitness-coach/` (used by Vite `base` and PWA `scope`/`start_url`).
- **Commit after every task** with a `feat:`/`chore:`/`test:` message.

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Create: `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a runnable Vite app + working Vitest. Later tasks rely on `npm run dev`, `npm run build`, and `npx vitest run <path>`.

- [ ] **Step 1: Scaffold Vite React-TS app into the current directory**

```bash
npm create vite@latest . -- --template react-ts
npm install
```
If prompted that the directory is not empty, choose to **ignore/continue** (keeps `docs/` and `.git/`).

- [ ] **Step 2: Add Tailwind v4, Vitest, Testing Library, PWA plugin**

```bash
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom @vitejs/plugin-react vite-plugin-pwa
```

- [ ] **Step 3: Configure Vite (Tailwind + React + PWA stub + Vitest + base path)**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/fitness-coach/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

Create `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Wire Tailwind into CSS and add npm scripts**

Replace `src/index.css` with:

```css
@import 'tailwindcss';

:root { color-scheme: dark; }
html, body, #root { height: 100%; }
body { margin: 0; background: #0b0f14; color: #f5f7fa; -webkit-font-smoothing: antialiased; }
```

In `package.json`, ensure the `scripts` block contains:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 5: Write the smoke test**

Create `src/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test (expect PASS) and a build**

```bash
npx vitest run src/smoke.test.ts
npm run build
```
Expected: test PASS; build completes and writes `dist/`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest + PWA deps"
```

---

### Task 2: Domain types and exercise library

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/exercises.ts`
- Test: `src/domain/exercises.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - Types: `Category`, `Equipment`, `Goal`, `HapticKind`, `Cue`, `Segment`, `SegmentKind`, `Exercise`, `Workout`, `WorkoutKind`, `Focus`.
  - `EXERCISES: Exercise[]` and `exercisesByCategory(category: Category): Exercise[]`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/exercises.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { EXERCISES, exercisesByCategory } from './exercises';
import type { Category } from './types';

const REQUIRED: Category[] = ['warmup', 'push', 'pull', 'legs', 'hinge', 'carry', 'crawl', 'mobility'];

describe('exercise library', () => {
  it('has at least one exercise in every required category', () => {
    for (const cat of REQUIRED) {
      expect(exercisesByCategory(cat).length).toBeGreaterThan(0);
    }
  });

  it('every exercise has a non-empty cue, >=1 equipment, >=1 goal', () => {
    for (const ex of EXERCISES) {
      expect(ex.cue.trim().length).toBeGreaterThan(0);
      expect(ex.equipment.length).toBeGreaterThan(0);
      expect(ex.goals.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('has unique ids', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('time-measured exercises declare defaultDurationSec; rep-measured declare defaultReps', () => {
    for (const ex of EXERCISES) {
      if (ex.measure === 'time') expect(ex.defaultDurationSec).toBeGreaterThan(0);
      else expect(ex.defaultReps).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/domain/exercises.test.ts
```
Expected: FAIL (`Cannot find module './exercises'`).

- [ ] **Step 3: Create the types**

Create `src/domain/types.ts`:

```ts
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

export type SegmentKind = 'prepare' | 'work' | 'rest' | 'celebrate';

export interface Segment {
  kind: SegmentKind;
  exercise?: Exercise;
  side?: 'left' | 'right';
  durationSec: number;
  cues: Cue[];
}

export type WorkoutKind = '10min' | '20min' | '30min' | 'free';
export type Focus = 'strength' | 'movement';

export interface Workout {
  id: string;
  kind: WorkoutKind;
  focus: Focus;
  segments: Segment[];
}
```

- [ ] **Step 4: Create the exercise library**

Create `src/domain/exercises.ts`:

```ts
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
```

- [ ] **Step 5: Run the test (expect PASS)**

```bash
npx vitest run src/domain/exercises.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/domain/
git commit -m "feat: add domain types and exercise library"
```

---

### Task 3: Seeded RNG and weekday focus

**Files:**
- Create: `src/generator/rng.ts`
- Create: `src/generator/schedule.ts`
- Test: `src/generator/rng.test.ts`, `src/generator/schedule.test.ts`

**Interfaces:**
- Consumes: `Focus` from `domain/types`.
- Produces:
  - `createRng(seed: number): () => number` (returns floats in [0,1)).
  - `pick<T>(rng: () => number, arr: T[]): T`.
  - `focusForDate(date: Date): Focus`.

- [ ] **Step 1: Write the failing tests**

Create `src/generator/rng.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createRng, pick } from './rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces floats in [0,1)', () => {
    const r = createRng(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('pick selects deterministically from an array', () => {
    const r = createRng(7);
    const choice = pick(r, ['a', 'b', 'c', 'd']);
    expect(['a', 'b', 'c', 'd']).toContain(choice);
    expect(pick(createRng(7), ['a', 'b', 'c', 'd'])).toBe(choice);
  });
});
```

Create `src/generator/schedule.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { focusForDate } from './schedule';

describe('focusForDate', () => {
  it('is strength on Sunday, Tuesday, Thursday', () => {
    expect(focusForDate(new Date('2026-06-21T08:00:00'))).toBe('strength'); // Sun
    expect(focusForDate(new Date('2026-06-23T08:00:00'))).toBe('strength'); // Tue
    expect(focusForDate(new Date('2026-06-25T08:00:00'))).toBe('strength'); // Thu
  });

  it('is movement on the other days', () => {
    expect(focusForDate(new Date('2026-06-22T08:00:00'))).toBe('movement'); // Mon
    expect(focusForDate(new Date('2026-06-24T08:00:00'))).toBe('movement'); // Wed
    expect(focusForDate(new Date('2026-06-26T08:00:00'))).toBe('movement'); // Fri
    expect(focusForDate(new Date('2026-06-27T08:00:00'))).toBe('movement'); // Sat
  });
});
```

- [ ] **Step 2: Run them to confirm they fail**

```bash
npx vitest run src/generator/rng.test.ts src/generator/schedule.test.ts
```
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement the RNG (mulberry32)**

Create `src/generator/rng.ts`:

```ts
/** Deterministic PRNG (mulberry32). Same seed → same sequence. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  if (arr.length === 0) throw new Error('pick from empty array');
  return arr[Math.floor(rng() * arr.length)];
}
```

- [ ] **Step 4: Implement the schedule**

Create `src/generator/schedule.ts`:

```ts
import type { Focus } from '../domain/types';

// PRD weekly structure: Sun/Tue/Thu = strength; all other days = movement.
const STRENGTH_DAYS = new Set([0, 2, 4]); // 0=Sun, 2=Tue, 4=Thu

export function focusForDate(date: Date): Focus {
  return STRENGTH_DAYS.has(date.getDay()) ? 'strength' : 'movement';
}
```

- [ ] **Step 5: Run the tests (expect PASS)**

```bash
npx vitest run src/generator/rng.test.ts src/generator/schedule.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/generator/rng.ts src/generator/schedule.ts src/generator/rng.test.ts src/generator/schedule.test.ts
git commit -m "feat: add seeded rng and weekday focus schedule"
```

---

### Task 4: Generator — exercise selection (template + equipment filter + anti-repeat)

**Files:**
- Create: `src/generator/selectExercises.ts`
- Test: `src/generator/selectExercises.test.ts`

**Interfaces:**
- Consumes: `EXERCISES`, `exercisesByCategory`, `Exercise`, `Equipment`, `createRng`, `pick`.
- Produces:
  - `SLOTS: Category[]` (the fixed template order).
  - `selectExercises(opts: { equipment: Equipment[]; recentExerciseIds: string[]; rng: () => number; includeExtras: number }): Exercise[]` — returns warmup first, then one exercise per required slot, then `includeExtras` optional (core/balance/mobility) exercises. Every returned exercise's `equipment ⊆ available`. Avoids `recentExerciseIds` when an alternative exists.

- [ ] **Step 1: Write the failing test**

Create `src/generator/selectExercises.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectExercises, SLOTS } from './selectExercises';
import { createRng } from './rng';
import type { Equipment } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];

describe('selectExercises', () => {
  it('returns warmup first, then exactly one exercise per required slot', () => {
    const out = selectExercises({ equipment: ALL, recentExerciseIds: [], rng: createRng(1), includeExtras: 0 });
    expect(out[0].category).toBe('warmup');
    const main = out.slice(1);
    expect(main.map((e) => e.category)).toEqual(SLOTS);
  });

  it('only picks exercises whose equipment is all available', () => {
    const bodyOnly: Equipment[] = ['bodyweight'];
    const out = selectExercises({ equipment: bodyOnly, recentExerciseIds: [], rng: createRng(3), includeExtras: 2 });
    for (const ex of out) {
      for (const eq of ex.equipment) expect(bodyOnly).toContain(eq);
    }
  });

  it('avoids recent exercises when an alternative exists', () => {
    // Pull slot has several options; force avoidance of dead-hang.
    const out = selectExercises({ equipment: ALL, recentExerciseIds: ['dead-hang'], rng: createRng(5), includeExtras: 0 });
    const pull = out.find((e) => e.category === 'pull');
    expect(pull?.id).not.toBe('dead-hang');
  });

  it('appends the requested number of extra exercises from core/balance/mobility', () => {
    const out = selectExercises({ equipment: ALL, recentExerciseIds: [], rng: createRng(2), includeExtras: 2 });
    const extras = out.slice(1 + SLOTS.length);
    expect(extras.length).toBe(2);
    for (const ex of extras) expect(['core', 'balance', 'mobility']).toContain(ex.category);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/generator/selectExercises.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement selection**

Create `src/generator/selectExercises.ts`:

```ts
import type { Category, Equipment, Exercise } from '../domain/types';
import { EXERCISES, exercisesByCategory } from '../domain/exercises';
import { pick } from './rng';

// Fixed template (after warmup). "carry" slot may also draw from "crawl".
export const SLOTS: Category[] = ['push', 'pull', 'legs', 'hinge', 'carry', 'mobility'];
const EXTRA_CATEGORIES: Category[] = ['core', 'balance', 'mobility'];

function hasEquipment(ex: Exercise, available: Equipment[]): boolean {
  return ex.equipment.every((eq) => available.includes(eq));
}

function candidatesFor(category: Category, available: Equipment[]): Exercise[] {
  const cats: Category[] = category === 'carry' ? ['carry', 'crawl'] : [category];
  return EXERCISES.filter((e) => cats.includes(e.category) && hasEquipment(e, available));
}

function choose(
  pool: Exercise[],
  recent: string[],
  used: Set<string>,
  rng: () => number,
): Exercise | null {
  const free = pool.filter((e) => !used.has(e.id));
  if (free.length === 0) return null;
  const fresh = free.filter((e) => !recent.includes(e.id));
  return pick(rng, fresh.length > 0 ? fresh : free);
}

export interface SelectOptions {
  equipment: Equipment[];
  recentExerciseIds: string[];
  rng: () => number;
  includeExtras: number;
}

export function selectExercises(opts: SelectOptions): Exercise[] {
  const { equipment, recentExerciseIds, rng, includeExtras } = opts;
  const used = new Set<string>();
  const out: Exercise[] = [];

  const warmup = choose(
    exercisesByCategory('warmup').filter((e) => hasEquipment(e, equipment)),
    recentExerciseIds, used, rng,
  );
  if (warmup) { out.push(warmup); used.add(warmup.id); }

  for (const slot of SLOTS) {
    const chosen = choose(candidatesFor(slot, equipment), recentExerciseIds, used, rng);
    if (chosen) { out.push(chosen); used.add(chosen.id); }
  }

  for (let i = 0; i < includeExtras; i++) {
    const pool = EXTRA_CATEGORIES.flatMap((c) => exercisesByCategory(c)).filter((e) => hasEquipment(e, equipment));
    const extra = choose(pool, recentExerciseIds, used, rng);
    if (extra) { out.push(extra); used.add(extra.id); }
  }

  return out;
}
```

- [ ] **Step 4: Run the test (expect PASS)**

```bash
npx vitest run src/generator/selectExercises.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/generator/selectExercises.ts src/generator/selectExercises.test.ts
git commit -m "feat: add exercise selection with equipment filter and anti-repeat"
```

---

### Task 5: Generator — build the timed workout (segments + cues + time budget)

**Files:**
- Create: `src/coach/phrases.ts`
- Create: `src/generator/generateWorkout.ts`
- Test: `src/coach/phrases.test.ts`, `src/generator/generateWorkout.test.ts`

**Interfaces:**
- Consumes: `selectExercises`, `SLOTS`, `focusForDate`, `createRng`, all domain types.
- Produces:
  - `phrases` object (pure copy builders): `welcome(focus)`, `exercise(name)`, `begin()`, `rest()`, `next(name)`, `count(n)`, `celebrate(categories)`, `encourage(rng)`.
  - `generateWorkout(opts: GenerateOptions): Workout` where
    `GenerateOptions = { kind: WorkoutKind; date: Date; equipment: Equipment[]; recentExerciseIds?: string[]; seed?: number }`.
  - `TARGET_SECONDS: Record<Exclude<WorkoutKind,'free'>, number>` and `'free' → 20min default`.

- [ ] **Step 1: Write the failing tests**

Create `src/coach/phrases.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { phrases } from './phrases';

describe('phrases', () => {
  it('welcomes Elli by name with the focus', () => {
    const line = phrases.welcome('strength');
    expect(line).toContain('Elli');
    expect(line.toLowerCase()).toContain('strength');
  });

  it('never uses banned (calorie/weight/guilt) language in core lines', () => {
    const lines = [
      phrases.welcome('movement'), phrases.rest(), phrases.begin(),
      phrases.celebrate(['push', 'pull', 'hinge', 'carry', 'mobility']),
      phrases.encourage(() => 0),
    ];
    const banned = /calorie|weight loss|burn|fat|harder|no excuses/i;
    for (const l of lines) expect(l).not.toMatch(banned);
  });

  it('celebrate lists the practiced categories', () => {
    const line = phrases.celebrate(['push', 'pull']);
    expect(line.toLowerCase()).toContain('push');
    expect(line.toLowerCase()).toContain('pull');
  });
});
```

Create `src/generator/generateWorkout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateWorkout } from './generateWorkout';
import type { Equipment, Segment } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const WED = new Date('2026-06-24T08:00:00'); // movement day
const TUE = new Date('2026-06-23T08:00:00'); // strength day

function total(segs: Segment[]): number {
  return segs.reduce((s, seg) => s + seg.durationSec, 0);
}

describe('generateWorkout', () => {
  it('is deterministic for the same inputs', () => {
    const a = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 99 });
    const b = generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 99 });
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('sets focus from the weekday', () => {
    expect(generateWorkout({ kind: '20min', date: TUE, equipment: ALL, seed: 1 }).focus).toBe('strength');
    expect(generateWorkout({ kind: '20min', date: WED, equipment: ALL, seed: 1 }).focus).toBe('movement');
  });

  it('total duration is within 45s of the target', () => {
    for (const [kind, target] of [['10min', 600], ['20min', 1200], ['30min', 1800]] as const) {
      const w = generateWorkout({ kind, date: WED, equipment: ALL, seed: 4 });
      expect(Math.abs(total(w.segments) - target)).toBeLessThanOrEqual(45);
    }
  });

  it('ends with a celebrate segment whose first cue lists categories', () => {
    const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed: 4 });
    const last = w.segments[w.segments.length - 1];
    expect(last.kind).toBe('celebrate');
    expect(last.cues[0].say?.toLowerCase()).toContain('push');
  });

  it('every work segment fires a start haptic at 0 and a countdown haptic before the end', () => {
    const w = generateWorkout({ kind: '10min', date: WED, equipment: ALL, seed: 4 });
    const work = w.segments.filter((s) => s.kind === 'work');
    expect(work.length).toBeGreaterThan(0);
    for (const seg of work) {
      expect(seg.cues.some((c) => c.atSec === 0 && c.haptic === 'start')).toBe(true);
      expect(seg.cues.some((c) => c.haptic === 'countdown')).toBe(true);
    }
  });

  it('splits unilateral exercises into left and right work segments', () => {
    // seed chosen so a unilateral exercise appears; assert pairing invariant holds generally.
    const w = generateWorkout({ kind: '30min', date: TUE, equipment: ALL, seed: 4 });
    const sides = w.segments.filter((s) => s.side).map((s) => s.side);
    // sides always come in left-before-right order
    for (let i = 0; i < sides.length; i += 2) {
      expect(sides[i]).toBe('left');
      expect(sides[i + 1]).toBe('right');
    }
  });
});
```

- [ ] **Step 2: Run them to confirm they fail**

```bash
npx vitest run src/coach/phrases.test.ts src/generator/generateWorkout.test.ts
```
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement the phrase builders**

Create `src/coach/phrases.ts`:

```ts
import type { Category, Focus } from '../domain/types';

const FOCUS_LABEL: Record<Focus, string> = {
  strength: 'strength and mobility',
  movement: 'movement and play',
};

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

const ENCOURAGEMENTS = [
  'Beautiful work.',
  'Smooth and strong.',
  "You're getting stronger.",
  'Stay with it, you look great.',
  'Lovely control.',
];

const CATEGORY_LABEL: Partial<Record<Category, string>> = {
  push: 'push', pull: 'pull', legs: 'legs', hinge: 'hinge',
  carry: 'carry', crawl: 'crawl', core: 'core', balance: 'balance',
  mobility: 'mobility', warmup: 'warm-up',
};

export const phrases = {
  welcome: (focus: Focus): string =>
    `Welcome back, Elli. Today's focus is ${FOCUS_LABEL[focus]}. Let's begin.`,
  exercise: (name: string): string => `${name}.`,
  begin: (): string => 'Begin.',
  rest: (): string => 'Rest. Take a deep breath.',
  next: (name: string): string => `Next exercise. ${name}.`,
  count: (n: number): string => NUMBER_WORDS[n] ?? String(n),
  encourage: (rng: () => number): string =>
    ENCOURAGEMENTS[Math.floor(rng() * ENCOURAGEMENTS.length)],
  celebrate: (categories: Category[]): string => {
    const labels = Array.from(new Set(categories.map((c) => CATEGORY_LABEL[c] ?? c)));
    return `Great job, Elli. Today you practiced ${labels.join(', ')}. You're more capable than yesterday.`;
  },
};
```

- [ ] **Step 4: Implement the generator**

Create `src/generator/generateWorkout.ts`:

```ts
import type {
  Cue, Equipment, Exercise, Focus, Segment, Workout, WorkoutKind,
} from '../domain/types';
import { selectExercises } from './selectExercises';
import { focusForDate } from './schedule';
import { createRng } from './rng';
import { phrases } from '../coach/phrases';

export interface GenerateOptions {
  kind: WorkoutKind;
  date: Date;
  equipment: Equipment[];
  recentExerciseIds?: string[];
  seed?: number;
}

export const TARGET_SECONDS: Record<Exclude<WorkoutKind, 'free'>, number> = {
  '10min': 600, '20min': 1200, '30min': 1800,
};

const CELEBRATE_SEC = 18;
const PREPARE_SEC = 4;

function targetFor(kind: WorkoutKind): number {
  return kind === 'free' ? 1200 : TARGET_SECONDS[kind];
}

// Per-exercise work + rest durations, biased by focus.
function workSec(ex: Exercise, focus: Focus): number {
  if (ex.measure === 'time') return ex.defaultDurationSec ?? 30;
  const perRep = focus === 'strength' ? 3.5 : 3;
  return Math.round((ex.defaultReps ?? 8) * perRep);
}
function restSec(focus: Focus): number {
  return focus === 'strength' ? 30 : 20;
}

// Rough cost of one exercise (both sides if unilateral) including prepare + rest.
function exerciseCost(ex: Exercise, focus: Focus): number {
  const sides = ex.unilateral ? 2 : 1;
  return PREPARE_SEC + sides * workSec(ex, focus) + restSec(focus);
}

function prepareSegment(ex: Exercise, announceNext: boolean, rng: () => number, isFirst: boolean, focus: Focus): Segment {
  const cues: Cue[] = [];
  const lead = isFirst ? `${phrases.welcome(focus)} ${phrases.exercise(ex.name)}` : phrases.next(ex.name);
  cues.push({ atSec: 0, say: lead, haptic: 'next' });
  cues.push({ atSec: 1, say: phrases.count(3) });
  cues.push({ atSec: 2, say: phrases.count(2) });
  cues.push({ atSec: 3, say: phrases.count(1) });
  void announceNext; void rng;
  return { kind: 'prepare', exercise: ex, durationSec: PREPARE_SEC, cues };
}

function workSegment(ex: Exercise, dur: number, side: 'left' | 'right' | undefined, rng: () => number): Segment {
  const cues: Cue[] = [{ atSec: 0, say: phrases.begin(), haptic: 'start' }];
  if (dur >= 25) cues.push({ atSec: Math.floor(dur / 2), say: phrases.encourage(rng) });
  cues.push({ atSec: Math.max(1, dur - 5), haptic: 'countdown' });
  return { kind: 'work', exercise: ex, side, durationSec: dur, cues };
}

function restSegment(dur: number): Segment {
  return { kind: 'rest', durationSec: dur, cues: [{ atSec: 0, say: phrases.rest(), haptic: 'rest' }] };
}

export function generateWorkout(opts: GenerateOptions): Workout {
  const focus = focusForDate(opts.date);
  const seed = opts.seed ?? Math.floor(opts.date.getTime() / 86_400_000);
  const rng = createRng(seed);
  const recent = opts.recentExerciseIds ?? [];
  const target = targetFor(opts.kind);

  // Decide how many optional extras fit: start with template-only, add extras greedily.
  const base = selectExercises({ equipment: opts.equipment, recentExerciseIds: recent, rng: createRng(seed), includeExtras: 0 });
  let budget = base.reduce((s, ex) => s + exerciseCost(ex, focus), 0) + CELEBRATE_SEC;
  let extras = 0;
  const avgExtraCost = PREPARE_SEC + 35 + restSec(focus);
  while (budget + avgExtraCost <= target && extras < 4) { budget += avgExtraCost; extras++; }

  const exercises = selectExercises({ equipment: opts.equipment, recentExerciseIds: recent, rng, includeExtras: extras });

  const segments: Segment[] = [];
  exercises.forEach((ex, i) => {
    segments.push(prepareSegment(ex, true, rng, i === 0, focus));
    const dur = workSec(ex, focus);
    if (ex.unilateral) {
      segments.push(workSegment(ex, dur, 'left', rng));
      segments.push(workSegment(ex, dur, 'right', rng));
    } else {
      segments.push(workSegment(ex, dur, undefined, rng));
    }
    segments.push(restSegment(restSec(focus)));
  });

  // Trim or pad the final rest so total lands near target.
  const celebrate: Segment = {
    kind: 'celebrate', durationSec: CELEBRATE_SEC,
    cues: [{ atSec: 0, say: phrases.celebrate(exercises.map((e) => e.category)) }],
  };
  const running = segments.reduce((s, seg) => s + seg.durationSec, 0) + CELEBRATE_SEC;
  const drift = target - running;
  const lastRest = [...segments].reverse().find((s) => s.kind === 'rest');
  if (lastRest) lastRest.durationSec = Math.max(5, lastRest.durationSec + drift);
  segments.push(celebrate);

  return { id: `w-${seed}-${opts.kind}`, kind: opts.kind, focus, segments };
}
```

- [ ] **Step 5: Run the tests (expect PASS)**

```bash
npx vitest run src/coach/phrases.test.ts src/generator/generateWorkout.test.ts
```
Expected: PASS. If the duration test is off, adjust `avgExtraCost`/durations — do not loosen the tolerance below 45s without cause.

- [ ] **Step 6: Commit**

```bash
git add src/coach/phrases.ts src/coach/phrases.test.ts src/generator/generateWorkout.ts src/generator/generateWorkout.test.ts
git commit -m "feat: add timed workout generator with scheduled coach cues"
```

---

### Task 6: Engine — the Clock abstraction

**Files:**
- Create: `src/engine/clock.ts`
- Test: `src/engine/clock.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Clock { start(): void; stop(): void; onTick(cb: (dtSec: number) => void): void; }`
  - `class FakeClock implements Clock` with `tick(dtSec: number): void`.
  - `class RafClock implements Clock` (uses `requestAnimationFrame` + `performance.now`).

- [ ] **Step 1: Write the failing test**

Create `src/engine/clock.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { FakeClock } from './clock';

describe('FakeClock', () => {
  it('delivers ticks only while started', () => {
    const clock = new FakeClock();
    const cb = vi.fn();
    clock.onTick(cb);

    clock.tick(1);          // not started yet
    expect(cb).not.toHaveBeenCalled();

    clock.start();
    clock.tick(0.5);
    clock.tick(0.5);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(0.5);

    clock.stop();
    clock.tick(1);
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/engine/clock.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the clocks**

Create `src/engine/clock.ts`:

```ts
export interface Clock {
  start(): void;
  stop(): void;
  onTick(cb: (dtSec: number) => void): void;
}

export class FakeClock implements Clock {
  private cb: ((dt: number) => void) | null = null;
  private running = false;
  onTick(cb: (dt: number) => void): void { this.cb = cb; }
  start(): void { this.running = true; }
  stop(): void { this.running = false; }
  tick(dtSec: number): void { if (this.running && this.cb) this.cb(dtSec); }
}

export class RafClock implements Clock {
  private cb: ((dt: number) => void) | null = null;
  private raf = 0;
  private last = 0;
  onTick(cb: (dt: number) => void): void { this.cb = cb; }
  start(): void {
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = (now - this.last) / 1000;
      this.last = now;
      this.cb?.(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop(): void { cancelAnimationFrame(this.raf); }
}
```

- [ ] **Step 4: Run the test (expect PASS)**

```bash
npx vitest run src/engine/clock.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/clock.ts src/engine/clock.test.ts
git commit -m "feat: add Clock abstraction with FakeClock and RafClock"
```

---

### Task 7: Engine — WorkoutSession state machine

**Files:**
- Create: `src/engine/session.ts`
- Test: `src/engine/session.test.ts`

**Interfaces:**
- Consumes: `Clock`, `Workout`, `Segment`, `Cue`.
- Produces:
  - `type SessionStatus = 'idle' | 'running' | 'paused' | 'done'`
  - `interface SessionState { status: SessionStatus; segmentIndex: number; segment: Segment | null; segmentRemainingSec: number; }`
  - `type SessionEvent = { type:'tick'; state:SessionState } | { type:'segmentChanged'; index:number; segment:Segment } | { type:'cue'; cue:Cue } | { type:'finished' }`
  - `class WorkoutSession` with `constructor(workout, clock, onEvent)`, `start()`, `pause()`, `resume()`, `skip()`, `end()`, `getState()`.

- [ ] **Step 1: Write the failing tests**

Create `src/engine/session.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { WorkoutSession, type SessionEvent } from './session';
import { FakeClock } from './clock';
import type { Workout } from '../domain/types';

function makeWorkout(): Workout {
  return {
    id: 't', kind: '10min', focus: 'movement',
    segments: [
      { kind: 'work', durationSec: 10, cues: [
        { atSec: 0, say: 'Begin.', haptic: 'start' },
        { atSec: 5, haptic: 'countdown' },
      ] },
      { kind: 'rest', durationSec: 4, cues: [{ atSec: 0, say: 'Rest.', haptic: 'rest' }] },
      { kind: 'celebrate', durationSec: 2, cues: [{ atSec: 0, say: 'Great job.' }] },
    ],
  };
}

function run(): { clock: FakeClock; events: SessionEvent[]; session: WorkoutSession } {
  const clock = new FakeClock();
  const events: SessionEvent[] = [];
  const session = new WorkoutSession(makeWorkout(), clock, (e) => events.push(e));
  return { clock, events, session };
}

describe('WorkoutSession', () => {
  it('fires a cue at atSec=0 when a segment starts', () => {
    const { clock, events, session } = run();
    session.start();
    clock.tick(0.1);
    const cues = events.filter((e) => e.type === 'cue');
    expect(cues.some((c) => c.type === 'cue' && c.cue.haptic === 'start')).toBe(true);
  });

  it('fires each cue exactly once', () => {
    const { clock, session } = run();
    const cueFn = vi.fn();
    session.start();
    for (let i = 0; i < 200; i++) clock.tick(0.1); // 20s, past the whole workout
    // re-run counting via fresh capture:
    const clock2 = new FakeClock();
    const seen: number[] = [];
    const s2 = new WorkoutSession(makeWorkout(), clock2, (e) => { if (e.type === 'cue') seen.push(e.cue.atSec); });
    s2.start();
    for (let i = 0; i < 200; i++) clock2.tick(0.1);
    // first work segment has cues at 0 and 5 → both once
    expect(seen.filter((s) => s === 5).length).toBe(1);
    void cueFn;
  });

  it('advances segments and emits finished at the end', () => {
    const { clock, events, session } = run();
    session.start();
    for (let i = 0; i < 200; i++) clock.tick(0.1);
    expect(events.some((e) => e.type === 'finished')).toBe(true);
    expect(session.getState().status).toBe('done');
  });

  it('pause stops time advancing; resume continues', () => {
    const { clock, session } = run();
    session.start();
    clock.tick(2);
    session.pause();
    const remaining = session.getState().segmentRemainingSec;
    clock.tick(5);
    expect(session.getState().segmentRemainingSec).toBe(remaining);
    session.resume();
    clock.tick(1);
    expect(session.getState().segmentRemainingSec).toBeLessThan(remaining);
  });

  it('skip jumps to the next segment', () => {
    const { clock, events, session } = run();
    session.start();
    clock.tick(0.1);
    session.skip();
    clock.tick(0.1);
    const changes = events.filter((e) => e.type === 'segmentChanged');
    expect(changes.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/engine/session.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the session**

Create `src/engine/session.ts`:

```ts
import type { Cue, Segment, Workout } from '../domain/types';
import type { Clock } from './clock';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'done';

export interface SessionState {
  status: SessionStatus;
  segmentIndex: number;
  segment: Segment | null;
  segmentRemainingSec: number;
}

export type SessionEvent =
  | { type: 'tick'; state: SessionState }
  | { type: 'segmentChanged'; index: number; segment: Segment }
  | { type: 'cue'; cue: Cue }
  | { type: 'finished' };

export class WorkoutSession {
  private index = 0;
  private elapsedInSeg = 0;
  private cueCursor = 0;
  private status: SessionStatus = 'idle';

  constructor(
    private readonly workout: Workout,
    private readonly clock: Clock,
    private readonly onEvent: (e: SessionEvent) => void,
  ) {
    this.clock.onTick((dt) => this.handleTick(dt));
  }

  getState(): SessionState {
    const segment = this.workout.segments[this.index] ?? null;
    return {
      status: this.status,
      segmentIndex: this.index,
      segment,
      segmentRemainingSec: segment ? Math.max(0, segment.durationSec - this.elapsedInSeg) : 0,
    };
  }

  start(): void {
    if (this.status !== 'idle') return;
    this.status = 'running';
    this.clock.start();
    this.enterSegment(0);
  }

  pause(): void { if (this.status === 'running') this.status = 'paused'; }
  resume(): void { if (this.status === 'paused') this.status = 'running'; }

  skip(): void {
    if (this.status === 'running' || this.status === 'paused') this.advance();
  }

  end(): void {
    this.status = 'done';
    this.clock.stop();
    this.onEvent({ type: 'finished' });
  }

  private enterSegment(i: number): void {
    this.index = i;
    this.elapsedInSeg = 0;
    this.cueCursor = 0;
    const segment = this.workout.segments[i];
    this.onEvent({ type: 'segmentChanged', index: i, segment });
    this.fireDueCues();
    this.onEvent({ type: 'tick', state: this.getState() });
  }

  private advance(): void {
    const next = this.index + 1;
    if (next >= this.workout.segments.length) { this.end(); return; }
    this.enterSegment(next);
  }

  private fireDueCues(): void {
    const cues = this.workout.segments[this.index].cues;
    const sorted = [...cues].sort((a, b) => a.atSec - b.atSec);
    while (this.cueCursor < sorted.length && this.elapsedInSeg >= sorted[this.cueCursor].atSec) {
      this.onEvent({ type: 'cue', cue: sorted[this.cueCursor] });
      this.cueCursor++;
    }
  }

  private handleTick(dtSec: number): void {
    if (this.status !== 'running') return;
    this.elapsedInSeg += dtSec;
    this.fireDueCues();
    const seg = this.workout.segments[this.index];
    if (this.elapsedInSeg >= seg.durationSec) { this.advance(); return; }
    this.onEvent({ type: 'tick', state: this.getState() });
  }
}
```

- [ ] **Step 4: Run the tests (expect PASS)**

```bash
npx vitest run src/engine/session.test.ts
```
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/engine/session.ts src/engine/session.test.ts
git commit -m "feat: add WorkoutSession clock-driven state machine"
```

---

### Task 8: Coach adapter (SpeechSynthesis) + NullCoach

**Files:**
- Create: `src/coach/coach.ts`
- Test: `src/coach/coach.test.ts`

**Interfaces:**
- Consumes: nothing (browser `speechSynthesis` accessed lazily).
- Produces:
  - `interface Coach { speak(text: string): void; cancel(): void; prime(): void; getVoices(): SpeechSynthesisVoice[]; setVoiceURI(uri: string): void; }`
  - `class SpeechCoach implements Coach`
  - `class NullCoach implements Coach` (no-op, for tests/SSR).
  - `createCoach(): Coach` — returns `SpeechCoach` if `speechSynthesis` exists, else `NullCoach`.

- [ ] **Step 1: Write the failing test**

Create `src/coach/coach.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeechCoach, NullCoach } from './coach';

describe('SpeechCoach', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(), cancel: vi.fn(), getVoices: () => [],
    });
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text = ''; voice: unknown = null; rate = 1; pitch = 1;
      constructor(t: string) { this.text = t; }
    });
  });

  it('speak() forwards text to speechSynthesis.speak', () => {
    const c = new SpeechCoach();
    c.speak('Rest.');
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('cancel() calls speechSynthesis.cancel', () => {
    const c = new SpeechCoach();
    c.cancel();
    expect(speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('NullCoach is a no-op and never throws', () => {
    const c = new NullCoach();
    expect(() => { c.speak('hi'); c.cancel(); c.prime(); }).not.toThrow();
    expect(c.getVoices()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/coach/coach.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the coach**

Create `src/coach/coach.ts`:

```ts
export interface Coach {
  speak(text: string): void;
  cancel(): void;
  prime(): void;
  getVoices(): SpeechSynthesisVoice[];
  setVoiceURI(uri: string): void;
}

export class SpeechCoach implements Coach {
  private voiceURI: string | null = null;

  private voice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    if (this.voiceURI) return voices.find((v) => v.voiceURI === this.voiceURI) ?? null;
    return voices.find((v) => v.lang.startsWith('en') && v.localService) ?? voices[0] ?? null;
  }

  speak(text: string): void {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = this.voice();
    if (v) u.voice = v;
    u.rate = 0.96;
    u.pitch = 1.0;
    speechSynthesis.speak(u);
  }

  cancel(): void { speechSynthesis.cancel(); }

  // Unlock audio on iOS: must be called from a user gesture.
  prime(): void {
    const u = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(u);
  }

  getVoices(): SpeechSynthesisVoice[] { return speechSynthesis.getVoices(); }
  setVoiceURI(uri: string): void { this.voiceURI = uri; }
}

export class NullCoach implements Coach {
  speak(): void {}
  cancel(): void {}
  prime(): void {}
  getVoices(): SpeechSynthesisVoice[] { return []; }
  setVoiceURI(): void {}
}

export function createCoach(): Coach {
  return typeof speechSynthesis !== 'undefined' ? new SpeechCoach() : new NullCoach();
}
```

- [ ] **Step 4: Run the test (expect PASS)**

```bash
npx vitest run src/coach/coach.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/coach/coach.ts src/coach/coach.test.ts
git commit -m "feat: add SpeechSynthesis coach adapter with iOS priming"
```

---

### Task 9: Feedback adapter (haptics + audio earcons)

**Files:**
- Create: `src/feedback/feedback.ts`
- Test: `src/feedback/feedback.test.ts`

**Interfaces:**
- Consumes: `HapticKind`.
- Produces:
  - `HAPTIC_PATTERNS: Record<HapticKind, number[]>`
  - `interface Feedback { fire(kind: HapticKind): void; }`
  - `class WebFeedback implements Feedback` (vibrate if available, else earcon)
  - `class NullFeedback implements Feedback`
  - `createFeedback(): Feedback`

- [ ] **Step 1: Write the failing test**

Create `src/feedback/feedback.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { WebFeedback, HAPTIC_PATTERNS } from './feedback';

describe('WebFeedback', () => {
  it('uses navigator.vibrate with the kind\'s pattern when available', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    const fb = new WebFeedback();
    fb.fire('rest');
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.rest);
  });

  it('defines distinct patterns for all four kinds', () => {
    const keys = Object.keys(HAPTIC_PATTERNS);
    expect(keys.sort()).toEqual(['countdown', 'next', 'rest', 'start']);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/feedback/feedback.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement feedback**

Create `src/feedback/feedback.ts`:

```ts
import type { HapticKind } from '../domain/types';

export const HAPTIC_PATTERNS: Record<HapticKind, number[]> = {
  start: [180],            // one buzz: exercise starts
  rest: [120, 80, 120],    // two buzzes: rest
  next: [90, 60, 90, 60, 90], // three buzzes: new exercise
  countdown: [40],         // short tick: 5s remaining
};

// Earcon tones (Hz) per kind, for devices without vibration (iOS).
const EARCON_HZ: Record<HapticKind, number> = {
  start: 660, rest: 440, next: 550, countdown: 880,
};

export interface Feedback {
  fire(kind: HapticKind): void;
}

export class WebFeedback implements Feedback {
  private ctx: AudioContext | null = null;

  private canVibrate(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  fire(kind: HapticKind): void {
    if (this.canVibrate()) {
      navigator.vibrate(HAPTIC_PATTERNS[kind]);
      return;
    }
    this.earcon(kind);
  }

  private earcon(kind: HapticKind): void {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx ??= new Ctx();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = EARCON_HZ[kind];
      gain.gain.value = 0.08;
      osc.connect(gain).connect(this.ctx.destination);
      const t = this.ctx.currentTime;
      osc.start(t);
      osc.stop(t + 0.12);
    } catch { /* audio not available; silent */ }
  }
}

export class NullFeedback implements Feedback {
  fire(): void {}
}

export function createFeedback(): Feedback {
  return typeof navigator !== 'undefined' || typeof window !== 'undefined'
    ? new WebFeedback() : new NullFeedback();
}
```

- [ ] **Step 4: Run the test (expect PASS)**

```bash
npx vitest run src/feedback/feedback.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/feedback/feedback.ts src/feedback/feedback.test.ts
git commit -m "feat: add haptics feedback with audio earcon fallback"
```

---

### Task 10: Storage — history, prefs, streak

**Files:**
- Create: `src/storage/streak.ts`
- Create: `src/storage/store.ts`
- Test: `src/storage/streak.test.ts`, `src/storage/store.test.ts`

**Interfaces:**
- Consumes: `Equipment`, `Workout`.
- Produces:
  - `computeStreak(dates: string[], today: string): number` (dates = `YYYY-MM-DD`, counts consecutive days back from today, today optional).
  - `interface Completion { date: string; kind: string; focus: string; exerciseIds: string[]; durationSec: number }`
  - `interface Prefs { voiceURI?: string; equipment: Equipment[] }`
  - `loadStore(): Store`, `recordCompletion(c: Completion): void`, `getPrefs(): Prefs`, `setPrefs(p: Prefs): void`, `currentStreak(today: string): number`.

- [ ] **Step 1: Write the failing tests**

Create `src/storage/streak.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeStreak } from './streak';

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-06-22', '2026-06-23', '2026-06-24'], '2026-06-24')).toBe(3);
  });
  it('counts a streak that ended yesterday (grace) but not older gaps', () => {
    expect(computeStreak(['2026-06-23'], '2026-06-24')).toBe(1);
    expect(computeStreak(['2026-06-21'], '2026-06-24')).toBe(0);
  });
  it('dedupes multiple sessions on the same day', () => {
    expect(computeStreak(['2026-06-24', '2026-06-24', '2026-06-23'], '2026-06-24')).toBe(2);
  });
  it('returns 0 for no history', () => {
    expect(computeStreak([], '2026-06-24')).toBe(0);
  });
});
```

Create `src/storage/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recordCompletion, getPrefs, setPrefs, currentStreak, loadStore } from './store';

beforeEach(() => localStorage.clear());

describe('store', () => {
  it('records completions and computes the streak', () => {
    recordCompletion({ date: '2026-06-23', kind: '20min', focus: 'strength', exerciseIds: ['pushup'], durationSec: 1200 });
    recordCompletion({ date: '2026-06-24', kind: '20min', focus: 'movement', exerciseIds: ['bear'], durationSec: 1200 });
    expect(currentStreak('2026-06-24')).toBe(2);
    expect(loadStore().completions.length).toBe(2);
  });

  it('persists prefs', () => {
    setPrefs({ voiceURI: 'abc', equipment: ['bodyweight'] });
    expect(getPrefs().voiceURI).toBe('abc');
    expect(getPrefs().equipment).toEqual(['bodyweight']);
  });
});
```

- [ ] **Step 2: Run them to confirm they fail**

```bash
npx vitest run src/storage/streak.test.ts src/storage/store.test.ts
```
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement streak (pure)**

Create `src/storage/streak.ts`:

```ts
const DAY = 86_400_000;

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Consecutive-day streak ending today or yesterday (one grace day). */
export function computeStreak(dates: string[], today: string): number {
  const days = new Set(dates.map(toUTC));
  if (days.size === 0) return 0;
  const todayMs = toUTC(today);

  // Allow the streak to end today or yesterday.
  let cursor: number;
  if (days.has(todayMs)) cursor = todayMs;
  else if (days.has(todayMs - DAY)) cursor = todayMs - DAY;
  else return 0;

  let streak = 0;
  while (days.has(cursor)) { streak++; cursor -= DAY; }
  return streak;
}
```

- [ ] **Step 4: Implement the store**

Create `src/storage/store.ts`:

```ts
import type { Equipment } from '../domain/types';
import { computeStreak } from './streak';

export interface Completion {
  date: string;        // YYYY-MM-DD
  kind: string;
  focus: string;
  exerciseIds: string[];
  durationSec: number;
}

export interface Prefs {
  voiceURI?: string;
  equipment: Equipment[];
}

export interface Store {
  version: 1;
  completions: Completion[];
  prefs: Prefs;
}

const KEY = 'mwe.store.v1';
const DEFAULT: Store = {
  version: 1,
  completions: [],
  prefs: { equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'] },
};

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const parsed = JSON.parse(raw) as Store;
    return { ...structuredClone(DEFAULT), ...parsed, prefs: { ...DEFAULT.prefs, ...parsed.prefs } };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function saveStore(s: Store): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function recordCompletion(c: Completion): void {
  const s = loadStore();
  s.completions.push(c);
  saveStore(s);
}

export function getPrefs(): Prefs { return loadStore().prefs; }

export function setPrefs(p: Prefs): void {
  const s = loadStore();
  s.prefs = p;
  saveStore(s);
}

export function currentStreak(today: string): number {
  return computeStreak(loadStore().completions.map((c) => c.date), today);
}
```

- [ ] **Step 5: Run the tests (expect PASS)**

```bash
npx vitest run src/storage/streak.test.ts src/storage/store.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/storage/
git commit -m "feat: add localStorage store with completions, prefs, and streak"
```

---

### Task 11: UI — wake lock, session hook, and the three screens

**Files:**
- Create: `src/pwa/wakeLock.ts`
- Create: `src/ui/useWorkoutSession.ts`
- Create: `src/ui/CountdownRing.tsx`
- Create: `src/ui/HomeScreen.tsx`, `src/ui/ActiveScreen.tsx`, `src/ui/DoneScreen.tsx`
- Modify: `src/App.tsx`
- Test: `src/ui/useWorkoutSession.test.ts`

**Interfaces:**
- Consumes: `WorkoutSession`, `RafClock`, `createCoach`, `createFeedback`, `generateWorkout`, `recordCompletion`, `currentStreak`, `getPrefs`.
- Produces:
  - `requestWakeLock(): Promise<void>`, `releaseWakeLock(): Promise<void>`.
  - `useWorkoutSession(workout: Workout | null)` returning `{ state, start, pause, resume, skip, end }`.
  - `App` phase machine: `home → active → done`.

- [ ] **Step 1: Implement the wake lock helper**

Create `src/pwa/wakeLock.ts`:

```ts
type Sentinel = { release: () => Promise<void> } | null;
let sentinel: Sentinel = null;

export async function requestWakeLock(): Promise<void> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } };
    if (!nav.wakeLock) return;
    sentinel = await nav.wakeLock.request('screen');
    document.addEventListener('visibilitychange', onVisible);
  } catch { /* wake lock denied; the workout still runs */ }
}

async function onVisible(): Promise<void> {
  if (document.visibilityState === 'visible' && sentinel === null) await requestWakeLock();
}

export async function releaseWakeLock(): Promise<void> {
  document.removeEventListener('visibilitychange', onVisible);
  try { await sentinel?.release(); } catch { /* ignore */ }
  sentinel = null;
}
```

- [ ] **Step 2: Write the failing hook test**

Create `src/ui/useWorkoutSession.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutSession } from './useWorkoutSession';
import { generateWorkout } from '../generator/generateWorkout';

describe('useWorkoutSession', () => {
  it('starts idle and transitions to running on start()', () => {
    const workout = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 1 });
    const { result } = renderHook(() => useWorkoutSession(workout));
    expect(result.current.state.status).toBe('idle');
    act(() => result.current.start());
    expect(result.current.state.status).toBe('running');
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
npx vitest run src/ui/useWorkoutSession.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 4: Implement the hook**

Create `src/ui/useWorkoutSession.ts`:

```ts
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Workout } from '../domain/types';
import { WorkoutSession, type SessionState } from '../engine/session';
import { RafClock } from '../engine/clock';
import { createCoach } from '../coach/coach';
import { createFeedback } from '../feedback/feedback';
import { requestWakeLock, releaseWakeLock } from '../pwa/wakeLock';

const IDLE: SessionState = { status: 'idle', segmentIndex: 0, segment: null, segmentRemainingSec: 0 };

export function useWorkoutSession(workout: Workout | null) {
  const coach = useMemo(() => createCoach(), []);
  const feedback = useMemo(() => createFeedback(), []);
  const sessionRef = useRef<WorkoutSession | null>(null);
  const [state, setState] = useState<SessionState>(IDLE);

  useEffect(() => {
    if (!workout) return;
    const clock = new RafClock();
    const session = new WorkoutSession(workout, clock, (e) => {
      if (e.type === 'tick' || e.type === 'segmentChanged') {
        setState(session.getState());
      } else if (e.type === 'cue') {
        if (e.cue.say) coach.speak(e.cue.say);
        if (e.cue.haptic) feedback.fire(e.cue.haptic);
      } else if (e.type === 'finished') {
        setState(session.getState());
        void releaseWakeLock();
      }
    });
    sessionRef.current = session;
    setState(session.getState());
    return () => { session.end(); void releaseWakeLock(); };
  }, [workout, coach, feedback]);

  return {
    state,
    start: () => { coach.prime(); void requestWakeLock(); sessionRef.current?.start(); },
    pause: () => sessionRef.current?.pause(),
    resume: () => sessionRef.current?.resume(),
    skip: () => sessionRef.current?.skip(),
    end: () => { sessionRef.current?.end(); void releaseWakeLock(); },
  };
}
```

- [ ] **Step 5: Run the hook test (expect PASS)**

```bash
npx vitest run src/ui/useWorkoutSession.test.ts
```
Expected: PASS.

- [ ] **Step 6: Build the CountdownRing component**

Create `src/ui/CountdownRing.tsx`:

```tsx
interface Props { remaining: number; total: number; }

export function CountdownRing({ remaining, total }: Props) {
  const r = 130;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  return (
    <svg viewBox="0 0 300 300" className="w-72 h-72" aria-hidden="true">
      <circle cx="150" cy="150" r={r} stroke="#1d2733" strokeWidth="14" fill="none" />
      <circle
        cx="150" cy="150" r={r} stroke="#4ade80" strokeWidth="14" fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
        transform="rotate(-90 150 150)"
      />
      <text x="150" y="165" textAnchor="middle" fontSize="64" fill="#f5f7fa" fontWeight="700">
        {mm}:{ss}
      </text>
    </svg>
  );
}
```

- [ ] **Step 7: Build the three screens**

Create `src/ui/HomeScreen.tsx`:

```tsx
import { useState } from 'react';
import type { WorkoutKind } from '../domain/types';
import { focusForDate } from '../generator/schedule';

interface Props { streak: number; onStart: (kind: WorkoutKind) => void; }
const KINDS: WorkoutKind[] = ['10min', '20min', '30min'];

export function HomeScreen({ streak, onStart }: Props) {
  const [kind, setKind] = useState<WorkoutKind>('20min');
  const focus = focusForDate(new Date());
  const label = focus === 'strength' ? 'Strength' : 'Movement';
  return (
    <main className="flex flex-col items-center justify-between h-full p-8 text-center">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold">Move With Elli</h1>
        <p className="mt-2 text-lg text-slate-400">Today: {label} · {kind.replace('min', ' min')}</p>
        {streak > 0 && <p className="mt-1 text-emerald-400">🔥 {streak}-day streak</p>}
      </header>

      <div role="radiogroup" aria-label="Workout length" className="flex gap-3">
        {KINDS.map((k) => (
          <button
            key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
            className={`px-5 py-3 rounded-2xl text-lg ${kind === k ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}
          >
            {k.replace('min', ' min')}
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart(kind)}
        className="w-full max-w-sm py-10 rounded-3xl bg-emerald-500 text-black text-4xl font-bold active:scale-[0.98] transition"
        aria-label={`Start ${kind} workout`}
      >
        ▶ Start
      </button>
    </main>
  );
}
```

Create `src/ui/ActiveScreen.tsx`:

```tsx
import type { SessionState } from '../engine/session';
import { CountdownRing } from './CountdownRing';

interface Props {
  state: SessionState;
  onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void;
}

export function ActiveScreen({ state, onPause, onResume, onSkip, onEnd }: Props) {
  const seg = state.segment;
  const isRest = seg?.kind === 'rest';
  const title = isRest ? 'Rest' : seg?.exercise?.name ?? 'Get ready';
  const side = seg?.side ? ` · ${seg.side}` : '';
  return (
    <main className={`flex flex-col items-center justify-between h-full p-8 ${isRest ? 'bg-sky-950' : ''}`}>
      <p className="sr-only" aria-live="assertive">{title}{side}</p>
      <h2 className="pt-10 text-4xl font-bold text-center">{title}<span className="text-slate-400">{side}</span></h2>
      <CountdownRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} />
      <div className="flex gap-4 w-full max-w-sm">
        {state.status === 'paused'
          ? <button onClick={onResume} className="flex-1 py-5 rounded-2xl bg-emerald-500 text-black text-xl">Resume</button>
          : <button onClick={onPause} className="flex-1 py-5 rounded-2xl bg-slate-800 text-xl">Pause</button>}
        <button onClick={onSkip} className="flex-1 py-5 rounded-2xl bg-slate-800 text-xl">Skip</button>
        <button onClick={onEnd} aria-label="End workout" className="px-5 py-5 rounded-2xl bg-slate-800 text-xl">✕</button>
      </div>
    </main>
  );
}
```

Create `src/ui/DoneScreen.tsx`:

```tsx
import type { Category } from '../domain/types';

interface Props { categories: Category[]; streak: number; onHome: () => void; }
const LABELS: Partial<Record<Category, string>> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge',
  carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility',
};

export function DoneScreen({ categories, streak, onHome }: Props) {
  const practiced = Array.from(new Set(categories.map((c) => LABELS[c]).filter(Boolean)));
  return (
    <main className="flex flex-col items-center justify-center h-full p-8 text-center gap-6">
      <h2 className="text-3xl font-semibold">Great job, Elli.</h2>
      <ul className="text-2xl space-y-1">
        {practiced.map((p) => <li key={p}>✓ {p}</li>)}
      </ul>
      {streak > 0 && <p className="text-emerald-400 text-xl">🔥 {streak}-day streak</p>}
      <button onClick={onHome} className="mt-4 px-8 py-4 rounded-2xl bg-emerald-500 text-black text-xl">Done</button>
    </main>
  );
}
```

- [ ] **Step 8: Wire the App phase machine**

Replace `src/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { Category, Workout, WorkoutKind } from './domain/types';
import { generateWorkout } from './generator/generateWorkout';
import { useWorkoutSession } from './ui/useWorkoutSession';
import { HomeScreen } from './ui/HomeScreen';
import { ActiveScreen } from './ui/ActiveScreen';
import { DoneScreen } from './ui/DoneScreen';
import { recordCompletion, currentStreak, getPrefs } from './storage/store';

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

export default function App() {
  const [phase, setPhase] = useState<'home' | 'active' | 'done'>('home');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [streak, setStreak] = useState(0);
  const { state, start, pause, resume, skip, end } = useWorkoutSession(workout);

  useEffect(() => { setStreak(currentStreak(todayStr())); }, [phase]);

  const categories = useMemo<Category[]>(
    () => (workout?.segments.map((s) => s.exercise?.category).filter(Boolean) as Category[]) ?? [],
    [workout],
  );

  function handleStart(kind: WorkoutKind) {
    const w = generateWorkout({ kind, date: new Date(), equipment: getPrefs().equipment });
    setWorkout(w);
    setPhase('active');
  }

  // Start the session once the workout-bound hook has mounted.
  useEffect(() => {
    if (phase === 'active' && state.status === 'idle' && workout) start();
  }, [phase, state.status, workout, start]);

  // When the engine finishes, record + go to done.
  useEffect(() => {
    if (phase === 'active' && state.status === 'done' && workout) {
      recordCompletion({
        date: todayStr(), kind: workout.kind, focus: workout.focus,
        exerciseIds: workout.segments.flatMap((s) => (s.exercise ? [s.exercise.id] : [])),
        durationSec: workout.segments.reduce((a, s) => a + s.durationSec, 0),
      });
      setPhase('done');
    }
  }, [phase, state.status, workout]);

  if (phase === 'home') return <HomeScreen streak={streak} onStart={handleStart} />;
  if (phase === 'done') return <DoneScreen categories={categories} streak={streak} onHome={() => { setWorkout(null); setPhase('home'); }} />;
  return <ActiveScreen state={state} onPause={pause} onResume={resume} onSkip={skip} onEnd={end} />;
}
```

- [ ] **Step 9: Run the full test suite and the dev server**

```bash
npx vitest run
npm run dev
```
Expected: all tests PASS. In the browser, pressing **Start** speaks and runs a workout, the ring counts down, and finishing shows the capability checklist. (Voice/haptics are verified manually — see the device checklist in the spec §15.)

- [ ] **Step 10: Commit**

```bash
git add src/pwa/ src/ui/ src/App.tsx
git commit -m "feat: add wake lock, session hook, and the three screens"
```

---

### Task 12: PWA manifest, offline service worker, and GitHub Pages deploy

**Files:**
- Modify: `vite.config.ts` (add `VitePWA`)
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (placeholder solid-color PNGs are fine for v1)
- Create: `.github/workflows/deploy.yml`
- Modify: `index.html` (theme color + title)

**Interfaces:**
- Consumes: the built app.
- Produces: an installable, offline-capable PWA deployed to `https://<user>.github.io/fitness-coach/`.

- [ ] **Step 1: Add the PWA plugin to Vite config**

Update `vite.config.ts` — add the import and plugin:

```ts
import { VitePWA } from 'vite-plugin-pwa';

// ...inside plugins: [react(), tailwindcss(), VitePWA({ ... })]
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
  manifest: {
    name: 'Move With Elli',
    short_name: 'Move',
    description: 'Press Play. Don\'t Think. Move.',
    theme_color: '#0b0f14',
    background_color: '#0b0f14',
    display: 'standalone',
    scope: '/fitness-coach/',
    start_url: '/fitness-coach/',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
}),
```

- [ ] **Step 2: Add placeholder icons**

```bash
mkdir -p public/icons
# Generate simple solid PNG placeholders (replace with real art later):
node -e "const fs=require('fs');const z=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==','base64');fs.writeFileSync('public/icons/icon-192.png',z);fs.writeFileSync('public/icons/icon-512.png',z);"
```

- [ ] **Step 3: Set the document title and theme**

In `index.html`, set `<title>Move With Elli</title>` and add inside `<head>`:

```html
<meta name="theme-color" content="#0b0f14" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

- [ ] **Step 4: Verify the production build emits a service worker**

```bash
npm run build
ls dist/sw.js dist/manifest.webmanifest
```
Expected: both files exist.

- [ ] **Step 5: Add the GitHub Pages deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts public/icons index.html .github/workflows/deploy.yml
git commit -m "feat: add PWA manifest, offline service worker, and Pages deploy"
```

- [ ] **Step 7: (Manual, when ready) push and enable Pages**

Create a GitHub repo named `fitness-coach`, push `main`, then in repo Settings → Pages set **Source: GitHub Actions**. The workflow deploys on every push to `main`.

---

## Self-Review

**Spec coverage:**
- Vision/philosophy → phrasing tone constraints (Task 5) ✓
- v1 scope "Spine" (generate → guide → celebrate → save streak) → Tasks 4–11 ✓
- Rule-based generator + PRD template + weekday focus + equipment filter + anti-repeat + unilateral → Tasks 3–5 ✓
- Browser voice behind `Coach` interface → Task 8 ✓
- Haptics + earcon fallback + patterns (1/2/3/countdown) → Task 9 ✓
- Wake-lock + clock state machine → Tasks 6, 7, 11 ✓
- localStorage history/streak/prefs → Task 10 ✓
- Minimal large-type screens + a11y (live region, large targets, radiogroup) → Task 11 ✓
- PWA offline + GitHub Pages → Task 12 ✓
- "Free Mode = same engine" → `WorkoutKind` includes `'free'`, `targetFor` handles it ✓
- Out-of-scope (badges, charts, LLM, Supabase, ducking other apps) → not built ✓

**Placeholder scan:** No TBD/TODO. Icons are explicit placeholder PNGs (called out), not a gap.

**Type consistency:** `HapticKind` ('start'|'rest'|'next'|'countdown') is consistent across `types.ts`, `phrases`/generator cues, `HAPTIC_PATTERNS`, and the hook. `SessionState`/`SessionEvent` names match between `session.ts`, the hook, and `ActiveScreen`. `generateWorkout` options match call sites in `App.tsx`. `Completion`/`Prefs` shapes match between `store.ts` and `App.tsx`.

> One known soft spot to watch during execution: the generator's time-budget constants (`workSec`/`restSec`/`avgExtraCost`) are tuned to land within 45s of target. If Task 5's duration test fails, adjust those constants rather than the tolerance.
