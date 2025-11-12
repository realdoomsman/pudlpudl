'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useState, useEffect } from 'react';

interface PriceChartProps {
  tokenPair: string;
}

export default function PriceChart({ tokenPair }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [data, setData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    fetchRealData();
  }, [timeframe, mounted]);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      
      // Fetch real historical data from CoinGecko
      const { getHistoricalPrices, TOKEN_MINTS } = await import('@/lib/api');
      const tokenAddress = TOKEN_MINTS.SOL;
      
      const historicalData = await getHistoricalPrices(tokenAddress, timeframe);
      
      if (historicalData.length > 0) {
        setData(historicalData);
      } else {
        // If API fails, show message instead of fake data
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 h-[400px] flex items-center justify-center">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{tokenPair}</h3>
          <div className="text-2xl font-bold text-white">
            {loading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `$${data[data.length - 1]?.price.toFixed(2) || '0.00'}`
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {(['1H', '24H', '7D', '30D'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          {loading ? 'Loading chart data...' : 'Unable to load chart data'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
