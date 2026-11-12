# Unicorn Climb — bigger features still to build

On hold (2026-11-12) while the user tests the app. Ask the user before starting each one.
Item numbers and decisions: `design/DESIGN_DECISIONS.md`; details per gap: `design/MISSING_DESIGNS.md`;
build log: `design/REDESIGN_PLAN.md`. Per change: `npx tsc --noEmit` + `npx next lint`, update the plan log and
MISSING_DESIGNS.md, commit. Tick an item here when it's built.

## Today
- [ ] **10 Goals card**: measurable goals ("Max hang 20 mm +10 kg") — new data. Open questions (asked 2026-11-12, not
      answered yet): which goal kinds (fingerboard test target, exercise target, session count, Strong Mind focus?),
      where they're created (sheet from the Today card?), optional deadline?
- [ ] **11 "Log again" chips**: under Quick log, recent workout types; one tap logs/duplicates. Behaviour to agree first.

## Cycle
- [ ] **14 Consent / setup**: design texts ("Train with your cycle?") + cycle-length slider in the setup sheet.
- [ ] **37 Log symptoms** — new feature (new data).
- [ ] **38 Flow intensity** on periods — new field (DB + period form + recent periods bars).
- [x] **39 Avg cycle / Avg period / Logged tiles** — computed from logged periods.

## Log workout
- [x] **22 Route name** field, keeping Sector (both, for rock climbing) — new DB field.
- [x] **23 Named climbs**: default "Climb 1, Climb 2…", editable name (stored in `mentalState.climbSections`).
- [x] **26 Wall angle / style**: UI for the enums that already exist in the DB.

## Calendar
- [x] **33 Upcoming events list**.

## Statistics
- [x] **43 TR-points volume + weekly bar charts**.
- [ ] **44 Performance by phase** (avg session rating) — needs a session rating first.
- [x] **45 Fingerboard test chart on Stats**.

## Exercises / routines / fingerboard
- [x] **52 Exercise detail "Improving" status**.
- [x] **53 Progression footer** "Start 6 kg · Now 10 kg · +67%".
- [ ] **55 Load routine in two steps**: pick a variation, then "Load into workout".
- [ ] **56 Fingerboard as one screen** (training protocols + testing protocols) — changes navigation.

## Profile
- [x] **59 "Member since"** — `/api/user` must return `createdAt`.
- [x] **60 Editable display name**.
- [ ] **61 "Anonymous usage data" toggle** in Privacy — needs to decide what it actually controls.

## Not on this list
- Done 2026-11-12: 1, 2, 3, 4, 5, 7, 12, 19, 25, 29, 30, 32, 34, 42, 49, 57, 58, 62, 64, 65.
- 9 changed to "Keep the app"; 51 future idea only (more exercise categories).
- Discuss later: 15, 17, 24, 28, 31, 40, 66. Pending: 63 (auth titles, user adds Polish strings).
