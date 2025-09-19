'use client';

import { useState, useMemo } from 'react';
import { WorkoutType, TrainingVolume, WorkoutFormData, Workout, MentalState } from '@/types/workout';
import { useCycle } from '@/contexts/CycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateCycleInfo } from '@/lib/cycle-utils';
import CycleInfoComponent from './CycleInfo';
import { StrongMindSection } from './StrongMindSection';

interface EnhancedWorkoutFormProps {
  onSubmit: (workout: WorkoutFormData) => void;
  onCancel: () => void;
  initialData?: Workout;
}

const workoutTypes: { value: WorkoutType; label: string; emoji: string; description: string }[] = [
  { value: 'GYM', label: 'Gym', emoji: '🏋️', description: 'Strength training with weights' },
  { value: 'BOULDERING', label: 'Bouldering', emoji: '🧗', description: 'Short, powerful climbs' },
  { value: 'CIRCUITS', label: 'Circuits', emoji: '🔄', description: 'Endurance training circuits' },
  { value: 'LEAD_ROCK', label: 'Lead Rock', emoji: '🏔️', description: 'Outdoor lead climbing' },
  { value: 'LEAD_ARTIFICIAL', label: 'Lead Wall', emoji: '🧗‍♀️', description: 'Indoor lead climbing' },
];

const trainingVolumes: { value: TrainingVolume; label: string; description: string }[] = [
  { value: 'TR1', label: 'TR1 - Very Light', description: 'Easy recovery session' },
  { value: 'TR2', label: 'TR2 - Light', description: 'Low intensity training' },
  { value: 'TR3', label: 'TR3 - Moderate', description: 'Medium intensity training' },
  { value: 'TR4', label: 'TR4 - Hard', description: 'High intensity training' },
  { value: 'TR5', label: 'TR5 - Very Hard', description: 'Maximum intensity training' },
];

const moodLabels = {
  1: { label: 'Very Poor', emoji: '😫', color: 'text-red-600' },
  2: { label: 'Poor', emoji: '😞', color: 'text-orange-600' },
  3: { label: 'Average', emoji: '😐', color: 'text-yellow-600' },
  4: { label: 'Good', emoji: '😊', color: 'text-blue-600' },
  5: { label: 'Excellent', emoji: '🤩', color: 'text-green-600' },
};

export default function EnhancedWorkoutForm({ onSubmit, onCancel, initialData }: EnhancedWorkoutFormProps) {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'GYM',
    date: initialData?.date 
      ? new Date(initialData.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    trainingVolume: initialData?.trainingVolume || 'TR3',
    preSessionFeel: initialData?.preSessionFeel || 3,
    dayAfterTiredness: initialData?.dayAfterTiredness || 3,
    notes: initialData?.notes || '',
    mentalState: initialData?.mentalState || {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate cycle info for the selected date
  const cycleInfoForSelectedDate = useMemo(() => {
    if (!isCycleTrackingEnabled || !cycleSettings) return null;
    
    const selectedDate = new Date(formData.date);
    return calculateCycleInfo(cycleSettings, selectedDate);
  }, [formData.date, cycleSettings, isCycleTrackingEnabled]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = 'Please select a workout type';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    if (formData.type !== 'GYM' && !formData.trainingVolume) {
      newErrors.trainingVolume = 'Please select training volume';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const workoutData: WorkoutFormData = {
        type: formData.type,
        date: formData.date,
        trainingVolume: formData.trainingVolume,
        preSessionFeel: formData.preSessionFeel,
        dayAfterTiredness: formData.dayAfterTiredness,
        notes: formData.notes,
        mentalState: formData.mentalState,
      };

      await onSubmit(workoutData);
    } catch (error) {
      console.error('Error submitting workout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {initialData ? '✏️ Edit Workout' : '➕ Add Workout'}
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Workout Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                🏋️ Workout Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {workoutTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('type', type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{type.emoji}</span>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-50">
                          {type.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📅 Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData('date', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 ${
                  errors.date ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.date && (
                <p className="mt-2 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Cycle Info Display */}
            {cycleInfoForSelectedDate && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <CycleInfoComponent cycleInfo={cycleInfoForSelectedDate} />
              </div>
            )}

            {/* Training Volume (for non-gym workouts) */}
            {formData.type !== 'GYM' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  📊 Training Volume *
                </label>
                <div className="space-y-2">
                  {trainingVolumes.map((volume) => (
                    <label key={volume.value} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="trainingVolume"
                        value={volume.value}
                        checked={formData.trainingVolume === volume.value}
                        onChange={(e) => updateFormData('trainingVolume', e.target.value)}
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-50">
                          {volume.label}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {volume.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.trainingVolume && (
                  <p className="mt-2 text-sm text-red-600">{errors.trainingVolume}</p>
                )}
              </div>
            )}

            {/* Mood Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pre-session Feel */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  😊 Pre-session Feel
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="preSessionFeel"
                        value={rating}
                        checked={formData.preSessionFeel === rating}
                        onChange={(e) => updateFormData('preSessionFeel', parseInt(e.target.value))}
                        className="text-blue-600"
                      />
                      <span className="text-lg">{moodLabels[rating as keyof typeof moodLabels].emoji}</span>
                      <span className={`font-medium ${moodLabels[rating as keyof typeof moodLabels].color}`}>
                        {rating} - {moodLabels[rating as keyof typeof moodLabels].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Day After Tiredness */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  😴 Day After Tiredness
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="dayAfterTiredness"
                        value={rating}
                        checked={formData.dayAfterTiredness === rating}
                        onChange={(e) => updateFormData('dayAfterTiredness', parseInt(e.target.value))}
                        className="text-blue-600"
                      />
                      <span className="text-lg">{moodLabels[rating as keyof typeof moodLabels].emoji}</span>
                      <span className={`font-medium ${moodLabels[rating as keyof typeof moodLabels].color}`}>
                        {rating} - {moodLabels[rating as keyof typeof moodLabels].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📝 Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Add any notes about your workout, how you felt, what you learned..."
                rows={4}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 resize-none"
              />
            </div>

            {/* Strong Mind Section */}
            <StrongMindSection
              mentalState={formData.mentalState}
              onChange={(mentalState) => updateFormData('mentalState', mentalState)}
              workoutType={formData.type}
            />
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{initialData ? 'Update Workout' : 'Save Workout'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
