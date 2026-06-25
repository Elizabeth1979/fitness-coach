# Visual Redesign — "See the Program" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the existing engine a warm, card-based visual layer that *shows* today's generated workout, where you are during it, and your progress — matching the approved mockups.

**Architecture:** UI-layer change only. Add a warm light theme + reusable CSS classes, three pure helper modules (`ui/format.ts`, `storage/week.ts`, `generator/swapMove.ts`), and rebuild the three screens. The app now **generates a preview workout on Home** (so it can be displayed) and Start runs that exact preview. The engine, generator core, voice, storage, and all existing tests are untouched.

**Tech Stack:** React 19 · Vite 8 · TypeScript (strict) · Tailwind v4 · Vitest 4. No new deps.

## Global Constraints

- npm; Vitest `npx vitest run <path>`; **`npm run build` is the real gate** (`tsc -b` catches what esbuild/vitest miss — `erasableSyntaxOnly`, types). Do NOT run `npm run dev` (hangs an agent).
- TypeScript strict; **no `any`**; `erasableSyntaxOnly` on — no constructor parameter properties / enums.
- Pure logic (`src/domain`, `src/generator`, `src/coach/phrases.ts`, `src/storage/streak.ts`, `src/storage/week.ts`, `src/ui/format.ts`) must NOT import browser APIs. `App.tsx` (imperative shell) MAY use `Math.random` (e.g. to seed a swap) — generators stay pure and take an `rng`.
- All spoken copy stays in `src/coach/phrases.ts`; tone calm, never calorie/guilt/military. User name "Elli" hard-coded.
- Determinism of `generateWorkout` is preserved (seed defaults to the day number; re-roll just passes a different seed).
- Theme palette (verbatim): `--bg:#f5f1fb` · `--surface:#fff` · `--surface-border:#ece4f5` · `--accent:#5b2a86` · `--accent-soft:#efe7fb` · `--accent-ink:#42206a` · `--text:#1f1430` · `--text-muted:#6f6588` · `--text-hint:#9a78b5` · `--success:#2f9e6f` · `--success-soft:#e6f4ec` · `--warm:#9a5a12` · `--warm-soft:#fbe7d4`.
- Commit after each task on branch `feature/visual-redesign`.

---

### Task 1: Warm theme + reusable classes

**Files:**
- Modify: `src/index.css` (replace the dark theme)

**Interfaces:**
- Produces: CSS custom properties (the palette tokens above) on `:root`, and reusable classes `.screen`, `.card`, `.pill`, `.cat`, `.btn`, `.btn-primary`, `.btn-soft`, `.btn-ghost`, `.chip` used by every screen task.

- [ ] **Step 1: Install the Tabler icon webfont (bundled → cached offline by Workbox, no CDN)**

```bash
npm install @tabler/icons-webfont
```

- [ ] **Step 2: Replace `src/index.css`**

```css
@import 'tailwindcss';
@import '@tabler/icons-webfont/dist/tabler-icons.min.css';

:root {
  color-scheme: light;
  --bg:#f5f1fb; --surface:#fff; --surface-border:#ece4f5; --surface-shadow:0 6px 22px rgba(91,42,134,.08);
  --accent:#5b2a86; --accent-soft:#efe7fb; --accent-ink:#42206a;
  --text:#1f1430; --text-muted:#6f6588; --text-hint:#9a78b5;
  --success:#2f9e6f; --success-soft:#e6f4ec; --warm:#9a5a12; --warm-soft:#fbe7d4;
}
html, body, #root { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased; }

.screen { max-width: 460px; margin-inline: auto; min-height: 100%; padding: 18px 18px 28px; box-sizing: border-box; }
.card { background: var(--surface); border: 1px solid var(--surface-border); border-radius: 20px; box-shadow: var(--surface-shadow); padding: 16px; }
.pill { display:inline-flex; align-items:center; gap:5px; background: var(--accent-soft); color: var(--accent); font-size:12px; font-weight:500; padding:5px 10px; border-radius:99px; }
.cat { display:inline-flex; align-items:center; font-size:11px; font-weight:500; color: var(--accent); background: var(--accent-soft); padding:3px 9px; border-radius:7px; }
.chip { display:inline-flex; align-items:center; gap:5px; font-size:13px; font-weight:500; color: var(--accent-ink); background: var(--accent-soft); padding:6px 12px; border-radius:99px; }
.btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; cursor:pointer; font: inherit; font-weight:500; border-radius:16px; padding:15px; }
.btn-primary { background: var(--accent); color:#fff; font-size:17px; }
.btn-soft { background: var(--accent-soft); color: var(--accent); }
.btn-ghost { background:#f3edfa; color: var(--text-muted); }
.btn:active { transform: scale(0.98); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
}
```

- [ ] **Step 3: Verify build + suite**

```bash
npm run build
npx vitest run
```
Expected: clean build (the bundled `woff2` is fingerprinted into `dist/` and picked up by Workbox's `**/*.{...,woff2}` glob); existing 56 tests still pass. Manual: `npm run dev` later shows the light theme — not in this task.

- [ ] **Step 4: Commit**

```bash
git add src/index.css package.json package-lock.json
git commit -m "feat: warm light theme, Tabler icon webfont, reusable classes"
```

---

### Task 2: `ui/format.ts` — target text + session moves

**Files:**
- Create: `src/ui/format.ts`
- Test: `src/ui/format.test.ts`

**Interfaces:**
- Consumes: `Segment`, `Workout`, `Exercise`, `Category` from `domain/types`.
- Produces:
  - `formatTarget(seg: Segment): string` — `"8 reps"` / `"6 reps each side"` / `"30 seconds"` / `"2 minutes"`.
  - `interface SessionMove { index: number; exercise: Exercise; category: Category; isWarmup: boolean; target: string; firstSegment: number }`
  - `sessionMoves(workout: Workout): SessionMove[]` — one entry per work-move (the two sides of a unilateral exercise collapse into one), in order, with `firstSegment` = the index of its first `work` segment.
  - `currentMoveIndex(moves: SessionMove[], segmentIndex: number): number` — index of the move whose `firstSegment` is the greatest `<= segmentIndex` (0 if none).

- [ ] **Step 1: Write the failing test**

Create `src/ui/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatTarget, sessionMoves, currentMoveIndex } from './format';
import { generateWorkout } from '../generator/generateWorkout';
import type { Segment } from '../domain/types';

const seg = (over: Partial<Segment>): Segment => ({ kind: 'work', durationSec: 30, cues: [], ...over });
const ex = (m: 'reps' | 'time', extra: Record<string, unknown>) =>
  ({ id: 'x', name: 'X', category: 'push', equipment: ['bodyweight'], goals: ['strength'], unilateral: false, measure: m, cue: '', ...extra }) as Segment['exercise'];

describe('formatTarget', () => {
  it('reps', () => expect(formatTarget(seg({ exercise: ex('reps', { defaultReps: 8 }) }))).toBe('8 reps'));
  it('reps each side', () => expect(formatTarget(seg({ exercise: ex('reps', { defaultReps: 6, unilateral: true }) }))).toBe('6 reps each side'));
  it('seconds', () => expect(formatTarget(seg({ durationSec: 40, exercise: ex('time', { defaultDurationSec: 40 }) }))).toBe('40 seconds'));
  it('minutes', () => expect(formatTarget(seg({ durationSec: 120, exercise: ex('time', { defaultDurationSec: 120 }) }))).toBe('2 minutes'));
});

describe('sessionMoves', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
  it('returns warm-up move(s) then 6 main moves, in order', () => {
    const moves = sessionMoves(w);
    expect(moves.some((m) => m.isWarmup)).toBe(true);
    const main = moves.filter((m) => !m.isWarmup);
    expect(main.map((m) => m.category)).toEqual(['push', 'pull', 'legs', 'hinge', 'carry', 'mobility'].filter((c) => main.some((m) => m.category === c)));
    expect(main.length).toBe(6);
  });
  it('collapses a unilateral exercise into one move with "each side"', () => {
    const moves = sessionMoves(w);
    const uni = moves.find((m) => m.exercise.unilateral);
    if (uni) expect(uni.target).toContain('each side');
  });
  it('firstSegment is strictly increasing', () => {
    const f = sessionMoves(w).map((m) => m.firstSegment);
    expect([...f].sort((a, b) => a - b)).toEqual(f);
  });
});

describe('currentMoveIndex', () => {
  it('maps a segment index to the active move', () => {
    const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight'], seed: 4 });
    const moves = sessionMoves(w);
    expect(currentMoveIndex(moves, moves[0].firstSegment)).toBe(0);
    expect(currentMoveIndex(moves, moves[2].firstSegment + 1)).toBe(2);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/ui/format.test.ts
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/ui/format.ts`**

```ts
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
```

- [ ] **Step 4: Run the test (expect PASS)**

```bash
npx vitest run src/ui/format.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/format.ts src/ui/format.test.ts
git commit -m "feat: add target formatting and session-move derivation helpers"
```

---

### Task 3: `storage/week.ts` — this-week day view

**Files:**
- Create: `src/storage/week.ts`
- Test: `src/storage/week.test.ts`

**Interfaces:**
- Consumes: nothing (pure; dates are `YYYY-MM-DD` strings).
- Produces:
  - `interface DayCell { label: string; date: string; done: boolean; isToday: boolean }`
  - `weekView(completionDates: string[], today: string): DayCell[]` — 7 cells Monday→Sunday for the week containing `today`; `done` if that date is in `completionDates`; `isToday` for today; `label` is `Mon`…`Sun`.

- [ ] **Step 1: Write the failing test**

Create `src/storage/week.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { weekView } from './week';

describe('weekView', () => {
  // 2026-06-24 is a Wednesday.
  it('returns Mon..Sun for the week containing today', () => {
    const w = weekView([], '2026-06-24');
    expect(w.map((d) => d.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(w[0].date).toBe('2026-06-22');
    expect(w[6].date).toBe('2026-06-28');
  });
  it('marks done days and today', () => {
    const w = weekView(['2026-06-22', '2026-06-24'], '2026-06-24');
    expect(w[0].done).toBe(true);   // Mon
    expect(w[2].done).toBe(true);   // Wed
    expect(w[1].done).toBe(false);  // Tue
    expect(w[2].isToday).toBe(true);
    expect(w.filter((d) => d.isToday).length).toBe(1);
  });
  it('ignores dates outside this week', () => {
    const w = weekView(['2026-06-15'], '2026-06-24');
    expect(w.some((d) => d.done)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/storage/week.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement `src/storage/week.ts`**

```ts
const DAY = 86_400_000;
const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface DayCell { label: string; date: string; done: boolean; isToday: boolean }

export function weekView(completionDates: string[], today: string): DayCell[] {
  const done = new Set(completionDates);
  const todayMs = toUTC(today);
  // JS getUTCDay: 0=Sun..6=Sat. Shift so Monday is the start.
  const dow = new Date(todayMs).getUTCDay();
  const mondayOffset = (dow + 6) % 7;
  const monday = todayMs - mondayOffset * DAY;
  return LABELS.map((label, i) => {
    const date = iso(monday + i * DAY);
    return { label, date, done: done.has(date), isToday: date === today };
  });
}
```

- [ ] **Step 4: Run the test (expect PASS)**

```bash
npx vitest run src/storage/week.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage/week.ts src/storage/week.test.ts
git commit -m "feat: add weekView helper for the progress day strip"
```

---

### Task 4: `generator/swapMove.ts` — swap one move

**Files:**
- Modify: `src/generator/selectExercises.ts` (export `candidatesFor`)
- Create: `src/generator/swapMove.ts`
- Test: `src/generator/swapMove.test.ts`

**Interfaces:**
- Consumes: `candidatesFor(category, available)` (now exported), `pick` (rng), `phrases`, domain types.
- Produces: `swapMove(workout: Workout, prepareIndex: number, equipment: Equipment[], rng: () => number): Workout` — returns a new `Workout` where the move whose `prepare` segment is at `prepareIndex` uses a different exercise of the same category (equipment-valid), reusing the existing work-segment durations and updating the prepare cue's name. Returns the workout unchanged if no alternative exists.

- [ ] **Step 1: Export `candidatesFor` from `selectExercises.ts`**

In `src/generator/selectExercises.ts`, change `function candidatesFor(` to `export function candidatesFor(`. No other change.

- [ ] **Step 2: Write the failing test**

Create `src/generator/swapMove.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { swapMove } from './swapMove';
import { generateWorkout } from './generateWorkout';
import { createRng } from './rng';
import type { Equipment } from '../domain/types';

const ALL: Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];

describe('swapMove', () => {
  const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ALL, seed: 4 });
  // find the first main (non-warmup) prepare segment
  const prepIdx = w.segments.findIndex((s) => s.kind === 'prepare' && s.exercise && s.exercise.category !== 'warmup');
  const oldId = w.segments[prepIdx].exercise!.id;
  const oldCat = w.segments[prepIdx].exercise!.category;

  it('replaces that move with a different exercise of the same category', () => {
    const w2 = swapMove(w, prepIdx, ALL, createRng(1));
    expect(w2.segments[prepIdx].exercise!.id).not.toBe(oldId);
    expect(w2.segments[prepIdx].exercise!.category).toBe(oldCat);
  });
  it('keeps total duration unchanged (durations reused)', () => {
    const total = (x: typeof w) => x.segments.reduce((s, seg) => s + seg.durationSec, 0);
    expect(total(swapMove(w, prepIdx, ALL, createRng(2)))).toBe(total(w));
  });
  it('does not mutate the original workout', () => {
    const before = w.segments[prepIdx].exercise!.id;
    swapMove(w, prepIdx, ALL, createRng(3));
    expect(w.segments[prepIdx].exercise!.id).toBe(before);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
npx vitest run src/generator/swapMove.test.ts
```
Expected: FAIL.

- [ ] **Step 4: Implement `src/generator/swapMove.ts`**

```ts
import type { Cue, Equipment, Segment, Workout } from '../domain/types';
import { candidatesFor } from './selectExercises';
import { pick } from './rng';
import { phrases } from '../coach/phrases';

export function swapMove(workout: Workout, prepareIndex: number, equipment: Equipment[], rng: () => number): Workout {
  const prep = workout.segments[prepareIndex];
  const current = prep?.exercise;
  if (!prep || prep.kind !== 'prepare' || !current) return workout;

  const pool = candidatesFor(current.category, equipment).filter((e) => e.id !== current.id);
  if (pool.length === 0) return workout;
  const next = pick(rng, pool);

  const segments: Segment[] = workout.segments.map((seg, i) => {
    if (i === prepareIndex) {
      const cues: Cue[] = [
        { atSec: 0, say: phrases.next(next.name), haptic: 'next' },
        { atSec: 1, say: phrases.count(3) },
        { atSec: 2, say: phrases.count(2) },
        { atSec: 3, say: phrases.count(1) },
      ];
      return { ...seg, exercise: next, cues };
    }
    // The work segments immediately after the prepare belong to this move.
    if (i > prepareIndex && seg.kind === 'work' && seg.exercise?.id === current.id) {
      return { ...seg, exercise: next };
    }
    return seg;
  });

  return { ...workout, segments };
}
```

- [ ] **Step 5: Run the test (expect PASS)**

```bash
npx vitest run src/generator/swapMove.test.ts
```
Expected: PASS. Then full suite + build:

```bash
npx vitest run
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/generator/selectExercises.ts src/generator/swapMove.ts src/generator/swapMove.test.ts
git commit -m "feat: add swapMove (replace one move, reuse durations)"
```

---

### Task 5: Home — generate-on-open preview + workout list

**Files:**
- Modify: `src/App.tsx` (preview state: kind, seed, preview; Start runs the preview; swap/detail state)
- Modify: `src/ui/HomeScreen.tsx` (warm redesign showing the workout)
- Create: `src/ui/WorkoutPreview.tsx`
- Test: `src/ui/HomeScreen.test.tsx`

**Interfaces:**
- Consumes: `sessionMoves`, `formatTarget` (Task 2); `generateWorkout`; `getPrefs`/`getRecentThemes`/`pushRecentTheme`; `useVoices`/`VoicePicker`.
- Produces: `HomeScreen` props `{ workout: Workout; kind: WorkoutKind; onKind: (k) => void; streak: number; canResume?: boolean; onResume?: () => void; onReroll: () => void; onStart: () => void; onOpenMove: (prepareIndex: number) => void }`. `WorkoutPreview` props `{ workout: Workout; detailed: boolean; onOpenMove: (prepareIndex: number) => void }`.

- [ ] **Step 1: Write the failing test**

Create `src/ui/HomeScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';
import { generateWorkout } from '../generator/generateWorkout';
import { sessionMoves } from './format';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });

describe('HomeScreen', () => {
  it('shows today\'s workout: every main move name and a full target', () => {
    render(<HomeScreen workout={w} kind="10min" onKind={vi.fn()} streak={3} onReroll={vi.fn()} onStart={vi.fn()} onOpenMove={vi.fn()} />);
    for (const m of sessionMoves(w).filter((x) => !x.isWarmup)) {
      expect(screen.getByText(m.exercise.name)).toBeInTheDocument();
    }
    expect(screen.getAllByText(/reps|seconds|minutes/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /start workout/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/ui/HomeScreen.test.tsx
```
Expected: FAIL (HomeScreen signature/markup mismatch).

- [ ] **Step 3: Create `src/ui/WorkoutPreview.tsx`**

```tsx
import type { Workout } from '../domain/types';
import { sessionMoves } from './format';

const CAT: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl',
  core: 'Core', balance: 'Balance', mobility: 'Mobility',
};
const isTime = (t: string) => /second|minute/.test(t);

interface Props { workout: Workout; detailed: boolean; onOpenMove: (prepareIndex: number) => void }

export function WorkoutPreview({ workout, detailed, onOpenMove }: Props) {
  const moves = sessionMoves(workout).filter((m) => !m.isWarmup);
  return (
    <div>
      {moves.map((m) => {
        const prepIdx = Math.max(0, m.firstSegment - 1);
        return (
          <button
            key={m.firstSegment}
            onClick={() => onOpenMove(prepIdx)}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 2px', width: '100%', background: 'none', border: 0, borderTop: '1px solid #f1ebf7', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'var(--text)' }}
            aria-label={`${m.exercise.name}, ${m.target}`}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{m.exercise.name}</span>
              {detailed && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                  <span className="cat">{CAT[m.category] ?? m.category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                    <i className={`ti ${isTime(m.target) ? 'ti-clock' : 'ti-repeat'}`} aria-hidden="true" style={{ fontSize: 15 }} />{m.target}
                  </span>
                </span>
              )}
            </span>
            <i className="ti ti-chevron-right" aria-hidden="true" style={{ fontSize: 19, color: '#c9bdda' }} />
          </button>
        );
      })}
    </div>
  );
}
```

Note: the Tabler icon webfont is bundled via the `@import` added in Task 1, so the `<i class="ti …">` icons render here (and on the Active/Done screens) with no per-task setup.

- [ ] **Step 4: Rewrite `src/ui/HomeScreen.tsx`**

```tsx
import { useState } from 'react';
import type { Workout, WorkoutKind } from '../domain/types';
import { focusForDate } from '../generator/schedule';
import { getPrefs, setPrefs } from '../storage/store';
import { useVoices } from './useVoices';
import { VoicePicker } from './VoicePicker';
import { WorkoutPreview } from './WorkoutPreview';
import { sessionMoves } from './format';

interface Props {
  workout: Workout; kind: WorkoutKind; onKind: (k: WorkoutKind) => void; streak: number;
  canResume?: boolean; onResume?: () => void; onReroll: () => void; onStart: () => void;
  onOpenMove: (prepareIndex: number) => void;
}
const KINDS: WorkoutKind[] = ['10min', '20min', '30min'];
const total = (w: Workout) => Math.round(w.segments.reduce((s, x) => s + x.durationSec, 0) / 60);

export function HomeScreen(p: Props) {
  const [detailed, setDetailed] = useState(true);
  const voices = useVoices();
  const [voiceURI, setVoiceURI] = useState<string | undefined>(() => getPrefs().voiceURI);
  const focus = focusForDate(new Date());
  const warm = sessionMoves(p.workout).find((m) => m.isWarmup);

  function handleVoiceChange(uri: string) {
    const next = uri || undefined;
    setVoiceURI(next);
    setPrefs({ ...getPrefs(), voiceURI: next });
    if (typeof speechSynthesis !== 'undefined' && next) {
      const u = new SpeechSynthesisUtterance('Hi Elli, ready to move?');
      const v = voices.find((x) => x.voiceURI === next); if (v) u.voice = v; u.rate = 0.96;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  }

  return (
    <main className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>Good morning, Elli</div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.3px' }}>Move With Elli</div>
        </div>
        {p.streak > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warm-soft)', color: 'var(--warm)', fontSize: 12, fontWeight: 500, padding: '7px 11px', borderRadius: 99 }}>
            <i className="ti ti-flame" aria-hidden="true" style={{ fontSize: 16 }} />{p.streak}-day streak
          </span>
        )}
      </div>

      {p.canResume && p.onResume && (
        <button className="btn btn-soft" onClick={p.onResume} style={{ width: '100%', marginBottom: 12, background: 'var(--warm-soft)', color: 'var(--warm)' }}>
          <i className="ti ti-refresh" aria-hidden="true" />Resume workout
        </button>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Today · {focus === 'strength' ? 'Strength' : 'Movement'}</div>
          <span className="pill"><i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{total(p.workout)} minutes</span>
        </div>

        <div role="group" aria-label="Detail level" style={{ display: 'flex', gap: 5, background: '#f3edfa', borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {[['Compact', false], ['Detailed', true]].map(([label, val]) => (
            <button key={label as string} onClick={() => setDetailed(val as boolean)} aria-pressed={detailed === val}
              style={{ flex: 1, fontSize: 12, padding: '7px 0', borderRadius: 9, border: 0, cursor: 'pointer', font: 'inherit',
                fontWeight: detailed === val ? 500 : 400, background: detailed === val ? '#fff' : 'transparent', color: detailed === val ? 'var(--accent)' : 'var(--text-muted)' }}>
              {label as string}
            </button>
          ))}
        </div>

        {warm && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#f7eefc', border: '1px solid #efe1f8', borderRadius: 14, padding: '11px 12px', marginBottom: 6 }}>
            <i className="ti ti-music" aria-hidden="true" style={{ fontSize: 20, color: '#7a3ea3' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent-ink)' }}>{warm.exercise.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>Today's warm-up</div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#7a3ea3' }}>
              <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 15 }} />{warm.target}
            </span>
          </div>
        )}

        <WorkoutPreview workout={p.workout} detailed={detailed} onOpenMove={p.onOpenMove} />

        <button className="btn btn-soft" onClick={p.onReroll} style={{ width: '100%', marginTop: 12, fontSize: 14, padding: '10px' }}>
          <i className="ti ti-refresh" aria-hidden="true" />Different mix
        </button>
      </div>

      <div role="radiogroup" aria-label="Workout length" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {KINDS.map((k) => (
          <button key={k} role="radio" aria-checked={p.kind === k} onClick={() => p.onKind(k)}
            style={{ flex: 1, fontSize: 13, padding: '11px 0', borderRadius: 13, cursor: 'pointer', font: 'inherit',
              border: p.kind === k ? 0 : '1px solid #e7def2', fontWeight: p.kind === k ? 500 : 400,
              background: p.kind === k ? 'var(--accent)' : '#fff', color: p.kind === k ? '#fff' : 'var(--accent)' }}>
            {k.replace('min', ' minutes')}
          </button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={p.onStart} style={{ width: '100%' }} aria-label="Start workout">
        <i className="ti ti-player-play" aria-hidden="true" />Start workout
      </button>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <VoicePicker voices={voices} value={voiceURI} onChange={handleVoiceChange} />
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Rewire `src/App.tsx` to generate a preview on Home**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useMemo, useState } from 'react';
import type { Category, Workout, WorkoutKind } from './domain/types';
import { generateWorkout } from './generator/generateWorkout';
import { useWorkoutSession } from './ui/useWorkoutSession';
import { HomeScreen } from './ui/HomeScreen';
import { ActiveScreen } from './ui/ActiveScreen';
import { DoneScreen } from './ui/DoneScreen';
import { recordCompletion, currentStreak, getPrefs, getCheckpoint, getRecentThemes, pushRecentTheme } from './storage/store';
import type { Checkpoint } from './storage/store';

function todayStr(): string { return new Date().toISOString().slice(0, 10); }
function daySeed(): number { return Math.floor(Date.now() / 86_400_000); }

export default function App() {
  const [phase, setPhase] = useState<'home' | 'active' | 'done'>('home');
  const [kind, setKind] = useState<WorkoutKind>('20min');
  const [seed, setSeed] = useState<number>(daySeed());
  const [preview, setPreview] = useState<Workout>(() =>
    generateWorkout({ kind: '20min', date: new Date(), equipment: getPrefs().equipment, recentThemeIds: getRecentThemes(), seed: daySeed() }));
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [streak, setStreak] = useState(0);
  const [resumeFrom, setResumeFrom] = useState<{ index: number; elapsedSec: number } | null>(null);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(() => getCheckpoint());
  const { state, completed, start, pause, resume, skip, end } = useWorkoutSession(workout);

  useEffect(() => {
    setPreview(generateWorkout({ kind, date: new Date(), equipment: getPrefs().equipment, recentThemeIds: getRecentThemes(), seed }));
  }, [kind, seed]);

  useEffect(() => {
    setStreak(currentStreak(todayStr()));
    if (phase === 'home') setCheckpoint(getCheckpoint());
  }, [phase]);

  const categories = useMemo<Category[]>(
    () => (workout?.segments.map((s) => s.exercise?.category).filter(Boolean) as Category[]) ?? [], [workout]);

  function handleStart() {
    if (preview.warmupThemeId) pushRecentTheme(preview.warmupThemeId);
    setResumeFrom(null);
    setWorkout(preview);
    setPhase('active');
  }
  function handleResume() {
    const cp = getCheckpoint(); if (!cp) return;
    setResumeFrom({ index: cp.segmentIndex, elapsedSec: cp.elapsedSec });
    setWorkout(cp.workout); setPhase('active');
  }

  useEffect(() => {
    if (phase === 'active' && state.status === 'idle' && workout) start(resumeFrom ?? undefined);
  }, [phase, state.status, workout, start, resumeFrom]);

  useEffect(() => {
    if (phase === 'active' && state.status === 'done' && workout) {
      if (completed) {
        recordCompletion({ date: todayStr(), kind: workout.kind, focus: workout.focus,
          exerciseIds: [...new Set(workout.segments.flatMap((s) => (s.exercise ? [s.exercise.id] : [])))],
          durationSec: workout.segments.reduce((a, s) => a + s.durationSec, 0) });
        setPhase('done');
      } else { setWorkout(null); setPhase('home'); }
    }
  }, [phase, state.status, completed, workout]);

  if (phase === 'home') return (
    <HomeScreen workout={preview} kind={kind} onKind={setKind} streak={streak}
      canResume={!!checkpoint} onResume={handleResume} onReroll={() => setSeed((s) => s + 1)}
      onStart={handleStart} onOpenMove={() => {}} />
  );
  if (phase === 'done') return <DoneScreen categories={categories} streak={streak} onHome={() => { setWorkout(null); setPhase('home'); }} />;
  return <ActiveScreen state={state} onPause={pause} onResume={resume} onSkip={skip} onEnd={end} />;
}
```

(`onOpenMove` is a no-op here; the move-detail sheet, swap, and the new Active/Done props are wired in Tasks 6–8, each updating just its own `App.tsx` render line so every task builds green.)

- [ ] **Step 6: Run the Home test + suite + build**

```bash
npx vitest run src/ui/HomeScreen.test.tsx
npx vitest run
npm run build
```
Expected: Home test PASS; full suite green; build clean. App still renders the existing Active/Done screens with their current signatures (they're redesigned in Tasks 7–8) and the move-detail sheet is added in Task 6, so this task builds green on its own.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/ui/HomeScreen.tsx src/ui/WorkoutPreview.tsx src/ui/HomeScreen.test.tsx
git commit -m "feat: generate workout on Home and show it as a readable list"
```

---

### Task 6: Move detail sheet + swap

**Files:**
- Create (or replace the Task 5 stub): `src/ui/MoveDetail.tsx`

**Interfaces:**
- Consumes: `formatTarget`; domain types. Props `{ workout: Workout; prepareIndex: number; onSwap: () => void; onClose: () => void }`.
- Produces: an in-flow overlay (no `position: fixed`) showing the move's name, category, target, the coach cue as how-to, and Swap / Close buttons.

- [ ] **Step 1: Implement `src/ui/MoveDetail.tsx`**

```tsx
import type { Workout } from '../domain/types';
import { formatTarget } from './format';

const CAT: Record<string, string> = { push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility' };

interface Props { workout: Workout; prepareIndex: number; onSwap: () => void; onClose: () => void }

export function MoveDetail({ workout, prepareIndex, onSwap, onClose }: Props) {
  const prep = workout.segments[prepareIndex];
  const ex = prep?.exercise;
  const work = workout.segments[prepareIndex + 1];
  if (!ex) return null;
  const target = work ? formatTarget(work) : '';
  return (
    <div onClick={onClose} style={{ minHeight: '100vh', position: 'absolute', inset: 0, background: 'rgba(31,20,48,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={ex.name}
        style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="cat">{CAT[ex.category] ?? ex.category}</span>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close" style={{ padding: 9, borderRadius: 12 }}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>{ex.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
          <i className={`ti ${ex.measure === 'reps' ? 'ti-repeat' : 'ti-clock'}`} aria-hidden="true" />{target}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', background: 'var(--accent-soft)', borderRadius: 14, padding: 14, marginBottom: 18 }}>{ex.cue}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-soft" onClick={onSwap} style={{ flex: 1 }}><i className="ti ti-arrows-exchange" aria-hidden="true" />Swap this move</button>
          <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>Keep it</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the detail sheet into `src/App.tsx`**

Add three imports beside the existing generator/ui imports:
```tsx
import { MoveDetail } from './ui/MoveDetail';
import { swapMove } from './generator/swapMove';
import { createRng } from './generator/rng';
```
Add the open-move state beside the other `useState`s:
```tsx
  const [openPrepare, setOpenPrepare] = useState<number | null>(null);
```
Add a swap handler beside `handleResume`:
```tsx
  function handleSwap(prepareIndex: number) {
    setPreview((w) => swapMove(w, prepareIndex, getPrefs().equipment, createRng(Math.floor(Math.random() * 1e9))));
  }
```
Replace the `home`-phase return so it renders the sheet and passes a real `onOpenMove`:
```tsx
  if (phase === 'home') return (
    <>
      <HomeScreen workout={preview} kind={kind} onKind={setKind} streak={streak}
        canResume={!!checkpoint} onResume={handleResume} onReroll={() => setSeed((s) => s + 1)}
        onStart={handleStart} onOpenMove={setOpenPrepare} />
      {openPrepare !== null && (
        <MoveDetail workout={preview} prepareIndex={openPrepare}
          onSwap={() => { handleSwap(openPrepare); setOpenPrepare(null); }} onClose={() => setOpenPrepare(null)} />
      )}
    </>
  );
```

- [ ] **Step 3: Build + suite**

```bash
npm run build
npx vitest run
```
Expected: clean; suite green.

- [ ] **Step 4: Commit**

```bash
git add src/ui/MoveDetail.tsx src/App.tsx
git commit -m "feat: move detail sheet with how-to and swap"
```

---

### Task 7: Active screen redesign

**Files:**
- Modify: `src/ui/ActiveScreen.tsx`
- Create: `src/ui/TimerRing.tsx`
- Test: `src/ui/ActiveScreen.test.tsx`

**Interfaces:**
- Consumes: `SessionState`; `Workout`; `sessionMoves`/`currentMoveIndex`/`formatTarget`. New props `{ state, workout, onPause, onResume, onSkip, onEnd }`.
- Produces: progress bar + "Move N of M", current move card, `TimerRing`, next-up card, controls, rest state.

- [ ] **Step 1: Write the failing test**

Create `src/ui/ActiveScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActiveScreen } from './ActiveScreen';
import { generateWorkout } from '../generator/generateWorkout';
import type { SessionState } from '../engine/session';

const w = generateWorkout({ kind: '10min', date: new Date('2026-06-24T08:00:00'), equipment: ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'], seed: 4 });
const firstWork = w.segments.findIndex((s) => s.kind === 'work');
const state: SessionState = { status: 'running', segmentIndex: firstWork, segment: w.segments[firstWork], segmentRemainingSec: 20 };

describe('ActiveScreen', () => {
  it('shows the current move name and a Move N of M progress label', () => {
    render(<ActiveScreen state={state} workout={w} onPause={vi.fn()} onResume={vi.fn()} onSkip={vi.fn()} onEnd={vi.fn()} />);
    expect(screen.getByText(w.segments[firstWork].exercise!.name)).toBeInTheDocument();
    expect(screen.getByText(/Move \d+ of \d+/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/ui/ActiveScreen.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Create `src/ui/TimerRing.tsx`**

```tsx
interface Props { remaining: number; total: number }
export function TimerRing({ remaining, total }: Props) {
  const r = 86, c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const mm = Math.floor(remaining / 60), ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`${Math.ceil(remaining)} seconds remaining`}>
        <circle cx="100" cy="100" r={r} fill="#fff" stroke="#ece4f5" strokeWidth="14" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#5b2a86" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 100 100)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 46, fontWeight: 500, letterSpacing: '-1px', lineHeight: 1 }}>{mm}:{ss}</div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 4 }}>remaining</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `src/ui/ActiveScreen.tsx`**

```tsx
import type { SessionState } from '../engine/session';
import type { Workout } from '../domain/types';
import { TimerRing } from './TimerRing';
import { sessionMoves, currentMoveIndex } from './format';

const CAT: Record<string, string> = { warmup: 'Warm-up', push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility' };

interface Props {
  state: SessionState; workout: Workout;
  onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void;
}

export function ActiveScreen({ state, workout, onPause, onResume, onSkip, onEnd }: Props) {
  const seg = state.segment;
  const isRest = seg?.kind === 'rest';
  const moves = sessionMoves(workout);
  const mi = currentMoveIndex(moves, state.segmentIndex);
  const move = moves[mi];
  const next = moves[mi + 1];
  const title = isRest ? 'Rest' : seg?.exercise?.name ?? 'Get ready';

  return (
    <main className="screen" style={{ display: 'flex', flexDirection: 'column', background: isRest ? '#eef3fb' : 'var(--bg)' }}>
      <p className="sr-only" aria-live="assertive">{title}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ flex: 1, height: 7, background: '#e7def2', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${Math.round(((mi + 1) / moves.length) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Move {mi + 1} of {moves.length}</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 7 }}>
        {!isRest && seg?.exercise && <span className="pill">{CAT[seg.exercise.category] ?? seg.exercise.category}</span>}
      </div>
      <div style={{ textAlign: 'center', fontSize: 27, fontWeight: 500, letterSpacing: '-.3px', marginBottom: 7 }}>{title}</div>
      {!isRest && move && (
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{move.target}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 18px' }}>
        <TimerRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} />
      </div>

      {next && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', marginBottom: 18 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)' }}><i className="ti ti-arrow-right" aria-hidden="true" /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>Next up</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{next.exercise.name}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>{CAT[next.category] ?? next.category}<br />{next.target}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 9, marginTop: 'auto' }}>
        {state.status === 'paused'
          ? <button className="btn btn-primary" style={{ flex: 1 }} onClick={onResume}><i className="ti ti-player-play" aria-hidden="true" />Resume</button>
          : <button className="btn btn-primary" style={{ flex: 1 }} onClick={onPause}><i className="ti ti-player-pause" aria-hidden="true" />Pause</button>}
        <button className="btn btn-soft" style={{ flex: 1 }} onClick={onSkip}><i className="ti ti-player-skip-forward" aria-hidden="true" />Skip</button>
        <button className="btn btn-ghost" onClick={onEnd} aria-label="End workout"><i className="ti ti-x" aria-hidden="true" /></button>
      </div>
    </main>
  );
}
```

Then update `src/App.tsx`'s active-phase return to pass the workout:
```tsx
  return <ActiveScreen state={state} workout={workout!} onPause={pause} onResume={resume} onSkip={skip} onEnd={end} />;
```

- [ ] **Step 5: Run the test + suite + build**

```bash
npx vitest run src/ui/ActiveScreen.test.tsx
npx vitest run
npm run build
```
Expected: PASS; suite green; build clean.

- [ ] **Step 6: Commit**

```bash
git add src/ui/ActiveScreen.tsx src/ui/TimerRing.tsx src/ui/ActiveScreen.test.tsx src/App.tsx
git commit -m "feat: redesigned active screen with progress, timer ring, and next-up"
```

---

### Task 8: Finish screen redesign

**Files:**
- Modify: `src/ui/DoneScreen.tsx`
- Create: `src/ui/WeekView.tsx`
- Test: `src/ui/DoneScreen.test.tsx`

**Interfaces:**
- Consumes: `weekView` (Task 3); `loadStore`/completions; `Workout`. New props `{ categories: Category[]; streak: number; workout: Workout | null; onHome: () => void }`.
- Produces: celebration, summary card with capability chips + streak, `WeekView`, Done button.

- [ ] **Step 1: Write the failing test**

Create `src/ui/DoneScreen.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoneScreen } from './DoneScreen';

describe('DoneScreen', () => {
  it('lists practiced categories and a this-week strip', () => {
    render(<DoneScreen categories={['push', 'pull', 'mobility']} streak={2} workout={null} onHome={vi.fn()} />);
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('Pull')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
npx vitest run src/ui/DoneScreen.test.tsx
```
Expected: FAIL.

- [ ] **Step 3: Create `src/ui/WeekView.tsx`**

```tsx
import { weekView } from '../storage/week';

interface Props { dates: string[]; today: string }
export function WeekView({ dates, today }: Props) {
  const days = weekView(dates, today);
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>This week</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {days.map((d) => (
          <div key={d.date} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: d.isToday ? 'var(--accent)' : 'var(--text-hint)', fontWeight: d.isToday ? 500 : 400, marginBottom: 7 }}>{d.label}</div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: d.done ? 'var(--accent)' : '#f1ebf7', color: '#fff', boxShadow: d.isToday ? '0 0 0 3px #d9c7ee' : 'none' }}>
              {d.done && <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 16 }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `src/ui/DoneScreen.tsx`**

```tsx
import type { Category, Workout } from '../domain/types';
import { loadStore } from '../storage/store';
import { WeekView } from './WeekView';

const LABELS: Partial<Record<Category, string>> = { push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility' };
const today = () => new Date().toISOString().slice(0, 10);

interface Props { categories: Category[]; streak: number; workout: Workout | null; onHome: () => void }

export function DoneScreen({ categories, streak, workout, onHome }: Props) {
  const practiced = Array.from(new Set(categories.map((c) => LABELS[c]).filter(Boolean))) as string[];
  const mins = workout ? Math.round(workout.segments.reduce((a, s) => a + s.durationSec, 0) / 60) : 0;
  const dates = loadStore().completions.map((c) => c.date);
  return (
    <main className="screen">
      <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
        <div style={{ width: 66, height: 66, margin: '0 auto 13px', borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-check" aria-hidden="true" style={{ fontSize: 36 }} /></div>
        <div style={{ fontSize: 23, fontWeight: 500 }}>Great job, Elli</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>You're more capable than yesterday.</div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}><i className="ti ti-clock" aria-hidden="true" />{mins} minutes</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}><i className="ti ti-list-check" aria-hidden="true" />{practiced.length} moves</span>
          {streak > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warm-soft)', color: 'var(--warm)', fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 99 }}><i className="ti ti-flame" aria-hidden="true" />{streak}-day streak</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 9 }}>You practiced</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {practiced.map((p) => <span key={p} className="chip"><i className="ti ti-check" aria-hidden="true" style={{ fontSize: 15, color: 'var(--accent)' }} />{p}</span>)}
        </div>
      </div>

      <WeekView dates={dates} today={today()} />

      <button className="btn btn-primary" onClick={onHome} style={{ width: '100%' }}><i className="ti ti-home" aria-hidden="true" />Done</button>
    </main>
  );
}
```

Then update `src/App.tsx`'s done-phase return to pass the workout:
```tsx
  if (phase === 'done') return <DoneScreen categories={categories} streak={streak} workout={workout} onHome={() => { setWorkout(null); setPhase('home'); }} />;
```

- [ ] **Step 5: Run the test + full suite + build**

```bash
npx vitest run src/ui/DoneScreen.test.tsx
npx vitest run
npm run build
```
Expected: PASS; full suite green; build clean.

- [ ] **Step 6: Commit**

```bash
git add src/ui/DoneScreen.tsx src/ui/WeekView.tsx src/ui/DoneScreen.test.tsx src/App.tsx
git commit -m "feat: redesigned finish screen with capability chips and week view"
```

---

## Self-Review

**Spec coverage:** Warm theme + tokens → Task 1. Show today's workout on Home (list, full targets, warm-up banner, Compact/Detailed toggle, length selector regenerates, re-roll, voice, streak, Start runs preview) → Task 5. Move detail + swap → Tasks 4+6. Active (progress, timer ring, next-up, controls, rest) → Task 7. Finish (celebration, capability chips, streak, week view) → Tasks 3+8. Pure helpers tested → Tasks 2,3,4. Generate-on-home architecture → Task 5 App.tsx. Determinism / resume / completed-record preserved → Task 5 keeps those effects intact.

**Placeholder scan:** none. The one sequencing note (Task 5 may need a `MoveDetail` stub until Task 6) is explicit, not a placeholder.

**Type consistency:** `SessionMove`/`sessionMoves`/`currentMoveIndex`/`formatTarget` (Task 2) match their uses in Tasks 5/7. `swapMove(workout, prepareIndex, equipment, rng)` (Task 4) matches `handleSwap` in Task 5. `weekView(dates, today)` (Task 3) matches `WeekView` (Task 8). New props for `HomeScreen`/`ActiveScreen`/`DoneScreen` match how `App.tsx` (Task 5) renders them. `MoveDetail` props match Task 5's usage. The Tabler icon webfont `<link>` is added in Task 5 (used by all screens).

> Known soft spots for execution: (1) `swapMove` keeps the existing work-segment count, so swapping between a unilateral and a non-unilateral exercise reuses the old structure (cosmetic, rare) — acceptable for v1. (2) The Tabler webfont is bundled (Task 1 `@import`) and precached by Workbox (`woff2` is in `globPatterns`), so icons work offline.
