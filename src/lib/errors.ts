// Custom error types for better error handling

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    public details?: Array<{ field: string; message: string; displayMessage?: string }>
  ) {
    // Create a user-friendly message from details if available
    const userMessage = details && details.length > 0
      ? details.length === 1
        ? details[0].displayMessage || details[0].message
        : `Please fix ${details.length} error${details.length > 1 ? 's' : ''} in the form`
      : message
    super(message, 'VALIDATION_ERROR', 400, userMessage)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401, 'Please log in to continue')
    this.name = 'AuthenticationError'
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, `${resource} not found`)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0, 'Network error. Please check your internet connection and try again.')
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

export class ServerError extends AppError {
  constructor(message: string = 'Server error occurred') {
    super(message, 'SERVER_ERROR', 500, 'Server error. Please try again in a moment.')
    this.name = 'ServerError'
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}

// Helper function to parse API error response
export function parseApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Check if it's a network error
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message)
    }
    return new ServerError(error.message)
  }

  return new ServerError('An unknown error occurred')
}

// Helper function to extract error from API response
export async function extractApiError(response: Response): Promise<AppError> {
  try {
    const data = await response.json()
    
    if (data.details && Array.isArray(data.details)) {
      // Validation error with details
      return new ValidationError(
        data.error || 'Validation failed',
        undefined,
        data.details
      )
    }

    // Map HTTP status codes to error types
    switch (response.status) {
      case 400:
        return new ValidationError(data.error || 'Invalid request')
      case 401:
        return new AuthenticationError(data.error)
      case 404:
        return new NotFoundError(data.error || 'Resource')
      case 500:
      case 502:
      case 503:
        return new ServerError(data.error || 'Server error')
      default:
        return new AppError(
          data.error || 'Request failed',
          'API_ERROR',
          response.status,
          data.error || 'An error occurred'
        )
    }
  } catch {
    // If we can't parse the error response, create a generic error based on status
    let userMessage = 'An unexpected error occurred. Please try again.'
    if (response.status === 0 || response.status >= 500) {
      userMessage = 'Server error. Please try again in a moment.'
    } else if (response.status === 401) {
      userMessage = 'Please log in to continue'
    } else if (response.status === 404) {
      userMessage = 'The requested resource was not found'
    } else if (response.status >= 400 && response.status < 500) {
      userMessage = 'Invalid request. Please check your input and try again.'
    }
    
    return new AppError(
      `HTTP ${response.status}: ${response.statusText}`,
      'HTTP_ERROR',
      response.status,
      userMessage
    )
  }
}

