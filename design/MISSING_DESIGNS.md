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
- **Streak = "weeks with ≥3 sessions"** — the app counts **consecutive days** ("N days streak").
- **"This week 3 / 4 sessions" with an M–S day strip** — the app's "this week" is a **rolling 7 days**, with a
  % trend vs last week and a progress bar to the weekly goal (default 3). It also has a **This month** tile
  (count, trend %, bar to monthly goal), **Total workouts** and **Events count** tiles.
- **"This week's sessions" list** — the app shows **Recent workouts (last 3)**; row meta is type, TR badge,
  date and "N exercises / N hangs / Quick log" (no time of day, wall angle or style).
- **Goals card with goals like "Max hang 20 mm +10 kg" / "Present or better on 80%"** — no such measurable goals.
  The goals that exist: weekly/monthly session goals (+ optional per-type "× per week"), and Strong Mind
  process/project goals (see B).
- **Shortcuts 3×2** — the app has 9 links in 3 groups: Training (Workouts, Calendar, Cycle),
  Library (Exercises, Routines, Fingerboard), Analysis (Statistics, Strong Mind, Profile).
- **Phase hero card** — OK to keep (cycle day/phase/recommendations exist), but note the app's phase day ranges
  are **Menstrual 1–7, Follicular 8–12, Ovulation 13–16, Early luteal 17–20, Late luteal 21–end of cycle**
  (design says 1–5 / 6–12 / 13–16 / 17–22 / 23–28). Cycle length is configurable 21–35 days.
- Built 2026-11-12: hero card is shown (user decision) with the horizontal phase strip on phone **and** desktop —
  the desktop mock's cycle ring waits for the Cycle screen step. "Ovulation in ~N days" is shown as the existing
  "Next ovulation: <date>".
- **Cycle consent / setup**: mock texts ("Train with your cycle?", slider for cycle length) differ from the app's;
  the app keeps its (hard-coded English) texts and a 21–35 select. Mock consent also omits the "Note: enable later" line.
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
- **Route name field** — doesn't exist. Lead climbing has a **Sector** text field instead.
- **Named route sections ("Crux — roof traverse") with edit pencil** — sections are unnamed: "Climb 1, Climb 2…".
- **Time of day for lead climbing** — time of day exists **only for Mental practice**, and it's **multi-select**
  (Morning + Evening possible), not a single segment.
- **Phase pill next to the date** — the app shows a collapsible **Cycle information** panel instead
  (phase + recommendations for the chosen date). A pill is fine as a summary of it.
- **"Save session" + one-line summary sticky footer** — the app has Cancel + Save/Update.
- Wall angle (slab/overhang/roof…) and style (powerful/technical) — enums exist in the DB but **no UI** uses them; don't show.
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
  - **Per-set validation** ("Enter reps for set 3", red empty cell) doesn't exist; empty sets are caught only by the
    incomplete-data dialog on save.
  - Exercise "Last:" line stays "Last: 10×5" (the mock adds "kg" and the date).
  - Set table columns are reps · kg · RIR as in the mock; the RIR ℹ️ help moved from the input to the column header.
  - **Hang title** stays "#1 🤲 Both hands · Crimp 20mm" (no "Hang 1" string exists). **Collapsed hang rows**
    ("Hang 2 · Both · open · 20 mm…") — hangs don't collapse; every hang shows its fields.
  - **Crimp size** stays a select of the fixed sizes 6–30 mm (mock shows a free number field with "mm").
    Hand and grip are segments with their emoji; the Polish crimp label wraps to two lines.
  - Load hint text stays the app's "negative for unload" (mock: "Negative load = assisted (unloaded) hang.").
  - **Tag creator**: no "Name" label (no fitting key; the input keeps its "Tag name" placeholder); colours are the
    app's 10 stored tag colours, not the mock's palette; buttons stay "Cancel" / "Create".
  - **Recurring**: the mock's header checkbox is the app's collapsible card + "Make this workout recurring" checkbox.
    Frequency is Daily / Weekly / "Every N days" segments; the N-days input shows below when that segment is picked.
  - **Incomplete-data dialog** keeps the app's title/message and the list of incomplete items (mock: "Some sets are
    empty — 2 sets in … have no values. Empty rows won't count in your stats."). "Go back & fill" is now the filled
    button as in the mock. The shared `ConfirmationDialog` now shows its icon in a tinted tile above the title, with
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
  - Mock's gym chip "5 exercises" isn't shown on list cards (it never was).
  - **Add choice** is a bottom sheet with 3 tiles; its Cancel button was dropped (✕, Esc and scrim close it, as in Quick log).
  - **Goals configurator**: sheet keeps the 🎯 title, description and a Cancel + Save footer. Weekly goal keeps range +
    number input (mock: − slider +). Monthly auto/manual is now a segmented control (was a checkbox; new keys
    `goals.auto` / `goals.manual`); manual shows the 1–40 slider + input. Per-type goals stay in a collapsible card with
    a type select + count input + "× tydz." (hard-coded PL, as before) and 🗑️; a dot in the type colour leads each row.
    Preview keeps its weekly / monthly / breakdown rows rather than the mock's one-line summary.
  - Events tab cards (`EventCard`) are untouched here — they're the Events step.

### Calendar
- **Upcoming events list** — not implemented.
- **Selected-day detail** — user decision 2026-11-12: month cells show dots like the mock; tapping a day opens the
  existing Add sheet, which now lists that day's events (tap = edit) and workouts (edit, duplicate) above the
  Quick log / Add workout / Add event tiles. The mock shows the detail as an inline panel; ours is a sheet.
- Built 2026-11-12. Remaining differences:
  - **Filters**: mock has "Show workouts / Show events" checkboxes, a Reset link and "Show results". The app has a
    Workouts / Events switch that only picks which filter list is shown, filters apply instantly, no reset — kept,
    footer button is "Close". Mock's "All workouts are hidden" warning: the app's "None" means *show all*, so the
    app's own note ("No training types selected. All workouts will be shown.") stays.
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
- **Flow bars on recent periods** — no flow intensity is recorded (period = start date, end date, notes).
- **Avg cycle / Avg period / Logged tiles** — not computed. Only cycle length (from settings) is known.
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
- **Range 4W / 3M / 6M / 1Y** — the app offers **1 week, 1 month (default), 3 months, 6 months, 1 year, All time**,
  plus a second selector "show frequency per Week / Month / Quarter / Year".
- **Volume in TR points, weekly volume bar chart** — no volume metric or charts; there's a TR1–TR5 **count breakdown**.
- **Performance by cycle phase (avg session rating 1–5)** — no session rating exists; don't show.
- **Fingerboard test chart on Statistics** — that chart lives on the Fingerboard testing detail page.
- Tiles that exist: **Total workouts, This month, Avg per week, Current streak**.
- Mock's **"Current streak · 5 days"** unit and **"11 climbing workouts with a TR value"** subtitle aren't shown (no
  keys / not computed); the app's extra lines are kept: Strong Mind link card, "Each phase shows…" note, notification
  hint text, gratitude section description.
- Gratitude feed: the mock's heart / trend icons are the existing ✨ / 📈 until the custom SVGs land.

### Strong Mind
- Built 2026-11-12 against `Strong Mind.png`. Kept where the mock differs:
  - **Goal progress dots on the card's meta line** — the app has no per-goal progress summary; each card keeps its
    "Linked workouts (N)" list (date · type · 1–3 dots per workout). Project cards keep the full "🏆 Achieved! date"
    history (one chip per workout) and still have edit/delete (the mock shows none on project cards).
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
  - **Trip countdown "23 days"** — the card shows "Countdown · Enabled" (as before); the days-to-go number lives on the
    dashboard. Showing it on the card too is the user's call.
  - **"Delete event" inside the edit form** and the trip-specific delete text ("Delete “Frankenjura”? … Keep") don't
    exist; delete stays on the card with the existing "Delete Event" confirmation.
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

### Navigation
- **Centre "+ Log" tab** — the app has no global log action. For now the accent "+" tab opens **Workouts**
  (where Add / Quick log live). A design for what "+" should open (e.g. the Quick log / Add workout / Add event
  choice sheet) would need a decision, since that's new behaviour.
- **Tab labels** — mockup says "Today" / "Stats"; the app keeps its existing labels Dashboard / Statistics.

### Components
- **Toast with "Undo"** — toasts have no actions (success / error / warning / info + close).

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
