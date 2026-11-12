// Streak = weeks in a row (Mon–Sun) with at least STREAK_MIN_SESSIONS workouts (decision 7)

import { localDayNumber, storedDayNumber } from './date-utils'

export const STREAK_MIN_SESSIONS = 3

// Monday-based week index for a day number (day 0 = Thursday 1 Jan 1970)
export const weekIndex = (dayNumber: number) => Math.floor((dayNumber + 3) / 7)

/**
 * `current`: full weeks before this one that reached the minimum, counting back from last week, plus this week once it
 * has reached it too (a week still in progress doesn't break the streak). `longest`: longest run of such weeks.
 * Weeks with a deload day (`deloadDays`, day numbers) pause the streak: they don't break it and don't add to it,
 * unless they reached the minimum anyway.
 */
export function weeklyStreaks(
  workouts: { startTime: string | Date }[],
  minSessions = STREAK_MIN_SESSIONS,
  today = localDayNumber(),
  deloadDays: Set<number> = new Set()
): { current: number; longest: number } {
  const perWeek = new Map<number, number>()
  workouts.forEach((w) => {
    const week = weekIndex(storedDayNumber(w.startTime))
    perWeek.set(week, (perWeek.get(week) || 0) + 1)
  })
  const reached = (week: number) => (perWeek.get(week) || 0) >= minSessions
  const deloadWeeks = new Set(Array.from(deloadDays, weekIndex))
  const keepsStreak = (week: number) => reached(week) || deloadWeeks.has(week)

  const thisWeek = weekIndex(today)
  let current = reached(thisWeek) ? 1 : 0
  for (let week = thisWeek - 1; keepsStreak(week); week--) if (reached(week)) current++

  let longest = 0
  let run = 0
  const weeks = Array.from(perWeek.keys()).filter(reached).sort((a, b) => a - b)
  weeks.forEach((week, i) => {
    // Consecutive, or only deload weeks in between
    let bridged = i > 0
    for (let w = (weeks[i - 1] ?? week) + 1; bridged && w < week; w++) bridged = deloadWeeks.has(w)
    run = bridged ? run + 1 : 1
    longest = Math.max(longest, run)
  })

  return { current, longest }
}
