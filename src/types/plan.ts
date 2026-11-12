import type { TrainingVolume, WorkoutType } from './workout'

// A planned session (Plan row) as returned by /api/plans
export interface PlannedSession {
  id: string
  date: string // stored date (UTC midnight)
  title: string
  type: WorkoutType | null
  trainingVolume: TrainingVolume | null
  notes: string | null
  workouts: { id: string }[] // Workouts logged from this plan; non-empty = done
}
