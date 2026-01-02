'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ExerciseProgressionChart, TimeFrame, Metric, ChartType } from '@/components/ExerciseProgressionChart'
import Link from 'next/link'

interface ExerciseQuickStats {
  lastUsed: string | null
  lastWeight: number | null
  lastReps: number | null
  timesUsed: number
}

interface WorkoutWithExercise {
  id: string
  startTime: string
  type: string
  workoutExercises: Array<{
    sets: Array<{
      reps: number | null
      weight: number | null
      rir: number | null
      setNumber: number
    }>
  }>
}

export default function ExerciseDetailPage() {
  return (
    <AuthGuard>
      <ExerciseDetailPageContent />
    </AuthGuard>
  )
}

function ExerciseDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const exerciseId = params.id as string

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [quickStats, setQuickStats] = useState<ExerciseQuickStats | null>(null)
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutWithExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [progressionData, setProgressionData] = useState<any>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1month')
  const [selectedMetric, setSelectedMetric] = useState<Metric>('weight')
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('line')

  useEffect(() => {
    if (exerciseId) {
      fetchExerciseData()
    }
  }, [exerciseId])

  useEffect(() => {
    if (exerciseId && quickStats && quickStats.timesUsed > 0) {
      fetchProgressionData()
    }
  }, [exerciseId, selectedTimeframe])

  const fetchExerciseData = async () => {
    try {
      setLoading(true)
      const [exerciseResponse, statsResponse, workoutsResponse] = await Promise.all([
        fetch(`/api/exercises/${exerciseId}`),
        fetch(`/api/exercises/${exerciseId}/quick-stats`),
        fetch(`/api/workouts?page=1&limit=1000`), // Fetch all workouts for exercise history
      ])

      if (exerciseResponse.ok) {
        const exerciseData = await exerciseResponse.json()
        setExercise(exerciseData)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setQuickStats(statsData)
      }

      if (workoutsResponse.ok) {
        const data = await workoutsResponse.json()
        // Handle both new paginated format and old format
        const allWorkouts = Array.isArray(data) ? data : (data.workouts || [])
        // Filter workouts that contain this exercise
        const workoutsWithExercise = allWorkouts.filter((workout: any) =>
          workout.workoutExercises?.some((we: any) => we.exerciseId === exerciseId)
        )
        // Sort by date, most recent first
        workoutsWithExercise.sort((a: any, b: any) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
        setRecentWorkouts(workoutsWithExercise.slice(0, 10)) // Last 10 workouts
      }
    } catch (error) {
      console.error('Error fetching exercise data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgressionData = async () => {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/progression?timeframe=${selectedTimeframe}`)
      if (response.ok) {
        const data = await response.json()
        setProgressionData(data)
      }
    } catch (error) {
      console.error('Error fetching progression data:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return <LoadingSpinner message="Loading exercise..." fullScreen />
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-uc-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💪</div>
          <h2 className="text-2xl font-semibold text-uc-text-light mb-2">Exercise not found</h2>
          <Link
            href="/exercises"
            className="text-uc-mustard hover:text-uc-mustard/80 transition-colors"
          >
            ← Back to Exercise Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/exercises"
                className="text-uc-text-muted hover:text-uc-text-light transition-colors mb-2 inline-block"
              >
                ← Back to Exercise Library
              </Link>
              <h1 className="text-3xl font-bold text-uc-text-light">
                💪 {exercise.name}
              </h1>
              {exercise.category && (
                <p className="text-uc-text-muted mt-2">
                  Category: {exercise.category} • Unit: {exercise.defaultUnit}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
              <div className="text-sm text-uc-text-muted mb-1">Times Used</div>
              <div className="text-2xl font-bold text-uc-mustard">
                {quickStats.timesUsed}
              </div>
            </div>
            {quickStats.lastUsed && (
              <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
                <div className="text-sm text-uc-text-muted mb-1">Last Used</div>
                <div className="text-lg font-semibold text-uc-text-light">
                  {formatDate(quickStats.lastUsed)}
                </div>
              </div>
            )}
            {quickStats.lastWeight !== null && quickStats.lastReps !== null && (
              <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
                <div className="text-sm text-uc-text-muted mb-1">Last Performance</div>
                <div className="text-lg font-semibold text-uc-text-light">
                  {quickStats.lastReps} × {quickStats.lastWeight} {exercise.defaultUnit}
                </div>
              </div>
            )}
            <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
              <div className="text-sm text-uc-text-muted mb-1">Status</div>
              <div className="text-lg font-semibold text-uc-text-light">
                {quickStats.timesUsed > 0 ? '📊 Tracking' : '🆕 New'}
              </div>
            </div>
          </div>
        )}

        {/* Personal Records */}
        {progressionData && progressionData.personalRecords && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-uc-purple/20 to-uc-purple/10 rounded-xl p-4 border border-uc-purple/30">
              <div className="text-sm text-uc-text-muted mb-1">🏆 Max Weight</div>
              <div className="text-2xl font-bold text-uc-mustard">
                {progressionData.personalRecords.maxWeight.value.toFixed(1)} {exercise.defaultUnit}
              </div>
              {progressionData.personalRecords.maxWeight.date && (
                <div className="text-xs text-uc-text-muted mt-1">
                  {formatDate(progressionData.personalRecords.maxWeight.date)}
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-uc-purple/20 to-uc-purple/10 rounded-xl p-4 border border-uc-purple/30">
              <div className="text-sm text-uc-text-muted mb-1">💪 Estimated 1RM</div>
              <div className="text-2xl font-bold text-uc-mustard">
                {progressionData.personalRecords.max1RM.value.toFixed(1)} {exercise.defaultUnit}
              </div>
              {progressionData.personalRecords.max1RM.date && (
                <div className="text-xs text-uc-text-muted mt-1">
                  {formatDate(progressionData.personalRecords.max1RM.date)}
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-uc-purple/20 to-uc-purple/10 rounded-xl p-4 border border-uc-purple/30">
              <div className="text-sm text-uc-text-muted mb-1">📊 Max Volume</div>
              <div className="text-2xl font-bold text-uc-mustard">
                {progressionData.personalRecords.maxVolume.value.toFixed(0)} {exercise.defaultUnit}
              </div>
              {progressionData.personalRecords.maxVolume.date && (
                <div className="text-xs text-uc-text-muted mt-1">
                  {formatDate(progressionData.personalRecords.maxVolume.date)}
                </div>
              )}
            </div>
            <div className="bg-gradient-to-br from-uc-purple/20 to-uc-purple/10 rounded-xl p-4 border border-uc-purple/30">
              <div className="text-sm text-uc-text-muted mb-1">🔥 Max Reps</div>
              <div className="text-2xl font-bold text-uc-mustard">
                {progressionData.personalRecords.maxReps.value}
              </div>
              {progressionData.personalRecords.maxReps.date && (
                <div className="text-xs text-uc-text-muted mt-1">
                  {formatDate(progressionData.personalRecords.maxReps.date)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progression Charts */}
        {quickStats && quickStats.timesUsed > 0 ? (
          <div className="mb-8">
            {/* Controls */}
            <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20 mb-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-uc-text-muted">Timeframe:</label>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value as TimeFrame)}
                    className="bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                  >
                    <option value="1week">1 Week</option>
                    <option value="1month">1 Month</option>
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="1year">1 Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-uc-text-muted">Metric:</label>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as Metric)}
                    className="bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                  >
                    <option value="weight">Max Weight</option>
                    <option value="1rm">Estimated 1RM</option>
                    <option value="volume">Total Volume</option>
                    <option value="reps">Average Reps</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-uc-text-muted">Chart Type:</label>
                  <select
                    value={selectedChartType}
                    onChange={(e) => setSelectedChartType(e.target.value as ChartType)}
                    className="bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                  >
                    <option value="line">Line</option>
                    <option value="area">Area</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chart */}
            <ExerciseProgressionChart
              exerciseId={exerciseId}
              metric={selectedMetric}
              timeframe={selectedTimeframe}
              chartType={selectedChartType}
            />

            {/* Summary Stats */}
            {progressionData && progressionData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
                  <div className="text-sm text-uc-text-muted mb-1">Total Workouts</div>
                  <div className="text-xl font-bold text-uc-text-light">
                    {progressionData.summary.totalWorkouts}
                  </div>
                </div>
                <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
                  <div className="text-sm text-uc-text-muted mb-1">Total Sets</div>
                  <div className="text-xl font-bold text-uc-text-light">
                    {progressionData.summary.totalSets}
                  </div>
                </div>
                <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
                  <div className="text-sm text-uc-text-muted mb-1">Improvement</div>
                  <div className="text-xl font-bold text-uc-text-light">
                    {progressionData.summary.improvement.weight > 0 ? '+' : ''}
                    {progressionData.summary.improvement.weight.toFixed(1)}%
                  </div>
                  <div className="text-xs text-uc-text-muted mt-1">
                    Weight change ({progressionData.summary.improvement.period})
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-uc-dark-bg rounded-xl p-12 border border-uc-purple/20 mb-8 text-center">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="text-lg font-semibold text-uc-text-light mb-2">
              {t('exercises.noWorkoutData') || 'No workout data yet'}
            </h3>
            <p className="text-uc-text-muted mb-6 max-w-md mx-auto">
              {t('exercises.noWorkoutDataDescription') || 'Start logging workouts with this exercise to see your progression over time. Track your sets, reps, and weights to visualize your strength gains.'}
            </p>
            <Link
              href="/workouts"
              className="inline-block bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              ➕ {t('exercises.logWorkout') || 'Log Your First Workout'}
            </Link>
          </div>
        )}

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <div className="bg-uc-dark-bg rounded-xl p-6 border border-uc-purple/20">
            <h2 className="text-xl font-semibold text-uc-text-light mb-4">
              📅 Recent Workouts
            </h2>
            <div className="space-y-3">
              {recentWorkouts.map((workout) => {
                const exerciseData = workout.workoutExercises.find(
                  (we: any) => we.exerciseId === exerciseId
                )
                const sets = exerciseData?.sets || []

                return (
                  <Link
                    key={workout.id}
                    href={`/workouts`}
                    className="block bg-uc-black/50 hover:bg-uc-black rounded-lg p-4 border border-uc-purple/20 hover:border-uc-purple/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-uc-text-light">
                          {formatDate(workout.startTime)}
                        </div>
                        <div className="text-sm text-uc-text-muted mt-1">
                          {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                          {sets.length > 0 && (
                            <span className="ml-2">
                              • {sets.map((set, i) => (
                                <span key={i}>
                                  {set.reps}×{set.weight}{exercise.defaultUnit}
                                  {i < sets.length - 1 && ', '}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-uc-text-muted">→</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State for Recent Workouts */}
        {recentWorkouts.length === 0 && quickStats && quickStats.timesUsed === 0 && (
          <div className="bg-uc-dark-bg rounded-xl p-6 border border-uc-purple/20">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🏋️</div>
              <p className="text-uc-text-muted mb-4">
                This exercise hasn&apos;t been used in any workouts yet
              </p>
              <Link
                href="/workouts"
                className="inline-block bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
              >
                Add to Workout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

