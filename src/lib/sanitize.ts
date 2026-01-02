// Input sanitization utilities

/**
 * Sanitize string input - remove dangerous characters and trim
 */
export function sanitizeString(input: unknown, maxLength?: number): string {
  if (typeof input !== 'string') {
    return ''
  }

  let sanitized = input.trim()

  // Remove null bytes and other control characters (except newlines and tabs for text areas)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')

  // Remove script tags and event handlers
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')

  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitize HTML content (for rich text fields)
 */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Basic HTML sanitization - allow only safe tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  const tagPattern = new RegExp(`<(?!\/?(${allowedTags.join('|')})\b)[^>]+>`, 'gi')
  
  let sanitized = input.replace(tagPattern, '')
  
  // Remove script tags and event handlers
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')

  return sanitized
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(input: unknown): number | null {
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? null : input
  }

  if (typeof input === 'string') {
    const parsed = parseFloat(input.trim())
    return isNaN(parsed) || !isFinite(parsed) ? null : parsed
  }

  return null
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: unknown): number | null {
  if (typeof input === 'number') {
    return Number.isInteger(input) ? input : null
  }

  if (typeof input === 'string') {
    const parsed = parseInt(input.trim(), 10)
    return isNaN(parsed) ? null : parsed
  }

  return null
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  const email = input.trim().toLowerCase()
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    return ''
  }

  return email
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  const url = input.trim()
  
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

/**
 * Sanitize object - recursively sanitize all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, maxStringLength?: number): T {
  const sanitized = { ...obj } as any

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key], maxStringLength)
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, any>, maxStringLength)
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) => {
        if (typeof item === 'string') {
          return sanitizeString(item, maxStringLength)
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, any>, maxStringLength)
        }
        return item
      })
    }
  }

  return sanitized as T
}

