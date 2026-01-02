import { useState, useEffect, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

// Simple in-memory cache
const cache = new Map<string, CacheEntry<unknown>>()

export function useFetchCache<T>(
  url: string | null,
  options: RequestInit & CacheOptions = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const { ttl = DEFAULT_TTL, ...fetchOptions } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = async (forceRefresh = false) => {
    if (!url) {
      setData(null)
      return
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = cache.get(url)
      if (cached && Date.now() < cached.expiresAt) {
        setData(cached.data as T)
        setLoading(false)
        setError(null)
        return
      }
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Cache the result
      cache.set(url, {
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      })

      setData(result as T)
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
        setData(null)
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  useEffect(() => {
    fetchData()

    return () => {
      // Cleanup: abort request if component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [url])

  const refetch = async () => {
    await fetchData(true)
  }

  return { data, loading, error, refetch }
}

// Utility function to clear cache
export function clearCache(url?: string) {
  if (url) {
    cache.delete(url)
  } else {
    cache.clear()
  }
}

// Utility function to invalidate cache entries matching a pattern
export function invalidateCache(pattern: string | RegExp) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key)
    }
  }
}


