'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { AuthShell, LogoTile } from '@/components/AuthLayout'
import { Button } from '@/components/ui'

export default function LogoutPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // User is still logged in, sign them out
      signOut({ 
        callbackUrl: '/auth/logout',
        redirect: false 
      }).then(() => {
        // After sign out, redirect to landing page after a short delay
        setTimeout(() => {
          router.push('/')
        }, 2000)
      })
    } else {
      // User is already logged out, redirect to landing page
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <AuthShell>
        <div role="status" className="flex flex-col items-center gap-4 pt-16 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-[15px] font-semibold text-uc-text-muted">{t('auth.signingOut') || 'Signing out...'}</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center pt-16 text-center">
        <LogoTile className="mb-5" />
        <h1 className="text-[22px] font-extrabold text-uc-text">{t('auth.loggedOut') || 'Successfully logged out'}</h1>
        <p className="mt-1.5 max-w-xs text-[15px] text-uc-text-muted">
          {t('auth.logoutMessage') || 'You have been successfully signed out of your account.'}
        </p>
        <p className="mt-1 text-[13px] font-semibold text-uc-text-muted" role="status">
          {t('auth.redirecting') || 'Redirecting you to the home page...'}
        </p>
        <Button variant="accent" size="lg" onClick={() => router.push('/')} className="mt-6">
          {t('auth.goHome') || 'Go to Home Page'}
        </Button>
      </div>
    </AuthShell>
  )
}
