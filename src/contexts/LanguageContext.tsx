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

// Import custom Polish translations (user-only file)
// Using static import - Next.js will bundle this at build time
// @ts-expect-error - File exists and is valid JSON, but TypeScript doesn't know about JSON imports
import plCustomTranslationsRaw from '../../messages/pl-custom.json'

// Type assertion for custom translations
const plCustomTranslations = plCustomTranslationsRaw as Record<string, unknown>

// Debug: Log if custom translations are loaded (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Custom Polish translations loaded:', Object.keys(plCustomTranslations).filter(k => !k.startsWith('_')).length, 'sections')
}

// Deep merge function to combine standard and custom translations
// Custom translations take precedence over standard ones
// Ignores keys starting with "_" (comments/documentation)
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target }
  
  for (const key in source) {
    // Skip comment/documentation keys (starting with _)
    if (key.startsWith('_')) {
      continue
    }
    
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      ) as T[Extract<keyof T, string>]
    } else if (source[key] !== undefined) {
      output[key] = source[key] as T[Extract<keyof T, string>]
    }
  }
  
  return output
}

// Merge standard Polish with custom Polish (custom takes precedence)
const mergedPolishTranslations = deepMerge(plTranslations, plCustomTranslations)

// Load translations from JSON files
const translations: Record<Language, Record<string, unknown>> = {
  en: enTranslations,
  pl: mergedPolishTranslations
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
    setIsClient(true)
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'pl')) {
        setLanguageState(savedLanguage)
      }
      setIsInitialized(true)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    if (!isInitialized) {
      return
    }
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const t = (key: string): string => {
    const result = getNestedTranslation(translations[language], key)
    // Debug log for translation issues (development only)
    if (process.env.NODE_ENV === 'development' && result === key && key.startsWith('strongMind.')) {
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