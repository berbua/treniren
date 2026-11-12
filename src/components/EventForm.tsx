'use client';

import { useState, useMemo, useEffect } from 'react';
import { EventType, EventFormData, Event, Tag, TripClimbingType } from '@/types/event';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCycle } from '@/contexts/CycleContext';
import { toLocalDateString } from '@/lib/date-utils';
import { calculateCycleInfo } from '@/lib/cycle-utils';
import { Tooltip } from './Tooltip';
import { BottomSheet, Button, FieldError, Input, Label, SegmentedControl, Textarea, eventTypeMeta, Icon } from '@/components/ui';

interface EventFormProps {
  onSubmit: (event: EventFormData) => void | Promise<void>;
  onCancel: () => void;
  initialData?: Event;
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => void;
  isSubmitting?: boolean;
  defaultDate?: string; // Optional default date to pre-fill
  /** Editing only: shows "Delete event" at the end of the form (the caller confirms and deletes). */
  onDelete?: () => void;
}

const eventTypes: EventType[] = ['INJURY', 'PHYSIO', 'COMPETITION', 'TRIP', 'OTHER'];

export default function EventForm({ onSubmit, onCancel, initialData, availableTags = [], onCreateTag, isSubmitting = false, defaultDate, onDelete }: EventFormProps) {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'INJURY',
    date: initialData?.date 
      ? new Date(initialData.date).toISOString().slice(0, 10)
      : (defaultDate || (typeof window !== 'undefined' ? toLocalDateString() : '2024-01-15')),
    description: initialData?.description || initialData?.notes || '',
    bodyPart: initialData?.location || '', // For injuries, this will store body part instead of location
    location: initialData?.location || '', // Keep for non-injury events
    // List endpoints return tags as eventTags join rows
    tagIds: (initialData?.tags ?? initialData?.eventTags?.map(et => et.tag) ?? []).map(tag => tag.id),
    // Cycle tracking for injuries
    cycleDay: initialData?.cycleDay || undefined,
    cycleDayManuallySet: initialData?.cycleDayManuallySet || false,
    // Trip-specific fields
    tripStartDate: initialData?.tripStartDate 
      ? new Date(initialData.tripStartDate).toISOString().slice(0, 10)
      : '',
    tripEndDate: initialData?.tripEndDate 
      ? new Date(initialData.tripEndDate).toISOString().slice(0, 10)
      : '',
    destination: initialData?.destination || '',
    climbingType: initialData?.climbingType || 'BOULDERING',
    showCountdown: initialData?.showCountdown || false,
  });

  // Get cycle context for calculating cycle day
  let cycleSettings = null
  let isCycleTrackingEnabled = false
  try {
    const cycleContext = useCycle()
    cycleSettings = cycleContext.cycleSettings
    isCycleTrackingEnabled = cycleContext.isCycleTrackingEnabled
  } catch (error) {
    // Cycle context not available, that's okay
  }

  // Calculate cycle day if cycle tracking is enabled and date is set
  const calculatedCycleDay = useMemo(() => {
    if (formData.type === 'INJURY' && isCycleTrackingEnabled && cycleSettings && formData.date) {
      try {
        const cycleInfo = calculateCycleInfo(cycleSettings, formData.date)
        return cycleInfo.currentDay
      } catch (error) {
        return undefined
      }
    }
    return undefined
  }, [formData.type, formData.date, isCycleTrackingEnabled, cycleSettings])

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update date when defaultDate changes (for calendar integration)
  useEffect(() => {
    if (defaultDate && !initialData) {
      setFormData(prev => ({
        ...prev,
        date: defaultDate
      }))
    }
  }, [defaultDate, initialData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = t('events.eventTypeRequired') || 'Please select an event type';
    }

    // For non-trip events, require a date
    if (formData.type !== 'TRIP' && !formData.date) {
      newErrors.date = t('events.dateRequired') || 'Please select a date';
    }

    // Trip-specific validation
    if (formData.type === 'TRIP') {
      if (!formData.tripStartDate) {
        newErrors.tripStartDate = t('events.tripStartDateRequired') || 'Please select a start date for the trip';
      }
      if (!formData.tripEndDate) {
        newErrors.tripEndDate = t('events.tripEndDateRequired') || 'Please select an end date for the trip';
      }
      if (!formData.destination.trim()) {
        newErrors.destination = t('events.destinationRequired') || 'Please enter a destination';
      }
      if (formData.tripStartDate && formData.tripEndDate && formData.tripStartDate > formData.tripEndDate) {
        newErrors.tripEndDate = t('events.tripEndDateAfterStart') || 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    const eventData: EventFormData = {
      type: formData.type,
      title: formData.type === 'TRIP' ? `${formData.destination} Trip` : 
             formData.type === 'INJURY' ? formData.bodyPart || 'Injury' : 
             formData.location || 'Event',
      date: formData.type === 'TRIP' ? formData.tripStartDate : formData.date,
      description: formData.description,
      location: formData.type === 'TRIP' ? formData.destination : 
                formData.type === 'INJURY' ? formData.bodyPart : formData.location,
      notes: '', // We're consolidating into description field
      tagIds: formData.tagIds,
      // Cycle tracking for injuries
      cycleDay: formData.type === 'INJURY' ? formData.cycleDay ?? null : undefined,
      cycleDayManuallySet: formData.type === 'INJURY' ? formData.cycleDayManuallySet : false,
      // Trip-specific fields
      tripStartDate: formData.type === 'TRIP' ? formData.tripStartDate : undefined,
      tripEndDate: formData.type === 'TRIP' ? formData.tripEndDate : undefined,
      destination: formData.type === 'TRIP' ? formData.destination : undefined,
      climbingType: formData.type === 'TRIP' ? formData.climbingType : undefined,
      showCountdown: formData.type === 'TRIP' ? formData.showCountdown : undefined,
    };

    // The page closes the form when the save succeeds; on failure it stays open with the input intact
    try {
      await onSubmit(eventData);
    } catch (error) {
      console.error('Error submitting event:', error);
    }
  };

  const updateFormData = (field: string, value: string | number | boolean | null | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const descriptionLabel =
    formData.type === 'INJURY' ? (t('events.injuryDescription') || 'Injury Description') :
    formData.type === 'PHYSIO' ? (t('events.physioDescription') || 'Visit Description') :
    formData.type === 'COMPETITION' ? (t('events.competitionDescription') || 'Competition Description') :
    (t('events.description') || 'Description');
  const descriptionPlaceholder =
    formData.type === 'INJURY' ? (t('events.injuryDescriptionPlaceholder') || 'Describe the injury, symptoms, causes...') :
    formData.type === 'PHYSIO' ? (t('events.physioDescriptionPlaceholder') || 'Describe the visit, recommendations, progress...') :
    formData.type === 'COMPETITION' ? (t('events.competitionDescriptionPlaceholder') || 'Describe the competition, results, impressions...') :
    (t('events.eventDescriptionPlaceholder') || 'Enter event description...');

  return (
    <BottomSheet
      isOpen
      onClose={onCancel}
      dismissible={false}
      closeLabel={t('common.close') || 'Close'}
      title={initialData ? (t('events.editEvent') || 'Edit Event') : (t('events.addEvent') || 'Add Event')}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" form="event-form" variant="accent" size="lg" className="flex-[1.4]" isLoading={isSubmitting}>
            {initialData ? (t('events.updateEvent') || 'Update Event') : (t('events.saveEvent') || 'Save Event')}
          </Button>
        </div>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Event type */}
        <fieldset>
          <legend className="mb-2 text-[11px] font-bold uppercase leading-[14px] tracking-[0.08em] text-uc-text-muted">
            {t('events.eventType') || 'Event Type'}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {eventTypes.map((type) => {
              const meta = eventTypeMeta(type);
              const selected = formData.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateFormData('type', type)}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-uc-input border-2 px-1 py-2 text-center transition-colors ${
                    selected ? `${meta.border} ${meta.tint}` : 'border-uc-border bg-uc-surface hover:border-uc-text-muted'
                  }`}
                >
                  <Icon name={meta.icon} size={22} className={meta.text} />
                  <span className={`text-sm font-bold leading-tight ${meta.text}`}>
                    {t(`events.types.${meta.key}`) || type}
                  </span>
                </button>
              );
            })}
          </div>
          <FieldError>{errors.type}</FieldError>
        </fieldset>

        {/* Body part — injuries */}
        {formData.type === 'INJURY' && (
          <div>
            <Label htmlFor="event-body-part">{t('events.bodyPart') || 'Body Part'}</Label>
            <Input
              id="event-body-part"
              value={formData.bodyPart}
              onChange={(e) => updateFormData('bodyPart', e.target.value)}
              placeholder={t('events.bodyPartPlaceholder') || 'e.g. left wrist, right shoulder, lower back...'}
            />
          </div>
        )}

        {/* Location — physio, competition, other */}
        {formData.type !== 'TRIP' && formData.type !== 'INJURY' && (
          <div>
            <Label htmlFor="event-location">{t('events.location') || 'Location'}</Label>
            <Input
              id="event-location"
              value={formData.location}
              onChange={(e) => updateFormData('location', e.target.value)}
              placeholder={t('events.locationPlaceholder') || 'Enter location...'}
            />
          </div>
        )}

        {/* Date — all but trips */}
        {formData.type !== 'TRIP' && (
          <div>
            <Label htmlFor="event-date">{t('events.date') || 'Date'} *</Label>
            <Input
              id="event-date"
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData('date', e.target.value)}
              aria-invalid={!!errors.date}
            />
            <FieldError>{errors.date}</FieldError>
          </div>
        )}

        {/* Cycle day — injuries */}
        {formData.type === 'INJURY' && (
          <div>
            <Label htmlFor="event-cycle-day" className="flex items-center gap-1.5">
              {t('events.cycleDay') || 'Cycle Day'}
              <Tooltip content={t('workouts.tooltips.cycleDay') || 'The day of your menstrual cycle (1-28+). Day 1 is the first day of your period. This helps correlate injuries and performance with your cycle phase.'}>
                <span className="inline-flex cursor-help text-uc-text-muted"><Icon name="info" size={16} /></span>
              </Tooltip>
            </Label>
            <div className="flex items-start gap-3">
              <div className="flex shrink-0 items-center gap-1">
                <Input
                  id="event-cycle-day"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.cycleDay || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                    updateFormData('cycleDay', value)
                    updateFormData('cycleDayManuallySet', value !== undefined)
                  }}
                  placeholder={calculatedCycleDay?.toString() || t('events.cycleDayPlaceholder') || 'Enter cycle day...'}
                  className="w-20 text-center font-bold uc-num"
                />
                {formData.cycleDay && (
                  <button
                    type="button"
                    onClick={() => {
                      updateFormData('cycleDay', undefined)
                      updateFormData('cycleDayManuallySet', false)
                    }}
                    aria-label={t('events.clearCycleDay') || 'Clear and use calculated value'}
                    title={t('events.clearCycleDay') || 'Clear and use calculated value'}
                    className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-text-muted hover:bg-uc-surface hover:text-uc-text"
                  >
                    <Icon name="close" />
                  </button>
                )}
              </div>
              <div className="min-w-0 text-[13px] leading-snug text-uc-text-muted">
                {calculatedCycleDay !== undefined && !formData.cycleDayManuallySet && (
                  <p>
                    {(t('events.calculatedCycleDay') || `Based on cycle calculation ({cycleLength} days), this is cycle day {day}.`)
                      .replace('{cycleLength}', (cycleSettings?.cycleLength || 28).toString())
                      .replace('{day}', calculatedCycleDay.toString())}
                    {' '}
                    {t('events.cycleDayHint') || 'If you use a cycle tracking app, you can set this manually for better accuracy.'}
                  </p>
                )}
                {formData.cycleDayManuallySet && formData.cycleDay && (
                  <p className="text-uc-primary">
                    {t('events.cycleDayManuallySet') || 'Manually set - will not be overwritten by calculations'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trip */}
        {formData.type === 'TRIP' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="event-trip-start">{t('events.tripStartDate') || 'Trip Start Date'} *</Label>
                <Input
                  id="event-trip-start"
                  type="date"
                  value={formData.tripStartDate}
                  onChange={(e) => updateFormData('tripStartDate', e.target.value)}
                  aria-invalid={!!errors.tripStartDate}
                />
                <FieldError>{errors.tripStartDate}</FieldError>
              </div>
              <div>
                <Label htmlFor="event-trip-end">{t('events.tripEndDate') || 'Trip End Date'} *</Label>
                <Input
                  id="event-trip-end"
                  type="date"
                  value={formData.tripEndDate}
                  onChange={(e) => updateFormData('tripEndDate', e.target.value)}
                  aria-invalid={!!errors.tripEndDate}
                />
                <FieldError>{errors.tripEndDate}</FieldError>
              </div>
            </div>

            <div>
              <Label htmlFor="event-destination">{t('events.destination') || 'Destination'} *</Label>
              <Input
                id="event-destination"
                value={formData.destination}
                onChange={(e) => updateFormData('destination', e.target.value)}
                placeholder={t('events.destinationPlaceholder') || 'Enter destination (e.g. Fontainebleau, France)'}
                aria-invalid={!!errors.destination}
              />
              <FieldError>{errors.destination}</FieldError>
            </div>

            <div>
              <Label>{t('events.climbingType') || 'Climbing Type'}</Label>
              <SegmentedControl<TripClimbingType>
                ariaLabel={t('events.climbingType') || 'Climbing Type'}
                value={formData.climbingType}
                onChange={(value) => updateFormData('climbingType', value)}
                options={[
                  { value: 'BOULDERING', label: t('events.bouldering') || 'Bouldering' },
                  { value: 'SPORT_CLIMBING', label: t('events.sportClimbing') || 'Sport Climbing' },
                ]}
              />
            </div>

            <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-uc-input border border-uc-border bg-uc-surface px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[15px] font-bold text-uc-text">
                  {t('events.showCountdown') || 'Show countdown on homepage'}
                  <Tooltip content={t('workouts.tooltips.showCountdown') || 'Enable this to show a countdown timer for this trip on the homepage. Great for building excitement before a climbing trip!'}>
                    <span className="inline-flex cursor-help text-uc-text-muted"><Icon name="info" size={16} /></span>
                  </Tooltip>
                </span>
                <span className="mt-0.5 block text-[13px] text-uc-text-muted">
                  {t('events.showCountdownDescription') || 'Enable this to show the trip on the homepage with a countdown'}
                </span>
              </span>
              <input
                type="checkbox"
                checked={formData.showCountdown}
                onChange={(e) => updateFormData('showCountdown', e.target.checked)}
                className="size-6 shrink-0 cursor-pointer accent-[var(--uc-primary)]"
              />
            </label>
          </>
        )}

        {/* Description */}
        <div>
          <Label htmlFor="event-description">{descriptionLabel}</Label>
          <Textarea
            id="event-description"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder={descriptionPlaceholder}
            rows={3}
          />
        </div>
        {initialData && onDelete && (
          <Button variant="ghost" size="lg" className="w-full text-uc-error" onClick={onDelete}>
            <Icon name="delete" />
            {t('events.deleteEvent') || 'Delete event'}
          </Button>
        )}
      </form>
    </BottomSheet>
  );
}
