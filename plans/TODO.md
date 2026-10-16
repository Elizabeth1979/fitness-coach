# TODO — Move With Elli (workspace memory)

## ▶ RESUME HERE (last session: 2026-10-16)

Live on https://fitness-coach-peach.vercel.app/ — see [`sessions/2026-10-16.md`](sessions/2026-10-16.md).
**Merged:** PR #13 — four bug fixes (leave-the-app pause + Pause/Resume, wake lock, local dates, storage
safety). Check on Elli's phone: lock the screen mid-workout → comes back paused, screen stays on after.
**Merged:** PR #14 (security headers), PR #15 (audit 0, Dependabot, lint gate). **Open:** draft PR — exact-second same-day Resume + equipment toggle.
`gh-pages` is a redirect — keep it.

### Next — from the 2026-10-16 review plan (see the session log's "Evening" section)
- [x] Security headers in `vercel.json` (CSP, nosniff, Referrer-Policy, COOP, Permissions-Policy) — merged, PR #14.
- [x] `npm audit fix` (0 vulnerabilities), Dependabot (monthly, grouped), `lint` (warnings fail) in the Vercel build — merged, PR #15.
- [ ] Elli: turn on **Dependabot alerts + security updates** in GitHub → Settings → Code security (a repo setting, not a file).
- [x] Resume: same day only, from the exact second. Equipment toggle (Everything / Bodyweight only) — PR open.
- [x] Bodyweight pull move: Prone Y-T-W Raises (Elli: yes) — in PR #21.
- [ ] Dependabot #17 (dev tools incl. oxlint 1.88) is blocked by 11 new React lint findings — fix the code (not the rules), then it goes green.
- [ ] Read prefs once in `App`; inline styles → `index.css` classes; ask Elli which Change-sheet options she uses.

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
