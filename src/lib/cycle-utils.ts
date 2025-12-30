// Menstruation cycle calculation utilities
// Based on the cycle information from menstruation-cycle-info.md

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'early-luteal' | 'late-luteal'

export interface CycleInfo {
  currentDay: number
  phase: CyclePhase
  phaseDescription: string
  nextPeriodDate: Date
  nextOvulationDate: Date
  isInFertileWindow: boolean
  trainingRecommendations: string[]
}

export interface CycleSettings {
  cycleLength: number // days
  lastPeriodDate: Date
  timezone: string
}

// Default cycle length from the app planning document
const DEFAULT_CYCLE_LENGTH = 28

/**
 * Calculate cycle information for a specific date based on last period date and cycle length
 */
export function calculateCycleInfo(settings: CycleSettings, targetDate?: Date): CycleInfo {
  const { cycleLength, lastPeriodDate } = settings
  const date = targetDate || new Date()
  
  // Calculate days since last period
  const daysSinceLastPeriod = Math.floor(
    (date.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Calculate current cycle day (1-based)
  const currentDay = (daysSinceLastPeriod % cycleLength) + 1
  
  // Calculate next period date
  const nextPeriodDate = new Date(lastPeriodDate)
  nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength)
  
  // Calculate next ovulation date (approximately day 14)
  const nextOvulationDate = new Date(lastPeriodDate)
  nextOvulationDate.setDate(nextOvulationDate.getDate() + 14)
  
  // Determine current phase and get recommendations
  const phaseInfo = getPhaseInfo(currentDay)
  
  return {
    currentDay,
    phase: phaseInfo.phase,
    phaseDescription: phaseInfo.description,
    nextPeriodDate,
    nextOvulationDate,
    isInFertileWindow: currentDay >= 10 && currentDay <= 16,
    trainingRecommendations: phaseInfo.recommendations,
  }
}

/**
 * Get phase information based on cycle day
 */
function getPhaseInfo(cycleDay: number) {
  // Menstrual Phase (Days 1-7)
  if (cycleDay >= 1 && cycleDay <= 7) {
    return {
      phase: 'menstrual' as CyclePhase,
      description: 'menstrual',
      recommendations: [
        'cycle.recommendations.menstrual.1',
        'cycle.recommendations.menstrual.2',
        'cycle.recommendations.menstrual.3',
        'cycle.recommendations.menstrual.4',
        'cycle.recommendations.menstrual.5'
      ]
    }
  }
  
  // Follicular Phase (Days 8-12)
  if (cycleDay >= 8 && cycleDay <= 12) {
    return {
      phase: 'follicular' as CyclePhase,
      description: 'follicular',
      recommendations: [
        'cycle.recommendations.follicular.1',
        'cycle.recommendations.follicular.2',
        'cycle.recommendations.follicular.3',
        'cycle.recommendations.follicular.4',
        'cycle.recommendations.follicular.5'
      ]
    }
  }
  
  // Ovulation (Days 13-16)
  if (cycleDay >= 13 && cycleDay <= 16) {
    return {
      phase: 'ovulation' as CyclePhase,
      description: 'ovulation',
      recommendations: [
        'cycle.recommendations.ovulation.1',
        'cycle.recommendations.ovulation.2',
        'cycle.recommendations.ovulation.3',
        'cycle.recommendations.ovulation.4',
        'cycle.recommendations.ovulation.5'
      ]
    }
  }
  
  // Early Luteal Phase (Days 17-20)
  if (cycleDay >= 17 && cycleDay <= 20) {
    return {
      phase: 'early-luteal' as CyclePhase,
      description: 'earlyLuteal',
      recommendations: [
        'cycle.recommendations.earlyLuteal.1',
        'cycle.recommendations.earlyLuteal.2',
        'cycle.recommendations.earlyLuteal.3',
        'cycle.recommendations.earlyLuteal.4',
        'cycle.recommendations.earlyLuteal.5'
      ]
    }
  }
  
  // Late Luteal Phase/PMS (Days 21-28)
  return {
    phase: 'late-luteal' as CyclePhase,
    description: 'lateLuteal',
    recommendations: [
      'cycle.recommendations.lateLuteal.1',
      'cycle.recommendations.lateLuteal.2',
      'cycle.recommendations.lateLuteal.3',
      'cycle.recommendations.lateLuteal.4',
      'cycle.recommendations.lateLuteal.5'
    ]
  }
}

/**
 * Get phase color for UI display
 */
export function getPhaseColor(phase: CyclePhase): string {
  switch (phase) {
    case 'menstrual':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'follicular':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'ovulation':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'early-luteal':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'late-luteal':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

/**
 * Format date for display
 */
export function formatCycleDate(date: Date): string {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}

/**
 * Get default cycle settings
 */
export function getDefaultCycleSettings(): CycleSettings {
  return {
    cycleLength: DEFAULT_CYCLE_LENGTH,
    lastPeriodDate: typeof window !== 'undefined' ? new Date() : new Date('2024-01-15T00:00:00.000Z'),
    timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  }
}
