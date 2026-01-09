// Hook to fetch and manage CSRF token for API requests

import { useState, useEffect, useCallback } from 'react'

let cachedToken: string | null = null
let tokenPromise: Promise<string> | null = null

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(cachedToken)
  const [isLoading, setIsLoading] = useState(!cachedToken)

  const fetchToken = useCallback(async (): Promise<string> => {
    // If we already have a cached token, return it
    if (cachedToken) {
      return cachedToken
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
