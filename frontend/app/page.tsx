'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function Home() {
  const { connected } = useWallet()
  const [copied, setCopied] = useState(false)

  const contractAddress = "PUDLxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Placeholder

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contractAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[#0a0e27]">
        <div className="absolute top-20 left-10 w-[600px] h-[600px] bg-pudl-aqua/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-pudl-purple/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pudl-aqua/5 rounded-full blur-[100px] animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex justify-between items-center p-6 glass mx-4 mt-4 rounded-2xl border border-white/10">
          <a href="/" className="text-3xl font-black pudl-gradient-text glow-text tracking-tight">
            PUDL
          </a>
          <div className="flex gap-6 items-center">
            <NavLink href="/pools">Pools</NavLink>
            <NavLink href="/swap">Swap</NavLink>
            <NavLink href="/stake">Stake</NavLink>
            <NavLink href="/create">Create</NavLink>
            <WalletMultiButton className="!bg-gradient-to-r !from-pudl-aqua !to-pudl-purple !rounded-xl !font-bold !px-6 hover:scale-105 transition-transform" />
          </div>
        </nav>

        {/* Hero */}
        <section className="text-center py-24 px-4">
          <div className="inline-block mb-6 px-6 py-2 glass rounded-full border border-pudl-aqua/30">
            <span className="text-pudl-aqua font-bold text-sm tracking-wide">LIVE ON SOLANA</span>
          </div>
          <h1 className="text-7xl md:text-[120px] font-black mb-6 pudl-gradient-text glow-text leading-none tracking-tighter">
            DEEP LIQUIDITY<br/>
            <span className="text-white">MEME SPEED</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Permissionless DLMM pools on Solana. Create, trade, and earn with concentrated liquidity powered by $PUDL.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/create" className="pudl-gradient px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all glow-box shadow-2xl">
              Launch Pool
            </a>
            <a href="/swap" className="glass px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all border border-white/20">
              Start Trading
            </a>
          </div>
        </section>

        {/* Token Info */}
        <section className="max-w-4xl mx-auto px-4 mb-20">
          <div className="glass rounded-2xl p-8 border border-white/10 glow-box">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black pudl-gradient-text">$PUDL Token</h2>
              <div className="flex gap-3">
                <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer" className="glass px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors border border-white/10">
                  Chart
                </a>
                <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" className="pudl-gradient px-4 py-2 rounded-lg text-sm font-semibold hover:scale-105 transition-transform">
                  Buy
                </a>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <p className="text-sm text-gray-400 mb-2 font-semibold">Contract Address</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-white font-mono text-sm bg-black/30 px-4 py-3 rounded-lg border border-white/10">
                  {contractAddress}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="glass px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all border border-white/10 min-w-[100px]"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-7xl mx-auto px-4 mb-20">
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard label="Total Value Locked" value="$0.00" />
            <StatCard label="24h Volume" value="$0.00" />
            <StatCard label="Active Pools" value="0" />
            <StatCard label="Total Stakers" value="0" />
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4 pudl-gradient-text">Protocol Features</h2>
            <p className="text-gray-400 text-lg">Everything you need for permissionless liquidity</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="Create Pools"
              description="Bond 1,000 $PUDL to deploy custom DLMM pools with your chosen parameters. Earn fees from every trade executed in your pool."
              href="/create"
            />
            <FeatureCard
              title="Concentrated Liquidity"
              description="Provide liquidity in specific price ranges using DLMM bins. Maximize capital efficiency and earn higher yields."
              href="/pools"
            />
            <FeatureCard
              title="Stake & Earn"
              description="Stake $PUDL to earn protocol revenue. Unlock tier-based fee discounts and participate in governance decisions."
              href="/stake"
            />
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-4 mb-20">
          <div className="glass rounded-2xl p-12 border border-white/10">
            <h2 className="text-4xl font-black mb-12 text-center pudl-gradient-text">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Step
                number="01"
                title="Bond $PUDL"
                description="Lock 1,000 $PUDL tokens to create your pool. Your bond is returned when you close the pool."
              />
              <Step
                number="02"
                title="Provide Liquidity"
                description="Add tokens to your pool across price bins. Earn fees from swaps that occur in your ranges."
              />
              <Step
                number="03"
                title="Earn Revenue"
                description="Collect trading fees and stake $PUDL to earn from protocol revenue. Higher tiers unlock better rates."
              />
            </div>
          </div>
        </section>

        {connected && (
          <section className="max-w-7xl mx-auto px-4 mb-20">
            <div className="glass rounded-2xl p-8 glow-box border border-white/10">
              <h3 className="text-3xl font-black mb-6 pudl-gradient-text">Your Dashboard</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <DashStat label="Your Pools" value="0" />
                <DashStat label="Staked $PUDL" value="0" />
                <DashStat label="Earned Fees" value="$0.00" />
                <DashStat label="Current APR" value="10.5%" highlight />
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/10 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-black pudl-gradient-text mb-2">PUDL</p>
                <p className="text-gray-500 text-sm">Permissionless liquidity on Solana</p>
              </div>
              <div className="flex gap-6">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pudl-aqua transition-colors">
                  Twitter
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pudl-aqua transition-colors">
                  Discord
                </a>
                <a href="https://docs.pudl.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pudl-aqua transition-colors">
                  Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-gray-300 hover:text-pudl-aqua font-semibold transition-colors text-sm">
      {children}
    </a>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-6 text-center hover:scale-105 transition-transform border border-white/10">
      <p className="text-gray-400 text-sm mb-2 font-semibold">{label}</p>
      <p className="text-3xl font-black pudl-gradient-text">{value}</p>
    </div>
  )
}

function FeatureCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a href={href} className="glass rounded-2xl p-8 hover:scale-105 transition-all group border border-white/10 hover:border-pudl-aqua/30">
      <h3 className="text-2xl font-black mb-4 group-hover:pudl-gradient-text transition-all">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </a>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-block mb-4 w-16 h-16 rounded-full pudl-gradient flex items-center justify-center text-2xl font-black glow-box">
        {number}
      </div>
      <h3 className="text-xl font-black mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

function DashStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
      <p className="text-gray-400 text-sm mb-2 font-semibold">{label}</p>
      <p className={`text-2xl font-black ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
