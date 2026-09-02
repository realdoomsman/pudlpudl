// The rivers: live memecoin liquidity pools, ranked by TOTAL yield per $1k
// parked (real trading fees + PUDL boosts). Served by the PUDL backend, which
// applies the meme lens and merges the boost market.

export interface River {
  id: string
  name: string
  symbolA: string
  symbolB: string
  logoA: string | null
  logoB: string | null
  mintA: string
  mintB: string
  price: number
  feeRatePct: number
  tvl: number
  vol24h: number
  fees24h: number
  feesPer1k: number
  boostPerDay: number
  boostPer1k: number
  totalPer1k: number
  flow: 'FLASH FLOOD' | 'SURGE' | 'FLOWING' | 'CALM'
  meme: boolean
  venue?: 'raydium' | 'meteora' | 'pumpswap'
  hasSol?: boolean // pool has a SOL side → castable
  featured?: boolean // the $PUDL flagship river
}

export interface RiversSnapshot {
  updatedAt: number
  totalFees24h: number
  totalVol24h: number
  totalBoost: number
  rivers: River[]
}

export const fmtUsd = (n: number) =>
  '$' +
  (n >= 1_000_000
    ? (n / 1_000_000).toFixed(2) + 'M'
    : n >= 1_000
      ? (n / 1_000).toFixed(1) + 'K'
      : n.toFixed(n >= 10 ? 0 : 2))

// SOL amounts (a player's stake / earnings live in their custodial SOL wallet)
export const fmtSol = (n: number) => {
  const v = n >= 1000 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(n > 0 && n < 0.001 ? 5 : 3)
  return v + ' SOL'
}

export const shortMint = (m: string) => (m ? m.slice(0, 4) + '…' + m.slice(-4) : '')
