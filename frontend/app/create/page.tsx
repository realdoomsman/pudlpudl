'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { PageContainer } from '@/components/PageContainer'

export default function CreatePool() {
  const { publicKey, connected } = useWallet()
  const router = useRouter()
  
  const [baseMint, setBaseMint] = useState('')
  const [quoteMint, setQuoteMint] = useState('')
  const [feeBps, setFeeBps] = useState(20) // 0.20%
  const [binStep, setBinStep] = useState(10)
  const [initialPrice, setInitialPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const BOND_REQUIRED = 1000 // $PUDL

  const handleCreate = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet')
      return
    }

    setLoading(true)
    try {
      // In production: build and send transaction
      console.log('Creating pool:', { baseMint, quoteMint, feeBps, binStep, initialPrice })
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Pool created successfully!')
      router.push('/pools')
    } catch (error) {
      console.error('Error creating pool:', error)
      alert('Failed to create pool')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <Nav />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 pudl-gradient-text glow-text">Create Pool</h1>
          <p className="text-gray-400 text-lg">Launch your own DLMM liquidity pool</p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-6 border border-white/10 glow-box">
          <div className="bg-pudl-aqua/10 border-2 border-pudl-aqua rounded-xl p-5">
            <p className="text-sm font-bold text-white">
              💎 Bond Required: <span className="pudl-gradient-text text-lg">{BOND_REQUIRED} $PUDL</span>
            </p>
            <p className="text-xs text-gray-400 mt-2 font-semibold">
              This bond will be returned when you close the pool
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-gray-300">Base Token Mint</label>
            <input
              type="text"
              value={baseMint}
              onChange={(e) => setBaseMint(e.target.value)}
              placeholder="Enter token mint address"
              className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-pudl-aqua text-white font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-gray-300">Quote Token Mint</label>
            <select
              value={quoteMint}
              onChange={(e) => setQuoteMint(e.target.value)}
              className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-pudl-aqua text-white font-semibold outline-none cursor-pointer"
            >
              <option value="" className="bg-[#0a0e27]">Select quote token</option>
              <option value="SOL" className="bg-[#0a0e27]">SOL</option>
              <option value="USDC" className="bg-[#0a0e27]">USDC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-gray-300">
              Fee: <span className="pudl-gradient-text">{(feeBps / 100).toFixed(2)}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={feeBps}
              onChange={(e) => setFeeBps(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pudl-aqua"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2 font-semibold">
              <span>0.05%</span>
              <span>1.00%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-gray-300">Bin Step</label>
            <select
              value={binStep}
              onChange={(e) => setBinStep(Number(e.target.value))}
              className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-pudl-aqua text-white font-semibold outline-none cursor-pointer"
            >
              <option value="1" className="bg-[#0a0e27]">1 (Tight)</option>
              <option value="10" className="bg-[#0a0e27]">10 (Normal)</option>
              <option value="25" className="bg-[#0a0e27]">25 (Wide)</option>
              <option value="100" className="bg-[#0a0e27]">100 (Very Wide)</option>
            </select>
            <p className="text-xs text-gray-400 mt-2 font-semibold">
              Smaller bin step = tighter price ranges
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 text-gray-300">Initial Price</label>
            <input
              type="number"
              value={initialPrice}
              onChange={(e) => setInitialPrice(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-pudl-aqua text-white font-bold text-lg outline-none"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !connected}
            className="w-full pudl-gradient py-5 rounded-xl font-black text-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 glow-box shadow-2xl"
          >
            {loading ? 'Creating Pool...' : connected ? 'Create Pool' : 'Connect Wallet'}
          </button>

          {!connected && (
            <p className="text-center text-sm text-gray-400">
              Connect your wallet to create a pool
            </p>
          )}
        </div>
      </div>

      <Footer />
    </PageContainer>
  )
}
