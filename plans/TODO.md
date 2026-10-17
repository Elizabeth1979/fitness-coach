# TODO — Move With Elli (workspace memory)

## ▶ RESUME HERE (last session: 2026-10-17)

Live on https://fitness-coach-peach.vercel.app/. **Everything is merged; no open PRs.** `gh-pages` is a redirect, so keep it.
The 2026-10-17 PRs (details in [`sessions/2026-10-17.md`](sessions/2026-10-17.md)):
- #25 spoken intro + the time-left clock
- #26 double-taps / Pause silences the coach / warm-up behind the sheet
- #27 phone Back button stays in the app
- #28 "How did that feel?" levels, Resume re-says, dark mode, "More options"
- #29 tidy-up + offline check
- #30 README / CLAUDE.md learnings

**Next: no new features until Elli has done 3–4 real workouts on her phone.** Then work from her notes.
Ask her: is the intro the right length (~25s)?

**Elli only:**
1. On the phone, lock the screen mid-workout. It should come back paused, and the screen should stay on after Resume.
2. Turn on Dependabot alerts + security updates at https://github.com/elizabeth1979/fitness-coach/settings/security_analysis
3. Airplane mode → open the installed app → run a workout (the browser check passed).

### Next — from the 2026-10-16 review plan (see the session log's "Evening" section)
- [x] Security headers in `vercel.json` (CSP, nosniff, Referrer-Policy, COOP, Permissions-Policy) — merged, PR #14.
- [x] `npm audit fix` (0 vulnerabilities), Dependabot (monthly, grouped), `lint` (warnings fail) in the Vercel build — merged, PR #15.
- [ ] Elli: turn on **Dependabot alerts + security updates** in GitHub → Settings → Code security (a repo setting, not a file).
- [x] Resume: same day only, from the exact second. Equipment toggle (Everything / Bodyweight only) — merged, #21.
- [x] Bodyweight pull move: Prone Y-T-W Raises (Elli: yes) — in PR #21.
- [x] Fixed the 11 React lint findings oxlint 1.88 raised (code, not rules) — #23; dev-tools update merged as #22 (replaced #17).
- [x] Read prefs once in `App` (#21/#23).
- [x] Design: inline styles → `index.css` classes (only runtime values stay inline; guarded by a test) — PR #25.
- [x] Intro before the timer (what's waiting + first move + count-in, not counted in the minutes) and a "time left" clock — PR #25.
- [ ] Optional tidy-up: unify near-duplicate spacings the refactor kept exact (row gaps 8/9/10px, Done streak pill 1px tighter than Home's).
- [x] Dark mode (follows the phone) + Change sheet trimmed to 3 up front, the rest under "More options".

**First, check with Elli:** did re-adding the app to her home screen from the Vercel address
show the new design **and the new green play-button icon**? (Old installs from `github.io` now
forward + clear their cache; new versions now arrive on their own when she returns to the app.)
(Decided 2026-10-16: the finish-screen confetti stays green + near-black.)

### Done 2026-10-16 (the whole list)
- [x] **Real app icons** — green "Start" play button; redraw with `python3 design/render_icons.py`.
- [x] **Trim the icon font** — 17 inline SVG icons via `src/ui/Icon.tsx` (1,003 KB → 364 KB offline).
- [x] **Swap with no alternative** — `canSwap()`; no Swap pill/button, sheet says why + "Got it".
- [x] **Tokenize leftover inline colours** — timer ring, rest background, confetti, shadows.
- [x] **Sheet accessibility** — `src/ui/Sheet.tsx`: focus in, Tab trapped, Escape, focus back.

### Next — nothing urgent; ideas live in `docs/NEXT-STEPS.md` (polish backlog + roadmap)

### Standing rules (from Elli)
- Fix bugs / warnings / rough edges and push — **don't ask whether to fix** (memory `always-fix-dont-ask`).
- Colour only for "do this", high contrast, one visible Start (memory `design-preferences`).
