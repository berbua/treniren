'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'en' | 'pl'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Load translations from JSON files
let translations: Record<Language, Record<string, any>> = {
  en: {},
  pl: {}
}

// Load translations dynamically
const loadTranslations = async () => {
  try {
    const [enTranslations, plTranslations] = await Promise.all([
      import('../../messages/en.json'),
      import('../../messages/pl.json')
    ])
    
    translations = {
      en: enTranslations.default,
      pl: plTranslations.default
    }
    console.log('Translations loaded:', translations)
  } catch (error) {
    console.error('Failed to load translations:', error)
  }
}

// Helper function to get nested translation
const getNestedTranslation = (obj: any, key: string): string => {
  const keys = key.split('.')
  let current = obj
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k]
    } else {
      return key // Return key if not found
    }
  }
  
  return typeof current === 'string' ? current : key
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [translationsLoaded, setTranslationsLoaded] = useState(false)

  // Load translations on mount
  useEffect(() => {
    loadTranslations().then(() => {
      setTranslationsLoaded(true)
    })
  }, [])

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pl')) {
        setLanguageState(savedLanguage)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const t = (key: string): string => {
    if (!translationsLoaded) {
      return key // Return key while loading
    }
    
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