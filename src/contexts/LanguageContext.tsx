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
  const [language, setLanguageState] = useState<Language>('pl') // Always start with default
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load language from localStorage on client side only
  useEffect(() => {
    console.log('Language context: Initializing client side') // Debug log
    setIsClient(true)
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      console.log('Language context: Saved language from localStorage:', savedLanguage) // Debug log
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pl')) {
        setLanguageState(savedLanguage)
        console.log('Language context: Set language to:', savedLanguage) // Debug log
      }
      setIsInitialized(true)
      console.log('Language context: Initialization complete') // Debug log
    }
  }, [])

  const setLanguage = (lang: Language) => {
    console.log('Language switcher: Setting language to', lang, 'isInitialized:', isInitialized) // Debug log
    if (!isInitialized) {
      console.log('Language switcher: Context not initialized yet, skipping language change') // Debug log
      return
    }
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
      console.log('Language switcher: Saved to localStorage', lang) // Debug log
    }
  }

  const t = (key: string): string => {
    const result = getNestedTranslation(translations[language], key)
    // Debug log for translation issues
    if (result === key && key.startsWith('strongMind.')) {
      console.log(`Translation missing for key: ${key}, language: ${language}`)
    }
    return result
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