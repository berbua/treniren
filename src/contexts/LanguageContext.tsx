'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'pl'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Simple translation function - in a real app you'd use a proper i18n library
const translations: Record<Language, Record<string, any>> = {
  en: {
    "app.name": "Treniren",
    "app.description": "Your personal training diary for tracking workouts, climbing sessions, and performance patterns",
    "training.types.gym": "Gym",
    "training.types.bouldering": "Bouldering",
    "training.types.circuits": "Circuits",
    "training.types.leadRock": "Lead Rock",
    "training.types.leadArtificial": "Lead Wall",
    "training.descriptions.gym": "Strength training",
    "training.descriptions.bouldering": "Power & technique",
    "training.descriptions.circuits": "Endurance training",
    "training.descriptions.leadRock": "Outdoor climbing",
    "training.descriptions.leadArtificial": "Indoor climbing",
    "features.calendarSync": "Calendar Sync",
    "features.calendarSyncDesc": "Sync your workouts with Google Calendar automatically",
    "features.pwaReady": "PWA Ready",
    "features.pwaReadyDesc": "Install on your iPhone and use offline",
    "features.trackProgress": "Track Progress",
    "features.trackProgressDesc": "Monitor intensity, mood, and performance patterns",
    "workouts.title": "Manage Workouts",
    "calendar.title": "Training Calendar",
    "calendar.loading": "Loading calendar...",
    "calendar.legend": "Legend",
    "calendar.cyclePhases": "Cycle Phases",
    "calendar.noWorkoutsToday": "No workouts today",
    "common.week": "Week",
    "common.month": "Month",
    "common.today": "Today",
    "common.previous": "Previous",
    "common.next": "Next",
    "milestones.m3Complete": "Milestone 3 Complete!",
    "milestones.m3Desc": "Weekly/monthly calendar view with training type colors and cycle indicators is now available!"
  },
  pl: {
    "app.name": "Treniren",
    "app.description": "Osobisty dziennik treningowy do śledzenia treningów, sesji wspinaczkowych i wzorców wydajności",
    "training.types.gym": "Siłka",
    "training.types.bouldering": "Bulderki",
    "training.types.circuits": "Obwody",
    "training.types.leadRock": "Skałki",
    "training.types.leadArtificial": "Lina - ścianka",
    "training.descriptions.gym": "Trening siłowy",
    "training.descriptions.bouldering": "Moc i technika",
    "training.descriptions.circuits": "Trening wytrzymałościowy",
    "training.descriptions.leadRock": "Wspinaczka w skałkach",
    "training.descriptions.leadArtificial": "Wspinaczka na ściance",
    "features.calendarSync": "Synchronizacja Kalendarza",
    "features.calendarSyncDesc": "Automatycznie synchronizuj treningi z Google Calendar",
    "features.pwaReady": "Gotowe na PWA",
    "features.pwaReadyDesc": "Zainstaluj na iPhone i używaj offline",
    "features.trackProgress": "Śledź Postęp",
    "features.trackProgressDesc": "Monitoruj intensywność, nastrój i wzorce wydajności",
    "workouts.title": "Zarządzaj Treningami",
    "calendar.title": "Kalendarz Treningowy",
    "calendar.loading": "Ładowanie kalendarza...",
    "calendar.legend": "Legenda",
    "calendar.cyclePhases": "Fazy Cyklu",
    "calendar.noWorkoutsToday": "Brak treningów dzisiaj",
    "common.week": "Tydzień",
    "common.month": "Miesiąc",
    "common.today": "Dzisiaj",
    "common.previous": "Poprzedni",
    "common.next": "Następny",
    "milestones.m3Complete": "Etap 3 Ukończony!",
    "milestones.m3Desc": "Widok kalendarza tygodniowy/miesięczny z kolorami typów treningów i wskaźnikami cyklu jest już dostępny!"
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Load saved language preference after hydration
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pl')) {
      setLanguageState(savedLanguage)
    }
    setIsHydrated(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    // During SSR and before hydration, always use English to prevent hydration mismatch
    if (!isHydrated) {
      return translations.en[key] || key
    }
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
