'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function Home() {
  const { connected } = useWallet()
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-pudl-dark">
      {/* Minimal Nav */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-pudl-dark/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            PUDL
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/pools" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pools
            </Link>
            <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">
              Swap
            </Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">
              Stake
            </Link>
            <WalletMultiButton className="!bg-pudl-green !text-black !rounded-lg !font-semibold !text-sm !px-4 !py-2 hover:!bg-pudl-green/90 !transition-all" />
          </div>
        </div>
      </nav>

      {/* Hero Section - Minimal & Data-Focused */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="max-w-3xl">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Permissionless<br />
            Liquidity Markets
          </h1>
          <p className="text-xl text-gray-400 mb-8 leading-relaxed">
            Create and trade on concentrated liquidity pools. Powered by DLMM on Solana.
          </p>
          <div className="flex gap-4">
            <Link
              href="/swap"
              className="bg-pudl-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-pudl-green/90 transition-all"
            >
              Start Trading
            </Link>
            <Link
              href="/pools"
              className="card px-6 py-3 rounded-lg font-semibold hover:border-pudl-green/30 transition-all"
            >
              Explore Pools
            </Link>
          </div>
        </div>

        {/* Stats Grid - Clean & Professional */}
        <div className="grid grid-cols-4 gap-4 mt-20">
          {[
            { label: 'Total Value Locked', value: '$4.2M', change: '+12.3%' },
            { label: '24h Volume', value: '$1.5M', change: '+8.7%' },
            { label: 'Active Pools', value: '127', change: '+5' },
            { label: 'Total Trades', value: '45.2K', change: '+2.1K' },
          ].map((stat, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredStat(i)}
              onMouseLeave={() => setHoveredStat(null)}
              className={`card p-6 rounded-xl transition-all ${
                hoveredStat === i ? 'border-pudl-green/30' : ''
              }`}
            >
              <div className="text-sm text-gray-500 mb-2">{stat.label}</div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-pudl-green">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Features - Minimal Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <FeatureCard
            title="Concentrated Liquidity"
            description="Provide liquidity in specific price ranges for maximum capital efficiency"
            icon="📊"
          />
          <FeatureCard
            title="Low Fees"
            description="0.2% base fee with discounts for $PUDL stakers"
            icon="💰"
          />
          <FeatureCard
            title="Permissionless"
            description="Anyone can create a pool with just 1,000 $PUDL"
            icon="🔓"
          />
        </div>
      </div>

      {/* Footer - Minimal */}
      <footer className="border-t border-white/5 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            © 2024 PUDL Protocol
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
              Docs
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="card-hover p-6 rounded-xl">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}
