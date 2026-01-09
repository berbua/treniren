// CSRF protection for Next.js API routes
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 hours in seconds

// Generate CSRF token
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

// Get or create CSRF token
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  const existingToken = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (existingToken) {
    return existingToken
  }

  const newToken = generateCsrfToken()
  cookieStore.set(CSRF_TOKEN_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY,
    path: '/',
  })

  return newToken
}

// Verify CSRF token
export async function verifyCsrfToken(request: NextRequest | Request): Promise<boolean> {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }

  // Skip CSRF check for NextAuth routes (they have their own protection)
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/auth/')) {
    return true
  }

  // Get cookie token - use NextRequest.cookies if available, otherwise parse from headers
  let cookieToken: string | undefined
  
  if (request instanceof NextRequest) {
    // NextRequest has a cookies property
    cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value
  } else {
    // Fallback for regular Request - parse from cookie header
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = decodeURIComponent(value)
      }
      return acc
    }, {} as Record<string, string>)
    cookieToken = cookies[CSRF_TOKEN_NAME]
  }

  if (!cookieToken) {
    return false
  }

  // Get token from header or body
  const headerToken = request.headers.get('x-csrf-token')
  
  // For JSON requests, we'll check the header
  if (headerToken && headerToken === cookieToken) {
    return true
  }

  // For form submissions, check the body
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      // JSON body - token should be in header
      return false
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Form data - check body
      const formData = await request.formData()
      const bodyToken = formData.get('csrf-token') as string
      return bodyToken === cookieToken
    }
  } catch {
    // If we can't parse the body, fail safe
    return false
  }

  return false
}

