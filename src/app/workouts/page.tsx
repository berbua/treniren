'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Workout, WorkoutFormData, Tag, Exercise } from '@/types/workout'
import { Event, EventFormData } from '@/types/event'
import { useLanguage } from '@/contexts/LanguageContext'
import { useApiError } from '@/hooks/useApiError'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { extractApiError, ValidationError } from '@/lib/errors'
import AuthGuard from '@/components/AuthGuard'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { QuickLogData } from '@/components/QuickLogModal'
import { BottomSheet, Button, EmptyState, SheetCloseButton, workoutBg, WorkoutTypeKey } from '@/components/ui'

// Dynamically import components to avoid SSR issues
const WorkoutCard = dynamic(() => import('@/components/WorkoutCard'), { ssr: false })
const EnhancedWorkoutForm = dynamic(() => import('@/components/EnhancedWorkoutForm'), { ssr: false })
const EventCard = dynamic(() => import('@/components/EventCard'), { ssr: false })
const EventForm = dynamic(() => import('@/components/EventForm'), { ssr: false })
const QuickLogModal = dynamic(() => import('@/components/QuickLogModal'), { ssr: false })
const GoalsConfigurator = dynamic(() => import('@/components/GoalsConfigurator'), { ssr: false })

export default function WorkoutsPage() {
  return (
    <AuthGuard>
      <WorkoutsPageContent />
    </AuthGuard>
  )
}

function WorkoutsPageContent() {
  const { t } = useLanguage()
  const { handleError, showSuccess } = useApiError()
  const confirmation = useConfirmation()
  const { getToken, refreshToken } = useCsrfToken()
  
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workouts' | 'events'>('workouts')
  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddChoice, setShowAddChoice] = useState(false)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [isSubmittingQuickLog, setIsSubmittingQuickLog] = useState(false)
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [showGoalsConfigurator, setShowGoalsConfigurator] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Pagination state
  const [workoutsPage, setWorkoutsPage] = useState(1)
  const [eventsPage, setEventsPage] = useState(1)
  const [workoutsPagination, setWorkoutsPagination] = useState({ total: 0, totalPages: 1, hasMore: false })
  const [eventsPagination, setEventsPagination] = useState({ total: 0, totalPages: 1, hasMore: false })
  const ITEMS_PER_PAGE = 20

  // Fetch workouts with pagination
  const fetchWorkouts = async (page: number = workoutsPage, append: boolean = false) => {
    try {
      const response = await fetch(`/api/workouts?page=${page}&limit=${ITEMS_PER_PAGE}`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        if (data.workouts && data.pagination) {
          // Ensure workouts is always an array
          const workoutsArray = Array.isArray(data.workouts) ? data.workouts : []
          if (append) {
            setWorkouts(prev => [...prev, ...workoutsArray])
          } else {
            setWorkouts(workoutsArray)
          }
          setWorkoutsPagination(data.pagination)
        } else {
          // Fallback for old API format
          setWorkouts(Array.isArray(data) ? data : [])
        }
      } else {
        // If response is not ok, ensure workouts is still an array
        setWorkouts([])
        console.error('Failed to fetch workouts:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
      // Ensure workouts is always an array even on error
      setWorkouts([])
    }
  }

  // Fetch events with pagination
  const fetchEvents = async (page: number = eventsPage, append: boolean = false) => {
    try {
      const response = await fetch(`/api/events?page=${page}&limit=${ITEMS_PER_PAGE}`)
      if (response.ok) {
        const data = await response.json()
        if (data.events && data.pagination) {
          // Ensure events is always an array
          const eventsArray = Array.isArray(data.events) ? data.events : []
          if (append) {
            setEvents(prev => [...prev, ...eventsArray])
          } else {
            setEvents(eventsArray)
          }
          setEventsPagination(data.pagination)
        } else {
          // Fallback for old API format
          setEvents(Array.isArray(data) ? data : [])
        }
      } else {
        // If response is not ok, ensure events is still an array
        setEvents([])
        console.error('Failed to fetch events:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      // Ensure events is always an array even on error
      setEvents([])
    }
  }

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  // Fetch exercises
  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setAvailableExercises(data)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  // Fetch user profile to get goals
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user-profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Save goals
  const handleSaveGoals = async (goals: { 
    weeklyGoal: number
    monthlyGoal: number | null
    useAutoMonthly: boolean
    workoutTypeGoals: { type: string; count: number }[]
  }) => {
    const csrfToken = await getToken()
    const response = await fetch('/api/user-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({
        weeklyWorkoutGoal: goals.weeklyGoal,
        monthlyWorkoutGoal: goals.monthlyGoal,
        useAutoMonthlyGoal: goals.useAutoMonthly,
        workoutTypeGoals: goals.workoutTypeGoals,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save goals')
    }

    const updatedProfile = await response.json()
    setUserProfile(updatedProfile)
    showSuccess(t('goals.saveSuccess') || 'Cele zostały zapisane!')
  }

  // Create exercise
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || 'Failed to create exercise')
    }

    const newExercise = await response.json()
    await fetchExercises() // Refresh list
    return newExercise
  }

  // Create workout
  const createWorkout = async (workoutData: WorkoutFormData) => {
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    try {
      const csrfToken = await getToken()
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(workoutData),
      })

      // If CSRF validation failed, try refreshing token and retrying once
      if (response.status === 403) {
        const errorData = await response.json()
        if (errorData.error === 'CSRF token validation failed') {
          console.log('CSRF token failed, refreshing and retrying...')
          const newToken = await refreshToken(true) // Force refresh
          
          const retryResponse = await fetch('/api/workouts', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-csrf-token': newToken,
            },
            credentials: 'include',
            body: JSON.stringify(workoutData),
          })
          
          if (retryResponse.ok) {
            showSuccess(t('workouts.createSuccess') || 'Workout created successfully')
            await fetchWorkouts(1, false) // Reset to first page
            setShowForm(false)
            return
          }
          
          const retryError = await extractApiError(retryResponse)
          handleError(retryError, 'Failed to create workout after retry')
          return
        }
      }

      if (response.ok) {
        showSuccess(t('workouts.createSuccess') || 'Workout created successfully')
        await fetchWorkouts(1, false) // Reset to first page
        setShowForm(false)
      } else {
        const error = await extractApiError(response)
        // Don't override validation errors with custom message - let the error details show
        if (error instanceof ValidationError && error.details && error.details.length > 0) {
          handleError(error)
        } else {
        handleError(error, 'Failed to create workout')
        }
      }
    } catch (error) {
      handleError(error, 'Failed to create workout')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update workout
  const updateWorkout = async (id: string, workoutData: WorkoutFormData) => {
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    try {
      const csrfToken = await getToken()
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        showSuccess(t('workouts.updateSuccess') || 'Workout updated successfully')
        await fetchWorkouts(workoutsPage, false) // Refresh current page
        setShowForm(false)
        setEditingWorkout(null)
      } else {
        const error = await extractApiError(response)
        handleError(error, 'Failed to update workout')
      }
    } catch (error) {
      handleError(error, 'Failed to update workout')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete workout
  const deleteWorkout = async (id: string) => {
    confirmation.showConfirmation(
      {
        title: t('workouts.deleteConfirmTitle') || 'Delete Workout',
        message: t('workouts.deleteConfirm') || 'Are you sure you want to delete this workout? This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        try {
          setDeletingWorkoutId(id)
          const csrfToken = await getToken()
          const response = await fetch(`/api/workouts/${id}`, {
            method: 'DELETE',
            headers: { 
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            credentials: 'include',
            body: JSON.stringify({}),
          })

          if (response.ok) {
            showSuccess(t('workouts.deleteSuccess') || 'Workout deleted successfully')
            await fetchWorkouts(workoutsPage, false) // Refresh current page
          } else {
            const error = await extractApiError(response)
            handleError(error, 'Failed to delete workout')
          }
        } catch (error) {
          handleError(error, 'Failed to delete workout')
        } finally {
          setDeletingWorkoutId(null)
        }
      }
    )
  }

  // Handle form submission
  const handleSubmit = (workoutData: WorkoutFormData) => {
    if (editingWorkout) {
      updateWorkout(editingWorkout.id, workoutData)
    } else {
      createWorkout(workoutData)
    }
  }

  // Handle edit
  const handleEdit = (id: string) => {
    const workout = Array.isArray(workouts) ? workouts.find(w => w.id === id) : undefined
    setEditingWorkout(workout || null)
    setShowForm(true)
  }

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false)
    setEditingWorkout(null)
    setEditingEvent(null)
  }

  // Handle add choice modal actions
  const handleQuickLog = () => {
    setShowAddChoice(false)
    setShowQuickLog(true)
  }

  const handleAddWorkout = () => {
    setShowAddChoice(false)
    setActiveTab('workouts')
    setShowForm(true)
    setEditingWorkout(null)
    setEditingEvent(null)
  }

  const handleAddEvent = () => {
    setShowAddChoice(false)
    setActiveTab('events')
    setShowForm(true)
    setEditingWorkout(null)
    setEditingEvent(null)
  }

  // Event management functions
  const createEvent = async (eventData: EventFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const csrfToken = await getToken()
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        await fetchEvents(1, false) // Reset to first page
        setShowForm(false)
      } else {
        handleError(await extractApiError(response), 'Failed to create event')
      }
    } catch (error) {
      handleError(error, 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateEvent = async (id: string, eventData: EventFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const csrfToken = await getToken()
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        await fetchEvents(eventsPage, false) // Refresh current page
        setShowForm(false)
        setEditingEvent(null)
      } else {
        handleError(await extractApiError(response), 'Failed to update event')
      }
    } catch (error) {
      handleError(error, 'Failed to update event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteEvent = async (id: string) => {
    confirmation.showConfirmation(
      {
        title: t('events.deleteConfirmTitle') || 'Delete Event',
        message: t('events.deleteConfirm') || 'Are you sure you want to delete this event? This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        try {
          setDeletingEventId(id)
          const csrfToken = await getToken()
          const response = await fetch(`/api/events/${id}`, {
            method: 'DELETE',
            headers: { 
              'Content-Type': 'application/json',
              'x-csrf-token': csrfToken,
            },
            credentials: 'include',
          })

          if (response.ok) {
            showSuccess(t('workouts.eventDeleted') || 'Event deleted successfully')
            await fetchEvents(eventsPage, false) // Refresh current page
          } else {
            const error = await extractApiError(response)
            handleError(error, 'Failed to delete event')
          }
        } catch (error) {
          handleError(error, 'Failed to delete event')
        } finally {
          setDeletingEventId(null)
        }
      }
    )
  }

  const handleEventSubmit = async (eventData: EventFormData) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData)
    } else {
      await createEvent(eventData)
    }
  }

  const handleCycleDayUpdate = async (eventId: string, cycleDay: number | null, manuallySet: boolean) => {
    try {
      const csrfToken = await getToken()
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          cycleDay,
          cycleDayManuallySet: manuallySet,
        }),
      })

      if (response.ok) {
        await fetchEvents()
      } else {
        throw new Error('Failed to update cycle day')
      }
    } catch (error) {
      console.error('Error updating cycle day:', error)
      throw error
    }
  }

  const handleEventEdit = (id: string) => {
    const event = Array.isArray(events) ? events.find(e => e.id === id) : undefined
    setEditingEvent(event || null)
    setShowForm(true)
  }

  // Create new tag
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
        body: JSON.stringify({
          name,
          color,
        }),
      })
      if (response.ok) {
        const newTag = await response.json()
        setAvailableTags(prev => [...prev, newTag])
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchWorkouts(1, false), 
        fetchEvents(1, false), 
        fetchTags(), 
        fetchExercises(),
        fetchUserProfile()
      ])
      setLoading(false)
    }
    fetchAllData()
  }, [])
  
  if (loading) {
    return <LoadingSpinner message={t('workouts.loading')} fullScreen />
  }

  const openAddChoice = () => {
    setEditingWorkout(null)
    setEditingEvent(null)
    setShowAddChoice(true)
  }

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight text-uc-text">
              {t('workouts.title')}
            </h1>
            <p className="mt-1 text-sm text-uc-text-muted">
              {t('workouts.description')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowGoalsConfigurator(true)}
              title={t('goals.title') || 'Training Goals'}
              aria-label={t('goals.title') || 'Training Goals'}
              className="min-w-11 px-3"
            >
              <span aria-hidden className="text-lg leading-none">🎯</span>
              <span className="hidden sm:inline">{t('goals.button') || 'Cele'}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowInfo(!showInfo)}
              aria-expanded={showInfo}
              title={showInfo ? t('common.close') : t('workouts.showInfo') || 'Show Info'}
              className={`min-w-11 px-3 ${showInfo ? 'bg-uc-primary-container text-uc-on-primary-container border-transparent' : ''}`}
            >
              <span aria-hidden className="text-lg leading-none">ℹ️</span>
              <span className="hidden sm:inline">{showInfo ? t('common.close') : t('workouts.showInfo') || 'Show Info'}</span>
            </Button>
            <Button
              variant="accent"
              onClick={openAddChoice}
              aria-label={t('common.add') || 'Add'}
              className="min-w-11 px-3 sm:px-4"
            >
              <span aria-hidden className="text-lg leading-none">➕</span>
              <span className="hidden sm:inline">{t('common.add') || 'Add'}</span>
            </Button>
          </div>
        </div>

        {/* Collapsible Information Section */}
        {showInfo && (
          <div className="mb-6 rounded-uc-card bg-uc-primary-container p-4 text-uc-on-primary-container lg:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Training Types */}
                <div>
                  <h3 className="mb-3 text-[17px] font-extrabold">
                    {t('events.trainingTypesTitle') || 'Training Types to Track'}
                  </h3>
                  <dl className="space-y-2">
                    {INFO_TRAINING_TYPES.map(({ type, key }) => (
                      <div key={type} className="grid grid-cols-[auto_minmax(0,9rem)_1fr] items-baseline gap-x-3 text-sm">
                        <span aria-hidden className={`size-2.5 translate-y-[-1px] rounded-full ${workoutBg[type]}`} />
                        <dt className="font-bold">{t(`training.types.${key}`)}</dt>
                        <dd className="opacity-85">{t(`training.descriptions.${key}`)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Event Types */}
                <div>
                  <h3 className="mb-3 text-[17px] font-extrabold">
                    {t('events.eventTypesTitle') || 'Event Types to Track'}
                  </h3>
                  <dl className="space-y-2">
                    {INFO_EVENT_TYPES.map(({ key, dot, label, description }) => (
                      <div key={key} className="grid grid-cols-[auto_minmax(0,9rem)_1fr] items-baseline gap-x-3 text-sm">
                        <span aria-hidden className={`size-2.5 translate-y-[-1px] rounded-full ${dot}`} />
                        <dt className="font-bold">{t(`events.eventTypes.${key}`) || label}</dt>
                        <dd className="opacity-85">{t(`events.eventTypes.${key}Description`) || description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <SheetCloseButton onClick={() => setShowInfo(false)} label={t('common.close')} />
            </div>

            <p className="mt-4 rounded-xl bg-uc-bg/30 px-3 py-2.5 text-sm">
              {t('events.tip') || '💡 Tip: Track both your training sessions and important events to understand patterns in your performance and recovery.'}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div role="tablist" className="mb-5 flex border-b border-uc-border">
          {([
            { key: 'workouts', label: `🏋️ ${t('nav.workouts')}`, count: Array.isArray(workouts) ? workouts.length : 0 },
            { key: 'events', label: `📅 ${t('events.title')}`, count: Array.isArray(events) ? events.length : 0 },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px min-h-12 flex-1 border-b-[3px] px-3 text-[15px] font-bold transition-colors sm:flex-none sm:px-6 ${
                activeTab === tab.key
                  ? 'border-uc-primary text-uc-text'
                  : 'border-transparent text-uc-text-muted hover:text-uc-text'
              }`}
            >
              {tab.label} <span className="uc-num">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'workouts' ? (
          !Array.isArray(workouts) || workouts.length === 0 ? (
            <EmptyState
              icon="🏋️‍♀️"
              title={t('workouts.noWorkouts') || 'No workouts yet'}
              description={t('workouts.noWorkoutsDescription') || 'Start tracking your training sessions! Log your workouts to monitor progress, track exercises, and analyze your performance over time.'}
              action={
                <div className="flex flex-col items-center gap-3">
                  <Button variant="accent" onClick={openAddChoice}>
                    ➕ {t('workouts.addFirstWorkout') || 'Add Your First Workout'}
                  </Button>
                  <p className="text-sm text-uc-text-muted">
                    {t('workouts.useQuickLog') || 'or use Quick Log for fast entry'}
                  </p>
                </div>
              }
            />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                {Array.isArray(workouts) && workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onEdit={handleEdit}
                    onDelete={deleteWorkout}
                    isDeleting={deletingWorkoutId === workout.id}
                  />
                ))}
              </div>
              {workoutsPagination.totalPages > 1 && (
                <Pagination
                  page={workoutsPage}
                  totalPages={workoutsPagination.totalPages}
                  total={workoutsPagination.total}
                  hasMore={workoutsPagination.hasMore}
                  onPage={(newPage) => {
                    setWorkoutsPage(newPage)
                    fetchWorkouts(newPage, false)
                  }}
                />
              )}
            </>
          )
        ) : (
          !Array.isArray(events) || events.length === 0 ? (
            <EmptyState
              icon="📅"
              title={t('events.noEvents') || 'No events yet'}
              description={t('events.noEventsDescription') || 'Start tracking your injuries, physio visits, competitions, and climbing trips. This helps you understand patterns and plan better.'}
              action={
                <div className="flex flex-col items-center gap-3">
                  <Button variant="accent" onClick={openAddChoice}>
                    ➕ {t('events.addFirstEvent') || 'Add Your First Event'}
                  </Button>
                  <p className="text-sm text-uc-text-muted">
                    {t('events.trackInjuries') || 'Track injuries to see patterns with your cycle'}
                  </p>
                </div>
              }
            />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                {Array.isArray(events) && events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEventEdit}
                    onDelete={deleteEvent}
                    onCycleDayUpdate={handleCycleDayUpdate}
                    isDeleting={deletingEventId === event.id}
                  />
                ))}
              </div>
              {eventsPagination.totalPages > 1 && (
                <Pagination
                  page={eventsPage}
                  totalPages={eventsPagination.totalPages}
                  total={eventsPagination.total}
                  hasMore={eventsPagination.hasMore}
                  onPage={(newPage) => {
                    setEventsPage(newPage)
                    fetchEvents(newPage, false)
                  }}
                />
              )}
            </>
          )
        )}

        {/* Forms */}
        {showForm && activeTab === 'workouts' && (
          <EnhancedWorkoutForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingWorkout || undefined}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
            availableExercises={availableExercises}
            onCreateExercise={handleCreateExercise}
          />
        )}

        {showForm && activeTab === 'events' && (
          <EventForm
            onSubmit={handleEventSubmit}
            onCancel={handleCancel}
            initialData={editingEvent || undefined}
            availableTags={availableTags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Add Choice Sheet */}
        <BottomSheet
          isOpen={showAddChoice}
          onClose={() => setShowAddChoice(false)}
          title={t('common.add') || 'Add'}
          closeLabel={t('common.close')}
        >
          <p className="mb-4 text-sm text-uc-text-muted">
            {t('workouts.addChoiceDescription') || 'What would you like to add?'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {([
              { onClick: handleQuickLog, emoji: '⚡', label: t('quickLog.button') || 'Quick Log', tone: 'bg-uc-primary-container text-uc-on-primary-container border-transparent' },
              { onClick: handleAddWorkout, emoji: '🏋️', label: t('workouts.addNew') || 'Add Workout', tone: 'bg-uc-surface text-uc-text border-uc-border hover:border-uc-primary' },
              { onClick: handleAddEvent, emoji: '📅', label: t('events.addNew') || 'Add Event', tone: 'bg-uc-surface text-uc-text border-uc-border hover:border-uc-primary' },
            ]).map((choice) => (
              <button
                key={choice.emoji}
                type="button"
                onClick={choice.onClick}
                className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-uc-card border p-4 text-center text-sm font-bold transition-colors ${choice.tone}`}
              >
                <span aria-hidden className="text-3xl leading-none">{choice.emoji}</span>
                {choice.label}
              </button>
            ))}
          </div>
        </BottomSheet>

        {/* Quick Log Modal */}
        {showQuickLog && (
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
                  await fetchWorkouts(1, false) // Reset to first page
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
            isSubmitting={isSubmittingQuickLog}
          />
        )}

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
          isLoading={deletingWorkoutId !== null || deletingEventId !== null}
        />

        {/* Goals Configurator */}
        {showGoalsConfigurator && (
          <GoalsConfigurator
            onClose={() => setShowGoalsConfigurator(false)}
            initialWeeklyGoal={userProfile?.weeklyWorkoutGoal || 3}
            initialMonthlyGoal={userProfile?.monthlyWorkoutGoal || null}
            initialUseAutoMonthly={userProfile?.useAutoMonthlyGoal !== false}
            initialWorkoutTypeGoals={userProfile?.workoutTypeGoals || []}
            onSave={handleSaveGoals}
          />
        )}
      </div>
    </div>
  )
}

// Info panel rows (same types and order as before)
const INFO_TRAINING_TYPES: { type: WorkoutTypeKey; key: string }[] = [
  { type: 'GYM', key: 'gym' },
  { type: 'BOULDERING', key: 'bouldering' },
  { type: 'CIRCUITS', key: 'circuits' },
  { type: 'LEAD_ROCK', key: 'leadRock' },
  { type: 'LEAD_ARTIFICIAL', key: 'leadArtificial' },
  { type: 'MENTAL_PRACTICE', key: 'mentalPractice' },
]

const INFO_EVENT_TYPES = [
  { key: 'injury', dot: 'bg-uc-error', label: 'Injury', description: 'Track injuries and recovery' },
  { key: 'physio', dot: 'bg-uc-primary', label: 'Physio Visit', description: 'Rehabilitation visits' },
  { key: 'competition', dot: 'bg-uc-accent-text', label: 'Competition', description: 'Climbing competitions' },
  { key: 'other', dot: 'bg-uc-text-muted', label: 'Other', description: 'Other important events' },
]

function Pagination({ page, totalPages, total, hasMore, onPage }: {
  page: number
  totalPages: number
  total: number
  hasMore: boolean
  onPage: (page: number) => void
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <Button variant="ghost" onClick={() => onPage(page - 1)} disabled={page === 1}>
        ← Previous
      </Button>
      <span className="text-center text-[13px] font-semibold text-uc-text-muted uc-num">
        Page {page} of {totalPages} ({total} total)
      </span>
      <Button variant="ghost" onClick={() => onPage(page + 1)} disabled={!hasMore}>
        Next →
      </Button>
    </div>
  )
}
