'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function Swap() {
  const { connected } = useWallet()
  const [fromToken, setFromToken] = useState('SOL')
  const [toToken, setToToken] = useState('USDC')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)

  const tokens = ['SOL', 'USDC', 'PUDL', 'BONK']

  const handleSwap = () => {
    if (!connected) {
      alert('Connect wallet first')
      return
    }
    alert('Swap executed!')
  }

  return (
    <div className="min-h-screen bg-pudl-dark">
      {/* Nav */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-pudl-dark/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">PUDL</Link>
          <div className="flex items-center gap-8">
            <Link href="/pools" className="text-sm text-gray-400 hover:text-white transition-colors">Pools</Link>
            <Link href="/swap" className="text-sm text-white">Swap</Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">Stake</Link>
            <WalletMultiButton className="!bg-pudl-green !text-black !rounded-lg !font-semibold !text-sm !px-4 !py-2" />
          </div>
        </div>
      </nav>

      {/* Swap Interface */}
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-8">Swap</h1>

        <div className="card p-4 rounded-2xl space-y-2">
          {/* From */}
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-500">You pay</span>
              <span className="text-xs text-gray-500">Balance: 10.5</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-3xl font-semibold outline-none"
              />
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-white/5 px-4 py-2 rounded-lg font-semibold cursor-pointer border border-white/10 hover:border-white/20 transition-colors"
              >
                {tokens.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={() => {
                const temp = fromToken
                setFromToken(toToken)
                setToToken(temp)
              }}
              className="bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To */}
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-500">You receive</span>
              <span className="text-xs text-gray-500">Balance: 1,000</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={toAmount}
                readOnly
                placeholder="0.00"
                className="flex-1 bg-transparent text-3xl font-semibold outline-none"
              />
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-white/5 px-4 py-2 rounded-lg font-semibold cursor-pointer border border-white/10 hover:border-white/20 transition-colors"
              >
                {tokens.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Details */}
          <div className="pt-2 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Rate</span>
              <span className="text-white">1 {fromToken} = 0.99 {toToken}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Price Impact</span>
              <span className="text-pudl-green">{'<'}0.01%</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Fee</span>
              <span className="text-white">0.2%</span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!connected || !fromAmount}
            className="w-full bg-pudl-green text-black py-4 rounded-xl font-semibold hover:bg-pudl-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {connected ? 'Swap' : 'Connect Wallet'}
          </button>
        </div>

        {/* Slippage Settings */}
        <div className="card p-4 rounded-xl mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold">Slippage Tolerance</span>
            <span className="text-sm text-gray-500">{slippage}%</span>
          </div>
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0].map(val => (
              <button
                key={val}
                onClick={() => setSlippage(val)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  slippage === val
                    ? 'bg-pudl-green text-black'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
