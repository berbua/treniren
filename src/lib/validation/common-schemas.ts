import { z } from 'zod'

// Exercise schema
export const CreateExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(200).trim(),
  category: z.string().max(100).trim().nullable().optional(),
  defaultUnit: z.enum(['kg', 'lbs', 'reps', 'seconds', 'minutes']).optional(),
})

export const UpdateExerciseSchema = CreateExerciseSchema.partial()

// Tag schema
export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').or(z.string().max(50)),
})

export const UpdateTagSchema = CreateTagSchema.partial()

// Routine schema
export const RoutineExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().min(0).optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
})

export const RoutineVariationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().nullable().optional(),
  defaultSets: z.number().int().positive().nullable().optional(),
  defaultRepRangeMin: z.number().int().positive().nullable().optional(),
  defaultRepRangeMax: z.number().int().positive().nullable().optional(),
  defaultRIR: z.number().int().min(0).max(10).nullable().optional(),
})

export const CreateRoutineSchema = z.object({
  name: z.string().min(1, 'Routine name is required').max(200).trim(),
  description: z.string().max(2000).trim().nullable().optional(),
  exercises: z.array(RoutineExerciseSchema).optional(),
  variations: z.array(RoutineVariationSchema).optional(),
})

export const UpdateRoutineSchema = CreateRoutineSchema.partial()

// Fingerboard protocol schema
export const FingerboardProtocolHangSchema = z.object({
  order: z.number().int().min(0).optional(),
  handType: z.enum(['ONE_HAND', 'BOTH_HANDS']),
  gripType: z.enum(['OPEN_HAND', 'CRIMP', 'SLOPER']),
  crimpSize: z.number().int().positive().nullable().optional(),
  customDescription: z.string().max(500).trim().nullable().optional(),
  defaultLoad: z.number().positive().nullable().optional(),
  defaultUnload: z.number().positive().nullable().optional(),
  defaultReps: z.number().int().positive().nullable().optional(),
  defaultTimeSeconds: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).trim().nullable().optional(),
})

export const CreateFingerboardProtocolSchema = z.object({
  name: z.string().min(1, 'Protocol name is required').max(200).trim(),
  description: z.string().max(2000).trim().nullable().optional(),
  hangs: z.array(FingerboardProtocolHangSchema).optional(),
})

export const UpdateFingerboardProtocolSchema = CreateFingerboardProtocolSchema.partial()

// Helper function to validate and sanitize input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

// Helper function to format validation errors for API responses
// Map common Zod error messages to user-friendly messages
const friendlyErrorMessages: Record<string, string> = {
  'Required': 'This field is required',
  'Invalid date': 'Please enter a valid date',
  'Invalid email': 'Please enter a valid email address',
  'String must contain at least': 'This field is too short',
  'String must contain at most': 'This field is too long',
  'Expected number, received': 'Please enter a number',
  'Expected string, received': 'Please enter text',
  'Invalid enum value': 'Please select a valid option',
}

function getFriendlyErrorMessage(zodMessage: string): string {
  // Check if we have a friendly message for this error
  for (const [key, value] of Object.entries(friendlyErrorMessages)) {
    if (zodMessage.includes(key)) {
      return value
    }
  }
  // Return original message if no friendly version found
  return zodMessage
}

export interface ValidationErrorDetail {
  field: string
  message: string
  displayMessage?: string
}

export function formatValidationError(error: z.ZodError): ValidationErrorDetail[] {
  return error.errors.map((err) => {
    const fieldName = err.path.length > 0 ? err.path[err.path.length - 1] : 'field'
    const friendlyMessage = getFriendlyErrorMessage(err.message)
    
    return {
      field: err.path.join('.'),
      message: friendlyMessage,
      // Add field name to message for better context
      displayMessage: `${fieldName}: ${friendlyMessage}`,
    }
  })
}

