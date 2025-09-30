import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/workouts/[id] - Get a specific workout
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = 'temp-user-id'
    const { id } = await params
    
    const workout = await prisma.workout.findFirst({
      where: { 
        id,
        userId 
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

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    )
  }
}

// PUT /api/workouts/[id] - Update a workout
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      gratitude,
      improvements,
    } = body

    const userId = 'temp-user-id'
    const { id } = await params

    const workout = await prisma.workout.updateMany({
      where: { 
        id,
        userId 
      },
      data: {
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
        gratitude,
        improvements,
      },
    })

    if (workout.count === 0) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Fetch and return the updated workout
    const updatedWorkout = await prisma.workout.findFirst({
      where: { 
        id,
        userId 
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

    return NextResponse.json(updatedWorkout)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    )
  }
}

// DELETE /api/workouts/[id] - Delete a workout
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = 'temp-user-id'
    const { id } = await params

    const workout = await prisma.workout.deleteMany({
      where: { 
        id,
        userId 
      },
    })

    if (workout.count === 0) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
