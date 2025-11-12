// Supabase client for social features
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface UserProfile {
  wallet_address: string
  display_name?: string
  avatar_url?: string
  bio?: string
  twitter?: string
  discord?: string
  created_at: string
  updated_at: string
}

export interface Follow {
  follower_address: string
  following_address: string
  created_at: string
}

export interface Trade {
  id: string
  wallet_address: string
  from_token: string
  to_token: string
  from_amount: number
  to_amount: number
  tx_signature: string
  timestamp: string
  price_impact: number
  slippage: number
}

export interface PoolActivity {
  id: string
  wallet_address: string
  pool_address: string
  action: 'add_liquidity' | 'remove_liquidity' | 'swap'
  token_a: string
  token_b: string
  amount_a: number
  amount_b: number
  tx_signature: string
  timestamp: string
}

// User Profile Functions
export async function getUserProfile(walletAddress: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function createOrUpdateProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile, { onConflict: 'wallet_address' })
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

// Follow Functions
export async function followUser(followerAddress: string, followingAddress: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .insert({
      follower_address: followerAddress,
      following_address: followingAddress
    })

  if (error) {
    console.error('Error following user:', error)
    return false
  }

  return true
}

export async function unfollowUser(followerAddress: string, followingAddress: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_address', followerAddress)
    .eq('following_address', followingAddress)

  if (error) {
    console.error('Error unfollowing user:', error)
    return false
  }

  return true
}

export async function getFollowers(walletAddress: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_address')
    .eq('following_address', walletAddress)

  if (error) {
    console.error('Error fetching followers:', error)
    return []
  }

  return data.map(f => f.follower_address)
}

export async function getFollowing(walletAddress: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_address')
    .eq('follower_address', walletAddress)

  if (error) {
    console.error('Error fetching following:', error)
    return []
  }

  return data.map(f => f.following_address)
}

export async function isFollowing(followerAddress: string, followingAddress: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_address', followerAddress)
    .eq('following_address', followingAddress)
    .single()

  return !error && data !== null
}

// Trade History Functions
export async function recordTrade(trade: Omit<Trade, 'id' | 'timestamp'>): Promise<Trade | null> {
  const { data, error } = await supabase
    .from('trades')
    .insert(trade)
    .select()
    .single()

  if (error) {
    console.error('Error recording trade:', error)
    return null
  }

  return data
}

export async function getUserTrades(walletAddress: string, limit: number = 50): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching trades:', error)
    return []
  }

  return data
}

export async function getRecentTrades(limit: number = 100): Promise<Trade[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent trades:', error)
    return []
  }

  return data
}

// Leaderboard Functions
export async function getTopTraders(limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('wallet_address, from_amount, to_amount')
    .order('timestamp', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('Error fetching top traders:', error)
    return []
  }

  // Calculate total volume per wallet
  const volumeByWallet = data.reduce((acc: any, trade) => {
    if (!acc[trade.wallet_address]) {
      acc[trade.wallet_address] = 0
    }
    acc[trade.wallet_address] += trade.from_amount
    return acc
  }, {})

  // Sort and return top traders
  return Object.entries(volumeByWallet)
    .map(([wallet, volume]) => ({ wallet_address: wallet, total_volume: volume }))
    .sort((a: any, b: any) => b.total_volume - a.total_volume)
    .slice(0, limit)
}

// Pool Activity Functions
export async function recordPoolActivity(activity: Omit<PoolActivity, 'id' | 'timestamp'>): Promise<PoolActivity | null> {
  const { data, error } = await supabase
    .from('pool_activities')
    .insert(activity)
    .select()
    .single()

  if (error) {
    console.error('Error recording pool activity:', error)
    return null
  }

  return data
}

export async function getPoolActivities(poolAddress: string, limit: number = 50): Promise<PoolActivity[]> {
  const { data, error } = await supabase
    .from('pool_activities')
    .select('*')
    .eq('pool_address', poolAddress)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching pool activities:', error)
    return []
  }

  return data
}
