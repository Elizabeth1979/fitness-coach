# Move With Elli — Next Steps

v1 ("The Spine") is complete on `main`: press Start → a rule-based generator builds a
timed full-body workout → a voice coach guides you through it → it celebrates what you
practiced and saves your streak. Offline-capable PWA. 47 tests, clean strict build.

## Run it locally

```bash
npm install
npm run dev      # open the printed http://localhost:5173/ URL
```

- Tap **Start** (the screen needs one tap to unlock audio — that's a browser rule).
- Voice uses your device's built-in voices; pick a nicer one with the **Coach voice** control at the bottom of the home screen.
- Haptics buzz on Android; on iPhone you'll hear small tones instead (iOS has no web vibration).

Other commands: `npm run build` (production build + service worker), `npm run test:run` (tests).

## Deploy (Vercel)

The app deploys on **Vercel** via Git integration. One-time setup:

1. Import the repo at [vercel.com/new](https://vercel.com/new) and select `fitness-coach`.
2. Vercel auto-detects Vite. `vercel.json` sets the build to `npm run test:run && npm run build`
   (tests + the `tsc -b` type-check gate the deploy) and the output directory to `dist`.
3. Deploy.

Every push to `main` then auto-builds and deploys; branches and PRs get preview URLs. The base path
is `/` (root) — see `base` in `vite.config.ts` and `scope`/`start_url` in the PWA manifest.

## Before sharing publicly

- **Replace the placeholder app icons** — `public/icons/icon-192.png` and `icon-512.png` are 1×1 placeholders. Drop in real 192×192 and 512×512 art so the installed app looks right.

## Polish backlog (small, non-blocking — found during code review)

- Give the two single-goal mobility moves a second goal; mark `EXERCISES` `readonly`.
- Add a test for `pick()` throwing on an empty array; tighten a couple of test stubs.
- `spreadDrift` could redistribute leftover seconds if a work bout ever clamps (doesn't happen with the current exercises).
- Mid-segment resume: today "Resume" restarts the current exercise from its start (the engine already supports finer resume — just store live elapsed seconds in the checkpoint).
- Consolidate the test-only localStorage shim via a jsdom URL in `vite.config.ts`.

**Visual-redesign follow-ups:**
- Trim the icon font: only the 457 KB `woff2` is precached, but `.woff`/`.ttf` (~3.6 MB) ship in `dist` unused — drop them, or replace the ~15 icons used with inline SVGs (precache is ~900 KB now).
- Tokenize the few remaining inline hexes (`.btn-ghost` `#f3edfa`, WeekView empty-cell) into `:root` variables.
- MoveDetail: trap focus + auto-focus on open (`aria-modal` is already set).
- Home Compact view could show the target inline (it hides it now; Detailed is the default); make the warm-up banner icon theme-appropriate (always a music note today).

## Shipped since v1

- **✓ Rounds — same circuit, repeated** — a workout is now one fixed circuit of ≤6 exercises
  (Push·Pull·Legs·Hinge·Carry-or-Crawl·Mobility) repeated for **2 / 3 / 5 rounds** (10 / 20 / 30 min),
  the *same* exercises every round (repetition builds the movement), with a longer **round-rest**
  between rounds (coach: "Round 1 of 3 complete. Rest up." → "Round 2. Here we go."). Home shows the
  circuit **once** with an "N rounds" badge + "The circuit · repeat N×" header; Active shows a
  "Round R of N" chip, counts "Move m of 6" **within** the round, and has a calm round-rest screen.
  Swapping a move now replaces it in **every** round. Determinism + the 45s time-budget invariant
  preserved (with a guardrail test against future unilateral-exercise additions). On `main`, deployed.
  Design: [docs/superpowers/specs/2026-06-24-rounds-design.md](docs/superpowers/specs/2026-06-24-rounds-design.md) ·
  Plan: [docs/superpowers/plans/2026-06-24-rounds.md](docs/superpowers/plans/2026-06-24-rounds.md).
  **Queued follow-up (next feature):** the **"customize before you start" studio** — swap a move or
  the warm-up by *specific pick* / *by soreness ("my shoulders hurt")* / *feeling-lucky random*,
  before Start, never mid-workout. Needs every exercise tagged with the body areas it loads. (When
  that lands, re-check the 10-min floor budget — the guardrail test in
  `generateWorkout.test.ts` flags it if new unilateral exercises push it past 45s.)

- **✓ Themed warm-ups & the Mobility Lottery** — the single daily warm-up is now a named,
  never-repeating themed *flow* (Hip / Shoulder / Animal / Dance — including a 2-minute
  free-dance), chosen to prep the day's work and announced by the coach ("Today's warm-up:
  Dance Flow"). On `main`. **Still a follow-up:** the optional bigger change — make
  Push/Pull/Legs/Hinge the non-negotiables and rotate Warm-up/Mobility/Crawl/Carry/Balance.
  Design + code-mapping: [docs/superpowers/specs/2026-06-24-themed-warmups-and-rotation-design.md](docs/superpowers/specs/2026-06-24-themed-warmups-and-rotation-design.md).

- **✓ Visual redesign — "see the program"** — a warm, card-based UI that *shows* today's generated
  workout (full targets + a Compact/Detailed toggle), tap-a-move detail + per-move swap, a re-roll,
  an Active screen with progress + timer ring + next-up, and a Finish screen with capability chips +
  a week strip. Generate-on-Home: the workout is generated when Home opens so it can be shown; Start
  runs that exact one. On `main`, deployed.
  Design: [docs/superpowers/specs/2026-06-24-visual-redesign-design.md](docs/superpowers/specs/2026-06-24-visual-redesign-design.md).

## Future phases (from the design spec, §17)

- **Phase 2 — accounts & sync:** Supabase auth + cloud workout history.
- **Phase 3 — native:** React Native / Expo, Apple Health / Google Fit, wearables.
- **AI:** an LLM that adapts workouts and handles "I slept badly" / "I'm stressed" conversations (the generator already sits behind a clean interface to swap in).
- **Gamification & progress:** skill-unlock badges (first pull-up, 60-second hang…), per-exercise logging, charts.

See `docs/superpowers/specs/2026-06-24-move-with-elli-design.md` for the full design and
`docs/superpowers/plans/2026-06-24-move-with-elli-the-spine.md` for the build plan.
