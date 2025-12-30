import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { getExerciseProgression, TimeFrame } from '@/lib/progression-service'

// GET /api/exercises/[id]/progression - Get progression data for an exercise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get timeframe from query params
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get('timeframe') as TimeFrame) || '1month'

    // Get progression data
    const progressionData = await getExerciseProgression(id, user.id, timeframe)

    if (!progressionData) {
      return NextResponse.json(
        { error: 'Exercise not found or no data available' },
        { status: 404 }
      )
    }

    return NextResponse.json(progressionData)
  } catch (error) {
    console.error('Error fetching exercise progression:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercise progression' },
      { status: 500 }
    )
  }
}


