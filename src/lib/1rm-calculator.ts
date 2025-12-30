/**
 * 1RM (One Rep Max) Calculator
 * Uses multiple formulas and averages them for better accuracy
 */

export function calculate1RM(weight: number, reps: number, rir?: number): number {
  // Adjust reps if RIR (Reps in Reserve) is available
  const effectiveReps = rir !== undefined ? reps + rir : reps
  
  // Limit reps to reasonable range for formulas (most formulas work best with 1-30 reps)
  const cappedReps = Math.min(Math.max(effectiveReps, 1), 30)
  
  // Multiple formulas for accuracy
  const epley = weight * (1 + cappedReps / 30)
  const brzycki = weight * (36 / (37 - cappedReps))
  const lombardi = weight * Math.pow(cappedReps, 0.10)
  const oconner = weight * (1 + cappedReps / 40)
  
  // Average of all formulas for better accuracy
  const average = (epley + brzycki + lombardi + oconner) / 4
  
  // Round to 1 decimal place
  return Math.round(average * 10) / 10
}

/**
 * Calculate volume (total weight lifted) for a set
 */
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps
}

/**
 * Calculate total volume for multiple sets
 */
export function calculateTotalVolume(sets: Array<{ weight: number; reps: number }>): number {
  return sets.reduce((total, set) => {
    if (set.weight && set.reps) {
      return total + calculateVolume(set.weight, set.reps)
    }
    return total
  }, 0)
}


