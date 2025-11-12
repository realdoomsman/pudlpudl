'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { PageContainer } from '@/components/PageContainer'
import { useStaking } from '@/lib/hooks/useStaking'

export default function Stake() {
  const { connected } = useWallet()
  const { stakingInfo, stake: stakeTokens, unstake: unstakeTokens, claimRewards: claimStakingRewards } = useStaking()
  
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const stats = {
    totalStaked: stakingInfo?.totalStaked || 5420000,
    stakerCount: 1247,
    apr: stakingInfo?.apr.toString() || '10.5',
  }

  const userStake = stakingInfo?.userStaked || 0
  const userTier = stakingInfo?.tier || 0
  const pendingRewards = stakingInfo?.pendingRewards || 0

  const handleStake = async () => {
    if (!connected) {
      alert('Please connect your wallet')
      return
    }

    setLoading(true)
    try {
      await stakeTokens(parseFloat(stakeAmount))
      alert('Staked successfully!')
      setStakeAmount('')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to stake')
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async () => {
    setLoading(true)
    try {
      await unstakeTokens(parseFloat(unstakeAmount))
      alert('Unstaked successfully!')
      setUnstakeAmount('')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to unstake')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    setLoading(true)
    try {
      await claimStakingRewards()
      alert('Rewards claimed!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to claim')
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
          <h1 className="text-5xl font-bold mb-4 text-white">Stake PUDL</h1>
          <p className="text-gray-400 text-lg">Earn rewards and unlock fee discounts</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-2">Total Staked</p>
            <p className="text-3xl font-bold text-white">{(stats.totalStaked / 1_000_000).toLocaleString()}M PUDL</p>
          </div>
          <div className="card rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-2">Current APR</p>
            <p className="text-3xl font-bold text-pudl-green">{stats.apr}%</p>
          </div>
          <div className="card rounded-xl p-6">
            <p className="text-sm text-gray-400 mb-2">Total Stakers</p>
            <p className="text-3xl font-bold text-white">{stats.stakerCount.toLocaleString()}</p>
          </div>
        </div>

        {connected && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6 text-white">Your Stake</h3>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-gray-400">Staked Amount</p>
                  <p className="text-2xl font-bold text-white">{(userStake / 1_000_000).toLocaleString()} PUDL</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-gray-400">Your Tier</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">Tier {userTier}</span>
                    <span className="text-sm bg-pudl-green text-black px-3 py-1 rounded-lg font-semibold">
                      {getTierBenefits(userTier).discount}
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-gray-400">Pending Rewards</p>
                  <p className="text-2xl font-bold text-pudl-green">{pendingRewards.toFixed(2)} PUDL</p>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={loading || pendingRewards === 0}
                  className="w-full bg-pudl-green text-black py-4 rounded-xl font-semibold hover:bg-pudl-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Claim Rewards'}
                </button>
              </div>
            </div>

            <div className="card rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-6 text-white">Stake / Unstake</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">Stake Amount</label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pudl-green text-white font-semibold text-lg outline-none"
                  />
                  <button
                    onClick={handleStake}
                    disabled={loading || !stakeAmount}
                    className="w-full mt-3 bg-pudl-green text-black py-4 rounded-xl font-semibold hover:bg-pudl-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Stake'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">Unstake Amount</label>
                  <input
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pudl-green text-white font-semibold text-lg outline-none"
                  />
                  <button
                    onClick={handleUnstake}
                    disabled={loading || !unstakeAmount}
                    className="w-full mt-3 bg-white/10 border border-white/10 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    {loading ? 'Processing...' : 'Unstake'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-white">Staking Tiers</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((tier) => {
              const benefits = getTierBenefits(tier)
              const isCurrentTier = connected && tier === userTier
              return (
                <div
                  key={tier}
                  className={`p-6 rounded-xl border transition-all ${
                    isCurrentTier
                      ? 'border-pudl-green bg-pudl-green/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-xl font-bold mb-3 text-white">Tier {tier}</div>
                  <div className="text-sm text-gray-400 mb-3">{benefits.requirement}</div>
                  <div className={`text-sm font-semibold ${isCurrentTier ? 'text-pudl-green' : 'text-gray-300'}`}>
                    Fee Discount: {benefits.discount}
                  </div>
                  {isCurrentTier && (
                    <div className="mt-3 text-xs bg-pudl-green text-black px-2 py-1 rounded inline-block font-semibold">
                      ACTIVE
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
