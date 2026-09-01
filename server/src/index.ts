// PUDL backend.
//
//   Rivers  — poll Raydium every 30s, apply the MEME LENS, cache + history.
//   Auth    — Google sign-in -> custodial Solana account (deposit & play).
//   Boosts  — the bribe market: creators fund extra yield on their pool.
//   Nets    — cast/harvest/close real CLMM positions, signed server-side.
//   Board   — season leaderboard by real earnings.

import express from 'express'
import cors from 'cors'
import {
  verifyGoogle,
  getOrCreateAccount,
  accountKeypair,
  sessionAccount,
  createSession,
  revokeSession,
  accountBySub,
  accountCount,
  escrowKeypair,
  escrowPubkey,
  type Account,
} from './custody'
import {
  nets,
  saveNets,
  boosts,
  saveBoosts,
  activeBoosts,
  accrueBoosts,
  boostRateForPool,
  claimableBoostSol,
  markBoostClaimedUpTo,
  leaderboard,
  newId,
  homes,
  saveHomes,
  homeOf,
  ensureHome,
  homeStats,
  type Net,
  type Boost,
} from './model'
import { openNet, harvestNet, closeNet, balanceOf, withdrawSol, transferSol, splTokenBalances, createCpmmPool } from './cast'

const PORT = Number(process.env.PORT || 8080)

// Money-moving features that hold or route real user funds stay OFF until a
// funded end-to-end test. Flip on (BOOSTS_ENABLED=1 / POOLS_ENABLED=1) only after
// verifying the escrow + pool-creation paths with real SOL on the live wallet.
const BOOSTS_ENABLED = process.env.BOOSTS_ENABLED === '1'
const POOLS_ENABLED = process.env.POOLS_ENABLED === '1'
const MIN_BOOST_SOL = 0.05

// ---------------------------------------------------------------- rivers + meme lens

const RAYDIUM_URL =
  'https://api-v3.raydium.io/pools/info/list' +
  '?poolType=concentrated&poolSortField=volume24h&sortType=desc&pageSize=100&page=1'

// stable, high-cap symbols that make the "who's actually printing" list boring.
// The meme lens hides these so the map is memecoin rivers, ranked by yield.
const MAJORS = new Set([
  'USDC', 'USDT', 'WSOL', 'SOL', 'USDG', 'USDS', 'PYUSD', 'EURC', 'WBTC', 'WETH',
  'cbBTC', 'JitoSOL', 'JupSOL', 'mSOL', 'bSOL', 'INF', 'jupSOL',
])
const isMajor = (s: string) => MAJORS.has(s)

type Flow = 'FLASH FLOOD' | 'SURGE' | 'FLOWING' | 'CALM'
interface River {
  id: string
  name: string
  symbolA: string
  symbolB: string
  logoA: string | null
  logoB: string | null
  mintA: string
  mintB: string
  price: number
  feeRatePct: number
  tvl: number
  vol24h: number
  fees24h: number
  feesPer1k: number
  boostPerDay: number
  boostPer1k: number
  totalPer1k: number
  flow: Flow
  meme: boolean
  venue: 'raydium' | 'meteora' | 'pumpswap'
  featured?: boolean // the $PUDL flagship river (set once the token launches)
}

// the $PUDL token mint — set at launch. Any pool holding it becomes the flagship
// river (pinned, crowned, and where creator-fee + protocol boosts stack).
const FEATURED_MINT = (process.env.PUDL_MINT || '').trim()
const isFeatured = (mintA: string, mintB: string) =>
  !!FEATURED_MINT && (mintA === FEATURED_MINT || mintB === FEATURED_MINT)
interface Snapshot {
  updatedAt: number
  totalFees24h: number
  totalVol24h: number
  totalBoost: number
  rivers: River[]
}

function classifyFlow(vol: number, tvl: number): Flow {
  if (tvl <= 0) return 'CALM'
  const r = vol / tvl
  if (r > 20) return 'FLASH FLOOD'
  if (r > 5) return 'SURGE'
  if (r > 1) return 'FLOWING'
  return 'CALM'
}

// one place that turns a raw Raydium pool into a River
function mapPool(p: any): River {
  const tvl = Number(p.tvl) || 0
  const vol24h = Number(p.day?.volume) || 0
  const fees24h = Number(p.day?.volumeFee) || 0
  const symbolA = p.mintA?.symbol || '?'
  const symbolB = p.mintB?.symbol || '?'
  const feesPer1k = tvl > 0 ? (fees24h / tvl) * 1000 : 0
  const boostPerDay = boostRateForPool(String(p.id))
  const boostPer1k = tvl > 0 ? (boostPerDay / tvl) * 1000 : 0
  const meme =
    !(isMajor(symbolA) && isMajor(symbolB)) &&
    !(symbolA === 'WSOL' && isMajor(symbolB)) &&
    !(isMajor(symbolA) && symbolB === 'WSOL')
  return {
    id: String(p.id),
    name: `${symbolA}/${symbolB}`,
    symbolA, symbolB,
    logoA: p.mintA?.logoURI || null,
    logoB: p.mintB?.logoURI || null,
    mintA: p.mintA?.address || '',
    mintB: p.mintB?.address || '',
    price: Number(p.price) || 0,
    feeRatePct: (Number(p.feeRate) || 0) * 100,
    tvl, vol24h, fees24h, feesPer1k, boostPerDay, boostPer1k,
    totalPer1k: feesPer1k + boostPer1k,
    flow: classifyFlow(vol24h, tvl),
    meme,
    venue: 'raydium',
    featured: isFeatured(p.mintA?.address || '', p.mintB?.address || ''),
  }
}

// a Meteora DLMM pool -> River (free public API, real 24h vol/fees)
function mapMeteora(p: any): River {
  const symbolA = p.token_x?.symbol || '?'
  const symbolB = p.token_y?.symbol || '?'
  const tvl = Number(p.tvl) || 0
  const vol24h = Number(p.volume?.['24h']) || 0
  const fees24h = Number(p.fees?.['24h']) || 0
  const feesPer1k = tvl > 0 ? (fees24h / tvl) * 1000 : 0
  const id = 'met:' + String(p.address)
  const boostPerDay = boostRateForPool(id)
  const boostPer1k = tvl > 0 ? (boostPerDay / tvl) * 1000 : 0
  const meme =
    !(isMajor(symbolA) && isMajor(symbolB)) &&
    !(symbolA === 'WSOL' && isMajor(symbolB)) &&
    !(isMajor(symbolA) && symbolB === 'WSOL')
  return {
    id,
    name: `${symbolA}/${symbolB}`,
    symbolA, symbolB,
    logoA: p.token_x?.logo || null,
    logoB: p.token_y?.logo || null,
    mintA: p.token_x?.address || '',
    mintB: p.token_y?.address || '',
    price: Number(p.current_price) || 0,
    feeRatePct: (Number(p.dynamic_fee_pct) || 0) * 100,
    tvl, vol24h, fees24h, feesPer1k, boostPerDay, boostPer1k,
    totalPer1k: feesPer1k + boostPer1k,
    flow: classifyFlow(vol24h, tvl),
    meme,
    venue: 'meteora',
    featured: isFeatured(p.token_x?.address || '', p.token_y?.address || ''),
  }
}

// a pump.fun / PumpSwap pool from DexScreener -> River. DexScreener gives real
// volume + liquidity; PumpSwap's LP fee is a known ~0.25%, so LP fee revenue =
// volume × 0.25% is a real figure (same way any pool's fees are computed).
const PUMPSWAP_LP_FEE = 0.0025
function mapDexPumpswap(p: any): River {
  const symbolA = p.baseToken?.symbol || '?'
  const symbolB = p.quoteToken?.symbol || '?'
  const tvl = Number(p.liquidity?.usd) || 0
  const vol24h = Number(p.volume?.h24) || 0
  const fees24h = vol24h * PUMPSWAP_LP_FEE
  const feesPer1k = tvl > 0 ? (fees24h / tvl) * 1000 : 0
  const id = 'pump:' + String(p.pairAddress)
  const meme =
    !(isMajor(symbolA) && isMajor(symbolB)) &&
    !(symbolA === 'WSOL' && isMajor(symbolB)) &&
    !(isMajor(symbolA) && symbolB === 'WSOL')
  return {
    id,
    name: `${symbolA}/${symbolB}`,
    symbolA, symbolB,
    logoA: p.info?.imageUrl || null,
    logoB: null,
    mintA: p.baseToken?.address || '',
    mintB: p.quoteToken?.address || '',
    price: Number(p.priceUsd) || 0,
    feeRatePct: PUMPSWAP_LP_FEE * 100,
    tvl, vol24h, fees24h, feesPer1k, boostPerDay: 0, boostPer1k: 0,
    totalPer1k: feesPer1k,
    flow: classifyFlow(vol24h, tvl),
    meme,
    venue: 'pumpswap',
    featured: isFeatured(p.baseToken?.address || '', p.quoteToken?.address || ''),
  }
}

const METEORA_URL =
  'https://dlmm.datapi.meteora.ag/pools?page=1&page_size=80&sort_by=volume_24h:desc&filter_by=tvl>2000;is_blacklisted=false'

async function fetchMeteora(): Promise<River[]> {
  try {
    const r = await fetch(METEORA_URL)
    if (!r.ok) return []
    const j: any = await r.json()
    const arr: any[] = j?.data ?? []
    return arr.map(mapMeteora).filter((x) => x.tvl >= 1_000 && x.vol24h > 0)
  } catch {
    return []
  }
}

const isBase58Mint = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)

// pools discovered via search that aren't on the main volume page — kept here so
// the 30s poll (which rebuilds snapshot wholesale) doesn't evict them and break
// a cast made moments later.
const knownPools = new Map<string, { river: River; ts: number }>()
const KNOWN_TTL = 10 * 60_000 // searched pools linger 10 min, then drop (avoids frozen-forever numbers)
const KNOWN_CAP = 60

// merge a searched/known pool into the live snapshot so it becomes castable
function upsertRiver(r: River) {
  knownPools.set(r.id, { river: r, ts: Date.now() })
  // LRU-ish cap so /search can't grow it unbounded
  while (knownPools.size > KNOWN_CAP) knownPools.delete(knownPools.keys().next().value as string)
  if (!snapshot) return
  if (!snapshot.rivers.some((x) => x.id === r.id)) snapshot.rivers.push(r)
}

let snapshot: Snapshot | null = null
const history = new Map<string, Array<[number, number, number, number]>>()

async function pollRivers() {
  try {
    const [res, meteora] = await Promise.all([fetch(RAYDIUM_URL), fetchMeteora()])
    if (!res.ok) throw new Error(`raydium ${res.status}`)
    const json: any = await res.json()
    const raw: any[] = json?.data?.data ?? []
    const rivers: River[] = raw
      .map(mapPool)
      .filter((r) => r.tvl >= 1_000 && r.vol24h > 0)
      .concat(meteora) // Meteora DLMM pools alongside Raydium
      // rank by TOTAL yield per $1k parked (fees + boost) — the thing a house
      // player actually cares about, not raw volume
      .sort((a, b) => b.totalPer1k - a.totalPer1k)

    // keep recently-searched pools castable across the wholesale rebuild, but
    // expire them so their (search-time) numbers never linger stale forever
    const now0 = Date.now()
    for (const [id, e] of knownPools) {
      if (now0 - e.ts > KNOWN_TTL) { knownPools.delete(id); continue }
      if (!rivers.some((x) => x.id === id)) rivers.push(e.river)
    }

    snapshot = {
      updatedAt: Date.now(),
      totalFees24h: rivers.reduce((s, r) => s + r.fees24h, 0),
      totalVol24h: rivers.reduce((s, r) => s + r.vol24h, 0),
      totalBoost: activeBoosts().reduce((s, b) => s + (b.totalSol - b.paidSol), 0),
      rivers,
    }
    const now = Date.now()
    for (const r of rivers.slice(0, 80)) {
      const h = history.get(r.id) ?? []
      h.push([now, r.vol24h, r.fees24h, r.tvl])
      if (h.length > 480) h.splice(0, h.length - 480)
      history.set(r.id, h)
    }
  } catch (e: any) {
    console.error('[rivers] poll failed:', String(e?.message ?? e).slice(0, 120))
  }
}

const riverById = (id: string) => snapshot?.rivers.find((r) => r.id === id)

// ---------------------------------------------------------------- app

const app = express()
app.use(cors())
app.use(express.json({ limit: '32kb' }))

function auth(req: express.Request): Account | null {
  return sessionAccount(req.headers.authorization)
}

app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    updatedAt: snapshot?.updatedAt ?? 0,
    accounts: accountCount(),
    boostsEnabled: BOOSTS_ENABLED,
    poolsEnabled: POOLS_ENABLED,
    escrow: escrowPubkey(),
  }),
)

// -------- rivers --------
app.get('/rivers', (req, res) => {
  if (!snapshot) return res.status(503).json({ error: 'warming up' })
  const memeOnly = req.query.all !== '1'
  // the map shows only CASTABLE (Raydium) pools — no dead-end "indexed, not
  // castable" rivers. Meteora / pump.fun pools stay reachable via CA search.
  let rivers = snapshot.rivers.filter((r) => r.venue === 'raydium')
  if (memeOnly) rivers = rivers.filter((r) => r.meme)
  rivers = rivers.slice(0, 60)
  res.setHeader('Cache-Control', 'public, max-age=15')
  res.json({
    ...snapshot,
    rivers,
    totalFees24h: rivers.reduce((s, r) => s + r.fees24h, 0),
    totalVol24h: rivers.reduce((s, r) => s + r.vol24h, 0),
  })
})

app.get('/rivers/history/:poolId', (req, res) => {
  res.json({ points: history.get(String(req.params.poolId)) ?? [] })
})

// -------- search by contract address (mint) --------
// Paste any token CA -> find every pool that token trades in, ranked by yield,
// and fold them into the live set so you can cast a net right there.
app.get('/search', async (req, res) => {
  const mint = String(req.query.mint ?? req.query.ca ?? '').trim()
  if (!isBase58Mint(mint)) return res.status(400).json({ error: 'paste a valid token address' })
  try {
    const url =
      'https://api-v3.raydium.io/pools/info/mint' +
      `?mint1=${mint}&poolType=all&poolSortField=liquidity&sortType=desc&pageSize=16&page=1`
    const metUrl = `https://dlmm.datapi.meteora.ag/pools?query=${mint}&page_size=16&sort_by=volume_24h:desc`
    const dexUrl = `https://api.dexscreener.com/token-pairs/v1/solana/${mint}`
    const [r, mr, dr] = await Promise.all([
      fetch(url),
      fetch(metUrl).catch(() => null),
      fetch(dexUrl).catch(() => null),
    ])
    if (!r.ok) throw new Error(`raydium ${r.status}`)
    const json: any = await r.json()
    const raw: any[] = json?.data?.data ?? json?.data ?? []
    let metRivers: River[] = []
    try {
      if (mr && mr.ok) {
        const mj: any = await mr.json()
        metRivers = (mj?.data ?? [])
          .map(mapMeteora)
          .filter((x: River) => x.tvl > 0 && (x.mintA === mint || x.mintB === mint))
      }
    } catch {}
    let pumpRivers: River[] = []
    try {
      if (dr && dr.ok) {
        const dj: any = await dr.json()
        pumpRivers = (Array.isArray(dj) ? dj : [])
          .filter((p: any) => /pump/i.test(p?.dexId || '')) // pump.fun / PumpSwap only
          .map(mapDexPumpswap)
          .filter((x: River) => x.tvl > 0 && (x.mintA === mint || x.mintB === mint))
      }
    } catch {}
    const rivers = raw
      .map(mapPool)
      .filter((x) => x.tvl > 0 && (x.mintA === mint || x.mintB === mint))
      .concat(metRivers)
      .concat(pumpRivers)
      .sort((a, b) => b.totalPer1k - a.totalPer1k)
    // make them castable/known: fold any we don't already track into the snapshot
    rivers.forEach(upsertRiver)
    // surface the token's own name from whichever side matched
    const hit = raw.find((p) => p.mintA?.address === mint || p.mintB?.address === mint)
    const side = hit && hit.mintA?.address === mint ? hit.mintA : hit?.mintB
    res.json({
      mint,
      token: side ? { symbol: side.symbol || '?', name: side.name || '', logo: side.logoURI || null } : null,
      rivers,
    })
  } catch (e: any) {
    res.status(502).json({ error: String(e?.message ?? e).slice(0, 120) })
  }
})

// -------- auth --------
app.post('/auth/google', async (req, res) => {
  const cred = (req.body ?? {}).credential
  if (typeof cred !== 'string') return res.status(400).json({ error: 'no credential' })
  const g = await verifyGoogle(cred)
  if (!g) return res.status(401).json({ error: 'google verification failed' })
  const acct = getOrCreateAccount(g)
  const token = createSession(acct.sub)
  res.json({ token, ...publicAccount(acct) })
})

// sign out: kill the bearer token server-side (idempotent)
app.post('/auth/logout', (req, res) => {
  revokeSession(req.headers.authorization)
  res.json({ ok: true })
})

function publicAccount(a: Account) {
  return { sub: a.sub, name: a.name, email: a.email, picture: a.picture, pubkey: a.pubkey }
}

app.get('/me', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  let sol = 0
  try {
    sol = await balanceOf(a.pubkey)
  } catch {}
  res.json({ ...publicAccount(a), sol, depositAddress: a.pubkey })
})

// withdraw SOL out of the custodial wallet to any address — funds are always yours
app.post('/withdraw', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const { to, amount } = req.body ?? {}
  if (!isBase58Mint(String(to))) return res.status(400).json({ error: 'enter a valid Solana address' })
  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: 'bad amount' })
  let bal = 0
  try { bal = await balanceOf(a.pubkey) } catch {}
  if (amt > bal - 0.001) return res.status(400).json({ error: 'amount exceeds balance — leave ~0.001 SOL for the network fee' })
  try {
    const sig = await withdrawSol(accountKeypair(a), String(to), amt)
    res.json({ ok: true, sig })
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e).slice(0, 140) })
  }
})

// -------- nets: cast / harvest / close --------
app.get('/nets/mine', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  res.json({ nets: nets.filter((n) => n.sub === a.sub && n.status !== 'closed') })
})

app.post('/nets/cast', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const { poolId, amount, bandPct } = req.body ?? {}
  const river = riverById(String(poolId))
  if (!river) return res.status(400).json({ error: 'unknown river' })
  if (river.venue !== 'raydium')
    return res.status(501).json({ error: `${river.venue} rivers are indexed but not castable yet — casting there is coming` })
  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt < 0.001) return res.status(400).json({ error: 'minimum cast is 0.001 SOL' })
  const band = bandPct === undefined ? 0.15 : Number(bandPct)
  if (!Number.isFinite(band) || band <= 0 || band >= 1) return res.status(400).json({ error: 'band must be between 0 and 1' })
  // don't persist a doomed net if the wallet can't cover it (+ fee headroom)
  let bal = 0
  try { bal = await balanceOf(a.pubkey) } catch {}
  if (amt > bal - 0.002) return res.status(400).json({ error: 'not enough SOL — deposit first (keep ~0.002 for fees)' })

  const home = ensureHome(a.sub, `${a.name}'s pudl`)
  const net: Net = {
    id: newId('net'),
    sub: a.sub,
    homeId: home.id,
    poolId: river.id,
    poolName: river.name,
    positionMint: null,
    amountSol: amt,
    status: 'opening',
    openSig: null,
    castAt: Date.now(),
    closedAt: null,
    feesClaimedSol: 0,
    boostClaimedSol: 0,
    boostAccruedSol: 0,
  }
  nets.push(net)
  saveNets()
  res.json({ ok: true, net })

  // open asynchronously so the UI gets an instant "casting…"
  ;(async () => {
    try {
      const kp = accountKeypair(a)
      const { positionMint, txId } = await openNet(kp, river.id, amt, band)
      net.positionMint = positionMint
      net.openSig = txId
      net.status = 'live'
    } catch (e: any) {
      net.status = 'failed'
      net.openSig = String(e?.message ?? e).slice(0, 140)
      console.error('[cast] open failed:', net.openSig)
    }
    saveNets()
  })()
})

// mix a "confluence": split SOL across 2–4 Raydium rivers as one bundle. Higher
// variance (more coins to hold if any dumps out of range), aggregated fees.
app.post('/nets/mix', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const { amount, legs } = req.body ?? {}
  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt < 0.002) return res.status(400).json({ error: 'minimum mix is 0.002 SOL' })
  if (!Array.isArray(legs) || legs.length < 2 || legs.length > 4) return res.status(400).json({ error: 'pick 2–4 rivers to mix' })
  const resolved = legs.map((l: any) => ({
    river: riverById(String(l?.poolId)),
    weight: Math.max(Number(l?.weight) || 1, 0.0001),
    band: l?.bandPct === undefined ? 0.15 : Number(l.bandPct),
  }))
  if (resolved.some((r) => !r.river)) return res.status(400).json({ error: 'unknown river in the mix' })
  if (resolved.some((r) => r.river!.venue !== 'raydium')) return res.status(501).json({ error: 'only Raydium rivers can be mixed today' })
  if (resolved.some((r) => !(r.band > 0 && r.band < 1))) return res.status(400).json({ error: 'band must be between 0 and 1' })
  let bal = 0
  try { bal = await balanceOf(a.pubkey) } catch {}
  if (amt > bal - 0.003) return res.status(400).json({ error: 'not enough SOL — deposit first (keep ~0.003 for fees)' })

  const home = ensureHome(a.sub, `${a.name}'s pudl`)
  const bundleId = newId('mix')
  const totalW = resolved.reduce((s, r) => s + r.weight, 0)
  const created = resolved.map((r) => {
    const legAmt = Math.round((amt * (r.weight / totalW)) * 1e6) / 1e6
    const net: Net = {
      id: newId('net'), sub: a.sub, homeId: home.id, bundleId,
      poolId: r.river!.id, poolName: r.river!.name, positionMint: null,
      amountSol: legAmt, status: 'opening', openSig: null,
      castAt: Date.now(), closedAt: null, feesClaimedSol: 0, boostClaimedSol: 0, boostAccruedSol: 0,
    }
    nets.push(net)
    return { net, river: r.river!, legAmt, band: r.band }
  })
  saveNets()
  res.json({ ok: true, bundleId, nets: created.map((c) => c.net) })

  // open each leg independently — a stuck leg doesn't block the others
  for (const c of created) {
    ;(async () => {
      try {
        const { positionMint, txId } = await openNet(accountKeypair(a), c.river.id, c.legAmt, c.band)
        c.net.positionMint = positionMint
        c.net.openSig = txId
        c.net.status = 'live'
      } catch (e: any) {
        c.net.status = 'failed'
        c.net.openSig = String(e?.message ?? e).slice(0, 140)
      }
      saveNets()
    })()
  }
})

app.post('/nets/:id/harvest', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const net = nets.find((n) => n.id === req.params.id && n.sub === a.sub)
  if (!net || !net.positionMint) return res.status(404).json({ error: 'net not found' })
  try {
    const { txIds, solDelta } = await harvestNet(accountKeypair(a), net.poolId, net.positionMint)
    // attribute the realized SOL to this net so earnings are a real number
    net.feesClaimedSol += solDelta
    saveNets()
    res.json({ ok: true, txIds, harvestedSol: solDelta })
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e).slice(0, 140) })
  }
})

// clear a failed net out of the player's list (it never opened on-chain)
app.post('/nets/:id/dismiss', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const net = nets.find((n) => n.id === req.params.id && n.sub === a.sub)
  if (!net) return res.status(404).json({ error: 'net not found' })
  if (net.status !== 'failed') return res.status(400).json({ error: 'only failed nets can be dismissed' })
  net.status = 'closed'
  net.closedAt = Date.now()
  saveNets()
  res.json({ ok: true })
})

app.post('/nets/:id/close', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const net = nets.find((n) => n.id === req.params.id && n.sub === a.sub)
  if (!net || !net.positionMint) return res.status(404).json({ error: 'net not found' })
  net.status = 'closing'
  saveNets()
  try {
    await closeNet(accountKeypair(a), net.poolId, net.positionMint)
    net.status = 'closed'
    net.closedAt = Date.now()
    saveNets()
    res.json({ ok: true })
  } catch (e: any) {
    net.status = 'live'
    saveNets()
    res.status(500).json({ error: String(e?.message ?? e).slice(0, 140) })
  }
})

// -------- homes: where your rivers flow --------
app.get('/home/mine', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const home = ensureHome(a.sub, `${a.name}'s pudl`)
  const members = home.members.map((sub) => {
    const acc = accountBySub(sub)
    return { sub, name: acc?.name ?? 'anon', picture: acc?.picture ?? null }
  })
  res.json({ home, members, stats: homeStats(home.id) })
})

app.post('/home/rename', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const home = ensureHome(a.sub, `${a.name}'s pudl`)
  if (home.ownerSub !== a.sub) return res.status(403).json({ error: 'only the owner can rename' })
  const name = String((req.body ?? {}).name ?? '').slice(0, 24).trim()
  if (name) { home.name = name; saveHomes() }
  res.json({ ok: true, home })
})

// open the home up to a crew (co-op) — returns an invite id (the home id)
app.post('/home/open', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const home = ensureHome(a.sub, `${a.name}'s pudl`)
  if (home.ownerSub !== a.sub) return res.status(403).json({ error: 'only the owner' })
  home.kind = 'coop'
  saveHomes()
  res.json({ ok: true, inviteId: home.id })
})

app.post('/home/join/:id', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const target = homes.find((h) => h.id === req.params.id)
  if (!target) return res.status(404).json({ error: 'home not found' })
  if (target.kind !== 'coop') return res.status(400).json({ error: 'this home is not open to a crew' })
  if (target.members.includes(a.sub)) return res.json({ ok: true, already: true })
  // validate BEFORE any mutation, so a rejected join leaves prior state intact
  if (target.members.length >= 12) return res.status(400).json({ error: 'crew is full' })
  // leave the previous home; delete it only if it's now empty
  const prev = homeOf(a.sub)
  if (prev && prev.id !== target.id) {
    prev.members = prev.members.filter((s) => s !== a.sub)
    if (prev.members.length === 0) homes.splice(homes.indexOf(prev), 1)
  }
  target.members.push(a.sub)
  // this member's nets now flow to the home they joined
  let moved = false
  for (const n of nets) if (n.sub === a.sub) { n.homeId = target.id; moved = true }
  if (moved) saveNets()
  saveHomes()
  res.json({ ok: true })
})

app.post('/home/leave', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  const home = homeOf(a.sub)
  if (!home) return res.json({ ok: true })
  home.members = home.members.filter((s) => s !== a.sub)
  if (home.ownerSub === a.sub && home.members.length > 0) home.ownerSub = home.members[0]
  if (home.members.length === 0) homes.splice(homes.indexOf(home), 1)
  saveHomes()
  // land in a fresh solo home and take your nets (and their earnings) with you
  const fresh = ensureHome(a.sub, `${a.name}'s pudl`)
  let moved = false
  for (const n of nets) if (n.sub === a.sub) { n.homeId = fresh.id; moved = true }
  if (moved) saveNets()
  res.json({ ok: true })
})

// world-facing: every home as a glowing node, ranked by what it's pulled in
app.get('/homes', (_req, res) => {
  const rows = homes
    .map((h) => {
      const s = homeStats(h.id)
      const owner = accountBySub(h.ownerSub)
      return {
        id: h.id,
        name: h.name,
        kind: h.kind,
        color: h.color,
        members: h.members.length,
        ownerName: owner?.name ?? 'anon',
        collected: Math.round(s.collected * 100) / 100,
        staked: Math.round(s.staked * 100) / 100,
        live: s.live,
      }
    })
    .sort((a, b) => b.collected - a.collected || b.staked - a.staked)
    .slice(0, 60)
  res.json({ homes: rows })
})

// -------- boosts: fees flow downhill into the rivers --------
// A boost is a REAL pot of SOL escrowed up front and streamed to a pool's live
// LPs over a window (see model.accrueBoosts). Funding is gated behind
// BOOSTS_ENABLED until the escrow path is verified with real SOL.
app.get('/boosts', (req, res) => {
  const a = auth(req)
  const active = activeBoosts()
  const totalSol = active.reduce((s, b) => s + (b.totalSol - b.paidSol), 0)
  res.json({ boosts: active, totalSol, claimable: a ? claimableBoostSol(a.sub) : 0, enabled: BOOSTS_ENABLED })
})

// fund a boost: escrow SOL now, stream it to the pool's LPs over `days`
app.post('/boosts', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  if (!BOOSTS_ENABLED)
    return res.status(503).json({ error: 'boosts open at launch \u2014 funding goes live after the escrow test' })
  const { poolId, amountSol, days, label } = req.body ?? {}
  const river = riverById(String(poolId))
  if (!river) return res.status(400).json({ error: 'unknown river' })
  const amt = Number(amountSol)
  if (!Number.isFinite(amt) || amt < MIN_BOOST_SOL) return res.status(400).json({ error: `minimum boost is ${MIN_BOOST_SOL} SOL` })
  const dur = Math.max(1, Math.min(Number(days) || 7, 90))
  let bal = 0
  try { bal = await balanceOf(a.pubkey) } catch {}
  if (amt > bal - 0.002) return res.status(400).json({ error: 'not enough SOL to fund this boost (keep ~0.002 for fees)' })
  try {
    const sig = await transferSol(accountKeypair(a), escrowPubkey(), amt) // escrow the pot up front
    const now = Date.now()
    const boost: Boost = {
      id: newId('boost'), poolId: river.id, poolName: river.name,
      sponsorSub: a.sub, sponsorLabel: String(label || a.name || 'sponsor').slice(0, 24),
      source: 'sponsor', totalSol: amt, paidSol: 0,
      startAt: now, endAt: now + dur * 86_400_000, lastAccrualAt: now,
    }
    boosts.push(boost)
    saveBoosts()
    res.json({ ok: true, boost, escrowSig: sig })
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e).slice(0, 140) })
  }
})

// claim the boost SOL you've accrued from providing liquidity (escrow -> wallet)
app.post('/boosts/claim', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  accrueBoosts() // settle the stream up to now first
  const owed = claimableBoostSol(a.sub)
  if (owed < 0.0001) return res.json({ ok: true, claimedSol: 0 })
  try {
    const sig = await transferSol(escrowKeypair(), a.pubkey, owed)
    const cleared = markBoostClaimedUpTo(a.sub, owed)
    res.json({ ok: true, claimedSol: cleared, sig })
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e).slice(0, 140) })
  }
})

// -------- create your own river: seed a Raydium pool for any token --------
// SPL tokens the signed-in wallet holds \u2014 the seed side for a new pool
app.get('/tokens', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  try {
    res.json({ tokens: await splTokenBalances(a.pubkey) })
  } catch (e: any) {
    res.status(502).json({ error: String(e?.message ?? e).slice(0, 120) })
  }
})

// seed a brand-new token/SOL pool. Gated behind POOLS_ENABLED until verified.
app.post('/rivers/create', async (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  if (!POOLS_ENABLED)
    return res.status(503).json({ error: 'pool creation opens at launch \u2014 it goes live after the create-pool test' })
  const { tokenMint, tokenAmount, solAmount } = req.body ?? {}
  if (!isBase58Mint(String(tokenMint))) return res.status(400).json({ error: 'paste a valid token address' })
  const tAmt = Number(tokenAmount)
  const sAmt = Number(solAmount)
  if (!Number.isFinite(tAmt) || tAmt <= 0) return res.status(400).json({ error: 'enter how much of the token to seed' })
  if (!Number.isFinite(sAmt) || sAmt <= 0) return res.status(400).json({ error: 'enter how much SOL to seed' })
  let bal = 0
  try { bal = await balanceOf(a.pubkey) } catch {}
  if (sAmt > bal - 0.05) return res.status(400).json({ error: 'not enough SOL \u2014 creating a pool also costs a Raydium fee (~0.15 SOL)' })
  try {
    const { txId, poolId } = await createCpmmPool(accountKeypair(a), String(tokenMint), tAmt, sAmt)
    res.json({ ok: true, txId, poolId })
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e).slice(0, 160) })
  }
})

// -------- leaderboard --------
app.get('/leaderboard', (_req, res) => {
  const rows = leaderboard((sub) => {
    const acc = accountBySub(sub)
    return { name: acc?.name ?? 'anon', picture: acc?.picture ?? null }
  })
  res.json({ season: 1, rows })
})

// -------- stats --------
app.get('/stats', (_req, res) => {
  res.json({
    updatedAt: snapshot?.updatedAt ?? 0,
    totalFees24h: snapshot?.totalFees24h ?? 0,
    totalVol24h: snapshot?.totalVol24h ?? 0,
    activeBoost: activeBoosts().reduce((s, b) => s + (b.totalSol - b.paidSol), 0),
    riversTracked: snapshot?.rivers.filter((r) => r.meme).length ?? 0,
    accounts: accountCount(),
    netsLive: nets.filter((n) => n.status === 'live').length,
  })
})

pollRivers()
setInterval(pollRivers, 30_000)
// settle boost streams onto live LPs once a minute so accrual stays current
setInterval(() => {
  try { accrueBoosts() } catch (e: any) { console.error('[boosts] accrue failed:', String(e?.message ?? e).slice(0, 120)) }
}, 60_000).unref?.()
app.listen(PORT, () => console.log(`[pudl] backend on :${PORT}`))
