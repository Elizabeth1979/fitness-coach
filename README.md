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
  - **One 15-second screen between moves** ("Rest · Next up") — it starts with
    *"Rest. Next up: Bulgarian Split Squat. Back foot elevated, sink straight down."* and ends with a
    real one-per-second *"three… two… one… Go!"* (why 15 s: see "The research behind it").
  - **Counted moves are a goal, not a test** — the screen says *"Up to 8 reps"* and the coach
    *"as many as you can, up to 8"*. The numbers grow as you level up.
  - **The core finisher is announced before it starts** — *"Circuit done! Now a short core finisher.
    Next up: Plank…"*.
  - **"Next up" during every exercise** — about 10 seconds before it ends the coach names the
    next move (*"Next up: Plank."*), so you're never surprised.
  - **"Three, two, one" at the end of every exercise**, so you know it's almost done.
  - **"Switch sides"** — one-sided moves get a 10-second gap between left and right. In the
    warm-up, moves done one side at a time or in circles (leg swings, hip circles…) hear
    *"Switch sides."* or *"Now the other way."* halfway.
  - **Encouragement in every exercise** — warm, royal, hype or silly (*"Somewhere, a sloth
    is jealous."*), never the same line twice until you've heard them all.
  - A capability summary at the end (*"Today you practiced push, pull, hinge…"*).
- **The screen** shows the move, which side you're on, a big timer ring that empties as the time
  passes, how to do the move, and what's next. Every move's time is a round number (25, 30, 35
  seconds…). A bottom sheet holds the page behind it still. Colour means "do this": green for Start and the running timer; everything else
  is high-contrast black, white and grey, in Lexend — a font designed for easy reading.
- **Themed warm-ups & the Mobility Lottery** — never the same warm-up two days running
  (Hip / Shoulder / Animal / Dance — including a 2-minute free-dance).
- **Anything sore?** Pick shoulders, back or legs and the day works around it.
- **"How did that feel?"** after each workout — *too easy / just right / too hard* — nudges the
  next ones: more or fewer reps, and shorter rests as you get stronger. Same length every time.
- Optional **background beats**, haptic buzzes, and the screen stays awake so you can prop the
  phone up and just move.
- **Back · Pause · Skip · End** — **Back** goes to the start of the move before (missed one? do it
  again). **End** never loses your workout: Home offers **Resume where you stopped** for the rest of
  the day.
- **Resume where you stopped** — Pause, End, leaving the app or the phone's Back button all keep your
  spot, and the coach re-says what you were doing when you carry on. Keep a **streak**, and it works
  **offline** (installable PWA). The installed app picks up new versions by itself when you return
  to it — never mid-workout.
- **Dark mode** follows your phone's setting.
- **Note an idea for the app** — the 💡 on the workout screen (it pauses first), or the link on
  Home and after a workout. **Send idea** puts it straight into a private ideas database that
  Claude reads when planning the next update; offline, it waits on the phone and sends itself later.
  Every idea, in Elli's words and with where it stands, is listed in [`plans/IDEAS.md`](plans/IDEAS.md).

The coach is calm and encouraging — never military, never shaming, and there's not a
calorie count in sight.

## The research behind it

Move With Elli is a **circuit**: one move each for push, pull, legs, hinge, carry/crawl and
mobility, repeated for a few rounds. Its rhythm follows published guidance on circuit training:

- **Short rests work because the muscles take turns.** Each move uses different muscles, so the
  next ones are already rested. The break between moves is mainly for catching your breath and
  getting into position, not for muscle recovery.
- **15–30 seconds between moves is the usual circuit guidance.** A review of circuit weight
  training gives moderate loads and 15–30 s between stations, with the circuit repeated one to
  three times ([Kravitz, UNM](https://www.unm.edu/~lkravitz/Article%20folder/circuits.html)). The
  NSCA calls rests of about 30 s typical for circuit-style training for people newer to strength
  work, and longer rests (2–5 min) a later step for heavy strength training
  ([NSCA](https://www.nsca.com/contentassets/fb8a7be6eb174934bb8844703c4de4cc/ptq-10.1.3-how-to-manipulate-rest-intervals-to-maixmize-strength-training-effectiveness.pdf)).
- **10 seconds is the high-intensity (HIIT) end.** ACSM's 7-Minute Workout uses 30 s of hard
  bodyweight work with 10 s of rest ([ACSM](https://www.acsm.org/blog-detail/acsm-certified-blog/2019/09/19/7-minute-workout-download)).
  That suits all-bodyweight moves with nothing to pick up.
- **Longer rests (30–60 s or more) are for heavier strength sets**
  ([Brookbush Institute](https://brookbushinstitute.com/courses/acute-variables-circuit-training)),
  which isn't the goal here.

**How the app uses it:** the gap between moves is a single **15 s** screen, the low end of the
circuit range (it used to be about 20 s: a 15 s rest plus a 5 s "get ready"). That still leaves
time to hear what's next, get to the bar or the weights, and a clean "three, two, one, Go!". The
workout length stays the same, so shorter rests mean more of it is spent moving. Between rounds,
a short round break comes first (20–25 s, shorter as you level up), so the time between rounds is
what it was.

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
- [`plans/IDEAS.md`](plans/IDEAS.md) — every idea sent from the app's 💡, in Elli's words, with its status.
- [`plans/TODO.md`](plans/TODO.md) — what's next (start here), plus a log of each session in [`plans/sessions/`](plans/sessions/).
- Design specs and implementation plans live in [`docs/superpowers/`](docs/superpowers/).
- [Next steps & roadmap](docs/NEXT-STEPS.md) — how to deploy, the polish backlog, and future phases (accounts/sync, native app, adaptive AI coach, gamification).

---

*Built with [Claude Code](https://claude.com/claude-code).*
