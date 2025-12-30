'use client';

import { useState, useMemo, useEffect } from 'react';
import { WorkoutType, TrainingVolume, WorkoutFormData, Workout, Tag, TimeOfDay, Exercise, WorkoutExerciseData, FingerboardWorkoutHang } from '@/types/workout';
import { useCycle } from '@/contexts/CycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { calculateCycleInfo } from '@/lib/cycle-utils';
import CycleInfoComponent from './CycleInfo';
import { StrongMindSection } from './StrongMindSection';
import TagSelector from './TagSelector';
import WorkoutExerciseTracker from './WorkoutExerciseTracker';
import FingerboardHangTracker from './FingerboardHangTracker';

// Extended Workout type that includes relations from API
type WorkoutWithRelations = Workout & {
  workoutExercises?: Array<{
    id: string;
    exercise: Exercise;
    order: number;
    sets?: Array<{
      reps?: number | null;
      weight?: number | null;
      rir?: number | null;
      notes?: string | null;
    }>;
  }>;
  fingerboardHangs?: Array<{
    id: string;
    order: number;
    handType: string;
    gripType: string;
    crimpSize?: number | null;
    customDescription?: string | null;
    load?: number | null;
    unload?: number | null;
    reps?: number | null;
    timeSeconds?: number | null;
    notes?: string | null;
  }>;
};

interface EnhancedWorkoutFormProps {
  onSubmit: (workout: WorkoutFormData) => void;
  onCancel: () => void;
  initialData?: WorkoutWithRelations;
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => void;
  isSubmitting?: boolean;
  availableExercises?: Exercise[];
  onCreateExercise?: (name: string, category?: string, defaultUnit?: string) => Promise<Exercise>;
  defaultDate?: string; // Optional default date to pre-fill
}

const workoutTypes: { value: WorkoutType; label: string; emoji: string; description: string }[] = [
  { value: 'GYM', label: 'Gym', emoji: '🏋️', description: 'Strength training with weights' },
  { value: 'BOULDERING', label: 'Bouldering', emoji: '🧗', description: 'Short, powerful climbs' },
  { value: 'CIRCUITS', label: 'Circuits', emoji: '🔄', description: 'Endurance training circuits' },
  { value: 'LEAD_ROCK', label: 'Lead Rock', emoji: '🏔️', description: 'Outdoor lead climbing' },
  { value: 'LEAD_ARTIFICIAL', label: 'Lead Wall', emoji: '🧗‍♀️', description: 'Indoor lead climbing' },
  { value: 'MENTAL_PRACTICE', label: 'Mental Practice', emoji: '🧘', description: 'Mindfulness & mental training' },
  { value: 'FINGERBOARD', label: 'Fingerboard', emoji: '🖐️', description: 'Finger strength training' },
];

const trainingVolumes: { value: TrainingVolume; label: string; description: string }[] = [
  { value: 'TR1', label: 'TR1 - Very Light', description: 'Easy recovery session' },
  { value: 'TR2', label: 'TR2 - Light', description: 'Low intensity training' },
  { value: 'TR3', label: 'TR3 - Moderate', description: 'Medium intensity training' },
  { value: 'TR4', label: 'TR4 - Hard', description: 'High intensity training' },
  { value: 'TR5', label: 'TR5 - Very Hard', description: 'Maximum intensity training' },
];


export default function EnhancedWorkoutForm({ onSubmit, onCancel, initialData, availableTags = [], onCreateTag, isSubmitting = false, availableExercises = [], onCreateExercise, defaultDate }: EnhancedWorkoutFormProps) {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  const { t } = useLanguage();

  // Set current date on client side to prevent hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialData?.startTime) {
      setFormData(prev => ({
        ...prev,
        date: defaultDate || new Date().toISOString().slice(0, 10)
      }))
    }
  }, [initialData?.startTime, defaultDate])

  // Load exercises and fingerboard hangs from initialData
  useEffect(() => {
    if (initialData) {
      // Load exercises
      if (initialData.workoutExercises && initialData.workoutExercises.length > 0) {
        const exercisesData: WorkoutExerciseData[] = initialData.workoutExercises.map((we: any) => ({
          exerciseId: we.exercise.id,
          exerciseName: we.exercise.name,
          order: we.order,
          sets: we.sets?.map((s: any) => ({
            reps: s.reps || undefined,
            weight: s.weight || undefined,
            rir: s.rir || undefined,
            notes: s.notes || undefined,
          })) || [],
        }))
        setFormData(prev => ({ ...prev, exercises: exercisesData }))
      }

      // Load fingerboard hangs
      if (initialData.fingerboardHangs && initialData.fingerboardHangs.length > 0) {
        const hangsData: FingerboardWorkoutHang[] = initialData.fingerboardHangs.map((fh: any) => ({
          order: fh.order,
          handType: fh.handType,
          gripType: fh.gripType,
          crimpSize: fh.crimpSize || undefined,
          customDescription: fh.customDescription || undefined,
          load: fh.load || undefined,
          unload: fh.unload || undefined,
          reps: fh.reps || undefined,
          timeSeconds: fh.timeSeconds || undefined,
          notes: fh.notes || undefined,
        }))
        setFormData(prev => ({ ...prev, fingerboardHangs: hangsData }))
      }
    } else {
      // Clear exercises and hangs when no initialData
      setFormData(prev => ({ ...prev, exercises: [], fingerboardHangs: [] }))
    }
  }, [initialData])
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'GYM',
    date: initialData?.startTime 
      ? new Date(initialData.startTime).toISOString().slice(0, 10)
      : defaultDate || '2024-01-15', // Use defaultDate if provided, otherwise use default
    trainingVolume: initialData?.trainingVolume || 'TR3',
    focusLevel: initialData?.focusLevel || 3,
    notes: initialData?.notes || '',
    mentalState: initialData?.mentalState || {},
    sector: initialData?.sector || '',
    mentalPracticeType: initialData?.mentalPracticeType || 'MEDITATION',
    timeOfDay: initialData?.timeOfDay || [],
    tagIds: initialData?.tags?.map(tag => tag.id) || [],
    exercises: [] as WorkoutExerciseData[],
    fingerboardHangs: [] as FingerboardWorkoutHang[],
    gratitude: initialData?.gratitude || '',
    improvements: initialData?.improvements || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGratitudeExpanded, setIsGratitudeExpanded] = useState(false);

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

    if (formData.type !== 'GYM' && formData.type !== 'MENTAL_PRACTICE' && formData.type !== 'FINGERBOARD' && !formData.trainingVolume) {
      newErrors.trainingVolume = 'Please select training volume';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    const workoutData: WorkoutFormData = {
      type: formData.type,
      date: formData.date,
      trainingVolume: formData.trainingVolume,
      focusLevel: formData.focusLevel,
      notes: formData.notes,
      mentalState: formData.mentalState,
      sector: formData.sector,
      mentalPracticeType: formData.mentalPracticeType,
      timeOfDay: formData.timeOfDay,
      tagIds: formData.tagIds,
      exercises: formData.exercises.length > 0 ? formData.exercises : undefined,
      fingerboardHangs: formData.fingerboardHangs.length > 0 ? formData.fingerboardHangs : undefined,
      gratitude: formData.gratitude || undefined,
      improvements: formData.improvements || undefined,
    };

    await onSubmit(workoutData);
  };

  const updateFormData = (field: string, value: string | number | object) => {
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
            {initialData ? '✏️ Edytuj Trening' : '➕ Dodaj Trening'}
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
            {/* Workout Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🏋️ Workout Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {workoutTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('type', type.value)}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.emoji}</span>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-50">
                        {type.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className={formData.type === 'MENTAL_PRACTICE' ? 'hidden' : ''}>
                <TagSelector
                  selectedTagIds={formData.tagIds}
                  onTagsChange={(tagIds) => updateFormData('tagIds', tagIds)}
                  availableTags={availableTags}
                  onCreateTag={onCreateTag}
                />
              </div>
            )}

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
              <div className={`p-4 bg-uc-purple/20 rounded-xl border border-uc-purple/30 ${formData.type === 'MENTAL_PRACTICE' ? 'hidden' : ''}`}>
                <CycleInfoComponent 
                  cycleInfo={cycleInfoForSelectedDate} 
                  showRecommendations={true}
                  isSelectedDate={true}
                />
              </div>
            )}

            {/* Training Volume (for non-gym, non-mental practice, and non-fingerboard workouts) */}
            {formData.type !== 'GYM' && formData.type !== 'MENTAL_PRACTICE' && formData.type !== 'FINGERBOARD' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  📊 Training Volume *
                </label>
                <div className="flex space-x-2">
                  {trainingVolumes.map((volume) => (
                    <label key={volume.value} className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-center">
                      <input
                        type="radio"
                        name="trainingVolume"
                        value={volume.value}
                        checked={formData.trainingVolume === volume.value}
                        onChange={(e) => updateFormData('trainingVolume', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`font-medium ${
                        formData.trainingVolume === volume.value
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {volume.value}
                      </div>
                    </label>
                  ))}
                </div>
                {errors.trainingVolume && (
                  <p className="mt-2 text-sm text-red-600">{errors.trainingVolume}</p>
                )}
              </div>
            )}

            {/* Focus Level - Only for Mental Practice */}
            {formData.type === 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  🧘 {t('workouts.focusLevel') || 'Focus Level (1-5)'}
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const isFilled = rating <= (formData.focusLevel || 0);
                    const isSelected = formData.focusLevel === rating;
                    return (
                      <label key={rating} className="cursor-pointer">
                        <input
                          type="radio"
                          name="focusLevel"
                          value={rating}
                          checked={formData.focusLevel === rating}
                          onChange={(e) => updateFormData('focusLevel', parseInt(e.target.value))}
                          className="sr-only"
                        />
                        <div
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            isSelected
                              ? 'border-orange-500'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          } ${
                            isFilled
                              ? 'bg-orange-500'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sector Field - For Lead Rock, Lead Wall, Bouldering, and Circuits */}
            {(formData.type === 'LEAD_ROCK' || formData.type === 'LEAD_ARTIFICIAL' || formData.type === 'BOULDERING' || formData.type === 'CIRCUITS') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  🏔️ {t('workouts.sector') || 'Sector'}
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => updateFormData('sector', e.target.value)}
                  placeholder={t('workouts.sectorPlaceholder') || 'Enter the climbing sector or area...'}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                />
              </div>
            )}

            {/* Mental Practice Type - Only for Mental Practice */}
            {formData.type === 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  🧘 {t('workouts.mentalPracticeType') || 'Practice Type'}
                </label>
                <select
                  value={formData.mentalPracticeType}
                  onChange={(e) => updateFormData('mentalPracticeType', e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                >
                  <option value="MEDITATION">{t('workouts.mentalPracticeTypes.meditation') || 'Meditation'}</option>
                  <option value="REFLECTING">{t('workouts.mentalPracticeTypes.reflecting') || 'Reflecting'}</option>
                  <option value="OTHER">{t('workouts.mentalPracticeTypes.other') || 'Other'}</option>
                </select>
              </div>
            )}

            {/* Time of Day - Only for Mental Practice */}
            {formData.type === 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  🕐 Time of Day
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'MORNING', label: 'Morning', emoji: '🌅' },
                    { value: 'MIDDAY', label: 'Midday', emoji: '☀️' },
                    { value: 'EVENING', label: 'Evening', emoji: '🌙' }
                  ].map((time) => (
                    <label key={time.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.timeOfDay.includes(time.value as TimeOfDay)}
                        onChange={(e) => {
                          const currentTimes = formData.timeOfDay || [];
                          if (e.target.checked) {
                            updateFormData('timeOfDay', [...currentTimes, time.value]);
                          } else {
                            updateFormData('timeOfDay', currentTimes.filter(t => t !== time.value));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {time.emoji} {time.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Exercise Tracker - Only for GYM workouts */}
            {formData.type === 'GYM' && (
              <WorkoutExerciseTracker
                exercises={formData.exercises}
                onExercisesChange={(exercises) => updateFormData('exercises', exercises)}
                availableExercises={availableExercises}
                onCreateExercise={onCreateExercise}
              />
            )}

            {/* Fingerboard Hang Tracker - Only for FINGERBOARD workouts */}
            {formData.type === 'FINGERBOARD' && (
              <FingerboardHangTracker
                hangs={formData.fingerboardHangs}
                onHangsChange={(hangs) => updateFormData('fingerboardHangs', hangs)}
              />
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📝 {t('workouts.notes') || 'Notes'}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Add any notes about your workout, how you felt, what you learned..."
                rows={4}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 resize-none"
              />
            </div>

            {/* Gratitude Section - Collapsed by default */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <button
                type="button"
                onClick={() => setIsGratitudeExpanded(!isGratitudeExpanded)}
                className="w-full flex items-center justify-between text-left p-4"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🙏</span>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                      {t('workouts.gratitude') || 'Gratitude'}
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {t('workouts.gratitudeDescription') || 'Reflect on what you\'re grateful for and what to improve'}
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-yellow-600 dark:text-yellow-400 transition-transform ${
                    isGratitudeExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isGratitudeExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* 3 things I am grateful for */}
                  <div>
                    <label className="block text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                      {t('workouts.gratefulFor') || '3 things I am grateful for'}
                    </label>
                    <textarea
                      value={formData.gratitude}
                      onChange={(e) => updateFormData('gratitude', e.target.value)}
                      placeholder={t('workouts.gratefulForPlaceholder') || 'What are you grateful for today? What went well? What made you happy?'}
                      rows={4}
                      className="w-full border border-yellow-300 dark:border-yellow-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                    />
                  </div>

                  {/* 3 things to do better next time */}
                  <div>
                    <label className="block text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                      {t('workouts.improvements') || '3 things to do better next time'}
                    </label>
                    <textarea
                      value={formData.improvements}
                      onChange={(e) => updateFormData('improvements', e.target.value)}
                      placeholder={t('workouts.improvementsPlaceholder') || 'What could you do better? What did you learn? How can you improve?'}
                      rows={4}
                      className="w-full border border-yellow-300 dark:border-yellow-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Strong Mind Section - Only for Lead Climbing */}
            {(formData.type === 'LEAD_ROCK' || formData.type === 'LEAD_ARTIFICIAL') && (
              <StrongMindSection
                mentalState={formData.mentalState}
                onChange={(mentalState) => updateFormData('mentalState', mentalState)}
                workoutType={formData.type}
              />
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
                <span>{initialData ? 'Aktualizuj' : t('common.save')} Trening</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
