// Deload events: rest periods over several days (range in tripStartDate / tripEndDate, like trips)

import { localDayNumber, storedDayNumber } from './date-utils'

interface DeloadLike {
  type: string
  tripStartDate?: string | Date | null
  tripEndDate?: string | Date | null
}

/** Day numbers (see `storedDayNumber`) of every day inside a deload event. */
export function deloadDayNumbers(events: DeloadLike[] = []): Set<number> {
  const days = new Set<number>()
  events.forEach((event) => {
    if (event.type !== 'DELOAD' || !event.tripStartDate || !event.tripEndDate) return
    const end = storedDayNumber(event.tripEndDate)
    for (let day = storedDayNumber(event.tripStartDate); day <= end; day++) days.add(day)
  })
  return days
}

/** The deload running today, as day N of M, or null. */
export function currentDeload<T extends DeloadLike>(events: T[] = [], today = localDayNumber()) {
  for (const event of events) {
    if (event.type !== 'DELOAD' || !event.tripStartDate || !event.tripEndDate) continue
    const start = storedDayNumber(event.tripStartDate)
    const end = storedDayNumber(event.tripEndDate)
    if (today >= start && today <= end) return { event, day: today - start + 1, totalDays: end - start + 1 }
  }
  return null
}
