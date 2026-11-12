# Training monitoring review — advanced climber

Review date: 2026-11-12. What an advanced climber would miss when monitoring their training. The app records how
hard you trained and how your head was, but not what you actually climbed. Most important first.

Related items on `design/BIG_FEATURES_TODO.md`: 10 (goals) and 44 (performance by phase) cover parts of this; 44
depends on #2 below.

**Recommended first: #1 (grades and ticks) and #2 (effort × minutes)** — most of the other ideas need one of them.

## 1. No grades or ticks on individual climbs (biggest gap)

> **Built 2026-11-12** on branch `feat/climb-grades`: grade, send style and tries per climb (lead + bouldering), and a
> Grades card on Stats (hardest send per month, grade pyramid). See `design/REDESIGN_PLAN.md`.

Each climb logged in a lead or bouldering session stores a name, focus state, whether you fell, comfort zone and
notes (`ClimbSection` in `src/types/workout.ts`). There's no grade, number of attempts or send style (onsight /
flash / redpoint / repeat). Grades only exist on Strong Mind project goals. So you can't see:

- your hardest send per month, or a grade pyramid
- how many tries a redpoint at your limit takes
- whether you onsight less on rock than in the gym

Logged climbs (`mentalState.climbSections[]`) already have a place where these fields could go.

## 2. Training load ignores how long you trained

The only load measure is the TR1–TR5 rating. The workout form never asks when you finished (`Workout.endTime` is
unused), so a 40-minute TR4 and a 3-hour TR4 count the same in the weekly volume chart. The usual approach is
**effort × minutes** (session RPE). Once you have that, you can add:

- a warning when this week's load is much higher than your average of the last 3–4 weeks — load spikes are the
  classic way finger injuries happen
- the session rating that item 44 (performance by cycle phase) is still waiting on

## 3. Readiness and recovery fields exist but the form doesn't ask for them

`preSessionFeel` and `dayAfterTiredness` are in the database and `WorkoutCard` can display them, but
`EnhancedWorkoutForm` never asks for them. "Day after" also needs a nudge the next day — the existing push
notifications could do that. Sleep and finger / skin soreness (0–10) would be useful too. Together they would show
whether you're recovering between hard sessions.

## 4. No bodyweight, so no fingerboard % of bodyweight

Hang and test loads are stored as kg added or removed, and there's nowhere to record bodyweight. Max-hang strength
is normally compared as a percentage of bodyweight. Without it, a test result after losing 3 kg looks the same as
one at your heavier weight. Bodyweight is only needed on the date of each test.

## 5. Injuries aren't linked to training

An injury records body part, severity and status, and Stats compares injuries with cycle phase. Missing:

- **Load before the injury** — training load in the 2–3 weeks before it. This would catch overtraining, which the
  phase comparison can't.
- **Pain and return to climbing over time** — a short pain log (e.g. finger 3/10 → 1/10) and stages of return to
  training. A plain status like "Recovering" doesn't show progress.

## 6. Training phases, not just deloads

Deloads can be marked, but not training phases (base, strength, power, power endurance, performance). With phases,
Stats could compare fingerboard tests and sends by phase and show whether a strength phase actually raised max hang.

## Smaller ones

- **Left / right hand asymmetry** on one-arm hangs, if not already visible in the test chart.
- **Rock conditions** (temperature, humidity) on Lead Rock sessions — conditions often explain a bad day at the crag.
- **Rest days between hard sessions** — e.g. typical days between TR4–5 sessions, shown next to the streak.

## Added after the review

### Training plan import

> **Built 2026-11-13** (merged to `main`): import next week's plan as a CSV (e.g. made with Claude — the import sheet
> has a "Copy instructions for Claude" button with the format). Planned sessions show on the Calendar and Today, don't
> count as training, and "Log" opens the workout form prefilled and linked to the plan. See `design/REDESIGN_PLAN.md`.
