'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { toLocalDateString } from '@/lib/date-utils'
import { BottomSheet, Button, ChoiceChip, Input, Overline, SegmentedControl, Select, WorkoutTypeChip } from './ui'
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
    date: toLocalDateString(defaultDate ?? new Date()),
    type: 'GYM',
  })

  // The modal stays mounted, so pick up the clicked day each time it opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, date: toLocalDateString(defaultDate ?? new Date()) }))
    }
  }, [isOpen, defaultDate])
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
    { value: 'BOULDERING', label: t('workoutTypes.bouldering') || 'Bouldering', emoji: '🧗' },
    { value: 'LEAD_ARTIFICIAL', label: t('workoutTypes.leadArtificial') || 'Lead Artificial', emoji: '🧗‍♂️' },
    { value: 'LEAD_ROCK', label: t('workoutTypes.leadRock') || 'Lead Rock', emoji: '🧗‍♀️' },
    { value: 'CIRCUITS', label: t('workoutTypes.circuits') || 'Circuits', emoji: '🔄' },
    { value: 'GYM', label: t('workoutTypes.gym') || 'Gym', emoji: '🏋️' },
    { value: 'FINGERBOARD', label: t('workoutTypes.fingerboard') || 'Fingerboard', emoji: '🖐️' },
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

  const typeOptional = (key: string, fallback: string) =>
    `${t(key) || fallback} (${t('common.optional') || 'Optional'})`

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t('common.close') || 'Close'}
      title={t('quickLog.title') || '⚡ Quick Log'}
      footer={
        <Button type="submit" form="quick-log-form" variant="accent" size="lg" isLoading={isSubmitting} className="w-full">
          {isSubmitting
            ? (t('quickLog.saving') || 'Saving...')
            : (t('quickLog.markAsDone') || '⚡ Mark as Done')}
        </Button>
      }
    >
      <form id="quick-log-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-uc-text-muted">
          {t('quickLog.description') || 'Quickly log a workout. You can add details later.'}
        </p>

        {/* Date */}
        <div>
          <Overline as="label" htmlFor="quick-log-date" className="block mb-2">
            {t('workouts.labels.date') || 'Date'} *
          </Overline>
          <Input
            id="quick-log-date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        {/* Workout Type */}
        <div role="group" aria-labelledby="quick-log-type">
          <Overline id="quick-log-type" className="mb-2">
            {t('workouts.labels.type') || 'Workout Type'} *
          </Overline>
          <div className="grid grid-cols-2 gap-2">
            {workoutTypes.map(({ value, label, emoji }) => (
              <WorkoutTypeChip
                key={value}
                workoutType={value}
                selected={formData.type === value}
                icon={emoji}
                onClick={() => handleTypeChange(value)}
                className="min-h-14 justify-start text-left"
              >
                {label}
              </WorkoutTypeChip>
            ))}
          </div>
        </div>

        {/* Protocol (for Fingerboard) */}
        {formData.type === 'FINGERBOARD' && (
          <div>
            <Overline as="label" htmlFor="quick-log-protocol" className="block mb-2">
              {typeOptional('workouts.labels.protocol', 'Protocol')}
            </Overline>
            <Select
              id="quick-log-protocol"
              value={formData.protocolId || ''}
              onChange={(e) => setFormData({ ...formData, protocolId: e.target.value || undefined })}
              disabled={loadingProtocols}
            >
              <option value="">{loadingProtocols ? (t('common.loading') || 'Loading...') : (t('common.select') || 'Select')}...</option>
              {protocols.map((protocol) => (
                <option key={protocol.id} value={protocol.id}>
                  {protocol.name}
                </option>
              ))}
            </Select>
            {protocols.length === 0 && !loadingProtocols && (
              <p className="text-[13px] text-uc-text-muted mt-1.5">
                {t('quickLog.noProtocols') || 'No protocols available. Create one in Fingerboard Protocols.'}
              </p>
            )}
          </div>
        )}

        {/* Training Volume (for Fingerboard and Gym); tap the selected one again to clear it */}
        {(formData.type === 'FINGERBOARD' || formData.type === 'GYM') && (
          <div>
            <Overline className="mb-2">
              {typeOptional('workouts.labels.trainingVolume', 'Training Volume')}
            </Overline>
            <SegmentedControl
              ariaLabel={t('workouts.labels.trainingVolume') || 'Training Volume'}
              options={trainingVolumes}
              value={formData.trainingVolume ?? null}
              onChange={(value) =>
                setFormData({ ...formData, trainingVolume: formData.trainingVolume === value ? undefined : value })
              }
            />
          </div>
        )}

        {/* Mental Practice Type; tap the selected one again to clear it */}
        {formData.type === 'MENTAL_PRACTICE' && (
          <div>
            <Overline className="mb-2">
              {typeOptional('workouts.labels.mentalPracticeType', 'Practice Type')}
            </Overline>
            <SegmentedControl
              ariaLabel={t('workouts.labels.mentalPracticeType') || 'Practice Type'}
              options={mentalPracticeTypes}
              value={formData.mentalPracticeType ?? null}
              onChange={(value) =>
                setFormData({ ...formData, mentalPracticeType: formData.mentalPracticeType === value ? undefined : value })
              }
            />
          </div>
        )}

        {/* Time of Day (for Mental Practice), multi-select */}
        {formData.type === 'MENTAL_PRACTICE' && (
          <div role="group" aria-labelledby="quick-log-time">
            <Overline id="quick-log-time" className="mb-2">
              {typeOptional('workouts.labels.timeOfDay', 'Time of Day')}
            </Overline>
            <div className="grid grid-cols-3 gap-2">
              {timeOfDayOptions.map(({ value, label }) => (
                <ChoiceChip
                  key={value}
                  selected={formData.timeOfDay?.includes(value)}
                  onClick={() => handleTimeOfDayToggle(value)}
                  className="px-2"
                >
                  {label}
                </ChoiceChip>
              ))}
            </div>
          </div>
        )}
      </form>
    </BottomSheet>
  )
}
