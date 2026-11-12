// Delete with "Undo" (decision 3): hide the item at once, delete on the server when the 5 s toast closes

import { Dispatch, SetStateAction, useCallback } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { useApiError } from '@/hooks/useApiError'
import { extractApiError } from '@/lib/errors'

interface UndoableDeleteOptions<T extends { id: string }> {
  /** e.g. `/api/workouts/123` */
  url: string
  item: T
  setItems: Dispatch<SetStateAction<T[]>>
  /** Toast text, e.g. "Workout deleted". */
  message: string
  /** -1 when hidden, +1 when put back (pagination totals). */
  onCountChange?: (delta: number) => void
  errorFallback?: string
}

export function useUndoableDelete() {
  const { showUndo } = useToast()
  const { getToken } = useCsrfToken()
  const { handleError } = useApiError()

  return useCallback(
    <T extends { id: string }>({ url, item, setItems, message, onCountChange, errorFallback = 'Failed to delete' }: UndoableDeleteOptions<T>) => {
      let index = -1
      setItems((prev) => {
        index = prev.findIndex((entry) => entry.id === item.id)
        return prev.filter((entry) => entry.id !== item.id)
      })
      onCountChange?.(-1)

      const putBack = () => {
        setItems((prev) => {
          if (prev.some((entry) => entry.id === item.id)) return prev
          const next = [...prev]
          next.splice(index < 0 ? 0 : Math.min(index, next.length), 0, item)
          return next
        })
        onCountChange?.(1)
      }

      showUndo(message, {
        onUndo: putBack,
        onCommit: async () => {
          try {
            const csrfToken = await getToken()
            const response = await fetch(url, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
              credentials: 'include',
            })
            if (!response.ok) {
              putBack()
              handleError(await extractApiError(response), errorFallback)
            }
          } catch (error) {
            putBack()
            handleError(error, errorFallback)
          }
        },
      })
    },
    [showUndo, getToken, handleError]
  )
}
