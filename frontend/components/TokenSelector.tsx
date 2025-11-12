'use client'

import { useState, useEffect } from 'react'
import { TokenInfo, getTokenLogo } from '../lib/tokenMetadata'
import { useTokenSearch, usePopularTokens } from '../lib/hooks/useTokenMetadata'

interface TokenSelectorProps {
  selectedToken: TokenInfo | null
  onSelect: (token: TokenInfo) => void
  excludeToken?: TokenInfo | null
}

export default function TokenSelector({ selectedToken, onSelect, excludeToken }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { results: searchResults, loading: searchLoading } = useTokenSearch(searchQuery)
  const { tokens: popularTokens, loading: popularLoading } = usePopularTokens()

  const displayTokens = searchQuery.length >= 2 ? searchResults : popularTokens
  const filteredTokens = displayTokens.filter(
    token => token?.address && token.address !== excludeToken?.address
  )

  const isLoading = searchQuery.length >= 2 ? searchLoading : popularLoading

  return (
    <div className="relative">
      {/* Selected Token Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
      >
        {selectedToken ? (
          <>
            <img 
              src={getTokenLogo(selectedToken)} 
              alt={selectedToken.symbol}
              className="w-6 h-6 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/token-placeholder.svg'
              }}
            />
            <span className="font-semibold text-white">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-gray-400">Select token</span>
        )}
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full mt-2 left-0 w-80 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-white/10">
              <input
                type="text"
                placeholder="Search token name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 text-white px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-[#14F195] transition-colors placeholder-gray-500"
                autoFocus
              />
            </div>

            {/* Token List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-[#14F195] border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading tokens...</p>
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  {searchQuery.length >= 2 ? 'No tokens found' : 'Loading popular tokens...'}
                </div>
              ) : (
                filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => {
                      onSelect(token)
                      setIsOpen(false)
                      setSearchQuery('')
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <img 
                      src={getTokenLogo(token)} 
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = '/token-placeholder.svg'
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{token.symbol}</span>
                        {token.verified && (
                          <svg className="w-4 h-4 text-[#14F195]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{token.name}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {searchQuery.length === 0 && (
              <div className="p-2 border-t border-white/10 text-xs text-gray-500 text-center">
                Showing popular tokens
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
