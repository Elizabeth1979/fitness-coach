# TODO — Move With Elli (workspace memory)

## ▶ RESUME HERE (last session: 2026-10-16)

Everything from 2026-10-16 is **done, merged, pushed and live** on
https://fitness-coach-peach.vercel.app/ — see [`sessions/2026-10-16.md`](sessions/2026-10-16.md).
There is **no half-finished work**. GitHub: only `main` + `gh-pages` (redirect, keep it), no open PRs.

**First, check with Elli:** did re-adding the app to her home screen from the Vercel address
show the new design? (Old installs from `github.io` now forward + clear their cache; new
versions now arrive on their own when she returns to the app.)

### NOT YET STARTED — next steps
- [ ] **Real app icons** — `public/icons/icon-192.png` / `icon-512.png` are 1×1 placeholders,
      so the home-screen icon is blank. Needs artwork (ask Elli for a direction, or propose one
      in the high-contrast style — see memory `design-preferences`).
- [ ] **Swap with no alternative** — hide/disable "Swap" (home row pill + MoveDetail button)
      when `swapMove` would return the workout unchanged (e.g. bodyweight-only + 10-min + hinge).
- [ ] **Trim the icon font** — only the `woff2` is precached; drop the unused `.woff`/`.ttf`
      (~3.6 MB in `dist`) or replace the ~20 icons used with inline SVGs.
- [ ] **Tokenize leftover inline colours** — timer-ring greys/green and the rest background in
      `ActiveScreen.tsx` / `TimerRing.tsx` → `:root` variables in `src/index.css`.
- [ ] **Sheet accessibility** — trap focus + auto-focus in MoveDetail and the Change sheet.

### Standing rules (from Elli)
- Fix bugs / warnings / rough edges and push — **don't ask whether to fix** (memory `always-fix-dont-ask`).
- Colour only for "do this", high contrast, one visible Start (memory `design-preferences`).
