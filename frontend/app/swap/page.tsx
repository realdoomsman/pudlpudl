'use client'

import Link from 'next/link'
import WalletButton from '@/components/WalletButton'
import ImprovedSwapWidget from '@/components/ImprovedSwapWidget'

export default function Swap() {
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
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Swap Interface */}
      <div className="max-w-lg mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2 text-white">Swap Tokens</h1>
        <p className="text-gray-400 mb-8">Trade tokens instantly with real-time quotes from Jupiter</p>

        <ImprovedSwapWidget />
      </div>
    </div>
  )
}
