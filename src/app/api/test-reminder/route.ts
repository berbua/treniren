import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/test-reminder - Get test reminder settings
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        testReminderEnabled: true,
        testReminderInterval: true,
        testReminderUnit: true,
      },
    })
    
    return NextResponse.json({
      testReminderEnabled: profile?.testReminderEnabled || false,
      testReminderInterval: profile?.testReminderInterval || null,
      testReminderUnit: profile?.testReminderUnit || null,
    })
  } catch (error) {
    console.error('Error fetching test reminder settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test reminder settings' },
      { status: 500 }
    )
  }
}

// POST /api/test-reminder - Update test reminder settings
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
    const { enabled, interval, unit } = body
    
    if (enabled && (!interval || interval < 1 || interval > 12 || !unit)) {
      return NextResponse.json(
        { error: 'When enabled, interval (1-12) and unit (days/weeks/months) are required' },
        { status: 400 }
      )
    }
    
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        testReminderEnabled: enabled || false,
        testReminderInterval: enabled ? interval : null,
        testReminderUnit: enabled ? unit : null,
      },
      create: {
        userId: user.id,
        testReminderEnabled: enabled || false,
        testReminderInterval: enabled ? interval : null,
        testReminderUnit: enabled ? unit : null,
      },
    })
    
    return NextResponse.json({
      testReminderEnabled: profile.testReminderEnabled,
      testReminderInterval: profile.testReminderInterval,
      testReminderUnit: profile.testReminderUnit,
    })
  } catch (error) {
    console.error('Error updating test reminder settings:', error)
    return NextResponse.json(
      { error: 'Failed to update test reminder settings' },
      { status: 500 }
    )
  }
}


