import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/workouts/[id] - Get a specific workout
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const workout = await prisma.workout.findFirst({
      where: { 
        id,
        userId: user.id 
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
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
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
      timeOfDay,
      gratitude,
      improvements,
      mentalState,
    } = body

    const user = await requireAuth(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const workout = await prisma.workout.updateMany({
      where: { 
        id,
        userId: user.id 
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
        timeOfDay,
        gratitude,
        improvements,
        mentalState,
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
        userId: user.id 
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
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
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
    const user = await requireAuth(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const workout = await prisma.workout.deleteMany({
      where: { 
        id,
        userId: user.id 
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
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
