'use client';

import { useState, useMemo } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { useCycle } from '@/contexts/CycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { OFFLINE_WORKOUT_QUEUED_EVENT } from './OfflineSyncManager';
import { OFFLINE_WORKOUTS_CHANGED_EVENT } from '@/lib/offline-sync';
import { toLocalDateString } from '@/lib/date-utils';
import { calculateCycleInfo } from '@/lib/cycle-utils';
import { 
  saveOfflineWorkout, 
  generateOfflineId, 
  OfflineWorkout,
  addToSyncQueue 
} from '@/lib/offline-storage';
import { WorkoutType, TrainingVolume } from '@/types/workout';
import CycleInfoComponent from './CycleInfo';
import { StrongMindSection } from './StrongMindSection';

interface OfflineWorkoutFormProps {
  onClose: () => void;
}

const workoutTypes: { value: WorkoutType; label: string; emoji: string; description: string }[] = [
  { value: 'GYM', label: 'Gym', emoji: '🏋️', description: 'Strength training with weights' },
  { value: 'BOULDERING', label: 'Bouldering', emoji: '🧗', description: 'Short, powerful climbs' },
  { value: 'CIRCUITS', label: 'Circuits', emoji: '🔄', description: 'Endurance training circuits' },
  { value: 'LEAD_ROCK', label: 'Lead Rock', emoji: '🏔️', description: 'Outdoor lead climbing' },
  { value: 'LEAD_ARTIFICIAL', label: 'Lead Wall', emoji: '🧗‍♀️', description: 'Indoor lead climbing' },
  { value: 'MENTAL_PRACTICE', label: 'Mental Practice', emoji: '🧘', description: 'Mindfulness & mental training' },
];

const trainingVolumes: { value: TrainingVolume; label: string; description: string }[] = [
  { value: 'TR1', label: 'TR1 - Very Light', description: 'Easy recovery session' },
  { value: 'TR2', label: 'TR2 - Light', description: 'Low intensity training' },
  { value: 'TR3', label: 'TR3 - Moderate', description: 'Medium intensity training' },
  { value: 'TR4', label: 'TR4 - Hard', description: 'High intensity training' },
  { value: 'TR5', label: 'TR5 - Very Hard', description: 'Maximum intensity training' },
];

export const OfflineWorkoutForm = ({ onClose }: OfflineWorkoutFormProps) => {
  const { isOnline } = useOffline();
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  const { t } = useLanguage();
  const { showInfo } = useToast();
  
  const [formData, setFormData] = useState({
    type: 'GYM' as WorkoutType,
    date: typeof window !== 'undefined' ? toLocalDateString() : '2024-01-15',
    trainingVolume: 'TR3' as TrainingVolume,
    preSessionFeel: 3,
    dayAfterTiredness: 3,
    focusLevel: 3,
    notes: '',
    mentalState: {},
    sector: '',
    mentalPracticeType: 'MEDITATION',
    timeOfDay: [] as string[],
    gratitude: '',
    improvements: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate cycle info for the selected date
  const cycleInfoForSelectedDate = useMemo(() => {
    if (!isCycleTrackingEnabled || !cycleSettings) return null;
    
    // YYYY-MM-DD string: read as that calendar day
    return calculateCycleInfo(cycleSettings, formData.date);
  }, [formData.date, cycleSettings, isCycleTrackingEnabled]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = t('workouts.errors.workoutTypeRequired');
    }

    if (!formData.date) {
      newErrors.date = t('workouts.errors.dateRequired');
    }

    if (formData.type !== 'GYM' && formData.type !== 'MENTAL_PRACTICE' && !formData.trainingVolume) {
      newErrors.trainingVolume = t('workouts.errors.trainingVolumeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const isMentalPractice = formData.type === 'MENTAL_PRACTICE';
    const hasTrainingVolume = formData.type !== 'GYM' && !isMentalPractice;
    const hasSector = ['LEAD_ROCK', 'LEAD_ARTIFICIAL', 'BOULDERING', 'CIRCUITS'].includes(formData.type);

    // Keep only the fields the form shows for the selected type
    const workout: OfflineWorkout = {
      id: generateOfflineId(),
      type: formData.type.toLowerCase() as OfflineWorkout['type'],
      startTime: `${formData.date}T10:00:00.000Z`,
      endTime: undefined,
      trainingVolume: hasTrainingVolume ? formData.trainingVolume : undefined,
      preSessionFeel: formData.preSessionFeel,
      dayAfterTiredness: formData.dayAfterTiredness,
      focusLevel: formData.focusLevel,
      sector: hasSector ? formData.sector || undefined : undefined,
      mentalPracticeType: isMentalPractice ? formData.mentalPracticeType : undefined,
      timeOfDay: isMentalPractice && formData.timeOfDay.length > 0 ? formData.timeOfDay : undefined,
      mentalState: !isMentalPractice && Object.keys(formData.mentalState).length > 0 ? formData.mentalState : undefined,
      gratitude: isMentalPractice ? undefined : formData.gratitude || undefined,
      improvements: isMentalPractice ? undefined : formData.improvements || undefined,
      notes: formData.notes || undefined,
      createdAt: typeof window !== 'undefined' ? new Date().toISOString() : '2024-01-15T10:00:00.000Z',
      synced: false,
      exercises: [],
    };

    // Save locally first so nothing is lost if the upload fails; OfflineSyncManager uploads it
    // right away when online (and shows a toast), or once the connection is back
    saveOfflineWorkout(workout);
    addToSyncQueue(workout);
    window.dispatchEvent(new CustomEvent(OFFLINE_WORKOUTS_CHANGED_EVENT));
    window.dispatchEvent(new CustomEvent(OFFLINE_WORKOUT_QUEUED_EVENT));

    onClose();

    if (!isOnline) {
      showInfo(t('offlineForm.savedOffline'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {!isOnline ? `📱 ${t('offlineForm.titleOffline')}` : `➕ ${t('offlineForm.title')}`}
          </h2>
          <button
            onClick={onClose}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🏋️ {t('workouts.workoutType')} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {workoutTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('type', type.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.emoji}</span>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {t(`workouts.workoutTypes.${type.value}`)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📅 {t('workouts.date')} *
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

            {/* Cycle Info */}
            {cycleInfoForSelectedDate && (
              <div className={`p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 ${formData.type === 'MENTAL_PRACTICE' ? 'hidden' : ''}`}>
                <CycleInfoComponent
                  cycleInfo={cycleInfoForSelectedDate}
                  showRecommendations={true}
                  isSelectedDate={true}
                />
              </div>
            )}

            {/* Training Volume */}
            {formData.type !== 'GYM' && formData.type !== 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  💪 {t('workouts.trainingVolume')} *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {trainingVolumes.map((volume) => (
                    <button
                      key={volume.value}
                      type="button"
                      onClick={() => updateFormData('trainingVolume', volume.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.trainingVolume === volume.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-50">
                        {t(`workouts.trainingVolumes.${volume.value}`)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {t(`workouts.trainingVolumeDescriptions.${volume.value}`)}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.trainingVolume && (
                  <p className="mt-2 text-sm text-red-600">{errors.trainingVolume}</p>
                )}
              </div>
            )}

            {/* Mental Practice Type */}
            {formData.type === 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  🧘 {t('workouts.mentalPracticeType')}
                </label>
                <select
                  value={formData.mentalPracticeType}
                  onChange={(e) => updateFormData('mentalPracticeType', e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                >
                  <option value="MEDITATION">{t('workouts.mentalPracticeTypes.meditation')}</option>
                  <option value="REFLECTING">{t('workouts.mentalPracticeTypes.reflecting')}</option>
                  <option value="OTHER">{t('workouts.mentalPracticeTypes.other')}</option>
                </select>
              </div>
            )}

            {/* Time of Day for Mental Practice */}
            {formData.type === 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  🕐 {t('workouts.timeOfDay')}
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'MORNING', label: t('workouts.timeOfDayOptions.MORNING') || 'Morning', emoji: '🌅' },
                    { value: 'MIDDAY', label: t('workouts.timeOfDayOptions.MIDDAY') || 'Midday', emoji: '☀️' },
                    { value: 'EVENING', label: t('workouts.timeOfDayOptions.EVENING') || 'Evening', emoji: '🌙' }
                  ].map((time) => (
                    <label key={time.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.timeOfDay.includes(time.value)}
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

            {/* Sector Field */}
            {(formData.type === 'LEAD_ROCK' || formData.type === 'LEAD_ARTIFICIAL' || formData.type === 'BOULDERING' || formData.type === 'CIRCUITS') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  🏔️ {t('workouts.sector')}
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => updateFormData('sector', e.target.value)}
                  placeholder={t('workouts.placeholders.sector') || 'Enter the climbing sector or area...'}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                />
              </div>
            )}

            {/* Pre-session Feel */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                😊 {t('workouts.preSessionFeel')}
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="cursor-pointer">
                    <input
                      type="radio"
                      name="preSessionFeel"
                      value={rating}
                      checked={formData.preSessionFeel === rating}
                      onChange={(e) => updateFormData('preSessionFeel', parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.preSessionFeel === rating
                          ? 'border-blue-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      } ${
                        rating <= formData.preSessionFeel
                          ? 'bg-blue-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  </label>
                ))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t(`workouts.ratingLabels.preSessionFeel.${formData.preSessionFeel}`)}
              </div>
            </div>

            {/* Day After Tiredness */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                😴 {t('workouts.dayAfterTiredness')}
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="cursor-pointer">
                    <input
                      type="radio"
                      name="dayAfterTiredness"
                      value={rating}
                      checked={formData.dayAfterTiredness === rating}
                      onChange={(e) => updateFormData('dayAfterTiredness', parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.dayAfterTiredness === rating
                          ? 'border-orange-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      } ${
                        rating <= formData.dayAfterTiredness
                          ? 'bg-orange-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  </label>
                ))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t(`workouts.ratingLabels.dayAfterTiredness.${formData.dayAfterTiredness}`)}
              </div>
            </div>

            {/* Focus Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🎯 {t('workouts.focusLevel')}
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
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
                        formData.focusLevel === rating
                          ? 'border-green-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      } ${
                        rating <= formData.focusLevel
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  </label>
                ))}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {t(`workouts.ratingLabels.focusLevel.${formData.focusLevel}`)}
              </div>
            </div>

            {/* Strong Mind Section */}
            {formData.type !== 'MENTAL_PRACTICE' && (
              <StrongMindSection
                mentalState={formData.mentalState}
                onChange={(mentalState) => updateFormData('mentalState', mentalState)}
                workoutType={formData.type}
              />
            )}

            {/* Gratitude */}
            {formData.type !== 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('workouts.gratitude') || '3 things I am grateful for'}
                </label>
                <textarea
                  value={formData.gratitude}
                  onChange={(e) => updateFormData('gratitude', e.target.value)}
                  placeholder={t('workouts.gratitudePlaceholder') || 'What are you grateful for from this training session?'}
                  rows={3}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 resize-none"
                />
              </div>
            )}

            {/* Improvements */}
            {formData.type !== 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('workouts.improvements') || '3 things to do better next time'}
                </label>
                <textarea
                  value={formData.improvements}
                  onChange={(e) => updateFormData('improvements', e.target.value)}
                  placeholder={t('workouts.improvementsPlaceholder') || 'What would you like to improve for next time?'}
                  rows={3}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 resize-none"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📝 {t('workouts.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder={t('workouts.placeholders.workoutNotes') || 'Add any additional notes about your workout...'}
                rows={3}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>💾</span>
            <span>{!isOnline ? t('offlineForm.saveOffline') : t('workouts.saveWorkout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
