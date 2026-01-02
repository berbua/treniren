// Hook for handling API errors with toast notifications

import { useCallback } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { extractApiError, AppError, parseApiError, ValidationError } from '@/lib/errors'

export function useApiError() {
  const { showError, showSuccess, showWarning } = useToast()
  const { t } = useLanguage()

  const formatErrorMessage = useCallback((error: AppError): string => {
    // Use custom message if provided
    if (error.userMessage) {
      return error.userMessage
    }

    // Handle ValidationError with details
    if (error instanceof ValidationError && error.details && error.details.length > 0) {
      if (error.details.length === 1) {
        // Single error - show the specific message
        return error.details[0].displayMessage || error.details[0].message
      } else {
        // Multiple errors - show summary
        const firstError = error.details[0].displayMessage || error.details[0].message
        return `${t('common.errors.validationFailed') || 'Please check the form and fix the errors'}: ${firstError}${error.details.length > 1 ? ` (+${error.details.length - 1} more)` : ''}`
      }
    }

    // Map error types to translated messages
    switch (error.code) {
      case 'NETWORK_ERROR':
        return t('common.errors.networkError') || 'Network error. Please check your internet connection and try again.'
      case 'SERVER_ERROR':
        return t('common.errors.serverError') || 'Server error. Please try again in a moment.'
      case 'AUTHENTICATION_ERROR':
        return t('common.errors.authenticationError') || 'Please log in to continue'
      case 'NOT_FOUND_ERROR':
        return t('common.errors.notFound') || 'The requested resource was not found'
      case 'VALIDATION_ERROR':
        return t('common.errors.validationFailed') || 'Please check the form and fix the errors'
      default:
        return error.message || (t('common.errors.unknownError') || 'An unexpected error occurred. Please try again.')
    }
  }, [t])

  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      const appError = parseApiError(error)
      
      // Show user-friendly error message
      const message = customMessage || formatErrorMessage(appError)
      showError(message)
      
      // Log error for debugging
      console.error('API Error:', appError)
    },
    [showError, formatErrorMessage]
  )

  const handleApiResponse = useCallback(
    async (response: Response, successMessage?: string): Promise<boolean> => {
      if (response.ok) {
        if (successMessage) {
          showSuccess(successMessage)
        }
        return true
      }

      const error = await extractApiError(response)
      const message = formatErrorMessage(error)
      showError(message)
      console.error('API Error:', error)
      return false
    },
    [formatErrorMessage, showSuccess, showError]
  )

  return {
    handleError,
    handleApiResponse,
    showError,
    showSuccess,
    showWarning,
  }
}

