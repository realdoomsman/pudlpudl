'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { PageContainer } from '@/components/PageContainer'

export default function Swap() {
  const { connected } = useWallet()
  
  const [fromToken, setFromToken] = useState('SOL')
  const [toToken, setToToken] = useState('USDC')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const mockBalances: Record<string, number> = {
    SOL: 10.5,
    USDC: 1000,
    PUDL: 5000,
    BONK: 1000000,
  }
  
  const getBalance = (token: string) => {
    if (!connected) return '0.00'
    return (mockBalances[token] || 0).toLocaleString()
  }

  const handleSwap = async () => {
    if (!connected) return

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Swap executed successfully')
      setFromAmount('')
      setToAmount('')
    } catch (error) {
      alert('Swap failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && parseFloat(value) > 0) {
      // Import at top: import { calculateSwapQuote } from '@/lib/swapCalculator'
      const quote = calculateSwapQuote(fromToken, toToken, parseFloat(value), slippage)
      setToAmount(quote.outputAmount.toFixed(6))
    } else {
      setToAmount('')
    }
  }

  const calculateSwapQuote = (from: string, to: string, amount: number, slip: number) => {
    const prices: Record<string, number> = { SOL: 100, USDC: 1, PUDL: 0.05, BONK: 0.00001 }
    const fromPrice = prices[from] || 1
    const toPrice = prices[to] || 1
    const rate = fromPrice / toPrice
    const fee = amount * 0.002
    const output = (amount - fee) * rate * (1 - slip / 100)
    return { outputAmount: output }
  }

  return (
    <PageContainer>
      <Nav />

        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black mb-3 pudl-gradient-text glow-text">Swap Tokens</h1>
            <p className="text-gray-400">Trade with concentrated liquidity</p>
          </div>

          <div className="glass rounded-3xl p-6 space-y-3 glow-box border border-white/10">
            {/* From */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-pudl-aqua/30 transition-colors">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-gray-400 font-semibold">You Pay</span>
                <span className="text-sm text-gray-400">Balance: {getBalance(fromToken)}</span>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-4xl font-black outline-none text-white placeholder:text-gray-600"
                />
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="px-5 py-3 bg-white/10 rounded-xl border border-white/20 font-bold text-white cursor-pointer hover:bg-white/20 transition-colors"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="PUDL">PUDL</option>
                </select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={() => {
                  const temp = fromToken
                  setFromToken(toToken)
                  setToToken(temp)
                }}
                className="p-3 pudl-gradient rounded-xl hover:scale-110 transition-transform glow-box shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-pudl-aqua/30 transition-colors">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-gray-400 font-semibold">You Receive</span>
                <span className="text-sm text-gray-400">Balance: {getBalance(toToken)}</span>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-4xl font-black outline-none text-white placeholder:text-gray-600"
                />
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="px-5 py-3 bg-white/10 rounded-xl border border-white/20 font-bold text-white cursor-pointer hover:bg-white/20 transition-colors"
                >
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="PUDL">PUDL</option>
                </select>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm border border-white/10">
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">Exchange Rate</span>
                <span className="font-bold">1 {fromToken} ≈ 0.99 {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">Price Impact</span>
                <span className="font-bold text-green-400">{'<'}0.01%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">Trading Fee</span>
                <span className="font-bold">0.20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold">Slippage Tolerance</span>
                <span className="font-bold">{slippage}%</span>
              </div>
            </div>

            {/* Slippage */}
            <div>
              <label className="block text-sm font-bold mb-3 text-gray-300">Slippage Tolerance</label>
              <div className="flex gap-2">
                {[0.5, 1, 2].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      slippage === value
                        ? 'pudl-gradient glow-box shadow-lg'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>

            {/* Swap button */}
            <button
              onClick={handleSwap}
              disabled={loading || !connected || !fromAmount}
              className="w-full pudl-gradient py-5 rounded-xl font-black text-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 glow-box shadow-2xl"
            >
              {loading ? 'Processing...' : connected ? 'Execute Swap' : 'Connect Wallet'}
            </button>

            {!connected && (
              <p className="text-center text-sm text-gray-400 mt-2">
                Connect your wallet to start trading
              </p>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 glass rounded-xl p-6 border border-white/10">
            <h3 className="font-bold mb-3">Trading Information</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-pudl-aqua mt-0.5">•</span>
                <span>Swaps are executed through DLMM pools with concentrated liquidity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pudl-aqua mt-0.5">•</span>
                <span>Protocol fee: 0.05% of each trade goes to $PUDL stakers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pudl-aqua mt-0.5">•</span>
                <span>Stake $PUDL to unlock lower trading fees</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </PageContainer>
  )
}
