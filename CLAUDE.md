# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Move With Elli** — a voice-first movement-coach PWA. Press Start → a rule-based generator
builds a timed full-body workout → a clock-driven engine plays it, speaking coach cues and
firing haptics → it records a streak. Philosophy: *"Press Play. Don't Think. Move."* — remove
decision fatigue; build longevity strength/mobility/balance/skill; **never** calories or body weight.

## Commands

```bash
npm install
npm run dev          # http://localhost:5173/
npm run build        # tsc -b && vite build — the REAL verification gate (see gotchas)
npm run test:run     # one-shot test run (CI uses this)
npm test             # vitest watch mode
npx vitest run src/generator/generateWorkout.test.ts   # a single test file
npx vitest run -t "deterministic"                       # tests matching a name
npx oxlint           # lint (config in .oxlintrc.json; not wired to an npm script)
```

## Verification gotchas (these have bitten before)

- **Always run `npm run build`, not just the tests, before claiming work is done.** `vitest`
  runs via esbuild, which strips types WITHOUT type-checking and ignores `erasableSyntaxOnly`.
  Only `tsc -b` (inside `npm run build`) catches type errors and erasable-syntax violations. A
  build break once hid behind a green test run for several tasks.
- **`erasableSyntaxOnly` is enabled** (`tsconfig.app.json`): no TypeScript constructor parameter
  properties, no `enum`, no `import =`. Use explicit field declarations + assignment instead.
- **jsdom provides no `localStorage`** in this Vitest setup (opaque origin). Storage tests stub it
  with a typed `Storage` via `vi.stubGlobal`; `src/test-setup.ts` also has a conditional polyfill.
  Don't "fix" this with an `as any` cast — keep it typed.
- **Strict mode, no `any`** in committed code.
- **Base path is `/`** (root) — deployed on Vercel, which serves at the domain root. Set in
  `vite.config.ts` (`base`) and the PWA manifest `scope`/`start_url`. (History: was `/fitness-coach/`
  for GitHub Pages project-site hosting, which serves under `/<repo>/`.)

## Architecture: functional core / imperative shell

The testable brain (generator + engine) is **pure** — no `window`/`navigator`/`document`/
`speechSynthesis` — so the entire workout logic is unit-tested against a **fake clock** with no
browser. Browser concerns live in thin adapters. **Pure-logic modules that must not import browser
APIs:** `src/domain`, `src/generator`, `src/engine/session.ts`, `src/coach/phrases.ts`,
`src/storage/streak.ts`. The one engine exception is `src/engine/clock.ts` `RafClock` (the
real-clock adapter); `Clock`/`FakeClock` in that same file stay pure.

**The data spine — read this before touching the generator or engine:** a `Workout` is a
precomputed ordered list of `Segment`s, and **each `Segment` carries its own pre-scheduled
`Cue`s** (`{ atSec, say?, haptic? }`). The generator decides *what the coach says and when*; the
engine just plays segments and fires their cues **exactly once** (a monotonic cursor per segment).
The engine knows nothing about exercises or coaching — this one-way boundary is central.

**Pipeline (each stage built and tested before the next):**
`generateWorkout()` (pure, seeded) → `WorkoutSession` state machine driven by a `Clock` (pure;
`FakeClock` in tests, `RafClock` in the app) → `useWorkoutSession` hook bridges engine events to
React state, speaks cues via `Coach`, fires haptics via `Feedback`, holds a Screen Wake Lock →
`App.tsx` phase machine (`home → active → done`). **Generate-on-Home:** App generates a `preview`
workout when Home opens (keyed on `kind`+`seed`) so the workout can be *shown* as a list before you
start; **Start runs that exact preview** (no second `generateWorkout`); re-roll re-seeds; the
move-detail sheet swaps one move via `swapMove`. App records completions (only when `completed`) and
shows the capability checklist.

**Module map** (`src/`): `domain/` types + exercise library · `generator/` `generateWorkout`,
`selectExercises`, `warmupFlows` (themed flows + Mobility Lottery), `rng` (seeded mulberry32),
`schedule` (weekday→focus) · `engine/` `clock`, `session` · `coach/` `phrases` (all spoken copy),
`coach` (SpeechSynthesis adapter) · `feedback/` vibrate + Web-Audio earcon fallback · `storage/`
`store` (localStorage repo), `streak`, `week` (pure) · `generator/swapMove` (swap one move) · `ui/`
hook + warm card-based screens + `VoicePicker`/`MoveDetail`/`TimerRing`/`WeekView` + `format`
(pure: `formatTarget`/`sessionMoves`) · `pwa/` wakeLock. The warm light theme + reusable classes
(`.card`/`.btn`/`.pill`/…) live in `src/index.css`; icons are the bundled Tabler webfont.

## Conventions & invariants

- **All spoken copy lives in `src/coach/phrases.ts`.** Tone is calm, encouraging, present-tense —
  **never** calorie / weight-loss / "burn" / guilt / military wording. The user's name "Elli" is
  hard-coded. There is a test asserting banned words don't appear.
- **Determinism:** `generateWorkout` is pure and seeded by `createRng(seed)` (seed defaults to the
  day number). Same `{kind, date, equipment, recentExerciseIds, recentThemeIds, seed}` ⇒ identical
  `Workout`. Never introduce `Math.random()` / `Date.now()` into the generator or engine.
- **Time budget:** the main 6-slot circuit (1 each of Push/Pull/Legs/Hinge/Carry-or-Crawl/Mobility,
  repeated per round) is sized by `spreadDrift` to hit the target (10/20/30 min = 600/1200/1800s).
  Warm-up flow segments are FIXED length (30s, or 120s free-dance) and are **excluded from**
  `spreadDrift`. The "total within 45s of target" test guards this — tune durations, not the tolerance.
- **Completion semantics:** the engine's `finished` event carries `completed: boolean` (true only on
  natural finish; the ✕ "end" button → `completed: false`). `App` records a completion ONLY when
  `completed` is true. The `useWorkoutSession` hook also resets its state to idle when `workout`
  changes, so a finished workout never leaks `done` state into the next one — don't remove that guard.
- **Themed warm-ups:** `warmupFlows.ts` `pickWarmupFlow` is the "Mobility Lottery" — avoids recently
  used themes (persisted via `pushRecentTheme`), prefers a flow that preps the day's work, weights
  "fun" flows up. The generator renders the chosen flow at the front of `segments`.

## Workflow

TDD is the established pattern (tests are committed alongside implementation). Pure core
(generator + engine + streak) is where the real coverage is; browser adapters (voice / haptics /
wake-lock) can't be unit-tested — verify those manually in the browser.

Vercel auto-deploys on push to `main` (Git integration); branches/PRs get preview URLs. The Vercel
build runs `npm run test:run && npm run build` (see `vercel.json`), so the full test suite **and**
the `tsc -b` type-check must pass before a deploy is promoted.

Design specs and the TDD implementation plans live in `docs/superpowers/`; the roadmap and polish
backlog are in `docs/NEXT-STEPS.md`.
