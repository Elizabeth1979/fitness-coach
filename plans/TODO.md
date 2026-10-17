# TODO — Move With Elli (workspace memory)

## ▶ RESUME HERE (last session: 2026-10-16 → 17)

Live on https://fitness-coach-peach.vercel.app/ — see [`sessions/2026-10-16.md`](sessions/2026-10-16.md).
**Everything is merged** (#13 bugs, #14 headers, #15 audit/Dependabot/lint gate, #21 Resume/equipment/Y-T-W,
#23 React lint fixes, Dependabot #16/#19/#20/#22; #18 closed). Open: draft PR #25 — inline styles → classes
**+ the spoken intro before the clock and the "time left" clock** (see [`sessions/2026-10-17.md`](sessions/2026-10-17.md)).
`gh-pages` is a redirect — keep it.

**Next PR (2026-10-17, later):** buttons — a quick double-tap hit the next screen (double-tap Start skipped the
intro; double-tap ✕ started a NEW workout); Pause didn't stop the voice; "New warm-up" happened behind the sheet.
All fixed + tests (see the session log).

**Then:** the phone's Back button steps back inside the app (sheet → closed, workout → paused + Home with
Resume, Done → Home) instead of quitting it; fixed a negative first-frame time that dropped the Resume point.

**Ask Elli after #25:** is the intro the right length (~25s), and does she want the warm-up name / core shown on the intro screen too (now: spoken only)?

**Elli only:** (1) on the phone, lock the screen mid-workout → comes back paused, screen stays on after Resume;
(2) GitHub → Settings → Code security → turn on Dependabot alerts + security updates.

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
- [ ] Ask Elli: dark mode? Which Change-sheet options does she use (cut the rest; stations-vs-circuit first)?

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
