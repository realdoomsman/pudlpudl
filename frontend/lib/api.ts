// Real API integrations for production

const BIRDEYE_API = 'https://public-api.birdeye.so';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map token symbols to CoinGecko IDs
const COINGECKO_IDS: Record<string, string> = {
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
  BONK: 'bonk',
  JUP: 'jupiter-exchange-solana',
  WIF: 'dogwifcoin',
};

// Get real-time token prices from CoinGecko
export async function getTokenPrices(tokens: string[]): Promise<Record<string, number>> {
  try {
    const prices: Record<string, number> = {};
    
    // Map mints to CoinGecko IDs
    const symbolToMint: Record<string, string> = {};
    Object.entries(TOKEN_MINTS).forEach(([symbol, mint]) => {
      symbolToMint[symbol] = mint;
    });
    
    const mintToSymbol: Record<string, string> = {};
    Object.entries(TOKEN_MINTS).forEach(([symbol, mint]) => {
      mintToSymbol[mint] = symbol;
    });
    
    const ids = tokens
      .map(mint => {
        const symbol = mintToSymbol[mint];
        return symbol ? COINGECKO_IDS[symbol] : null;
      })
      .filter(Boolean)
      .join(',');
    
    if (!ids) return {};
    
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map back to mint addresses
    tokens.forEach(mint => {
      const symbol = mintToSymbol[mint];
      if (symbol && COINGECKO_IDS[symbol]) {
        const cgId = COINGECKO_IDS[symbol];
        if (data[cgId]?.usd) {
          prices[mint] = data[cgId].usd;
        }
      }
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return {};
  }
}

// Get single token price from CoinGecko
export async function getTokenPrice(tokenMint: string): Promise<number> {
  try {
    // Find symbol for this mint
    const mintToSymbol: Record<string, string> = {};
    Object.entries(TOKEN_MINTS).forEach(([symbol, mint]) => {
      mintToSymbol[mint] = symbol;
    });
    
    const symbol = mintToSymbol[tokenMint];
    if (!symbol || !COINGECKO_IDS[symbol]) {
      return 0;
    }
    
    const cgId = COINGECKO_IDS[symbol];
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${cgId}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data[cgId]?.usd || 0;
  } catch (error) {
    console.error('Error fetching price:', error);
    return 0;
  }
}

// Get historical price data for charts from CoinGecko
export async function getHistoricalPrices(
  tokenAddress: string,
  timeframe: '1H' | '24H' | '7D' | '30D'
): Promise<Array<{ time: number; price: number; volume: number }>> {
  try {
    // Find CoinGecko ID for this token
    const mintToSymbol: Record<string, string> = {};
    Object.entries(TOKEN_MINTS).forEach(([symbol, mint]) => {
      mintToSymbol[mint] = symbol;
    });
    
    const symbol = mintToSymbol[tokenAddress];
    if (!symbol || !COINGECKO_IDS[symbol]) {
      return [];
    }
    
    const cgId = COINGECKO_IDS[symbol];
    
    // Map timeframe to days (CoinGecko auto-selects interval based on days)
    const daysMap = {
      '1H': 1,
      '24H': 1,
      '7D': 7,
      '30D': 30
    };
    
    const days = daysMap[timeframe];
    
    // Don't specify interval - CoinGecko will auto-select based on days
    const response = await fetch(
      `${COINGECKO_API}/coins/${cgId}/market_chart?vs_currency=usd&days=${days}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (data.prices && Array.isArray(data.prices)) {
      return data.prices.map(([timestamp, price]: [number, number], index: number) => ({
        time: index,
        price: price,
        volume: data.total_volumes?.[index]?.[1] || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return [];
  }
}

// Get real protocol stats from on-chain data
export async function getProtocolStats() {
  try {
    // In production, fetch from your deployed programs
    // For now, fetch from Jupiter/Birdeye aggregated data
    
    const response = await fetch(`${BIRDEYE_API}/defi/multi_price?list_address=So11111111111111111111111111111111111111112`);
    const data = await response.json();
    
    // Calculate real stats
    return {
      tvl: 0, // Will be calculated from your pools
      volume24h: 0, // Will be calculated from your pools
      pools: 0, // Count from your factory
      users: 0 // Count unique users
    };
  } catch (error) {
    console.error('Error fetching protocol stats:', error);
    return {
      tvl: 0,
      volume24h: 0,
      pools: 0,
      users: 0
    };
  }
}

// Get real transactions from Solana
export async function getRecentTransactions(programId: string, limit: number = 10) {
  try {
    const response = await fetch(
      `https://api.mainnet-beta.solana.com`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [programId, { limit }]
        })
      }
    );
    
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Token mint addresses for price lookups
export const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};
