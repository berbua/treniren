import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'
import { UpdateWorkoutSchema, formatValidationError } from '@/lib/validation'

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
            sets: {
              orderBy: {
                setNumber: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
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
    const user = await requireAuth(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify workout exists and belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = UpdateWorkoutSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationError(validationResult.error),
        },
        { status: 400 }
      )
    }

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
      tagIds,
      exercises,
      fingerboardHangs,
    } = validationResult.data

    // Validate tagIds if provided
    if (tagIds && tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          userId: user.id,
        },
      })
      if (existingTags.length !== tagIds.length) {
        return NextResponse.json(
          { error: 'One or more tags not found or do not belong to user' },
          { status: 400 }
        )
      }
    }

    // Validate exercises if provided
    if (exercises && exercises.length > 0) {
      const exerciseIds = exercises.map((e: { exerciseId: string }) => e.exerciseId)
      const existingExercises = await prisma.exercise.findMany({
        where: {
          id: { in: exerciseIds },
          userId: user.id,
        },
      })
      if (existingExercises.length !== exerciseIds.length) {
        return NextResponse.json(
          { error: 'One or more exercises not found or do not belong to user' },
          { status: 400 }
        )
      }
    }

    // Update workout using transaction to handle relations
    const updatedWorkout = await prisma.$transaction(async (tx) => {
      // Update basic fields - build data object with proper types
      const updateData: any = {}
      
      if (type) updateData.type = type
      if (date) updateData.startTime = new Date(date)
      if (trainingVolume !== undefined) updateData.trainingVolume = trainingVolume
      if (details !== undefined) {
        updateData.details = details === null ? Prisma.JsonNull : (details as Prisma.InputJsonValue)
      }
      if (preSessionFeel !== undefined) updateData.preSessionFeel = preSessionFeel
      if (dayAfterTiredness !== undefined) updateData.dayAfterTiredness = dayAfterTiredness
      if (focusLevel !== undefined) updateData.focusLevel = focusLevel
      if (notes !== undefined) updateData.notes = notes
      if (sector !== undefined) updateData.sector = sector
      if (mentalPracticeType !== undefined) updateData.mentalPracticeType = mentalPracticeType
      if (timeOfDay !== undefined) {
        updateData.timeOfDay = timeOfDay === null ? Prisma.JsonNull : (timeOfDay as Prisma.InputJsonValue)
      }
      if (gratitude !== undefined) updateData.gratitude = gratitude
      if (improvements !== undefined) updateData.improvements = improvements
      if (mentalState !== undefined) updateData.mentalState = mentalState

      await tx.workout.update({
        where: { id },
        data: updateData,
      })

      // Update tags if provided
      if (tagIds !== undefined) {
        await tx.workoutTag.deleteMany({ where: { workoutId: id } })
        if (tagIds.length > 0) {
          await tx.workoutTag.createMany({
            data: tagIds.map((tagId: string) => ({ workoutId: id, tagId })),
          })
        }
      }

      // Update exercises if provided
      if (exercises !== undefined) {
        await tx.workoutExercise.deleteMany({ where: { workoutId: id } })
        if (exercises.length > 0) {
          for (const exerciseData of exercises) {
            const workoutExercise = await tx.workoutExercise.create({
              data: {
                workoutId: id,
                exerciseId: exerciseData.exerciseId,
                order: exerciseData.order ?? 0,
              },
            })
            if (exerciseData.sets && exerciseData.sets.length > 0) {
              await tx.set.createMany({
                data: exerciseData.sets.map((set: { reps?: number | null; weight?: number | null; rir?: number | null; notes?: string | null }, setIndex: number) => ({
                  workoutExerciseId: workoutExercise.id,
                  setNumber: setIndex + 1,
                  reps: set.reps ?? null,
                  weight: set.weight ?? null,
                  rir: set.rir ?? null,
                  notes: set.notes ?? null,
                })),
              })
            }
          }
        }
      }

      // Update fingerboard hangs if provided
      if (fingerboardHangs !== undefined) {
        await tx.fingerboardWorkoutHang.deleteMany({ where: { workoutId: id } })
        if (fingerboardHangs.length > 0) {
          await tx.fingerboardWorkoutHang.createMany({
            data: fingerboardHangs.map((hang: { order?: number; handType: string; gripType: string; crimpSize?: number | null; customDescription?: string | null; load?: number | null; unload?: number | null; reps?: number | null; timeSeconds?: number | null; notes?: string | null }) => ({
              workoutId: id,
              order: hang.order ?? 0,
              handType: hang.handType as 'ONE_HAND' | 'BOTH_HANDS',
              gripType: hang.gripType as 'OPEN_HAND' | 'CRIMP' | 'SLOPER',
              crimpSize: hang.crimpSize ?? null,
              customDescription: hang.customDescription ?? null,
              load: hang.load ?? null,
              unload: hang.unload ?? null,
              reps: hang.reps ?? null,
              timeSeconds: hang.timeSeconds ?? null,
              notes: hang.notes ?? null,
            })),
          })
        }
      }

      // Return updated workout with relations
      return await tx.workout.findUnique({
        where: { id },
        include: {
          workoutExercises: {
            include: {
              exercise: true,
              sets: {
                orderBy: { setNumber: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          workoutTags: {
            include: { tag: true },
          },
          fingerboardHangs: {
            orderBy: { order: 'asc' },
          },
        },
      })
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
