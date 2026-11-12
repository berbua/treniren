'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { AuthAlert, AuthShell, authLinkClass } from '@/components/AuthLayout'
import { Button, Input, Label } from '@/components/ui'

export default function ForgotPasswordForm() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setMessage(t('auth.resetEmailSent'))
      } else {
        const data = await response.json()
        setError(data.error || t('auth.errors.resetEmailFailed'))
      }
    } catch (error) {
      setError(t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const backLink = (
    <Link href="/auth/signin" className={authLinkClass}>
      {t('auth.backToSignIn') || 'Back to sign in'}
    </Link>
  )

  return (
    <AuthShell
      title={t('auth.forgotPassword') || 'Forgot your password?'}
      subtitle={t('auth.forgotPasswordDescription') || 'Enter your email address and we\'ll send you a link to reset your password.'}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <div>
          <Label htmlFor="email">{t('auth.email') || 'Email address'}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder') || 'Enter your email'}
          />
        </div>

        <Button type="submit" variant="accent" size="lg" isLoading={isLoading} className="w-full">
          {isLoading ? (t('auth.sending') || 'Sending...') : (t('auth.sendResetEmail') || 'Send reset email')}
        </Button>
      </form>

      {message ? (
        <div role="status" className="mt-6 pt-6 border-t border-uc-border flex flex-col items-center text-center">
          <span aria-hidden className="mb-3 flex size-14 items-center justify-center rounded-uc-card bg-uc-success-bg text-2xl">
            ✉️
          </span>
          <p className="max-w-xs text-[15px] font-bold text-uc-text">{message}</p>
          <p className="mt-4 text-sm">{backLink}</p>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm">{backLink}</p>
      )}
    </AuthShell>
  )
}
