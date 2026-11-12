'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { AuthAlert, AuthShell } from '@/components/AuthLayout'
import { Button, Input, Label } from '@/components/ui'
import { safeNextPath } from '@/lib/site-gate'

function GateForm() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        // Full page load, so the middleware sees the new cookie
        window.location.assign(safeNextPath(searchParams.get('next')))
        return
      }
      setError(response.status === 429 ? t('gate.tooManyAttempts') : t('gate.wrongPassword'))
    } catch {
      setError(t('auth.errors.generic'))
    }
    setIsLoading(false)
  }

  return (
    <AuthShell showLogo title={t('gate.title')} subtitle={t('gate.subtitle')}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <div>
          <Label htmlFor="site-password">{t('auth.password') || 'Password'}</Label>
          <Input
            id="site-password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" variant="accent" size="lg" isLoading={isLoading} className="w-full">
          {t('gate.enter')}
        </Button>
      </form>
    </AuthShell>
  )
}

export default function GatePage() {
  return (
    <Suspense>
      <GateForm />
    </Suspense>
  )
}
