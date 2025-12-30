/**
 * Development-only utility to generate dummy data for testing
 * This creates realistic sample data matching the export format
 */

import { SCHEMA_VERSION } from './data-version';

export interface DummyDataOptions {
  workoutsCount?: number;
  eventsCount?: number;
  exercisesCount?: number;
  routinesCount?: number;
  tagsCount?: number;
  plansCount?: number;
  fingerboardProtocolsCount?: number;
  fingerboardTestingProtocolsCount?: number;
  fingerboardTestResultsCount?: number;
}

const DEFAULT_OPTIONS: Required<DummyDataOptions> = {
  workoutsCount: 30,
  eventsCount: 10,
  exercisesCount: 15,
  routinesCount: 5,
  tagsCount: 8,
  plansCount: 12,
  fingerboardProtocolsCount: 3,
  fingerboardTestingProtocolsCount: 2,
  fingerboardTestResultsCount: 20,
};

function generateId(): string {
  return `dummy_${Math.random().toString(36).substring(2, 15)}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateDummyData(options: DummyDataOptions = {}): any {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const userId = generateId();
  const userEmail = 'dummy@example.com';
  const userName = 'Test User';
  
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  // Generate tags first (needed for workouts and events)
  const tags = Array.from({ length: opts.tagsCount }, (_, i) => ({
    id: generateId(),
    userId,
    name: `Tag ${i + 1}`,
    color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'][i % 8],
    createdAt: randomDate(sixMonthsAgo, now).toISOString(),
    updatedAt: randomDate(sixMonthsAgo, now).toISOString(),
  }));
  
  // Generate exercises
  const exercises = Array.from({ length: opts.exercisesCount }, (_, i) => ({
    id: generateId(),
    userId,
    name: `Exercise ${i + 1}`,
    category: randomElement(['Strength', 'Cardio', 'Flexibility', 'Climbing', 'Core']),
    defaultUnit: 'kg',
    createdAt: randomDate(sixMonthsAgo, now).toISOString(),
    updatedAt: randomDate(sixMonthsAgo, now).toISOString(),
  }));
  
  // Generate workouts
  const workoutTypes = ['GYM', 'BOULDERING', 'CIRCUITS', 'LEAD_ROCK', 'LEAD_ARTIFICIAL', 'MENTAL_PRACTICE', 'FINGERBOARD'];
  const trainingVolumes = ['TR1', 'TR2', 'TR3', 'TR4', 'TR5'];
  
  const workouts = Array.from({ length: opts.workoutsCount }, (_, i) => {
    const workoutType = randomElement(workoutTypes);
    const startTime = randomDate(sixMonthsAgo, now);
    const endTime = new Date(startTime.getTime() + randomInt(30, 180) * 60 * 1000);
    
    // Generate exercises for this workout
    const workoutExercises = exercises.slice(0, randomInt(2, 5)).map((exercise, idx) => ({
      id: generateId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseCategory: exercise.category,
      order: idx + 1,
      sets: Array.from({ length: randomInt(3, 5) }, (_, setIdx) => ({
        id: generateId(),
        workoutExerciseId: generateId(),
        setNumber: setIdx + 1,
        reps: randomInt(5, 15),
        weight: randomInt(10, 100),
        rir: randomInt(0, 3),
        success: Math.random() > 0.2,
        notes: Math.random() > 0.7 ? `Set ${setIdx + 1} notes` : null,
        createdAt: startTime.toISOString(),
      })),
    }));
    
    // Generate fingerboard hangs for FINGERBOARD workouts
    const fingerboardHangs = workoutType === 'FINGERBOARD' 
      ? Array.from({ length: randomInt(3, 8) }, (_, idx) => ({
          id: generateId(),
          workoutId: generateId(),
          order: idx + 1,
          handType: randomElement(['ONE_HAND', 'BOTH_HANDS']),
          gripType: randomElement(['OPEN_HAND', 'CRIMP', 'SLOPER']),
          crimpSize: Math.random() > 0.5 ? randomInt(6, 30) : null,
          customDescription: null,
          load: randomInt(0, 20),
          unload: null,
          reps: randomInt(1, 5),
          timeSeconds: randomInt(5, 20),
          notes: Math.random() > 0.8 ? 'Hang notes' : null,
          createdAt: startTime.toISOString(),
        }))
      : [];
    
    return {
      id: generateId(),
      planId: null,
      userId,
      type: workoutType,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      trainingVolume: workoutType !== 'GYM' && workoutType !== 'MENTAL_PRACTICE' && workoutType !== 'FINGERBOARD' 
        ? randomElement(trainingVolumes) 
        : null,
      details: null,
      preSessionFeel: randomInt(1, 5),
      dayAfterTiredness: randomInt(1, 5),
      focusLevel: randomInt(1, 10),
      notes: Math.random() > 0.5 ? `Workout notes ${i + 1}` : null,
      sector: workoutType === 'LEAD_ROCK' ? `Sector ${randomInt(1, 5)}` : null,
      mentalPracticeType: workoutType === 'MENTAL_PRACTICE' ? randomElement(['MEDITATION', 'REFLECTING', 'OTHER']) : null,
      timeOfDay: workoutType === 'MENTAL_PRACTICE' ? [randomElement(['MORNING', 'MIDDAY', 'EVENING'])] : null,
      gratitude: Math.random() > 0.6 ? `Gratitude entry ${i + 1}` : null,
      improvements: Math.random() > 0.6 ? `Improvements entry ${i + 1}` : null,
      mentalState: null,
      calendarEventId: null,
      createdAt: startTime.toISOString(),
      updatedAt: startTime.toISOString(),
      exercises: workoutExercises,
      tags: tags.slice(0, randomInt(0, 3)).map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
      fingerboardHangs,
      planTitle: null,
    };
  });
  
  // Generate events
  const eventTypes = ['INJURY', 'PHYSIO', 'COMPETITION', 'TRIP', 'OTHER'];
  const events = Array.from({ length: opts.eventsCount }, (_, i) => {
    const eventType = randomElement(eventTypes);
    const date = randomDate(sixMonthsAgo, now);
    
    return {
      id: generateId(),
      userId,
      type: eventType,
      title: `${eventType} Event ${i + 1}`,
      date: date.toISOString(),
      startTime: Math.random() > 0.5 ? date.toISOString() : null,
      endTime: Math.random() > 0.5 ? new Date(date.getTime() + randomInt(30, 120) * 60 * 1000).toISOString() : null,
      description: `Description for ${eventType.toLowerCase()} event ${i + 1}`,
      location: Math.random() > 0.5 ? `Location ${i + 1}` : null,
      severity: eventType === 'INJURY' ? randomInt(1, 5) : null,
      status: eventType === 'INJURY' ? randomElement(['Recovering', 'Healed', 'Ongoing']) : null,
      notes: Math.random() > 0.6 ? `Event notes ${i + 1}` : null,
      tripStartDate: eventType === 'TRIP' ? date.toISOString() : null,
      tripEndDate: eventType === 'TRIP' ? new Date(date.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000).toISOString() : null,
      destination: eventType === 'TRIP' ? `Destination ${i + 1}` : null,
      climbingType: eventType === 'TRIP' ? randomElement(['BOULDERING', 'SPORT_CLIMBING']) : null,
      showCountdown: eventType === 'TRIP' && Math.random() > 0.5,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      tags: tags.slice(0, randomInt(0, 2)).map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
    };
  });
  
  // Generate routines
  const routines = Array.from({ length: opts.routinesCount }, (_, i) => ({
    id: generateId(),
    userId,
    name: `Routine ${i + 1}`,
    description: `Description for routine ${i + 1}`,
    createdAt: randomDate(sixMonthsAgo, now).toISOString(),
    updatedAt: randomDate(sixMonthsAgo, now).toISOString(),
    exercises: exercises.slice(0, randomInt(3, 6)).map((exercise, idx) => ({
      id: generateId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseCategory: exercise.category,
      order: idx + 1,
      notes: Math.random() > 0.7 ? `Exercise notes` : null,
    })),
    variations: Array.from({ length: randomInt(1, 3) }, (_, idx) => ({
      id: generateId(),
      routineId: generateId(),
      name: `Variation ${idx + 1}`,
      description: `Variation description ${idx + 1}`,
      defaultSets: randomInt(3, 5),
      defaultRepRangeMin: randomInt(8, 12),
      defaultRepRangeMax: randomInt(12, 15),
      defaultRIR: randomInt(0, 2),
      createdAt: randomDate(sixMonthsAgo, now).toISOString(),
      updatedAt: randomDate(sixMonthsAgo, now).toISOString(),
    })),
  }));
  
  // Generate fingerboard protocols
  const fingerboardProtocols = Array.from({ length: opts.fingerboardProtocolsCount }, (_, i) => ({
    id: generateId(),
    userId,
    name: `Fingerboard Protocol ${i + 1}`,
    description: `Protocol description ${i + 1}`,
    createdAt: randomDate(sixMonthsAgo, now).toISOString(),
    updatedAt: randomDate(sixMonthsAgo, now).toISOString(),
    hangs: Array.from({ length: randomInt(4, 8) }, (_, idx) => ({
      id: generateId(),
      protocolId: generateId(),
      order: idx + 1,
      handType: randomElement(['ONE_HAND', 'BOTH_HANDS']),
      gripType: randomElement(['OPEN_HAND', 'CRIMP', 'SLOPER']),
      crimpSize: Math.random() > 0.5 ? randomInt(6, 30) : null,
      customDescription: null,
      defaultLoad: randomInt(0, 15),
      defaultUnload: null,
      defaultReps: randomInt(1, 5),
      defaultTimeSeconds: randomInt(5, 20),
      notes: Math.random() > 0.8 ? 'Hang notes' : null,
    })),
  }));
  
  // Generate fingerboard testing protocols
  const fingerboardTestingProtocols = Array.from({ length: opts.fingerboardTestingProtocolsCount }, (_, i) => ({
    id: generateId(),
    userId,
    name: `Testing Protocol ${i + 1}`,
    description: `Testing protocol description ${i + 1}`,
    createdAt: randomDate(sixMonthsAgo, now).toISOString(),
    updatedAt: randomDate(sixMonthsAgo, now).toISOString(),
    testHangs: Array.from({ length: randomInt(3, 6) }, (_, idx) => ({
      id: generateId(),
      protocolId: generateId(),
      order: idx + 1,
      handType: randomElement(['ONE_HAND', 'BOTH_HANDS']),
      gripType: randomElement(['OPEN_HAND', 'CRIMP', 'SLOPER']),
      crimpSize: Math.random() > 0.5 ? randomInt(6, 30) : null,
      customDescription: null,
      targetLoad: randomInt(0, 20),
      targetTimeSeconds: randomInt(5, 20),
      notes: Math.random() > 0.8 ? 'Test hang notes' : null,
    })),
  }));
  
  // Generate fingerboard test results
  const fingerboardTestResults = Array.from({ length: opts.fingerboardTestResultsCount }, (_, i) => {
    const protocol = fingerboardTestingProtocols[i % fingerboardTestingProtocols.length];
    const testHang = protocol.testHangs[i % protocol.testHangs.length];
    const date = randomDate(sixMonthsAgo, now);
    
    return {
      id: generateId(),
      protocolId: protocol.id,
      testHangId: testHang.id,
      userId,
      date: date.toISOString(),
      handType: testHang.handType,
      gripType: testHang.gripType,
      crimpSize: testHang.crimpSize,
      customDescription: testHang.customDescription,
      load: randomInt(0, 25),
      unload: null,
      timeSeconds: randomInt(5, 25),
      success: Math.random() > 0.2,
      notes: Math.random() > 0.7 ? `Test result notes ${i + 1}` : null,
      createdAt: date.toISOString(),
      protocolName: protocol.name,
    };
  });
  
  // Generate plans
  const plans = Array.from({ length: opts.plansCount }, (_, i) => {
    const date = randomDate(sixMonthsAgo, now);
    return {
      id: generateId(),
      userId,
      date: date.toISOString(),
      title: `Plan ${i + 1}`,
      label: Math.random() > 0.5 ? `Label ${i + 1}` : null,
      notes: Math.random() > 0.6 ? `Plan notes ${i + 1}` : null,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      tags: tags.slice(0, randomInt(0, 2)).map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
      })),
    };
  });
  
  return {
    metadata: {
      exportDate: now.toISOString(),
      userId,
      userEmail,
      userName,
      version: SCHEMA_VERSION,
      schemaVersion: SCHEMA_VERSION,
    },
    user: {
      id: userId,
      email: userEmail,
      name: userName,
      nickname: null,
      createdAt: sixMonthsAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    profile: {
      id: generateId(),
      userId,
      photoUrl: null,
      googleSheetsUrl: null,
      cycleAvgLengthDays: 28,
      lastPeriodDate: randomDate(sixMonthsAgo, now).toISOString(),
      timezone: 'Europe/Warsaw',
      createdAt: sixMonthsAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    workouts,
    events,
    exercises,
    routines,
    fingerboardProtocols,
    fingerboardTestingProtocols,
    fingerboardTestResults,
    tags,
    plans,
  };
}

