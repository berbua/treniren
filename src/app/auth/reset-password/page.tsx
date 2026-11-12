'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { AuthAlert, AuthShell, PasswordRules, authLinkClass, validatePassword } from '@/components/AuthLayout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Button, FieldError, Icon, Input, Label, buttonClasses } from '@/components/ui'

function ResetPasswordFormContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setError(t('auth.invalidLinkMessage'))
    }
  }, [token, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    if (!token) {
      setError(t('auth.errors.invalidToken'))
      setIsLoading(false)
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.passwordsMismatch'))
      setIsLoading(false)
      return
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(t('auth.errors.passwordWeak'))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      if (response.ok) {
        setMessage(t('auth.resetSuccess'))
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || t('auth.errors.resetFailed'))
      }
    } catch (error) {
      setError(t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const passwordValidation = validatePassword(formData.password)

  const passwordsMismatch = !!formData.confirmPassword && formData.password !== formData.confirmPassword

  if (!token) {
    return (
      <AuthShell>
        <div role="alert" className="flex flex-col items-center pt-10 text-center">
          <span aria-hidden className="mb-4 flex size-14 items-center justify-center rounded-uc-card bg-uc-error-bg text-uc-error">
            <Icon name="link-expired" size={28} />
          </span>
          <h1 className="text-xl font-extrabold text-uc-text">{t('auth.invalidLinkTitle')}</h1>
          <p className="mt-1.5 max-w-xs text-sm text-uc-text-muted">{t('auth.invalidLinkMessage')}</p>
          <Link href="/auth/forgot-password" className={buttonClasses('primary', 'md', 'mt-5')}>
            {t('auth.requestNewLink')}
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth.resetPassword') || 'Reset your password'}
      subtitle={t('auth.resetPasswordDescription') || 'Enter your new password below.'}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <AuthAlert tone="error">{error}</AuthAlert>}
        {message && <AuthAlert tone="success">{message}</AuthAlert>}

        <div>
          <Label htmlFor="password">{t('auth.newPassword') || 'New password'}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={t('auth.passwordPlaceholder') || 'Enter your new password'}
          />
          {formData.password && <PasswordRules password={formData.password} />}
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t('auth.confirmPassword') || 'Confirm new password'}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={passwordsMismatch}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder={t('auth.confirmPasswordPlaceholder') || 'Confirm your new password'}
          />
          {passwordsMismatch && <FieldError>{t('auth.errors.passwordsMismatch')}</FieldError>}
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          isLoading={isLoading}
          disabled={!passwordValidation.isValid || formData.password !== formData.confirmPassword}
          className="w-full"
        >
          {isLoading ? (t('auth.resetting') || 'Resetting...') : (t('auth.resetPassword') || 'Reset password')}
        </Button>

        <p className="pt-2 text-center text-sm">
          <Link href="/auth/signin" className={authLinkClass}>
            {t('auth.backToSignIn') || 'Back to sign in'}
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <ResetPasswordFormContent />
    </Suspense>
  )
}
