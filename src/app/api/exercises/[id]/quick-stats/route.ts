import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { calculate1RM } from '@/lib/1rm-calculator'

const IMPROVING_WINDOW = 3 // sessions compared: last 3 vs the 3 before
const IMPROVING_MAX_AGE_DAYS = 42

// Best set of a session: est. 1RM for weighted sets, otherwise max reps
const sessionBest = (sets: { weight: number | null; reps: number | null; rir: number | null }[]) => {
  const valid = sets.filter(s => s.reps !== null && s.reps > 0)
  const weighted = valid.filter(s => s.weight !== null && s.weight > 0)
  if (weighted.length > 0) {
    return Math.max(...weighted.map(s => calculate1RM(s.weight!, s.reps!, s.rir ?? undefined)))
  }
  return valid.length > 0 ? Math.max(...valid.map(s => s.reps!)) : null
}

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
        improving: false,
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

    // "Improving": recent best set beats the previous sessions' best, and the exercise is still in use
    const recentSessions = await prisma.workoutExercise.findMany({
      where: { exerciseId: id, workout: { userId: user.id } },
      select: { sets: { select: { weight: true, reps: true, rir: true } } },
      orderBy: { workout: { startTime: 'desc' } },
      take: IMPROVING_WINDOW * 2,
    })
    const bests = recentSessions.map(session => sessionBest(session.sets)).filter((b): b is number => b !== null)
    const recentBest = Math.max(...bests.slice(0, IMPROVING_WINDOW))
    const previousBest = Math.max(...bests.slice(IMPROVING_WINDOW))
    const daysSinceLastUse = (Date.now() - lastWorkout.startTime.getTime()) / (24 * 60 * 60 * 1000)
    const improving =
      bests.length > IMPROVING_WINDOW && recentBest > previousBest && daysSinceLastUse <= IMPROVING_MAX_AGE_DAYS

    return NextResponse.json({
      lastUsed: lastWorkout.startTime.toISOString(),
      lastWeight: lastSet.weight || null,
      lastReps: lastSet.reps || null,
      timesUsed,
      improving,
    })
  } catch (error) {
    console.error('Error fetching exercise quick stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise stats' },
      { status: 500 }
    )
  }
}




