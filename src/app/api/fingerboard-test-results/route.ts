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

    // Match testHangId from request (which might be a temporary ID like "hang-0") to the actual database hang
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolvedResults: { result: any; testHang: (typeof protocol.testHangs)[number] }[] = []
    for (const result of results) {
      const testHangId = typeof result?.testHangId === 'string' ? result.testHangId : ''
      let testHang = protocol.testHangs.find((th) => th.id === testHangId)
      if (!testHang && testHangId.startsWith('hang-')) {
        const order = parseInt(testHangId.replace('hang-', ''))
        testHang = protocol.testHangs.find((th) => th.order === order)
      }
      if (!testHang) {
        return NextResponse.json(
          { error: `Test hang ${testHangId} not found in protocol` },
          { status: 400 }
        )
      }
      resolvedResults.push({ result, testHang })
    }

    const saveReminder = !!reminderSettings?.enabled
    if (saveReminder) {
      const { interval, unit } = reminderSettings
      if (!Number.isInteger(interval) || interval < 1 || interval > 365 || !['days', 'weeks', 'months'].includes(unit)) {
        return NextResponse.json(
          { error: 'Reminder needs an interval of 1-365 and a unit of days, weeks or months' },
          { status: 400 }
        )
      }
    }

    // All results and the reminder are saved together, so a failure leaves nothing half-saved
    const testResults = await prisma.$transaction(async (tx) => {
      const created = []
      for (const { result, testHang } of resolvedResults) {
        created.push(await tx.fingerboardTestResult.create({
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
        }))
      }

      // Update user profile with reminder settings if provided
      if (saveReminder) {
        await tx.userProfile.upsert({
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

      return created
    })

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

