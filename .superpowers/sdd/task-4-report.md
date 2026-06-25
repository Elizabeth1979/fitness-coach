# Task 4 Report: `generator/swapMove.ts` — Swap One Move

## Summary
Implemented `swapMove` function to replace one exercise in a workout with a different same-category alternative, reusing existing segment durations. Full TDD workflow: RED → GREEN → COMMIT. All tests pass; full build succeeds.

## TDD Workflow

### Step 1: Export `candidatesFor` ✅
- Modified `src/generator/selectExercises.ts` line 12
- Changed `function candidatesFor(` to `export function candidatesFor(`
- Enables import into swapMove module

### Step 2: Write Test File ✅
- Created `src/generator/swapMove.test.ts` (50 lines)
- 3 test cases covering core requirements:
  1. **Replaces move with different exercise of same category**
     - Verifies new exercise ID differs from original
     - Verifies category unchanged
  2. **Keeps total duration unchanged (durations reused)**
     - Sums all segment durations before and after
     - Confirms equality
  3. **Does not mutate original workout**
     - Captures original exercise ID before swap
     - Calls swapMove
     - Confirms original unmodified

### Step 3: Confirm Test Fails ✅
```
npx vitest run src/generator/swapMove.test.ts
```
Expected failure: `Error: Failed to resolve import "./swapMove"`
- Exit code 1
- 0 tests ran (module missing)

### Step 4: Implement swapMove.ts ✅
- Created `src/generator/swapMove.ts` (32 lines)
- Pure function: no browser APIs, fully deterministic
- Signature: `swapMove(workout: Workout, prepareIndex: number, equipment: Equipment[], rng: () => number): Workout`

**Core Logic:**
1. **Validate:** Confirm segment at prepareIndex is a prepare-kind segment with exercise
2. **Pool:** Get candidates matching current exercise's category, filter out current exercise
3. **Guard:** Return workout unchanged if no alternatives exist
4. **Pick:** Use rng to randomly select from pool
5. **Map:** Create new segments array:
   - Replace prepare segment: new exercise + updated cues (phrases.next + countdowns)
   - Replace work segments: update all work segments immediately following prepare that belonged to old exercise
6. **Return:** New workout (no mutation)

### Step 5: Verify Tests Pass ✅

**Swap test alone:**
```
Test Files  1 passed (1)
Tests  3 passed (3)
```

**Full test suite:**
```
Test Files  19 passed (19)
Tests  71 passed (71)
Duration  1.07s
```

**Build (the real verification gate):**
```
tsc -b — type checking: SUCCESS
vite build — production bundle: SUCCESS (219.10 KiB)
PWA manifest generation: SUCCESS
```

### Step 6: Commit ✅
- Branch: `feature/visual-redesign`
- Commit SHA: `69fe2d5`
- Message: "feat: add swapMove (replace one move, reuse durations)"
- Files committed:
  - `src/generator/selectExercises.ts` (export added)
  - `src/generator/swapMove.ts` (implementation)
  - `src/generator/swapMove.test.ts` (test suite)

## Code Quality Checklist

### Functional Correctness
- ✅ Picks different exercise (test verifies ID differs)
- ✅ Same category (test verifies category unchanged)
- ✅ Reuses durations (test confirms total duration stable)
- ✅ No original mutation (test confirms workout unchanged after call)
- ✅ Returns unchanged if no alternatives (code guard at line 14)
- ✅ Updates both prepare and work segments (map logic preserves work durations)

### Type Safety & Style
- ✅ No `any` types; strict TypeScript
- ✅ Explicit return type: `Workout`
- ✅ All parameters typed: `Equipment[]`, `() => number`
- ✅ Pure function: no imports of window, document, navigator, etc.
- ✅ Reuses domain types: `Cue`, `Segment`, `Workout`, `Equipment`
- ✅ Follows codebase naming conventions

### Module Design
- ✅ Imports from pure modules only: `selectExercises`, `rng`, `phrases`
- ✅ Export is public: `export function swapMove(...)`
- ✅ Consumed by move-detail sheet (Task 5)
- ✅ Deterministic: same rng seed → same swap choice

## Test Evidence

**Swap test output:**
```bash
$ npx vitest run src/generator/swapMove.test.ts
 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  07:33:08
   Duration  345ms
```

**Full suite output:**
```bash
$ npx vitest run
 Test Files  19 passed (19)
      Tests  71 passed (71)
   Start at  07:33:10
   Duration  1.07s
```

**Build output:**
```bash
$ npm run build
tsc -b && vite build
✓ built in 126ms
PWA v1.3.0 mode generateSW precache 12 entries (884.23 KiB)
```

## Integration Notes

- **Input:** `Workout` (from `generateWorkout`), prepare segment index, available equipment, rng function
- **Output:** New `Workout` with one exercise swapped; durations and structure identical except exercise ID and prepare cues
- **Usage (Task 5):** Move-detail sheet calls `swapMove` when user taps "change exercise"
- **Purity:** Can be tested without any mocking or setup; deterministic given inputs
- **Error handling:** Graceful: returns unchanged if no alternatives; validates segment existence

All requirements met. Ready for move-detail sheet integration.

## Task 4 fix

### Bug fixed
`swapMove` was retagging ALL work segments after `prepareIndex` whose `exercise.id` matched the current exercise, meaning the same exercise appearing in a later round (multi-round 20/30-min workout) would be silently swapped too.

### Changes

**`src/generator/swapMove.ts`**
- Computed a `workEnd` boundary: the index of the next `rest` or `prepare` segment after `prepareIndex` (or `workout.segments.length` if none).
- Changed the work-segment retag guard from `i > prepareIndex && seg.kind === 'work' && seg.exercise?.id === current.id` to `i > prepareIndex && i < workEnd && seg.kind === 'work'` — the `exercise.id` check is no longer needed since the boundary already scopes to the targeted move's slots.

**`src/generator/swapMove.test.ts`**
- Added a 4th test: builds a synthetic 2-round workout where `exA` appears in both round 1 (indices 0–1) and round 2 (indices 3–4). Swaps index 0, then asserts `segments[1].exercise.id !== 'exA'` (first move swapped) and `segments[4].exercise.id === 'exA'` (later-round occurrence untouched).

### Vitest output

```
npx vitest run src/generator/swapMove.test.ts
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  344ms

npx vitest run
 Test Files  19 passed (19)
      Tests  72 passed (72)
   Duration  1.08s
```

### Build output

```
npm run build
tsc -b && vite build
✓ built in 130ms
PWA v1.3.0 mode generateSW precache 12 entries (884.23 KiB)
```
