'use client';

import { useState, useMemo } from 'react';
import { EventType, EventFormData, Event, Tag, TripClimbingType } from '@/types/event';
import { useLanguage } from '@/contexts/LanguageContext';
import TagSelector from './TagSelector';

interface EventFormProps {
  onSubmit: (event: EventFormData) => void;
  onCancel: () => void;
  initialData?: Event;
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => void;
  isSubmitting?: boolean;
}

const eventTypes: { value: EventType; label: string; emoji: string; description: string }[] = [
  { value: 'INJURY', label: 'Injury', emoji: '🤕', description: 'Track injuries and recovery' },
  { value: 'PHYSIO', label: 'Physio Visit', emoji: '🏥', description: 'Physical therapy appointments' },
  { value: 'COMPETITION', label: 'Competition', emoji: '🏆', description: 'Climbing competitions' },
  { value: 'TRIP', label: 'Trip', emoji: '✈️', description: 'Climbing trips and adventures' },
  { value: 'OTHER', label: 'Other', emoji: '📅', description: 'Other events' },
];

export default function EventForm({ onSubmit, onCancel, initialData, availableTags = [], onCreateTag, isSubmitting = false }: EventFormProps) {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'INJURY',
    date: initialData?.date 
      ? new Date(initialData.date).toISOString().slice(0, 10)
      : (typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '2024-01-15'),
    description: initialData?.description || initialData?.notes || '',
    bodyPart: initialData?.location || '', // For injuries, this will store body part instead of location
    location: initialData?.location || '', // Keep for non-injury events
    tagIds: initialData?.tags?.map(tag => tag.id) || [],
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Please select an event type';
    }

    // For non-trip events, require a date
    if (formData.type !== 'TRIP' && !formData.date) {
      newErrors.date = 'Please select a date';
    }

    // Trip-specific validation
    if (formData.type === 'TRIP') {
      if (!formData.tripStartDate) {
        newErrors.tripStartDate = 'Please select a start date for the trip';
      }
      if (!formData.tripEndDate) {
        newErrors.tripEndDate = 'Please select an end date for the trip';
      }
      if (!formData.destination.trim()) {
        newErrors.destination = 'Please enter a destination';
      }
      if (formData.tripStartDate && formData.tripEndDate && formData.tripStartDate > formData.tripEndDate) {
        newErrors.tripEndDate = 'End date must be after start date';
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

  const updateFormData = (field: string, value: string | number | boolean) => {
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
            {initialData ? '✏️ Edytuj Wydarzenie' : '➕ Dodaj Wydarzenie'}
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
                📅 Rodzaj Wydarzenia *
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
                <p className="mt-2 text-sm text-uc-alert">{errors.type}</p>
              )}
            </div>

            {/* Body Part - Only for injury events */}
            {formData.type === 'INJURY' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  🦵 Część Ciała
                </label>
                <input
                  type="text"
                  value={formData.bodyPart}
                  onChange={(e) => updateFormData('bodyPart', e.target.value)}
                  placeholder="np. lewy nadgarstek, prawy bark, dolna część pleców..."
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                />
              </div>
            )}

            {/* Location - Only for non-trip, non-injury events */}
            {formData.type !== 'TRIP' && formData.type !== 'INJURY' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  📍 Lokalizacja
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="Wprowadź lokalizację..."
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:border-uc-purple focus:outline-none"
                />
              </div>
            )}

            {/* Date - Only for non-trip events */}
            {formData.type !== 'TRIP' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  📅 Data *
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
                  <p className="mt-2 text-sm text-uc-alert">{errors.date}</p>
                )}
              </div>
            )}


            {/* Description/Notes - Consolidated field */}
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                📝 {formData.type === 'INJURY' ? 'Opis Kontuzji' : 
                     formData.type === 'PHYSIO' ? 'Opis Wizyty' :
                     formData.type === 'COMPETITION' ? 'Opis Zawodów' :
                     'Opis Wydarzenia'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder={
                  formData.type === 'INJURY' ? 'Opisz kontuzję, objawy, przyczyny...' :
                  formData.type === 'PHYSIO' ? 'Opisz wizytę, zalecenia, postępy...' :
                  formData.type === 'COMPETITION' ? 'Opisz zawody, wyniki, wrażenia...' :
                  'Wprowadź opis wydarzenia...'
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
                    🛫 Data Rozpoczęcia Wyjazdu *
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
                    <p className="mt-2 text-sm text-uc-alert">{errors.tripStartDate}</p>
                  )}
                </div>

                {/* Trip End Date */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🛬 Data Zakończenia Wyjazdu *
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
                    <p className="mt-2 text-sm text-uc-alert">{errors.tripEndDate}</p>
                  )}
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🌍 Miejsce Docelowe *
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => updateFormData('destination', e.target.value)}
                    placeholder="Wprowadź miejsce docelowe (np. Fontainebleau, Francja)"
                    className={`w-full border rounded-xl px-3 py-2 bg-uc-black text-uc-text-light focus:outline-none ${
                      errors.destination ? 'border-uc-alert' : 'border-uc-purple/20 focus:border-uc-purple'
                    }`}
                  />
                  {errors.destination && (
                    <p className="mt-2 text-sm text-uc-alert">{errors.destination}</p>
                  )}
                </div>

                {/* Climbing Type */}
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-2">
                    🧗 Rodzaj Wspinaczki
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
                          Boulder
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
                          Wspinaczka Sportowa
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
                      📅 Pokaż odliczanie na stronie głównej: &quot;Czas do wyjazdu {formData.destination || 'docelowego'}: XX dni&quot;
                    </span>
                  </label>
                  <p className="text-xs text-uc-text-muted mt-2">
                    Włącz to, aby wyjazd pojawił się na stronie głównej z odliczaniem dni
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
                <span>{initialData ? 'Aktualizuj' : t('common.save')} Wydarzenie</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
