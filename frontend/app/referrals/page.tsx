'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { Footer } from '@/components/Footer';

export default function ReferralsPage() {
  const { publicKey, connected } = useWallet();
  const [copied, setCopied] = useState(false);
  
  const referralCode = connected ? publicKey?.toString().slice(0, 8) : 'CONNECT';
  const referralLink = `https://pudlpudl.vercel.app?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">PUDL</Link>
          <div className="flex items-center gap-8">
            <Link href="/pools" className="text-sm text-gray-400 hover:text-white transition-colors">Pools</Link>
            <Link href="/swap" className="text-sm text-gray-400 hover:text-white transition-colors">Swap</Link>
            <Link href="/stake" className="text-sm text-gray-400 hover:text-white transition-colors">Stake</Link>
            <Link href="/portfolio" className="text-sm text-gray-400 hover:text-white transition-colors">Portfolio</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Referral Program</h1>

        <div className="grid gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold">Your Referral Link</h2>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="bg-black/40 rounded px-3 py-2 border border-white/5 mb-3">
                  <code className="text-xs text-gray-300 break-all">{referralLink}</code>
                </div>
                <button
                  onClick={copyLink}
                  disabled={!connected}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy Referral Link'}
                </button>
              </div>
              {!connected && (
                <p className="text-xs text-gray-400 text-center">
                  Connect your wallet to generate your referral link
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Total Referrals</div>
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Total Earned</div>
              <div className="text-2xl font-bold">$0.00</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Commission Rate</div>
              <div className="text-2xl font-bold">10%</div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold">How It Works</h2>
            </div>
            <div className="p-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">1.</span>
                  <div>
                    <div className="text-sm font-medium mb-1">Share Your Link</div>
                    <div className="text-xs text-gray-400">
                      Share your unique referral link with friends and community
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">2.</span>
                  <div>
                    <div className="text-sm font-medium mb-1">They Trade</div>
                    <div className="text-xs text-gray-400">
                      When they swap, stake, or provide liquidity on PUDL
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 mt-1">3.</span>
                  <div>
                    <div className="text-sm font-medium mb-1">You Earn</div>
                    <div className="text-xs text-gray-400">
                      Receive 10% of their trading fees as commission
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold">Recent Referrals</h2>
            </div>
            <div className="p-4">
              <div className="text-center py-8 text-gray-400 text-sm">
                No referrals yet. Start sharing your link!
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
