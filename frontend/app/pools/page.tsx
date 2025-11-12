'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePools } from '@/lib/hooks/usePools'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { PageContainer } from '@/components/PageContainer'

interface Pool {
  address: string
  base_mint: string
  quote_mint: string
  fee_bps: number
  tvl_usd: number
  volume_24h: number
  fee_apr_24h: number
}

export default function Pools() {
  const { pools, loading } = usePools()
  const [filter, setFilter] = useState<'all' | 'high-tvl' | 'high-apr'>('all')

  const filteredPools = pools.filter(pool => {
    if (filter === 'high-tvl') return pool.tvl_usd > 100000
    if (filter === 'high-apr') return pool.fee_apr_24h > 10
    return true
  })

  return (
    <PageContainer>
      <Nav />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 pudl-gradient-text glow-text">Liquidity Pools</h1>
          <p className="text-gray-400 text-lg">Provide liquidity and earn fees from every trade</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-6 border border-white/10">
            <p className="text-gray-400 text-sm mb-2 font-semibold">Total Pools</p>
            <p className="text-3xl font-black pudl-gradient-text">{pools.length}</p>
          </div>
          <div className="glass rounded-xl p-6 border border-white/10">
            <p className="text-gray-400 text-sm mb-2 font-semibold">Total TVL</p>
            <p className="text-3xl font-black text-white">
              ${pools.reduce((sum, p) => sum + p.tvl_usd, 0).toLocaleString()}
            </p>
          </div>
          <div className="glass rounded-xl p-6 border border-white/10">
            <p className="text-gray-400 text-sm mb-2 font-semibold">24h Volume</p>
            <p className="text-3xl font-black text-white">
              ${pools.reduce((sum, p) => sum + p.volume_24h, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters and Create Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'pudl-gradient glow-box'
                  : 'glass border border-white/10 hover:border-pudl-aqua/30'
              }`}
            >
              All Pools
            </button>
            <button
              onClick={() => setFilter('high-tvl')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'high-tvl'
                  ? 'pudl-gradient glow-box'
                  : 'glass border border-white/10 hover:border-pudl-aqua/30'
              }`}
            >
              High TVL
            </button>
            <button
              onClick={() => setFilter('high-apr')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'high-apr'
                  ? 'pudl-gradient glow-box'
                  : 'glass border border-white/10 hover:border-pudl-aqua/30'
              }`}
            >
              High APR
            </button>
          </div>
          <Link
            href="/create"
            className="pudl-gradient px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform glow-box"
          >
            + Create Pool
          </Link>
        </div>

        {/* Pools Table */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-pudl-aqua border-t-transparent"></div>
            <p className="text-gray-400 mt-4">Loading pools...</p>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <p className="text-gray-400 mb-4 text-lg">No pools found</p>
            <Link
              href="/create"
              className="text-pudl-aqua hover:underline font-semibold"
            >
              Create the first pool →
            </Link>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-white/10">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-300">Pool</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-300">TVL</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-300">24h Volume</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-300">APR</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-300">Fee</th>
                </tr>
              </thead>
              <tbody>
                {filteredPools.map((pool, index) => (
                  <tr 
                    key={pool.address} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/pools/${pool.address}`} className="hover:text-pudl-aqua transition-colors">
                        <div className="font-bold text-white">{pool.base_mint.slice(0, 4)}.../{pool.quote_mint.slice(0, 4)}...</div>
                        <div className="text-xs text-gray-500 font-mono">{pool.address.slice(0, 8)}...</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      ${pool.tvl_usd?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-300">
                      ${pool.volume_24h?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 text-right text-green-400 font-bold">
                      {pool.fee_apr_24h?.toFixed(2) || '0.00'}%
                    </td>
                    <td className="px-6 py-4 text-right text-gray-300 font-semibold">
                      {(pool.fee_bps / 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </PageContainer>
  )
}
