'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px]"
          style={{
            left: mousePosition.x - 250,
            top: mousePosition.y - 250,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl md:text-9xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              PUDL
            </h1>
            <p className="text-2xl md:text-4xl font-bold mb-4 text-gray-300">
              The Future of Concentrated Liquidity
            </p>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Revolutionary DLMM technology. Lightning-fast swaps. Unmatched capital efficiency.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <Link
              href="/"
              className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl text-xl font-bold transition-all shadow-2xl shadow-blue-500/50 hover:scale-105"
            >
              Launch App
            </Link>
            <a
              href="#tech"
              className="px-12 py-6 bg-white/5 border-2 border-white/20 hover:bg-white/10 rounded-2xl text-xl font-bold transition-all hover:scale-105"
            >
              See Technology
            </a>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">$165</div>
              <div className="text-sm text-gray-400">SOL Price</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-4xl font-bold text-purple-400 mb-2">&lt;0.1s</div>
              <div className="text-sm text-gray-400">Swap Speed</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-4xl font-bold text-pink-400 mb-2">0.25%</div>
              <div className="text-sm text-gray-400">Fees</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Technology Section */}
      <div id="tech" className="relative z-10 py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-5xl md:text-7xl font-black text-center mb-20 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            Revolutionary Technology
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: 'DLMM Architecture',
                desc: 'Discrete Liquidity Market Maker - the most advanced AMM design on Solana',
                features: ['Concentrated liquidity bins', 'Dynamic fee optimization', 'Zero impermanent loss zones']
              },
              {
                title: 'Lightning Speed',
                desc: 'Built on Solana for unmatched performance',
                features: ['Sub-second swaps', '65,000 TPS capable', 'Real-time price updates']
              },
              {
                title: 'Capital Efficient',
                desc: 'Get more from your liquidity',
                features: ['10x better capital efficiency', 'Customizable price ranges', 'Automated rebalancing']
              },
              {
                title: 'Secure & Audited',
                desc: 'Built with security first',
                features: ['Anchor framework', 'Open source', 'Battle-tested code']
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:border-blue-500/50 transition-all hover:scale-105"
              >
                <h3 className="text-3xl font-bold mb-4 text-white">{item.title}</h3>
                <p className="text-gray-400 mb-6">{item.desc}</p>
                <ul className="space-y-3">
                  {item.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-gray-300">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-16"
          >
            <h2 className="text-5xl font-black mb-6 text-white">
              Ready to Experience the Future?
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Join thousands of traders using the most advanced DEX on Solana
            </p>
            <Link
              href="/"
              className="inline-block px-16 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl text-2xl font-bold transition-all shadow-2xl shadow-blue-500/50 hover:scale-110"
            >
              Launch App Now
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
