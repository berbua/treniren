'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

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
  { value: 'GYM', label: 'Siłownia', emoji: '🏋️' },
  { value: 'BOULDERING', label: 'Bouldering', emoji: '🧗' },
  { value: 'CIRCUITS', label: 'Obwody', emoji: '🔄' },
  { value: 'LEAD_ROCK', label: 'Prowadzenie - skała', emoji: '🏔️' },
  { value: 'LEAD_ARTIFICIAL', label: 'Prowadzenie - ścianka', emoji: '🧗‍♀️' },
  { value: 'FINGERBOARD', label: 'Chwytotablica', emoji: '🤏' },
  { value: 'MENTAL_PRACTICE', label: 'Trening mentalny', emoji: '🧘' },
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
    const updated = [...workoutTypeGoals]
    if (field === 'type') {
      updated[index].type = value as string
    } else {
      updated[index].count = value as number
    }
    setWorkoutTypeGoals(updated)
  }

  const calculatedMonthly = weeklyGoal * 4
  const totalTypeGoals = workoutTypeGoals.reduce((sum, goal) => sum + goal.count, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-uc-dark-bg rounded-2xl shadow-xl w-full max-w-2xl border border-uc-purple/20 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-uc-purple/20">
          <h2 className="text-2xl font-bold text-uc-text-light flex items-center space-x-2">
            <span>🎯</span>
            <span>{t('goals.title') || 'Cele Treningowe'}</span>
          </h2>
          <p className="text-sm text-uc-text-muted mt-1">
            {t('goals.description') || 'Ustaw swoje cele tygodniowe i miesięczne'}
          </p>
        </div>

        {/* Body - Scrollable */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Weekly Goal */}
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('goals.weeklyGoal') || 'Cel tygodniowy'}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="10"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
                className="flex-1 h-2 bg-uc-black rounded-lg appearance-none cursor-pointer accent-uc-mustard"
              />
              <div className="w-20 text-center">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                  className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-center focus:outline-none focus:border-uc-mustard"
                />
              </div>
            </div>
            <p className="text-xs text-uc-text-muted mt-2">
              {t('goals.weeklyGoalDesc', { count: weeklyGoal })}
            </p>
          </div>

          {/* Monthly Goal Mode Toggle */}
          <div className="bg-uc-black/50 rounded-xl p-4 border border-uc-purple/20">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useAutoMonthly}
                onChange={(e) => setUseAutoMonthly(e.target.checked)}
                className="mt-1 w-5 h-5 text-uc-mustard bg-uc-black border-uc-purple/30 rounded focus:ring-uc-mustard focus:ring-2"
              />
              <div className="flex-1">
                <div className="font-medium text-uc-text-light">
                  {t('goals.autoCalculateMonthly') || 'Automatycznie przelicz cel miesięczny'}
                </div>
                <div className="text-xs text-uc-text-muted mt-1">
                  {t('goals.autoCalculateMonthlyDesc', { count: calculatedMonthly })}
                </div>
              </div>
            </label>
          </div>

          {/* Manual Monthly Goal */}
          {!useAutoMonthly && (
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('goals.monthlyGoal') || 'Cel miesięczny'}
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-uc-black rounded-lg appearance-none cursor-pointer accent-uc-purple"
                />
                <div className="w-20 text-center">
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))}
                    className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-center focus:outline-none focus:border-uc-purple"
                  />
                </div>
              </div>
              <p className="text-xs text-uc-text-muted mt-2">
                {t('goals.monthlyGoalDesc', { count: monthlyGoal })}
              </p>
            </div>
          )}

          {/* Detailed Goals Toggle */}
          <div className="border-t border-uc-purple/20 pt-6">
            <button
              onClick={() => setShowDetailedGoals(!showDetailedGoals)}
              className="w-full flex items-center justify-between p-4 bg-uc-black/50 hover:bg-uc-black rounded-xl border border-uc-purple/20 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div className="text-left">
                  <div className="font-medium text-uc-text-light">
                    {t('goals.detailedGoals') || 'Cele szczegółowe (opcjonalne)'}
                  </div>
                  <div className="text-xs text-uc-text-muted">
                    {t('goals.detailedGoalsDesc') || 'Ustaw cele dla konkretnych typów treningów'}
                  </div>
                </div>
              </div>
              <span className={`text-uc-text-muted transition-transform ${showDetailedGoals ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>

          {/* Workout Type Goals */}
          {showDetailedGoals && (
            <div className="space-y-3">
              {workoutTypeGoals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                  <select
                    value={goal.type}
                    onChange={(e) => updateWorkoutTypeGoal(index, 'type', e.target.value)}
                    className="flex-1 bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light focus:outline-none focus:border-uc-mustard"
                  >
                    {WORKOUT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={goal.count}
                    onChange={(e) => updateWorkoutTypeGoal(index, 'count', parseInt(e.target.value) || 1)}
                    className="w-20 bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-center focus:outline-none focus:border-uc-mustard"
                  />
                  <span className="text-sm text-uc-text-muted whitespace-nowrap">× tydz.</span>
                  <button
                    onClick={() => removeWorkoutTypeGoal(index)}
                    className="text-uc-alert hover:text-red-400 transition-colors px-2"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              
              <button
                onClick={addWorkoutTypeGoal}
                className="w-full py-3 border-2 border-dashed border-uc-purple/30 hover:border-uc-purple/50 rounded-xl text-uc-text-muted hover:text-uc-text-light transition-colors flex items-center justify-center space-x-2"
              >
                <span className="text-xl">➕</span>
                <span className="font-medium">{t('goals.addWorkoutType') || 'Dodaj typ treningu'}</span>
              </button>

              {workoutTypeGoals.length > 0 && (
                <div className="text-xs text-uc-text-muted mt-2 p-3 bg-uc-mustard/10 rounded-lg border border-uc-mustard/20">
                  💡 {t('goals.detailedGoalsHint', { total: totalTypeGoals, general: weeklyGoal })}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="bg-gradient-to-r from-uc-mustard/10 to-uc-purple/10 rounded-xl p-4 border border-uc-mustard/20">
            <div className="text-sm font-medium text-uc-text-light mb-2">
              {t('goals.preview') || 'Podgląd celów:'}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-uc-text-muted">
                <span>{t('goals.weekly') || 'Tygodniowy'}:</span>
                <span className="font-bold text-uc-mustard">
                  {weeklyGoal} {weeklyGoal === 1 ? 'trening' : weeklyGoal >= 5 ? 'treningów' : 'treningi'}
                </span>
              </div>
              <div className="flex justify-between text-uc-text-muted">
                <span>{t('goals.monthly') || 'Miesięczny'}:</span>
                <span className="font-bold text-uc-purple">
                  {useAutoMonthly ? calculatedMonthly : monthlyGoal} {(useAutoMonthly ? calculatedMonthly : monthlyGoal) === 1 ? 'trening' : (useAutoMonthly ? calculatedMonthly : monthlyGoal) >= 5 ? 'treningów' : 'treningi'}
                  {useAutoMonthly && <span className="text-xs ml-1">(auto)</span>}
                </span>
              </div>
              {workoutTypeGoals.length > 0 && (
                <div className="border-t border-uc-purple/20 pt-2 mt-2">
                  <div className="text-xs text-uc-text-muted mb-1">{t('goals.detailedBreakdown') || 'Rozkład szczegółowy'}:</div>
                  {workoutTypeGoals.map((goal, index) => {
                    const typeInfo = WORKOUT_TYPES.find(t => t.value === goal.type)
                    return (
                      <div key={index} className="flex justify-between text-xs text-uc-text-muted">
                        <span>{typeInfo?.emoji} {typeInfo?.label}:</span>
                        <span className="font-medium">{goal.count}× tydz.</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-uc-purple/20 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-uc-text-muted hover:text-uc-text-light transition-colors bg-uc-black/50 hover:bg-uc-black rounded-xl border border-uc-purple/20 disabled:opacity-50"
          >
            {t('common.cancel') || 'Anuluj'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 shadow-lg font-medium"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-uc-black"></div>
                <span>{t('common.saving') || 'Zapisywanie'}...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>{t('common.save') || 'Zapisz'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
