import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'
import { CreateEventSchema, formatValidationError } from '@/lib/validation'
import { applySecurity } from '@/lib/api-security'

// GET /api/events - Get all events for a user (with pagination support)
export async function GET(request: NextRequest) {
  try {
    // Apply security middleware - disable rate limiting for GET requests (they're safe and frequently used)
    const securityResponse = await applySecurity(request, { csrf: false, rateLimit: false })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Parse pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const skip = (page - 1) * limit
    
    // Get total count for pagination metadata
    const totalCount = await prisma.event.count({
      where: { userId: user.id },
    })
    
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
      skip,
      take: limit,
    })

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + events.length < totalCount,
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to fetch events',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const securityResponse = await applySecurity(request, { rateLimit: 'normal', csrf: true })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = CreateEventSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationError(validationResult.error),
        },
        { status: 400 }
      )
    }

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
      // Cycle tracking for injuries
      cycleDay,
      cycleDayManuallySet,
    } = validationResult.data

    // Validate tagIds exist and belong to user
    if (tagIds && tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          userId: user.id,
        },
      })
      if (existingTags.length !== tagIds.length) {
        return NextResponse.json(
          { error: 'One or more tags not found or do not belong to user' },
          { status: 400 }
        )
      }
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
        // Cycle tracking for injuries
        cycleDay: cycleDay !== undefined ? cycleDay : null,
        cycleDayManuallySet: cycleDayManuallySet || false,
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
