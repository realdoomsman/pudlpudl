// pump.fun creator-fee auto-claim.
//
// $PUDL launched on pump.fun's fee-SHARING model, which makes fee distribution
// PERMISSIONLESS: anyone can trigger it, signed by a wallet that only pays gas —
// never the creator's key. So the backend can auto-claim without any private key
// that controls funds. The distributed fees land with whoever the coin's on-chain
// fee-sharing config names as shareholders (by default the pump.fun creator; point
// them at the treasury by editing the sharing config once, a creator-only action).
import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { OnlinePumpSdk } from '@pump-fun/pump-sdk'
import { connection } from './cast'

const pump = new OnlinePumpSdk(connection)
const LAMPORTS = 1_000_000_000

const bnToSol = (v: any): number => {
  try { return Number(v?.toString?.() ?? v ?? 0) / LAMPORTS } catch { return 0 }
}

export interface DistributableInfo {
  distributableSol: number
  minRequiredSol: number
  canDistribute: boolean
  isGraduated: boolean
}

// Read-only: how much creator fee is sitting ready to distribute for `mint`.
export async function distributableFees(mint: string): Promise<DistributableInfo> {
  const r: any = await pump.getMinimumDistributableFee(new PublicKey(mint))
  return {
    distributableSol: bnToSol(r?.distributableFees),
    minRequiredSol: bnToSol(r?.minimumRequired),
    canDistribute: !!r?.canDistribute,
    isGraduated: !!r?.isGraduated,
  }
}

export interface DistributeResult extends DistributableInfo {
  sig: string | null
  distributed: boolean
  note: string
  at: number
}

// Permissionless auto-claim: trigger pump.fun creator-fee distribution for `mint`,
// signed by `payer` (a GAS wallet only — not the creator key). Only fires when the
// ready amount clears `minSol`, so gas is never wasted on an empty/tiny claim.
export async function distributeCreatorFees(payer: Keypair, mint: string, minSol: number): Promise<DistributeResult> {
  const m = new PublicKey(mint)
  const now = Date.now()
  let info: DistributableInfo
  try {
    info = await distributableFees(mint)
  } catch (e: any) {
    return { distributableSol: 0, minRequiredSol: 0, canDistribute: false, isGraduated: false, sig: null, distributed: false, at: now, note: 'no fee-sharing config: ' + String(e?.message ?? e).slice(0, 80) }
  }
  const base = { ...info, sig: null as string | null, distributed: false, at: now }
  if (!info.canDistribute) return { ...base, note: 'nothing distributable yet' }
  if (info.distributableSol < minSol) return { ...base, note: `holding: ${info.distributableSol.toFixed(4)} < ${minSol} SOL threshold` }
  const built: any = await pump.buildDistributeCreatorFeesInstructions(m)
  const ixs = built?.instructions ?? []
  if (!ixs.length) return { ...base, note: 'no instructions returned' }
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const tx = new Transaction({ feePayer: payer.publicKey, blockhash, lastValidBlockHeight }).add(...ixs)
  const sig = await connection.sendTransaction(tx, [payer])
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
  return { ...base, sig, distributed: true, note: `distributed ${info.distributableSol.toFixed(4)} SOL to fee-sharing recipients` }
}
