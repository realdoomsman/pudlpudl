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

export async function executeSwap(
  quote: JupiterQuote,
  userPublicKey: string,
  signTransaction: any
): Promise<string> {
  try {
    // Your fee account - you earn 0.25% of every swap!
    const PUDL_FEE_ACCOUNT = 'GpWkVYPmc5rRFRXCRhdHH2zcSYExy19vwYeeG8GunVF7';
    const FEE_BPS = 25; // 0.25% fee (25 basis points)
    
    // Get swap transaction from Jupiter with referral fee
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
        // Referral fee configuration
        feeAccount: PUDL_FEE_ACCOUNT,
        feeBps: FEE_BPS
      })
    })

    if (!swapResponse.ok) {
      throw new Error('Failed to get swap transaction')
    }

    const { swapTransaction } = await swapResponse.json()
    
    // Deserialize and sign the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf)
    
    const signedTransaction = await signTransaction(transaction)
    
    // Send transaction
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com')
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3
    })
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed')
    
    return signature
  } catch (error) {
    console.error('Error executing swap:', error)
    throw error
  }
}

import { Connection, VersionedTransaction } from '@solana/web3.js'
