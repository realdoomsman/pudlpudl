'use client'

import Link from 'next/link'
import WalletButton from '@/components/WalletButton'
import { usePools } from '@/lib/hooks/usePools'

export default function Pools() {
  const { pools, loading } = usePools()

  return (
    <div className="min-h-screen bg-pudl-dark">
      {/* Nav */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-pudl-dark/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-bold">PUDL</Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/pools" className="text-xs sm:text-sm text-white">Pools</Link>
            <Link href="/swap" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Swap</Link>
            <Link href="/stake" className="hidden sm:inline text-sm text-gray-400 hover:text-white transition-colors">Stake</Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Liquidity Pools</h1>
            <p className="text-sm sm:text-base text-gray-400">Browse active pools and provide liquidity to earn trading fees</p>
          </div>
          <Link
            href="/create"
            className="bg-pudl-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-pudl-green/90 transition-all text-center sm:whitespace-nowrap"
          >
            Create Pool
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="card p-3 sm:p-4 rounded-xl">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Pools</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{pools.length}</div>
          </div>
          <div className="card p-3 sm:p-4 rounded-xl">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Total TVL</div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              ${(pools.reduce((sum, p) => sum + p.tvl, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="card p-3 sm:p-4 rounded-xl">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">24h Volume</div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              ${(pools.reduce((sum, p) => sum + p.volume24h, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="card p-3 sm:p-4 rounded-xl">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Avg APR</div>
            <div className="text-xl sm:text-2xl font-bold text-pudl-green">
              {(pools.reduce((sum, p) => sum + p.apr, 0) / pools.length).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Pools List */}
        {loading ? (
          <div className="card p-12 rounded-xl text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-pudl-green border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block card rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Pool</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">TVL</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Volume 24h</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">APR</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool) => (
                    <tr
                      key={pool.address}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <Link href={`/pools/${pool.address}`} className="hover:text-pudl-green transition-colors">
                          <div className="font-semibold text-white">{pool.baseMint}/{pool.quoteMint}</div>
                          <div className="text-xs text-gray-500 font-mono">{pool.address.slice(0, 8)}...</div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-white">
                        ${pool.tvl.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        ${pool.volume24h.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-pudl-green font-semibold">
                        {pool.apr.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        {(pool.feeBps / 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {pools.map((pool) => (
                <Link
                  key={pool.address}
                  href={`/pools/${pool.address}`}
                  className="card p-4 rounded-xl block hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-white text-lg mb-1">
                        {pool.baseMint}/{pool.quoteMint}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {pool.address.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-pudl-green font-bold text-lg">
                        {pool.apr.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">APR</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">TVL</div>
                      <div className="text-sm font-semibold text-white">
                        ${(pool.tvl / 1000000).toFixed(2)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Volume</div>
                      <div className="text-sm text-gray-400">
                        ${(pool.volume24h / 1000).toFixed(0)}K
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Fee</div>
                      <div className="text-sm text-gray-400">
                        {(pool.feeBps / 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
