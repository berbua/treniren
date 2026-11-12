'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCycle } from '@/contexts/CycleContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApiError } from '@/hooks/useApiError'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useUndoableDelete } from '@/hooks/useUndoableDelete'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { extractApiError } from '@/lib/errors'
import { calculateCycleInfo, CycleInfo, CyclePhase } from '@/lib/cycle-utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Tooltip } from '@/components/Tooltip'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { statisticsService } from '@/lib/statistics-service'
import { WorkoutType, Workout, WorkoutFormData, Tag, Exercise } from '@/types/workout'
import { EventType, Event, EventFormData, isRangeEventType } from '@/types/event'
import TrainingTypeFilter from '@/components/TrainingTypeFilter'
import AuthGuard from '@/components/AuthGuard'
import EnhancedWorkoutForm from '@/components/EnhancedWorkoutForm'
import { dayNumberToLocalDate, localDayNumber, storedDayNumber, toLocalDateString, toStoredDateString } from '@/lib/date-utils'
import EventForm from '@/components/EventForm'
import QuickLogModal, { QuickLogData } from '@/components/QuickLogModal'
import { PlanImportSheet } from '@/components/PlanImportSheet'
import { PlannedSession } from '@/types/plan'
import {
  BottomSheet,
  Button,
  Card,
  ChoiceChip,
  EVENT_TYPE_META,
  eventTypeMeta,
  Icon,
  IconName,
  Overline,
  PhaseBadge,
  phaseBandBg,
  phaseSolidBg,
  phaseTranslationKey,
  SegmentedControl,
  workoutBg,
  workoutText,
  WorkoutIcon,
} from '@/components/ui'

type ViewMode = 'week' | 'month'

const WORKOUT_TYPES: { type: WorkoutType; key: string }[] = [
  { type: 'BOULDERING', key: 'bouldering' },
  { type: 'LEAD_ARTIFICIAL', key: 'leadArtificial' },
  { type: 'LEAD_ROCK', key: 'leadRock' },
  { type: 'GYM', key: 'gym' },
  { type: 'CIRCUITS', key: 'circuits' },
  { type: 'FINGERBOARD', key: 'fingerboard' },
  { type: 'MENTAL_PRACTICE', key: 'mentalPractice' },
]

const workoutMeta = (type: WorkoutType) => WORKOUT_TYPES.find(w => w.type === type)

// Outlined badge in the event colour (DESIGN.md "Event markers")
const EVENT_TYPES = (Object.keys(EVENT_TYPE_META) as EventType[]).map(type => ({ type, ...EVENT_TYPE_META[type] }))
const eventMeta = eventTypeMeta

const PHASES: CyclePhase[] = ['menstrual', 'follicular', 'ovulation', 'early-luteal', 'late-luteal']

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Day N of M for a trip or deload spanning several days (null for other events)
const getTripDay = (event: Event, date: Date) => {
  if (!isRangeEventType(event.type) || !event.tripStartDate || !event.tripEndDate) return null
  if (event.type === 'TRIP' && !event.destination) return null
  // Range is stored as UTC midnight, the cell date is local midnight: compare day numbers
  const tripStart = storedDayNumber(event.tripStartDate)
  // Inclusive of both start and end dates
  const totalDays = storedDayNumber(event.tripEndDate) - tripStart + 1
  // 1-based
  const currentDay = localDayNumber(date) - tripStart + 1
  return { currentDay, totalDays }
}

function EventBadge({ type, size = 'sm' }: { type: EventType; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'size-5 rounded-md' : 'size-9 rounded-xl'
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center border-[1.5px] bg-uc-elevated ${eventMeta(type).border} ${eventMeta(type).text} ${sizeClass}`}
    >
      <Icon name={eventMeta(type).icon} size={size === 'sm' ? 12 : 18} />
    </span>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: (e: React.MouseEvent) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-base text-uc-text-muted transition-colors hover:bg-uc-elevated hover:text-uc-text"
    >
      {children}
    </button>
  )
}

// A process goal marked achieved or a project goal marked completed in this workout
const hasAchievedGoal = (workout: Workout) =>
  !!workout.mentalState?.processGoals?.some(pg => pg.achieved) ||
  !!workout.mentalState?.projectGoals?.some(pg => pg.completed)

interface WorkoutRowProps {
  workout: Workout
  t: (key: string) => string
  onEdit: (workout: Workout, e: React.MouseEvent) => void
  onDuplicate: (workout: Workout, e: React.MouseEvent) => void
}

function WorkoutRow({ workout, t, onEdit, onDuplicate }: WorkoutRowProps) {
  const details = workout.details as any
  const meta = workoutMeta(workout.type)
  const info = [
    workout.type === 'GYM' && details?.routineVariation
      ? `${details.routineVariation.routineName} — ${details.routineVariation.variationName}`
      : null,
    details?.routeName || null,
    workout.sector ? `${t('workouts.sector') || 'Sector'}: ${workout.sector}` : null,
    workout.notes || null,
  ].filter(Boolean)

  return (
    <div className="flex items-start gap-3 rounded-xl border border-uc-border bg-uc-surface py-1.5 pl-3 pr-1">
      <span
        aria-hidden
        className={`mt-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-uc-chip-ink ${workoutBg[workout.type]}`}
      >
        <WorkoutIcon workoutType={workout.type} size={18} />
      </span>
      <div className="min-w-0 flex-1 py-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-extrabold text-uc-text">
            {meta ? t(`training.types.${meta.key}`) : workout.type}
          </span>
          {hasAchievedGoal(workout) && (
            <span className="inline-flex min-h-6 items-center gap-1 rounded-lg bg-uc-success-bg px-2 text-xs font-bold text-uc-success">
              <Icon name="achieved" size={14} />
              {t('strongMind.goalAchieved')}
            </span>
          )}
        </div>
        {info.length > 0 && (
          <p className="mt-0.5 line-clamp-2 text-[13px] text-uc-text-muted">{info.join(' · ')}</p>
        )}
      </div>
      <IconButton
        label={t('common.edit') || 'Edit'}
        onClick={(e) => {
          e.stopPropagation()
          onEdit(workout, e)
        }}
      >
        <Icon name="edit" />
      </IconButton>
      <IconButton
        label={t('workouts.duplicate') || 'Duplicate workout'}
        onClick={(e) => {
          e.stopPropagation()
          onDuplicate(workout, e)
        }}
      >
        <Icon name="duplicate" />
      </IconButton>
    </div>
  )
}

function EventRow({ event, date, t, onClick }: { event: Event; date: Date; t: (key: string) => string; onClick: (event: Event, e: React.MouseEvent) => void }) {
  const tripDay = getTripDay(event, date)
  const dayOfRange = tripDay ? `${tripDay.currentDay}/${tripDay.totalDays}` : null
  const title = event.type === 'DELOAD'
    ? dayOfRange ?? event.title
    : tripDay ? `${event.destination} ${dayOfRange}` : event.title
  const subtitle = event.type === 'TRIP' ? (tripDay ? event.title : event.destination) : event.description

  return (
    <button
      type="button"
      onClick={(e) => onClick(event, e)}
      className="flex w-full items-center gap-3 rounded-xl border border-uc-border bg-uc-surface py-2 pl-3 pr-1 text-left transition-colors hover:border-uc-primary"
    >
      <EventBadge type={event.type} size="md" />
      <span className="min-w-0 flex-1 py-1">
        <span className="block text-[15px] font-extrabold text-uc-text">
          {t(`events.types.${eventMeta(event.type).key}`)} · <span className="uc-num">{title}</span>
        </span>
        {subtitle && <span className="mt-0.5 block line-clamp-2 text-[13px] text-uc-text-muted">{subtitle}</span>}
      </span>
      <span aria-hidden className="inline-flex size-11 shrink-0 items-center justify-center text-uc-text-muted">
        <Icon name="edit" />
      </span>
    </button>
  )
}

// "Today" / "Tomorrow" / "In N days"; a trip already under way counts as today
function daysUntil(start: string, end: string, t: (key: string, params?: Record<string, string | number>) => string) {
  const todayStr = toLocalDateString(new Date())
  if (start <= todayStr && todayStr <= end) return t('calendar.today')
  const days = Math.round((new Date(`${start}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime()) / 86400000)
  return days === 1 ? t('calendar.tomorrow') : t('calendar.inDays', { count: days })
}

interface UpcomingEventRowProps {
  event: Event
  start: string
  end: string
  t: (key: string, params?: Record<string, string | number>) => string
  locale: string
  onClick: (event: Event, e: React.MouseEvent) => void
}

function UpcomingEventRow({ event, start, end, t, locale, onClick }: UpcomingEventRowProps) {
  const formatDay = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  const dates = start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`
  // Deload's title is just "Deload", so the type label alone is enough
  const title = event.type === 'TRIP' && event.destination ? event.destination : event.type === 'DELOAD' ? null : event.title

  return (
    <button
      type="button"
      onClick={(e) => onClick(event, e)}
      className="flex w-full items-center gap-3 rounded-xl border border-uc-border bg-uc-surface py-2 pl-3 pr-3 text-left transition-colors hover:border-uc-primary"
    >
      <EventBadge type={event.type} size="md" />
      <span className="min-w-0 flex-1 py-1">
        <span className="block truncate text-[15px] font-extrabold text-uc-text">
          {t(`events.types.${eventMeta(event.type).key}`)}{title && ` · ${title}`}
        </span>
        <span className="mt-0.5 block text-[13px] text-uc-text-muted uc-num">{dates}</span>
      </span>
      <span className="shrink-0 text-[13px] font-bold text-uc-primary uc-num">{daysUntil(start, end, t)}</span>
    </button>
  )
}

interface PlanRowProps {
  plan: PlannedSession
  missed: boolean
  t: (key: string) => string
  onLog: (plan: PlannedSession) => void
  onDelete: (plan: PlannedSession) => void
}

/** A planned session not logged yet: dashed outline, "Log" opens the workout form prefilled from the plan. */
function PlanRow({ plan, missed, t, onLog, onDelete }: PlanRowProps) {
  const meta = plan.type ? workoutMeta(plan.type) : null
  const typeLabel = meta ? t(`training.types.${meta.key}`) : t('plans.planned')
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-uc-text-muted bg-uc-surface py-1.5 pl-3 pr-1">
      <span
        aria-hidden
        className={`mt-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-current ${plan.type ? workoutText[plan.type] : 'text-uc-text-muted'}`}
      >
        {plan.type ? <WorkoutIcon workoutType={plan.type} size={16} /> : <Icon name="calendar" size={16} />}
      </span>
      <div className="min-w-0 flex-1 py-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[15px] font-extrabold text-uc-text">{plan.title || typeLabel}</span>
          <span className={`inline-flex min-h-6 items-center rounded-lg px-2 text-xs font-bold ${missed ? 'bg-uc-warning-bg text-uc-warning' : 'bg-uc-elevated text-uc-text-muted'}`}>
            {missed ? t('plans.missed') : t('plans.planned')}
            {plan.trainingVolume && ` · ${plan.trainingVolume}`}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] text-uc-text-muted">
          {[plan.title ? typeLabel : null, plan.notes].filter(Boolean).join(' · ')}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onLog(plan)
        }}
        className="mt-1 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-uc-input bg-uc-primary px-3 text-sm font-bold text-uc-on-primary hover:brightness-110"
      >
        <Icon name="plus" size={16} />
        {t('plans.log')}
      </button>
      <IconButton
        label={t('plans.delete') || 'Remove from plan'}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(plan)
        }}
      >
        <Icon name="delete" />
      </IconButton>
    </div>
  )
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
  const { t, tPlural, language } = useLanguage()
  const { handleError, showSuccess } = useApiError()
  const confirmation = useConfirmation()
  const undoableDelete = useUndoableDelete()
  const { getToken } = useCsrfToken()
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
  const [showWorkouts, setShowWorkouts] = useState(true)
  const [showEvents, setShowEvents] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showAddChoice, setShowAddChoice] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [duplicatingWorkout, setDuplicatingWorkout] = useState<Workout | null>(null)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [isSubmittingQuickLog, setIsSubmittingQuickLog] = useState(false)
  const [plans, setPlans] = useState<PlannedSession[]>([])
  const [loggingPlan, setLoggingPlan] = useState<PlannedSession | null>(null)
  const [showPlanImport, setShowPlanImport] = useState(false)

  // Fetch workouts, events, tags, and exercises
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Calendar needs all data, so use a large limit
        const [workoutsResponse, eventsResponse, tagsResponse, exercisesResponse] = await Promise.all([
          fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' }),
          fetch('/api/events?page=1&limit=1000', { credentials: 'include' }),
          fetch('/api/tags', { credentials: 'include' }),
          fetch('/api/exercises', { credentials: 'include' })
        ])
        
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json()
          // Handle both new paginated format and old format
          setWorkouts(workoutsData.workouts || workoutsData)
        }
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          // Handle both new paginated format and old format
          setEvents(eventsData.events || eventsData)
        }

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          setAvailableTags(tagsData)
        }

        if (exercisesResponse.ok) {
          const exercisesData = await exercisesResponse.json()
          setAvailableExercises(exercisesData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    fetchPlans()
  }, [])

  // Planned sessions load on their own, so the calendar works if they fail
  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans', { credentials: 'include' })
      if (response.ok) setPlans(await response.json())
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  // Today's "Log it" links here with ?plan=<id>: open that plan's form once plans are loaded
  useEffect(() => {
    const planId = new URLSearchParams(window.location.search).get('plan')
    if (!planId || plans.length === 0) return
    const plan = plans.find(p => p.id === planId)
    window.history.replaceState(null, '', window.location.pathname)
    if (plan && plan.workouts.length === 0) handleLogPlan(plan)
  }, [plans])

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
    if (!Array.isArray(workouts) || !showWorkouts) return []
    // Cells are local dates; toISOString() would give the previous day ahead of UTC
    const dateStr = toLocalDateString(date)
    let filteredWorkouts = workouts.filter(workout => workout.startTime.startsWith(dateStr))
    
    // Apply type filter
    if (selectedTypes.length > 0) {
      filteredWorkouts = filteredWorkouts.filter(workout => selectedTypes.includes(workout.type))
    }
    
    return filteredWorkouts
  }

  // Planned sessions not logged yet; same workout filters as the logged ones
  const getPlansForDate = (date: Date) => {
    if (!showWorkouts) return []
    const dateStr = toLocalDateString(date)
    return plans.filter(plan =>
      plan.workouts.length === 0 &&
      toStoredDateString(plan.date) === dateStr &&
      (selectedTypes.length === 0 || (plan.type && selectedTypes.includes(plan.type)))
    )
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    if (!showEvents) return []
    const dateStr = toLocalDateString(date)
    let filteredEvents = events.filter(event => {
      // Handle both date formats: "2025-10-24" and "2025-10-24T00:00:00.000Z"
      const eventDateStr = event.date.includes('T') 
        ? event.date.slice(0, 10) 
        : event.date
      
      // For trips and deloads, check if the date falls within the date range
      if (isRangeEventType(event.type) && event.tripStartDate && event.tripEndDate) {
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

  // Next events from today on (trips while they last), with the same filters as the calendar
  const upcomingEvents = useMemo(() => {
    if (!showEvents) return []
    const todayStr = toLocalDateString(new Date())
    const day = (value?: string) => (value ? value.slice(0, 10) : '')
    return events
      .map(event => {
        const isTrip = isRangeEventType(event.type) && event.tripStartDate && event.tripEndDate
        return {
          event,
          start: isTrip ? day(event.tripStartDate) : day(event.date),
          end: isTrip ? day(event.tripEndDate) : day(event.date),
        }
      })
      .filter(({ event, end }) =>
        end >= todayStr && (selectedEventTypes.length === 0 || selectedEventTypes.includes(event.type)))
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5)
  }, [events, showEvents, selectedEventTypes])

  // Get cycle info for a specific date
  const getCycleInfoForDate = (date: Date) => {
    if (!isCycleTrackingEnabled || !cycleSettings) return null
    return calculateCycleInfo(cycleSettings, date)
  }

  // Calculate injury statistics by phase (all injuries from the beginning, no time filtering)
  const injuryStats = useMemo(() => {
    if (!isCycleTrackingEnabled || !cycleSettings || events.length === 0) return null
    
    // Filter all INJURY events (no time filtering - count from the beginning)
    const injuryEvents = events.filter(e => e.type === 'INJURY')
    if (injuryEvents.length === 0) return null

    // Calculate stats for all injuries
    return statisticsService.calculateInjuryCycleStats(injuryEvents, cycleSettings)
  }, [events, cycleSettings, isCycleTrackingEnabled])

  // Navigation functions
  // setMonth overflows on the 29th-31st (Jan 31 + 1 month = Mar 3), so clamp
  // the day to the target month's length.
  const shiftMonth = (date: Date, delta: number) => {
    const target = new Date(date.getFullYear(), date.getMonth() + delta, 1, date.getHours(), date.getMinutes())
    const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
    target.setDate(Math.min(date.getDate(), daysInTarget))
    return target
  }

  const navigatePrevious = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      setCurrentDate(shiftMonth(currentDate, -1))
    }
  }

  const navigateNext = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      setCurrentDate(shiftMonth(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setEditingWorkout(null)
    setEditingEvent(null)
    setDuplicatingWorkout(null)
    setShowAddChoice(true)
  }

  const handleAddWorkout = () => {
    setShowAddChoice(false)
    setShowWorkoutForm(true)
  }

  const handleAddEvent = () => {
    setShowAddChoice(false)
    setShowEventForm(true)
  }

  const handleQuickLog = () => {
    setShowAddChoice(false)
    setShowQuickLog(true)
  }

  const handleWorkoutClick = async (workout: Workout, e: React.MouseEvent) => {
    e.stopPropagation()
    // Open workout form for editing - fetch full workout data including exercises and hangs
    try {
      const response = await fetch(`/api/workouts/${workout.id}`)
      if (response.ok) {
        const fullWorkout = await response.json()
        // Map workoutTags to tags format expected by the form
        const workoutForEdit: any = {
          ...fullWorkout,
          id: fullWorkout.id,
          startTime: fullWorkout.startTime,
          type: fullWorkout.type,
          userId: fullWorkout.userId,
          createdAt: fullWorkout.createdAt,
          updatedAt: fullWorkout.updatedAt,
          tags: fullWorkout.workoutTags?.map((wt: any) => wt.tag) || [],
          workoutExercises: fullWorkout.workoutExercises || [],
          fingerboardHangs: fullWorkout.fingerboardHangs || [],
        }
        setEditingWorkout(workoutForEdit)
        setDuplicatingWorkout(null) // Clear duplicating state
        setSelectedDate(new Date(workout.startTime))
        setShowWorkoutForm(true)
      } else {
        alert(t('workouts.errors.loadWorkoutDetailsFailed') || 'Failed to load workout details')
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
      alert(t('workouts.errors.loadWorkoutDetailsError') || 'Error loading workout details')
    }
  }

  const handleDuplicateWorkout = async (workout: Workout, e: React.MouseEvent) => {
    e.stopPropagation()
    // Fetch full workout data including exercises and hangs
    try {
      const response = await fetch(`/api/workouts/${workout.id}`)
      if (response.ok) {
        const fullWorkout = await response.json()
        setDuplicatingWorkout(fullWorkout)
        // Set selected date to today (user can change it in the form)
        setSelectedDate(new Date())
        setShowWorkoutForm(true)
      } else {
        alert(t('workouts.errors.loadWorkoutDetailsFailed') || 'Failed to load workout details')
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
      alert(t('workouts.errors.loadWorkoutDetailsError') || 'Error loading workout details')
    }
  }



  const handleCreateTag = async (name: string, color: string) => {
    try {
      const csrfToken = await getToken()
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ name, color }),
      })
      if (response.ok) {
        const newTag = await response.json()
        setAvailableTags([...availableTags, newTag])
        return newTag
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const handleCreateExercise = async (name: string, category?: string, defaultUnit?: string): Promise<Exercise> => {
    const csrfToken = await getToken()
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({ name, category, defaultUnit: defaultUnit || 'kg' }),
    })
    if (response.ok) {
      const newExercise = await response.json()
      setAvailableExercises([...availableExercises, newExercise])
      return newExercise
    }
    throw new Error('Failed to create exercise')
  }

  const handleWorkoutSubmit = async (workoutData: WorkoutFormData) => {
    setIsSubmitting(true)
    try {
      // Determine if we're editing or creating
      const isEditing = editingWorkout && editingWorkout.id
      const url = isEditing ? `/api/workouts/${editingWorkout.id}` : '/api/workouts'
      const method = isEditing ? 'PUT' : 'POST'

      const csrfToken = await getToken()
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        showSuccess(isEditing ? 'Workout updated successfully' : 'Workout created successfully')
        // Refresh workouts
        const workoutsResponse = await fetch('/api/workouts?page=1&limit=1000')
        if (workoutsResponse.ok) {
          const data = await workoutsResponse.json()
          const workoutsData = Array.isArray(data) ? data : (data.workouts || [])
          setWorkouts(workoutsData)
        }
        if (loggingPlan) fetchPlans()
        setShowWorkoutForm(false)
        setEditingWorkout(null)
        setDuplicatingWorkout(null)
        setLoggingPlan(null)
        setSelectedDate(null)
      } else {
        const error = await extractApiError(response)
        handleError(error, `Failed to ${isEditing ? 'update' : 'create'} workout`)
      }
    } catch (error) {
      handleError(error, 'Failed to save workout')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelWorkoutForm = () => {
    setShowWorkoutForm(false)
    setEditingWorkout(null)
    setDuplicatingWorkout(null)
    setLoggingPlan(null)
    setSelectedDate(null)
  }

  const handleLogPlan = (plan: PlannedSession) => {
    setShowAddChoice(false)
    setEditingWorkout(null)
    setDuplicatingWorkout(null)
    setLoggingPlan(plan)
    setSelectedDate(dayNumberToLocalDate(storedDayNumber(plan.date)))
    setShowWorkoutForm(true)
  }

  const handleDeletePlan = (plan: PlannedSession) => {
    confirmation.showConfirmation(
      {
        title: t('plans.deleteConfirmTitle') || 'Remove planned session?',
        message: t('plans.deleteConfirm') || 'It is removed from your plan. Logged workouts are not affected.',
        variant: 'danger',
      },
      () => {
        undoableDelete({
          url: `/api/plans/${plan.id}`,
          item: plan,
          setItems: setPlans,
          message: t('plans.deletedUndo') || 'Planned session removed',
          errorFallback: 'Failed to remove planned session',
        })
      }
    )
  }

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingEvent(event)
    setSelectedDate(new Date(event.date))
    setShowEventForm(true)
  }

  const handleEventSubmit = async (eventData: EventFormData) => {
    setIsSubmitting(true)
    try {
      const isEditing = editingEvent && editingEvent.id
      const url = isEditing ? `/api/events/${editingEvent.id}` : '/api/events'
      const method = isEditing ? 'PUT' : 'POST'

      const csrfToken = await getToken()
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        showSuccess(isEditing ? 'Event updated successfully' : 'Event created successfully')
        // Refresh events
        const eventsResponse = await fetch('/api/events?page=1&limit=1000', {
          credentials: 'include',
        })
        if (eventsResponse.ok) {
          const data = await eventsResponse.json()
          const eventsData = Array.isArray(data) ? data : (data.events || [])
          setEvents(eventsData)
        }
        setShowEventForm(false)
        setEditingEvent(null)
        setSelectedDate(null)
      } else {
        const error = await extractApiError(response)
        handleError(error, `Failed to ${isEditing ? 'update' : 'create'} event`)
      }
    } catch (error) {
      handleError(error, 'Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEventForm = () => {
    setShowEventForm(false)
    setEditingEvent(null)
    setSelectedDate(null)
  }

  // "Delete workout" in the edit form
  const deleteWorkout = (id: string) => {
    confirmation.showConfirmation(
      {
        title: t('workouts.deleteConfirmTitle') || 'Delete Workout',
        message: t('workouts.deleteConfirm') || 'Are you sure you want to delete this workout? This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        const workout = workouts.find((w) => w.id === id)
        if (!workout) return
        undoableDelete({
          url: `/api/workouts/${id}`,
          item: workout,
          setItems: setWorkouts,
          message: t('workouts.deletedUndo') || 'Workout deleted',
          errorFallback: 'Failed to delete workout',
        })
      }
    )
  }

  // "Delete event" in the edit form (decision 49)
  const deleteEvent = (id: string) => {
    confirmation.showConfirmation(
      {
        title: t('events.deleteConfirmTitle') || 'Delete Event',
        message: t('events.deleteConfirm') || 'Are you sure you want to delete this event? This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        const event = events.find((e) => e.id === id)
        if (!event) return
        undoableDelete({
          url: `/api/events/${id}`,
          item: event,
          setItems: setEvents,
          message: t('events.deletedUndo') || 'Event deleted',
          errorFallback: 'Failed to delete event',
        })
      }
    )
  }


  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'

  const weekdayLabels = useMemo(
    // 1 Jan 2024 was a Monday
    () => Array.from({ length: 7 }, (_, i) => capitalize(new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }))),
    [locale],
  )

  const formatDateRange = () => {
    if (viewMode === 'week') {
      const start = calendarDates[0]
      const end = calendarDates[6]
      const sameYear = end.getFullYear() === new Date().getFullYear()
      return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        ...(sameYear ? {} : { year: 'numeric' }),
      })}`
    } else {
      return capitalize(currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' }))
    }
  }

  const cycleLabel = (info: CycleInfo) =>
    `${t(`cycle.phases.${phaseTranslationKey[info.phase]}`)} · ${t('calendar.cycleDayShort', { day: info.currentDay })}`

  // statisticsService names phases in camelCase ('earlyLuteal'), cycle info in kebab-case ('early-luteal')
  const isInjuryRiskDay = (info: CycleInfo | null) =>
    !!info && !!injuryStats?.phaseWithMostInjuries && phaseTranslationKey[info.phase] === injuryStats.phaseWithMostInjuries

  const injuryRiskText =
    t('workouts.tooltips.injuryPhaseWarning') ||
    'This phase has the highest number of injuries in your history. Be extra cautious and consider adjusting training intensity during this phase.'

  const activeFilterCount = selectedTypes.length + selectedEventTypes.length + (showWorkouts ? 0 : 1) + (showEvents ? 0 : 1)

  const resetFilters = () => {
    setShowWorkouts(true)
    setShowEvents(true)
    setSelectedTypes([])
    setSelectedEventTypes([])
  }

  if (loading) {
    return <LoadingSpinner message={t('calendar.loading')} fullScreen />
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const isTodayDate = (date: Date) => typeof window !== 'undefined' && date.toDateString() === new Date().toDateString()

  const openAddForToday = () => {
    setSelectedDate(new Date())
    setEditingWorkout(null)
    setEditingEvent(null)
    setDuplicatingWorkout(null)
    setShowAddChoice(true)
  }

  const closeDaySheet = () => {
    setShowAddChoice(false)
    setSelectedDate(null)
  }

  // Actions from the day sheet close it first, then open the form
  const editFromSheet = (workout: Workout, e: React.MouseEvent) => {
    setShowAddChoice(false)
    handleWorkoutClick(workout, e)
  }
  const duplicateFromSheet = (workout: Workout, e: React.MouseEvent) => {
    setShowAddChoice(false)
    handleDuplicateWorkout(workout, e)
  }
  const editEventFromSheet = (event: Event, e: React.MouseEvent) => {
    setShowAddChoice(false)
    handleEventClick(event, e)
  }

  const weeks = Array.from({ length: Math.ceil(calendarDates.length / 7) }, (_, i) => calendarDates.slice(i * 7, i * 7 + 7))

  const sheetDate = showAddChoice ? selectedDate : null
  const sheetCycleInfo = sheetDate ? getCycleInfoForDate(sheetDate) : null
  const sheetWorkouts = sheetDate ? getWorkoutsForDate(sheetDate) : []
  const sheetPlans = sheetDate ? getPlansForDate(sheetDate) : []
  const sheetEvents = sheetDate ? getEventsForDate(sheetDate) : []

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-[28px] font-extrabold leading-tight text-uc-text">
            {t('calendar.title')}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(true)}
              aria-label={`${t('common.filter')}${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
              title={t('common.filter')}
              className="relative"
            >
              <Icon name="filter" />
              {activeFilterCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-uc-pill bg-uc-accent px-1 text-[11px] font-extrabold text-uc-on-accent uc-num"
                >
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPlanImport(true)}
              aria-label={t('plans.importTitle') || 'Import training plan'}
              title={t('plans.importTitle') || 'Import training plan'}
            >
              <Icon name="download" />
            </Button>
            <Button variant="accent" size="icon" onClick={openAddForToday} aria-label={t('common.add') || 'Add'} title={t('common.add') || 'Add'}>
              <Icon name="plus" />
            </Button>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
          <div>
            {/* View + Today */}
            <div className="flex items-center gap-2">
              <SegmentedControl<ViewMode>
                className="flex-1"
                ariaLabel={t('calendar.title')}
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: 'week', label: t('common.week') },
                  { value: 'month', label: t('common.month') },
                ]}
              />
              <Button variant="ghost" onClick={goToToday} className="min-h-[54px]">
                {t('common.today')}
              </Button>
            </div>

            {/* Navigation */}
            <div className="my-4 flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={navigatePrevious} aria-label={t('common.previous')}>
                <Icon name="chevron-left" />
              </Button>
              <h2 className="flex-1 text-center text-lg font-extrabold text-uc-text uc-num">
                {formatDateRange()}
              </h2>
              <Button variant="ghost" size="icon" onClick={navigateNext} aria-label={t('common.next')}>
                <Icon name="chevron-right" />
              </Button>
            </div>

            {viewMode === 'month' ? (
              <div>
                {/* Day headers */}
                <div className="mb-1 grid grid-cols-7">
                  {weekdayLabels.map((day) => (
                    <div key={day} className="py-1 text-center text-[13px] font-semibold text-uc-text-muted">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Weeks: no horizontal gap so the phase band reads as one strip */}
                <div className="space-y-1.5">
                  {weeks.map((week, weekIndex) => {
                    const infos = week.map(getCycleInfoForDate)
                    const phaseAt = (i: number) => infos[i]?.phase ?? null
                    return (
                      <div key={weekIndex} className="grid grid-cols-7">
                        {week.map((date, i) => {
                          const cycleInfo = infos[i]
                          const phase = phaseAt(i)
                          const roundLeft = i === 0 || phaseAt(i - 1) !== phase
                          const roundRight = i === 6 || phaseAt(i + 1) !== phase
                          const predicted = !!phase && date > todayStart
                          const dayWorkouts = getWorkoutsForDate(date)
                          const dayPlans = getPlansForDate(date)
                          const dayEvents = getEventsForDate(date)
                          const badgeEvent = dayEvents.find(e => !isRangeEventType(e.type))
                          const goalAchieved = dayWorkouts.some(hasAchievedGoal)
                          const hasTrip = dayEvents.some(e => e.type === 'TRIP')
                          const hasDeload = dayEvents.some(e => e.type === 'DELOAD')
                          const isToday = isTodayDate(date)
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth()

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleDateClick(date)}
                              aria-label={
                                date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }) +
                                (goalAchieved ? `, ${t('strongMind.goalAchieved')}` : '')
                              }
                              aria-current={isToday ? 'date' : undefined}
                              className="relative flex min-h-[62px] flex-col items-center focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-uc-primary"
                            >
                              <span
                                aria-hidden
                                className={`absolute inset-0 ${phase ? phaseBandBg[phase] : 'bg-uc-surface'} ${predicted ? 'opacity-50' : ''} ${roundLeft ? 'rounded-l-xl' : ''} ${roundRight ? 'rounded-r-xl' : ''}`}
                              />
                              {isToday && <span aria-hidden className="absolute inset-1 rounded-xl border-2 border-uc-text" />}
                              {hasTrip && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-uc-success" />}
                              {/* Deload: dashed line (above the trip line when both) */}
                              {hasDeload && (
                                <span aria-hidden className={`absolute inset-x-0 border-t-[3px] border-dashed border-uc-tag-5 ${hasTrip ? 'bottom-[4px]' : 'bottom-0'}`} />
                              )}
                              {isInjuryRiskDay(cycleInfo) && (
                                <Icon name="injury-risk" size={12} className="absolute left-1 top-1 text-uc-warning" />
                              )}
                              {badgeEvent && (
                                <span className="absolute right-0.5 top-0.5">
                                  <EventBadge type={badgeEvent.type} />
                                </span>
                              )}
                              <span
                                className={`relative mt-2 text-[17px] uc-num ${
                                  isCurrentMonth ? 'font-extrabold text-uc-text' : 'font-semibold text-uc-text-muted'
                                }`}
                              >
                                {date.getDate()}
                              </span>
                              <span aria-hidden className="relative mb-2.5 mt-auto flex h-[7px] items-center gap-[3px]">
                                {goalAchieved && <Icon name="achieved" size={11} className="text-uc-success" />}
                                {dayWorkouts.slice(0, 3).map((workout) => (
                                  <span key={workout.id} className={`size-[7px] rounded-full ${workoutBg[workout.type]}`} />
                                ))}
                                {/* Planned: hollow dot in the type colour */}
                                {dayPlans.slice(0, Math.max(0, 3 - dayWorkouts.length)).map((plan) => (
                                  <span key={plan.id} className={`size-[7px] rounded-full border-[1.5px] border-current ${plan.type ? workoutText[plan.type] : 'text-uc-text-muted'}`} />
                                ))}
                                {dayWorkouts.length + dayPlans.length > 3 && (
                                  <span className="text-[9px] font-extrabold leading-none text-uc-text-muted">+</span>
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Week: one card per day, stacked */
              <div className="space-y-3">
                {calendarDates.map((date, index) => {
                  const cycleInfo = getCycleInfoForDate(date)
                  const dayWorkouts = getWorkoutsForDate(date)
                  const dayPlans = getPlansForDate(date)
                  const dayEvents = getEventsForDate(date)
                  const isToday = isTodayDate(date)

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`cursor-pointer rounded-uc-card p-3 transition-colors ${
                        cycleInfo ? phaseBandBg[cycleInfo.phase] : 'border border-uc-border bg-uc-surface hover:border-uc-primary'
                      } ${isToday ? 'ring-2 ring-uc-text' : ''}`}
                    >
                      <div className="flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1 px-1">
                        <span className="text-[15px] font-extrabold text-uc-text uc-num">
                          {capitalize(date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' }))}
                        </span>
                        {cycleInfo && (
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-uc-text-muted uc-num">
                            <span aria-hidden className={`size-2 rounded-full ${phaseSolidBg[cycleInfo.phase]}`} />
                            {cycleLabel(cycleInfo)}
                          </span>
                        )}
                        {isInjuryRiskDay(cycleInfo) && (
                          <Tooltip content={injuryRiskText} position="top" className="ml-auto" tapToOpen={false}>
                            <span className="inline-flex min-h-6 cursor-help items-center gap-1 rounded-lg bg-uc-warning-bg px-2 text-xs font-bold text-uc-warning">
                              <Icon name="injury-risk" size={14} />
                              {t('calendar.injuryRiskPhase')}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      {(dayWorkouts.length > 0 || dayPlans.length > 0 || dayEvents.length > 0) && (
                        <div className="mt-2 space-y-2">
                          {dayEvents.map((event) => (
                            <EventRow key={event.id} event={event} date={date} t={t} onClick={handleEventClick} />
                          ))}
                          {dayWorkouts.map((workout) => (
                            <WorkoutRow
                              key={workout.id}
                              workout={workout}
                              t={t}
                              onEdit={handleWorkoutClick}
                              onDuplicate={handleDuplicateWorkout}
                            />
                          ))}
                          {dayPlans.map((plan) => (
                            <PlanRow key={plan.id} plan={plan} missed={date < todayStart} t={t} onLog={handleLogPlan} onDelete={handleDeletePlan} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <Card className="mt-5 space-y-4 p-5 lg:mt-0">
            <h2 className="sr-only">{t('calendar.legend')}</h2>
            {isCycleTrackingEnabled && (
              <ul aria-label={t('calendar.cyclePhases')} className="flex flex-wrap gap-x-4 gap-y-2">
                {PHASES.map((phase) => (
                  <li key={phase} className="flex items-center gap-2 text-sm font-bold text-uc-text">
                    <span aria-hidden className={`relative h-3.5 w-6 overflow-hidden rounded ${phaseBandBg[phase]}`}>
                      <span className={`absolute inset-x-0 top-0 h-0.5 ${phaseSolidBg[phase]}`} />
                    </span>
                    {t(`cycle.phases.${phaseTranslationKey[phase]}`)}
                  </li>
                ))}
              </ul>
            )}
            <ul aria-label={t('nav.workouts')} className="flex flex-wrap gap-x-4 gap-y-2">
              {WORKOUT_TYPES.map(({ type, key }) => (
                <li key={type} className="flex items-center gap-2 text-sm text-uc-text-muted">
                  <span aria-hidden className={`size-2.5 rounded-full ${workoutBg[type]}`} />
                  {t(`training.types.${key}`)}
                </li>
              ))}
            </ul>
            <ul aria-label={t('events.title')} className="flex flex-wrap gap-x-4 gap-y-2">
              {EVENT_TYPES.map(({ type, key }) => (
                <li key={type} className="flex items-center gap-2 text-sm text-uc-text-muted">
                  <EventBadge type={type} />
                  {t(`events.types.${key}`)}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-uc-text-muted">
                <span aria-hidden className="inline-flex size-5 items-center justify-center rounded-md bg-uc-success-bg text-uc-success"><Icon name="achieved" size={12} /></span>
                {t('strongMind.goalAchieved')}
              </li>
              <li className="flex items-center gap-2 text-sm text-uc-text-muted">
                <span aria-hidden className="size-2.5 rounded-full border-[1.5px] border-uc-text-muted" />
                {t('plans.planned')}
              </li>
              {injuryStats?.phaseWithMostInjuries && (
                <li className="flex items-center gap-2 text-sm text-uc-text-muted">
                  <span aria-hidden className="inline-flex size-5 items-center justify-center rounded-md bg-uc-warning-bg text-uc-warning"><Icon name="injury-risk" size={12} /></span>
                  {t('calendar.injuryRiskPhase')}
                </li>
              )}
            </ul>
            <p className="text-[13px] text-uc-text-muted">{t('calendar.clickDateHint')}</p>
          </Card>

          {/* Upcoming events */}
          <section className="mt-5">
            <h2 className="mb-2 text-[17px] font-extrabold text-uc-text">{t('calendar.upcoming')}</h2>
            {upcomingEvents.length === 0 ? (
              <p className="rounded-uc-card border border-dashed border-uc-border px-4 py-5 text-center text-sm text-uc-text-muted">
                {t('calendar.noUpcoming')}
              </p>
            ) : (
              <ul className="space-y-2">
                {upcomingEvents.map(({ event, start, end }) => (
                  <li key={event.id}>
                    <UpcomingEventRow event={event} start={start} end={end} t={t} locale={locale} onClick={handleEventClick} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Filters */}
        <BottomSheet
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          title={t('common.filter')}
          closeLabel={t('common.close')}
          footer={
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={resetFilters} disabled={activeFilterCount === 0}>
                {t('calendar.resetFilters') || 'Reset'}
              </Button>
              <Button variant="primary" size="lg" className="flex-1" onClick={() => setShowFilters(false)}>
                {t('calendar.showResults') || 'Show results'}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <div className="divide-y divide-uc-border">
              {([
                { id: 'filter-show-workouts', label: t('calendar.showWorkouts') || 'Show workouts', checked: showWorkouts, onChange: setShowWorkouts },
                { id: 'filter-show-events', label: t('calendar.showEvents') || 'Show events', checked: showEvents, onChange: setShowEvents },
              ]).map((row) => (
                <label key={row.id} htmlFor={row.id} className="flex min-h-12 cursor-pointer items-center justify-between gap-3 text-[15px] font-bold text-uc-text">
                  {row.label}
                  <input
                    id={row.id}
                    type="checkbox"
                    checked={row.checked}
                    onChange={(e) => row.onChange(e.target.checked)}
                    className="size-6 shrink-0 cursor-pointer accent-uc-primary"
                  />
                </label>
              ))}
            </div>

            {showWorkouts && (
              <TrainingTypeFilter selectedTypes={selectedTypes} onTypesChange={setSelectedTypes} />
            )}

            {showEvents && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Overline>{t('calendar.filterByEventType')}</Overline>
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedEventTypes(['INJURY', 'PHYSIO', 'COMPETITION', 'TRIP', 'DELOAD', 'OTHER'])}
                      className="min-h-11 px-2 text-sm font-bold text-uc-primary hover:underline"
                    >
                      {t('calendar.filterAll')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEventTypes([])}
                      className="min-h-11 px-2 text-sm font-bold text-uc-primary hover:underline"
                    >
                      {t('calendar.filterNone')}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(({ type, key, icon }) => (
                    <ChoiceChip
                      key={type}
                      selected={selectedEventTypes.includes(type)}
                      onClick={() => {
                        if (selectedEventTypes.includes(type)) {
                          setSelectedEventTypes(selectedEventTypes.filter(t => t !== type))
                        } else {
                          setSelectedEventTypes([...selectedEventTypes, type])
                        }
                      }}
                    >
                      <Icon name={icon} size={16} />
                      {t(`events.types.${key}`)}
                    </ChoiceChip>
                  ))}
                </div>
                {selectedEventTypes.length === 0 && (
                  <p className="text-[13px] text-uc-text-muted">
                    {t('calendar.noEventTypesSelected')}
                  </p>
                )}
              </div>
            )}
          </div>
        </BottomSheet>

        {/* Day sheet: the day's workouts and events, then add choices */}
        <BottomSheet
          isOpen={!!sheetDate}
          onClose={closeDaySheet}
          title={sheetDate ? capitalize(sheetDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })) : undefined}
          closeLabel={t('common.close')}
        >
          {sheetDate && (
            <div className="space-y-4">
              {sheetCycleInfo && (
                <div className="space-y-2">
                  <PhaseBadge phase={sheetCycleInfo.phase} variant="soft" size="sm">
                    {cycleLabel(sheetCycleInfo)}
                  </PhaseBadge>
                  {isInjuryRiskDay(sheetCycleInfo) && (
                    <p className="flex gap-2 rounded-xl bg-uc-warning-bg p-3 text-[13px] text-uc-text">
                      <Icon name="injury-risk" className="text-uc-warning" />
                      {injuryRiskText}
                    </p>
                  )}
                </div>
              )}

              {(sheetWorkouts.length > 0 || sheetPlans.length > 0 || sheetEvents.length > 0) && (
                <div className="space-y-2">
                  {sheetEvents.map((event) => (
                    <EventRow key={event.id} event={event} date={sheetDate} t={t} onClick={editEventFromSheet} />
                  ))}
                  {sheetWorkouts.map((workout) => (
                    <WorkoutRow
                      key={workout.id}
                      workout={workout}
                      t={t}
                      onEdit={editFromSheet}
                      onDuplicate={duplicateFromSheet}
                    />
                  ))}
                  {sheetPlans.map((plan) => (
                    <PlanRow key={plan.id} plan={plan} missed={sheetDate < todayStart} t={t} onLog={handleLogPlan} onDelete={handleDeletePlan} />
                  ))}
                </div>
              )}

              <div>
                <Overline className="mb-1">{t('common.add') || 'Add'}</Overline>
                <p className="mb-3 text-sm text-uc-text-muted">
                  {t('workouts.addChoiceDescription') || 'What would you like to add?'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { onClick: handleQuickLog, icon: 'quick-log' as IconName, label: t('quickLog.button') || 'Quick Log', tone: 'bg-uc-primary-container text-uc-on-primary-container border-transparent' },
                    { onClick: handleAddWorkout, icon: 'workouts' as IconName, label: t('workouts.addNew') || 'Add Workout', tone: 'bg-uc-surface text-uc-text border-uc-border hover:border-uc-primary' },
                    { onClick: handleAddEvent, icon: 'calendar' as IconName, label: t('events.addNew') || 'Add Event', tone: 'bg-uc-surface text-uc-text border-uc-border hover:border-uc-primary' },
                  ]).map((choice) => (
                    <button
                      key={choice.icon}
                      type="button"
                      onClick={choice.onClick}
                      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-uc-card border p-3 text-center text-sm font-bold transition-colors ${choice.tone}`}
                    >
                      <Icon name={choice.icon} size={24} />
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </BottomSheet>

        {/* Workout Form Modal */}
        {showWorkoutForm && (
          <EnhancedWorkoutForm
            onSubmit={handleWorkoutSubmit}
            onCancel={handleCancelWorkoutForm}
            initialData={editingWorkout || duplicatingWorkout || undefined}
            onDelete={editingWorkout ? () => {
              const id = editingWorkout.id
              handleCancelWorkoutForm()
              deleteWorkout(id)
            } : undefined}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
            availableExercises={availableExercises}
            onCreateExercise={handleCreateExercise}
            defaultDate={duplicatingWorkout && selectedDate ? toLocalDateString(selectedDate) : (!editingWorkout && selectedDate ? toLocalDateString(selectedDate) : undefined)}
            isDuplicating={!!duplicatingWorkout}
            plannedSession={loggingPlan || undefined}
          />
        )}

        {/* Training plan import */}
        <PlanImportSheet
          isOpen={showPlanImport}
          onClose={() => setShowPlanImport(false)}
          onImported={(count) => {
            setShowPlanImport(false)
            showSuccess(tPlural('plans.imported', count))
            fetchPlans()
          }}
        />

        {/* Event Form Modal */}
        {showEventForm && (
          <EventForm
            onSubmit={handleEventSubmit}
            onCancel={handleCancelEventForm}
            initialData={editingEvent || undefined}
            onDelete={editingEvent ? () => {
              const id = editingEvent.id
              handleCancelEventForm()
              deleteEvent(id)
            } : undefined}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
            defaultDate={!editingEvent && selectedDate ? toLocalDateString(selectedDate) : undefined}
          />
        )}

        {/* Quick Log Modal */}
        <QuickLogModal
          isOpen={showQuickLog}
          onClose={() => setShowQuickLog(false)}
          onSubmit={async (data: QuickLogData) => {
            setIsSubmittingQuickLog(true)
            try {
              const csrfToken = await getToken()
              const response = await fetch('/api/workouts', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                  type: data.type,
                  date: data.date,
                  trainingVolume: data.trainingVolume,
                  mentalPracticeType: data.mentalPracticeType,
                  timeOfDay: data.timeOfDay,
                  notes: '',
                  details: { 
                    quickLog: true,
                    ...(data.protocolId && { protocolId: data.protocolId })
                  },
                }),
              })

              if (response.ok) {
                setShowQuickLog(false)
                // Refresh calendar data (same limit as the initial load, the API default is 50)
                const workoutsResponse = await fetch('/api/workouts?page=1&limit=1000', { credentials: 'include' })
                if (workoutsResponse.ok) {
                  const updatedWorkouts = await workoutsResponse.json()
                  const workoutsData = Array.isArray(updatedWorkouts) 
                    ? updatedWorkouts 
                    : (updatedWorkouts.workouts || [])
                  setWorkouts(workoutsData)
                }
              } else {
                const error = await response.json()
                alert(error.error || t('quickLog.errors.saveFailed') || 'Failed to save quick log')
              }
            } catch (error) {
              console.error('Error saving quick log:', error)
              alert(t('quickLog.errors.saveError') || 'Error saving quick log')
            } finally {
              setIsSubmittingQuickLog(false)
            }
          }}
          defaultDate={selectedDate || undefined}
          isSubmitting={isSubmittingQuickLog}
        />


        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={confirmation.onClose}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          variant={confirmation.variant}
        />
      </div>
    </div>
  )
}
