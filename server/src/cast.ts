// The cast engine. Opens / harvests / closes real Raydium CLMM positions on
// behalf of a custodial account — the server signs with the account's keypair,
// so from the player's side it's one click and everything happens internally.
//
// The custodial wallet holds SOL only, so a net is a SINGLE-SIDED position on
// the SOL side of the pool: we place the range just past the current price on
// the side that is 100% SOL, so it can be funded with SOL alone (no swap). As
// price oscillates into the range — which memecoins do constantly — the position
// earns real trading fees. Pools with no SOL side can't be funded from a SOL
// wallet and are rejected up front.
//
// Verified against @raydium-io/raydium-sdk-v2 @0.2.62-alpha (the demo's pin).
// Live execution needs a funded account + a real RPC (RPC_URL env). Opens are
// atomic: if anything fails the transaction reverts and no SOL is lost.

import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import {
  Raydium,
  TxVersion,
  TickUtil,
  LiquidityMathUtil,
  CLMM_PROGRAM_ID,
  CREATE_CPMM_POOL_PROGRAM,
  CREATE_CPMM_POOL_FEE_ACC,
  type ApiV3PoolInfoConcentratedItem,
} from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import Decimal from 'decimal.js'

const RPC_URL =
  process.env.RPC_URL || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

const WSOL = 'So11111111111111111111111111111111111111112'
const SOL_DECIMALS = 9

export const connection = new Connection(RPC_URL, 'confirmed')
const txVersion = TxVersion.V0

// Serialize balance-affecting ops per wallet so a concurrent harvest / close /
// withdraw / boost-payout can't pollute another's SOL-balance-delta measurement.
const accountChains = new Map<string, Promise<unknown>>()
export function withAccountLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = accountChains.get(key) ?? Promise.resolve()
  const run = prev.then(fn, fn)
  accountChains.set(key, run.then(() => {}, () => {}))
  return run
}

// one Raydium client per account pubkey (keyed by string so it actually hits),
// with a small LRU cap so long-running processes don't grow unbounded.
const clients = new Map<string, Raydium>()
const CLIENT_CAP = 200
async function sdkFor(owner: Keypair): Promise<Raydium> {
  const key = owner.publicKey.toBase58()
  const hit = clients.get(key)
  if (hit) {
    clients.delete(key)
    clients.set(key, hit) // mark most-recently-used
    return hit
  }
  const raydium = await Raydium.load({
    connection,
    owner,
    cluster: 'mainnet',
    disableFeatureCheck: true,
    disableLoadToken: true,
    blockhashCommitment: 'finalized',
  })
  clients.set(key, raydium)
  while (clients.size > CLIENT_CAP) clients.delete(clients.keys().next().value as string)
  return raydium
}

async function loadPool(raydium: Raydium, poolId: string) {
  const data = await raydium.api.fetchPoolById({ ids: poolId })
  const poolInfo = data[0] as ApiV3PoolInfoConcentratedItem
  if (!poolInfo) throw new Error('pool not found')
  if (poolInfo.programId !== CLMM_PROGRAM_ID.toBase58()) throw new Error('not a CLMM pool')
  // overwrite the (laggy) API price with the live on-chain price + current tick
  const rpc = await raydium.clmm.getRpcClmmPoolInfo({ poolId })
  poolInfo.price = rpc.currentPrice
  return { poolInfo, tickCurrent: rpc.tickCurrent }
}

// spacing-aligned tick for a given price (same conversion the open path uses)
const priceToTick = (poolInfo: ApiV3PoolInfoConcentratedItem, price: number) =>
  TickUtil.toTickIndex(
    TickUtil.priceToTick(
      new Decimal(price),
      poolInfo.mintA.decimals,
      poolInfo.mintB.decimals,
    ),
    poolInfo.config.tickSpacing,
  )

// Which side of the pool is wrapped SOL, and the single-sided tick range that is
// 100% that side (so it can be funded with SOL only).
function solSideAndRange(
  poolInfo: ApiV3PoolInfoConcentratedItem,
  tickCurrent: number,
  bandPct: number,
) {
  const solIsA = poolInfo.mintA.address === WSOL
  const solIsB = poolInfo.mintB.address === WSOL
  if (!solIsA && !solIsB) {
    throw new Error('pool has no SOL side — funding it needs a swap, not supported yet')
  }
  const spacing = poolInfo.config.tickSpacing
  const snapUp = (t: number) => Math.ceil(t / spacing) * spacing
  const snapDn = (t: number) => Math.floor(t / spacing) * spacing
  const price = poolInfo.price
  let tickLower: number
  let tickUpper: number
  if (solIsA) {
    // a range strictly ABOVE the current price is 100% mintA → 100% SOL
    tickLower = snapUp(tickCurrent + 1)
    const edge = priceToTick(poolInfo, price * (1 + Math.min(bandPct, 0.9)))
    tickUpper = Math.max(snapUp(edge), tickLower + spacing)
  } else {
    // a range strictly BELOW the current price is 100% mintB → 100% SOL
    tickUpper = snapDn(tickCurrent - 1)
    const edge = priceToTick(poolInfo, price * (1 - Math.min(bandPct, 0.9)))
    tickLower = Math.min(snapDn(edge), tickUpper - spacing)
  }
  return { base: (solIsA ? 'MintA' : 'MintB') as 'MintA' | 'MintB', tickLower, tickUpper }
}

export interface OpenResult {
  positionMint: string
  txId: string
}

/**
 * Cast a net: open a single-sided SOL position on `poolId`, funded with
 * `solAmount` SOL. `bandPct` sets how far past the current price the range runs.
 */
export async function openNet(
  owner: Keypair,
  poolId: string,
  solAmount: number,
  bandPct = 0.15,
): Promise<OpenResult> {
  const raydium = await sdkFor(owner)
  const { poolInfo, tickCurrent } = await loadPool(raydium, poolId)
  const { base, tickLower, tickUpper } = solSideAndRange(poolInfo, tickCurrent, bandPct)
  if (tickUpper <= tickLower) throw new Error('range collapsed to zero width')

  const baseAmount = new BN(new Decimal(solAmount).mul(10 ** SOL_DECIMALS).toFixed(0))

  const { execute, extInfo } = await raydium.clmm.openPositionFromBase({
    poolInfo,
    tickLower,
    tickUpper,
    base,
    baseAmount,
    otherAmountMax: new BN(0), // single-sided: the non-SOL leg is ~0
    ownerInfo: { useSOLBalance: true },
    nft2022: true,
    txVersion,
    computeBudgetConfig: { units: 600_000, microLamports: 100_000 },
  } as any)

  const { txId } = await execute({ sendAndConfirm: true })
  return { positionMint: extInfo.nftMint.toBase58(), txId }
}

/**
 * Harvest one net's pending fees + rewards into the account, scoped to that
 * exact position. Returns the tx ids and the realized SOL gained (fees measured
 * as the wallet's SOL balance delta across the harvest).
 */
export async function harvestNet(
  owner: Keypair,
  poolId: string,
  positionMint: string,
): Promise<{ txIds: string[]; solDelta: number }> {
  const raydium = await sdkFor(owner)
  const { poolInfo } = await loadPool(raydium, poolId)
  const positions = await raydium.clmm.getOwnerPositionInfo({ programId: CLMM_PROGRAM_ID })
  const mine = positions.filter(
    (p) => p.poolId.toBase58() === poolInfo.id && p.nftMint.toBase58() === positionMint,
  )
  if (!mine.length) return { txIds: [], solDelta: 0 }

  const before = await connection.getBalance(owner.publicKey)
  const { execute } = await raydium.clmm.harvestAllRewards({
    allPoolInfo: { [poolInfo.id]: poolInfo },
    allPositions: { [poolInfo.id]: mine },
    ownerInfo: { useSOLBalance: true },
    programId: CLMM_PROGRAM_ID,
    txVersion,
  } as any)
  const { txIds } = await execute({ sequentially: true })
  const after = await connection.getBalance(owner.publicKey)
  // fees land as SOL (WSOL unwrapped); gas is paid from the same balance, so the
  // delta is realized fees net of gas. Never report a negative "earning".
  const solDelta = Math.max(0, (after - before) / 1e9)
  return { txIds, solDelta }
}

/** Close a net entirely: pull 100% liquidity, collect fees, burn the NFT. */
export async function closeNet(owner: Keypair, poolId: string, positionMint: string) {
  const raydium = await sdkFor(owner)
  const { poolInfo } = await loadPool(raydium, poolId)
  const positions = await raydium.clmm.getOwnerPositionInfo({ programId: CLMM_PROGRAM_ID })
  const pos = positions.find(
    (p) => p.poolId.toBase58() === poolInfo.id && p.nftMint.toBase58() === positionMint,
  )
  if (!pos) throw new Error('position not found')

  // slippage floor: expect ~97% of the liquidity's current token amounts back
  let amountMinA = new BN(0)
  let amountMinB = new BN(0)
  try {
    const sqrtCur = TickUtil.priceToSqrtPriceX64(
      new Decimal(poolInfo.price),
      poolInfo.mintA.decimals,
      poolInfo.mintB.decimals,
    )
    const amounts = LiquidityMathUtil.getAmountsForLiquidity(
      sqrtCur,
      TickUtil.getSqrtPriceAtTick(pos.tickLower),
      TickUtil.getSqrtPriceAtTick(pos.tickUpper),
      (pos as any).liquidity,
      false,
    )
    if ((amounts as any)?.amountA) amountMinA = new BN((amounts as any).amountA.toString()).muln(97).divn(100)
    if ((amounts as any)?.amountB) amountMinB = new BN((amounts as any).amountB.toString()).muln(97).divn(100)
  } catch {
    // fall back to no floor rather than block a legitimate close
  }

  const { execute } = await raydium.clmm.decreaseLiquidity({
    poolInfo,
    ownerPosition: pos,
    ownerInfo: { useSOLBalance: true, closePosition: true },
    liquidity: pos.liquidity,
    amountMinA,
    amountMinB,
    txVersion,
  } as any)
  const { txId } = await execute({ sendAndConfirm: true })
  return txId
}

/**
 * For one wallet, report positionMint -> inRange for the given nets. A CLMM net
 * only earns while the pool's current tick sits inside the position's [lower,upper).
 * Once price leaves that band the net silently stops collecting — this lets the UI
 * flag it. Read-only: one getOwnerPositionInfo call for the wallet + each pool's
 * live tick. positionMints not found on-chain (closed/burned) are left out.
 */
export async function netRangeStatus(
  owner: Keypair,
  items: { poolId: string; positionMint: string }[],
): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {}
  if (!items.length) return out
  const raydium = await sdkFor(owner)
  let positions: any[] = []
  try {
    positions = await raydium.clmm.getOwnerPositionInfo({ programId: CLMM_PROGRAM_ID })
  } catch {
    return out
  }
  const tickByPool = new Map<string, number>()
  for (const it of items) {
    const pos = positions.find((p: any) => p.nftMint.toBase58() === it.positionMint)
    if (!pos) continue // not on-chain anymore — leave unknown
    let tick = tickByPool.get(it.poolId)
    if (tick === undefined) {
      try {
        const loaded = await loadPool(raydium, it.poolId)
        tick = loaded.tickCurrent
        tickByPool.set(it.poolId, tick)
      } catch {
        continue
      }
    }
    out[it.positionMint] = pos.tickLower <= tick && tick < pos.tickUpper
  }
  return out
}

export function balanceOf(pubkey: string): Promise<number> {
  return connection.getBalance(new PublicKey(pubkey)).then((l) => l / 1e9)
}

/** Withdraw SOL from the custodial wallet to any address the player owns. */
export async function withdrawSol(owner: Keypair, to: string, sol: number): Promise<string> {
  const dest = new PublicKey(to) // throws on a bad address
  const lamports = Math.floor(sol * 1e9)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const tx = new Transaction({ feePayer: owner.publicKey, blockhash, lastValidBlockHeight }).add(
    SystemProgram.transfer({ fromPubkey: owner.publicKey, toPubkey: dest, lamports }),
  )
  const sig = await connection.sendTransaction(tx, [owner])
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
  return sig
}

/**
 * Like transferSol but never ambiguously "lost": returns { sig, landed }. On a
 * confirm timeout it checks the real signature status and biases to landed=true
 * when the outcome is unknown, so a caller that re-credits on !landed can never
 * double-pay a transfer that actually settled. Throws only if the send itself
 * fails (nothing broadcast).
 */
export async function transferSolResult(
  from: Keypair,
  to: string | PublicKey,
  sol: number,
): Promise<{ sig: string; landed: boolean }> {
  const dest = to instanceof PublicKey ? to : new PublicKey(String(to))
  const lamports = Math.floor(sol * 1e9)
  if (lamports <= 0) throw new Error('amount too small')
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const tx = new Transaction({ feePayer: from.publicKey, blockhash, lastValidBlockHeight }).add(
    SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: dest, lamports }),
  )
  const sig = await connection.sendTransaction(tx, [from]) // throws if never broadcast
  try {
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
    return { sig, landed: true }
  } catch {
    for (let i = 0; i < 3; i++) {
      const st = await connection.getSignatureStatus(sig, { searchTransactionHistory: true })
      const v = st?.value
      if (v && v.err === null && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) return { sig, landed: true }
      if (v && v.err) return { sig, landed: false } // definitively failed on-chain → safe to re-credit
    }
    return { sig, landed: true } // unknown → assume paid, protect escrow
  }
}

// ---------------------------------------------------------------- transfers

/** Move SOL between wallets the server controls (e.g. into/out of escrow). */
export async function transferSol(from: Keypair, to: string | PublicKey, sol: number): Promise<string> {
  const dest = to instanceof PublicKey ? to : new PublicKey(to)
  const lamports = Math.floor(sol * 1e9)
  if (lamports <= 0) throw new Error('amount too small')
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  const tx = new Transaction({ feePayer: from.publicKey, blockhash, lastValidBlockHeight }).add(
    SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: dest, lamports }),
  )
  const sig = await connection.sendTransaction(tx, [from])
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
  return sig
}

// ---------------------------------------------------------------- spl balances

const TOKEN_PROGRAM = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
const TOKEN_2022_PROGRAM = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')

/** Every SPL token (both token programs) the wallet holds a non-zero balance of. */
export async function splTokenBalances(
  pubkey: string,
): Promise<Array<{ mint: string; amount: number; decimals: number }>> {
  const owner = new PublicKey(pubkey)
  const out: Array<{ mint: string; amount: number; decimals: number }> = []
  for (const programId of [TOKEN_PROGRAM, TOKEN_2022_PROGRAM]) {
    try {
      const r = await connection.getParsedTokenAccountsByOwner(owner, { programId })
      for (const { account } of r.value) {
        const info = (account.data as any)?.parsed?.info
        const amt = info?.tokenAmount
        if (amt && Number(amt.uiAmount) > 0) {
          out.push({ mint: String(info.mint), amount: Number(amt.uiAmount), decimals: Number(amt.decimals) })
        }
      }
    } catch {}
  }
  return out
}

// ---------------------------------------------------------------- launch a pool

/**
 * Seed a brand-new Raydium CPMM (constant-product) pool pairing `tokenMint`
 * against SOL. The custodial wallet must already hold `tokenUiAmount` of the
 * token AND `solUiAmount` SOL — both sides are deposited into the new pool.
 *
 * UNVERIFIED until a funded end-to-end test: creating a pool is a real,
 * irreversible on-chain action that spends the Raydium pool-creation fee. Shape
 * follows @raydium-io/raydium-sdk-v2's cpmm.createPool demo.
 */
export async function createCpmmPool(
  owner: Keypair,
  tokenMint: string,
  tokenUiAmount: number,
  solUiAmount: number,
): Promise<{ txId: string; poolId: string }> {
  if (tokenMint === WSOL) throw new Error('pick a token other than SOL to pair against SOL')
  const raydium = await sdkFor(owner)
  const feeConfigs = await raydium.api.getCpmmConfigs()
  if (!feeConfigs?.length) throw new Error('could not load pool fee configs')
  const tokenInfo = await raydium.token.getTokenInfo(tokenMint)
  const wsolInfo = await raydium.token.getTokenInfo(WSOL)
  const tokenAmt = new BN(new Decimal(tokenUiAmount).mul(10 ** tokenInfo.decimals).toFixed(0))
  const solAmt = new BN(new Decimal(solUiAmount).mul(10 ** wsolInfo.decimals).toFixed(0))
  if (tokenAmt.lten(0) || solAmt.lten(0)) throw new Error('both sides must be > 0')

  // Raydium orders the two mints canonically (by address bytes); keep the amount
  // paired with its mint through the swap.
  let mintA = tokenInfo, mintB = wsolInfo, amountA = tokenAmt, amountB = solAmt
  if (Buffer.compare(new PublicKey(tokenMint).toBuffer(), new PublicKey(WSOL).toBuffer()) > 0) {
    mintA = wsolInfo; mintB = tokenInfo; amountA = solAmt; amountB = tokenAmt
  }

  const { execute, extInfo } = await raydium.cpmm.createPool({
    programId: CREATE_CPMM_POOL_PROGRAM,
    poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
    mintA,
    mintB,
    mintAAmount: amountA,
    mintBAmount: amountB,
    startTime: new BN(0),
    feeConfig: feeConfigs[0],
    associatedOnly: false,
    ownerInfo: { useSOLBalance: true },
    txVersion,
  } as any)
  const { txId } = await execute({ sendAndConfirm: true })
  const poolId = String((extInfo as any)?.address?.poolId ?? '')
  if (!poolId) throw new Error('pool created but poolId missing from SDK response — verify extInfo shape before enabling POOLS_ENABLED')
  return { txId, poolId }
}

/** Load a Keypair from a base58 secret string OR a JSON byte-array string. */
export function keypairFromSecret(secret: string): Keypair {
  const s = secret.trim()
  if (s.startsWith('[')) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(s)))
  const bs58: any = require('bs58')
  const decode = (bs58.default || bs58).decode
  return Keypair.fromSecretKey(new Uint8Array(decode(s)))
}
