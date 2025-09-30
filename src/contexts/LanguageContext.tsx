'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'pl'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Import translations directly (more reliable than dynamic imports)
import enTranslations from '../../messages/en.json'
import plTranslations from '../../messages/pl.json'

// Load translations from JSON files
const translations: Record<Language, Record<string, unknown>> = {
  en: enTranslations,
  pl: plTranslations
}


// Helper function to get nested translation
const getNestedTranslation = (obj: unknown, key: string): string => {
  const keys = key.split('.')
  let current = obj
  
  for (const k of keys) {
    if (current && typeof current === 'object' && current !== null && k in current) {
      current = (current as Record<string, unknown>)[k]
    } else {
      return key // Return key if not found
    }
  }
  
  return typeof current === 'string' ? current : key
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize with default language to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pl')) {
        return savedLanguage
      }
    }
    return 'en'
  })

  // Load language from localStorage on mount (only for updates, not initial state)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pl') && savedLanguage !== language) {
        setLanguageState(savedLanguage)
      }
    }
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const t = (key: string): string => {
    return getNestedTranslation(translations[language], key)
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