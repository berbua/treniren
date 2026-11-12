'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button, ButtonVariant } from '@/components/ui'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmationDialogProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  const variantStyles: Record<NonNullable<ConfirmationDialogProps['variant']>, { button: ButtonVariant; icon: string }> = {
    danger: { button: 'destructive', icon: '🔴' },
    warning: { button: 'accent', icon: '⚠️' },
    info: { button: 'primary', icon: 'ℹ️' },
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-uc-scrim" onClick={isLoading ? undefined : onClose} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative bg-uc-elevated text-uc-text rounded-[20px] shadow-uc border border-uc-border max-w-md w-full p-5"
      >
        <div className="flex items-start gap-3 mb-4">
          <div aria-hidden className="text-2xl leading-none pt-0.5">{styles.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <div className="text-sm text-uc-text-muted">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText || t('common.cancel') || 'Cancel'}
          </Button>
          <Button variant={styles.button} onClick={onConfirm} isLoading={isLoading}>
            {confirmText || t('common.confirm') || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}

