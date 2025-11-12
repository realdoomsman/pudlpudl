import { PublicKey } from '@solana/web3.js'

export const PROGRAM_IDS = {
  factory: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS'),
  dlmm: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnT'),
  staking: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnU'),
  treasury: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnV'),
  router: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnW'),
  governance: new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnX'),
}

export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8899'

export const PUDL_MINT = process.env.NEXT_PUBLIC_PUDL_MINT 
  ? new PublicKey(process.env.NEXT_PUBLIC_PUDL_MINT)
  : null

export const POOL_BOND_AMOUNT = 1000 // 1000 PUDL required to create a pool
