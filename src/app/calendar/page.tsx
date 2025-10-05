'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCycle } from '@/contexts/CycleContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { calculateCycleInfo } from '@/lib/cycle-utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { WorkoutType, Workout } from '@/types/workout'
import { EventType, Event } from '@/types/event'
import TrainingTypeFilter from '@/components/TrainingTypeFilter'
import AuthGuard from '@/components/AuthGuard'

type ViewMode = 'week' | 'month'
type FilterType = 'workouts' | 'events'

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
    case 'MENTAL_PRACTICE':
      return 'bg-training-mentalPractice'
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
    case 'MENTAL_PRACTICE':
      return '🧘'
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
    case 'MENTAL_PRACTICE':
      return t('training.types.mentalPractice')
    default:
      return type
  }
}

const getEventTypeColor = (type: EventType) => {
  switch (type) {
    case 'INJURY':
      return 'bg-red-500'
    case 'PHYSIO':
      return 'bg-blue-500'
    case 'COMPETITION':
      return 'bg-yellow-500'
    case 'TRIP':
      return 'bg-purple-500'
    case 'OTHER':
      return 'bg-gray-500'
    default:
      return 'bg-gray-500'
  }
}

const getEventTypeEmoji = (type: EventType) => {
  switch (type) {
    case 'INJURY':
      return '🤕'
    case 'PHYSIO':
      return '🏥'
    case 'COMPETITION':
      return '🏆'
    case 'TRIP':
      return '✈️'
    case 'OTHER':
      return '📅'
    default:
      return '📅'
  }
}

const getEventTypeLabel = (type: EventType, t: (key: string) => string) => {
  switch (type) {
    case 'INJURY':
      return 'Injury'
    case 'PHYSIO':
      return 'Physio Visit'
    case 'COMPETITION':
      return 'Competition'
    case 'TRIP':
      return 'Trip'
    case 'OTHER':
      return 'Other'
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
  return (
    <AuthGuard>
      <CalendarPageContent />
    </AuthGuard>
  )
}

function CalendarPageContent() {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle()
  const { t } = useLanguage()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(() => {
    // Use a fixed date for SSR consistency
    if (typeof window === 'undefined') {
      return new Date('2024-01-15T00:00:00.000Z')
    }
    return new Date()
  })
  const [loading, setLoading] = useState(true)
  const [selectedTypes, setSelectedTypes] = useState<WorkoutType[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('workouts')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch workouts and events
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [workoutsResponse, eventsResponse] = await Promise.all([
          fetch('/api/workouts'),
          fetch('/api/events')
        ])
        
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json()
          setWorkouts(workoutsData)
        }
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
    let filteredWorkouts = workouts.filter(workout => workout.startTime.startsWith(dateStr))
    
    // Apply type filter
    if (selectedTypes.length > 0) {
      filteredWorkouts = filteredWorkouts.filter(workout => selectedTypes.includes(workout.type))
    }
    
    return filteredWorkouts
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10)
    let filteredEvents = events.filter(event => {
      // Handle both date formats: "2025-10-24" and "2025-10-24T00:00:00.000Z"
      const eventDateStr = event.date.includes('T') 
        ? event.date.slice(0, 10) 
        : event.date
      
      // For trip events, check if the date falls within the trip date range
      if (event.type === 'TRIP' && event.tripStartDate && event.tripEndDate) {
        const tripStartStr = event.tripStartDate.includes('T') 
          ? event.tripStartDate.slice(0, 10) 
          : event.tripStartDate
        const tripEndStr = event.tripEndDate.includes('T') 
          ? event.tripEndDate.slice(0, 10) 
          : event.tripEndDate
        
        // Check if the current date is within the trip range (inclusive)
        return dateStr >= tripStartStr && dateStr <= tripEndStr
      }
      
      // For non-trip events, use the regular date matching
      return eventDateStr === dateStr
    })
    
    // Apply type filter - only filter if specific types are selected
    if (selectedEventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => selectedEventTypes.includes(event.type))
    }
    
    return filteredEvents
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    if (viewMode === 'week') {
      const start = calendarDates[0]
      const end = calendarDates[6]
      return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
    } else {
      return `${monthsFull[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
  }

  if (loading) {
    return <LoadingSpinner message={t('calendar.loading')} fullScreen />
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-uc-text-light">
              📅 {t('calendar.title')}
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  showFilters || selectedTypes.length > 0 || selectedEventTypes.length > 0
                    ? 'bg-uc-mustard text-uc-black shadow-lg'
                    : 'bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20'
                }`}
              >
                🔍 Filters {(selectedTypes.length + selectedEventTypes.length) > 0 && `(${selectedTypes.length + selectedEventTypes.length})`}
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-uc-mustard text-uc-black shadow-lg'
                    : 'bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20'
                }`}
              >
                {t('common.week')}
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-uc-mustard text-uc-black shadow-lg'
                    : 'bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20'
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
                className="p-2 rounded-xl bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20 transition-colors"
              >
                ←
              </button>
              <button
                onClick={navigateNext}
                className="p-2 rounded-xl bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20 transition-colors"
              >
                →
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 rounded-xl bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black font-medium transition-colors shadow-lg"
              >
                {t('common.today')}
              </button>
            </div>
            <h2 className="text-xl font-semibold text-uc-text-light">
              {formatDateRange()}
            </h2>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-uc-dark-bg rounded-xl shadow-lg border border-uc-purple/20">
            <div className="space-y-4">
              {/* Filter Type Toggle */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveFilter('workouts')}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                    activeFilter === 'workouts'
                      ? 'bg-uc-purple text-uc-text-light'
                      : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light'
                  }`}
                >
                  🏋️ Workouts
                </button>
                <button
                  onClick={() => setActiveFilter('events')}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                    activeFilter === 'events'
                      ? 'bg-uc-purple text-uc-text-light'
                      : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light'
                  }`}
                >
                  📅 Events
                </button>
              </div>
              
              {/* Training Type Filter */}
              {activeFilter === 'workouts' && (
                <TrainingTypeFilter
                  selectedTypes={selectedTypes}
                  onTypesChange={setSelectedTypes}
                />
              )}
              
              {/* Event Type Filter */}
              {activeFilter === 'events' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      🔍 Filter by Event Type
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedEventTypes(['INJURY', 'PHYSIO', 'COMPETITION', 'OTHER'])}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        All
                      </button>
                      <button
                        onClick={() => setSelectedEventTypes([])}
                        className="text-xs text-uc-text-muted hover:text-uc-mustard transition-colors"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: 'INJURY' as EventType, label: 'Injury', emoji: '🤕', color: 'bg-red-500' },
                      { type: 'PHYSIO' as EventType, label: 'Physio', emoji: '🏥', color: 'bg-blue-500' },
                      { type: 'COMPETITION' as EventType, label: 'Competition', emoji: '🏆', color: 'bg-yellow-500' },
                      { type: 'OTHER' as EventType, label: 'Other', emoji: '📅', color: 'bg-purple-500' }
                    ].map(({ type, label, emoji, color }) => {
                      const isSelected = selectedEventTypes.includes(type)
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            if (selectedEventTypes.includes(type)) {
                              setSelectedEventTypes(selectedEventTypes.filter(t => t !== type))
                            } else {
                              setSelectedEventTypes([...selectedEventTypes, type])
                            }
                          }}
                          className={`flex items-center space-x-2 p-2 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-uc-purple bg-uc-purple/20'
                              : 'border-uc-purple/20 bg-uc-black/50 hover:bg-uc-dark-bg/50'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-sm">{emoji}</span>
                          <span className="text-xs font-medium text-uc-text-light">
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {selectedEventTypes.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No event types selected. All events will be shown.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-uc-dark-bg rounded-xl shadow-lg overflow-hidden border border-uc-purple/20">
          {/* Day headers */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 border-b border-uc-purple/20">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="p-4 text-center font-semibold text-uc-text-muted bg-uc-black/50 text-sm"
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
              const dayEvents = getEventsForDate(date)
              const cycleInfo = getCycleInfoForDate(date)
              const isToday = typeof window !== 'undefined' && date.toDateString() === new Date().toDateString()
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={index}
                  className={`${
                    viewMode === 'week' 
                      ? 'min-h-[80px] md:min-h-[120px] p-3 md:p-2 border-b md:border-r border-uc-purple/20' 
                      : 'min-h-[120px] p-2 border-r border-b border-uc-purple/20'
                  } ${
                    !isCurrentMonth ? 'bg-uc-black/30' : ''
                  }`}
                >
                  {/* Date number */}
                  <div className={`flex items-center justify-between ${viewMode === 'week' ? 'mb-3 md:mb-2' : 'mb-2'}`}>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`${viewMode === 'week' ? 'text-base md:text-sm' : 'text-sm'} font-medium ${
                          isToday
                            ? 'bg-uc-mustard text-uc-black rounded-full w-7 h-7 md:w-6 md:h-6 flex items-center justify-center'
                            : isCurrentMonth
                            ? 'text-uc-text-light'
                            : 'text-uc-text-muted'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {viewMode === 'week' && (
                        <span className="text-sm text-uc-text-muted hidden md:block">
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]}
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
                    {getWorkoutsForDate(date).map((workout) => (
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
                  
                  {/* Events */}
                  <div className={`${viewMode === 'week' ? 'space-y-2' : 'space-y-1'}`}>
                    {getEventsForDate(date).map((event) => {
                      // For trip events, show destination with day counter
                      let displayText = `${getEventTypeEmoji(event.type)} ${event.title}`
                      
                      if (event.type === 'TRIP' && event.destination && event.tripStartDate && event.tripEndDate) {
                        // Calculate trip day
                        const tripStart = new Date(event.tripStartDate)
                        const tripEnd = new Date(event.tripEndDate)
                        const currentDate = new Date(date)
                        
                        // Calculate total trip days (inclusive of both start and end dates)
                        const totalDays = Math.floor((tripEnd.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        
                        // Calculate current day of trip (1-based)
                        const currentDay = Math.floor((currentDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        
                        displayText = `${getEventTypeEmoji(event.type)} ${event.destination} (${currentDay}/${totalDays})`
                      }
                      
                      const tooltipText = event.type === 'TRIP' 
                        ? `${getEventTypeEmoji(event.type)} ${event.title} - ${event.destination || 'No destination'}`
                        : `${getEventTypeEmoji(event.type)} ${event.title} - ${event.description || 'No description'}`
                      
                      return (
                        <div
                          key={event.id}
                          className={`${viewMode === 'week' ? 'text-sm md:text-xs p-2 md:p-1' : 'text-xs p-1'} rounded ${getEventTypeColor(event.type)} text-white ${viewMode === 'week' ? '' : 'truncate'}`}
                          title={tooltipText}
                        >
                          {displayText}
                          {viewMode === 'week' && event.type === 'TRIP' && event.destination && (
                            <div className="text-xs opacity-90 mt-1 truncate">
                              {event.destination}
                            </div>
                          )}
                          {viewMode === 'week' && event.type !== 'TRIP' && event.description && (
                            <div className="text-xs opacity-90 mt-1 truncate">
                              {event.description}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-uc-dark-bg rounded-2xl shadow-lg p-6 border border-uc-purple/20">
          <h3 className="text-lg font-semibold text-uc-text-light mb-4">
            {t('calendar.legend')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-gym"></div>
              <span className="text-sm text-uc-text-muted">🏋️ {t('training.types.gym')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-bouldering"></div>
              <span className="text-sm text-uc-text-muted">🧗 {t('training.types.bouldering')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-circuits"></div>
              <span className="text-sm text-uc-text-muted">🔄 {t('training.types.circuits')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-leadRock"></div>
              <span className="text-sm text-uc-text-muted">🏔️ {t('training.types.leadRock')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-leadArtificial"></div>
              <span className="text-sm text-uc-text-muted">🧗‍♀️ {t('training.types.leadArtificial')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-training-mentalPractice"></div>
              <span className="text-sm text-uc-text-muted">🧘 {t('training.types.mentalPractice')}</span>
            </div>
          </div>
          
          {/* Events Legend */}
          <div className="mt-4 pt-4 border-t border-uc-purple/20">
            <h4 className="text-sm font-medium text-uc-text-light mb-2">
              Wydarzenia
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-sm text-uc-text-muted">🤕 Kontuzja</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-sm text-uc-text-muted">🏥 Fizjoterapia</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-sm text-uc-text-muted">🏆 Zawody</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span className="text-sm text-uc-text-muted">✈️ Wyjazd</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded bg-gray-500"></div>
                <span className="text-sm text-uc-text-muted">📅 Inne</span>
              </div>
            </div>
          </div>
          
          {isCycleTrackingEnabled && (
            <div className="mt-4 pt-4 border-t border-uc-purple/20">
              <h4 className="text-sm font-medium text-uc-text-light mb-2">
                {t('calendar.cyclePhases')}
              </h4>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-uc-text-muted">{t('cycle.phases.menstrual')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-uc-text-muted">{t('cycle.phases.follicular')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-uc-text-muted">{t('cycle.phases.ovulation')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-uc-text-muted">{t('cycle.phases.earlyLuteal')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-uc-text-muted">{t('cycle.phases.lateLuteal')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
