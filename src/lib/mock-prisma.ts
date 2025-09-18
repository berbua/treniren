// Mock Prisma client for development without database
import { Workout, Exercise } from '@/types/workout'

// Mock data
const mockWorkouts: Workout[] = [
  {
    id: '1',
    type: 'GYM',
    date: new Date().toISOString(),
    trainingVolume: undefined,
    notes: 'Great workout today!',
    preSessionFeel: 4,
    dayAfterTiredness: 3,
    planId: undefined,
    userId: 'temp-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'BOULDERING',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    trainingVolume: 'TR4',
    notes: 'Worked on overhangs, feeling stronger!',
    preSessionFeel: 3,
    dayAfterTiredness: 4,
    planId: undefined,
    userId: 'temp-user-id',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

const mockExercises: Exercise[] = [
  {
    id: '1',
    name: 'Squat',
    category: 'Legs',
    defaultUnit: 'kg',
    userId: 'temp-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Bench Press',
    category: 'Chest',
    defaultUnit: 'kg',
    userId: 'temp-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Mock Prisma client
export const mockPrisma = {
  workout: {
    findMany: async (options?: { where?: { userId: string }; include?: unknown; orderBy?: unknown }) => {
      console.log('Mock: findMany workouts', options)
      return mockWorkouts
    },
    findFirst: async (options?: { where: { id: string; userId: string }; include?: unknown }) => {
      console.log('Mock: findFirst workout', options)
      const workout = mockWorkouts.find(w => w.id === options?.where.id)
      return workout || null
    },
    create: async (options: { data: { type: string; date: Date; trainingVolume?: string; details?: unknown; notes?: string; preSessionFeel?: number; dayAfterTiredness?: number; planId?: string; userId: string }; include?: unknown }) => {
      console.log('Mock: create workout', options)
      const newWorkout: Workout = {
        id: Math.random().toString(36).substr(2, 9),
        type: options.data.type as Workout['type'],
        date: options.data.date.toISOString(),
        trainingVolume: options.data.trainingVolume as Workout['trainingVolume'],
        notes: options.data.notes,
        preSessionFeel: options.data.preSessionFeel,
        dayAfterTiredness: options.data.dayAfterTiredness,
        planId: options.data.planId,
        userId: options.data.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockWorkouts.unshift(newWorkout)
      return newWorkout
    },
    updateMany: async (options: { where: { id: string; userId: string }; data: { type: string; date: Date; trainingVolume?: string; details?: unknown; notes?: string; preSessionFeel?: number; dayAfterTiredness?: number } }) => {
      console.log('Mock: updateMany workouts', options)
      const index = mockWorkouts.findIndex(w => w.id === options.where.id)
      if (index !== -1) {
        mockWorkouts[index] = {
          ...mockWorkouts[index],
          type: options.data.type as Workout['type'],
          date: options.data.date.toISOString(),
          trainingVolume: options.data.trainingVolume as Workout['trainingVolume'],
          notes: options.data.notes,
          preSessionFeel: options.data.preSessionFeel,
          dayAfterTiredness: options.data.dayAfterTiredness,
          updatedAt: new Date().toISOString(),
        }
        return { count: 1 }
      }
      return { count: 0 }
    },
    deleteMany: async (options: { where: { id: string; userId: string } }) => {
      console.log('Mock: deleteMany workouts', options)
      const index = mockWorkouts.findIndex(w => w.id === options.where.id)
      if (index !== -1) {
        mockWorkouts.splice(index, 1)
        return { count: 1 }
      }
      return { count: 0 }
    },
  },
  exercise: {
    findMany: async (options?: { where?: { userId: string }; orderBy?: unknown }) => {
      console.log('Mock: findMany exercises', options)
      return mockExercises
    },
    create: async (options: { data: { name: string; category?: string; defaultUnit: string; userId: string } }) => {
      console.log('Mock: create exercise', options)
      const newExercise: Exercise = {
        id: Math.random().toString(36).substr(2, 9),
        name: options.data.name,
        category: options.data.category,
        defaultUnit: options.data.defaultUnit,
        userId: options.data.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      mockExercises.push(newExercise)
      return newExercise
    },
  },
}
