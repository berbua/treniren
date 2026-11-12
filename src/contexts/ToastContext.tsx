'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Toast, ToastType } from '@/components/Toast'
import { ToastContainer } from '@/components/Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  /**
   * "Workout deleted · Undo" (5 s). The caller has already hidden the item; `onUndo` puts it back, `onCommit` runs
   * when the toast closes without Undo (timeout or ✕) and does the real delete. Lives here so it survives navigation.
   */
  showUndo: (message: string, handlers: { onUndo: () => void; onCommit: () => void }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const [toasts, setToasts] = useState<Toast[]>([])
  // Undo toasts still waiting: closing one without Undo commits it
  const pendingCommits = useRef(new Map<string, () => void>())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const commit = pendingCommits.current.get(id)
    if (commit) {
      pendingCommits.current.delete(id)
      commit()
    }
  }, [])

  const showUndo = useCallback(
    (message: string, { onUndo, onCommit }: { onUndo: () => void; onCommit: () => void }) => {
      const id = `${Date.now()}-${Math.random()}`
      pendingCommits.current.set(id, onCommit)
      const undo = () => {
        pendingCommits.current.delete(id)
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
        onUndo()
      }
      setToasts((prev) => [
        ...prev,
        { id, message, type: 'success', duration: 5000, action: { label: t('common.undo') || 'Undo', onClick: undo } },
      ])
    },
    [t]
  )

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
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, showUndo }}>
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

