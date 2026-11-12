'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button, ButtonVariant, Icon, IconName } from '@/components/ui'

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
  /** Which button is filled. 'cancel' when going back is the safer choice (e.g. "Go back & fill"). */
  emphasis?: 'confirm' | 'cancel'
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
  emphasis = 'confirm',
}: ConfirmationDialogProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  const variantStyles: Record<NonNullable<ConfirmationDialogProps['variant']>, { button: ButtonVariant; icon: IconName; tile: string }> = {
    danger: { button: 'destructive', icon: 'delete', tile: 'bg-uc-error-bg text-uc-error' },
    warning: { button: 'accent', icon: 'warning', tile: 'bg-uc-warning-bg text-uc-warning' },
    info: { button: 'primary', icon: 'info', tile: 'bg-uc-primary-container text-uc-on-primary-container' },
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
        <div aria-hidden className={`mb-3 flex size-12 items-center justify-center rounded-uc-input ${styles.tile}`}>
          <Icon name={styles.icon} size={24} />
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="text-sm text-uc-text-muted">
          {typeof message === 'string' ? <p>{message}</p> : message}
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          <Button
            variant={emphasis === 'cancel' ? 'primary' : 'ghost'}
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 basis-36"
          >
            {cancelText || t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            variant={emphasis === 'cancel' ? 'ghost' : styles.button}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 basis-36"
          >
            {confirmText || t('common.confirm') || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}

