// Rate limiting for API routes
// Simple in-memory rate limiter (for single-instance deployments)

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: Request) => string // Custom key generator
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
}

export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...defaultOptions, ...options }
  const windowMs = opts.windowMs
  const maxRequests = opts.maxRequests

  return async (request: Request): Promise<{ success: boolean; remaining: number; resetTime: number }> => {
    // Generate key (default: IP address)
    const key = opts.keyGenerator 
      ? opts.keyGenerator(request)
      : request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
        request.headers.get('x-real-ip') || 
        'unknown'

    const now = Date.now()
    const record = store[key]

    // Clean up old records periodically (simple cleanup)
    if (Math.random() < 0.01) { // 1% chance to cleanup
      Object.keys(store).forEach(k => {
        if (store[k].resetTime < now) {
          delete store[k]
        }
      })
    }

    // Check if record exists and is still valid
    if (record && record.resetTime > now) {
      if (record.count >= maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetTime: record.resetTime,
        }
      }
      record.count++
      return {
        success: true,
        remaining: maxRequests - record.count,
        resetTime: record.resetTime,
      }
    }

    // Create new record
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    }

    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 requests per 15 minutes (for sensitive operations)
})

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes (for auth endpoints)
})

