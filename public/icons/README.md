# Unicorn Climb icons

67 line icons, 24 × 24, 1.75 stroke, round caps and joins, `stroke="currentColor"`, no fill.
They take the colour of the text around them, so they work in dark and light mode for free.

- `svg/uc-*.svg` — one file per icon
- `sprite.svg` — all icons as `<symbol id="uc-…">`
- `preview.html` — open in a browser to see them all

## Usage

```html
<!-- single file -->
<img src="/icons/uc-streak.svg" alt="" width="20" height="20">   <!-- note: <img> can't inherit color -->

<!-- sprite (recommended, inherits color) -->
<svg width="20" height="20" aria-hidden="true"><use href="/icons/sprite.svg#uc-streak"/></svg>
```

Icon-only buttons need an `aria-label`; decorative icons keep `aria-hidden="true"`.
Sizes: 16 (inline in chips), 20 (buttons, list rows), 24 (tab bar, headers).

## Replacing emoji

| Emoji | Icon |
|---|---|
| 🏠 | `uc-home` |
| 📅 / 🗓️ | `uc-calendar` |
| ➕ | `uc-plus` |
| 📊 / 📈 | `uc-stats` (bars) · `uc-improve` (trend) |
| 🔥 | `uc-streak` |
| 🎯 | `uc-goal` |
| ⚡ | `uc-quick-log` |
| 🏆 | `uc-achieved` / `uc-event-competition` |
| ⚠️ | `uc-warning` · `uc-injury-risk` (phase with most injuries) |
| ℹ️ | `uc-info` |
| ✅ / ✔️ | `uc-success` |
| ❌ / ✖️ | `uc-close` |
| 🗑️ | `uc-delete` |
| ✏️ | `uc-edit` |
| 📋 | `uc-duplicate` |
| 🔔 | `uc-bell` |
| 🔍 | `uc-search` |
| ⚙️ | `uc-settings` |
| 👤 | `uc-user` |
| 🌐 | `uc-globe` |
| 🚪 | `uc-sign-out` |
| 🏷️ | `uc-tag` |
| 📝 | `uc-note` |
| 📚 | `uc-library` |
| 🧠 | `uc-strong-mind` |
| 🙏 / ❤️ | `uc-gratitude` |
| 🩸 | `uc-period` |
| 🔄 | `uc-cycle` |
| 🌅 / ☀️ / 🌙 | `uc-morning` / `uc-midday` / `uc-evening` |
| ⏱️ | `uc-clock` |
| 🩹 / 🤕 | `uc-event-injury` |
| 🩺 / 💆 | `uc-event-physio` |
| ✈️ / 🗺️ / 📍 | `uc-event-trip` |
| 🏋️ | `uc-type-gym` |
| 🧗 | `uc-type-bouldering` · `uc-type-lead-wall` · `uc-type-lead-rock` |
| 🔁 | `uc-type-circuits` |
| ✋ | `uc-type-fingerboard` |
| 🧘 | `uc-type-mental` |
| 📉 (falls) | `uc-falls` |
| 📥 / 💾 | `uc-download` |
| 📴 | `uc-offline` |
| 📲 | `uc-install` |
| 🦄 | `uc-horn` (temporary — will be replaced by the chosen logo) |

Workout-type icons are usually shown in their type colour (`--uc-workout-*`) or white-on-colour inside a 40–44 px tile.
