'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  type: 'swap' | 'add' | 'remove';
  from: string;
  to: string;
  amount: string;
  time: string;
  signature: string;
}

export default function LiveTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Simulate live transactions
    const interval = setInterval(() => {
      const newTx: Transaction = {
        id: Math.random().toString(36),
        type: ['swap', 'add', 'remove'][Math.floor(Math.random() * 3)] as any,
        from: ['SOL', 'USDC', 'PUDL', 'BONK'][Math.floor(Math.random() * 4)],
        to: ['SOL', 'USDC', 'PUDL', 'BONK'][Math.floor(Math.random() * 4)],
        amount: (Math.random() * 1000).toFixed(2),
        time: 'Just now',
        signature: Math.random().toString(36).substring(2, 10),
      };

      setTransactions(prev => [newTx, ...prev].slice(0, 10));
    }, 3000);

    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Live Transactions</h3>
        <div className="text-center py-8 text-gray-400">Loading...</div>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'swap': return 'text-blue-400';
      case 'add': return 'text-green-400';
      case 'remove': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'swap': return '⇄';
      case 'add': return '+';
      case 'remove': return '-';
      default: return '•';
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Live Transactions
      </h3>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${getTypeColor(tx.type)}`}>
                    {getTypeIcon(tx.type)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {tx.amount} {tx.from} → {tx.to}
                    </div>
                    <div className="text-xs text-gray-400">
                      {tx.time} • {tx.signature}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://solscan.io/tx/${tx.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  View →
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
