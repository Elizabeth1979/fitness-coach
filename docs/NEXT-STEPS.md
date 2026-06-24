# Move With Elli — Next Steps

v1 ("The Spine") is complete on `main`: press Start → a rule-based generator builds a
timed full-body workout → a voice coach guides you through it → it celebrates what you
practiced and saves your streak. Offline-capable PWA. 47 tests, clean strict build.

## Run it locally

```bash
npm install
npm run dev      # open the printed http://localhost:5173/fitness-coach/ URL
```

- Tap **Start** (the screen needs one tap to unlock audio — that's a browser rule).
- Voice uses your device's built-in voices; pick a nicer one with the **Coach voice** control at the bottom of the home screen.
- Haptics buzz on Android; on iPhone you'll hear small tones instead (iOS has no web vibration).

Other commands: `npm run build` (production build + service worker), `npm run test:run` (tests).

## Deploy to GitHub Pages

The app is wired to deploy automatically. One-time setup:

1. Create a GitHub repo named **`fitness-coach`** (the name matters — the app's base path is `/fitness-coach/`).
2. Push this code:
   ```bash
   git remote add origin https://github.com/<you>/fitness-coach.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Source: GitHub Actions**.

Every push to `main` then runs tests, builds, and deploys to `https://<you>.github.io/fitness-coach/`.
(If you use a different repo name, update `base` in `vite.config.ts` and `scope`/`start_url` in the PWA manifest.)

## Before sharing publicly

- **Replace the placeholder app icons** — `public/icons/icon-192.png` and `icon-512.png` are 1×1 placeholders. Drop in real 192×192 and 512×512 art so the installed app looks right.

## Polish backlog (small, non-blocking — found during code review)

- Give the two single-goal mobility moves a second goal; mark `EXERCISES` `readonly`.
- Add a test for `pick()` throwing on an empty array; tighten a couple of test stubs.
- `spreadDrift` could redistribute leftover seconds if a work bout ever clamps (doesn't happen with the current exercises).
- Mid-segment resume: today "Resume" restarts the current exercise from its start (the engine already supports finer resume — just store live elapsed seconds in the checkpoint).
- Consolidate the test-only localStorage shim via a jsdom URL in `vite.config.ts`.

## Next feature (designed, ready to build)

- **Themed warm-ups & the Mobility Lottery** — replace the single daily warm-up with a
  named, never-repeating themed *flow* (Hip Flow, Shoulder Flow, Animal Flow, Dance Flow —
  including a 2-minute free-dance), chosen to prep the day's work and announced by the
  coach ("Today's warm-up: Dance Flow"). Optional bigger change: make Push/Pull/Legs/Hinge
  the non-negotiables and rotate Warm-up/Mobility/Crawl/Carry/Balance. Full design +
  code-mapping: [docs/superpowers/specs/2026-06-24-themed-warmups-and-rotation-design.md](docs/superpowers/specs/2026-06-24-themed-warmups-and-rotation-design.md).

## Future phases (from the design spec, §17)

- **Phase 2 — accounts & sync:** Supabase auth + cloud workout history.
- **Phase 3 — native:** React Native / Expo, Apple Health / Google Fit, wearables.
- **AI:** an LLM that adapts workouts and handles "I slept badly" / "I'm stressed" conversations (the generator already sits behind a clean interface to swap in).
- **Gamification & progress:** skill-unlock badges (first pull-up, 60-second hang…), per-exercise logging, charts.

See `docs/superpowers/specs/2026-06-24-move-with-elli-design.md` for the full design and
`docs/superpowers/plans/2026-06-24-move-with-elli-the-spine.md` for the build plan.
