'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPools()
  }, [])

  const fetchPools = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/pools')
      const data = await response.json()
      setPools(data.pools || [])
    } catch (error) {
      console.error('Error fetching pools:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Pools</h1>
          <Link
            href="/create"
            className="bg-gradient-to-r from-pudl-aqua to-pudl-purple text-white px-6 py-3 rounded-lg font-medium hover:opacity-90"
          >
            + Create Pool
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pudl-aqua"></div>
          </div>
        ) : pools.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 mb-4">No pools found</p>
            <Link
              href="/create"
              className="text-pudl-aqua hover:underline"
            >
              Create the first pool
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Pool</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">TVL</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">24h Volume</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">APR</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">Fee</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((pool) => (
                  <tr key={pool.address} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/pools/${pool.address}`} className="hover:text-pudl-aqua">
                        <div className="font-medium">{pool.base_mint.slice(0, 4)}.../{pool.quote_mint.slice(0, 4)}...</div>
                        <div className="text-xs text-gray-500">{pool.address.slice(0, 8)}...</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      ${pool.tvl_usd?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ${pool.volume_24h?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {pool.fee_apr_24h?.toFixed(2) || '0.00'}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(pool.fee_bps / 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
