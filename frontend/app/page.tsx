'use client'

import Link from 'next/link'
import { useState } from 'react'
import WalletButton from '@/components/WalletButton'
import ImprovedSwapWidget from '@/components/ImprovedSwapWidget'
import { PUDL_TOKEN_CA } from '@/lib/pudlToken'

export default function Home() {
  
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
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
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              PUDL Protocol
            </h1>
            <p className="text-base md:text-lg text-gray-400 mb-6 md:mb-8">
              Concentrated liquidity AMM on Solana
            </p>
            <div className="flex gap-3 mb-6 md:mb-8">
              <Link href="/pools" className="bg-white/5 border border-white/10 px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm md:text-base font-medium text-white hover:bg-white/10 transition-colors">
                Pools
              </Link>
              <Link href="/stake" className="bg-white/5 border border-white/10 px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm md:text-base font-medium text-white hover:bg-white/10 transition-colors">
                Stake
              </Link>
            </div>
          </div>

          <ImprovedSwapWidget />
        </div>

        <ContractAddress />

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <TechCard
            title="DLMM Architecture"
            items={[
              "Discrete liquidity bins",
              "Dynamic fee tiers",
              "Bin-based price discovery",
              "Composable liquidity positions"
            ]}
          />
          <TechCard
            title="Protocol Mechanics"
            items={[
              "1,000 PUDL bond per pool",
              "Tiered staking system (0-15 bps)",
              "Fee sharing for stakers",
              "Permissionless pool creation"
            ]}
          />
        </div>


      </div>

      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <div className="text-base font-bold text-white mb-3">PUDL</div>
              <p className="text-xs text-gray-500">Concentrated liquidity AMM</p>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-3">Protocol</div>
              <div className="space-y-2">
                <a href="/pools" className="block text-xs text-gray-500 hover:text-white transition-colors">Pools</a>
                <a href="/stake" className="block text-xs text-gray-500 hover:text-white transition-colors">Stake</a>
                <a href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">Analytics</a>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-3">Developers</div>
              <div className="space-y-2">
                <a href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">Docs</a>
                <a href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">API</a>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-3">Community</div>
              <div className="space-y-2">
                <a href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="block text-xs text-gray-500 hover:text-white transition-colors">Discord</a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 text-center md:text-left">
            <div className="text-xs text-gray-500">© 2024 PUDL Protocol</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ContractAddress() {
  const [copied, setCopied] = useState(false)

  const copyCA = () => {
    navigator.clipboard.writeText(PUDL_TOKEN_CA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 md:p-5 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white mb-2">PUDL Token</div>
          <div className="text-xs text-gray-400 mb-1">Contract Address</div>
          <code className="text-xs md:text-sm text-blue-400 break-all block">{PUDL_TOKEN_CA}</code>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyCA}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {copied ? '✓ Copied!' : 'Copy CA'}
          </button>
          <a
            href={`https://solscan.io/token/${PUDL_TOKEN_CA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-center"
          >
            View on Solscan
          </a>
        </div>
      </div>
    </div>
  )
}

function TechCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-400 flex items-start">
            <span className="text-[#14F195] mr-2">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
