import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { CreateRoutineSchema, formatValidationError } from '@/lib/validation'
import { validateRoutineExercises } from '@/lib/routine-utils'

// GET /api/routines - Get all routines for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const routines = await prisma.routine.findMany({
      where: {
        userId: user.id,
      },
      include: {
        routineExercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                defaultUnit: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        variations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(routines)
  } catch (error) {
    console.error('Error fetching routines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch routines' },
      { status: 500 }
    )
  }
}

// POST /api/routines - Create a new routine
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const validationResult = CreateRoutineSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationError(validationResult.error),
        },
        { status: 400 }
      )
    }

    const { name, description, exercises, variations } = validationResult.data

    const exercisesError = await validateRoutineExercises(user.id, exercises)
    if (exercisesError) {
      return NextResponse.json({ error: exercisesError }, { status: 400 })
    }

    // Create routine with exercises and variations
    const createdAt = Date.now()
    const routine = await prisma.routine.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        routineExercises: exercises && exercises.length > 0 ? {
          create: exercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            order: ex.order !== undefined ? ex.order : index,
            notes: ex.notes || null,
          })),
        } : undefined,
        variations: variations && variations.length > 0 ? {
          // Listed by createdAt: give each its own timestamp (1 ms apart) so they keep the order they were sent in
          create: variations.map((variation, index) => ({
            createdAt: new Date(createdAt + index),
            name: variation.name,
            description: variation.description || null,
            defaultSets: variation.defaultSets || null,
            defaultRepRangeMin: variation.defaultRepRangeMin || null,
            defaultRepRangeMax: variation.defaultRepRangeMax || null,
            defaultRIR: variation.defaultRIR || null,
          })),
        } : undefined,
      },
      include: {
        routineExercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                defaultUnit: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        variations: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    return NextResponse.json(routine, { status: 201 })
  } catch (error) {
    console.error('Error creating routine:', error)
    return NextResponse.json(
      { error: 'Failed to create routine' },
      { status: 500 }
    )
  }
}




