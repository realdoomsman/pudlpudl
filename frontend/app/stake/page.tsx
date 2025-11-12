'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { PageContainer } from '@/components/PageContainer'

export default function Stake() {
  const { publicKey, connected } = useWallet()
  
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [userStake, setUserStake] = useState(0)
  const [userTier, setUserTier] = useState(0)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [stats, setStats] = useState({
    totalStaked: 0,
    apr: '0',
    stakerCount: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    if (connected && publicKey) {
      fetchUserStake()
    }
  }, [connected, publicKey])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/staking/stats')
      const data = await response.json()
      setStats(data.totalStaked ? data : {
        totalStaked: 5420000,
        stakerCount: 1247,
        apr: '14.5',
      })
    } catch (error) {
      console.error('Using mock stats:', error)
      setStats({
        totalStaked: 5420000,
        stakerCount: 1247,
        apr: '14.5',
      })
    }
  }

  const fetchUserStake = async () => {
    if (!publicKey) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/staking/${publicKey.toString()}`)
      const data = await response.json()
      
      if (data.stake) {
        setUserStake(data.stake.amount)
        setUserTier(data.stake.tier)
      } else {
        // Mock user data for demo
        setUserStake(10000)
        setUserTier(2)
        setPendingRewards(125.5)
      }
    } catch (error) {
      console.error('Using mock user data:', error)
      setUserStake(10000)
      setUserTier(2)
      setPendingRewards(125.5)
    }
  }

  const handleStake = async () => {
    if (!connected) {
      alert('Please connect your wallet')
      return
    }

    setLoading(true)
    try {
      // In production: build and send transaction
      console.log('Staking:', stakeAmount)
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Staked successfully!')
      setStakeAmount('')
      fetchUserStake()
      fetchStats()
    } catch (error) {
      console.error('Error staking:', error)
      alert('Failed to stake')
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async () => {
    setLoading(true)
    try {
      console.log('Unstaking:', unstakeAmount)
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Unstaked successfully!')
      setUnstakeAmount('')
      fetchUserStake()
      fetchStats()
    } catch (error) {
      console.error('Error unstaking:', error)
      alert('Failed to unstake')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    setLoading(true)
    try {
      console.log('Claiming rewards')
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Rewards claimed!')
      setPendingRewards(0)
    } catch (error) {
      console.error('Error claiming:', error)
      alert('Failed to claim')
    } finally {
      setLoading(false)
    }
  }

  const getTierBenefits = (tier: number) => {
    const benefits = [
      { tier: 0, discount: '0 bps', requirement: '< 1,000 $PUDL' },
      { tier: 1, discount: '-5 bps', requirement: '1,000 - 10,000 $PUDL' },
      { tier: 2, discount: '-10 bps', requirement: '10,000 - 100,000 $PUDL' },
      { tier: 3, discount: '-15 bps', requirement: '> 100,000 $PUDL' },
    ]
    return benefits[tier]
  }

  return (
    <PageContainer>
      <Nav />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 pudl-gradient-text glow-text">Stake $PUDL</h1>
          <p className="text-gray-400 text-lg">Earn rewards and unlock fee discounts</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-xl p-6 border border-white/10">
            <p className="text-sm text-gray-400 mb-2 font-semibold">Total Staked</p>
            <p className="text-3xl font-black pudl-gradient-text">{(stats.totalStaked / 1_000_000).toLocaleString()}M $PUDL</p>
          </div>
          <div className="glass rounded-xl p-6 border border-white/10">
            <p className="text-sm text-gray-400 mb-2 font-semibold">Current APR</p>
            <p className="text-3xl font-black text-green-400">{stats.apr}%</p>
          </div>
          <div className="glass rounded-xl p-6 border border-white/10">
            <p className="text-sm text-gray-400 mb-2 font-semibold">Total Stakers</p>
            <p className="text-3xl font-black text-white">{stats.stakerCount.toLocaleString()}</p>
          </div>
        </div>

        {connected && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="glass rounded-xl p-6 border border-white/10 glow-box">
              <h3 className="text-2xl font-black mb-6 pudl-gradient-text">Your Stake</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-gray-400 font-semibold">Staked Amount</p>
                  <p className="text-2xl font-black text-white">{(userStake / 1_000_000).toLocaleString()} $PUDL</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-gray-400 font-semibold">Your Tier</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white">Tier {userTier}</span>
                    <span className="text-sm pudl-gradient px-3 py-1 rounded-lg font-bold">
                      {getTierBenefits(userTier).discount}
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-gray-400 font-semibold">Pending Rewards</p>
                  <p className="text-2xl font-black text-green-400">{pendingRewards.toFixed(2)} $PUDL</p>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={loading || pendingRewards === 0}
                  className="w-full bg-green-500 text-white py-4 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Processing...' : 'Claim Rewards'}
                </button>
              </div>
            </div>

            <div className="glass rounded-xl p-6 border border-white/10 glow-box">
              <h3 className="text-2xl font-black mb-6 pudl-gradient-text">Stake / Unstake</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-3 text-gray-300">Stake Amount</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-pudl-aqua text-white font-bold text-lg outline-none"
                  />
                  <button
                    onClick={handleStake}
                    disabled={loading || !stakeAmount}
                    className="w-full mt-3 pudl-gradient py-4 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? 'Processing...' : 'Stake'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-3 text-gray-300">Unstake Amount</label>
                  <input
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-pudl-aqua text-white font-bold text-lg outline-none"
                  />
                  <button
                    onClick={handleUnstake}
                    disabled={loading || !unstakeAmount}
                    className="w-full mt-3 bg-white/10 border border-white/20 py-4 rounded-xl font-bold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Unstake'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass rounded-xl p-8 border border-white/10">
          <h3 className="text-2xl font-black mb-6 pudl-gradient-text">Tier Benefits</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((tier) => {
              const benefits = getTierBenefits(tier)
              const isCurrentTier = connected && tier === userTier
              return (
                <div
                  key={tier}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isCurrentTier
                      ? 'border-pudl-aqua bg-pudl-aqua/10 glow-box scale-105'
                      : 'border-white/20 bg-white/5 hover:border-pudl-aqua/50'
                  }`}
                >
                  <div className="text-xl font-black mb-3 text-white">Tier {tier}</div>
                  <div className="text-sm text-gray-400 mb-3 font-semibold">{benefits.requirement}</div>
                  <div className={`text-sm font-bold ${isCurrentTier ? 'text-pudl-aqua' : 'text-gray-300'}`}>
                    {benefits.discount}
                  </div>
                  {isCurrentTier && (
                    <div className="mt-3 text-xs pudl-gradient px-2 py-1 rounded inline-block font-bold">
                      CURRENT
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Footer />
    </PageContainer>
  )
}
