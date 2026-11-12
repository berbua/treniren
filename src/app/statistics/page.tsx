'use client'

import dynamic from 'next/dynamic'
import AuthGuard from '@/components/AuthGuard'
import { useLanguage } from '@/contexts/LanguageContext'
import { SkeletonRows } from '@/components/ui'

// Lazy load StatisticsContent for better performance
const StatisticsContent = dynamic(() => import('@/components/StatisticsContent').then(mod => ({ default: mod.StatisticsContent })), {
  loading: () => <SkeletonRows />,
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
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        <h1 className="mb-5 text-[28px] font-extrabold leading-tight text-uc-text">
          {t('stats.title')}
        </h1>

        <StatisticsContent />
      </div>
    </div>
  )
}
