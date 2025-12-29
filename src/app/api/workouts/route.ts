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
        fingerboardHangs: {
          orderBy: {
            order: 'asc',
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
      tagIds,
      exercises,
      fingerboardHangs,
    } = body

    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create workout with tags and exercises
    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        type,
        startTime: new Date(date),
        trainingVolume: trainingVolume || null,
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
        workoutTags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tagId,
          })),
        } : undefined,
        workoutExercises: exercises && exercises.length > 0 ? {
          create: exercises.map((exerciseData: any, index: number) => ({
            exerciseId: exerciseData.exerciseId,
            order: exerciseData.order !== undefined ? exerciseData.order : index,
            sets: exerciseData.sets && exerciseData.sets.length > 0 ? {
              create: exerciseData.sets.map((set: any, setIndex: number) => ({
                setNumber: setIndex + 1,
                reps: set.reps || null,
                weight: set.weight || null,
                rir: set.rir || null,
                notes: set.notes || null,
              })),
            } : undefined,
          })),
        } : undefined,
        fingerboardHangs: fingerboardHangs && fingerboardHangs.length > 0 ? {
          create: fingerboardHangs.map((hang: any, index: number) => ({
            order: hang.order !== undefined ? hang.order : index,
            handType: hang.handType,
            gripType: hang.gripType,
            crimpSize: hang.crimpSize || null,
            customDescription: hang.customDescription || null,
            load: hang.load || null,
            unload: hang.unload || null,
            reps: hang.reps || null,
            timeSeconds: hang.timeSeconds || null,
            notes: hang.notes || null,
          })),
        } : undefined,
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: {
                setNumber: 'asc',
              },
            },
          },
        },
        workoutTags: {
          include: {
            tag: true,
          },
        },
        fingerboardHangs: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    console.error('Error creating workout:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create workout'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
