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
  type Account,
} from './custody'
import {
  nets,
  saveNets,
  boosts,
  saveBoosts,
  activeBoosts,
  boostRateForPool,
  leaderboard,
  newId,
  homes,
  saveHomes,
  homeOf,
  ensureHome,
  homeStats,
  type Net,
} from './model'
import { openNet, harvestNet, closeNet, balanceOf, withdrawSol } from './cast'

const PORT = Number(process.env.PORT || 8080)

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
}
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
const knownPools = new Map<string, River>()

// merge a searched/known pool into the live snapshot so it becomes castable
function upsertRiver(r: River) {
  knownPools.set(r.id, r)
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

    // keep searched/known pools castable across the wholesale rebuild
    for (const [id, r] of knownPools) {
      if (!rivers.some((x) => x.id === id)) rivers.push(r)
    }

    snapshot = {
      updatedAt: Date.now(),
      totalFees24h: rivers.reduce((s, r) => s + r.fees24h, 0),
      totalVol24h: rivers.reduce((s, r) => s + r.vol24h, 0),
      totalBoost: activeBoosts().reduce((s, b) => s + (b.totalUsd - b.paidUsd), 0),
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
  res.json({ ok: true, updatedAt: snapshot?.updatedAt ?? 0, accounts: accountCount() }),
)

// -------- rivers --------
app.get('/rivers', (req, res) => {
  if (!snapshot) return res.status(503).json({ error: 'warming up' })
  const memeOnly = req.query.all !== '1'
  const rivers = memeOnly ? snapshot.rivers.filter((r) => r.meme) : snapshot.rivers
  res.setHeader('Cache-Control', 'public, max-age=15')
  res.json({ ...snapshot, rivers: rivers.slice(0, 60) })
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
    const [r, mr] = await Promise.all([fetch(url), fetch(metUrl).catch(() => null)])
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
    const rivers = raw
      .map(mapPool)
      .filter((x) => x.tvl > 0 && (x.mintA === mint || x.mintB === mint))
      .concat(metRivers)
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

// -------- boosts: the bribe market --------
app.get('/boosts', (_req, res) => {
  res.json({ boosts: activeBoosts(), total: activeBoosts().reduce((s, b) => s + (b.totalUsd - b.paidUsd), 0) })
})

// Creating a boost would mean escrowing real funds from the sponsor and
// streaming them to LPs. That escrow + settlement path isn't built yet, so we
// refuse rather than record a boost nobody funded (which would fabricate yield
// and corrupt the river ranking). The GET side stays live and simply reports no
// active boosts until this lands.
app.post('/boosts', (req, res) => {
  const a = auth(req)
  if (!a) return res.status(401).json({ error: 'sign in' })
  return res.status(501).json({ error: 'boost funding is not live yet' })
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
    activeBoost: activeBoosts().reduce((s, b) => s + (b.totalUsd - b.paidUsd), 0),
    riversTracked: snapshot?.rivers.filter((r) => r.meme).length ?? 0,
    accounts: accountCount(),
    netsLive: nets.filter((n) => n.status === 'live').length,
  })
})

pollRivers()
setInterval(pollRivers, 30_000)
app.listen(PORT, () => console.log(`[pudl] backend on :${PORT}`))
