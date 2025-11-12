'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'

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
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create Pool</h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="bg-pudl-aqua/10 border border-pudl-aqua rounded-lg p-4">
            <p className="text-sm font-medium">
              💎 Bond Required: <span className="font-bold">{BOND_REQUIRED} $PUDL</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              This bond will be returned when you close the pool
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Base Token Mint</label>
            <input
              type="text"
              value={baseMint}
              onChange={(e) => setBaseMint(e.target.value)}
              placeholder="Enter token mint address"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pudl-aqua"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quote Token Mint</label>
            <select
              value={quoteMint}
              onChange={(e) => setQuoteMint(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pudl-aqua"
            >
              <option value="">Select quote token</option>
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Fee: {(feeBps / 100).toFixed(2)}%
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={feeBps}
              onChange={(e) => setFeeBps(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.05%</span>
              <span>1.00%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bin Step</label>
            <select
              value={binStep}
              onChange={(e) => setBinStep(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pudl-aqua"
            >
              <option value="1">1 (Tight)</option>
              <option value="10">10 (Normal)</option>
              <option value="25">25 (Wide)</option>
              <option value="100">100 (Very Wide)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Smaller bin step = tighter price ranges
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Initial Price</label>
            <input
              type="number"
              value={initialPrice}
              onChange={(e) => setInitialPrice(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pudl-aqua"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !connected}
            className="w-full bg-gradient-to-r from-pudl-aqua to-pudl-purple text-white py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Pool'}
          </button>
        </div>
      </div>
    </main>
  )
}
