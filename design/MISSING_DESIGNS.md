# Unicorn Climb — what the redesign is missing

Gap analysis between the Claude Design hand-off (`DESIGN.md`, `tokens.css`, the 10 PNGs) and the
features already implemented in the app (checked against the code, 2026-11-11).

Ground rule: **the redesign is visual only — no implemented functionality is changed, added or removed.**
So the designs need to (A) stop showing features the app doesn't have, and (B) cover every feature it does have.

Designs we already have: Style guide, Component sheet, Today (dark + light), Desktop Today,
Log workout — lead climbing, Calendar (dark + light), Cycle, Statistics.

---

## A. Designs show things the app does NOT do — please adjust these screens

### Today / Dashboard
- **"Log again" chips** — no such feature. (Closest: *Duplicate workout*, which exists on the calendar only.)
- **Streak = "weeks with ≥3 sessions"** — built 2026-11-12 (decision 7): weeks in a row (Mon–Sun) with 3+ workouts;
  the current week counts once it has 3 and doesn't break the streak before that. Shown on Today ("Streak · N weeks ·
  3+ sessions a week") and as Statistics' Current streak (from all workouts, not the selected range). The "Great streak"
  card shows from 2 weeks. Today computes it from the newest 100 workouts it loads (enough for ~30 weeks).
- **"This week 3 / 4 sessions" with an M–S day strip** — the app's "this week" is a **rolling 7 days**, with a
  % trend vs last week and a progress bar to the weekly goal (default 3). It also has a **This month** tile
  (count, trend %, bar to monthly goal), **Total workouts** and **Events count** tiles.
- **"This week's sessions" list** — the app shows **Recent workouts (last 3)**; row meta is type, TR badge,
  date and "N exercises / N hangs / Quick log" (no time of day, wall angle or style).
  User decision 2026-11-12 (#9): keep the app's Recent workouts; the mock's list won't be built.
- **Goals card with goals like "Max hang 20 mm +10 kg" / "Present or better on 80%"** — no such measurable goals.
  The goals that exist: weekly/monthly session goals (+ optional per-type "× per week"), and Strong Mind
  process/project goals (see B).
- **Shortcuts 3×2** — built 2026-11-12 (decision 12): one 3×2 grid (6 in a row on `lg`) without group headings:
  Cycle, Exercises, Routines, Fingerboard, Strong Mind, Profile. Workouts, Calendar and Statistics were dropped (they're
  on the tab bar / sidebar).
- **Phase hero card** — OK to keep (cycle day/phase/recommendations exist), but note the app's phase day ranges
  are **Menstrual 1–7, Follicular 8–12, Ovulation 13–16, Early luteal 17–20, Late luteal 21–end of cycle**
  (design says 1–5 / 6–12 / 13–16 / 17–22 / 23–28). Cycle length is configurable 21–35 days.
- Built 2026-11-12: hero card is shown (user decision) with the horizontal phase strip on phone **and** desktop —
  the desktop mock's cycle ring waits for the Cycle screen step. "Ovulation in ~N days" is shown as the existing
  "Next ovulation: <date>".
- **Cycle consent / setup** (decision 14, built 2026-11-12): mock texts, now translated (EN/PL, `cycle.consent.*`,
  `cycle.setupForm.*`): "Train with your cycle?" + description, 4 ✓ items, "Remind me if my period is late", Skip /
  Enable (the "Note: enable later" line is gone). Setup: back arrow (= cancel) + "Set up your cycle", "First day of your
  last period", 21–35 slider with "28 days", read-only timezone "Taken from your device.", Late-period reminders card,
  full-width "Save and continue" (Cancel button and "What happens next?" box dropped). Still a centred dialog / sheet
  over the Today screen, not a full page.
- **Offline workout form**: mock shows only date, type and notes; the app's form also has TR, sector, mental-practice
  fields, three 1–5 ratings, Strong Mind, gratitude/improvements — kept.
- Dashboard quick-log ⚡ floating button (phones) was dropped: it collided with the floating tab bar.

### Quick log
- Built 2026-11-12. The mock's date field reads "Today, Wed 11 Nov"; the app keeps the native date picker.
- The mock has no description line and no "(Optional)" markers; the app keeps both. "Time of day · pick any" isn't
  an existing string, so the label stays "Time of Day (Optional)".
- Optional TR / practice type: the mock doesn't show how to clear a choice; built as "tap again to deselect".
- "No protocols available" hint (Fingerboard without protocols) has no design.

### Log workout
- **Bottom sheet** — fine as a visual, but the form is much longer than shown (see B).
- **Route name field** (decision 22, built 2026-11-12): Lead Rock only, above Sector (both kept). Stored as
  `details.routeName` (no DB column / migration). Shown as a chip on workout cards and first in the calendar row meta.
- **Named climbs** (decision 23, built 2026-11-12): the climb heading is an inline text field with a pencil; empty shows
  and keeps "Climb N" (`climbSections[].name`, empty → not stored). Used in the mental-state summary and workout cards.
- **Time of day for lead climbing** — time of day exists **only for Mental practice**, and it's **multi-select**
  (Morning + Evening possible), not a single segment.
- **Phase pill next to the date** — the app shows a collapsible **Cycle information** panel instead
  (phase + recommendations for the chosen date). A pill is fine as a summary of it.
- **"Save session" + one-line summary sticky footer** — built 2026-11-12 (decision 25): footer is a muted one-line
  summary ("Lead Wall · Wed 11 Nov · TR4 · 2 climbs"; N exercises / N hangs for gym / fingerboard) + accent "Save session"
  ("Update session" when editing). Cancel was dropped; the header ✕ cancels.
- **Wall angle / style** (decision 26, built 2026-11-12): choice chips after Sector, single select, tap again to clear.
  Lead Wall / Lead Rock: Slab, Vertical, Slight overhang, Steep overhang (Prisma `Formation`); Bouldering: Slab,
  Vertical, Overhang, Roof, Comp style (`BoulderType`) + Style: Powerful, Technical, Comp style (`BoulderFormation`).
  The enums had no column, so values go in `details.wallAngle` / `details.climbStyle`; dropped on save when the type
  doesn't use them. Card chips show them. Not in the mock; no stats use them yet.
- Built 2026-11-12 against `Log workout — lead climbing (full form).png`. Kept where the mock differs:
  - No footer in the mock; the app keeps a sticky **Cancel + Save/Update** footer. Esc and scrim tap don't close
    this sheet (they never did; a stray tap would lose a long form).
  - **Mental state summary** in the mock is a text field; in the app it's a read-only summary built from the
    before-climbing rating and each climb (focus state, fall, comfort zone). Styled as a summary card.
  - The mock's climb notes show "[object Object]" (mock bug); built as a normal text area.
  - Climb **remove** is a trash icon in the mock; stays the text button "Remove Climb" until the custom icons land.
  - **Recurring** in the mock is one checkbox row; the app's is a collapsible card (enable checkbox, dates,
    frequency, preview) — the gym/fingerboard/recurring mock is the reference for its insides.
  - Section headers keep their one-line descriptions (not in the mock) and show a summary on the right
    (phase · cycle day, "N selected" goals, "3 · Neutral", TR label).
  - Before-climbing rating shows 1–5 with "Very Nervous" / "Very Confident" under the ends, as in the mock; the
    label of the chosen value shows in the Strong Mind header.
- Built 2026-11-12 against `Log workout — gym, fingerboard, mental, tags, recurring, dialogs.png`. Kept where the mock differs:
  - **Edit / Duplicate subtitles** ("Gym · Mon 9 Nov", "Copy of Fingerboard · Mon 9 Nov — pick a new date") aren't
    shown: the sheet keeps its titles (with emoji). Adding them means showing the original workout's type/date in the
    header — user's call.
  - **Per-set validation** built 2026-11-12 (decision 19): after a save attempt that hits empty sets, the reps cell of
    every set without reps is red and "Enter reps for set 3" / "…for sets 2, 3" shows under the exercise (clears as you
    type). A set now counts as empty when it has no reps, even with a weight (was: no reps and no weight), so the dialog
    and the inline errors agree. Hangs keep only the dialog.
  - Exercise "Last:" line stays "Last: 10×5" (the mock adds "kg" and the date).
  - Set table columns are reps · kg · RIR as in the mock; the RIR ℹ️ help moved from the input to the column header.
  - **Hang title** stays "#1 🤲 Both hands · Crimp 20mm" (no "Hang 1" string exists). **Collapsed hang rows**
    ("Hang 2 · Both · open · 20 mm…") — hangs don't collapse; every hang shows its fields.
  - **Crimp size** stays a select of the fixed sizes 6–30 mm (mock shows a free number field with "mm").
    Hand and grip are segments with their emoji; the Polish crimp label wraps to two lines.
  - Load hint text stays the app's "negative for unload" (mock: "Negative load = assisted (unloaded) hang.").
  - **Tag creator**: no "Name" label (no fitting key; the input keeps its "Tag name" placeholder); buttons stay
    "Cancel" / "Create". Colours: the mock's 10 `--uc-tag-*` swatches since 2026-11-12 (decision 29), stored as
    `var(--uc-tag-N, #hex)` so they follow the theme; tags created earlier keep their old hex colours.
  - **Recurring**: the mock's header checkbox is the app's collapsible card + "Make this workout recurring" checkbox.
    Frequency is Daily / Weekly / "Every N days" segments; the N-days input shows below when that segment is picked.
  - **Incomplete-data dialog**: design copy since 2026-11-12 (decision 30): "Some sets are empty" + "2 sets in Weighted
    pull-up and 1 hang have no values. Empty rows won't count in your stats." (the item list is gone; plural forms via
    the new `tPlural`). "Go back & fill" is the filled button as in the mock. The shared `ConfirmationDialog` now shows its icon in a tinted tile above the title, with
    equal-width buttons — this applies to every confirmation in the app.
  - Load routine / Load protocol pickers are bottom sheets now (no design; "Start from routine" in the component
    sheet used as reference).

### Workouts list & goals
- Built 2026-11-12 against `Workouts list & goals.png`. Kept where the mock differs:
  - Tab counts and numbered pagination ("‹ 1 2 … 11 ›", "1–20 of 214") built after the user's go-ahead (2026-11-12).
  - Header keeps the description line; Goals / Info show their labels next to the icon from `sm` up, icon only on phones.
  - **Info panel**: same 6 training types as before (no Fingerboard row — there's no description key for it) and the 4
    event types with their own descriptions (no Trip) + the tip; not the mock's one-line event summary.
  - **Workout card**: TR, routine–variation, sector, practice type, time of day and tags as chips; ratings as 5 dots in
    `--uc-primary`; Strong Mind recap + gratitude/improvements in one inner block (focus/zone words in their scale
    colours). Field labels "Training volume" / "Variation" / "Practice type" moved to tooltips. "Pre-session feel",
    "Gratitude", "Improvements" stay hard-coded English. Before-climbing rating and reflections are still shown.
    Edit/delete keep their emoji until the custom icons land.
  - Gym cards show the mock's "5 exercises" chip (decision 32, 2026-11-12).
  - **Add choice** is a bottom sheet with 3 tiles; its Cancel button was dropped (✕, Esc and scrim close it, as in Quick log).
  - **Goals configurator**: sheet keeps the 🎯 title, description and a Cancel + Save footer. Weekly goal keeps range +
    number input (mock: − slider +). Monthly auto/manual is now a segmented control (was a checkbox; new keys
    `goals.auto` / `goals.manual`); manual shows the 1–40 slider + input. Per-type goals stay in a collapsible card with
    a type select + count input + "× tydz." (hard-coded PL, as before) and 🗑️; a dot in the type colour leads each row.
    Preview keeps its weekly / monthly / breakdown rows rather than the mock's one-line summary.
  - Events tab cards (`EventCard`) are untouched here — they're the Events step.

### Deload event (user request 2026-11-12, no design)
- New event type **Deload** (rest / lighter training over several days). Icon: battery with one bar; colour: the blue
  `--uc-tag-5` (outline tile, tinted when selected). Form: Start date + End date (required, start prefilled with the chosen
  day), hint "A rest period: lighter or no training on these days.", "Plan & notes" text. Title is stored as "Deload".
- Calendar: dashed blue line along the bottom of every deload day (above the trip line when both); day sheet / week view
  row "Deload · 2/5"; Upcoming events shows it until its last day. Event card: date range as title + "N days".
- Stored like trips: `tripStartDate` / `tripEndDate` (columns keep their names); new enum value via migration
  `20261112_add_deload_event_type`.
- **Streak** (user decision): a Mon–Sun week with any deload day pauses the streak — it doesn't break it and doesn't add
  to it (unless it reached 3+ sessions anyway). Applies to Today and Stats; the rule line reads "3+ sessions a week ·
  deloads pause it".
- **Today**: while a deload runs, a card "Deload · day 2/5" + "Rest and recover. Your streak is paused, not broken." (and
  the deload's notes) replaces the "Time to train!" nudge.
- **Stats**: deload days and the workouts on them are left out of the per-week numbers (Avg per week, workout-type and
  tag frequency, Gym variation frequency); totals and percentages still count everything. Weekly volume: deload weeks
  are blue bars, named in the tooltip, not in "Avg per week", with a note under the chart.

### Calendar
- **Upcoming events list** (decision 33, built 2026-11-12, no mock): "Upcoming events" section under the legend card
  (right column on `lg`): the next 5 events from today, trips while they last; follows the event filters. Row = event
  badge, "Type · title" (trips: destination), date or date range, and "Today / Tomorrow / In N days" on the right; tap
  opens the event form. Empty: dashed "No upcoming events".
- **Selected-day detail** — user decision 2026-11-12: month cells show dots like the mock; tapping a day opens the
  existing Add sheet, which now lists that day's events (tap = edit) and workouts (edit, duplicate) above the
  Quick log / Add workout / Add event tiles. The mock shows the detail as an inline panel; ours is a sheet.
- **Goal-achieved trophy** (user request 2026-11-12, no design): a day with a workout that marked a process goal
  achieved or a project goal completed shows a small green trophy (`achieved` icon, `--uc-success`) before the workout
  dots in the month cell; week view / day sheet workout rows get a green "Goal achieved" chip after the type name; the
  legend lists it with the event types.
- Built 2026-11-12. Remaining differences:
  - **Filters** (decision 34, built 2026-11-12): "Show workouts" / "Show events" checkboxes (unticked hides them from the
    calendar and the day sheet; that type list hides too), both type lists stacked, footer ghost "Reset" (clears
    everything; in the footer, not the header as in the mock) + primary "Show results" (filters still apply instantly).
    Mock's "All workouts are hidden" warning: the app's "None" still means *show all*, so the app's own note stays.
  - **Today** button (jump to current week/month) is kept next to the Week/Month switch; the mock has none.
  - **Event badges**: one badge per day cell (first non-trip event); all events are in the day sheet. Trips are a
    green line along the bottom of each trip day (as in the mock) rather than a badge.
  - **Injury-risk phase**: the app marks every day of the phase (small ⚠️ in month cells, "Injury-risk phase" chip
    in week view, warning text in the day sheet); the mock shows a single badge.
  - **Week view** on desktop stays one stacked column (mock is mobile only). Empty days show only their header.
  - Week card meta: routine — variation, sector, notes (no TR / Strong Mind count like the mock; the old chips
    didn't show them either). Injury severity dots aren't shown.

### Cycle
- **Log symptoms** — doesn't exist.
- **Flow intensity** (decision 38, built 2026-11-12): new nullable `Period.flow` (1 light, 2 medium, 3 heavy; migration
  `20261112_add_period_flow`). Period sheet: "Flow" with Light / Medium / Heavy chips (optional, tap again to clear).
  Recent periods: 3 rising bars in the menstrual colour after the date. One value per period, not per day.
- **Avg cycle / Avg period / Logged tiles** (decision 39, built 2026-11-12; not in the mock images we have): one card
  with 3 columns under Add period / the injury warning, shown once a period is logged. Avg cycle = mean days between
  consecutive period starts (gaps under 15 or over 60 days are skipped as missed logging); Avg period = mean start–end
  length, inclusive (periods without an end date skipped); "–" when there's nothing to average. The cycle-length
  setting isn't changed by these numbers.
- **Train / Recover rows in guidance cards** — phase cards have **Physiology, Impact, Goal, Tips** and an
  injury count instead.
- Built 2026-11-12 against `Cycle.png` and `Cycle — disabled, period form.png`. Kept where the mock differs:
  - **Recent periods** list isn't in the mock; built by user decision (rows: date range + notes, tap → Edit sheet,
    5 shown + "Show all"). Needs a design.
  - Calendar cells keep the date **and** the cycle day (with "~" before the last confirmed period, as before); the mock
    shows the date only, with "~" on future days. Days of the previous/next month aren't shown.
  - The mock's "Injury" legend item and per-day injury dot don't exist; the app marks the **most-injury phase** with ⚠️.
  - The ⚠️ forecast-style dashed ovulation cells aren't used: ovulation is the band colour, predicted menstrual days
    are dashed.
  - Phase cards show the injury chip only when there are injuries (mock shows "0 injuries"); "days 1–7" comes from the
    static phase texts as before (the injury warning uses the real ranges for the cycle length).
  - No back arrow in the header (screens are reached from the tab bar / More).
  - Delete in the period sheet asks for confirmation (dialog not in the mock).

### Statistics
- **Range 4W / 3M / 6M / 1Y** — built 2026-11-12 (decision 42): those four segments (PL 4T / 3M / 6M / 1R), default 4W
  (last 28 days, new `4weeks` timeframe). 1 week, 1 month and All time are gone from the Statistics screen.
  The second selector "show frequency per Week / Month / Quarter / Year" stays.
- **Volume in TR points, weekly volume bar chart** (decision 43, built 2026-11-12; no mock of the chart): "Weekly volume"
  card under the types/tags grid. TR1 = 1 … TR5 = 5 points; workouts without TR don't count. Header: Total + Avg per
  week; bars per Mon–Sun week over the range (primary, 4px top radius), hover tooltip "3 – 9 Nov 2026 · 12 TR points ·
  4 sessions", sr-only table. The TR1–TR5 count breakdown stays.
- **Performance by cycle phase (avg session rating 1–5)** — no session rating exists; don't show.
- **Fingerboard test chart on Statistics** (decision 45, built 2026-11-12): "Fingerboard tests" card next to Weekly
  volume, hidden without test results. Reuses `FingerboardTestChart` (new `plain` prop: no inner card) for one test
  protocol — the most recently tested; a select switches when there are several. Shows **all** tests, not only the
  stats range (tests are weeks apart). Link "Open test protocol →".
- Tiles that exist: **Total workouts, This month, Avg per week, Current streak**.
- Mock's **"Current streak · 5 days"** unit and **"11 climbing workouts with a TR value"** subtitle aren't shown (no
  keys / not computed); the app's extra lines are kept: Strong Mind link card, "Each phase shows…" note, notification
  hint text, gratitude section description.
- Gratitude feed: the mock's heart / trend icons are the existing ✨ / 📈 until the custom SVGs land.

### Strong Mind
- Built 2026-11-12 against `Strong Mind.png`. Kept where the mock differs:
  - **Goal progress dots on the card's meta line** — the app has no per-goal progress summary; each card keeps its
    "Linked workouts (N)" list (date · type · 1–3 dots per workout). Project cards use the same list for every
    workout linked to the project, with a "🏆 Achieved!" chip on sessions where it was sent (earlier only sends were
    shown, so linked-but-not-sent workouts appeared nowhere), and still have edit/delete (the mock shows none on
    project cards).
  - Process / Project goals were sub-tabs with inline forms; now both lists sit on the Goals tab (side by side on `lg`)
    and the forms open in bottom sheets from "+ Add" / ✏️ (Esc/scrim don't close them). Form titles and button
    labels keep the existing strings ("Add New Goal", "Add Goal") instead of "New process goal" / "Save goal".
  - The form's "Timeframe: 6 weeks (starting from …)" preview line was dropped (same values are in the fields); the
    long-term rule hint stays under the "Classified as" pill. Long-term pill is solid primary, short-term tonal.
  - Grade system ("FRENCH") is no longer printed on project cards; the grade tile uses the Lead wall (route) /
    Bouldering (boulder) workout colour as in the mock.
  - Gratitude tab keeps two sections (gratitude, then improvements) with their headings and empty states with a CTA;
    the mock pairs both notes of a workout in one 2-column grid and has a single "No entries yet" empty state.
    Card meta is "date · workout type · 📍 sector" (mock: "date · sector").
  - Statistics tab: the extra tiles show only when there are sessions / falls (as before), with a dashed note
    instead of the mock's separate empty-state card. Delete uses the app's confirmation dialog (was `confirm()`).
  - Page subtitle and the per-section descriptions are kept; icons are the existing emoji.

### Events
- Built 2026-11-12 against `Events.png`. Kept where the mock differs:
  - **Trip countdown "23 days"** — the card shows "Countdown · Enabled" (as before). User decision 2026-11-12: the
    days-to-go number is shown only on the dashboard, not repeated on the event card.
  - **"Delete event" inside the edit form**: built 2026-11-12 (decision 49) on Events, Workouts and Calendar (Calendar had
    no event delete before); the card's delete stays. Both use the existing "Delete Event" confirmation, not the mock's
    trip-specific text ("Delete “Frankenjura”? … Keep").
  - Trip card title stays the saved title ("Frankenjura Trip"); the destination is printed separately only when the
    title doesn't contain it. Trip type tile reads "Sport Climbing" / "Bouldering" (mock: "Sport").
  - Severity shows 5 dots (the app's 1–5 scale; mock shows 3). Severity and status are only shown when set — the form
    has no fields for them (it never had).
  - Event type tiles use the existing emoji (🤕 🏥 🏆 ✈️ 📅) and the translated `events.types.*` names ("Physio", not
    "Physio Visit"); 3 per row as in the mock.
  - Cycle-day hint keeps the app's text ("Based on cycle calculation (28 days), this is cycle day 22. If you use…"),
    not "Calculated from your cycle: day 22 (late luteal)…"; ℹ️ tooltips and the "Manually set" note are kept.
  - Countdown checkbox row keeps its description line; the old quoted preview ("days to go destination: XX days") was dropped.
  - Description is the last field for every type (it sat above the trip fields).
  - Page subtitle and the empty state's longer description are kept.

### Exercises
- Built 2026-11-12 against `Exercises.png`. Kept where the mock differs:
  - **Category presets** stay the app's 13 (Upper Body, Lower Body, Core, Pull, Push, Legs, Back, Chest, Shoulders, Arms,
    Climbing Specific, Cardio, Other), not the mock's set (Antagonist, Mobility, Grip, Plyo, Full body…). Custom category
    stays an always-visible text field under the chips instead of a "+ Custom" chip.
  - Library filter chips are built from the categories of the user's exercises (as before), not a fixed list.
  - **Quick add** is a collapsible card (closed by default, closes after adding, as before). Groups follow the app's list
    (Pull, Push, Lower body, Core, Climbing specific; mock: Pull, Push & Antagonist); the count is exercises not yet added
    (26 in the list, mock says 30). Exercise names stay English.
  - Header keeps the "Exercise Library" title, subtitle and the 👯 Add Routine link (ghost button, label from `sm`).
  - Exercise count line ("12 exercises matching …") kept above the list; grid/list toggle keeps its emoji icons.
  - Exercise empty state keeps the app's texts (not "Your library is empty · Start with Quick add or create your own").
  - **Detail · Status** (decision 52, built 2026-11-12): Improving / Tracking / New. "Improving" (`quick-stats` returns
    `improving`): best set of the last 3 sessions beats the best of the 3 before (est. 1RM; max reps when there's no
    weight), needs 4+ sessions and use in the last 42 days. Independent of the chart timeframe. PL "Postęp".
  - Personal-record tiles keep their date line and emoji.
  - **Progression footer** (decision 53, built 2026-11-12): "Start 6 kg · Now 10 kg · +67%" from the first and last
    session in the period for the **selected metric** (reps metric uses "reps" / "powt."); shown from 2 sessions. A
    smaller "Workouts N · Sets N" line stays under it; the old half-vs-half "Improvement % / Weight change" is gone
    (keys kept, unused). Timeframe default stays 1 month (mock: Last 3 months); "N workouts in this period" line kept.
  - Recent workouts list every set ("5×10kg, 5×10kg, …") plus "N sets", not the compact "3 × 5 @ 10 kg"; rows still link
    to /workouts.

### Routines
- Built 2026-11-12 against `Routines.png`. Kept where the mock differs:
  - **Variations are edited in their own sheet** (Add / Edit Variation, listed as rows with ✏️ ✕), not inline cards
    inside the routine form. The variation sheet puts Min reps / Max reps / Default sets in one row as in the mock.
  - **Load routine → variation** (third panel): the in-workout picker (restyled in the Log workout step) still loads on
    one tap of a variation; the mock's two steps (radio "choose variation", "Step 2 of 2", then "Load into workout") would
    change the flow, so it's not built.
  - Exercise picker keeps Cancel next to "Add Selected (N)"; the footer appears only once something is selected (as
    before). Select all / Deselect all became one checkbox row ("Select All (N)").
  - Header keeps "My Routines" + subtitle; the accent "+" shows "Create Routine" from `sm`. Variation chips on the cards
    keep the rep range ("Strength 3–5 reps"). Every card uses the gym icon tile (🏋️), as routines have no type.
  - Header has a back chevron to the Exercise Library (same as on Exercise detail); the mock has none, and the page
    otherwise had no way back to Exercises.
  - Save button keeps "Create Routine" / "Update Routine" (mock: "Save routine"); field labels keep the app texts
    ("Routine Name", "Description (optional)").

### Fingerboard protocols & testing
- Built 2026-11-12 against `Fingerboard protocols & testing.png`. Kept where the mock differs:
  - **Two pages stay two pages**: `/fingerboard-protocols` (training protocols + Test yourself card) and
    `/fingerboard-testing` (testing protocols list). The mock shows both lists on one "Fingerboard" screen; merging them
    would change navigation, so it's not built. Titles stay "Fingerboard Protocols" / "Fingerboard Testing Protocols".
  - Protocol cards show "N hangs" + description, not a derived "3 hangs · both hands · crimp" summary.
  - **Hangs are edited in their own sheet** (Add / Edit Hang) and listed as rows ("Hang 1" + "Both Hands · Crimp · 20mm ·
    +6 kg · 6 reps · 10 s") with ↑ ↓ ✏️ ✕, as in the mock; the sheet keeps all fields (custom description, notes, crimp
    `Select` with the fixed 6–30 mm list).
  - **Test yourself**: "Step N of 3" bar shows 1 on Choose and 3 on Results; Create and Perform open their own sheets
    (no bar there, Perform is also used on the detail page). Clone opens a small "Clone protocol" sheet (name prefilled "Name (Copy)", Cancel + Clone) since 2026-11-12
    (decision 57); the mock has no frame for it.
  - **Perform test**: Success is a Yes / No segment that can be left empty (tap again to clear), in the primary colour
    (mock: green Yes). Notes is one line. A Cancel button sits next to "Save results". The load-unload hint is one line
    under the hang cards.
  - **Detail**: hang filter chips only when the protocol has more than one hang; the chart's own hang `Select` is hidden
    there (the chips filter it). Chart metric defaults to Load, as in the mock (decision 58). The results table keeps a Hang column and
    the year in the date; header labels keep the app's texts ("Load (kg)", "Success").
  - New test protocol: "Load from protocol" is a full-width tonal button above the hang list; hang targets are edited in
    the hang sheet (Target load / Target time), not inline in the form.

### Profile & settings
- Built 2026-11-12 against `Profile & settings.png`. Kept where the mock differs:
  - **"Member since March 2025"** (decision 59, built 2026-11-12): `/api/user` returns `createdAt`; the header shows
    "Member since <month year>" (PL "Dołączono: <miesiąc rok>"), falling back to the profile description until it loads.
  - **Display name** (decision 60, built 2026-11-12): editable, saved as `User.nickname` with "Save profile" (max 50,
    empty = first word of the Google name, shown as the placeholder). `/api/user` now returns `nickname`, so the Today
    greeting and the user menu use it (they already read it, but it was never returned). Google name stays a dashed
    read-only field. Timezone keeps its four options.
  - **Privacy → "Anonymous usage data" checkbox** doesn't exist: the app shows a static "Data collection · Enabled"
    row. Cycle tracking shows "Enabled" or the tonal Setup button.
  - **Disable cycle tracking** (decision 62, 2026-11-12): checked first — it only clears the last period date; logged
    periods stay. Confirm copy is now the mock's ("Phases and recommendations will be hidden. Your logged periods are
    kept."). Disabling no longer resets the timezone to Europe/Warsaw or the cycle length to 28.
  - Inactivity reminder and test reminders keep their own on/off checkboxes; the days / interval rows appear only when
    they're on (mock shows the value rows always).
  - The "Notifications blocked" banner shows when the browser permission is denied (on load or when enabling push).
  - Export rows keep the 📊 / 📈 emoji until the custom download icon arrives; dev-only tools stay below them.
  - The page has no Close button any more (it's a page, not a modal); Save profile still returns to the dashboard.

### Global UI
- Built 2026-11-12 against `Global UI — More, messages, menus, banners, install, loading.png`. Kept where the mock differs:
  - **Message icons** stay the existing emoji per type (🔄 cycle reminder, ⚠️ period overdue, 🏋️ workout / inactivity,
    📢 general); the mock's droplet / retest / bolt / mental icons wait for the custom SVGs. There's no separate "retest"
    or "mental practice" message type — those messages come in as `general` with their action button.
  - **Priority**: every priority has a chip since 2026-11-12 (decision 4): High (error), Medium (warning), Low (muted);
    unread high / medium cards also get a tinted border. Unread is the accent dot before the title.
  - The panel keeps its footer ("N messages · N unread", "Last updated") and the unread count next to the title; the
    mock has neither. Clear all asks for confirmation (dialog not in the mock).
  - **Offline banner** keeps the "saved locally and synced…" line under "You're offline"; "Back online" has no
    "· synced" (sync is reported separately by the offline sync toasts). The mock's wifi-off / check icons are a dot for now.
  - **Install prompt** keeps the app's description ("Install this app on your device…", not "Log at the crag, even
    without signal.") and title. iOS variant keeps the three steps and "Maybe later"; its title is the shared
    "Install Unicorn Climb" + "To install this app on your iPhone:" (no "Add to Home Screen (iPhone)" key).
  - **User menu**: flag emoji for Language and no sign-out icon until the custom SVGs land. The trigger is the avatar
    only, as in the mock (decision 5; the name is its accessible label).
  - **Loading**: message is the screen's own text ("Loading..." / "Loading workouts..."), not "Loading your training…";
    the bar is indeterminate (there's no real progress to show).
  - ℹ️ tooltip triggers are still the 14px emoji; tooltips on calendar / cycle day cells stay hover-only so tapping the
    day keeps opening it.

### Auth & landing
- Built 2026-11-12 against `Sign in, sign up, password, sign out.png` and `Landing page.png`. Kept where the mock differs:
  - Titles keep the app's strings ("Sign In", "Create Account", "Forgot Password?", "Reset Password", "Successfully logged
    out"), not "Welcome back" / "Reset your password" / "Choose a new password" / "You're signed out · See you at the wall".
  - Placeholders, the signup "Full name" field and the "Or continue with" divider on sign up are kept; the Google button
    keeps its colour logo and "Sign in / Sign up with Google" label.
  - Forgot password: the form stays visible after sending; the sent block shows the app's message (no "Check your inbox"
    heading or "expires in 1 hour" line — the app doesn't know the expiry).
  - Reset: the link is checked on open since 2026-11-12 (decision 65, `GET /api/auth/reset-password?token=`): expired →
    "This link has expired" + "Reset links work once and for 1 hour. Request a new one."; unknown / used / missing →
    the invalid-link screen. If the check fails, the form shows and the server checks the token on submit. The "invalid link" screen title is new copy (`auth.invalidLinkTitle`); the button stays
    "Request new reset link" → forgot-password.
  - Reset success keeps the success alert + automatic redirect to sign in after 3 s.
  - Sign out: accent "Sign in again" → sign in, as in the mock (decision 64); the 2 s auto-redirect to `/` and the
    "Redirecting…" line are gone (they'd leave before the button could be used). Title and message stay the app's (63).
  - **Landing**: copy stays the app's (tagline, "What You Can Track", feature texts); the mock's pill "Training diary for
    climbers" shows the app name; "Your next session is the first entry." band uses the existing "Ready to Start Your
    Journey?" texts. Feature cards keep their bullet lists (mock: one line each) and emoji icons; order kept.
  - Get started still links to /dashboard (with the 🚀).

### Navigation
- **Centre "+ Log" tab** — built 2026-11-12 (decision 1): the accent "+" ("Log" / "Dodaj") opens the shared
  `AddChoiceSheet` (Quick log / Add workout / Add event); each choice goes to `/workouts?add=…`, which opens that form.
  Workouts left the tab bar (still in More and the sidebar). Desktop has no "+" (the sidebar has no add action).
- **Tab labels** — the phone tab bar says "Today" / "Stats" (PL "Dziś" / "Statystyki"), as in the mock (decision 2);
  the desktop sidebar keeps Dashboard / Statistics like the desktop mock.

### Components
- **Toast with "Undo"** — built 2026-11-12 (decision 3) for deleting a workout or an event (after the existing
  confirmation): the item disappears at once, "Workout deleted · Undo" shows for 5 s, and the server delete runs only
  when the toast closes without Undo (timeout or ✕). If the tab is closed within those 5 s, nothing is deleted. Other
  deletes (routines, exercises, protocols, periods) have no Undo.

---

## B. Implemented features with NO design yet — please design these

### Global
- **Navigation content** for logged-in users: Dashboard, Workouts, Calendar + Exercises, Routines, Fingerboard,
  Statistics, Strong Mind, Cycle. (Events, Fingerboard testing and Profile are not in the nav today — "More" sheet
  should include them.)
- **Logged-out header**: logo, Home, Sign in.
- **User menu**: avatar (photo or initial) with online/offline dot, name; Profile, Language EN/PL, Sign out.
- **Notification bell** with unread badge ("99+").
- **Messages panel**: Mark all read, Clear all, empty state; message item with type icon (cycle reminder,
  period overdue, workout reminder, inactivity), priority, timestamp, Mark read, action button
  (Mark period started, Update period date, Log workout, Log mental workout, Log climbing, Perform test).
- **Offline banner** ("You're offline · N pending" / "Back online").
- **PWA install prompt** (Install / Not now) + iOS "Add to Home Screen" instructions variant.
- **Choice sheet** "Quick log / Add workout / Add event" (used from Calendar and Workouts).
- **Tooltip / info popover** for ℹ️ help next to fields (must work on tap).
- **Full-screen loading** state in the new theme.
- **Light mode versions** of every screen below.

### Today / Dashboard extras
- **Cycle consent modal** (what's included, late-period reminders checkbox, Skip / Enable) and
  **Cycle setup form** (last period date, average cycle length 21–35, timezone read-only, reminders).
- **Suggestion cards** ("Great streak!", "Time to train!" + Quick log).
- **Upcoming trips countdown** (destination, Bouldering / Sport climbing, "N days to go").
- **Recent events** (last 3) with empty state.
- **PWA / offline status**: alert bar (Offline / Unsynced data), Connection, Storage (KB + bar),
  Sync status (N waiting) + "Add offline training".
  - **Refused offline workouts** (added 2026-11-12, no design): one red row per offline workout the server refused,
    under the alert bar: "Couldn't be saved · <date>", the server's error, and a "Discard" text button that asks
    for confirmation (danger dialog) before deleting it from the device.
- **Offline workout form**.

### Quick log (modal/sheet)
- Date, 7 type chips, Fingerboard → protocol select + TR, Gym → TR, Mental → practice type + time-of-day multi-chips,
  "Mark as done".

### Log workout — all the other variants and sections
Order in the app: Date → Type (7) → Tags → Cycle information (collapsible) → Goals (collapsible) → Training volume
→ type-specific → Notes → Gratitude (collapsible) → Strong Mind (lead) → Recurring (create only) → Cancel / Save.
- **Edit** and **Duplicate** titles/states.
- **Tags**: selected chips with ×, available chips, "Create new tag" inline form (name + 10-colour swatch picker).
- **Goals linking**: checkboxes for process goals and project goals, then a "Goal progress" block for the linked
  goals: progress 1–3 per process goal, 🏆 "achieved in this session" toggle per project goal.
- **Training volume TR1–TR5** shows only for Bouldering, Circuits, Lead rock, Lead wall.
- **Sector** text field: Bouldering, Circuits, Lead rock, Lead wall.
- **Gym — Exercises & sets**: Load routine (routine → variation picker), Add exercise (search, create new),
  exercise card with "Last: weight×reps" and "View progress", set rows (reps, weight kg, RIR 0–5), add/remove set,
  empty state.
- **Fingerboard — Hangs**: Load protocol, Add hang; hang card with reorder ↑↓ and delete; fields hand (one/both),
  grip (open/crimp/sloper), crimp size 6–30 mm, description, load kg (negative = unload), reps, time s, notes.
- **Mental practice**: practice type (Meditation / Reflecting / Other), focus level 1–5, time of day multi-select.
- **Strong Mind block (lead)** — collapsible: "How did I feel before climbing?" 1–5 (Very nervous → Very confident);
  per climb: focus state, **"Did I take any falls?" Yes/No**, comfort zone, **climb notes**, remove;
  **Other reflections**; **Mental state summary**.
- **Gratitude**: "3 things I am grateful for", "3 things to do better next time".
- **Recurring workouts**: enable, start/end date, Daily / Weekly / Every N days, "This will create N workouts".
- **Incomplete data dialog** (sets/hangs without values — Go back & fill / Save anyway).
- Inline validation errors.

### Workouts list (/workouts) — no design
- Header with Goals 🎯, Info toggle, Add.
- Collapsible info panel (training types & event types explained).
- Tabs **Workouts (n) / Events (n)**, pagination (20 per page), empty states.
- **Workout card**: type, ⚡ Quick badge, date, tags, edit/delete; TR, routine–variation, sector, practice type,
  time of day, focus level dots, pre-session feel dots, day-after tiredness dots, notes, Strong Mind recap,
  gratitude/improvements.
- **Goals configurator**: weekly goal (1–10), auto monthly (×4) or manual monthly (1–40),
  per-type goals ("Bouldering × 2 per week"), preview.

### Cycle extras
- **Cycle-tracking-disabled** state ("enable in profile").
- **Cycle month calendar** (confirmed period, predicted menstrual, ovulation, "~ forecast", injury marker);
  tap a day → add period.
- **Add/edit period form**: start date, end date (optional), notes.
- **Injury warning banner**: "Most injuries in X phase — N of M injuries on days a–b" + advice.
- **Phase cards**: Physiology, Impact, Goal, Tips, injury count, highlight for the most-injury phase.
- **Cycle info card inside the workout form** (day, phase, fertile window, next period, next ovulation, top tips).

### Statistics extras
- Timeframe + frequency-period selectors; empty state "No statistics yet" + CTA.
- **Workout types** cards (%, count, frequency; Gym shows top routine variations).
- **Tags** breakdown (colour, %, count, frequency).
- **Training volume** TR1–TR5 counts and %.
- **Injuries by cycle phase**: totals (injuries, days since last, max per phase, phases affected), 5 phase tiles,
  "most injuries" callout with **"Notify me 1 day before this phase"** button.
- **Gratitude & improvements** feed with All / Gratitude / Improvements filter.
- Footer: date range + last updated.

### Strong Mind — whole screen, no design
- Tabs: **Goals / Gratitude & improvements / Statistics**.
- **Process goals**: form (duration 1–12 + unit days…years, start date, description, live Long-term / Short-term
  pill), lists split Long-term / Short-term, card with edit/delete and linked-workout progress (1–3 dots).
- **Project goals**: form (Route / Boulder, grade system French / Polish / YDS or French / V-scale, grade, name,
  sector, linked process goal), card with grade, name, location, link, "🏆 Achieved!" history.
- **Achieved goals** (added 2026-11-12, built without a design): section under process/project goals listing
  achieved goals of both kinds with "Achieved <date>" badge and edit/delete; edit sheets get a "Goal achieved"
  toggle + date; the workout form's goal progress gets a trophy toggle for process goals too (project goals had one).
- **Gratitude tab**: filter + card grids, empty states.
- **Statistics tab**: timeframe; Mental practice (sessions, avg focus, days since last, meditations);
  Falls (total, climbing sessions, falls per session, days since last fall); empty states.

### Events — whole screen, no design
- List grid, empty state ("Track injuries to see patterns with your cycle"), Add.
- **Event form**: type picker (Injury, Physio, Competition, Trip, Other) with per-type fields —
  Injury: body part, **cycle day** (calculated hint, manual override 1–50), date, description;
  Physio / Competition / Other: location, date, description;
  Trip: start + end date, destination, climbing type (Bouldering / Sport climbing), "Show countdown on home".
- **Event card**: type, date, title, tags, time, location; trip details; injury severity dots, status chip,
  cycle-day chip with inline edit; description, notes; edit/delete (danger confirmation).

### Exercises — no design
- Library: search, category filter, **grid / list toggle**, **Quick add** panel (~30 common exercises in groups),
  empty states, card (name, category badge, unit, times used, last used, last set, View progress, edit, delete).
- Exercise form: name, category chips (13 presets + custom), unit (kg, lbs, reps, time, distance).
- **Exercise detail**: stats (times used, last used, last set, status), **personal records** (max weight,
  est. 1RM, max volume, max reps), **progression chart** with timeframe, metric (max weight / 1RM / volume / avg reps)
  and chart type (line / area / bar), summary row, recent workouts list, empty state.

### Routines — no design
- List cards (description, exercise and variation counts, exercise preview "+N more", variation chips, edit, delete).
- Routine form: name, description, exercises (add via multi-select picker with search / select all, reorder, remove),
  **variations** (name, description, min–max reps, default sets).
- "Start from routine" sheet (in component sheet) — matches the in-workout **Load routine** picker; add the
  variation choice step.

### Fingerboard protocols & testing — no design
- Protocols list + **Test yourself** entry; protocol form with hang list (reorder, edit, remove) and hang sub-form
  (same fields as workout hangs).
- **Test yourself** multi-step modal: select protocol (Perform test / View results / Clone), create, perform, results.
- Testing protocols list (hang count, results count, view, edit, delete).
- **Testing protocol detail**: Perform test, hang filter, **line chart** (time or load per hang), results table
  (date, hang, load, time, success, notes), empty state.
- Testing protocol form: "Load from protocol", test hangs with target load / target time.
- **Perform test**: rename protocol inline, date, per-hang load / time / success (yes/no) / notes,
  "Remind me to retest every N days/weeks/months".

### Profile & settings — no design
- Profile page header (avatar, name).
- **Profile tab**: photo upload, Google name, display name, timezone, Google Sheets URL.
- **Cycle tab**: enabled banner, cycle length 21–35, last period date, save, disable (confirm); disabled empty state.
- **Settings tab**: app status (connection, storage), privacy (data collection, cycle tracking + Setup cycle),
  push notifications enable/disable + permission-denied help, late-period notifications, inactivity reminders
  (days 1–14), test reminders (interval + unit).
- **Export tab**: Export JSON / CSV, error banner.

### Auth & landing — no design
- **Sign in**: email, password, forgot password link, Sign in, "Or continue with" **Google**, sign-up link.
- **Sign up**: name, email, password with live requirements checklist (8+, upper, lower, number), confirm, Google.
- **Forgot password** (+ sent state), **Reset password** (+ invalid/expired link state), **Signing out / logged out**.
- **Landing**: hero (logo, tagline, Get started, "Free to use · Works offline") + 12 feature cards
  (Cycle tracking, Strong Mind goals, Mental practice, Lead climbing + Strong Mind, Gym, Bouldering,
  Events & injuries, Statistics, Data export, Exercises & routines, Fingerboard, PWA & offline).

### Components still missing from the sheet
Text area, select/dropdown, number input with unit, date input, checkbox, toggle switch, range slider,
1–5 rating dots, Yes/No toggle, tabs, collapsible section, filter panel, pagination, tag creator with colour swatches,
search field, grid/list toggle, table, line/area/bar chart styles, warning banner, info box, avatar, badge with count,
dropdown menu, multi-step modal with back button, sheet for "More" navigation.

---

## C. Noticed along the way (bugs / inconsistencies, not design asks)
Fixed on branch `fix/known-bugs` (2026-11-11): Events list, Profile save, iOS install prompt (+ 14-day
dismissal), Strong Mind tab leak and unit default, offline form fields, calendar Trip/Fingerboard filters and
colours, workout-type colours not compiling under Tailwind v4, unused components, 35 missing translation keys,
hard-coded strings in fingerboard testing, PWA prompt, calendar legend/filters, workout card, Strong Mind
section, offline form and fingerboard protocol form.

Still open — bug review 2026-11-11 (✔ = re-checked by hand, rest traced in code by reviewers):

*Data loss / wrong data saved*
- Fixed 2026-11-12: testing-protocol edits keep test results; workout/event edits keep tags (and tags show on cards);
  fingerboard load/unload and grip changes save; JSON nulls in /api/user-profile and workout PUT; calendar Quick Log
  uses the clicked day and keeps older workouts; periods only move the cycle anchor forward (delete/edit fall back);
  event save errors keep the form open with a message, cycle day 1–50 accepted.
- Editing a workout can't remove all exercises/hangs or clear gratitude/improvements/time of day; switching GYM → other type keeps exercises.
- RIR 0 / 0 kg / 0 reps saved as empty on create (and routine default RIR 0).
- ✔ Exercise units "time"/"distance" (and Quick add e.g. Plank) are rejected by the API.
- Strong Mind goal ids can collide after reload (project goals) → edit/delete hits two goals.
- Exercise detail: PRs/progression don't load until the timeframe is changed.
- Export misses periods and Strong Mind goals; CSV misses sets/hangs/mental fields.

*Dates (Europe/Warsaw vs UTC)*
- Fixed 2026-11-12 (`lib/date-utils.ts`, calendar-day numbers everywhere): streak counts today; cycle page day numbers and
  period pre-fill; recurring workouts across DST; calendar/forms "today" between 00:00 and 01:00/02:00; "Mark period
  started" keeps cycle length and the right day; next period/ovulation roll forward; phases scale with cycle length
  (28-day unchanged); statistics 7-day weeks, avg/week, longest streak, "This month"; injury phase ranges follow cycle
  length; period-tomorrow reminder on DST day; falls reminder "Infinity"; daily reminders reload workouts; cycle info
  refreshes after midnight; dashboard total uses the real count.
- Still open: removing a reminder brings it back on the next page load the same day; overdue threshold stays at a fixed
  32 days (as the consent screen says).

*Security / robustness*
- ✔ Middleware page protection never runs (`'/'` matches everything) — pages render shells, API still checks auth.
- Any signed-in user can send push notifications to another user (`/api/push/send` trusts `userId` from body).
- Register + Google sign-in: someone can pre-register your email with a password and later read your data.
- Login and forgot-password are case-sensitive (register lowercases) — "Kasia@…" from a phone keyboard fails.
- Routines accept other users' exercise ids; workouts accept any `planId`.
- Routine exercise picker: "Select All" also selects exercises already in the routine (their checkboxes are disabled),
  so "Add Selected" adds them a second time.
- Pagination params unvalidated/unbounded (500s, huge responses); one shared rate-limit counter for all limiters.
- Some routes skip zod validation and return raw error messages; duplicate tag name → 500.
- Tag selector strings are hard-coded English ("Tags", "Create new tag", "Color:", "Create", "Cancel") — also in the event form.

- **Password reset never sends an email.** `src/app/api/auth/forgot-password/route.ts` creates the reset token
  but has `// TODO: Send email with reset link`, while telling the user a link "has been sent". Needs an email
  service (e.g. Resend or SMTP) wired in.

Also fixed later the same day: offline workouts now upload to the server (`lib/offline-sync.ts`,
`OfflineSyncManager`); goal progress 1–3 / project "achieved" connected in the workout form; the late-period
reminder choice in cycle setup now applies (and no longer overwrites the Google Sheets URL); fingerboard hand/grip
names translated.
