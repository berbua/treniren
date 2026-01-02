// API Security middleware - combines rate limiting, CSRF, and sanitization

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimit, strictRateLimit, authRateLimit } from './rate-limit'
import { verifyCsrfToken } from './csrf'

interface SecurityOptions {
  rateLimit?: 'normal' | 'strict' | 'auth' | false
  csrf?: boolean
  requireAuth?: boolean
}

/**
 * Apply security middleware to API route
 */
export async function applySecurity(
  request: NextRequest,
  options: SecurityOptions = {}
): Promise<NextResponse | null> {
  const {
    rateLimit: rateLimitType = 'normal',
    csrf = true,
    requireAuth = true,
  } = options

  // Rate limiting
  if (rateLimitType !== false) {
    const rateLimiter = 
      rateLimitType === 'strict' ? strictRateLimit :
      rateLimitType === 'auth' ? authRateLimit :
      apiRateLimit

    const rateLimitResult = await rateLimiter(request)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }
  }

  // CSRF protection (skip for GET, HEAD, OPTIONS)
  if (csrf && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    // Skip CSRF for NextAuth routes
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/auth/')) {
      const csrfValid = await verifyCsrfToken(request)
      
      if (!csrfValid) {
        return NextResponse.json(
          { error: 'CSRF token validation failed' },
          { status: 403 }
        )
      }
    }
  }

  return null // All checks passed
}

/**
 * Helper to get CSRF token for client-side requests
 */
export async function getCsrfTokenForClient(): Promise<string> {
  const { getCsrfToken } = await import('./csrf')
  return getCsrfToken()
}

