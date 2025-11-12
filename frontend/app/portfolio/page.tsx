'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

export default function PortfolioPage() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions'>('portfolio');

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">PUDL</Link>
          <div className="flex items-center gap-8">
            <Link href="/pools" className="text-sm text-gray-400 hover:text-white transition-colors">Pools</Link>
            <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">Swap</Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">Stake</Link>
            <Link href="/referrals" className="text-sm text-gray-400 hover:text-white transition-colors">Referrals</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-lg font-semibold">Multi-Chain Portfolio</h2>
            <div className="text-3xl font-bold mt-2">$0.00</div>
          </div>

          <div className="border-b border-white/10">
            <div className="flex">
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'portfolio'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Transactions
              </button>
            </div>
          </div>

          <div className="p-6">
            {!connected ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">No Addresses Configured</div>
                <p className="text-sm text-gray-500 mb-6">
                  Connect your wallet to track your portfolio
                </p>
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                  Connect Wallet
                </button>
              </div>
            ) : activeTab === 'portfolio' ? (
              <PortfolioContent address={publicKey?.toString()} />
            ) : (
              <TransactionsContent address={publicKey?.toString()} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioContent({ address }: { address?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full" />
          <div>
            <div className="text-sm font-medium">SOL</div>
            <div className="text-xs text-gray-400">Solana</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">0.00</div>
          <div className="text-xs text-gray-400">$0.00</div>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500 rounded-full" />
          <div>
            <div className="text-sm font-medium">PUDL</div>
            <div className="text-xs text-gray-400">PUDL Token</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">0.00</div>
          <div className="text-xs text-gray-400">$0.00</div>
        </div>
      </div>
    </div>
  );
}

function TransactionsContent({ address }: { address?: string }) {
  return (
    <div className="space-y-3">
      <div className="text-center py-8 text-gray-400 text-sm">
        No transactions yet
      </div>
    </div>
  );
}
