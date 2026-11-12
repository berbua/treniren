'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { AuthAlert, AuthDivider, AuthShell, GoogleButton, authLinkClass } from '@/components/AuthLayout'
import { Button, Input, Label } from '@/components/ui'
import { LoadingSpinner } from '@/components/LoadingSpinner'

// Error codes NextAuth puts in ?error= when it redirects here
const OAUTH_ERROR_CODES = ['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'OAuthAccountNotLinked', 'Callback', 'AccessDenied']

function LoginFormContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  // Error from a failed redirect sign-in (e.g. Google); hidden once the user tries again
  const [redirectErrorCode, setRedirectErrorCode] = useState(searchParams.get('error'))
  const redirectError = redirectErrorCode
    ? t(OAUTH_ERROR_CODES.includes(redirectErrorCode) ? 'auth.errors.googleFailed' : 'auth.errors.generic')
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setRedirectErrorCode(null)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('auth.errors.invalidCredentials'))
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError(t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    setRedirectErrorCode(null)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      setError(t('auth.errors.googleFailed'))
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      showLogo
      title={t('auth.signIn') || 'Sign in to your account'}
      footer={
        <>
          {t('auth.noAccount') || "Don't have an account? "}{' '}
          <Link href="/auth/signup" className={authLinkClass}>
            {t('auth.signUp') || 'Sign up'}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {(error || redirectError) && <AuthAlert tone="error">{error || redirectError}</AuthAlert>}

        <div>
          <Label htmlFor="email">{t('auth.email') || 'Email address'}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t('auth.emailPlaceholder') || 'Enter your email'}
          />
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <Label htmlFor="password">{t('auth.password') || 'Password'}</Label>
            <Link
              href="/auth/forgot-password"
              className="mb-0.5 inline-flex min-h-11 items-end pb-1 text-[13px] font-bold text-uc-primary hover:underline"
            >
              {t('auth.forgotPassword') || 'Forgot your password?'}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={t('auth.passwordPlaceholder') || 'Enter your password'}
          />
        </div>

        <Button type="submit" variant="accent" size="lg" isLoading={isLoading} className="w-full">
          {isLoading ? (t('auth.signingIn') || 'Signing in...') : (t('auth.signIn') || 'Sign in')}
        </Button>

        <AuthDivider>{t('auth.orContinueWith') || 'Or continue with'}</AuthDivider>

        <GoogleButton onClick={handleGoogleSignIn} disabled={isLoading}>
          {t('auth.signInWithGoogle') || 'Sign in with Google'}
        </GoogleButton>
      </form>
    </AuthShell>
  )
}

export default function LoginForm() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <LoginFormContent />
    </Suspense>
  )
}
