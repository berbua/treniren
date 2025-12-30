'use client'

import { useState, useEffect } from 'react'
import { Exercise, WorkoutExerciseData, WorkoutSet, Routine } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

interface WorkoutExerciseTrackerProps {
  exercises: WorkoutExerciseData[]
  onExercisesChange: (exercises: WorkoutExerciseData[]) => void
  availableExercises: Exercise[]
  onCreateExercise?: (name: string, category?: string, defaultUnit?: string) => Promise<Exercise>
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
      alert('Failed to create exercise')
    }
  }

  const handleLoadRoutine = (routine: Routine, variationIndex?: number) => {
    if (!routine.routineExercises || routine.routineExercises.length === 0) {
      alert('This routine has no exercises')
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
    value: number | string
  ) => {
    const newExercises = [...exercises]
    const set = newExercises[exerciseIndex].sets[setIndex]
    set[field] = value as any
    onExercisesChange(newExercises)
  }

  const filteredExercises = availableExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = (exerciseId: string) => quickStats[exerciseId] || {}

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          📋 Exercises & Sets
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowRoutineSelector(true)}
            className="px-4 py-2 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black rounded-lg text-sm font-medium transition-colors"
          >
            👯 Load Routine
          </button>
          <button
            type="button"
            onClick={() => setShowExerciseSelector(!showExerciseSelector)}
            className="px-4 py-2 bg-uc-purple hover:bg-uc-purple/90 text-uc-text-light rounded-lg text-sm font-medium transition-colors"
          >
            + Add Exercise
          </button>
        </div>
      </div>

      {/* Exercise Selector */}
      {showExerciseSelector && (
        <div className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20">
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search exercises..."
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              autoFocus
            />
          </div>

          {/* Exercise List */}
          <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
            {filteredExercises
              .filter(ex => !exercises.some(we => we.exerciseId === ex.id))
              .map(exercise => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleAddExercise(exercise)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-uc-black/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-uc-text-light">{exercise.name}</div>
                    {exercise.category && (
                      <div className="text-xs text-uc-text-muted">{exercise.category}</div>
                    )}
                  </div>
                  <span className="text-xs text-uc-text-muted">{exercise.defaultUnit}</span>
                </button>
              ))}
          </div>

          {/* Create New Exercise */}
          {searchQuery.trim() && 
           !filteredExercises.some(ex => ex.name.toLowerCase() === searchQuery.toLowerCase()) &&
           onCreateExercise && (
            <button
              type="button"
              onClick={handleCreateNewExercise}
              className="w-full px-4 py-2 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black rounded-lg text-sm font-medium transition-colors"
            >
              + Create &quot;{searchQuery}&quot;
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowExerciseSelector(false)
              setSearchQuery('')
            }}
            className="mt-2 w-full px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <div className="bg-uc-dark-bg rounded-xl p-8 text-center border border-uc-purple/20">
          <div className="text-4xl mb-2">💪</div>
          <p className="text-uc-text-muted">No exercises added yet</p>
          <p className="text-sm text-uc-text-muted mt-1">Click &quot;Add Exercise&quot; to start tracking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map((exercise, exerciseIndex) => {
            const exerciseStats = stats(exercise.exerciseId)
            return (
              <div
                key={exerciseIndex}
                className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-uc-text-light">{exercise.exerciseName}</h4>
                      {exerciseStats.lastUsed && (
                        <span className="text-xs text-uc-text-muted">
                          (Last: {exerciseStats.lastWeight}×{exerciseStats.lastReps})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/exercises/${exercise.exerciseId}`}
                      className="text-xs text-uc-mustard hover:text-uc-mustard/80 transition-colors"
                      target="_blank"
                    >
                      View Progress →
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      className="text-uc-text-muted hover:text-red-500 transition-colors"
                      title="Remove exercise"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Sets */}
                <div className="space-y-2">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="flex items-center gap-2 bg-uc-black/50 rounded-lg p-2"
                    >
                      <span className="text-sm text-uc-text-muted w-8">Set {setIndex + 1}</span>
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) =>
                          handleSetChange(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)
                        }
                        placeholder="Reps"
                        min="1"
                        className="w-20 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                      />
                      <span className="text-uc-text-muted">×</span>
                      <input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) =>
                          handleSetChange(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)
                        }
                        placeholder="Weight"
                        step="0.5"
                        min="0"
                        className="w-20 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                      />
                      <span className="text-xs text-uc-text-muted">kg</span>
                      <input
                        type="number"
                        value={set.rir || ''}
                        onChange={(e) =>
                          handleSetChange(
                            exerciseIndex,
                            setIndex,
                            'rir',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        placeholder="RIR"
                        min="0"
                        max="5"
                        className="w-16 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 text-sm"
                        title="Reps in Reserve"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                        className="text-uc-text-muted hover:text-red-500 transition-colors ml-auto"
                        title="Remove set"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddSet(exerciseIndex)}
                    className="w-full px-3 py-2 text-sm text-uc-text-muted hover:text-uc-text-light hover:bg-uc-black/50 rounded-lg transition-colors border border-uc-purple/20"
                  >
                    + Add Set
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Routine Selector Modal */}
      {showRoutineSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
          <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-uc-purple/20 flex items-center justify-between sticky top-0 bg-uc-dark-bg">
              <h3 className="text-lg font-semibold text-uc-text-light">Load Routine</h3>
              <button
                onClick={() => {
                  setShowRoutineSelector(false)
                  setSelectedRoutine(null)
                }}
                className="text-uc-text-muted hover:text-uc-text-light"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {routines.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-uc-text-muted mb-4">No routines available</p>
                  <Link
                    href="/routines"
                    className="text-uc-mustard hover:text-uc-mustard/80 transition-colors"
                  >
                    Create your first routine →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {routines.map((routine) => (
                    <div
                      key={routine.id}
                      className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-uc-text-light">{routine.name}</h4>
                          {routine.description && (
                            <p className="text-sm text-uc-text-muted mt-1">{routine.description}</p>
                          )}
                          <div className="text-xs text-uc-text-muted mt-2">
                            {routine.routineExercises.length} {routine.routineExercises.length === 1 ? 'exercise' : 'exercises'}
                          </div>
                        </div>
                      </div>

                      {routine.variations.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm text-uc-text-muted mb-2">Select variation:</div>
                          {routine.variations.map((variation, vIndex) => (
                            <button
                              key={vIndex}
                              type="button"
                              onClick={() => handleLoadRoutine(routine, vIndex)}
                              className="w-full text-left bg-uc-purple/20 hover:bg-uc-purple/30 border border-uc-purple/30 rounded-lg p-3 transition-colors"
                            >
                              <div className="font-medium text-uc-text-light">{variation.name}</div>
                              {variation.defaultRepRangeMin && variation.defaultRepRangeMax && (
                                <div className="text-sm text-uc-text-muted">
                                  {variation.defaultRepRangeMin}-{variation.defaultRepRangeMax} reps
                                  {variation.defaultSets && ` • ${variation.defaultSets} sets`}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLoadRoutine(routine)}
                          className="w-full bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Load Routine
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

