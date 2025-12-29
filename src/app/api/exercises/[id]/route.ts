import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/exercises/[id] - Get a specific exercise with usage stats
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
    
    const exercise = await prisma.exercise.findFirst({
      where: { 
        id,
        userId: user.id 
      },
      include: {
        workoutExercises: {
          include: {
            workout: {
              select: {
                startTime: true,
              }
            },
            sets: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Calculate usage stats
    const timesUsed = exercise.workoutExercises.length
    const lastUsed = exercise.workoutExercises.length > 0
      ? exercise.workoutExercises
          .map(we => new Date(we.workout.startTime))
          .sort((a, b) => b.getTime() - a.getTime())[0]
      : null

    return NextResponse.json({
      ...exercise,
      stats: {
        timesUsed,
        lastUsed,
      }
    })
  } catch (error) {
    console.error('Error fetching exercise:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    )
  }
}

// PUT /api/exercises/[id] - Update an exercise
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { name, category, defaultUnit } = body
    const user = await requireAuth(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if exercise exists and belongs to user
    const existingExercise = await prisma.exercise.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    })

    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        name,
        category,
        defaultUnit: defaultUnit || 'kg',
      },
    })

    return NextResponse.json(exercise)
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    )
  }
}

// DELETE /api/exercises/[id] - Delete an exercise
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

    // Check if exercise exists and belongs to user
    const existingExercise = await prisma.exercise.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    })

    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Delete exercise (cascade will handle workoutExercises and sets)
    await prisma.exercise.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    )
  }
}

