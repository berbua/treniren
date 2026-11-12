'use client'

import { useState, useEffect } from 'react'
import { toLocalDateString } from '@/lib/date-utils'
import { Button, Input, Label, Select } from './ui'
// import { getDefaultCycleSettings } from '@/lib/cycle-utils'

interface CycleSetupFormProps {
  onComplete: (settings: { cycleLength: number; lastPeriodDate: Date; timezone: string; latePeriodNotifications?: boolean }) => void
  onCancel: () => void
}

export default function CycleSetupForm({ onComplete, onCancel }: CycleSetupFormProps) {
  const [formData, setFormData] = useState({
    cycleLength: 28,
    lastPeriodDate: '2024-01-15', // Default value, will be updated on client side
    timezone: 'UTC',
    latePeriodNotifications: true,
  })

  // Set timezone and load notification preference on client side only to avoid hydration issues
  useEffect(() => {
    const tempLatePeriodNotifications = localStorage.getItem('temp-late-period-notifications')
    const latePeriodNotifications = tempLatePeriodNotifications ? JSON.parse(tempLatePeriodNotifications) : true
    
    setFormData(prev => ({
      ...prev,
      lastPeriodDate: toLocalDateString(), // Set current date on client side
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      latePeriodNotifications,
    }))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const settings = {
      cycleLength: formData.cycleLength,
      lastPeriodDate: new Date(formData.lastPeriodDate),
      timezone: formData.timezone,
      latePeriodNotifications: formData.latePeriodNotifications,
    }
    
    onComplete(settings)
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextSteps = [
    'We\'ll calculate your current cycle phase',
    'Training recommendations will appear in your workout form',
    'You can update your cycle info anytime in settings',
    'All data is private and secure',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-uc-scrim" aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="cycle-setup-title" className="relative w-full sm:max-w-md max-h-[92dvh] flex flex-col bg-uc-elevated text-uc-text shadow-uc rounded-t-uc-sheet sm:rounded-uc-sheet pb-[env(safe-area-inset-bottom)]">
        <div aria-hidden className="sm:hidden mx-auto mt-2.5 h-[5px] w-10 rounded-uc-pill bg-uc-border" />
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 space-y-5">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-uc-primary-container text-xl">📅</span>
              <div>
                <h2 id="cycle-setup-title" className="text-[22px] leading-7 font-extrabold">
                  Set Up Cycle Tracking
                </h2>
                <p className="text-sm text-uc-text-muted">
                  Help us personalize your training recommendations
                </p>
              </div>
            </div>

            {/* Last Period Date */}
            <div>
              <Label htmlFor="cycle-last-period">When did your last period start?</Label>
              <Input
                id="cycle-last-period"
                type="date"
                value={formData.lastPeriodDate}
                onChange={(e) => handleChange('lastPeriodDate', e.target.value)}
                required
                max={typeof window !== 'undefined' ? toLocalDateString() : '2024-01-15'}
              />
              <p className="mt-1.5 text-[13px] text-uc-text-muted">
                This helps us calculate your current cycle phase
              </p>
            </div>

            {/* Cycle Length */}
            <div>
              <Label htmlFor="cycle-length">Average cycle length (days)</Label>
              <Select
                id="cycle-length"
                value={formData.cycleLength}
                onChange={(e) => handleChange('cycleLength', parseInt(e.target.value))}
              >
                {Array.from({ length: 15 }, (_, i) => 21 + i).map((days) => (
                  <option key={days} value={days}>
                    {days === 28 ? '28 days (most common)' : `${days} days`}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-[13px] text-uc-text-muted">
                Most cycles are 21-35 days long
              </p>
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="cycle-timezone">Timezone</Label>
              <Input
                id="cycle-timezone"
                type="text"
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="border-dashed text-uc-text-muted"
                readOnly
              />
              <p className="mt-1.5 text-[13px] text-uc-text-muted">
                Automatically detected from your device
              </p>
            </div>

            {/* Notification Preferences */}
            <label htmlFor="latePeriodNotifications" className="flex cursor-pointer items-start justify-between gap-3 rounded-uc-input border border-uc-border bg-uc-surface p-3">
              <span>
                <span className="block text-sm font-bold">📱 Late period reminders</span>
                <span className="mt-0.5 block text-[13px] text-uc-text-muted">
                  Get notified if your period is overdue (more than 32 days since last period)
                </span>
              </span>
              <input
                type="checkbox"
                id="latePeriodNotifications"
                checked={formData.latePeriodNotifications}
                onChange={(e) => handleChange('latePeriodNotifications', e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-uc-primary"
              />
            </label>

            {/* Info Box */}
            <div className="rounded-uc-input bg-uc-primary-container/40 p-3">
              <h3 className="mb-1.5 text-sm font-extrabold">
                What happens next?
              </h3>
              <ul className="space-y-1 text-[13px] text-uc-text-muted list-disc pl-4">
                {nextSteps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 px-5 py-3 border-t border-uc-border">
            <Button variant="ghost" size="lg" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="lg" className="flex-[1.5]">
              Complete Setup
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
