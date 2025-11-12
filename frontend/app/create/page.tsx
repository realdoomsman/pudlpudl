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
          <h1 className="text-5xl font-bold mb-4 text-white">Create Liquidity Pool</h1>
          <p className="text-gray-400 text-lg">Deploy a new DLMM pool for any token pair</p>
        </div>

        <div className="card rounded-2xl p-8 space-y-6">
          <div className="bg-pudl-green/10 border border-pudl-green rounded-xl p-5">
            <p className="text-sm font-semibold text-white">
              Bond Required: <span className="text-pudl-green text-lg font-bold">{BOND_REQUIRED} PUDL</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Fully refundable when you close the pool. Prevents spam and ensures commitment.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">Base Token Mint Address</label>
            <input
              type="text"
              value={baseMint}
              onChange={(e) => setBaseMint(e.target.value)}
              placeholder="Enter Solana token mint address"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pudl-green text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">Quote Token</label>
            <select
              value={quoteMint}
              onChange={(e) => setQuoteMint(e.target.value)}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pudl-green text-white font-semibold outline-none cursor-pointer"
            >
              <option value="" className="bg-pudl-dark">Select quote token</option>
              <option value="SOL" className="bg-pudl-dark">SOL</option>
              <option value="USDC" className="bg-pudl-dark">USDC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">
              Trading Fee: <span className="text-pudl-green">{(feeBps / 100).toFixed(2)}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={feeBps}
              onChange={(e) => setFeeBps(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pudl-green"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0.05%</span>
              <span>1.00%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">Bin Step</label>
            <select
              value={binStep}
              onChange={(e) => setBinStep(Number(e.target.value))}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pudl-green text-white font-semibold outline-none cursor-pointer"
            >
              <option value="1" className="bg-pudl-dark">1 basis point (Tight ranges)</option>
              <option value="10" className="bg-pudl-dark">10 basis points (Normal ranges)</option>
              <option value="25" className="bg-pudl-dark">25 basis points (Wide ranges)</option>
              <option value="100" className="bg-pudl-dark">100 basis points (Very wide ranges)</option>
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Smaller values create tighter price ranges for more precise liquidity.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">Initial Price</label>
            <input
              type="number"
              value={initialPrice}
              onChange={(e) => setInitialPrice(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pudl-green text-white font-semibold text-lg outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">
              Set the starting price for the pool in terms of quote token per base token.
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !connected}
            className="w-full bg-pudl-green text-black py-5 rounded-xl font-bold text-lg hover:bg-pudl-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
