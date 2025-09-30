// Temporary types until we set up the database
export type WorkoutType = 'GYM' | 'BOULDERING' | 'CIRCUITS' | 'LEAD_ROCK' | 'LEAD_ARTIFICIAL' | 'MENTAL_PRACTICE'
export type TrainingVolume = 'TR1' | 'TR2' | 'TR3' | 'TR4' | 'TR5'
export type MentalPracticeType = 'MEDITATION' | 'REFLECTING' | 'OTHER'
export type FocusState = 'CHOKE' | 'DISTRACTION' | 'PRESENT' | 'FOCUSED' | 'CLUTCH' | 'FLOW'
export type ComfortZone = 'COMFORT' | 'STRETCH1' | 'STRETCH2' | 'PANIC'

export interface ClimbSection {
  id: string
  focusState?: FocusState
  tookFall?: boolean
  comfortZone?: ComfortZone
  notes?: string
}

export interface MentalState {
  beforeClimbing?: number // 1-5 scale
  duringClimbing?: number // 1-5 scale
  tookFalls?: boolean
  reflections?: string
  climbSections?: ClimbSection[] // For lead climbing
}

export interface Workout {
  id: string
  type: WorkoutType
  startTime: string
  endTime?: string
  trainingVolume?: TrainingVolume
  notes?: string
  preSessionFeel?: number
  dayAfterTiredness?: number
  focusLevel?: number // 1-5 scale for mental practice
  mentalState?: MentalState
  sector?: string // For lead_rock workouts
  mentalPracticeType?: MentalPracticeType // For mental practice workouts
  gratitude?: string // 3 things I am grateful for
  improvements?: string // 3 things to do better next time
  planId?: string
  userId: string
  createdAt: string
  updatedAt: string
  tags?: Tag[] // Associated tags
}

export interface Exercise {
  id: string
  name: string
  category?: string
  defaultUnit: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface WorkoutTag {
  workoutId: string
  tagId: string
}

export interface WorkoutFormData {
  type: WorkoutType
  date: string
  trainingVolume: TrainingVolume
  preSessionFeel: number
  dayAfterTiredness: number
  focusLevel?: number // 1-5 scale for mental practice
  notes: string
  mentalState?: MentalState
  sector?: string // For lead_rock workouts
  mentalPracticeType?: MentalPracticeType // For mental practice workouts
  gratitude?: string // 3 things I am grateful for
  improvements?: string // 3 things to do better next time
  tagIds?: string[] // Array of tag IDs
}
