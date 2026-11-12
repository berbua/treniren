export interface Period {
  id: string
  userId: string
  startDate: string
  endDate?: string
  notes?: string
  flow?: number | null // 1 light, 2 medium, 3 heavy
  cycleDay?: number
  createdAt: string
  updatedAt: string
}

export interface PeriodFormData {
  startDate: string
  endDate?: string
  notes?: string
  flow?: number | null
}

