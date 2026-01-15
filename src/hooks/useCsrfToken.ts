// Hook to fetch and manage CSRF token for API requests

import { useState, useEffect, useCallback } from 'react'

let cachedToken: string | null = null
let tokenPromise: Promise<string> | null = null
let tokenTimestamp: number | null = null
const TOKEN_REFRESH_INTERVAL = 23 * 60 * 60 * 1000 // 23 hours (refresh before 24h expiry)

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(cachedToken)
  const [isLoading, setIsLoading] = useState(!cachedToken)

  const fetchToken = useCallback(async (force = false): Promise<string> => {
    // Check if cached token is still valid
    const isTokenExpired = tokenTimestamp && (Date.now() - tokenTimestamp > TOKEN_REFRESH_INTERVAL)
    
    // If we have a cached token and it's not expired and not forcing refresh, return it
    if (cachedToken && !isTokenExpired && !force) {
      return cachedToken
    }

    // If token is expired, clear it
    if (isTokenExpired) {
      cachedToken = null
      tokenTimestamp = null
    }

    // If there's already a fetch in progress, wait for it
    if (tokenPromise) {
      return tokenPromise
    }

    // Start fetching the token
    tokenPromise = (async () => {
      try {
        const response = await fetch('/api/csrf-token', {
          credentials: 'include',
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token')
        }
        
        const data = await response.json()
        const newToken = data.csrfToken
        
        if (newToken) {
          cachedToken = newToken
          tokenTimestamp = Date.now()
          setToken(newToken)
          setIsLoading(false)
          return newToken
        }
        
        throw new Error('No CSRF token in response')
      } catch (error) {
        console.error('Error fetching CSRF token:', error)
        setIsLoading(false)
        throw error
      } finally {
        tokenPromise = null
      }
    })()

    return tokenPromise
  }, [])

  useEffect(() => {
    if (!token) {
      fetchToken().catch(console.error)
    }
  }, [token, fetchToken])

  const getToken = useCallback(async (): Promise<string> => {
    if (cachedToken) {
      return cachedToken
    }
    return fetchToken()
  }, [fetchToken])

  return {
    token,
    isLoading,
    getToken,
    refreshToken: fetchToken,
  }
}
