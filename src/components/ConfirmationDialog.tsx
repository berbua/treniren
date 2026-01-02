'use client'

import { ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

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

  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: '🔴',
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: '⚠️',
    },
    info: {
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'ℹ️',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-uc-dark-bg rounded-2xl shadow-xl border border-uc-purple/20 max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start space-x-4 mb-4">
          <div className="text-3xl">{styles.icon}</div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-uc-text-light mb-2">
              {title}
            </h3>
            <div className="text-uc-text-muted">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl font-medium transition-colors bg-uc-dark-bg hover:bg-uc-black text-uc-text-light border border-uc-purple/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText || t('common.cancel') || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${styles.button} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText || t('common.confirm') || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

