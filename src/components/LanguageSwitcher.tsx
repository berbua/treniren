'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { useEffect, useState } from 'react'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before showing dynamic content
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as 'en' | 'pl'
    setLanguage(newLanguage)
  }

  // Always render the same structure, but suppress hydration warnings for dynamic content
  return (
    <div className="flex items-center space-x-1">
      <span className="text-sm text-uc-text-muted" suppressHydrationWarning>
        {mounted && language === 'en' ? '🇺🇸' : '🇵🇱'}
      </span>
      <select
        value={mounted ? language : 'pl'}
        onChange={handleLanguageChange}
        className="bg-transparent border-none text-sm text-uc-text-light focus:outline-none cursor-pointer hover:text-uc-mustard transition-colors"
        disabled={!mounted}
        suppressHydrationWarning
      >
        <option value="en">EN</option>
        <option value="pl">PL</option>
      </select>
    </div>
  )
}
