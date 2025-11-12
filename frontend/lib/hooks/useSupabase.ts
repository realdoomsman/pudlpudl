// React hooks for Supabase social features
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  getUserProfile,
  createOrUpdateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  getUserTrades,
  getTopTraders,
  UserProfile,
  Trade
} from '../supabase'

export function useUserProfile(walletAddress?: string) {
  const { publicKey } = useWallet()
  const address = walletAddress || publicKey?.toString()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setProfile(null)
      setLoading(false)
      return
    }

    loadProfile()
  }, [address])

  const loadProfile = async () => {
    if (!address) return

    try {
      setLoading(true)
      const data = await getUserProfile(address)
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!address) return false

    try {
      const updated = await createOrUpdateProfile({
        wallet_address: address,
        ...updates
      })
      
      if (updated) {
        setProfile(updated)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    }
  }

  return { profile, loading, updateProfile, reload: loadProfile }
}

export function useFollowSystem(targetWalletAddress?: string) {
  const { publicKey } = useWallet()
  const [followers, setFollowers] = useState<string[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [isFollowingTarget, setIsFollowingTarget] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (targetWalletAddress) {
      loadFollowData()
    }
  }, [targetWalletAddress, publicKey])

  const loadFollowData = async () => {
    if (!targetWalletAddress) return

    try {
      setLoading(true)
      const [followersList, followingList] = await Promise.all([
        getFollowers(targetWalletAddress),
        getFollowing(targetWalletAddress)
      ])

      setFollowers(followersList)
      setFollowing(followingList)

      if (publicKey) {
        const following = await isFollowing(publicKey.toString(), targetWalletAddress)
        setIsFollowingTarget(following)
      }
    } catch (error) {
      console.error('Error loading follow data:', error)
    } finally {
      setLoading(false)
    }
  }

  const follow = async () => {
    if (!publicKey || !targetWalletAddress) return false

    const success = await followUser(publicKey.toString(), targetWalletAddress)
    if (success) {
      setIsFollowingTarget(true)
      setFollowers([...followers, publicKey.toString()])
    }
    return success
  }

  const unfollow = async () => {
    if (!publicKey || !targetWalletAddress) return false

    const success = await unfollowUser(publicKey.toString(), targetWalletAddress)
    if (success) {
      setIsFollowingTarget(false)
      setFollowers(followers.filter(f => f !== publicKey.toString()))
    }
    return success
  }

  return {
    followers,
    following,
    isFollowingTarget,
    loading,
    follow,
    unfollow,
    reload: loadFollowData
  }
}

export function useTradeHistory(walletAddress?: string, limit: number = 50) {
  const { publicKey } = useWallet()
  const address = walletAddress || publicKey?.toString()
  
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      loadTrades()
    }
  }, [address, limit])

  const loadTrades = async () => {
    if (!address) return

    try {
      setLoading(true)
      const data = await getUserTrades(address, limit)
      setTrades(data)
    } catch (error) {
      console.error('Error loading trades:', error)
    } finally {
      setLoading(false)
    }
  }

  return { trades, loading, reload: loadTrades }
}

export function useLeaderboard(limit: number = 10) {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [limit])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const data = await getTopTraders(limit)
      setLeaderboard(data)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return { leaderboard, loading, reload: loadLeaderboard }
}
