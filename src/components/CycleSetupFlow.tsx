'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useCycle } from '@/contexts/CycleContext'
import CycleConsentModal from './CycleConsentModal'
import CycleSetupForm from './CycleSetupForm'

export default function CycleSetupFlow() {
  const { data: session, status } = useSession()
  const { isCycleTrackingEnabled, isLoading, setCycleSettings } = useCycle()
  const [showConsent, setShowConsent] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [hasCheckedConsent, setHasCheckedConsent] = useState(false)

  // Clean up cycle state when user logs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      setShowConsent(false)
      setShowSetup(false)
      setHasCheckedConsent(false)
    }
  }, [status])

  // Show consent modal on first visit if cycle tracking is not enabled
  useEffect(() => {
    if (!isLoading && !hasCheckedConsent) {
      // Check if user has previously declined consent (client-side only)
      const hasDeclinedConsent = localStorage.getItem('cycle-consent-declined') === 'true'
      
      // Only show consent if:
      // 1. Not loading AND
      // 2. Cycle tracking is not enabled AND
      // 3. User hasn't previously declined consent
      if (!isCycleTrackingEnabled && !hasDeclinedConsent) {
        setShowConsent(true)
      }
      setHasCheckedConsent(true)
    }
  }, [isLoading, isCycleTrackingEnabled, hasCheckedConsent])

  // Don't show any cycle modals if user is not authenticated or during logout
  if (status === 'loading' || !session?.user) {
    return null
  }

  // Show loading state while checking for existing cycle data
  if (isLoading) {
    return null
  }

  // Only show consent if cycle tracking is not enabled
  if (isCycleTrackingEnabled) {
    return null
  }

  const handleConsentAccept = (latePeriodNotifications?: boolean) => {
    setShowConsent(false)
    setShowSetup(true)
    // Store the notification preference to pass to setup form
    if (typeof window !== 'undefined') {
      localStorage.setItem('temp-late-period-notifications', JSON.stringify(latePeriodNotifications))
    }
  }

  const handleConsentDecline = () => {
    setShowConsent(false)
    // User declined, remember this choice
    if (typeof window !== 'undefined') {
      localStorage.setItem('cycle-consent-declined', 'true')
    }
  }

  const handleSetupComplete = async (settings: { cycleLength: number; lastPeriodDate: Date; timezone: string; latePeriodNotifications?: boolean }) => {
    await setCycleSettings(settings, settings.latePeriodNotifications)
    setShowSetup(false)
    // Clean up temporary storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('temp-late-period-notifications')
    }
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
