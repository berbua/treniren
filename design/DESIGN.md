# Unicorn Climb — design spec (v1.0)

Hand-off for applying the redesign to the Treniren PWA. Tokens live in `tokens.css`
(CSS custom properties, prefix `--uc-`). Never hard-code a hex in components — always
reference a token so dark/light mode works.

## Principles

- Calm training partner, not a period tracker and not an aggressive gym app.
- Dark-first; light mode via `data-theme="light"` on `<html>`.
- Logging must be fast and readable at a glance, one-handed, right after a session.
- Bilingual EN/PL: never fix label widths; allow ~30% extra length ("Wczesna faza lutealna").
- No emoji as icons. One line-icon set: 24px grid, 1.75 stroke, round caps/joins, `fill: none`,
  `stroke: currentColor`. The unicorn appears only as a small horn logo mark.

## Color rules

| Use | Token |
|---|---|
| Page background | `--uc-bg` |
| Cards, lists | `--uc-surface` + 1px `--uc-border` |
| Sheets, menus, dialogs, tab bar | `--uc-elevated` + `--uc-shadow` |
| Body text / secondary text | `--uc-text` / `--uc-text-muted` |
| Main CTA (Quick log, Save session, Log period) — one per screen | bg `--uc-accent`, text `--uc-on-accent` |
| Secondary filled button, selected segment | bg `--uc-primary`, text `--uc-on-primary` |
| Tonal button, tags, TR badge, active nav item | bg `--uc-primary-container`, text `--uc-on-primary-container` |
| Links | `--uc-primary` (or `--uc-accent-text` for phase-guide links) |
| Text on ANY solid phase / workout / focus / zone chip | `--uc-chip-ink` (dark ink in dark mode, white in light mode) |

**Phases vs workouts must never be confused:**
- Cycle phases = **soft bands** (`--uc-band-*`) behind content, plus solid (`--uc-phase-*`) only for
  the phase badge, the cycle ring and the small dot in legends.
- Workout types = **saturated dots / icon tiles** (`--uc-workout-*`), always with their icon.

Phase day ranges (as implemented; cycle length configurable 21–35):
menstrual 1–7, follicular 8–12, ovulation 13–16, early luteal 17–20, late luteal 21–end of cycle.

**Ground rule: the redesign is visual only.** Never add, remove or change functionality to match a
mock — if a design shows something the app doesn't do, keep the app's behaviour and flag it.

Event markers (calendar): 18–20px rounded-square badge, `--uc-elevated` fill, 1.5px border and
icon in the event color — injury `--uc-error`, physio `--uc-primary`, competition `--uc-accent-text`,
trip `--uc-success`.

## Type

Manrope only. Use the `--uc-text-*` shorthands. All numbers in stats, dates, TR values and
counters use `font-variant-numeric: tabular-nums` (`.uc-num`).
Overline labels: 11–12px, 700, uppercase, letter-spacing .08em, `--uc-text-muted`.

## Layout & sizing

- Mobile: 390px reference width, 20px side padding, 16–20px vertical gaps between sections.
- Cards radius 16px, sheets 24px (top corners), inputs 12px, chips 8–14px, badges pill.
- Min tap target 44×44px everywhere (chips, segments, icon buttons, calendar cells).
- Mobile nav: floating bottom tab bar (Today, Calendar, + Log, Stats, More), 12px from the edges,
  radius 22px, center "Log" is a 48px `--uc-accent` square. Active tab icon sits on a 40px
  `--uc-primary-container` square.
- Desktop (≥ 1024px): left sidebar 240–280px (`--uc-surface`, right border) with nav + compact cycle
  ring card at the bottom; content max-width 1120px; cards in `repeat(auto-fit, minmax(420px, 1fr))`.

## Components

- **Phase badge** — pill, 30–32px tall, bg `--uc-phase-*`, text `--uc-chip-ink` 13px/800,
  leading 8px dot in chip-ink at 55% opacity. Soft variant: bg `--uc-band-*`, text `--uc-text`,
  dot in `--uc-phase-*`.
- **Workout type chip** — 44px tall, radius 14px. Unselected: `--uc-elevated` bg, border, icon in
  `--uc-workout-*`. Selected: bg `--uc-workout-*`, icon + text `--uc-chip-ink`.
- **Session row** — 64–68px, surface card; 44px icon tile (workout color, chip-ink icon), title 15/800,
  meta 13px muted ("Tue 10 · Evening · overhang · powerful"), TR badge on the right.
- **Stat tile** — surface card, overline label, 34–36px/800 tabular value + muted unit.
- **Streak counter** — flame icon in `--uc-accent-text`; shows the app's existing streak (consecutive days).
- **Toast** has no action buttons (success / error / warning / info + close).
- **Cycle ring** — 5 arcs (stroke 14–22px, round caps, ~4px visible gaps), starting at 12 o'clock,
  future phases at 45% opacity, current day = circle marker (bg fill, 3–4px `--uc-text` stroke),
  day number centered (tabular, 800).
- **Calendar day cell** — 62px tall, no horizontal gap between cells so the phase band reads as a
  continuous strip (round 12px only at phase start/end and week edges); predicted (future) days at
  50% band opacity; day number top, up to 3 workout dots (7px) bottom; today = 2px `--uc-text` inner
  ring; event badge top-right; out-of-month numbers muted.
- **Segmented selector** — container `--uc-surface` + border, radius 14px, 4px padding; segments
  44–48px, selected `--uc-primary`/`--uc-on-primary`. Used for TR1–TR5 (show "TR4 · hard" caption),
  time of day (Morning/Midday/Evening with sunrise/sun/moon icons), stats range.
- **Focus / comfort selectors** (lead climbing, per route section) — focus as a 3×2 grid, comfort
  zone as 4 in a row; unselected = elevated chip with a colored 8px dot; selected = filled with the
  scale color (`--uc-focus-*` / `--uc-zone-*`) and `--uc-chip-ink` text.
- **Bottom sheet** — `--uc-elevated`, top radius 24px, 40×5 handle, `--uc-scrim` behind; the log form
  has a sticky footer with the full-width accent "Save session" (56px) + one-line summary.
- **Toast** — inverted (bg `--uc-text`, text `--uc-bg`), radius 16px, type icon, close button only.
- **Confirmation dialog** — elevated card radius 20px; destructive button bg `--uc-error`,
  text `--uc-chip-ink`.
- **Empty state** — 64px `--uc-primary-container` icon tile, title 17/800, one muted line, accent CTA.
- **Skeleton** — `--uc-skeleton` blocks, same radii as the content they replace.

## Screen notes

- **Today:** phase hero card on `--uc-band-<current phase>` (badge, "Day 9 of 28", one-line
  recommendation as H1, short body, linear 5-segment phase strip with marker, "Phase guide" link) →
  64px accent Quick log + "Log again" recent-type chips → Streak + This week tiles → this week's
  sessions → goals (8px progress bars in `--uc-primary`) → 3×2 shortcuts grid.
- **Log workout:** bottom sheet; type chips → date (shows phase pill) + time of day → TR1–TR5 →
  type-specific block (lead: route + per-section focus/comfort cards + "Add section") → tags → notes.
- **Calendar:** month grid Mon-first, legend card, selected-day detail, upcoming events.
- **Cycle:** 280px ring, Log period (accent) + Log symptoms, avg cycle/period tiles, recent periods
  with flow bars, per-phase guidance cards (current one on its band, expanded with Train/Recover).
- **Statistics:** range segments, summary tiles, weekly volume bars (current week dashed), stacked
  split-by-type bar + list, performance-by-phase bars in phase colors, fingerboard test line chart
  with dashed accent goal line.

Reference designs: the "Unicorn Climb — Redesign" canvas on claude.ai (style guide, component
sheet, mobile screens, desktop Today).
