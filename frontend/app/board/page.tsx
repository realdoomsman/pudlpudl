'use client'

import { useEffect, useState } from 'react'
import { Nav } from '@/components/Nav'
import { pudl, type LeaderRow } from '@/lib/pudl'
import { fmtSol } from '@/lib/rivers'

export default function BoardPage() {
  const [rows, setRows] = useState<LeaderRow[] | null>(null)

  useEffect(() => {
    pudl.leaderboard().then((r) => setRows(r.rows)).catch(() => setRows([]))
  }, [])

  return (
    <div className="min-h-screen text-white">
      <Nav />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-2">Season 1</div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">The House.</h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            The sharpest net-casters, ranked by everything they&rsquo;ve collected. Their placements
            become the meta. Climb it.
          </p>
        </div>

        {!rows ? (
          <div className="py-20 text-center text-gray-500 animate-pulse">Counting the take…</div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            No nets cast yet. Be the first house on the board.
          </div>
        ) : (
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div
                key={r.sub}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                  i === 0 ? 'border-acid/40 bg-acid/[0.09]' : 'border-white/5 bg-deep/50'
                }`}
              >
                <div className={`w-6 text-center font-mono font-bold ${i < 3 ? "text-acid" : 'text-gray-600'}`}>
                  {i + 1}
                </div>
                {r.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.picture} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{r.name}</div>
                  <div className="text-[11px] text-gray-500">
                    {r.casts} casts · {r.pools} rivers
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold" style={{ color: '#e8ff1e' }}>
                    {fmtSol(r.earnedSol)}
                  </div>
                  <div className="text-[10px] text-gray-600">collected</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
