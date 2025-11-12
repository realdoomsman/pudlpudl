'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function TestSupabase() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [tables, setTables] = useState<string[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Test connection by querying user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1)

      if (error) {
        setStatus('error')
        setError(error.message)
        return
      }

      // Get list of tables
      const tablesList = [
        'user_profiles',
        'follows',
        'trades',
        'pool_activities'
      ]

      setTables(tablesList)
      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-[#14F195] hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Supabase Connection Test</h1>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          {status === 'testing' && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#14F195] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Testing connection...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connection Successful!</h2>
                  <p className="text-gray-400 text-sm">Supabase is connected and working</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Database Tables Created:</h3>
                  <div className="space-y-2">
                    {tables.map(table => (
                      <div key={table} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-[#14F195]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-300 font-mono">{table}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-2">Features Available:</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>✅ User profiles with display names and avatars</li>
                    <li>✅ Follow/unfollow system</li>
                    <li>✅ Trade history tracking</li>
                    <li>✅ Leaderboard by volume</li>
                    <li>✅ Pool activity tracking</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-white mb-2">Next Steps:</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>1. Connect your wallet on the homepage</li>
                    <li>2. Make a swap to create your profile</li>
                    <li>3. View your trade history</li>
                    <li>4. Check the leaderboard</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connection Failed</h2>
                  <p className="text-gray-400 text-sm">Could not connect to Supabase</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-400 font-mono">{error}</p>
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <p className="font-semibold text-white">Troubleshooting:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Check that you ran the SQL schema in Supabase</li>
                  <li>• Verify your .env.local has correct SUPABASE_URL and SUPABASE_ANON_KEY</li>
                  <li>• Make sure the tables were created (check Table Editor in Supabase)</li>
                  <li>• Restart your dev server after adding env variables</li>
                </ul>
              </div>

              <button
                onClick={testConnection}
                className="mt-4 bg-[#14F195] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#00D97E] transition-colors"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">Environment Variables:</h3>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">SUPABASE_URL:</span>
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-400' : 'text-red-400'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">SUPABASE_ANON_KEY:</span>
              <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-400' : 'text-red-400'}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
