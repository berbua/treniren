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
        // Multiple errors - show all errors in a more readable format
        const errorMessages = error.details
          .slice(0, 3) // Show first 3 errors
          .map(d => d.displayMessage || d.message)
          .join('; ')
        const remaining = error.details.length - 3
        return `${t('common.errors.validationFailed') || 'Please fix the following errors'}: ${errorMessages}${remaining > 0 ? ` (and ${remaining} more)` : ''}`
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
      
      // For validation errors with details, don't override with custom message
      // Let the validation details show through
      if (appError instanceof ValidationError && appError.details && appError.details.length > 0) {
        const message = formatErrorMessage(appError)
        showError(message)
        // Log all validation errors for debugging with full details
        console.error('Validation Errors:', {
          message: appError.message,
          details: appError.details.map(d => ({
            field: d.field,
            message: d.message,
            displayMessage: d.displayMessage
          }))
        })
      } else {
      // Show user-friendly error message
      const message = customMessage || formatErrorMessage(appError)
      showError(message)
      // Log error for debugging
        console.error('API Error:', {
          name: appError.name,
          code: appError.code,
          message: appError.message,
          userMessage: appError.userMessage,
          statusCode: appError.statusCode
        })
      }
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

