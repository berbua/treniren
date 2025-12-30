'use client'

import { useState, useEffect } from 'react'
import { Event, EventFormData, Tag } from '@/types/event'
import EventForm from '@/components/EventForm'
import EventCard from '@/components/EventCard'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch events and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, tagsResponse] = await Promise.all([
          fetch('/api/events', { credentials: 'include' }),
          fetch('/api/tags', { credentials: 'include' })
        ])

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          setEvents(eventsData)
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
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        const newEvent = await response.json()
        setEvents(prev => [newEvent, ...prev])
        setShowForm(false)
      } else {
        console.error('Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateEvent = async (eventData: EventFormData) => {
    if (!editingEvent) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
        console.error('Failed to update event')
      }
    } catch (error) {
      console.error('Error updating event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEvents(prev => prev.filter(event => event.id !== eventId))
      } else {
        console.error('Failed to delete event')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
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
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Events
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Track injuries, physio visits, competitions, and other events
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 lg:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full lg:w-auto"
          >
            <span>➕</span>
            <span>Add Event</span>
          </button>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
              No events yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Start tracking your injuries, physio visits, and competitions
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
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
      </div>
    </div>
  )
}
