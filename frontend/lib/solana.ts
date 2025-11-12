import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

// Initialize Solana connection
export const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
  'confirmed'
)

// Get SOL balance
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return balance / 1e9 // Convert lamports to SOL
  } catch (error) {
    console.error('Error fetching SOL balance:', error)
    return 0
  }
}

// Get SPL token balance
export async function getTokenBalance(
  walletAddress: string,
  tokenMintAddress: string
): Promise<number> {
  try {
    const walletPublicKey = new PublicKey(walletAddress)
    const tokenMintPublicKey = new PublicKey(tokenMintAddress)

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { mint: tokenMintPublicKey }
    )

    if (tokenAccounts.value.length === 0) return 0

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
    return balance || 0
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return 0
  }
}

// Get all token balances for a wallet
export async function getAllTokenBalances(walletAddress: string): Promise<Record<string, number>> {
  try {
    const publicKey = new PublicKey(walletAddress)
    
    // Get SOL balance
    const solBalance = await getSolBalance(walletAddress)
    
    // Get all SPL token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    )

    const balances: Record<string, number> = {
      'SOL': solBalance
    }

    tokenAccounts.value.forEach((account) => {
      const mint = account.account.data.parsed.info.mint
      const balance = account.account.data.parsed.info.tokenAmount.uiAmount
      
      // Map common token mints to symbols
      const tokenSymbol = getTokenSymbol(mint)
      if (balance > 0) {
        balances[tokenSymbol] = balance
      }
    })

    return balances
  } catch (error) {
    console.error('Error fetching all balances:', error)
    return { 'SOL': 0 }
  }
}

// Token mint addresses
export const TOKEN_MINTS: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'PUDL': 'PUDLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // Replace with actual
}

function getTokenSymbol(mint: string): string {
  const entry = Object.entries(TOKEN_MINTS).find(([_, address]) => address === mint)
  return entry ? entry[0] : mint.slice(0, 4)
}
