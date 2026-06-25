# Visual Redesign — "See the Program" — Design Spec

- **Date:** 2026-06-24
- **Status:** Approved (visual mockups signed off; build everything)
- **Owner:** Elli

## Goal

Turn the voice-first, intentionally-bare app into one you can **see and read**. Keep the
whole engine (generator, themed warm-ups, clock-driven coaching, voice, resume, streak,
offline PWA, 56 tests) and give it a **warm, card-based visual layer** that *shows* today's
generated workout, where you are during it, and your progress. Aesthetic borrowed from the
`~/Downloads/move-with-elli-pwa` reference: warm off-white background, deep-purple accent
(`#5b2a86`), white rounded cards with soft shadows, clean system font.

Driving problem: today the program only exists as the coach's voice — the exercise library,
the generated session, the warm-up theme, and progress are all invisible. This redesign
makes them visible.

## What stays unchanged

The pure core and adapters are **not** rebuilt — this is a UI-layer change:
`domain`, `generator` (extended, not replaced), `engine`, `coach`, `feedback`, `storage`,
`pwa`, the PWA/offline setup, the deploy workflow, and all existing tests. Determinism,
the `completed`-record semantics, and the per-workout state reset are preserved.

## Visual design system (replaces the dark theme)

Replace the dark `index.css` theme with a warm light theme. Define tokens (CSS variables in
`index.css`, consumed via inline styles / Tailwind utilities):

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f1fb` | page background (warm lavender-white) |
| `--surface` | `#ffffff` | cards |
| `--surface-border` | `#ece4f5` | card borders |
| `--surface-shadow` | `0 6px 22px rgba(91,42,134,.08)` | soft card shadow |
| `--accent` | `#5b2a86` | primary purple (buttons, active states) |
| `--accent-soft` | `#efe7fb` | light purple chips/fills |
| `--accent-ink` | `#42206a` | text on light purple |
| `--text` | `#1f1430` | primary text |
| `--text-muted` | `#6f6588` | secondary text |
| `--text-hint` | `#9a78b5` | tertiary/labels |
| `--success` / `--success-soft` | `#2f9e6f` / `#e6f4ec` | completion checks |
| `--warm` / `--warm-soft` | `#9a5a12` / `#fbe7d4` | streak chip |

Conventions: system font stack; rounded cards (16–20px radius); pills for chips; **reps use
a repeat icon, time-holds use a clock icon**; full words everywhere (no "Mobil.", no "×6 ea");
respect `prefers-reduced-motion` (already in `index.css`); maintain WCAG-AA contrast in light
mode (the active-screen `aria-live` and large targets remain).

## Key architectural change: generate-on-home + preview

Today `generateWorkout` runs the instant Start is pressed, so there's nothing to show first.
New flow:

1. **Home generates a preview** for the selected length on open and whenever the length
   changes — the same `generateWorkout` call, just earlier — and renders its segments as the
   visible list. A `seed` is held in App state so the preview is stable across re-renders.
2. **Start runs that exact previewed workout** (it is passed into the session unchanged), and
   records the theme — no second generation.
3. **Re-roll** ("different mix") bumps the held `seed` and regenerates the preview. The
   first preview of the day stays deterministic (seed = day number); re-roll varies it.
4. **Swap one move**: from a move's detail sheet, replace just that exercise with another from
   the same category (equipment-valid, different from current), **reusing the segment's
   duration** so the total is unaffected. Implemented as a pure generator helper
   `swapMove(workout, segmentIndex, rng)` returning a new `Workout`.

Generator additions (pure, tested): `swapMove(...)`; re-roll needs no new generator code (just
a new seed). `formatTarget(segment)` and the segments→moves derivation live in the UI layer
(`src/ui/format.ts`), pure and tested.

## Screens

### Home
- Header: greeting ("Good morning, Elli"), app name, **streak chip** (`🔥 N-day streak` via flame icon).
- **Today card**: "Today · {Strength|Movement}" + a **length pill** ("20 minutes"); a
  **Compact / Detailed** view toggle; a **warm-up theme banner** ("Dance Flow · 2 minutes");
  then the **move list** — one row per main slot with the exercise name, a category pill
  (full word), and the **target** (`8 reps` / `30 seconds` / `6 reps each side`) with the
  right icon; each row has a `›` opening the move detail. A footer line: "About 20 minutes ·
  short rests between moves." *Compact* collapses rows to names only; *Detailed* shows targets.
- **Length selector**: 10 / 20 / 30 minutes (full word); changing it regenerates the preview.
- **Re-roll**: a subtle "Different mix" action (refresh icon) that re-seeds the preview.
- **Start workout** (primary purple button) → runs the previewed workout.
- **Coach voice** row (the existing voice picker, restyled). **Resume** banner shown when a
  checkpoint exists (existing behavior, restyled).

### Move detail (sheet/modal over Home)
Opened by tapping a move row. Shows the exercise name, category, target, the coach's **cue as
how-to text** (we already store `exercise.cue`), and a **"Swap this move"** button (calls
`swapMove`). Closeable. (Implemented as an in-flow overlay per the visualize/host constraints —
no `position: fixed`.)

### Active (during workout)
- **Session progress bar** + "Move N of M" (derived from the workout's exercise segments).
- Current move: category pill, large name, target + a short cue line; a **large circular
  timer ring** (SVG) with the remaining time and "remaining".
- **Next up** card (the upcoming exercise + its category/target).
- Controls: **Pause/Resume** (primary), **Skip** (secondary), **End** (`✕`, subtle).
- **Rest state**: during a `rest` segment the screen shifts to a calm tone and shows "Rest."
  These map onto the existing engine `SessionState` (status, segment, segmentRemainingSec) +
  a derived next-segment + progress.

### Finish
- Celebratory check + "Great job, Elli" + a calm line.
- **Summary card**: duration, move count, streak chip; **capability checklist** — the
  practiced categories as check chips (Push/Pull/Legs/Hinge/Carry/Mobility).
- **This week**: a 7-day Mon–Sun row, days completed filled with a check, today highlighted —
  from a pure `weekView(completions, today)` helper over stored completions.
- **Done** → Home.

## New / changed files (indicative)

- `src/index.css` — light theme + tokens.
- `src/ui/format.ts` (new, pure, tested): `formatTarget(segment)`, `sessionMoves(workout)`
  (segments→displayable moves, for the Home list + Active progress/next-up).
- `src/storage/week.ts` (new, pure, tested): `weekView(completionDates, today)` → 7 day cells.
- `src/generator/swapMove.ts` (new, pure, tested): targeted one-move swap.
- `src/ui/` components (new/restyled): `HomeScreen`, `WorkoutPreview` + `MoveRow`,
  `MoveDetail`, `ActiveScreen` + `TimerRing` + `NextUp`, `DoneScreen` + `CapabilityChips` +
  `WeekView`, plus the restyled `VoicePicker`.
- `src/App.tsx` — generate-on-home preview state (seed, kind→regenerate, re-roll, swap),
  Start uses the preview, detail-sheet state.

## Accessibility

Light-theme contrast meets AA; keep the active-screen `aria-live` announcement, large touch
targets, semantic buttons, `role` on the length/toggle groups, the timer ring `role="img"`
with a label, and `prefers-reduced-motion`.

## Out of scope (fast-follows, not this build)

- A dedicated **Browse/Library** tab (flip through all exercises + all warm-up themes).
- Progress **charts** / per-exercise history / weights-reps logging.
- A separate minute-by-minute **Timeline** view (the Compact/Detailed toggle covers
  "more ways to view" for now).

## Testing

The engine/generator/voice/storage tests stay green. New **pure** logic is unit-tested:
`formatTarget` (reps / seconds / each-side / minutes), `sessionMoves` (segments→moves +
progress + next), `weekView` (week boundaries, done/today/empty), `swapMove` (same category,
different id, equipment-valid, duration reused, determinism). Components are verified by
`npm run build` (strict `tsc -b`) and manual check in the browser. The "verify with
`npm run build`, not just vitest" rule from CLAUDE.md applies.
