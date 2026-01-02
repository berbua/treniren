'use client'

import { useState, useCallback } from 'react'

interface ConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean
  onConfirm: (() => void) | null
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const showConfirmation = useCallback(
    (options: ConfirmationOptions, onConfirm: () => void) => {
      setState({
        isOpen: true,
        ...options,
        onConfirm: () => {
          setState((prev) => ({ ...prev, isOpen: false, onConfirm: null }))
          onConfirm()
        },
      })
    },
    []
  )

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, onConfirm: null }))
  }, [])

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant || 'danger',
    onConfirm: state.onConfirm || (() => {}),
    onClose: close,
    showConfirmation,
  }
}

