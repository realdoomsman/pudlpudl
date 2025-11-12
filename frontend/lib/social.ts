// Social Features
export interface TradeShare {
  fromToken: string
  toToken: string
  amount: number
  timestamp: number
  txSignature: string
  profit?: number
}

export interface WalletProfile {
  address: string
  displayName?: string
  avatar?: string
  followers: number
  following: number
  totalTrades: number
  totalVolume: number
  winRate: number
}

export function generateShareText(trade: TradeShare): string {
  const profit = trade.profit ? ` (${trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}%)` : ''
  return `Just swapped ${trade.amount} ${trade.fromToken} → ${trade.toToken} on @PUDLProtocol${profit}\n\nTrade on PUDL: pudl.fi/swap`
}

export function generateShareUrl(trade: TradeShare): string {
  const text = encodeURIComponent(generateShareText(trade))
  return `https://twitter.com/intent/tweet?text=${text}`
}

export async function followWallet(walletAddress: string): Promise<boolean> {
  // In production, call your API
  // await fetch('/api/social/follow', { method: 'POST', body: { walletAddress } })
  
  console.log(`Following wallet: ${walletAddress}`)
  return true
}

export async function getWalletProfile(walletAddress: string): Promise<WalletProfile> {
  // In production, fetch from your API
  // const response = await fetch(`/api/social/profile/${walletAddress}`)
  
  // Mock data
  return {
    address: walletAddress,
    displayName: `Trader ${walletAddress.slice(0, 4)}`,
    followers: Math.floor(Math.random() * 1000),
    following: Math.floor(Math.random() * 500),
    totalTrades: Math.floor(Math.random() * 10000),
    totalVolume: Math.floor(Math.random() * 1000000),
    winRate: 50 + Math.random() * 30
  }
}

export async function getTopTraders(limit: number = 10): Promise<WalletProfile[]> {
  // In production, fetch from your API
  // const response = await fetch(`/api/social/leaderboard?limit=${limit}`)
  
  // Mock data
  return Array.from({ length: limit }, (_, i) => ({
    address: `trader${i}...`,
    displayName: `Top Trader #${i + 1}`,
    followers: 1000 - i * 50,
    following: 100,
    totalTrades: 10000 - i * 500,
    totalVolume: 1000000 - i * 50000,
    winRate: 80 - i * 2
  }))
}
