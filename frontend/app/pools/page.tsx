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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Liquidity Pools</h1>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">Live</span>
              </div>
            </div>
            <p className="text-gray-400">Browse active pools and provide liquidity to earn trading fees</p>
          </div>
          <Link
            href="/create"
            className="bg-pudl-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-pudl-green/90 transition-all"
          >
            Create Pool
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card p-4 rounded-xl">
            <div className="text-sm text-gray-400 mb-1">Total Pools</div>
            <div className="text-2xl font-bold text-white">{pools.length}</div>
          </div>
          <div className="card p-4 rounded-xl">
            <div className="text-sm text-gray-400 mb-1">Total TVL</div>
            <div className="text-2xl font-bold text-white">
              ${pools.reduce((sum, p) => sum + p.tvl, 0).toLocaleString()}
            </div>
          </div>
          <div className="card p-4 rounded-xl">
            <div className="text-sm text-gray-400 mb-1">24h Volume</div>
            <div className="text-2xl font-bold text-white">
              ${pools.reduce((sum, p) => sum + p.volume24h, 0).toLocaleString()}
            </div>
          </div>
          <div className="card p-4 rounded-xl">
            <div className="text-sm text-gray-400 mb-1">Avg APR</div>
            <div className="text-2xl font-bold text-pudl-green">
              {(pools.reduce((sum, p) => sum + p.apr, 0) / pools.length).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search pools..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pudl-green/50 transition-colors"
            />
          </div>
          <select className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-pudl-green/50 transition-colors">
            <option>All Pools</option>
            <option>SOL Pairs</option>
            <option>USDC Pairs</option>
            <option>PUDL Pairs</option>
          </select>
          <select className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-pudl-green/50 transition-colors">
            <option>Sort by TVL</option>
            <option>Sort by Volume</option>
            <option>Sort by APR</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card p-12 rounded-xl text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-pudl-green border-t-transparent"></div>
          </div>
        ) : (
          <div className="card rounded-xl overflow-hidden">
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
                {pools.map((pool, i) => (
                  <tr
                    key={pool.address}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/pools/${pool.address}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pudl-green to-pudl-purple flex items-center justify-center text-sm font-bold">
                            {pool.baseMint[0]}{pool.quoteMint[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-pudl-green transition-colors">
                              {pool.baseMint}/{pool.quoteMint}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">{pool.address.slice(0, 8)}...{pool.address.slice(-6)}</div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-white">${pool.tvl.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {pool.tvl > 2000000 ? 'High liquidity' : pool.tvl > 1000000 ? 'Good liquidity' : 'Low liquidity'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-white">${pool.volume24h.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {((pool.volume24h / pool.tvl) * 100).toFixed(1)}% turnover
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-pudl-green font-semibold text-lg">
                        {pool.apr.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {pool.apr > 30 ? 'High yield' : pool.apr > 20 ? 'Good yield' : 'Stable'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-gray-400">{(pool.feeBps / 100).toFixed(2)}%</div>
                      <div className="text-xs text-gray-600">fee tier</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
