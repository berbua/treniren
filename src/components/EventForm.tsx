'use client';

import { useState, useMemo, useEffect } from 'react';
import { EventType, EventFormData, Event, Tag, TripClimbingType } from '@/types/event';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCycle } from '@/contexts/CycleContext';
import { calculateCycleInfo } from '@/lib/cycle-utils';
import TagSelector from './TagSelector';

interface EventFormProps {
  onSubmit: (event: EventFormData) => void;
  onCancel: () => void;
  initialData?: Event;
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => void;
  isSubmitting?: boolean;
  defaultDate?: string; // Optional default date to pre-fill
}

const eventTypes: { value: EventType; label: string; emoji: string; description: string }[] = [
  { value: 'INJURY', label: 'Injury', emoji: '🤕', description: 'Track injuries and recovery' },
  { value: 'PHYSIO', label: 'Physio Visit', emoji: '🏥', description: 'Physical therapy appointments' },
  { value: 'COMPETITION', label: 'Competition', emoji: '🏆', description: 'Climbing competitions' },
  { value: 'TRIP', label: 'Trip', emoji: '✈️', description: 'Climbing trips and adventures' },
  { value: 'OTHER', label: 'Other', emoji: '📅', description: 'Other events' },
];

export default function EventForm({ onSubmit, onCancel, initialData, availableTags = [], onCreateTag, isSubmitting = false, defaultDate }: EventFormProps) {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'INJURY',
    date: initialData?.date 
      ? new Date(initialData.date).toISOString().slice(0, 10)
      : (defaultDate || (typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '2024-01-15')),
    description: initialData?.description || initialData?.notes || '',
    bodyPart: initialData?.location || '', // For injuries, this will store body part instead of location
    location: initialData?.location || '', // Keep for non-injury events
    tagIds: initialData?.tags?.map(tag => tag.id) || [],
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
        const cycleInfo = calculateCycleInfo(cycleSettings, new Date(formData.date))
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
      cycleDay: formData.type === 'INJURY' ? formData.cycleDay : undefined,
      cycleDayManuallySet: formData.type === 'INJURY' ? formData.cycleDayManuallySet : false,
      // Trip-specific fields
      tripStartDate: formData.type === 'TRIP' ? formData.tripStartDate : undefined,
      tripEndDate: formData.type === 'TRIP' ? formData.tripEndDate : undefined,
      destination: formData.type === 'TRIP' ? formData.destination : undefined,
      climbingType: formData.type === 'TRIP' ? formData.climbingType : undefined,
      showCountdown: formData.type === 'TRIP' ? formData.showCountdown : undefined,
    };

    try {
      await onSubmit(eventData);
      // Close the form after successful submission
      onCancel();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-uc-dark-bg rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-uc-purple/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-uc-purple/20">
          <h2 className="text-2xl font-bold text-uc-text-light">
            {initialData ? `✏️ ${t('events.editEvent') || 'Edit Event'}` : `➕ ${t('events.addEvent') || 'Add Event'}`}
          </h2>
          <button
            onClick={onCancel}
            className="text-uc-text-muted hover:text-uc-text-light transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Type Selection */}
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                📅 {t('events.eventType') || 'Event Type'} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {eventTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('type', type.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.type === type.value
                        ? 'border-uc-purple bg-uc-purple/20'
                        : 'border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.emoji}</span>
                      <div className="text-sm font-medium text-uc-text-light">
                        {type.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-uc-alert">{t('events.eventTypeRequired') || errors.type}</p>
              )}
            </div>

            {/* Body Part - Only for injury events */}
            {formData.type === 'INJURY' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  🦵 {t('events.bodyPart') || 'Body Part'}
                </label>
                <input
                  type="text"
                  value={formData.bodyPart}
                  onChange={(e) => updateFormData('bodyPart', e.target.value)}
                  placeholder={t('events.bodyPartPlaceholder') || 'e.g. left wrist, right shoulder, lower back...'}
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                />
              </div>
            )}

            {/* Cycle Day - Only for injury events */}
            {formData.type === 'INJURY' && (
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800">
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  🌸 {t('events.cycleDay') || 'Cycle Day'}
                </label>
                {calculatedCycleDay !== undefined && !formData.cycleDayManuallySet && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {(t('events.calculatedCycleDay') || `Based on cycle calculation ({cycleLength} days), this is cycle day {day}.`)
                      .replace('{cycleLength}', (cycleSettings?.cycleLength || 28).toString())
                      .replace('{day}', calculatedCycleDay.toString())}
                    {' '}
                    {t('events.cycleDayHint') || 'If you use a cycle tracking app, you can set this manually for better accuracy.'}
                  </p>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.cycleDay || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                      updateFormData('cycleDay', value || '')
                      if (value !== undefined) {
                        updateFormData('cycleDayManuallySet', true)
                      }
                    }}
                    placeholder={calculatedCycleDay?.toString() || t('events.cycleDayPlaceholder') || 'Enter cycle day...'}
                    className="w-24 border border-pink-300 dark:border-pink-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 focus:border-pink-500 focus:outline-none"
                  />
                  {formData.cycleDay && (
                    <button
                      type="button"
                      onClick={() => {
                        updateFormData('cycleDay', undefined)
                        updateFormData('cycleDayManuallySet', false)
                      }}
                      className="text-xs text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-200"
                      title={t('events.clearCycleDay') || 'Clear and use calculated value'}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {formData.cycleDayManuallySet && formData.cycleDay && (
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-2">
                    ✏️ {t('events.cycleDayManuallySet') || 'Manually set - will not be overwritten by calculations'}
                  </p>
                )}
              </div>
            )}

            {/* Location - Only for non-trip, non-injury events */}
            {formData.type !== 'TRIP' && formData.type !== 'INJURY' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  📍 {t('events.location') || 'Location'}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder={t('events.locationPlaceholder') || 'Enter location...'}
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                />
              </div>
            )}

            {/* Date - Only for non-trip events */}
            {formData.type !== 'TRIP' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  📅 {t('events.date') || 'Date'} *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData('date', e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:outline-none ${
                    errors.date ? 'border-uc-alert' : 'border-uc-purple/20 focus:border-uc-purple'
                  }`}
                />
                {errors.date && (
                  <p className="mt-2 text-sm text-uc-alert">{t('events.dateRequired') || errors.date}</p>
                )}
              </div>
            )}


            {/* Description/Notes - Consolidated field */}
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                📝 {formData.type === 'INJURY' ? (t('events.injuryDescription') || 'Injury Description') : 
                     formData.type === 'PHYSIO' ? (t('events.physioDescription') || 'Visit Description') :
                     formData.type === 'COMPETITION' ? (t('events.competitionDescription') || 'Competition Description') :
                     (t('events.description') || 'Description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder={
                  formData.type === 'INJURY' ? (t('events.injuryDescriptionPlaceholder') || 'Describe the injury, symptoms, causes...') :
                  formData.type === 'PHYSIO' ? (t('events.physioDescriptionPlaceholder') || 'Describe the visit, recommendations, progress...') :
                  formData.type === 'COMPETITION' ? (t('events.competitionDescriptionPlaceholder') || 'Describe the competition, results, impressions...') :
                  (t('events.eventDescriptionPlaceholder') || 'Enter event description...')
                }
                rows={4}
                className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none resize-none"
              />
            </div>


            {/* Trip-specific fields */}
            {formData.type === 'TRIP' && (
              <>
                {/* Trip Start Date */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🛫 {t('events.tripStartDate') || 'Trip Start Date'} *
                  </label>
                  <input
                    type="date"
                    value={formData.tripStartDate}
                    onChange={(e) => updateFormData('tripStartDate', e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:outline-none ${
                      errors.tripStartDate ? 'border-uc-alert' : 'border-uc-purple/20 focus:border-uc-purple'
                    }`}
                  />
                  {errors.tripStartDate && (
                    <p className="mt-2 text-sm text-uc-alert">{t('events.tripStartDateRequired') || errors.tripStartDate}</p>
                  )}
                </div>

                {/* Trip End Date */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🛬 {t('events.tripEndDate') || 'Trip End Date'} *
                  </label>
                  <input
                    type="date"
                    value={formData.tripEndDate}
                    onChange={(e) => updateFormData('tripEndDate', e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:outline-none ${
                      errors.tripEndDate ? 'border-uc-alert' : 'border-uc-purple/20 focus:border-uc-purple'
                    }`}
                  />
                  {errors.tripEndDate && (
                    <p className="mt-2 text-sm text-uc-alert">
                      {errors.tripEndDate === 'End date must be after start date' 
                        ? (t('events.tripEndDateAfterStart') || errors.tripEndDate)
                        : (t('events.tripEndDateRequired') || errors.tripEndDate)}
                    </p>
                  )}
                </div>

                {/* Destination - Moved below date fields */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🌍 {t('events.destination') || 'Destination'} *
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => updateFormData('destination', e.target.value)}
                    placeholder={t('events.destinationPlaceholder') || 'Enter destination (e.g. Fontainebleau, France)'}
                    className={`w-full border rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:outline-none ${
                      errors.destination ? 'border-uc-alert' : 'border-uc-purple/20 focus:border-uc-purple'
                    }`}
                  />
                  {errors.destination && (
                    <p className="mt-2 text-sm text-uc-alert">{t('events.destinationRequired') || errors.destination}</p>
                  )}
                </div>

                {/* Climbing Type */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🧗 {t('events.climbingType') || 'Climbing Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateFormData('climbingType', 'BOULDERING')}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.climbingType === 'BOULDERING'
                          ? 'border-uc-purple bg-uc-purple/20'
                          : 'border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🧗</span>
                        <div className="text-sm font-medium text-uc-text-light">
                          {t('events.bouldering') || 'Bouldering'}
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData('climbingType', 'SPORT_CLIMBING')}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.climbingType === 'SPORT_CLIMBING'
                          ? 'border-uc-purple bg-uc-purple/20'
                          : 'border-uc-purple/20 hover:border-uc-purple/40 hover:bg-uc-black/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🧗‍♀️</span>
                        <div className="text-sm font-medium text-uc-text-light">
                          {t('events.sportClimbing') || 'Sport Climbing'}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Show Countdown Toggle */}
                <div className="p-4 bg-uc-purple/10 rounded-xl border border-uc-purple/20">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.showCountdown}
                      onChange={(e) => updateFormData('showCountdown', e.target.checked)}
                      className="w-4 h-4 text-uc-purple bg-uc-black border-uc-purple/20 rounded focus:ring-uc-purple focus:ring-2"
                    />
                    <span className="text-sm font-medium text-uc-text-light">
                      📅 {t('events.showCountdown') || 'Show countdown on homepage'}: &quot;{t('dashboard.daysToGo') || 'days to go'} {formData.destination || (t('events.destination') || 'destination')}: XX {t('dashboard.daysToGo') || 'days'}&quot;
                    </span>
                  </label>
                  <p className="text-xs text-uc-text-muted mt-2">
                    {t('events.showCountdownDescription') || 'Enable this to show the trip on the homepage with a countdown'}
                  </p>
                </div>
              </>
            )}



          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-uc-purple/20">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors bg-uc-dark-bg/50 hover:bg-uc-dark-bg rounded-xl border border-uc-purple/20"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-uc-black"></div>
                <span>{t('common.save')}...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{initialData ? (t('events.updateEvent') || 'Update Event') : (t('events.saveEvent') || 'Save Event')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
