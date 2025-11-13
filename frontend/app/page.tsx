'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import WalletButton from '@/components/WalletButton'
import ImprovedSwapWidget from '@/components/ImprovedSwapWidget'
import { PUDL_TOKEN_CA } from '@/lib/pudlToken'
import { StatsGrid } from '@/components/AnimatedStats'
import PriceChart from '@/components/PriceChart'
import LiveTransactions from '@/components/LiveTransactions'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            PUDL
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/pools" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pools
            </Link>
            <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">
              Swap
            </Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">
              Stake
            </Link>
            <Link href="/portfolio" className="text-sm text-gray-400 hover:text-white transition-colors">
              Portfolio
            </Link>
            <WalletButton />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
            <div className="px-6 py-4 space-y-4">
              <Link href="/pools" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Pools
              </Link>
              <Link href="/swap" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Swap
              </Link>
              <Link href="/stake" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Stake
              </Link>
              <Link href="/portfolio" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Portfolio
              </Link>
              <Link href="/referrals" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Referrals
              </Link>
              <div className="pt-4">
                <WalletButton />
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section with Particles */}
      <div className="relative min-h-screen flex items-center">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full backdrop-blur-xl">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-blue-300">Live on Solana Mainnet</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                    PUDL
                  </span>
                  <br />
                  <span className="text-white text-4xl md:text-5xl">Protocol</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
                  Revolutionary <span className="text-blue-400 font-bold">DLMM technology</span> meets lightning-fast swaps. 
                  The future of concentrated liquidity is here.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start">
                  <Link 
                    href="/swap" 
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-lg font-bold overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                  >
                    <span className="relative z-10">Start Trading →</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  <Link 
                    href="/portfolio" 
                    className="px-8 py-4 bg-white/5 border-2 border-white/20 hover:bg-white/10 rounded-xl text-lg font-bold transition-all hover:scale-105 backdrop-blur-xl"
                  >
                    View Portfolio
                  </Link>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Swap Speed', value: '<0.1s', color: 'blue' },
                    { label: 'Fees', value: '0.25%', color: 'purple' },
                    { label: 'Uptime', value: '99.9%', color: 'pink' }
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-4 hover:scale-105 transition-transform"
                    >
                      <div className={`text-2xl font-bold text-${stat.color}-400 mb-1`}>{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: Swap Widget */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
              <div className="relative">
                <ImprovedSwapWidget />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-8">
        <RealTimeStats />

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <PriceChart tokenPair="SOL/USDC" />
          <LiveTransactions />
        </div>

        <ContractAddress />

        {/* Features Section */}
        <div className="mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            Why Choose PUDL
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Lightning Fast',
                description: 'Sub-second swaps powered by Solana. No waiting, no delays.',
                metric: 'Under 0.1s execution'
              },
              {
                title: 'Best Prices',
                description: 'Smart routing finds you the optimal price across all liquidity sources.',
                metric: 'Always best rate'
              },
              {
                title: 'Battle Tested',
                description: 'Built with Anchor framework. Secure, audited, and production-ready.',
                metric: '100% secure'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30"
              >
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <div className="text-sm font-bold text-blue-400">{feature.metric}</div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              step="1"
              title="Connect Wallet"
              description="Connect your Solana wallet to get started with PUDL Protocol"
            />
            <StepCard
              step="2"
              title="Swap or Provide Liquidity"
              description="Trade tokens instantly or provide liquidity to earn fees"
            />
            <StepCard
              step="3"
              title="Earn Rewards"
              description="Stake PUDL tokens to earn protocol fees and governance rights"
            />
          </div>
        </div>

        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Explore Liquidity Pools</h2>
            <p className="text-gray-400 mb-6">
              Browse 10+ active pools with deep liquidity and competitive APRs. Provide liquidity to earn trading fees.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/pools" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-sm font-medium text-white transition-all shadow-lg shadow-blue-500/20">
                View All Pools
              </Link>
              <Link href="/swap" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium text-white transition-all">
                Start Trading
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <TechCard
            title="DLMM Architecture"
            items={[
              "Discrete liquidity bins",
              "Dynamic fee tiers",
              "Bin-based price discovery",
              "Composable liquidity positions"
            ]}
          />
          <TechCard
            title="Protocol Mechanics"
            items={[
              "1,000 PUDL bond per pool",
              "Tiered staking system (0-15 bps)",
              "Fee sharing for stakers",
              "Permissionless pool creation"
            ]}
          />
        </div>
      </div>

      <footer className="border-t border-white/10 mt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <div className="text-base font-bold text-white mb-3">PUDL</div>
              <p className="text-xs text-gray-500 mb-4">Concentrated liquidity AMM on Solana</p>
              <div className="flex gap-3">
                <a 
                  href="https://x.com/PUDLfun" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a 
                  href="https://github.com/realdoomsman/pudlpudl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-3">Protocol</div>
              <div className="space-y-2">
                <a href="/pools" className="block text-xs text-gray-500 hover:text-white transition-colors">Pools</a>
                <a href="/swap" className="block text-xs text-gray-500 hover:text-white transition-colors">Swap</a>
                <a href="/stake" className="block text-xs text-gray-500 hover:text-white transition-colors">Stake</a>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-3">Developers</div>
              <div className="space-y-2">
                <a href="https://github.com/realdoomsman/pudlpudl" target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-500 hover:text-white transition-colors">GitHub</a>
                <Link href="/create" className="block text-xs text-gray-500 hover:text-white transition-colors">Create Pool</Link>
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white mb-3">Community</div>
              <div className="space-y-2">
                <a href="https://x.com/PUDLfun" target="_blank" rel="noopener noreferrer" className="block text-xs text-gray-500 hover:text-white transition-colors">Twitter</a>
                <Link href="/referrals" className="block text-xs text-gray-500 hover:text-white transition-colors">Referrals</Link>
                <Link href="/portfolio" className="block text-xs text-gray-500 hover:text-white transition-colors">Portfolio</Link>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-gray-500">© 2024 PUDL Protocol. All rights reserved.</div>
            <div className="flex gap-4 text-xs">
              <a href="https://x.com/PUDLfun" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Follow us on X</a>
              <a href="https://github.com/realdoomsman/pudlpudl" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">View on GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ContractAddress() {
  const [copied, setCopied] = useState(false)

  const copyCA = () => {
    navigator.clipboard.writeText(PUDL_TOKEN_CA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="relative group mb-12"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
      <div className="relative bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
                P
              </div>
              <div>
                <div className="text-lg font-bold text-white">PUDL Token</div>
                <div className="text-xs text-gray-400">Official Contract Address</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Verified</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Contract Address</div>
            <div className="bg-black/60 rounded-xl px-4 py-4 border border-white/10 hover:border-blue-500/50 transition-colors">
              <code className="text-sm text-blue-400 break-all font-mono">{PUDL_TOKEN_CA}</code>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyCA}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 hover:scale-105"
            >
              {copied ? '✓ Copied!' : 'Copy Address'}
            </button>
            <a
              href={`https://solscan.io/token/${PUDL_TOKEN_CA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all text-center hover:scale-105"
            >
              View on Solscan →
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300">
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}

function RealTimeStats() {
  const [stats, setStats] = useState({
    tvl: 0,
    volume: 0,
    pools: 0,
    users: 0
  });

  useState(() => {
    // Fetch real stats
    const fetchStats = async () => {
      try {
        const { getProtocolStats } = await import('@/lib/api');
        const data = await getProtocolStats();
        setStats({
          tvl: data.tvl,
          volume: data.volume24h,
          pools: data.pools,
          users: data.users
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  });

  return (
    <StatsGrid
      stats={[
        { label: 'Total Value Locked', value: stats.tvl.toLocaleString(), change: 0 },
        { label: 'Total Volume', value: stats.volume.toLocaleString(), change: 0 },
        { label: 'Active Pools', value: stats.pools.toString(), prefix: '', change: 0 },
        { label: 'Total Users', value: stats.users.toString(), prefix: '', change: 0 },
      ]}
    />
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="relative bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300">
      <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 mt-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  )
}

function TechCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="group bg-white/5 border border-white/10 rounded-lg p-5 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full group-hover:animate-pulse" />
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-400 flex items-start group-hover:text-gray-300 transition-colors">
            <span className="text-blue-500 mr-2">→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
