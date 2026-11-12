'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { ExerciseProgressionChart, TimeFrame, Metric, ChartType } from '@/components/ExerciseProgressionChart'
import Link from 'next/link'
import { Card, EmptyState, Icon, IconName, Overline, SegmentedControl, Select, Skeleton, SkeletonRows, buttonClasses } from '@/components/ui'

interface ExerciseQuickStats {
  lastUsed: string | null
  lastWeight: number | null
  lastReps: number | null
  timesUsed: number
  improving?: boolean
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
  const { t, language } = useLanguage()
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

  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const formatShortDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale, { day: 'numeric', month: 'short' })

  const backLink = (
    <Link
      href="/exercises"
      aria-label={t('exercises.detail.back') || 'Back to Exercise Library'}
      title={t('exercises.detail.back') || 'Back to Exercise Library'}
      className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text transition-colors hover:bg-uc-elevated"
    >
      <svg aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="m15 6-6 6 6 6" />
      </svg>
    </Link>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-uc-bg">
        <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8 space-y-5">
          <Skeleton className="h-9 w-2/3" />
          <SkeletonRows rows={4} />
        </div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-uc-bg flex items-center justify-center px-5">
        <EmptyState
          icon={<Icon name="library" size={28} />}
          title={t('exercises.detail.notFound') || 'Exercise not found'}
          action={
            <Link href="/exercises" className={buttonClasses('ghost', 'md')}>
              <Icon name="chevron-left" /> {t('exercises.detail.back') || 'Back to Exercise Library'}
            </Link>
          }
        />
      </div>
    )
  }

  const lastSet = quickStats && quickStats.lastWeight !== null && quickStats.lastReps !== null
    ? (exercise.defaultUnit === 'reps'
        ? `${quickStats.lastReps} reps`
        : `${quickStats.lastWeight} ${exercise.defaultUnit} × ${quickStats.lastReps}`)
    : null
  const records = progressionData?.personalRecords
  const summary = progressionData?.summary
  const hasWorkouts = !!quickStats && quickStats.timesUsed > 0

  const timeframeOptions: TimeFrame[] = ['1week', '1month', '3months', '6months', '1year', 'all']
  const metricOptions: { value: Metric; label: string }[] = [
    { value: 'weight', label: t('exercises.detail.maxWeight') || 'Max weight' },
    { value: '1rm', label: t('exercises.detail.est1RM') || 'Est. 1RM' },
    { value: 'volume', label: t('exercises.detail.totalVolume') || 'Total volume' },
    { value: 'reps', label: t('exercises.detail.averageReps') || 'Average reps' },
  ]
  const chartTypeOptions: { value: ChartType; label: string }[] = [
    { value: 'line', label: t('exercises.detail.line') || 'Line' },
    { value: 'area', label: t('exercises.detail.area') || 'Area' },
    { value: 'bar', label: t('exercises.detail.bar') || 'Bar' },
  ]

  const sectionTitle = 'text-[17px] font-extrabold text-uc-text mb-3'

  // Footer: first and last session of the period for the chart's metric
  const metricValue = (point: { maxWeight: number; estimated1RM: number; totalVolume: number; averageReps: number }) =>
    ({ weight: point.maxWeight, '1rm': point.estimated1RM, volume: point.totalVolume, reps: point.averageReps })[selectedMetric]
  const points = progressionData?.dataPoints ?? []
  const startValue = points.length >= 2 ? metricValue(points[0]) : null
  const nowValue = points.length >= 2 ? metricValue(points[points.length - 1]) : null
  const change = startValue && nowValue !== null ? Math.round(((nowValue - startValue) / startValue) * 100) : null
  const metricUnit = selectedMetric === 'reps' ? t('exercises.detail.repsUnit') || 'reps' : exercise.defaultUnit
  const formatMetric = (value: number) =>
    `${Number.isInteger(value) ? value : value.toFixed(selectedMetric === 'volume' ? 0 : 1)} ${metricUnit}`

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-5 flex items-start gap-2">
          {backLink}
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight text-uc-text break-words">
              {exercise.name}
            </h1>
            <p className="mt-0.5 text-sm font-semibold text-uc-text-muted">
              {[exercise.category, exercise.defaultUnit].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            {/* Quick Stats */}
            {quickStats && (
              <div className="grid grid-cols-2 gap-3">
                <MiniTile label={t('exercises.detail.timesUsed') || 'Times used'} value={quickStats.timesUsed} />
                {quickStats.lastUsed && (
                  <MiniTile label={t('exercises.detail.lastUsed') || 'Last used'} value={formatShortDate(quickStats.lastUsed)} />
                )}
                {lastSet && <MiniTile label={t('exercises.detail.lastSet') || 'Last set'} value={lastSet} />}
                <MiniTile
                  label={t('exercises.detail.status') || 'Status'}
                  value={quickStats.improving
                    ? (t('exercises.detail.statusImproving') || 'Improving')
                    : hasWorkouts
                      ? (t('exercises.detail.statusTracking') || 'Tracking')
                      : (t('exercises.detail.statusNew') || 'New')}
                  valueClassName={hasWorkouts ? 'text-uc-success' : ''}
                />
              </div>
            )}

            {/* Personal Records */}
            {records && (
              <section>
                <h2 className={sectionTitle}>{t('exercises.detail.personalRecords') || 'Personal records'}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <RecordTile
                    icon="achieved"
                    label={t('exercises.detail.maxWeight') || 'Max weight'}
                    value={`${records.maxWeight.value.toFixed(1)} ${exercise.defaultUnit}`}
                    date={records.maxWeight.date && formatShortDate(records.maxWeight.date)}
                  />
                  <RecordTile
                    icon="type-gym"
                    label={t('exercises.detail.est1RM') || 'Est. 1RM'}
                    value={`${records.max1RM.value.toFixed(1)} ${exercise.defaultUnit}`}
                    date={records.max1RM.date && formatShortDate(records.max1RM.date)}
                  />
                  <RecordTile
                    icon="stats"
                    label={t('exercises.detail.maxVolume') || 'Max volume'}
                    value={`${records.maxVolume.value.toFixed(0)} ${exercise.defaultUnit}`}
                    date={records.maxVolume.date && formatShortDate(records.maxVolume.date)}
                  />
                  <RecordTile
                    icon="streak"
                    label={t('exercises.detail.maxReps') || 'Max reps'}
                    value={records.maxReps.value}
                    date={records.maxReps.date && formatShortDate(records.maxReps.date)}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Progression Charts */}
          {hasWorkouts ? (
            <Card className="lg:row-span-2">
              <h2 className={sectionTitle}>{t('exercises.detail.progression') || 'Progression'}</h2>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  aria-label={t('exercises.detail.metric') || 'Metric'}
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as Metric)}
                >
                  {metricOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
                <Select
                  aria-label={t('exercises.detail.timeframe') || 'Timeframe'}
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as TimeFrame)}
                >
                  {timeframeOptions.map(value => (
                    <option key={value} value={value}>{t(`exercises.detail.timeframes.${value}`)}</option>
                  ))}
                </Select>
              </div>
              <SegmentedControl
                className="mt-3 mb-4"
                ariaLabel={t('exercises.detail.chartType') || 'Chart type'}
                options={chartTypeOptions}
                value={selectedChartType}
                onChange={setSelectedChartType}
              />

              <ExerciseProgressionChart
                exerciseId={exerciseId}
                metric={selectedMetric}
                timeframe={selectedTimeframe}
                chartType={selectedChartType}
              />

              {/* Summary: Start · Now · change for the selected metric, then workouts and sets */}
              {summary && (
                <div className="mt-4 border-t border-uc-border pt-3 text-[13px] text-uc-text-muted">
                  {startValue !== null && nowValue !== null && (
                    <p className="flex flex-wrap gap-x-6 gap-y-1">
                      <span>
                        {t('exercises.detail.start') || 'Start'}{' '}
                        <strong className="text-uc-text uc-num">{formatMetric(startValue)}</strong>
                      </span>
                      <span>
                        {t('exercises.detail.now') || 'Now'}{' '}
                        <strong className="text-uc-text uc-num">{formatMetric(nowValue)}</strong>
                      </span>
                      {change !== null && (
                        <strong className={`uc-num ${change > 0 ? 'text-uc-success' : 'text-uc-text'}`}>
                          {change > 0 ? '+' : ''}{change}%
                        </strong>
                      )}
                    </p>
                  )}
                  <p className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                    <span>
                      {t('exercises.detail.totalWorkouts') || 'Workouts'}{' '}
                      <strong className="text-uc-text uc-num">{summary.totalWorkouts}</strong>
                    </span>
                    <span>
                      {t('exercises.detail.totalSets') || 'Sets'}{' '}
                      <strong className="text-uc-text uc-num">{summary.totalSets}</strong>
                    </span>
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="border-dashed lg:row-span-2">
              <EmptyState
                icon={<Icon name="improve" size={28} />}
                title={t('exercises.noWorkoutData') || 'No workout data yet'}
                description={t('exercises.noWorkoutDataDescription') || 'Start logging workouts with this exercise to see your progression over time. Track your sets, reps, and weights to visualize your strength gains.'}
                action={
                  <Link href="/workouts" className={buttonClasses('accent', 'md')}>
                    + {t('exercises.logWorkout') || 'Log Your First Workout'}
                  </Link>
                }
              />
            </Card>
          )}

          {/* Recent Workouts */}
          {recentWorkouts.length > 0 && (
            <section>
              <h2 className={sectionTitle}>{t('exercises.detail.recentWorkouts') || 'Recent workouts'}</h2>
              <div className="space-y-2">
                {recentWorkouts.map((workout) => {
                  const exerciseData = workout.workoutExercises.find(
                    (we: any) => we.exerciseId === exerciseId
                  )
                  const sets = exerciseData?.sets || []

                  return (
                    <Link
                      key={workout.id}
                      href={`/workouts`}
                      className="flex min-h-14 items-center gap-3 rounded-uc-input border border-uc-border bg-uc-surface px-4 py-3 transition-colors hover:border-uc-primary"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="font-bold text-uc-text">{formatDate(workout.startTime)}</span>
                          <span className="text-[13px] font-semibold text-uc-text-muted uc-num">
                            {t('exercises.detail.sets', { count: sets.length })}
                          </span>
                        </div>
                        {sets.length > 0 && (
                          <p className="mt-0.5 text-[13px] text-uc-text-muted uc-num">
                            {sets.map(set => `${set.reps}×${set.weight}${exercise.defaultUnit}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <span aria-hidden className="text-uc-text-muted">›</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Empty State for Recent Workouts */}
          {recentWorkouts.length === 0 && quickStats && quickStats.timesUsed === 0 && (
            <Card className="border-dashed">
              <EmptyState
                icon={<Icon name="type-gym" size={28} />}
                title={t('exercises.detail.notUsedYet') || 'This exercise hasn’t been used in any workouts yet'}
                action={
                  <Link href="/workouts" className={buttonClasses('accent', 'md')}>
                    {t('exercises.detail.addToWorkout') || 'Add to Workout'}
                  </Link>
                }
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniTile({ label, value, valueClassName = '' }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <Card className="p-3">
      <Overline>{label}</Overline>
      <p className={`mt-1 text-[17px] font-extrabold text-uc-text uc-num ${valueClassName}`}>{value}</p>
    </Card>
  )
}

function RecordTile({ icon, label, value, date }: { icon: IconName; label: string; value: React.ReactNode; date?: string | null }) {
  return (
    <div className="rounded-uc-card bg-uc-primary-container p-3 text-uc-on-primary-container">
      <p className="flex items-center gap-1.5 text-[11px] leading-[14px] font-bold uppercase tracking-[0.08em] opacity-80">
        <Icon name={icon} size={14} />
        {label}
      </p>
      <p className="mt-1 text-[22px] font-extrabold leading-tight uc-num">{value}</p>
      {date && <p className="mt-0.5 text-xs font-semibold opacity-80">{date}</p>}
    </div>
  )
}
