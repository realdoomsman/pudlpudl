'use client';

import { motion } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { getAllTokenBalances } from '@/lib/solana';
import { TOKEN_MINTS } from '@/lib/api';

export default function PortfolioDashboard() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalances();
    }
  }, [connected, publicKey]);

  const fetchBalances = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      const allBalances = await getAllTokenBalances(publicKey.toString());
      setBalances(allBalances);
      
      // Fetch real prices from Jupiter
      const { getTokenPrices, TOKEN_MINTS } = await import('@/lib/api');
      const tokenAddresses = Object.keys(allBalances).map(symbol => TOKEN_MINTS[symbol]).filter(Boolean);
      const prices = await getTokenPrices(tokenAddresses);
      
      // Calculate total value with real prices
      const total = Object.entries(allBalances).reduce((sum, [token, amount]) => {
        const mintAddress = TOKEN_MINTS[token];
        const price = mintAddress ? prices[mintAddress] || 0 : 0;
        return sum + (amount * price);
      }, 0);
      
      setTotalValue(total);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">👛</div>
        <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400 mb-6">View your portfolio and track your assets</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-gray-400 mt-4">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Value */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8"
      >
        <div className="text-sm text-gray-400 mb-2">Total Portfolio Value</div>
        <div className="text-5xl font-bold text-white mb-4">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-2 text-green-400">
          <span>↑ 12.5%</span>
          <span className="text-gray-500">Last 24h</span>
        </div>
      </motion.div>

      {/* Token Balances */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">Your Assets</h3>
        </div>
        <div className="divide-y divide-white/5">
          {Object.entries(balances).map(([token, amount], i) => (
            <motion.div
              key={token}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {token[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{token}</div>
                    <div className="text-sm text-gray-400">{amount.toFixed(4)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">
                    ${(amount * (token === 'SOL' ? 100 : token === 'USDC' ? 1 : 0.5)).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {((amount * (token === 'SOL' ? 100 : token === 'USDC' ? 1 : 0.5)) / totalValue * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <a
          href="/swap"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl p-6 text-center transition-all shadow-lg shadow-blue-500/20"
        >
          <div className="text-3xl mb-2">⇄</div>
          <div className="font-semibold text-white">Swap Tokens</div>
        </a>
        <a
          href="/pools"
          className="bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-6 text-center transition-colors"
        >
          <div className="text-3xl mb-2">💧</div>
          <div className="font-semibold text-white">Add Liquidity</div>
        </a>
      </div>
    </div>
  );
}
