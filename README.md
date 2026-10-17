# Move With Elli

**Press Play. Don't Think. Move.**

A voice-first movement coach as a Progressive Web App. One tap and a calm coach talks you
through a full-body workout — no deciding what to do, how many reps, or how long to rest.
Built for people (especially ADHD / novelty-sensitive movers) who love movement but stall
on the planning. It's about becoming **more capable every year** — strength, mobility,
balance, skill — not calories or body weight.

> 🟢 **Live app:** https://fitness-coach-peach.vercel.app/
>
> The old address (`elizabeth1979.github.io/fitness-coach`) now forwards here.

## What it does

- **One screen, one button.** Home shows today's workout as a plain numbered list and a big
  green **Start workout** button that's always visible. **New** next to the warm-up or the moves
  deals a fresh set. Everything else sits behind **Change workout**: length (10 / 20 / 30 min),
  equipment (everything / bodyweight only) and the coach's voice, with "anything sore?" and
  circuit-or-stations folded under **More options**.
- **A rule-based generator** builds a full-body workout (warm-up → Push → Pull → Legs → Hinge
  → Carry/Crawl → Mobility → core finisher → celebration) sized to the minute. Tap any move
  to read how to do it or **swap** it for another of the same kind.
- **A voice coach guides every second:**
  - **A short spoken intro** before the clock starts — what's waiting today and what comes
    first — then *"Get ready… three, two, one"*. The screen shows the time left.
  - **Time to get there** — about 20 seconds between exercises. The rest starts with
    *"Rest. Take a deep breath. Next up: Bulgarian Split Squat. Back foot elevated, sink straight down."*, then
    *"Get ready."* and a real one-per-second *"three… two… one… Go!"*
  - **"Three, two, one" at the end of every exercise**, so you know it's almost done.
  - **"Switch sides"** — one-sided moves get a 10-second gap between left and right.
  - **Encouragement in every exercise** — warm, royal, hype or silly (*"Somewhere, a sloth
    is jealous."*), never the same line twice until you've heard them all.
  - A capability summary at the end (*"Today you practiced push, pull, hinge…"*).
- **The screen** shows the move, which side you're on, a big timer, how to do the move, and
  what's next. Colour means "do this": green for Start and the running timer; everything else
  is high-contrast black, white and grey, in Lexend — a font designed for easy reading.
- **Themed warm-ups & the Mobility Lottery** — never the same warm-up two days running
  (Hip / Shoulder / Animal / Dance — including a 2-minute free-dance).
- **Anything sore?** Pick shoulders, back or legs and the day works around it.
- **"How did that feel?"** after each workout — *too easy / just right / too hard* — nudges the
  next ones: more or fewer reps, and shorter rests as you get stronger. Same length every time.
- Optional **background beats**, haptic buzzes, and the screen stays awake so you can prop the
  phone up and just move.
- **Resume where you stopped** — Pause, leaving the app or the phone's Back button all keep your
  spot, and the coach re-says what you were doing when you carry on. Keep a **streak**, and it works
  **offline** (installable PWA). The installed app picks up new versions by itself when you return
  to it — never mid-workout.
- **Dark mode** follows your phone's setting.
- **Note an idea for the app** — the 💡 on the workout screen (it pauses first), or the link on
  Home and after a workout. **Send idea** puts it straight into a private ideas database that
  Claude reads when planning the next update; offline, it waits on the phone and sends itself later.

The coach is calm and encouraging — never military, never shaming, and there's not a
calorie count in sight.

### Add your own encouragement

The coach's encouragement lines live in [`src/coach/encouragements.json`](src/coach/encouragements.json).
Add a line in quotes (with a comma between lines). Keep each one to 8 words or fewer so it
finishes before the closing countdown; the tests reject anything about calories, weight,
"burn" or guilt.

### Getting the latest version on your phone

Open https://fitness-coach-peach.vercel.app/ in your browser and add it to your home screen
(Share → Add to Home Screen). After that it updates itself. If you installed it from the old
GitHub address, delete that icon and add it again from the Vercel address.

## Run it locally

```bash
npm install
npm run dev        # open the printed http://localhost:5173/ URL
```

`npm run lint` checks the code (warnings fail the deploy); `npm run test:run` runs the test suite; `npm run build` makes the production
build + service worker and runs the TypeScript type-check.

## Tech

React · Vite · TypeScript (strict) · Tailwind v4 · `vite-plugin-pwa` (Workbox) · Vitest.
Browser platform: Web Speech (voice), Vibration (haptics), Screen Wake Lock, Web Audio
(background beats, fallback cues), `localStorage` (history/streak/prefs). Deploys to Vercel on
every push to `main` (the build runs the test suite + `tsc -b` type-check before promoting).

## Architecture

A **functional core / imperative shell**: the workout generator and the clock-driven engine
are pure and fully unit-tested with a fake clock (no browser needed), while the voice,
haptics, wake lock, storage and app updates live in thin, swappable adapters. Every spoken cue
is scheduled up front, and a test checks that no line ever runs into the next one. All the
look-and-feel — colours, type, borders, shapes — is defined once in
[`src/index.css`](src/index.css).

## Docs

- [`CLAUDE.md`](CLAUDE.md) — how the code fits together and the rules it follows.
- Design specs and implementation plans live in [`docs/superpowers/`](docs/superpowers/).
- [Next steps & roadmap](docs/NEXT-STEPS.md) — how to deploy, the polish backlog, and future phases (accounts/sync, native app, adaptive AI coach, gamification).

---

*Built with [Claude Code](https://claude.com/claude-code).*
