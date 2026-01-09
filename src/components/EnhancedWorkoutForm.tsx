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
import { Tooltip } from './Tooltip';

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
  isDuplicating?: boolean; // Indicates if this is a duplication (not editing)
}

// Workout types will be generated dynamically with translations
const getWorkoutTypes = (t: (key: string) => string): { value: WorkoutType; label: string; emoji: string; description: string }[] => [
  { value: 'GYM', label: t('workouts.workoutTypes.GYM') || 'Gym', emoji: '🏋️', description: t('workouts.workoutTypeDescriptions.GYM') || 'Strength training with weights' },
  { value: 'BOULDERING', label: t('workouts.workoutTypes.BOULDERING') || 'Bouldering', emoji: '🧗', description: t('workouts.workoutTypeDescriptions.BOULDERING') || 'Short, powerful climbs' },
  { value: 'CIRCUITS', label: t('workouts.workoutTypes.CIRCUITS') || 'Circuits', emoji: '🔄', description: t('workouts.workoutTypeDescriptions.CIRCUITS') || 'Endurance training circuits' },
  { value: 'LEAD_ROCK', label: t('workouts.workoutTypes.LEAD_ROCK') || 'Lead Rock', emoji: '🏔️', description: t('workouts.workoutTypeDescriptions.LEAD_ROCK') || 'Outdoor lead climbing' },
  { value: 'LEAD_ARTIFICIAL', label: t('workouts.workoutTypes.LEAD_ARTIFICIAL') || 'Lead Wall', emoji: '🧗‍♀️', description: t('workouts.workoutTypeDescriptions.LEAD_ARTIFICIAL') || 'Indoor lead climbing' },
  { value: 'MENTAL_PRACTICE', label: t('workouts.workoutTypes.MENTAL_PRACTICE') || 'Mental Practice', emoji: '🧘', description: t('workouts.workoutTypeDescriptions.MENTAL_PRACTICE') || 'Mindfulness & mental training' },
  { value: 'FINGERBOARD', label: t('workouts.workoutTypes.FINGERBOARD') || 'Fingerboard', emoji: '🖐️', description: t('workouts.workoutTypeDescriptions.FINGERBOARD') || 'Finger strength training' },
];

// Training volumes will be generated dynamically with translations
const getTrainingVolumes = (t: (key: string) => string): { value: TrainingVolume; label: string; description: string }[] => [
  { value: 'TR1', label: t('workouts.trainingVolumes.TR1') || 'TR1 - Very Light', description: t('workouts.trainingVolumeDescriptions.TR1') || 'Easy recovery session' },
  { value: 'TR2', label: t('workouts.trainingVolumes.TR2') || 'TR2 - Light', description: t('workouts.trainingVolumeDescriptions.TR2') || 'Low intensity training' },
  { value: 'TR3', label: t('workouts.trainingVolumes.TR3') || 'TR3 - Moderate', description: t('workouts.trainingVolumeDescriptions.TR3') || 'Medium intensity training' },
  { value: 'TR4', label: t('workouts.trainingVolumes.TR4') || 'TR4 - Hard', description: t('workouts.trainingVolumeDescriptions.TR4') || 'High intensity training' },
  { value: 'TR5', label: t('workouts.trainingVolumes.TR5') || 'TR5 - Very Hard', description: t('workouts.trainingVolumeDescriptions.TR5') || 'Maximum intensity training' },
];


export default function EnhancedWorkoutForm({ onSubmit, onCancel, initialData, availableTags = [], onCreateTag, isSubmitting = false, availableExercises = [], onCreateExercise, defaultDate, isDuplicating = false }: EnhancedWorkoutFormProps) {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  const { t } = useLanguage();

  // Set current date on client side to prevent hydration mismatch
  // Also handle duplication: when defaultDate is provided, use it even if initialData exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (defaultDate) {
        // When duplicating, always use defaultDate
      setFormData(prev => ({
        ...prev,
          date: defaultDate
        }))
      } else if (!initialData?.startTime) {
        // When creating new workout, use today's date
        setFormData(prev => ({
          ...prev,
          date: new Date().toISOString().slice(0, 10)
      }))
      }
    }
  }, [initialData?.startTime, defaultDate])

  // Load goals from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProcessGoals = localStorage.getItem('processGoals')
      const storedProjectGoals = localStorage.getItem('projectGoals')
      
      if (storedProcessGoals) {
        try {
          const goals = JSON.parse(storedProcessGoals)
          setProcessGoals(goals)
        } catch (e) {
          console.error('Error parsing process goals:', e)
        }
      }
      
      if (storedProjectGoals) {
        try {
          const goals = JSON.parse(storedProjectGoals)
          setProjectGoals(goals)
        } catch (e) {
          console.error('Error parsing project goals:', e)
        }
      }
    }
  }, [])

  // Load selected goals from initialData
  useEffect(() => {
    if (initialData?.mentalState) {
      const processGoalIds = new Set(
        initialData.mentalState.processGoals?.map((pg: any) => pg.goalId) || []
      )
      const projectGoalIds = new Set(
        initialData.mentalState.projectGoals?.map((pg: any) => pg.goalId) || []
      )
      setSelectedProcessGoalIds(processGoalIds)
      setSelectedProjectGoalIds(projectGoalIds)
    }
  }, [initialData])

  // Load exercises and fingerboard hangs from initialData
  useEffect(() => {
    if (initialData) {
      // Load variation info from details if it exists
      if (initialData.details && typeof initialData.details === 'object' && 'routineVariation' in initialData.details) {
        const details = initialData.details as any
        if (details.routineVariation) {
          setFormData(prev => ({ ...prev, routineVariation: details.routineVariation }))
        }
      }

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
    // When duplicating (defaultDate provided), use defaultDate instead of initialData date
    date: defaultDate || (initialData?.startTime 
      ? new Date(initialData.startTime).toISOString().slice(0, 10)
      : '2024-01-15'), // Use defaultDate if provided (for duplication), otherwise use initialData date or default
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
    routineVariation: null as { routineName: string; variationName: string } | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGratitudeExpanded, setIsGratitudeExpanded] = useState(false);
  const [isCycleExpanded, setIsCycleExpanded] = useState(false);
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(false);
  const [isRecurringExpanded, setIsRecurringExpanded] = useState(false);
  const [recurringSettings, setRecurringSettings] = useState({
    enabled: false,
    startDate: '',
    endDate: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'custom',
    customDays: 7,
  });
  const [processGoals, setProcessGoals] = useState<Array<{
    id: string
    timeframeValue: string
    timeframeUnit: string
    startDate: string
    goalDescription: string
    createdAt: string
  }>>([]);
  const [projectGoals, setProjectGoals] = useState<Array<{
    id: string
    climbingType: string
    gradeSystem: string
    routeGrade: string
    routeName: string
    sectorLocation: string
    relatedProcessGoal: string
    createdAt: string
  }>>([]);
  const [selectedProcessGoalIds, setSelectedProcessGoalIds] = useState<Set<string>>(new Set());
  const [selectedProjectGoalIds, setSelectedProjectGoalIds] = useState<Set<string>>(new Set());
  const [showIncompleteDataModal, setShowIncompleteDataModal] = useState(false);
  const [incompleteExercises, setIncompleteExercises] = useState<string[]>([]);

  // Calculate cycle info for the selected date
  const cycleInfoForSelectedDate = useMemo(() => {
    if (!isCycleTrackingEnabled || !cycleSettings) return null;
    
    const selectedDate = new Date(formData.date);
    return calculateCycleInfo(cycleSettings, selectedDate);
  }, [formData.date, cycleSettings, isCycleTrackingEnabled]);

  // Check for incomplete data (missing weights/reps in exercises)
  const checkIncompleteData = (): { hasIncomplete: boolean; incompleteList: string[] } => {
    const incomplete: string[] = [];
    
    // Check gym exercises
    if (formData.exercises && formData.exercises.length > 0) {
      formData.exercises.forEach((exercise, exIdx) => {
        if (exercise.sets && exercise.sets.length > 0) {
          exercise.sets.forEach((set, setIdx) => {
            const hasWeight = set.weight !== null && set.weight !== undefined && set.weight > 0;
            const hasReps = set.reps !== null && set.reps !== undefined && set.reps > 0;
            
            // If neither weight nor reps are filled, consider it incomplete
            if (!hasWeight && !hasReps) {
              const exerciseName = exercise.exerciseName || `Exercise ${exIdx + 1}`;
              const entry = `${exerciseName} (Set ${setIdx + 1})`;
              if (!incomplete.includes(entry)) {
                incomplete.push(entry);
              }
            }
          });
        }
      });
    }
    
    // Check fingerboard hangs
    if (formData.fingerboardHangs && formData.fingerboardHangs.length > 0) {
      formData.fingerboardHangs.forEach((hang, hangIdx) => {
        const hasTime = hang.timeSeconds !== null && hang.timeSeconds !== undefined && hang.timeSeconds > 0;
        const hasReps = hang.reps !== null && hang.reps !== undefined && hang.reps > 0;
        
        // If neither time nor reps are filled, consider it incomplete
        if (!hasTime && !hasReps) {
          incomplete.push(`Hang ${hangIdx + 1}`);
        }
      });
    }
    
    return {
      hasIncomplete: incomplete.length > 0,
      incompleteList: incomplete
    };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = t('workouts.errors.workoutTypeRequired') || 'Please select a workout type';
    }

    if (!formData.date) {
      newErrors.date = t('workouts.errors.dateRequired') || 'Please select a date';
    }

    if (formData.type !== 'GYM' && formData.type !== 'MENTAL_PRACTICE' && formData.type !== 'FINGERBOARD' && !formData.trainingVolume) {
      newErrors.trainingVolume = t('workouts.errors.trainingVolumeRequired') || 'Please select training volume';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    // Check for incomplete data (before submitting)
    const { hasIncomplete, incompleteList } = checkIncompleteData();
    if (hasIncomplete && !showIncompleteDataModal) {
      // Show modal to confirm
      setIncompleteExercises(incompleteList);
      setShowIncompleteDataModal(true);
      return; // Stop here and wait for user decision
    }

    // Prepare details object - preserve existing details and merge with new data
    let details: any = undefined
    if (initialData?.details && typeof initialData.details === 'object') {
      // Preserve existing details (e.g., quickLog flag)
      details = { ...initialData.details }
    }
    
    // Add/update variation info for gym workouts
    if (formData.type === 'GYM' && formData.routineVariation) {
      details = details || {}
      details.routineVariation = formData.routineVariation
    }

    // Build mentalState with selected goals
    const mentalState = {
      ...formData.mentalState,
      processGoals: Array.from(selectedProcessGoalIds).map(goalId => ({
        goalId,
        progress: formData.mentalState?.processGoals?.find((pg: any) => pg.goalId === goalId)?.progress || 1
      })),
      projectGoals: Array.from(selectedProjectGoalIds).map(goalId => ({
        goalId,
        completed: formData.mentalState?.projectGoals?.find((pg: any) => pg.goalId === goalId)?.completed || false
      }))
    }

    const workoutData: WorkoutFormData & { details?: any } = {
      type: formData.type,
      date: formData.date,
      trainingVolume: formData.trainingVolume,
      focusLevel: formData.focusLevel,
      notes: formData.notes,
      mentalState,
      sector: formData.sector,
      mentalPracticeType: formData.mentalPracticeType,
      // Only include timeOfDay for MENTAL_PRACTICE workouts and if it has values
      timeOfDay: formData.type === 'MENTAL_PRACTICE' && formData.timeOfDay && formData.timeOfDay.length > 0 
        ? formData.timeOfDay 
        : undefined,
      tagIds: formData.tagIds,
      exercises: formData.exercises.length > 0 ? formData.exercises : undefined,
      fingerboardHangs: formData.fingerboardHangs.length > 0 ? formData.fingerboardHangs : undefined,
      gratitude: formData.gratitude || undefined,
      improvements: formData.improvements || undefined,
      details,
    };

    // Handle recurring workouts if enabled (only for new workouts, not editing)
    if (!initialData && recurringSettings.enabled && recurringSettings.startDate && recurringSettings.endDate) {
      // Validate recurring settings
      if (new Date(recurringSettings.startDate) > new Date(recurringSettings.endDate)) {
        setErrors({ ...errors, recurring: t('workouts.errors.recurringEndBeforeStart') || 'End date must be after start date' })
        return
      }

      const dates = calculateRecurringDates(
        recurringSettings.startDate,
        recurringSettings.endDate,
        recurringSettings.frequency,
        recurringSettings.customDays
      )

      if (dates.length === 0) {
        setErrors({ ...errors, recurring: t('workouts.errors.recurringNoDates') || 'No dates generated. Please check your settings.' })
        return
      }
      
      // Create workouts for each date
      for (const date of dates) {
        await onSubmit({ ...workoutData, date })
      }
    } else {
      await onSubmit(workoutData)
    }
  };

  // Calculate recurring dates
  const calculateRecurringDates = (startDateStr: string, endDateStr: string, frequency: string, customDays: number): string[] => {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    const dates: string[] = []

    if (frequency === 'daily') {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10))
      }
    } else if (frequency === 'weekly') {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
        dates.push(d.toISOString().slice(0, 10))
      }
    } else {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + customDays)) {
        dates.push(d.toISOString().slice(0, 10))
      }
    }

    return dates
  }

  // Calculate preview count for recurring workouts
  const recurringPreviewCount = useMemo(() => {
    if (!recurringSettings.enabled || !recurringSettings.startDate || !recurringSettings.endDate) {
      return 0
    }
    return calculateRecurringDates(
      recurringSettings.startDate,
      recurringSettings.endDate,
      recurringSettings.frequency,
      recurringSettings.customDays
    ).length
  }, [recurringSettings])

  // Initialize recurring settings when form loads (only for new workouts)
  useEffect(() => {
    if (!initialData && typeof window !== 'undefined') {
      setRecurringSettings({
        enabled: false,
        startDate: formData.date,
        endDate: '',
        frequency: 'weekly',
        customDays: 7,
      })
    }
  }, [initialData])

  // Update start date when workout date changes
  useEffect(() => {
    if (!initialData && recurringSettings.startDate) {
      setRecurringSettings(prev => ({ ...prev, startDate: formData.date }))
    }
  }, [formData.date, initialData])

  const updateFormData = (field: string, value: string | number | object | null) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear timeOfDay when workout type changes away from MENTAL_PRACTICE
      if (field === 'type' && value !== 'MENTAL_PRACTICE') {
        updated.timeOfDay = [];
      }
      
      // Clear mentalPracticeType when workout type changes away from MENTAL_PRACTICE
      if (field === 'type' && value !== 'MENTAL_PRACTICE') {
        updated.mentalPracticeType = null as any;
      }
      
      return updated;
    });
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
            {isDuplicating
              ? `📋 ${t('workouts.formDuplicateTitle') || 'Duplicate Workout'}`
              : initialData 
              ? `✏️ ${t('workouts.formEditTitle') || 'Edit Workout'}` 
              : `➕ ${t('workouts.formTitle') || 'Add New Workout'}`}
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
            {/* Date Selection - At the top */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                📅 {t('workouts.date') || 'Date'} *
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

            {/* Workout Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                🏋️ {t('workouts.workoutTypeLabel') || 'Workout Type'} *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {getWorkoutTypes(t).map((type) => (
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

            {/* Cycle Info Display - Collapsible */}
            {cycleInfoForSelectedDate && formData.type !== 'MENTAL_PRACTICE' && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <button
                  type="button"
                  onClick={() => setIsCycleExpanded(!isCycleExpanded)}
                  className="w-full flex items-center justify-between text-left p-4"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌸</span>
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        {t('workouts.labels.cycleInfo') || 'Cycle Information'}
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {t('workouts.labels.cycleInfoDescription') || 'View your cycle information and recommendations'}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${
                      isCycleExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isCycleExpanded && (
                  <div className="px-4 pb-4">
                    <CycleInfoComponent 
                      cycleInfo={cycleInfoForSelectedDate} 
                      showRecommendations={true}
                      isSelectedDate={true}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Goals Section - Collapsible */}
            {(processGoals.length > 0 || projectGoals.length > 0) && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <button
                  type="button"
                  onClick={() => setIsGoalsExpanded(!isGoalsExpanded)}
                  className="w-full flex items-center justify-between text-left p-4"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                        {t('workouts.labels.goals') || 'Goals'}
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {t('workouts.labels.goalsDescription') || 'Link this workout to your goals'}
                        {selectedProcessGoalIds.size > 0 || selectedProjectGoalIds.size > 0 ? (
                          <span className="ml-2 font-medium">
                            ({selectedProcessGoalIds.size + selectedProjectGoalIds.size} {t('workouts.labels.selected') || 'selected'})
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-yellow-600 dark:text-yellow-400 transition-transform ${
                      isGoalsExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isGoalsExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Process Goals */}
                    {processGoals.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-3">
                          🎯 {t('strongMind.processGoals') || 'Process Goals'}
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {processGoals.map(goal => (
                            <label
                              key={goal.id}
                              className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-700 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProcessGoalIds.has(goal.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedProcessGoalIds)
                                  if (e.target.checked) {
                                    newSet.add(goal.id)
                                  } else {
                                    newSet.delete(goal.id)
                                  }
                                  setSelectedProcessGoalIds(newSet)
                                }}
                                className="mt-1 w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`) || goal.timeframeUnit}: {goal.goalDescription}
                                </div>
                                {goal.startDate && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {t('strongMind.startingFrom') || 'starting from'} {new Date(goal.startDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Project Goals */}
                    {projectGoals.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-3">
                          🏔️ {t('strongMind.projectGoals') || 'Project Goals'}
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {projectGoals.map(goal => (
                            <label
                              key={goal.id}
                              className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-700 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProjectGoalIds.has(goal.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedProjectGoalIds)
                                  if (e.target.checked) {
                                    newSet.add(goal.id)
                                  } else {
                                    newSet.delete(goal.id)
                                  }
                                  setSelectedProjectGoalIds(newSet)
                                }}
                                className="mt-1 w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 dark:focus:ring-yellow-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {goal.routeGrade} {goal.routeName} - {goal.sectorLocation}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {goal.climbingType === 'route' ? '🧗‍♀️ Route' : '🧗 Boulder'} • {goal.gradeSystem}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {processGoals.length === 0 && projectGoals.length === 0 && (
                      <div className="text-center py-4 text-sm text-yellow-700 dark:text-yellow-300">
                        {t('workouts.labels.noGoalsAvailable') || 'No goals available. Create goals in the Strong Mind section.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Training Volume (for non-gym, non-mental practice, and non-fingerboard workouts) */}
            {formData.type !== 'GYM' && formData.type !== 'MENTAL_PRACTICE' && formData.type !== 'FINGERBOARD' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  📊 {t('workouts.trainingVolumeLabel') || 'Training Volume'} *
                  <Tooltip content={t('workouts.tooltips.trainingVolume') || 'Training Volume (TR) indicates the intensity of your workout. TR1 is very light recovery, TR5 is maximum intensity. Choose based on how hard you trained.'}>
                    <span className="text-slate-500 dark:text-slate-400 cursor-help">ℹ️</span>
                  </Tooltip>
                </label>
                <div className="flex space-x-2">
                  {getTrainingVolumes(t).map((volume) => (
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  🧘 {t('workouts.focusLevel') || 'Focus Level (1-5)'}
                  <Tooltip content={t('workouts.tooltips.focusLevel') || 'Rate your focus during the workout (1 = very distracted, 5 = very focused). Helps identify what affects your concentration.'}>
                    <span className="text-slate-500 dark:text-slate-400 cursor-help">ℹ️</span>
                  </Tooltip>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  🏔️ {t('workouts.sector') || 'Sector'}
                  <Tooltip content={t('workouts.tooltips.sector') || 'The climbing area or location where you trained (e.g., \'Fontainebleau - Bas Cuvier\'). Useful for tracking where you climb.'}>
                    <span className="text-slate-500 dark:text-slate-400 cursor-help">ℹ️</span>
                  </Tooltip>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  🧘 {t('workouts.mentalPracticeType') || 'Practice Type'}
                  <Tooltip content={t('workouts.tooltips.mentalPracticeType') || 'Type of mental practice: Meditation (mindfulness), Reflecting (self-reflection), Other (custom practice).'}>
                    <span className="text-slate-500 dark:text-slate-400 cursor-help">ℹ️</span>
                  </Tooltip>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  🕐 {t('workouts.timeOfDay') || 'Time of Day'}
                  <Tooltip content={t('workouts.tooltips.timeOfDay') || 'When you did the mental practice: Morning (🌅), Midday (☀️), Evening (🌙). Track patterns in your practice timing.'}>
                    <span className="text-slate-500 dark:text-slate-400 cursor-help">ℹ️</span>
                  </Tooltip>
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
                onVariationChange={(variationInfo) => updateFormData('routineVariation', variationInfo)}
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
                placeholder={t('workouts.notesPlaceholder') || 'Add any notes about your workout, how you felt, what you learned...'}
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
                    <label className="block text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                      {t('workouts.improvements') || '3 things to do better next time'}
                      <Tooltip content={t('workouts.tooltips.improvements') || 'Note 3 things you want to improve or do better next time. This helps you learn and grow from each session.'}>
                        <span className="text-yellow-600 dark:text-yellow-400 cursor-help">ℹ️</span>
                      </Tooltip>
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

            {/* Recurring Workouts Section - Only when creating (not editing) */}
            {!initialData && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <button
                  type="button"
                  onClick={() => setIsRecurringExpanded(!isRecurringExpanded)}
                  className="w-full flex items-center justify-between text-left p-4"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔁</span>
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        {t('workouts.recurringTitle') || 'Create Recurring Workouts'}
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {t('workouts.recurringDescription') || 'Create multiple copies of this workout at regular intervals'}
                      </p>
                    </div>
                  </div>
                  <span className="text-purple-600 dark:text-purple-400">
                    {isRecurringExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {isRecurringExpanded && (
                  <div className="p-4 pt-0 space-y-4">
                    {/* Enable Recurring Toggle */}
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recurringSettings.enabled}
                        onChange={(e) => setRecurringSettings({ ...recurringSettings, enabled: e.target.checked })}
                        className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {t('workouts.enableRecurring') || 'Make this workout recurring'}
                      </span>
                    </label>

                    {recurringSettings.enabled && (
                      <>
                        {/* Start Date */}
                        <div>
                          <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                            {t('workouts.recurringStartDate') || 'Start Date'} *
                          </label>
                          <input
                            type="date"
                            value={recurringSettings.startDate}
                            onChange={(e) => {
                              setRecurringSettings({ ...recurringSettings, startDate: e.target.value })
                              // Clear error when user changes date
                              if (errors.recurring) {
                                setErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors.recurring
                                  return newErrors
                                })
                              }
                            }}
                            min={formData.date}
                            className="w-full bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        {/* End Date */}
                        <div>
                          <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                            {t('workouts.recurringEndDate') || 'End Date'} *
                          </label>
                          <input
                            type="date"
                            value={recurringSettings.endDate}
                            onChange={(e) => {
                              setRecurringSettings({ ...recurringSettings, endDate: e.target.value })
                              // Clear error when user changes date
                              if (errors.recurring) {
                                setErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors.recurring
                                  return newErrors
                                })
                              }
                            }}
                            min={recurringSettings.startDate || formData.date}
                            className="w-full bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                            {t('workouts.recurringFrequency') || 'Frequency'} *
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-400 cursor-pointer">
                              <input
                                type="radio"
                                name="recurringFrequency"
                                value="daily"
                                checked={recurringSettings.frequency === 'daily'}
                                onChange={(e) => setRecurringSettings({ ...recurringSettings, frequency: 'daily' })}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-purple-900 dark:text-purple-100">{t('workouts.frequencyDaily') || 'Daily'}</span>
                            </label>
                            <label className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-400 cursor-pointer">
                              <input
                                type="radio"
                                name="recurringFrequency"
                                value="weekly"
                                checked={recurringSettings.frequency === 'weekly'}
                                onChange={(e) => setRecurringSettings({ ...recurringSettings, frequency: 'weekly' })}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-purple-900 dark:text-purple-100">{t('workouts.frequencyWeekly') || 'Weekly'}</span>
                            </label>
                            <label className="flex items-center space-x-2 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-purple-200 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-400 cursor-pointer">
                              <input
                                type="radio"
                                name="recurringFrequency"
                                value="custom"
                                checked={recurringSettings.frequency === 'custom'}
                                onChange={(e) => setRecurringSettings({ ...recurringSettings, frequency: 'custom' })}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-purple-900 dark:text-purple-100">{t('workouts.frequencyEvery') || 'Every'}</span>
                              <input
                                type="number"
                                min="1"
                                value={recurringSettings.customDays}
                                onChange={(e) => setRecurringSettings({ ...recurringSettings, customDays: parseInt(e.target.value) || 1 })}
                                disabled={recurringSettings.frequency !== 'custom'}
                                className="w-20 bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-lg px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                              />
                              <span className="text-purple-900 dark:text-purple-100">{t('workouts.frequencyDays') || 'days'}</span>
                            </label>
                          </div>
                        </div>

                        {/* Error Display */}
                        {errors.recurring && (
                          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-600">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                              {errors.recurring}
                            </p>
                          </div>
                        )}

                        {/* Preview */}
                        {recurringPreviewCount > 0 && !errors.recurring && (
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-600">
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                              {recurringPreviewCount === 1 
                                ? (t('workouts.recurringPreview') || `This will create ${recurringPreviewCount} workout`).replace('{{count}}', recurringPreviewCount.toString())
                                : (t('workouts.recurringPreview_plural') || `This will create ${recurringPreviewCount} workouts`).replace('{{count}}', recurringPreviewCount.toString())}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
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
                <span>{t('common.save') || 'Save'}...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{initialData 
                  ? t('workouts.updateWorkout') || 'Update Workout'
                  : t('workouts.saveWorkout') || 'Save Workout'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Incomplete Data Confirmation Modal */}
      {showIncompleteDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-orange-300 dark:border-orange-600">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <span className="mr-2">⚠️</span>
                {t('workouts.incompleteData.title') || 'Incomplete Data'}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('workouts.incompleteData.message') || 'Some exercises have missing weights or reps. Do you want to save the workout with incomplete data?'}
              </p>
              
              {/* List of incomplete exercises */}
              {incompleteExercises.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 mb-4 border border-orange-200 dark:border-orange-700">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-2">
                    {t('workouts.incompleteData.incompleteItems') || 'Incomplete items:'}
                  </p>
                  <ul className="list-disc list-inside text-sm text-orange-800 dark:text-orange-300 space-y-1">
                    {incompleteExercises.slice(0, 5).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {incompleteExercises.length > 5 && (
                      <li className="text-orange-600 dark:text-orange-400">
                        {t('workouts.incompleteData.andMore') || `...and ${incompleteExercises.length - 5} more`}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowIncompleteDataModal(false);
                  setIncompleteExercises([]);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl border border-gray-300 dark:border-gray-600"
              >
                {t('workouts.incompleteData.goBack') || 'Go Back & Fill'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIncompleteDataModal(false);
                  setIncompleteExercises([]);
                  // Re-submit the form (this time modal won't show)
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                  handleSubmit(fakeEvent);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors shadow-lg"
              >
                {t('workouts.incompleteData.saveAnyway') || 'Save Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
