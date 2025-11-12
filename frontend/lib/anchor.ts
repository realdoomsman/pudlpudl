import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import { PROGRAM_IDS, RPC_ENDPOINT } from './config'

export function getProvider(wallet: AnchorWallet | undefined) {
  if (!wallet) return null
  
  const connection = new Connection(RPC_ENDPOINT, 'confirmed')
  return new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  })
}

export async function getFactoryProgram(wallet: AnchorWallet | undefined) {
  const provider = getProvider(wallet)
  if (!provider) return null
  
  // You'll need to import the IDL from your build artifacts
  // For now, we'll use a minimal interface
  return {
    programId: PROGRAM_IDS.factory,
    provider,
  }
}

export async function getPoolProgram(wallet: AnchorWallet | undefined) {
  const provider = getProvider(wallet)
  if (!provider) return null
  
  return {
    programId: PROGRAM_IDS.dlmm,
    provider,
  }
}

export async function getStakingProgram(wallet: AnchorWallet | undefined) {
  const provider = getProvider(wallet)
  if (!provider) return null
  
  return {
    programId: PROGRAM_IDS.staking,
    provider,
  }
}

export async function getRouterProgram(wallet: AnchorWallet | undefined) {
  const provider = getProvider(wallet)
  if (!provider) return null
  
  return {
    programId: PROGRAM_IDS.router,
    provider,
  }
}
