'use client'

import AuthGuard from '@/components/AuthGuard'
import { StatisticsContent } from '@/components/StatisticsContent'
import { useLanguage } from '@/contexts/LanguageContext'

export default function StatisticsPage() {
  return (
    <AuthGuard>
      <StatisticsPageContent />
    </AuthGuard>
  )
}

function StatisticsPageContent() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-uc-text-light">
            📊 {t('stats.title')}
          </h1>
          <p className="text-uc-text-muted mt-2">
            Analizuj swoje postępy treningowe i wzorce wydajności
          </p>
        </div>
        
        <StatisticsContent />
      </div>
    </div>
  )
}
