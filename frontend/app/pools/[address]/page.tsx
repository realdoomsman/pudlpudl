'use client'

import { use } from 'react'
import Link from 'next/link'
import WalletButton from '@/components/WalletButton'
import { usePools } from '@/lib/hooks/usePools'

export default function PoolDetail({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params)
  const { pools } = usePools()
  const pool = pools.find(p => p.address === address)

  if (!pool) {
    return (
      <div className="min-h-screen bg-pudl-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Pool Not Found</h1>
          <Link href="/pools" className="text-pudl-green hover:underline">
            Back to Pools
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pudl-dark">
      {/* Nav */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-pudl-dark/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">PUDL</Link>
          <div className="flex items-center gap-8">
            <Link href="/pools" className="text-sm text-white">Pools</Link>
            <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">Swap</Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">Stake</Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link href="/pools" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Pools
        </Link>

        {/* Pool Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {pool.baseMint}/{pool.quoteMint}
            </h1>
            <span className="text-sm text-gray-400 font-mono">{pool.address}</span>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-pudl-green text-black rounded-lg font-semibold hover:bg-pudl-green/90 transition-all">
              Add Liquidity
            </button>
            <button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-all">
              Remove Liquidity
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card p-6 rounded-xl">
            <div className="text-sm text-gray-400 mb-2">TVL</div>
            <div className="text-3xl font-bold text-white">
              ${pool.tvl.toLocaleString()}
            </div>
          </div>
          <div className="card p-6 rounded-xl">
            <div className="text-sm text-gray-400 mb-2">24h Volume</div>
            <div className="text-3xl font-bold text-white">
              ${pool.volume24h.toLocaleString()}
            </div>
          </div>
          <div className="card p-6 rounded-xl">
            <div className="text-sm text-gray-400 mb-2">APR</div>
            <div className="text-3xl font-bold text-pudl-green">
              {pool.apr.toFixed(1)}%
            </div>
          </div>
          <div className="card p-6 rounded-xl">
            <div className="text-sm text-gray-400 mb-2">Fee</div>
            <div className="text-3xl font-bold text-white">
              {(pool.feeBps / 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Pool Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Liquidity Distribution */}
          <div className="card p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Liquidity Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">{pool.baseMint}</span>
                  <span className="text-white font-semibold">
                    {(pool.tvl / 2 / 100).toFixed(2)} {pool.baseMint}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pudl-green to-pudl-green/50" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">{pool.quoteMint}</span>
                  <span className="text-white font-semibold">
                    ${(pool.tvl / 2).toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pudl-purple to-pudl-purple/50" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pool Stats */}
          <div className="card p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Pool Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">24h Fees</span>
                <span className="text-white font-semibold">
                  ${(pool.volume24h * pool.feeBps / 10000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">7d Fees</span>
                <span className="text-white font-semibold">
                  ${(pool.volume24h * 7 * pool.feeBps / 10000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Transactions</span>
                <span className="text-white font-semibold">
                  {Math.floor(pool.volume24h / 1000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unique Traders</span>
                <span className="text-white font-semibold">
                  {Math.floor(pool.volume24h / 5000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { type: 'Swap', amount: '$12,450', time: '2 min ago', user: '7xKX...gAsU' },
              { type: 'Add Liquidity', amount: '$8,200', time: '5 min ago', user: '5Q54...e4j1' },
              { type: 'Swap', amount: '$3,890', time: '8 min ago', user: 'DezX...B263' },
              { type: 'Remove Liquidity', amount: '$15,600', time: '12 min ago', user: '4k3D...kX6R' },
              { type: 'Swap', amount: '$6,720', time: '15 min ago', user: 'HZ1J...BCt3' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${activity.type === 'Swap' ? 'bg-pudl-green' : 'bg-pudl-purple'}`}></div>
                  <span className="text-sm text-white font-medium">{activity.type}</span>
                  <span className="text-sm text-gray-500 font-mono">{activity.user}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white font-semibold">{activity.amount}</div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
