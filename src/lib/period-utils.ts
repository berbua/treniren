import { prisma } from '@/lib/prisma'

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
