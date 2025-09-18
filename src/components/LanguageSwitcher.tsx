'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {language === 'en' ? '🇺🇸' : '🇵🇱'}
      </span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'pl')}
        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm text-slate-700 dark:text-slate-300"
      >
        <option value="en">English</option>
        <option value="pl">Polski</option>
      </select>
    </div>
  )
}
