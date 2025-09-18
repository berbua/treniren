'use client'

import { useState, useEffect } from 'react'
import { useCycle } from '@/contexts/CycleContext'
import CycleConsentModal from './CycleConsentModal'
import CycleSetupForm from './CycleSetupForm'

export default function CycleSetupFlow() {
  const { isCycleTrackingEnabled, setCycleSettings } = useCycle()
  const [showConsent, setShowConsent] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  // Show consent modal on first visit if cycle tracking is not enabled
  useEffect(() => {
    if (!isCycleTrackingEnabled) {
      setShowConsent(true)
    }
  }, [isCycleTrackingEnabled])

  // Only show consent if cycle tracking is not enabled
  if (isCycleTrackingEnabled) {
    return null
  }

  const handleConsentAccept = () => {
    setShowConsent(false)
    setShowSetup(true)
  }

  const handleConsentDecline = () => {
    setShowConsent(false)
    // User declined, don't show setup
  }

  const handleSetupComplete = (settings: { cycleLength: number; lastPeriodDate: Date; timezone: string }) => {
    setCycleSettings(settings)
    setShowSetup(false)
  }

  const handleSetupCancel = () => {
    setShowSetup(false)
  }

  return (
    <>
      {showConsent && (
        <CycleConsentModal
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}
      {showSetup && (
        <CycleSetupForm
          onComplete={handleSetupComplete}
          onCancel={handleSetupCancel}
        />
      )}
    </>
  )
}
