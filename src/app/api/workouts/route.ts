import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'
import { CreateWorkoutSchema, formatValidationError } from '@/lib/validation'
import { applySecurity } from '@/lib/api-security'

// GET /api/workouts - Get all workouts for a user (with pagination support)
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResponse = await applySecurity(request, { csrf: false })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Parse pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit
    
    // Get total count for pagination metadata
    const totalCount = await prisma.workout.count({
      where: { userId: user.id },
    })
    
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
      skip,
      take: limit,
    })

    return NextResponse.json({
      workouts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + workouts.length < totalCount,
      },
    })
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
    // Apply security middleware
    const securityResponse = await applySecurity(request, { rateLimit: 'normal', csrf: true })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = CreateWorkoutSchema.safeParse(body)
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
      planId,
      tagIds,
      exercises,
      fingerboardHangs,
    } = validationResult.data

    // Merge details if provided (e.g., for variation info)
    // Convert to Prisma JSON format
    const workoutDetails = details === null 
      ? Prisma.JsonNull 
      : (details as Prisma.InputJsonValue)
    
    // Convert timeOfDay to Prisma JSON format
    const timeOfDayValue = timeOfDay === null 
      ? Prisma.JsonNull 
      : (timeOfDay as Prisma.InputJsonValue)
    
    // Convert mentalState to Prisma JSON format (it's also JSON in schema)
    const mentalStateValue = mentalState === null 
      ? Prisma.JsonNull 
      : (mentalState as Prisma.InputJsonValue)

    // Validate tagIds exist and belong to user
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

    // Validate exercises exist and belong to user
    if (exercises && exercises.length > 0) {
      const exerciseIds = exercises.map((e) => e.exerciseId)
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

    // Create workout with tags and exercises
    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        type,
        startTime: new Date(date),
        trainingVolume: trainingVolume || null,
        details: workoutDetails,
        preSessionFeel,
        dayAfterTiredness,
        focusLevel,
        notes,
        sector,
        mentalPracticeType,
        timeOfDay: timeOfDayValue,
        gratitude,
        improvements,
        mentalState: mentalStateValue,
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
