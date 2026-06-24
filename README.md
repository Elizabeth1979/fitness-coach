# Move With Elli

**Press Play. Don't Think. Move.**

A voice-first movement coach as a Progressive Web App. One tap and a calm coach talks you
through a full-body workout — no deciding what to do, how many reps, or how long to rest.
Built for people (especially ADHD / novelty-sensitive movers) who love movement but stall
on the planning. It's about becoming **more capable every year** — strength, mobility,
balance, skill — not calories or body weight.

> 🟢 **Live app:** https://elizabeth1979.github.io/fitness-coach/

## What it does

- **Press Start →** a rule-based generator builds a full-body workout (warm-up → Push →
  Pull → Legs → Hinge → Carry/Crawl → Mobility → celebration) sized to 10 / 20 / 30 minutes.
- **A voice coach guides every second** — exercise names, gentle counts, "Rest", "Next
  exercise", encouragement, and a capability summary at the end ("Today you practiced
  push, pull, hinge, carry, mobility").
- **Themed warm-ups & the Mobility Lottery** — never the same warm-up two days running;
  the coach announces a flow chosen to prep the day's work: *"Today's warm-up: Dance Flow."*
  (Hip / Shoulder / Animal / Dance — including a 2-minute free-dance.)
- **Pick your coach's voice**, get haptic buzzes (or audio cues on iPhone), and the screen
  stays awake during a workout so you can prop the phone up and just move.
- **Resume after a refresh**, keep a **streak**, and it all works **offline** (installable PWA).

The coach is calm and encouraging — never military, never shaming, and there's not a
calorie count in sight.

## Run it locally

```bash
npm install
npm run dev        # open the printed http://localhost:5173/fitness-coach/ URL
```

`npm run test:run` runs the test suite (56 tests); `npm run build` makes the production
build + service worker.

## Tech

React · Vite · TypeScript (strict) · Tailwind v4 · `vite-plugin-pwa` (Workbox) · Vitest.
Browser platform: Web Speech (voice), Vibration (haptics), Screen Wake Lock, Web Audio
(fallback cues), `localStorage` (history/streak/prefs). Deploys to GitHub Pages via Actions
on every push to `main`.

## Architecture

A **functional core / imperative shell**: the workout generator and the clock-driven engine
are pure and fully unit-tested with a fake clock (no browser needed), while the voice,
haptics, wake lock, and storage live in thin, swappable adapters. New ideas (like the themed
warm-ups) slot in behind the existing interfaces without touching the core.

## Docs

- Design specs and implementation plans live in [`docs/superpowers/`](docs/superpowers/).
- [Next steps & roadmap](docs/NEXT-STEPS.md) — how to deploy, the polish backlog, and future phases (accounts/sync, native app, adaptive AI coach, gamification).

---

*Built with [Claude Code](https://claude.com/claude-code).*
