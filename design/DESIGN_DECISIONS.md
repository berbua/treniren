# Unicorn Climb — app vs design decisions (2026-11-12)

The user's answers to the 66 mismatches between the app and the mockups (D = design, A = app before the decision).
These override the "visual only" rule for the items marked **Design** / **Build**: those may change behaviour.
Details of each gap: `design/MISSING_DESIGNS.md`.

## Follow the design (build / change)

| # | Topic | Do |
|---|---|---|
| 1 | Centre "+" tab | Open the "What would you like to add?" sheet (Quick log / Add workout / Add event) instead of going to Workouts |
| 2 | Tab labels | "Today" / "Stats" instead of "Dashboard" / "Statistics" |
| 3 | Toast | Add an "Undo" action to toasts |
| 5 | User menu trigger | Avatar only (no name / chevron) |
| 7 | Streak | "Weeks with ≥3 sessions" instead of consecutive days |
| 10 | Goals card | Create measurable goals ("Max hang 20 mm +10 kg") — new feature |
| 11 | "Log again" chips | Create — new feature |
| 12 | Shortcuts | 3×2 grid |
| 14 | Cycle consent / setup | Design texts ("Train with your cycle?") + cycle-length slider |
| 19 | Per-set validation | Inline "Enter reps for set 3" + red empty cell |
| 25 | Workout form footer | "Save session" + one-line summary |
| 26 | Wall angle / style | Add UI for the existing DB enums |
| 29 | Tag creator colours | Design palette |
| 30 | Incomplete-data dialog | Design copy ("Some sets are empty…") |
| 32 | Gym workout card | "5 exercises" chip |
| 33 | Calendar | Upcoming events list |
| 34 | Calendar filters | "Show workouts / events" checkboxes, Reset, "Show results" |
| 37 | Cycle | Log symptoms — new feature |
| 38 | Periods | Flow intensity — new field |
| 39 | Cycle | Avg cycle / Avg period / Logged tiles |
| 42 | Statistics ranges | 4W / 3M / 6M / 1Y |
| 43 | Statistics | TR-points volume + weekly bar charts |
| 44 | Statistics | Performance by phase (avg session rating) — needs a session rating |
| 45 | Statistics | Fingerboard test chart on Stats |
| 52 | Exercise detail | "Improving" status |
| 53 | Progression footer | "Start 6 kg · Now 10 kg · +67%" |
| 55 | Load routine | Two steps: pick variation, then "Load into workout" |
| 56 | Fingerboard | One combined screen (protocols + testing) |
| 57 | Clone test protocol | Confirm + rename |
| 58 | Testing detail chart | Default metric Load |
| 59 | Profile | "Member since" (API must return `createdAt`) |
| 60 | Profile | Editable display name |
| 61 | Privacy | "Anonymous usage data" toggle |
| 62 | Disable cycle tracking | Design text ("your logged periods are kept") — **check what disabling really deletes first** |
| 64 | Sign out | "Sign in again" |
| 65 | Reset password | Detect an expired link on open |

## Mixed

| # | Topic | Do |
|---|---|---|
| 4 | Message priority | Differentiate all priorities (high / medium / low), not only "High" |
| 22 | Route name | Add a Route name field **and** keep Sector (both, for rock climbing) |
| 23 | Named climbs | Default "Climb 1, Climb 2…", editable name |
| 49 | Delete event | Keep delete on the card **and** add "Delete event" in the edit form |
| 51 | Exercise categories | Keep the app's 13; future idea: add more categories |

## Keep the app

6 (logged-out language picker) · 8 ("This week" rolling 7 days + tiles) · 9 (Recent workouts, last 3 — changed
from Design on 2026-11-12: the mock's "This week's sessions" doesn't make sense for the app) · 13 (phase ranges 1–7 / 8–12 / 13–16 / 17–20 /
21–end) · 16 (native date picker in Quick log) · 18 (plain Edit / Duplicate titles) · 20 (hangs not collapsible) ·
21 (crimp 6–30 mm list) · 27 (read-only mental state summary) · 35 (calendar Today button) · 36 (⚠ on every injury-risk
day) · 41 (cycle cells: date + cycle day) · 46 (Linked workouts list) · 47 (project edit/delete) · 48 (two gratitude
sections) · 50 (5 severity dots) · 54 (variations in their own sheet)

## Discuss later (user needs more testing)

| # | Topic | D | A |
|---|---|---|---|
| 15 | Offline workout form | Date, type, notes only | Full set of fields |
| 17 | Quick log optional fields | No "(Optional)", no clear | "(Optional)" labels; tap again to clear |
| 24 | Time of day for lead | Single segment | Mental practice only, multi-select |
| 28 | Exercise "Last:" line | Adds "kg" and date | "Last: 10×5" |
| 31 | Workouts info panel | One-line event summary | 6 training + 4 event types with descriptions |
| 40 | Cycle phase cards | Train / Recover rows | Physiology / Impact / Goal / Tips + injury count |
| 66 | Landing copy | Design tagline + one-line cards | App tagline + bullet lists |

## Pending

- 63 Auth titles / copy: keep the app's texts for now; the user will add special Polish strings.
