// Jupiter API Integration for real swap quotes
import { TOKEN_MINTS } from './solana'

export interface JupiterQuote {
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  priceImpactPct: number
  marketInfos: any[]
  slippageBps: number
}

export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: number,
  slippageBps: number = 50
): Promise<JupiterQuote | null> {
  try {
    const inputMint = TOKEN_MINTS[fromToken]
    const outputMint = TOKEN_MINTS[toToken]
    
    // Convert to smallest unit (lamports for SOL, base units for tokens)
    const amountInSmallestUnit = Math.floor(amount * 1e9)

    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInSmallestUnit}&slippageBps=${slippageBps}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch quote')
    }

    const quote = await response.json()
    return quote
  } catch (error) {
    console.error('Error fetching Jupiter quote:', error)
    return null
  }
}

export async function getTokenPrice(tokenSymbol: string): Promise<number> {
  try {
    const mint = TOKEN_MINTS[tokenSymbol]
    
    // Get price by comparing to USDC
    const quote = await getSwapQuote(tokenSymbol, 'USDC', 1, 50)
    
    if (quote) {
      const outputAmount = parseInt(quote.outAmount) / 1e6 // USDC has 6 decimals
      return outputAmount
    }
    
    return 0
  } catch (error) {
    console.error('Error fetching token price:', error)
    return 0
  }
}

export function calculatePriceImpact(quote: JupiterQuote): number {
  return quote.priceImpactPct * 100
}

export function calculateMinimumReceived(quote: JupiterQuote): number {
  const outAmount = parseInt(quote.outAmount)
  const slippageMultiplier = 1 - (quote.slippageBps / 10000)
  return (outAmount * slippageMultiplier) / 1e9
}
