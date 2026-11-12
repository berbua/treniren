# Unicorn Climb — bigger features

Item numbers and decisions: `design/DESIGN_DECISIONS.md`; details per gap: `design/MISSING_DESIGNS.md`;
build log: `design/REDESIGN_PLAN.md`. Per change: `npx tsc --noEmit` + `npx next lint`, update the plan log and
MISSING_DESIGNS.md, commit. Ask the user before starting each remaining item — each one needs a decision first.

> **Before deploying:** apply `prisma/migrations/20261112_add_period_flow` to the production database (item 38).
> Prisma selects the new `periods.flow` column, so the Cycle page can't load or save periods without it.

## Still to build — waiting for a decision

| # | Feature | Decision needed |
|---|---|---|
| 10 | **Goals card** on Today: measurable goals ("Max hang 20 mm +10 kg") — new data | Which goal kinds (fingerboard test target, exercise target, session count, Strong Mind focus?); where they're created (sheet from the Today card?); optional deadline? Asked 2026-11-12, not answered yet. |
| 11 | **"Log again" chips** under Quick log: recent workout types | What one tap does: log straight away, or open a prefilled form / duplicate the last workout of that type? |
| 37 | **Log symptoms** on Cycle — new data | Which symptoms (fixed list or custom), per day or per period, and where they show (calendar, phase cards)? |
| 44 | **Performance by phase** on Stats (avg session rating) | Needs a session rating first: add a 1–5 "How did it go?" rating to the workout form? |
| 55 | **Load routine in two steps**: pick a variation, then "Load into workout" | Confirm the flow replaces today's one-tap load. |
| 56 | **Fingerboard as one screen** (training + testing protocols) | Changes navigation: tabs on one page, or two sections; what happens to the current two menu entries? |
| 61 | **"Anonymous usage data" toggle** in Privacy | What it actually controls — the app collects no analytics today. |

## Built 2026-11-12 (after testing round 1)

| # | Feature | How | Commit |
|---|---|---|---|
| 14 | Cycle consent / setup texts + cycle-length slider | Mock texts, translated EN/PL (`cycle.consent.*`, `cycle.setupForm.*`); 21–35 slider; Cancel and "What happens next?" dropped | `13dd31f` |
| 22 | Route name (Lead Rock), Sector kept | `details.routeName` — no DB column | `8bdf57f` |
| 23 | Named climbs ("Climb 1…" editable) | `mentalState.climbSections[].name` | `8bdf57f` |
| 26 | Wall angle / style | `details.wallAngle` (lead + bouldering), `details.climbStyle` (bouldering) | `8bdf57f` |
| 33 | Upcoming events list on Calendar | Next 5 events under the legend, follows event filters | `5379366` |
| 38 | Flow intensity on periods | New `Period.flow` 1–3 + migration (see note above); chips in the period sheet, bars in Recent periods | `c0d7c38` |
| 39 | Avg cycle / Avg period / Logged tiles | Computed from logged periods (gaps 15–60 days count as cycles) | `4cb5b2f` |
| 43 | Weekly volume in TR points | Bar chart per Mon–Sun week, TR1 = 1 … TR5 = 5 | `bca937e` |
| 45 | Fingerboard test chart on Stats | Reuses `FingerboardTestChart`; all tests of the most recently tested protocol | `bca937e` |
| 52 | Exercise "Improving" status | `quick-stats.improving`: last 3 sessions' best set beats the 3 before, used in the last 42 days | `89cc588` |
| 53 | Progression footer "Start · Now · +%" | First vs last session in the range, for the selected metric | `89cc588` |
| 59 | "Member since" on Profile | `/api/user` returns `createdAt` | `a6cc14d` |
| 60 | Editable display name | Saved as `User.nickname`; Today greeting and user menu use it | `a6cc14d` |

Not checked in a browser yet (no local server / test account in the session) — test them in the app.

### Fixes from testing round 1 (not numbered)
- Project goals list every linked workout ("Linked workouts (N)", 🏆 on sends) — before, only sends showed. `e772c2d`
- Routines page has a back link to the Exercise Library. `e772c2d`

## Not on this list
- Done earlier on 2026-11-12: 1, 2, 3, 4, 5, 7, 12, 19, 25, 29, 30, 32, 34, 42, 49, 57, 58, 62, 64, 65.
- 9 changed to "Keep the app"; 51 future idea only (more exercise categories).
- Discuss later: 15, 17, 24, 28, 31, 40, 66. Pending: 63 (auth titles, user adds Polish strings).
- Follow-ups from this round: route name for Lead Wall / Bouldering too? Fingerboard tests on Stats follow the range
  instead of all tests? Wall angle / style in Stats? Offline form fields (waits for 15).
