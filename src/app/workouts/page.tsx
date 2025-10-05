'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Workout, WorkoutFormData, Tag } from '@/types/workout'
import { Event, EventFormData } from '@/types/event'
import { useLanguage } from '@/contexts/LanguageContext'
import AuthGuard from '@/components/AuthGuard'

// Dynamically import components to avoid SSR issues
const WorkoutCard = dynamic(() => import('@/components/WorkoutCard'), { ssr: false })
const EnhancedWorkoutForm = dynamic(() => import('@/components/EnhancedWorkoutForm'), { ssr: false })
const EventCard = dynamic(() => import('@/components/EventCard'), { ssr: false })
const EventForm = dynamic(() => import('@/components/EventForm'), { ssr: false })

export default function WorkoutsPage() {
  return (
    <AuthGuard>
      <WorkoutsPageContent />
    </AuthGuard>
  )
}

function WorkoutsPageContent() {
  const { t } = useLanguage()
  
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workouts' | 'events'>('workouts')
  const [showForm, setShowForm] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [showInfo, setShowInfo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch workouts
  const fetchWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts')
      if (response.ok) {
        const data = await response.json()
        setWorkouts(data)
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
    }
  }

  // Fetch events
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
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

  // Create workout
  const createWorkout = async (workoutData: WorkoutFormData) => {
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        await fetchWorkouts()
        setShowForm(false)
      }
    } catch (error) {
      console.error('Error creating workout:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update workout
  const updateWorkout = async (id: string, workoutData: WorkoutFormData) => {
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      })

      if (response.ok) {
        await fetchWorkouts()
        setShowForm(false)
        setEditingWorkout(null)
      }
    } catch (error) {
      console.error('Error updating workout:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete workout
  const deleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return

    try {
      const response = await fetch(`/api/workouts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        await fetchWorkouts()
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
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
    const workout = workouts.find(w => w.id === id)
    setEditingWorkout(workout || null)
    setShowForm(true)
  }

  // Handle cancel
  const handleCancel = () => {
    setShowForm(false)
    setEditingWorkout(null)
    setEditingEvent(null)
  }

  // Event management functions
  const createEvent = async (eventData: EventFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        await fetchEvents()
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
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        await fetchEvents()
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
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchEvents()
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const handleEventSubmit = async (eventData: EventFormData) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData)
    } else {
      await createEvent(eventData)
    }
  }

  const handleEventEdit = (id: string) => {
    const event = events.find(e => e.id === id)
    setEditingEvent(event || null)
    setShowForm(true)
  }

  // Create new tag
  const handleCreateTag = async (name: string, color: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      await Promise.all([fetchWorkouts(), fetchEvents(), fetchTags()])
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-uc-text-light">
              {t('workouts.title')}
            </h1>
            <p className="text-uc-text-muted mt-2">
              {t('workouts.description')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-uc-dark-bg/50 hover:bg-uc-dark-bg transition-colors border border-uc-purple/20"
            >
              <span className="text-lg">ℹ️</span>
              <span className="text-sm font-medium text-uc-text-light">
                {showInfo ? t('common.close') : 'Pokaż Info'}
              </span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              {activeTab === 'workouts' ? t('workouts.addNew') : t('events.addNew')}
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
                  <span>Rodzaje Treningów do Śledzenia</span>
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
                  <span>Rodzaje Wydarzeń do Śledzenia</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-uc-alert/20 rounded-xl border border-uc-alert/30">
                    <span className="text-xl">🤕</span>
                    <div>
                      <div className="font-medium text-uc-text-light">Kontuzja</div>
                      <div className="text-sm text-uc-text-muted">Śledzenie kontuzji i powrotu do zdrowia</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                    <span className="text-xl">🏥</span>
                    <div>
                      <div className="font-medium text-uc-text-light">Wizyta Fizjoterapeuty</div>
                      <div className="text-sm text-uc-text-muted">Wizyty rehabilitacyjne</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                    <span className="text-xl">🏆</span>
                    <div>
                      <div className="font-medium text-uc-text-light">Zawody</div>
                      <div className="text-sm text-uc-text-muted">Zawody wspinaczkowe</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-uc-purple/20 rounded-xl border border-uc-purple/30">
                    <span className="text-xl">📅</span>
                    <div>
                      <div className="font-medium text-uc-text-light">Inne</div>
                      <div className="text-sm text-uc-text-muted">Inne ważne wydarzenia</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-uc-purple/20 rounded-xl border border-uc-purple/30">
              <p className="text-sm text-uc-text-light">
                💡 <strong>Wskazówka:</strong> Śledź zarówno swoje sesje treningowe, jak i ważne wydarzenia, aby zrozumieć wzorce w swojej wydajności i regeneracji.
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
            🏋️ {t('nav.workouts')} ({workouts.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-uc-mustard text-uc-black shadow-lg'
                : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black/50'
            }`}
          >
            📅 {t('events.title')} ({events.length})
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'workouts' ? (
          workouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏋️‍♀️</div>
              <h2 className="text-xl font-semibold text-uc-text-light mb-2">
                {t('workouts.noWorkouts')}
              </h2>
              <p className="text-uc-text-muted mb-6">
                {t('workouts.noWorkoutsDescription')}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
              >
                {t('workouts.addFirst')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  onEdit={handleEdit}
                  onDelete={deleteWorkout}
                />
              ))}
            </div>
          )
        ) : (
          events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-xl font-semibold text-uc-text-light mb-2">
                {t('events.noEvents')}
              </h2>
              <p className="text-uc-text-muted mb-6">
                {t('events.noEventsDescription')}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
              >
                {t('events.addFirst')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={handleEventEdit}
                  onDelete={deleteEvent}
                />
              ))}
            </div>
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
      </div>
    </div>
  )
}
