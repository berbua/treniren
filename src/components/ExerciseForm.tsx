'use client'

import { useState, useEffect } from 'react'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { BottomSheet, Button, ChoiceChip, FieldError, Input, Overline, SegmentedControl } from '@/components/ui'

interface ExerciseFormProps {
  exercise?: Exercise | null
  onSubmit: (data: { name: string; category?: string; defaultUnit: string }) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const commonCategories = [
  'Upper Body',
  'Lower Body',
  'Core',
  'Pull',
  'Push',
  'Legs',
  'Back',
  'Chest',
  'Shoulders',
  'Arms',
  'Climbing Specific',
  'Cardio',
  'Other'
]

const units = ['kg', 'lbs', 'reps', 'time', 'distance']

export default function ExerciseForm({ exercise, onSubmit, onCancel, isSubmitting = false }: ExerciseFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    category: exercise?.category || '',
    defaultUnit: exercise?.defaultUnit || 'kg',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name,
        category: exercise.category || '',
        defaultUnit: exercise.defaultUnit,
      })
    }
  }, [exercise])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t('exercises.form.nameRequired') || 'Exercise name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit({
      name: formData.name.trim(),
      category: formData.category || undefined,
      defaultUnit: formData.defaultUnit,
    })
  }

  return (
    <BottomSheet
      isOpen
      onClose={onCancel}
      title={exercise ? (t('exercises.form.editTitle') || 'Edit exercise') : (t('exercises.form.newTitle') || 'New exercise')}
      closeLabel={t('common.close') || 'Close'}
      dismissible={false}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" form="exercise-form" variant="accent" size="lg" className="flex-[2]" isLoading={isSubmitting}>
            {isSubmitting ? (t('common.saving') || 'Saving...') : (t('exercises.form.save') || 'Save exercise')}
          </Button>
        </div>
      }
    >
      <form id="exercise-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Exercise Name */}
        <div>
          <Overline as="label" htmlFor="exercise-name" className="mb-2 block">
            {t('exercises.form.name') || 'Name'} *
          </Overline>
          <Input
            id="exercise-name"
            type="text"
            value={formData.name}
            aria-invalid={!!errors.name}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, name: e.target.value }))
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: '' }))
              }
            }}
            placeholder={t('workouts.placeholders.exerciseName') || 'e.g., Pull-ups, Deadlift, Bench Press'}
          />
          <FieldError>{errors.name}</FieldError>
        </div>

        {/* Category */}
        <div>
          <Overline className="mb-2">{t('exercises.form.category') || 'Category'}</Overline>
          <div className="flex flex-wrap gap-2 mb-3">
            {commonCategories.map(category => (
              <ChoiceChip
                key={category}
                selected={formData.category === category}
                onClick={() => setFormData(prev => ({ ...prev, category }))}
              >
                {category}
              </ChoiceChip>
            ))}
          </div>
          <Input
            type="text"
            value={formData.category}
            aria-label={t('workouts.placeholders.customCategory') || 'Or enter custom category'}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder={t('workouts.placeholders.customCategory') || 'Or enter custom category'}
          />
        </div>

        {/* Default Unit */}
        <div>
          <Overline className="mb-2">{t('exercises.form.unit') || 'Unit'}</Overline>
          <SegmentedControl
            ariaLabel={t('exercises.form.unit') || 'Unit'}
            options={units.map(unit => ({ value: unit, label: unit }))}
            value={formData.defaultUnit}
            onChange={(defaultUnit) => setFormData(prev => ({ ...prev, defaultUnit }))}
          />
        </div>
      </form>
    </BottomSheet>
  )
}
