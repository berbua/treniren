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
    const { 
      nickname, 
      cycleAvgLengthDays, 
      lastPeriodDate, 
      timezone, 
      photoUrl, 
      googleSheetsUrl, 
      latePeriodNotificationsEnabled,
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
    
    // Update user nickname if provided
    if (nickname !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { nickname }
      })
    }
    
    // Prepare update data - only include fields that are provided
    const updateData: any = {}
    if (cycleAvgLengthDays !== undefined) updateData.cycleAvgLengthDays = cycleAvgLengthDays
    if (lastPeriodDate !== undefined) updateData.lastPeriodDate = lastPeriodDate ? new Date(lastPeriodDate) : null
    if (timezone !== undefined) updateData.timezone = timezone
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl
    if (googleSheetsUrl !== undefined || latePeriodNotificationsEnabled !== undefined) {
      updateData.googleSheetsUrl = googleSheetsUrl || (latePeriodNotificationsEnabled !== undefined ? JSON.stringify({ latePeriodNotificationsEnabled }) : null)
    }
    // Training goals
    if (weeklyWorkoutGoal !== undefined) updateData.weeklyWorkoutGoal = weeklyWorkoutGoal
    if (monthlyWorkoutGoal !== undefined) updateData.monthlyWorkoutGoal = monthlyWorkoutGoal
    if (useAutoMonthlyGoal !== undefined) updateData.useAutoMonthlyGoal = useAutoMonthlyGoal
    if (workoutTypeGoals !== undefined) updateData.workoutTypeGoals = workoutTypeGoals
    
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        cycleAvgLengthDays: cycleAvgLengthDays || 28,
        lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
        timezone: timezone || 'Europe/Warsaw',
        photoUrl,
        googleSheetsUrl: googleSheetsUrl || (latePeriodNotificationsEnabled !== undefined ? JSON.stringify({ latePeriodNotificationsEnabled }) : null),
        weeklyWorkoutGoal: weeklyWorkoutGoal || 3,
        monthlyWorkoutGoal,
        useAutoMonthlyGoal: useAutoMonthlyGoal !== undefined ? useAutoMonthlyGoal : true,
        workoutTypeGoals: workoutTypeGoals || null,
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
