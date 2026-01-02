import { z } from 'zod'

// Event type enum
export const EventTypeSchema = z.enum(['INJURY', 'PHYSIO', 'COMPETITION', 'TRIP', 'OTHER'])

// Trip climbing type enum
export const TripClimbingTypeSchema = z.enum(['BOULDERING', 'SPORT_CLIMBING']).nullable().optional()

// Injury severity - number 1-5 scale
export const InjurySeveritySchema = z.number().int().min(1).max(5).nullable().optional()

// Injury status enum
export const InjuryStatusSchema = z.enum(['ACTIVE', 'RECOVERING', 'HEALED', 'CHRONIC']).nullable().optional()

// Main event schema
export const CreateEventSchema = z.object({
  type: EventTypeSchema,
  title: z.string().min(1, 'Title is required').max(200).trim(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // ISO date or YYYY-MM-DD
  startTime: z.string().datetime().nullable().optional(),
  endTime: z.string().datetime().nullable().optional(),
  description: z.string().max(5000).trim().nullable().optional(),
  location: z.string().max(500).trim().nullable().optional(),
  severity: InjurySeveritySchema,
  status: InjuryStatusSchema,
  notes: z.string().max(5000).trim().nullable().optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  // Trip-specific fields
  tripStartDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  tripEndDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  destination: z.string().max(200).trim().nullable().optional(),
  climbingType: TripClimbingTypeSchema,
  showCountdown: z.boolean().optional(),
  // Cycle tracking for injuries
  cycleDay: z.number().int().min(1).max(35).nullable().optional(),
  cycleDayManuallySet: z.boolean().optional(),
}).refine(
  (data) => {
    // If type is TRIP, tripStartDate and tripEndDate should be provided
    if (data.type === 'TRIP') {
      return !!(data.tripStartDate && data.tripEndDate)
    }
    return true
  },
  {
    message: 'Trip start date and end date are required for TRIP events',
    path: ['tripStartDate'],
  }
).refine(
  (data) => {
    // If trip dates are provided, end date should be after start date
    if (data.tripStartDate && data.tripEndDate) {
      const start = new Date(data.tripStartDate)
      const end = new Date(data.tripEndDate)
      return end >= start
    }
    return true
  },
  {
    message: 'Trip end date must be after or equal to start date',
    path: ['tripEndDate'],
  }
)

// Update event schema (all fields optional)
// We need to create it from base schema without refine, then add refine
const BaseEventSchema = z.object({
  type: EventTypeSchema,
  title: z.string().min(1, 'Title is required').max(200).trim(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  startTime: z.string().datetime().nullable().optional(),
  endTime: z.string().datetime().nullable().optional(),
  description: z.string().max(5000).trim().nullable().optional(),
  location: z.string().max(500).trim().nullable().optional(),
  severity: InjurySeveritySchema,
  status: InjuryStatusSchema,
  notes: z.string().max(5000).trim().nullable().optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  tripStartDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  tripEndDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).nullable().optional(),
  destination: z.string().max(200).trim().nullable().optional(),
  climbingType: TripClimbingTypeSchema,
  showCountdown: z.boolean().optional(),
  cycleDay: z.number().int().min(1).max(35).nullable().optional(),
  cycleDayManuallySet: z.boolean().optional(),
})

export const UpdateEventSchema = BaseEventSchema.partial().refine(
  (data) => {
    // If type is TRIP, tripStartDate and tripEndDate should be provided
    if (data.type === 'TRIP') {
      return !!(data.tripStartDate && data.tripEndDate)
    }
    return true
  },
  {
    message: 'Trip start date and end date are required for TRIP events',
    path: ['tripStartDate'],
  }
).refine(
  (data) => {
    // If trip dates are provided, end date should be after start date
    if (data.tripStartDate && data.tripEndDate) {
      const start = new Date(data.tripStartDate)
      const end = new Date(data.tripEndDate)
      return end >= start
    }
    return true
  },
  {
    message: 'Trip end date must be after or equal to start date',
    path: ['tripEndDate'],
  }
)

// PATCH schema for cycle day updates
export const UpdateCycleDaySchema = z.object({
  cycleDay: z.number().int().min(1).max(35).nullable().optional(),
  cycleDayManuallySet: z.boolean().optional(),
})

