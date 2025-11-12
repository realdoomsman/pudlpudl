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
      const poolData: Pool[] = accounts.map((account) => {
        // TODO: Deserialize the account data based on your Pool struct
        // For now, return placeholder data
        return {
          address: account.pubkey.toString(),
          baseMint: 'SOL',
          quoteMint: 'USDC',
          feeBps: 20,
          tvl: 0,
          volume24h: 0,
          apr: 0,
        }
      })

      setPools(poolData)
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
