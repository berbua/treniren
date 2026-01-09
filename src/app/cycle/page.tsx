'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCycle } from '@/contexts/CycleContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApiError } from '@/hooks/useApiError'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { extractApiError } from '@/lib/errors'
import { calculateCycleInfo, getPhaseColor, CyclePhase, getPhaseDayRange, getPhaseDisplayName, getPhaseStartDay, getPhaseEndDay } from '@/lib/cycle-utils'
import { Period, PeriodFormData } from '@/types/period'
import { Workout } from '@/types/workout'
import { Event } from '@/types/event'
import AuthGuard from '@/components/AuthGuard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Tooltip } from '@/components/Tooltip'
import { statisticsService } from '@/lib/statistics-service'

export default function CyclePage() {
  return (
    <AuthGuard>
      <CyclePageContent />
    </AuthGuard>
  )
}

function CyclePageContent() {
  const { t } = useLanguage()
  const { cycleSettings, isCycleTrackingEnabled, cycleInfo, refreshCycleSettings } = useCycle()
  const { handleError, showSuccess } = useApiError()
  const { getToken } = useCsrfToken()
  
  const [periods, setPeriods] = useState<Period[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showPeriodForm, setShowPeriodForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
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
      const workoutDate = new Date(workout.startTime)
      const cycleInfo = calculateCycleInfo(cycleSettings, workoutDate)
      
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

  if (!isCycleTrackingEnabled || !cycleSettings) {
    return (
      <div className="min-h-screen bg-uc-black p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-uc-dark-bg rounded-2xl p-8 border border-uc-purple/20 text-center">
            <div className="text-6xl mb-4">🔴</div>
            <h2 className="text-2xl font-bold text-uc-text-light mb-4">
              Cycle Tracking Not Enabled
            </h2>
            <p className="text-uc-text-muted">
              Please enable cycle tracking in your profile settings to use this feature.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner message="Loading cycle data..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-uc-text-light mb-2">
              🔴 {t('cycle.tracking.title') || 'Cycle Tracking'}
            </h1>
            {cycleInfo && (
              <p className="text-uc-text-muted">
                {`Day ${cycleInfo.currentDay} of ${cycleSettings.cycleLength} - ${cycleInfo.phaseDescription}`}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowPeriodForm(true)}
            className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
          >
            {t('cycle.tracking.addPeriod') || '+ Add Period'}
          </button>
        </div>

        {/* Cycle Calendar */}
        <CycleCalendar
          cycleSettings={cycleSettings}
          periods={periods}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onDateClick={(date) => {
            setSelectedDate(date)
            setShowPeriodForm(true)
          }}
          injuryStats={injuryStats}
        />

        {/* Injury Phase Warning */}
        {injuryStats && injuryStats.phaseWithMostInjuries && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-red-200 mb-2">
                  {(() => {
                    const phaseKey = injuryStats.phaseWithMostInjuries === 'earlyLuteal' ? 'earlyLuteal' :
                      injuryStats.phaseWithMostInjuries === 'lateLuteal' ? 'lateLuteal' :
                      injuryStats.phaseWithMostInjuries
                    const phaseName = t(`cycle.phases.${phaseKey}`) || 
                      (injuryStats.phaseWithMostInjuries === 'menstrual' ? 'Menstrual' :
                       injuryStats.phaseWithMostInjuries === 'follicular' ? 'Follicular' :
                       injuryStats.phaseWithMostInjuries === 'ovulation' ? 'Ovulation' :
                       injuryStats.phaseWithMostInjuries === 'earlyLuteal' ? 'Early Luteal' :
                       'Late Luteal')
                    return t('cycle.tracking.mostInjuriesInPhase', { phase: phaseName }) || `Most Injuries in ${phaseName} Phase`
                  })()}
                </h3>
                <p className="text-red-100">
                  {(() => {
                    const phase = getPhaseDisplayName(injuryStats.phaseWithMostInjuries)
                    const days = getPhaseDayRange(phase, cycleSettings.cycleLength)
                    return t('cycle.tracking.injuriesOccurredDuringDays', {
                      count: injuryStats.maxInjuriesInPhase,
                      total: injuryStats.totalInjuries,
                      days: days
                    }) || `${injuryStats.maxInjuriesInPhase} out of ${injuryStats.totalInjuries} injuries occurred during cycle days ${days}.`
                  })()}
                </p>
                <p className="text-red-100 mt-2 text-sm">
                  {t('cycle.tracking.beCautious') || 'Be extra cautious during this phase and consider adjusting your training intensity.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Training vs Cycle Insights */}
        <TrainingCycleInsights
          cycleSettings={cycleSettings}
          trainingStatsByPhase={trainingStatsByPhase}
          injuryStats={injuryStats}
        />

        {/* Period Form Modal */}
        {showPeriodForm && (
          <PeriodFormModal
            period={editingPeriod}
            defaultDate={selectedDate}
            onClose={() => {
              setShowPeriodForm(false)
              setEditingPeriod(null)
            }}
            onSave={async (periodData) => {
              try {
                const url = editingPeriod ? `/api/periods/${editingPeriod.id}` : '/api/periods'
                const method = editingPeriod ? 'PUT' : 'POST'

                const csrfToken = await getToken()
                const response = await fetch(url, {
                  method,
                  headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                  },
                  credentials: 'include',
                  body: JSON.stringify(periodData),
                })

                if (response.ok) {
                  showSuccess(editingPeriod ? (t('cycle.tracking.periodUpdated') || 'Period updated') : (t('cycle.tracking.periodAdded') || 'Period added'))
                  // Refresh periods
                  const periodsRes = await fetch('/api/periods', { credentials: 'include' })
                  if (periodsRes.ok) {
                    const periodsData = await periodsRes.json()
                    setPeriods(periodsData)
                  }
                  // Refresh cycle settings to update lastPeriodDate in calendar
                  await refreshCycleSettings()
                  setShowPeriodForm(false)
                  setEditingPeriod(null)
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
        </div>
      </div>
    </div>
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
}: {
  cycleSettings: { cycleLength: number; lastPeriodDate: Date; timezone: string }
  periods: Period[]
  currentMonth: Date
  onMonthChange: (date: Date) => void
  onDateClick: (date: Date) => void
  injuryStats?: { phaseWithMostInjuries?: 'menstrual' | 'follicular' | 'ovulation' | 'earlyLuteal' | 'lateLuteal' } | null
}) {
  const { t } = useLanguage()
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const monthDays = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    monthDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    monthDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
  }

  // Find the most recent confirmed period date (lastPeriodDate)
  const lastConfirmedDate = new Date(cycleSettings.lastPeriodDate)
  lastConfirmedDate.setHours(0, 0, 0, 0)

  const isPeriodDay = (date: Date) => {
    return periods.some(period => {
      const start = new Date(period.startDate)
      start.setHours(0, 0, 0, 0)
      const end = period.endDate ? new Date(period.endDate) : new Date(period.startDate)
      end.setHours(23, 59, 59, 999)
      const checkDate = new Date(date)
      checkDate.setHours(12, 0, 0, 0)
      return checkDate >= start && checkDate <= end
    })
  }

  // Check if date is before last confirmed period date (should show forecast)
  const isForecast = (date: Date) => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < lastConfirmedDate
  }

  return (
    <div className="bg-uc-dark-bg rounded-2xl p-6 lg:p-4 border border-uc-purple/20">
      <div className="flex items-center justify-between mb-4 lg:mb-2">
        <button
          onClick={() => {
            const prevMonth = new Date(currentMonth)
            prevMonth.setMonth(prevMonth.getMonth() - 1)
            onMonthChange(prevMonth)
          }}
          className="text-uc-text-light hover:text-uc-mustard text-lg lg:text-base"
        >
          ←
        </button>
            <h2 className="text-xl lg:text-lg font-semibold text-uc-text-light">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={() => {
            const nextMonth = new Date(currentMonth)
            nextMonth.setMonth(nextMonth.getMonth() + 1)
            onMonthChange(nextMonth)
          }}
          className="text-uc-text-light hover:text-uc-mustard text-lg lg:text-base"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 lg:gap-0.5 max-w-full lg:max-w-[50%] lg:mx-auto">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm lg:text-xs font-medium text-uc-text-muted py-1 lg:py-0.5">
            {day.substring(0, 3)}
          </div>
        ))}
        {monthDays.map((date, index) => {
          if (!date) return <div key={index} />
          
          const cycleInfo = calculateCycleInfo(cycleSettings, date)
          const isToday = date.toDateString() === new Date().toDateString()
          const hasPeriod = isPeriodDay(date)
          const isForecastDate = isForecast(date)
          
          // Only show colors for menstrual and ovulation phases
          const isMenstrual = cycleInfo.phase === 'menstrual'
          const isOvulation = cycleInfo.phase === 'ovulation'
          
          // Check if this day is in the phase with most injuries
          // Map phase key for comparison (early-luteal -> earlyLuteal, late-luteal -> lateLuteal)
          const phaseKeyForComparison = cycleInfo.phase === 'early-luteal' ? 'earlyLuteal' : 
                                         cycleInfo.phase === 'late-luteal' ? 'lateLuteal' : 
                                         cycleInfo.phase
          const isMostInjuriesPhase = injuryStats?.phaseWithMostInjuries && 
            phaseKeyForComparison === injuryStats.phaseWithMostInjuries

          return (
            <button
              key={index}
              onClick={() => onDateClick(date)}
              className={`
                aspect-square rounded border p-1 lg:p-0.5 text-sm lg:text-xs transition-all relative overflow-visible
                ${isToday ? 'border-uc-mustard bg-uc-mustard/20' : 'border-uc-purple/20'}
                ${hasPeriod ? 'bg-red-500/40 border-red-500/60' : ''}
                ${isMenstrual && !hasPeriod ? 'bg-red-500/20 border-red-500/40' : ''}
                ${isOvulation ? 'bg-yellow-500/20 border-yellow-500/40' : ''}
                hover:border-uc-purple/50 hover:bg-uc-purple/10
              `}
              title={isForecastDate ? `Forecast - ${cycleInfo.phaseDescription}` : cycleInfo.phaseDescription}
            >
              {/* Warning triangle for most injuries phase */}
              {isMostInjuriesPhase && (
                <Tooltip content={t('workouts.tooltips.injuryPhaseWarning') || 'This phase has the highest number of injuries in your history. Be extra cautious and consider adjusting training intensity during this phase.'} position="top">
                  <div className="absolute -top-0.5 -right-0.5 text-yellow-500 opacity-90 text-base lg:text-sm leading-none z-20 pointer-events-auto cursor-help">
                    ⚠️
                  </div>
                </Tooltip>
              )}
              <div className="text-uc-text-light font-semibold leading-tight lg:leading-tight">{date.getDate()}</div>
              <div className="text-uc-text-muted text-xs lg:text-[10px] leading-tight lg:leading-tight">
                {isForecastDate ? '~' : ''}{cycleInfo.currentDay}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500/40 border border-red-500/60" />
          <span className="text-uc-text-muted">{t('cycle.tracking.confirmedPeriod') || 'Confirmed Period'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/40"></div>
          <span className="text-uc-text-muted">{t('cycle.tracking.predictedMenstrual') || 'Menstrual Phase (predicted)'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
          <span className="text-uc-text-muted">{t('cycle.phases.ovulation') || 'Ovulation'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-uc-text-muted">~ = {t('cycle.tracking.forecast') || 'Forecast'}</span>
        </div>
        {injuryStats?.phaseWithMostInjuries && (
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500 opacity-70">⚠️</span>
            <span className="text-uc-text-muted">{t('cycle.tracking.mostInjuriesPhase') || 'Phase with most injuries'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Training vs Cycle Insights Component
function TrainingCycleInsights({
  cycleSettings,
  trainingStatsByPhase,
  injuryStats,
}: {
  cycleSettings: { cycleLength: number; lastPeriodDate: Date; timezone: string }
  trainingStatsByPhase: any
  injuryStats: any
}) {
  const { t } = useLanguage()
  
  // Get phase info from translations
  const getPhaseInfo = (key: string) => {
    // Map phase key for translation lookup (early-luteal -> earlyLuteal, late-luteal -> lateLuteal)
    const translationKey = key === 'early-luteal' ? 'earlyLuteal' : key === 'late-luteal' ? 'lateLuteal' : key
    const phaseData = t(`cycle.phaseDetails.${translationKey}`)
    
    // If translation exists as object, parse it; otherwise use defaults
    if (typeof phaseData === 'string') {
      // Translation not found, use defaults
      return null
    }
    return phaseData
  }
  
  const phaseKeys = ['menstrual', 'follicular', 'ovulation', 'early-luteal', 'late-luteal']
  const phaseInfo = phaseKeys.map(key => {
    const translationKey = key === 'early-luteal' ? 'earlyLuteal' : key === 'late-luteal' ? 'lateLuteal' : key
    return {
      key,
      name: t(`cycle.phaseDetails.${translationKey}.name`) || key,
      days: t(`cycle.phaseDetails.${translationKey}.days`) || '',
      physiology: t(`cycle.phaseDetails.${translationKey}.physiology`) || '',
      impact: t(`cycle.phaseDetails.${translationKey}.impact`) || '',
      goal: t(`cycle.phaseDetails.${translationKey}.goal`) || '',
      tips: Array.isArray((t(`cycle.phaseDetails.${translationKey}.tips`) as any)) 
        ? (t(`cycle.phaseDetails.${translationKey}.tips`) as any)
        : []
    }
  })

  return (
    <div className="bg-uc-dark-bg rounded-2xl p-6 border border-uc-purple/20">
      <h2 className="text-2xl font-semibold text-uc-text-light mb-6">
        📊 {t('cycle.tracking.trainingInsights') || 'Training vs Cycle Insights'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {phaseInfo.map(phase => {
          // Map phase key to injuriesByPhase key (early-luteal -> earlyLuteal, late-luteal -> lateLuteal)
          const phaseKey = phase.key === 'early-luteal' ? 'earlyLuteal' : phase.key === 'late-luteal' ? 'lateLuteal' : phase.key
          const injuries = injuryStats?.injuriesByPhase?.[phaseKey] || 0
          // Map phase key for comparison (early-luteal -> earlyLuteal, late-luteal -> lateLuteal)
          const comparisonKey = phase.key === 'early-luteal' ? 'earlyLuteal' : phase.key === 'late-luteal' ? 'lateLuteal' : phase.key
          const isMostInjuriesPhase = injuryStats?.phaseWithMostInjuries === comparisonKey

          return (
            <div
              key={phase.key}
              className={`bg-uc-black/50 rounded-xl p-4 border-2 ${
                isMostInjuriesPhase
                  ? 'border-red-500/50 bg-red-500/10'
                  : 'border-uc-purple/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-uc-text-light">
                  {phase.name}
                  {isMostInjuriesPhase && <span className="ml-2 text-red-400">⚠️</span>}
                </h3>
                <span className="text-xs text-uc-text-muted">{t('cycle.tracking.days') || 'Days'} {phase.days}</span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-medium text-uc-text-muted mb-1">{t('cycle.tracking.physiology') || 'Physiology:'}</div>
                  <div className="text-uc-text-light">{phase.physiology}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-uc-text-muted mb-1">{t('cycle.tracking.impact') || 'Impact:'}</div>
                  <div className="text-uc-text-light">{phase.impact}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-uc-text-muted mb-1">{t('cycle.tracking.goal') || 'Goal:'}</div>
                  <div className="text-uc-text-light">{phase.goal}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-uc-text-muted mb-1">{t('cycle.tracking.tips') || 'Tips:'}</div>
                  <ul className="list-disc list-inside space-y-1 text-uc-text-light">
                    {phase.tips.map((tip: string, idx: number) => (
                      <li key={idx} className="text-xs">{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {injuries > 0 && (
                <div className="mt-3 pt-3 border-t border-uc-purple/20">
                  <div className="flex justify-between items-center">
                    <span className="text-red-400 text-sm">{t('cycle.tracking.injuries') || 'Injuries:'}</span>
                    <span className="text-red-400 font-semibold">{injuries}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Period Form Modal Component
function PeriodFormModal({
  period,
  defaultDate,
  onClose,
  onSave,
}: {
  period?: Period | null
  defaultDate?: Date
  onClose: () => void
  onSave: (data: PeriodFormData) => Promise<void>
}) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<PeriodFormData>({
    startDate: period?.startDate || defaultDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: period?.endDate ? new Date(period.endDate).toISOString().split('T')[0] : undefined,
    notes: period?.notes || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-uc-dark-bg rounded-2xl p-6 max-w-md w-full border border-uc-purple/20">
        <h2 className="text-2xl font-bold text-uc-text-light mb-4">
          {period ? (t('cycle.tracking.editPeriod') || 'Edit Period') : (t('cycle.tracking.addPeriodTitle') || 'Add Period')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('cycle.tracking.startDate') || 'Start Date'}
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 bg-uc-black border border-uc-purple/20 rounded-lg text-uc-text-light focus:outline-none focus:ring-2 focus:ring-uc-purple/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('cycle.tracking.endDate') || 'End Date (optional, defaults to start date)'}
            </label>
            <input
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
              className="w-full px-4 py-2 bg-uc-black border border-uc-purple/20 rounded-lg text-uc-text-light focus:outline-none focus:ring-2 focus:ring-uc-purple/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('cycle.tracking.notes') || 'Notes (optional)'}
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-uc-black border border-uc-purple/20 rounded-lg text-uc-text-light focus:outline-none focus:ring-2 focus:ring-uc-purple/50"
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-uc-black hover:bg-uc-black/80 text-uc-text-light rounded-lg transition-colors"
            >
              {t('cycle.tracking.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (t('cycle.tracking.saving') || 'Saving...') : period ? (t('cycle.tracking.update') || 'Update') : (t('cycle.tracking.add') || 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

