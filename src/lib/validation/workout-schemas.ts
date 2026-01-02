import { z } from 'zod'

// Workout type enum
export const WorkoutTypeSchema = z.enum([
  'GYM',
  'BOULDERING',
  'CIRCUITS',
  'LEAD_ROCK',
  'LEAD_ARTIFICIAL',
  'MENTAL_PRACTICE',
  'FINGERBOARD',
])

// Training volume enum
export const TrainingVolumeSchema = z.enum(['TR1', 'TR2', 'TR3', 'TR4', 'TR5']).nullable().optional()

// Mental practice type enum
export const MentalPracticeTypeSchema = z.enum(['MEDITATION', 'REFLECTING', 'OTHER']).nullable().optional()

// Time of day enum
export const TimeOfDaySchema = z.enum(['MORNING', 'MIDDAY', 'EVENING']).nullable().optional()

// Hand type enum
export const HandTypeSchema = z.enum(['ONE_HAND', 'BOTH_HANDS'])

// Grip type enum
export const GripTypeSchema = z.enum(['OPEN_HAND', 'CRIMP', 'SLOPER'])

// Set schema
export const SetSchema = z.object({
  reps: z.number().int().positive().nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
})

// Exercise schema
export const ExerciseDataSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  exerciseName: z.string().min(1).max(200).trim().optional(),
  order: z.number().int().min(0).optional(),
  sets: z.array(SetSchema).optional(),
})

// Fingerboard hang schema
export const FingerboardHangSchema = z.object({
  order: z.number().int().min(0).optional(),
  handType: HandTypeSchema,
  gripType: GripTypeSchema,
  crimpSize: z.number().int().positive().nullable().optional(),
  customDescription: z.string().max(500).trim().nullable().optional(),
  load: z.number().positive().nullable().optional(),
  unload: z.number().positive().nullable().optional(),
  reps: z.number().int().positive().nullable().optional(),
  timeSeconds: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
})

// Details schema (JSON field - flexible validation)
export const WorkoutDetailsSchema = z
  .object({
    routineVariation: z
      .object({
        routineName: z.string().max(200).optional(),
        variationName: z.string().max(200).optional(),
      })
      .optional(),
    quickLog: z.boolean().optional(),
    protocolId: z.string().optional(),
  })
  .passthrough()
  .nullable()
  .optional()

// Main workout schema
export const CreateWorkoutSchema = z.object({
  type: WorkoutTypeSchema,
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // ISO date or YYYY-MM-DD
  trainingVolume: TrainingVolumeSchema,
  details: WorkoutDetailsSchema,
  preSessionFeel: z.number().int().min(1).max(5).nullable().optional(),
  dayAfterTiredness: z.number().int().min(1).max(5).nullable().optional(),
  focusLevel: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().max(5000).trim().nullable().optional(),
  sector: z.string().max(200).trim().nullable().optional(),
  mentalPracticeType: MentalPracticeTypeSchema,
  timeOfDay: TimeOfDaySchema,
  gratitude: z.string().max(2000).trim().nullable().optional(),
  improvements: z.string().max(2000).trim().nullable().optional(),
  mentalState: z.string().max(500).trim().nullable().optional(),
  planId: z.string().nullable().optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  exercises: z.array(ExerciseDataSchema).optional(),
  fingerboardHangs: z.array(FingerboardHangSchema).optional(),
})

// Update workout schema (all fields optional except type)
export const UpdateWorkoutSchema = CreateWorkoutSchema.partial().extend({
  type: WorkoutTypeSchema.optional(),
})

// Sanitize string inputs
export function sanitizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.trim() || null
}

// Sanitize number inputs
export function sanitizeNumber(value: unknown): number | null {
  if (typeof value === 'number') return isNaN(value) ? null : value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

// Sanitize integer inputs
export function sanitizeInteger(value: unknown): number | null {
  if (typeof value === 'number') return Number.isInteger(value) && !isNaN(value) ? value : null
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10)
    return !isNaN(parsed) ? parsed : null
  }
  return null
}

