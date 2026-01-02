'use client'

import dynamic from 'next/dynamic'
import AuthGuard from '@/components/AuthGuard'
import { useLanguage } from '@/contexts/LanguageContext'

// Lazy load StatisticsContent for better performance
const StatisticsContent = dynamic(() => import('@/components/StatisticsContent').then(mod => ({ default: mod.StatisticsContent })), {
  loading: () => <div className="text-center py-8 text-uc-text-muted">Loading statistics...</div>,
  ssr: false
})

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
