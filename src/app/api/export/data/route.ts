import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SCHEMA_VERSION } from '@/lib/data-version';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch all user data
    const [
      workouts,
      events,
      exercises,
      routines,
      fingerboardProtocols,
      fingerboardTestingProtocols,
      fingerboardTestResults,
      tags,
      plans,
      userProfile,
      userData
    ] = await Promise.all([
      // Workouts with all relations
      prisma.workout.findMany({
        where: { userId },
        include: {
          workoutExercises: {
            include: {
              exercise: true,
              sets: {
                orderBy: { setNumber: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          },
          workoutTags: {
            include: { tag: true }
          },
          fingerboardHangs: {
            orderBy: { order: 'asc' }
          },
          plan: true
        },
        orderBy: { startTime: 'desc' }
      }),
      
      // Events with tags
      prisma.event.findMany({
        where: { userId },
        include: {
          eventTags: {
            include: { tag: true }
          }
        },
        orderBy: { date: 'desc' }
      }),
      
      // Exercises
      prisma.exercise.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      }),
      
      // Routines with exercises
      prisma.routine.findMany({
        where: { userId },
        include: {
          routineExercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' }
          },
          variations: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }),
      
      // Fingerboard Protocols
      prisma.fingerboardProtocol.findMany({
        where: { userId },
        include: {
          hangs: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }),
      
      // Fingerboard Testing Protocols
      prisma.fingerboardTestingProtocol.findMany({
        where: { userId },
        include: {
          testHangs: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }),
      
      // Fingerboard Test Results
      prisma.fingerboardTestResult.findMany({
        where: { userId },
        include: {
          protocol: true,
          testHang: true
        },
        orderBy: { date: 'desc' }
      }),
      
      // Tags
      prisma.tag.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      }),
      
      // Plans with tags
      prisma.plan.findMany({
        where: { userId },
        include: {
          planTags: {
            include: { tag: true }
          }
        },
        orderBy: { date: 'desc' }
      }),
      
      // User Profile
      prisma.userProfile.findUnique({
        where: { userId }
      }),
      
      // User basic info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

    // Structure the export data
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        userId: userData?.id,
        userEmail: userData?.email,
        userName: userData?.name || userData?.nickname,
        version: SCHEMA_VERSION, // Legacy field for backward compatibility
        schemaVersion: SCHEMA_VERSION // Current schema version
      },
      user: userData ? {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        nickname: userData.nickname,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      } : null,
      profile: userProfile ? {
        ...userProfile,
        lastPeriodDate: userProfile.lastPeriodDate?.toISOString() || null,
        createdAt: userProfile.createdAt.toISOString(),
        updatedAt: userProfile.updatedAt.toISOString()
      } : null,
      workouts: workouts.map(workout => {
        const { workoutExercises, workoutTags, fingerboardHangs, plan, ...workoutData } = workout;
        return {
          ...workoutData,
          startTime: workout.startTime.toISOString(),
          endTime: workout.endTime?.toISOString() || null,
          createdAt: workout.createdAt.toISOString(),
          updatedAt: workout.updatedAt.toISOString(),
          exercises: workout.workoutExercises.map(we => ({
            id: we.id,
            exerciseId: we.exerciseId,
            exerciseName: we.exercise.name,
            exerciseCategory: we.exercise.category,
            order: we.order,
            sets: we.sets.map(set => ({
              id: set.id,
              workoutExerciseId: set.workoutExerciseId,
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              rir: set.rir,
              success: set.success,
              notes: set.notes,
              createdAt: set.createdAt.toISOString()
            }))
          })),
          tags: workout.workoutTags.map(wt => ({
            id: wt.tag.id,
            name: wt.tag.name,
            color: wt.tag.color
          })),
          fingerboardHangs: workout.fingerboardHangs.map(hang => ({
            id: hang.id,
            workoutId: hang.workoutId,
            order: hang.order,
            handType: hang.handType,
            gripType: hang.gripType,
            crimpSize: hang.crimpSize,
            customDescription: hang.customDescription,
            load: hang.load,
            unload: hang.unload,
            reps: hang.reps,
            timeSeconds: hang.timeSeconds,
            notes: hang.notes,
            createdAt: hang.createdAt.toISOString()
          })),
          planId: workout.planId,
          planTitle: workout.plan?.title || null
        };
      }),
      events: events.map(event => {
        const { eventTags, ...eventData } = event;
        return {
          ...eventData,
          date: event.date.toISOString(),
          startTime: event.startTime?.toISOString() || null,
          endTime: event.endTime?.toISOString() || null,
          tripStartDate: event.tripStartDate?.toISOString() || null,
          tripEndDate: event.tripEndDate?.toISOString() || null,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString(),
          tags: event.eventTags.map(et => ({
            id: et.tag.id,
            name: et.tag.name,
            color: et.tag.color
          }))
        };
      }),
      exercises: exercises.map(exercise => ({
        ...exercise,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString()
      })),
      routines: routines.map(routine => {
        const { routineExercises, variations, ...routineData } = routine;
        return {
          ...routineData,
          createdAt: routine.createdAt.toISOString(),
          updatedAt: routine.updatedAt.toISOString(),
          exercises: routine.routineExercises.map(re => ({
            id: re.id,
            exerciseId: re.exerciseId,
            exerciseName: re.exercise.name,
            exerciseCategory: re.exercise.category,
            order: re.order,
            notes: re.notes
          })),
          variations: routine.variations.map(v => ({
            id: v.id,
            routineId: v.routineId,
            name: v.name,
            description: v.description,
            defaultSets: v.defaultSets,
            defaultRepRangeMin: v.defaultRepRangeMin,
            defaultRepRangeMax: v.defaultRepRangeMax,
            defaultRIR: v.defaultRIR,
            createdAt: v.createdAt.toISOString(),
            updatedAt: v.updatedAt.toISOString()
          }))
        };
      }),
      fingerboardProtocols: fingerboardProtocols.map(protocol => {
        const { hangs, ...protocolData } = protocol;
        return {
          ...protocolData,
          createdAt: protocol.createdAt.toISOString(),
          updatedAt: protocol.updatedAt.toISOString(),
          hangs: protocol.hangs.map(hang => ({
            id: hang.id,
            protocolId: hang.protocolId,
            order: hang.order,
            handType: hang.handType,
            gripType: hang.gripType,
            crimpSize: hang.crimpSize,
            customDescription: hang.customDescription,
            defaultLoad: hang.defaultLoad,
            defaultUnload: hang.defaultUnload,
            defaultReps: hang.defaultReps,
            defaultTimeSeconds: hang.defaultTimeSeconds,
            notes: hang.notes
          }))
        };
      }),
      fingerboardTestingProtocols: fingerboardTestingProtocols.map(protocol => {
        const { testHangs, ...protocolData } = protocol;
        return {
          ...protocolData,
          createdAt: protocol.createdAt.toISOString(),
          updatedAt: protocol.updatedAt.toISOString(),
          testHangs: protocol.testHangs.map(hang => ({
            id: hang.id,
            protocolId: hang.protocolId,
            order: hang.order,
            handType: hang.handType,
            gripType: hang.gripType,
            crimpSize: hang.crimpSize,
            customDescription: hang.customDescription,
            targetLoad: hang.targetLoad,
            targetTimeSeconds: hang.targetTimeSeconds,
            notes: hang.notes
          }))
        };
      }),
      fingerboardTestResults: fingerboardTestResults.map(result => {
        const { protocol, testHang, ...resultData } = result;
        return {
          ...resultData,
          date: result.date.toISOString(),
          createdAt: result.createdAt.toISOString(),
          protocolName: result.protocol.name
        };
      }),
      tags: tags.map(tag => ({
        ...tag,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString()
      })),
      plans: plans.map(plan => {
        const { planTags, ...planData } = plan;
        return {
          ...planData,
          date: plan.date.toISOString(),
          createdAt: plan.createdAt.toISOString(),
          updatedAt: plan.updatedAt.toISOString(),
          tags: plan.planTags.map(pt => ({
            id: pt.tag.id,
            name: pt.tag.name,
            color: pt.tag.color
          }))
        };
      })
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to export data',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

