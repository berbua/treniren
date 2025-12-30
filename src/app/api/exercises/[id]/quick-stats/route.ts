import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/exercises/[id]/quick-stats - Get quick stats for an exercise
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
    
    // Verify exercise belongs to user
    const exercise = await prisma.exercise.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Get the most recent workout with this exercise
    const mostRecentWorkoutExercise = await prisma.workoutExercise.findFirst({
      where: {
        exerciseId: id,
        workout: {
          userId: user.id
        }
      },
      include: {
        workout: {
          select: {
            startTime: true
          }
        },
        sets: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        workout: {
          startTime: 'desc'
        }
      }
    })

    if (!mostRecentWorkoutExercise || mostRecentWorkoutExercise.sets.length === 0) {
      return NextResponse.json({
        lastUsed: null,
        lastWeight: null,
        lastReps: null,
        timesUsed: 0,
      })
    }

    const lastSet = mostRecentWorkoutExercise.sets[0]
    const lastWorkout = mostRecentWorkoutExercise.workout

    // Count total times used
    const timesUsed = await prisma.workoutExercise.count({
      where: {
        exerciseId: id,
        workout: {
          userId: user.id
        }
      }
    })

    return NextResponse.json({
      lastUsed: lastWorkout.startTime.toISOString(),
      lastWeight: lastSet.weight || null,
      lastReps: lastSet.reps || null,
      timesUsed,
    })
  } catch (error) {
    console.error('Error fetching exercise quick stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise stats' },
      { status: 500 }
    )
  }
}


