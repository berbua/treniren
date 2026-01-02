'use client'

import { useState, useEffect } from 'react'
import { EventType, Tag, TripClimbingType } from '@/types/event'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCycle } from '@/contexts/CycleContext'
import { calculateCycleInfo } from '@/lib/cycle-utils'

interface EventCardProps {
  event: {
    id: string
    type: EventType
    title: string
    date: string
    startTime?: string
    endTime?: string
    description?: string
    location?: string
    severity?: number
    status?: string
    notes?: string
    tags?: Tag[]
    // Trip-specific fields
    tripStartDate?: string
    tripEndDate?: string
    destination?: string
    climbingType?: TripClimbingType
    showCountdown?: boolean
    // Cycle tracking for injuries
    cycleDay?: number
    cycleDayManuallySet?: boolean
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onCycleDayUpdate?: (eventId: string, cycleDay: number | null, manuallySet: boolean) => Promise<void>
  isDeleting?: boolean
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

const getEventTypeLabel = (type: EventType) => {
  switch (type) {
    case 'INJURY':
      return '🤕 Injury'
    case 'PHYSIO':
      return '🏥 Physio'
    case 'COMPETITION':
      return '🏆 Competition'
    case 'TRIP':
      return '✈️ Trip'
    case 'OTHER':
      return '📅 Other'
    default:
      return type
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatTime = (timeString: string) => {
  const time = new Date(`2000-01-01T${timeString}`)
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export default function EventCard({ event, onEdit, onDelete, onCycleDayUpdate, isDeleting = false }: EventCardProps) {
  const { t } = useLanguage()
  const [isEditingCycleDay, setIsEditingCycleDay] = useState(false)
  const [cycleDayValue, setCycleDayValue] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Try to get cycle context, but handle case where it might not be available
  let cycleSettings = null
  let isCycleTrackingEnabled = false
  try {
    const cycleContext = useCycle()
    cycleSettings = cycleContext.cycleSettings
    isCycleTrackingEnabled = cycleContext.isCycleTrackingEnabled
  } catch (error) {
    // Cycle context not available, that's okay
  }
  
  // Calculate cycle info for injury events if cycle tracking is enabled
  const calculatedCycleInfo = event.type === 'INJURY' && isCycleTrackingEnabled && cycleSettings
    ? calculateCycleInfo(cycleSettings, new Date(event.date))
    : null
  
  // Use manually set cycle day if available, otherwise use calculated
  const displayCycleDay = event.cycleDayManuallySet && event.cycleDay !== undefined
    ? event.cycleDay
    : calculatedCycleInfo?.currentDay
  
  // Initialize cycle day value when entering edit mode
  useEffect(() => {
    if (isEditingCycleDay) {
      setCycleDayValue(displayCycleDay?.toString() || '')
    }
  }, [isEditingCycleDay, displayCycleDay])
  
  const handleSaveCycleDay = async () => {
    if (!onCycleDayUpdate) return
    
    setIsUpdating(true)
    try {
      const cycleDay = cycleDayValue.trim() === '' ? null : parseInt(cycleDayValue, 10)
      const isValid = cycleDay === null || (cycleDay >= 1 && cycleDay <= 50) // Reasonable range
      
      if (!isValid && cycleDay !== null) {
        alert(t('events.invalidCycleDay') || 'Cycle day must be between 1 and 50')
        setIsUpdating(false)
        return
      }
      
      await onCycleDayUpdate(event.id, cycleDay, cycleDay !== null)
      setIsEditingCycleDay(false)
    } catch (error) {
      console.error('Error updating cycle day:', error)
      alert(t('events.cycleDayUpdateError') || 'Failed to update cycle day')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`}></div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              {getEventTypeLabel(event.type)}
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {formatDate(event.date)}
            </span>
          </div>
          
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
            {event.title}
          </h4>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {event.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {/* Time */}
            {(event.startTime || event.endTime) && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">Time:</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {event.startTime && formatTime(event.startTime)}
                  {event.startTime && event.endTime && ' - '}
                  {event.endTime && formatTime(event.endTime)}
                </span>
              </div>
            )}

            {/* Location - Only for non-trip events */}
            {event.location && event.type !== 'TRIP' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">Location:</span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                  📍 {event.location}
                </span>
              </div>
            )}

            {/* Trip-specific information */}
            {event.type === 'TRIP' && (
              <>
                {/* Destination */}
                {event.destination && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500">Destination:</span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                      🌍 {event.destination}
                    </span>
                  </div>
                )}

                {/* Trip Dates */}
                {(event.tripStartDate || event.tripEndDate) && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500">{t('common.tripDates') || 'Trip Dates:'}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {event.tripStartDate && formatDate(event.tripStartDate)}
                      {event.tripStartDate && event.tripEndDate && ' - '}
                      {event.tripEndDate && formatDate(event.tripEndDate)}
                    </span>
                  </div>
                )}

                {/* Climbing Type */}
                {event.climbingType && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500">Climbing:</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                      {event.climbingType === 'BOULDERING' ? '🧗 Bouldering' : '🧗‍♀️ Sport Climbing'}
                    </span>
                  </div>
                )}

                {/* Countdown Status */}
                {event.showCountdown && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500">Countdown:</span>
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded">
                      📅 Enabled
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Severity (for injuries) */}
            {event.type === 'INJURY' && event.severity && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">Severity:</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div
                      key={rating}
                      className={`w-2 h-2 rounded-full ${
                        rating <= (event.severity || 0)
                          ? 'bg-red-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  ({event.severity}/5)
                </span>
              </div>
            )}

            {/* Status (for injuries) */}
            {event.type === 'INJURY' && event.status && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">Status:</span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded">
                  {event.status}
                </span>
              </div>
            )}

            {/* Cycle Day (for injuries, if cycle tracking is enabled) */}
            {event.type === 'INJURY' && (displayCycleDay !== undefined || isCycleTrackingEnabled) && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">🌸 {t('cycle.day') || 'Cycle Day'}:</span>
                {isEditingCycleDay ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={cycleDayValue}
                      onChange={(e) => setCycleDayValue(e.target.value)}
                      className="w-16 px-2 py-1 text-xs border border-pink-300 dark:border-pink-700 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                      disabled={isUpdating}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveCycleDay}
                      disabled={isUpdating}
                      className="px-2 py-1 text-xs bg-pink-500 hover:bg-pink-600 text-white rounded disabled:opacity-50"
                      title={t('common.save') || 'Save'}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingCycleDay(false)
                        setCycleDayValue('')
                      }}
                      disabled={isUpdating}
                      className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded disabled:opacity-50"
                      title={t('common.cancel') || 'Cancel'}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      event.cycleDayManuallySet
                        ? 'bg-pink-200 dark:bg-pink-800 text-pink-900 dark:text-pink-100 border border-pink-400 dark:border-pink-600'
                        : 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200'
                    }`}>
                      {displayCycleDay || '?'}
                      {event.cycleDayManuallySet && ' ✏️'}
                    </span>
                    {onCycleDayUpdate && (
                      <button
                        onClick={() => setIsEditingCycleDay(true)}
                        className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-200"
                        title={t('events.editCycleDay') || 'Edit cycle day'}
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {event.description}
              </div>
            )}

            {/* Notes */}
            {event.notes && (
              <div className="text-sm text-slate-600 dark:text-slate-300 italic">
                <span className="font-medium">Notes:</span> {event.notes}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(event.id)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Edit event"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDeleting ? "Deleting..." : "Delete event"}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                '🗑️'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
