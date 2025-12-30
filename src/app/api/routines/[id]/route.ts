import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/routines/[id] - Get a specific routine
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    const routine = await prisma.routine.findFirst({
      where: {
        id,
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
    })

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(routine)
  } catch (error) {
    console.error('Error fetching routine:', error)
    return NextResponse.json(
      { error: 'Failed to fetch routine' },
      { status: 500 }
    )
  }
}

// PUT /api/routines/[id] - Update a routine
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, exercises, variations } = body

    // Verify routine belongs to user
    const existingRoutine = await prisma.routine.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingRoutine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      )
    }

    // Update routine using transaction to handle exercises and variations
    const routine = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const updatedRoutine = await tx.routine.update({
        where: { id },
        data: {
          name: name?.trim() || existingRoutine.name,
          description: description?.trim() || null,
        },
      })

      // Delete existing exercises and variations
      await tx.routineExercise.deleteMany({
        where: { routineId: id },
      })
      await tx.routineVariation.deleteMany({
        where: { routineId: id },
      })

      // Create new exercises
      if (exercises && exercises.length > 0) {
        await tx.routineExercise.createMany({
          data: exercises.map((ex: any, index: number) => ({
            routineId: id,
            exerciseId: ex.exerciseId,
            order: ex.order !== undefined ? ex.order : index,
            notes: ex.notes || null,
          })),
        })
      }

      // Create new variations
      if (variations && variations.length > 0) {
        await tx.routineVariation.createMany({
          data: variations.map((variation: any) => ({
            routineId: id,
            name: variation.name,
            description: variation.description || null,
            defaultSets: variation.defaultSets || null,
            defaultRepRangeMin: variation.defaultRepRangeMin || null,
            defaultRepRangeMax: variation.defaultRepRangeMax || null,
            defaultRIR: variation.defaultRIR || null,
          })),
        })
      }

      // Return updated routine with relations
      return await tx.routine.findUnique({
        where: { id },
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
    })

    return NextResponse.json(routine)
  } catch (error) {
    console.error('Error updating routine:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update routine'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/routines/[id] - Delete a routine
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify routine belongs to user
    const routine = await prisma.routine.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      )
    }

    // Delete routine (cascade will handle exercises and variations)
    await prisma.routine.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting routine:', error)
    return NextResponse.json(
      { error: 'Failed to delete routine' },
      { status: 500 }
    )
  }
}


