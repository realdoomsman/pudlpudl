// Token Metadata Service - Fetches and caches token info from Jupiter
export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  tags?: string[]
  verified?: boolean
  daily_volume?: number
}

class TokenMetadataService {
  private tokenCache: Map<string, TokenInfo> = new Map()
  private tokenList: TokenInfo[] = []
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 1000 * 60 * 60 // 1 hour

  // Fetch token list from Jupiter
  async fetchTokenList(): Promise<TokenInfo[]> {
    const now = Date.now()
    
    // Return cached if still valid
    if (this.tokenList.length > 0 && now - this.lastFetch < this.CACHE_DURATION) {
      return this.tokenList
    }

    try {
      // Fetch from Jupiter strict list (verified tokens only)
      console.log('Fetching token list from Jupiter...')
      const response = await fetch('https://token.jup.ag/strict', {
        headers: {
          'Accept': 'application/json',
        },
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token list: ${response.status}`)
      }

      const tokens: TokenInfo[] = await response.json()
      console.log(`Loaded ${tokens.length} tokens from Jupiter`)
      
      // Cache tokens by address
      tokens.forEach(token => {
        this.tokenCache.set(token.address, token)
      })
      
      this.tokenList = tokens
      this.lastFetch = now
      
      return tokens
    } catch (error) {
      console.error('Error fetching token list:', error)
      
      // Return cached list if available
      if (this.tokenList.length > 0) {
        return this.tokenList
      }
      
      // Return fallback tokens
      return this.getFallbackTokens()
    }
  }

  // Get token info by address
  async getTokenInfo(address: string): Promise<TokenInfo | null> {
    // Check cache first
    if (this.tokenCache.has(address)) {
      return this.tokenCache.get(address)!
    }

    // Fetch full list if not cached
    await this.fetchTokenList()
    
    return this.tokenCache.get(address) || null
  }

  // Get token info by symbol
  async getTokenBySymbol(symbol: string): Promise<TokenInfo | null> {
    if (this.tokenList.length === 0) {
      await this.fetchTokenList()
    }

    return this.tokenList.find(
      token => token.symbol.toLowerCase() === symbol.toLowerCase()
    ) || null
  }

  // Search tokens by name or symbol
  async searchTokens(query: string, limit: number = 20): Promise<TokenInfo[]> {
    if (this.tokenList.length === 0) {
      await this.fetchTokenList()
    }

    const lowerQuery = query.toLowerCase()
    
    return this.tokenList
      .filter(token => 
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit)
  }

  // Get popular tokens
  async getPopularTokens(): Promise<TokenInfo[]> {
    if (this.tokenList.length === 0) {
      await this.fetchTokenList()
    }

    // If still no tokens, return fallback
    if (this.tokenList.length === 0) {
      console.log('Using fallback tokens for popular list')
      return this.getFallbackTokens()
    }

    // Return well-known tokens
    const popularSymbols = ['SOL', 'USDC', 'USDT', 'BONK', 'WIF', 'JUP', 'RAY', 'ORCA']
    
    const popular = this.tokenList.filter(token => 
      popularSymbols.includes(token.symbol)
    )

    // If no popular tokens found, return first 8 tokens
    return popular.length > 0 ? popular : this.tokenList.slice(0, 8)
  }

  // Fallback tokens if API fails
  private getFallbackTokens(): TokenInfo[] {
    return [
      {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        verified: true
      },
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        verified: true
      },
      {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        verified: true
      },
      {
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        symbol: 'BONK',
        name: 'Bonk',
        decimals: 5,
        logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
        verified: true
      },
      {
        address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
        symbol: 'WIF',
        name: 'dogwifhat',
        decimals: 6,
        logoURI: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link',
        verified: true
      },
      {
        address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
        symbol: 'JUP',
        name: 'Jupiter',
        decimals: 6,
        logoURI: 'https://static.jup.ag/jup/icon.png',
        verified: true
      },
      {
        address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
        symbol: 'ETH',
        name: 'Ether (Portal)',
        decimals: 8,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png',
        verified: true
      },
      {
        address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
        symbol: 'mSOL',
        name: 'Marinade staked SOL',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
        verified: true
      },
      {
        address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        symbol: 'RAY',
        name: 'Raydium',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
        verified: true
      },
      {
        address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
        symbol: 'ORCA',
        name: 'Orca',
        decimals: 6,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
        verified: true
      }
    ]
  }

  // Clear cache
  clearCache(): void {
    this.tokenCache.clear()
    this.tokenList = []
    this.lastFetch = 0
  }
}

// Export singleton instance
export const tokenMetadata = new TokenMetadataService()

// Helper function to format token amount
export function formatTokenAmount(amount: number, decimals: number = 6): string {
  if (amount === 0) return '0'
  if (amount < 0.01) return '<0.01'
  if (amount < 1) return amount.toFixed(4)
  if (amount < 1000) return amount.toFixed(2)
  if (amount < 1000000) return `${(amount / 1000).toFixed(2)}K`
  return `${(amount / 1000000).toFixed(2)}M`
}

// Helper to get token logo with fallback
export function getTokenLogo(token: TokenInfo | null): string {
  if (!token?.logoURI) {
    return '/token-placeholder.svg'
  }
  return token.logoURI
}
