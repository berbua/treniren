import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/fingerboard-protocols/[id] - Get a specific protocol
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

    const protocol = await prisma.fingerboardProtocol.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        hangs: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!protocol) {
      return NextResponse.json(
        { error: 'Protocol not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Error fetching fingerboard protocol:', error)
    return NextResponse.json(
      { error: 'Failed to fetch protocol' },
      { status: 500 }
    )
  }
}

// PUT /api/fingerboard-protocols/[id] - Update a protocol
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
    const { name, description, hangs } = body

    // Verify protocol belongs to user
    const existingProtocol = await prisma.fingerboardProtocol.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingProtocol) {
      return NextResponse.json(
        { error: 'Protocol not found' },
        { status: 404 }
      )
    }

    // Update protocol using transaction
    const protocol = await prisma.$transaction(async (tx) => {
      // Update basic fields
      const updatedProtocol = await tx.fingerboardProtocol.update({
        where: { id },
        data: {
          name: name?.trim() || existingProtocol.name,
          description: description?.trim() || null,
        },
      })

      // Delete existing hangs
      await tx.fingerboardProtocolHang.deleteMany({
        where: { protocolId: id },
      })

      // Create new hangs
      if (hangs && hangs.length > 0) {
        await tx.fingerboardProtocolHang.createMany({
          data: hangs.map((hang: any, index: number) => ({
            protocolId: id,
            order: hang.order !== undefined ? hang.order : index,
            handType: hang.handType,
            gripType: hang.gripType,
            crimpSize: hang.crimpSize || null,
            customDescription: hang.customDescription || null,
            defaultLoad: hang.defaultLoad || null,
            defaultUnload: hang.defaultUnload || null,
            defaultReps: hang.defaultReps || null,
            defaultTimeSeconds: hang.defaultTimeSeconds || null,
            notes: hang.notes || null,
          })),
        })
      }

      // Return updated protocol with relations
      return await tx.fingerboardProtocol.findUnique({
        where: { id },
        include: {
          hangs: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      })
    })

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Error updating fingerboard protocol:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update protocol'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE /api/fingerboard-protocols/[id] - Delete a protocol
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
    const protocol = await prisma.fingerboardProtocol.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!protocol) {
      return NextResponse.json(
        { error: 'Protocol not found' },
        { status: 404 }
      )
    }

    // Delete protocol (cascade will handle hangs)
    await prisma.fingerboardProtocol.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fingerboard protocol:', error)
    return NextResponse.json(
      { error: 'Failed to delete protocol' },
      { status: 500 }
    )
  }
}

