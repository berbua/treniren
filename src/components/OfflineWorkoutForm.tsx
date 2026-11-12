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
import { BottomSheet, Button, ChoiceChip, FieldError, Input, Label, Select, Textarea, WorkoutTypeChip, phaseBandBg } from './ui';

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
    <BottomSheet
      isOpen
      onClose={onClose}
      closeLabel={t('common.close')}
      className="sm:max-w-2xl"
      title={!isOnline ? `📱 ${t('offlineForm.titleOffline')}` : `➕ ${t('offlineForm.title')}`}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="offline-workout-form" variant="accent" size="lg" className="flex-[2]">
            <span aria-hidden>💾</span>
            {!isOnline ? t('offlineForm.saveOffline') : t('workouts.saveWorkout')}
          </Button>
        </div>
      }
    >
      <form id="offline-workout-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Workout Type Selection */}
        <div>
          <Label>🏋️ {t('workouts.workoutType')} *</Label>
          <div className="flex flex-wrap gap-2">
            {workoutTypes.map((type) => (
              <WorkoutTypeChip
                key={type.value}
                workoutType={type.value}
                selected={formData.type === type.value}
                icon={type.emoji}
                onClick={() => updateFormData('type', type.value)}
              >
                {t(`workouts.workoutTypes.${type.value}`)}
              </WorkoutTypeChip>
            ))}
          </div>
          <FieldError>{errors.type}</FieldError>
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="offline-date">📅 {t('workouts.date')} *</Label>
          <Input
            id="offline-date"
            type="date"
            value={formData.date}
            onChange={(e) => updateFormData('date', e.target.value)}
            aria-invalid={!!errors.date}
          />
          <FieldError>{errors.date}</FieldError>
        </div>

        {/* Cycle Info */}
        {cycleInfoForSelectedDate && (
          <div className={`p-4 rounded-uc-card ${phaseBandBg[cycleInfoForSelectedDate.phase]} ${formData.type === 'MENTAL_PRACTICE' ? 'hidden' : ''}`}>
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
            <Label>💪 {t('workouts.trainingVolume')} *</Label>
            <div className="grid grid-cols-1 gap-2">
              {trainingVolumes.map((volume) => {
                const selected = formData.trainingVolume === volume.value
                return (
                  <button
                    key={volume.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updateFormData('trainingVolume', volume.value)}
                    className={`min-h-11 px-3.5 py-2.5 rounded-[14px] border text-left transition-colors ${
                      selected
                        ? 'bg-uc-primary text-uc-on-primary border-uc-primary'
                        : 'bg-uc-elevated text-uc-text border-uc-border hover:border-uc-primary'
                    }`}
                  >
                    <div className="text-sm font-extrabold uc-num">
                      {t(`workouts.trainingVolumes.${volume.value}`)}
                    </div>
                    <div className={`text-[13px] ${selected ? '' : 'text-uc-text-muted'}`}>
                      {t(`workouts.trainingVolumeDescriptions.${volume.value}`)}
                    </div>
                  </button>
                )
              })}
            </div>
            <FieldError>{errors.trainingVolume}</FieldError>
          </div>
        )}

        {/* Mental Practice Type */}
        {formData.type === 'MENTAL_PRACTICE' && (
          <div>
            <Label htmlFor="offline-mental-type">🧘 {t('workouts.mentalPracticeType')}</Label>
            <Select
              id="offline-mental-type"
              value={formData.mentalPracticeType}
              onChange={(e) => updateFormData('mentalPracticeType', e.target.value)}
            >
              <option value="MEDITATION">{t('workouts.mentalPracticeTypes.meditation')}</option>
              <option value="REFLECTING">{t('workouts.mentalPracticeTypes.reflecting')}</option>
              <option value="OTHER">{t('workouts.mentalPracticeTypes.other')}</option>
            </Select>
          </div>
        )}

        {/* Time of Day for Mental Practice */}
        {formData.type === 'MENTAL_PRACTICE' && (
          <div>
            <Label>🕐 {t('workouts.timeOfDay')}</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'MORNING', label: t('workouts.timeOfDayOptions.MORNING') || 'Morning', emoji: '🌅' },
                { value: 'MIDDAY', label: t('workouts.timeOfDayOptions.MIDDAY') || 'Midday', emoji: '☀️' },
                { value: 'EVENING', label: t('workouts.timeOfDayOptions.EVENING') || 'Evening', emoji: '🌙' }
              ].map((time) => {
                const selected = formData.timeOfDay.includes(time.value)
                return (
                  <ChoiceChip
                    key={time.value}
                    selected={selected}
                    onClick={() => {
                      const currentTimes = formData.timeOfDay || [];
                      updateFormData('timeOfDay', selected
                        ? currentTimes.filter(t => t !== time.value)
                        : [...currentTimes, time.value]);
                    }}
                  >
                    <span aria-hidden>{time.emoji}</span>
                    {time.label}
                  </ChoiceChip>
                )
              })}
            </div>
          </div>
        )}

        {/* Sector Field */}
        {(formData.type === 'LEAD_ROCK' || formData.type === 'LEAD_ARTIFICIAL' || formData.type === 'BOULDERING' || formData.type === 'CIRCUITS') && (
          <div>
            <Label htmlFor="offline-sector">🏔️ {t('workouts.sector')}</Label>
            <Input
              id="offline-sector"
              type="text"
              value={formData.sector}
              onChange={(e) => updateFormData('sector', e.target.value)}
              placeholder={t('workouts.placeholders.sector') || 'Enter the climbing sector or area...'}
            />
          </div>
        )}

        {/* Pre-session Feel / Day After Tiredness / Focus Level */}
        {ratingFields.map((field) => (
          <div key={field.name}>
            <Label>{field.emoji} {t(`workouts.${field.name}`)}</Label>
            <RatingDots
              name={field.name}
              value={formData[field.name]}
              filledClassName={field.filledClassName}
              onChange={(value) => updateFormData(field.name, value)}
            />
            <div className="mt-1 text-[13px] text-uc-text-muted">
              {t(`workouts.ratingLabels.${field.name}.${formData[field.name]}`)}
            </div>
          </div>
        ))}

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
            <Label htmlFor="offline-gratitude">{t('workouts.gratitude') || '3 things I am grateful for'}</Label>
            <Textarea
              id="offline-gratitude"
              value={formData.gratitude}
              onChange={(e) => updateFormData('gratitude', e.target.value)}
              placeholder={t('workouts.gratitudePlaceholder') || 'What are you grateful for from this training session?'}
              className="resize-none"
            />
          </div>
        )}

        {/* Improvements */}
        {formData.type !== 'MENTAL_PRACTICE' && (
          <div>
            <Label htmlFor="offline-improvements">{t('workouts.improvements') || '3 things to do better next time'}</Label>
            <Textarea
              id="offline-improvements"
              value={formData.improvements}
              onChange={(e) => updateFormData('improvements', e.target.value)}
              placeholder={t('workouts.improvementsPlaceholder') || 'What would you like to improve for next time?'}
              className="resize-none"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <Label htmlFor="offline-notes">📝 {t('workouts.notes')}</Label>
          <Textarea
            id="offline-notes"
            value={formData.notes}
            onChange={(e) => updateFormData('notes', e.target.value)}
            placeholder={t('workouts.placeholders.workoutNotes') || 'Add any additional notes about your workout...'}
            className="resize-none"
          />
        </div>
      </form>
    </BottomSheet>
  );
};

const ratingFields = [
  { name: 'preSessionFeel', emoji: '😊', filledClassName: 'bg-uc-primary' },
  { name: 'dayAfterTiredness', emoji: '😴', filledClassName: 'bg-uc-accent' },
  { name: 'focusLevel', emoji: '🎯', filledClassName: 'bg-uc-success' },
] as const;

/** 1–5 rating as dots (44px tap targets); dots up to the value are filled. */
function RatingDots({ name, value, filledClassName, onChange }: {
  name: string;
  value: number;
  filledClassName: string;
  onChange: (value: number) => void;
}) {
  return (
    <div role="radiogroup" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <label key={rating} className="flex size-11 cursor-pointer items-center justify-center">
          <input
            type="radio"
            name={name}
            value={rating}
            checked={value === rating}
            onChange={() => onChange(rating)}
            className="peer sr-only"
          />
          <span
            className={`size-7 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-uc-primary ${
              rating <= value ? filledClassName : 'bg-uc-skeleton'
            } ${value === rating ? 'ring-2 ring-uc-text ring-offset-2 ring-offset-uc-elevated' : ''}`}
          />
        </label>
      ))}
    </div>
  );
}
