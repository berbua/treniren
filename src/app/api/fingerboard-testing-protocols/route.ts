import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/fingerboard-testing-protocols - Get all testing protocols for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const protocols = await prisma.fingerboardTestingProtocol.findMany({
      where: {
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
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(protocols)
  } catch (error) {
    console.error('Error fetching testing protocols:', error)
    return NextResponse.json(
      { error: 'Failed to fetch testing protocols' },
      { status: 500 }
    )
  }
}

// POST /api/fingerboard-testing-protocols - Create a new testing protocol
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
    const { name, description, testHangs } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Protocol name is required' },
        { status: 400 }
      )
    }

    // Create testing protocol with test hangs
    const protocol = await prisma.fingerboardTestingProtocol.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        testHangs: testHangs && testHangs.length > 0 ? {
          create: testHangs.map((hang: any, index: number) => ({
            order: hang.order !== undefined ? hang.order : index,
            handType: hang.handType,
            gripType: hang.gripType,
            crimpSize: hang.crimpSize || null,
            customDescription: hang.customDescription || null,
            targetLoad: hang.targetLoad || null,
            targetTimeSeconds: hang.targetTimeSeconds || null,
            notes: hang.notes || null,
          })),
        } : undefined,
      },
      include: {
        testHangs: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json(protocol, { status: 201 })
  } catch (error) {
    console.error('Error creating testing protocol:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create testing protocol'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

