import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { applySecurity } from '@/lib/api-security'
import { MAX_PLAN_ROWS } from '@/lib/plan-import'
import { z } from 'zod'

// Planned sessions (training plan import). A plan counts as done once a workout is logged from it (Workout.planId).
const PlannedSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['GYM', 'BOULDERING', 'CIRCUITS', 'LEAD_ROCK', 'LEAD_ARTIFICIAL', 'MENTAL_PRACTICE', 'FINGERBOARD']),
  title: z.string().max(200).trim(),
  trainingVolume: z.enum(['TR1', 'TR2', 'TR3', 'TR4', 'TR5']).nullable().optional(),
  notes: z.string().max(2000).trim().nullable().optional(),
})

const CreatePlansSchema = z.object({
  plans: z.array(PlannedSessionSchema).min(1).max(MAX_PLAN_ROWS),
})

// GET /api/plans - All planned sessions, with the ids of workouts logged from them
export async function GET(request: NextRequest) {
  try {
    const securityResponse = await applySecurity(request, { csrf: false, rateLimit: false })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const plans = await prisma.plan.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
      include: { workouts: { select: { id: true } } },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST /api/plans - Import planned sessions ({ plans: [...] })
export async function POST(request: NextRequest) {
  try {
    const securityResponse = await applySecurity(request, { rateLimit: 'normal', csrf: true })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const validationResult = CreatePlansSchema.safeParse(await request.json())
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const result = await prisma.plan.createMany({
      data: validationResult.data.plans.map(plan => ({
        userId: user.id,
        date: new Date(plan.date), // UTC midnight, like workout dates
        title: plan.title,
        type: plan.type,
        trainingVolume: plan.trainingVolume ?? null,
        notes: plan.notes || null,
      })),
    })

    return NextResponse.json({ count: result.count }, { status: 201 })
  } catch (error) {
    console.error('Error importing plans:', error)
    return NextResponse.json({ error: 'Failed to import plans' }, { status: 500 })
  }
}
