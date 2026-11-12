'use client'

import { useState, useEffect } from 'react'
import { EventType, Tag, TripClimbingType } from '@/types/event'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCycle } from '@/contexts/CycleContext'
import { calculateCycleInfo } from '@/lib/cycle-utils'
import { Card, Chip, EventIconTile, eventTypeMeta, Icon } from '@/components/ui'

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
    eventTags?: { tag: Tag }[]
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

export default function EventCard({ event, onEdit, onDelete, onCycleDayUpdate, isDeleting = false }: EventCardProps) {
  const { t, language } = useLanguage()
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'
  const meta = eventTypeMeta(event.type)
  // List endpoints return tags as eventTags join rows
  const eventTags = event.tags ?? event.eventTags?.map(et => et.tag) ?? []
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
    ? calculateCycleInfo(cycleSettings, event.date)
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


  const formatDate = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Date(value).toLocaleDateString(locale, options)
  const formatTime = (timeString: string) =>
    new Date(`2000-01-01T${timeString}`).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const tripRange = () => {
    if (!event.tripStartDate || !event.tripEndDate) {
      const single = event.tripStartDate || event.tripEndDate
      return single ? formatDate(single, { day: 'numeric', month: 'short' }) : '—'
    }
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
      .formatRange(new Date(event.tripStartDate), new Date(event.tripEndDate))
  }
  const timeRange = (event.startTime || event.endTime)
    ? [event.startTime && formatTime(event.startTime), event.endTime && formatTime(event.endTime)].filter(Boolean).join('–')
    : null
  const isInjury = event.type === 'INJURY'
  const isTrip = event.type === 'TRIP'
  const showCycleDay = isInjury && (displayCycleDay !== undefined || isCycleTrackingEnabled)

  return (
    <Card className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <EventIconTile type={event.type} />
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-bold uppercase leading-[14px] tracking-[0.08em] ${meta.text}`}>
            {t(`events.types.${meta.key}`) || event.type}
          </p>
          <h3 className="mt-0.5 text-[17px] font-extrabold leading-6 text-uc-text break-words">{event.title}</h3>
        </div>
        <div className="-mr-2 -mt-2 flex shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(event.id)}
              aria-label={t('events.editEvent') || 'Edit event'}
              className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-text-muted hover:bg-uc-elevated hover:text-uc-text"
            >
              <Icon name="edit" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              disabled={isDeleting}
              aria-label={t('events.deleteConfirmTitle') || 'Delete event'}
              className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-text-muted hover:bg-uc-elevated hover:text-uc-error disabled:opacity-50"
            >
              {isDeleting ? (
                <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-uc-error border-t-transparent" />
              ) : (
                <Icon name="delete" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Injury: date, status, cycle day */}
      {isInjury && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-8 items-center rounded-uc-chip border border-uc-border bg-uc-elevated px-2.5 text-[13px] font-bold text-uc-text uc-num">
            {formatDate(event.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {event.status && (
            <span className="inline-flex min-h-8 items-center rounded-uc-chip bg-uc-warning-bg px-2.5 text-[13px] font-bold text-uc-warning">
              {event.status}
            </span>
          )}
          {showCycleDay && (
            isEditingCycleDay ? (
              <span className="inline-flex items-center gap-1">
                <label className="sr-only" htmlFor={`cycle-day-${event.id}`}>{t('events.cycleDay') || 'Cycle Day'}</label>
                <input
                  id={`cycle-day-${event.id}`}
                  type="number"
                  min="1"
                  max="50"
                  value={cycleDayValue}
                  onChange={(e) => setCycleDayValue(e.target.value)}
                  className="h-11 w-16 rounded-uc-input border border-uc-border bg-uc-surface px-2 text-center text-[15px] font-bold text-uc-text uc-num focus:border-uc-primary focus:outline-none"
                  disabled={isUpdating}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveCycleDay}
                  disabled={isUpdating}
                  aria-label={t('common.save') || 'Save'}
                  className="inline-flex size-11 items-center justify-center rounded-uc-input bg-uc-primary font-bold text-uc-on-primary disabled:opacity-50"
                >
                  <Icon name="success" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCycleDay(false)
                    setCycleDayValue('')
                  }}
                  disabled={isUpdating}
                  aria-label={t('common.cancel') || 'Cancel'}
                  className="inline-flex size-11 items-center justify-center rounded-uc-input border border-uc-border text-uc-text-muted disabled:opacity-50"
                >
                  <Icon name="close" />
                </button>
              </span>
            ) : (
              <span
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-uc-chip border bg-uc-elevated pl-2.5 text-[13px] font-bold text-uc-text ${
                  event.cycleDayManuallySet ? 'border-uc-primary' : 'border-uc-border'
                } ${onCycleDayUpdate ? '' : 'pr-2.5'}`}
              >
                <span aria-hidden className="size-2 rounded-full bg-uc-text-muted" />
                <span className="uc-num">{t('events.cycleDay') || 'Cycle Day'} {displayCycleDay || '?'}</span>
                {onCycleDayUpdate && (
                  <button
                    type="button"
                    onClick={() => setIsEditingCycleDay(true)}
                    aria-label={t('events.editCycleDay') || 'Edit cycle day'}
                    title={event.cycleDayManuallySet ? (t('events.cycleDayManuallySet') || 'Manually set') : undefined}
                    className="-my-1.5 inline-flex size-11 items-center justify-center text-uc-text-muted hover:text-uc-text"
                  >
                    <Icon name="edit" size={16} />
                  </button>
                )}
              </span>
            )
          )}
        </div>
      )}

      {isInjury && event.severity && (
        <div className="flex items-center gap-2 text-[13px] font-semibold text-uc-text-muted">
          {t('events.severity') || 'Severity'}
          <span className="flex gap-1" role="img" aria-label={`${event.severity}/5`}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <span
                key={rating}
                className={`size-2.5 rounded-full border-[1.5px] border-uc-error ${rating <= (event.severity || 0) ? 'bg-uc-error' : ''}`}
              />
            ))}
          </span>
        </div>
      )}

      {/* Trip: dates, climbing type, countdown */}
      {isTrip && (
        <>
          {event.destination && !event.title.includes(event.destination) && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-uc-text-muted"><Icon name="event-trip" size={16} />{event.destination}</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <InfoTile label={t('events.dates') || 'Dates'} value={tripRange()} />
            {event.climbingType && (
              <InfoTile
                label={t('events.climbingType') || 'Climbing Type'}
                value={event.climbingType === 'BOULDERING' ? (t('events.bouldering') || 'Bouldering') : (t('events.sportClimbing') || 'Sport Climbing')}
              />
            )}
            {event.showCountdown && (
              <InfoTile label={t('events.countdown') || 'Countdown'} value={t('common.enabled') || 'Enabled'} success />
            )}
          </div>
        </>
      )}

      {/* Other types: date · time · location */}
      {!isInjury && !isTrip && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-semibold text-uc-text-muted">
          <span className="uc-num">
            {formatDate(event.date, { weekday: 'short', day: 'numeric', month: 'short' })}
            {timeRange && <> · {timeRange}</>}
          </span>
          {event.location && <span className="inline-flex items-center gap-1"><Icon name="event-trip" size={16} />{event.location}</span>}
        </p>
      )}
      {isInjury && timeRange && (
        <p className="text-[13px] font-semibold text-uc-text-muted uc-num">{timeRange}</p>
      )}

      {eventTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {eventTags.map((tag) => (
            <Chip key={tag.id} color={tag.color} className="bg-uc-elevated text-uc-text">
              {tag.name}
            </Chip>
          ))}
        </div>
      )}

      {event.description && (
        <p className="whitespace-pre-wrap text-[15px] leading-snug text-uc-text">{event.description}</p>
      )}
      {event.notes && (
        <p className="whitespace-pre-wrap text-[15px] leading-snug text-uc-text">
          <span className="font-bold">{t('events.notes') || 'Notes'}:</span> {event.notes}
        </p>
      )}
    </Card>
  )
}

function InfoTile({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl px-3 py-2 ${success ? 'bg-uc-success-bg' : 'bg-uc-elevated'}`}>
      <p className={`text-[12px] font-semibold ${success ? 'text-uc-success' : 'text-uc-text-muted'}`}>{label}</p>
      <p className={`text-[15px] font-extrabold leading-5 uc-num break-words ${success ? 'text-uc-success' : 'text-uc-text'}`}>{value}</p>
    </div>
  )
}
