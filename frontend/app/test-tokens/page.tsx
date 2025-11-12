'use client'

import { useEffect, useState } from 'react'
import { tokenMetadata } from '../../lib/tokenMetadata'
import Link from 'next/link'

export default function TestTokens() {
  const [status, setStatus] = useState('Loading...')
  const [tokens, setTokens] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    testTokenFetch()
  }, [])

  const testTokenFetch = async () => {
    try {
      setStatus('Fetching tokens from Jupiter...')
      const tokenList = await tokenMetadata.fetchTokenList()
      setTokens(tokenList)
      setStatus(`Success! Loaded ${tokenList.length} tokens`)
    } catch (err: any) {
      setError(err.message)
      setStatus('Failed to load tokens')
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-[#14F195] hover:underline mb-4 inline-block">
          ← Back
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Token API Test</h1>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Status</h2>
          <p className="text-gray-300">{status}</p>
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {tokens.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              First 20 Tokens
            </h2>
            <div className="space-y-2">
              {tokens.slice(0, 20).map((token) => (
                <div
                  key={token.address}
                  className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                >
                  {token.logoURI && (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div>
                    <div className="font-semibold text-white">{token.symbol}</div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">Debug Info:</h3>
          <div className="text-xs font-mono text-gray-400 space-y-1">
            <div>API Endpoint: https://token.jup.ag/strict</div>
            <div>Browser: {typeof window !== 'undefined' ? 'Client' : 'Server'}</div>
            <div>Tokens Loaded: {tokens.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
