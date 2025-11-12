'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import WalletButton from '@/components/WalletButton'

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

    // Validate inputs
    if (!baseMint || !quoteMint || !initialPrice) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      // Import SDK
      const { createPool, PROGRAM_IDS } = await import('@/lib/pudl-sdk')
      const { Connection, PublicKey } = await import('@solana/web3.js')
      
      // Check if programs are deployed
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com')
      const factoryInfo = await connection.getAccountInfo(PROGRAM_IDS.factory)
      
      if (!factoryInfo) {
        alert('⚠️ Pool creation is not yet available.\n\nThe PUDL factory program needs to be deployed first.\n\nFor now, you can:\n• Swap tokens (fully functional)\n• View your portfolio\n• Explore the interface\n\nPool creation will be enabled once the programs are deployed to mainnet.')
        setLoading(false)
        return
      }

      // Create pool transaction
      const config = {
        baseMint: new PublicKey(baseMint),
        quoteMint: new PublicKey(quoteMint === 'SOL' ? 'So11111111111111111111111111111111111111112' : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        feeBps,
        binStep,
        initialPrice: parseFloat(initialPrice)
      }

      const signature = await createPool(connection, window.solana, config)
      
      alert(`✅ Pool created successfully!\n\nTransaction: ${signature}`)
      router.push('/pools')
    } catch (error: any) {
      console.error('Error creating pool:', error)
      alert(`❌ Failed to create pool\n\n${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">PUDL</Link>
          <div className="flex items-center gap-8">
            <Link href="/pools" className="text-sm text-gray-400 hover:text-white transition-colors">Pools</Link>
            <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">Swap</Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">Stake</Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">Create Liquidity Pool</h1>
          <p className="text-gray-400">Deploy a new DLMM pool for any token pair</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <p className="text-sm font-semibold text-white">
              Bond Required: <span className="text-blue-400 text-lg font-bold">{BOND_REQUIRED} PUDL</span>
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
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">Quote Token</label>
            <select
              value={quoteMint}
              onChange={(e) => setQuoteMint(e.target.value)}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-white font-semibold outline-none cursor-pointer"
            >
              <option value="" className="bg-[#0D0D0D]">Select quote token</option>
              <option value="SOL" className="bg-[#0D0D0D]">SOL</option>
              <option value="USDC" className="bg-[#0D0D0D]">USDC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">
              Trading Fee: <span className="text-blue-400">{(feeBps / 100).toFixed(2)}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={feeBps}
              onChange={(e) => setFeeBps(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-white font-semibold outline-none cursor-pointer"
            >
              <option value="1" className="bg-[#0D0D0D]">1 basis point (Tight ranges)</option>
              <option value="10" className="bg-[#0D0D0D]">10 basis points (Normal ranges)</option>
              <option value="25" className="bg-[#0D0D0D]">25 basis points (Wide ranges)</option>
              <option value="100" className="bg-[#0D0D0D]">100 basis points (Very wide ranges)</option>
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
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 text-white font-semibold text-lg outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">
              Set the starting price for the pool in terms of quote token per base token.
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !connected}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-5 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  )
}
