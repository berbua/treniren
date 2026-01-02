import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-helpers'

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
      // Cycle tracking for injuries
      cycleDay,
      cycleDayManuallySet,
    } = body

    const user = await requireAuth(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // First, delete existing tags
    await prisma.eventTag.deleteMany({
      where: { eventId: id }
    })

    const event = await prisma.event.updateMany({
      where: { 
        id,
        userId: user.id 
      },
      data: {
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
      },
    })

    if (event.count === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Add new tags if provided
    if (tagIds && tagIds.length > 0) {
      await prisma.eventTag.createMany({
        data: tagIds.map((tagId: string) => ({
          eventId: id,
          tagId,
        }))
      })
    }

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
    const body = await request.json()
    const { cycleDay, cycleDayManuallySet } = body

    const user = await requireAuth(request)
    const { id } = await params

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {}
    if (cycleDay !== undefined) {
      updateData.cycleDay = cycleDay === null || cycleDay === undefined ? null : Number(cycleDay)
    }
    if (cycleDayManuallySet !== undefined) {
      updateData.cycleDayManuallySet = Boolean(cycleDayManuallySet)
    }

    console.log('PATCH /api/events/[id] - Updating cycle day:', { id, updateData })

    const event = await prisma.event.updateMany({
      where: { 
        id,
        userId: user.id 
      },
      data: updateData,
    })

    if (event.count === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

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
