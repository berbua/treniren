import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/fingerboard-testing-protocols/[id] - Get a specific testing protocol
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

    const protocol = await prisma.fingerboardTestingProtocol.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        testHangs: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            testResults: true,
          },
        },
      },
    })

    if (!protocol) {
      return NextResponse.json(
        { error: 'Testing protocol not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Error fetching testing protocol:', error)
    return NextResponse.json(
      { error: 'Failed to fetch testing protocol' },
      { status: 500 }
    )
  }
}

// PUT /api/fingerboard-testing-protocols/[id] - Update a testing protocol
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
    const { name, description, testHangs } = body

    // Verify protocol belongs to user
    const existingProtocol = await prisma.fingerboardTestingProtocol.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingProtocol) {
      return NextResponse.json(
        { error: 'Testing protocol not found' },
        { status: 404 }
      )
    }

    // Update protocol using transaction
    const protocol = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const updatedProtocol = await tx.fingerboardTestingProtocol.update({
        where: { id },
        data: {
          name: name?.trim() || existingProtocol.name,
          description: description?.trim() || null,
        },
      })

      // Delete existing test hangs
      await tx.fingerboardTestHang.deleteMany({
        where: { protocolId: id },
      })

      // Create new test hangs
      if (testHangs && testHangs.length > 0) {
        await tx.fingerboardTestHang.createMany({
          data: testHangs.map((hang: any, index: number) => ({
            protocolId: id,
            order: hang.order !== undefined ? hang.order : index,
            handType: hang.handType,
            gripType: hang.gripType,
            crimpSize: hang.crimpSize || null,
            customDescription: hang.customDescription || null,
            targetLoad: hang.targetLoad || null,
            targetTimeSeconds: hang.targetTimeSeconds || null,
            notes: hang.notes || null,
          })),
        })
      }

      // Return updated protocol with relations
      return await tx.fingerboardTestingProtocol.findUnique({
        where: { id },
        include: {
          testHangs: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      })
    })

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Error updating testing protocol:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update testing protocol'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/fingerboard-testing-protocols/[id] - Delete a testing protocol
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

    // Verify protocol belongs to user
    const protocol = await prisma.fingerboardTestingProtocol.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!protocol) {
      return NextResponse.json(
        { error: 'Testing protocol not found' },
        { status: 404 }
      )
    }

    // Delete protocol (cascade will handle test hangs and results)
    await prisma.fingerboardTestingProtocol.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting testing protocol:', error)
    return NextResponse.json(
      { error: 'Failed to delete testing protocol' },
      { status: 500 }
    )
  }
}




