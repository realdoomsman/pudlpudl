import { useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { PROGRAM_IDS } from '../config'

export interface Pool {
  address: string
  baseMint: string
  quoteMint: string
  feeBps: number
  tvl: number
  volume24h: number
  apr: number
}

export function usePools() {
  const { connection } = useConnection()
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPools()
  }, [connection])

  async function fetchPools() {
    try {
      setLoading(true)
      setError(null)

      // Fetch all pool accounts from the factory program
      const accounts = await connection.getProgramAccounts(PROGRAM_IDS.factory, {
        filters: [
          {
            dataSize: 200, // Adjust based on your Pool account size
          },
        ],
      })

      // Parse pool data from accounts
      // Using mock data for demo - replace with real deserialization when programs are deployed
      const mockPools: Pool[] = [
        {
          address: 'Pool1' + Math.random().toString(36).substring(7),
          baseMint: 'SOL',
          quoteMint: 'USDC',
          feeBps: 20,
          tvl: 1250000,
          volume24h: 450000,
          apr: 15.5,
        },
        {
          address: 'Pool2' + Math.random().toString(36).substring(7),
          baseMint: 'PUDL',
          quoteMint: 'SOL',
          feeBps: 30,
          tvl: 850000,
          volume24h: 320000,
          apr: 22.3,
        },
        {
          address: 'Pool3' + Math.random().toString(36).substring(7),
          baseMint: 'BONK',
          quoteMint: 'USDC',
          feeBps: 25,
          tvl: 2100000,
          volume24h: 780000,
          apr: 18.7,
        },
      ]

      setPools(mockPools)
    } catch (err) {
      console.error('Error fetching pools:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pools')
      setPools([])
    } finally {
      setLoading(false)
    }
  }

  return { pools, loading, error, refetch: fetchPools }
}
