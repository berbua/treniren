'use client'

import { ReactNode, useEffect } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** Sticky footer (e.g. the full-width Save button). */
  footer?: ReactNode
  closeLabel?: string
  /** false: Esc and scrim tap don't close it (long forms); only the ✕ or a footer button do. */
  dismissible?: boolean
  className?: string
}

/** Sheet from the bottom on phones, centred card from `sm` up. Esc and scrim tap close it unless `dismissible` is false. */
export function BottomSheet({ isOpen, onClose, title, children, footer, closeLabel = 'Close', dismissible = true, className = '' }: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => dismissible && e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose, dismissible])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-uc-scrim" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full sm:max-w-lg max-h-[92dvh] flex flex-col bg-uc-elevated text-uc-text shadow-uc rounded-t-uc-sheet sm:rounded-uc-sheet pb-[env(safe-area-inset-bottom)] ${className}`}
      >
        <div aria-hidden className="sm:hidden mx-auto mt-2.5 h-[5px] w-10 rounded-uc-pill bg-uc-border" />
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-3 border-b border-uc-border">
            <h2 className="text-xl font-bold">{title}</h2>
            <SheetCloseButton onClick={onClose} label={closeLabel} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-uc-border">{footer}</div>}
      </div>
    </div>
  )
}

export function SheetCloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted hover:text-uc-text hover:bg-uc-surface transition-colors"
    >
      <svg aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" viewBox="0 0 24 24">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}
