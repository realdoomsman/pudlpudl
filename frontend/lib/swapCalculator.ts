// Swap calculation logic for DLMM pools

interface SwapQuote {
  inputAmount: number
  outputAmount: number
  fee: number
  priceImpact: number
  rate: number
  route: string[]
}

// Mock price feeds (in production, fetch from Jupiter/Pyth)
const MOCK_PRICES: Record<string, number> = {
  SOL: 100,
  USDC: 1,
  PUDL: 0.05,
  BONK: 0.00001,
}

export function calculateSwapQuote(
  fromToken: string,
  toToken: string,
  amountIn: number,
  slippage: number = 1
): SwapQuote {
  if (amountIn <= 0) {
    return {
      inputAmount: 0,
      outputAmount: 0,
      fee: 0,
      priceImpact: 0,
      rate: 0,
      route: [],
    }
  }

  const fromPrice = MOCK_PRICES[fromToken] || 1
  const toPrice = MOCK_PRICES[toToken] || 1
  
  // Calculate base rate
  const baseRate = fromPrice / toPrice
  
  // Calculate fee (0.20% base fee)
  const feeBps = 20
  const feeAmount = amountIn * (feeBps / 10000)
  
  // Amount after fee
  const amountAfterFee = amountIn - feeAmount
  
  // Calculate output with slight slippage
  const priceImpact = Math.min(amountIn / 100000, 0.5) // Max 0.5% impact
  const effectiveRate = baseRate * (1 - priceImpact / 100)
  const outputAmount = amountAfterFee * effectiveRate
  
  // Apply slippage tolerance
  const minOutput = outputAmount * (1 - slippage / 100)
  
  return {
    inputAmount: amountIn,
    outputAmount: minOutput,
    fee: feeAmount,
    priceImpact,
    rate: effectiveRate,
    route: [fromToken, toToken],
  }
}

export function getTokenBalance(token: string, connected: boolean): number {
  if (!connected) return 0
  
  // Mock balances
  const balances: Record<string, number> = {
    SOL: 10.5,
    USDC: 1000,
    PUDL: 5000,
    BONK: 1000000,
  }
  
  return balances[token] || 0
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (num === 0) return '0'
  if (num < 0.01) return num.toFixed(6)
  if (num < 1) return num.toFixed(4)
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
