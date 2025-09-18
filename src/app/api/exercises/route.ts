import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/exercises - Get all exercises for a user
export async function GET() {
  try {
    const userId = 'temp-user-id'
    
    const exercises = await prisma.exercise.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

// POST /api/exercises - Create a new exercise
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, defaultUnit } = body

    const userId = 'temp-user-id'

    const exercise = await prisma.exercise.create({
      data: {
        userId,
        name,
        category,
        defaultUnit: defaultUnit || 'kg',
      },
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}
