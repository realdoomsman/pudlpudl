// Client for the PUDL backend. One base URL, one bearer token (from Google
// sign-in), typed helpers. Everything the world UI needs.

import type { River, RiversSnapshot } from '@/lib/rivers'

const BASE =
  process.env.NEXT_PUBLIC_PUDL_API_URL || 'https://pudl-production.up.railway.app'

const TOKEN_KEY = 'pudl_token'
export const getToken = () =>
  typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) => {
  if (typeof window === 'undefined') return
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as any).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface Me {
  sub: string
  name: string
  email: string
  picture: string | null
  pubkey: string
  sol: number
  depositAddress: string
}

export interface MyNet {
  id: string
  homeId: string
  bundleId?: string
  poolId: string
  poolName: string
  positionMint: string | null
  amountSol: number
  status: 'opening' | 'live' | 'closing' | 'closed' | 'failed'
  openSig: string | null
  castAt: number
  feesClaimedSol: number
  boostClaimedSol: number
  boostAccruedSol: number
}

export interface Home {
  id: string
  name: string
  ownerSub: string
  members: string[]
  kind: 'solo' | 'coop'
  color: string
}
export interface HomeMine {
  home: Home
  members: { sub: string; name: string; picture: string | null }[]
  stats: { collected: number; staked: number; live: number; nets: number; contributions: { sub: string; amt: number }[] }
}
export interface HomeRow {
  id: string
  name: string
  kind: 'solo' | 'coop'
  color: string
  members: number
  ownerName: string
  collected: number
  staked: number
  live: number
}

export interface Boost {
  id: string
  poolId: string
  poolName: string
  sponsorLabel: string
  source: 'creator' | 'protocol' | 'sponsor'
  totalSol: number
  paidSol: number
  startAt: number
  endAt: number
}

export interface TokenBal {
  mint: string
  amount: number
  decimals: number
}

export interface LeaderRow {
  sub: string
  name: string
  picture: string | null
  casts: number
  pools: number
  earnedSol: number
}

export interface SearchResult {
  mint: string
  token: { symbol: string; name: string; logo: string | null } | null
  rivers: River[]
}

export const pudl = {
  base: BASE,
  rivers: (all = false) => api<RiversSnapshot>(`/rivers${all ? '?all=1' : ''}`),
  search: (mint: string) => api<SearchResult>(`/search?mint=${encodeURIComponent(mint)}`),
  loginGoogle: (credential: string) =>
    api<Me & { token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  me: () => api<Me>('/me'),
  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  withdraw: (to: string, amount: number) =>
    api<{ ok: boolean; sig: string }>('/withdraw', { method: 'POST', body: JSON.stringify({ to, amount }) }),
  myNets: () => api<{ nets: MyNet[] }>('/nets/mine'),
  cast: (poolId: string, amount: number, bandPct = 0.15) =>
    api<{ ok: boolean; net: MyNet }>('/nets/cast', {
      method: 'POST',
      body: JSON.stringify({ poolId, amount, bandPct }),
    }),
  mix: (amount: number, legs: { poolId: string; weight: number; bandPct?: number }[]) =>
    api<{ ok: boolean; bundleId: string; nets: MyNet[] }>('/nets/mix', {
      method: 'POST',
      body: JSON.stringify({ amount, legs }),
    }),
  harvest: (id: string) => api<{ ok: boolean; harvestedSol?: number }>(`/nets/${id}/harvest`, { method: 'POST' }),
  close: (id: string) => api<{ ok: boolean }>(`/nets/${id}/close`, { method: 'POST' }),
  dismiss: (id: string) => api<{ ok: boolean }>(`/nets/${id}/dismiss`, { method: 'POST' }),
  homeMine: () => api<HomeMine>('/home/mine'),
  homeRename: (name: string) => api<{ ok: boolean }>('/home/rename', { method: 'POST', body: JSON.stringify({ name }) }),
  homeOpen: () => api<{ ok: boolean; inviteId: string }>('/home/open', { method: 'POST' }),
  homeJoin: (id: string) => api<{ ok: boolean }>(`/home/join/${id}`, { method: 'POST' }),
  homeLeave: () => api<{ ok: boolean }>('/home/leave', { method: 'POST' }),
  homes: () => api<{ homes: HomeRow[] }>('/homes'),
  boosts: () =>
    api<{ boosts: Boost[]; totalSol: number; claimable: number; enabled: boolean }>('/boosts'),
  // fund a boost: escrow SOL now, streamed to the pool's LPs over `days`
  boost: (poolId: string, amountSol: number, days: number, label: string) =>
    api<{ ok: boolean; escrowSig?: string }>('/boosts', {
      method: 'POST',
      body: JSON.stringify({ poolId, amountSol, days, label }),
    }),
  // claim the boost SOL you've accrued (escrow -> your wallet)
  claimBoost: () => api<{ ok: boolean; claimedSol: number; sig?: string }>('/boosts/claim', { method: 'POST' }),
  // SPL tokens your wallet holds — the seed side for a new pool
  tokens: () => api<{ tokens: TokenBal[] }>('/tokens'),
  // seed a brand-new token/SOL river
  createPool: (tokenMint: string, tokenAmount: number, solAmount: number) =>
    api<{ ok: boolean; txId?: string; poolId?: string }>('/rivers/create', {
      method: 'POST',
      body: JSON.stringify({ tokenMint, tokenAmount, solAmount }),
    }),
  leaderboard: () => api<{ season: number; rows: LeaderRow[] }>('/leaderboard'),
}
