'use client'

import { useState, useMemo } from 'react'
import { WorkoutType, TrainingVolume, WorkoutFormData, Workout } from '@/types/workout'
import { useCycle } from '@/contexts/CycleContext'
import { calculateCycleInfo } from '@/lib/cycle-utils'
import CycleInfoComponent from './CycleInfo'

interface WorkoutFormProps {
  onSubmit: (workout: WorkoutFormData) => void
  onCancel: () => void
  initialData?: Workout
}

const workoutTypes: { value: WorkoutType; label: string; emoji: string }[] = [
  { value: 'GYM', label: 'Gym', emoji: '🏋️' },
  { value: 'BOULDERING', label: 'Bouldering', emoji: '🧗' },
  { value: 'CIRCUITS', label: 'Circuits', emoji: '🔄' },
  { value: 'LEAD_ROCK', label: 'Lead Rock', emoji: '🏔️' },
  { value: 'LEAD_ARTIFICIAL', label: 'Lead Wall', emoji: '🧗‍♀️' },
]

const trainingVolumes: { value: TrainingVolume; label: string }[] = [
  { value: 'TR1', label: 'TR1 - Very Light' },
  { value: 'TR2', label: 'TR2 - Light' },
  { value: 'TR3', label: 'TR3 - Moderate' },
  { value: 'TR4', label: 'TR4 - Hard' },
  { value: 'TR5', label: 'TR5 - Very Hard' },
]

export default function WorkoutForm({ onSubmit, onCancel, initialData }: WorkoutFormProps) {
  const { cycleSettings, isCycleTrackingEnabled } = useCycle()
  
  const [formData, setFormData] = useState({
    type: initialData?.type || 'GYM',
    date: initialData?.startTime 
      ? new Date(initialData.startTime).toISOString().slice(0, 10)
      : (typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '2024-01-15'),
    trainingVolume: initialData?.trainingVolume || 'TR3',
    preSessionFeel: initialData?.preSessionFeel || 3,
    dayAfterTiredness: initialData?.dayAfterTiredness || 3,
    notes: initialData?.notes || '',
  })

  // Calculate cycle info for the selected date
  const cycleInfoForSelectedDate = useMemo(() => {
    if (!isCycleTrackingEnabled || !cycleSettings) return null
    
    const selectedDate = new Date(formData.date)
    return calculateCycleInfo(cycleSettings, selectedDate)
  }, [formData.date, cycleSettings, isCycleTrackingEnabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof WorkoutFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            {initialData ? 'Edit Workout' : 'Add New Workout'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Workout Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Workout Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              >
                {workoutTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                required
              />
            </div>

            {/* Cycle Information */}
            {isCycleTrackingEnabled && cycleInfoForSelectedDate && (
              <div>
                <CycleInfoComponent cycleInfo={cycleInfoForSelectedDate} showRecommendations={true} isSelectedDate={true} />
              </div>
            )}

            {/* Training Volume (for non-gym workouts) */}
            {formData.type !== 'GYM' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Training Volume
                </label>
                <select
                  value={formData.trainingVolume}
                  onChange={(e) => handleChange('trainingVolume', e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                >
                  {trainingVolumes.map((volume) => (
                    <option key={volume.value} value={volume.value}>
                      {volume.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Pre-session Feel */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pre-session Feel (1-5)
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleChange('preSessionFeel', rating)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      formData.preSessionFeel === rating
                        ? 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Day After Tiredness */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Day After Tiredness (1-5)
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleChange('dayAfterTiredness', rating)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      formData.dayAfterTiredness === rating
                        ? 'border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                placeholder="Add any notes about your workout..."
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {initialData ? 'Update' : 'Create'} Workout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
