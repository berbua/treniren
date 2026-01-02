import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateDummyData } from '@/lib/generate-dummy-data';

/**
 * Development-only endpoint to import dummy data into the database
 * This bypasses the normal import flow and directly writes to the database
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const user = await requireAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate dummy data
    const dummyData = generateDummyData({
      workoutsCount: 30,
      eventsCount: 10,
      exercisesCount: 15,
      routinesCount: 5,
      tagsCount: 8,
      plansCount: 12,
      fingerboardProtocolsCount: 3,
      fingerboardTestingProtocolsCount: 2,
      fingerboardTestResultsCount: 20,
    });

    const userId = user.id;
    const results = {
      tags: 0,
      exercises: 0,
      workouts: 0,
      events: 0,
      routines: 0,
      plans: 0,
      fingerboardProtocols: 0,
      fingerboardTestingProtocols: 0,
      fingerboardTestResults: 0,
    };

    // 1. Create tags first (needed for workouts and events)
    const tagMap = new Map<string, string>(); // oldId -> newId
    for (const tag of dummyData.tags) {
      const created = await prisma.tag.create({
        data: {
          userId,
          name: tag.name,
          color: tag.color,
        },
      });
      tagMap.set(tag.id, created.id);
      results.tags++;
    }

    // 2. Create exercises (needed for workouts and routines)
    const exerciseMap = new Map<string, string>(); // oldId -> newId
    for (const exercise of dummyData.exercises) {
      const created = await prisma.exercise.create({
        data: {
          userId,
          name: exercise.name,
          category: exercise.category,
          defaultUnit: exercise.defaultUnit,
        },
      });
      exerciseMap.set(exercise.id, created.id);
      results.exercises++;
    }

    // 3. Create plans (needed for workouts)
    const planMap = new Map<string, string>(); // oldId -> newId
    for (const plan of dummyData.plans) {
      const created = await prisma.plan.create({
        data: {
          userId,
          date: new Date(plan.date),
          title: plan.title,
          label: plan.label,
          notes: plan.notes,
          planTags: {
            create: plan.tags.map((tag: any) => ({
              tagId: tagMap.get(tag.id)!,
            })).filter((t: any) => t.tagId),
          },
        },
      });
      planMap.set(plan.id, created.id);
      results.plans++;
    }

    // 4. Create workouts
    for (const workout of dummyData.workouts) {
      const workoutId = await prisma.workout.create({
        data: {
          userId,
          type: workout.type as any,
          startTime: new Date(workout.startTime),
          endTime: workout.endTime ? new Date(workout.endTime) : null,
          trainingVolume: workout.trainingVolume as any,
          preSessionFeel: workout.preSessionFeel,
          dayAfterTiredness: workout.dayAfterTiredness,
          focusLevel: workout.focusLevel,
          notes: workout.notes,
          sector: workout.sector,
          mentalPracticeType: workout.mentalPracticeType as any,
          timeOfDay: workout.timeOfDay as any,
          gratitude: workout.gratitude,
          improvements: workout.improvements,
          mentalState: workout.mentalState as any,
          details: workout.details as any,
          planId: workout.planId ? planMap.get(workout.planId) || null : null,
          workoutTags: {
            create: workout.tags.map((tag: any) => ({
              tagId: tagMap.get(tag.id)!,
            })).filter((t: any) => t.tagId),
          },
          workoutExercises: {
            create: workout.exercises.map((we: any, idx: number) => ({
              exerciseId: exerciseMap.get(we.exerciseId)!,
              order: we.order || idx + 1,
              sets: {
                create: we.sets.map((set: any) => ({
                  setNumber: set.setNumber,
                  reps: set.reps,
                  weight: set.weight,
                  rir: set.rir,
                  success: set.success,
                  notes: set.notes,
                })),
              },
            })).filter((we: any) => we.exerciseId),
          },
          fingerboardHangs: workout.fingerboardHangs && workout.fingerboardHangs.length > 0 ? {
            create: workout.fingerboardHangs.map((hang: any, idx: number) => ({
              order: hang.order || idx + 1,
              handType: hang.handType as any,
              gripType: hang.gripType as any,
              crimpSize: hang.crimpSize,
              customDescription: hang.customDescription,
              load: hang.load,
              unload: hang.unload,
              reps: hang.reps,
              timeSeconds: hang.timeSeconds,
              notes: hang.notes,
            })),
          } : undefined,
        },
      });
      results.workouts++;
    }

    // 5. Create events
    for (const event of dummyData.events) {
      await prisma.event.create({
        data: {
          userId,
          type: event.type as any,
          title: event.title,
          date: new Date(event.date),
          startTime: event.startTime ? new Date(event.startTime) : null,
          endTime: event.endTime ? new Date(event.endTime) : null,
          description: event.description,
          location: event.location,
          severity: event.severity,
          status: event.status,
          notes: event.notes,
          tripStartDate: event.tripStartDate ? new Date(event.tripStartDate) : null,
          tripEndDate: event.tripEndDate ? new Date(event.tripEndDate) : null,
          destination: event.destination,
          climbingType: event.climbingType as any,
          showCountdown: event.showCountdown || false,
          eventTags: {
            create: event.tags.map((tag: any) => ({
              tagId: tagMap.get(tag.id)!,
            })).filter((t: any) => t.tagId),
          },
        },
      });
      results.events++;
    }

    // 6. Create routines
    for (const routine of dummyData.routines) {
      await prisma.routine.create({
        data: {
          userId,
          name: routine.name,
          description: routine.description,
          routineExercises: {
            create: routine.exercises.map((re: any, idx: number) => ({
              exerciseId: exerciseMap.get(re.exerciseId)!,
              order: re.order || idx + 1,
              notes: re.notes,
            })).filter((re: any) => re.exerciseId),
          },
          variations: {
            create: routine.variations.map((v: any) => ({
              name: v.name,
              description: v.description,
              defaultSets: v.defaultSets,
              defaultRepRangeMin: v.defaultRepRangeMin,
              defaultRepRangeMax: v.defaultRepRangeMax,
              defaultRIR: v.defaultRIR,
            })),
          },
        },
      });
      results.routines++;
    }

    // 7. Create fingerboard protocols
    for (const protocol of dummyData.fingerboardProtocols) {
      await prisma.fingerboardProtocol.create({
        data: {
          userId,
          name: protocol.name,
          description: protocol.description,
          hangs: {
            create: protocol.hangs.map((hang: any, idx: number) => ({
              order: hang.order || idx + 1,
              handType: hang.handType as any,
              gripType: hang.gripType as any,
              crimpSize: hang.crimpSize,
              customDescription: hang.customDescription,
              defaultLoad: hang.defaultLoad,
              defaultUnload: hang.defaultUnload,
              defaultReps: hang.defaultReps,
              defaultTimeSeconds: hang.defaultTimeSeconds,
              notes: hang.notes,
            })),
          },
        },
      });
      results.fingerboardProtocols++;
    }

    // 8. Create fingerboard testing protocols
    const testingProtocolMap = new Map<string, string>(); // oldId -> newId
    for (const protocol of dummyData.fingerboardTestingProtocols) {
      const created = await prisma.fingerboardTestingProtocol.create({
        data: {
          userId,
          name: protocol.name,
          description: protocol.description,
          testHangs: {
            create: protocol.testHangs.map((hang: any, idx: number) => ({
              order: hang.order || idx + 1,
              handType: hang.handType as any,
              gripType: hang.gripType as any,
              crimpSize: hang.crimpSize,
              customDescription: hang.customDescription,
              targetLoad: hang.targetLoad,
              targetTimeSeconds: hang.targetTimeSeconds,
              notes: hang.notes,
            })),
          },
        },
        include: {
          testHangs: true,
        },
      });
      testingProtocolMap.set(protocol.id, created.id);
      results.fingerboardTestingProtocols++;
    }

    // 9. Create fingerboard test results
    for (const result of dummyData.fingerboardTestResults) {
      const protocolId = testingProtocolMap.get(result.protocolId);
      if (!protocolId) continue;

      // Find the test hang by order (since we don't have the old ID mapping)
      const protocol = await prisma.fingerboardTestingProtocol.findUnique({
        where: { id: protocolId },
        include: { testHangs: { orderBy: { order: 'asc' } } },
      });

      if (!protocol || !protocol.testHangs.length) continue;

      // Use the first test hang as a fallback (or match by order if we stored it)
      const testHangId = protocol.testHangs[0].id;

      await prisma.fingerboardTestResult.create({
        data: {
          protocolId,
          testHangId,
          userId,
          date: new Date(result.date),
          handType: result.handType as any,
          gripType: result.gripType as any,
          crimpSize: result.crimpSize,
          customDescription: result.customDescription,
          load: result.load,
          unload: result.unload,
          timeSeconds: result.timeSeconds,
          success: result.success,
          notes: result.notes,
        },
      });
      results.fingerboardTestResults++;
    }

    return NextResponse.json({
      success: true,
      message: 'Dummy data imported successfully',
      results,
    });
  } catch (error) {
    console.error('Error importing dummy data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import dummy data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




