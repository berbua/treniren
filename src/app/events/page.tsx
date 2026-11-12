'use client'

import { useState, useEffect } from 'react'
import { Event, EventFormData, Tag } from '@/types/event'
import { useLanguage } from '@/contexts/LanguageContext'
import { useConfirmation } from '@/hooks/useConfirmation'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import EventForm from '@/components/EventForm'
import EventCard from '@/components/EventCard'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { useApiError } from '@/hooks/useApiError'
import { extractApiError } from '@/lib/errors'
import { Button, EmptyState, Icon, SkeletonRows } from '@/components/ui'

export default function EventsPage() {
  const { t } = useLanguage()
  const confirmation = useConfirmation()
  const { handleError } = useApiError()
  const { getToken } = useCsrfToken()
  const [events, setEvents] = useState<Event[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

  // Fetch events and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, tagsResponse] = await Promise.all([
          fetch('/api/events?page=1&limit=1000', { credentials: 'include' }),
          fetch('/api/tags', { credentials: 'include' })
        ])

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          // API returns { events, pagination }
          setEvents(Array.isArray(eventsData.events) ? eventsData.events : [])
        }

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          setTags(tagsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleCreateEvent = async (eventData: EventFormData) => {
    setIsSubmitting(true)
    try {
      const token = await getToken()
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        const newEvent = await response.json()
        setEvents(prev => [newEvent, ...prev])
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

  const handleUpdateEvent = async (eventData: EventFormData) => {
    if (!editingEvent) return

    setIsSubmitting(true)
    try {
      const token = await getToken()
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        const updatedEvent = await response.json()
        setEvents(prev => prev.map(event => 
          event.id === editingEvent.id ? updatedEvent : event
        ))
        setEditingEvent(undefined)
      } else {
        handleError(await extractApiError(response), 'Failed to update event')
      }
    } catch (error) {
      handleError(error, 'Failed to update event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    confirmation.showConfirmation(
      {
        title: t('events.deleteConfirmTitle') || 'Delete Event',
        message: t('events.deleteConfirm') || 'Are you sure you want to delete this event? This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        try {
          setDeletingEventId(eventId)
          const token = await getToken()
          const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
              'x-csrf-token': token,
            },
          })

          if (response.ok) {
            setEvents(prev => prev.filter(event => event.id !== eventId))
          } else {
            console.error('Failed to delete event')
          }
        } catch (error) {
          console.error('Error deleting event:', error)
        } finally {
          setDeletingEventId(null)
        }
      }
    )
  }

  const handleCycleDayUpdate = async (eventId: string, cycleDay: number | null, manuallySet: boolean) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          cycleDay,
          cycleDayManuallySet: manuallySet,
        }),
      })

      if (response.ok) {
        const updatedEvent = await response.json()
        // Update local state
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === eventId
              ? { ...event, cycleDay: cycleDay ?? undefined, cycleDayManuallySet: manuallySet }
              : event
          )
        )
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to update cycle day:', errorData)
        throw new Error(errorData.error || 'Failed to update cycle day')
      }
    } catch (error) {
      console.error('Error updating cycle day:', error)
      throw error
    }
  }

  const handleEditEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setEditingEvent(event)
    }
  }

  const handleCreateTag = async (name: string, color: string) => {
    try {
      const token = await getToken()
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({ name, color }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setTags(prev => [...prev, newTag])
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const header = (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[28px] font-extrabold leading-tight text-uc-text">{t('events.title') || 'Events'}</h1>
        <p className="mt-1 text-sm text-uc-text-muted">
          {t('events.subtitle') || 'Track injuries, physio visits, competitions, and other events'}
        </p>
      </div>
      <Button variant="accent" className="shrink-0" onClick={() => setShowForm(true)}>
        + {t('common.add') || 'Add'}
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {header}

        {isLoading ? (
          <SkeletonRows />
        ) : events.length === 0 ? (
          <div className="rounded-uc-card border border-dashed border-uc-border">
            <EmptyState
              icon={<Icon name="calendar" size={28} />}
              title={t('events.noEvents') || 'No events yet'}
              description={t('events.trackInjuries') || 'Track injuries to see patterns with your cycle'}
              action={
                <Button variant="accent" onClick={() => setShowForm(true)}>
                  + {t('events.addFirstEvent') || 'Add Your First Event'}
                </Button>
              }
            />
            <p className="-mt-2 px-4 pb-6 text-center text-[13px] text-uc-text-muted">
              {t('events.noEventsDescription') || 'Start tracking your injuries, physio visits, competitions, and climbing trips. This helps you understand patterns and plan better.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onCycleDayUpdate={handleCycleDayUpdate}
                isDeleting={deletingEventId === event.id}
              />
            ))}
          </div>
        )}

        {/* Event Form Modal */}
        {(showForm || editingEvent) && (
          <EventForm
            onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={() => {
              setShowForm(false)
              setEditingEvent(undefined)
            }}
            initialData={editingEvent}
            availableTags={tags}
            onCreateTag={handleCreateTag}
            isSubmitting={isSubmitting}
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
          isLoading={deletingEventId !== null}
        />
      </div>
    </div>
  )
}
