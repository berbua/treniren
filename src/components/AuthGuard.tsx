'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useLanguage } from '@/contexts/LanguageContext'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/signin' 
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (requireAuth && !session) {
      router.push(redirectTo)
      return
    }

    if (!requireAuth && session) {
      router.push('/dashboard')
      return
    }

    setIsLoading(false)
  }, [session, status, requireAuth, redirectTo, router])

  if (status === 'loading' || isLoading) {
    return <LoadingSpinner message={t('common.loading')} fullScreen />
  }

  if (requireAuth && !session) {
    return null // Will redirect
  }

  if (!requireAuth && session) {
    return null // Will redirect
  }

  return <>{children}</>
}
