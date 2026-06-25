# Rounds — Same Circuit, Repeated — Design Spec

- **Date:** 2026-06-24
- **Status:** Approved (model + counts + UI decided; research-backed)
- **Owner:** Elli

## Goal

Make the workout a real **circuit repeated for N rounds**: one fixed set of exercises you cycle
through, the **same exercises every round** (repetition builds the movement — Elli's call), with
the rounds **visible** on Home and **announced + shown** during the workout. This replaces today's
"different exercises each round, flat list" behavior (which the research found is the rare
exception — Down Dog HIIT — vs. the near-universal "repeat the circuit" model of Freeletics, BBG,
Centr 6, CrossFit).

## What this is NOT (separate next feature)

The **"customize before you start" studio** — swap a move/warm-up by *specific pick* / *by soreness*
/ *feeling-lucky*, and the "what's sore today?" adaptation — is a **separate follow-up** with its
own design pass (it needs every exercise tagged with the body areas it loads). Out of scope here.
This build keeps the existing Home re-roll and the move-detail random swap (adjusted, see below).

## The round model

`warm-up flow (once)` → `circuit (6 main slots)` × **N rounds** → `celebrate`.

- The **circuit** = one exercise per slot: Push · Pull · Legs · Hinge · Carry-or-Crawl · Mobility
  (selected once). The **same six** repeat every round.
- **Rounds:** `10min → 2`, `20min → 3`, `30min → 5`, `free → 3`.
- **Between exercises:** a short rest (~15–20s).
- **Between rounds:** a distinct, **longer round-rest** (~35–45s) on its own screen, with a spoken
  cue — *"Round one complete. Rest up — round two coming."* + a countdown into the next round.
- **No in-workout editing.** Everything is decided before Start (Home); the Active screen stays
  pause / skip / end only.

## Engine / data-model changes

- `Segment` gains `round?: number` (the round a main `prepare`/`work`/short-rest belongs to, 1..N;
  warm-up and celebrate leave it undefined; a round-rest carries the round it *follows*).
- New `SegmentKind` value `'roundrest'` (a longer between-rounds rest; the engine plays it like any
  segment — generic — only the UI treats it specially). No exhaustive `switch` on `SegmentKind`
  exists today, so this is additive and safe.
- `Workout` gains `rounds: number` (the total).
- `phrases.ts` gains round copy: e.g. `roundComplete(r, total)` → *"Round {r} of {total} complete.
  Rest up."* and `roundStart(r)` → *"Round {r}. Here we go."* (calm, no military tone).

## Generator rework (`generateWorkout`)

1. Pick the warm-up flow (once) → warm-up segments (unchanged, fixed length, excluded from drift).
2. Select **one** circuit of 6 exercises (`selectExercises({ includeWarmup: false })`, once).
3. **Size the work bouts once** so the whole session hits target, then **replicate the circuit N
   times** with identical durations:
   - `roundRest = focus === 'strength' ? 45 : 35`; `shortRest = focus === 'strength' ? 20 : 15`.
   - `fixed = warmupTotal + CELEBRATE + (N-1)*roundRest + N*(items*PREPARE + items*shortRest)`.
   - `perRoundWork = (target - fixed) / N`; `spreadDrift(circuitUnits, perRoundWork - baseWork)`.
   - Lay out: warm-up → for r in 1..N { for each item: prepare(round r) → work(s)(round r) →
     short-rest(round r); if r < N: round-rest(after round r) } → celebrate.
   - Total ≈ target (the existing "within 45s of target" test still guards — tune `roundRest`/
     `shortRest`, not the tolerance).
4. `Workout.rounds = N`; tag main segments with `round`.

**Determinism preserved** (seeded). The "every work segment has a start + countdown cue",
"celebrate lists categories", "deterministic", and "focus from weekday" tests still hold; the
"different exercises each round" expectation flips to **same exercises each round** (update those
tests). New tests: N rounds present, same circuit each round, round-rest between rounds, `rounds`
set, segments tagged with `round`.

## Swap behavior change (move-detail sheet)

Because the circuit now repeats, **swapping a move replaces that exercise in *every* round** (it's
the same circuit slot). `swapMove` changes from "bounded to one move's segments" (the redesign's
fix, correct for the old different-each-round model) to **"swap all occurrences of that exercise id**
(work + prepare cues) across the workout." Update its test accordingly (the multi-round-isolation
test inverts: the later round's same exercise SHOULD now also change).

## UI changes

### Home (`WorkoutPreview` / `HomeScreen`)
- Show the **circuit once** — the 6 main moves (round 1), each with its target — under a "The
  circuit · repeat N×" header, **not** the flat N×6 list.
- A **"N rounds"** badge beside the time pill; a footer *"N rounds · a longer rest between each ·
  about X minutes."* Warm-up banner notes *"once at the start."* (No round-style toggle — same
  moves every round is fixed.)
- The existing **re-roll** ("different mix") and **tap-a-move → swap** stay (swap now applies to all
  rounds, per above). Tapping the warm-up to switch it is part of the *next* feature, not here.

### Active (`ActiveScreen`)
- A quiet **"Round R of N"** chip alongside the move. The coach announces rounds (the round-rest
  cue). "Move N of 6" now counts **within the round** (the circuit size), not across the whole
  session.
- A **round-rest** state (`kind === 'roundrest'`): a calm screen showing e.g. *"Round 1 complete"*
  + the countdown, distinct from the short between-exercise "Rest".
- Derive current round + circuit size + move-within-round from the segment `round` tag +
  `workout.rounds` (a small `roundInfo(workout, segmentIndex)` helper in `ui/format.ts`).

### Finish (`DoneScreen`)
- Unchanged, except the summary may read *"N rounds"* (optional). Capability chips/week strip stay.

## Preserve (must not regress)

Resume-from-checkpoint (the checkpoint stores the full workout incl. rounds → resumes fine),
completed-only recording, the per-workout hook reset, themed warm-ups, voice picker, streak, the
warm card UI, offline PWA, and all currently-green tests (with the generator/swap tests updated for
the new model).

## Testing

Pure-core TDD: the generator (N rounds, same circuit, round-rest, tagging, total-within-45s,
determinism), the updated `swapMove` (swaps all occurrences), and the new `roundInfo`/circuit
helpers in `format.ts`. Components verified by `npm run build` (strict) + the existing render tests
(updated for the circuit-once Home and the Round chip). `npm run build` is the gate (per CLAUDE.md).
