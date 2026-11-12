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
- [ ] Calendar — `Calendar — month.png`, `Calendar month — light.png`, `Calendar — week view & filters.png`
- [ ] Cycle — `Cycle.png`, `Cycle — disabled, period form.png`
- [ ] Statistics — `Statistics.png`
- [ ] Strong Mind — `Strong Mind.png`
- [ ] Events — `Events.png`
- [ ] Exercises — `Exercises.png`
- [ ] Routines — `Routines.png`
- [ ] Fingerboard protocols & testing — `Fingerboard protocols & testing.png`
- [ ] Profile & settings — `Profile & settings.png`
- [ ] Global UI (More, messages, menus, banners, install, loading) —
      `Global UI — More, messages, menus, banners, install, loading.png`
- [ ] Auth & landing — `Sign in, sign up, password, sign out.png`, `Landing page.png`

### 4. Finish
- [ ] Search for leftover hard-coded colors (`#`, `slate-`, `pink-`, …) and Montserrat.
- [ ] Remove the legacy `--color-uc-*` / `--color-training-*` aliases from `globals.css` once no
      component uses them; update the old palette section in `DEVELOPMENT_RULES.md`.
- [ ] Check dark + light, EN + PL, 390px and desktop on each screen.
- [ ] Update `design/MISSING_DESIGNS.md` (remove gaps the new mockups covered).
- [ ] Open a PR from `redesign/unicorn-climb` to `main`.

### 5. Icons (after the user delivers the custom SVGs)
- [ ] Add the SVGs as React components behind one `Icon` wrapper (`currentColor`, 24px).
- [ ] Map workout types, phases, nav tabs etc. to icons; replace the emoji icons screen by screen.
- [ ] Search for leftover emoji icons.

## Open points (decisions for the user)

Not built because they'd change or add behaviour. Details in `design/MISSING_DESIGNS.md`. Tick when decided and
note the answer.

- [ ] **Edit / Duplicate subtitles** in the workout sheet ("Gym · Mon 9 Nov", "Copy of Fingerboard · Mon 9 Nov —
      pick a new date"): show the original workout's type and date in the header?
- [ ] **Per-set validation** ("Enter reps for set 3", red empty cell): add inline errors for empty sets/hangs, or keep
      only the incomplete-data dialog on save?
- [ ] **Collapsible hangs** (one-line "Hang 2 · Both · open · 20 mm · +4 kg · 6 × 10 s" row): add collapse/expand?
- [ ] **Crimp size**: keep the fixed 6–30 mm list, or allow any number (mock shows a free "mm" field)?
- [ ] **Centre "+" tab**: today it opens Workouts. Should it open a Quick log / Add workout / Add event choice sheet?
- [ ] **Tab labels**: keep Dashboard / Statistics or switch to the mock's Today / Stats?
- [ ] **Workouts tab counts**: show the total from the API ("Workouts (214)") instead of the items on this page?
- [ ] **Numbered pagination** ("1 2 … 11", "1–20 of 214"): add jump-to-page, or keep Previous / Next?
- [ ] **Cycle — recent periods list with edit**: the API supports it but there's no UI. Build it in the Cycle step?

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
