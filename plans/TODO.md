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

**Elli's first-workout ideas are in Supabase (ids 8–30, 2026-10-17)** — triaged below. Read the table at the
start of each session for new ones (query in CLAUDE.md "Elli's ideas"); set `status` planned/done as we go.

### From Elli's first workout (Supabase `ideas`, 2026-10-17)
- [x] **Bugs — fixed 2026-10-17 (evening):** timer ring stuck as a green dot (#12) · next move not announced
  during a move (#13) · Deep Squat Hold got 37s (#15) · page behind a bottom sheet still scrolls (#25) · hip
  circles / leg swings have no switch sides (#11). **Ask Elli** after her next workout: is "Next up" at 10s left
  the right moment, and does the halfway "Switch sides." in the warm-up feel right?
- **Understanding moves:** images (#9, #14) · clearer how-to for shoulder rotation, arm swings, leopard crawl,
  flutter kicks (#14, #17, #21)
- **Workout flow:** rep-counted moves you can't finish in the time → "as many as you can" (#16) · merge
  Rest/Next-up with Get ready (#18) · announce the core finisher before it, not after (#21) · go back to a
  missed move, not only Skip; resume after leaving by mistake (#10) · "all sets of one move" = Stations, make
  it findable (#20)
- **Home & settings:** Change workout below the fold (#22) · swap the core finisher (#24) · choose a focus area
  (#28) · voices: only English accents AU/NZ/CA/UK/US/IE (#29) · why some moves can't swap (#26)
- **History:** past workouts with date, moves, how it felt (#23)
- **Bigger / research:** add learned exercises to the pool (#27) · more natural speech (#30) · offer the ideas
  feature to other users when productizing (#8). Answered: #19 (the minutes include rests).

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

### Later — "Suggest a feature" for everyone (Elli's idea, 2026-10-17; parked)
**Done:** ideas are sent to a private Supabase table Claude reads (`src/ideas/send.ts`, `src/ui/IdeasSheet.tsx`).
- [ ] **Later (Elli, 2026-10-17): move the ideas to GitHub issues** — so "@claude build this" works on them
  directly. Needs Elli to make a fine-grained GitHub token (Issues: read/write, fitness-coach only) and put
  it in Vercel as `GITHUB_TOKEN`; then a Vercel function creates the issues. Issues are public (public repo).
**Still later:** other users should be able to ask for features too, landing somewhere Elli sees them.
What was settled while brainstorming:
- **Upvote, don't duplicate (Elli's requirement):** if someone asks for something already
  requested, it counts as a vote on the existing request, not a new task.
- **Lands as GitHub issues** labelled `feature-request` (repo is **public** → the form must say
  "requests are posted publicly, no personal details"). App → small Vercel function → issue;
  the GitHub key lives only in Vercel env vars. No sign-in for users. Keep text offline, send later.
- **Open question — votes without accounts:** GitHub 👍 reactions are one per GitHub account, so
  anonymous votes need another home. Look first at a tested feature-voting tool (Featurebase claims
  sign-in-free voting; Canny has a GitHub integration but needs login; Fider is open source) before
  building our own counter. For "is this a duplicate?", Anthropic's own `anthropics/claude-code`
  repo runs a Claude dedupe workflow (`.github/workflows/claude-dedupe-issues.yml`) — a precedent.
- [ ] **"@claude build this" (Elli wants this too, later):** add Anthropic's official Claude
  GitHub app (`anthropics/claude-code-action`). Then commenting "@claude build this" on any
  request makes Claude build it on its own branch and offer a PR, and Vercel gives it a preview
  link to try on the phone. Setup (~5 min, Elli): open a regular `claude` terminal in this repo,
  run `/install-github-app`, and enter the secret key yourself when it asks. Only people with
  write access (Elli) can trigger it.

### Next — nothing urgent; ideas live in `docs/NEXT-STEPS.md` (polish backlog + roadmap)

### Standing rules (from Elli)
- Fix bugs / warnings / rough edges and push — **don't ask whether to fix** (memory `always-fix-dont-ask`).
- Colour only for "do this", high contrast, one visible Start (memory `design-preferences`).
