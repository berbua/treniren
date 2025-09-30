'use client'

import { useState, useEffect } from 'react'
// import { getDefaultCycleSettings } from '@/lib/cycle-utils'

interface CycleSetupFormProps {
  onComplete: (settings: { cycleLength: number; lastPeriodDate: Date; timezone: string }) => void
  onCancel: () => void
}

export default function CycleSetupForm({ onComplete, onCancel }: CycleSetupFormProps) {
  const [formData, setFormData] = useState({
    cycleLength: 28,
    lastPeriodDate: typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '2024-01-15',
    timezone: 'UTC',
  })

  // Set timezone on client side only to avoid hydration issues
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const settings = {
      cycleLength: formData.cycleLength,
      lastPeriodDate: new Date(formData.lastPeriodDate),
      timezone: formData.timezone,
    }
    
    onComplete(settings)
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              Set Up Cycle Tracking
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Help us personalize your training recommendations
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Last Period Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                When did your last period start?
              </label>
              <input
                type="date"
                value={formData.lastPeriodDate}
                onChange={(e) => handleChange('lastPeriodDate', e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                required
                max={typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '2024-01-15'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This helps us calculate your current cycle phase
              </p>
            </div>

            {/* Cycle Length */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Average cycle length (days)
              </label>
              <select
                value={formData.cycleLength}
                onChange={(e) => handleChange('cycleLength', parseInt(e.target.value))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              >
                <option value={21}>21 days</option>
                <option value={22}>22 days</option>
                <option value={23}>23 days</option>
                <option value={24}>24 days</option>
                <option value={25}>25 days</option>
                <option value={26}>26 days</option>
                <option value={27}>27 days</option>
                <option value={28}>28 days (most common)</option>
                <option value={29}>29 days</option>
                <option value={30}>30 days</option>
                <option value={31}>31 days</option>
                <option value={32}>32 days</option>
                <option value={33}>33 days</option>
                <option value={34}>34 days</option>
                <option value={35}>35 days</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Most cycles are 21-35 days long
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                readOnly
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Automatically detected from your device
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• We&apos;ll calculate your current cycle phase</li>
                <li>• Training recommendations will appear in your workout form</li>
                <li>• You can update your cycle info anytime in settings</li>
                <li>• All data is private and secure</li>
              </ul>
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
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                Complete Setup
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
