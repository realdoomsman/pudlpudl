'use client'

import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
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
            <WalletMultiButton className="!bg-pudl-green !text-black !rounded-lg !font-semibold !text-sm !px-4 !py-2" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Liquidity Pools</h1>
            <p className="text-gray-500">Provide liquidity and earn trading fees</p>
          </div>
          <Link
            href="/create"
            className="bg-pudl-green text-black px-6 py-3 rounded-lg font-semibold hover:bg-pudl-green/90 transition-all"
          >
            Create Pool
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 rounded-xl">
            <div className="text-sm text-gray-500 mb-1">Total Pools</div>
            <div className="text-2xl font-bold">{pools.length}</div>
          </div>
          <div className="card p-4 rounded-xl">
            <div className="text-sm text-gray-500 mb-1">Total TVL</div>
            <div className="text-2xl font-bold">
              ${pools.reduce((sum, p) => sum + p.tvl, 0).toLocaleString()}
            </div>
          </div>
          <div className="card p-4 rounded-xl">
            <div className="text-sm text-gray-500 mb-1">24h Volume</div>
            <div className="text-2xl font-bold">
              ${pools.reduce((sum, p) => sum + p.volume24h, 0).toLocaleString()}
            </div>
          </div>
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
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500">Pool</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-500">TVL</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-500">Volume 24h</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-500">APR</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-500">Fee</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((pool, i) => (
                  <tr
                    key={pool.address}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link href={`/pools/${pool.address}`} className="hover:text-pudl-green transition-colors">
                        <div className="font-semibold">{pool.baseMint}/{pool.quoteMint}</div>
                        <div className="text-xs text-gray-500 font-mono">{pool.address.slice(0, 8)}...</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      ${pool.tvl.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
                      ${pool.volume24h.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-pudl-green font-semibold">
                      {pool.apr.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">
                      {(pool.feeBps / 100).toFixed(2)}%
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
