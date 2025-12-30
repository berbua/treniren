import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

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
    const { name, description, exercises, variations } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Routine name is required' },
        { status: 400 }
      )
    }

    // Create routine with exercises and variations
    const routine = await prisma.routine.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        routineExercises: exercises && exercises.length > 0 ? {
          create: exercises.map((ex: any, index: number) => ({
            exerciseId: ex.exerciseId,
            order: ex.order !== undefined ? ex.order : index,
            notes: ex.notes || null,
          })),
        } : undefined,
        variations: variations && variations.length > 0 ? {
          create: variations.map((variation: any) => ({
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create routine'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}


