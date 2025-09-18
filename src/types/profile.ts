// User profile and cycle tracking types

export interface UserProfile {
  userId: string
  photoUrl?: string
  googleSheetsUrl?: string
  cycleAvgLengthDays: number
  lastPeriodDate?: Date
  timezone: string
  cycleTrackingEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CycleSettings {
  cycleLength: number
  lastPeriodDate: Date
  timezone: string
}
