import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/user-profile - Get user profile
export async function GET() {
  try {
    const userId = 'temp-user-id' // For MVP, using hardcoded user ID
    
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    })
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

// POST /api/user-profile - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cycleAvgLengthDays, lastPeriodDate, timezone } = body
    const userId = 'temp-user-id' // For MVP, using hardcoded user ID
    
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        cycleAvgLengthDays,
        lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
        timezone,
      },
      create: {
        userId,
        cycleAvgLengthDays,
        lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
        timezone,
      },
    })
    
    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('Error saving user profile:', error)
    return NextResponse.json(
      { error: 'Failed to save user profile' },
      { status: 500 }
    )
  }
}
