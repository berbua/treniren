export interface Period {
  id: string
  userId: string
  startDate: string
  endDate?: string
  notes?: string
  cycleDay?: number
  createdAt: string
  updatedAt: string
}

export interface PeriodFormData {
  startDate: string
  endDate?: string
  notes?: string
}

