'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { toLocalDateString } from '@/lib/date-utils'
import { Button, Icon, Input, Label } from './ui'

const MIN_CYCLE = 21
const MAX_CYCLE = 35

interface CycleSetupFormProps {
  onComplete: (settings: { cycleLength: number; lastPeriodDate: Date; timezone: string; latePeriodNotifications?: boolean }) => void
  onCancel: () => void
}

export default function CycleSetupForm({ onComplete, onCancel }: CycleSetupFormProps) {
  const { t } = useLanguage()
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-uc-scrim" aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="cycle-setup-title" className="relative w-full sm:max-w-md max-h-[92dvh] flex flex-col bg-uc-elevated text-uc-text shadow-uc rounded-t-uc-sheet sm:rounded-uc-sheet pb-[env(safe-area-inset-bottom)]">
        <div aria-hidden className="sm:hidden mx-auto mt-2.5 h-[5px] w-10 rounded-uc-pill bg-uc-border" />
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 space-y-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                aria-label={t('common.back')}
                className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text transition-colors hover:bg-uc-surface"
              >
                <Icon name="chevron-left" size={24} />
              </button>
              <h2 id="cycle-setup-title" className="text-[22px] leading-7 font-extrabold">
                {t('cycle.setupForm.title')}
              </h2>
            </div>

            {/* Last Period Date */}
            <div>
              <Label htmlFor="cycle-last-period">{t('cycle.setupForm.firstDay')}</Label>
              <Input
                id="cycle-last-period"
                type="date"
                value={formData.lastPeriodDate}
                onChange={(e) => handleChange('lastPeriodDate', e.target.value)}
                required
                max={typeof window !== 'undefined' ? toLocalDateString() : '2024-01-15'}
              />
            </div>

            {/* Cycle Length */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="cycle-length" className="mb-0">{t('cycle.setupForm.cycleLength')}</Label>
                <span className="text-[15px] font-extrabold text-uc-text uc-num">
                  {t('cycle.setupForm.days', { count: formData.cycleLength })}
                </span>
              </div>
              <input
                id="cycle-length"
                type="range"
                min={MIN_CYCLE}
                max={MAX_CYCLE}
                value={formData.cycleLength}
                onChange={(e) => handleChange('cycleLength', parseInt(e.target.value))}
                className="h-11 w-full cursor-pointer accent-uc-primary"
              />
              <div className="flex justify-between text-xs text-uc-text-muted uc-num">
                <span>{MIN_CYCLE}</span>
                <span>{MAX_CYCLE}</span>
              </div>
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="cycle-timezone">{t('cycle.setupForm.timezone')}</Label>
              <Input
                id="cycle-timezone"
                type="text"
                value={formData.timezone}
                className="border-dashed text-uc-text-muted"
                readOnly
              />
              <p className="mt-1.5 text-[13px] text-uc-text-muted">{t('cycle.setupForm.timezoneHint')}</p>
            </div>

            {/* Notification Preferences */}
            <label htmlFor="latePeriodNotifications" className="flex cursor-pointer items-center justify-between gap-3 rounded-uc-input border border-uc-border bg-uc-surface p-3">
              <span>
                <span className="block text-sm font-bold">{t('cycle.setupForm.lateReminders')}</span>
                <span className="mt-0.5 block text-[13px] text-uc-text-muted">{t('cycle.setupForm.lateRemindersHint')}</span>
              </span>
              <input
                type="checkbox"
                id="latePeriodNotifications"
                checked={formData.latePeriodNotifications}
                onChange={(e) => handleChange('latePeriodNotifications', e.target.checked)}
                className="size-5 shrink-0 accent-uc-primary"
              />
            </label>
          </div>

          {/* Buttons */}
          <div className="px-5 py-3 border-t border-uc-border">
            <Button type="submit" variant="accent" size="lg" className="w-full">
              {t('cycle.setupForm.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
