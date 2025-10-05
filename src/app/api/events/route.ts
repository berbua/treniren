import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/events - Get all events for a user
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const events = await prisma.event.findMany({
      where: { userId: user.id },
      include: {
        eventTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      severity,
      status,
      notes,
      tagIds,
      // Trip-specific fields
      tripStartDate,
      tripEndDate,
      destination,
      climbingType,
      showCountdown,
    } = body

    const user = await requireAuth(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const event = await prisma.event.create({
      data: {
        userId: user.id,
        type: type === 'TRIP' ? 'TRIP' : type as EventType,
        title,
        date: new Date(date),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        description,
        location,
        severity,
        status,
        notes,
        // Trip-specific fields
        tripStartDate: tripStartDate ? new Date(tripStartDate) : null,
        tripEndDate: tripEndDate ? new Date(tripEndDate) : null,
        destination,
        climbingType,
        showCountdown: showCountdown || false,
        eventTags: tagIds ? {
          create: tagIds.map((tagId: string) => ({
            tagId,
          }))
        } : undefined,
      },
      include: {
        eventTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
