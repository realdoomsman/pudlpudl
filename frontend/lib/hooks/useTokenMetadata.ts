// React hook for token metadata
import { useState, useEffect } from 'react'
import { tokenMetadata, TokenInfo } from '../tokenMetadata'

export function useTokenList() {
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    try {
      setLoading(true)
      const tokenList = await tokenMetadata.fetchTokenList()
      setTokens(tokenList)
      setError(null)
    } catch (err) {
      setError('Failed to load tokens')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return { tokens, loading, error, reload: loadTokens }
}

export function useTokenInfo(address: string | null) {
  const [token, setToken] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setToken(null)
      return
    }

    loadToken()
  }, [address])

  const loadToken = async () => {
    if (!address) return

    try {
      setLoading(true)
      const tokenInfo = await tokenMetadata.getTokenInfo(address)
      setToken(tokenInfo)
    } catch (err) {
      console.error('Error loading token:', err)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  return { token, loading }
}

export function useTokenSearch(query: string, limit: number = 20) {
  const [results, setResults] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const searchTokens = async () => {
      try {
        setLoading(true)
        const tokens = await tokenMetadata.searchTokens(query, limit)
        setResults(tokens)
      } catch (err) {
        console.error('Error searching tokens:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(searchTokens, 300)
    return () => clearTimeout(timeoutId)
  }, [query, limit])

  return { results, loading }
}

export function usePopularTokens() {
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPopularTokens()
  }, [])

  const loadPopularTokens = async () => {
    try {
      setLoading(true)
      const popularTokens = await tokenMetadata.getPopularTokens()
      setTokens(popularTokens)
    } catch (err) {
      console.error('Error loading popular tokens:', err)
    } finally {
      setLoading(false)
    }
  }

  return { tokens, loading }
}
