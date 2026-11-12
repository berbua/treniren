'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui'

/** Single-column auth screen under the logged-out header: optional logo tile, title, subtitle, content, footer. */
export function AuthShell({ title, subtitle, showLogo = false, footer, children }: {
  title?: ReactNode
  subtitle?: ReactNode
  showLogo?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-[calc(100dvh-64px)] bg-uc-bg flex flex-col px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[400px] flex-1">
        {showLogo && <LogoTile className="mb-5" />}
        {title && <h1 className="text-[28px] leading-9 font-extrabold text-uc-text">{title}</h1>}
        {subtitle && <p className="mt-1.5 text-[15px] text-uc-text-muted">{subtitle}</p>}
        <div className={title || subtitle ? 'mt-6' : ''}>{children}</div>
      </div>
      {footer && <div className="mx-auto w-full max-w-[400px] mt-10 text-center text-sm text-uc-text-muted">{footer}</div>}
    </div>
  )
}

export function LogoTile({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden className={`flex size-14 items-center justify-center rounded-uc-card bg-uc-primary-container text-[28px] ${className}`}>
      🦄
    </span>
  )
}

/** Underlined primary text link (auth footers, "Back to sign in"). */
export const authLinkClass = 'font-bold text-uc-primary underline underline-offset-2 hover:no-underline'

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-uc-input border p-3 text-sm font-semibold text-uc-text ${
        tone === 'error' ? 'bg-uc-error-bg border-uc-error/40' : 'bg-uc-success-bg border-uc-success/40'
      }`}
    >
      {children}
    </div>
  )
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[13px] font-semibold text-uc-text-muted">
      <span aria-hidden className="h-px flex-1 bg-uc-border" />
      {children}
      <span aria-hidden className="h-px flex-1 bg-uc-border" />
    </div>
  )
}

export function GoogleButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Button variant="ghost" size="lg" onClick={onClick} disabled={disabled} className="w-full">
      <svg aria-hidden className="size-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {children}
    </Button>
  )
}

export const validatePassword = (password: string) => {
  const minLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    errors: {
      minLength: !minLength,
      hasUpperCase: !hasUpperCase,
      hasLowerCase: !hasLowerCase,
      hasNumber: !hasNumber,
    }
  }
}

/** Live password rules: ✓ in success when met, ○ muted when not. */
export function PasswordRules({ password }: { password: string }) {
  const { t } = useLanguage()
  const { errors } = validatePassword(password)
  const rules = [
    { failed: errors.minLength, label: t('auth.passwordRules.minLength') },
    { failed: errors.hasUpperCase, label: t('auth.passwordRules.uppercase') },
    { failed: errors.hasLowerCase, label: t('auth.passwordRules.lowercase') },
    { failed: errors.hasNumber, label: t('auth.passwordRules.number') },
  ]

  return (
    <ul aria-label={t('auth.passwordRules.title')} className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`flex items-center gap-1.5 text-[13px] font-semibold ${rule.failed ? 'text-uc-text-muted' : 'text-uc-success'}`}
        >
          <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center">{rule.failed ? '○' : '✓'}</span>
          {rule.label}
        </li>
      ))}
    </ul>
  )
}
