'use client';

import Link from 'next/link';
import WalletButton from '@/components/WalletButton';
import PortfolioDashboard from '@/components/PortfolioDashboard';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">PUDL</Link>
          <div className="flex items-center gap-8">
            <Link href="/pools" className="text-sm text-gray-400 hover:text-white transition-colors">Pools</Link>
            <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">Swap</Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">Stake</Link>
            <Link href="/portfolio" className="text-sm text-white font-medium">Portfolio</Link>
            <Link href="/referrals" className="text-sm text-gray-400 hover:text-white transition-colors">Referrals</Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">Track your assets and performance</p>
        </div>

        <PortfolioDashboard />
      </div>
    </div>
  );
}
