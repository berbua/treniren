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
      }
    } catch (error) {
      console.error('Error creating event:', error)
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
      }
    } catch (error) {
      console.error('Error updating event:', error)
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

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-uc-text-light">
              {t('workouts.title')}
            </h1>
            <p className="text-uc-text-muted mt-2">
              {t('workouts.description')}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={() => setShowGoalsConfigurator(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-uc-dark-bg/50 hover:bg-uc-dark-bg transition-colors border border-uc-mustard/30"
              title={t('goals.title') || 'Training Goals'}
            >
              <span className="text-lg">🎯</span>
              <span className="text-sm font-medium text-uc-text-light hidden sm:inline">
                {t('goals.button') || 'Cele'}
              </span>
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-uc-dark-bg/50 hover:bg-uc-dark-bg transition-colors border border-uc-purple/20"
            >
              <span className="text-lg">ℹ️</span>
              <span className="text-sm font-medium text-uc-text-light">
                {showInfo ? t('common.close') : t('workouts.showInfo') || 'Show Info'}
              </span>
            </button>
            <button
              onClick={() => {
                setEditingWorkout(null)
                setEditingEvent(null)
                setShowAddChoice(true)
              }}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              ➕ {t('common.add') || 'Add'}
            </button>
          </div>
        </div>

        {/* Collapsible Information Section */}
        {showInfo && (
          <div className="mb-8 bg-uc-dark-bg rounded-2xl shadow-lg p-6 border border-uc-purple/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Training Types */}
              <div>
                <h3 className="text-lg font-semibold text-uc-text-light mb-4 flex items-center space-x-2">
                  <span>🏋️</span>
                  <span>{t('events.trainingTypesTitle') || 'Training Types to Track'}</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <span className="text-xl">🏋️</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('training.types.gym')}</div>
                      <div className="text-sm text-uc-text-muted">{t('training.descriptions.gym')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <span className="text-xl">🧗</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('training.types.bouldering')}</div>
                      <div className="text-sm text-uc-text-muted">{t('training.descriptions.bouldering')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <span className="text-xl">🔄</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('training.types.circuits')}</div>
                      <div className="text-sm text-uc-text-muted">{t('training.descriptions.circuits')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <span className="text-xl">🏔️</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('training.types.leadRock')}</div>
                      <div className="text-sm text-uc-text-muted">{t('training.descriptions.leadRock')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <span className="text-xl">🧗‍♀️</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('training.types.leadArtificial')}</div>
                      <div className="text-sm text-uc-text-muted">{t('training.descriptions.leadArtificial')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <span className="text-xl">🧘</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('training.types.mentalPractice')}</div>
                      <div className="text-sm text-uc-text-muted">{t('training.descriptions.mentalPractice')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Types */}
              <div>
                <h3 className="text-lg font-semibold text-uc-text-light mb-4 flex items-center space-x-2">
                  <span>📅</span>
                  <span>{t('events.eventTypesTitle') || 'Event Types to Track'}</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-uc-alert/20 rounded-xl border border-uc-alert/30">
                    <span className="text-xl">🤕</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('events.eventTypes.injury') || 'Injury'}</div>
                      <div className="text-sm text-uc-text-muted">{t('events.eventTypes.injuryDescription') || 'Track injuries and recovery'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                    <span className="text-xl">🏥</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('events.eventTypes.physio') || 'Physio Visit'}</div>
                      <div className="text-sm text-uc-text-muted">{t('events.eventTypes.physioDescription') || 'Rehabilitation visits'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                    <span className="text-xl">🏆</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('events.eventTypes.competition') || 'Competition'}</div>
                      <div className="text-sm text-uc-text-muted">{t('events.eventTypes.competitionDescription') || 'Climbing competitions'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-uc-purple/20 rounded-xl border border-uc-purple/30">
                    <span className="text-xl">📅</span>
                    <div>
                      <div className="font-medium text-uc-text-light">{t('events.eventTypes.other') || 'Other'}</div>
                      <div className="text-sm text-uc-text-muted">{t('events.eventTypes.otherDescription') || 'Other important events'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-uc-purple/20 rounded-xl border border-uc-purple/30">
              <p className="text-sm text-uc-text-light">
                {t('events.tip') || '💡 Tip: Track both your training sessions and important events to understand patterns in your performance and recovery.'}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-uc-dark-bg rounded-xl p-1 border border-uc-purple/20">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'workouts'
                ? 'bg-uc-mustard text-uc-black shadow-lg'
                : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black/50'
            }`}
          >
            🏋️ {t('nav.workouts')} ({Array.isArray(workouts) ? workouts.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-uc-mustard text-uc-black shadow-lg'
                : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black/50'
            }`}
          >
            📅 {t('events.title')} ({Array.isArray(events) ? events.length : 0})
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'workouts' ? (
          !Array.isArray(workouts) || workouts.length === 0 ? (
            <div className="bg-uc-dark-bg rounded-xl p-12 text-center border border-uc-purple/20">
              <div className="text-6xl mb-4">🏋️‍♀️</div>
              <h2 className="text-xl font-semibold text-uc-text-light mb-2">
                {t('workouts.noWorkouts') || 'No workouts yet'}
              </h2>
              <p className="text-uc-text-muted mb-6 max-w-md mx-auto">
                {t('workouts.noWorkoutsDescription') || 'Start tracking your training sessions! Log your workouts to monitor progress, track exercises, and analyze your performance over time.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => {
                    setEditingWorkout(null)
                    setEditingEvent(null)
                    setShowAddChoice(true)
                  }}
                  className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
                >
                  ➕ {t('workouts.addFirstWorkout') || 'Add Your First Workout'}
                </button>
                <p className="text-sm text-uc-text-muted">
                  {t('workouts.useQuickLog') || 'or use Quick Log for fast entry'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              {/* Pagination controls */}
              {workoutsPagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      const newPage = workoutsPage - 1
                      setWorkoutsPage(newPage)
                      fetchWorkouts(newPage, false)
                    }}
                    disabled={workoutsPage === 1}
                    className="px-4 py-2 rounded-xl bg-uc-dark-bg text-uc-text-light border border-uc-purple/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-uc-purple/20 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-uc-text-muted">
                    Page {workoutsPage} of {workoutsPagination.totalPages} ({workoutsPagination.total} total)
                  </span>
                  <button
                    onClick={() => {
                      const newPage = workoutsPage + 1
                      setWorkoutsPage(newPage)
                      fetchWorkouts(newPage, false)
                    }}
                    disabled={!workoutsPagination.hasMore}
                    className="px-4 py-2 rounded-xl bg-uc-dark-bg text-uc-text-light border border-uc-purple/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-uc-purple/20 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )
        ) : (
          !Array.isArray(events) || events.length === 0 ? (
            <div className="bg-uc-dark-bg rounded-xl p-12 text-center border border-uc-purple/20">
              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-xl font-semibold text-uc-text-light mb-2">
                {t('events.noEvents') || 'No events yet'}
              </h2>
              <p className="text-uc-text-muted mb-6 max-w-md mx-auto">
                {t('events.noEventsDescription') || 'Start tracking your injuries, physio visits, competitions, and climbing trips. This helps you understand patterns and plan better.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => {
                    setEditingWorkout(null)
                    setEditingEvent(null)
                    setShowAddChoice(true)
                  }}
                  className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
                >
                  ➕ {t('events.addFirstEvent') || 'Add Your First Event'}
                </button>
                <p className="text-sm text-uc-text-muted">
                  {t('events.trackInjuries') || 'Track injuries to see patterns with your cycle'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              {/* Pagination controls */}
              {eventsPagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => {
                      const newPage = eventsPage - 1
                      setEventsPage(newPage)
                      fetchEvents(newPage, false)
                    }}
                    disabled={eventsPage === 1}
                    className="px-4 py-2 rounded-xl bg-uc-dark-bg text-uc-text-light border border-uc-purple/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-uc-purple/20 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-uc-text-muted">
                    Page {eventsPage} of {eventsPagination.totalPages} ({eventsPagination.total} total)
                  </span>
                  <button
                    onClick={() => {
                      const newPage = eventsPage + 1
                      setEventsPage(newPage)
                      fetchEvents(newPage, false)
                    }}
                    disabled={!eventsPagination.hasMore}
                    className="px-4 py-2 rounded-xl bg-uc-dark-bg text-uc-text-light border border-uc-purple/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-uc-purple/20 transition-colors"
                  >
                    Next →
                  </button>
                </div>
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

        {/* Add Choice Modal */}
        {showAddChoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-uc-dark-bg rounded-2xl shadow-xl w-full max-w-md border border-uc-purple/20">
              <div className="p-6 border-b border-uc-purple/20">
                <h2 className="text-2xl font-bold text-uc-text-light mb-2">
                  {t('common.add') || 'Add'}
                </h2>
                <p className="text-sm text-uc-text-muted">
                  {t('workouts.addChoiceDescription') || 'What would you like to add?'}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleQuickLog}
                    className="flex flex-col items-center p-6 bg-gradient-to-br from-uc-purple/30 to-uc-mustard/30 rounded-xl border-2 border-uc-purple/40 hover:border-uc-purple/60 hover:from-uc-purple/40 hover:to-uc-mustard/40 transition-all"
                  >
                    <span className="text-4xl mb-3">⚡</span>
                    <span className="font-medium text-uc-text-light">{t('quickLog.button') || 'Quick Log'}</span>
                  </button>
                  <button
                    onClick={handleAddWorkout}
                    className="flex flex-col items-center p-6 bg-uc-black/50 rounded-xl border-2 border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black transition-all"
                  >
                    <span className="text-4xl mb-3">🏋️</span>
                    <span className="font-medium text-uc-text-light">{t('workouts.addNew') || 'Add Workout'}</span>
                  </button>
                  <button
                    onClick={handleAddEvent}
                    className="flex flex-col items-center p-6 bg-uc-black/50 rounded-xl border-2 border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black transition-all"
                  >
                    <span className="text-4xl mb-3">📅</span>
                    <span className="font-medium text-uc-text-light">{t('events.addNew') || 'Add Event'}</span>
                  </button>
                </div>
              </div>
              <div className="p-6 border-t border-uc-purple/20 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddChoice(false)
                  }}
                  className="px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors bg-uc-dark-bg/50 hover:bg-uc-dark-bg rounded-xl border border-uc-purple/20"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

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
