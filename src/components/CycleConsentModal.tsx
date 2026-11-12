'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button, Icon } from './ui'

interface CycleConsentModalProps {
  onAccept: (latePeriodNotifications?: boolean) => void
  onDecline: () => void
}

export default function CycleConsentModal({ onAccept, onDecline }: CycleConsentModalProps) {
  const { t } = useLanguage()
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

  const includes = [1, 2, 3, 4].map(n => t(`cycle.consent.item${n}`))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-uc-scrim" aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="cycle-consent-title" className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-uc-elevated text-uc-text shadow-uc rounded-[20px] p-6">
        <div aria-hidden className="mb-4 flex size-14 items-center justify-center rounded-uc-card bg-uc-primary-container text-uc-on-primary-container">
          <Icon name="cycle" size={28} />
        </div>
        <h2 id="cycle-consent-title" className="text-[22px] leading-7 font-extrabold">
          {t('cycle.consent.title')}
        </h2>
        <p className="mt-2 text-[15px] text-uc-text-muted">
          {t('cycle.consent.description')}
        </p>

        <ul className="mt-5 space-y-2 text-sm">
          {includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckIcon />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Notification Preferences */}
        <label htmlFor="latePeriodNotifications" className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 rounded-uc-input border border-uc-border bg-uc-surface p-3">
          <input
            type="checkbox"
            id="latePeriodNotifications"
            checked={latePeriodNotifications}
            onChange={(e) => setLatePeriodNotifications(e.target.checked)}
            className="size-5 shrink-0 accent-uc-primary"
          />
          <span className="text-sm font-bold">{t('cycle.consent.remindLate')}</span>
        </label>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" size="lg" onClick={handleDecline} className="flex-1">
            {t('cycle.consent.skip')}
          </Button>
          <Button variant="accent" size="lg" onClick={handleAccept} className="flex-[1.5]">
            {t('cycle.consent.enable')}
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
