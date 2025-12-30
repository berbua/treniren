'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCycle } from '@/contexts/CycleContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { calculateCycleInfo } from '@/lib/cycle-utils'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { WorkoutType, Workout, WorkoutFormData, Tag, Exercise } from '@/types/workout'
import { EventType, Event, EventFormData } from '@/types/event'
import TrainingTypeFilter from '@/components/TrainingTypeFilter'
import AuthGuard from '@/components/AuthGuard'
import EnhancedWorkoutForm from '@/components/EnhancedWorkoutForm'
import EventForm from '@/components/EventForm'

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
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [recurringWorkout, setRecurringWorkout] = useState<Workout | null>(null)
  const [recurringFormData, setRecurringFormData] = useState({
    mode: 'recurring' as 'recurring' | 'duplicate',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'custom',
    customDays: 7,
    duplicateDate: new Date().toISOString().slice(0, 10),
  })

  // Fetch workouts, events, tags, and exercises
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [workoutsResponse, eventsResponse, tagsResponse, exercisesResponse] = await Promise.all([
          fetch('/api/workouts'),
          fetch('/api/events'),
          fetch('/api/tags'),
          fetch('/api/exercises')
        ])
        
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json()
          setWorkouts(workoutsData)
        }
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData)
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
        alert('Failed to load workout details')
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
      alert('Error loading workout details')
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
        setSelectedDate(new Date(workout.startTime))
        setShowWorkoutForm(true)
      } else {
        alert('Failed to load workout details')
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
      alert('Error loading workout details')
    }
  }

  const handleRecurringWorkout = (workout: Workout, e: React.MouseEvent) => {
    e.stopPropagation()
    setRecurringWorkout(workout)
    setRecurringFormData({
      mode: 'recurring',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      frequency: 'weekly',
      customDays: 7,
      duplicateDate: new Date().toISOString().slice(0, 10),
    })
    setShowRecurringModal(true)
  }

  const handleRecurringSubmit = async () => {
    if (!recurringWorkout) return

    if (recurringFormData.mode === 'duplicate') {
      // Duplicate to single date
      if (!recurringFormData.duplicateDate) {
        alert('Please select a date')
        return
      }

      setIsSubmitting(true)
      try {
        // Fetch full workout data including exercises and hangs
        const workoutResponse = await fetch(`/api/workouts/${recurringWorkout.id}`)
        if (!workoutResponse.ok) {
          alert('Failed to fetch workout details')
          return
        }
        const fullWorkout = await workoutResponse.json()

        const workoutData: WorkoutFormData = {
          type: fullWorkout.type,
          date: recurringFormData.duplicateDate,
          trainingVolume: fullWorkout.trainingVolume,
          notes: fullWorkout.notes,
          tagIds: fullWorkout.workoutTags?.map((wt: any) => wt.tagId) || [],
          exercises: fullWorkout.workoutExercises?.map((we: any) => ({
            exerciseId: we.exercise.id,
            exerciseName: we.exercise.name,
            order: we.order,
            sets: we.sets.map((s: any) => ({
              reps: s.reps || undefined,
              weight: s.weight || undefined,
              rir: s.rir || undefined,
              notes: s.notes || undefined,
            })),
          })) || undefined,
          fingerboardHangs: fullWorkout.fingerboardHangs?.map((fh: any) => ({
            order: fh.order,
            handType: fh.handType,
            gripType: fh.gripType,
            crimpSize: fh.crimpSize || undefined,
            customDescription: fh.customDescription || undefined,
            load: fh.load || undefined,
            unload: fh.unload || undefined,
            reps: fh.reps || undefined,
            timeSeconds: fh.timeSeconds || undefined,
            notes: fh.notes || undefined,
          })) || undefined,
        }

        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workoutData),
        })

        if (response.ok) {
          alert('Workout duplicated successfully!')
          // Refresh workouts
          const workoutsResponse = await fetch('/api/workouts')
          if (workoutsResponse.ok) {
            const workoutsData = await workoutsResponse.json()
            setWorkouts(workoutsData)
          }
          setShowRecurringModal(false)
          setRecurringWorkout(null)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          alert(`Failed to duplicate workout: ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error duplicating workout:', error)
        alert(`Error: ${error instanceof Error ? error.message : 'Failed to duplicate workout'}`)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Recurring workouts
      if (!recurringFormData.startDate || !recurringFormData.endDate) {
        alert('Please select both start and end dates')
        return
      }

      if (recurringFormData.frequency === 'custom' && (!recurringFormData.customDays || recurringFormData.customDays < 1)) {
        alert('Please enter a valid number of days (at least 1)')
        return
      }

      const frequency = recurringFormData.frequency === 'daily' 
        ? 'daily' 
        : recurringFormData.frequency === 'weekly' 
        ? 'weekly' 
        : recurringFormData.customDays.toString()

      createRecurringWorkouts(recurringWorkout, recurringFormData.startDate, recurringFormData.endDate, frequency)
      setShowRecurringModal(false)
      setRecurringWorkout(null)
    }
  }

  const createRecurringWorkouts = async (templateWorkout: Workout, startDateStr: string, endDateStr: string, frequency: string) => {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    const dates: Date[] = []

    if (frequency === 'daily') {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d))
      }
    } else if (frequency === 'weekly') {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
        dates.push(new Date(d))
      }
    } else {
      const days = parseInt(frequency)
      if (!isNaN(days)) {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + days)) {
          dates.push(new Date(d))
        }
      }
    }

    setIsSubmitting(true)
    try {
      // Fetch full workout data including exercises and hangs
      const workoutResponse = await fetch(`/api/workouts/${templateWorkout.id}`)
      if (!workoutResponse.ok) {
        alert('Failed to fetch workout details')
        return
      }
      const fullWorkout = await workoutResponse.json()

      // Create workouts for each date
      const promises = dates.map(async (date) => {
        const workoutData: WorkoutFormData = {
          type: fullWorkout.type,
          date: date.toISOString().slice(0, 10),
          trainingVolume: fullWorkout.trainingVolume,
          notes: fullWorkout.notes,
          tagIds: fullWorkout.workoutTags?.map((wt: any) => wt.tagId) || [],
          exercises: fullWorkout.workoutExercises?.map((we: any) => ({
            exerciseId: we.exercise.id,
            exerciseName: we.exercise.name,
            order: we.order,
            sets: we.sets.map((s: any) => ({
              reps: s.reps || undefined,
              weight: s.weight || undefined,
              rir: s.rir || undefined,
              notes: s.notes || undefined,
            })),
          })) || undefined,
          fingerboardHangs: fullWorkout.fingerboardHangs?.map((fh: any) => ({
            order: fh.order,
            handType: fh.handType,
            gripType: fh.gripType,
            crimpSize: fh.crimpSize || undefined,
            customDescription: fh.customDescription || undefined,
            load: fh.load || undefined,
            unload: fh.unload || undefined,
            reps: fh.reps || undefined,
            timeSeconds: fh.timeSeconds || undefined,
            notes: fh.notes || undefined,
          })) || undefined,
        }

        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workoutData),
        })

        if (!response.ok) {
          throw new Error(`Failed to create workout for ${date.toISOString().slice(0, 10)}`)
        }
      })

      await Promise.all(promises)
      alert(`Successfully created ${dates.length} recurring workouts!`)
      // Refresh workouts
      const workoutsResponse = await fetch('/api/workouts')
      if (workoutsResponse.ok) {
        const workoutsData = await workoutsResponse.json()
        setWorkouts(workoutsData)
      }
    } catch (error) {
      console.error('Error creating recurring workouts:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create recurring workouts'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateTag = async (name: string, color: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        // Refresh workouts
        const workoutsResponse = await fetch('/api/workouts')
        if (workoutsResponse.ok) {
          const workoutsData = await workoutsResponse.json()
          setWorkouts(workoutsData)
        }
        setShowWorkoutForm(false)
        setEditingWorkout(null)
        setDuplicatingWorkout(null)
        setSelectedDate(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to ${isEditing ? 'update' : 'create'} workout: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${editingWorkout ? 'updating' : 'creating'} workout:`, error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save workout'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelWorkoutForm = () => {
    setShowWorkoutForm(false)
    setEditingWorkout(null)
    setDuplicatingWorkout(null)
    setSelectedDate(null)
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        // Refresh events
        const eventsResponse = await fetch('/api/events')
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData)
        }
        setShowEventForm(false)
        setEditingEvent(null)
        setSelectedDate(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to ${isEditing ? 'update' : 'create'} event: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${editingEvent ? 'updating' : 'creating'} event:`, error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save event'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEventForm = () => {
    setShowEventForm(false)
    setEditingEvent(null)
    setSelectedDate(null)
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
          {/* Title - separate row */}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-uc-text-light">
              📅 {t('calendar.title')}
            </h1>
          </div>

          {/* Buttons and filters - separate row with wrapping */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={() => {
                setSelectedDate(new Date())
                setEditingEvent(null)
                setShowEventForm(true)
              }}
              className="px-4 py-2 rounded-xl font-medium transition-colors bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light border border-uc-purple/20 whitespace-nowrap"
            >
              ➕ {t('events.addNew') || 'Add Event'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                showFilters || selectedTypes.length > 0 || selectedEventTypes.length > 0
                  ? 'bg-uc-mustard text-uc-black shadow-lg'
                  : 'bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20'
              }`}
            >
              🔍 Filters {(selectedTypes.length + selectedEventTypes.length) > 0 && `(${selectedTypes.length + selectedEventTypes.length})`}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                viewMode === 'week'
                  ? 'bg-uc-mustard text-uc-black shadow-lg'
                  : 'bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20'
              }`}
            >
              {t('common.week')}
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
                viewMode === 'month'
                  ? 'bg-uc-mustard text-uc-black shadow-lg'
                  : 'bg-uc-dark-bg/50 text-uc-text-light hover:bg-uc-dark-bg border border-uc-purple/20'
              }`}
            >
              {t('common.month')}
            </button>
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
                  onClick={() => handleDateClick(date)}
                  className={`${
                    viewMode === 'week' 
                      ? 'min-h-[80px] md:min-h-[120px] p-3 md:p-2 border-b md:border-r border-uc-purple/20' 
                      : 'min-h-[120px] p-2 border-r border-b border-uc-purple/20'
                  } ${
                    !isCurrentMonth ? 'bg-uc-black/30' : ''
                  } cursor-pointer hover:bg-uc-purple/5 transition-colors relative group`}
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
                        className={`${viewMode === 'week' ? 'text-sm md:text-xs p-2 md:p-1' : 'text-xs p-1'} rounded ${getTrainingTypeColor(workout.type)} text-white ${viewMode === 'week' ? '' : 'truncate'} relative`}
                        title={`${getTrainingTypeEmoji(workout.type)} ${workout.type} - ${workout.notes || 'No notes'}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="flex-1 truncate">
                            {getTrainingTypeEmoji(workout.type)} {getTrainingTypeLabel(workout.type, t)}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleWorkoutClick(workout, e)
                              }}
                              className="text-xs bg-white/20 hover:bg-white/30 active:bg-white/40 rounded px-1.5 py-0.5 transition-colors"
                              title="Edit workout"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRecurringWorkout(workout, e)
                              }}
                              className="text-xs bg-white/20 hover:bg-white/30 active:bg-white/40 rounded px-1.5 py-0.5 transition-colors"
                              title="Duplicate or create recurring workouts"
                            >
                              🔁
                            </button>
                          </div>
                        </div>
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
                              onClick={(e) => handleEventClick(event, e)}
                              className={`${viewMode === 'week' ? 'text-sm md:text-xs p-2 md:p-1' : 'text-xs p-1'} rounded ${getEventTypeColor(event.type)} text-white ${viewMode === 'week' ? '' : 'truncate'} cursor-pointer hover:opacity-80 transition-opacity`}
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

        {/* Add Choice Modal */}
        {showAddChoice && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-uc-dark-bg rounded-2xl shadow-xl w-full max-w-md border border-uc-purple/20">
              <div className="p-6 border-b border-uc-purple/20">
                <h2 className="text-2xl font-bold text-uc-text-light mb-2">
                  Add to {selectedDate.toLocaleDateString()}
                </h2>
                <p className="text-sm text-uc-text-muted">
                  What would you like to add?
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleAddWorkout}
                    className="flex flex-col items-center p-6 bg-uc-black/50 rounded-xl border-2 border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black transition-all"
                  >
                    <span className="text-4xl mb-3">🏋️</span>
                    <span className="font-medium text-uc-text-light">Add Workout</span>
                  </button>
                  <button
                    onClick={handleAddEvent}
                    className="flex flex-col items-center p-6 bg-uc-black/50 rounded-xl border-2 border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black transition-all"
                  >
                    <span className="text-4xl mb-3">📅</span>
                    <span className="font-medium text-uc-text-light">Add Event</span>
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-uc-purple/20 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddChoice(false)
                    setSelectedDate(null)
                  }}
                  className="px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors bg-uc-dark-bg/50 hover:bg-uc-dark-bg rounded-xl border border-uc-purple/20"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workout Form Modal */}
        {showWorkoutForm && (
          <EnhancedWorkoutForm
            onSubmit={handleWorkoutSubmit}
            onCancel={handleCancelWorkoutForm}
            initialData={editingWorkout || duplicatingWorkout || undefined}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
            availableExercises={availableExercises}
            onCreateExercise={handleCreateExercise}
            defaultDate={!editingWorkout && !duplicatingWorkout && selectedDate ? selectedDate.toISOString().slice(0, 10) : undefined}
          />
        )}

        {/* Event Form Modal */}
        {showEventForm && (
          <EventForm
            onSubmit={handleEventSubmit}
            onCancel={handleCancelEventForm}
            initialData={editingEvent || undefined}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
            defaultDate={!editingEvent && selectedDate ? selectedDate.toISOString().slice(0, 10) : undefined}
          />
        )}

        {/* Recurring/Duplicate Workout Modal */}
        {showRecurringModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-md">
              <div className="p-6 border-b border-uc-purple/20">
                <h2 className="text-2xl font-bold text-uc-text-light mb-2">
                  {recurringFormData.mode === 'duplicate' ? '📋 Duplicate Workout' : '🔁 Create Recurring Workouts'}
                </h2>
                <p className="text-sm text-uc-text-muted">
                  {recurringFormData.mode === 'duplicate' 
                    ? 'Copy this workout to a specific date'
                    : 'Create multiple copies of this workout at regular intervals'}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    Action *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecurringFormData({ ...recurringFormData, mode: 'duplicate' })}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        recurringFormData.mode === 'duplicate'
                          ? 'border-uc-purple bg-uc-purple/20'
                          : 'border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black/50'
                      }`}
                    >
                      <div className="text-lg mb-1">📋</div>
                      <div className="text-sm font-medium text-uc-text-light">Duplicate to Date</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringFormData({ ...recurringFormData, mode: 'recurring' })}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        recurringFormData.mode === 'recurring'
                          ? 'border-uc-purple bg-uc-purple/20'
                          : 'border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black/50'
                      }`}
                    >
                      <div className="text-lg mb-1">🔁</div>
                      <div className="text-sm font-medium text-uc-text-light">Recurring</div>
                    </button>
                  </div>
                </div>

                {/* Duplicate Mode - Single Date */}
                {recurringFormData.mode === 'duplicate' && (
                  <div>
                    <label className="block text-sm font-medium text-uc-text-light mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={recurringFormData.duplicateDate}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, duplicateDate: e.target.value })}
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                    />
                  </div>
                )}

                {/* Recurring Mode - Start/End Dates and Frequency */}
                {recurringFormData.mode === 'recurring' && (
                  <>
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-uc-text-light mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={recurringFormData.startDate}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                        className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-uc-text-light mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={recurringFormData.endDate}
                        onChange={(e) => setRecurringFormData({ ...recurringFormData, endDate: e.target.value })}
                        min={recurringFormData.startDate}
                        className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-uc-text-light mb-2">
                        Frequency *
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 p-3 bg-uc-black/50 rounded-lg border border-uc-purple/20 hover:border-uc-purple/40 cursor-pointer">
                          <input
                            type="radio"
                            name="frequency"
                            value="daily"
                            checked={recurringFormData.frequency === 'daily'}
                            onChange={(e) => setRecurringFormData({ ...recurringFormData, frequency: 'daily' })}
                            className="text-uc-purple focus:ring-uc-purple"
                          />
                          <span className="text-uc-text-light">Daily</span>
                        </label>
                        <label className="flex items-center space-x-2 p-3 bg-uc-black/50 rounded-lg border border-uc-purple/20 hover:border-uc-purple/40 cursor-pointer">
                          <input
                            type="radio"
                            name="frequency"
                            value="weekly"
                            checked={recurringFormData.frequency === 'weekly'}
                            onChange={(e) => setRecurringFormData({ ...recurringFormData, frequency: 'weekly' })}
                            className="text-uc-purple focus:ring-uc-purple"
                          />
                          <span className="text-uc-text-light">Weekly</span>
                        </label>
                        <label className="flex items-center space-x-2 p-3 bg-uc-black/50 rounded-lg border border-uc-purple/20 hover:border-uc-purple/40 cursor-pointer">
                          <input
                            type="radio"
                            name="frequency"
                            value="custom"
                            checked={recurringFormData.frequency === 'custom'}
                            onChange={(e) => setRecurringFormData({ ...recurringFormData, frequency: 'custom' })}
                            className="text-uc-purple focus:ring-uc-purple"
                          />
                          <span className="text-uc-text-light">Every</span>
                          <input
                            type="number"
                            min="1"
                            value={recurringFormData.customDays}
                            onChange={(e) => setRecurringFormData({ ...recurringFormData, customDays: parseInt(e.target.value) || 1 })}
                            disabled={recurringFormData.frequency !== 'custom'}
                            className="w-20 bg-uc-black border border-uc-purple/30 rounded-lg px-2 py-1 text-uc-text-light focus:outline-none focus:border-uc-purple disabled:opacity-50"
                          />
                          <span className="text-uc-text-light">days</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-uc-purple/20">
                <button
                  onClick={() => {
                    setShowRecurringModal(false)
                    setRecurringWorkout(null)
                  }}
                  className="px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors bg-uc-dark-bg/50 hover:bg-uc-dark-bg rounded-xl border border-uc-purple/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecurringSubmit}
                  disabled={isSubmitting}
                  className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isSubmitting 
                    ? 'Creating...' 
                    : recurringFormData.mode === 'duplicate' 
                    ? 'Duplicate Workout' 
                    : 'Create Recurring Workouts'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
