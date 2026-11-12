'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { AuthShell, LogoTile } from '@/components/AuthLayout'
import { buttonClasses } from '@/components/ui'
import { clearAccountData } from '@/lib/account-data'

export default function LogoutPage() {
  const { t } = useLanguage()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    // Still logged in: sign out here and stay on this page ("Sign in again")
    if (session) {
      // Don't leave this account's cached data behind for the next person on the device
      clearAccountData().finally(() => signOut({ redirect: false }))
    }
  }, [session, status])

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
        <Link href="/auth/signin" className={buttonClasses('accent', 'lg', 'mt-6')}>
          {t('auth.signInAgain') || 'Sign in again'}
        </Link>
      </div>
    </AuthShell>
  )
}
