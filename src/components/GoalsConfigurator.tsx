'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { BottomSheet, Button, CollapsibleCard, Icon, Input, Overline, SegmentedControl, Select, workoutBg, WorkoutIcon, WorkoutTypeKey } from '@/components/ui'

type WorkoutTypeGoal = {
  type: string
  count: number
}

interface GoalsConfiguratorProps {
  onClose: () => void
  initialWeeklyGoal?: number
  initialMonthlyGoal?: number | null
  initialUseAutoMonthly?: boolean
  initialWorkoutTypeGoals?: WorkoutTypeGoal[]
  onSave: (goals: { 
    weeklyGoal: number
    monthlyGoal: number | null
    useAutoMonthly: boolean
    workoutTypeGoals: WorkoutTypeGoal[]
  }) => Promise<void>
}

const WORKOUT_TYPES = [
  { value: 'GYM', label: 'Siłownia' },
  { value: 'BOULDERING', label: 'Bouldering' },
  { value: 'CIRCUITS', label: 'Obwody' },
  { value: 'LEAD_ROCK', label: 'Prowadzenie - skała' },
  { value: 'LEAD_ARTIFICIAL', label: 'Prowadzenie - ścianka' },
  { value: 'FINGERBOARD', label: 'Chwytotablica' },
  { value: 'MENTAL_PRACTICE', label: 'Trening mentalny' },
]

export default function GoalsConfigurator({
  onClose,
  initialWeeklyGoal = 3,
  initialMonthlyGoal = null,
  initialUseAutoMonthly = true,
  initialWorkoutTypeGoals = [],
  onSave
}: GoalsConfiguratorProps) {
  const { t } = useLanguage()
  const [weeklyGoal, setWeeklyGoal] = useState(initialWeeklyGoal)
  const [useAutoMonthly, setUseAutoMonthly] = useState(initialUseAutoMonthly)
  const [monthlyGoal, setMonthlyGoal] = useState<number>(
    initialMonthlyGoal || initialWeeklyGoal * 4
  )
  const [workoutTypeGoals, setWorkoutTypeGoals] = useState<WorkoutTypeGoal[]>(initialWorkoutTypeGoals)
  const [isSaving, setIsSaving] = useState(false)
  const [showDetailedGoals, setShowDetailedGoals] = useState(initialWorkoutTypeGoals.length > 0)

  // Auto-calculate monthly goal from weekly when auto mode is enabled
  useEffect(() => {
    if (useAutoMonthly) {
      setMonthlyGoal(weeklyGoal * 4)
    }
  }, [weeklyGoal, useAutoMonthly])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        weeklyGoal,
        monthlyGoal: useAutoMonthly ? null : monthlyGoal,
        useAutoMonthly,
        workoutTypeGoals
      })
      onClose()
    } catch (error) {
      console.error('Error saving goals:', error)
      alert(t('goals.saveFailed') || 'Failed to save goals')
    } finally {
      setIsSaving(false)
    }
  }

  const addWorkoutTypeGoal = () => {
    setWorkoutTypeGoals([...workoutTypeGoals, { type: 'GYM', count: 1 }])
  }

  const removeWorkoutTypeGoal = (index: number) => {
    setWorkoutTypeGoals(workoutTypeGoals.filter((_, i) => i !== index))
  }

  const updateWorkoutTypeGoal = (index: number, field: 'type' | 'count', value: string | number) => {
    // Replace the goal rather than changing it: the objects are shared with the profile until Save
    setWorkoutTypeGoals(workoutTypeGoals.map((goal, i) =>
      i !== index ? goal : field === 'type' ? { ...goal, type: value as string } : { ...goal, count: value as number }
    ))
  }

  const calculatedMonthly = weeklyGoal * 4
  const totalTypeGoals = workoutTypeGoals.reduce((sum, goal) => sum + goal.count, 0)

  const shownMonthly = useAutoMonthly ? calculatedMonthly : monthlyGoal
  const workoutWord = (count: number) => (count === 1 ? 'trening' : count >= 5 ? 'treningów' : 'treningi')

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      dismissible={false}
      closeLabel={t('common.close')}
      title={
        <span className="flex items-center gap-2">
          <Icon name="goal" size={24} className="text-uc-primary" />
          <span>{t('goals.title') || 'Cele Treningowe'}</span>
        </span>
      }
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" onClick={onClose} disabled={isSaving}>
            {t('common.cancel') || 'Anuluj'}
          </Button>
          <Button variant="accent" size="lg" onClick={handleSave} isLoading={isSaving} className="flex-1">
            {isSaving ? (
              <span>{t('common.saving') || 'Zapisywanie'}...</span>
            ) : (
              <>
                <Icon name="success" />
                <span>{t('common.save') || 'Zapisz'}</span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-uc-text-muted">
          {t('goals.description') || 'Ustaw swoje cele tygodniowe i miesięczne'}
        </p>

        {/* Weekly Goal */}
        <div>
          <Overline as="label" htmlFor="goals-weekly" className="mb-2 block">
            {t('goals.weeklyGoal') || 'Cel tygodniowy'}
          </Overline>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
              aria-label={t('goals.weeklyGoal') || 'Cel tygodniowy'}
              className="h-11 flex-1 cursor-pointer accent-uc-primary"
            />
            <Input
              id="goals-weekly"
              type="number"
              min="1"
              max="10"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-20 shrink-0 text-center uc-num"
            />
          </div>
          <p className="mt-1.5 text-[13px] text-uc-text-muted">
            {t('goals.weeklyGoalDesc', { count: weeklyGoal })}
          </p>
        </div>

        {/* Monthly Goal: auto (weekly × 4) or manual */}
        <div>
          <Overline className="mb-2">{t('goals.monthlyGoal') || 'Cel miesięczny'}</Overline>
          <SegmentedControl
            ariaLabel={t('goals.autoCalculateMonthly') || 'Automatycznie przelicz cel miesięczny'}
            options={[
              { value: 'auto', label: t('goals.auto') || 'Auto (× 4)' },
              { value: 'manual', label: t('goals.manual') || 'Manual 1–40' },
            ]}
            value={useAutoMonthly ? 'auto' : 'manual'}
            onChange={(mode) => setUseAutoMonthly(mode === 'auto')}
          />
          {useAutoMonthly ? (
            <p className="mt-1.5 text-[13px] text-uc-text-muted">
              {t('goals.autoCalculateMonthlyDesc', { count: calculatedMonthly })}
            </p>
          ) : (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(parseInt(e.target.value))}
                  aria-label={t('goals.monthlyGoal') || 'Cel miesięczny'}
                  className="h-11 flex-1 cursor-pointer accent-uc-primary"
                />
                <Input
                  type="number"
                  min="1"
                  max="40"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))}
                  aria-label={t('goals.monthlyGoal') || 'Cel miesięczny'}
                  className="w-20 shrink-0 text-center uc-num"
                />
              </div>
              <p className="mt-1.5 text-[13px] text-uc-text-muted">
                {t('goals.monthlyGoalDesc', { count: monthlyGoal })}
              </p>
            </div>
          )}
        </div>

        {/* Workout Type Goals */}
        <CollapsibleCard
          open={showDetailedGoals}
          onToggle={() => setShowDetailedGoals(!showDetailedGoals)}
          icon={<Icon name="stats" size={22} />}
          title={t('goals.detailedGoals') || 'Cele szczegółowe (opcjonalne)'}
          description={t('goals.detailedGoalsDesc') || 'Ustaw cele dla konkretnych typów treningów'}
          summary={workoutTypeGoals.length > 0 ? workoutTypeGoals.length : undefined}
        >
          <div className="space-y-2">
            {workoutTypeGoals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2 rounded-xl border border-uc-border bg-uc-elevated p-2">
                <span
                  aria-hidden
                  className={`ml-1 size-2.5 shrink-0 rounded-full ${workoutBg[goal.type as WorkoutTypeKey] ?? 'bg-uc-text-muted'}`}
                />
                <Select
                  value={goal.type}
                  onChange={(e) => updateWorkoutTypeGoal(index, 'type', e.target.value)}
                  className="min-w-0 flex-1"
                >
                  {WORKOUT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={goal.count}
                  onChange={(e) => updateWorkoutTypeGoal(index, 'count', parseInt(e.target.value) || 1)}
                  className="w-16 shrink-0 text-center uc-num"
                />
                <span className="shrink-0 text-[13px] font-semibold text-uc-text-muted">× tydz.</span>
                <button
                  type="button"
                  onClick={() => removeWorkoutTypeGoal(index)}
                  aria-label={t('common.delete') || 'Delete'}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted hover:text-uc-error hover:bg-uc-surface transition-colors"
                >
                  <Icon name="delete" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addWorkoutTypeGoal}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-uc-border text-sm font-bold text-uc-primary hover:border-uc-primary transition-colors"
            >
              <Icon name="plus" />
              <span>{t('goals.addWorkoutType') || 'Dodaj typ treningu'}</span>
            </button>

            {workoutTypeGoals.length > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-uc-warning-bg px-3 py-2.5 text-[13px] text-uc-text">
                <Icon name="info" size={16} className="mt-px text-uc-warning" />
                <span>{t('goals.detailedGoalsHint', { total: totalTypeGoals, general: weeklyGoal })}</span>
              </p>
            )}
          </div>
        </CollapsibleCard>

        {/* Preview */}
        <div className="rounded-uc-card bg-uc-primary-container p-4 text-uc-on-primary-container">
          <Overline className="mb-2 !text-uc-on-primary-container">
            {t('goals.preview') || 'Podgląd celów:'}
          </Overline>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt>{t('goals.weekly') || 'Tygodniowy'}:</dt>
              <dd className="font-extrabold uc-num">{weeklyGoal} {workoutWord(weeklyGoal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t('goals.monthly') || 'Miesięczny'}:</dt>
              <dd className="font-extrabold uc-num">
                {shownMonthly} {workoutWord(shownMonthly)}
                {useAutoMonthly && <span className="ml-1 text-xs font-semibold">(auto)</span>}
              </dd>
            </div>
          </dl>
          {workoutTypeGoals.length > 0 && (
            <div className="mt-3 border-t border-current/20 pt-2 text-[13px]">
              <p className="mb-1 opacity-85">{t('goals.detailedBreakdown') || 'Rozkład szczegółowy'}:</p>
              {workoutTypeGoals.map((goal, index) => {
                const typeInfo = WORKOUT_TYPES.find(t => t.value === goal.type)
                return (
                  <div key={index} className="flex justify-between gap-3">
                    <span className="flex items-center gap-1.5">{typeInfo && <WorkoutIcon workoutType={typeInfo.value} size={16} />}{typeInfo?.label}:</span>
                    <span className="font-bold uc-num">{goal.count}× tydz.</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
