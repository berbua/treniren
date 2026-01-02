import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'
import { UpdateEventSchema, UpdateCycleDaySchema, formatValidationError } from '@/lib/validation'

// GET /api/events/[id] - Get a specific event
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
    
    const event = await prisma.event.findFirst({
      where: { 
        id,
        userId: user.id 
      },
      include: {
        eventTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update an event
export async function PUT(
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

    // Verify event exists and belongs to user
    const existingEvent = await prisma.event.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = UpdateEventSchema.safeParse(body)
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

    // Validate tagIds if provided
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

    // Update event using transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Delete existing tags
      await tx.eventTag.deleteMany({
        where: { eventId: id }
      })

      // Update event
      await tx.event.update({
        where: { id },
        data: {
          ...(type && { type: type === 'TRIP' ? 'TRIP' : type as EventType }),
          ...(title && { title }),
          ...(date && { date: new Date(date) }),
          ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
          ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
          ...(description !== undefined && { description }),
          ...(location !== undefined && { location }),
          ...(severity !== undefined && { severity }),
          ...(status !== undefined && { status }),
          ...(notes !== undefined && { notes }),
          // Trip-specific fields
          ...(tripStartDate !== undefined && { tripStartDate: tripStartDate ? new Date(tripStartDate) : null }),
          ...(tripEndDate !== undefined && { tripEndDate: tripEndDate ? new Date(tripEndDate) : null }),
          ...(destination !== undefined && { destination }),
          ...(climbingType !== undefined && { climbingType }),
          ...(showCountdown !== undefined && { showCountdown }),
          // Cycle tracking for injuries
          ...(cycleDay !== undefined && { cycleDay }),
          ...(cycleDayManuallySet !== undefined && { cycleDayManuallySet }),
        },
      })

      // Add new tags if provided
      if (tagIds && tagIds.length > 0) {
        await tx.eventTag.createMany({
          data: tagIds.map((tagId: string) => ({
            eventId: id,
            tagId,
          }))
        })
      }

      // Return updated event with relations
      return await tx.event.findUnique({
        where: { id },
        include: {
          eventTags: {
            include: {
              tag: true,
            },
          },
        },
      })
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// PATCH /api/events/[id] - Partially update an event (e.g., just cycleDay)
export async function PATCH(
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

    // Verify event exists and belongs to user
    const existingEvent = await prisma.event.findFirst({
      where: { id, userId: user.id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validationResult = UpdateCycleDaySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationError(validationResult.error),
        },
        { status: 400 }
      )
    }

    const { cycleDay, cycleDayManuallySet } = validationResult.data

    // Prepare update data - only include fields that are provided
    const updateData: { cycleDay?: number | null; cycleDayManuallySet?: boolean } = {}
    if (cycleDay !== undefined) {
      updateData.cycleDay = cycleDay
    }
    if (cycleDayManuallySet !== undefined) {
      updateData.cycleDayManuallySet = cycleDayManuallySet
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    // Fetch and return the updated event
    const updatedEvent = await prisma.event.findFirst({
      where: { 
        id,
        userId: user.id 
      },
      include: {
        eventTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json(updatedEvent)
  } catch (error: any) {
    console.error('Error updating event cycle day:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json(
      { error: 'Failed to update event', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete an event
export async function DELETE(
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

    const event = await prisma.event.deleteMany({
      where: { 
        id,
        userId: user.id 
      },
    })

    if (event.count === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
