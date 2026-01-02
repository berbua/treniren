'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastType } from '@/components/Toast'
import { ToastContainer } from '@/components/Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000) => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    []
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration || 7000),
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, 'warning', duration),
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  )

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

