'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useCycle } from '@/contexts/CycleContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApiError } from '@/hooks/useApiError'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { extractApiError } from '@/lib/errors'
import { DAY_MS, localDayNumber, storedDayNumber, toLocalDateString, toStoredDateString } from '@/lib/date-utils'
import { calculateCycleInfo, CyclePhase, getPhaseDayRange, getPhaseDisplayName, getPhaseRanges } from '@/lib/cycle-utils'
import { Period, PeriodFormData } from '@/types/period'
import { Workout } from '@/types/workout'
import { Event } from '@/types/event'
import AuthGuard from '@/components/AuthGuard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Tooltip } from '@/components/Tooltip'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { statisticsService } from '@/lib/statistics-service'
import {
  BottomSheet,
  Button,
  buttonClasses,
  Card,
  ChoiceChip,
  EmptyState,
  Input,
  Label,
  Overline,
  PhaseBadge,
  Icon,
  phaseBandBg,
  phaseSolidBg,
  phaseTranslationKey,
  Textarea,
} from '@/components/ui'

const PHASES: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'early-luteal', 'late-luteal']
const PERIODS_PREVIEW = 5
const FLOW_LEVELS = [1, 2, 3] as const
// Gaps outside this range are treated as missed logging, not a cycle
const MIN_CYCLE_GAP = 15
const MAX_CYCLE_GAP = 60

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
// "Physiology:" → "Physiology" (labels sit in their own column now)
const stripColon = (s: string) => s.replace(/:\s*$/, '')

type CycleSettingsProp = { cycleLength: number; lastPeriodDate: Date; timezone: string }

export default function CyclePage() {
  return (
    <AuthGuard>
      <CyclePageContent />
    </AuthGuard>
  )
}

function CyclePageContent() {
  const { t, language } = useLanguage()
  const { cycleSettings, isCycleTrackingEnabled, cycleInfo, refreshCycleSettings } = useCycle()
  const { handleError, showSuccess } = useApiError()
  const { getToken } = useCsrfToken()
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'

  const [periods, setPeriods] = useState<Period[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showPeriodForm, setShowPeriodForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const [deletingPeriod, setDeletingPeriod] = useState<Period | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Fetch data
  useEffect(() => {
    if (!isCycleTrackingEnabled) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Fetch all events (no limit) to count all injuries from the beginning
        const [periodsRes, workoutsRes, eventsRes] = await Promise.all([
          fetch('/api/periods', { credentials: 'include' }),
          fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' }),
          fetch('/api/events?page=1&limit=10000', { credentials: 'include' }), // Increased limit to get all injuries from the beginning
        ])

        if (periodsRes.ok) {
          const periodsData = await periodsRes.json()
          setPeriods(periodsData)
        }

        if (workoutsRes.ok) {
          const data = await workoutsRes.json()
          const workoutsData = Array.isArray(data) ? data : (data.workouts || [])
          setWorkouts(workoutsData)
        }

        if (eventsRes.ok) {
          const data = await eventsRes.json()
          let eventsData = Array.isArray(data) ? data : (data.events || [])

          // If paginated response, fetch all pages to get all events (especially for injuries)
          if (data.pagination && data.pagination.totalPages > 1) {
            const allEvents = [...eventsData]
            // Fetch remaining pages
            for (let page = 2; page <= data.pagination.totalPages; page++) {
              const pageRes = await fetch(`/api/events?page=${page}&limit=10000`, { credentials: 'include' })
              if (pageRes.ok) {
                const pageData = await pageRes.json()
                const pageEvents = Array.isArray(pageData) ? pageData : (pageData.events || [])
                allEvents.push(...pageEvents)
              }
            }
            eventsData = allEvents
          }

          setEvents(eventsData)
        }
      } catch (error) {
        handleError(error, 'Failed to load cycle data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isCycleTrackingEnabled, handleError])

  // Calculate injury statistics by phase (all injuries from the beginning, no time filtering)
  const injuryStats = useMemo(() => {
    if (!cycleSettings || events.length === 0) return null

    // Filter all INJURY events (no time filtering - count from the beginning)
    const injuryEvents = events.filter(e => e.type === 'INJURY')
    if (injuryEvents.length === 0) return null

    // Calculate stats for all injuries
    return statisticsService.calculateInjuryCycleStats(injuryEvents, cycleSettings)
  }, [events, cycleSettings])

  // Calculate training statistics by phase
  const trainingStatsByPhase = useMemo(() => {
    if (!cycleSettings || workouts.length === 0) return null

    const stats = {
      menstrual: { workouts: 0, totalDuration: 0, avgIntensity: 0 },
      follicular: { workouts: 0, totalDuration: 0, avgIntensity: 0 },
      ovulation: { workouts: 0, totalDuration: 0, avgIntensity: 0 },
      'early-luteal': { workouts: 0, totalDuration: 0, avgIntensity: 0 },
      'late-luteal': { workouts: 0, totalDuration: 0, avgIntensity: 0 },
    }

    workouts.forEach(workout => {
      // Pass the stored date string so it's read as that calendar day
      const cycleInfo = calculateCycleInfo(cycleSettings, workout.startTime)

      if (stats[cycleInfo.phase]) {
        stats[cycleInfo.phase].workouts++
        // Calculate duration if available
        if (workout.startTime && workout.endTime) {
          const duration = (new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / (1000 * 60)
          stats[cycleInfo.phase].totalDuration += duration
        }
        // Map training volume to intensity (TR1=1, TR2=2, etc.)
        if (workout.trainingVolume) {
          const intensity = parseInt(workout.trainingVolume.replace('TR', '')) || 0
          stats[cycleInfo.phase].avgIntensity += intensity
        }
      }
    })

    // Calculate averages
    Object.keys(stats).forEach(phase => {
      const phaseStats = stats[phase as keyof typeof stats]
      if (phaseStats.workouts > 0) {
        phaseStats.avgIntensity = phaseStats.avgIntensity / phaseStats.workouts
      }
    })

    return stats
  }, [workouts, cycleSettings])

  const refreshPeriods = useCallback(async () => {
    const periodsRes = await fetch('/api/periods', { credentials: 'include' })
    if (periodsRes.ok) {
      setPeriods(await periodsRes.json())
    }
    // Refresh cycle settings to update lastPeriodDate in calendar
    await refreshCycleSettings()
  }, [refreshCycleSettings])

  const closePeriodForm = () => {
    setShowPeriodForm(false)
    setEditingPeriod(null)
  }

  const openAddPeriod = (date: Date) => {
    // A day inside a logged period opens that period instead of adding a second one
    const day = localDayNumber(date)
    const logged = periods.find(p => day >= storedDayNumber(p.startDate) && day <= storedDayNumber(p.endDate || p.startDate))
    if (logged) {
      openEditPeriod(logged)
      return
    }
    setEditingPeriod(null)
    setSelectedDate(date)
    setShowPeriodForm(true)
  }

  const openEditPeriod = (period: Period) => {
    setEditingPeriod(period)
    setShowPeriodForm(true)
  }

  const handleDeletePeriod = async () => {
    if (!deletingPeriod) return
    setIsDeleting(true)
    try {
      const csrfToken = await getToken()
      const response = await fetch(`/api/periods/${deletingPeriod.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
        credentials: 'include',
      })
      if (response.ok) {
        showSuccess(t('cycle.tracking.periodDeleted') || 'Period deleted')
        await refreshPeriods()
        setDeletingPeriod(null)
        closePeriodForm()
      } else {
        const error = await extractApiError(response)
        handleError(error, 'Failed to delete period')
      }
    } catch (error) {
      handleError(error, 'Failed to delete period')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isCycleTrackingEnabled || !cycleSettings) {
    return (
      <div className="min-h-screen bg-uc-bg">
        <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
          <h1 className="text-[28px] font-extrabold leading-tight text-uc-text">
            {t('cycle.tracking.title') || 'Cycle Tracking'}
          </h1>
          <EmptyState
            className="min-h-[60vh] justify-center"
            icon={<Icon name="cycle" size={28} />}
            title={t('cycle.tracking.notEnabled') || 'Cycle Tracking Not Enabled'}
            description={t('cycle.tracking.notEnabledDesc') || 'Please enable cycle tracking in your profile settings to use this feature.'}
            action={
              <Link href="/profile?tab=cycle" className={buttonClasses('accent', 'lg')}>
                {t('cycle.tracking.enableInProfile') || 'Enable in profile'}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner message={t('cycle.tracking.loading') || 'Loading cycle data...'} fullScreen />
  }

  const mostInjuriesPhase = injuryStats?.phaseWithMostInjuries
    ? getPhaseDisplayName(injuryStats.phaseWithMostInjuries)
    : null

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="min-w-0 text-[28px] font-extrabold leading-tight text-uc-text">
            {t('cycle.tracking.title') || 'Cycle Tracking'}
          </h1>
          <Link
            href="/profile?tab=cycle"
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-uc-primary hover:underline"
          >
            {t('cycle.tracking.cycleSettings') || 'Cycle settings'}
          </Link>
        </div>

        <div className="lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-6">
          {/* Ring, Add period, injury warning, recent periods */}
          <div className="space-y-4">
            {cycleInfo && (
              <CycleRing
                cycleLength={cycleSettings.cycleLength}
                currentDay={cycleInfo.currentDay}
                phase={cycleInfo.phase}
                phaseLabel={t(`cycle.phases.${phaseTranslationKey[cycleInfo.phase]}`)}
                caption={t('cycle.tracking.ofLengthNextPeriod', {
                  length: cycleSettings.cycleLength,
                  date: cycleInfo.nextPeriodDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
                })}
                dayLabel={t('cycle.tracking.dayLabel') || 'Day'}
              />
            )}

            <Button variant="accent" size="lg" className="w-full" onClick={() => openAddPeriod(new Date())}>
              {t('cycle.tracking.addPeriod') || '+ Add Period'}
            </Button>

            {/* Injury Phase Warning */}
            {injuryStats && injuryStats.phaseWithMostInjuries && mostInjuriesPhase && (
              <div className="flex items-start gap-3 rounded-uc-card bg-uc-warning-bg p-4 text-uc-text">
                <Icon name="injury-risk" size={24} className="text-uc-warning" />
                <div className="min-w-0">
                  <h3 className="font-extrabold">
                    {t('cycle.tracking.mostInjuriesInPhase', {
                      phase: t(`cycle.phases.${injuryStats.phaseWithMostInjuries}`),
                    }) || `Most Injuries in ${t(`cycle.phases.${injuryStats.phaseWithMostInjuries}`)} Phase`}
                  </h3>
                  <p className="mt-1 text-sm">
                    {t('cycle.tracking.injuriesOccurredDuringDays', {
                      count: injuryStats.maxInjuriesInPhase,
                      total: injuryStats.totalInjuries,
                      days: getPhaseDayRange(mostInjuriesPhase, cycleSettings.cycleLength),
                    })}
                  </p>
                  <p className="mt-1 text-sm">
                    {t('cycle.tracking.beCautious') || 'Be extra cautious during this phase and consider adjusting your training intensity.'}
                  </p>
                </div>
              </div>
            )}

            {periods.length > 0 && <PeriodStats periods={periods} />}

            <div className="hidden lg:block">
              <RecentPeriods periods={periods} locale={locale} onEdit={openEditPeriod} />
            </div>
          </div>

          <div className="mt-4 space-y-6 lg:mt-0">
            <CycleCalendar
              cycleSettings={cycleSettings}
              periods={periods}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDateClick={openAddPeriod}
              injuryStats={injuryStats}
              locale={locale}
            />

            <div className="lg:hidden">
              <RecentPeriods periods={periods} locale={locale} onEdit={openEditPeriod} />
            </div>

            {/* Training vs Cycle Insights */}
            <TrainingCycleInsights
              cycleSettings={cycleSettings}
              trainingStatsByPhase={trainingStatsByPhase}
              injuryStats={injuryStats}
              currentPhase={cycleInfo?.phase ?? null}
            />
          </div>
        </div>

        {/* Period Form Sheet */}
        {showPeriodForm && (
          <PeriodFormModal
            // Remount when "Edit that period" swaps the period, so the form takes its dates
            key={editingPeriod?.id ?? 'new'}
            period={editingPeriod}
            otherPeriods={periods.filter(p => p.id !== editingPeriod?.id)}
            onEditExisting={openEditPeriod}
            locale={locale}
            defaultDate={selectedDate}
            onClose={closePeriodForm}
            onDelete={editingPeriod ? () => setDeletingPeriod(editingPeriod) : undefined}
            onSave={async (periodData) => {
              try {
                const url = editingPeriod ? `/api/periods/${editingPeriod.id}` : '/api/periods'
                const method = editingPeriod ? 'PUT' : 'POST'
                // On edit, an emptied end date has to be sent as null to clear it
                const body = editingPeriod ? { ...periodData, endDate: periodData.endDate ?? null } : periodData

                const csrfToken = await getToken()
                const response = await fetch(url, {
                  method,
                  headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                  },
                  credentials: 'include',
                  body: JSON.stringify(body),
                })

                if (response.ok) {
                  showSuccess(editingPeriod ? (t('cycle.tracking.periodUpdated') || 'Period updated') : (t('cycle.tracking.periodAdded') || 'Period added'))
                  await refreshPeriods()
                  closePeriodForm()
                } else {
                  const error = await extractApiError(response)
                  handleError(error, 'Failed to save period')
                }
              } catch (error) {
                handleError(error, 'Failed to save period')
              }
            }}
          />
        )}

        <ConfirmationDialog
          isOpen={!!deletingPeriod}
          onClose={() => setDeletingPeriod(null)}
          onConfirm={handleDeletePeriod}
          title={t('cycle.tracking.deletePeriodTitle') || 'Delete period?'}
          message={t('cycle.tracking.deletePeriodMessage') || 'This period will be removed from your history.'}
          confirmText={t('common.delete') || 'Delete'}
          cancelText={t('common.cancel') || 'Cancel'}
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}

// Cycle ring: one arc per phase, a dot per day, a marker on today
function CycleRing({
  cycleLength,
  currentDay,
  phase,
  phaseLabel,
  caption,
  dayLabel,
}: {
  cycleLength: number
  currentDay: number
  phase: CyclePhase
  phaseLabel: string
  caption: string
  dayLabel: string
}) {
  const size = 280
  const c = size / 2
  const r = 118
  const stroke = 18
  // Round caps reach stroke/2 past the arc end; trim a bit more so neighbouring arcs keep a gap
  const capDeg = ((stroke / 2 + 4) / (2 * Math.PI * r)) * 360
  const dayDeg = 360 / cycleLength

  const point = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: c + radius * Math.cos(rad), y: c + radius * Math.sin(rad) }
  }

  const arcPath = (from: number, to: number) => {
    const start = point(from, r)
    const end = point(to, r)
    const largeArc = to - from > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  const marker = point((currentDay - 0.5) * dayDeg, r)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[300px]">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full" aria-hidden>
        {getPhaseRanges(cycleLength)
          .filter(range => range.end >= range.start)
          .map(range => {
            const from = (range.start - 1) * dayDeg
            const to = range.end * dayDeg
            // Very short phases (short cycles) get a smaller trim so they stay visible
            const trim = Math.min(capDeg, (to - from) / 2 - 0.5)
            return (
              <path
                key={range.phase}
                d={arcPath(from + trim, to - trim)}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                className={range.phase === phase ? '' : 'opacity-45'}
                style={{ stroke: `var(--uc-phase-${range.phase === 'menstrual' ? 'menstruation' : range.phase})` }}
              />
            )
          })}
        {Array.from({ length: cycleLength }, (_, i) => {
          const p = point((i + 0.5) * dayDeg, r - 26)
          return <circle key={i} cx={p.x} cy={p.y} r={1.8} className="fill-uc-text-muted opacity-60" />
        })}
        <circle cx={marker.x} cy={marker.y} r={13} strokeWidth={4} className="fill-uc-bg stroke-uc-text" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-16 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-uc-text-muted">{dayLabel}</span>
        <span className="text-[64px] font-extrabold leading-none text-uc-text uc-num">{currentDay}</span>
        <PhaseBadge phase={phase} className="mt-2">{phaseLabel}</PhaseBadge>
        <span className="mt-2 text-[13px] font-semibold text-uc-text-muted uc-num">{caption}</span>
      </div>
    </div>
  )
}

// Avg cycle (start to next start), avg period (start to end, inclusive) and number of logged periods
function PeriodStats({ periods }: { periods: Period[] }) {
  const { t } = useLanguage()
  const starts = periods.map(p => storedDayNumber(p.startDate)).sort((a, b) => a - b)
  const gaps = starts
    .slice(1)
    .map((start, i) => start - starts[i])
    .filter(gap => gap >= MIN_CYCLE_GAP && gap <= MAX_CYCLE_GAP)
  const lengths = periods
    .filter(p => p.endDate)
    .map(p => storedDayNumber(p.endDate as string) - storedDayNumber(p.startDate) + 1)
  const average = (values: number[]) =>
    values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null
  const days = t('profile.days') || 'days'

  const tiles = [
    { label: t('cycle.tracking.avgCycle') || 'Avg cycle', value: average(gaps), unit: days },
    { label: t('cycle.tracking.avgPeriod') || 'Avg period', value: average(lengths), unit: days },
    { label: t('cycle.tracking.logged') || 'Logged', value: periods.length, unit: null },
  ]

  return (
    <Card className="grid grid-cols-3 divide-x divide-uc-border px-0">
      {tiles.map(tile => (
        <div key={tile.label} className="min-w-0 px-3 text-center">
          <Overline className="truncate">{tile.label}</Overline>
          <p className="mt-1 text-[22px] font-extrabold leading-7 text-uc-text uc-num">{tile.value ?? '–'}</p>
          {tile.unit && tile.value !== null && <p className="text-[12px] font-semibold text-uc-text-muted">{tile.unit}</p>}
        </div>
      ))}
    </Card>
  )
}

// Flow intensity as 3 rising bars, the first `level` filled in the period colour
function FlowBars({ level }: { level: number }) {
  return (
    <span aria-hidden className="inline-flex h-4 items-end gap-[3px]">
      {FLOW_LEVELS.map(bar => (
        <span
          key={bar}
          className={`w-1 rounded-sm ${bar <= level ? phaseSolidBg.menstrual : 'bg-uc-skeleton'}`}
          style={{ height: `${bar * 33}%` }}
        />
      ))}
    </span>
  )
}

// Recent periods: newest first, tap to edit
function RecentPeriods({
  periods,
  locale,
  onEdit,
}: {
  periods: Period[]
  locale: string
  onEdit: (period: Period) => void
}) {
  const { t } = useLanguage()
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? periods : periods.slice(0, PERIODS_PREVIEW)

  // Stored dates are UTC midnight: format them in UTC so they show the stored calendar day
  const formatDay = (value: string, withYear: boolean) =>
    new Date(storedDayNumber(value) * DAY_MS).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
      timeZone: 'UTC',
    })

  const formatRange = (period: Period) => {
    const start = formatDay(period.startDate, !period.endDate)
    if (!period.endDate || storedDayNumber(period.endDate) === storedDayNumber(period.startDate)) {
      return formatDay(period.startDate, true)
    }
    return `${start} – ${formatDay(period.endDate, true)}`
  }

  return (
    <Card>
      <h2 className="mb-2 text-lg font-extrabold text-uc-text">
        {t('cycle.tracking.recentPeriods') || 'Recent periods'}
      </h2>
      {periods.length === 0 ? (
        <p className="text-sm text-uc-text-muted">{t('cycle.tracking.noPeriods') || 'No periods logged yet.'}</p>
      ) : (
        <ul className="-mx-2">
          {visible.map(period => (
            <li key={period.id}>
              <button
                type="button"
                onClick={() => onEdit(period)}
                aria-label={`${t('common.edit') || 'Edit'}: ${formatRange(period)}`}
                className="flex min-h-11 w-full items-center gap-3 rounded-uc-input px-2 py-2 text-left hover:bg-uc-elevated transition-colors"
              >
                <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${phaseSolidBg.menstrual}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-uc-text uc-num">{formatRange(period)}</span>
                  {period.notes && <span className="block truncate text-[13px] text-uc-text-muted">{period.notes}</span>}
                </span>
                {period.flow && (
                  <span
                    role="img"
                    aria-label={`${t('cycle.tracking.flow')}: ${t(`cycle.tracking.flowLevels.${period.flow}`)}`}
                    title={t(`cycle.tracking.flowLevels.${period.flow}`)}
                  >
                    <FlowBars level={period.flow} />
                  </span>
                )}
                <span aria-hidden className="text-lg text-uc-text-muted">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {periods.length > PERIODS_PREVIEW && (
        <Button variant="ghost" className="mt-2 w-full" onClick={() => setShowAll(v => !v)}>
          {showAll
            ? (t('common.hide') || 'Hide')
            : (t('cycle.tracking.showAllPeriods', { count: periods.length }) || `Show all (${periods.length})`)}
        </Button>
      )}
    </Card>
  )
}

// Cycle Calendar Component
function CycleCalendar({
  cycleSettings,
  periods,
  currentMonth,
  onMonthChange,
  onDateClick,
  injuryStats,
  locale,
}: {
  cycleSettings: CycleSettingsProp
  periods: Period[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  onDateClick: (date: Date) => void
  injuryStats?: { phaseWithMostInjuries?: 'menstrual' | 'follicular' | 'ovulation' | 'earlyLuteal' | 'lateLuteal' } | null
  locale: string
}) {
  const { t } = useLanguage()
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  // Monday-first grid
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7

  const monthDays: (Date | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    monthDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    monthDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }

  const weekdayLabels = useMemo(
    // 1 Jan 2024 was a Monday
    () => Array.from({ length: 7 }, (_, i) => capitalize(new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }))),
    [locale],
  )

  // Compare calendar days: cells are local dates, periods and lastPeriodDate are stored dates
  const lastConfirmedDay = Math.round(new Date(cycleSettings.lastPeriodDate).getTime() / DAY_MS)

  const isPeriodDay = (date: Date) => {
    const day = localDayNumber(date)
    return periods.some(period => {
      const start = storedDayNumber(period.startDate)
      const end = storedDayNumber(period.endDate || period.startDate)
      return day >= start && day <= end
    })
  }

  // A predicted menstrual day is dropped once a period is logged within a week of it: that cycle's
  // period is known, so the forecast would only leave dashed days next to (or instead of) the real ones
  const loggedStartDays = periods.map(period => storedDayNumber(period.startDate))
  const isCoveredByLoggedPeriod = (date: Date) => {
    const day = localDayNumber(date)
    return loggedStartDays.some(start => Math.abs(start - day) <= 7)
  }

  // Check if date is before last confirmed period date (should show forecast)
  const isForecast = (date: Date) => localDayNumber(date) < lastConfirmedDay

  const shiftMonth = (delta: number) => {
    const next = new Date(currentMonth)
    next.setDate(1)
    next.setMonth(next.getMonth() + delta)
    onMonthChange(next)
  }

  const injuryRiskText =
    t('workouts.tooltips.injuryPhaseWarning') ||
    'This phase has the highest number of injuries in your history. Be extra cautious and consider adjusting training intensity during this phase.'

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="border-transparent" onClick={() => shiftMonth(-1)} aria-label={t('common.previous')}>
          <Icon name="chevron-left" />
        </Button>
        <h2 className="flex-1 text-center text-lg font-extrabold text-uc-text uc-num">
          {capitalize(currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' }))}
        </h2>
        <Button variant="ghost" size="icon" className="border-transparent" onClick={() => shiftMonth(1)} aria-label={t('common.next')}>
          <Icon name="chevron-right" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {weekdayLabels.map(day => (
          <div key={day} className="py-1 text-center text-[13px] font-semibold text-uc-text-muted">
            {day}
          </div>
        ))}
        {monthDays.map((date, index) => {
          if (!date) return <div key={index} />

          const cycleInfo = calculateCycleInfo(cycleSettings, date)
          const isToday = date.toDateString() === new Date().toDateString()
          const hasPeriod = isPeriodDay(date)
          const isForecastDate = isForecast(date)

          // Only show colors for menstrual and ovulation phases
          const isMenstrual = cycleInfo.phase === 'menstrual' && !isCoveredByLoggedPeriod(date)
          const isOvulation = cycleInfo.phase === 'ovulation'

          // statisticsService names phases in camelCase ('earlyLuteal'), cycle info in kebab-case ('early-luteal')
          const isMostInjuriesPhase = !!injuryStats?.phaseWithMostInjuries &&
            phaseTranslationKey[cycleInfo.phase] === injuryStats.phaseWithMostInjuries

          const cellClass = hasPeriod
            ? `${phaseSolidBg.menstrual} text-uc-chip-ink`
            : isMenstrual
              ? 'border-2 border-dashed border-uc-phase-menstruation text-uc-text'
              : isOvulation
                ? `${phaseBandBg.ovulation} text-uc-text`
                : 'text-uc-text'

          return (
            <button
              key={index}
              type="button"
              onClick={() => onDateClick(date)}
              aria-label={date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              aria-current={isToday ? 'date' : undefined}
              className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl transition-colors hover:brightness-110 focus-visible:outline-2 focus-visible:outline-uc-primary ${cellClass} ${
                isToday ? 'ring-2 ring-inset ring-uc-text' : ''
              } ${!hasPeriod && !isMenstrual && !isOvulation ? 'hover:bg-uc-elevated' : ''}`}
              title={isForecastDate ? `${t('cycle.tracking.forecast') || 'Forecast'} - ${t(`cycle.phases.${phaseTranslationKey[cycleInfo.phase]}`)}` : t(`cycle.phases.${phaseTranslationKey[cycleInfo.phase]}`)}
            >
              {/* Warning triangle for most injuries phase */}
              {isMostInjuriesPhase && (
                <Tooltip content={injuryRiskText} position="top" tapToOpen={false}>
                  <span className="absolute right-0.5 top-0.5 z-20 cursor-help text-uc-warning">
                    <Icon name="injury-risk" size={12} />
                  </span>
                </Tooltip>
              )}
              <span className="text-[16px] font-extrabold leading-tight uc-num">{date.getDate()}</span>
              <span className={`text-[11px] font-semibold leading-tight uc-num ${hasPeriod ? 'opacity-70' : 'text-uc-text-muted'}`}>
                {isForecastDate ? '~' : ''}{cycleInfo.currentDay}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-uc-text-muted">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className={`size-3.5 rounded ${phaseSolidBg.menstrual}`} />
          {t('cycle.tracking.confirmedPeriod') || 'Confirmed Period'}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="size-3.5 rounded border-2 border-dashed border-uc-phase-menstruation" />
          {t('cycle.tracking.predictedMenstrual') || 'Menstrual Phase (predicted)'}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className={`size-3.5 rounded ${phaseBandBg.ovulation}`} />
          {t('cycle.phases.ovulation') || 'Ovulation'}
        </span>
        <span>~ = {t('cycle.tracking.forecast') || 'Forecast'}</span>
        {injuryStats?.phaseWithMostInjuries && (
          <span className="inline-flex items-center gap-2">
            <Icon name="injury-risk" size={14} className="text-uc-warning" />
            {t('cycle.tracking.mostInjuriesPhase') || 'Phase with most injuries'}
          </span>
        )}
      </div>
      <p className="mt-3 text-[13px] text-uc-text-muted">
        {t('cycle.tracking.tapDayHint') || 'Tap a day to add a period starting then.'}
      </p>
    </Card>
  )
}

// Training vs Cycle Insights Component
function TrainingCycleInsights({
  injuryStats,
  currentPhase,
}: {
  cycleSettings: CycleSettingsProp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trainingStatsByPhase: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  injuryStats: any
  currentPhase: CyclePhase | null
}) {
  const { t } = useLanguage()

  const phaseInfo = PHASES.map(key => {
    const translationKey = phaseTranslationKey[key]
    const tips = t(`cycle.phaseDetails.${translationKey}.tips`) as unknown
    return {
      key,
      translationKey,
      name: t(`cycle.phaseDetails.${translationKey}.name`) || key,
      days: t(`cycle.phaseDetails.${translationKey}.days`) || '',
      physiology: t(`cycle.phaseDetails.${translationKey}.physiology`) || '',
      impact: t(`cycle.phaseDetails.${translationKey}.impact`) || '',
      goal: t(`cycle.phaseDetails.${translationKey}.goal`) || '',
      tips: Array.isArray(tips) ? (tips as string[]) : [],
    }
  })

  const rowLabel = 'text-[13px] font-bold text-uc-text-muted'

  return (
    <section>
      <h2 className="mb-3 text-xl font-extrabold text-uc-text">
        {t('cycle.tracking.trainingInsights') || 'Training vs Cycle Insights'}
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {phaseInfo.map(phase => {
          const injuries = injuryStats?.injuriesByPhase?.[phase.translationKey] || 0
          const isMostInjuriesPhase = injuryStats?.phaseWithMostInjuries === phase.translationKey
          const isNow = phase.key === currentPhase

          return (
            <div
              key={phase.key}
              className={`rounded-uc-card border p-4 ${isNow ? `${phaseBandBg[phase.key]} border-transparent` : 'bg-uc-surface'} ${
                isMostInjuriesPhase ? 'border-uc-warning' : isNow ? '' : 'border-uc-border'
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${phaseSolidBg[phase.key]}`} />
                <h3 className="min-w-0 flex-1 text-[17px] font-extrabold text-uc-text">{phase.name}</h3>
                <span className="shrink-0 text-[13px] font-semibold text-uc-text-muted uc-num">
                  {t('cycle.tracking.days') || 'Days'} {phase.days}
                </span>
                {isNow && (
                  <span className={`shrink-0 rounded-uc-chip px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-uc-chip-ink ${phaseSolidBg[phase.key]}`}>
                    {t('cycle.tracking.now') || 'Now'}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm text-uc-text">
                <dt className={rowLabel}>{stripColon(t('cycle.tracking.physiology') || 'Physiology:')}</dt>
                <dd>{phase.physiology}</dd>
                <dt className={rowLabel}>{stripColon(t('cycle.tracking.impact') || 'Impact:')}</dt>
                <dd>{phase.impact}</dd>
                <dt className={rowLabel}>{stripColon(t('cycle.tracking.goal') || 'Goal:')}</dt>
                <dd>{phase.goal}</dd>
                <dt className={rowLabel}>{stripColon(t('cycle.tracking.tips') || 'Tips:')}</dt>
                <dd>
                  <ul className="space-y-1">
                    {phase.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </dd>
              </dl>

              {injuries > 0 && (
                <span
                  className={`mt-3 inline-flex min-h-7 items-center gap-1.5 rounded-uc-chip px-2.5 text-[13px] font-bold uc-num ${
                    isMostInjuriesPhase ? 'bg-uc-warning-bg text-uc-warning' : 'bg-uc-elevated text-uc-text-muted'
                  }`}
                >
                  <Icon name="injury-risk" size={14} />
                  {stripColon(t('cycle.tracking.injuries') || 'Injuries:')} {injuries}
                  {isMostInjuriesPhase && ` · ${t('cycle.tracking.most') || 'most'}`}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// Period Form Sheet Component
function PeriodFormModal({
  period,
  otherPeriods,
  onEditExisting,
  locale,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}: {
  period?: Period | null
  /** Logged periods other than the one being edited, to catch overlapping dates. */
  otherPeriods: Period[]
  onEditExisting: (period: Period) => void
  locale: string
  defaultDate?: Date
  onClose: () => void
  onSave: (data: PeriodFormData) => Promise<void>
  onDelete?: () => void
}) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<PeriodFormData>({
    // Calendar cells are local dates - toISOString() would give the previous day ahead of UTC
    startDate: period?.startDate ? toStoredDateString(period.startDate) : toLocalDateString(defaultDate ?? new Date()),
    endDate: period?.endDate ? toStoredDateString(period.endDate) : undefined,
    notes: period?.notes || '',
    flow: period?.flow ?? null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Blocks a second save from a double tap before isSubmitting re-renders the button
  const submittingRef = useRef(false)

  const endBeforeStart = !!formData.startDate && !!formData.endDate &&
    storedDayNumber(formData.endDate) < storedDayNumber(formData.startDate)

  // One period per day: the server refuses overlaps too, this just says so before saving
  const overlapping = useMemo(() => {
    if (!formData.startDate) return null
    const from = storedDayNumber(formData.startDate)
    const to = storedDayNumber(formData.endDate || formData.startDate)
    return otherPeriods.find(p => storedDayNumber(p.startDate) <= to && storedDayNumber(p.endDate || p.startDate) >= from) ?? null
  }, [formData.startDate, formData.endDate, otherPeriods])

  const formatStored = (value: Date | string) =>
    new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const overlapDates = overlapping
    ? storedDayNumber(overlapping.startDate) === storedDayNumber(overlapping.endDate || overlapping.startDate)
      ? formatStored(overlapping.startDate)
      : `${formatStored(overlapping.startDate)} – ${formatStored(overlapping.endDate!)}`
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overlapping || endBeforeStart || submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      closeLabel={t('common.close') || 'Close'}
      title={
        <span className="flex items-center gap-3">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-uc-input bg-uc-band-menstruation text-uc-phase-menstruation">
            <Icon name="period" size={22} />
          </span>
          {period ? (t('cycle.tracking.editPeriod') || 'Edit Period') : (t('cycle.tracking.addPeriodTitle') || 'Add Period')}
        </span>
      }
      footer={
        <div className="flex gap-2">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-12 text-uc-error"
              onClick={onDelete}
              aria-label={t('common.delete') || 'Delete'}
              title={t('common.delete') || 'Delete'}
            >
              <Icon name="delete" />
            </Button>
          )}
          <Button variant="ghost" className="min-h-12 flex-1" onClick={onClose}>
            {t('cycle.tracking.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" form="period-form" variant="accent" className="min-h-12 flex-[1.4]" isLoading={isSubmitting} disabled={!!overlapping || endBeforeStart}>
            {isSubmitting ? (t('cycle.tracking.saving') || 'Saving...') : period ? (t('cycle.tracking.update') || 'Update') : (t('cycle.tracking.add') || 'Add')}
          </Button>
        </div>
      }
    >
      <form id="period-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <Label htmlFor="period-start" className="flex-1">{t('cycle.tracking.startDate') || 'Start Date'}</Label>
            <Input
              id="period-start"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="period-end" className="flex-1">{t('cycle.tracking.endDate') || 'End Date (optional, defaults to start date)'}</Label>
            <Input
              id="period-end"
              type="date"
              value={formData.endDate || ''}
              min={formData.startDate || undefined}
              aria-invalid={endBeforeStart || undefined}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
            />
          </div>
        </div>

        {endBeforeStart && (
          <p role="alert" className="text-sm font-semibold text-uc-error">
            {t('cycle.tracking.endBeforeStartError')}
          </p>
        )}

        {overlapping && !endBeforeStart && (
          <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-uc-error">
            <span>{t('cycle.tracking.overlapError', { dates: overlapDates })}</span>
            <button
              type="button"
              onClick={() => onEditExisting(overlapping)}
              className="font-bold text-uc-primary hover:underline"
            >
              {t('cycle.tracking.editExisting')}
            </button>
          </div>
        )}

        {/* Flow intensity: optional, tap again to clear */}
        <div role="group" aria-labelledby="period-flow">
          <Label id="period-flow">{t('cycle.tracking.flow')}</Label>
          <div className="grid grid-cols-3 gap-2">
            {FLOW_LEVELS.map(level => (
              <ChoiceChip
                key={level}
                selected={formData.flow === level}
                onClick={() => setFormData({ ...formData, flow: formData.flow === level ? null : level })}
                className="px-2"
              >
                <FlowBars level={level} />
                {t(`cycle.tracking.flowLevels.${level}`)}
              </ChoiceChip>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="period-notes">{t('cycle.tracking.notes') || 'Notes (optional)'}</Label>
          <Textarea
            id="period-notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </form>
    </BottomSheet>
  )
}
