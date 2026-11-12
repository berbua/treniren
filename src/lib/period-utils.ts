import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { DAY_MS } from '@/lib/date-utils'

// Calendar day of a stored period date. Rounds so older values saved as local midnight keep their day.
const periodDay = (date: Date) => Math.round(date.getTime() / DAY_MS)

/** True when the end date falls on an earlier calendar day than the start. */
export const endsBeforeStart = (start: Date, end: Date | null) => end !== null && periodDay(end) < periodDay(start)

/**
 * Runs fn in a transaction holding a lock on the user's periods, so two saves sent at once
 * (e.g. a double tap) can't both pass the overlap check and log the same days twice.
 */
export function withPeriodLock<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`periods:${userId}`}::text))`
    return fn(tx)
  })
}

/** A logged period of the user sharing at least one day with start–end (end defaults to start), or null. */
export async function findOverlappingPeriod(
  userId: string,
  start: Date,
  end: Date | null,
  excludeId?: string,
  db: Prisma.TransactionClient = prisma
) {
  const periods = await db.period.findMany({
    where: { userId, ...(excludeId && { id: { not: excludeId } }) },
    select: { id: true, startDate: true, endDate: true },
  })
  const from = periodDay(start)
  const to = periodDay(end ?? start)
  return periods.find(p => periodDay(p.startDate) <= to && periodDay(p.endDate ?? p.startDate) >= from) ?? null
}

// Keeps UserProfile.lastPeriodDate (the date every cycle calculation counts from) in step with logged periods.
//
// - `addedStart`: a period with this start date was added or moved. The anchor only ever moves forward,
//   so back-filling an older period doesn't reset the current cycle.
// - `removedStart`: a period with this start date was deleted or moved. If the anchor came from it,
//   it falls back to the latest remaining period. A date set manually in setup/profile is left alone.
export async function syncLastPeriodDate(
  userId: string,
  { addedStart, removedStart }: { addedStart?: Date; removedStart?: Date }
): Promise<void> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { lastPeriodDate: true },
  })
  const current = profile?.lastPeriodDate ?? null
  let next = current

  if (removedStart && current && current.getTime() === removedStart.getTime()) {
    const latest = await prisma.period.findFirst({
      where: { userId },
      orderBy: { startDate: 'desc' },
      select: { startDate: true },
    })
    next = latest?.startDate ?? current
  }

  if (addedStart && (!next || addedStart.getTime() > next.getTime())) {
    next = addedStart
  }

  if (next && next.getTime() !== current?.getTime()) {
    await prisma.userProfile.upsert({
      where: { userId },
      create: { userId, lastPeriodDate: next },
      update: { lastPeriodDate: next },
    })
  }
}
