# TODO — Move With Elli (workspace memory)

## ▶ RESUME HERE (last session: 2026-10-16)

Everything from 2026-10-16 is **done, merged, pushed and live** on
https://fitness-coach-peach.vercel.app/ — see [`sessions/2026-10-16.md`](sessions/2026-10-16.md).
There is **no half-finished work**. GitHub: only `main` + `gh-pages` (redirect, keep it), no open PRs.

**First, check with Elli:** did re-adding the app to her home screen from the Vercel address
show the new design? (Old installs from `github.io` now forward + clear their cache; new
versions now arrive on their own when she returns to the app.)

### NOT YET STARTED — next steps
- [x] **Real app icons** — done 2026-10-16: green "Start" play button; redraw with
      `python3 design/render_icons.py`.
- [ ] **Swap with no alternative** — hide/disable "Swap" (home row pill + MoveDetail button)
      when `swapMove` would return the workout unchanged (e.g. bodyweight-only + 10-min + hinge).
- [x] **Trim the icon font** — done 2026-10-16: 17 inline SVG icons via `src/ui/Icon.tsx`
      (offline download 1,003 KB → 364 KB).
- [ ] **Tokenize leftover inline colours** — timer-ring greys/green and the rest background in
      `ActiveScreen.tsx` / `TimerRing.tsx` → `:root` variables in `src/index.css`.
- [ ] **Sheet accessibility** — trap focus + auto-focus in MoveDetail and the Change sheet.

### Standing rules (from Elli)
- Fix bugs / warnings / rough edges and push — **don't ask whether to fix** (memory `always-fix-dont-ask`).
- Colour only for "do this", high contrast, one visible Start (memory `design-preferences`).
