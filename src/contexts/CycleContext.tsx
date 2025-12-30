'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { CycleInfo, CycleSettings, calculateCycleInfo } from '@/lib/cycle-utils'

interface CycleContextType {
  cycleSettings: CycleSettings | null
  cycleInfo: CycleInfo | null
  isCycleTrackingEnabled: boolean
  isLoading: boolean
  setCycleSettings: (settings: CycleSettings, latePeriodNotifications?: boolean) => Promise<void>
  disableCycleTracking: () => Promise<void>
}

const CycleContext = createContext<CycleContextType | undefined>(undefined)

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [cycleSettings, setCycleSettingsState] = useState<CycleSettings | null>(null)
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null)
  const [isCycleTrackingEnabled, setIsCycleTrackingEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load cycle settings from database on mount - only if user is authenticated
  useEffect(() => {
    const loadCycleSettings = async () => {
      // Don't load cycle settings if user is not authenticated
      if (status === 'loading') return
      if (!session?.user) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user-profile', { credentials: 'include' })
        if (response.ok) {
          const profile = await response.json()
          if (profile && profile.lastPeriodDate) {
            const settings = {
              cycleLength: profile.cycleAvgLengthDays || 28,
              lastPeriodDate: new Date(profile.lastPeriodDate),
              timezone: profile.timezone || 'Europe/Warsaw'
            }
            setCycleSettingsState(settings)
            setIsCycleTrackingEnabled(true)
          }
        } else if (response.status === 401) {
          // User is not authenticated, this is expected for non-logged users
        }
      } catch (error) {
        console.error('Error loading cycle settings:', error)
        // Fallback to localStorage for backward compatibility (client-side only)
        try {
          const savedSettings = localStorage.getItem('cycle-settings')
          if (savedSettings) {
            const settings = JSON.parse(savedSettings)
            settings.lastPeriodDate = new Date(settings.lastPeriodDate)
            setCycleSettingsState(settings)
            setIsCycleTrackingEnabled(true)
          }
        } catch (localStorageError) {
          console.error('Error loading cycle settings from localStorage:', localStorageError)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCycleSettings()
  }, [session, status])

  // Calculate cycle info when settings change
  useEffect(() => {
    if (cycleSettings) {
      const info = calculateCycleInfo(cycleSettings)
      setCycleInfo(info)
    }
  }, [cycleSettings])

  const setCycleSettings = async (settings: CycleSettings, latePeriodNotifications?: boolean) => {
    setCycleSettingsState(settings)
    setIsCycleTrackingEnabled(true)
    
    // Save to database
    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleAvgLengthDays: settings.cycleLength,
          lastPeriodDate: settings.lastPeriodDate.toISOString(),
          timezone: settings.timezone,
          latePeriodNotificationsEnabled: latePeriodNotifications
        })
      })
    } catch (error) {
      console.error('Error saving cycle settings to database:', error)
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cycle-settings', JSON.stringify({ ...settings, latePeriodNotifications }))
      }
    }
  }

  const disableCycleTracking = async () => {
    setCycleSettingsState(null)
    setCycleInfo(null)
    setIsCycleTrackingEnabled(false)
    
    // Remove from database
    try {
      await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cycleAvgLengthDays: 28,
          lastPeriodDate: null,
          timezone: 'Europe/Warsaw'
        })
      })
    } catch (error) {
      console.error('Error removing cycle settings from database:', error)
    }
    
    // Also remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cycle-settings')
    }
  }

  return (
    <CycleContext.Provider
      value={{
        cycleSettings,
        cycleInfo,
        isCycleTrackingEnabled,
        isLoading,
        setCycleSettings,
        disableCycleTracking,
      }}
    >
      {children}
    </CycleContext.Provider>
  )
}

export function useCycle() {
  const context = useContext(CycleContext)
  if (context === undefined) {
    throw new Error('useCycle must be used within a CycleProvider')
  }
  return context
}
