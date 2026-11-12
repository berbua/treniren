'use client'

import { useEffect } from 'react'
import { Icon, IconName } from '@/components/ui'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  /** Text button before the ✕ (e.g. "Undo"). */
  action?: { label: string; onClick: () => void }
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onClose])

  // Inverted card; the type shows as a coloured bar on the left
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-uc-success'
      case 'error':
        return 'border-l-uc-error'
      case 'warning':
        return 'border-l-uc-warning'
      case 'info':
        return 'border-l-uc-primary'
      default:
        return 'border-l-uc-text'
    }
  }

  const getIcon = (): IconName => {
    switch (toast.type) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'info'
    }
  }

  return (
    <div
      className={`${getToastStyles()} bg-uc-text text-uc-bg border-l-4 rounded-uc-card pl-4 pr-1 py-1 shadow-uc flex items-center justify-between gap-2 w-[min(28rem,calc(100vw-2rem))] animate-slide-in`}
      role="alert"
    >
      <div className="flex items-center gap-3 py-2 min-w-0">
        <Icon name={getIcon()} />
        <p className="text-sm font-bold">{toast.message}</p>
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="shrink-0 min-h-11 px-3 rounded-uc-input text-sm font-extrabold text-uc-accent hover:underline"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => onClose(toast.id)}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <svg aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 flex flex-col items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

