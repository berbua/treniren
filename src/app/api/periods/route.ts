import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { endsBeforeStart, findOverlappingPeriod, syncLastPeriodDate, withPeriodLock } from '@/lib/period-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { applySecurity } from '@/lib/api-security'
import { z } from 'zod'

const CreatePeriodSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
  flow: z.number().int().min(1).max(3).nullable().optional(),
})

const UpdatePeriodSchema = CreatePeriodSchema.partial()

// GET /api/periods - Get all periods for a user
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResponse = await applySecurity(request, { csrf: false, rateLimit: false })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const periods = await prisma.period.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(periods)
  } catch (error) {
    console.error('Error fetching periods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch periods' },
      { status: 500 }
    )
  }
}

// POST /api/periods - Create a new period
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResponse = await applySecurity(request, { rateLimit: 'normal', csrf: true })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = CreatePeriodSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { startDate, endDate, notes, flow } = validationResult.data
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : start

    if (endsBeforeStart(start, end)) {
      return NextResponse.json(
        { error: 'End date cannot be before start date', code: 'PERIOD_END_BEFORE_START' },
        { status: 400 }
      )
    }

    // Calculate cycle day if cycle settings exist
    let cycleDay: number | undefined
    try {
      const profile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      })
      
      if (profile?.lastPeriodDate) {
        const cycleSettings = {
          cycleLength: profile.cycleAvgLengthDays || 28,
          lastPeriodDate: new Date(profile.lastPeriodDate),
          timezone: profile.timezone || 'Europe/Warsaw',
        }
        
        const { calculateCycleInfo } = await import('@/lib/cycle-utils')
        const cycleInfo = calculateCycleInfo(cycleSettings, startDate)
        cycleDay = cycleInfo.currentDay
      }
    } catch (error) {
      console.error('Error calculating cycle day:', error)
    }

    const period = await withPeriodLock(user.id, async tx => {
      if (await findOverlappingPeriod(user.id, start, end, undefined, tx)) return null
      return tx.period.create({
        data: {
          userId: user.id,
          startDate: start,
          endDate: end,
          notes: notes || null,
          flow: flow ?? null,
          cycleDay: cycleDay || null,
        },
      })
    })

    if (!period) {
      return NextResponse.json(
        { error: 'A period is already logged on these dates', code: 'PERIOD_OVERLAP' },
        { status: 409 }
      )
    }

    // Move the cycle anchor forward if this is the newest period
    try {
      await syncLastPeriodDate(user.id, { addedStart: period.startDate })
    } catch (error) {
      console.error('Error updating user profile:', error)
    }

    return NextResponse.json(period, { status: 201 })
  } catch (error) {
    console.error('Error creating period:', error)
    return NextResponse.json(
      { error: 'Failed to create period' },
      { status: 500 }
    )
  }
}

