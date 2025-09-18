// Temporary types until we set up the database
export type WorkoutType = 'GYM' | 'BOULDERING' | 'CIRCUITS' | 'LEAD_ROCK' | 'LEAD_ARTIFICIAL'
export type TrainingVolume = 'TR1' | 'TR2' | 'TR3' | 'TR4' | 'TR5'

export interface Workout {
  id: string
  type: WorkoutType
  date: string
  trainingVolume?: TrainingVolume
  notes?: string
  preSessionFeel?: number
  dayAfterTiredness?: number
  planId?: string
  userId: string
  createdAt: string
  updatedAt: string
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

export interface WorkoutFormData {
  type: WorkoutType
  date: string
  trainingVolume: TrainingVolume
  preSessionFeel: number
  dayAfterTiredness: number
  notes: string
}
