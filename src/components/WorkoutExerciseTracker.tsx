'use client'

import { useState, useEffect } from 'react'
import { Exercise, WorkoutExerciseData, WorkoutSet, Routine } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import { Tooltip } from './Tooltip'
import { BottomSheet, Button, Card, EmptyState, Icon, Input, Overline, WorkoutIcon } from './ui'

interface WorkoutExerciseTrackerProps {
  exercises: WorkoutExerciseData[]
  onExercisesChange: (exercises: WorkoutExerciseData[]) => void
  availableExercises: Exercise[]
  onCreateExercise?: (name: string, category?: string, defaultUnit?: string) => Promise<Exercise>
  onVariationChange?: (variationInfo: { routineName: string; variationName: string } | null) => void
}

interface ExerciseQuickStats {
  lastWeight?: number
  lastReps?: number
  lastUsed?: string
}

export default function WorkoutExerciseTracker({
  exercises,
  onExercisesChange,
  availableExercises,
  onCreateExercise,
  onVariationChange,
}: WorkoutExerciseTrackerProps) {
  const { t } = useLanguage()
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [showRoutineSelector, setShowRoutineSelector] = useState(false)
  const [routines, setRoutines] = useState<Routine[]>([])
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [quickStats, setQuickStats] = useState<Record<string, ExerciseQuickStats>>({})

  // Fetch quick stats for exercises
  useEffect(() => {
    exercises.forEach(ex => {
      if (ex.exerciseId && !quickStats[ex.exerciseId]) {
        fetchQuickStats(ex.exerciseId)
      }
    })
  }, [exercises])

  // Fetch routines when selector opens
  useEffect(() => {
    if (showRoutineSelector) {
      fetchRoutines()
    }
  }, [showRoutineSelector])

  const fetchRoutines = async () => {
    try {
      const response = await fetch('/api/routines')
      if (response.ok) {
        const data = await response.json()
        setRoutines(data)
      }
    } catch (error) {
      console.error('Error fetching routines:', error)
    }
  }

  const fetchQuickStats = async (exerciseId: string) => {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/quick-stats`)
      if (response.ok) {
        const stats = await response.json()
        setQuickStats(prev => ({ ...prev, [exerciseId]: stats }))
      }
    } catch (error) {
      console.error('Error fetching quick stats:', error)
    }
  }

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExerciseData = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      order: exercises.length,
      sets: [],
    }
    onExercisesChange([...exercises, newExercise])
    setShowExerciseSelector(false)
    setSearchQuery('')
    fetchQuickStats(exercise.id)
  }

  const handleCreateNewExercise = async () => {
    if (!searchQuery.trim() || !onCreateExercise) return

    try {
      const newExercise = await onCreateExercise(searchQuery.trim(), undefined, 'kg')
      handleAddExercise(newExercise)
    } catch (error) {
      console.error('Error creating exercise:', error)
      alert(t('workouts.errors.createExerciseFailed') || 'Failed to create exercise')
    }
  }

  const handleLoadRoutine = (routine: Routine, variationIndex?: number) => {
    if (!routine.routineExercises || routine.routineExercises.length === 0) {
      alert(t('workouts.errors.routineNoExercises') || 'This routine has no exercises')
      return
    }

    const variation = variationIndex !== undefined ? routine.variations[variationIndex] : null
    const defaultReps = variation?.defaultRepRangeMin || 8
    const defaultSets = variation?.defaultSets || 3

    // Convert routine exercises to workout exercises
    const newExercises: WorkoutExerciseData[] = routine.routineExercises.map((re) => {
      const exercise = availableExercises.find((e) => e.id === re.exerciseId)
      if (!exercise) return null

      // Create sets based on variation or default
      const sets: WorkoutSet[] = Array.from({ length: defaultSets }, () => ({
        reps: defaultReps,
        weight: 0,
        rir: variation?.defaultRIR || undefined,
        notes: '',
      }))

      return {
        exerciseId: re.exerciseId,
        exerciseName: exercise.name,
        order: re.order,
        sets,
      }
    }).filter((ex): ex is WorkoutExerciseData => ex !== null)

    // Merge with existing exercises (append)
    const mergedExercises = [...exercises, ...newExercises]
    // Reorder
    mergedExercises.forEach((ex, i) => {
      ex.order = i
    })

    onExercisesChange(mergedExercises)
    setShowRoutineSelector(false)
    setSelectedRoutine(null)

    // Notify parent about variation info
    if (onVariationChange) {
      if (variation) {
        onVariationChange({
          routineName: routine.name,
          variationName: variation.name,
        })
      } else {
        onVariationChange(null)
      }
    }

    // Fetch stats for new exercises
    newExercises.forEach((ex) => {
      if (ex.exerciseId) {
        fetchQuickStats(ex.exerciseId)
      }
    })
  }

  const handleRemoveExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index)
    // Reorder remaining exercises
    newExercises.forEach((ex, i) => {
      ex.order = i
    })
    onExercisesChange(newExercises)
  }

  const handleAddSet = (exerciseIndex: number) => {
    const newExercises = [...exercises]
    const stats = quickStats[newExercises[exerciseIndex].exerciseId]
    const newSet: WorkoutSet = {
      reps: stats?.lastReps || 8,
      weight: stats?.lastWeight || 0,
      rir: undefined,
      notes: '',
    }
    newExercises[exerciseIndex].sets.push(newSet)
    onExercisesChange(newExercises)
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter(
      (_, i) => i !== setIndex
    )
    onExercisesChange(newExercises)
  }

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    value: number | string | undefined
  ) => {
    const newExercises = [...exercises]
    const set = newExercises[exerciseIndex].sets[setIndex]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(set as any)[field] = value
    onExercisesChange(newExercises)
  }

  const filteredExercises = availableExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = (exerciseId: string) => quickStats[exerciseId] || {}

  return (
    <div className="space-y-3">
      <Overline>Exercises & Sets</Overline>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="tonal" onClick={() => setShowRoutineSelector(true)}>
          <Icon name="library" /> {t('workouts.labels.loadRoutine') || 'Load Routine'}
        </Button>
        <Button variant="ghost" onClick={() => setShowExerciseSelector(!showExerciseSelector)} aria-expanded={showExerciseSelector}>
          <Icon name="plus" /> {t('workouts.labels.addExercise') || t('exercises.addExercise') || 'Add Exercise'}
        </Button>
      </div>

      {/* Exercise Selector */}
      {showExerciseSelector && (
        <Card className="space-y-3">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('workouts.placeholders.searchExercises') || 'Search exercises...'}
            autoFocus
          />

          {/* Exercise List */}
          <div className="max-h-48 overflow-y-auto -mx-1">
            {filteredExercises
              .filter(ex => !exercises.some(we => we.exerciseId === ex.id))
              .map(exercise => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleAddExercise(exercise)}
                  className="w-full min-h-11 text-left px-3 py-2 rounded-uc-input hover:bg-uc-elevated transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-uc-text">{exercise.name}</div>
                    {exercise.category && (
                      <div className="text-xs text-uc-text-muted">{exercise.category}</div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-uc-text-muted">{exercise.defaultUnit}</span>
                </button>
              ))}
          </div>

          {/* Create New Exercise */}
          {searchQuery.trim() &&
           !filteredExercises.some(ex => ex.name.toLowerCase() === searchQuery.toLowerCase()) &&
           onCreateExercise && (
            <Button variant="tonal" onClick={handleCreateNewExercise} className="w-full">
              + Create &quot;{searchQuery}&quot;
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => {
              setShowExerciseSelector(false)
              setSearchQuery('')
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </Card>
      )}

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <div className="rounded-uc-card border border-dashed border-uc-border">
          <EmptyState
            icon={<WorkoutIcon workoutType="GYM" size={28} />}
            title={t('workouts.labels.noExercisesAdded') || 'No exercises added yet'}
            description={
              <>
                {t('workouts.labels.noExercisesDescription') || 'Add exercises to track your sets, reps, and weights. Click "Add Exercise" above to get started.'}
                <span className="block mt-2">
                  {t('workouts.labels.clickAddExerciseToStart') || `Click "${t('exercises.addExercise') || 'Add Exercise'}" to start tracking`}
                </span>
              </>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, exerciseIndex) => {
            const exerciseStats = stats(exercise.exerciseId)
            return (
              <Card key={exerciseIndex}>
                {/* Exercise Header */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-uc-text">{exercise.exerciseName}</h4>
                    {exerciseStats.lastUsed && (
                      <p className="text-xs text-uc-text-muted uc-num">
                        Last: {exerciseStats.lastWeight}×{exerciseStats.lastReps}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/exercises/${exercise.exerciseId}`}
                    className="min-h-11 inline-flex items-center gap-1 text-sm font-bold text-uc-primary hover:underline"
                    target="_blank"
                  >
                    View Progress <Icon name="chevron-right" size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exerciseIndex)}
                    className={iconButtonClass}
                    title="Remove exercise"
                    aria-label="Remove exercise"
                  >
                    <Icon name="delete" />
                  </button>
                </div>

                {/* Sets */}
                {exercise.sets.length > 0 && (
                  <div className={`${setGridClass} mb-1`}>
                    <Overline>Set</Overline>
                    <Overline className="text-center">{t('workouts.placeholders.reps') || 'Reps'}</Overline>
                    <Overline className="text-center">kg</Overline>
                    <span className="flex items-center justify-center gap-1">
                      <Overline>{t('workouts.placeholders.rir') || 'RIR'}</Overline>
                      <Tooltip content={t('workouts.tooltips.RIR') || 'Reps in Reserve (RIR) is how many more reps you could have done. RIR 0 = maximum effort, RIR 3 = you could do 3 more reps. Helps track training intensity.'}>
                        <span className="inline-flex size-6 cursor-help items-center justify-center text-uc-text-muted hover:text-uc-text"><Icon name="info" size={16} /></span>
                      </Tooltip>
                    </span>
                    <span />
                  </div>
                )}
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className={setGridClass}>
                      <span className="text-sm font-semibold text-uc-text-muted uc-num">{setIndex + 1}</span>
                      <Input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) =>
                          handleSetChange(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)
                        }
                        placeholder={t('workouts.placeholders.reps') || 'Reps'}
                        aria-label={`${t('workouts.placeholders.reps') || 'Reps'} · ${setIndex + 1}`}
                        min="1"
                        className={setInputClass}
                      />
                      <Input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) =>
                          handleSetChange(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)
                        }
                        placeholder={t('workouts.placeholders.weight') || 'Weight'}
                        aria-label={`${t('workouts.placeholders.weight') || 'Weight'} (kg) · ${setIndex + 1}`}
                        step="0.5"
                        min="0"
                        className={setInputClass}
                      />
                      <Input
                        type="number"
                        value={set.rir || ''}
                        onChange={(e) =>
                          handleSetChange(
                            exerciseIndex,
                            setIndex,
                            'rir',
                            e.target.value ? parseInt(e.target.value) : 0
                          )
                        }
                        placeholder={t('workouts.placeholders.rir') || 'RIR'}
                        aria-label={`${t('workouts.placeholders.rir') || 'RIR'} · ${setIndex + 1}`}
                        min="0"
                        max="5"
                        className={setInputClass}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                        className={iconButtonClass}
                        title="Remove set"
                        aria-label="Remove set"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddSet(exerciseIndex)}
                    className={dashedButtonClass}
                  >
                    + Add Set
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Routine Selector */}
      <BottomSheet
        isOpen={showRoutineSelector}
        onClose={() => {
          setShowRoutineSelector(false)
          setSelectedRoutine(null)
        }}
        title={t('workouts.labels.loadRoutine') || 'Load Routine'}
        closeLabel={t('common.close') || 'Close'}
      >
        {routines.length === 0 ? (
          <EmptyState
            title={t('workouts.labels.noRoutinesAvailable') || 'No routines available'}
            action={
              <Link href="/routines" className="inline-flex items-center gap-1 text-sm font-bold text-uc-primary hover:underline">
                Create your first routine <Icon name="chevron-right" size={16} />
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {routines.map((routine) => (
              <Card key={routine.id}>
                <h4 className="font-bold text-uc-text">{routine.name}</h4>
                {routine.description && (
                  <p className="text-sm text-uc-text-muted mt-1">{routine.description}</p>
                )}
                <p className="text-xs font-semibold text-uc-text-muted mt-2 mb-3 uc-num">
                  {routine.routineExercises.length} {routine.routineExercises.length === 1 ? (t('exercises.exercise') || 'exercise') : (t('exercises.exercises') || 'exercises')}
                </p>

                {routine.variations.length > 0 ? (
                  <div className="space-y-2">
                    <Overline>{t('common.selectVariation') || 'Select variation:'}</Overline>
                    {routine.variations.map((variation, vIndex) => (
                      <button
                        key={vIndex}
                        type="button"
                        onClick={() => handleLoadRoutine(routine, vIndex)}
                        className="w-full min-h-11 text-left bg-uc-elevated border border-uc-border hover:border-uc-primary rounded-uc-input px-3 py-2.5 transition-colors"
                      >
                        <div className="font-semibold text-uc-text">{variation.name}</div>
                        {variation.defaultRepRangeMin && variation.defaultRepRangeMax && (
                          <div className="text-sm text-uc-text-muted uc-num">
                            {variation.defaultRepRangeMin}-{variation.defaultRepRangeMax} reps
                            {variation.defaultSets && ` • ${variation.defaultSets} sets`}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Button variant="tonal" onClick={() => handleLoadRoutine(routine)} className="w-full">
                    {t('workouts.labels.loadRoutine') || 'Load Routine'}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

const iconButtonClass =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-lg text-uc-text-muted hover:text-uc-error hover:bg-uc-elevated transition-colors'

// Set number · reps · kg · RIR · remove
const setGridClass = 'grid grid-cols-[1.5rem_1fr_1fr_1fr_2.75rem] items-center gap-2'

const setInputClass = 'text-center px-1 uc-num'

const dashedButtonClass =
  'w-full min-h-11 rounded-uc-input border border-dashed border-uc-border text-sm font-bold text-uc-primary hover:border-uc-primary transition-colors'
