'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StatProps {
  label: string;
  value: string;
  change?: number;
  prefix?: string;
  delay?: number;
}

export function AnimatedStat({ label, value, change, prefix = '$', delay = 0 }: StatProps) {
  const [displayValue, setDisplayValue] = useState('0');
  
  useEffect(() => {
    const numericValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }
    
    let current = 0;
    const increment = numericValue / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue.toLocaleString());
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current).toLocaleString());
      }
    }, 20);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
    >
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-bold text-white mb-1">
        {prefix}{displayValue}
      </div>
      {change !== undefined && (
        <div className={`text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </motion.div>
  );
}

export function StatsGrid({ stats }: { stats: StatProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <AnimatedStat key={stat.label} {...stat} delay={i * 0.1} />
      ))}
    </div>
  );
}
