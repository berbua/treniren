'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { WorkoutType, TrainingVolume, TimeOfDay, MentalPracticeType, FingerboardProtocol } from '@/types/workout'

interface QuickLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: QuickLogData) => Promise<void>
  defaultDate?: Date
  isSubmitting?: boolean
}

export interface QuickLogData {
  date: string
  type: WorkoutType
  trainingVolume?: TrainingVolume
  mentalPracticeType?: MentalPracticeType
  timeOfDay?: TimeOfDay[]
  protocolId?: string
}

export default function QuickLogModal({
  isOpen,
  onClose,
  onSubmit,
  defaultDate,
  isSubmitting = false,
}: QuickLogModalProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<QuickLogData>({
    date: defaultDate ? defaultDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    type: 'GYM',
  })
  const [protocols, setProtocols] = useState<FingerboardProtocol[]>([])
  const [loadingProtocols, setLoadingProtocols] = useState(false)

  // Fetch protocols when fingerboard is selected
  useEffect(() => {
    if (formData.type === 'FINGERBOARD' && protocols.length === 0) {
      fetchProtocols()
    }
  }, [formData.type])

  const fetchProtocols = async () => {
    setLoadingProtocols(true)
    try {
      const response = await fetch('/api/fingerboard-protocols', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setProtocols(data)
      }
    } catch (error) {
      console.error('Error fetching protocols:', error)
    } finally {
      setLoadingProtocols(false)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const workoutTypes: { value: WorkoutType; label: string; emoji: string }[] = [
    { value: 'GYM', label: t('workoutTypes.gym') || 'Gym', emoji: '🏋️' },
    { value: 'FINGERBOARD', label: t('workoutTypes.fingerboard') || 'Fingerboard', emoji: '🖐️' },
    { value: 'BOULDERING', label: t('workoutTypes.bouldering') || 'Bouldering', emoji: '🧗' },
    { value: 'CIRCUITS', label: t('workoutTypes.circuits') || 'Circuits', emoji: '🔄' },
    { value: 'LEAD_ROCK', label: t('workoutTypes.leadRock') || 'Lead Rock', emoji: '🧗‍♀️' },
    { value: 'LEAD_ARTIFICIAL', label: t('workoutTypes.leadArtificial') || 'Lead Artificial', emoji: '🧗‍♂️' },
    { value: 'MENTAL_PRACTICE', label: t('workoutTypes.mentalPractice') || 'Mental Practice', emoji: '🧘' },
  ]

  const trainingVolumes: { value: TrainingVolume; label: string }[] = [
    { value: 'TR1', label: 'TR1' },
    { value: 'TR2', label: 'TR2' },
    { value: 'TR3', label: 'TR3' },
    { value: 'TR4', label: 'TR4' },
    { value: 'TR5', label: 'TR5' },
  ]

  const timeOfDayOptions: { value: TimeOfDay; label: string }[] = [
    { value: 'MORNING', label: t('workouts.labels.morning') || 'Morning' },
    { value: 'MIDDAY', label: t('workouts.labels.midday') || 'Midday' },
    { value: 'EVENING', label: t('workouts.labels.evening') || 'Evening' },
  ]

  const mentalPracticeTypes: { value: MentalPracticeType; label: string }[] = [
    { value: 'MEDITATION', label: t('workouts.labels.meditation') || 'Meditation' },
    { value: 'REFLECTING', label: t('workouts.labels.reflecting') || 'Reflecting' },
    { value: 'OTHER', label: t('workouts.labels.other') || 'Other' },
  ]

  // Set smart defaults based on workout type
  const handleTypeChange = (type: WorkoutType) => {
    const newData: QuickLogData = { ...formData, type }
    
    if (type === 'FINGERBOARD' && !formData.trainingVolume) {
      newData.trainingVolume = 'TR3'
    }
    
    if (type === 'MENTAL_PRACTICE') {
      if (!formData.mentalPracticeType) {
        newData.mentalPracticeType = 'MEDITATION'
      }
      if (!formData.timeOfDay || formData.timeOfDay.length === 0) {
        const currentHour = new Date().getHours()
        if (currentHour < 12) {
          newData.timeOfDay = ['MORNING']
        } else if (currentHour < 17) {
          newData.timeOfDay = ['MIDDAY']
        } else {
          newData.timeOfDay = ['EVENING']
        }
      }
    } else {
      // Clear mental practice specific fields when switching away
      if (formData.type === 'MENTAL_PRACTICE') {
        delete newData.mentalPracticeType
        delete newData.timeOfDay
      }
      // Clear protocol when switching away from fingerboard
      if (formData.type === 'FINGERBOARD' && type !== 'FINGERBOARD') {
        delete newData.protocolId
      }
    }
    
    setFormData(newData)
  }

  const handleTimeOfDayToggle = (time: TimeOfDay) => {
    const current = formData.timeOfDay || []
    const newTimeOfDay = current.includes(time)
      ? current.filter(t => t !== time)
      : [...current, time]
    setFormData({ ...formData, timeOfDay: newTimeOfDay })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-uc-dark-bg rounded-2xl shadow-xl w-full max-w-md border border-uc-purple/20">
        <div className="p-6 border-b border-uc-purple/20">
          <h2 className="text-2xl font-bold text-uc-text-light mb-2">
            {t('quickLog.title') || '⚡ Quick Log'}
          </h2>
          <p className="text-sm text-uc-text-muted">
            {t('quickLog.description') || 'Quickly log a workout. You can add details later.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('workouts.labels.date') || 'Date'} *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              />
            </div>

            {/* Workout Type */}
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('workouts.labels.type') || 'Workout Type'} *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {workoutTypes.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleTypeChange(value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.type === value
                        ? 'border-uc-purple bg-uc-purple/20'
                        : 'border-uc-purple/20 bg-uc-black/50 hover:border-uc-purple/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{emoji}</span>
                      <span className="text-sm font-medium text-uc-text-light">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Protocol (for Fingerboard) */}
            {formData.type === 'FINGERBOARD' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  {t('workouts.labels.protocol') || 'Protocol'} ({t('common.optional') || 'Optional'})
                </label>
                <select
                  value={formData.protocolId || ''}
                  onChange={(e) => setFormData({ ...formData, protocolId: e.target.value || undefined })}
                  disabled={loadingProtocols}
                  className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple disabled:opacity-50"
                >
                  <option value="">{loadingProtocols ? (t('common.loading') || 'Loading...') : (t('common.select') || 'Select')}...</option>
                  {protocols.map((protocol) => (
                    <option key={protocol.id} value={protocol.id}>
                      {protocol.name}
                    </option>
                  ))}
                </select>
                {protocols.length === 0 && !loadingProtocols && (
                  <p className="text-xs text-uc-text-muted mt-1">
                    {t('quickLog.noProtocols') || 'No protocols available. Create one in Fingerboard Protocols.'}
                  </p>
                )}
              </div>
            )}

            {/* Training Volume (for Fingerboard and Gym) */}
            {(formData.type === 'FINGERBOARD' || formData.type === 'GYM') && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  {t('workouts.labels.trainingVolume') || 'Training Volume'} ({t('common.optional') || 'Optional'})
                </label>
                <select
                  value={formData.trainingVolume || ''}
                  onChange={(e) => setFormData({ ...formData, trainingVolume: e.target.value as TrainingVolume })}
                  className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                >
                  <option value="">{t('common.select') || 'Select'}...</option>
                  {trainingVolumes.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mental Practice Type */}
            {formData.type === 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  {t('workouts.labels.mentalPracticeType') || 'Practice Type'} ({t('common.optional') || 'Optional'})
                </label>
                <select
                  value={formData.mentalPracticeType || ''}
                  onChange={(e) => setFormData({ ...formData, mentalPracticeType: e.target.value as MentalPracticeType })}
                  className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                >
                  <option value="">{t('common.select') || 'Select'}...</option>
                  {mentalPracticeTypes.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Time of Day (for Mental Practice) */}
            {formData.type === 'MENTAL_PRACTICE' && (
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-2">
                  {t('workouts.labels.timeOfDay') || 'Time of Day'} ({t('common.optional') || 'Optional'})
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeOfDayOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTimeOfDayToggle(value)}
                      className={`px-4 py-2 rounded-xl border-2 transition-all ${
                        formData.timeOfDay?.includes(value)
                          ? 'border-uc-purple bg-uc-purple/20 text-uc-text-light'
                          : 'border-uc-purple/20 bg-uc-black/50 text-uc-text-muted hover:border-uc-purple/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-uc-purple/20 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors bg-uc-dark-bg/50 hover:bg-uc-dark-bg rounded-xl border border-uc-purple/20"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg font-medium"
            >
              {isSubmitting
                ? (t('quickLog.saving') || 'Saving...')
                : (t('quickLog.markAsDone') || '⚡ Mark as Done')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

