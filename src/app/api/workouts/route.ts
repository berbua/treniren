import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/workouts - Get all workouts for a user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
        workoutTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

// POST /api/workouts - Create a new workout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      date,
      trainingVolume,
      details,
      preSessionFeel,
      dayAfterTiredness,
      focusLevel,
      notes,
      sector,
      mentalPracticeType,
      timeOfDay,
      gratitude,
      improvements,
      mentalState,
      planId,
    } = body

    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        type,
        startTime: new Date(date),
        trainingVolume,
        details,
        preSessionFeel,
        dayAfterTiredness,
        focusLevel,
        notes,
        sector,
        mentalPracticeType,
        timeOfDay,
        gratitude,
        improvements,
        mentalState,
        planId: planId || null,
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
        workoutTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}
