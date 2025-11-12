import { PublicKey } from '@solana/web3.js';

/**
 * PUDL Token Configuration
 * Contract Address (CA) and token metadata
 */

export const PUDL_TOKEN_CONFIG = {
  // Token Mint Address (Contract Address)
  // Replace this with your actual token mint address after deployment
  mintAddress: 'So11111111111111111111111111111111111111112', // Placeholder - SOL mint as example
  
  // Token Metadata
  symbol: 'PUDL',
  name: 'PUDL Token',
  decimals: 9,
  
  // Token Supply
  totalSupply: 1_000_000_000, // 1 billion tokens
  
  // Logo/Image
  logoURI: '/pudl-logo.png',
  
  // Social Links
  website: 'https://pudlpudl.vercel.app',
  twitter: 'https://twitter.com/pudlprotocol',
  discord: 'https://discord.gg/pudl',
  
  // Token Description
  description: 'The native governance and utility token of the PUDL Protocol',
};

// Export the mint address as a string for easy copying
export const PUDL_TOKEN_CA = PUDL_TOKEN_CONFIG.mintAddress;

// Helper to get token info
export function getPudlTokenInfo() {
  return {
    address: PUDL_TOKEN_CA,
    symbol: PUDL_TOKEN_CONFIG.symbol,
    name: PUDL_TOKEN_CONFIG.name,
    decimals: PUDL_TOKEN_CONFIG.decimals,
    logoURI: PUDL_TOKEN_CONFIG.logoURI,
  };
}

// Helper to get PublicKey object
export function getPudlTokenMint() {
  return new PublicKey(PUDL_TOKEN_CONFIG.mintAddress);
}
