import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncLastPeriodDate } from '@/lib/period-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { applySecurity } from '@/lib/api-security'
import { z } from 'zod'

const UpdatePeriodSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
  flow: z.number().int().min(1).max(3).nullable().optional(),
})

// GET /api/periods/[id] - Get a specific period
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const securityResponse = await applySecurity(request, { csrf: false, rateLimit: false })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const period = await prisma.period.findFirst({
      where: { id, userId: user.id },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(period)
  } catch (error) {
    console.error('Error fetching period:', error)
    return NextResponse.json(
      { error: 'Failed to fetch period' },
      { status: 500 }
    )
  }
}

// PUT /api/periods/[id] - Update a period
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const securityResponse = await applySecurity(request, { rateLimit: 'normal', csrf: true })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const period = await prisma.period.findFirst({
      where: { id, userId: user.id },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validationResult = UpdatePeriodSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { startDate, endDate, notes, flow } = validationResult.data

    // Calculate cycle day if startDate changed
    let cycleDay: number | undefined = period.cycleDay || undefined
    if (startDate) {
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
    }

    const updatedPeriod = await prisma.period.update({
      where: { id },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(flow !== undefined && { flow }),
        ...(cycleDay !== undefined && { cycleDay: cycleDay || null }),
      },
    })

    if (updatedPeriod.startDate.getTime() !== period.startDate.getTime()) {
      try {
        await syncLastPeriodDate(user.id, { removedStart: period.startDate, addedStart: updatedPeriod.startDate })
      } catch (error) {
        console.error('Error updating last period date:', error)
      }
    }

    return NextResponse.json(updatedPeriod)
  } catch (error) {
    console.error('Error updating period:', error)
    return NextResponse.json(
      { error: 'Failed to update period' },
      { status: 500 }
    )
  }
}

// DELETE /api/periods/[id] - Delete a period
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const securityResponse = await applySecurity(request, { rateLimit: 'normal', csrf: true })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const period = await prisma.period.findFirst({
      where: { id, userId: user.id },
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    await prisma.period.delete({
      where: { id },
    })

    // If the cycle anchor came from this period, fall back to the latest remaining one
    try {
      await syncLastPeriodDate(user.id, { removedStart: period.startDate })
    } catch (error) {
      console.error('Error updating last period date:', error)
    }

    return NextResponse.json({ message: 'Period deleted successfully' })
  } catch (error) {
    console.error('Error deleting period:', error)
    return NextResponse.json(
      { error: 'Failed to delete period' },
      { status: 500 }
    )
  }
}

