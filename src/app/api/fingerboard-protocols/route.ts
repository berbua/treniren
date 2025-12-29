import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/fingerboard-protocols - Get all protocols for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const protocols = await prisma.fingerboardProtocol.findMany({
      where: {
        userId: user.id,
      },
      include: {
        hangs: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(protocols)
  } catch (error) {
    console.error('Error fetching fingerboard protocols:', error)
    return NextResponse.json(
      { error: 'Failed to fetch protocols' },
      { status: 500 }
    )
  }
}

// POST /api/fingerboard-protocols - Create a new protocol
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
    const { name, description, hangs } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Protocol name is required' },
        { status: 400 }
      )
    }

    // Create protocol with hangs
    const protocol = await prisma.fingerboardProtocol.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        hangs: hangs && hangs.length > 0 ? {
          create: hangs.map((hang: any, index: number) => ({
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
        } : undefined,
      },
      include: {
        hangs: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json(protocol, { status: 201 })
  } catch (error) {
    console.error('Error creating fingerboard protocol:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create protocol'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

