# TODO — Move With Elli (workspace memory)

## ▶ RESUME HERE (last session: 2026-10-16)

Everything from 2026-10-16 is **done, merged, pushed and live** on
https://fitness-coach-peach.vercel.app/ — see [`sessions/2026-10-16.md`](sessions/2026-10-16.md).
There is **no half-finished work**. GitHub: only `main` + `gh-pages` (redirect, keep it), no open PRs.

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
