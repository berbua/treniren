// Calendar-date helpers.
//
// Dates picked by the user (workouts, events, periods) are stored as UTC midnight of that calendar day,
// e.g. 11 Nov -> 2026-11-11T00:00:00Z. Code that runs in the browser works with local Dates
// (now, calendar cells). Mixing the two - comparing a stored date with local midnight, or calling
// toISOString() on a local Date - puts things on the previous day in timezones ahead of UTC (Europe/Warsaw).
// These helpers convert both kinds to plain calendar days, and day numbers make day arithmetic immune to DST.

export const DAY_MS = 24 * 60 * 60 * 1000

// Local calendar date as YYYY-MM-DD (for "today", calendar cells and other local Dates).
// Unlike toISOString(), this doesn't shift to the previous day in timezones ahead of UTC.
export const toLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calendar date of a stored value (UTC midnight) as YYYY-MM-DD
export const toStoredDateString = (value: Date | string): string => new Date(value).toISOString().slice(0, 10)

// Days since 1970-01-01 for a local Date's calendar day
export const localDayNumber = (date: Date = new Date()): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS

// Days since 1970-01-01 for a stored date (UTC midnight) or a YYYY-MM-DD string
export const storedDayNumber = (value: Date | string): number =>
  Math.floor(new Date(value).getTime() / DAY_MS)

// Local Date (midnight) for a day number, e.g. to step through days without DST surprises
export const dayNumberToLocalDate = (dayNumber: number): Date => {
  const utc = new Date(dayNumber * DAY_MS)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

// YYYY-MM-DD for a day number
export const dayNumberToDateString = (dayNumber: number): string =>
  new Date(dayNumber * DAY_MS).toISOString().slice(0, 10)

// Calendar date of a period start (lastPeriodDate) as YYYY-MM-DD. Rounds to the nearest UTC midnight
// so older values saved as local midnight (22:00/23:00 UTC the previous day) keep their day.
export const toPeriodDateString = (value: Date | string): string =>
  dayNumberToDateString(Math.round(new Date(value).getTime() / DAY_MS))
