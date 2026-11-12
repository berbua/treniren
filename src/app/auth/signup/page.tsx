'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { AuthAlert, AuthDivider, AuthShell, GoogleButton, PasswordRules, authLinkClass, validatePassword } from '@/components/AuthLayout'
import { Button, FieldError, Input, Label } from '@/components/ui'

export default function SignupForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      if (response.ok) {
        // Auto sign in after successful registration
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.error) {
          setError(t('auth.errors.signInAfterSignupFailed'))
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      } else {
        const data = await response.json()
        setError(data.error || t('auth.errors.createAccountFailed'))
      }
    } catch (error) {
      setError(t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      setError(t('auth.errors.googleFailed'))
      setIsLoading(false)
    }
  }

  const passwordValidation = validatePassword(formData.password)

  const passwordsMismatch = !!formData.confirmPassword && formData.password !== formData.confirmPassword

  return (
    <AuthShell
      title={t('auth.createAccount') || 'Create your account'}
      footer={
        <>
          {t('auth.haveAccount') || 'Already have an account? '}{' '}
          <Link href="/auth/signin" className={authLinkClass}>
            {t('auth.signIn') || 'Sign in'}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <div>
          <Label htmlFor="name">{t('auth.fullName') || 'Full name'}</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('auth.namePlaceholder') || 'Enter your full name'}
          />
        </div>

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
          <Label htmlFor="password">{t('auth.password') || 'Password'}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={t('auth.passwordPlaceholder') || 'Enter your password'}
          />
          {formData.password && <PasswordRules password={formData.password} />}
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t('auth.confirmPassword') || 'Confirm password'}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={passwordsMismatch}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder={t('auth.confirmPasswordPlaceholder') || 'Confirm your password'}
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
          {isLoading ? (t('auth.creatingAccount') || 'Creating account...') : (t('auth.createAccount') || 'Create account')}
        </Button>

        <AuthDivider>{t('auth.orContinueWith') || 'Or continue with'}</AuthDivider>

        <GoogleButton onClick={handleGoogleSignIn} disabled={isLoading}>
          {t('auth.signUpWithGoogle') || 'Sign up with Google'}
        </GoogleButton>
      </form>
    </AuthShell>
  )
}
