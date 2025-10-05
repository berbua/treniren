'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            {t('auth.signingOut') || 'Signing out...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6 p-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-uc-success/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {t('auth.loggedOut') || 'Successfully logged out'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {t('auth.logoutMessage') || 'You have been successfully signed out of your account.'}
          </p>
        </div>

        {/* Redirect Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t('auth.redirecting') || 'Redirecting you to the home page...'}
          </p>
        </div>

        {/* Manual Redirect Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {t('auth.goHome') || 'Go to Home Page'}
        </button>
      </div>
    </div>
  )
}
