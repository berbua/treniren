'use client'

import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
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

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-200'
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-200'
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200'
      case 'info':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-200'
      default:
        return 'bg-uc-dark-bg border-uc-purple/50 text-uc-text-light'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📢'
    }
  }

  return (
    <div
      className={`${getToastStyles()} border rounded-xl p-4 shadow-lg flex items-center justify-between min-w-[300px] max-w-md animate-slide-in`}
      role="alert"
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{getIcon()}</span>
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        ✕
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
    <div className="fixed top-4 right-4 z-50 space-y-2 flex flex-col items-end">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

