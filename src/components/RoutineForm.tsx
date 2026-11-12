'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Routine, RoutineFormData, Exercise, RoutineExercise, RoutineVariation } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { BottomSheet, Button, EmptyState, FieldError, Icon, Input, Overline, Textarea } from '@/components/ui'

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

  const handleCancel = () => {
    // Clear draft when canceling
    if (!routine && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        console.error('Error clearing draft:', error)
      }
    }
    onCancel()
  }

  const closeExerciseSelector = () => {
    setShowExerciseSelector(false)
    setSearchQuery('')
    setSelectedExerciseIds(new Set())
  }

  const allFilteredSelected = filteredExercises.length > 0 && filteredExercises.every(ex => selectedExerciseIds.has(ex.id))

  const sectionHeader = (label: string, count: number, action: string, onClick: () => void) => (
    <div className="mb-2 flex items-center justify-between gap-3">
      <Overline>{label} ({count})</Overline>
      <button
        type="button"
        onClick={onClick}
        className="min-h-11 px-1 text-sm font-bold text-uc-primary hover:underline"
      >
        + {action}
      </button>
    </div>
  )

  const iconButtonBase = 'inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted transition-colors hover:bg-uc-elevated disabled:opacity-30 disabled:hover:bg-transparent'
  const iconButton = `${iconButtonBase} hover:text-uc-text`
  const removeButton = `${iconButtonBase} hover:text-uc-error`

  return (
    <>
      <BottomSheet
        isOpen
        onClose={handleCancel}
        title={routine ? (t('routines.form.editTitle') || 'Edit Routine') : (t('routines.form.createTitle') || 'Create Routine')}
        closeLabel={t('common.close') || 'Close'}
        dismissible={false}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={handleCancel}>
              {t('routines.form.cancel') || 'Cancel'}
            </Button>
            <Button type="submit" form="routine-form" variant="accent" size="lg" className="flex-[2]" isLoading={isSubmitting}>
              {isSubmitting
                ? (t('routines.form.saving') || 'Saving...')
                : routine
                  ? (t('routines.form.update') || 'Update Routine')
                  : (t('routines.form.create') || 'Create Routine')}
            </Button>
          </div>
        }
      >
        <form id="routine-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <Overline as="label" htmlFor="routine-name" className="mb-2 block">
              {t('routines.form.name') || 'Routine Name'} *
            </Overline>
            <Input
              id="routine-name"
              type="text"
              value={formData.name}
              aria-invalid={!!errors.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('routines.form.namePlaceholder') || 'e.g., Upper Body Push'}
            />
            <FieldError>{errors.name}</FieldError>
          </div>

          {/* Description */}
          <div>
            <Overline as="label" htmlFor="routine-description" className="mb-2 block">
              {t('routines.form.description') || 'Description (optional)'}
            </Overline>
            <Textarea
              id="routine-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder={t('routines.form.descriptionPlaceholder') || 'Brief description of this routine'}
            />
          </div>

          {/* Exercises Section */}
          <div>
            {sectionHeader(
              t('routines.form.exercises') || 'Exercises',
              formData.exercises.length,
              t('routines.form.addExercise') || 'Add Exercise',
              () => {
                // Refresh exercises if callback provided
                if (onRefreshExercises) {
                  onRefreshExercises()
                }
                setShowExerciseSelector(true)
              }
            )}

            {formData.exercises.length === 0 ? (
              <p className="rounded-uc-input border border-dashed border-uc-border px-4 py-6 text-center text-sm text-uc-text-muted">
                {t('routines.form.noExercises') || 'No exercises added yet'}
              </p>
            ) : (
              <div className="space-y-2">
                {formData.exercises.map((ex, index) => (
                  <div
                    key={index}
                    className="flex min-h-14 items-center gap-1 rounded-uc-input border border-uc-border bg-uc-surface pl-4 pr-1"
                  >
                    <span className="w-6 shrink-0 text-sm font-bold text-uc-text-muted uc-num">{index + 1}</span>
                    <span className="min-w-0 flex-1 font-bold text-uc-text break-words">
                      {ex.exercise?.name || (t('routines.form.unknownExercise') || 'Unknown Exercise')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMoveExercise(index, 'up')}
                      disabled={index === 0}
                      aria-label={t('routines.form.moveUp') || 'Move up'}
                      className={iconButton}
                    >
                      <Icon name="move-up" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveExercise(index, 'down')}
                      disabled={index === formData.exercises.length - 1}
                      aria-label={t('routines.form.moveDown') || 'Move down'}
                      className={iconButton}
                    >
                      <Icon name="move-down" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      aria-label={t('routines.form.remove') || 'Remove'}
                      title={t('routines.form.remove') || 'Remove'}
                      className={removeButton}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variations Section */}
          <div>
            {sectionHeader(
              t('routines.form.variations') || 'Variations',
              formData.variations.length,
              t('routines.form.addVariation') || 'Add Variation',
              handleAddVariation
            )}

            {formData.variations.length === 0 ? (
              <p className="rounded-uc-input border border-dashed border-uc-border px-4 py-4 text-center text-[13px] text-uc-text-muted">
                {t('routines.form.variationsOptional') || 'Variations are optional. Add rep range presets (e.g., "Hypertrophy: 12-15 reps")'}
              </p>
            ) : (
              <div className="space-y-2">
                {formData.variations.map((variation, index) => (
                  <div
                    key={index}
                    className="flex min-h-14 items-center gap-1 rounded-uc-input border border-uc-border bg-uc-surface py-2 pl-4 pr-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-uc-text break-words">{variation.name}</div>
                      {variation.defaultRepRangeMin && variation.defaultRepRangeMax && (
                        <div className="text-[13px] font-semibold text-uc-text-muted uc-num">
                          {variation.defaultRepRangeMin}–{variation.defaultRepRangeMax} {t('routines.form.reps') || 'reps'}
                          {variation.defaultSets && ` · ${variation.defaultSets} ${t('routines.form.sets') || 'sets'}`}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditVariation(index)}
                      aria-label={t('common.edit') || 'Edit'}
                      title={t('common.edit') || 'Edit'}
                      className={iconButton}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(index)}
                      aria-label={t('routines.form.remove') || 'Remove'}
                      title={t('routines.form.remove') || 'Remove'}
                      className={removeButton}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </BottomSheet>

      {/* Exercise Selector */}
      <BottomSheet
        isOpen={showExerciseSelector}
        onClose={closeExerciseSelector}
        closeLabel={t('common.close') || 'Close'}
        title={
          <span className="flex flex-wrap items-baseline gap-x-2">
            {t('routines.form.selectExercises') || 'Select Exercises'}
            {selectedExerciseIds.size > 0 && (
              <span className="text-sm font-semibold text-uc-text-muted uc-num">
                {selectedExerciseIds.size} {t('routines.form.selected') || 'selected'}
              </span>
            )}
          </span>
        }
        footer={selectedExerciseIds.size > 0 && (
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={closeExerciseSelector}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button variant="primary" size="lg" className="flex-[2]" onClick={handleAddSelectedExercises}>
              {t('routines.form.addSelected') || 'Add Selected'} ({selectedExerciseIds.size})
            </Button>
          </div>
        )}
      >
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={t('routines.form.searchExercises') || 'Search exercises...'}
          placeholder={t('routines.form.searchExercises') || 'Search exercises...'}
          className="mb-3"
        />
        {filteredExercises.length > 0 && (
          <label className="mb-2 flex min-h-11 cursor-pointer items-center gap-3 px-1">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={allFilteredSelected ? handleDeselectAll : handleSelectAll}
              className="size-5 shrink-0 cursor-pointer accent-[var(--uc-primary)]"
            />
            <span className="text-sm font-bold text-uc-primary uc-num">
              {allFilteredSelected
                ? (t('routines.form.deselectAll') || 'Deselect All')
                : `${t('routines.form.selectAll') || 'Select All'} (${filteredExercises.length})`}
            </span>
          </label>
        )}
        {filteredExercises.length === 0 ? (
          <EmptyState
            title={availableExercises.length === 0
              ? (t('routines.form.noExercisesAvailable') || 'No exercises available')
              : (t('routines.form.noExercisesFound') || 'No exercises found')}
            description={availableExercises.length === 0
              ? (t('routines.form.createExercisesFirst') || 'You need to create exercises first before adding them to a routine.')
              : undefined}
            action={availableExercises.length === 0 && (
              <Button
                variant="accent"
                onClick={() => {
                  setShowExerciseSelector(false)
                  router.push('/exercises')
                }}
              >
                {t('routines.form.goToExercises') || 'Go to Exercises'}
              </Button>
            )}
          />
        ) : (
          <div className="space-y-2">
            {filteredExercises.map((exercise) => {
              const isSelected = selectedExerciseIds.has(exercise.id)
              const isAlreadyAdded = formData.exercises.some(ex => ex.exerciseId === exercise.id)
              return (
                <label
                  key={exercise.id}
                  className={`flex min-h-14 items-center gap-3 rounded-uc-input border px-4 py-2 transition-colors ${
                    isSelected ? 'border-uc-primary bg-uc-surface' : 'border-uc-border bg-uc-surface hover:border-uc-primary'
                  } ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleExerciseSelection(exercise.id)}
                    disabled={isAlreadyAdded}
                    className="size-5 shrink-0 cursor-pointer accent-[var(--uc-primary)] disabled:cursor-not-allowed"
                  />
                  <span className="min-w-0 flex-1 font-bold text-uc-text break-words">
                    {exercise.name}
                    {isAlreadyAdded && (
                      <span className="ml-2 text-xs font-semibold text-uc-text-muted">
                        ({t('routines.form.alreadyAdded') || 'already added'})
                      </span>
                    )}
                  </span>
                  {exercise.category && (
                    <span className="shrink-0 text-[13px] font-semibold text-uc-text-muted">{exercise.category}</span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </BottomSheet>

      {/* Variation Form */}
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
    </>
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
  const [nameError, setNameError] = useState('')

  const { t } = useLanguage()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setNameError(t('routines.form.variationForm.nameRequired') || 'Variation name is required')
      return
    }
    onSave(formData)
  }

  const numberField = (
    id: string,
    label: string,
    key: 'defaultRepRangeMin' | 'defaultRepRangeMax' | 'defaultSets',
    placeholder: string
  ) => (
    <div className="flex flex-col">
      <Overline as="label" htmlFor={id} className="mb-2 block flex-1">{label}</Overline>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={formData[key] || ''}
        onChange={(e) =>
          setFormData({
            ...formData,
            [key]: e.target.value ? parseInt(e.target.value) : undefined,
          })
        }
        className="text-center uc-num"
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <BottomSheet
      isOpen
      onClose={onCancel}
      title={variation
        ? (t('routines.form.variationForm.editTitle') || 'Edit Variation')
        : (t('routines.form.variationForm.addTitle') || 'Add Variation')}
      closeLabel={t('common.close') || 'Close'}
      dismissible={false}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
            {t('routines.form.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" form="variation-form" variant="accent" size="lg" className="flex-[2]">
            {t('routines.form.variationForm.save') || 'Save'}
          </Button>
        </div>
      }
    >
      <form id="variation-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Overline as="label" htmlFor="variation-name" className="mb-2 block">
            {t('routines.form.variationForm.name') || 'Name'} *
          </Overline>
          <Input
            id="variation-name"
            type="text"
            value={formData.name}
            aria-invalid={!!nameError}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (nameError) setNameError('')
            }}
            placeholder={t('routines.form.variationForm.namePlaceholder') || 'e.g., Hypertrophy, Strength'}
          />
          <FieldError>{nameError}</FieldError>
        </div>
        <div>
          <Overline as="label" htmlFor="variation-description" className="mb-2 block">
            {t('routines.form.variationForm.description') || 'Description (optional)'}
          </Overline>
          <Input
            id="variation-description"
            type="text"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {numberField('variation-min-reps', t('routines.form.variationForm.minReps') || 'Min Reps', 'defaultRepRangeMin', t('workouts.placeholders.minReps') || '12')}
          {numberField('variation-max-reps', t('routines.form.variationForm.maxReps') || 'Max Reps', 'defaultRepRangeMax', t('workouts.placeholders.maxReps') || '15')}
          {numberField('variation-sets', t('routines.form.variationForm.defaultSets') || 'Default Sets (optional)', 'defaultSets', t('workouts.placeholders.defaultSets') || '3')}
        </div>
      </form>
    </BottomSheet>
  )
}
