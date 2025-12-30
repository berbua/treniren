import { prisma } from './prisma'
import { calculate1RM, calculateTotalVolume } from './1rm-calculator'

export interface ProgressionDataPoint {
  date: string // ISO date
  workoutId: string
  workoutDate: string
  sets: number
  maxWeight: number
  averageWeight: number
  totalVolume: number // sum of (weight × reps)
  bestSet: {
    weight: number
    reps: number
    rir?: number
  }
  estimated1RM: number
  averageReps: number
  averageRIR?: number
}

export interface PersonalRecords {
  maxWeight: { value: number; date: string; workoutId: string }
  maxVolume: { value: number; date: string; workoutId: string }
  max1RM: { value: number; date: string; workoutId: string }
  maxReps: { value: number; date: string; workoutId: string }
}

export interface ExerciseProgressionSummary {
  totalWorkouts: number
  totalSets: number
  peakWeight: number
  peakVolume: number
  peak1RM: number
  averageWeight: number
  averageVolume: number
  improvement: {
    weight: number // % change
    volume: number // % change
    period: string
  }
}

export interface ExerciseProgressionData {
  exercise: {
    id: string
    name: string
    category?: string
    defaultUnit: string
  }
  timeframe: {
    start: string
    end: string
  }
  dataPoints: ProgressionDataPoint[]
  summary: ExerciseProgressionSummary
  personalRecords: PersonalRecords
}

export type TimeFrame = '1week' | '1month' | '3months' | '6months' | '1year' | 'all'
export type Metric = 'weight' | 'volume' | 'reps' | '1rm'

/**
 * Get time range based on timeframe
 */
function getTimeRange(timeframe: TimeFrame): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  let start: Date

  switch (timeframe) {
    case '1week':
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      break
    case '1month':
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
      break
    case '3months':
      start = new Date(now)
      start.setMonth(start.getMonth() - 3)
      break
    case '6months':
      start = new Date(now)
      start.setMonth(start.getMonth() - 6)
      break
    case '1year':
      start = new Date(now)
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all':
      start = new Date(0) // Beginning of time
      break
    default:
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
  }

  start.setHours(0, 0, 0, 0)
  return { start, end }
}

/**
 * Get exercise progression data
 */
export async function getExerciseProgression(
  exerciseId: string,
  userId: string,
  timeframe: TimeFrame = '1month'
): Promise<ExerciseProgressionData | null> {
  try {
    // Get exercise
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        userId,
      },
    })

    if (!exercise) {
      return null
    }

    // Get time range
    const timeRange = getTimeRange(timeframe)

    // Get all workouts with this exercise in the timeframe
    const workoutExercises = await prisma.workoutExercise.findMany({
      where: {
        exerciseId,
        workout: {
          userId,
          startTime: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        },
      },
      include: {
        workout: {
          select: {
            id: true,
            startTime: true,
          },
        },
        sets: {
          orderBy: {
            setNumber: 'asc',
          },
        },
      },
      orderBy: {
        workout: {
          startTime: 'asc',
        },
      },
    })

    // Process each workout to calculate metrics
    const dataPoints: ProgressionDataPoint[] = []
    let totalSets = 0
    let totalVolume = 0
    let totalWeight = 0
    let totalReps = 0
    let totalRIR = 0
    let rirCount = 0

    const allWeights: number[] = []
    const allVolumes: number[] = []
    const all1RMs: number[] = []
    const allReps: number[] = []

    workoutExercises.forEach((we) => {
      // Filter sets that have both weight and reps
      const validSets = we.sets.filter(
        (s) => s.weight !== null && s.reps !== null && s.weight > 0 && s.reps > 0
      )

      if (validSets.length === 0) return

      const weights = validSets.map((s) => s.weight!)
      const reps = validSets.map((s) => s.reps!)
      const rirs = validSets.map((s) => s.rir).filter((r) => r !== null) as number[]

      const maxWeight = Math.max(...weights)
      const averageWeight = weights.reduce((a, b) => a + b, 0) / weights.length
      const workoutVolume = calculateTotalVolume(
        validSets.map((s) => ({ weight: s.weight!, reps: s.reps! }))
      )

      // Find best set (highest weight × reps, or highest weight if equal)
      const bestSet = validSets.reduce((best, current) => {
        const bestValue = best.weight! * best.reps!
        const currentValue = current.weight! * current.reps!
        if (currentValue > bestValue) return current
        if (currentValue === bestValue && current.weight! > best.weight!) return current
        return best
      }, validSets[0])

      // Calculate estimated 1RM from best set
      const estimated1RM = calculate1RM(bestSet.weight!, bestSet.reps!, bestSet.rir || undefined)

      const averageReps = reps.reduce((a, b) => a + b, 0) / reps.length
      const averageRIR = rirs.length > 0 ? rirs.reduce((a, b) => a + b, 0) / rirs.length : undefined

      dataPoints.push({
        date: we.workout.startTime.toISOString(),
        workoutId: we.workout.id,
        workoutDate: we.workout.startTime.toISOString(),
        sets: validSets.length,
        maxWeight,
        averageWeight,
        totalVolume: workoutVolume,
        bestSet: {
          weight: bestSet.weight!,
          reps: bestSet.reps!,
          rir: bestSet.rir || undefined,
        },
        estimated1RM,
        averageReps,
        averageRIR,
      })

      // Accumulate for summary
      totalSets += validSets.length
      totalVolume += workoutVolume
      totalWeight += averageWeight
      totalReps += averageReps
      if (averageRIR !== undefined) {
        totalRIR += averageRIR
        rirCount++
      }

      allWeights.push(maxWeight)
      allVolumes.push(workoutVolume)
      all1RMs.push(estimated1RM)
      allReps.push(...reps)
    })

    // Calculate summary
    const totalWorkouts = dataPoints.length
    const averageWeight = totalWorkouts > 0 ? totalWeight / totalWorkouts : 0
    const averageVolume = totalWorkouts > 0 ? totalVolume / totalWorkouts : 0

    const peakWeight = allWeights.length > 0 ? Math.max(...allWeights) : 0
    const peakVolume = allVolumes.length > 0 ? Math.max(...allVolumes) : 0
    const peak1RM = all1RMs.length > 0 ? Math.max(...all1RMs) : 0
    const maxReps = allReps.length > 0 ? Math.max(...allReps) : 0

    // Calculate improvement (compare first half vs second half of data)
    let weightImprovement = 0
    let volumeImprovement = 0
    if (dataPoints.length >= 4) {
      const midpoint = Math.floor(dataPoints.length / 2)
      const firstHalf = dataPoints.slice(0, midpoint)
      const secondHalf = dataPoints.slice(midpoint)

      const firstAvgWeight =
        firstHalf.reduce((sum, p) => sum + p.maxWeight, 0) / firstHalf.length
      const secondAvgWeight =
        secondHalf.reduce((sum, p) => sum + p.maxWeight, 0) / secondHalf.length

      const firstAvgVolume =
        firstHalf.reduce((sum, p) => sum + p.totalVolume, 0) / firstHalf.length
      const secondAvgVolume =
        secondHalf.reduce((sum, p) => sum + p.totalVolume, 0) / secondHalf.length

      weightImprovement = firstAvgWeight > 0 ? ((secondAvgWeight - firstAvgWeight) / firstAvgWeight) * 100 : 0
      volumeImprovement = firstAvgVolume > 0 ? ((secondAvgVolume - firstAvgVolume) / firstAvgVolume) * 100 : 0
    }

    // Find personal records
    const maxWeightPoint = dataPoints.reduce(
      (max, p) => (p.maxWeight > max.maxWeight ? p : max),
      dataPoints[0] || { maxWeight: 0, workoutId: '', date: '' }
    )

    const maxVolumePoint = dataPoints.reduce(
      (max, p) => (p.totalVolume > max.totalVolume ? p : max),
      dataPoints[0] || { totalVolume: 0, workoutId: '', date: '' }
    )

    const max1RMPoint = dataPoints.reduce(
      (max, p) => (p.estimated1RM > max.estimated1RM ? p : max),
      dataPoints[0] || { estimated1RM: 0, workoutId: '', date: '' }
    )

    const maxRepsPoint = dataPoints.reduce(
      (max, p) => (p.bestSet.reps > max.bestSet.reps ? p : max),
      dataPoints[0] || { bestSet: { reps: 0, weight: 0 }, workoutId: '', date: '' }
    )

    const personalRecords: PersonalRecords = {
      maxWeight: {
        value: maxWeightPoint.maxWeight || 0,
        date: maxWeightPoint.date,
        workoutId: maxWeightPoint.workoutId,
      },
      maxVolume: {
        value: maxVolumePoint.totalVolume || 0,
        date: maxVolumePoint.date,
        workoutId: maxVolumePoint.workoutId,
      },
      max1RM: {
        value: max1RMPoint.estimated1RM || 0,
        date: max1RMPoint.date,
        workoutId: max1RMPoint.workoutId,
      },
      maxReps: {
        value: maxRepsPoint.bestSet.reps || 0,
        date: maxRepsPoint.date,
        workoutId: maxRepsPoint.workoutId,
      },
    }

    return {
      exercise: {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category || undefined,
        defaultUnit: exercise.defaultUnit,
      },
      timeframe: {
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
      },
      dataPoints,
      summary: {
        totalWorkouts,
        totalSets,
        peakWeight,
        peakVolume,
        peak1RM,
        averageWeight,
        averageVolume,
        improvement: {
          weight: Math.round(weightImprovement * 10) / 10,
          volume: Math.round(volumeImprovement * 10) / 10,
          period: timeframe,
        },
      },
      personalRecords,
    }
  } catch (error) {
    console.error('Error getting exercise progression:', error)
    return null
  }
}


