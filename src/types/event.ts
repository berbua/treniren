// Event types for tracking injuries, physio visits, competitions, trips, etc.

export type EventType = 'INJURY' | 'PHYSIO' | 'COMPETITION' | 'TRIP' | 'OTHER'

export type TripClimbingType = 'BOULDERING' | 'SPORT_CLIMBING'

export interface Event {
  id: string
  type: EventType
  title: string
  date: string
  startTime?: string
  endTime?: string
  description?: string
  location?: string
  severity?: number // 1-5 scale for injuries
  status?: string // e.g., "Recovering", "Healed", "Ongoing" for injuries
  notes?: string
  // Trip-specific fields
  tripStartDate?: string
  tripEndDate?: string
  destination?: string
  climbingType?: TripClimbingType
  showCountdown?: boolean
  // Cycle tracking for injuries
  cycleDay?: number // Manually set cycle day for injury events
  cycleDayManuallySet?: boolean // Flag to indicate if cycle day was manually set
  userId: string
  createdAt: string
  updatedAt: string
  tags?: Tag[] // Associated tags
}

export interface EventFormData {
  type: EventType
  title: string
  date: string
  startTime?: string
  endTime?: string
  description?: string
  location?: string
  severity?: number
  status?: string
  notes?: string
  // Trip-specific fields
  tripStartDate?: string
  tripEndDate?: string
  destination?: string
  climbingType?: TripClimbingType
  showCountdown?: boolean
  // Cycle tracking for injuries
  cycleDay?: number
  cycleDayManuallySet?: boolean
  tagIds?: string[] // Array of tag IDs
}

export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}
