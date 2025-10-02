import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statisticsService, TimeFrame } from '@/lib/statistics-service';
import { processActivityNotifications } from '@/lib/activity-notifications';

// GET /api/statistics - Get statistics for a specific timeframe
export async function GET(request: NextRequest) {
  try {
    const userId = 'temp-user-id'; // For MVP, using hardcoded user ID
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') as TimeFrame) || '1month';

    // Fetch workouts with related data
    const workouts = await prisma.workout.findMany({
      where: { userId },
      include: {
        workoutTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Fetch all tags
    const dbTags = await prisma.tag.findMany({
      where: { userId }
    });
    
    const tags = dbTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      userId: tag.userId,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString()
    }));

    // Transform workouts to match the expected format
    const transformedWorkouts = workouts.map(workout => ({
      id: workout.id,
      type: workout.type,
      startTime: workout.startTime.toISOString(),
      endTime: workout.endTime?.toISOString(),
      trainingVolume: workout.trainingVolume || undefined,
      preSessionFeel: workout.preSessionFeel || undefined,
      dayAfterTiredness: workout.dayAfterTiredness || undefined,
      focusLevel: workout.focusLevel || undefined,
      notes: workout.notes || undefined,
      sector: workout.sector || undefined,
      mentalPracticeType: workout.mentalPracticeType || undefined,
      gratitude: workout.gratitude || undefined,
      improvements: workout.improvements || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mentalState: (workout.mentalState as any) || undefined,
      planId: workout.planId || undefined,
      userId: workout.userId,
      createdAt: workout.createdAt.toISOString(),
      updatedAt: workout.updatedAt.toISOString(),
      tags: workout.workoutTags.map(wt => ({
        id: wt.tag.id,
        name: wt.tag.name,
        color: wt.tag.color,
        userId: wt.tag.userId,
        createdAt: wt.tag.createdAt.toISOString(),
        updatedAt: wt.tag.updatedAt.toISOString()
      }))
    }));

    // Calculate statistics
    const statistics = statisticsService.calculateStatistics(transformedWorkouts, tags, timeframe);

    // Process activity notifications
    const activityNotifications = processActivityNotifications(transformedWorkouts);

    return NextResponse.json({
      statistics,
      activityNotifications: activityNotifications.length
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// POST /api/statistics - Process notifications and return updated stats
export async function POST(request: NextRequest) {
  try {
    const userId = 'temp-user-id'; // For MVP, using hardcoded user ID
    const body = await request.json();
    const { action } = body;

    // Fetch current workouts for processing
    const workouts = await prisma.workout.findMany({
      where: { userId },
      include: {
        workoutTags: {
          include: {
            tag: true
          }
        }
      }
    });


    // Transform workouts for POST requests
    const transformedWorkouts = workouts.map(workout => ({
      id: workout.id,
      type: workout.type,
      startTime: workout.startTime.toISOString(),
      endTime: workout.endTime?.toISOString(),
      trainingVolume: workout.trainingVolume || undefined,
      preSessionFeel: workout.preSessionFeel || undefined,
      dayAfterTiredness: workout.dayAfterTiredness || undefined,
      focusLevel: workout.focusLevel || undefined,
      notes: workout.notes || undefined,
      sector: workout.sector || undefined,
      mentalPracticeType: workout.mentalPracticeType || undefined,
      gratitude: workout.gratitude || undefined,
      improvements: workout.improvements || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mentalState: (workout.mentalState as any) || undefined,
      planId: workout.planId || undefined,
      userId: workout.userId,
      createdAt: workout.createdAt.toISOString(),
      updatedAt: workout.updatedAt.toISOString(),
      tags: workout.workoutTags.map(wt => ({
        id: wt.tag.id,
        name: wt.tag.name,
        color: wt.tag.color,
        userId: wt.tag.userId,
        createdAt: wt.tag.createdAt.toISOString(),
        updatedAt: wt.tag.updatedAt.toISOString()
      }))
    }));

    // Process notifications based on action
    let notificationsProcessed = 0;
    
    switch (action) {
      case 'process_notifications':
        const activityNotifications = processActivityNotifications(transformedWorkouts);
        notificationsProcessed = activityNotifications.length;
        break;
      
      case 'check_mental_sessions':
        // Trigger mental session check
        const mentalCheck = transformedWorkouts.filter(w => w.type === 'MENTAL_PRACTICE');
        if (mentalCheck.length > 0) {
          const activityNotifications = processActivityNotifications(transformedWorkouts);
          notificationsProcessed = activityNotifications.filter(n => n.title.includes('Mental Practice')).length;
        }
        break;
      
      case 'check_falls_tracking':
        // Trigger falls tracking check
        const climbingWorkouts = transformedWorkouts.filter(w => 
          ['BOULDERING', 'LEAD_ROCK', 'LEAD_ARTIFICIAL', 'CIRCUITS'].includes(w.type)
        );
        if (climbingWorkouts.length > 0) {
          const activityNotifications = processActivityNotifications(transformedWorkouts);
          notificationsProcessed = activityNotifications.filter(n => n.title.includes('Falls Tracking')).length;
        }
        break;
    }

    return NextResponse.json({
      success: true,
      notificationsProcessed,
      message: `Processed ${notificationsProcessed} notifications`
    });
  } catch (error) {
    console.error('Error processing statistics:', error);
    return NextResponse.json(
      { error: 'Failed to process statistics' },
      { status: 500 }
    );
  }
}
