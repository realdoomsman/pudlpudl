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

import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import {
  Raydium,
  TxVersion,
  TickUtil,
  LiquidityMathUtil,
  CLMM_PROGRAM_ID,
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

export function balanceOf(pubkey: string): Promise<number> {
  return connection.getBalance(new PublicKey(pubkey)).then((l) => l / 1e9)
}
