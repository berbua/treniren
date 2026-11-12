'use client'

import { useState } from 'react'
import { Button, Icon } from './ui'

interface CycleConsentModalProps {
  onAccept: (latePeriodNotifications?: boolean) => void
  onDecline: () => void
}

export default function CycleConsentModal({ onAccept, onDecline }: CycleConsentModalProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [latePeriodNotifications, setLatePeriodNotifications] = useState(true)

  const handleAccept = () => {
    setIsOpen(false)
    onAccept(latePeriodNotifications)
  }

  const handleDecline = () => {
    setIsOpen(false)
    onDecline()
  }

  if (!isOpen) return null

  const includes = [
    'Track your cycle phases and training recommendations',
    'See how your cycle affects your training performance',
    'Get personalized workout suggestions based on your phase',
    'All data is private and stored securely',
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-uc-scrim" aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="cycle-consent-title" className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-uc-elevated text-uc-text shadow-uc rounded-[20px] p-6">
        <div aria-hidden className="mb-4 flex size-14 items-center justify-center rounded-uc-card bg-uc-primary-container text-uc-on-primary-container">
          <Icon name="cycle" size={28} />
        </div>
        <h2 id="cycle-consent-title" className="text-[22px] leading-7 font-extrabold">
          Cycle Tracking
        </h2>
        <p className="mt-2 text-[15px] text-uc-text-muted">
          Would you like to include menstruation cycle tracking in your training diary?
        </p>

        <h3 className="mt-5 mb-2 text-sm font-extrabold">
          What this includes:
        </h3>
        <ul className="space-y-2 text-sm">
          {includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Notification Preferences */}
        <label htmlFor="latePeriodNotifications" className="mt-5 flex cursor-pointer items-start gap-3 rounded-uc-input border border-uc-border bg-uc-surface p-3">
          <input
            type="checkbox"
            id="latePeriodNotifications"
            checked={latePeriodNotifications}
            onChange={(e) => setLatePeriodNotifications(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-uc-primary"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-bold"><Icon name="bell" size={16} /> Late period reminders</span>
            <span className="mt-0.5 block text-[13px] text-uc-text-muted">
              Get notified if your period is overdue (more than 32 days since last period)
            </span>
          </span>
        </label>

        <p className="mt-4 text-[13px] text-uc-text-muted">
          <strong className="text-uc-text">Note:</strong> You can enable this feature later in your profile settings if you prefer to skip it now.
        </p>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" size="lg" onClick={handleDecline} className="flex-1">
            Skip for now
          </Button>
          <Button variant="accent" size="lg" onClick={handleAccept} className="flex-[1.5]">
            Yes, enable cycle tracking
          </Button>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden className="mt-0.5 size-4 shrink-0 text-uc-success" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="m5 12 5 5 9-10" />
    </svg>
  )
}
