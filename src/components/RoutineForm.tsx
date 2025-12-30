'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Routine, RoutineFormData, Exercise, RoutineExercise, RoutineVariation } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from './LoadingSpinner'

interface RoutineFormProps {
  routine?: Routine | null
  availableExercises: Exercise[]
  onSubmit: (data: RoutineFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
  onRefreshExercises?: () => void
}

export default function RoutineForm({
  routine,
  availableExercises,
  onSubmit,
  onCancel,
  isSubmitting = false,
  onRefreshExercises,
}: RoutineFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const STORAGE_KEY = 'routine-form-draft'
  
  // Load draft from localStorage if no routine is being edited
  const loadDraft = (): RoutineFormData | null => {
    if (routine || typeof window === 'undefined') return null
    try {
      const draft = localStorage.getItem(STORAGE_KEY)
      if (draft) {
        return JSON.parse(draft)
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    }
    return null
  }

  const [formData, setFormData] = useState<RoutineFormData>(() => {
    if (routine) {
      return {
        name: routine.name,
        description: routine.description || '',
        exercises: [],
        variations: [],
      }
    }
    const draft = loadDraft()
    return draft || {
      name: '',
      description: '',
      exercises: [],
      variations: [],
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [showVariationForm, setShowVariationForm] = useState(false)
  const [editingVariationIndex, setEditingVariationIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set())

  // Save draft to localStorage on every change (only for new routines)
  useEffect(() => {
    if (!routine && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
      } catch (error) {
        console.error('Error saving draft:', error)
      }
    }
  }, [formData, routine])

  useEffect(() => {
    if (routine) {
      setFormData({
        name: routine.name,
        description: routine.description || '',
        exercises: routine.routineExercises.map((re) => ({
          exerciseId: re.exerciseId,
          order: re.order,
          notes: re.notes || undefined,
          exercise: re.exercise,
        })),
        variations: routine.variations.map((v) => ({
          name: v.name,
          description: v.description || undefined,
          defaultSets: v.defaultSets || undefined,
          defaultRepRangeMin: v.defaultRepRangeMin || undefined,
          defaultRepRangeMax: v.defaultRepRangeMax || undefined,
          defaultRIR: v.defaultRIR || undefined,
        })),
      })
    }
  }, [routine])

  // Clear draft when form is successfully submitted
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || isSubmitting) {
      return
    }

    // Clear draft before submitting
    if (!routine && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        console.error('Error clearing draft:', error)
      }
    }

    onSubmit(formData)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('routines.form.nameRequired') || 'Routine name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      order: formData.exercises.length,
      exercise,
    }
    setFormData({
      ...formData,
      exercises: [...formData.exercises, newExercise],
    })
    setShowExerciseSelector(false)
    setSearchQuery('')
    setSelectedExerciseIds(new Set())
  }

  const handleToggleExerciseSelection = (exerciseId: string) => {
    const newSelected = new Set(selectedExerciseIds)
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId)
    } else {
      newSelected.add(exerciseId)
    }
    setSelectedExerciseIds(newSelected)
  }

  const handleSelectAll = () => {
    const allIds = new Set(filteredExercises.map(ex => ex.id))
    setSelectedExerciseIds(allIds)
  }

  const handleDeselectAll = () => {
    setSelectedExerciseIds(new Set())
  }

  const handleAddSelectedExercises = () => {
    const selectedExercises = filteredExercises.filter(ex => selectedExerciseIds.has(ex.id))
    const newExercises: RoutineExercise[] = selectedExercises.map((exercise) => ({
      exerciseId: exercise.id,
      order: formData.exercises.length + selectedExercises.indexOf(exercise),
      exercise,
    }))
    setFormData({
      ...formData,
      exercises: [...formData.exercises, ...newExercises],
    })
    setShowExerciseSelector(false)
    setSearchQuery('')
    setSelectedExerciseIds(new Set())
  }

  // Reset selected exercises when modal opens/closes or search changes
  useEffect(() => {
    if (!showExerciseSelector) {
      setSelectedExerciseIds(new Set())
    }
  }, [showExerciseSelector])

  const handleRemoveExercise = (index: number) => {
    const newExercises = formData.exercises.filter((_, i) => i !== index)
    // Reorder
    newExercises.forEach((ex, i) => {
      ex.order = i
    })
    setFormData({
      ...formData,
      exercises: newExercises,
    })
  }

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...formData.exercises]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newExercises.length) {
      return
    }

    // Swap
    const temp = newExercises[index]
    newExercises[index] = newExercises[targetIndex]
    newExercises[targetIndex] = temp

    // Update orders
    newExercises.forEach((ex, i) => {
      ex.order = i
    })

    setFormData({
      ...formData,
      exercises: newExercises,
    })
  }

  const handleAddVariation = () => {
    setEditingVariationIndex(null)
    setShowVariationForm(true)
  }

  const handleEditVariation = (index: number) => {
    setEditingVariationIndex(index)
    setShowVariationForm(true)
  }

  const handleSaveVariation = (variation: RoutineVariation) => {
    if (editingVariationIndex !== null) {
      // Update existing
      const newVariations = [...formData.variations]
      newVariations[editingVariationIndex] = variation
      setFormData({
        ...formData,
        variations: newVariations,
      })
    } else {
      // Add new
      setFormData({
        ...formData,
        variations: [...formData.variations, variation],
      })
    }
    setShowVariationForm(false)
    setEditingVariationIndex(null)
  }

  const handleRemoveVariation = (index: number) => {
    setFormData({
      ...formData,
      variations: formData.variations.filter((_, i) => i !== index),
    })
  }

  const filteredExercises = availableExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentVariation = editingVariationIndex !== null
    ? formData.variations[editingVariationIndex]
    : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-uc-dark-bg border-b border-uc-purple/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-uc-text-light">
            {routine ? (t('routines.form.editTitle') || 'Edit Routine') : (t('routines.form.createTitle') || 'Create Routine')}
          </h2>
          <button
            onClick={onCancel}
            className="text-uc-text-muted hover:text-uc-text-light transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('routines.form.name') || 'Routine Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder={t('routines.form.namePlaceholder') || 'e.g., Upper Body Push'}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('routines.form.description') || 'Description (optional)'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              rows={2}
              placeholder={t('routines.form.descriptionPlaceholder') || 'Brief description of this routine'}
            />
          </div>

          {/* Exercises Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-uc-text-light">
                {t('routines.form.exercises') || 'Exercises'} ({formData.exercises.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  // Refresh exercises if callback provided
                  if (onRefreshExercises) {
                    onRefreshExercises()
                  }
                  setShowExerciseSelector(true)
                }}
                className="bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + {t('routines.form.addExercise') || 'Add Exercise'}
              </button>
            </div>

            {formData.exercises.length === 0 ? (
              <div className="bg-uc-black/50 rounded-lg p-8 text-center border border-uc-purple/20">
                <p className="text-uc-text-muted">{t('routines.form.noExercises') || 'No exercises added yet'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.exercises.map((ex, index) => (
                  <div
                    key={index}
                    className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-uc-text-muted text-sm w-6">{index + 1}.</span>
                      <span className="text-uc-text-light font-medium">
                        {ex.exercise?.name || (t('routines.form.unknownExercise') || 'Unknown Exercise')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveExercise(index, 'up')}
                        disabled={index === 0}
                        className="text-uc-text-muted hover:text-uc-text-light disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveExercise(index, 'down')}
                        disabled={index === formData.exercises.length - 1}
                        className="text-uc-text-muted hover:text-uc-text-light disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        {t('routines.form.remove') || 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variations Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-uc-text-light">
                {t('routines.form.variations') || 'Variations'} ({formData.variations.length})
              </label>
              <button
                type="button"
                onClick={handleAddVariation}
                className="bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + {t('routines.form.addVariation') || 'Add Variation'}
              </button>
            </div>

            {formData.variations.length === 0 ? (
              <div className="bg-uc-black/50 rounded-lg p-4 text-center border border-uc-purple/20">
                <p className="text-uc-text-muted text-sm">
                  {t('routines.form.variationsOptional') || 'Variations are optional. Add rep range presets (e.g., "Hypertrophy: 12-15 reps")'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.variations.map((variation, index) => (
                  <div
                    key={index}
                    className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-uc-text-light">{variation.name}</div>
                      {variation.defaultRepRangeMin && variation.defaultRepRangeMax && (
                        <div className="text-sm text-uc-text-muted">
                          {variation.defaultRepRangeMin}-{variation.defaultRepRangeMax} {t('routines.form.reps') || 'reps'}
                          {variation.defaultSets && ` • ${variation.defaultSets} ${t('routines.form.sets') || 'sets'}`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditVariation(index)}
                        className="text-uc-text-muted hover:text-uc-text-light"
                      >
                        {t('common.edit') || 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        {t('routines.form.remove') || 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-uc-purple/20">
            <button
              type="button"
              onClick={() => {
                // Clear draft when canceling
                if (!routine && typeof window !== 'undefined') {
                  try {
                    localStorage.removeItem(STORAGE_KEY)
                  } catch (error) {
                    console.error('Error clearing draft:', error)
                  }
                }
                onCancel()
              }}
              className="flex-1 bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-6 py-3 rounded-xl font-medium transition-colors"
            >
              {t('routines.form.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting 
                ? (t('routines.form.saving') || 'Saving...') 
                : routine 
                  ? (t('routines.form.update') || 'Update Routine') 
                  : (t('routines.form.create') || 'Create Routine')}
            </button>
          </div>
        </form>

        {/* Exercise Selector Modal */}
        {showExerciseSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
            <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-md">
              <div className="p-4 border-b border-uc-purple/20 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-uc-text-light">
                  {t('routines.form.selectExercises') || 'Select Exercises'}
                  {selectedExerciseIds.size > 0 && (
                    <span className="ml-2 text-sm text-uc-mustard">
                      ({selectedExerciseIds.size} {t('routines.form.selected') || 'selected'})
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setShowExerciseSelector(false)
                    setSearchQuery('')
                    setSelectedExerciseIds(new Set())
                  }}
                  className="text-uc-text-muted hover:text-uc-text-light"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('routines.form.searchExercises') || 'Search exercises...'}
                  className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple mb-4"
                />
                {filteredExercises.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-3 py-1 rounded-lg transition-colors"
                    >
                      {t('routines.form.selectAll') || 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-xs bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-3 py-1 rounded-lg transition-colors"
                    >
                      {t('routines.form.deselectAll') || 'Deselect All'}
                    </button>
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
                  {filteredExercises.length === 0 ? (
                    <div className="text-center py-6 space-y-4">
                      <p className="text-uc-text-muted">
                        {availableExercises.length === 0
                          ? (t('routines.form.noExercisesAvailable') || 'No exercises available')
                          : (t('routines.form.noExercisesFound') || 'No exercises found')}
                      </p>
                      {availableExercises.length === 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-uc-text-muted">
                            {t('routines.form.createExercisesFirst') || 'You need to create exercises first before adding them to a routine.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowExerciseSelector(false)
                              router.push('/exercises')
                            }}
                            className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            {t('routines.form.goToExercises') || 'Go to Exercises'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredExercises.map((exercise) => {
                      const isSelected = selectedExerciseIds.has(exercise.id)
                      const isAlreadyAdded = formData.exercises.some(ex => ex.exerciseId === exercise.id)
                      return (
                        <label
                          key={exercise.id}
                          className={`flex items-center gap-3 w-full text-left bg-uc-black/50 hover:bg-uc-black rounded-lg p-3 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-uc-mustard bg-uc-mustard/10'
                              : 'border-uc-purple/20 hover:border-uc-purple/40'
                          } ${isAlreadyAdded ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleExerciseSelection(exercise.id)}
                            disabled={isAlreadyAdded}
                            className="w-4 h-4 text-uc-mustard bg-uc-black border-uc-purple/30 rounded focus:ring-uc-mustard focus:ring-2"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-uc-text-light">
                              {exercise.name}
                              {isAlreadyAdded && (
                                <span className="ml-2 text-xs text-uc-text-muted">
                                  ({t('routines.form.alreadyAdded') || 'already added'})
                                </span>
                              )}
                            </div>
                            {exercise.category && (
                              <div className="text-sm text-uc-text-muted">{exercise.category}</div>
                            )}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
                {selectedExerciseIds.size > 0 && (
                  <div className="flex gap-2 pt-4 border-t border-uc-purple/20">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExerciseSelector(false)
                        setSearchQuery('')
                        setSelectedExerciseIds(new Set())
                      }}
                      className="flex-1 bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddSelectedExercises}
                      className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {t('routines.form.addSelected') || `Add Selected (${selectedExerciseIds.size})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Variation Form Modal */}
        {showVariationForm && (
          <VariationForm
            variation={currentVariation}
            onSave={handleSaveVariation}
            onCancel={() => {
              setShowVariationForm(false)
              setEditingVariationIndex(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function VariationForm({
  variation,
  onSave,
  onCancel,
}: {
  variation: RoutineVariation | null
  onSave: (variation: RoutineVariation) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<RoutineVariation>({
    name: variation?.name || '',
    description: variation?.description || '',
    defaultSets: variation?.defaultSets || undefined,
    defaultRepRangeMin: variation?.defaultRepRangeMin || undefined,
    defaultRepRangeMax: variation?.defaultRepRangeMax || undefined,
    defaultRIR: variation?.defaultRIR || undefined,
  })

  const { t } = useLanguage()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert(t('routines.form.variationForm.nameRequired') || 'Variation name is required')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-md">
        <div className="p-4 border-b border-uc-purple/20 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-uc-text-light">
            {variation 
              ? (t('routines.form.variationForm.editTitle') || 'Edit Variation') 
              : (t('routines.form.variationForm.addTitle') || 'Add Variation')}
          </h3>
          <button onClick={onCancel} className="text-uc-text-muted hover:text-uc-text-light">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('routines.form.variationForm.name') || 'Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder={t('routines.form.variationForm.namePlaceholder') || 'e.g., Hypertrophy, Strength'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('routines.form.variationForm.description') || 'Description (optional)'}
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('routines.form.variationForm.minReps') || 'Min Reps'}
              </label>
              <input
                type="number"
                value={formData.defaultRepRangeMin || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultRepRangeMin: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                placeholder={t('workouts.placeholders.minReps') || '12'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('routines.form.variationForm.maxReps') || 'Max Reps'}
              </label>
              <input
                type="number"
                value={formData.defaultRepRangeMax || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultRepRangeMax: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                placeholder={t('workouts.placeholders.maxReps') || '15'}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('routines.form.variationForm.defaultSets') || 'Default Sets (optional)'}
            </label>
            <input
              type="number"
              value={formData.defaultSets || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultSets: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder={t('workouts.placeholders.defaultSets') || '3'}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-4 py-2 rounded-lg transition-colors"
            >
              {t('routines.form.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t('routines.form.variationForm.save') || 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

