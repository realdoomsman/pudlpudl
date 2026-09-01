// Persisted game state: nets (positions cast through PUDL), boosts (creator
// bribes on pools), and the season leaderboard derived from them. Plain-JSON,
// atomic writes, safe to restart at any moment.

import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
fs.mkdirSync(DATA_DIR, { recursive: true })

function loadJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) as T
  } catch {
    return fallback
  }
}
const writers = new Map<string, ReturnType<typeof setTimeout>>()
const pending = new Map<string, unknown>() // file -> latest data awaiting flush

function flush(file: string) {
  const data = pending.get(file)
  pending.delete(file)
  const t = writers.get(file)
  if (t) clearTimeout(t)
  writers.delete(file)
  if (data === undefined) return
  try {
    const p = path.join(DATA_DIR, file)
    fs.writeFileSync(p + '.tmp', JSON.stringify(data))
    fs.renameSync(p + '.tmp', p)
  } catch (e: any) {
    console.error(`[persist] failed to write ${file}:`, String(e?.message ?? e).slice(0, 120))
  }
}

function saveJson(file: string, data: unknown) {
  pending.set(file, data) // always keep the latest snapshot for this file
  if (writers.has(file)) return
  writers.set(file, setTimeout(() => flush(file), 200))
}

// Never lose a committed write on shutdown: drain everything synchronously.
function drainAll() {
  for (const file of [...pending.keys()]) flush(file)
}
process.on('SIGINT', () => { drainAll(); process.exit(0) })
process.on('SIGTERM', () => { drainAll(); process.exit(0) })
process.on('beforeExit', drainAll)

// ------------------------------------------------------------------ homes

// A home is where a player's rivers flow. Solo = one owner. Co-op = a crew
// that pools nets into one home and splits the take by what each put in.
export interface Home {
  id: string
  name: string
  ownerSub: string
  members: string[] // subs (includes owner)
  kind: 'solo' | 'coop'
  createdAt: number
  color: string // the home's glow, for the world
}

export const homes: Home[] = loadJson<Home[]>('homes.json', [])
export const saveHomes = () => saveJson('homes.json', homes)

const HOME_COLORS = ['#14F195', '#57ecff', '#ffd166', '#ff7ac2', '#b388ff', '#9dff6b', '#ff9d5c']

export function homeOf(sub: string): Home | undefined {
  return homes.find((h) => h.members.includes(sub))
}

export function ensureHome(sub: string, name: string): Home {
  let h = homeOf(sub)
  if (!h) {
    h = {
      id: newId('home'),
      name: (name || 'my home').slice(0, 24),
      ownerSub: sub,
      members: [sub],
      kind: 'solo',
      createdAt: Date.now(),
      color: HOME_COLORS[homes.length % HOME_COLORS.length],
    }
    homes.push(h)
    saveHomes()
  }
  return h
}

// ------------------------------------------------------------------ nets

export interface Net {
  id: string
  sub: string // owner account
  homeId: string // the home this net's fees flow to
  poolId: string
  poolName: string
  positionMint: string | null
  amountSol: number // SOL they cast into the pool
  status: 'opening' | 'live' | 'closing' | 'closed' | 'failed'
  openSig: string | null
  castAt: number
  closedAt: number | null
  feesClaimedSol: number // real trading fees harvested, measured in SOL
  boostClaimedSol: number // boost rewards harvested, measured in SOL
}

/** Everything a home has pulled in (across all its members' nets), in SOL. */
export function homeStats(homeId: string) {
  const hn = nets.filter((n) => n.homeId === homeId && n.status !== 'failed')
  const collected = hn.reduce((s, n) => s + n.feesClaimedSol + n.boostClaimedSol, 0)
  const staked = hn.filter((n) => n.status === 'live' || n.status === 'opening').reduce((s, n) => s + n.amountSol, 0)
  const live = hn.filter((n) => n.status === 'live').length
  // per-member contribution (of live+opening stake)
  const byMember = new Map<string, number>()
  for (const n of hn) {
    if (n.status === 'live' || n.status === 'opening') byMember.set(n.sub, (byMember.get(n.sub) || 0) + n.amountSol)
  }
  return { collected, staked, live, nets: hn.length, contributions: [...byMember.entries()].map(([sub, amt]) => ({ sub, amt })) }
}

export const nets: Net[] = loadJson<Net[]>('nets.json', [])
export const saveNets = () => saveJson('nets.json', nets)

// ------------------------------------------------------------------ boosts

// A boost is a bribe a creator places on a pool: a pot of value paid out to
// LPs providing liquidity to that pool, streamed over a window.
export interface Boost {
  id: string
  poolId: string
  poolName: string
  sponsorSub: string | null // account that funded it (creator)
  sponsorLabel: string // display: token symbol or wallet-short
  totalUsd: number // size of the bribe
  paidUsd: number // streamed out so far
  startAt: number
  endAt: number
}

export const boosts: Boost[] = loadJson<Boost[]>('boosts.json', [])
export const saveBoosts = () => saveJson('boosts.json', boosts)

/** Boost still live and with budget left. */
export function activeBoosts(now = Date.now()): Boost[] {
  return boosts.filter((b) => b.endAt > now && b.paidUsd < b.totalUsd)
}

/** Remaining boost /day being offered on a pool right now. Never advertises a
 * rate above the actual remaining budget (a sub-day boost pays out its rest,
 * not a 20x-annualized figure). */
export function boostRateForPool(poolId: string, now = Date.now()): number {
  let perDay = 0
  for (const b of activeBoosts(now)) {
    if (b.poolId !== poolId) continue
    const remaining = b.totalUsd - b.paidUsd
    const daysLeft = (b.endAt - now) / 86_400_000
    perDay += daysLeft >= 1 ? remaining / daysLeft : remaining
  }
  return perDay
}

// ------------------------------------------------------------- leaderboard

export interface LeaderRow {
  sub: string
  name: string
  picture: string | null
  casts: number
  pools: number
  earnedSol: number // fees + boosts claimed, in SOL
}

export function leaderboard(
  nameLookup: (sub: string) => { name: string; picture: string | null },
): LeaderRow[] {
  const real = nets.filter((n) => n.status !== 'failed') // failed casts never happened
  const by = new Map<string, LeaderRow>()
  for (const n of real) {
    const row =
      by.get(n.sub) ??
      (() => {
        const who = nameLookup(n.sub)
        const r: LeaderRow = {
          sub: n.sub,
          name: who.name,
          picture: who.picture,
          casts: 0,
          pools: 0,
          earnedSol: 0,
        }
        by.set(n.sub, r)
        return r
      })()
    row.casts += 1
    row.earnedSol += n.feesClaimedSol + n.boostClaimedSol
  }
  // distinct pools per player
  const poolsBy = new Map<string, Set<string>>()
  for (const n of real) {
    const s = poolsBy.get(n.sub) ?? new Set<string>()
    s.add(n.poolId)
    poolsBy.set(n.sub, s)
  }
  for (const [sub, set] of poolsBy) {
    const r = by.get(sub)
    if (r) r.pools = set.size
  }
  return [...by.values()]
    .map((r) => ({ ...r, earnedSol: Math.round(r.earnedSol * 1e6) / 1e6 }))
    .sort((a, b) => b.earnedSol - a.earnedSol || b.casts - a.casts)
    .slice(0, 100)
}

export function newId(prefix: string): string {
  // time-free id (avoids Date.now determinism concerns elsewhere; fine here)
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}
