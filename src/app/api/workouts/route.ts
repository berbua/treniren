import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workouts - Get all workouts for a user
export async function GET() {
  try {
    // For MVP, we'll use a hardcoded user ID
    // Later this will come from authentication
    const userId = 'temp-user-id'
    
    const workouts = await prisma.workout.findMany({
      where: { userId },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
      orderBy: { date: 'desc' },
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
      notes,
      planId,
    } = body

    // For MVP, we'll use a hardcoded user ID
    const userId = 'temp-user-id'

    const workout = await prisma.workout.create({
      data: {
        userId,
        type,
        date: new Date(date),
        trainingVolume,
        details,
        preSessionFeel,
        dayAfterTiredness,
        notes,
        planId: planId || null,
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            sets: true,
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
