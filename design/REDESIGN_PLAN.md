# Unicorn Climb — redesign plan

Working file for applying the redesign across several sessions. Each session: read this file,
`design/DESIGN.md` and `design/tokens.css`, do the **next unchecked step**, tick it off here,
add a line to the log at the bottom, commit. Branch: `redesign/unicorn-climb`.

## Rules (apply to every step)

- **Visual only.** Never add, remove or change functionality to match a mockup. If a mockup shows
  something the app doesn't do, keep the app's behaviour and note it in `design/MISSING_DESIGNS.md`.
- No hard-coded hex, font or radius in components: use the `--uc-*` tokens (via the Tailwind
  mapping from step 1).
- Font: Manrope only (replaces Montserrat and the unused Inter import in `layout.tsx`).
- Icons: **keep the existing icons/emoji as they are for now.** The user will provide custom SVGs
  later (24px grid, 1.75 stroke, round caps, `currentColor`). Don't install an icon library and don't
  draw icons; just leave room for 24px icons where the mockups have them.
- Never fix label widths: Polish labels can be ~30% longer. Min tap target 44×44px.
- Keep all translation keys; don't touch `messages/pl-custom.json`.
- Read only the mockup(s) for the current step, cropped if detail is needed.
- Per step: `npx tsc --noEmit` + `npx next lint`. Don't run `npm run build` while the user's dev
  server may be running (it overwrites `.next`).

## Current state (before step 1)

- `src/app/globals.css` has an old `@theme` palette (`--color-uc-black`, `--color-uc-dark-bg`,
  `--color-uc-purple`, `--color-uc-mustard`, …), `--color-training-*` workout colors and Montserrat.
- Components also use many raw Tailwind colors (`slate-*`, `pink-*`, …) with `dark:` variants.
- Theme: spec wants `data-theme="dark|light"` on `<html>`; tokens.css defines both under
  `:root[data-theme=…]`.
- No icon library installed, by decision: custom SVGs from the user come later (see step 5).
- Nav lives in `src/components/NavigationHeader.tsx`.

## Steps

### 1. Foundation (cheap, biggest effect)
- [x] Bring `design/tokens.css` into `globals.css` (import or copy), keep `--uc-*` names.
- [x] Map tokens into Tailwind `@theme` (e.g. `--color-uc-bg: var(--uc-bg)`, surface, elevated,
      text, muted, primary, accent, phases, bands, workouts, radii) so classes like `bg-uc-surface`
      exist; point the old `--color-uc-*` and `--color-training-*` names at the new tokens so
      existing screens change colour without edits.
- [x] Theme: set `data-theme` on `<html>`, make Tailwind `dark:` follow it
      (`@custom-variant dark`), keep the user's current theme behaviour.
- [x] Manrope via `next/font/google`; remove Montserrat and the Inter import.
- [x] Add `.uc-num` usage note; check the app still renders on Today, Calendar, a form.

### 2. Shared components (build once, reuse everywhere)
Reference: `mockups/Component sheet I.png`, `mockups/Component sheet II — forms, navigation, data.png`,
`mockups/Style guide — color & type tokens.png`.
- [x] Button (accent / primary / tonal / ghost / destructive), Card, Input/Select/Textarea, Chip.
- [x] Phase badge (solid + soft), workout type chip, segmented selector, stat tile, session row.
- [x] Bottom sheet, confirmation dialog, toast, empty state, skeleton.
- [x] Mobile floating bottom tab bar + desktop sidebar (restyle `NavigationHeader`, same routes).

### 3. Screens (one per session; tick when done)
- [x] Today / Dashboard — `Dashboard — dark.png`, `Dashboard — light.png`,
      `Dashboard — cycle onboarding, alt states, offline.png`, `Desktop — Dashboard.png`
- [x] Quick log — `Quick log sheet.png`
- [x] Log workout (lead) — `Log workout — lead climbing (full form).png`
- [x] Log workout (other types, tags, recurring, dialogs) —
      `Log workout — gym, fingerboard, mental, tags, recurring, dialogs.png`
- [x] Workouts list & goals — `Workouts list & goals.png`
- [x] Calendar — `Calendar — month.png`, `Calendar month — light.png`, `Calendar — week view & filters.png`
- [x] Cycle — `Cycle.png`, `Cycle — disabled, period form.png`
- [x] Statistics — `Statistics.png`
- [x] Strong Mind — `Strong Mind.png`
- [x] Events — `Events.png`
- [x] Exercises — `Exercises.png`
- [x] Routines — `Routines.png`
- [x] Fingerboard protocols & testing — `Fingerboard protocols & testing.png`
- [x] Profile & settings — `Profile & settings.png`
- [x] Global UI (More, messages, menus, banners, install, loading) —
      `Global UI — More, messages, menus, banners, install, loading.png`
- [x] Auth & landing — `Sign in, sign up, password, sign out.png`, `Landing page.png`

### 4. Finish
- [x] Search for leftover hard-coded colors (`#`, `slate-`, `pink-`, …) and Montserrat.
- [x] Remove the legacy `--color-uc-*` / `--color-training-*` aliases from `globals.css` once no
      component uses them; update the old palette section in `DEVELOPMENT_RULES.md`.
- [ ] Check dark + light, EN + PL, 390px and desktop on each screen. (Logged-out screens done; logged-in screens
      need the user's session.)
- [ ] Update `design/MISSING_DESIGNS.md` (remove gaps the new mockups covered).
- [ ] Open a PR from `redesign/unicorn-climb` to `main`. **On hold (user, 2026-11-12): bug fixes, testing and the
      icons (step 5) come first.**

### 5. Icons (after the user delivers the custom SVGs)
- [x] Add the SVGs as React components behind one `Icon` wrapper (`currentColor`, 24px).
- [x] Map workout types, phases, nav tabs etc. to icons; replace the emoji icons screen by screen.
- [x] Search for leftover emoji icons.

## Open points (decisions for the user)

Not built because they'd change or add behaviour. Details in `design/MISSING_DESIGNS.md`. Tick when decided and
note the answer.

- [ ] **Edit / Duplicate subtitles** in the workout sheet ("Gym · Mon 9 Nov", "Copy of Fingerboard · Mon 9 Nov —
      pick a new date"): show the original workout's type and date in the header?
- [ ] **Per-set validation** (decided: build, #19 in `DESIGN_DECISIONS.md`) ("Enter reps for set 3", red empty cell): add inline errors for empty sets/hangs, or keep
      only the incomplete-data dialog on save?
- [ ] **Collapsible hangs** (one-line "Hang 2 · Both · open · 20 mm · +4 kg · 6 × 10 s" row): add collapse/expand?
- [ ] **Crimp size**: keep the fixed 6–30 mm list, or allow any number (mock shows a free "mm" field)?
- [x] **Centre "+" tab**: today it opens Workouts. Should it open a Quick log / Add workout / Add event choice sheet? → Yes, built.
- [x] **Tab labels**: keep Dashboard / Statistics or switch to the mock's Today / Stats? → Today / Stats on the phone tab bar, built.
- [x] **Workouts tab counts**: show the total from the API ("Workouts (214)") instead of the items on this page? → Yes, built.
- [x] **Numbered pagination** ("1 2 … 11", "1–20 of 214"): add jump-to-page, or keep Previous / Next? → Yes, built.
- [x] **Cycle — recent periods list with edit**: the API supports it but there's no UI. Build it in the Cycle step? → Yes, built (list + edit + delete).

## Log

- 2026-11-12: Plan written. New mockups in `design/mockups/` (26 PNGs). Bug fixes merged to `main`.
- 2026-11-12: Icons decided: keep current icons during the redesign; user provides custom SVGs later (step 5).
- 2026-11-12: Step 1 done. Tokens copied to `src/app/tokens.css` (Manrope via `next/font`, no Google
  Fonts import), mapped in `globals.css` `@theme inline` (`bg-uc-surface`, `bg-uc-phase-*`,
  `bg-uc-workout-*`, `rounded-uc-card`, `shadow-uc`, …). Legacy names aliased to new tokens, with
  per-property overrides (`--text-color-uc-black` → on-accent, `--background-color-uc-purple` →
  primary-container, `--text-color-uc-mustard` → accent-text) so old text stays readable.
  Theme: inline script sets `data-theme` from `prefers-color-scheme` (same as before: no in-app
  setting); `dark:` follows `data-theme`. Removed dead `tailwind.config.ts` (v4 ignored it).
  Dev server needs a restart to pick up the new CSS.
- 2026-11-12: Step 2 done. Primitives in `src/components/ui/` (import from `@/components/ui`): `Button` /
  `buttonClasses()` (accent, primary, tonal, ghost, destructive; md 44px, lg 56px, icon), `Card`, `Overline`,
  `Input`, `UnitInput`, `Select`, `Textarea`, `Label`, `FieldError`, `Chip`, `ChoiceChip`, `PhaseBadge`
  (solid/soft) + `phaseSolidBg`/`phaseBandBg`, `WorkoutTypeChip`, `WorkoutIconTile` + `workoutBg`/`workoutText`,
  `SegmentedControl` (single or multi value), `StatTile`, `SessionRow`, `TrBadge`, `BottomSheet`, `EmptyState`,
  `Skeleton`, `SkeletonRows`. Restyled in place (same props): `ConfirmationDialog`, `Toast`, `LoadingSpinner`,
  `NotificationBell` (44px), `UserMenu`. Nav: logged in = floating bottom tab bar (Dashboard, Calendar,
  centre accent "+" → Workouts, Statistics, More sheet) on phones, 256px sidebar with a cycle-day card on `lg`;
  `Providers` pads content (`lg:pl-64`, bottom space for the tab bar). Logged out = top header (logo, Home,
  language, Sign in). New keys `nav.events`, `nav.fingerboardTesting`, `nav.mainNavigation`, `nav.cycleDayOf`.
  Not checked logged-in in a browser (headless has no session) — check nav on phone + desktop before step 3.
  Screens still use the old classes; they switch to the primitives in step 3.
- 2026-11-12: Step 3 · Dashboard done. `src/app/dashboard/page.tsx` rebuilt on the primitives: date overline + greeting,
  **phase hero card** (user approved showing existing cycle data here: badge, "Day X of Y", phase goal + impact from
  `cycle.phaseDetails`, 5-segment strip from `getPhaseRanges`, next ovulation, "Recommendations" → /cycle; only when
  tracking is on), accent Quick log (full width on phones, header button on `lg`), suggestion + trip cards, stat
  tiles (streak, total, events + week/month with goal bars; 5 in a row on `lg`), recent workouts as `SessionRow`s,
  recent events with outlined event-colour tiles, 3×3 shortcuts, App status card. Same data, conditions and links.
  Removed the mobile ⚡ FAB (it sat under the new tab bar; Quick log stays at the top). New key
  `dashboard.recommendations`; `StatTile` got `progressClassName`; `phaseTranslationKey` moved to `PhaseBadge`.
  Restyled `CycleConsentModal`, `CycleSetupForm` (bottom sheet, still a select for 21–35) and `OfflineWorkoutForm`
  (`BottomSheet`, type chips, TR cards, rating dots) — all fields kept. Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Quick log done. `QuickLogModal` now a `BottomSheet` (same props, same three callers): overline
  labels, type chips in a 2-column grid in the mockup order, protocol `Select`, TR1–TR5 and practice type as
  `SegmentedControl` (tap the selected segment again to clear it, since both stay optional as before), time of day as
  multi-select `ChoiceChip`s, full-width accent "Mark as done" (spinner while saving). The Cancel button was dropped;
  the sheet's ✕, Esc and scrim tap still close it. Description line, "(Optional)" labels, emoji and smart defaults kept.
  `Overline` got `as="label"`. Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Log workout (lead) done. `EnhancedWorkoutForm` is a `BottomSheet` (`dismissible={false}`, new
  prop: Esc/scrim don't close it, as before) with Cancel + accent Save footer (`form="workout-form"`). Overline labels
  (`FieldHeading` with ℹ️ tooltip + right summary), type chips in mockup order, TR as `SegmentedControl`, `Input` /
  `Textarea`, new `CollapsibleCard` primitive for Cycle (phase band background), Goals, Gratitude, Strong Mind and
  Recurring. `StrongMindSection`: 1–5 segments with end captions, focus/comfort chips in the `--uc-focus-*` /
  `--uc-zone-*` colours, falls as No/Yes segments, dashed "Add climb" under the climbs. `TagSelector` (also event form),
  `ProcessGoalsSection`, `CycleInfo` (content only now, callers give the band) restyled. Mental-practice fields
  (focus level → shared `RatingDots`, moved out of `OfflineWorkoutForm`; practice type → segments; time of day →
  chips) and the incomplete-data dialog (now `ConfirmationDialog`) were tokenised too. Still old: `WorkoutExerciseTracker`
  and `FingerboardHangTracker` — next step. Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Log workout (other types) done. `WorkoutExerciseTracker`: tonal Load routine + ghost Add exercise,
  exercise `Card`s with a Set · Reps · kg · RIR grid (centred `Input`s, 44px remove), dashed "+ Add Set", dashed empty
  state, exercise search panel as a `Card`, routine picker as a `BottomSheet`. `FingerboardHangTracker`: same button row,
  hang `Card` with 44px ↑ ↓ 🗑️, hand/grip as `SegmentedControl`s (emoji as icons), crimp `Select` + `UnitInput`s for
  load (kg) / reps (×) / time (s), protocol picker as a `BottomSheet`. `TagSelector` creator: titled card, 5×2 swatch
  tiles, Cancel + Create. Recurring: dates always side by side, frequency as segments. `ConfirmationDialog`: icon tile on
  top, equal-width buttons, new `emphasis="cancel"` prop (used by the incomplete-data dialog). `SegmentedControl` labels
  centre when they wrap. Mental practice, goals, gratitude, cycle were already done last step. Not checked logged-in
  in a browser.
- 2026-11-12: Step 3 · Workouts list & goals done. `/workouts`: header with ghost 🎯 Goals / ℹ️ Info (labels from `sm`)
  + accent Add, info panel on `--uc-primary-container` (dot in workout/event colour, name, description, tip, ✕),
  underline tabs, `EmptyState`s with accent CTA, ghost Previous/Next pagination (shared local `Pagination`), Add choice
  as a `BottomSheet` with 3 tiles (Cancel dropped). `WorkoutCard` on `Card`: workout icon tile, Quick badge, 44px
  edit/delete, chips, primary rating dots, one Strong Mind/gratitude block. `GoalsConfigurator` is a `BottomSheet`
  (`dismissible={false}`, as before): overline labels, range + number inputs, monthly auto/manual `SegmentedControl`
  (new keys `goals.auto`, `goals.manual`), per-type goals in a `CollapsibleCard`, preview on primary-container, Cancel +
  accent Save footer. Same data, handlers and API calls. `EventCard` left for the Events step. Not checked logged-in
  in a browser.
- 2026-11-12: User approved: Workouts/Events tab counts now show the API total (`pagination.total`, falls back to the
  list length for the old API format); pagination is ‹ first … current±1 … last › with 44px buttons (current in
  `--uc-primary`) and a "1–20 of 214" line (new key `common.pageRange`).
- 2026-11-12: Step 3 · Calendar done. `/calendar`: title + ghost 🔍 filter button (accent count badge) + accent ➕ (add for
  today); Week/Month `SegmentedControl` + ghost Today; ← range → row (dates via `toLocaleDateString`, EN/PL).
  Month: Mon-first 62px cells with no column gap, phase band behind (`--uc-band-*`, rounded at phase change / week
  edge, future days at 50%), today ring, up to 3 workout dots, outlined event badge, trip line, ⚠️ on injury-risk days.
  User decision: tapping a day opens the Add sheet, which now also lists the day's events/workouts with edit and
  duplicate (the actions that lived on the month chips). Week: stacked day cards on the phase band with
  "Phase · dN", injury-risk chip, event rows and workout rows (icon tile, Quick chip, 44px ✏️ 📋). Filters moved to a
  `BottomSheet` (Workouts/Events segments, `TrainingTypeFilter` now `WorkoutTypeChip`s, event `ChoiceChip`s). Legend
  card (phase swatches, workout dots, event badges, injury risk, hint) sits right of the calendar on `lg`.
  Fix: the injury-risk marker never showed for early/late luteal (`'earlyLuteal'` vs `'early-luteal'`); now compared
  via `phaseTranslationKey`. New keys `calendar.cycleDayShort`, `calendar.injuryRiskPhase`; `calendar.clickDateHint`
  reworded. Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Cycle done. `/cycle`: title + "Cycle settings" link, **cycle ring** (SVG, one arc per phase from
  `getPhaseRanges`, other phases at 45%, a dot per day, marker on today; centre: Day N, `PhaseBadge`, "of 28 · next period
  ~date"), full-width accent Add period, injury warning on `--uc-warning-bg`, month calendar in a `Card` (Mon-first,
  localized month/weekdays, period = solid menstruation, predicted menstrual = dashed, ovulation = band, ~ forecast and
  cycle day kept, ⚠️ on most-injury phase), legend + "Tap a day…" hint, phase cards (dot, days, label/value rows, current
  phase on its band with a "Now" chip, most-injury phase with a warning border + "Injuries: N · most" chip). Period form
  is a `BottomSheet` (start/end side by side, notes, 🗑️ / Cancel / accent Save). Tracking off: `EmptyState` with
  "Enable in profile" → `/profile?tab=cycle`. User decisions: **Recent periods** card (newest first, 5 + Show all, tap to
  edit; delete via `ConfirmationDialog` → `DELETE /api/periods/:id`, both APIs existed) and the two profile links
  (`UserProfile` got `initialTab`, `/profile` reads `?tab=`). Edit sends an emptied end date as `null` so it clears.
  Desktop: ring, Add, warning and recent periods in a 360px left column. New `cycle.tracking.*` keys (EN + PL).
  Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Statistics done. `/statistics`: plain 28px title (dropped the 📊 and the hard-coded Polish subtitle),
  Timeframe as a 6-segment `SegmentedControl` (short labels 1W…All / 1T…Całość, full name for screen readers) and
  "Show frequency per" Week/Month/Quarter/Year segments moved up from the Workout types header (same state, same
  effect), 4 `StatTile`s, workout type cards (`WorkoutIconTile`, "Count: N · x/period", %, bar in the workout colour,
  Gym top-3 variations as outlined chips), Tags and Training volume as list cards with bars (same counts and %),
  Strong Mind link card, Injuries by cycle phase card (4 total tiles, 5 phase tiles on their bands, most-injury phase
  ringed in `--uc-warning`, warning callout with the existing texts + full-width notify button, still `alert()`),
  Gratitude & improvements as one feed with All/Gratitude/Improvements segments (✨ / 📈 rows, "Type · sector · date"),
  footer "date range · Last updated date, time" (localized). Workout type names now use `training.types.*` (were English
  only; Fingerboard had no icon). Desktop: types left, tags/volume right. New keys `stats.thisMonth`,
  `stats.showFrequencyPer`, `stats.injuriesByPhase`, `stats.totalInjuries`, `stats.maxInPhase`, `stats.phasesAffected`,
  `stats.noRecentInjuries`, `stats.injuriesPerPhase`, `stats.improvementsShort`, `stats.short.*` (replace the hard-coded
  Polish strings). Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Strong Mind done. `/strong-mind`: 28px title, tabs as a 3-segment `SegmentedControl`. Goals: Process
  and Project goals on one tab (sub-tabs removed; two columns on `lg`), tonal "+ Add", Long-term / Short-term overlines with
  counts and dashed empty notes, goal `Card`s with 44px ✏️ 🗑️, project cards with a grade tile in the lead-wall / bouldering
  colour. Forms moved to `BottomSheet`s (`dismissible={false}`; edit opens the same sheet): description `Textarea`,
  duration + unit `Select`s, date `Input`, "Classified as" pill; project form with Route/Boulder segments, grade system +
  grade, name, sector, linked goal. Delete via `ConfirmationDialog`. `GoalProgressDisplay` restyled: process = "Linked
  workouts (N)" rows with 1–3 dots, project = success "🏆 Achieved! date" chips; type names translated, dates localized.
  Gratitude: `ChoiceChip` filters, two sections of 2-column note cards (4 on `lg`), `EmptyState` + accent CTA.
  Statistics: timeframe `Select`, Mental practice and Falls cards with 2×2 tiles. Same localStorage data and handlers.
  New keys `strongMind.linkedTo`, `unknownGoal`, `deleteGoalTitle`, `noProgressYet`, `notAchievedYet`, `classifiedAs`.
  Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Events done. New `ui/EventType` (`EVENT_TYPE_META`, `eventTypeMeta`, `EventIconTile`: emoji,
  border/text/tint classes per event type; the calendar now uses it instead of its own list). `/events`: 28px title +
  subtitle (new key `events.subtitle`, was hard-coded), accent "+ Add", `SkeletonRows` while loading, dashed `EmptyState`
  with accent CTA, card grid 1/2/3 columns. `EventCard` (also on /workouts): outlined icon tile, type overline in the
  event colour, title, 44px ✏️ 🗑️; injury = date chip, status chip (warning), cycle-day chip with the same inline edit
  (44px input/✓/✕), severity dots; trip = Dates (localized range) / Climbing type / Countdown (success) tiles; others =
  "Thu 5 Nov · 17:30  📍 location"; tag chips, description, notes. Hard-coded English labels/dates replaced (new keys
  `events.severity`, `dates`, `countdown`, `notes`). `EventForm` (also on /workouts and /calendar) is a `BottomSheet`
  (`dismissible={false}`): 3-column type tiles tinted in the event colour, `Input`/`Textarea`, cycle day input with the
  hint beside it, trip dates side by side, climbing type `SegmentedControl`, countdown checkbox row, `FieldError`s,
  Cancel + accent Save (spinner). Same fields, validation and payload. Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Exercises done. `/exercises`: 28px title + subtitle, ghost 👯 Add Routine (label from `sm`) + accent
  "+ Add Exercise", `SkeletonRows` while loading. `ExerciseLibrary`: search `Input` + grid/list toggle (44px, primary when
  on), category filter as a scrolling `ChoiceChip` row (same `selectedCategory`), Quick add as a collapsible
  primary-container card with grouped "+ Name" buttons (Pull / Push / Lower body / Core / Climbing specific; the list got a
  `group` field that isn't sent to the API), count line, dashed `EmptyState` + accent CTA. One `ExerciseItem` for grid
  (`Card`s, 1/2/3 columns) and list (rows in one card): name, tonal category `Chip` (per-category colours dropped), unit,
  "Used N× · Last 2 Nov · Last set 10 kg × 5" (date was relative "3 days ago"; set was "5×10kg"), "View progress ›"
  (only when used; the duplicate 📊 link went), 44px ✏️ 🗑️ with spinner while deleting. `ExerciseForm` is a
  `BottomSheet` (`dismissible={false}`, as before): name `Input` + `FieldError`, category `ChoiceChip`s + custom
  `Input`, unit `SegmentedControl`, Cancel + accent Save. `/exercises/[id]`: back chevron, name + "Category · unit",
  2×2 mini tiles, Personal records on primary-container, Progression card (metric + timeframe `Select`s, Line/Area/Bar
  segments, chart, summary footer), recent-workout rows, dashed empty states; two columns on `lg`. Chart: tokens via
  `var(--uc-*)` (was hex), hollow dots, no legend, localized dates, skeleton while loading. Hard-coded English replaced
  (new keys `exercises.gridView`, `listView`, `categories`, `quickAdd`, `quickAddCount`, `quickAddGroups.*`, `matching`,
  `inCategory`, `usedTimes`, `lastShort`, `lastSetShort`, `viewProgress`, `form.*`, `detail.*`). Same data, handlers and
  API calls. Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Routines done. `/routines`: 28px title + subtitle, accent "+ Create Routine" (label from `sm`),
  `SkeletonRows` while loading, dashed `EmptyState` + accent CTA, card grid 1/2/3 columns. Card: gym `WorkoutIconTile`,
  name, description, 44px ✏️ 🗑️ (were text Edit/Delete buttons; spinner while deleting), "5 exercises · 2 variations",
  first three exercise names as text "+N more" (were chips), variation `Chip`s with the rep range. `RoutineForm` is a
  `BottomSheet` (`dismissible={false}`): `Input`/`Textarea` with overline labels, `FieldError`, Exercises / Variations
  overlines with counts and "+ Add …" text buttons, numbered exercise rows with 44px ↑ ↓ ✕ (was "Remove" text),
  variation rows with ✏️ ✕, dashed empty notes, Cancel + accent Save footer (Cancel still clears the draft). Exercise
  picker and variation form are their own `BottomSheet`s (picker closes on Esc/scrim; variation form doesn't): picker has
  search, one Select all / Deselect all checkbox row, checkbox rows with category on the right, primary "Add Selected (N)";
  variation form has Min / Max / Sets in one row and an inline name error (was `alert()`). New keys
  `routines.form.moveUp`, `moveDown`. Same data, draft saving and API calls. Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Fingerboard protocols & testing done. `/fingerboard-protocols`: 28px title + subtitle, accent "+"
  (label from `sm`), **Test yourself** card on primary-container (📊, new subtitle `fingerboard.testYourselfSubtitle`, the
  old tooltip as `title`, chevron; opens the same modal), `SkeletonRows`, dashed `EmptyState` + tip, protocol `Card`s with
  fingerboard `WorkoutIconTile`, "N hangs", 44px ✏️ 🗑️ (spinner while deleting). `FingerboardProtocolForm` and
  `FingerboardTestingProtocolForm` are `BottomSheet`s (`dismissible={false}`) with Cancel + accent Save, hang rows
  ("Hang N" + details, 44px ↑ ↓ ✏️ ✕), dashed "+ Add hang"; hang sub-forms are their own sheets (hand/grip
  `SegmentedControl`, crimp `Select`, kg / × / s `UnitInput`s); testing form has a tonal "Load from protocol" and the
  protocol picker as a sheet. `FingerboardTestModal`: one sheet for Choose (step bar, cards with Perform test / Results /
  Clone, dashed "+ Create testing protocol") and Results (back chevron, `size="lg"`, accent "Perform another test",
  chart, table); Create and Perform render their own sheets. `PerformTestModal`: sheet with "Perform test" overline +
  name + ✏️ inline rename (✓ ✕), date, hang cards ("Hang N · …", "target +7 kg · 7 s", Load / Time `UnitInput`s, Yes/No
  segments, notes), retest reminder row (checkbox, number, unit `Select`), Cancel + accent "Save results".
  `/fingerboard-testing`: same header/empty/card pattern, cards with "N hangs · Results: N", "View" link, ✏️ 🗑️.
  `/fingerboard-testing/[id]`: back chevron, name, accent Perform test (full width on phones, header on `lg`), hang
  `ChoiceChip`s (only with 2+ hangs), chart + results card side by side on `lg`, `EmptyState` + CTA. New
  `FingerboardTestResultsTable` (shared; results now show notes in the modal too, Yes/No chips, localized dates, units).
  `FingerboardTestChart`: `Card`, title per metric, tokens via `var(--uc-*)` (first line in the fingerboard colour),
  hollow dots, custom tooltip, legend only with 2+ lines, Load/Time `SegmentedControl` (was a select), hang `Select` only
  with 2+ hangs and `showHangFilter` (false on the detail page); hang labels localized (were "2H CRIMP 20mm").
  `BottomSheet` got `size="lg"`. Hard-coded English in the modal, perform and testing forms replaced (new keys
  `fingerboard.hangNumber`, `protocolForm.hangs`, `fingerboardTesting.*`). Same data, handlers, alerts and API calls.
  Not checked logged-in in a browser.
- 2026-11-12: Step 3 · Profile & settings done. `/profile` is now a page (was a placeholder page with `UserProfile` as a
  modal opened on load; Close / ✕ only went to the dashboard): avatar (photo or initial, primary) + display name header,
  4-tab `SegmentedControl` (new `equalWidth={false}` so PL "Ustawienia" fits at 390px). Profile tab: 80px avatar + ghost
  Upload photo, dashed read-only Google / display name (hints now translated), `Select` timezone, `Input` Sheets URL,
  accent "Save profile" (was the footer Save on every tab; same handler). Cycle tab: success status bar, cycle length as a
  range slider 21–35 with the value on the right (widens if a saved value is outside), date `Input`, accent Save, ghost
  red "Disable cycle tracking" → inline confirm card Keep on / Disable (was `confirm()`), disabled state as dashed
  `EmptyState`. Settings tab: overline groups (App status, Privacy, Notifications) as divided `Card` rows; push is a
  checkbox (spinner while subscribing; was Enable/Disable button + ✅/❌), other ✅/❌ marks dropped; numbers and unit
  `Select` inline; "Notifications blocked" warning banner replaces the denied `alert()`. Export tab: stacked action rows,
  error banner below. New keys `profile.googleName`, `googleNameHint`, `displayName`, `displayNameHint`, `saveProfile`,
  `disableCycleTitle`, `keepOn`, `pushBlockedTitle`, `notificationsSection`. Same data, handlers and API calls. Not
  checked logged-in in a browser.
- 2026-11-12: Step 3 · Global UI done. `MessagesPanel`: full-screen on phones (back chevron, 28px title, accent unread
  count), right-hand drawer from `sm` (scrim/Esc close); ghost Mark all read / red Clear all (now a `ConfirmationDialog`,
  was `confirm()`); message `Card`s with an emoji icon tile, accent unread dot, red "High" chip for high priority,
  "Today, 08:00" / "Yesterday, …" / "Mon 9 Nov, …" timestamps (localized), text Mark read + tonal action button; same
  actions and handlers; `EmptyState`; count / last-updated footer kept. `OfflineIndicator`: warning / success banner on
  `--uc-warning-bg` / `--uc-success-bg`, "N pending" on the right, texts translated (were hard-coded English; new
  `offlineBanner.*` keys). `PWAInstallPrompt`: elevated card with the 🦄 tile, ghost Not now + accent Install; iOS
  variant with numbered step circles (the "1." prefix is stripped from the existing strings), Maybe later + primary
  Got it; the redundant ✕ was dropped (every variant has a dismiss button). `Tooltip`: inverted bubble (`--uc-text` on
  `--uc-bg`), kept inside a 16px gutter; opens on tap as well as hover and closes on outside tap / Esc (as the mock
  notes); new `tapToOpen={false}` keeps the calendar / cycle-day ⚠️ hover-only so a tap still opens the day.
  `LoadingSpinner fullScreen`: 🦄 tile + indeterminate bar + message; `AuthGuard` uses it (was an old gradient with
  "Loading..." hard-coded). `UserMenu`: 40px avatar trigger (name + chevron from `sm`, ring while open), header with
  avatar + online dot, 24px icon slots, 288px menu. `NotificationBell` lost its border. More sheet, tab bar, logged-out
  header and the Add choice sheet were already built (step 2 / Workouts / Calendar). New keys `common.yesterday`,
  `messages.priorityHigh`. Not checked in a browser.
- 2026-11-12: User approved tap-to-open tooltips (outside tap / Esc close); calendar / cycle day cells stay hover-only.
- 2026-11-12: Step 3 · Auth & landing done. New `components/AuthLayout` (`AuthShell` 400px column under the logged-out
  header, `LogoTile`, `AuthAlert` error/success, `AuthDivider`, `GoogleButton` (ghost, Google logo kept), shared
  `validatePassword` + live `PasswordRules` 2×2 ✓ / ○ grid). Sign in: logo tile, 28px title, `Input`s, "Forgot password?"
  beside the Password label, accent Sign in, divider, Google, "Don't have an account? Sign up" footer. Sign up / reset:
  same fields, live rules while typing, mismatch as `FieldError`, accent submit disabled until valid (as before).
  Forgot: success shows a ✉️ "sent" block under the form (form stays). Reset without a token: 🔗 error tile, title,
  message, primary "Request new reset link". Sign out: spinner + "Signing out...", then 🦄 tile, texts, accent "Go to Home
  Page" (auto-redirect kept). All hard-coded English errors / rules / messages now translated (`auth.errors.*`,
  `auth.passwordRules.*`, `resetEmailSent`, `resetSuccess`, `invalidLinkTitle`, `invalidLinkMessage`, `requestNewLink`).
  Landing (`/`): app-name pill, tagline split at " - " into headline + lead, accent Get started + "Free to use…", decorative
  phase ring (5 arcs in `--uc-phase-*`, 🦄 centre), the same 12 feature cards (now a data list: icon tile, title,
  description, bullets) in 1/2/4 columns, closing primary-container band with the existing unused `landing.readyToStart` /
  `ctaDescription` / `startTracking` texts → /dashboard. Same links and handlers. Not checked in a browser.
- 2026-11-12: Step 4 cleanup. No raw Tailwind palette, `dark:` variants or legacy names left in `src`: restyled
  `ErrorBoundary` (tokens + `buttonClasses`; texts stay English, it sits outside the language provider), `LanguageSwitcher`,
  the unused logged-out branch of `UserMenu`; removed the unused `getPhaseColor` from `lib/cycle-utils.ts`; removed the
  legacy `--color-uc-*` / `--color-training-*` aliases from `globals.css`; rewrote the palette / CTA / styling sections of
  `DEVELOPMENT_RULES.md` for the tokens. Hex left on purpose: `layout.tsx` theme-color meta (needs literals), stored tag
  colours in `TagSelector` / dummy data, the Google logo. Headless check (Playwright against the dev server) of landing +
  all auth pages in dark/light × EN/PL × 390/1280: no horizontal overflow, no page errors. Fix: the PL app name was cut
  off in the logged-out header at 390px; the flag is hidden on phones and the paddings tightened (still "…" at 360px).
  Found: logged out, `NotificationProvider` fetched workouts → 401 + console error (Next dev overlay "1 Issue" on every
  logged-out page) — fixed later the same day. (`pl-custom.json` "obecn_" is a deliberate they/them form, not a typo.)
- 2026-11-12: Step 5 · Icons done. User added 67 line icons (`public/icons/sprite.svg`, `svg/`, README). New
  `ui/Icon.tsx` (`<Icon name size label />`, `IconName`): paths generated from the sprite and inlined (offline, no request;
  regenerate if the sprite changes). `workoutIcon` / `WorkoutIcon`; `WorkoutIconTile` and `WorkoutTypeChip` default to the
  type icon (`icon={null}` hides it); `EVENT_TYPE_META[].icon` replaces `emoji`. Every UI emoji in `src` replaced (~400 in
  55 files) using the README table; hand/grip types, crimp 📏, field-label prefixes, 🚀 and 🦄 in texts dropped (text
  only); 🦄 brand tiles use `horn`. Emoji removed from 7 EN/PL strings (`quickLog.title`, `markAsDone`,
  `searchExercises`, `events.tip`, `stats.enableInjuryPhaseNotification`, `…AlreadyEnabled`, `tooltips.timeOfDay`) and
  from notification titles in `lib/*-notifications.ts` (the messages panel shows a type icon, chosen by action for
  general messages). Language picker flag → `globe`. `UserProfile` action rows got a `busy` spinner (was ⏳).
  `tsc` clean, lint unchanged (177 warnings, same as before), all routes compile. Logged-in screens not checked in a
  browser.
- 2026-11-12: User decisions recorded in `design/DESIGN_DECISIONS.md` (66 items); they override "visual only" for the
  Design / Mixed items. Building them in chunks, item numbers from that file.
- 2026-11-12: Decisions 2, 5, 29, 30, 32, 58, 64 built. Phone tab bar "Today" / "Stats" (new `nav.today`, `nav.stats`;
  sidebar unchanged, like the desktop mock). `UserMenu` trigger is the avatar only (+ online dot, name as `aria-label`).
  Tag creator uses the 10 `--uc-tag-*` swatches, stored as `var(--uc-tag-N, #hex)`. Incomplete-data dialog: "Some sets
  are empty" + one summary sentence ("2 sets in X and 1 hang have no values…") instead of the item list; new
  `tPlural(key, count)` in `LanguageContext` (`Intl.PluralRules`, keys `.one/.few/.many/.other`). Gym `WorkoutCard`
  shows an "N exercises" chip (`workouts.exercisesCount`). Fingerboard test chart defaults to Load. Sign out: "Sign in
  again" → `/auth/signin` (`auth.signInAgain`), no auto-redirect. 12 (shortcuts 3×2) waits for the user: which 6 links.
- 2026-11-12: Decision 12 built (user picked the links): dashboard shortcuts are one 3×2 grid (6 across on `lg`, no group
  headings) — Cycle, Exercises, Routines, Fingerboard, Strong Mind, Profile; icons now match the nav.
  Not checked logged-in in a browser.
- 2026-11-12: Decision 1 built. New `components/AddChoiceSheet` (the Workouts page's Add sheet, moved out and shared).
  Phone tab bar: Today, Calendar, accent "+" (`nav.log` "Log" / "Dodaj"), Stats, More; "+" opens the sheet and a choice
  pushes `/workouts?add=quicklog|workout|event`, where `AddParamHandler` (in `Suspense`) opens the form and replaces the
  URL. Workouts is reached via More / sidebar. Not checked logged-in in a browser.
- 2026-11-12: Decision 4 built. `MessagesPanel`: priority chips for high / medium / low (new keys `messages.priorityMedium`,
  `priorityLow`), tinted border on unread high (error) and medium (warning) cards.
