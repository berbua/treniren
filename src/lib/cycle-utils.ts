// Menstruation cycle calculation utilities
// Based on the cycle information from menstruation-cycle-info.md

import { DAY_MS, localDayNumber, storedDayNumber } from './date-utils'

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

// The luteal phase is fairly constant (~14 days), so ovulation sits about 14 days before the next period.
// For the default 28-day cycle this gives the original ranges: 1-7, 8-12, 13-16, 17-20, 21-28.
const LUTEAL_LENGTH = 14

interface PhaseRange {
  phase: CyclePhase
  start: number
  end: number
}

/**
 * Phase day ranges for a cycle length. Phases can be empty in very short cycles
 * (e.g. no separate follicular days in a 21-day cycle).
 */
export function getPhaseRanges(cycleLength: number = DEFAULT_CYCLE_LENGTH): PhaseRange[] {
  const ovulationDay = Math.max(cycleLength - LUTEAL_LENGTH, 2)
  const ovulationStart = ovulationDay - 1
  const ovulationEnd = Math.min(ovulationDay + 2, cycleLength)
  const menstrualEnd = Math.min(7, ovulationStart - 1)
  const earlyLutealEnd = Math.min(ovulationEnd + 4, cycleLength)

  return [
    { phase: 'menstrual', start: 1, end: menstrualEnd },
    { phase: 'follicular', start: menstrualEnd + 1, end: ovulationStart - 1 },
    { phase: 'ovulation', start: ovulationStart, end: ovulationEnd },
    { phase: 'early-luteal', start: ovulationEnd + 1, end: earlyLutealEnd },
    { phase: 'late-luteal', start: earlyLutealEnd + 1, end: cycleLength },
  ]
}

/**
 * Calculate cycle information for a day.
 *
 * `targetDate`: a local Date (default: now) is taken as that local calendar day; a string
 * ('YYYY-MM-DD' or a stored ISO date) is taken as the stored calendar day.
 */
export function calculateCycleInfo(settings: CycleSettings, targetDate?: Date | string): CycleInfo {
  const cycleLength = settings.cycleLength > 0 ? settings.cycleLength : DEFAULT_CYCLE_LENGTH

  // lastPeriodDate is stored as UTC midnight. Rounding to the nearest midnight also handles older values
  // that were saved as local midnight (22:00/23:00 UTC the previous day).
  const lastPeriodDay = Math.round(new Date(settings.lastPeriodDate).getTime() / DAY_MS)
  const targetDay = typeof targetDate === 'string' ? storedDayNumber(targetDate) : localDayNumber(targetDate ?? new Date())

  const daysSinceLastPeriod = targetDay - lastPeriodDay

  // Current cycle day (1-based), also correct for dates before the last period
  const currentDay = ((daysSinceLastPeriod % cycleLength) + cycleLength) % cycleLength + 1

  // Start of the cycle the target day is in, so predictions always point to the upcoming period/ovulation
  const cycleStartDay = targetDay - (currentDay - 1)
  const ovulationDay = Math.max(cycleLength - LUTEAL_LENGTH, 2)
  const nextPeriodDate = toLocalMidnight(cycleStartDay + cycleLength)
  const nextOvulationDay = currentDay <= ovulationDay
    ? cycleStartDay + ovulationDay - 1
    : cycleStartDay + cycleLength + ovulationDay - 1
  const nextOvulationDate = toLocalMidnight(nextOvulationDay)

  const phaseInfo = getPhaseInfo(currentDay, cycleLength)

  return {
    currentDay,
    phase: phaseInfo.phase,
    phaseDescription: phaseInfo.description,
    nextPeriodDate,
    nextOvulationDate,
    // Fertile window: ~4 days before ovulation through 2 days after
    isInFertileWindow: currentDay >= ovulationDay - 4 && currentDay <= ovulationDay + 2,
    trainingRecommendations: phaseInfo.recommendations,
  }
}

// Local midnight of a day number, so toLocaleDateString() shows that calendar day
function toLocalMidnight(dayNumber: number): Date {
  const utc = new Date(dayNumber * DAY_MS)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

const PHASE_DESCRIPTIONS: Record<CyclePhase, string> = {
  'menstrual': 'menstrual',
  'follicular': 'follicular',
  'ovulation': 'ovulation',
  'early-luteal': 'earlyLuteal',
  'late-luteal': 'lateLuteal',
}

/**
 * Phase of a cycle day. Days past the cycle length (a longer cycle than usual) count as late luteal.
 */
export function getPhaseForCycleDay(cycleDay: number, cycleLength: number = DEFAULT_CYCLE_LENGTH): CyclePhase {
  return getPhaseRanges(cycleLength).find(r => cycleDay >= r.start && cycleDay <= r.end)?.phase ?? 'late-luteal'
}

/**
 * Get phase information based on cycle day
 */
function getPhaseInfo(cycleDay: number, cycleLength: number = DEFAULT_CYCLE_LENGTH) {
  const phase = getPhaseForCycleDay(cycleDay, cycleLength)
  const description = PHASE_DESCRIPTIONS[phase]
  return {
    phase,
    description,
    recommendations: [1, 2, 3, 4, 5].map(n => `cycle.recommendations.${description}.${n}`),
  }
}

/**
 * Get the first day of a cycle phase
 */
export function getPhaseStartDay(phase: CyclePhase, cycleLength: number = DEFAULT_CYCLE_LENGTH): number {
  return getPhaseRanges(cycleLength).find(r => r.phase === phase)?.start ?? 1
}

/**
 * Get the last day of a cycle phase
 */
export function getPhaseEndDay(phase: CyclePhase, cycleLength: number = DEFAULT_CYCLE_LENGTH): number {
  return getPhaseRanges(cycleLength).find(r => r.phase === phase)?.end ?? cycleLength
}

/**
 * Get phase day range as string (e.g., "1-7", "17-20")
 */
export function getPhaseDayRange(phase: CyclePhase, cycleLength: number = 28): string {
  const start = getPhaseStartDay(phase, cycleLength)
  const end = getPhaseEndDay(phase, cycleLength)
  // A phase can be empty in very short cycles
  return start > end ? '–' : start === end ? `${start}` : `${start}-${end}`
}

/**
 * Get phase name from phase key (for display)
 */
export function getPhaseDisplayName(phaseKey: 'menstrual' | 'follicular' | 'ovulation' | 'earlyLuteal' | 'lateLuteal'): CyclePhase {
  switch (phaseKey) {
    case 'menstrual':
      return 'menstrual'
    case 'follicular':
      return 'follicular'
    case 'ovulation':
      return 'ovulation'
    case 'earlyLuteal':
      return 'early-luteal'
    case 'lateLuteal':
      return 'late-luteal'
    default:
      return 'menstrual'
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
