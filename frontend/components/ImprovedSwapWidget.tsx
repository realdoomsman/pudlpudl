'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import TokenSelector from './TokenSelector'
import { TokenInfo, formatTokenAmount } from '../lib/tokenMetadata'
import { usePopularTokens } from '../lib/hooks/useTokenMetadata'
import { getSwapQuote } from '../lib/jupiter'
import { getAllTokenBalances } from '../lib/solana'

export default function ImprovedSwapWidget() {
  const { connected, publicKey } = useWallet()
  const { tokens: popularTokens } = usePopularTokens()
  
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null)
  const [toToken, setToToken] = useState<TokenInfo | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [showSettings, setShowSettings] = useState(false)
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [quote, setQuote] = useState<any>(null)

  // Set default tokens when popular tokens load
  useEffect(() => {
    if (popularTokens.length > 0 && !fromToken && !toToken) {
      const sol = popularTokens.find(t => t.symbol === 'SOL')
      const usdc = popularTokens.find(t => t.symbol === 'USDC')
      if (sol) setFromToken(sol)
      if (usdc) setToToken(usdc)
    }
  }, [popularTokens])

  // Fetch balances when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalances()
    }
  }, [connected, publicKey])

  // Get quote when amount changes
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0 && fromToken && toToken) {
      fetchQuote()
    } else {
      setToAmount('')
      setQuote(null)
    }
  }, [fromAmount, fromToken, toToken, slippage])

  const fetchBalances = async () => {
    if (!publicKey) return
    
    try {
      const allBalances = await getAllTokenBalances(publicKey.toString())
      setBalances(allBalances)
    } catch (error) {
      console.error('Error fetching balances:', error)
    }
  }

  const fetchQuote = async () => {
    if (!fromToken || !toToken || !fromAmount) return
    
    try {
      setLoading(true)
      setError('')
      
      const quoteData = await getSwapQuote(
        fromToken.symbol,
        toToken.symbol,
        parseFloat(fromAmount),
        slippage * 100
      )
      
      if (quoteData) {
        setQuote(quoteData)
        const outAmount = parseInt(quoteData.outAmount) / Math.pow(10, toToken.decimals)
        setToAmount(outAmount.toFixed(6))
      }
    } catch (err) {
      console.error('Error fetching quote:', err)
      setError('Failed to get quote')
    } finally {
      setLoading(false)
    }
  }

  const handleMaxClick = () => {
    if (connected && fromToken && balances[fromToken.symbol]) {
      setFromAmount(balances[fromToken.symbol].toString())
    }
  }

  const handleSwap = async () => {
    if (!connected) {
      setError('Please connect your wallet')
      return
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Enter an amount')
      return
    }
    if (!quote) {
      setError('No quote available')
      return
    }
    
    // TODO: Implement actual swap transaction
    alert('Swap functionality coming soon!')
  }

  const handleFlipTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount('')
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Swap</h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-sm text-gray-400 mb-2">Slippage Tolerance</div>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0].map(value => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  slippage === value
                    ? 'bg-[#14F195] text-black'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* From Token */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">From</span>
          {connected && fromToken && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Balance: {formatTokenAmount(balances[fromToken.symbol] || 0)}
              </span>
              <button
                onClick={handleMaxClick}
                className="text-xs text-[#14F195] hover:text-[#00D97E] font-medium"
              >
                MAX
              </button>
            </div>
          )}
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              disabled={loading}
              className="flex-1 bg-transparent text-2xl font-semibold outline-none text-white placeholder-gray-600"
            />
            <TokenSelector
              selectedToken={fromToken}
              onSelect={setFromToken}
              excludeToken={toToken}
            />
          </div>
        </div>
      </div>

      {/* Flip Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleFlipTokens}
          className="bg-white/10 p-2 rounded-lg border border-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Token */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">To</span>
          {connected && toToken && (
            <span className="text-xs text-gray-500">
              Balance: {formatTokenAmount(balances[toToken.symbol] || 0)}
            </span>
          )}
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={loading ? 'Loading...' : toAmount}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-semibold outline-none text-white placeholder-gray-600"
            />
            <TokenSelector
              selectedToken={toToken}
              onSelect={setToToken}
              excludeToken={fromToken}
            />
          </div>
        </div>
      </div>

      {/* Quote Info */}
      {quote && fromToken && toToken && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10 text-sm space-y-2">
          <div className="flex justify-between text-gray-400">
            <span>Rate</span>
            <span className="text-white">
              1 {fromToken.symbol} ≈ {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(4)} {toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Price Impact</span>
            <span className={parseFloat(quote.priceImpactPct) > 0.01 ? 'text-red-400' : 'text-white'}>
              {(parseFloat(quote.priceImpactPct) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Slippage</span>
            <span className="text-white">{slippage}%</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!connected || !fromAmount || !!error || loading || !quote}
        className="w-full bg-[#14F195] text-black py-4 rounded-xl font-bold text-lg hover:bg-[#00D97E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : connected ? (error || 'Swap') : 'Connect Wallet'}
      </button>
    </div>
  )
}
