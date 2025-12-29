import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/exercises - Get all exercises for a user with usage stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const exercises = await prisma.exercise.findMany({
      where: { userId: user.id },
      include: {
        workoutExercises: {
          include: {
            workout: {
              select: {
                startTime: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    })

    // Add usage stats to each exercise
    const exercisesWithStats = exercises.map(exercise => {
      const timesUsed = exercise.workoutExercises.length
      const lastUsed = exercise.workoutExercises.length > 0
        ? exercise.workoutExercises
            .map(we => new Date(we.workout.startTime))
            .sort((a, b) => b.getTime() - a.getTime())[0]
        : null

      return {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        defaultUnit: exercise.defaultUnit,
        userId: exercise.userId,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString(),
        stats: {
          timesUsed,
          lastUsed: lastUsed?.toISOString() || null,
        }
      }
    })

    return NextResponse.json(exercisesWithStats)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

// POST /api/exercises - Create a new exercise
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, defaultUnit } = body

    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const exercise = await prisma.exercise.create({
      data: {
        userId: user.id,
        name,
        category,
        defaultUnit: defaultUnit || 'kg',
      },
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}
