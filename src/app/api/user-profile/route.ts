import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'

// Older versions stored the late-period reminder setting as JSON in googleSheetsUrl.
// That setting lives in the client's notification settings, so hide the leftover value.
const isLegacyNotificationSettings = (value: string | null): boolean => {
  if (!value || !value.trim().startsWith('{')) return false
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null && 'latePeriodNotificationsEnabled' in parsed
  } catch {
    return false
  }
}

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
    
    if (profile && isLegacyNotificationSettings(profile.googleSheetsUrl)) {
      profile.googleSheetsUrl = null
    }
    
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
    const { 
      nickname, 
      cycleAvgLengthDays, 
      lastPeriodDate, 
      timezone, 
      photoUrl, 
      googleSheetsUrl, 
      weeklyWorkoutGoal,
      monthlyWorkoutGoal,
      useAutoMonthlyGoal,
      workoutTypeGoals
    } = body
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Update user nickname if provided (empty clears it, so the first word of the Google name is used again)
    if (nickname !== undefined) {
      if (nickname !== null && typeof nickname !== 'string') {
        return NextResponse.json({ error: 'Invalid display name' }, { status: 400 })
      }
      const trimmed = nickname?.trim() || null
      if (trimmed && trimmed.length > 50) {
        return NextResponse.json({ error: 'Display name is too long' }, { status: 400 })
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { nickname: trimmed }
      })
    }
    
    // Prepare update data - only include fields that are provided
    const updateData: any = {}
    if (cycleAvgLengthDays !== undefined) updateData.cycleAvgLengthDays = cycleAvgLengthDays
    if (lastPeriodDate !== undefined) updateData.lastPeriodDate = lastPeriodDate ? new Date(lastPeriodDate) : null
    if (timezone !== undefined) updateData.timezone = timezone
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl
    if (googleSheetsUrl !== undefined) updateData.googleSheetsUrl = googleSheetsUrl || null
    // Training goals
    if (weeklyWorkoutGoal !== undefined) updateData.weeklyWorkoutGoal = weeklyWorkoutGoal
    if (monthlyWorkoutGoal !== undefined) updateData.monthlyWorkoutGoal = monthlyWorkoutGoal
    if (useAutoMonthlyGoal !== undefined) updateData.useAutoMonthlyGoal = useAutoMonthlyGoal
    // Prisma rejects a plain null for Json columns
    const workoutTypeGoalsValue = workoutTypeGoals ? (workoutTypeGoals as Prisma.InputJsonValue) : Prisma.JsonNull
    if (workoutTypeGoals !== undefined) updateData.workoutTypeGoals = workoutTypeGoalsValue
    
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        cycleAvgLengthDays: cycleAvgLengthDays || 28,
        lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
        timezone: timezone || 'Europe/Warsaw',
        photoUrl,
        googleSheetsUrl: googleSheetsUrl || null,
        weeklyWorkoutGoal: weeklyWorkoutGoal || 3,
        monthlyWorkoutGoal,
        useAutoMonthlyGoal: useAutoMonthlyGoal !== undefined ? useAutoMonthlyGoal : true,
        workoutTypeGoals: workoutTypeGoalsValue,
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
