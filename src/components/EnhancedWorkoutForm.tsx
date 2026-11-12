'use client';

import { useState, useMemo, useEffect } from 'react';
import { WorkoutType, TrainingVolume, WorkoutFormData, Workout, Tag, TimeOfDay, Exercise, WorkoutExerciseData, FingerboardWorkoutHang, ProcessGoalProgress, ProjectGoalCompletion, WallAngle, ClimbStyle, BOULDER_STYLES, wallAnglesFor } from '@/types/workout';
import { useCycle } from '@/contexts/CycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { dayNumberToDateString, storedDayNumber, toLocalDateString, toStoredDateString } from '@/lib/date-utils';
import { calculateCycleInfo } from '@/lib/cycle-utils';
import CycleInfoComponent from './CycleInfo';
import { StrongMindSection } from './StrongMindSection';
import { ProcessGoalsSection } from './ProcessGoalsSection';
import { ProcessGoal, ProjectGoal, isGoalAchieved, markGoalsAchieved } from '@/lib/strong-mind-goals';
import TagSelector from './TagSelector';
import WorkoutExerciseTracker, { setHasReps } from './WorkoutExerciseTracker';
import FingerboardHangTracker from './FingerboardHangTracker';
import { Tooltip } from './Tooltip';
import { ConfirmationDialog } from './ConfirmationDialog';
import { BottomSheet, Button, ChoiceChip, CollapsibleCard, FieldError, Icon, Input, Label, Overline, RatingDots, SegmentedControl, Textarea, WorkoutIcon, WorkoutTypeChip, phaseBandBg } from './ui';

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
  onDelete?: () => void;
}

// Workout types will be generated dynamically with translations (mockup order: lead first)
const getWorkoutTypes = (t: (key: string) => string): { value: WorkoutType; label: string; description: string }[] => [
  { value: 'LEAD_ARTIFICIAL', label: t('workouts.workoutTypes.LEAD_ARTIFICIAL') || 'Lead Wall', description: t('workouts.workoutTypeDescriptions.LEAD_ARTIFICIAL') || 'Indoor lead climbing' },
  { value: 'LEAD_ROCK', label: t('workouts.workoutTypes.LEAD_ROCK') || 'Lead Rock', description: t('workouts.workoutTypeDescriptions.LEAD_ROCK') || 'Outdoor lead climbing' },
  { value: 'BOULDERING', label: t('workouts.workoutTypes.BOULDERING') || 'Bouldering', description: t('workouts.workoutTypeDescriptions.BOULDERING') || 'Short, powerful climbs' },
  { value: 'CIRCUITS', label: t('workouts.workoutTypes.CIRCUITS') || 'Circuits', description: t('workouts.workoutTypeDescriptions.CIRCUITS') || 'Endurance training circuits' },
  { value: 'GYM', label: t('workouts.workoutTypes.GYM') || 'Gym', description: t('workouts.workoutTypeDescriptions.GYM') || 'Strength training with weights' },
  { value: 'FINGERBOARD', label: t('workouts.workoutTypes.FINGERBOARD') || 'Fingerboard', description: t('workouts.workoutTypeDescriptions.FINGERBOARD') || 'Finger strength training' },
  { value: 'MENTAL_PRACTICE', label: t('workouts.workoutTypes.MENTAL_PRACTICE') || 'Mental Practice', description: t('workouts.workoutTypeDescriptions.MENTAL_PRACTICE') || 'Mindfulness & mental training' },
];

// Training volumes will be generated dynamically with translations
const getTrainingVolumes = (t: (key: string) => string): { value: TrainingVolume; label: string; description: string }[] => [
  { value: 'TR1', label: t('workouts.trainingVolumes.TR1') || 'TR1 - Very Light', description: t('workouts.trainingVolumeDescriptions.TR1') || 'Easy recovery session' },
  { value: 'TR2', label: t('workouts.trainingVolumes.TR2') || 'TR2 - Light', description: t('workouts.trainingVolumeDescriptions.TR2') || 'Low intensity training' },
  { value: 'TR3', label: t('workouts.trainingVolumes.TR3') || 'TR3 - Moderate', description: t('workouts.trainingVolumeDescriptions.TR3') || 'Medium intensity training' },
  { value: 'TR4', label: t('workouts.trainingVolumes.TR4') || 'TR4 - Hard', description: t('workouts.trainingVolumeDescriptions.TR4') || 'High intensity training' },
  { value: 'TR5', label: t('workouts.trainingVolumes.TR5') || 'TR5 - Very Hard', description: t('workouts.trainingVolumeDescriptions.TR5') || 'Maximum intensity training' },
];


export default function EnhancedWorkoutForm({ onSubmit, onCancel, initialData, availableTags = [], onCreateTag, isSubmitting = false, availableExercises = [], onCreateExercise, defaultDate, isDuplicating = false, onDelete }: EnhancedWorkoutFormProps) {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle();
  const { t, tPlural, language } = useLanguage();

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
          date: toLocalDateString()
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
  
  const climbDetails = (initialData?.details ?? {}) as { routeName?: string; wallAngle?: WallAngle; climbStyle?: ClimbStyle };
  const [formData, setFormData] = useState({
    type: initialData?.type || 'GYM',
    // When duplicating (defaultDate provided), use defaultDate instead of initialData date
    date: defaultDate || (initialData?.startTime 
      ? toStoredDateString(initialData.startTime)
      : '2024-01-15'), // Use defaultDate if provided (for duplication), otherwise use initialData date or default
    trainingVolume: initialData?.trainingVolume || 'TR3',
    focusLevel: initialData?.focusLevel || 3,
    notes: initialData?.notes || '',
    mentalState: initialData?.mentalState || {},
    sector: initialData?.sector || '',
    mentalPracticeType: initialData?.mentalPracticeType || 'MEDITATION',
    timeOfDay: initialData?.timeOfDay || [],
    // List endpoints return tags as workoutTags join rows; the calendar edit path maps them to `tags`
    tagIds: (initialData?.tags ?? initialData?.workoutTags?.map(wt => wt.tag) ?? []).map(tag => tag.id),
    exercises: [] as WorkoutExerciseData[],
    fingerboardHangs: [] as FingerboardWorkoutHang[],
    gratitude: initialData?.gratitude || '',
    improvements: initialData?.improvements || '',
    routineVariation: null as { routineName: string; variationName: string } | null,
    routeName: climbDetails.routeName || '',
    wallAngle: climbDetails.wallAngle || null,
    climbStyle: climbDetails.climbStyle || null,
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
  const [processGoals, setProcessGoals] = useState<ProcessGoal[]>([]);
  const [projectGoals, setProjectGoals] = useState<ProjectGoal[]>([]);
  const [selectedProcessGoalIds, setSelectedProcessGoalIds] = useState<Set<string>>(new Set());
  const [selectedProjectGoalIds, setSelectedProjectGoalIds] = useState<Set<string>>(new Set());

  // Goal progress lives in mentalState so it's kept when a goal is unlinked and linked again before saving
  const getProcessGoalProgress = (goalId: string): 1 | 2 | 3 | undefined =>
    formData.mentalState?.processGoals?.find((pg: ProcessGoalProgress) => pg.goalId === goalId)?.progress;

  const updateProcessGoal = (goalId: string, changes: Partial<ProcessGoalProgress>) => {
    const current = formData.mentalState?.processGoals?.find((pg: ProcessGoalProgress) => pg.goalId === goalId);
    const others = (formData.mentalState?.processGoals || []).filter((pg: ProcessGoalProgress) => pg.goalId !== goalId);
    updateFormData('mentalState', {
      ...formData.mentalState,
      processGoals: [...others, { goalId, progress: current?.progress || 1, ...current, ...changes }],
    });
  };

  const setProcessGoalProgress = (goalId: string, progress: 1 | 2 | 3) => updateProcessGoal(goalId, { progress });

  const isProcessGoalAchieved = (goalId: string): boolean =>
    !!formData.mentalState?.processGoals?.find((pg: ProcessGoalProgress) => pg.goalId === goalId)?.achieved;

  const toggleProcessGoalAchieved = (goalId: string) =>
    updateProcessGoal(goalId, { achieved: !isProcessGoalAchieved(goalId) });

  const isProjectGoalCompleted = (goalId: string): boolean =>
    !!formData.mentalState?.projectGoals?.find((pg: ProjectGoalCompletion) => pg.goalId === goalId)?.completed;

  const toggleProjectGoalCompletion = (goalId: string) => {
    const completed = !isProjectGoalCompleted(goalId);
    const others = (formData.mentalState?.projectGoals || []).filter((pg: ProjectGoalCompletion) => pg.goalId !== goalId);
    updateFormData('mentalState', { ...formData.mentalState, projectGoals: [...others, { goalId, completed }] });
  };
  const [showIncompleteDataModal, setShowIncompleteDataModal] = useState(false);
  const [incompleteData, setIncompleteData] = useState<IncompleteData>({ exercises: [], hangs: 0 });
  // After the first save attempt with empty sets, the tracker marks them inline
  const [showSetErrors, setShowSetErrors] = useState(false);

  // Calculate cycle info for the selected date
  const cycleInfoForSelectedDate = useMemo(() => {
    if (!isCycleTrackingEnabled || !cycleSettings) return null;
    
    // YYYY-MM-DD string: read as that calendar day
    return calculateCycleInfo(cycleSettings, formData.date);
  }, [formData.date, cycleSettings, isCycleTrackingEnabled]);

  // Check for incomplete data (sets without reps, hangs without time and reps)
  const checkIncompleteData = (): IncompleteData => {
    const exercises: IncompleteData['exercises'] = [];
    formData.exercises?.forEach((exercise, exIdx) => {
      // A set without reps is empty (also when it has a weight), as in "Enter reps for set 3"
      const emptySets = (exercise.sets || []).filter((set) => !setHasReps(set)).length;
      if (emptySets > 0) {
        exercises.push({ name: exercise.exerciseName || `${t('exercises.exercise') || 'Exercise'} ${exIdx + 1}`, sets: emptySets });
      }
    });

    const hangs = (formData.fingerboardHangs || []).filter((hang) => {
      const hasTime = hang.timeSeconds !== null && hang.timeSeconds !== undefined && hang.timeSeconds > 0;
      const hasReps = hang.reps !== null && hang.reps !== undefined && hang.reps > 0;
      return !hasTime && !hasReps;
    }).length;

    return { exercises, hangs };
  };

  // Footer line: "Lead · Wall · Wed 11 Nov · TR4 · 2 climbs"
  const footerSummary = () => {
    const parts: string[] = [];
    if (formData.type) parts.push(t(`workouts.workoutTypes.${formData.type}`));
    if (formData.date) {
      parts.push(
        new Date(`${formData.date}T12:00:00`).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    }
    if (formData.trainingVolume) parts.push(formData.trainingVolume);
    const exercises = formData.type === 'GYM' ? formData.exercises?.length ?? 0 : 0;
    const hangs = formData.type === 'FINGERBOARD' ? formData.fingerboardHangs?.length ?? 0 : 0;
    const climbs = formData.mentalState?.climbSections?.length ?? 0;
    if (exercises > 0) parts.push(tPlural('workouts.exercisesCount', exercises));
    else if (hangs > 0) parts.push(tPlural('workouts.hangsCount', hangs));
    else if (climbs > 0) parts.push(tPlural('workouts.climbsCount', climbs));
    return parts.join(' · ');
  };

  // "2 sets in Weighted pull-up and 1 hang have no values." (plural forms per language)
  const incompleteSummary = () => {
    const parts = [
      ...incompleteData.exercises.map((exercise) =>
        t('workouts.incompleteData.setsIn', {
          sets: tPlural('workouts.incompleteData.sets', exercise.sets),
          exercise: exercise.name,
        })
      ),
      ...(incompleteData.hangs > 0 ? [tPlural('workouts.incompleteData.hangs', incompleteData.hangs)] : []),
    ];
    const items =
      parts.length > 1
        ? `${parts.slice(0, -1).join(', ')} ${t('workouts.incompleteData.and') || 'and'} ${parts[parts.length - 1]}`
        : parts[0] || '';
    const total = incompleteData.exercises.reduce((sum, exercise) => sum + exercise.sets, 0) + incompleteData.hangs;
    return tPlural('workouts.incompleteData.summary', total, { items });
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
    const incomplete = checkIncompleteData();
    if ((incomplete.exercises.length > 0 || incomplete.hangs > 0) && !showIncompleteDataModal) {
      // Show modal to confirm
      setIncompleteData(incomplete);
      setShowSetErrors(true);
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
    } else if (details) {
      delete details.routineVariation
    }

    // Route name (lead rock), wall angle (lead, bouldering) and style (bouldering); dropped when the type has none
    const routeName = formData.type === 'LEAD_ROCK' ? formData.routeName.trim() : ''
    const wallAngle = formData.wallAngle && wallAnglesFor(formData.type).includes(formData.wallAngle) ? formData.wallAngle : null
    const climbStyle = formData.type === 'BOULDERING' ? formData.climbStyle : null
    if (details || routeName || wallAngle || climbStyle) {
      details = { ...(details || {}) }
      if (routeName) details.routeName = routeName; else delete details.routeName
      if (wallAngle) details.wallAngle = wallAngle; else delete details.wallAngle
      if (climbStyle) details.climbStyle = climbStyle; else delete details.climbStyle
    }

    // Build mentalState with selected goals
    const mentalState = {
      ...formData.mentalState,
      processGoals: Array.from(selectedProcessGoalIds).map(goalId => ({
        goalId,
        progress: formData.mentalState?.processGoals?.find((pg: any) => pg.goalId === goalId)?.progress || 1,
        achieved: isProcessGoalAchieved(goalId)
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
      // Empty lists and null (not undefined) so clearing them on edit is saved
      exercises: formData.exercises,
      fingerboardHangs: formData.fingerboardHangs,
      gratitude: formData.gratitude || null,
      improvements: formData.improvements || null,
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

    // Goals achieved in this workout move to Strong Mind's achieved goals
    markGoalsAchieved('process', mentalState.processGoals.filter(pg => pg.achieved).map(pg => pg.goalId), workoutData.date)
    markGoalsAchieved('project', mentalState.projectGoals.filter(pg => pg.completed).map(pg => pg.goalId), workoutData.date)
  };

  // Calculate recurring dates. Steps over day numbers so the DST change can't shift or repeat a day.
  const calculateRecurringDates = (startDateStr: string, endDateStr: string, frequency: string, customDays: number): string[] => {
    const startDay = storedDayNumber(startDateStr)
    const endDay = storedDayNumber(endDateStr)
    const step = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : customDays
    const dates: string[] = []

    if (!Number.isFinite(startDay) || !Number.isFinite(endDay) || !(step > 0)) {
      return dates
    }
    for (let day = startDay; day <= endDay; day += step) {
      dates.push(dayNumberToDateString(day))
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


  const isClimbingWithVolume = formData.type !== 'GYM' && formData.type !== 'MENTAL_PRACTICE' && formData.type !== 'FINGERBOARD';
  const linkedGoalsCount = selectedProcessGoalIds.size + selectedProjectGoalIds.size;

  // Achieved goals can't be linked any more, but stay listed on the workouts they were already linked to
  const initiallyLinkedGoalIds = new Set([
    ...(initialData?.mentalState?.processGoals?.map((pg: ProcessGoalProgress) => pg.goalId) || []),
    ...(initialData?.mentalState?.projectGoals?.map((pg: ProjectGoalCompletion) => pg.goalId) || []),
  ]);
  const linkableProcessGoals = processGoals.filter(goal => !isGoalAchieved(goal) || initiallyLinkedGoalIds.has(goal.id));
  const linkableProjectGoals = projectGoals.filter(goal => !isGoalAchieved(goal) || initiallyLinkedGoalIds.has(goal.id));
  const selectedVolume = getTrainingVolumes(t).find(volume => volume.value === formData.trainingVolume);

  const clearRecurringError = () => {
    if (errors.recurring) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.recurring
        return newErrors
      })
    }
  };

  const closeIncompleteDataModal = () => {
    setShowIncompleteDataModal(false);
    setIncompleteData({ exercises: [], hangs: 0 });
  };

  return (
    <>
      <BottomSheet
        isOpen
        onClose={onCancel}
        dismissible={false}
        closeLabel={t('common.close') || 'Close'}
        title={
          <span className="flex items-center gap-2">
            <Icon name={isDuplicating ? 'duplicate' : initialData ? 'edit' : 'plus'} size={24} className="text-uc-primary" />
            {isDuplicating
              ? t('workouts.formDuplicateTitle') || 'Duplicate Workout'
              : initialData
              ? t('workouts.formEditTitle') || 'Edit Workout'
              : t('workouts.formTitle') || 'Add New Workout'}
          </span>
        }
        footer={
          // One-line summary + Save session (the header ✕ cancels, as in Quick log)
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-uc-text-muted uc-num">{footerSummary()}</p>
            <Button type="submit" form="workout-form" variant="accent" size="lg" isLoading={isSubmitting} className="shrink-0">
              {isSubmitting
                ? `${t('common.save') || 'Save'}...`
                : <><Icon name="success" />{initialData && !isDuplicating
                  ? t('workouts.updateSession') || 'Update session'
                  : t('workouts.saveSession') || 'Save session'}</>}
            </Button>
          </div>
        }
      >
        <form id="workout-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection - At the top */}
          <div>
            <FieldHeading htmlFor="workout-date">{t('workouts.date') || 'Date'} *</FieldHeading>
            <Input
              id="workout-date"
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData('date', e.target.value)}
              aria-invalid={!!errors.date}
            />
            <FieldError>{errors.date}</FieldError>
          </div>

          {/* Workout Type Selection */}
          <div role="group" aria-labelledby="workout-type">
            <FieldHeading id="workout-type">{t('workouts.workoutTypeLabel') || 'Workout Type'} *</FieldHeading>
            <div className="flex flex-wrap gap-2">
              {getWorkoutTypes(t).map((type) => (
                <WorkoutTypeChip
                  key={type.value}
                  workoutType={type.value}
                  selected={formData.type === type.value}
                  onClick={() => updateFormData('type', type.value)}
                >
                  {type.label}
                </WorkoutTypeChip>
              ))}
            </div>
            <FieldError>{errors.type}</FieldError>
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
            <CollapsibleCard
              open={isCycleExpanded}
              onToggle={() => setIsCycleExpanded(!isCycleExpanded)}
              icon={<Icon name="cycle" size={22} />}
              title={t('workouts.labels.cycleInfo') || 'Cycle Information'}
              description={t('workouts.labels.cycleInfoDescription') || 'View your cycle information and recommendations'}
              summary={`${t(`cycle.phases.${cycleInfoForSelectedDate.phaseDescription}`)} · ${t('cycle.day') || 'Cycle Day'} ${cycleInfoForSelectedDate.currentDay}`}
              className={`${phaseBandBg[cycleInfoForSelectedDate.phase]} border-uc-border`}
            >
              <CycleInfoComponent
                cycleInfo={cycleInfoForSelectedDate}
                showRecommendations={true}
                isSelectedDate={true}
              />
            </CollapsibleCard>
          )}

          {/* Goals Section - Collapsible */}
          {(linkableProcessGoals.length > 0 || linkableProjectGoals.length > 0) && (
            <CollapsibleCard
              open={isGoalsExpanded}
              onToggle={() => setIsGoalsExpanded(!isGoalsExpanded)}
              icon={<Icon name="goal" size={22} />}
              title={t('workouts.labels.goals') || 'Goals'}
              description={t('workouts.labels.goalsDescription') || 'Link this workout to your goals'}
              summary={linkedGoalsCount > 0 ? `${linkedGoalsCount} ${t('workouts.labels.selected') || 'selected'}` : undefined}
            >
              <div className="space-y-4">
                {/* Process Goals */}
                {linkableProcessGoals.length > 0 && (
                  <div>
                    <Overline className="mb-2">{t('strongMind.processGoals') || 'Process Goals'}</Overline>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {linkableProcessGoals.map(goal => (
                        <label key={goal.id} className={goalRowClass}>
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
                            className={checkboxClass}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">
                              {goal.timeframeValue} {t(`strongMind.${goal.timeframeUnit}`) || goal.timeframeUnit}: {goal.goalDescription}
                            </div>
                            {goal.startDate && (
                              <div className="text-xs text-uc-text-muted mt-0.5">
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
                {linkableProjectGoals.length > 0 && (
                  <div>
                    <Overline className="mb-2">{t('strongMind.projectGoals') || 'Project Goals'}</Overline>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {linkableProjectGoals.map(goal => (
                        <label key={goal.id} className={goalRowClass}>
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
                            className={checkboxClass}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">
                              {goal.routeGrade} {goal.routeName} - {goal.sectorLocation}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-uc-text-muted mt-0.5">
                              <WorkoutIcon workoutType={goal.climbingType === 'route' ? 'LEAD_ROCK' : 'BOULDERING'} size={16} />
                              {goal.climbingType === 'route' ? 'Route' : 'Boulder'} • {goal.gradeSystem}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <ProcessGoalsSection
                  processGoals={processGoals.filter(goal => selectedProcessGoalIds.has(goal.id))}
                  projectGoals={projectGoals.filter(goal => selectedProjectGoalIds.has(goal.id))}
                  onProcessGoalProgress={setProcessGoalProgress}
                  onProcessGoalAchieved={toggleProcessGoalAchieved}
                  onProjectGoalCompletion={toggleProjectGoalCompletion}
                  getProcessGoalProgress={getProcessGoalProgress}
                  isProcessGoalAchieved={isProcessGoalAchieved}
                  isProjectGoalCompleted={isProjectGoalCompleted}
                />

                {processGoals.length === 0 && projectGoals.length === 0 && (
                  <div className="text-center py-4 text-sm text-uc-text-muted">
                    {t('workouts.labels.noGoalsAvailable') || 'No goals available. Create goals in the Strong Mind section.'}
                  </div>
                )}
              </div>
            </CollapsibleCard>
          )}

          {/* Training Volume (for non-gym, non-mental practice, and non-fingerboard workouts) */}
          {isClimbingWithVolume && (
            <div>
              <FieldHeading
                id="workout-volume"
                tip={t('workouts.tooltips.trainingVolume') || 'Training Volume (TR) indicates the intensity of your workout. TR1 is very light recovery, TR5 is maximum intensity. Choose based on how hard you trained.'}
                aside={selectedVolume?.label}
              >
                {t('workouts.trainingVolumeLabel') || 'Training Volume'} *
              </FieldHeading>
              <SegmentedControl
                ariaLabel={t('workouts.trainingVolumeLabel') || 'Training Volume'}
                options={getTrainingVolumes(t).map(volume => ({ value: volume.value, label: volume.value }))}
                value={formData.trainingVolume as TrainingVolume}
                onChange={(value) => updateFormData('trainingVolume', value)}
              />
              <FieldError>{errors.trainingVolume}</FieldError>
            </div>
          )}

          {/* Focus Level - Only for Mental Practice */}
          {formData.type === 'MENTAL_PRACTICE' && (
            <div>
              <FieldHeading
                id="workout-focus"
                tip={t('workouts.tooltips.focusLevel') || 'Rate your focus during the workout (1 = very distracted, 5 = very focused). Helps identify what affects your concentration.'}
              >
                {t('workouts.focusLevel') || 'Focus Level (1-5)'}
              </FieldHeading>
              <RatingDots
                name="focusLevel"
                value={formData.focusLevel || 0}
                filledClassName="bg-uc-accent"
                onChange={(value) => updateFormData('focusLevel', value)}
              />
            </div>
          )}

          {/* Route name - Lead Rock (Sector stays below) */}
          {formData.type === 'LEAD_ROCK' && (
            <div>
              <FieldHeading htmlFor="workout-route-name">{t('workouts.routeName') || 'Route name'}</FieldHeading>
              <Input
                id="workout-route-name"
                type="text"
                value={formData.routeName}
                onChange={(e) => updateFormData('routeName', e.target.value)}
                placeholder={t('workouts.routeNamePlaceholder') || 'e.g. Pochylec, 6c+'}
                maxLength={200}
              />
            </div>
          )}

          {/* Sector Field - For Lead Rock, Lead Wall, Bouldering, and Circuits */}
          {(formData.type === 'LEAD_ROCK' || formData.type === 'LEAD_ARTIFICIAL' || formData.type === 'BOULDERING' || formData.type === 'CIRCUITS') && (
            <div>
              <FieldHeading
                htmlFor="workout-sector"
                tip={t('workouts.tooltips.sector') || 'The climbing area or location where you trained (e.g., \'Fontainebleau - Bas Cuvier\'). Useful for tracking where you climb.'}
              >
                {t('workouts.sector') || 'Sector'}
              </FieldHeading>
              <Input
                id="workout-sector"
                type="text"
                value={formData.sector}
                onChange={(e) => updateFormData('sector', e.target.value)}
                placeholder={t('workouts.sectorPlaceholder') || 'Enter the climbing sector or area...'}
              />
            </div>
          )}

          {/* Wall angle - Lead and Bouldering; style - Bouldering. Tap again to clear */}
          {wallAnglesFor(formData.type).length > 0 && (
            <div role="group" aria-labelledby="workout-wall-angle">
              <FieldHeading id="workout-wall-angle">{t('workouts.wallAngle') || 'Wall angle'}</FieldHeading>
              <div className="flex flex-wrap gap-2">
                {wallAnglesFor(formData.type).map(angle => (
                  <ChoiceChip
                    key={angle}
                    selected={formData.wallAngle === angle}
                    onClick={() => updateFormData('wallAngle', formData.wallAngle === angle ? null : angle)}
                  >
                    {t(`workouts.wallAngles.${angle}`)}
                  </ChoiceChip>
                ))}
              </div>
            </div>
          )}
          {formData.type === 'BOULDERING' && (
            <div role="group" aria-labelledby="workout-climb-style">
              <FieldHeading id="workout-climb-style">{t('workouts.climbStyle') || 'Style'}</FieldHeading>
              <div className="flex flex-wrap gap-2">
                {BOULDER_STYLES.map(style => (
                  <ChoiceChip
                    key={style}
                    selected={formData.climbStyle === style}
                    onClick={() => updateFormData('climbStyle', formData.climbStyle === style ? null : style)}
                  >
                    {t(`workouts.climbStyles.${style}`)}
                  </ChoiceChip>
                ))}
              </div>
            </div>
          )}

          {/* Mental Practice Type - Only for Mental Practice */}
          {formData.type === 'MENTAL_PRACTICE' && (
            <div>
              <FieldHeading
                id="workout-practice-type"
                tip={t('workouts.tooltips.mentalPracticeType') || 'Type of mental practice: Meditation (mindfulness), Reflecting (self-reflection), Other (custom practice).'}
              >
                {t('workouts.mentalPracticeType') || 'Practice Type'}
              </FieldHeading>
              <SegmentedControl
                ariaLabel={t('workouts.mentalPracticeType') || 'Practice Type'}
                options={[
                  { value: 'MEDITATION', label: t('workouts.mentalPracticeTypes.meditation') || 'Meditation' },
                  { value: 'REFLECTING', label: t('workouts.mentalPracticeTypes.reflecting') || 'Reflecting' },
                  { value: 'OTHER', label: t('workouts.mentalPracticeTypes.other') || 'Other' },
                ]}
                value={formData.mentalPracticeType}
                onChange={(value) => updateFormData('mentalPracticeType', value)}
              />
            </div>
          )}

          {/* Time of Day - Only for Mental Practice */}
          {formData.type === 'MENTAL_PRACTICE' && (
            <div role="group" aria-labelledby="workout-time-of-day">
              <FieldHeading
                id="workout-time-of-day"
                tip={t('workouts.tooltips.timeOfDay') || 'When you did the mental practice: Morning, Midday, Evening. Track patterns in your practice timing.'}
              >
                {t('workouts.timeOfDay') || 'Time of Day'}
              </FieldHeading>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'MORNING', label: t('workouts.timeOfDayOptions.MORNING') || 'Morning', icon: 'morning' as const },
                  { value: 'MIDDAY', label: t('workouts.timeOfDayOptions.MIDDAY') || 'Midday', icon: 'midday' as const },
                  { value: 'EVENING', label: t('workouts.timeOfDayOptions.EVENING') || 'Evening', icon: 'evening' as const }
                ].map((time) => {
                  const currentTimes = formData.timeOfDay || [];
                  const isSelected = currentTimes.includes(time.value as TimeOfDay);
                  return (
                    <ChoiceChip
                      key={time.value}
                      selected={isSelected}
                      onClick={() => updateFormData('timeOfDay', isSelected
                        ? currentTimes.filter(t => t !== time.value)
                        : [...currentTimes, time.value])}
                      className="px-2"
                    >
                      <Icon name={time.icon} size={16} /> {time.label}
                    </ChoiceChip>
                  );
                })}
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
              showSetErrors={showSetErrors}
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
            <FieldHeading htmlFor="workout-notes">{t('workouts.notes') || 'Notes'}</FieldHeading>
            <Textarea
              id="workout-notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder={t('workouts.notesPlaceholder') || 'Add any notes about your workout, how you felt, what you learned...'}
              rows={4}
            />
          </div>

          {/* Gratitude Section - Collapsed by default */}
          <CollapsibleCard
            open={isGratitudeExpanded}
            onToggle={() => setIsGratitudeExpanded(!isGratitudeExpanded)}
            icon={<Icon name="gratitude" size={22} />}
            title={t('workouts.gratitude') || 'Gratitude'}
            description={t('workouts.gratitudeDescription') || 'Reflect on what you\'re grateful for and what to improve'}
          >
            <div className="space-y-4">
              {/* 3 things I am grateful for */}
              <div>
                <Label htmlFor="workout-gratitude">{t('workouts.gratefulFor') || '3 things I am grateful for'}</Label>
                <Textarea
                  id="workout-gratitude"
                  value={formData.gratitude}
                  onChange={(e) => updateFormData('gratitude', e.target.value)}
                  placeholder={t('workouts.gratefulForPlaceholder') || 'What are you grateful for today? What went well? What made you happy?'}
                  rows={4}
                />
              </div>

              {/* 3 things to do better next time */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Label htmlFor="workout-improvements" className="mb-0">
                    {t('workouts.improvements') || '3 things to do better next time'}
                  </Label>
                  <InfoTip content={t('workouts.tooltips.improvements') || 'Note 3 things you want to improve or do better next time. This helps you learn and grow from each session.'} />
                </div>
                <Textarea
                  id="workout-improvements"
                  value={formData.improvements}
                  onChange={(e) => updateFormData('improvements', e.target.value)}
                  placeholder={t('workouts.improvementsPlaceholder') || 'What could you do better? What did you learn? How can you improve?'}
                  rows={4}
                />
              </div>
            </div>
          </CollapsibleCard>

          {/* Strong Mind Section - lead climbing and bouldering (climb list with grades) */}
          {(formData.type === 'LEAD_ROCK' || formData.type === 'LEAD_ARTIFICIAL' || formData.type === 'BOULDERING') && (
            <StrongMindSection
              mentalState={formData.mentalState}
              onChange={(mentalState) => updateFormData('mentalState', mentalState)}
              workoutType={formData.type}
            />
          )}

          {/* Recurring Workouts Section - Only when creating (not editing) */}
          {!initialData && (
            <CollapsibleCard
              open={isRecurringExpanded}
              onToggle={() => setIsRecurringExpanded(!isRecurringExpanded)}
              icon={<Icon name="cycle" size={22} />}
              title={t('workouts.recurringTitle') || 'Create Recurring Workouts'}
              description={t('workouts.recurringDescription') || 'Create multiple copies of this workout at regular intervals'}
            >
              <div className="space-y-4">
                {/* Enable Recurring Toggle */}
                <label className="flex items-center gap-3 min-h-11 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurringSettings.enabled}
                    onChange={(e) => setRecurringSettings({ ...recurringSettings, enabled: e.target.checked })}
                    className={checkboxClass}
                  />
                  <span className="text-sm font-semibold">
                    {t('workouts.enableRecurring') || 'Make this workout recurring'}
                  </span>
                </label>

                {recurringSettings.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Start Date */}
                      <div>
                        <Label htmlFor="recurring-start">{t('workouts.recurringStartDate') || 'Start Date'} *</Label>
                        <Input
                          id="recurring-start"
                          type="date"
                          value={recurringSettings.startDate}
                          onChange={(e) => {
                            setRecurringSettings({ ...recurringSettings, startDate: e.target.value })
                            clearRecurringError()
                          }}
                          min={formData.date}
                        />
                      </div>

                      {/* End Date */}
                      <div>
                        <Label htmlFor="recurring-end">{t('workouts.recurringEndDate') || 'End Date'} *</Label>
                        <Input
                          id="recurring-end"
                          type="date"
                          value={recurringSettings.endDate}
                          onChange={(e) => {
                            setRecurringSettings({ ...recurringSettings, endDate: e.target.value })
                            clearRecurringError()
                          }}
                          min={recurringSettings.startDate || formData.date}
                        />
                      </div>
                    </div>

                    {/* Frequency */}
                    <div>
                      <Label id="recurring-frequency">{t('workouts.recurringFrequency') || 'Frequency'} *</Label>
                      <SegmentedControl
                        ariaLabel={t('workouts.recurringFrequency') || 'Frequency'}
                        options={[
                          { value: 'daily', label: t('workouts.frequencyDaily') || 'Daily' },
                          { value: 'weekly', label: t('workouts.frequencyWeekly') || 'Weekly' },
                          { value: 'custom', label: `${t('workouts.frequencyEvery') || 'Every'} N ${t('workouts.frequencyDays') || 'days'}` },
                        ]}
                        value={recurringSettings.frequency}
                        onChange={(frequency) => setRecurringSettings({ ...recurringSettings, frequency })}
                      />
                      {recurringSettings.frequency === 'custom' && (
                        <div className="mt-3 flex items-center gap-3 text-sm font-semibold">
                          <label htmlFor="recurring-custom-days">{t('workouts.frequencyEvery') || 'Every'}</label>
                          <div className="w-20">
                            <Input
                              id="recurring-custom-days"
                              type="number"
                              min="1"
                              value={recurringSettings.customDays}
                              onChange={(e) => setRecurringSettings({ ...recurringSettings, customDays: parseInt(e.target.value) || 1 })}
                              className="uc-num"
                            />
                          </div>
                          <span>{t('workouts.frequencyDays') || 'days'}</span>
                        </div>
                      )}
                    </div>

                    {/* Error Display */}
                    {errors.recurring && (
                      <p role="alert" className="p-3 rounded-uc-input bg-uc-error-bg text-sm font-semibold text-uc-error">
                        {errors.recurring}
                      </p>
                    )}

                    {/* Preview */}
                    {recurringPreviewCount > 0 && !errors.recurring && (
                      <p className="p-3 rounded-uc-input bg-uc-primary-container text-sm font-semibold text-uc-on-primary-container uc-num">
                        {recurringPreviewCount === 1
                          ? (t('workouts.recurringPreview') || `This will create ${recurringPreviewCount} workout`).replace('{{count}}', recurringPreviewCount.toString())
                          : (t('workouts.recurringPreview_plural') || `This will create ${recurringPreviewCount} workouts`).replace('{{count}}', recurringPreviewCount.toString())}
                      </p>
                    )}
                  </>
                )}
              </div>
            </CollapsibleCard>
          )}

          {initialData && !isDuplicating && onDelete && (
            <Button variant="ghost" size="lg" className="w-full text-uc-error" onClick={onDelete}>
              <Icon name="delete" />
              {t('workouts.deleteWorkout') || 'Delete workout'}
            </Button>
          )}
        </form>
      </BottomSheet>

      {/* Incomplete Data Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showIncompleteDataModal}
        onClose={closeIncompleteDataModal}
        onConfirm={() => {
          closeIncompleteDataModal();
          // Re-submit the form (this time modal won't show)
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleSubmit(fakeEvent);
        }}
        variant="warning"
        emphasis="cancel"
        title={t('workouts.incompleteData.title') || 'Some sets are empty'}
        message={incompleteSummary()}
        cancelText={t('workouts.incompleteData.goBack') || 'Go back & fill'}
        confirmText={t('workouts.incompleteData.saveAnyway') || 'Save anyway'}
      />
    </>
  );
}

interface IncompleteData {
  exercises: { name: string; sets: number }[];
  hangs: number;
}

const goalRowClass =
  'flex items-start gap-3 min-h-11 p-3 bg-uc-elevated border border-uc-border rounded-uc-input cursor-pointer hover:border-uc-primary transition-colors';

const checkboxClass = 'mt-0.5 size-5 shrink-0 accent-uc-primary cursor-pointer';

function InfoTip({ content }: { content: string }) {
  return (
    <Tooltip content={content}>
      <span className="inline-flex size-6 cursor-help items-center justify-center text-uc-text-muted hover:text-uc-text"><Icon name="info" size={16} /></span>
    </Tooltip>
  );
}

/** Overline field label with an optional info tooltip and a right-aligned summary. */
function FieldHeading({ children, htmlFor, id, tip, aside }: {
  children: React.ReactNode;
  htmlFor?: string;
  id?: string;
  tip?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Overline as={htmlFor ? 'label' : 'p'} htmlFor={htmlFor} id={id}>{children}</Overline>
      {tip && <InfoTip content={tip} />}
      {aside && <span className="ml-auto text-[13px] font-semibold text-uc-text-muted uc-num">{aside}</span>}
    </div>
  );
}
