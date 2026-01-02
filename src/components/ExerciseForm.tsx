'use client'

import { useState, useEffect } from 'react'
import { Exercise } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'

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
      newErrors.name = 'Exercise name is required'
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-uc-dark-bg rounded-2xl shadow-xl w-full max-w-md border border-uc-purple/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-uc-purple/20">
          <h2 className="text-2xl font-bold text-uc-text-light">
            {exercise ? '✏️ Edit Exercise' : '➕ Add Exercise'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Exercise Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Exercise Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: '' }))
                }
              }}
              placeholder={t('workouts.placeholders.exerciseName') || 'e.g., Pull-ups, Deadlift, Bench Press'}
              className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 ${
                errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {commonCategories.map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category }))}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    formData.category === category
                      ? 'bg-uc-purple text-uc-text-light'
                      : 'bg-uc-black/50 text-uc-text-muted hover:text-uc-text-light hover:bg-uc-dark-bg'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder={t('workouts.placeholders.customCategory') || 'Or enter custom category'}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
            />
          </div>

          {/* Default Unit */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Default Unit
            </label>
            <select
              value={formData.defaultUnit}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultUnit: e.target.value }))}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-uc-purple/20">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors bg-uc-dark-bg/50 hover:bg-uc-dark-bg rounded-xl border border-uc-purple/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-uc-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{exercise ? 'Update' : 'Create'} Exercise</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

