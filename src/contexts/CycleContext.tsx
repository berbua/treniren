'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CycleInfo, CycleSettings, calculateCycleInfo } from '@/lib/cycle-utils'

interface CycleContextType {
  cycleSettings: CycleSettings | null
  cycleInfo: CycleInfo | null
  isCycleTrackingEnabled: boolean
  setCycleSettings: (settings: CycleSettings) => void
  disableCycleTracking: () => void
}

const CycleContext = createContext<CycleContextType | undefined>(undefined)

export function CycleProvider({ children }: { children: React.ReactNode }) {
  const [cycleSettings, setCycleSettingsState] = useState<CycleSettings | null>(null)
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null)
  const [isCycleTrackingEnabled, setIsCycleTrackingEnabled] = useState(false)

  // Load cycle settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('cycle-settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        // Convert date string back to Date object
        settings.lastPeriodDate = new Date(settings.lastPeriodDate)
        setCycleSettingsState(settings)
        setIsCycleTrackingEnabled(true)
      } catch (error) {
        console.error('Error loading cycle settings:', error)
      }
    }
  }, [])

  // Calculate cycle info when settings change
  useEffect(() => {
    if (cycleSettings) {
      const info = calculateCycleInfo(cycleSettings)
      setCycleInfo(info)
    }
  }, [cycleSettings])

  const setCycleSettings = (settings: CycleSettings) => {
    setCycleSettingsState(settings)
    setIsCycleTrackingEnabled(true)
    // Save to localStorage
    localStorage.setItem('cycle-settings', JSON.stringify(settings))
  }

  const disableCycleTracking = () => {
    setCycleSettingsState(null)
    setCycleInfo(null)
    setIsCycleTrackingEnabled(false)
    localStorage.removeItem('cycle-settings')
  }

  return (
    <CycleContext.Provider
      value={{
        cycleSettings,
        cycleInfo,
        isCycleTrackingEnabled,
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
