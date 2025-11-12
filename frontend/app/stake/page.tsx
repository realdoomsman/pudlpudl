'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

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
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
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
      }
    } catch (error) {
      console.error('Error fetching user stake:', error)
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
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Stake $PUDL</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">Total Staked</p>
            <p className="text-3xl font-bold">{(stats.totalStaked / 1_000_000).toLocaleString()} $PUDL</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">Current APR</p>
            <p className="text-3xl font-bold text-green-600">{stats.apr}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <p className="text-sm text-gray-600 mb-2">Total Stakers</p>
            <p className="text-3xl font-bold">{stats.stakerCount}</p>
          </div>
        </div>

        {connected && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Your Stake</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Staked Amount</p>
                  <p className="text-2xl font-bold">{(userStake / 1_000_000).toLocaleString()} $PUDL</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Tier</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">Tier {userTier}</span>
                    <span className="text-sm bg-pudl-aqua/20 text-pudl-aqua px-2 py-1 rounded">
                      {getTierBenefits(userTier).discount} fee discount
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Rewards</p>
                  <p className="text-2xl font-bold text-green-600">{pendingRewards.toFixed(2)} $PUDL</p>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={loading || pendingRewards === 0}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Claim Rewards
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">Stake / Unstake</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stake Amount</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pudl-aqua"
                  />
                  <button
                    onClick={handleStake}
                    disabled={loading || !stakeAmount}
                    className="w-full mt-2 bg-pudl-aqua text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Stake
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Unstake Amount</label>
                  <input
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pudl-aqua"
                  />
                  <button
                    onClick={handleUnstake}
                    disabled={loading || !unstakeAmount}
                    className="w-full mt-2 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Unstake
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Tier Benefits</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((tier) => {
              const benefits = getTierBenefits(tier)
              return (
                <div
                  key={tier}
                  className={`p-4 rounded-lg border-2 ${
                    tier === userTier
                      ? 'border-pudl-aqua bg-pudl-aqua/10'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-lg font-bold mb-2">Tier {tier}</div>
                  <div className="text-sm text-gray-600 mb-2">{benefits.requirement}</div>
                  <div className="text-sm font-medium text-pudl-aqua">{benefits.discount}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
