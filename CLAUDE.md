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
npm run lint         # oxlint --deny-warnings (config in .oxlintrc.json) — warnings fail the deploy
```

## Verification gotchas (these have bitten before)

- **Always run `npm run build`, not just the tests, before claiming work is done.** `vitest`
  runs via esbuild, which strips types WITHOUT type-checking and ignores `erasableSyntaxOnly`.
  Only `tsc -b` (inside `npm run build`) catches type errors and erasable-syntax violations. A
  build break once hid behind a green test run for several tasks.
- **`console.log` in a passing test prints nothing** with the default reporter — add `--reporter=verbose`
  (or write to a file) when a throwaway test is meant to print numbers.
- **Browser checks (Playwright, Chromium is preinstalled):** `npm run build`, serve `dist/` with the headers from
  `vercel.json` (so the real CSP applies) and drive the app. Wait ≥ 450ms after every screen change before the next
  click — `useTapGuard` drops taps in a new screen's first 400ms, so fast scripted clicks silently do nothing.
  Offline: load once, await `navigator.serviceWorker.ready`, stop the server **and** `context.setOffline(true)`, then
  open a fresh tab. Keep scripts and screenshots out of the repo (a relative `shots/` once landed in it).
- **Dead code:** `npx knip@5` finds unused files/exports; its "unused exported types" and the `Null*`/`Web*` adapter
  classes are expected (used inside their own module), not dead.
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
(pure: `formatTarget`/`sessionMoves`) · `pwa/` wakeLock + update · `ideas/send` (sends "Your ideas"
to Supabase; see below). The design system (tokens +
reusable classes `.card`/`.btn`/`.pill`/…, plus per-screen classes `home-*`/`detail-*`/`active-*`/`done-*`/
`week-*` and helpers like `.btn-block`/`.row-main`/`.choices`) lives in `src/index.css`; components hold
**no inline styles** except values computed at runtime (progress bar, confetti positions) — guarded by
`src/ui/inlineStyles.test.ts`. Add a `:root` token or a class, and switch states with `data-*`/`aria-*`
selectors (e.g. the timer and rest screen use `data-tone="rest"`, the week strip `data-today`). Icon
colours: `<Icon className="icon-warm" />`. **Dark mode** follows the phone (`prefers-color-scheme`, no toggle):
the `@media` block re-defines the same tokens, so never hard-code a colour; text on `--accent` uses
`--on-accent`, green text uses `--brand-text` (all text pairs ≥ 4.5:1). Every bottom sheet uses `src/ui/Sheet.tsx` (focus in, Tab
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
  not the tolerance. Measure with `trainingSec(workout)` (`domain/workout.ts`), which leaves out the intro.
- **Intro (`generator/intro.ts`):** segment 0 is an `'intro'`: the coach says what's waiting (length,
  warm-up, the main moves, core) and "First up: X + how-to", then "Get ready" + three-two-one; the first
  warm-up move then starts with just "Go!". It's sized to its words (2.5 words/s + 1s breath, ~25s) and is
  NOT part of the 10/20/30 minutes — Home/Done/streak all use `trainingSec`. `withIntro` drops any old intro
  and prepends a fresh one; `swapMove` re-runs it (only if one is there, so segment indices never shift).
  The active screen's "mm:ss left" clock (`format.ts` `timeLeft`) holds at the full length during the intro.
- **Changeovers (`generator/changeover.ts`):** getting from one move to the next is a 15s rest that
  says "Rest… Next up: X." the moment it starts, then a 5s "Get ready" that ends in a real
  one-per-second "three, two, one" → "Go!" (~20s total; a changeover rest also follows the warm-up
  and sits between stations; the round-rest is the changeover between rounds). Speech can't overlap,
  so never schedule a long line less than ~2s before a count — it queues and the counts come out in
  a rushed burst (the original bug). Every exercise (work segment) also ends with "three, two,
  one" so you know it's almost done. `annotateChangeovers` is an idempotent post-pass that writes
  each rest's "Next up" (name + how-to, from the exercise `cue`) + all closing countdowns from the
  final segment order; `swapMove` re-runs it. The "no spoken line runs into the next one" test in
  `changeover.test.ts` (2.5 words/s, `coach/secsToSay.ts` — the intro and Resume use the same estimate) guards every cue schedule — keep new copy short enough to pass.
- **One-sided moves:** a unilateral exercise is `left work → 'switch' segment (10s, "Switch sides." +
  three-two-one) → right work`. Each costs two bouts plus a switch every round, so selection caps them
  (`maxOneSided`: 0 in the 10-min — two-sided moves only — 2 otherwise, a soft cap). `swapMove`
  reshapes a bout when sidedness changes (merge sides / split into left·switch·right) so a switch
  segment only ever sits between the two sides of a one-sided move, and only swaps a one-sided move
  in when every bout has room (≥ switch + 2 × MIN_WORK_SEC). `canSwap()` uses the same rule
  (`swapChoices`), so the UI hides "Swap" exactly when `swapMove` would change nothing.
- **Completion semantics:** the engine's `finished` event carries `completed: boolean` (true only on
  natural finish; the ✕ "end" button → `completed: false`). The hook passes it to
  `useWorkoutSession(workout, onFinished)` (via `useEffectEvent`), and `App.handleFinished` records a
  completion ONLY when it's true. Putting a workout away (it changes / unmounts) is not a finish. The hook
  also resets its state to idle when `workout` changes (previous value kept in state, React's "adjust
  state when a prop changes" pattern), so a finished workout never leaks `done` into the next one.
- **React purity (enforced by lint):** don't read the clock (`new Date()`), storage or refs while
  rendering, and don't `setState` straight inside an effect. Read once in a lazy `useState(() => …)`,
  derive values during render (`App`'s `preview` = `useMemo(generateWorkout…)` + a `swapped` override
  tied to the workout it was made on), and update state in the event that caused the change
  (`goHome`, `handleFinished`).
- **Dates are local:** "today" (streak, week strip, daily seed, completion date) is the date on the
  user's clock — always via `src/domain/date.ts` (`localDate`, `localDayNumber`), never
  `toISOString().slice(0, 10)` (that's the UTC date: a 1am workout landed on the wrong day).
- **Taps & layout:** every screen `<main>` and the `Sheet` backdrop use `useTapGuard` (`onClickCapture`): taps
  in the first 400ms after it appears are dropped, because a quick second tap lands on whatever the NEW screen
  put under the finger (Start → Skip, ✕ End → Start, a move → Swap). Keyboard clicks (`detail` 0) pass, so
  `fireEvent.click` in tests is unaffected; pass `{ detail: 1 }` to test as a tap. Nothing in a sheet may
  appear late and push the buttons around (the voice picker is there, disabled, before the voices load).
  Pause/Skip/End also `coach.cancel()` — speech is queued, so the coach otherwise talks on after Pause.
- **Effort level (`generator/effort.ts`):** Done asks "How did that feel?" (Too easy / Just right / Too hard);
  `nextLevel` moves `Prefs.level` one step (−2…+3, relative to the level the workout was made at, so changing
  the answer doesn't add up). The length is fixed, so a higher level = more reps (`Segment.reps`, ±15%/level,
  shown by `formatTarget`) + shorter round/set rests (−5s/level, ≥20s); lower = fewer reps only (longer rests
  would overflow a 30-min stations budget). `Workout.level` lets `swapMove` give a swapped-in move its reps.
- **Resume says where you are (`coach/resumeLine.ts`):** Pause cuts the coach off, so Resume (and picking up a
  saved workout) re-says the move's name + how-to ("Back to it: …") or what the rest/intro announced — only if
  it ends before the segment's next cue.
- **Change sheet:** How long · Equipment · Coach voice up front; "Anything sore?" and "How to repeat" fold
  under a native `<details>` "More options", which opens by itself when one of them is in use (never hidden
  while it shapes the workout).
- **Back button (`ui/useBackButton.ts`):** while a sheet is open or you're off Home, one extra history entry
  catches the phone's Back: a sheet closes; mid-workout it pauses (saving the spot) and goes Home with Resume;
  Done goes Home. Closing a layer with its own button pops the entry, so Back on Home still leaves the app.
  `RafClock` clamps a frame's dt at ≥ 0 (a first frame can be stamped before `start()`; a negative elapsed
  made the checkpoint invalid, so Resume wasn't offered).
- **Leaving the app pauses the workout:** `RafClock` caps each frame at `MAX_FRAME_SEC` (browsers stop
  frames while hidden; one giant tick would fire every remaining cue at once), and the hook pauses on
  `visibilitychange` → hidden. `pause()`/`resume()` emit `statusChanged` so the UI shows Resume. The
  wake lock (`src/pwa/wakeLock.ts`) re-takes itself on return because the browser drops it when hidden.
- **Resume:** the hook saves a `Checkpoint` when each segment starts and **to the second on pause**
  (so leaving the app, which pauses, keeps the exact spot even if the phone then closes the app).
  `Checkpoint.date` is the local day; `getCheckpoint(today)` only offers a same-day workout.
- **Equipment:** the Change sheet's "Everything / Bodyweight only" toggle sets `Prefs.equipment`
  (`ALL_EQUIPMENT` lives in `domain/exercises.ts`). Bodyweight only is guarded for every length and
  style in `generateWorkout.test.ts`, including that every such workout has a Pull — `prone-ytw`
  (Prone Y-T-W Raises) is the one bar-free pull; keep at least one.
- **Saved data is untrusted:** `storage/store.ts` checks every field on load (old app versions, corrupt
  JSON) and falls back to defaults; a checkpoint that doesn't fit the current `Workout` shape is dropped.
  Saves never throw (full / blocked storage). `src/ui/ErrorBoundary.tsx` wraps `App`: a render crash
  shows "Back to home" and clears the checkpoint. When you change `Workout`/`Segment`, update `isSegment`/
  `isCheckpoint` too.
- **Themed warm-ups:** `warmupFlows.ts` `pickWarmupFlow` is the "Mobility Lottery" — avoids recently
  used themes (persisted via `pushRecentTheme`), prefers a flow that preps the day's work, weights
  "fun" flows up. The generator renders the chosen flow right after the intro (segment 1).

## Elli's ideas (Supabase)

The 💡 / "Note an idea" sheet sends ideas to the Supabase project **move-with-elli**
(`idaningbbhqjerlfsmuz`, org `rirktxpvdgwkigmqevzd`), table `public.ideas`
(`body`, `noted_on`, `status`: new/planned/done/declined). **Read them at the start of a session**
with the Supabase MCP: `select id, body, noted_on, status from public.ideas order by id;` — mark
handled ones `planned`/`done`. The app uses the *publishable* key (fine in code) and may only
INSERT those three columns (column grant + RLS insert policy); it can't read anything back, so a
re-send is made harmless by the phone-made `client_id` (unique; a 23505 counts as sent). The CSP
`connect-src` in `vercel.json` allows exactly that one Supabase origin — keep the test in step.

## Workflow

TDD is the established pattern (tests are committed alongside implementation). Pure core
(generator + engine + streak) is where the real coverage is; browser adapters (voice / haptics /
wake-lock) can't be unit-tested — verify those manually in the browser.

Vercel auto-deploys on push to `main` (Git integration); branches/PRs get preview URLs. The Vercel
build runs `npm run lint && npm run test:run && npm run build` (see `vercel.json`; guarded by
`src/deployGate.test.ts`), so lint with zero warnings, the full test suite **and** the `tsc -b`
type-check must pass before a deploy is promoted.

**Dependencies:** Dependabot (`.github/dependabot.yml`) opens grouped minor/patch updates monthly and
one PR per major version; each gets a Vercel preview that runs the gate above. Before merging, run each
branch through `npm ci` + the gate locally, and re-check `main` the same way after merging several
(their lockfile edits are merged as text). `@types/node` majors are ignored: keep it on Vercel's Node
major (24.x). Expected noise: `npm ls --all` reports `lightningcss-linux-x64-musl@1.32.0 invalid` (vite's
nested lightningcss 1.33 skips its musl binary on glibc); vite loads the right 1.33 gnu binary — harmless.
If Dependabot's PR was built on an older `main`, use GitHub's "Update branch" (a merge, no rewrite) so
Vercel re-runs the gate; `@dependabot` commands can't be posted from here (the mention gets escaped). `npm audit` should stay at 0. npm 10.9.4's
`npm audit fix` crashes (`edgesOut` of null, an npm resolver bug) — use `npx npm@11 audit fix`;
the lockfile format is the same.

Design specs and the TDD implementation plans live in `docs/superpowers/`; the roadmap and polish
backlog are in `docs/NEXT-STEPS.md`.

**Session rhythm:** start by reading `plans/TODO.md` (the "resume here" entry); end by writing a
session log in `plans/sessions/YYYY-MM-DD.md` and refreshing `plans/TODO.md`.
**Keep the docs current in the same PR as the change:**
- anything a user would notice → `README.md` "What it does";
- a new rule, gotcha or lesson learned → `CLAUDE.md`;
- what happened → the session log + `plans/TODO.md`.
Don't put counts that go stale (tests, files) in the docs.
