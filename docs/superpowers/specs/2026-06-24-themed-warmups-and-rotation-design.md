# Themed Warm-Ups & the Mobility Lottery — Feature Design

- **Date:** 2026-06-24
- **Status:** Shipped to `main` (warm-up flows + Mobility Lottery). The optional main-template rotation (see "Optional: rotate the workout template too") remains a separable follow-up.
- **Owner:** Elli

## Why

Boredom is the #1 reason people stop. Elli is especially novelty-sensitive (dance
background, ADHD, loves movement *exploration*). So the app should **never repeat the
same warm-up two days running**, and warm-ups should feel like a small daily surprise —
a "lottery" — rather than the same Downward Dog every morning.

Second principle: **a warm-up should prepare the body parts you're about to use.** If
shoulders are tired, loading the warm-up with Downward Dog and handstands is wrong —
warm the hips and spine instead.

> The best warm-up is the one you actually look forward to doing.

## The feature in one line

Replace the single generated warm-up exercise with a **named warm-up *flow*** (a short
2–3 minute themed sequence), chosen by a "Mobility Lottery" that avoids recent themes and
prefers a theme that preps the day's work. The coach announces it by name:
*"Today's warm-up: Dance Flow."*

## Warm-up themes (the "flows")

Each theme is a short ordered list of mobility moves (~2–3 min total). Starter set:

### Hip Flow — *good when shoulders are tired*
Hip circles · Leg swings · Deep squat hold · Cossack squat shifts · Marching in place

### Shoulder Flow — *preps push / handstands / pull*
Arm circles · Scapular circles · Cat-cow · Wall slides · Shoulder CARs

### Animal Flow — *preps crawls & floor work*
Bear position hold · Wrist mobility · Hip shifts · Cat-cow · Spinal waves

### Dance Flow — *the very-Elli one*
Step-touch · Salsa basic · Hip rotations · Arm flow · Light bouncing
— **and** a "free dance" variant: *"Put on one song and dance for two minutes."* A single
2-minute free-movement segment with warm, encouraging cues and no prescribed reps. For
Elli this likely raises heart rate, mobility, coordination, mood, and — most importantly —
*adherence* better than any traditional warm-up.

(Future themes are cheap to add: Spine Flow, Balance Flow, Wrist & Ankle Flow, etc.)

## The Mobility Lottery (selection logic)

1. **Never repeat the last theme** (reuse the existing anti-repeat idea — track recent
   warm-up *themes*, not just exercises).
2. **Prefer a theme that preps the day's work.** The workout is generated first, so the
   lottery can look at it: a day heavy on push/handstands/pull → favor **Shoulder Flow**;
   a crawl-heavy day → **Animal Flow**; otherwise weight toward **Hip Flow** / **Dance
   Flow** for variety.
3. **Weight toward novelty/fun** within the allowed set (Dance Flow gets a healthy
   weight — it's the adherence win).
4. Coach announces it: *"Today's warm-up: Hip Flow."* / *"…Dance Flow."* / *"…Animal Flow."*

Later, when the adaptive coach exists ("my shoulders are sore"), that input directly
biases the lottery away from shoulder-loading themes — the hook is already here.

## Optional: rotate the workout template too (bigger change)

Elli's redesign idea — keep some slots **non-negotiable** and let the rest **rotate** so
the brain never feels trapped:

- **Non-negotiables (every workout):** Push · Pull · Legs · Hinge
- **Rotating (not every day):** Warm-up *theme* · Mobility · Crawl · Carry · Balance challenge

This still builds muscle and progresses the headline lifts, while keeping each session
fresh. **Note:** this changes v1's current rule (which always includes Push/Pull/Legs/
Hinge/Carry-or-Crawl/Mobility). It's a deliberate, separable follow-up — ship themed
warm-ups first, then decide whether to loosen the fixed template.

## How it maps onto the current code (so it's buildable)

- **Domain:** add a `WarmupFlow` concept — `{ id, name, theme, preps: Category[], moves: Exercise[] }`.
  Add the new warm-up moves to `src/domain/exercises.ts` (hip circles, leg swings, marching,
  arm/scapular circles, cat-cow, wall slides, shoulder CARs, bear hold, wrist mobility,
  spinal waves, step-touch, salsa basic, hip rotations, arm flow). Define the starter flows.
- **Dance Flow free-dance** = a single `work` segment (≈120s) with `measure: 'time'`, no
  countdown pressure, and calm cues ("Move however feels good — just keep going").
- **Generator (`src/generator`):** add `pickWarmupFlow({ workout, recentThemes, rng })`
  implementing the lottery, then expand the chosen flow's moves into the segment list in
  place of today's single warmup segment. Generate the main workout first so the lottery
  can read it (rule 2).
- **Coach (`src/coach/phrases.ts`):** add `warmupAnnounce(themeName)` →
  *"Today's warm-up: {name}."* (keep the calm, non-military tone).
- **Storage (`src/storage/store.ts`):** track recent warm-up theme ids (like
  `recentExerciseIds`) so the lottery can avoid repeats across days.
- **Tests:** lottery never repeats the last theme; a push/handstand-heavy workout biases
  toward Shoulder Flow; Dance Flow free-dance produces a single calm timed segment;
  determinism preserved (seeded).

## Open questions (decide at build time)

1. **Theme vs. exact moves for anti-repeat:** avoid repeating the whole *theme* day-to-day,
   but is it OK to repeat individual moves across themes? (Probably yes — moves are shared.)
2. **Fixed-template loosening:** ship themed warm-ups alone, or also adopt the
   non-negotiable/rotating split in the same pass? (Recommend: warm-ups first.)
3. **Free-dance length & music:** the app can't play your music (and shouldn't try to duck
   it). Free Dance = "press play on your own song, I'll time two minutes and cheer you on."
4. **Equipment:** all starter warm-up moves are bodyweight, so no equipment gating needed.

## Relationship to v1

v1 generates a single warm-up exercise (`warmup` category: Downward-Dog flow, dynamic
stretching, hip openers) with simple anti-repeat. This feature upgrades that one slot into
a named, themed, never-repeating, body-aware flow — the highest-leverage novelty change
for adherence. See the v1 design at
`docs/superpowers/specs/2026-06-24-move-with-elli-design.md`.
