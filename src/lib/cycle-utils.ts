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
  const date = targetDate || (typeof window !== 'undefined' ? new Date() : new Date('2024-01-15T00:00:00.000Z'))
  
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
        'Maintain activity while reducing intensity',
        'Work on technique and mobility',
        'Reduce volume and increase rest between attempts',
        'Focus on sub-maximal strength training (70-90%)',
        'Consider planning a recovery week'
      ]
    }
  }
  
  // Follicular Phase (Days 8-12)
  if (cycleDay >= 8 && cycleDay <= 12) {
    return {
      phase: 'follicular' as CyclePhase,
      description: 'follicular',
      recommendations: [
        'Optimal time for intense training',
        'Focus on maximum strength sessions',
        'Work on difficult projects and test limits',
        'Good for hard bouldering and power training',
        'Monitor your well-being and energy levels'
      ]
    }
  }
  
  // Ovulation (Days 13-16)
  if (cycleDay >= 13 && cycleDay <= 16) {
    return {
      phase: 'ovulation' as CyclePhase,
      description: 'ovulation',
      recommendations: [
        'Maximize power while taking care of joints',
        'Reach peak level of intensity if feeling strong',
        'Long warm-up and caution with dynamic moves',
        'Higher injury risk - focus on training load and recovery',
        'Tackle difficult projects but don\'t force joints'
      ]
    }
  }
  
  // Early Luteal Phase (Days 17-20)
  if (cycleDay >= 17 && cycleDay <= 20) {
    return {
      phase: 'early-luteal' as CyclePhase,
      description: 'earlyLuteal',
      recommendations: [
        'High intensity, low volume training',
        'Focus on dynamic movements',
        'Train intensely with fewer repetitions',
        'Adjust intensity based on how you feel',
        'Good time for strength endurance training'
      ]
    }
  }
  
  // Late Luteal Phase/PMS (Days 21-28)
  return {
    phase: 'late-luteal' as CyclePhase,
    description: 'lateLuteal',
    recommendations: [
      'Maintain training consistency without pressure',
      'Good time for deload and calmer climbing',
      'Focus on technique, execution, and tactics',
      'Reduce strength load',
      'Use for repeats and refining details'
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
