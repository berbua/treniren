'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCycle } from '@/contexts/CycleContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { calculateCycleInfo } from '@/lib/cycle-utils'
import { WorkoutType, TrainingVolume } from '@/types/workout'

interface Workout {
  id: string
  type: WorkoutType
  date: string
  trainingVolume?: TrainingVolume
  notes?: string
  preSessionFeel?: number
  dayAfterTiredness?: number
}

type ViewMode = 'week' | 'month'

const getTrainingTypeColor = (type: WorkoutType) => {
  switch (type) {
    case 'GYM':
      return 'bg-training-gym'
    case 'BOULDERING':
      return 'bg-training-bouldering'
    case 'CIRCUITS':
      return 'bg-training-circuits'
    case 'LEAD_ROCK':
      return 'bg-training-leadRock'
    case 'LEAD_ARTIFICIAL':
      return 'bg-training-leadArtificial'
    default:
      return 'bg-gray-500'
  }
}

const getTrainingTypeEmoji = (type: WorkoutType) => {
  switch (type) {
    case 'GYM':
      return '🏋️'
    case 'BOULDERING':
      return '🧗'
    case 'CIRCUITS':
      return '🔄'
    case 'LEAD_ROCK':
      return '🏔️'
    case 'LEAD_ARTIFICIAL':
      return '🧗‍♀️'
    default:
      return '📅'
  }
}

const getTrainingTypeLabel = (type: WorkoutType, t: (key: string) => string) => {
  switch (type) {
    case 'GYM':
      return t('training.types.gym')
    case 'BOULDERING':
      return t('training.types.bouldering')
    case 'CIRCUITS':
      return t('training.types.circuits')
    case 'LEAD_ROCK':
      return t('training.types.leadRock')
    case 'LEAD_ARTIFICIAL':
      return t('training.types.leadArtificial')
    default:
      return type
  }
}

const getCyclePhaseColor = (phase: string) => {
  switch (phase) {
    case 'menstrual':
      return 'bg-red-500'
    case 'follicular':
      return 'bg-green-500'
    case 'ovulation':
      return 'bg-yellow-500'
    case 'early-luteal':
      return 'bg-blue-500'
    case 'late-luteal':
      return 'bg-purple-500'
    default:
      return 'bg-gray-400'
  }
}

export default function CalendarPage() {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle()
  const { t } = useLanguage()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  // Fetch workouts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/workouts')
        if (response.ok) {
          const data = await response.json()
          setWorkouts(data)
        }
      } catch (error) {
        console.error('Error fetching workouts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [])

  // Calculate calendar dates
  const calendarDates = useMemo(() => {
    const dates = []
    const startDate = new Date(currentDate)
    
    if (viewMode === 'week') {
      // Start from Monday of the current week
      const dayOfWeek = startDate.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startDate.setDate(startDate.getDate() + mondayOffset)
      
      // Generate 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        dates.push(date)
      }
    } else {
      // Month view - start from first day of month
      startDate.setDate(1)
      
      // Get first Monday of the month (or previous Monday if month starts later)
      const firstDay = startDate.getDay()
      const mondayOffset = firstDay === 0 ? -6 : 1 - firstDay
      startDate.setDate(startDate.getDate() + mondayOffset)
      
      // Generate 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        dates.push(date)
      }
    }
    
    return dates
  }, [currentDate, viewMode])

  // Get workouts for a specific date
  const getWorkoutsForDate = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10)
    return workouts.filter(workout => workout.date.startsWith(dateStr))
  }

  // Get cycle info for a specific date
  const getCycleInfoForDate = (date: Date) => {
    if (!isCycleTrackingEnabled || !cycleSettings) return null
    return calculateCycleInfo(cycleSettings, date)
  }

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateRange = () => {
    if (viewMode === 'week') {
      const start = calendarDates[0]
      const end = calendarDates[6]
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">{t('calendar.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              📅 {t('calendar.title')}
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                {t('common.week')}
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
              >
                {t('common.month')}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={navigatePrevious}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                ←
              </button>
              <button
                onClick={navigateNext}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                →
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
              >
                {t('common.today')}
              </button>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {formatDateRange()}
            </h2>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          {/* Day headers */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="p-4 text-center font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 text-sm"
                >
                  {day}
                </div>
              ))}
            </div>
          )}

          {/* Calendar cells */}
          <div className={`grid ${viewMode === 'week' ? 'grid-cols-1 md:grid-cols-7' : 'grid-cols-7'}`}>
            {calendarDates.map((date, index) => {
              const dayWorkouts = getWorkoutsForDate(date)
              const cycleInfo = getCycleInfoForDate(date)
              const isToday = date.toDateString() === new Date().toDateString()
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={index}
                  className={`${
                    viewMode === 'week' 
                      ? 'min-h-[80px] md:min-h-[120px] p-3 md:p-2 border-b md:border-r border-slate-200 dark:border-slate-700' 
                      : 'min-h-[120px] p-2 border-r border-b border-slate-200 dark:border-slate-700'
                  } ${
                    !isCurrentMonth ? 'bg-slate-50 dark:bg-slate-900' : ''
                  }`}
                >
                  {/* Date number */}
                  <div className={`flex items-center justify-between ${viewMode === 'week' ? 'mb-3 md:mb-2' : 'mb-2'}`}>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`${viewMode === 'week' ? 'text-base md:text-sm' : 'text-sm'} font-medium ${
                          isToday
                            ? 'bg-blue-600 text-white rounded-full w-7 h-7 md:w-6 md:h-6 flex items-center justify-center'
                            : isCurrentMonth
                            ? 'text-slate-900 dark:text-slate-50'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {viewMode === 'week' && (
                        <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:block">
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </span>
                      )}
                    </div>
                    
                    {/* Cycle indicator */}
                    {cycleInfo && (
                      <div
                        className={`w-2 h-2 rounded-full ${getCyclePhaseColor(cycleInfo.phase)}`}
                        title={`Cycle Day ${cycleInfo.currentDay} - ${cycleInfo.phaseDescription}`}
                      />
                    )}
                  </div>

                  {/* Workouts */}
                  <div className={`${viewMode === 'week' ? 'space-y-2' : 'space-y-1'}`}>
                    {dayWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className={`${viewMode === 'week' ? 'text-sm md:text-xs p-2 md:p-1' : 'text-xs p-1'} rounded ${getTrainingTypeColor(workout.type)} text-white ${viewMode === 'week' ? '' : 'truncate'}`}
                        title={`${getTrainingTypeEmoji(workout.type)} ${workout.type} - ${workout.notes || 'No notes'}`}
                      >
                        {getTrainingTypeEmoji(workout.type)} {getTrainingTypeLabel(workout.type, t)}
                        {viewMode === 'week' && workout.notes && (
                          <div className="text-xs opacity-90 mt-1 truncate">
                            {workout.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            {t('calendar.legend')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-gym"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">🏋️ {t('training.types.gym')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-bouldering"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">🧗 {t('training.types.bouldering')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-circuits"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">🔄 {t('training.types.circuits')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-leadRock"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">🏔️ {t('training.types.leadRock')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-leadArtificial"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">🧗‍♀️ {t('training.types.leadArtificial')}</span>
            </div>
          </div>
          
          {isCycleTrackingEnabled && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                {t('calendar.cyclePhases')}
              </h4>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">Menstrual</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">Follicular</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">Ovulation</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">Early Luteal</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">Late Luteal</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
