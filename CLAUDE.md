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
- **Installed-app updates (`src/pwa/update.ts`):** we register the service worker ourselves
  (`injectRegister: false`, with `skipWaiting`/`clientsClaim` set explicitly in `vite.config.ts` —
  without them a new version waits forever). It checks for updates whenever the app returns to the
  foreground and reloads into a new version once it takes over, but never mid-workout: `App` calls
  `setBusy(phase !== 'home')`.
- **App icons** are drawn by `design/render_icons.py` (stdlib-only Python; geometry mirrors
  `public/favicon.svg`): manifest icons (+ an Android maskable one) and `public/apple-touch-icon.png`
  for iPhone. Change the design there and re-run it rather than hand-editing PNGs.
- **Security headers live in `vercel.json`** (strict CSP `default-src 'self'`, nosniff, no referrer,
  COOP, Permissions-Policy), guarded by `src/securityHeaders.test.ts`. Everything is self-hosted, so
  nothing may load from another origin and no inline `<script>`/`<style>` tags or `eval` (React
  `style={{}}` props are fine — they're set through the CSSOM, which CSP doesn't block). Adding an
  external resource means widening the CSP on purpose. Vercel's preview toolbar is blocked by it.
- **The `gh-pages` branch is NOT stale — don't delete it.** It serves the old GitHub Pages address
  (`elizabeth1979.github.io/fitness-coach`) as a redirect to Vercel plus a `sw.js` that clears old
  offline copies on phones that installed the app from there before the move.
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
(pure: `formatTarget`/`sessionMoves`) · `pwa/` wakeLock + update. The design system (tokens +
reusable classes `.card`/`.btn`/`.pill`/…) lives in `src/index.css`; components hold **no colour
literals** — add a `:root` token and switch states with `data-*`/`aria-*` selectors (e.g. the timer
and rest screen use `data-tone="rest"`). Every bottom sheet uses `src/ui/Sheet.tsx` (focus in, Tab
trapped, Escape closes, focus returns). Tailwind is imported, so **don't name a class after a
Tailwind utility** (`ring`, `shadow`, `block`, …) — it silently inherits that utility's styles. Icons are inline SVGs from
`@tabler/icons-react`, all listed in `src/ui/Icon.tsx` (`<Icon name="clock" />` — add new ones to
its map; never re-add the 5,000-icon webfont).

## Conventions & invariants

- **All spoken copy lives in `src/coach/phrases.ts`** (encouragement lines in `src/coach/encouragements.json`, dealt like a shuffled deck from their own RNG stream so editing the list never changes exercise selection; every exercise gets ≥1, kept ≥6s clear of the closing countdown). Tone is calm, encouraging, present-tense —
  **never** calorie / weight-loss / "burn" / guilt / military wording. The user's name "Elli" is
  hard-coded. There is a test asserting banned words don't appear.
- **Determinism:** `generateWorkout` is pure and seeded by `createRng(seed)` (seed defaults to the
  local day number). Same `{kind, date, equipment, recentExerciseIds, recentThemeIds, seed}` ⇒ identical
  `Workout`. Never introduce `Math.random()` / `Date.now()` into the generator or engine.
- **Time budget:** the main circuit (1 each of Push/Pull/Legs/Hinge/Carry-or-Crawl/Mobility,
  repeated per round) is sized by `spreadDrift` to hit the target (10/20/30 min = 600/1200/1800s).
  Circuit width + rounds are per-kind: **10-min trims to the `SLOTS_SHORT` trio (Push/Pull/Legs) ×
  3 rounds** so each move gets ≥3 effective sets; 20/30-min use the full 6 slots (×3 / ×5). Warm-up
  flow segments are FIXED length (30s, or 120s free-dance) and are **excluded from** `spreadDrift`.
  The "total within 45s of target" test guards this (for both circuit & stations) — tune durations,
  not the tolerance.
- **Changeovers (`generator/changeover.ts`):** getting from one move to the next is a 15s rest that
  says "Rest… Next up: X." the moment it starts, then a 5s "Get ready" that ends in a real
  one-per-second "three, two, one" → "Go!" (~20s total; a changeover rest also follows the warm-up
  and sits between stations; the round-rest is the changeover between rounds). Speech can't overlap,
  so never schedule a long line less than ~2s before a count — it queues and the counts come out in
  a rushed burst (the original bug). Every exercise (work segment) also ends with "three, two,
  one" so you know it's almost done. `annotateChangeovers` is an idempotent post-pass that writes
  each rest's "Next up" (name + how-to, from the exercise `cue`) + all closing countdowns from the
  final segment order; `swapMove` re-runs it. The "no spoken line runs into the next one" test in
  `changeover.test.ts` (2.5 words/s) guards every cue schedule — keep new copy short enough to pass.
- **One-sided moves:** a unilateral exercise is `left work → 'switch' segment (10s, "Switch sides." +
  three-two-one) → right work`. Each costs two bouts plus a switch every round, so selection caps them
  (`maxOneSided`: 0 in the 10-min — two-sided moves only — 2 otherwise, a soft cap). `swapMove`
  reshapes a bout when sidedness changes (merge sides / split into left·switch·right) so a switch
  segment only ever sits between the two sides of a one-sided move, and only swaps a one-sided move
  in when every bout has room (≥ switch + 2 × MIN_WORK_SEC). `canSwap()` uses the same rule
  (`swapChoices`), so the UI hides "Swap" exactly when `swapMove` would change nothing.
- **Completion semantics:** the engine's `finished` event carries `completed: boolean` (true only on
  natural finish; the ✕ "end" button → `completed: false`). `App` records a completion ONLY when
  `completed` is true. The `useWorkoutSession` hook also resets its state to idle when `workout`
  changes, so a finished workout never leaks `done` state into the next one — don't remove that guard.
- **Dates are local:** "today" (streak, week strip, daily seed, completion date) is the date on the
  user's clock — always via `src/domain/date.ts` (`localDate`, `localDayNumber`), never
  `toISOString().slice(0, 10)` (that's the UTC date: a 1am workout landed on the wrong day).
- **Leaving the app pauses the workout:** `RafClock` caps each frame at `MAX_FRAME_SEC` (browsers stop
  frames while hidden; one giant tick would fire every remaining cue at once), and the hook pauses on
  `visibilitychange` → hidden. `pause()`/`resume()` emit `statusChanged` so the UI shows Resume. The
  wake lock (`src/pwa/wakeLock.ts`) re-takes itself on return because the browser drops it when hidden.
- **Saved data is untrusted:** `storage/store.ts` checks every field on load (old app versions, corrupt
  JSON) and falls back to defaults; a checkpoint that doesn't fit the current `Workout` shape is dropped.
  Saves never throw (full / blocked storage). `src/ui/ErrorBoundary.tsx` wraps `App`: a render crash
  shows "Back to home" and clears the checkpoint. When you change `Workout`/`Segment`, update `isSegment`/
  `isCheckpoint` too.
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

**Session rhythm:** start by reading `plans/TODO.md` (the "resume here" entry); end by writing a
session log in `plans/sessions/YYYY-MM-DD.md` and refreshing `plans/TODO.md`.
