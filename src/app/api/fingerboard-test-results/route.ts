import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/fingerboard-test-results - Get test results for a protocol
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const protocolId = searchParams.get('protocolId')
    const testHangId = searchParams.get('testHangId') // optional filter

    // If protocolId is 'all', fetch all test results for the user
    if (protocolId === 'all') {
      const where: any = {
        userId: user.id,
      }

      if (testHangId) {
        where.testHangId = testHangId
      }

      const testResults = await prisma.fingerboardTestResult.findMany({
        where,
        include: {
          testHang: true,
        },
        orderBy: {
          date: 'desc',
        },
      })

      return NextResponse.json(testResults)
    }

    if (!protocolId) {
      return NextResponse.json(
        { error: 'protocolId is required' },
        { status: 400 }
      )
    }

    // Verify protocol belongs to user
    const protocol = await prisma.fingerboardTestingProtocol.findFirst({
      where: {
        id: protocolId,
        userId: user.id,
      },
    })

    if (!protocol) {
      return NextResponse.json(
        { error: 'Testing protocol not found' },
        { status: 404 }
      )
    }

    const where: any = {
      protocolId,
      userId: user.id,
    }

    if (testHangId) {
      where.testHangId = testHangId
    }

    const testResults = await prisma.fingerboardTestResult.findMany({
      where,
      include: {
        testHang: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    return NextResponse.json(testResults)
  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    )
  }
}

// POST /api/fingerboard-test-results - Create test results
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
    const { protocolId, date, results, reminderSettings } = body

    if (!protocolId || !date || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'protocolId, date, and results array are required' },
        { status: 400 }
      )
    }

    // Verify protocol belongs to user
    const protocol = await prisma.fingerboardTestingProtocol.findFirst({
      where: {
        id: protocolId,
        userId: user.id,
      },
      include: {
        testHangs: true,
      },
    })

    if (!protocol) {
      return NextResponse.json(
        { error: 'Testing protocol not found' },
        { status: 404 }
      )
    }

    // Create test results
    // Match testHangId from request (which might be a temporary ID) to actual database hang
    const testResults = await Promise.all(
      results.map(async (result: any) => {
        // Try to find by ID first, then by order (for temporary IDs like "hang-0")
        let testHang = protocol.testHangs.find((th) => th.id === result.testHangId)
        if (!testHang && result.testHangId.startsWith('hang-')) {
          const order = parseInt(result.testHangId.replace('hang-', ''))
          testHang = protocol.testHangs.find((th) => th.order === order)
        }
        
        if (!testHang) {
          throw new Error(`Test hang ${result.testHangId} not found in protocol`)
        }

        return await prisma.fingerboardTestResult.create({
          data: {
            protocolId,
            testHangId: testHang.id, // Use the actual database ID
            userId: user.id,
            date: new Date(date),
            handType: testHang.handType,
            gripType: testHang.gripType,
            crimpSize: testHang.crimpSize || null,
            customDescription: testHang.customDescription || null,
            load: result.load || null,
            unload: result.unload || null,
            timeSeconds: result.timeSeconds || null,
            success: result.success ?? null,
            notes: result.notes || null,
          },
        })
      })
    )

    // Update user profile with reminder settings if provided
    if (reminderSettings && reminderSettings.enabled) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          testReminderEnabled: true,
          testReminderInterval: reminderSettings.interval,
          testReminderUnit: reminderSettings.unit,
        },
        create: {
          userId: user.id,
          testReminderEnabled: true,
          testReminderInterval: reminderSettings.interval,
          testReminderUnit: reminderSettings.unit,
        },
      })
    }

    return NextResponse.json(testResults, { status: 201 })
  } catch (error) {
    console.error('Error creating test results:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create test results'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

