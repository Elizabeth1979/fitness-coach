# Move With Elli — Design Spec

- **Date:** 2026-06-24
- **Status:** Approved (v1 scope = "The Spine")
- **Owner:** Elli

## 1. Vision & Philosophy

A voice-first movement coach that removes all cognitive load from exercising.
**"Press Play. Don't Think. Move."**

Focused on building muscle for longevity, mobility, balance, movement skill, stress
reduction, and enjoyment — and on helping ADHD adults start without decision fatigue.
This is **not** bodybuilding, CrossFit, or calorie burning. The coach is calm,
encouraging, and friendly — never military, never shaming.

## 2. v1 Scope — "The Spine"

The thinnest end-to-end slice that delivers the whole promise: open app → press Start →
get voice-guided through a generated full-body workout → finish with a capability
summary → streak saved. One workout engine, parameterized by duration.

**In scope**

- Home screen: one large **Start**, a 10/20/30-minute selector, a one-line "today's focus", a subtle streak.
- Rule-based **generator** producing a full-body workout per the PRD template.
- Voice-guided **engine**: warmup → Push → Pull → Leg → Hinge → Carry/Crawl → Mobility → (optional Core/Balance) → celebration.
- Browser **SpeechSynthesis** coach behind a `Coach` interface; user picks the device voice.
- **Haptics** where supported + **audio-earcon** fallback (iOS).
- **Screen Wake Lock** during workouts.
- **localStorage**: completion history, streak, prefs (voice, equipment).
- **PWA**: installable, offline-capable, GitHub Pages deploy.
- **Accessibility** baked in (voice-first, large type, high contrast, screen-reader labels, one-handed).

**Out of scope (explicit YAGNI — future phases)**

- Real AI/LLM exercise selection and "I slept badly" conversations.
- Gamification badges / skill-unlock system.
- Per-exercise weight/rep logging and progress charts.
- Ducking *other* apps' audio (Spotify/podcast) — not possible from a PWA.
- Supabase / accounts / cloud sync (Phase 2).
- Native app / Apple Health / wearables (Phase 3).
- "Free Mode" as a distinct feature — the generator **is** the free-mode engine.

## 3. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Platform | Broad PWA + graceful degradation | User picked "web progressive app"; feature-detect haptics. |
| Voice | Browser `SpeechSynthesis` behind `Coach.speak()` | Free, offline, dynamic text; cloud TTS is a future drop-in. |
| Generation | Deterministic rule-based (seeded) | Offline, instant, predictable; matches PRD's explicit rules. |
| Engine timing | Wake-Lock + clock-driven state machine | Survives screen-lock timer throttling; reliable, small. |
| Equipment | All available by default, each exercise tagged | User has full kit; toggling later just filters. |
| Stack | React + Vite + TypeScript + Tailwind | Per PRD Phase 1. |
| PWA/tests | `vite-plugin-pwa` (Workbox) + Vitest + Testing Library | Offline shell + testable pure core. |

## 4. Architecture — functional core / imperative shell

The testable brain (generator + engine) never touches browser APIs. The messy edges
(voice, vibration, screen, storage) are thin, swappable adapters.

```
UI (React)  →  Engine + Coach + Feedback  →  Domain (exercises, generator)
  impure            adapters / edges               pure, no dependencies
```

| Module | Single purpose | Depends on |
|---|---|---|
| `domain/` | Exercise library + core types (pure data) | nothing |
| `generator/` | `generateWorkout()` — rules → segment list (pure fn) | domain |
| `engine/` | `WorkoutSession` state machine + `Clock` (pure logic) | domain |
| `coach/` | `Coach.speak()` over SpeechSynthesis + phrase script | — |
| `feedback/` | `vibrate()` + audio-earcon fallback | — |
| `storage/` | localStorage history, streak, prefs (typed + versioned) | domain |
| `ui/` | Minimal large-type screens + `useWorkoutSession` hook | all edges |

Dependency arrows point one way: UI → edges → domain. Domain/generator are pure and
unit-testable with a fake clock and no browser.

## 5. Data Model

```ts
type Category   = 'warmup'|'push'|'pull'|'legs'|'hinge'|'carry'|'crawl'|'core'|'balance'|'mobility';
type Equipment  = 'bodyweight'|'pullup_bar'|'weights'|'blocks_bands';
type Goal       = 'strength'|'mobility'|'balance'|'coordination'|'skill'|'fun';
type HapticKind = 'start'|'rest'|'next'|'countdown';

interface Exercise {
  id: string;
  name: string;             // "Farmer Carry"
  category: Category;
  equipment: Equipment[];   // every item must be available to be picked
  goals: Goal[];            // ideally >= 2
  unilateral: boolean;      // Cossack, Suitcase, Bulgarian → run both sides
  measure: 'time' | 'reps';
  cue: string;              // what the coach says to describe it
  defaultDurationSec?: number;
  defaultReps?: number;
}

interface Cue { atSec: number; say?: string; haptic?: HapticKind; }

interface Segment {
  kind: 'prepare' | 'work' | 'rest' | 'celebrate';
  exercise?: Exercise;
  side?: 'left' | 'right';
  durationSec: number;
  cues: Cue[];              // pre-scheduled within the segment
}

interface Workout {
  id: string;
  kind: '10min' | '20min' | '30min' | 'free';
  focus: 'strength' | 'movement';   // from the weekday schedule
  segments: Segment[];
}
```

Each `Segment` carries its own pre-scheduled `cues`. The engine just plays segments and
fires their cues; it knows nothing about exercises or coaching. One-way boundary.

## 6. Workout Generator (rules)

**Inputs:** `{ kind: 10|20|30|free, date → weekday focus, equipment[], history (anti-repeat), seed }`

**Rules**

- Every workout: 1 warmup, then **1 Push, 1 Pull, 1 Leg, 1 Hinge, 1 Carry-or-Crawl, 1 Mobility**; optional Core/Balance if time remains.
- **Weekday focus** (PRD weekly structure): Sun/Tue/Thu = Strength · Mon = Movement · Wed = Movement/HIIT · Fri = Movement Play · Sat = Rest (suggest light mobility). Focus biases selection and work/rest emphasis (strength → longer holds / loaded / lower reps; movement → flow, crawls, skill).
- **Equipment filter:** only pick exercises whose `equipment ⊆ available`.
- **Goal preference:** favor exercises serving ≥ 2 goals.
- **Anti-repeat:** avoid exercises used in the last N sessions when alternatives exist.
- **Unilateral:** emit two work segments (left/right) with a short switch cue.
- **Time budgeting:** warmup ≈ 10–15%, celebration ≈ 20s; each slot = work + rest; fill remainder with optional core/balance or extra mobility so the total ≈ target.
- **Output:** a `Workout` of fully-scheduled `Segment`s with per-segment cues (name at start, encouragement mid-set, 5s countdown, "rest"/"next exercise" transitions).

## 7. Engine (state machine)

States: `idle → preparing → working → resting → … → celebrating → done`, with `paused` overlaid.

- Each tick: decrement current segment's remaining time; fire any cues whose `atSec` just elapsed (exactly once, via a cursor); advance at segment end; emit events.
- Supports pause / resume / skip / end.
- Checkpoints `(workoutId, index, elapsed)` to localStorage → offers **"Resume?"** after an accidental refresh.
- Runs against a `Clock` interface: real `requestAnimationFrame` in app, `FakeClock` in tests.

## 8. Coach (voice) + Phrasing

- **Voice selection:** enumerate `speechSynthesis.getVoices()`, prefer high-quality local voices, let the user choose, persist the `voiceURI`.
- **iOS unlock:** first user tap fires a priming utterance to unlock audio.
- **Queueing:** serialize utterances; cancel on skip/end.
- **Calm tuning:** modest rate/pitch.
- **Phrase script** centralizes personality. Good: "Welcome back, Elli." · "Today's focus is strength and mobility." · "Three… two… one… begin." · "Rest." · "Next exercise." · "Great job. You're getting stronger." Banned: drill-sergeant, guilt, calorie/weight talk.

## 9. Feedback (haptics + audio reality)

- **Haptic patterns:** exercise start = 1 buzz · rest = 2 buzzes · new exercise = 3 buzzes · 5s-left = short ticks.
- `navigator.vibrate` feature-detected; iOS → **audio earcons** (distinct tones via a tiny Web Audio generator).
- **Audio ducking honesty:** a PWA cannot lower other apps' volume (Spotify/podcast) — native-only. On iOS the system *sometimes* ducks background audio during speech, but we won't depend on it. v1 relies on clear spoken cues; an app-owned ambient track we *can* duck is a future option.

## 10. UI / Screens

- **Home:** huge Start button; 10/20/30 selector; one line "Today: Strength · 20 min"; subtle streak.
- **Active:** giant exercise name; big countdown (ring + mm:ss); faint "next: …"; pause/skip; work/rest color state; current side for unilateral. Almost no chrome.
- **Done:** capability checklist (✓ Push ✓ Pull ✓ Hinge ✓ Carry ✓ Mobility ✓ Balance); streak; calm closing line. Never calories or body weight.
- Large type, high-contrast theme, big touch targets, one-handed reachable controls.

## 11. Accessibility

Voice-first; ARIA live regions announce state for screen readers; semantic buttons;
very large touch targets; `prefers-reduced-motion` respected; high contrast; headphone
friendly; Wake Lock for a propped-up phone; no mandatory gestures (tap only).

## 12. Persistence (localStorage)

```ts
interface Store {
  version: 1;
  completions: { date: string; kind: string; focus: string; exerciseIds: string[]; durationSec: number }[];
  prefs: { voiceURI?: string; equipment: Equipment[] };
  checkpoint?: { workoutId: string; index: number; elapsedSec: number };
}
```

Streak derived on read. Repository module with typed get/set + a migration hook on
version bump.

## 13. PWA / Offline / Deploy

- `vite-plugin-pwa` (Workbox) precaches the app shell + assets; offline-first.
- Manifest: name, icons, theme color, `display: standalone`, `start_url` with the correct GitHub Pages base.
- Wake Lock acquired on workout start, re-acquired on `visibilitychange`, released on end.
- Deploy to GitHub Pages (Actions or `gh-pages`); single-page app so routing is trivial.

## 14. Tech Stack & Tooling

React 18 · Vite · TypeScript (strict) · Tailwind · `vite-plugin-pwa` · Vitest +
`@testing-library/react` · ESLint/Prettier.

## 15. Testing Strategy

- **TDD on the pure core** — generator (rules / equipment / anti-repeat / time budget) and engine (fake clock: transitions, exactly-once cue firing, pause/resume/skip). This is the bulk of the tests.
- **Light component tests** for hook↔engine wiring and key a11y labels.
- **Manual device checklist** for voice / haptics / wake-lock (browser audio can't be unit-tested).

## 16. Milestones (the implementation plan expands these)

1. Scaffold (Vite + TS + Tailwind + PWA + Vitest); app shell; deploy a hello-world to Pages.
2. Domain + exercise library + types.
3. Generator (TDD) — valid workouts across 10/20/30, weekdays, equipment.
4. Engine (TDD) — fake-clock state machine + cue scheduling + checkpoint.
5. Coach + Feedback adapters (voice selection, phrases, haptics/earcons).
6. UI screens + `useWorkoutSession` hook + wake lock + a11y.
7. Persistence + streak + done screen.
8. PWA polish + offline + deploy.

## 17. Future Phases

- **Phase 2:** Supabase (auth, history sync).
- **Phase 3:** Native (React Native / Expo), Apple Health / Google Fit, wearables.
- **AI:** LLM generation + "I slept badly" conversations behind the existing interfaces.
- **Gamification + detailed progress** (skill unlocks, weight/rep logging, charts).
