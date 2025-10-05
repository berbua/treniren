import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/user-profile - Get user profile
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
    const { nickname, cycleAvgLengthDays, lastPeriodDate, timezone, photoUrl, googleSheetsUrl, latePeriodNotificationsEnabled } = body
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Update user nickname if provided
    if (nickname !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { nickname }
      })
    }
    
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        cycleAvgLengthDays,
        lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
        timezone,
        photoUrl,
        // Store late period notification preference in googleSheetsUrl field for now
        // In a real app, you'd add a proper column to the schema
        googleSheetsUrl: googleSheetsUrl || (latePeriodNotificationsEnabled !== undefined ? JSON.stringify({ latePeriodNotificationsEnabled }) : null),
      },
      create: {
        userId: user.id,
        cycleAvgLengthDays,
        lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
        timezone,
        photoUrl,
        googleSheetsUrl: googleSheetsUrl || (latePeriodNotificationsEnabled !== undefined ? JSON.stringify({ latePeriodNotificationsEnabled }) : null),
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
