// Fetch with retry logic and exponential backoff

import { extractApiError, AppError, NetworkError, ServerError } from './errors'

interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  retryableStatuses?: number[]
  onRetry?: (attempt: number, error: AppError) => void
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> & { onRetry?: (attempt: number, error: AppError) => void } = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Too Many Requests, Server Errors
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  // Exponential backoff: initialDelay * 2^attempt
  const calculated = initialDelay * Math.pow(2, attempt)
  return Math.min(calculated, maxDelay)
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const config = { ...DEFAULT_OPTIONS, ...retryOptions }
  let lastError: AppError | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If successful or non-retryable error, return immediately
      if (response.ok || !config.retryableStatuses.includes(response.status)) {
        return response
      }

      // Extract error for retry decision
      const error = await extractApiError(response)
      lastError = error

      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw error
      }

      // Calculate delay and wait before retrying
      const delayMs = calculateDelay(attempt, config.initialDelay, config.maxDelay)
      
      if (config.onRetry) {
        config.onRetry(attempt + 1, error)
      }

      await delay(delayMs)
    } catch (error) {
      lastError = parseApiError(error)

      // If this is the last attempt, throw the error
      if (attempt === config.maxRetries) {
        throw lastError
      }

      // For network errors, always retry
      if (lastError instanceof Error && (
        error instanceof TypeError || // Network error
        error instanceof DOMException || // Abort error
        (error as any)?.message?.includes('fetch')
      )) {
        const delayMs = calculateDelay(attempt, config.initialDelay, config.maxDelay)
        
        if (config.onRetry) {
          config.onRetry(attempt + 1, lastError)
        }

        await delay(delayMs)
        continue
      }

      // For other errors, don't retry
      throw lastError
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new AppError('Request failed after retries', 'RETRY_FAILED', 500)
}

// Helper to parse errors
function parseApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message)
    }
    return new ServerError(error.message)
  }

  return new ServerError('An unknown error occurred')
}

